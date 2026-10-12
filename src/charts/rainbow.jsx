import React from 'react'
import { Chevron } from '../ui/marks'
import { SENSORS } from '../lib/sensors'
import { cn } from '../lib/utils'

/* Concentric-arch score dial: one band per sensor on its own 0-100 scale.
 * The arch is aria-hidden — a 16-unit band stroke is ~20px at a sane dial
 * size, half the minimum tap target, so every band has a focusable, named
 * 56px row under it (RingList).
 * The centre number is a logistic blend of four z-scores, NOT the mean of the
 * bands. Do not label it an average. */

/* BAND 16 thick, radii 18 apart, so a 2-unit gap separates the four. Red
   outside, blue inside. Interior half-disc radius ~76 holds the score; three
   digits need ~87px of the 152 that radius gives at the default 320 width. */
const VW = 320, VH = 232, CX = 160, CY = 168
const BAND = 16
const RADII = [139, 121, 103, 85]       // outside in: heart, sweat, temp, move
/* PLATE/EDGE are the framed backing, off unless a call site passes `plate`;
   ink-3 on PLATE is 5.26 : 1, which keeps the foot labels and caption AA.
   TRACK is the unfilled part of each band and, plate off, the only thing
   drawing the arch at a low score: #8eb0b6 measures 2.32 on card #ffffff down
   to 1.81 on the palest ground a dial lands on (aqua-2 #cee8ea). Not text,
   carries no value, so 3 : 1 does not apply. */
const PLATE = '#e3eff2', EDGE = '#95b3ba', TRACK = '#8eb0b6'

const pol = (r, deg) => [CX + r * Math.cos(deg * Math.PI / 180), CY + r * Math.sin(deg * Math.PI / 180)]
/* 180° is the left foot, 360° the right; increasing angle sweeps up and over. */
function arcPath(r, pct) {
  const to = 180 + 180 * Math.max(0.0001, Math.min(1, pct / 100))
  const [x1, y1] = pol(r, 180), [x2, y2] = pol(r, to)
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

/* Each cloud is centred on a foot and tall enough that the band end
   disappears into it; wide and flat, or it buries the first fifth of every
   band. A cloud is unequal circles on a flat slab drawn twice: pass one
   strokes and fills every shape in the edge colour, painting the union's outer
   boundary only; pass two fills the same shapes on top so overlap seams cannot
   show. edge #93a6ab; rain #2f7fd0, 3.94 on the plate. */
const SKY = { edge:'#93a6ab', rain:'#2f7fd0' }

/* A cloud is drawn in its own 96 x 30 box, base line at the box bottom, so it
   is placed by base position and foot width alone. Every circle top is at or
   below 0 and every bottom at or above the slab, or the cloud prints with a
   straight cut down one side. */
const CLOUD_W = 96, CLOUD_H = 34
const PUFFS = {
  calm: [[10,26,8],[24,21,13],[42,15,15],[64,20,14],[84,26,8],[52,27,7]],
  peak: [[12,25,9],[30,20,14],[52,15,15],[74,21,13],[88,27,7],[42,28,6]],
}
const SLAB = { x:4, y:22, w:88, h:12, r:6 }

function Cloud({ cx, base, kind, id, rim = 1.2 }) {
  /* One <g> per pass, and the shapes are identical in both. */
  const shapes = props => (
    <>
      <rect x={SLAB.x} y={SLAB.y} width={SLAB.w} height={SLAB.h} rx={SLAB.r} {...props}/>
      {PUFFS[kind].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} {...props}/>)}
    </>
  )
  return (
    <g transform={`translate(${cx - CLOUD_W / 2} ${base - CLOUD_H})`}>
      <g fill={SKY.edge} stroke={SKY.edge} strokeWidth={rim}>{shapes({})}</g>
      <g fill={`url(#${id})`}>{shapes({})}</g>
    </g>
  )
}

/* Feet in viewBox units: left spans x 13-83, right 237-307, centres 48 and
   272. FOOT is 4 units inboard of each centre so a 96-wide cloud clears the
   plate's rounded corners. BASE_Y is 8 below the band bottom, cloud top 6
   above it, so a band needs ~5% of its length to clear the cloud. */
const FOOT = { calm: 52, peak: 268 }
const BASE_Y = 184

export function ArchWeather() {
  /* Gradient ids must be per-instance: two dials share a page on some routes
     and the second <defs> would silently lose to the first. */
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const calm = `mm-calm-${uid}`, peak = `mm-peak-${uid}`
  return (
    <g aria-hidden style={{ pointerEvents:'none' }}>
      <defs>
        {/* userSpaceOnUse, not objectBoundingBox: with the default each of
            the seven shapes gets its own copy of the ramp scaled to its own
            box and prints as a separately shaded disc. Stops are the cloud's
            own y range. The white cloud's ramp ends at the old PLATE value. */}
        <linearGradient id={calm} gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="184">
          <stop offset="0" stopColor="#ffffff"/>
          <stop offset="1" stopColor={PLATE}/>
        </linearGradient>
        <linearGradient id={peak} gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="184">
          <stop offset="0" stopColor="#7d8b96"/>
          <stop offset="1" stopColor="#4c5967"/>
        </linearGradient>
      </defs>
      <Cloud cx={FOOT.calm} base={BASE_Y} kind="calm" id={calm} rim={2}/>
      <Cloud cx={FOOT.peak} base={BASE_Y} kind="peak" id={peak}/>
      <g className="mm-rain" stroke={SKY.rain} strokeLinecap="round">
        <line x1="256" y1="187" x2="253" y2="196" strokeWidth="2.6"/>
        <line x1="272" y1="189" x2="269" y2="199" strokeWidth="3"/>
        <line x1="289" y1="187" x2="286" y2="195" strokeWidth="2.3"/>
      </g>
    </g>
  )
}

/* A spring, not a fixed-duration curve: it integrates from the current value
   and velocity, so a target that changes mid-flight is absorbed rather than
   restarted. Damping ratio 26 / (2 * sqrt(170)) = 0.997 — critically damped,
   no overshoot. Under reduced motion the value is set directly. */
function useSpring(target, on = true, stiffness = 170, damping = 26) {
  const [shown, setShown] = React.useState(on ? 0 : target)
  const s = React.useRef({ x: on ? 0 : target, v: 0 })
  React.useEffect(() => {
    if (!on || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      s.current.x = target; s.current.v = 0; setShown(target); return
    }
    let raf, last
    const step = t => {
      if (last == null) last = t
      /* Clamped: a backgrounded tab returning integrates one 64ms frame
         rather than one of 4000ms. */
      const dt = Math.min(0.064, (t - last) / 1000); last = t
      const st = s.current
      st.v += (-stiffness * (st.x - target) - damping * st.v) * dt
      st.x += st.v * dt
      if (Math.abs(st.x - target) < 0.02 && Math.abs(st.v) < 0.02) {
        st.x = target; st.v = 0; setShown(target); return
      }
      setShown(st.x)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, on, stiffness, damping])
  return shown
}

/* Flat, opaque, round-ended: no blur, gradient or partial opacity. TRACK is
   the unfilled remainder — see the note on the constant. */
function Band({ r, glow, pct, dim }) {
  const shown = useSpring(pct)
  return (
    <g opacity={dim ? 0.24 : 1} className="transition-opacity duration-200"
      style={{ pointerEvents: 'none' }}>
      <path d={arcPath(r, 100)} fill="none" strokeWidth={BAND} stroke={TRACK}/>
      <path d={arcPath(r, shown)} fill="none" strokeWidth={BAND} strokeLinecap="round" stroke={glow}/>
    </g>
  )
}

/* The harm anchor: the reader's own usual day, marked on the scale.
 * A labelled threshold on a visual display cut urgent-contact intent for a
 * near-normal value from 48-58% to 35% without blunting the response to
 * extreme values. Zikmund-Fisher, B. J., Scherer, A. M., Witteman, H. O.,
 * Solomon, J. B., Exe, N. L., & Fagerlin, A. (2018). Effect of harm anchors
 * in visual displays of test results on patient perceptions of urgency about
 * near-normal values: experimental study. JMIR, 20(3), e98.
 * https://doi.org/10.2196/jmir.8889 — the finding is about a mark on the
 * scale, not a sentence under the picture.
 * The mark sits at 180 + 1.8 * usual degrees (180° = left foot, 1.8°/point
 * over the 180° sweep). Anything pointing at the usual value moves with it.
 * Two strokes: one dark hairline alone disappears into the darkest band. */
function UsualMark({ at }) {
  const deg = 180 + 1.8 * Math.max(0, Math.min(100, at))
  const [x1, y1] = pol(RADII[3] - BAND / 2 - 5, deg)
  const [x2, y2] = pol(RADII[0] + BAND / 2 + 6, deg)
  const line = w => <line x1={x1.toFixed(2)} y1={y1.toFixed(2)}
    x2={x2.toFixed(2)} y2={y2.toFixed(2)} strokeWidth={w} strokeLinecap="round"/>
  return (
    <g aria-hidden>
      <g stroke="#f7fbfa" strokeOpacity="0.95">{line(6)}</g>
      <g stroke="#0b2b33" strokeOpacity="0.62">{line(2.2)}</g>
      <circle cx={x2.toFixed(2)} cy={y2.toFixed(2)} r="3.2"
        fill="#0b2b33" fillOpacity="0.62" stroke="#f7fbfa" strokeOpacity="0.95" strokeWidth="1.4"/>
    </g>
  )
}

export function RainbowDial({ score, usual, rings, onPick, picked, size = 320, plate = false, className }) {
  const shown = Math.round(useSpring(score))
  const boxRef = React.useRef(null)
  /* Do not hit-test the arcs: a filtered sibling's hit area is its whole
     filter region, and Chromium will not hit-test a transparent stroke.
     Pointer geometry also accepts the whole annulus. */
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
        aria-label={`${score} out of 100${usual != null ? `, marked against a usual day of ${usual}` : ''}. 0 is calm, 100 is peak.
          Each signal out of 100: ${read}.`}>
        <svg viewBox={`0 0 ${VW} ${VH}`} aria-hidden className="size-full">
          {plate && <rect x="1" y="1" width={VW - 2} height={VH - 2} rx="14"
            fill={PLATE} stroke={EDGE} strokeWidth="1.6"/>}
          {rings.map((r, i) => {
            const s = SENSORS[r.id] || r
            return (
              <React.Fragment key={r.id}>
                <Band r={RADII[i]} glow={s.glow || s.color} pct={r.value}
                  dim={picked != null && picked !== r.id}/>
              </React.Fragment>
            )
          })}
          {/* last: every band paints a full-length mist track over anything
              drawn before it */}
          <ArchWeather/>
          {usual != null && <UsualMark at={usual}/>}
        </svg>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[28.5%]
          flex flex-col items-center">
          <span className="font-display text-dial font-medium leading-none tracking-tight text-ink">{shown}</span>
          <span className="mt-1 text-tick text-ink-3">out of 100</span>
        </div>
        {/* 15% and 85% are the feet's own centres in the viewBox, so the
            labels track the ends they name at any size. */}
        <span aria-hidden className="absolute bottom-[2.5%] left-[15%] -translate-x-1/2 text-tick text-ink-3">calm</span>
        <span aria-hidden className="absolute bottom-[2.5%] left-[85%] -translate-x-1/2 text-tick text-ink-3">peak</span>
      </div>
      {usual != null && (
        <p aria-hidden className="mt-2 text-center text-sec text-ink-2">
          The mark is a usual day: <b className="font-medium text-ink">{usual}</b></p>
      )}
    </div>
  )
}

/* One row per band, and the row is the control: the arch is aria-hidden, so
   everything a keyboard or screen reader needs is here. Rows are 56px. */
export function RainbowKey({ rings, picked, onPick, className }) {
  return (
    <ul className={cn('m-0 list-none p-0', className)}>
      {rings.map(r => {
        const s = SENSORS[r.id] || r
        const on = picked === r.id
        const tone = s.glow || s.color
        return (
          <li key={r.id} className="border-b border-rule">
            <button type="button" aria-expanded={on}
              onClick={() => onPick(on ? null : r.id)}
              className={cn('flex min-h-[56px] w-full items-center gap-4 py-3 text-left',
                'transition-colors duration-150 hoverOnly:bg-mist/50',
                on && 'bg-mist/50')}>
              <span aria-hidden className="h-7 w-[3px] shrink-0 rounded-bar"
                style={{ background: tone }}/>
              <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink">{s.name}</span>
              <span className="shrink-0 font-mono text-num font-medium tabular-nums leading-none text-ink">
                {r.value}</span>
              <Chevron aria-hidden
                className={cn('size-4 shrink-0 text-ink-3 transition-transform duration-200',
                  on && 'rotate-90')}/>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

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
      <p className="mt-1 flex justify-between text-tick text-ink-3">
        <span>calm</span>
        <span>{out ? 'above their usual range' : 'inside their usual range'}</span>
        <span>peak</span>
      </p>
    </figure>
  )
}

/* Expands underneath rather than opening a sheet. `Bars` and `RangeBar` are
   still exported; the marketing pages draw them. */
export function SensorDetail({ ring, onClose }) {
  const s = SENSORS[ring.id] || ring
  const ref = React.useRef(null)
  React.useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollIntoView({ block:'nearest', behavior:'smooth' }), 60)
    return () => clearTimeout(t)
  }, [ring.id])
  return (
    <section ref={ref} tabIndex={-1} className="mt-8 border-t border-ink pt-5">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <h3 className="font-display text-row font-medium text-ink">{s.name}</h3>
        <p className="m-0 font-mono text-stat font-medium leading-none tabular-nums text-ink">
          {ring.big}<span className="ml-1.5 text-meta text-ink-3">{s.unit}</span></p>
      </div>
      <SensorTrace className="mt-4" data={ring.series} color={s.glow || s.color}/>
      <p className="mt-4 max-w-[60ch] text-sec text-ink-2">{ring.note || s.about}</p>
      <button onClick={onClose}
        className="mt-3 min-h-[44px] font-display text-meta font-medium text-accent underline
          underline-offset-4 hoverOnly:text-accent-ink">Close {s.name.toLowerCase()}</button>
    </section>
  )
}
