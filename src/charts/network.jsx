import React from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  CONTEXT_WINDOWS, FEATURES, ORDINARY_LOGIT, PARAM_COUNT, SCORE_TEMPERATURE,
  displayScore, forward,
} from '../signals/tnam'
import { TNAM_RESULTS as R } from '../signals/tnam-results'
import { bandOf } from '../signals/score'
import { MOVE_LIMIT_G } from '../signals/motion'
import { SENSORS } from '../lib/sensors'
import { RuleDraw, ScrollIn } from '../ui/motion'
import { cn } from '../lib/utils'

/* The Mind Score model, drawn from the model.
 *
 * Nothing here is an illustration. The ten curves are the fitted shape
 * functions, read out of TNAM_RESULTS.shapes, which ml/research.py samples
 * from the same weights tnam.js runs; the marker on each is forward()'s own
 * contribution for the current input; the score is displayScore(). Refit the
 * model and this figure changes with it.
 *
 * Why an additive model is worth drawing at all: the logit is a bias plus one
 * curve per signal plus one term over the last four minutes, and nothing
 * else. So the decomposition below is not an attribution method and not an
 * estimate. It is the arithmetic, it closes to the last decimal place, and a
 * reader can check it. Almost no network allows that.
 *
 * Every number on screen is read out of TNAM_RESULTS or returned by the model
 * in this page. Paths are named beside each block so a reader who opens the
 * file can find the source of anything they doubt.
 *
 * What this file used to draw was a 4-16-10-1 network fitted to a hand
 * written reference formula rather than to data. It is gone, along with
 * src/signals/net.js.
 */

/* Human words for the ten inputs, plus the patch channel each belongs to.
   The feature keys are never shown: a reader should not have to know that
   edaTonic is the slow part of skin conductance to read the curve. Keyed by
   feature, so this cannot drift out of FEATURES order. */
const META = {
  rmssd:     { ch:'heart', name:'Beat-to-beat variation', unit:'RMSSD' },
  sdnn:      { ch:'heart', name:'Spread of beat spacing', unit:'SDNN' },
  pnn50:     { ch:'heart', name:'Long gaps between beats', unit:'pNN50' },
  lfhf:      { ch:'heart', name:'Slow against fast rhythm', unit:'LF / HF' },
  hr:        { ch:'heart', name:'Heart rate', unit:'beats per minute' },
  edaTonic:  { ch:'sweat', name:'Skin conductance', unit:'slow level' },
  edaPhasic: { ch:'sweat', name:'Skin conductance jumps', unit:'fast part' },
  scrPerMin: { ch:'sweat', name:'Sweat bursts per minute', unit:'count' },
  tempSlope: { ch:'temp',  name:'Temperature drift', unit:'skin, per minute' },
  motion:    { ch:'move',  name:'Movement', unit:'peak g' },
}
const ROWS = FEATURES.map((k, i) => ({ k, i, ...META[k], tone: SENSORS[META[k].ch].glow }))

/* Readings enter as z-scores against the wearer's own baseline and score.js
   clamps them at 3, so that is the slider range. Movement enters on the
   patch's own scale, where 1 is the MOVE_LIMIT_G line. */
const Z_LIMIT = 3
const dom = k => (k === 'motion' ? { min: 0, max: 1, step: 0.05 } : { min: -Z_LIMIT, max: Z_LIMIT, step: 0.1 })

/* The preceding windows the temporal term reads. `forward` keeps the last
   CONTEXT_WINDOWS - 1 of them, so seven steps toward the current reading is
   "this has been climbing for four minutes" and an empty list is "steady at
   this person's usual". */
const RAMP = [1, 2, 3, 4, 5, 6, 7].map(i => i / CONTEXT_WINDOWS)
const historyFor = (x, climbing) => (climbing ? RAMP.map(s => x.map(v => v * s)) : [])

/* Four readings, and the scores they produce under the real forward pass.
   Verified under node against this build of the weights:
     an ordinary day 50, under pressure 86, jogging 78, settling 32,
   with the preceding four minutes steady; 50, 98, 90, 31 climbing. */
const PRESETS = [
  { id:'ordinary', label:'An ordinary day', x:{} },
  { id:'hard', label:'Under pressure',
    x:{ hr:1.6, rmssd:-1.2, sdnn:-0.9, pnn50:-0.4, lfhf:0.6, edaTonic:2.0, edaPhasic:1.2, scrPerMin:1.4, tempSlope:-1.0, motion:0.05 } },
  { id:'jogging', label:'Jogging, not stressed',
    x:{ hr:2.2, rmssd:-1.4, sdnn:-1.0, pnn50:-0.5, lfhf:0.3, edaTonic:0.8, edaPhasic:0.4, scrPerMin:0.5, tempSlope:0.6, motion:1 } },
  { id:'settled', label:'Settling down',
    x:{ hr:-0.8, rmssd:1.2, sdnn:1.0, pnn50:0.5, lfhf:-0.5, edaTonic:-1.3, edaPhasic:-0.8, scrPerMin:-1.0, tempSlope:0.8, motion:0 } },
]
const vectorOf = o => FEATURES.map(k => o[k] ?? 0)

/* Every curve's value with every input at the wearer's usual. This is the
   reference the hairline in each plot marks, and the reference the score's 50
   is anchored to: displayScore puts ORDINARY_LOGIT at the middle of the
   scale, so what moves a score is each curve's distance from its own value
   here, not its absolute height. */
const USUAL = forward(FEATURES.map(() => 0)).contributions

const f2 = n => n.toFixed(2)
const f3 = n => n.toFixed(3)
const signed = n => (n >= 0 ? '+' : '') + n.toFixed(2)
const pct = n => `${(n * 100).toFixed(1)}%`
const ci = o => `${f3(o.lo)} to ${f3(o.hi)}`

function inWords(z) {
  const a = Math.abs(z)
  if (a < 0.4) return 'at their usual'
  if (a < 1.1) return z > 0 ? 'a little above usual' : 'a little below usual'
  if (a < 2.2) return z > 0 ? 'above usual' : 'below usual'
  return z > 0 ? 'well above usual' : 'well below usual'
}
/* Short enough to sit on one line in a phone-width cell. The sentence version
   goes to aria-valuetext, where there is no column to overflow. */
const shortReading = (k, v) => (k === 'motion' ? `${f2(v * MOVE_LIMIT_G)} g` : `${signed(v)} z`)
const longReading = (k, v) =>
  k === 'motion'
    ? `${f2(v * MOVE_LIMIT_G)} g peak, against the ${MOVE_LIMIT_G} g line`
    : `${signed(v)} standard deviations, ${inWords(v)}`

/* ── one small multiple ──────────────────────────────────────────────────
   1 SVG unit is not 1 pixel here: the plot carries no type, so it can scale
   freely and the labels around it stay DOM text at their declared size. Flat
   strokes, no gradient and no blur, per lib/sensors. */
const PW = 128, PH = 60, PL = 5, PR = 5, PT = 7, PB = 7

function plotGeometry(grid) {
  const x0 = grid.x[0], x1 = grid.x[grid.x.length - 1]
  let lo = Math.min(...grid.y), hi = Math.max(...grid.y)
  /* A tenth of the range of headroom, so a marker on an endpoint is still a
     whole dot inside the frame. Zero is NOT forced into view: four of the ten
     curves never cross it, and dragging them down to a zero line would
     flatten the shape the plot exists to show. The hairline carries the
     reference instead. */
  const pad = (hi - lo) * 0.12 || 0.1
  lo -= pad; hi += pad
  return {
    X: z => PL + ((z - x0) / (x1 - x0)) * (PW - PL - PR),
    Y: y => PH - PB - ((y - lo) / (hi - lo)) * (PH - PT - PB),
    x0, x1,
  }
}

function Curve({ row, z, contribution }) {
  const grid = R.shapes[row.k]
  const g = React.useMemo(() => plotGeometry(grid), [grid])
  const d = grid.x.map((x, i) => `${i ? 'L' : 'M'}${g.X(x).toFixed(2)} ${g.Y(grid.y[i]).toFixed(2)}`).join(' ')
  const usual = USUAL[row.k]
  const mx = g.X(Math.max(g.x0, Math.min(g.x1, z))), my = g.Y(contribution)
  /* The endpoints are named by the grid's own x values rather than by the
     slider range: the curves were sampled wider than a reading can go. */
  const lo = row.k === 'motion' ? 'no movement'
    : `${Math.abs(g.x0).toFixed(1)} standard deviations below usual`
  const hi = row.k === 'motion' ? 'the movement line'
    : `${Math.abs(g.x1).toFixed(1)} standard deviations above usual`
  const ends = `At ${lo} this curve contributes ${signed(grid.y[0])}, at their usual `
    + `${signed(usual)}, at ${hi} ${signed(grid.y[grid.y.length - 1])}. `
    + `The current reading contributes ${signed(contribution)}.`
  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} role="img"
      aria-label={`Learned curve for ${row.name.toLowerCase()}. ${ends}`}
      className="mt-1.5 block w-full" style={{ aspectRatio: `${PW} / ${PH}` }}>
      {/* the wearer's usual, which is where the scale's 50 comes from */}
      <line x1={PL} y1={g.Y(usual).toFixed(2)} x2={PW - PR} y2={g.Y(usual).toFixed(2)}
        strokeWidth="1" strokeDasharray="3 3" className="stroke-ruling"/>
      <line x1={mx.toFixed(2)} y1={PT - 3} x2={mx.toFixed(2)} y2={PH - PB + 3}
        strokeWidth="1" className="stroke-ruling"/>
      <path d={d} fill="none" stroke={row.tone} strokeWidth="2" strokeLinecap="round"
        strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      <circle cx={mx.toFixed(2)} cy={my.toFixed(2)} r="4.2" fill={row.tone}
        className="stroke-card" strokeWidth="1.8"/>
    </svg>
  )
}

/* ── the paired result, one line per held-out person ───────────────
   No type inside the SVG. An SVG scales with its column, and type inside one
   scales with it: the axis labels here were rendering at under 10px on a
   phone. The plot carries geometry only and every word around it is DOM text
   at its declared size, which is the same reason charts/diverge.jsx is built
   out of divs. */
const SW = 300, SH = 150
const SLEFT = 18, SRIGHT = 282, SLO = 0.55, SHI = 1.0, SPAD = 7
const sy = v => SH - SPAD - ((Math.max(SLO, v) - SLO) / (SHI - SLO)) * (SH - SPAD * 2)

function PairedPlot() {
  const mf = R.summary.formula.auroc.mean, mt = R.summary.tnam.auroc.mean
  const perfect = R.per_subject.filter(s => s.tnam >= 1).length
  const read = R.per_subject.map(s => `${s.subject} ${f3(s.formula)} to ${f3(s.tnam)}`).join(', ')
  return (
    <div className="mt-3 max-w-[560px]">
      <svg viewBox={`0 0 ${SW} ${SH}`} role="img"
        aria-label={`Leave-one-subject-out AUROC for each of the ${R.per_subject.length} people, `
          + `hand-weighted formula on the left and this model on the right: ${read}. `
          + `${perfect} of them reach 1.000 with this model.`}
        className="block w-full" style={{ aspectRatio: `${SW} / ${SH}` }}>
        {[0.6, 0.7, 0.8, 0.9, 1.0].map(v => (
          <line key={v} x1="0" y1={sy(v)} x2={SW} y2={sy(v)} strokeWidth="1" className="stroke-rule"/>
        ))}
        {R.per_subject.map(s => (
          <g key={s.subject}>
            <line x1={SLEFT} y1={sy(s.formula)} x2={SRIGHT} y2={sy(s.tnam)}
              strokeWidth="1.1" strokeOpacity="0.55" className="stroke-ink"/>
            <circle cx={SLEFT} cy={sy(s.formula)} r="2.6" fillOpacity="0.55" className="fill-ink"/>
            <circle cx={SRIGHT} cy={sy(s.tnam)} r="2.6" fillOpacity="0.55" className="fill-ink"/>
          </g>
        ))}
        {/* the two means, over the fifteen */}
        <line x1={SLEFT} y1={sy(mf)} x2={SRIGHT} y2={sy(mt)} strokeWidth="2.6" className="stroke-accent"/>
        <circle cx={SLEFT} cy={sy(mf)} r="4.4" className="fill-accent"/>
        <circle cx={SRIGHT} cy={sy(mt)} r="4.4" className="fill-accent"/>
      </svg>
      <p aria-hidden className="mt-1.5 flex justify-between gap-4 text-fine text-ink">
        <span>formula <span className="font-mono tabular-nums">{f3(mf)}</span></span>
        <span>this model <span className="font-mono tabular-nums">{f3(mt)}</span></span>
      </p>
    </div>
  )
}

/* ── one signed bar in the decomposition ─────────────────────────────────
   Phone order is label, figure, then the bar across both columns; from `sm`
   the three sit on one line. `order` reorders grid auto-placement, which is
   why the markup is in neither order. */
function Part({ label, value, tone, scale, note }) {
  const w = Math.max(1.2, (Math.abs(value) / scale) * 50)
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_4.25rem] items-center gap-x-3 gap-y-0.5
      border-t border-rule py-1.5 sm:grid-cols-[minmax(0,13rem)_minmax(5rem,1fr)_4.25rem]">
      <span className="order-1 text-fine text-ink-2">
        {label}
        {note && <span className="tick ml-2">{note}</span>}
      </span>
      <span aria-hidden className="relative order-3 col-span-2 block h-[13px]
        bg-[linear-gradient(to_right,transparent_calc(50%-0.5px),theme(colors.rule)_calc(50%-0.5px),theme(colors.rule)_calc(50%+0.5px),transparent_calc(50%+0.5px))]
        sm:order-2 sm:col-span-1">
        <span className="absolute top-[2px] block h-[9px] rounded-xs"
          style={{ width: `${w}%`, background: tone, [value >= 0 ? 'left' : 'right']: '50%' }}/>
      </span>
      <span className="order-2 text-right font-mono text-tick tabular-nums text-ink sm:order-3">
        {signed(value)}
      </span>
    </li>
  )
}

export function MindScoreNet({ className, initial = 'hard' }) {
  const reduced = useReducedMotion()
  const start = PRESETS.find(p => p.id === initial) || PRESETS[1]

  const [x, setX] = React.useState(() => vectorOf(start.x))
  const [active, setActive] = React.useState(start.id)
  const [climbing, setClimbing] = React.useState(false)
  const xRef = React.useRef(x)
  xRef.current = x
  const frame = React.useRef(0)
  React.useEffect(() => () => cancelAnimationFrame(frame.current), [])

  /* A preset is an argument, so it has to be watched arriving: the sliders
     travel to it and the score counts across the gap. One rAF loop over the
     whole vector rather than a spring per input. */
  const glide = target => {
    cancelAnimationFrame(frame.current)
    if (reduced) { setX(target.slice()); return }
    const from = xRef.current.slice()
    const t0 = performance.now()
    const step = t => {
      const p = Math.min(1, (t - t0) / 460)
      const e = 1 - Math.pow(1 - p, 3)
      setX(from.map((v, i) => v + (target[i] - v) * e))
      if (p < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }
  const setOne = (i, v) => {
    cancelAnimationFrame(frame.current)
    setActive(null)
    setX(prev => prev.map((old, k) => (k === i ? v : old)))
  }

  const fw = forward(x, historyFor(x, climbing))
  const score = displayScore(fw.logit)
  const band = bandOf(score)
  const curveSum = FEATURES.reduce((a, k) => a + fw.contributions[k], 0)
  const bias = fw.logit - curveSum - fw.temporal
  const scale = Math.max(0.4, ...ROWS.map(r => Math.abs(fw.contributions[r.k])), Math.abs(fw.temporal))

  /* The biggest move away from this person's usual, which is what the marker
     on each curve shows. Not the biggest contribution: a curve can sit high
     at the usual and still have moved nothing. */
  const moved = ROWS.map(r => ({ r, d: fw.contributions[r.k] - USUAL[r.k] }))
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0]
  const atLine = x[ROWS.findIndex(r => r.k === 'motion')] >= 1

  const i8 = R.calibration.ks.indexOf(8)
  const cal = {
    base: R.calibration.base_auroc.mean,
    gains: R.calibration.auroc.gains.triggered[i8],
    gainsCi: R.calibration.auroc_ci.gains.triggered[i8],
    scratch: R.calibration.auroc.scratch.triggered[i8],
    affine: R.calibration.auroc.affine.triggered[i8],
  }

  return (
    <ScrollIn className={cn('w-full', className)}>
      <figure className="m-0 rounded-panel border border-rule bg-card p-4 sm:p-7">

        <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="font-display text-row font-bold text-ink">What the model learned</h3>
          <p className="tick">{PARAM_COUNT} weights, running in this page</p>
        </figcaption>

        <p className="mt-3 max-w-[72ch] text-sec text-ink-2">
          One learned curve per signal, plus one term over the last four minutes, added up.
          The ten curves below are the fitted curves, not a sketch of them. Move a slider and
          the dot moves along the curve it belongs to.
        </p>

        {/* ── 1. the curves ───────────────────────────────────────────────── */}
        <ul className="mt-5 m-0 grid list-none grid-cols-2 gap-x-4 gap-y-4 p-0
          sm:grid-cols-3 lg:grid-cols-5">
          {ROWS.map(row => {
            const id = `mm-tnam-${row.k}`
            const d = dom(row.k)
            return (
              <li key={row.k} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <label htmlFor={id}
                    className="font-display text-fine font-medium leading-tight text-ink">
                    {row.name}
                  </label>
                  <span className="shrink-0 font-mono text-tick tabular-nums text-ink">
                    {signed(fw.contributions[row.k])}
                  </span>
                </div>
                <Curve row={row} z={x[row.i]} contribution={fw.contributions[row.k]}/>
                <input id={id} type="range" min={d.min} max={d.max} step={d.step}
                  value={x[row.i]} onChange={e => setOne(row.i, Number(e.target.value))}
                  aria-valuetext={`${longReading(row.k, x[row.i])}. Contributes `
                    + `${signed(fw.contributions[row.k])} to the logit.`}
                  style={{ '--mm-dot': row.tone }}
                  className="h-11 w-full cursor-pointer appearance-none bg-transparent
                    [&::-webkit-slider-runnable-track]:h-1.5
                    [&::-webkit-slider-runnable-track]:rounded-bar
                    [&::-webkit-slider-runnable-track]:bg-mist
                    [&::-webkit-slider-thumb]:-mt-[9px]
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:rounded-chip
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-card
                    [&::-webkit-slider-thumb]:bg-[var(--mm-dot)]
                    [&::-moz-range-track]:h-1.5
                    [&::-moz-range-track]:rounded-bar
                    [&::-moz-range-track]:bg-mist
                    [&::-moz-range-thumb]:h-6
                    [&::-moz-range-thumb]:w-6
                    [&::-moz-range-thumb]:appearance-none
                    [&::-moz-range-thumb]:rounded-chip
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-card
                    [&::-moz-range-thumb]:bg-[var(--mm-dot)]"/>
                <p className="tick -mt-0.5 flex justify-between gap-1">
                  <span>{shortReading(row.k, x[row.i])}</span>
                  <span>alone {f2(R.univariate_auroc[row.k])}</span>
                </p>
              </li>
            )
          })}
        </ul>

        <p className="mt-4 max-w-[78ch] text-fine text-ink-3">
          Dashed hairline: that curve at the wearer's usual. Dot: the current reading.{' '}
          <span className="font-mono">alone</span> is what the one signal scores by itself on
          the held-out people, from TNAM_RESULTS.univariate_auroc. Beat-to-beat variation on
          its own is near a coin toss and the slow part of skin conductance is near the whole
          answer. The model has to carry both. Each curve is drawn over the whole range it was
          sampled at, plus and minus four standard deviations; a reading enters clamped
          at {Z_LIMIT}, which is where the sliders stop.
        </p>

        {/* ── 2. live inputs and the score ─────────────────────────────────── */}
        <RuleDraw className="mt-6"/>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
          <div className="shrink-0">
            <p className="m-0 font-display text-dial font-bold leading-none tabular-nums text-ink">
              {score}
            </p>
            <p className="m-0 mt-1 font-display text-ui font-medium text-ink-2">
              Mind Score, {band.word}
            </p>
            <p className="tick mt-1">out of 100. 50 is this person's usual day.</p>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2.5">
              {PRESETS.map(p => (
                <button key={p.id} type="button" aria-pressed={active === p.id}
                  onClick={() => { setActive(p.id); glide(vectorOf(p.x)) }}
                  className={cn('inline-flex min-h-[44px] items-center rounded-field border px-3.5',
                    'font-display text-fine font-medium',
                    'transition-[background-color,border-color,color] duration-150 ease-[var(--ease-out)]',
                    'motion-safe:active:scale-[0.97] touch-manipulation',
                    active === p.id
                      ? 'border-ink bg-mist text-ink'
                      : 'border-rule text-ink-2 hoverOnly:border-ruling hoverOnly:bg-mist')}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <span className="font-display text-fine font-medium text-ink">
                The four minutes before:
              </span>
              {[[false, 'steady at usual'], [true, 'climbing to here']].map(([v, word]) => (
                <button key={word} type="button" aria-pressed={climbing === v}
                  onClick={() => setClimbing(v)}
                  className={cn('inline-flex min-h-[44px] items-center rounded-field border px-3.5',
                    'font-display text-fine font-medium',
                    'transition-[background-color,border-color,color] duration-150 ease-[var(--ease-out)]',
                    'motion-safe:active:scale-[0.97] touch-manipulation',
                    climbing === v
                      ? 'border-ink bg-mist text-ink'
                      : 'border-rule text-ink-2 hoverOnly:border-ruling hoverOnly:bg-mist')}>
                  {word}
                </button>
              ))}
            </div>
            <p className="mt-3 max-w-[66ch] text-fine text-ink-2">
              At these readings the model gives {score} out of 100, {band.word}. The biggest
              move away from this person's usual is {moved.r.name.toLowerCase()},{' '}
              {signed(moved.d)} on the logit. The last four minutes add {signed(fw.temporal)}.
            </p>
            {atLine && (
              <p className="mt-2 max-w-[66ch] text-fine text-ink">
                Movement is at the {MOVE_LIMIT_G} g line, so in the app this reading is not
                scored by the model at all. It goes to the hand-weighted formula, for the
                reason under the limits below.
              </p>
            )}
          </div>
        </div>

        {/* ── 3. the decomposition, which is exact ─────────────────────────── */}
        <h4 className="mark mt-7">Why it said that</h4>
        <p className="mt-3 max-w-[72ch] text-sec text-ink-2">
          Because the model is additive, the parts are the answer rather than an estimate of
          it. These twelve numbers add up to the logit the score came from, exactly.
        </p>
        <ul className="mt-4 m-0 max-w-[720px] list-none p-0">
          <Part label="Bias" value={bias} tone={SENSORS.heart.glow} scale={scale}
            note="the model's own offset"/>
          {ROWS.map(row => (
            <Part key={row.k} label={row.name} value={fw.contributions[row.k]} tone={row.tone}
              scale={scale} note={row.unit}/>
          ))}
          <Part label="The last four minutes" value={fw.temporal} tone={SENSORS.move.glow}
            scale={scale} note={`${CONTEXT_WINDOWS} windows`}/>
        </ul>
        <dl className="mt-4 m-0 max-w-[720px] grid grid-cols-[minmax(0,1fr)_5.5rem] gap-x-3
          border-t border-ink pt-3 text-fine">
          {[
            ['Added together, the logit', f2(fw.logit)],
            ['An ordinary day, every signal at usual', f2(ORDINARY_LOGIT)],
            ['The difference', signed(fw.logit - ORDINARY_LOGIT)],
          ].map(([k, v]) => (
            <React.Fragment key={k}>
              <dt className="text-ink-2">{k}</dt>
              <dd className="m-0 text-right font-mono tabular-nums text-ink">{v}</dd>
            </React.Fragment>
          ))}
          <dt className="mt-1 font-medium text-ink">Mind Score</dt>
          <dd className="m-0 mt-1 text-right font-mono font-medium tabular-nums text-ink">{score}</dd>
        </dl>
        <p className="mt-2 max-w-[72ch] text-fine text-ink-3">
          The difference is divided by {SCORE_TEMPERATURE}, put through a logistic and
          multiplied by 100. Monotone, so it cannot change which of two readings is the higher
          one; it is what puts an ordinary day at 50.
        </p>

        {/* ── 4. the evidence ─────────────────────────────────────────────── */}
        <h4 className="mark mt-7">What it scores</h4>
        <p className="mt-3 max-w-[72ch] text-sec text-ink-2">
          WESAD: {R.summary.formula.auroc.n} adults, wrist sensors, sixty second windows,
          stress against rest and amusement, leave-one-subject-out. Every number below is from
          people the model had never seen. The hand-weighted formula it replaces
          scores {f3(R.summary.formula.auroc.mean)} AUROC. This model
          scores {f3(R.summary.tnam.auroc.mean)}. It is better on {R.paired.wins} of
          the {R.summary.tnam.auroc.n} people, tied on {R.paired.ties}, worse on none,
          p = {R.paired.p}.
        </p>
        <PairedPlot/>
        <p className="mt-2 max-w-[78ch] text-fine text-ink-3">
          One line per held-out person, formula on the left and this model on the right. The
          vertical axis runs 0.55 at the bottom to 1.00 at the top, ruled every 0.1. The heavy
          line is the two means.{' '}
          {R.per_subject.filter(s => s.tnam >= 1).length} of the {R.per_subject.length} reach
          1.000, so those endpoints sit on top of each other. A clean 1.000 is what a set this
          small allows, and is not a claim about new people. The transfer numbers under the
          limits are the guide to that.
        </p>
        <dl className="mt-4 m-0 max-w-[720px] grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4
          gap-y-0 text-fine">
          <dt className="border-b border-rule py-2"/>
          <dd className="m-0 border-b border-rule py-2 text-right font-medium text-ink">formula</dd>
          <dd className="m-0 border-b border-rule py-2 text-right font-medium text-ink">this model</dd>
          {[
            ['AUROC', R.summary.formula.auroc, R.summary.tnam.auroc],
            ['F1', R.summary.formula.f1, R.summary.tnam.f1],
            ['Balanced accuracy', R.summary.formula.bacc, R.summary.tnam.bacc],
          ].map(([k, a, b]) => (
            <React.Fragment key={k}>
              <dt className="border-b border-rule py-2 text-ink-2">
                {k}<span className="tick ml-2">95% interval</span>
              </dt>
              <dd className="m-0 border-b border-rule py-2 text-right font-mono tabular-nums text-ink-2">
                {f3(a.mean)}<span className="tick block">{ci(a)}</span>
              </dd>
              <dd className="m-0 border-b border-rule py-2 text-right font-mono tabular-nums text-ink">
                {f3(b.mean)}<span className="tick block">{ci(b)}</span>
              </dd>
            </React.Fragment>
          ))}
        </dl>
        <p className="mt-2 max-w-[78ch] text-fine text-ink-3">
          Intervals are bootstrap percentiles over the {R.summary.tnam.auroc.n} held-out
          people, which is why this model's upper bound reads past 1.000: the bootstrap does
          not know that an AUROC cannot. The F1 gap carries p = {R.paired.f1_p}. {PARAM_COUNT}
          {' '}weights, counted off the shipped file by tnam.js itself.
        </p>

        {/* ── 5. the limits, same size as the results ──────────────────────── */}
        <h4 className="mark mt-7">What it does not do</h4>
        <ul className="mt-3 m-0 max-w-[72ch] list-none space-y-2.5 p-0 text-sec text-ink-2">
          <li>
            Everybody in every study above is an adult. The adolescent pilot has not reported.
            Nothing here has been shown to hold for a fifteen year old.
          </li>
          <li>
            On {R.transfer.subjects} new people under a stressor it never saw it
            scores {f3(R.transfer.cognitive.tnam.mean)} ({ci(R.transfer.cognitive.tnam)}), not
            0.997. The formula scores {f3(R.transfer.cognitive.formula.mean)} on the same
            people, so on a new population the advantage is gone.
          </li>
          <li>
            On the emotional film condition in that study it
            scores {f3(R.transfer.emotional.tnam.mean)} ({ci(R.transfer.emotional.tnam)}): it
            rates those windows below rest. That is a failure, not a thin margin. Across all
            of that study's stressors together it reads {f3(R.transfer.any_stress.tnam.mean)},
            which is chance.
          </li>
          <li>
            Movement fools it. On real jogging data the model alone
            calls {pct(R.confound.tnam_raw.physical_flagged)} of moving windows stressed,
            because the training set had no condition where somebody exercised calmly. Sending
            moving readings to the formula instead brings that
            to {pct(R.confound.tnam_fallback.physical_flagged)}, against the formula's
            own {pct(R.confound.formula.physical_flagged)}, and costs four points of the
            cognitive stress still caught, {pct(R.confound.tnam_raw.cognitive_caught)} down
            to {pct(R.confound.tnam_fallback.cognitive_caught)}. That is what the app ships,
            and it is why the reading above is held at the {MOVE_LIMIT_G} g line.
          </li>
          <li>
            Laughing still trips it: {pct(R.summary.tnam.amusement_false_alarm)} of amusement
            windows flagged, against the formula's{' '}
            {pct(R.summary.formula.amusement_false_alarm)}. Meditation is the part that got
            better, {pct(R.summary.formula.meditation_false_alarm)} down
            to {pct(R.summary.tnam.meditation_false_alarm)}.
          </li>
          <li>
            Over {R.exams.spearman_flagged_vs_grade.n} real exams it runs and
            drops {pct(R.exams.motion_rejected)} of windows for wrist movement, and how often
            it flagged somebody had no relationship to the grade they
            got: rho {f2(R.exams.spearman_flagged_vs_grade.rho)},
            p = {R.exams.spearman_flagged_vs_grade.p}. It does not predict performance.
          </li>
          <li>
            No patch has been built or worn. A Mind Score is not a diagnosis. It is one number
            out of 100 describing one reading against that person's own baseline.
          </li>
        </ul>

        {/* ── 6. personal calibration ──────────────────────────────────────── */}
        <h4 className="mark mt-7">Asking eight questions</h4>
        <p className="mt-3 max-w-[72ch] text-sec text-ink-2">
          The {f3(cal.base)} on new people is what the model does knowing nothing about them.
          Eight check-ins, asked when the displayed band changes rather than on a schedule, fit
          one gain per curve on top of the frozen model and take it
          to {f3(cal.gains)} ({f3(cal.gainsCi[0])} to {f3(cal.gainsCi[1])}). The same eight
          answers used to fit a model from scratch reach {f3(cal.scratch)}; moving the
          threshold alone reaches {f3(cal.affine)}, where it started. The curves are worth
          keeping. What a person needs is their own scale on them.
        </p>
        <p className="mt-2 max-w-[78ch] text-fine text-ink-3">
          From TNAM_RESULTS.calibration, on {R.transfer.subjects} new people, scored on the
          windows they were not asked about. Training code in the Conrad repo under ml/. The
          weights and results this figure reads are generated files and are not edited by hand.
        </p>
      </figure>
    </ScrollIn>
  )
}
