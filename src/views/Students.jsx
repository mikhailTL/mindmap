import React from 'react'
import { SectionShell } from './shell'
import { ActionRow, Fact, FeltCard, Greeting, Panel, PanelHead, SeeDetails, SharedCard,
  Stat, StudentBody } from './Monitor'
import { CheckInBody } from './CheckIn'
import { SharingControls } from '../app'
import { Chevron } from '../ui/marks'
import { DayChart } from '../charts/day'
import { Diverge } from '../charts/diverge'
import { Bars, RainbowDial, RainbowKey } from '../charts/rainbow'
import { DATA } from '../lib/assets'
import { useMode } from '../lib/mode'
import { studentRings } from '../lib/readings'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { MOVE_LIMIT_G } from '../signals/motion'
import { bandOf } from '../signals/score'
/* The demo reading and everything derived from it live in one module, so this
   screen and the calendar cannot print two different numbers for the same
   Thursday. */
import { BAND, CROSSED, DEMO_MOTION, PEAK, READ, TAKEN_AT, TODAY, TODAY_SHORT, USUAL,
  WBAND, WEEK, WEEK_COUNT, clock12 } from './reading/demo'
import { cn } from '../lib/utils'
import { SCORE } from '../lib/terms'

/* The student app's Today screen, and the shell the three student tabs sit in.
 *
 * WHAT THE 13 OCTOBER BATCH CHANGED HERE (design spec 0d section 6, 0e
 * sections 14 and 17). The screen was thirteen modules in a twelve-column
 * grid, all of them open, with the dial in a five-column card beside a
 * seven-column stack of working. The owner's verdict was that the text and the
 * boxes were too big, that the dial belonged in the centre rather than to one
 * side, and that everything under it belonged behind one control.
 *
 * So the screen is now:
 *
 *   1. ONE CENTRED CARD above the fold: the sentence, then the dial under it,
 *      then the band word and how today compares with a usual day. Nothing
 *      else. The card is capped at 34rem and centred at every width, so the
 *      dial is in the middle of the screen on a phone and on a laptop.
 *   2. ONE `See details` DISCLOSURE, collapsed, holding the live signal
 *      traces, the four bands, the week, what moved the reading and the day.
 *   3. The action row and the two consent modules under it, outside the
 *      disclosure, because they are not readings.
 *
 * LIVE TRACES. In the demo the four traces stream: `LIVE` below is four
 * periodic series and the window walks them, so a trace moves the way a
 * channel being written once a second moves. It is generated and the caption
 * says so; no patch has been built or worn. `prefers-reduced-motion` stops the
 * walk and the card says it is paused.
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
  const part = near < 12 ? 'in the morning' : near < 17 ? 'in the afternoon' : 'in the evening'
  return `about ${HOURS[near % 12]} ${part}`
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
      ? `Your day has been above your usual range since ${hourWords(crossed)}.`
      : 'Your body is working harder than usual today.'
  else if (tier.key === 'low')
    lead = 'Today is calmer than your last two weeks.'
  else if (crossed && stillUp)
    lead = `Your day has been above your usual range since ${hourWords(crossed)}.`
  else if (crossed)
    lead = `Your day went above your usual range ${hourWords(crossed)} and is back inside it now.`
  else if (moved.length)
    lead = 'Your body is working a little harder than usual today.'
  else
    lead = 'Today looks like an ordinary day for you.'
  const note = top && over(top) > 0
    ? `${nameOf(top)} moved the most today, ${amountWords(over(top))}.`
    : 'All four signals stayed inside their own normal ranges today.'
  return { lead, note }
}

/* The comparison the old sentence carried, kept under the dial so no figure is
   lost: how far today sits from a usual day. */
/* The dial prints the usual day under itself, so this line names the distance
   and not the figure again. */
function compareWords(score, usual) {
  const d = score - usual
  if (d === 0) return 'Level with a usual day for you.'
  return `${cap(word(Math.abs(d)))} ${d > 0 ? 'above' : 'below'} a usual day for you.`
}

/* Whether the capture the screen is showing was taken before the day crossed
   above the usual range. Worked out from the two clocks rather than written
   into the copy, because it is the fact that stops the sentence above and the
   band word under the dial from looking like they disagree. */
const READ_BEFORE_RISE = !!(CROSSED && String(TAKEN_AT) < String(CROSSED))

function figureWords(score, usual) {
  const c = compareWords(score, usual)
  return READ_BEFORE_RISE
    ? `This reading was taken at ${TODAY.clock}, before your day went above the range. ${c}`
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
  return (
    <svg viewBox={`0 0 ${TW} ${TH}`} aria-hidden preserveAspectRatio="none"
      className={cn('block h-11 w-full', className)}>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"
        strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} vectorEffect="non-scaling-stroke"/>
    </svg>
  )
}

/* The four channels as they arrive. The figure beside each name is the last
   sample in that channel's window, so the number and the end of the line are
   the same reading. */
function LiveSignals({ rings }) {
  const reduced = useReducedMotion()
  const i = useStream(!reduced)
  const byId = Object.fromEntries(rings.map(r => [r.id, r]))
  return (
    <Panel>
      <PanelHead title="Four Channels, As Written"
        meta={reduced ? 'motion off' : 'streaming'}/>
      <p className="mt-2 max-w-[56ch] text-fine text-ink-2">
        One sample a second, on each channel&rsquo;s own scale. The figure is the newest sample.
      </p>
      <ul className="m-0 mt-2.5 grid list-none grid-cols-2 gap-2.5 p-0 lg:grid-cols-4">
        {SENSOR_ORDER.map(id => {
          const s = SENSORS[id]
          const L = LIVE[id]
          const w = Array.from({ length: WIN }, (_, k) => L.series[(i + k) % LIVE_N])
          const now = w[w.length - 1]
          const ring = byId[id]
          return (
            <li key={id} className="min-w-0 rounded-panel border border-rule bg-card p-2.5">
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
              <LiveTrace className="mt-1.5" data={w} lo={L.lo} hi={L.hi} color={s.glow}/>
              {ring && <p className="mt-1 text-fine text-ink-2">{direction(ring).word}</p>}
            </li>
          )
        })}
      </ul>
      <p className="note mt-2.5 max-w-[56ch]">
        Generated for the demo. No patch has been built or worn, so nothing on this card was
        measured from anybody.
      </p>
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
      <figcaption className="note mt-2.5 max-w-[52ch]">
        Each day out of 100, on the scale printed down the left. The ruled zone is your usual range
        for a week, {WBAND.lo} to {WBAND.hi}.
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

/* The four bands, and the one that is open. This was four cards in a row,
   which at 390 is a run of four identical boxes; it is one 56px-row list with
   the open signal's working under it, which is the shape design spec 0e
   section 14 asks for where a desktop grid would become a column of clones. */
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
    <div className="mx-auto flex w-full max-w-[60rem] flex-col gap-3 lg:gap-4">
      {/* ONE CENTRED CARD. The sentence, then the dial under it, then the band
          word and the comparison with a usual day. Nothing else above the
          fold: design spec 0d section 6. */}
      <Panel className="mx-auto w-full max-w-[34rem]">
        <Greeting items={[TODAY.day, `Read at ${TODAY.clock}`]}/>
        <div className="mt-3 flex flex-col items-center text-center">
          <p className="max-w-[30ch] font-display text-row font-bold leading-[1.14]
            tracking-tight text-ink sm:text-head">{hero.lead}</p>
          <p className="mt-1.5 max-w-[42ch] text-fine text-ink-2">{hero.note}</p>
          {/* weather off: the clouds are a gradient, and a gradient is on the
              AI-tell list everywhere but a photograph. */}
          <RainbowDial className="mt-3" score={TODAY.score} usual={USUAL} rings={rings}
            size={296} weather={false} picked={picked} onPick={id => setPicked(p => (p === id ? null : id))}/>
          <p className="mt-2 flex items-center gap-2 font-display text-ui font-medium text-ink">
            <span aria-hidden className={cn('h-4 w-[3px] shrink-0 rounded-bar', TIER_BAR[tier.key])}/>
            {cap(tier.word)}
          </p>
          <p className="mt-1 max-w-[42ch] text-fine text-ink-2">{figureWords(TODAY.score, USUAL)}</p>
        </div>
      </Panel>

      {/* ONE DISCLOSURE. Everything else is in here, collapsed. */}
      <SeeDetails label="See details"
        sub="Live channels, the four bands, the week, and what moved the reading">
        <div className="flex flex-col gap-3 lg:gap-4">
          <LiveSignals rings={rings}/>

          <Panel>
            <PanelHead title="Each Band, Out of 100" meta="tap a signal"/>
            <p className="mt-2 max-w-[56ch] text-fine text-ink-2">Each band on the dial is one
              signal&rsquo;s distance from your own last two weeks. The middle number blends all
              four, so the bands do not add up to it.</p>
            <RainbowKey rings={rings} picked={picked} onPick={setPicked} className="mt-2.5"/>
            {openRing && <SignalDetail ring={openRing}/>}
          </Panel>

          <Panel tone="aqua">
            <PanelHead title="Last Seven Days" meta="out of 100"/>
            <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-5">
              <WeekStrip/>
              <div className="mt-3 border-t border-rule pt-2.5 lg:mt-0 lg:border-l lg:border-t-0
                lg:pl-5 lg:pt-0">
                <p className="tick">Against {WBAND.lo} to {WBAND.hi}, your usual range for a week</p>
                <dl className="m-0 mt-1">
                  {[['Above it', WEEK_COUNT.above], ['Inside it', WEEK_COUNT.inside],
                    ['Below it', WEEK_COUNT.below]].map(([label, n]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3
                      border-b border-rule py-2 last:border-b-0">
                      <dt className="min-w-0 text-fine text-ink-2">{label}</dt>
                      <dd className="m-0 flex shrink-0 items-baseline gap-1.5 font-display
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
            </div>
          </Panel>

          {/* The working behind the one number, and the terms that moved it,
              in one card rather than two: every figure in here is returned by
              scoreCapture for the reading, not written into the copy. */}
          <Panel>
            <PanelHead title="What Moved the Reading" meta={`${moved.length} terms used`}/>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-3" role="img"
                aria-label={`Today is ${TODAY.score}. The band runs ${READ.low} to ${READ.high} out
                  of 100. A usual day is ${USUAL}.`}>
                <Stat label="Likely range" value={`${READ.low} to ${READ.high}`} unit="out of 100"/>
                <BandBar low={READ.low} high={READ.high} score={TODAY.score} usual={USUAL}/>
                <p className="mt-1 text-fine text-ink-2">Today is {TODAY.score}, give or take
                  {' '}{READ.half}. Thick mark is today, hairline is a usual day.</p>
              </div>
              <Stat label="Your normal" value={READ.baselineDays} unit="days"
                sub="of your own readings behind the comparison"/>
              <Stat label="Signal quality" value={pct(READ.quality)}
                sub="of the pulse trace was clean enough to use"/>
              <Stat label="Movement" value={DEMO_MOTION.peak.toFixed(2)} unit="g"
                sub={`under the ${MOVE_LIMIT_G} g line, so the rise is counted rather than put down to exercise`}/>
              <Stat label="Scored by" value={READ.model.scored ? 'The model' : 'The formula'}
                sub="a reading taken while moving is scored by the plain formula instead"/>
              <Stat label="Moved most" value={nameOf(top)}
                sub={`${over(top)} above the top of its own normal band`}/>
              <Stat label="Voice" value={READ.missing.includes('voice') ? 'Not used' : 'Used'}
                sub="a patch has no microphone, which is part of why the range is wide"/>
            </div>
            <div className="mt-3 border-t border-rule pt-2.5">
              <p className="max-w-[64ch] text-fine text-ink-2">How far each term pushed
                today&rsquo;s number, and which way. Right of the centre line raised it, left of it
                lowered it.</p>
              <div className="mt-2.5"><Diverge items={moved}/></div>
              <p className="mt-2 max-w-[56ch] text-fine text-ink-2">Voice adds four more terms,
                from pitch and loudness. A patch has no microphone, so they are missing here, which
                is part of why the likely range is as wide as it is.</p>
            </div>
          </Panel>

          <Panel tone="aqua">
            <PanelHead title={`${SCORE} Through the Day`} meta="07:00 to 16:00"/>
            <p className="mt-2 max-w-[56ch] text-fine text-ink-2">One point every ten minutes, on
              the same 0 to 100 scale as the dial. The shaded band is your usual range for a day,
              {' '}{BAND.lo} to {BAND.hi}.</p>
            <DayChart data={DATA.day} band={DATA.band}/>
            <dl className="m-0 mt-2.5 grid grid-cols-1 gap-y-1 border-t border-rule pt-2.5
              sm:grid-cols-2 sm:gap-x-5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-fine text-ink-2">Today&rsquo;s reading was taken at</dt>
                <dd className="m-0 shrink-0 text-fine tabular-nums text-ink">{TODAY.clock}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-fine text-ink-2">Your normal range</dt>
                <dd className="m-0 shrink-0 text-fine tabular-nums text-ink">
                  {BAND.lo} to {BAND.hi}</dd>
              </div>
              {CROSSED && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-fine text-ink-2">Above that range from</dt>
                  <dd className="m-0 shrink-0 text-fine tabular-nums text-ink">
                    {clock12(CROSSED)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-fine text-ink-2">Highest point of the day</dt>
                <dd className="m-0 shrink-0 text-fine tabular-nums text-ink">
                  {PEAK.v} at {clock12(PEAK.t)}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </SeeDetails>

      <ActionRow go={open}/>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <FeltCard go={open} className="h-full"/>
        <SharedCard go={go} className="h-full"/>
      </div>
    </div>
  )
}

/* ── Take a reading ─────────────────────────────────────────────────────── */

/* Both lists are the engine read back, not copy: every row names something
   scoreCapture returns or something the capture screens drop on the device. */
const GIVES = [
  ['One number, 0 to 100',
   'Measured against your own normal, never another student. Under 35 is easier than usual, 73 and over is high.'],
  ['A likely range around it',
   'It widens when a channel is missing, when the pulse trace is noisy, or when your own normal is still being built.'],
  ['Which terms moved it',
   'Every term the reading used, how far it pushed the number, and which way.'],
  ['Whether you were moving',
   `Over ${MOVE_LIMIT_G} g the reading is kept and scored, but a moving reading is not counted as a stressed one.`],
]

const KEPT_HERE = [
  ['Camera frames', 'Turned into numbers on this phone and dropped. Never stored and never sent.'],
  ['Anything the microphone hears', 'Turned into pitch and steadiness figures here, then dropped.'],
  ['Your six answers', 'Scored on this device. Nothing typed leaves it.'],
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

/* The chooser is three short cards and then the fold. These two modules say
   what the three cards cannot: what the engine hands back whichever route is
   taken, and what the capture drops. They sit behind one disclosure, below the
   fold and out of the way of somebody holding the phone. */
function CheckBody({ go }) {
  return (
    <>
      <CheckInBody go={go}/>
      <SeeDetails className="mt-8" label="See details"
        sub="What a reading gives back, and what never leaves the phone">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          <Panel className="h-full">
            <PanelHead title="What a Reading Gives Back" meta="any route"/>
            <div className="mt-1.5"><Rows items={GIVES}/></div>
          </Panel>
          <Panel className="h-full">
            <PanelHead title="What Never Leaves the Phone" meta="all routes"/>
            <div className="mt-1.5"><Rows items={KEPT_HERE}/></div>
          </Panel>
        </div>
      </SeeDetails>
    </>
  )
}

/* Real mode has no honest zero for a score, a dial or a signal, so the
   unpaired screen in Monitor.jsx answers for the whole tab rather than drawing
   the dial at 0, which is a calm day and a real measurement. */
function StudentToday({ go, openTab }) {
  const [mode] = useMode()
  if (mode === 'real') return <StudentBody go={go} openTab={openTab}/>
  return <TodayDemo go={go} openTab={openTab}/>
}

/* One screen per route, no tab strip. The strip here listed Today, Take a
   reading and Who sees what, which is what the bar at the bottom of the app
   already offers. The bar won. */
const PANES = { today: StudentToday, check: CheckBody, shared: SharingControls }

const COPY = {
  today: { sub: 'Today in one sentence, with everything behind See details.',
           note: 'Every figure on this screen is generated. Take a reading scores your own answers for real.',
           realNote: 'No patch is paired, so today has no reading yet.' },
  check: { sub: 'About a minute, whichever way you pick. All three land on the same 0 to 100 scale.' },
  shared: { sub: 'What leaves your phone, and what never does.' },
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
