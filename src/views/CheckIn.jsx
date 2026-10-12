import React from 'react'
import { ScrollRow } from '../ui/motion'

import { Headline, AllDetail } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { ArrowRight } from '../ui/marks'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { Scale } from '../ui/radio-scale'
import { DemoNotice, RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { Diverge } from '../charts/diverge'
import { ITEMS, score, sentence, connectPatch } from '../lib/engine'
import { PhoneCheck } from './PhoneCheck'
import { BackBar, Stage, StageStyles } from './reading/stage'
import { takeReadingIntent } from './reading/intent'

/* Take a reading, in three states on one screen.
 *
 *   choose    the two ways in, each one a button, and the patch to pair
 *   sensors   the camera and microphone reading
 *   survey    the six questions and the result
 *
 * There is no route to add, so the states are local. Entering a reading
 * replaces the chooser rather than appending to it, which is what stops the
 * screen asking a reader to scroll for the thing a card just described.
 *
 * The step-by-step guide and its drawings belong to PhoneCheck, so they arrive
 * with the sensor reading and are never on the chooser. On the marketing page
 * there is no app around the guide, so it stays inline there; see
 * views/WithoutPatch.jsx. */

const SCREENS = {
  sensors: {
    title: 'Use your phone’s camera and microphone',
    lede: 'No patch, no questions. The same Mind Score, worked out from measurements instead of answers.',
  },
  survey: {
    title: 'Answer six questions',
    lede: 'No patch and no camera. Six scales, then one Mind Score and the sentence that goes with it.',
  },
}

function Route({ title, children, foot }){
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle as="h2" className="text-row">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
      {foot && <CardFooter className="mt-auto block pt-0">{foot}</CardFooter>}
    </Card>
  )
}

/* A way in. The card is the control, not a caption above one: Card's
   `interactive` carries the accent left rule, the press squeeze and the
   focus-visible rule, the site's one focus outline comes from input.css, and
   the whole card is the hit area. Title and footnote are spans — a button's
   content model is phrasing, and a heading inside it lands outside the
   document outline. */
const Way = React.forwardRef(function Way(
  { title, lede, cta, foot, onOpen, children }, ref) {
  return (
    <Card interactive as="button" type="button" ref={ref} onClick={onOpen}
      className="group flex h-full flex-col p-6">
      <span className="block font-display text-row font-bold leading-tight text-ink">{title}</span>
      <span className="mt-3 block max-w-[38ch] text-sec leading-[1.5] text-ink-2">{lede}</span>
      {children}
      <span className="mt-auto flex items-center gap-2 pt-5 font-display text-meta
        font-bold text-accent">
        {cta}
        <ArrowRight aria-hidden className="size-[1.1rem] transition-transform
          duration-200 groupHoverOnly:translate-x-1.5"/>
      </span>
      <span className="mt-4 block min-h-[3.2em] max-w-[44ch] text-meta text-ink-2">{foot}</span>
    </Card>
  )
})

/* The top of a reading: the way out, then what this reading is. Module level,
   not an inner component — one declared in the body is a new type on every
   render and would remount the back button out from under a keyboard. */
const ReadingHead = React.forwardRef(function ReadingHead({ id, onBack }, ref) {
  return (
    <>
      <BackBar onBack={onBack}>Back to the three ways</BackBar>
      <h2 ref={ref} tabIndex={-1}
        className="mt-4 max-w-[26ch] font-display font-bold text-head text-ink">
        {SCREENS[id].title}
      </h2>
      <p className="mt-3 max-w-[56ch] text-sec leading-[1.5] text-ink-2">{SCREENS[id].lede}</p>
    </>
  )
})

export function CheckInBody({ go }){
  const [mode] = useMode()
  const resultRef = React.useRef(null)
  const [ans,setAns] = React.useState({})
  const [pair,setPair] = React.useState(null)
  const [busy,setBusy] = React.useState(false)
  const done = Object.keys(ans).length === ITEMS.length
  const r = done ? score(ans) : null
  const s = r ? sentence(r) : null
  const answered = Object.keys(ans).length

  const [screen, setScreen] = React.useState('choose')
  const [dir, setDir] = React.useState(null)
  const [said, setSaid] = React.useState('')
  const cards = React.useRef({})
  const head = React.useRef(null)
  const from = React.useRef(null)
  const firstPaint = React.useRef(true)
  /* True while this screen owns a history entry it pushed on entering a
     reading, so leaving by the button or by Escape consumes that entry instead
     of leaving it behind for the next back press. */
  const pushed = React.useRef(false)

  const open = React.useCallback(id => {
    from.current = id
    setDir('fwd'); setScreen(id)
    setSaid(`${SCREENS[id].title}, showing now`)
    /* A pushed entry is what makes browser back mean "out of this reading"
       rather than "off this screen". */
    try {
      history.pushState({ reading: id }, '', location.hash || '#/check')
      pushed.current = true
    } catch { pushed.current = false }
  }, [])

  const leave = React.useCallback(() => {
    setDir('back'); setScreen('choose')
    setSaid('Three ways in, showing now')
    if (pushed.current) { pushed.current = false; history.back() }
  }, [])

  /* Escape and browser back both land on the chooser. Neither is listened for
     from the chooser itself, where Escape belongs to whatever is above it and
     back belongs to the route. */
  React.useEffect(() => {
    if (screen === 'choose') return
    const onKey = e => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (e.target?.closest?.('[role="dialog"]')) return
      e.preventDefault(); leave()
    }
    const onPop = () => { pushed.current = false; setDir('back'); setScreen('choose') }
    document.addEventListener('keydown', onKey)
    addEventListener('popstate', onPop)
    return () => {
      document.removeEventListener('keydown', onKey)
      removeEventListener('popstate', onPop)
    }
  }, [screen, leave])

  /* Changing state is a screen change, so it starts at the top and puts focus
     on the new screen. Returning puts focus back on the card that opened the
     reading; App's own popstate handler focuses #main on the frame after a
     back, so this waits two frames to land after it. */
  React.useEffect(() => {
    if (firstPaint.current) { firstPaint.current = false; return }
    window.scrollTo(0, 0)
    if (screen !== 'choose') { head.current?.focus({ preventScroll:true }); return }
    const id = from.current
    if (!id) return
    from.current = null
    let b = 0
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => cards.current[id]?.focus({ preventScroll:true }))
    })
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b) }
  }, [screen])

  /* A link that has to land on a reading rather than on the chooser. */
  React.useEffect(() => {
    const want = takeReadingIntent()
    if (want === 'sensors' || want === 'survey') open(want)
  }, [open])

  // Answering the last item scrolls to the result; 260ms lets the card mount
  // and the layout settle before scrollIntoView measures.
  React.useEffect(() => {
    if (screen !== 'survey' || !done || !resultRef.current) return
    const t = setTimeout(() => resultRef.current?.scrollIntoView({ block:'start' }), 260)
    return () => clearTimeout(t)
  }, [done, screen])

  async function pairUp(){
    setBusy(true); setPair({ ok:null, msg:'Choosing a device…' })
    setPair(await connectPatch()); setBusy(false)
  }

  return (
    <>
      <StageStyles/>
      <p aria-live="polite" className="sr-only text-sec">{said}</p>

      {screen === 'choose' && (
        <Stage dir={dir}>
          <div className="flex flex-wrap items-baseline gap-4">
            <h2 className="max-w-[18ch] font-display font-bold text-head text-ink">Take a reading now</h2>
            {/* This screen scores real answers in both modes, so the notice
                describes the surrounding screens rather than this one. Both
                variants are required: demo figures elsewhere are generated, and
                in real mode no patch is paired. */}
            {mode === 'real'
              ? <RealNotice inline>No patch is paired, and these six questions do not need one.</RealNotice>
              : <DemoNotice inline>Every other screen is generated. These six are not.</DemoNotice>}
          </div>
          <p className="mt-4 max-w-[52ch] text-body leading-[1.5] text-ink-2">Three ways in, one Mind Score.
            The phone's own camera and microphone, a paired patch, or six questions.
            Pick one and it opens on its own screen.</p>

          {/* Vertical scale: 10 within a section, 14 between sections, 20 between
              page regions. */}
          <div className="mt-10 grid gap-3.5 lg:grid-cols-3">
            <ScrollRow index={0} className="h-full">
              <Way ref={el => { cards.current.sensors = el }}
                onOpen={() => open('sensors')}
                title="Use the phone’s sensors"
                lede="Forty-five seconds. An index fingertip over the rear lens and flash gives heart
                  rate and beat-to-beat variation. One spoken sentence gives pitch and steadiness."
                cta="Start the sensor reading"
                foot="Frames and audio are turned into numbers here and dropped. Neither is stored or sent."/>
            </ScrollRow>
            <ScrollRow index={1} className="h-full">
              <Way ref={el => { cards.current.survey = el }}
                onOpen={() => open('survey')}
                title="Answer six questions"
                lede="No patch needed."
                cta="Open the six questions"
                foot="Your answers stay on this device. Nothing is stored or sent.">
                <div className="mt-5 min-h-[46px]">
                  <span className="block font-mono text-meta tabular-nums text-ink-3">
                    {answered} of {ITEMS.length} answered
                  </span>
                  {/* aria-hidden: the line above already says the figure, and a
                      progressbar inside a button joins its accessible name. */}
                  <div aria-hidden className="mt-3">
                    <Progress className="max-w-[22rem]" value={answered} max={ITEMS.length}/>
                  </div>
                </div>
              </Way>
            </ScrollRow>
            {/* Pairing happens here rather than on a screen of its own: it is a
                device handshake, not a reading to sit through. */}
            <ScrollRow index={2} className="h-full"><Route title="Connect a patch"
              foot={<p aria-live="polite" className="min-h-[3.2em] max-w-[44ch] text-meta text-ink-2">{pair?.msg}</p>}>
              <p className="max-w-[38ch] text-sec text-ink-2">Pairs over Bluetooth with a MindMap patch and streams at 1 Hz.
                {mode === 'real' && ' Nothing is paired to this account, so the dashboard has no reading to show yet.'}</p>
              <Button variant="outline" size="sm" className="mt-5" onClick={pairUp} disabled={busy}>
                {busy ? 'Connecting…' : 'Connect a patch'}
              </Button>
            </Route></ScrollRow>
          </div>
        </Stage>
      )}

      {screen === 'sensors' && (
        <Stage dir={dir}>
          <ReadingHead id="sensors" ref={head} onBack={leave}/>
          {/* PhoneCheck carries the step-by-step guide and its drawings, which
              is why they are here and not on the chooser: this is the screen
              somebody is holding the phone on. */}
          <div className="mt-6"><PhoneCheck/></div>
        </Stage>
      )}

      {screen === 'survey' && (
        <Stage dir={dir}>
          <ReadingHead id="survey" ref={head} onBack={leave}/>
          <div className="mt-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] xl:gap-14 2xl:gap-20 xl:items-start">
            <Card>
              <CardContent className="py-0">
                {ITEMS.map((it,i)=>(
                  <ScrollRow key={it.id} index={i}
                    className={i === ITEMS.length - 1 ? '[&_fieldset]:border-b-0' : undefined}>
                    <Scale legend={it.q} low={it.lo} high={it.hi}
                      value={ans[it.id]} onChange={v=>setAns(a=>({...a,[it.id]:v}))}/>
                  </ScrollRow>
                ))}
              </CardContent>
            </Card>

            {/* min-h reserves the result's space so completing the form does not
                shift the page. xl:top-[65px] = the app shell's 48px bar + 1px
                hairline + 16px air; it is not the 56px marketing header. */}
            <Card ref={resultRef} aria-live="polite" data-anchor
              className="mt-10 min-h-[12rem] xl:mt-0 xl:sticky xl:top-[65px]">
              <CardContent>
              {!done && (
                <p className="max-w-[40ch] text-sec text-ink-3">
                  Answer all six and your Mind Score appears here, as a sentence first.
                </p>
              )}
              {done && (
                <>
                  <div className="flex flex-col items-start gap-7">
                    {/* RainbowDial takes raw hex, not tokens: #0a6e68 is accent,
                        #1d8fb0 is beam. Keep them in step with the palette. */}
                    <RainbowDial score={r.score} size={288}
                      rings={[{ id:'self', name:'Your answers', color:'#0a6e68', glow:'#1d8fb0',
                                value:r.score, reading:'Six questions' }]}/>
                    <div>
                      <Headline>{s.pre}<b className={`font-bold ${s.calm ? 'text-calm' : 'text-warn'}`}>{s.word}</b>{s.tail}</Headline>
                      <p className="mt-4 max-w-[40ch] text-sec text-ink-3">A patch fills four rings: heart,
                        sweat, temperature and movement.</p>
                    </div>
                  </div>
                  <AllDetail label="See what moved your Mind Score">
                    <p className="mt-2 max-w-[52ch] text-sec text-ink-3">Right of the line raised the Mind
                      Score, left of it lowered it.</p>
                    <Diverge items={r.contrib.map(c=>({ label:c.item.q.replace(/\?$/,''),
                      x: Math.max(-1, Math.min(1, c.raw)) }))}/>
                    <p className="mt-6 max-w-[64ch] text-meta text-ink-2">Each answer is measured from its
                      middle option, weighted, averaged, and turned into a Mind Score out of 100. The patch
                      does the same last step using heart rate, sweat, temperature and movement instead of
                      answers, so both give one number on one scale.</p>
                  </AllDetail>
                </>
              )}
              </CardContent>
            </Card>
          </div>
        </Stage>
      )}
    </>
  )
}
