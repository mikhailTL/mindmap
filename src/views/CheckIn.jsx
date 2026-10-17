import React from 'react'
import { ScrollRow } from '../ui/motion'

import { Headline, AllDetail, SeeDetails, Why } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { ArrowRight, Camera, Link, Stack } from '../ui/marks'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Progress } from '../ui/progress'
import { Scale } from '../ui/radio-scale'
import { DemoNotice, PatchNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { Diverge } from '../charts/diverge'
import { ITEMS, score, sentence, connectPatch } from '../lib/engine'
import { PhoneCheck } from './PhoneCheck'
import { BackBar, Stage, StageStyles } from './reading/stage'
import { takeReadingIntent } from './reading/intent'
import { SeeTrends } from './student/charts'
import { addReading, updateReading } from '../lib/readingLog'
import { SCORE, SCORE_RANGE } from '../lib/terms'
import { cn } from '../lib/utils'

/* Take a reading, in three local states on one screen: choose, sensors,
   survey. Entering a reading replaces the chooser. The step guide and its
   drawings belong to PhoneCheck, so they never sit on the chooser. */

const PANEL = 'rounded-panel border border-rule bg-card'

/* One line per screen and its figures. Every figure is measured elsewhere:
   PPG_SECONDS plus VOICE_SECONDS is 45; ITEMS (lib/engine.js) holds the check-in questions. */
const SCREENS = {
  sensors: {
    title: 'Camera and microphone',
    lede: `The phone measures your ${SCORE} instead of asking.`,
    facts: [['45', 'seconds of capture'], [SCORE_RANGE, SCORE], ['0', 'frames or audio kept']],
  },
  survey: {
    title: 'Check-in questions',
    lede: 'Your answers become one number.',
    facts: [[String(ITEMS.length), 'scales to fill in'], [SCORE_RANGE, SCORE],
      ['1', 'score saved to your account']],
  },
}

/* The three ways in: on the card a mark, title, one line, one figure and the
   action; under the grid the same three facts in the same order. */
const WAYS = [
  { id:'sensors', title:'Camera and microphone', opens:true, Mark:Camera,
    line:'Put a fingertip on the lens, then speak.',
    fact:['45', 'seconds'],
    cta:'Start',
    spec:[
      ['Takes', '45 seconds'],
      ['Reads', 'Heart rate, beat variation, pitch and steadiness'],
      ['Needs', 'A camera and a microphone'],
    ],
    foot:'Frames and audio become numbers, then get deleted. The score syncs to your account.' },
  { id:'survey', title:'Check-in questions', opens:true, Mark:Stack,
    line:'You need no camera or patch. Take it as often as you like.',
    fact:['60', 'seconds'],
    cta:'Answer',
    spec:[
      ['Takes', 'About a minute'],
      ['Reads', 'Tension, worry, mood, sleep, energy, focus, body and support'],
      ['Needs', 'Only this phone'],
    ],
    foot:'Your answers become one score. The score syncs to your account.' },
  { id:'patch', title:'Connect a patch', opens:false, Mark:Link,
    line:'The patch reads pulse, sweat, temperature and movement.',
    cta:'Connect',
    spec:[
      ['Takes', 'One pairing, then no setup'],
      ['Reads', 'Four signals, once a second'],
      ['Needs', 'A MindMap patch over Bluetooth'],
    ] },
]

/* Figures as a chip row: label beside the figure, never under it. */
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

/* Spans, not a `dl`: a button's content model is phrasing. */
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

/* A way in. The whole card is the control and the hit area. */
const Way = React.forwardRef(function Way({ way, onOpen, children }, ref) {
  const Mark = way.Mark
  return (
    <Card interactive as="button" type="button" ref={ref} onClick={onOpen}
      className="group flex h-full flex-col p-4 lg:p-5">
      <span className="flex items-center gap-2.5">
        <Mark aria-hidden className="size-6 shrink-0 text-accent"/>
        <span className="block font-display text-row font-bold leading-tight text-ink">{way.title}</span>
      </span>
      <span className="mt-1.5 block max-w-[38ch] text-meta leading-[1.4] text-ink-2">{way.line}</span>
      {way.fact && <Figures items={[way.fact]} className="mt-3"/>}
      {children}
      <span className="mt-auto flex items-center gap-2 pt-3 font-display text-meta
        font-bold text-accent">
        {way.cta}
        <ArrowRight aria-hidden className="size-[1.05rem] transition-transform
          duration-200 groupHoverOnly:translate-x-1.5"/>
      </span>
    </Card>
  )
})

/* The three facts per way, behind one disclosure under the grid. */
function Compare() {
  return (
    <SeeDetails label="Compare the three ways" className="mt-3 lg:mt-4">
      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        {WAYS.map(way => {
          const Mark = way.Mark
          return (
            <section key={way.id} className={cn(PANEL, 'p-4')}>
              <h3 className="flex items-center gap-2 font-display text-meta font-bold text-ink">
                <Mark aria-hidden className="size-5 text-accent"/>{way.title}
              </h3>
              <Spec rows={way.spec}/>
              {way.foot && (
                <p className="mt-2.5 max-w-[44ch] text-fine leading-[1.4] text-ink-3">{way.foot}</p>
              )}
            </section>
          )
        })}
      </div>
    </SeeDetails>
  )
}

/* The top of a reading. Module level: an inner component would remount the
   back button out from under a keyboard. */
const ReadingHead = React.forwardRef(function ReadingHead({ id, onBack }, ref) {
  const s = SCREENS[id]
  return (
    <>
      <BackBar onBack={onBack}>Back</BackBar>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 ref={ref} tabIndex={-1} className="max-w-[26ch] font-display font-bold text-ink">
          {s.title}
        </h2>
        <Why label={`What ${s.title.toLowerCase()} measures`}>
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
  /* True while this screen owns the history entry it pushed on entering a
     reading, so leaving consumes that entry. */
  const pushed = React.useRef(false)
  /* The survey's log entry: added once when the last answer lands, then kept
     in step if an answer changes. Each new start of the survey is a new
     reading: the answers clear and a new entry is made. */
  const logged = React.useRef(null)

  /* A fresh survey: no answers, and the next result is a new reading. */
  const restart = React.useCallback(() => { setAns({}); logged.current = null }, [])

  const open = React.useCallback(id => {
    if (id === 'survey') restart()
    from.current = id
    setDir('fwd'); setScreen(id)
    setSaid(`${SCREENS[id].title}, showing now`)
    /* The pushed entry makes browser back mean "out of this reading". */
    try {
      history.pushState({ reading: id }, '', location.hash || '#/check')
      pushed.current = true
    } catch { pushed.current = false }
  }, [restart])

  const leave = React.useCallback(() => {
    setDir('back'); setScreen('choose')
    setSaid('Three ways to take a reading, showing now')
    if (pushed.current) { pushed.current = false; history.back() }
  }, [])

  /* Escape and browser back both land on the chooser. Neither is listened
     for from the chooser itself. */
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

  /* A screen change starts at the top and focuses the new screen. Returning
     focuses the card that opened the reading, two frames after App's own
     popstate handler focuses #main. */
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

  /* A link that has to land on a reading rather than on the chooser. */
  React.useEffect(() => {
    const want = takeReadingIntent()
    if (want === 'sensors' || want === 'survey') open(want)
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

  // Answering the last item scrolls to the result; 260ms lets the card mount
  // and the layout settle before scrollIntoView measures.
  React.useEffect(() => {
    if (screen !== 'survey' || !done || !resultRef.current) return
    const t = setTimeout(() => resultRef.current?.scrollIntoView({ block:'start' }), 260)
    return () => clearTimeout(t)
  }, [done, screen])

  async function pairUp(){
    setBusy(true); setPair({ ok:null, msg:'Choosing a patch…' })
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
            <h2 className="font-display font-bold text-ink">Take a reading</h2>
            {/* This screen scores real answers in both modes; the notice
                describes the surrounding screens. */}
            {mode !== 'real' && <DemoNotice inline>This screen scores your real answers.</DemoNotice>}
            <PatchNotice inline/>
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
                    {`${answered}/${ITEMS.length}`}
                  </span>
                  {/* aria-hidden: the line above already says the figure. */}
                  <span aria-hidden className="mt-2 block">
                    <Progress value={answered} max={ITEMS.length}/>
                  </span>
                </span>
              </Way>
            </ScrollRow>
            {/* Pairing is a device handshake, not a reading, so this card is
                a panel with a control in it. */}
            <ScrollRow index={2} className="h-full">
              <section className={cn(PANEL, 'flex h-full flex-col p-4 lg:p-5')}>
                <h3 className="flex items-center gap-2.5 font-display text-row font-bold leading-tight text-ink">
                  <Link aria-hidden className="size-6 shrink-0 text-accent"/>{patch.title}
                </h3>
                <p className="mt-1.5 max-w-[38ch] text-meta leading-[1.4] text-ink-2">{patch.line}</p>
                <div className="mt-auto pt-3">
                  <Button variant="outline" size="sm" onClick={pairUp} disabled={busy}>
                    <Link aria-hidden/>{busy ? 'Connecting…' : patch.cta}
                  </Button>
                </div>
                <p aria-live="polite"
                  className="mt-1.5 min-h-[2.8em] max-w-[44ch] text-fine leading-[1.4] text-ink-3">
                  {pair?.msg || 'No patch is paired.'}
                </p>
              </section>
            </ScrollRow>
          </div>
          <Compare/>
          {/* The owner, 17 October: the log, trends and Mind Score data moved
              to their own app tab, Trends. This page links to it. */}
          <p className="mt-6 flex flex-wrap items-center gap-x-3 text-meta text-ink-2 lg:mt-8">
            Your {SCORE} Log and trends are on the Trends tab.
            <SeeTrends go={go}/>
          </p>
        </Stage>
      )}

      {screen === 'sensors' && (
        <Stage dir={dir}>
          <ReadingHead id="sensors" ref={head} onBack={leave}/>
          <div className="mt-3 lg:mt-4"><PhoneCheck go={go}/></div>
        </Stage>
      )}

      {screen === 'survey' && (
        <Stage dir={dir}>
          <ReadingHead id="survey" ref={head} onBack={leave}/>
          <div className="mt-3 lg:mt-4 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]
            xl:items-start xl:gap-4">
            {/* The panel supplies the gutter and tightens the row height. */}
            <div className={cn(PANEL, 'px-4 lg:px-5 [&_fieldset]:py-4')}>
              {ITEMS.map((it,i)=>(
                <ScrollRow key={it.id} index={i}
                  className={i === ITEMS.length - 1 ? '[&_fieldset]:border-b-0' : undefined}>
                  <Scale legend={it.q} low={it.lo} high={it.hi}
                    value={ans[it.id]} onChange={v=>setAns(a=>({...a,[it.id]:v}))}/>
                </ScrollRow>
              ))}
            </div>

            {/* min-h reserves the result's space. xl:top-[65px] is the app
                shell's 48px bar + 1px hairline + 16px air. */}
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
                                value:r.score, reading:'Check-in questions' }]}/>
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
