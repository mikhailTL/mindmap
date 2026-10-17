import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { Panel, PanelHead, SeeDetails, Stat, Why } from '../Monitor'
import { DayChart } from '../../charts/day'
import { Diverge } from '../../charts/diverge'
import { Bars, RainbowDial } from '../../charts/rainbow'
import { DATA } from '../../lib/assets'
import { studentRings } from '../../lib/readings'
import { SENSORS, SENSOR_ORDER } from '../../lib/sensors'
import { bandOf } from '../../signals/score'
import { SettleCard } from '../../toolkit/settle'
import { BAND, CROSSED, PEAK, READ, TAKEN_AT, TODAY, USUAL, clock12 } from '../reading/demo'
import { SCORE } from '../../lib/terms'
import { cn } from '../../lib/utils'
import { daySentence } from './sentence'
import { HeadsUpCard } from './HeadsUpCard'
import { TEEN } from './demoTeen'

/* The demo day in full: the dial with its sentence, Heads Up, the four live
 * channels, and the working behind the score. It used to be the student
 * home. The owner, 17 October: "data always goes under trends section", so
 * it lives on the Trends tab now and the home is navigation only.
 *
 * Where the figures come from:
 *   rings      src/lib/readings.js, each signal's own distance from this
 *              person's fourteen-day normal, on a 0 to 100 scale
 *   day, band  src/lib/assets.js, injected at build time
 *   the rest   src/views/reading/demo.js, where scoreCapture is run for real
 *              on the demo capture */

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
               'eight', 'nine', 'ten']
const word = n => WORDS[n] ?? String(n)
const pct = n => `${Math.round(n * 100)}%`

const nameOf = r => SENSORS[r.id]?.name || r.name || ''
/* How far a signal sits above the top of its own normal band. Negative means
   it is still inside it. */
const over = r => r.value - (r.band?.hi ?? 100)
const topSignal = rings => [...rings].sort((a, b) => over(b) - over(a))[0]

const amountWords = n => (n >= 10 ? 'well above its own normal'
  : n >= 4 ? 'above its own normal' : 'just above its own normal')

function signalNote(rings) {
  const top = topSignal(rings)
  return top && over(top) > 0
    ? `${nameOf(top)} moved the most, ${amountWords(over(top))}.`
    : 'All four signals stayed inside their normal ranges.'
}

function compareWords(score, usual) {
  const d = score - usual
  if (d === 0) return 'The score is level with your usual day.'
  return `The score is ${word(Math.abs(d))} ${d > 0 ? 'above' : 'below'} your usual day.`
}

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
   a measurement. `lo` and `hi` are a fixed y-domain per channel. */
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

function LiveSignals({ className }) {
  const reduced = useReducedMotion()
  const i = useStream(!reduced)
  return (
    <Panel className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHead title="Live Signals" meta={reduced ? 'motion off' : 'demo stream'}
          className="min-w-0 flex-1"/>
        <Why label="What the live signals show" className="pt-1.5">
          Each line updates as the patch sends. The figures are generated for this demo.
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

const MOVED_SUB = {
  quality: 'of the pulse trace was clean',
  scored: 'the formula scores a moving reading',
}

/** The demo's today on the Trends tab: the dial and its sentence, Heads Up and
    the live signals, with the working behind one disclosure. */
export function DemoTodayDetail({ go }) {
  const rings = studentRings()
  const [picked, setPicked] = React.useState(null)
  const tier = bandOf(TODAY.score)
  const top = topSignal(rings)
  const said = daySentence({ day: DATA.day || [], band: BAND })
  const openRing = rings.find(r => r.id === picked)
  const moved = READ.contrib.map(c => ({
    label: c.label, x: Math.max(-1, Math.min(1, c.raw)),
  }))

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
        <Panel className="relative flex flex-col justify-center overflow-hidden
          bg-gradient-to-b from-card via-card to-aqua lg:row-span-2">
          <div className="relative flex flex-col items-center text-center">
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

      <SeeDetails label="See today in detail">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          <SettleCard className="lg:col-span-2"/>
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
        </div>
      </SeeDetails>
    </div>
  )
}
