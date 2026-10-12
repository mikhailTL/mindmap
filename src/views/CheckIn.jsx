import React from 'react'
import { ScrollRow } from '../ui/motion'

import { Headline, AllDetail } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { ArrowRight } from '../ui/marks'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Progress } from '../ui/progress'
import { Scale } from '../ui/radio-scale'
import { DemoNotice, RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { Diverge } from '../charts/diverge'
import { ITEMS, score, sentence, connectPatch } from '../lib/engine'
import { PhoneCheck } from './PhoneCheck'
import { BackBar, Stage, StageStyles } from './reading/stage'
import { takeReadingIntent } from './reading/intent'
import { SCORE, SCORE_RANGE } from '../lib/terms'
import { cn } from '../lib/utils'

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
 * views/WithoutPatch.jsx.
 *
 * What changed in this pass, and why:
 *   - The chooser opened with a three line paragraph set straight on the app's
 *     tint, which is the one thing section 2 of the spec rules out, and the
 *     shell above already carries the screen's one line. It is gone rather
 *     than boxed: a second lede would have said the same thing twice.
 *   - The sensor card carried a six line paragraph. Every card now states one
 *     line and then a four row spec table, so the three cards hold more true
 *     detail in less height and reach the same depth. That table is what fills
 *     the foot of "Connect a patch", which was about 150px of blank card.
 *   - Padding and gaps follow the spec's instrument-panel rhythm rather than
 *     the portfolio one: gap-3, lg:gap-4, and no mt-10 between neighbours.
 */

const PANEL = 'rounded-panel border border-rule bg-card'

/* One line per screen, then the figures it is worth knowing before starting.
   Every figure here is already true elsewhere in this repo: PPG_SECONDS plus
   VOICE_SECONDS is 45, ITEMS has six questions, and the scale is the site's
   one scale. Nothing may be added that is not measured somewhere. */
const SCREENS = {
  sensors: {
    title: 'Use your phone’s camera and microphone',
    lede: `The same ${SCORE}, measured rather than answered.`,
    facts: [['45', 'seconds of capture'], [SCORE_RANGE, SCORE], ['0', 'frames or audio kept']],
  },
  survey: {
    title: 'Answer six questions',
    lede: 'No patch and no camera. Six scales, then one number.',
    facts: [[String(ITEMS.length), 'scales to fill in'], [SCORE_RANGE, SCORE],
      ['0', 'answers that leave this phone']],
  },
}

/* The three ways in, each one the same four facts in the same order, so a
   reader comparing them is reading one table three times rather than three
   different cards. `gives` is what comes back, which is the line the draft did
   not have and the reason the patch card ran out of content a third of the way
   down. */
const WAYS = [
  { id:'sensors', title:'Use the phone’s sensors', opens:true,
    line:'A fingertip over the rear lens, then one sentence out loud.',
    cta:'Start the sensor reading',
    spec:[
      ['Takes', '45 seconds'],
      ['Reads', 'Heart rate and beat-to-beat variation'],
      ['Also', 'Pitch and steadiness of one spoken line'],
      ['Needs', 'A camera and a microphone'],
    ],
    foot:'Frames and audio are turned into numbers here and dropped. Neither is stored or sent.' },
  { id:'survey', title:'Answer six questions', opens:true,
    line:'Six scales, no camera and no patch.',
    cta:'Open the six questions',
    spec:[
      ['Takes', 'About 30 seconds'],
      ['Reads', 'Tension, sleep, energy, focus and load'],
      ['Also', 'Which answer moved the number, and which way'],
      ['Needs', 'Nothing but this phone'],
    ],
    foot:'Your answers stay on this device. Nothing is stored or sent.' },
  { id:'patch', title:'Connect a patch', opens:false,
    line:'A paired patch, reading four signals at once.',
    cta:'Connect a patch',
    spec:[
      ['Takes', 'One pairing, then nothing'],
      ['Reads', 'Pulse, sweat, temperature and movement'],
      ['Rate', '1 Hz over Bluetooth'],
      ['Needs', 'A MindMap patch'],
    ] },
]

/* Figures as a chip row inside the panel rather than as a row of cells.
   Spec 2 allows a card to hold a row of chips, and at 390 three cells stacked
   into three rows of their own cost this block about 140px of height for the
   same three numbers. Label beside the figure, never under it. */
function Figures({ items, className }) {
  return (
    <ul className={cn('m-0 flex list-none flex-wrap gap-1.5 p-0', className)}>
      {items.map(([value, label]) => (
        <li key={label} className="inline-flex items-baseline gap-1.5 rounded-chip border
          border-rule bg-paper px-2.5 py-1">
          <span className="font-mono text-ui font-bold tabular-nums leading-none text-accent">
            {value}
          </span>
          <span className="text-fine leading-none text-ink-2">{label}</span>
        </li>
      ))}
    </ul>
  )
}

/* Spans, not a definition list: a button's content model is phrasing, and a
   `dl` inside one is neither valid nor reliably read out. The label column is
   fixed so the four values line up down the card and across the three. */
function Spec({ rows }) {
  return (
    <span className="mt-3 block">
      {rows.map(([k, v]) => (
        <span key={k} className="flex items-baseline gap-3 border-t border-rule py-1.5">
          <span className="tick w-[3.6rem] shrink-0">{k}</span>
          <span className="min-w-0 flex-1 text-fine leading-[1.45] text-ink-2">{v}</span>
        </span>
      ))}
    </span>
  )
}

/* A way in. The card is the control, not a caption above one: Card's
   `interactive` carries the accent left rule, the press squeeze and the
   focus-visible rule, the site's one focus outline comes from input.css, and
   the whole card is the hit area. Title and footnote are spans, for the same
   reason Spec is. */
const Way = React.forwardRef(function Way({ way, onOpen, children }, ref) {
  return (
    <Card interactive as="button" type="button" ref={ref} onClick={onOpen}
      className="group flex h-full flex-col p-4 lg:p-5">
      <span className="block font-display text-row font-bold leading-tight text-ink">{way.title}</span>
      <span className="mt-1 block max-w-[38ch] text-meta leading-[1.4] text-ink-2">{way.line}</span>
      <Spec rows={way.spec}/>
      {children}
      <span className="mt-auto flex items-center gap-2 pt-3 font-display text-meta
        font-bold text-accent">
        {way.cta}
        <ArrowRight aria-hidden className="size-[1.05rem] transition-transform
          duration-200 groupHoverOnly:translate-x-1.5"/>
      </span>
      <span className="mt-1.5 block max-w-[44ch] text-fine leading-[1.4] text-ink-3">{way.foot}</span>
    </Card>
  )
})

/* The top of a reading: the way out, then what this reading is. Module level,
   not an inner component; one declared in the body is a new type on every
   render and would remount the back button out from under a keyboard. */
const ReadingHead = React.forwardRef(function ReadingHead({ id, onBack }, ref) {
  const s = SCREENS[id]
  return (
    <>
      <BackBar onBack={onBack}>Back to the three ways</BackBar>
      <h2 ref={ref} tabIndex={-1}
        className="mt-2 max-w-[26ch] font-display font-bold text-ink">
        {s.title}
      </h2>
      {/* The lede and its figures are one container. On the app's tint neither
          may stand on its own. */}
      <div className={cn(PANEL, 'mt-3 p-3.5')}>
        <p className="text-meta leading-[1.4] text-ink-2">{s.lede}</p>
        <Figures items={s.facts} className="mt-2.5"/>
      </div>
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

  const [sensors, survey, patch] = WAYS

  return (
    <>
      <StageStyles/>
      <p aria-live="polite" className="sr-only text-sec">{said}</p>

      {screen === 'choose' && (
        <Stage dir={dir}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2 className="font-display font-bold text-ink">Take a reading now</h2>
            {/* This screen scores real answers in both modes, so the notice
                describes the surrounding screens rather than this one. Both
                variants are required: demo figures elsewhere are generated, and
                in real mode no patch is paired. */}
            {mode === 'real'
              ? <RealNotice inline>No patch is paired, and these six questions do not need one.</RealNotice>
              : <DemoNotice inline>Every other screen is generated. These six are not.</DemoNotice>}
          </div>

          <div className="mt-3 grid gap-3 lg:mt-4 lg:auto-rows-fr lg:grid-cols-3 lg:gap-4">
            <ScrollRow index={0} className="h-full">
              <Way ref={el => { cards.current.sensors = el }} way={sensors}
                onOpen={() => open('sensors')}/>
            </ScrollRow>
            <ScrollRow index={1} className="h-full">
              <Way ref={el => { cards.current.survey = el }} way={survey}
                onOpen={() => open('survey')}>
                <span className="mt-3 block border-t border-rule pt-2.5">
                  <span className="block font-mono text-fine tabular-nums text-ink-3">
                    {answered} of {ITEMS.length} answered
                  </span>
                  {/* aria-hidden: the line above already says the figure, and a
                      progressbar inside a button joins its accessible name. */}
                  <span aria-hidden className="mt-2 block">
                    <Progress value={answered} max={ITEMS.length}/>
                  </span>
                </span>
              </Way>
            </ScrollRow>
            {/* Pairing happens here rather than on a screen of its own: it is a
                device handshake, not a reading to sit through, so this card is
                a panel with a control in it and not a card-sized button. */}
            <ScrollRow index={2} className="h-full">
              <section className={cn(PANEL, 'flex h-full flex-col p-4 lg:p-5')}>
                <h3 className="font-display text-row font-bold leading-tight text-ink">
                  {patch.title}
                </h3>
                <p className="mt-1 max-w-[38ch] text-meta leading-[1.4] text-ink-2">{patch.line}</p>
                <Spec rows={patch.spec}/>
                <div className="mt-auto pt-3">
                  <Button variant="outline" size="sm" onClick={pairUp} disabled={busy}>
                    {busy ? 'Connecting…' : patch.cta}
                  </Button>
                </div>
                <p aria-live="polite"
                  className="mt-1.5 min-h-[2.8em] max-w-[44ch] text-fine leading-[1.4] text-ink-3">
                  {pair?.msg || (mode === 'real'
                    ? 'Nothing is paired to this account, so the dashboard has no reading to show yet.'
                    : 'Nothing is paired yet. The other two ways need no patch.')}
                </p>
              </section>
            </ScrollRow>
          </div>
        </Stage>
      )}

      {screen === 'sensors' && (
        <Stage dir={dir}>
          <ReadingHead id="sensors" ref={head} onBack={leave}/>
          {/* PhoneCheck carries the step-by-step guide and its drawings, which
              is why they are here and not on the chooser: this is the screen
              somebody is holding the phone on. */}
          <div className="mt-3 lg:mt-4"><PhoneCheck/></div>
        </Stage>
      )}

      {screen === 'survey' && (
        <Stage dir={dir}>
          <ReadingHead id="survey" ref={head} onBack={leave}/>
          <div className="mt-3 lg:mt-4 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]
            xl:items-start xl:gap-4">
            {/* Scale sets its own vertical rhythm and no horizontal padding,
                so the panel supplies the gutter and tightens the row height
                from 24px of air to 16px. Six rows at the old figure ran the
                form 96px past the result card beside it. */}
            <div className={cn(PANEL, 'px-4 lg:px-5 [&_fieldset]:py-4')}>
              {ITEMS.map((it,i)=>(
                <ScrollRow key={it.id} index={i}
                  className={i === ITEMS.length - 1 ? '[&_fieldset]:border-b-0' : undefined}>
                  <Scale legend={it.q} low={it.lo} high={it.hi}
                    value={ans[it.id]} onChange={v=>setAns(a=>({...a,[it.id]:v}))}/>
                </ScrollRow>
              ))}
            </div>

            {/* min-h reserves the result's space so completing the form does not
                shift the page. xl:top-[65px] = the app shell's 48px bar + 1px
                hairline + 16px air; it is not the 56px marketing header. */}
            <section ref={resultRef} aria-live="polite" data-anchor
              className={cn(PANEL, 'mt-3 min-h-[10rem] p-4 lg:p-5 xl:mt-0 xl:sticky xl:top-[65px]')}>
              {!done && (
                <p className="max-w-[40ch] text-meta text-ink-3">
                  Answer all six and your {SCORE} appears here, as a sentence first.
                </p>
              )}
              {done && (
                <>
                  <div className="flex flex-col items-start gap-4">
                    {/* RainbowDial takes raw hex, not tokens: #0a6e68 is accent,
                        #1d8fb0 is beam. Keep them in step with the palette. */}
                    <RainbowDial score={r.score} size={268}
                      rings={[{ id:'self', name:'Your answers', color:'#0a6e68', glow:'#1d8fb0',
                                value:r.score, reading:'Six questions' }]}/>
                    <div className="w-full">
                      <Headline>{s.pre}<b className={`font-bold ${s.calm ? 'text-calm' : 'text-warn'}`}>{s.word}</b>{s.tail}</Headline>
                      <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-meta">
                        <dt className="text-ink-3">{SCORE}</dt>
                        <dd className="m-0 font-mono tabular-nums text-ink">{r.score} out of 100</dd>
                        <dt className="text-ink-3">Read from</dt>
                        <dd className="m-0 text-ink">{ITEMS.length} answers</dd>
                        <dt className="text-ink-3">Four rings</dt>
                        <dd className="m-0 text-ink">A patch fills heart, sweat, temperature and movement</dd>
                      </dl>
                    </div>
                  </div>
                  <AllDetail label={`See what moved your ${SCORE}`}>
                    <p className="mt-2 max-w-[52ch] text-meta text-ink-3">Right of the line raised the
                      {' '}{SCORE}, left of it lowered it.</p>
                    <Diverge items={r.contrib.map(c=>({ label:c.item.q.replace(/\?$/,''),
                      x: Math.max(-1, Math.min(1, c.raw)) }))}/>
                    <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-fine">
                      <dt className="text-ink-3">Each answer</dt>
                      <dd className="m-0 text-ink-2">Measured from its middle option, then weighted</dd>
                      <dt className="text-ink-3">The six together</dt>
                      <dd className="m-0 text-ink-2">Averaged, then turned into one number out of 100</dd>
                      <dt className="text-ink-3">A patch instead</dt>
                      <dd className="m-0 text-ink-2">Same last step, from heart rate, sweat, temperature
                        and movement, so both give one number on one scale</dd>
                    </dl>
                  </AllDetail>
                </>
              )}
            </section>
          </div>
        </Stage>
      )}
    </>
  )
}
