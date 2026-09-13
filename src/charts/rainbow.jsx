import React from 'react'
import { ChevronRight } from 'lucide-react'
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

/* Geometry is tight in both directions and both edges bite. Too large and the
   outer stroke runs past the viewBox and gets clipped; too thick and the hole
   in the middle cannot hold a three-digit score at the display step. Outer
   edge is 85 + SW/2 = 90 against a half-box of 100, and the hole is 38 units
   across the radius — 110px at the default size, where "100" needs 87px. */
/* Geometry of the arch.
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
const VW = 320, VH = 206, CX = 160, CY = 168
const BAND = 18
const RADII = [139, 121, 103, 85]       // outside in: heart, sweat, temp, move

const pol = (r, deg) => [CX + r * Math.cos(deg * Math.PI / 180), CY + r * Math.sin(deg * Math.PI / 180)]
/* 180° is the left foot, 360° the right; increasing angle sweeps up and over. */
function arcPath(r, pct) {
  const to = 180 + 180 * Math.max(0.0001, Math.min(1, pct / 100))
  const [x1, y1] = pol(r, 180), [x2, y2] = pol(r, to)
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
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
      <path d={arcPath(r, 100)} fill="none" strokeWidth={BAND} className="stroke-sage"/>
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
        </svg>
        {/* the score rides over the arch in real HTML, so it uses the display
            face and a step off the scale rather than a size the viewBox
            invented at this particular width */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[18%]
          flex flex-col items-center">
          <span className="font-display text-dial font-bold leading-none tracking-tight text-ink">{shown}</span>
          <span className="mt-1 font-mono text-label uppercase tracking-[0.12em] text-ink-3">out of 100</span>
        </div>
        {/* the arch is a scale; its feet say so */}
        {/* their own strip below the feet. Sitting level with the arch put
            them under the shortest band, which is exactly where a low reading
            draws the eye. */}
        <span aria-hidden className="absolute bottom-0 left-0 font-mono text-label uppercase
          tracking-[0.12em] text-ink-3">calm</span>
        <span aria-hidden className="absolute bottom-0 right-0 font-mono text-label uppercase
          tracking-[0.12em] text-ink-3">peak</span>
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
            <button onClick={() => onPick(on ? null : r.id)} aria-expanded={on}
              style={{ borderLeftColor: tone, background: on ? `${tone}12` : undefined }}
              className={cn('flex h-full min-h-[104px] w-full flex-col justify-between gap-3 rounded-xs',
                'border border-l-4 border-rule p-4 text-left transition-colors duration-150',
                'hover:bg-sage/50 focus-visible:bg-sage/50')}>
              <span className="flex w-full items-start justify-between gap-3">
                <span className="flex items-center gap-2.5">
                  {Icon && <Icon aria-hidden className="size-5 shrink-0" style={{ color: tone }}/>}
                  <span className="font-display text-row font-bold text-ink">{s.name}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-num font-medium tabular-nums leading-none text-ink">
                    {r.value}</span>
                  <span className="mt-1 block font-mono text-label text-ink-3">of 100</span>
                </span>
              </span>
              <span className="flex w-full items-end justify-between gap-3">
                <span className="text-sec text-ink-2">{r.reading}</span>
                <ChevronRight aria-hidden
                  className={cn('size-5 shrink-0 text-ink-3 transition-transform duration-200',
                    on && 'rotate-90')}/>
              </span>
            </button>
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
      <span aria-hidden className="mb-4 block h-1 w-14 rounded-full"
        style={{ background: s.glow || s.color }}/>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h3 className="font-display text-head font-bold text-ink">{s.name}</h3>
          <p className="mt-1 font-mono text-label uppercase tracking-[0.12em] text-ink-3">
            {ring.value} out of 100 · {ring.window || 'last hour'}</p>
        </div>
        <p className="font-mono font-medium tabular-nums text-stat leading-none text-ink">
          {ring.big}<span className="ml-1.5 text-meta text-ink-3">{s.unit}</span></p>
      </div>

      <SensorTrace data={ring.series} color={s.glow || s.color} className="mt-5"/>

      {ring.rows?.length > 0 && (
        <ul className="mt-5 list-none divide-y divide-rule border-t border-rule p-0">
          {ring.rows.map(r => (
            <li key={r.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
              <span className="text-meta text-ink-2">{r.label}</span>
              <span className="font-mono text-meta tabular-nums text-ink">{r.value}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 max-w-[62ch] text-sec text-ink-2">{s.about}</p>
      {ring.note && <p className="mt-2.5 max-w-[62ch] text-sec text-ink-2">{ring.note}</p>}

      <button onClick={onClose}
        className="mt-5 min-h-[44px] font-display text-meta font-medium text-accent underline
          underline-offset-4 hover:text-accent-ink">Close {s.name.toLowerCase()}</button>
    </section>
  )
}
