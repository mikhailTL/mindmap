import React from 'react'
import { SectionShell } from './shell'
import { FeltCard, Panel, PanelHead, SeeDetails, SharedCard, Stat, StudentBody,
  Why } from './Monitor'
import { CheckInBody } from './CheckIn'
import { SharingControls } from '../app'
import { Chevron } from '../ui/marks'
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
import { BAND, CROSSED, PEAK, READ, TAKEN_AT, TODAY, TODAY_SHORT, USUAL,
  WBAND, WEEK, WEEK_COUNT, clock12 } from './reading/demo'
import { cn } from '../lib/utils'
import { SCORE } from '../lib/terms'

/* The student app's Today screen, and the shell the three student tabs sit in.
 *
 * 16 OCTOBER, simplicity run. The screen is:
 *
 *   1. ONE CARD with the sentence and the dial, and beside it at 1280 the
 *      four live channels. At 390 the channels drop under the card. Tapping a
 *      ring on the dial opens that signal's working under the dial. Every
 *      sentence is ten words or fewer; the working behind the sentence is
 *      behind a "?".
 *   2. The settle card.
 *   3. ONE `See details` DISCLOSURE, collapsed, holding what moved the
 *      score, the day, the week, reach, what works, how today felt and who
 *      sees what, in two columns at 1280.
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
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
const pct = n => `${Math.round(n * 100)}%`

/* Tier bar beside the band word. Colour is never the only carrier: the word is
   the state, and the dial marks the reader's own usual day on the scale. */
const TIER_BAR = { low:'bg-calm', usual:'bg-calm', up:'bg-warn', high:'bg-crit' }

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

/* Design spec section 7c. The screen used to lead with "Today is 51, five
   above a usual 46, with heart furthest above its own normal", which is three
   numbers and is not a sentence anybody reads about their own day.
 *
 * What replaces it is plain, second person, and carries no figure. It is also
 * about the BODY and never about a feeling: MindMap measures four physical
 * signals and has never measured anxiety, mood or how a day felt, so a line
 * like "you are more anxious than usual" would be a claim this product cannot
 * make. Every branch below is generated from the same rings, normal band and
 * day series the rest of the screen draws, so the sentence stays true when the
 * data changes rather than being typed in beside it. */

const HOURS = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
               'eight', 'nine', 'ten', 'eleven']

/* "14:00" to "about two in the afternoon". Rounded to the hour on purpose: a
   reader is being told roughly when their day turned, not given a timestamp,
   and the exact clock time is printed under the day chart. */
function hourWords(t) {
  const [h, m] = String(t).split(':').map(Number)
  if (!Number.isFinite(h)) return 'earlier today'
  const near = (m >= 30 ? h + 1 : h) % 24
  const part = near < 12 ? 'this morning' : near < 17 ? 'this afternoon' : 'this evening'
  return `around ${HOURS[near % 12]} ${part}`
}

/* How far above its own normal, in words rather than in standard deviations,
   which is what the quieter second line owes a sixteen year old. */
const amountWords = n => (n >= 10 ? 'well above its own normal'
  : n >= 4 ? 'above its own normal' : 'just above its own normal')

function heroFor({ tier, rings, day, band, crossed }) {
  const top = topSignal(rings)
  const moved = rings.filter(r => over(r) > 0)
  const last = day.length ? day[day.length - 1].v : null
  const stillUp = last != null && band && last > band.hi
  /* Two things are true on this day and the sentence has to carry the one the
     reader cannot see for themselves. The day's line crossed above the usual
     range in the afternoon; the one capture under the sentence was taken
     earlier and sits inside that range. Neither cancels the other, so the
     sentence is about the day and says which range it crossed, and the figure
     under it is labelled as one reading with the time it was taken. */
  let lead
  if (tier.key === 'high' || tier.key === 'up')
    lead = crossed
      ? `Your score rose above usual ${hourWords(crossed)}.`
      : 'Your score is above your usual range today.'
  else if (tier.key === 'low')
    lead = 'Your score is below your usual range today.'
  else if (crossed && stillUp)
    lead = `Your score rose above usual ${hourWords(crossed)}.`
  else if (crossed)
    lead = 'Your score rose above usual earlier, then came back.'
  else if (moved.length)
    lead = `Your score is in range, but ${word(moved.length)} signal${moved.length === 1 ? '' : 's'} moved.`
  else
    lead = 'Your score is inside your usual range today.'
  const note = top && over(top) > 0
    ? `${nameOf(top)} moved the most, ${amountWords(over(top))}.`
    : 'All four signals stayed inside their normal ranges.'
  return { lead, note }
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

/* ── The week ───────────────────────────────────────────────────────────── */

/* Inside the range, above it, below it. Height on a printed scale is what says
   which, the figure is printed over every column and the range is a ruled zone
   behind all seven, so the fill is the third thing carrying it, never the
   first. Three fills from the green system: the brand green inside, warn above
   it, the turquoise below it. */
const dayFill = v => (v > WBAND.hi ? 'bg-warn' : v < WBAND.lo ? 'bg-beam' : 'bg-accent')

/* A column chart on a printed scale. The scale is the data's own extent
   widened to the nearest ten so a reader can read a height off the axis beside
   it, and it is not 0 to 100: on the full scale the whole week lands in a
   twenty-point sliver and every column is the same height again. The usual
   range is one continuous zone across all seven columns, ruled top and bottom
   in ink-3, which is 5.98 : 1 on card. */
const WSCALE = (() => {
  const vs = WEEK.map(d => d.v).concat([WBAND.lo, WBAND.hi])
  if (!vs.length) return { lo: 0, hi: 100 }
  return { lo: Math.max(0, Math.floor((Math.min(...vs) - 5) / 10) * 10),
           hi: Math.min(100, Math.ceil((Math.max(...vs) + 5) / 10) * 10) }
})()
const wy = v => {
  const span = WSCALE.hi - WSCALE.lo || 1
  return ((Math.max(WSCALE.lo, Math.min(WSCALE.hi, v)) - WSCALE.lo) / span) * 100
}
/* One cell. The three rows of the figure use the same cell geometry and the
   same gap, so the value above a column, the column and the day under it line
   up without a grid. */
const CELL = 'min-w-0 flex-1 max-w-[2.75rem]'
const TICKS = [WSCALE.hi, WBAND.hi, WBAND.lo, WSCALE.lo]

function WeekStrip() {
  const read = WEEK.map(d => `${d.d} ${Math.round(d.v)}`).join(', ')
  return (
    <figure className="m-0">
      {/* Three rows, one geometry. The axis gutter is w-8 with a gap-2 beside
          it, so the value row and the day row carry a 2.5rem left pad and
          every cell in all three rows is the same width. */}
      <div>
        <div aria-hidden className="flex items-end justify-between gap-1.5 pl-[2.5rem]">
          {WEEK.map(d => (
            <span key={d.d} className={cn(CELL, 'text-center text-fine tabular-nums text-ink')}>
              {Math.round(d.v)}</span>
          ))}
        </div>
        <div className="mt-1 flex gap-2">
          <div aria-hidden className="relative h-28 w-8 shrink-0 border-r border-ruling sm:h-32">
            {TICKS.map(v => (
              <span key={v} className="absolute right-1 translate-y-1/2 text-fine tabular-nums
                text-ink-3" style={{ bottom: `${wy(v)}%` }}>{v}</span>
            ))}
          </div>
          <div role="img" className="relative h-28 min-w-0 flex-1 border-b border-ruling sm:h-32"
            aria-label={`Seven days on a scale of ${WSCALE.lo} to ${WSCALE.hi}: ${read}. Your usual
              range for a week runs ${WBAND.lo} to ${WBAND.hi}, and ${WEEK_COUNT.above} of the seven
              days sat above it.`}>
            <span aria-hidden className="absolute inset-x-0 border-y border-ink-3 bg-aqua-2"
              style={{ bottom: `${wy(WBAND.lo)}%`, height: `${wy(WBAND.hi) - wy(WBAND.lo)}%` }}/>
            <div aria-hidden className="absolute inset-0 flex items-end justify-between gap-1.5">
              {WEEK.map(d => (
                <span key={d.d} className={cn(CELL, 'flex h-full items-end')}>
                  <span className={cn('w-full rounded-t-xs border', dayFill(d.v),
                    d.d === TODAY_SHORT ? 'border-ink' : 'border-ink-3')}
                    style={{ height: `${Math.max(2, wy(d.v))}%` }}/>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div aria-hidden className="mt-1 flex items-start justify-between gap-1.5 pl-[2.5rem]">
          {WEEK.map(d => {
            const today = d.d === TODAY_SHORT
            return (
              <span key={d.d} className={cn(CELL, 'text-center text-fine',
                today ? 'font-medium text-ink' : 'text-ink-2')}>{d.d}</span>
            )
          })}
        </div>
      </div>
      <figcaption className="note mt-2.5">
        The shaded zone is your usual range, {WBAND.lo} to {WBAND.hi}.
      </figcaption>
    </figure>
  )
}

/* A range on the 0 to 100 scale. Same grammar as RangeBar on the marketing
   pages: mist track, a darker block for the range, a solid mark for the figure
   and a hairline for the usual day. */
function BandBar({ low, high, score, usual, color }) {
  return (
    <div aria-hidden className="relative mt-2 h-5">
      <div className="absolute inset-x-0 top-1.5 h-2 rounded-xs bg-mist"/>
      <div className="absolute top-1.5 h-2 rounded-xs bg-ink-3/35"
        style={{ left: `${low}%`, width: `${high - low}%` }}/>
      {usual != null && <div className="absolute top-0 h-[20px] w-[2px] -translate-x-1/2 bg-ink"
        style={{ left: `${usual}%` }}/>}
      <div className={cn('absolute top-0 h-[20px] w-[4px] -translate-x-1/2 rounded-bar',
        !color && 'bg-accent')}
        style={{ left: `${score}%`, background: color || undefined }}/>
    </div>
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
        <div className="mt-3" role="img"
          aria-label={`${s.name} is ${ring.value} out of 100. Your own normal band runs
            ${band.lo} to ${band.hi}.`}>
          <p className="tick">Your normal band, {band.lo} to {band.hi}</p>
          <BandBar low={band.lo} high={band.hi} score={ring.value} color={tone}/>
        </div>
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
  const hero = heroFor({ tier, rings, day: DATA.day || [], band: BAND, crossed: CROSSED })
  const openRing = rings.find(r => r.id === picked)
  const moved = READ.contrib.map(c => ({
    label: c.label, x: Math.max(-1, Math.min(1, c.raw)),
  }))

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {/* THE FOLD. One card: the sentence, then the dial, then the band word.
          Beside it at 1280, the four live channels (design spec 0f rule 5).
          Everything the old card said under the dial is behind the "?". */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
        {/* The owner, 14 October: "add some gradients or cool effects to the
            cards to make it like a dashboard". The card runs card to aqua, a
            radial glow sits behind the dial, the clouds are back on, and the
            card lifts on a soft shadow. */}
        <Panel className="relative flex flex-col justify-center overflow-hidden
          bg-gradient-to-b from-card via-card to-aqua
          shadow-[0_24px_48px_-32px_rgba(10,110,104,0.55)]">
          <span aria-hidden className="pointer-events-none absolute left-1/2 top-[46%] h-[70%] w-[82%]
            -translate-x-1/2 -translate-y-1/2 rounded-[50%]
            bg-[radial-gradient(closest-side,rgba(10,110,104,0.14),rgba(10,110,104,0))]"/>
          <div className="relative flex flex-col items-center text-center">
            <p className="max-w-[30ch] font-display text-row font-bold leading-[1.14]
              tracking-tight text-ink sm:text-head">{hero.lead}</p>
            {/* 352 is a ceiling: the dial is w-full under it, so at 390 it
                takes the card's 318 and at 1280 the full 352. */}
            <RainbowDial className="mt-3" score={TODAY.score} usual={USUAL} rings={rings}
              size={352} picked={picked}
              onPick={id => setPicked(p => (p === id ? null : id))}/>
            <p className="mt-2 flex items-center gap-2 font-display text-ui font-medium text-ink">
              <span aria-hidden className={cn('h-4 w-[3px] shrink-0 rounded-bar', TIER_BAR[tier.key])}/>
              {cap(tier.word)}
            </p>
            <Why label="What this reading means" align="center" className="mt-2">
              {hero.note} {figureWords(TODAY.score, USUAL)}
            </Why>
          </div>
          {openRing && <SignalDetail ring={openRing}/>}
        </Panel>
        <LiveSignals/>
      </div>

      {/* The card no other product has: how long the body took to settle
          after each peak, and the climb before each marked event. From
          src/signals/recovery.js over the demo day. */}
      <SettleCard/>

      {/* ONE DISCLOSURE. Everything else is in here, collapsed, two abreast
          at 1280. */}
      <SeeDetails label="See details">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          {/* The working behind the one number. Every figure in here is
              returned by scoreCapture for the reading, not written in. */}
          <Panel className="lg:col-span-2">
            <PanelHead title="What Moved Your Score" meta={`${moved.length} inputs`}/>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-3" role="img"
                aria-label={`Today is ${TODAY.score}. The band runs ${READ.low} to ${READ.high} out
                  of 100. A usual day is ${USUAL}.`}>
                <Stat label="Likely range" value={`${READ.low} to ${READ.high}`} unit="out of 100"/>
                <BandBar low={READ.low} high={READ.high} score={TODAY.score} usual={USUAL}/>
              </div>
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

          {/* The week and, under it, how far this week's readings reached
              from the reader's own usual point: one column, so the two
              week-shaped cards sit together. */}
          <div className="flex flex-col gap-3 lg:gap-4">
          <Panel tone="aqua">
            <PanelHead title="Last Seven Days" meta="out of 100"/>
            <div className="mt-3">
              <WeekStrip/>
              <dl className="m-0 mt-3 grid grid-cols-3 gap-x-4 border-t border-rule pt-2.5">
                {[['Above', WEEK_COUNT.above], ['Inside', WEEK_COUNT.inside],
                  ['Below', WEEK_COUNT.below]].map(([label, n]) => (
                  <div key={label} className="min-w-0">
                    <dt className="tick">{label}</dt>
                    <dd className="m-0 mt-0.5 flex items-baseline gap-1.5 font-display
                      text-row font-medium tabular-nums leading-none text-ink">
                      {n}<span className="font-body text-fine font-normal text-ink-3">
                        {n === 1 ? 'day' : 'days'}</span></dd>
                  </div>
                ))}
              </dl>
              <button type="button" onClick={() => open('calendar')}
                className="group mt-2.5 flex min-h-[44px] w-full items-center gap-3 border-t
                  border-rule pt-2.5 text-left">
                <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink
                  transition-colors duration-150 groupHoverOnly:text-accent-ink">
                  Open the calendar</span>
                <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
              </button>
            </div>
          </Panel>
          <ReachCard/>
          <WhatWorksCard/>
          </div>

          <div className="flex flex-col gap-3 lg:gap-4">
          <FeltCard go={open}/>
          <SharedCard go={go}/>
          </div>
        </div>
      </SeeDetails>
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
  ['Your six answers', 'Scored on this phone. Nothing you type leaves it.'],
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
            <PanelHead title="What Stays on the Phone" meta="every way"/>
            <div className="mt-1.5"><Rows items={KEPT_HERE}/></div>
          </Panel>
        </div>
      </SeeDetails>
    </>
  )
}

/* Real mode has no honest zero for a score, a dial or a signal, so the
   unpaired screen in Monitor.jsx answers for the whole tab. */
function StudentToday({ go, openTab }) {
  const [mode] = useMode()
  if (mode === 'real') {
    /* The three device-only cards still have something true to say with no
       patch: no readings, today's marked events, and reach. */
    return (
      <div className="flex w-full flex-col gap-3 lg:gap-4">
        <StudentBody go={go} openTab={openTab}/>
        <SettleCard/>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          <ReachCard className="h-full"/>
          <WhatWorksCard className="h-full"/>
        </div>
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
