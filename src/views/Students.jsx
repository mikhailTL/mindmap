import React from 'react'
import { SectionShell } from './shell'
import { FeltCard, Panel, PanelHead, SeeDetails, SharedCard, Stat, Why } from './Monitor'
import { CheckInBody } from './CheckIn'
import { SharingControls } from '../app'
import { DayChart } from '../charts/day'
import { Diverge } from '../charts/diverge'
import { Bars, RainbowDial } from '../charts/rainbow'
import { DATA } from '../lib/assets'
import { useMode } from '../lib/mode'
import { studentRings } from '../lib/readings'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { MOVE_LIMIT_G } from '../signals/motion'
import { bandOf } from '../signals/score'
import { SettleCard } from '../toolkit/settle'
import { ReachCard } from '../toolkit/reach'
import { WhatWorksCard } from '../toolkit/works'
/* The demo reading and everything derived from it live in one module, so this
   screen and the calendar cannot print two different numbers for the same
   Thursday. */
import { BAND, CROSSED, PEAK, READ, TAKEN_AT, TODAY, USUAL, clock12 } from './reading/demo'
import { cn } from '../lib/utils'
import { SCORE } from '../lib/terms'
import { daySentence } from './student/sentence'
import { Welcome } from './student/Welcome'
import { HeadsUpCard } from './student/HeadsUpCard'
import { TrendsBox, WeekFaces } from './student/TrendsBox'
import { SeeTrends, TakeReading } from './student/charts'
import { useReadingLog } from './reading/useReadingLog'
import { BAND as LOG_BAND, SOURCE, clock, ringsFor, when } from './reading/marks'
import { bandOf as logBand } from '../lib/readingLog'
import { dayKey } from './student/liveSeries'
import { Button } from '../ui/button'
import { PartHead, TODAY_LONG, longDate } from './student/PartHead'
import { TEEN } from './student/demoTeen'

/* The student app's Today screen, and the shell the three student tabs sit in.
 *
 * 17 OCTOBER, the owner's editor prompt. The screen is:
 *
 *   1. "Welcome, <first name>", from the signed-in account (the demo teen's
 *      name in the demo with nobody signed in).
 *   2. ONE CARD with the dial and, under it, the sentence about calm and
 *      stress against the teen's own usual (src/views/student/sentence.js).
 *      Tapping a ring opens that signal's working; the figures are behind
 *      the "?".
 *   3. Heads Up, the teen's own light for today and the week, then the four
 *      live channels. At 1280 these two sit beside the dial card.
 *   4. ONE `See details` DISCLOSURE, collapsed: the settle card, what moved
 *      the score, the day, the week, reach, what works, how today felt and
 *      who sees what.
 *   5. Trends: a month calendar and a date range over the demo teen's ninety
 *      days, with the body's readings by source and Heads Up for the range.
 *
 * No narrow column: the content runs the width of the app shell.
 *
 * LIVE TRACES. In the demo the four traces stream: `LIVE` below is four
 * periodic series and the window walks them. Generated, and labelled so; no
 * patch has been built or worn. `prefers-reduced-motion` stops the walk.
 *
 * Where the figures come from:
 *   rings      src/lib/readings.js, each signal's own distance from this
 *              person's fourteen-day normal, on a 0 to 100 scale
 *   day, band  src/lib/assets.js, injected at build time
 *   everything under the dial  src/views/reading/demo.js, where scoreCapture
 *                            is run for real on the demo capture */

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
               'eight', 'nine', 'ten']
const word = n => WORDS[n] ?? String(n)
const pct = n => `${Math.round(n * 100)}%`

const nameOf = r => SENSORS[r.id]?.name || r.name || ''
/* How far a signal sits above the top of its own normal band. Negative means
   it is still inside it. */
const over = r => r.value - (r.band?.hi ?? 100)
const topSignal = rings => [...rings].sort((a, b) => over(b) - over(a))[0]

/* Direction against the wearer's own normal, in words first. Colour only
   repeats what the sentence already says. */
function direction(r) {
  const b = r.band
  if (!b) return { word: 'no normal yet', tone: 'text-ink-2' }
  if (r.value > b.hi) return { word: `${r.value - b.hi} above your normal`, tone: 'text-warn' }
  if (r.value < b.lo) return { word: `${b.lo - r.value} below your normal`, tone: 'text-ink-2' }
  return { word: 'inside your normal', tone: 'text-ink-2' }
}

/* ── The one sentence ───────────────────────────────────────────────────── */

/* The owner, 17 October: the sentence talks about calm and stress against
   the teen's own usual, never the number. It is generated in
   src/views/student/sentence.js from the same day series and usual band the
   rest of the screen draws, and tested there for clinical words.
 *
 * The quieter working behind the "?" still names the body: which of the four
 * signals moved most, in words rather than standard deviations. */
const amountWords = n => (n >= 10 ? 'well above its own normal'
  : n >= 4 ? 'above its own normal' : 'just above its own normal')

function signalNote(rings) {
  const top = topSignal(rings)
  return top && over(top) > 0
    ? `${nameOf(top)} moved the most, ${amountWords(over(top))}.`
    : 'All four signals stayed inside their normal ranges.'
}

/* The comparison the old sentence carried, kept under the dial so no figure is
   lost: how far today sits from a usual day. */
/* The dial prints the usual day under itself, so this line names the distance
   and not the figure again. */
function compareWords(score, usual) {
  const d = score - usual
  if (d === 0) return 'The score is level with your usual day.'
  return `The score is ${word(Math.abs(d))} ${d > 0 ? 'above' : 'below'} your usual day.`
}

/* Whether the capture the screen is showing was taken before the day crossed
   above the usual range. Worked out from the two clocks rather than written
   into the copy, because it is the fact that stops the sentence above and the
   band word under the dial from looking like they disagree. */
const READ_BEFORE_RISE = !!(CROSSED && String(TAKEN_AT) < String(CROSSED))

function figureWords(score, usual) {
  const c = compareWords(score, usual)
  return READ_BEFORE_RISE
    ? `This reading was taken at ${TODAY.clock}, before the rise. ${c}`
    : `This reading was taken at ${TODAY.clock}. ${c}`
}

/* ── The live traces ────────────────────────────────────────────────────── */

/* Four periodic series, one per channel. Integer harmonics only, so the series
   closes on itself and the walking window never shows a seam. Nothing here is
   a measurement: it is the shape of a channel being written, drawn so the demo
   reads as a device streaming rather than as a still picture. `lo` and `hi`
   are a FIXED y-domain per channel, so a moving trace moves the line and never
   the axis under it. */
const LIVE_N = 300
function periodic(base, terms) {
  return Array.from({ length: LIVE_N }, (_, i) => {
    const t = i / LIVE_N
    let v = base
    for (const [h, a, p] of terms) v += a * Math.sin(2 * Math.PI * (h * t + p))
    return v
  })
}

const LIVE = {
  heart: { lo: 58, hi: 80, dp: 0,
    series: periodic(69, [[1, 3.2, 0], [3, 1.4, 0.21], [8, 0.6, 0.63], [17, 0.25, 0.11]]) },
  sweat: { lo: 2.4, hi: 3.6, dp: 2,
    series: periodic(3.0, [[1, 0.24, 0.12], [2, 0.11, 0.44], [6, 0.05, 0.8], [13, 0.02, 0.3]]) },
  temp:  { lo: 33.1, hi: 33.9, dp: 1,
    series: periodic(33.5, [[1, 0.13, 0.3], [4, 0.05, 0.7], [11, 0.02, 0.5]]) },
  move:  { lo: 0, hi: 0.14, dp: 2,
    series: periodic(0.045, [[2, 0.022, 0.5], [5, 0.014, 0.08], [12, 0.008, 0.72]]) },
}
const WIN = 64

function useReducedMotion() {
  const [r, setR] = React.useState(false)
  React.useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setR(m.matches)
    on()
    m.addEventListener?.('change', on)
    return () => m.removeEventListener?.('change', on)
  }, [])
  return r
}

/* One step every 200ms. Not requestAnimationFrame: the trace advances by a
   whole sample, so sixty steps a second would walk the whole series in five
   seconds and read as a scroll rather than as a channel. */
function useStream(on, ms = 200) {
  const [i, setI] = React.useState(0)
  React.useEffect(() => {
    if (!on) return
    const id = setInterval(() => setI(n => (n + 1) % LIVE_N), ms)
    return () => clearInterval(id)
  }, [on, ms])
  return i
}

const TW = 240, TH = 44, TP = 3

function LiveTrace({ data, lo, hi, color, className }) {
  const span = hi - lo || 1
  const pts = data.map((v, i) => [
    TP + (i / (data.length - 1)) * (TW - TP * 2),
    TH - TP - ((Math.max(lo, Math.min(hi, v)) - lo) / span) * (TH - TP * 2),
  ])
  const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ')
  const last = pts[pts.length - 1]
  const gid = 'lt-' + color.replace('#', '')
  return (
    <svg viewBox={`0 0 ${TW} ${TH}`} aria-hidden preserveAspectRatio="none"
      className={cn('block h-11 w-full', className)}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28"/>
          <stop offset="1" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${d} L${last[0].toFixed(1)} ${TH} L${pts[0][0].toFixed(1)} ${TH} Z`} fill={`url(#${gid})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"
        strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} vectorEffect="non-scaling-stroke"/>
    </svg>
  )
}

/* The four channels as they arrive. The figure beside each name is the last
   sample in that channel's window, so the number and the end of the line are
   the same reading. */
function LiveSignals({ className }) {
  const reduced = useReducedMotion()
  const i = useStream(!reduced)
  return (
    <Panel className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHead title="Live Signals" meta={reduced ? 'motion off' : 'demo stream'}
          className="min-w-0 flex-1"/>
        <Why label="What the live signals show" className="pt-1.5">
          Each line updates once a second. The figures are generated for this demo.
        </Why>
      </div>
      <ul className="m-0 mt-2.5 grid flex-1 list-none grid-cols-2 grid-rows-2 gap-2.5 p-0">
        {SENSOR_ORDER.map(id => {
          const s = SENSORS[id]
          const L = LIVE[id]
          const w = Array.from({ length: WIN }, (_, k) => L.series[(i + k) % LIVE_N])
          const now = w[w.length - 1]
          return (
            <li key={id} className="flex min-w-0 flex-col rounded-panel border p-2.5"
              style={{ borderColor: s.glow + '55',
                       background: `linear-gradient(160deg, #ffffff 0%, ${s.glow}12 100%)` }}>
              <p className="flex items-center gap-2">
                <span aria-hidden className="h-4 w-[3px] shrink-0 rounded-bar"
                  style={{ background: s.glow }}/>
                <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink">
                  {s.name}</span>
              </p>
              <p className="mt-0.5 flex items-baseline gap-1.5">
                <span className="font-display text-row font-medium tabular-nums leading-none
                  text-ink">{now.toFixed(L.dp)}</span>
                <span className="text-fine text-ink-3">{s.unit}</span>
              </p>
              <LiveTrace className="mt-1.5 h-auto min-h-[2.75rem] flex-1" data={w} lo={L.lo}
                hi={L.hi} color={s.glow}/>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

/* The working behind one ring of the dial, opened by tapping the ring. */
function SignalDetail({ ring }) {
  const s = SENSORS[ring.id] || ring
  const tone = s.glow || s.color
  const band = ring.band
  return (
    <div className="mt-3 rounded-panel border border-rule bg-card p-3">
      <p className="flex items-baseline justify-between gap-3">
        <span className="font-display text-ui font-medium text-ink">{s.name}</span>
        <span className="shrink-0 text-fine tabular-nums text-ink-2">{ring.big} {s.unit}</span>
      </p>
      <dl className="m-0 mt-2 grid grid-cols-1 gap-y-1">
        {ring.rows?.map(row => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-fine text-ink-2">{row.label}</dt>
            <dd className="m-0 shrink-0 text-fine tabular-nums text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      {band && (
        <p className="mt-3 text-fine text-ink-2">
          {s.name} is <b className="font-bold tabular-nums text-ink">{ring.value}</b> out of 100. Your own
          normal runs {band.lo} to {band.hi}.</p>
      )}
      <Bars className="mt-3" data={ring.bars} color={tone} unit={ring.barUnit}/>
      <p className="mt-2.5 max-w-[48ch] text-fine text-ink-2">{ring.note || s.about}</p>
    </div>
  )
}

/* ── Today, in the demo ─────────────────────────────────────────────────── */

const MOVED_SUB = {
  quality: 'of the pulse trace was clean',
  scored: 'the formula scores a moving reading',
}

function TodayDemo({ go, openTab }) {
  const rings = studentRings()
  const [picked, setPicked] = React.useState(null)
  const tier = bandOf(TODAY.score)
  const top = topSignal(rings)
  const open = route => (openTab ? openTab(route) : go(route))
  const said = daySentence({ day: DATA.day || [], band: BAND })
  const openRing = rings.find(r => r.id === picked)
  const moved = READ.contrib.map(c => ({
    label: c.label, x: Math.max(-1, Math.min(1, c.raw)),
  }))

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {/* THE FOLD, 17 October: the welcome, the dial with its sentence,
          then Heads Up, then See details. At 1280 the dial card holds the
          left column and Heads Up sits over the live signals on the right;
          at 390 the three stack in that order, so Heads Up comes before the
          signals. */}
      <Welcome/>
      <PartHead id="today-h" kind="today" title="Today" line={`${TODAY_LONG}. Your readings so far today.`}/>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
        {/* The owner, 14 October: "add some gradients or cool effects to the
            cards to make it like a dashboard". The card runs card to aqua, a
            radial glow sits behind the dial, and the card lifts on a soft
            shadow. */}
        <Panel className="relative flex flex-col justify-center overflow-hidden
          bg-gradient-to-b from-card via-card to-aqua
          shadow-[0_24px_48px_-32px_rgba(10,110,104,0.55)] lg:row-span-2">
          <span aria-hidden className="pointer-events-none absolute left-1/2 top-[40%] h-[70%] w-[82%]
            -translate-x-1/2 -translate-y-1/2 rounded-[50%]
            bg-[radial-gradient(closest-side,rgba(10,110,104,0.14),rgba(10,110,104,0))]"/>
          <div className="relative flex flex-col items-center text-center">
            {/* 352 is a ceiling: the dial is w-full under it, so at 390 it
                takes the card's 318 and at 1280 the full 352. */}
            <RainbowDial score={TODAY.score} usual={USUAL} rings={rings}
              size={352} picked={picked}
              onPick={id => setPicked(p => (p === id ? null : id))}/>
            <p className="mt-3 max-w-[30ch] font-display text-row font-bold leading-[1.18]
              tracking-tight text-ink sm:text-head">{said.lead}</p>
            {said.sub && <p className="mt-1.5 max-w-[40ch] text-note text-ink-2">{said.sub}</p>}
            <Why label="What this reading means" align="center" className="mt-2.5">
              {signalNote(rings)} {figureWords(TODAY.score, USUAL)} On its own, that reading
              was {tier.word}.
            </Why>
          </div>
          {openRing && <SignalDetail ring={openRing}/>}
        </Panel>
        <HeadsUpCard teen={TEEN} go={go}/>
        <LiveSignals/>
      </div>

      {/* ONE DISCLOSURE. Everything else is in here, collapsed, two abreast
          at 1280. */}
      <SeeDetails label="See details">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          {/* How long the body took to settle after each peak, and the climb
              before each marked event. From src/signals/recovery.js over the
              demo day. Moved in here on 17 October so the fold is the
              welcome, the dial and Heads Up. */}
          <SettleCard className="lg:col-span-2"/>
          {/* The working behind the one number. Every figure in here is
              returned by scoreCapture for the reading, not written in. */}
          <Panel className="lg:col-span-2">
            <PanelHead title="What Moved Your Score" meta={`${moved.length} inputs`}/>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Stat className="col-span-2 sm:col-span-3" label="Likely range"
                value={`${READ.low} to ${READ.high}`} unit={`out of 100, a usual day is ${USUAL}`}/>
              <Stat label="Moved most" value={nameOf(top)} sub={`${over(top)} above its normal band`}/>
              <Stat label="Signal quality" value={pct(READ.quality)} sub={MOVED_SUB.quality}/>
              <Stat label="Scored by" value={READ.model.scored ? 'The model' : 'The formula'}
                sub={MOVED_SUB.scored}/>
            </div>
            <div className="mt-3 border-t border-rule pt-2.5"><Diverge items={moved}/></div>
          </Panel>

          <Panel tone="aqua" className="lg:col-span-2">
            <PanelHead title={`${SCORE} Today`} meta="07:00 to 16:00"/>
            <DayChart data={DATA.day} band={DATA.band}/>
            <dl className="m-0 mt-2.5 grid grid-cols-1 gap-y-1 border-t border-rule pt-2.5
              sm:grid-cols-3 sm:gap-x-5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-fine text-ink-2">Your usual range</dt>
                <dd className="m-0 shrink-0 text-fine tabular-nums text-ink">
                  {BAND.lo} to {BAND.hi}</dd>
              </div>
              {CROSSED && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-fine text-ink-2">Above range from</dt>
                  <dd className="m-0 shrink-0 text-fine tabular-nums text-ink">
                    {clock12(CROSSED)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-fine text-ink-2">Highest point</dt>
                <dd className="m-0 shrink-0 text-fine tabular-nums text-ink">
                  {PEAK.v} at {clock12(PEAK.t)}</dd>
              </div>
            </dl>
          </Panel>

          {/* The week moved to the Trends part below and the Trends tab. */}
          <div className="flex flex-col gap-3 lg:gap-4">
          <ReachCard/>
          <WhatWorksCard/>
          </div>

          <div className="flex flex-col gap-3 lg:gap-4">
          <FeltCard go={open}/>
          <SharedCard go={go}/>
          </div>
        </div>
      </SeeDetails>

      {/* The owner, 17 October: "there should be a new box called Trends on
          the main student homepage". The full trends are the Trends tab. */}
      <TrendsPart go={go}/>
    </div>
  )
}

/* ── Take a reading ─────────────────────────────────────────────────────── */

/* Both lists are the engine read back, not copy: every row names something
   scoreCapture returns or something the capture screens drop on the device.
   One short line each. */
const GIVES = [
  ['One number, 0 to 100', 'The score is compared with your own normal only.'],
  ['A likely range', 'The range widens when a signal is missing or noisy.'],
  ['What moved your score', 'Each input, how far it moved, and which way.'],
  ['Whether you were moving', `Over ${MOVE_LIMIT_G} g, movement is not counted as stress.`],
]

const KEPT_HERE = [
  ['Camera frames', 'The phone turns them into numbers, then deletes them.'],
  ['Microphone audio', 'The phone turns it into pitch figures, then deletes it.'],
  ['Your check-in answers', 'Turned into one score. Only the score syncs to your account.'],
]

function Rows({ items }) {
  return (
    <dl className="m-0 list-none p-0">
      {items.map(([what, why]) => (
        <div key={what} className="border-b border-rule py-2 last:border-b-0 last:pb-0">
          <dt className="font-display text-ui font-medium text-ink">{what}</dt>
          <dd className="m-0 mt-0.5 max-w-[56ch] text-fine text-ink-2">{why}</dd>
        </div>
      ))}
    </dl>
  )
}

/* The chooser is three short cards and then the fold. These two modules sit
   behind one disclosure, below the fold. */
function CheckBody({ go }) {
  return (
    <>
      <CheckInBody go={go}/>
      <SeeDetails className="mt-6" label="What you get back">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          <Panel className="h-full">
            <PanelHead title="What You Get Back" meta="every way"/>
            <div className="mt-1.5"><Rows items={GIVES}/></div>
          </Panel>
          <Panel className="h-full">
            <PanelHead title="What Is Not Kept" meta="every way"/>
            <div className="mt-1.5"><Rows items={KEPT_HERE}/></div>
          </Panel>
        </div>
      </SeeDetails>
    </>
  )
}

/* ── The Trends part of the home ────────────────────────────────────── */

/* Its own tinted band under its own head, so Today and Trends never run
   together: the Trends box (a small line of recent Mind Scores and "See your
   trends") and the week's Heads Up faces. Both modes. */
function TrendsPart({ go }) {
  return (
    <section aria-labelledby="home-trends-h"
      className="mt-4 flex flex-col gap-3 rounded-[24px] border border-beam/25 bg-beam-wash p-3 sm:p-4
        lg:mt-6 lg:gap-4 lg:p-5">
      <PartHead id="home-trends-h" kind="trends" title="Trends"
        line="Your last two weeks, compared only with your own usual."/>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <TrendsBox go={go} className="h-full"/>
        <WeekFaces go={go} className="h-full"/>
      </div>
    </section>
  )
}

/* ── Today, in Live ─────────────────────────────────────────────────────── */

/* The student's latest real Mind Score on the rainbow, from the reading log
   (src/lib/readingLog.js, synced to their account). With no reading there is
   no dial: an empty day is not a calm one, so the card asks for a reading. */
function LiveToday({ go }) {
  const { entries, now } = useReadingLog()
  const last = entries[entries.length - 1]
  const todays = entries.filter(r => dayKey(r.at) === dayKey(now))

  if (!last) {
    return (
      <Panel className="flex flex-col items-center gap-2 py-8 text-center
        bg-gradient-to-b from-card via-card to-aqua">
        <p className="m-0 font-display text-row font-bold text-ink sm:text-head">No readings yet</p>
        <p className="m-0 max-w-[36ch] text-meta text-ink-2">
          Take a reading to see your {SCORE} here. It takes about a minute.</p>
        <Button className="mt-2" onClick={() => go('reading')}>Take a reading</Button>
      </Panel>
    )
  }

  const b = LOG_BAND[logBand(last.score)]
  const fresh = dayKey(last.at) === dayKey(now)
  const mean = todays.length ? Math.round(todays.reduce((a, r) => a + r.score, 0) / todays.length) : null
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
      <Panel className="relative flex flex-col items-center overflow-hidden text-center
        bg-gradient-to-b from-card via-card to-aqua shadow-[0_24px_48px_-32px_rgba(10,110,104,0.55)]">
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-[40%] h-[70%] w-[82%]
          -translate-x-1/2 -translate-y-1/2 rounded-[50%]
          bg-[radial-gradient(closest-side,rgba(10,110,104,0.14),rgba(10,110,104,0))]"/>
        <div className="relative flex w-full flex-col items-center">
          <p className="tick">{fresh ? 'Latest today' : 'Latest reading'}</p>
          <RainbowDial score={last.score} rings={ringsFor(last)} size={352} className="mt-1"/>
          <p className={cn('mt-3 font-display text-row font-bold sm:text-head', b.ink)}>{b.word}</p>
          <p className="mt-1 text-meta text-ink-2">
            {SOURCE[last.source].word} reading, {when(last.at, now)}.</p>
          {!fresh && <p className="mt-1 text-meta text-ink-2">No reading yet today.</p>}
          <TakeReading go={go}>{fresh ? 'Take another reading' : 'Take a reading'}</TakeReading>
        </div>
      </Panel>
      <Panel>
        <PanelHead title="Today's Readings" meta={todays.length ? `${todays.length} so far` : 'none yet'}/>
        {todays.length ? (
          <>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-gap font-bold tabular-nums text-ink">{mean}</span>
              <span className="text-fine text-ink-2">average today</span>
            </p>
            <ul className="m-0 mt-2 list-none p-0">
              {[...todays].reverse().map(r => (
                <li key={r.id} className="flex items-baseline justify-between gap-3 border-t border-rule py-2">
                  <span className="text-fine text-ink-2">
                    <span className="font-mono tabular-nums">{clock(r.at)}</span> · {SOURCE[r.source].word}
                    {r.pulse != null && <span className="tabular-nums text-ink-3"> · {r.pulse} bpm</span>}</span>
                  <span className="font-display text-ui font-bold tabular-nums text-ink">{r.score}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-meta text-ink-2">Your readings from today show here.</p>
        )}
        <SeeTrends go={go} className="mt-1"/>
      </Panel>
    </div>
  )
}

/* Live: the student's own readings, Today then Trends. Demo: the worked day. */
function StudentToday({ go, openTab }) {
  const [mode] = useMode()
  if (mode === 'real') {
    const open = route => (openTab ? openTab(route) : go(route))
    return (
      <div className="flex w-full flex-col gap-3 lg:gap-4">
        <Welcome/>
        <PartHead id="today-h" kind="today" title="Today" line={`${longDate()}. Your readings so far today.`}/>
        <LiveToday go={go}/>
        <SettleCard/>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          <ReachCard className="h-full"/>
          <WhatWorksCard className="h-full"/>
          <FeltCard go={open} className="h-full"/>
          <SharedCard go={go} className="h-full"/>
        </div>
        <TrendsPart go={go}/>
      </div>
    )
  }
  return <TodayDemo go={go} openTab={openTab}/>
}

/* One screen per route, no tab strip: the bar at the bottom of the app is the
   navigation. */
const PANES = { today: StudentToday, check: CheckBody, shared: SharingControls }

/* The shell's lines, held to a few words each. The sentence about what the
   screen is for is gone: the screen shows it. */
const COPY = {
  today: { note: 'These are demo figures. Nobody has been measured.',
           realNote: 'No patch is paired yet.' },
  check: {},
  shared: {},
}

export function Students({ go, tab = 'today' }) {
  const Pane = PANES[tab] || StudentToday
  const copy = COPY[tab] || {}
  return (
    <SectionShell go={go} sub={copy.sub} note={copy.note} realNote={copy.realNote}>
      <Pane go={go}/>
    </SectionShell>
  )
}
