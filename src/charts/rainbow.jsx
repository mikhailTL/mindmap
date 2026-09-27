import React from 'react'
import { Chevron } from '../ui/marks'
import { Card, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { SENSORS } from '../lib/sensors'
import { cn } from '../lib/utils'

/* The score, drawn as concentric rings — one per sensor, each filled on its
   own 0-to-100 scale, with the overall score in the middle.
 *
 * Two rules this file exists to hold:
 *
 * 1. The rings are decoration for the eye; the list below them is the control.
 *    A 12-unit ring stroke is a 20px tap target at any sane dial size, which is
 *    half the legal minimum, so the rings are aria-hidden and every ring has a
 *    full-width row underneath that is focusable, 56px tall and named. Clicking
 *    a ring still works — it just is not the only way in.
 * 2. The centre number is not the average of the rings and must never be
 *    described as one. The engine blends four z-scores through a logistic; a
 *    reader who adds the rings up and gets a different figure has found a
 *    contradiction, so the panel says what the number actually is.
 */

/* Geometry of the arch. (A second geometry note used to sit above this one,
   still describing the concentric dial and its 85-unit outer edge — numbers
   that no longer exist in this file. Two contradictory specs for the same
   constants is worse than one, so the dead one is gone.)
 *
 * Four bands that TOUCH — 18 units thick, centres 18 apart, so band edges meet
 * exactly and the whole thing reads as one object rather than four rings with
 * air between them. A hairline of paper between them keeps the boundaries
 * legible without opening a gap.
 *
 * Red outside, blue inside, which is the order a real rainbow puts them in.
 *
 * The interior of the arch is a half-disc of radius 76, which is what holds the
 * score. A three-digit number at the display step needs about 87px of the 152
 * that radius gives at the default width. */
/* VH was 206, which put the baseline 38 units under the feet: enough for two
   labels and nothing else. The clouds sit ON the feet now and one of them
   rains, so the box is 18 units taller. Nothing else moved: CX, CY and the
   radii are untouched, so the arch draws exactly where it always did and only
   the strip beneath it grew. */
const VW = 320, VH = 224, CX = 160, CY = 168
const BAND = 16
const RADII = [139, 121, 103, 85]       // outside in: heart, sweat, temp, move

const pol = (r, deg) => [CX + r * Math.cos(deg * Math.PI / 180), CY + r * Math.sin(deg * Math.PI / 180)]
/* 180° is the left foot, 360° the right; increasing angle sweeps up and over. */
function arcPath(r, pct) {
  const to = 180 + 180 * Math.max(0.0001, Math.min(1, pct / 100))
  const [x1, y1] = pol(r, 180), [x2, y2] = pol(r, to)
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

/* ── Weather on the arch ────────────────────────────────────────────────
   The two ends of the scale get weather: a white cloud sitting still over the
   calm foot, a dark one raining over the peak foot. It is the one piece of the
   interface that is there to be liked rather than read, which is why it is
   drawn last, announced to nobody, and never placed where a figure goes.

   It sits in the two upper corners, not on the arch. The first attempt masked
   the clouds to the band, which is what a single-band arch would want; this
   arch is four concentric bands filling the whole annulus, and every band
   paints its own full-length mist track, so a cloud behind them was invisible
   and a cloud in front of them covered the reading. The corners above each
   foot are the only empty space in the box, and they are directly above the
   ends they belong to, so the association still reads.

   Both animations stop under reduced motion. The clouds stay. */
/* One silhouette, not three overlapping ellipses. The ellipse version needed
   an outline to be visible on near-white paper, and outlining three ellipses
   draws the seams where they overlap: the calm cloud came out looking like a
   pair of spectacles. A single closed path has one edge. */
const CLOUD = 'M0 18 C0 12 5 9 9 10 C10 3 18 0 24 4 C28 0 36 2 37 8 C43 8 46 13 44 18 Z'

/* Weather is grey and blue, not green. The first pass painted the storm cloud
   in ink-2 and the rain in the turquoise, which put two more greens next to an
   arch whose entire job is to be red, orange, green and blue in that order,
   and the green cloud read as a fifth band. These four values belong to no
   token and are not meant to: like the sensor hues in lib/sensors.js they are
   drawing colours, chosen against paper and used flat.
     rule  #6f7d88  4.03 on paper, the calm cloud's edge
     storm #5a6773  5.52 on paper
     rain  #2f7fd0  3.94 on paper, clear of the 3 : 1 a graphic needs */
const SKY = { edge:'#6f7d88', storm:'#5a6773', rain:'#2f7fd0' }

function Cloud({ x, y, k, fill, stroke }) {
  return (
    <path d={CLOUD} fill={fill} stroke={stroke} strokeWidth={stroke ? 1.6 / k : 0}
      strokeLinejoin="round" transform={`translate(${x} ${y}) scale(${k})`}/>
  )
}

export function ArchWeather() {
  return (
    <g aria-hidden style={{ pointerEvents:'none' }}>
      {/* Both clouds sit ON the feet, wide enough to swallow the ends of all
          four bands, which is the shape the drawing is quoting: the arch
          springs out of a cloud at each end rather than floating above two of
          them. They are drawn after the bands for exactly that reason, so a
          band terminates inside its cloud instead of running past it.

          The left foot spans x 13 to 83 and the right 237 to 307. Each cloud
          is 85 wide and overhangs its own foot on the outside, because the
          coloured arcs are round capped and a cap bulges half a band past the
          end of the arc. An earlier pass sized the clouds to the feet exactly
          and the red band's cap printed below the left one. */}
      <g className="mm-drift">
        <Cloud x={1} y={149} k={1.85} fill="#ffffff" stroke={SKY.edge}/>
      </g>
      <g className="mm-drift mm-drift-slow">
        <Cloud x={234} y={149} k={1.85} fill={SKY.storm}/>
      </g>
      {/* Rain, in the strip the taller box opened up under the peak foot. */}
      <g className="mm-rain" stroke={SKY.rain} strokeWidth="3.4" strokeLinecap="round">
        <line x1="252" y1="184" x2="248" y2="196"/>
        <line x1="270" y1="186" x2="266" y2="198"/>
        <line x1="288" y1="184" x2="284" y2="196"/>
      </g>
    </g>
  )
}

function useCount(value, on = true) {
  const [shown, setShown] = React.useState(on ? 0 : value)
  React.useEffect(() => {
    if (!on || matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return }
    let raf, t0
    const step = t => { t0 ??= t
      const p = Math.min(1, (t - t0) / 1000)
      setShown(value * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, on])
  return shown
}

/* Flat, opaque, round-ended. No blur, no gradient, no partial opacity: a
   blurred copy under a band makes the edge look out of focus, and a gradient
   spends half the band's length being a duller version of its own colour.
   One solid paint at full strength is both brighter and sharper. */
function Band({ r, glow, pct, dim }) {
  const shown = useCount(pct)
  return (
    <g opacity={dim ? 0.24 : 1} className="transition-opacity duration-200"
      style={{ pointerEvents: 'none' }}>
      <path d={arcPath(r, 100)} fill="none" strokeWidth={BAND} className="stroke-mist"/>
      <path d={arcPath(r, shown)} fill="none" strokeWidth={BAND} strokeLinecap="round" stroke={glow}/>
    </g>
  )
}

export function RainbowDial({ score, usual, rings, onPick, picked, size = 320, className }) {
  const shown = Math.round(useCount(score))
  const boxRef = React.useRef(null)
  /* Hit-testing the arcs themselves was not reliable: a filtered sibling's hit
     area is its whole filter region, and Chromium would not test a stroke
     painted transparent. Working out which band was clicked from the geometry
     is both dependable and more forgiving — anywhere in the band's annulus
     counts, not just the drawn part. */
  const hit = e => {
    if (!onPick) return
    const b = boxRef.current?.getBoundingClientRect()
    if (!b) return
    const x = ((e.clientX - b.left) / b.width) * VW
    const y = ((e.clientY - b.top) / b.height) * VH
    if (y > CY + BAND / 2) return                       // below the feet
    const r = Math.hypot(x - CX, y - CY)
    if (r < RADII[3] - BAND / 2 || r > RADII[0] + BAND / 2) return
    let best = 0
    RADII.forEach((rad, i) => { if (Math.abs(rad - r) < Math.abs(RADII[best] - r)) best = i })
    const ring = rings[best]
    if (ring) onPick(ring.id)
  }
  const read = rings.map(r => `${SENSORS[r.id]?.name || r.name} ${r.value}`).join(', ')
  return (
    <div className={cn('w-full shrink-0', className)} style={{ maxWidth: size }}>
      <div ref={boxRef} role="img" onClick={hit} className="relative"
        style={{ aspectRatio: `${VW} / ${VH}`, cursor: onPick ? 'pointer' : undefined }}
        aria-label={`${score} out of 100${usual != null ? `, usually ${usual}` : ''}. 0 is calm, 100 is peak.
          Each signal out of 100: ${read}.`}>
        <svg viewBox={`0 0 ${VW} ${VH}`} aria-hidden className="size-full">
          {rings.map((r, i) => {
            const s = SENSORS[r.id] || r
            return (
              <React.Fragment key={r.id}>
                <Band r={RADII[i]} glow={s.glow || s.color} pct={r.value}
                  dim={picked != null && picked !== r.id}/>
              </React.Fragment>
            )
          })}
          {/* last, because every band paints a full-length mist track and
              anything drawn before them is painted out */}
          <ArchWeather/>
        </svg>
        {/* the score rides over the arch in real HTML, so it uses the display
            face and a step off the scale rather than a size the viewBox
            invented at this particular width */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[26%]
          flex flex-col items-center">
          <span className="font-display text-dial font-medium leading-none tracking-tight text-ink">{shown}</span>
          <span className="mt-1 font-mono text-tick text-ink-3">out of 100</span>
        </div>
        {/* the arch is a scale; its feet say so */}
        {/* their own strip below the feet. Sitting level with the arch put
            them under the shortest band, which is exactly where a low reading
            draws the eye. */}
        {/* Centred under each foot rather than pinned to the box corners. The
            clouds now occupy those corners, and "calm" was printing on top of
            the white one. 15% and 85% are the feet's own centres in the
            viewBox, so the words track the ends they name at any size. */}
        <span aria-hidden className="absolute bottom-0 left-[15%] -translate-x-1/2 font-mono
          text-tick text-ink-3">calm</span>
        <span aria-hidden className="absolute bottom-0 left-[85%] -translate-x-1/2 font-mono
          text-tick text-ink-3">peak</span>
      </div>
      {usual != null && (
        <p aria-hidden className="mt-2 text-center text-sec text-ink-2">
          usually <b className="font-medium text-ink">{usual}</b></p>
      )}
    </div>
  )
}

/* One tile per band. These are the real control: the arch is aria-hidden, so
   everything a keyboard or a screen reader needs is here. Tiles rather than
   list rows because a reader has to be able to pick one out and read it from
   arm's length — a colour bar down the side, the name at heading size, the
   figure at figure size. */
export function RainbowKey({ rings, picked, onPick, className }) {
  return (
    <ul className={cn('grid list-none gap-3 p-0 sm:grid-cols-2', className)}>
      {rings.map(r => {
        const s = SENSORS[r.id] || r
        const on = picked === r.id
        const Icon = s.icon
        const tone = s.glow || s.color
        return (
          <li key={r.id} className="h-full">
            {/* Card `interactive` replaces the hand-rolled border / hover /
                focus-visible stack this tile used to carry, and its left rule
                is the one the old `border-l-4` was drawing — repainted inline
                in the signal's colour, which beats the accent hover so the
                band identity survives the pointer. */}
            <Card interactive as="button" aria-expanded={on}
              onClick={() => onPick(on ? null : r.id)}
              style={{ borderLeftColor: tone, background: on ? `${tone}12` : undefined }}
              className="flex h-full min-h-[104px] flex-col justify-between gap-3 p-4">
              <span className="flex w-full items-start justify-between gap-3">
                <span className="flex items-center gap-2.5">
                  {Icon && <Icon aria-hidden className="size-5 shrink-0" style={{ color: tone }}/>}
                  <CardTitle as="span" className="text-row">{s.name}</CardTitle>
                </span>
                <span className="shrink-0 font-mono text-num font-medium tabular-nums leading-none text-ink">
                  {r.value}</span>
              </span>
              {/* One reading against its scale, which is the whole of what the
                  "of 100" caption under each figure said — and it said it four
                  times under a heading that already says it. Bar instead of
                  caption; aria-hidden because the figure beside it is the
                  announced one. */}
              <Progress aria-hidden value={r.value} tone={tone} className="h-1.5"/>
              <span className="flex w-full items-end justify-between gap-3">
                <span className="text-sec text-ink-2">{r.reading}</span>
                <Chevron aria-hidden
                  className={cn('size-5 shrink-0 text-ink-3 transition-transform duration-200',
                    on && 'rotate-90')}/>
              </span>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}

/* The sensor's own series, in the sensor's own colour. */
export function SensorTrace({ data, color, h = 96, className }) {
  if (!data?.length) return null
  const lo = Math.min(...data), hi = Math.max(...data) === lo ? lo + 1 : Math.max(...data)
  const W = 600, p = 6
  const pts = data.map((v, i) => [
    p + (i / (data.length - 1)) * (W - p * 2),
    h - p - ((v - lo) / (hi - lo)) * (h - p * 2),
  ])
  const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${h}`} aria-hidden preserveAspectRatio="none"
      className={cn('block h-24 w-full', className)}>
      <defs>
        <linearGradient id={`mm-fill-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${d} L${W - p} ${h} L${p} ${h} Z`} fill={`url(#mm-fill-${color.slice(1)})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"
        strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
      <circle cx={last[0]} cy={last[1]} r="4" fill={color} vectorEffect="non-scaling-stroke"/>
    </svg>
  )
}

/* Where this signal sat in each class period. The tallest bar carries a label
   so the shape has a fact attached to it. */
export function Bars({ data, color, unit = 'class period', className }) {
  if (!data?.length) return null
  const hi = Math.max(...data.map(d => d.v))
  return (
    <figure className={cn('m-0', className)}>
      <figcaption className="mark mb-3 ">By {unit}</figcaption>
      <div className="flex h-[132px] items-end gap-2" role="img"
        aria-label={data.map(d => `${d.label} ${d.v}`).join(', ') + ' out of 100'}>
        {data.map(d => {
          const top = d.v === hi
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-2">
              <span className={cn('font-mono text-tick tabular-nums',
                top ? 'text-ink' : 'text-ink-3')}>{d.v}</span>
              <div className="w-full rounded-t-lg transition-[height] duration-500"
                style={{ height: Math.max(4, (d.v / 100) * 96), background: color,
                         opacity: top ? 1 : 0.42 }}/>
              <span className={cn('font-mono text-tick', top ? 'text-ink' : 'text-ink-3')}>{d.label}</span>
            </div>
          )
        })}
      </div>
    </figure>
  )
}

/* Where today sits against this person's own fortnight. The band is the normal
   range; the marker is now. A number on its own cannot show "outside". */
export function RangeBar({ band, color, className }) {
  if (!band) return null
  const { lo, hi, now } = band
  const out = now > hi || now < lo
  return (
    <figure className={cn('m-0', className)}>
      <figcaption className="mark mb-3 ">Against their own normal</figcaption>
      <div className="relative h-10" role="img"
        aria-label={`Normal range ${lo} to ${hi}. Now ${now}, ${out ? 'outside it' : 'inside it'}.`}>
        <div className="absolute inset-x-0 top-4 h-2.5 rounded-xs bg-mist"/>
        <div className="absolute top-4 h-2.5 rounded-xs bg-ink-3/35"
          style={{ left: lo + '%', width: (hi - lo) + '%' }}/>
        <div className="absolute top-[9px] h-[22px] w-[5px] -translate-x-1/2 rounded-none"
          style={{ left: now + '%', background: color }}/>
        <span className="absolute top-0 -translate-x-1/2 font-mono text-tick tabular-nums text-ink"
          style={{ left: Math.min(94, Math.max(6, now)) + '%' }}>{now}</span>
      </div>
      <p className="mt-1 flex justify-between font-mono text-tick text-ink-3">
        <span>calm</span>
        <span>{out ? 'above their usual range' : 'inside their usual range'}</span>
        <span>peak</span>
      </p>
    </figure>
  )
}

/* Apple Fitness opens a sheet on a ring. A sheet on a page this short would
   cover the thing it is explaining, so this expands underneath instead. */
export function SensorDetail({ ring, onClose }) {
  const s = SENSORS[ring.id] || ring
  const ref = React.useRef(null)
  React.useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollIntoView({ block:'nearest', behavior:'smooth' }), 60)
    return () => clearTimeout(t)
  }, [ring.id])
  return (
    <section ref={ref} tabIndex={-1} className="mt-6 rounded-xs border border-rule bg-paper p-5 sm:p-7">
      <span aria-hidden className="mb-4 block h-1 w-14 rounded-none"
        style={{ background: s.glow || s.color }}/>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h3 className="font-display text-head font-medium text-ink">{s.name}</h3>
          <p className="mt-1 font-mono text-tick text-ink-3">
            {ring.value} out of 100</p>
        </div>
        <p className="font-mono font-medium tabular-nums text-stat leading-none text-ink">
          {ring.big}<span className="ml-1.5 text-meta text-ink-3">{s.unit}</span></p>
      </div>

      <figure className="m-0 mt-5">
        <figcaption className="mark mb-3 ">{ring.window || 'The last hour'}</figcaption>
        <SensorTrace data={ring.series} color={s.glow || s.color}/>
      </figure>

      <div className="mt-7 grid gap-7 border-t border-rule pt-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <Bars data={ring.bars} color={s.glow || s.color} unit={ring.barUnit}/>
        <RangeBar band={ring.band} color={s.glow || s.color}/>
      </div>

      <p className="mt-7 max-w-[60ch] border-t border-rule pt-5 text-sec text-ink-2">{ring.note || s.about}</p>

      <button onClick={onClose}
        className="mt-5 min-h-[44px] font-display text-meta font-medium text-accent underline
          underline-offset-4 hover:text-accent-ink">Close {s.name.toLowerCase()}</button>
    </section>
  )
}
