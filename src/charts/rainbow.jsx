import React from 'react'
import { Chevron } from '../ui/marks'
import { SENSORS } from '../lib/sensors'
import { cn } from '../lib/utils'

/* Concentric-arch score dial: one band per sensor on its own 0-100 scale.
 * The arch is aria-hidden: a 16-unit band stroke is ~20px at a sane dial
 * size, half the minimum tap target, so every band has a focusable, named
 * 56px row under it (RingList).
 * The centre number is a logistic blend of four z-scores, NOT the mean of the
 * bands. Do not label it an average.
 *
 * TWO THINGS CHANGED HERE.
 *
 * 1. `weather` IS A PROP NOW, default true. ArchWeather used to render
 *    unconditionally, so the clouds appeared on the parent dial, where design
 *    spec section 7 says they do not belong, and the parent screen had to
 *    suppress them with a CSS selector written against this file's internals
 *    (`[&_g:has(>_.mm-rain)]:hidden`). That selector breaks silently the day
 *    `mm-rain` is renamed. Pass `weather={false}` instead. The clouds
 *    themselves are flat shapes now rather than gradients, so a call site that
 *    passed `weather={false}` only to stay inside the no-gradient rule can
 *    turn them back on.
 *
 * 2. THE DIAL HAS A SCALE. It had four radii and a usual-day mark and nothing
 *    else: no axis, no tick, no labelled end, so a band's fill could be
 *    compared with the other three and with nothing absolute. There is a
 *    graduated axis outside the bands now - minor ticks every 5 points,
 *    majors every 25, numbered at 25, 50 and 75, with both ends named and
 *    numbered at the feet. The usual-day mark lands on that scale, which is
 *    what makes it a set point rather than a decoration.
 *
 * The viewBox is fixed at 320 by 232 and the radii are fixed with it:
 * views/Intro.jsx overlays its own svg on this one at the same viewBox and
 * points an arrow at RADII[0] + BAND / 2 by coordinate. Moving any of those
 * numbers silently moves that annotation off the thing it annotates. */

/* BAND 16 thick, radii 18 apart, so a 2-unit gap separates the four. Red
   outside, blue inside. Interior half-disc radius ~76 holds the score; three
   digits need ~87px of the 152 that radius gives at the default 320 width. */
const VW = 320, VH = 232, CX = 160, CY = 168
const BAND = 16
const RADII = [139, 121, 103, 85]       // outside in: heart, sweat, temp, move
/* PLATE/EDGE are the framed backing, off unless a call site passes `plate`;
   ink-3 on PLATE is 5.26 : 1, which keeps the foot labels and caption AA.
   TRACK is the unfilled part of each band and, plate off, the only thing
   drawing the arch at a low score: #93b2a1 measures 2.32 on card #ffffff down
   to 1.81 on the palest ground a dial lands on (aqua-2 #cee8ea). Not text,
   carries no value, so 3 : 1 does not apply. */
const PLATE = '#e3eff2', EDGE = '#95b3ba', TRACK = '#93b2a1'
/* The axis. ink-3 clears 4.5 : 1 as text on every ground a dial lands on -
   card 5.61, paper 5.33, PLATE 5.26, aqua-2 4.86, mist 4.68 - so the same
   value draws the rule, the ticks and their numbers. */
const INK3 = '#426a58'

const pol = (r, deg) => [CX + r * Math.cos(deg * Math.PI / 180), CY + r * Math.sin(deg * Math.PI / 180)]
/* 180° is the left foot, 360° the right; increasing angle sweeps up and over. */
function arcPath(r, pct) {
  const to = 180 + 180 * Math.max(0.0001, Math.min(1, pct / 100))
  const [x1, y1] = pol(r, 180), [x2, y2] = pol(r, to)
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

/* ── The scale ─────────────────────────────────────────────────────────── */

/* The axis sits just outside the outer band: 149 is two units clear of its
   147 edge, and a major tick reaching 157 still leaves three units of the
   viewBox at the feet and eleven at the top. Nothing here can be any longer.
   The 50 tick is the one exception, cut to three units, because its number is
   the only one that has to live in the eleven units above the arch. */
const AXIS_R = 149
const MAJORS = [0, 25, 75, 100]
const MINORS = Array.from({ length: 21 }, (_, i) => i * 5).filter(v => v % 25)

/* Numbers are SVG text, sized against the rendered dial so that a 320px dial
   and a 440px dial both print them at about 11px: SVG text in a scaled viewBox
   would otherwise be 8px on the 248px check-in dial. 25 and 75 sit on their
   own radius at 168, which clears both their own tick and the band. */
const axisFont = size => Math.max(7.5, Math.min(16, (11 * 320) / size))

function Axis({ font }) {
  const ray = (v, len) => {
    const d = 180 + 1.8 * v
    const [x1, y1] = pol(AXIS_R, d), [x2, y2] = pol(AXIS_R + len, d)
    return `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`
  }
  return (
    <g aria-hidden style={{ pointerEvents: 'none' }}>
      <path d={arcPath(AXIS_R, 100)} fill="none" stroke={INK3} strokeWidth="1"/>
      <g stroke={INK3} strokeWidth="1">
        {MINORS.map(v => <path key={v} d={ray(v, 4)}/>)}
      </g>
      <g stroke={INK3} strokeWidth="1.6">
        {MAJORS.map(v => <path key={v} d={ray(v, 8)}/>)}
        <path d={ray(50, 3)}/>
      </g>
      <g fill={INK3} fontSize={font.toFixed(2)} textAnchor="middle">
        <text x="41.2" y={(49.2 + font * 0.36).toFixed(1)}>25</text>
        <text x="160" y="13">50</text>
        <text x="278.8" y={(49.2 + font * 0.36).toFixed(1)}>75</text>
      </g>
    </g>
  )
}

/* Each cloud is centred on a foot and tall enough that the band end
   disappears into it; wide and flat, or it buries the first fifth of every
   band. A cloud is unequal circles on a flat slab drawn twice: pass one
   strokes and fills every shape in the edge colour, painting the union's outer
   boundary only; pass two fills the same shapes on top so overlap seams cannot
   show.
   FLAT, AND IN THE GREEN SYSTEM. Both clouds were linearGradient fills, the
   fair one white to the plate value and the rain one a slate #7d8b96 to
   #4c5967, and the rain was a blue #2f7fd0. Spec 0d allows green, white and
   turquoise only, and a gradient is on the AI-tell list, so each cloud is one
   flat fill inside one flat rim now and the rain is `beam`, the turquoise the
   palette already nominates for drawing rain. One fill per shape, the same
   idiom as every other drawing in this directory.
   Measured, on card #ffffff and on the plate #e3eff2: rim `ruling` #93b2a1
   2.32 and 2.06, rain `beam` #1d8fb0 3.74 and 3.33, the fair cloud's own rim
   against its white fill 2.32. None of these is text and none carries a value
   on its own, so 3 : 1 is the only floor that applies and only the rain owes
   it. The overcast cloud is `ink-3` #426a58 inside `ink-2` #2a5744: 5.99 on
   card, and it is the one cloud that has to read as weather at a glance. */
const SKY = { rain:'#1d8fb0' }
/* fair: card inside ruling. overcast: ink-3 inside ink-2. */
const FAIR = { fill:'#ffffff', rim:'#93b2a1' }
const OVERCAST = { fill:'#426a58', rim:'#2a5744' }

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

function Cloud({ cx, base, kind, tone, rim = 1.2 }) {
  /* One <g> per pass, and the shapes are identical in both. */
  const shapes = props => (
    <>
      <rect x={SLAB.x} y={SLAB.y} width={SLAB.w} height={SLAB.h} rx={SLAB.r} {...props}/>
      {PUFFS[kind].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} {...props}/>)}
    </>
  )
  return (
    <g transform={`translate(${cx - CLOUD_W / 2} ${base - CLOUD_H})`}>
      <g fill={tone.rim} stroke={tone.rim} strokeWidth={rim}>{shapes({})}</g>
      <g fill={tone.fill}>{shapes({})}</g>
    </g>
  )
}

/* Feet in viewBox units: left spans x 13-83, right 237-307, centres 48 and
   272. FOOT is 4 units inboard of each centre so a 96-wide cloud clears the
   plate's rounded corners. BASE_Y is 8 below the band bottom, cloud top 6
   above it, so a band needs ~5% of its length to clear the cloud. */
const FOOT = { calm: 52, peak: 268 }
const BASE_Y = 184

/* No <defs> and no per-instance ids any more: with both clouds flat there is
   nothing to reference, which also removes the two dials-on-one-page hazard
   the gradient version had to guard against. */
export function ArchWeather() {
  return (
    <g aria-hidden style={{ pointerEvents:'none' }}>
      <Cloud cx={FOOT.calm} base={BASE_Y} kind="calm" tone={FAIR} rim={2}/>
      <Cloud cx={FOOT.peak} base={BASE_Y} kind="peak" tone={OVERCAST}/>
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
   restarted. Damping ratio 26 / (2 * sqrt(170)) = 0.997, critically damped,
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
   the unfilled remainder; see the note on the constant. */
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
 * https://doi.org/10.2196/jmir.8889 . The finding is about a mark on the
 * scale, not a sentence under the picture.
 * The mark sits at 180 + 1.8 * usual degrees (180° = left foot, 1.8°/point
 * over the 180° sweep). Anything pointing at the usual value moves with it,
 * including the axis tick it now lands between.
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
      <g stroke="#0d2b1e" strokeOpacity="0.62">{line(2.2)}</g>
      <circle cx={x2.toFixed(2)} cy={y2.toFixed(2)} r="3.2"
        fill="#0d2b1e" fillOpacity="0.62" stroke="#f7fbfa" strokeOpacity="0.95" strokeWidth="1.4"/>
    </g>
  )
}

/* The default was 320, which on a 390 phone is the full column and makes the
   score card alone most of a screen. 272 is the step down spec 0d section 6
   asks for; the interior half-disc still gives ~129px for three digits, where
   they need ~87, and axisFont holds the scale numbers at ~13px. Call sites
   that pass a size are unaffected.

   A PHONE CEILING WAS TRIED HERE AND TAKEN BACK OUT, which the next worker
   should know before trying it again. Six call sites pass their own size, from
   248 up to 430, and on a 390 phone the larger ones are the whole column:
   capping them below 640px is the obvious way to bring the students Today band
   under spec 0e section 14's screen and a half. It cannot be done from inside
   this component. views/Intro.jsx overlays its own svg on this one at the same
   320 x 232 viewBox and points an arrow at the usual-day mark BY COORDINATE,
   and that overlay is sized by Intro's own wrapper rather than by this one, so
   a dial narrower than the size the call site asked for leaves the arrow
   pointing at nothing on every phone load of the walkthrough. The size has to
   come down at the call site, where the overlay is, not here. */
export function RainbowDial({ score, usual, rings, onPick, picked, size = 272,
  plate = false, weather = true, className }) {
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
          The scale outside the bands is ticked every 5 points and numbered every 25.
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
          {/* after the bands, because every band paints a full-length mist
              track over anything drawn before it */}
          <Axis font={axisFont(size)}/>
          {weather && <ArchWeather/>}
          {usual != null && <UsualMark at={usual}/>}
        </svg>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[28.5%]
          flex flex-col items-center">
          <span className="font-display text-dial font-medium leading-none tracking-tight text-ink">{shown}</span>
          <span className="mt-1 text-tick text-ink-3">out of 100</span>
        </div>
        {/* 15% and 85% are the feet's own centres in the viewBox, so the
            labels track the ends they name at any size. Both ends carry their
            number as well as their word: the scale is labelled, not implied. */}
        <span aria-hidden className="absolute bottom-[2.5%] left-[15%] -translate-x-1/2
          whitespace-nowrap text-tick text-ink-3">
          <b className="font-normal text-ink-2">0</b> calm</span>
        <span aria-hidden className="absolute bottom-[2.5%] left-[85%] -translate-x-1/2
          whitespace-nowrap text-tick text-ink-3">
          <b className="font-normal text-ink-2">100</b> peak</span>
      </div>
      {/* No caption under the dial. The usual-day mark is drawn on the scale
          and named in the aria-label above; design spec 0f holds the dial to
          its key, the two foot labels. */}
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
              {/* the unit beside the figure, never under it */}
              <span className="flex shrink-0 items-baseline gap-1.5">
                <span className="text-num font-medium tabular-nums leading-none text-ink">
                  {r.value}</span>
                <span className="text-fine text-ink-3">of 100</span>
              </span>
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
      {/* One flat wash under the line, not a ramp: no gradient anywhere in
          this directory. The area is decoration over the line that carries
          the values, so it owes no contrast floor of its own. */}
      <path d={`${d} L${W - p} ${h} L${p} ${h} Z`} fill={color} fillOpacity="0.12"/>
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"
        strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
      <circle cx={last[0]} cy={last[1]} r="4" fill={color} vectorEffect="non-scaling-stroke"/>
    </svg>
  )
}

/* ── Bars ─────────────────────────────────────────────────────────────────
 * One series on the score's own 0 to 100 scale.
 *
 * It was seven bars against an implied ceiling, the non-peak ones held at 42%
 * opacity. Both were wrong: there was no axis, so a bar's height was only
 * comparable with the bar beside it, and accent at 42% over paper measures
 * 1.91 : 1, under the 3 : 1 a non-text graphic owes. Every bar is the full
 * colour now, the axis is drawn and labelled, and the series average is a
 * dashed reference line with its own value, so the reader can see which
 * periods ran above this person's own day rather than only which was worst. */
const BAR_TICKS = [0, 25, 50, 75, 100]
const PLOT_H = 136

export function Bars({ data, color, unit = 'class period', className }) {
  if (!data?.length) return null
  const hi = Math.max(...data.map(d => d.v))
  const mean = data.reduce((a, d) => a + d.v, 0) / data.length
  const alt = data.map(d => `${d.label} ${d.v}`).join(', ')
    + `, out of 100. Average ${mean.toFixed(1)}.`
  return (
    <figure className={cn('m-0', className)}>
      <figcaption className="mark mb-3">By {unit}, out of 100</figcaption>
      <div className="flex gap-2">
        {/* the axis labels are DOM text, not <text> in a scaled viewBox, so a
            14px tick really is 14px in a narrow column */}
        <div aria-hidden className="relative w-7 shrink-0" style={{ height: PLOT_H }}>
          {BAR_TICKS.map(t => (
            <span key={t} style={{ bottom: `${t}%` }}
              className="absolute right-0 translate-y-1/2 text-fine tabular-nums text-ink-3">
              {t}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative border-b border-l border-ink-3" style={{ height: PLOT_H }}
            role="img" aria-label={alt}>
            {BAR_TICKS.filter(t => t > 0).map(t => (
              <span key={t} aria-hidden style={{ bottom: `${t}%` }}
                className="absolute inset-x-0 block border-t border-rule"/>
            ))}
            {/* this person's own average across the window, drawn so the bars
                are read against something and not only against each other */}
            <span aria-hidden style={{ bottom: `${mean}%` }}
              className="absolute inset-x-0 block border-t border-dashed border-ink-3"/>
            <div className="absolute inset-0 flex items-end gap-1.5">
              {data.map(d => (
                <div key={d.label} className="relative flex h-full flex-1 items-end justify-center">
                  <span style={{ height: `${d.v}%`, background: color }}
                    className="block w-full max-w-[34px] rounded-t-xs transition-[height] duration-500"/>
                  <span style={{ bottom: `${d.v}%` }}
                    className={cn('absolute left-1/2 mb-1 -translate-x-1/2 text-fine',
                      'tabular-nums', d.v === hi ? 'font-medium text-ink' : 'text-ink-2')}>
                    {d.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div aria-hidden className="mt-1.5 flex gap-1.5">
            {data.map(d => (
              <span key={d.label}
                className="flex-1 text-center text-fine tabular-nums text-ink-3">
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-fine text-ink-3">
        Dashed: this window&rsquo;s average,{' '}
        <b className="font-normal tabular-nums text-ink-2">{mean.toFixed(1)}</b>.
      </p>
    </figure>
  )
}

/* One value against the wearer's own normal range, on a drawn 0 to 100 axis.
   The range used to be a grey block with neither of its edges stated. */
export function RangeBar({ band, color, className }) {
  if (!band) return null
  const { lo, hi, now } = band
  const out = now > hi || now < lo
  return (
    <figure className={cn('m-0', className)}>
      <figcaption className="mark mb-3">Against their own normal, out of 100</figcaption>
      <div className="relative h-12" role="img"
        aria-label={`Normal range ${lo} to ${hi} out of 100. Now ${now}, ${out ? 'outside it' : 'inside it'}.`}>
        <div className="absolute inset-x-0 top-5 h-2.5 rounded-xs bg-mist"/>
        <div className="absolute top-5 h-2.5 rounded-xs bg-ink-3/35"
          style={{ left: lo + '%', width: (hi - lo) + '%' }}/>
        {/* the range's own two edges, stated */}
        {[lo, hi].map((v, i) => (
          <React.Fragment key={v}>
            <span aria-hidden style={{ left: `${v}%` }}
              className="absolute top-[14px] block h-[26px] w-px bg-ink-3"/>
            <span aria-hidden style={{ left: `${v}%` }}
              className={cn('absolute top-0 text-fine tabular-nums text-ink-3',
                i === 0 ? '-translate-x-full pr-1' : 'pl-1')}>
              {v}
            </span>
          </React.Fragment>
        ))}
        <div className="absolute top-[15px] h-[24px] w-[5px] -translate-x-1/2 rounded-none"
          style={{ left: now + '%', background: color }}/>
        <span className="absolute top-0 -translate-x-1/2 text-fine font-medium
          tabular-nums text-ink" style={{ left: Math.min(94, Math.max(6, now)) + '%' }}>{now}</span>
      </div>
      {/* the axis under it, ticked and numbered */}
      <div aria-hidden className="relative h-6 border-t border-ink-3">
        {BAR_TICKS.map((t, i) => (
          <React.Fragment key={t}>
            <span style={{ left: `${t}%` }}
              className="absolute top-0 block h-1.5 w-px -translate-x-1/2 bg-ink-3"/>
            <span style={{ left: `${t}%` }}
              className={cn('absolute top-2 text-fine tabular-nums text-ink-3',
                i === 0 ? 'translate-x-0' : t === 100 ? '-translate-x-full' : '-translate-x-1/2')}>
              {t}
            </span>
          </React.Fragment>
        ))}
      </div>
      <p className="mt-5 flex justify-between text-fine text-ink-3">
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
        <p className="m-0 text-stat font-medium leading-none tabular-nums text-ink">
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
