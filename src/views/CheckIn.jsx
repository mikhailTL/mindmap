import React from 'react'
import { ScrollRow } from '../ui/motion'

import { Headline, AllDetail, SeeDetails, Why } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { ArrowRight, Camera, Link, Person, Stack } from '../ui/marks'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Progress } from '../ui/progress'
import { Scale } from '../ui/radio-scale'
import { PatchNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { Diverge } from '../charts/diverge'
import { ITEMS, score, sentence, connectPatch } from '../lib/engine'
import { PhoneCheck } from './PhoneCheck'
import { CameraModule, SignalCoverage } from '../charts/camera'
import { MentalMirror } from './MentalMirror'
import { FACE_SECONDS } from '../signals/face'
import { BackBar, Stage, StageStyles } from './reading/stage'
import { takeReadingIntent } from './reading/intent'
import { SeeTrends } from './student/charts'
import { addReading, updateReading } from '../lib/readingLog'
import { SCORE, SCORE_RANGE } from '../lib/terms'
import { cn } from '../lib/utils'

// Take a reading: the chooser, the sensor screens and the survey are three local states of one screen.
const PANEL = 'rounded-panel border border-rule/60 bg-card'

// PPG_SECONDS plus VOICE_SECONDS is 45; ITEMS (lib/engine.js) holds the survey questions.
const SCREENS = {
  sensors: {
    title: 'Camera and microphone',
    lede: `The phone measures your ${SCORE} instead of asking.`,
    facts: [['45', 'seconds of capture'], [SCORE_RANGE, SCORE], ['0', 'frames or audio kept']],
  },
  survey: {
    title: 'Survey',
    lede: 'Your answers become one number.',
    facts: [[String(ITEMS.length), 'scales to fill in'], [SCORE_RANGE, SCORE],
      ['1', 'score saved to your account']],
  },
  mirror: {
    title: 'Mental Mirror',
    lede: "Google's MediaPipe Face Landmarker maps 478 points on your face. Your pulse is read from skin colour.",
    facts: [[String(FACE_SECONDS), 'seconds of capture'], [SCORE_RANGE, SCORE], ['0', 'frames kept']],
  },
}

export const READING_IS =
  `A reading measures your stress level right now and turns it into your ${SCORE}, from 0 calm to 100 peak.`

const WAYS = [
  { id:'mirror', title:'Mental Mirror', Mark:Person,
    line:"Google's MediaPipe Face Landmarker maps 478 points on your face.",
    fact:[String(FACE_SECONDS), 'seconds'],
    cta:'Open the Mirror',
    spec:[
      ['Takes', `${FACE_SECONDS} seconds`],
      ['Reads', 'Blinks, brow, lips, eyes, small movements, and pulse from skin colour'],
      ['Needs', 'A front camera and good light'],
    ],
    foot:'Frames become numbers, then get deleted. Students only. The score syncs to your account.' },
  { id:'sensors', title:'Camera and microphone', Mark:Camera,
    line:'Put a fingertip on the lens, then speak.',
    fact:['45', 'seconds'],
    cta:'Start',
    spec:[
      ['Takes', '45 seconds'],
      ['Reads', 'Heart rate, beat variation, pitch and steadiness'],
      ['Needs', 'A camera and a microphone'],
    ],
    foot:'Frames and audio become numbers, then get deleted. The score syncs to your account.' },
  { id:'survey', title:'Survey', Mark:Stack,
    line:'Only needs this phone. Take it as often as you like.',
    fact:['60', 'seconds'],
    cta:'Answer',
    spec:[
      ['Takes', 'About a minute'],
      ['Reads', 'Tension, worry, mood, sleep, energy, focus, body and support'],
      ['Needs', 'Only this phone'],
    ],
    foot:'Your answers become one score. The score syncs to your account.' },
  { id:'patch', title:'Connect a patch', Mark:Link,
    line:'The patch reads pulse, sweat, temperature and movement.',
    cta:'Connect',
    spec:[
      ['Takes', 'One pairing, then no setup'],
      ['Reads', 'Four signals, once a second'],
      ['Needs', 'A MindMap patch over Bluetooth'],
    ] },
]

// Each action colour clears 4.5:1 with paper text on it (sky-ink, beam-ink, accent, sun-ink).
const LOOK = {
  mirror:  { tile:'bg-sky-wash text-sky-ink',       cta:'bg-sky-ink text-paper groupHoverOnly:bg-[#07507f]' },
  sensors: { tile:'bg-beam-wash text-beam-ink',     cta:'bg-beam-ink text-paper groupHoverOnly:bg-[#0b4f62]' },
  survey:  { tile:'bg-accent-wash text-accent-ink', cta:'bg-accent text-paper groupHoverOnly:bg-accent-ink' },
  patch:   { tile:'bg-sun-wash text-sun-ink' },
}
const CARD = 'rounded-panel border border-rule/60 bg-card shadow-card'

function Figures({ items, className }) {
  return (
    <span className={cn('flex flex-wrap gap-x-6 gap-y-2', className)}>
      {items.map(([value, label]) => (
        <span key={label} className="flex min-w-0 flex-col">
          <span className="font-display text-head font-bold tabular-nums leading-none text-accent-ink">
            {value}
          </span>
          <span className="mt-1 text-fine leading-tight text-ink-2">{label}</span>
        </span>
      ))}
    </span>
  )
}

function Spec({ rows }) {
  return (
    <dl className="m-0 mt-3 space-y-1.5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline gap-3">
          <dt className="w-[3.6rem] shrink-0 text-fine text-ink-3">{k}</dt>
          <dd className="m-0 min-w-0 flex-1 text-fine leading-[1.45] text-ink-2">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/* The icon in its tile. */
function Tile({ Mark, className }) {
  return (
    <span aria-hidden className={cn('grid size-11 shrink-0 place-items-center rounded-[12px]', className)}>
      <Mark className="size-6"/>
    </span>
  )
}

function Top({ n, way, look }) {
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-chip border
        border-ruling bg-paper font-display text-fine font-bold tabular-nums text-ink">{n}</span>
      <Tile Mark={way.Mark} className={look.tile}/>
      {way.fact && (
        <span className="ml-auto shrink-0 text-fine tabular-nums text-ink-3">
          {`${way.fact[0]} ${way.fact[1]}`}</span>
      )}
    </span>
  )
}

const Way = React.forwardRef(function Way({ n, way, onOpen, children }, ref) {
  const look = LOOK[way.id]
  return (
    <Card interactive as="button" type="button" ref={ref} onClick={onOpen}
      className="group flex h-full flex-col border-rule/60 p-5 lg:p-6">
      <Top n={n} way={way} look={look}/>
      <span className="mt-4 block font-display text-head font-bold leading-tight text-ink">{way.title}</span>
      <span className="mt-1.5 block max-w-[38ch] text-meta leading-[1.45] text-ink-2">{way.line}</span>
      {children}
      <span className="mt-auto pt-5">
        <span className={cn('inline-flex min-h-[46px] items-center gap-2 rounded-field px-5 font-display',
          'text-ui font-bold transition-colors duration-150', look.cta)}>
          {way.cta}
          <ArrowRight aria-hidden className="size-[1.05rem] transition-transform duration-200
            motion-safe:groupHoverOnly:translate-x-1"/>
        </span>
      </span>
    </Card>
  )
})

function Compare() {
  return (
    <SeeDetails label="Compare the four ways" className="mt-3 lg:mt-4">
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-4">
        {WAYS.map((way, i) => (
          <section key={way.id} className={cn(CARD, 'p-5')}>
            <h3 className="flex items-center gap-2.5 font-display text-meta font-bold text-ink">
              <Tile Mark={way.Mark} className={cn('size-9 [&_svg]:size-5', LOOK[way.id].tile)}/>
              {`${i + 1}. ${way.title}`}
            </h3>
            <Spec rows={way.spec}/>
            {way.foot && (
              <p className="mt-2.5 max-w-[44ch] text-fine leading-[1.4] text-ink-3">{way.foot}</p>
            )}
          </section>
        ))}
      </div>
    </SeeDetails>
  )
}

// Module level: an inner component would remount the back button and drop keyboard focus.
const ReadingHead = React.forwardRef(function ReadingHead({ id, onBack }, ref) {
  const s = SCREENS[id]
  return (
    <>
      <BackBar onBack={onBack}>Back</BackBar>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 ref={ref} tabIndex={-1} className="max-w-[26ch] font-display font-bold text-ink">
          {s.title}
        </h2>
        <Why label="What this reading measures">
          <p>{s.lede}</p>
          <Figures items={s.facts} className="mt-2"/>
        </Why>
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
  // True while this screen owns the history entry it pushed on entering a reading, so leaving consumes it.
  const pushed = React.useRef(false)
  const logged = React.useRef(null)

  const restart = React.useCallback(() => { setAns({}); logged.current = null }, [])

  const open = React.useCallback(id => {
    if (id === 'survey') restart()
    from.current = id
    setDir('fwd'); setScreen(id)
    setSaid(`${SCREENS[id].title}, showing now`)
    try {
      history.pushState({ reading: id }, '', location.hash || '#/check')
      pushed.current = true
    } catch { pushed.current = false }
  }, [restart])

  const leave = React.useCallback(() => {
    setDir('back'); setScreen('choose')
    setSaid('Four ways to take a reading, showing now')
    if (pushed.current) { pushed.current = false; history.back() }
  }, [])

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

  // Returning focuses the card that opened the reading, two frames after App's popstate handler focuses #main.
  React.useEffect(() => {
    if (firstPaint.current) { firstPaint.current = false; return }
    window.scrollTo(0, 0)
    if (screen !== 'choose') { head.current?.focus({ preventScroll:true }); return }
    const id = from.current
    from.current = null
    if (!id) return
    let b = 0
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => cards.current[id]?.focus({ preventScroll:true }))
    })
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b) }
  }, [screen])

  React.useEffect(() => {
    const want = takeReadingIntent()
    if (want === 'sensors' || want === 'survey' || want === 'mirror') open(want)
  }, [open])

  React.useEffect(() => {
    if (!done || !r) return
    if (!logged.current) {
      const e = addReading({ at: Date.now(), score: r.score, source: 'survey' })
      logged.current = e ? e.id : 'unsaved'
    } else if (logged.current !== 'unsaved') {
      updateReading(logged.current, { score: r.score })
    }
  }, [done, r?.score])

  React.useEffect(() => {
    // 260ms lets the result card mount and the layout settle before scrollIntoView measures.
    if (screen !== 'survey' || !done || !resultRef.current) return
    const t = setTimeout(() => resultRef.current?.scrollIntoView({ block:'start' }), 260)
    return () => clearTimeout(t)
  }, [done, screen])

  async function pairUp(){
    setBusy(true); setPair({ ok:null, msg:'Choosing a patch…' })
    setPair(await connectPatch()); setBusy(false)
  }

  const [mirror, sensors, survey, patch] = WAYS

  return (
    <>
      <StageStyles/>
      <p aria-live="polite" className="sr-only text-sec">{said}</p>

      {screen === 'choose' && (
        <Stage dir={dir}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2 className="font-display font-bold text-ink">Take a reading</h2>
            <PatchNotice inline/>
          </div>

          <p className="mt-1.5 max-w-[60ch] text-meta leading-[1.45] text-ink-2">{READING_IS}</p>

          <ol className="m-0 mt-4 grid list-none gap-4 p-0 lg:mt-5 lg:grid-cols-2 lg:gap-5">
            <ScrollRow as="li" index={0} className="h-full">
              <Way n={1} ref={el => { cards.current.mirror = el }} way={mirror}
                onOpen={() => open('mirror')}/>
            </ScrollRow>
            <ScrollRow as="li" index={1} className="h-full">
              <Way n={2} ref={el => { cards.current.sensors = el }} way={sensors}
                onOpen={() => open('sensors')}/>
            </ScrollRow>
            <ScrollRow as="li" index={2} className="h-full">
              <Way n={3} ref={el => { cards.current.survey = el }} way={survey}
                onOpen={() => open('survey')}>
                <span className="mt-4 flex items-center gap-3">
                  <span aria-hidden className="block flex-1">
                    <Progress value={answered} max={ITEMS.length}/>
                  </span>
                  <span className="shrink-0 text-fine tabular-nums text-ink-3">
                    {`${answered} of ${ITEMS.length} answered`}
                  </span>
                </span>
              </Way>
            </ScrollRow>
            <ScrollRow as="li" index={3} className="h-full">
              <section className={cn(CARD, 'flex h-full flex-col p-5 lg:p-6')}>
                <Top n={4} way={patch} look={LOOK.patch}/>
                <h3 className="mt-4 font-display !text-head font-bold !leading-tight text-ink">{patch.title}</h3>
                <p className="mt-1.5 max-w-[38ch] text-meta leading-[1.45] text-ink-2">{patch.line}</p>
                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-5">
                  <Button size="sm" onClick={pairUp} disabled={busy}
                    className="bg-sun-ink px-5 font-bold text-paper hoverOnly:bg-[#664805] active:bg-[#664805]">
                    <Link aria-hidden/>{busy ? 'Connecting…' : patch.cta}
                  </Button>
                  <p aria-live="polite" className="m-0 max-w-[44ch] text-fine leading-[1.4] text-ink-2">
                    {pair?.msg || (mode === 'real' ? 'No patch is paired.' : 'The demo patch is paired.')}
                  </p>
                </div>
              </section>
            </ScrollRow>
          </ol>
          <Compare/>
          <SeeTrends go={go} className="mt-5 lg:mt-6"/>
        </Stage>
      )}

      {screen === 'sensors' && (
        <Stage dir={dir}>
          <ReadingHead id="sensors" ref={head} onBack={leave}/>
          <div className="mt-3 lg:mt-4"><PhoneCheck go={go}/></div>
          <SeeDetails label="How the camera pulse check works" className="mt-4 lg:mt-5">
            <div className={cn(PANEL, 'p-4 lg:p-6')}>
              <CameraModule className="mx-auto max-w-[66rem]"/>
              <SignalCoverage className="mt-4 border-t border-rule pt-4"/>
            </div>
          </SeeDetails>
        </Stage>
      )}

      {screen === 'mirror' && (
        <Stage dir={dir}>
          <ReadingHead id="mirror" ref={head} onBack={leave}/>
          <div className="mt-3 lg:mt-4"><MentalMirror go={go}/></div>
        </Stage>
      )}

      {screen === 'survey' && (
        <Stage dir={dir}>
          <ReadingHead id="survey" ref={head} onBack={leave}/>
          <div className="mt-3 lg:mt-4 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]
            xl:items-start xl:gap-4">
            <div className={cn(PANEL, 'px-5 pt-4 lg:px-6 [&_fieldset]:border-rule/50 [&_fieldset]:py-5')}>
              {ITEMS.map((it,i)=>(
                <ScrollRow key={it.id} index={i}
                  className={i === ITEMS.length - 1 ? '[&_fieldset]:border-b-0' : undefined}>
                  <Scale legend={it.q} low={it.lo} high={it.hi}
                    value={ans[it.id]} onChange={v=>setAns(a=>({...a,[it.id]:v}))}/>
                </ScrollRow>
              ))}
            </div>

            {/* min-h reserves the result's space. xl:top-[65px] is the 48px app bar, its 1px hairline and 16px of air. */}
            <section ref={resultRef} aria-live="polite" data-anchor
              className={cn(PANEL, 'mt-3 min-h-[10rem] p-4 lg:p-5 xl:mt-0 xl:sticky xl:top-[65px]')}>
              {!done && (
                <p className="max-w-[40ch] text-meta text-ink-3">
                  Your {SCORE} appears here when every question is answered.
                </p>
              )}
              {done && (
                <>
                  <div className="flex flex-col items-start gap-4">
                    {/* RainbowDial takes raw hex: #157446 is accent, #1d8fb0 is beam. */}
                    <RainbowDial score={r.score} size={268}
                      rings={[{ id:'self', name:'Your answers', color:'#157446', glow:'#1d8fb0',
                                value:r.score, reading:'Survey' }]}/>
                    <div className="w-full">
                      <Headline>{s.pre}<b className={`font-bold ${s.calm ? 'text-calm' : 'text-warn'}`}>{s.word}</b>{s.tail}</Headline>
                      <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-meta">
                        <dt className="text-ink-3">{SCORE}</dt>
                        <dd className="m-0 font-mono tabular-nums text-ink">{r.score} out of 100</dd>
                        <dt className="text-ink-3">Read from</dt>
                        <dd className="m-0 text-ink">{ITEMS.length} answers</dd>
                        <dt className="text-ink-3">The other rings</dt>
                        <dd className="m-0 text-ink">A patch fills heart, sweat, temperature and movement</dd>
                      </dl>
                      <p className="mt-3 flex flex-wrap items-center gap-x-3 text-meta text-ink-2">
                        Added to your {SCORE} Log.
                        <SeeTrends go={go}/>
                        <button type="button"
                          onClick={() => { restart(); requestAnimationFrame(() => head.current?.focus({ preventScroll:false })) }}
                          className="inline-flex min-h-[44px] items-center font-display font-bold text-ink-2
                            underline-offset-4 hoverOnly:text-ink hoverOnly:underline">
                          Answer again
                        </button>
                      </p>
                    </div>
                  </div>
                  <AllDetail label={`See what moved your ${SCORE}`}>
                    <p className="mt-2 max-w-[52ch] text-meta text-ink-3">
                      Right bars raised your {SCORE}, left bars lowered it.</p>
                    <Diverge items={r.contrib.map(c=>({ label:c.item.q.replace(/\?$/,''),
                      x: Math.max(-1, Math.min(1, c.raw)) }))}/>
                    <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-fine">
                      <dt className="text-ink-3">Each answer</dt>
                      <dd className="m-0 text-ink-2">Measured from its middle option, then weighted</dd>
                      <dt className="text-ink-3">All of them together</dt>
                      <dd className="m-0 text-ink-2">Averaged into one number out of 100</dd>
                      <dt className="text-ink-3">With a patch</dt>
                      <dd className="m-0 text-ink-2">The same last step, from four signals</dd>
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
