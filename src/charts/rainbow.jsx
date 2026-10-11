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
/* VH has grown twice for the same reason and in the same way. The clouds are
   the arch's footing now and one of them rains, so the strip under the feet
   has to hold a cloud bank, three drops and two labels without any of the
   three landing on each other. CX, CY and the radii have never moved: the arch
   draws exactly where it always did and only the strip beneath it grew. */
const VW = 320, VH = 232, CX = 160, CY = 168
const BAND = 16
const RADII = [139, 121, 103, 85]       // outside in: heart, sweat, temp, move
/* The plate and the empty part of a band. Both are properties of the asset
   rather than of whatever page it lands on, which is the point: this dial sits
   on white on the student page, on a pale blue app canvas in the phone, and
   inside a phone mock on the overview, and it has to be one recognisable
   object on all three. PLATE at #e3eff2 is lighter than the app canvas and
   darker than card white, so it separates from both, and EDGE is the hairline
   that closes it. The first try at the plate was two steps lighter and the
   white cloud disappeared into it: a white shape on a near-white sky is an
   outline, not a cloud, and the calm end read as an empty pill while the grey
   end read as weather. The plate is set at the depth where BOTH clouds are
   solid objects. ink-3 measures 5.26 : 1 on it, so the two foot labels and the
   caption under the figure still clear AA sitting on top of it. */
const PLATE = '#e3eff2', EDGE = '#95b3ba', TRACK = '#abced6'

const pol = (r, deg) => [CX + r * Math.cos(deg * Math.PI / 180), CY + r * Math.sin(deg * Math.PI / 180)]
/* 180° is the left foot, 360° the right; increasing angle sweeps up and over. */
function arcPath(r, pct) {
  const to = 180 + 180 * Math.max(0.0001, Math.min(1, pct / 100))
  const [x1, y1] = pol(r, 180), [x2, y2] = pol(r, to)
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

/* ── The weather the arch stands in ────────────────────────────────────
   One scene, not two pictures. The last version drew the arch and then parked
   two clouds near it, and the note back was exactly that: misaligned, cheap,
   "2 images lazily layered over". That was a fair reading of the geometry.
   The clouds sat under the feet rather than on them, slid sideways on a nine
   second loop, and the peak-end one floated in open space whenever the score
   was low enough that no coloured band reached that side.

   So the clouds are the thing the arch stands on now. Each is centred on its
   own foot and tall enough that the end of the band disappears into it, which
   is what makes the arch read as rising out of a cloud bank rather than as
   being placed beside one. They are wide and flat for the same reason: a tall
   cloud buries the first fifth of every band, and a low reading would vanish
   into it. Nothing drifts. A base that slides is a base that is not holding
   anything up, and the sliding was half of why the two parts looked unrelated.
   The rain still falls, because that is the one motion here that is a fact
   about the picture rather than decoration on it.

   A cloud is a pile of circles of deliberately unequal size on a flat slab,
   drawn twice. Pass one strokes and fills every shape in the edge colour,
   which paints the union's outer boundary and nothing else; pass two fills the
   same shapes on top, so no seam where two lobes overlap can show. The fill is
   a soft vertical gradient rather than a flat colour, the edge is a hairline
   rather than a border, and neither pile is a mirror of the other.

   Weather is grey and blue, never green: this graphic's whole job is to be
   red, orange, green and blue in that order, and a green cloud would cost the
   one band that is already green. Like the sensor hues in lib/sensors.js these
   belong to no token and are not meant to.
     edge  #93a6ab  a hairline, not a border
     rain  #2f7fd0  3.94 on the plate, clear of the 3 : 1 a graphic needs */
const SKY = { edge:'#93a6ab', rain:'#2f7fd0' }

/* A cloud is drawn in its own 96 x 30 box with its base line at the bottom of
   it, so a cloud is placed by naming where its base sits and how wide its foot
   is, and nothing else. Every circle's top is at or below 0 and every bottom
   at or above the slab, so a cloud cannot print with a straight cut down one
   side the way an earlier oversized pair did. No two radii in a set are equal,
   because a row of same-sized bumps is the thing that looked stamped. */
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

/* The feet, in viewBox units: the left spans x 13 to 83 and the right 237 to
   307, so 48 and 272 are their centres and a cloud centred there is centred on
   its own foot at any size the dial is drawn at. BASE_Y is eight under the
   bottom of the band, so each band ends inside its cloud rather than beside
   it, and the cloud's own top sits six above that bottom, so a band only has
   to carry about 5% of its length to clear the cloud and be read. */
/* Four units in from each foot's own centre, so a 96-wide cloud stops short
   of the plate's edge on both sides. Centred exactly on the feet, each cloud
   ran into the rounded corner of the plate and read as bleeding out of the
   frame rather than sitting inside it. */
const FOOT = { calm: 52, peak: 268 }
const BASE_Y = 184

export function ArchWeather() {
  /* Two dials share a page on more than one route, so the gradient ids cannot
     be constants: the second <defs> would silently lose to the first. */
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const calm = `mm-calm-${uid}`, peak = `mm-peak-${uid}`
  return (
    <g aria-hidden style={{ pointerEvents:'none' }}>
      <defs>
        {/* userSpaceOnUse, not the default objectBoundingBox. With the default
            each of the seven shapes in a cloud gets its own copy of the ramp
            scaled to its own box, so every lobe prints as a separately shaded
            disc and the pile reads as a bag of balls. In user space the ramp is
            one ramp across the whole cloud, which is the only way a union of
            circles lights like one object. The stops are the cloud's own y
            range in viewBox units.

            The white cloud's ramp travels almost nowhere, and that is the fix
            for the second thing that went wrong with it. A ramp ending two
            steps off the plate left the bottom half of the cloud at the same
            value as the sky behind it, so all that printed was the outline
            and the flat base: a pill, not a cloud. It ends well clear of the
            plate now, so the whole shape is one solid lighter mass and the
            hairline is a rim on it rather than the only thing drawing it. */}
        <linearGradient id={calm} gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="184">
          <stop offset="0" stopColor="#ffffff"/>
          <stop offset="1" stopColor="#f0f8f9"/>
        </linearGradient>
        <linearGradient id={peak} gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="184">
          <stop offset="0" stopColor="#7d8b96"/>
          <stop offset="1" stopColor="#4c5967"/>
        </linearGradient>
      </defs>
      {/* The white one carries a heavier rim than the grey one, which is not
          a style choice. A dark cloud draws its own silhouette out of its fill;
          a white cloud on a pale sky has no fill contrast to draw one with, so
          the lobes stop reading and the pile goes flat. The rim is what gives
          it an outline to be a cloud with. */}
      <Cloud cx={FOOT.calm} base={BASE_Y} kind="calm" id={calm} rim={2}/>
      <Cloud cx={FOOT.peak} base={BASE_Y} kind="peak" id={peak}/>
      {/* Rain, out of the underside of the peak cloud. Three drops at three
          lengths; three identical ones looked printed on. */}
      <g className="mm-rain" stroke={SKY.rain} strokeLinecap="round">
        <line x1="256" y1="187" x2="253" y2="196" strokeWidth="2.6"/>
        <line x1="272" y1="189" x2="269" y2="199" strokeWidth="3"/>
        <line x1="289" y1="187" x2="286" y2="195" strokeWidth="2.3"/>
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
   One solid paint at full strength is both brighter and sharper.

   TRACK is the unfilled part of each band, and it is the other half of why
   this graphic disappeared into the page. It was `stroke-mist`, which is a
   near-white on a near-white ground, so at a middling score the only thing
   drawn was a short coloured stub with nothing around it and no shape to read.
   At #bcd6db the four tracks together are a solid arch the eye catches first,
   and the colour fills it in. It is not text and never carries a value on its
   own, so 1.6 : 1 against the plate is the right weight rather than a floor it
   fails. */
function Band({ r, glow, pct, dim }) {
  const shown = useCount(pct)
  return (
    <g opacity={dim ? 0.24 : 1} className="transition-opacity duration-200"
      style={{ pointerEvents: 'none' }}>
      <path d={arcPath(r, 100)} fill="none" strokeWidth={BAND} stroke={TRACK}/>
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
          {/* The sky the whole thing stands in, drawn first and carrying the
              asset's own edge. Without it the arch, the clouds and the rain
              were three marks floating on whatever ground the page happened to
              have, which is what "it blends in with background" was pointing
              at. With it they are one framed picture at every size. */}
          <rect x="1" y="1" width={VW - 2} height={VH - 2} rx="14"
            fill={PLATE} stroke={EDGE} strokeWidth="1.6"/>
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
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[28.5%]
          flex flex-col items-center">
          <span className="font-display text-dial font-medium leading-none tracking-tight text-ink">{shown}</span>
          <span className="mt-1 text-tick text-ink-3">out of 100</span>
        </div>
        {/* the arch is a scale; its feet say so */}
        {/* their own strip below the feet. Sitting level with the arch put
            them under the shortest band, which is exactly where a low reading
            draws the eye. */}
        {/* Centred under each foot rather than pinned to the box corners. The
            clouds now occupy those corners, and "calm" was printing on top of
            the white one. 15% and 85% are the feet's own centres in the
            viewBox, so the words track the ends they name at any size. */}
        <span aria-hidden className="absolute bottom-[2.5%] left-[15%] -translate-x-1/2 text-tick text-ink-3">calm</span>
        <span aria-hidden className="absolute bottom-[2.5%] left-[85%] -translate-x-1/2 text-tick text-ink-3">peak</span>
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
      <p className="mt-1 flex justify-between text-tick text-ink-3">
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
          <p className="mt-1 text-tick text-ink-3">
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
          underline-offset-4 hoverOnly:text-accent-ink">Close {s.name.toLowerCase()}</button>
    </section>
  )
}
