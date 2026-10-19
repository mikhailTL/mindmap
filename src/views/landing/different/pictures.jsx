import React from 'react'
import { contourPath } from '../../../ui/scenes/kit'
import { cn } from '../../../lib/utils'

/* The eight drawings for "What makes MindMap different", one per point, shown
 * one at a time on the stage in Different.jsx. Owner, 18 October: the old
 * pictures and their animations looked "very childish"; he asked for
 * "more isometric stuff and better quality animation design". So each is a
 * plain isometric object on a faint grid ground with contour lines:
 *
 *   score    a dial standing on a plate, its needle easing
 *   network  three linked tiles, a lock on the teen's
 *   patch    the patch and a phone side by side
 *   heads    a phone with a traffic light beside it
 *   settle   a peak curve settling on a graph plate
 *   event    a calendar with stress rising before a marked day
 *   ai       chat panels stacked in the air
 *   toolkit  three stepped levels with a block climbing them
 *
 * True isometric (30 degrees), site colours only. Decorative: the stage in
 * Different.jsx carries the text. One motion each, transform, opacity or
 * stroke-dashoffset only, running only while its drawing is the one shown
 * (`.dif-on`) and on screen; prefers-reduced-motion leaves the still frame. */

const C = Math.sqrt(3) / 2
const S = 0.5
const r1 = n => Math.round(n * 10) / 10

/* Plane (x, y, z) to screen. x runs down-right, y down-left, z up. */
const iso = (x, y, z = 0) => [r1((x - y) * C), r1((x + y) * S - z)]
/* Draw flat on the plane at height z. */
const plane = z => `matrix(${C} ${S} ${-C} ${S} 0 ${-z})`
/* Draw upright in the plane y = y0, (u, v) being (x, z): v runs up. */
const wall = y0 => `matrix(${C} ${S} 0 -1 ${r1(-y0 * C)} ${r1(y0 * S)})`
/* Upright in the plane x = x0, (u, v) being (y, z): it faces down-right. */
const wallX = x0 => `matrix(${-C} ${S} 0 -1 ${r1(x0 * C)} ${r1(x0 * S)})`

const INK = '#0d2b1e'
const ACCENT = '#157446'
const MINT = '#3ecf9a'
const BEAM = '#1d8fb0'
const SCREEN = '#eef8f3'
const TONE = {
  white:  { top: '#ffffff', left: '#e5efea', right: '#cfe1d8' },
  mint:   { top: '#e6f6ee', left: '#cdeadb', right: '#b2d8c4' },
  accent: { top: '#1f8d58', left: '#157446', right: '#0f5836' },
}

function roundRect(x, y, w, d, r, n = 7) {
  const pts = []
  const corners = [[x + w - r, y + r, -90], [x + w - r, y + d - r, 0], [x + r, y + d - r, 90], [x + r, y + r, 180]]
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= n; i++) {
      const a = (a0 + (90 * i) / n) * Math.PI / 180
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
    }
  }
  return pts
}
const toPath = pts => 'M' + pts.map(p => p.map(r1).join(' ')).join('L') + 'Z'

/* Convex hull, monotone chain: the outline of an extruded slab. */
function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo = [], hi = []
  for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q) }
  for (const q of p.reverse()) { while (hi.length > 1 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q) }
  return lo.slice(0, -1).concat(hi.slice(0, -1))
}

const useUid = () => React.useId().replace(/[^a-zA-Z0-9]/g, '')

/* A rounded slab: two shaded sides meeting at the front corner, a lit top
   with a fine highlight, and whatever is drawn flat on its top. */
function Slab({ x, y, z = 0, w, d, h, r = 4, tone = 'white', children }) {
  const id = useUid()
  const t = TONE[tone]
  const flat = roundRect(x, y, w, d, Math.min(r, w / 2, d / 2))
  const top = flat.map(([a, b]) => iso(a, b, z + h))
  const side = hull(flat.map(([a, b]) => iso(a, b, z)).concat(top))
  const xs = side.map(p => p[0])
  const left = Math.min(...xs), right = Math.max(...xs)
  const f = (iso(x + w, y + d)[0] - left) / (right - left || 1)
  const soft = Math.min(0.08, (r * C) / (right - left || 1) / 1.5)
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={left} x2={right} y1="0" y2="0">
          <stop offset="0" stopColor={t.left}/>
          <stop offset={Math.max(0, f - soft)} stopColor={t.left}/>
          <stop offset={Math.min(1, f + soft)} stopColor={t.right}/>
          <stop offset="1" stopColor={t.right}/>
        </linearGradient>
      </defs>
      <path d={toPath(side)} fill={`url(#${id})`}/>
      <path d={toPath(top)} fill={t.top}/>
      <path d={toPath(top)} fill="none" stroke="#fff" strokeOpacity={tone === 'accent' ? 0.2 : 0.9} strokeWidth="0.8"/>
      {children && <g transform={plane(z + h)}>{children}</g>}
    </g>
  )
}

/* A soft contact shadow, tinted with the ink green. `className` goes on the
   group, so a breathing animation never overrides the shadow's own opacity. */
function Shadow({ x, y, z = 0, w, d, r = 4, blur, opacity = 0.14, className }) {
  return (
    <g transform={plane(z)} className={className}>
      <path d={toPath(roundRect(x + 3, y + 5, w, d, Math.min(r, w / 2, d / 2)))} fill={INK} opacity={opacity}
        filter={`url(#${blur})`}/>
    </g>
  )
}

const LINE = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }

/* Text lines drawn flat on a top face. */
function Lines({ x, y, widths, gap = 7, opacity = 0.14 }) {
  return widths.map((w, i) => (
    <rect key={i} x={x} y={y + i * gap} width={w} height="2.6" rx="1.3" fill={INK} opacity={opacity}/>
  ))
}

/* The ground every drawing stands on: white to a pale mint, light from the
   top left, a fine isometric grid that fades out at the edges, and a few
   contour lines round `focus`. 300 by 220, cropped to the stage's shape, so
   each drawing keeps to the middle 270 by 180. */
function Stage({ id, at = [0, 0], focus = [0, 0], children }) {
  const [cx, cy] = at
  const box = [cx - 150, cy - 110, 300, 220]
  const grid = []
  for (let k = -220; k <= 220; k += 22) grid.push(`M${k} -220V220M-220 ${k}H220`)
  return (
    <svg viewBox={box.join(' ')} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"
      className="absolute inset-0 block h-full w-full">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff"/><stop offset="1" stopColor="#e3f3ea"/>
        </linearGradient>
        <radialGradient id={`${id}l`} cx="0.16" cy="0.04" r="0.9">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95"/>
          <stop offset="0.4" stopColor="#bfe9ef" stopOpacity="0.18"/>
          <stop offset="1" stopColor="#bfe9ef" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`${id}f`} cx="0.5" cy="0.56" r="0.55">
          <stop offset="0" stopColor="#fff"/><stop offset="0.55" stopColor="#fff" stopOpacity="0.7"/>
          <stop offset="1" stopColor="#fff" stopOpacity="0"/>
        </radialGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x={box[0]} y={box[1]} width={box[2]} height={box[3]}>
          <rect x={box[0]} y={box[1]} width={box[2]} height={box[3]} fill={`url(#${id}f)`}/>
        </mask>
        <filter id={`${id}b`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.4"/>
        </filter>
      </defs>
      <rect x={box[0]} y={box[1]} width={box[2]} height={box[3]} fill={`url(#${id}g)`}/>
      <rect x={box[0]} y={box[1]} width={box[2]} height={box[3]} fill={`url(#${id}l)`}/>
      <g mask={`url(#${id}m)`}>
        <path transform={plane(0)} d={grid.join('')} fill="none" stroke={INK} strokeOpacity="0.07"
          strokeWidth="0.6" vectorEffect="non-scaling-stroke"/>
        <g transform={plane(0)} fill="none" stroke="#8fd6b8" strokeOpacity="0.55">
          {[60, 86, 112, 138].map((r, i) => (
            <path key={r} d={contourPath(focus[0], focus[1], r, { amp: 2 + i, phase: i * 0.9, squash: 1 })}
              strokeWidth="0.9" vectorEffect="non-scaling-stroke"/>
          ))}
        </g>
      </g>
      {children}
    </svg>
  )
}

/* Points along a function in the upright plane, as a path. */
const trace = (f, u0, u1, step = 2) => {
  let d = ''
  for (let u = u0; u <= u1 + 0.01; u += step) d += `${d ? 'L' : 'M'}${r1(u)} ${r1(f(u))}`
  return d
}

/* ── Mind Score: a dial standing on a plate ─────────────────────────────── */

function ScorePic() {
  const id = useUid()
  const P = { x: -58, y: -58, w: 116, d: 116, h: 10, r: 18 }
  const arch = r => {
    let d = ''
    for (let i = 0; i <= 36; i++) {
      const a = Math.PI - (Math.PI * i) / 36
      d += `${i ? 'L' : 'M'}${r1(r * Math.cos(a))} ${r1(P.h + r * Math.sin(a))}`
    }
    return d
  }
  return (
    <Stage id={id} at={[0, -8]}>
      <Shadow {...P} blur={`${id}b`}/>
      <Slab {...P} tone="white">
        <circle cx="0" cy="0" r="46" {...LINE} stroke={ACCENT} strokeOpacity="0.22" strokeWidth="1"/>
        <circle cx="0" cy="0" r="30" {...LINE} stroke={ACCENT} strokeOpacity="0.12" strokeWidth="1"/>
      </Slab>
      <g transform={wall(0)}>
        <path d={arch(44)} {...LINE} strokeLinecap="butt" stroke={BEAM} strokeWidth="6"/>
        <path d={arch(36)} {...LINE} strokeLinecap="butt" stroke={MINT} strokeWidth="6"/>
        <path d={arch(28)} {...LINE} strokeLinecap="butt" stroke={ACCENT} strokeWidth="6"/>
        <g transform={`translate(0 ${P.h})`}>
          <g className="dif-needle" transform="rotate(112)">
            <path d="M0 0H34" {...LINE} stroke={INK} strokeWidth="2.4"/>
          </g>
          <circle r="4" fill={INK}/>
        </g>
      </g>
    </Stage>
  )
}

/* ── Support network: three linked tiles, the teen's locked ─────────────── */

/* A person: a short cylinder with a sphere above. No face. */
function Token({ at, color, dark }) {
  const [x, y] = at
  return (
    <g>
      <ellipse cx={x} cy={y} rx="8" ry="4.6" fill={INK} opacity="0.12"/>
      <path d={`M${x - 7} ${y - 11}v11a7 4 0 0 0 14 0v-11z`} fill={dark}/>
      <ellipse cx={x} cy={y - 11} rx="7" ry="4" fill={color}/>
      <circle cx={x} cy={y - 21} r="5.4" fill={color}/>
    </g>
  )
}

function Lock({ x, y, z }) {
  const w = 12, d = 7, h = 10
  const top = z + h
  return (
    <g>
      <g transform={wall(y + d / 2)}>
        <path d={`M${x + 3} ${top - 1}V${top + 4}a3 3 0 0 0 6 0V${top - 1}`} {...LINE} stroke={INK} strokeWidth="2"/>
      </g>
      <Slab x={x} y={y} z={z} w={w} d={d} h={h} r={1.5} tone="accent"/>
    </g>
  )
}

function NetworkPic() {
  const id = useUid()
  const b = `${id}b`
  const TEEN = { x: -27, y: -27, w: 54, d: 54, h: 12, r: 11 }
  const PARENT = { x: -96, y: -20, w: 40, d: 40, h: 8, r: 9 }
  const PROF = { x: -20, y: -96, w: 40, d: 40, h: 8, r: 9 }
  const link = (a, c) => {
    const m = [r1((a[0] + c[0]) / 2), r1((a[1] + c[1]) / 2 - 16)]
    return `M${a.join(' ')}Q${m.join(' ')} ${c.join(' ')}`
  }
  const toParent = link(iso(-20, 4, TEEN.h), iso(-62, 4, PARENT.h))
  const toProf = link(iso(4, -20, TEEN.h), iso(4, -62, PROF.h))
  return (
    <Stage id={id} at={[0, -26]} focus={[-20, -20]}>
      {[PARENT, PROF, TEEN].map((s, i) => <Shadow key={i} {...s} blur={b}/>)}
      <Slab {...PARENT} tone="white"/>
      <Slab {...PROF} tone="white"/>
      <Token at={iso(-76, 2, PARENT.h)} color={BEAM} dark="#146f8a"/>
      <Token at={iso(2, -76, PROF.h)} color="#2a5744" dark={INK}/>
      <Slab {...TEEN} tone="mint">
        <rect x={TEEN.x + 6} y={TEEN.y + 6} width={TEEN.w - 12} height={TEEN.d - 12} rx="8" {...LINE}
          stroke={ACCENT} strokeOpacity="0.3" strokeWidth="1"/>
      </Slab>
      {[toParent, toProf].map(d => (
        <g key={d}>
          <path d={d} {...LINE} stroke={BEAM} strokeOpacity="0.25" strokeWidth="1.2"/>
          <path className="dif-flow" d={d} {...LINE} stroke={BEAM} strokeWidth="1.6" strokeDasharray="6 12"/>
        </g>
      ))}
      <Token at={iso(-8, 8, TEEN.h)} color={MINT} dark={ACCENT}/>
      <Lock x={6} y={-16} z={TEEN.h}/>
    </Stage>
  )
}

/* ── Patch or phone: the two side by side ───────────────────────────────── */

function PatchPic() {
  const id = useUid()
  const b = `${id}b`
  const PATCH = { x: -34, y: 26, w: 44, d: 56, h: 5, r: 16 }
  const PHONE = { x: 26, y: -40, w: 56, d: 102, h: 8, r: 12 }
  const pc = [PATCH.x + PATCH.w / 2, PATCH.y + PATCH.d / 2]
  const sx = PHONE.x + 6, sy = PHONE.y + 9, sw = PHONE.w - 12, sd = PHONE.d - 18
  return (
    <Stage id={id} at={[-6, 4]} focus={[0, 20]}>
      <Shadow {...PATCH} blur={b} className="dif-shade"/>
      <Shadow {...PHONE} blur={b} className="dif-shade dif-late"/>
      <g className="dif-float">
        <Slab {...PATCH} tone="white">
          <rect x={pc[0] - 9} y={pc[1] - 9} width="18" height="18" rx="6" fill="#d5f2e8" stroke={ACCENT}
            strokeOpacity="0.45" strokeWidth="1"/>
          <rect x={pc[0] - 15} y={pc[1] - 15} width="30" height="30" rx="10" {...LINE} stroke={ACCENT}
            strokeOpacity="0.16" strokeWidth="1"/>
        </Slab>
      </g>
      <g className="dif-float dif-late">
        <Slab {...PHONE} tone="white">
          <rect x={sx} y={sy} width={sw} height={sd} rx="7" fill={SCREEN}/>
          <path d={`M${sx + 6} ${sy + 40}h10l4-9 6 17 4-8h${sw - 36}`} {...LINE} stroke={ACCENT} strokeWidth="1.6"/>
          <Lines x={sx + 6} y={sy + 58} widths={[28, 20]}/>
          <circle cx={PHONE.x + PHONE.w / 2} cy={PHONE.y + 4.5} r="2" fill={INK} opacity="0.35"/>
        </Slab>
      </g>
    </Stage>
  )
}

/* ── Heads Up: a phone and a traffic light ─────────────────────────────── */

function HeadsPic() {
  const id = useUid()
  const b = `${id}b`
  const PHONE = { x: -44, y: -26, w: 58, d: 102, h: 8, r: 12 }
  const CARD = { x: PHONE.x + 6, y: PHONE.y + 14, w: PHONE.w - 12, d: 30, h: 3, r: 6, z: PHONE.h + 18 }
  const POST = { x: 26, y: -56, w: 16, d: 12, h: 56, r: 3 }
  const face = POST.y + POST.d
  const lamps = [[44, '#f6e3de', '#a8321f'], [30, '#f6ecdc', '#99590c'], [16, MINT, ACCENT]]
  return (
    <Stage id={id} at={[0, -6]} focus={[0, 10]}>
      <Shadow {...PHONE} blur={b}/>
      <Shadow {...POST} blur={b} opacity={0.12}/>
      <Slab {...PHONE} tone="white">
        <rect x={PHONE.x + 6} y={PHONE.y + 9} width={PHONE.w - 12} height={PHONE.d - 18} rx="7" fill={SCREEN}/>
        <Lines x={PHONE.x + 12} y={PHONE.y + 58} widths={[34, 26, 30]} gap={8}/>
      </Slab>
      <Shadow {...CARD} z={PHONE.h} blur={b} opacity={0.12} className="dif-shade"/>
      <g className="dif-float">
        <Slab {...CARD} tone="white">
          <rect x={CARD.x + 6} y={CARD.y + 8} width="14" height="14" rx="4" fill={MINT}/>
          <Lines x={CARD.x + 25} y={CARD.y + 10} widths={[16, 11]}/>
        </Slab>
      </g>
      <Slab {...POST} tone="white"/>
      <g transform={wall(face)}>
        {lamps.map(([v, fill, ring]) => (
          <circle key={v} cx={POST.x + POST.w / 2} cy={v} r="4.6" fill={fill} stroke={ring} strokeOpacity="0.5"
            strokeWidth="0.9"/>
        ))}
      </g>
    </Stage>
  )
}

/* ── Recovery time: a peak settling on a graph plate ───────────────────── */

const BASE = 20
const settleCurve = u => u < -30
  ? BASE + 44 * Math.pow(Math.sin(((u + 72) / 42) * Math.PI / 2) ** 2, 1.4)
  : BASE + 44 * Math.exp(-(u + 30) / 15)

function SettlePic() {
  const id = useUid()
  const P = { x: -84, y: -34, w: 168, d: 68, h: 6, r: 10 }
  const line = trace(settleCurve, -72, 72)
  const grid = []
  for (let x = P.x + 14; x < P.x + P.w; x += 22) grid.push(`M${x} ${P.y + 8}V${P.y + P.d - 8}`)
  return (
    <Stage id={id} at={[0, -14]}>
      <defs>
        <linearGradient id={`${id}a`} gradientUnits="userSpaceOnUse" x1="0" y1={BASE + 44} x2="0" y2={P.h}>
          <stop offset="0" stopColor={MINT} stopOpacity="0.4"/><stop offset="1" stopColor={MINT} stopOpacity="0.04"/>
        </linearGradient>
      </defs>
      <Shadow {...P} blur={`${id}b`}/>
      <Slab {...P} tone="white">
        <path d={grid.join('')} {...LINE} stroke={INK} strokeOpacity="0.08" strokeWidth="1"/>
      </Slab>
      <g transform={wall(0)}>
        <path className="dif-fade" d={`${line}L72 ${P.h}L-72 ${P.h}Z`} fill={`url(#${id}a)`}/>
        <path d={`M-72 ${BASE}H72`} {...LINE} stroke={INK} strokeOpacity="0.28" strokeWidth="1" strokeDasharray="3 4"/>
        <path className="dif-draw" d={line} pathLength="1" strokeDasharray="1" {...LINE} stroke={ACCENT}
          strokeWidth="2.4"/>
        <path className="dif-fade" d={`M38 ${P.h}V${BASE + 10}`} {...LINE} stroke={BEAM} strokeWidth="2"/>
      </g>
    </Stage>
  )
}

/* ── Stress before events: a calendar, a marked day, a rising curve ────── */

/* The days run up and to the right (along -y), so a curve rising towards
   the marked day also climbs the picture. */
const CAL = { x: -46, y: -72, w: 92, d: 144, h: 8, r: 10 }
const DAY_W = 20
const dayY = k => CAL.y + CAL.d - 2 - DAY_W * k
const ROW_X = [CAL.x + 20, CAL.x + 44, CAL.x + 68]
const MARK = 5
const PEAK_U = dayY(MARK) - DAY_W / 2
const rise = u => u >= PEAK_U
  ? 12 + 50 * Math.pow((dayY(0) - 6 - u) / (dayY(0) - 6 - PEAK_U), 2.4)
  : 62 - (PEAK_U - u) * 2.2

function EventPic() {
  const id = useUid()
  const b = `${id}b`
  const grid = []
  for (let k = 1; k < 7; k++) grid.push(`M${ROW_X[0]} ${dayY(k)}H${CAL.x + CAL.w - 4}`)
  for (const x of ROW_X.slice(1)) grid.push(`M${x} ${CAL.y + 4}V${CAL.y + CAL.d - 4}`)
  const DAY = { x: ROW_X[1] + 3, y: dayY(MARK + 1) + 3, w: 24 - 6, d: DAY_W - 6, h: 4, r: 3 }
  let curve = ''
  for (let u = dayY(0) - 6; u >= PEAK_U - 12; u -= 2) curve += `${curve ? 'L' : 'M'}${r1(u)} ${r1(rise(u))}`
  const u0 = dayY(0) - 6, u1 = PEAK_U - 12
  return (
    <Stage id={id} at={[0, -18]}>
      <Shadow {...CAL} blur={b}/>
      <Slab {...CAL} tone="white">
        <rect x={CAL.x + 5} y={CAL.y + 5} width="11" height={CAL.d - 10} rx="5" fill="#dcefe4"/>
        <path d={grid.join('')} {...LINE} stroke={INK} strokeOpacity="0.09" strokeWidth="1"/>
      </Slab>
      <g transform={wallX(ROW_X[1])}>
        <path d={`${curve}L${u1} ${CAL.h}L${u0} ${CAL.h}Z`} fill={MINT} opacity="0.16"/>
        <path d={curve} {...LINE} stroke={BEAM} strokeWidth="2.2"/>
        <path d={`M${PEAK_U} ${CAL.h}V${rise(PEAK_U) + 6}`} {...LINE} stroke={ACCENT} strokeWidth="1.2" strokeDasharray="2 3"/>
      </g>
      <Shadow {...DAY} z={CAL.h} blur={b} opacity={0.24} className="dif-shade dif-lift-shade"/>
      <g className="dif-lift">
        <Slab {...DAY} z={CAL.h} tone="accent"/>
      </g>
    </Stage>
  )
}

/* ── MindMap AI: chat panels stacked in the air ─────────────────────────── */

const PANELS = [
  { x: -64, y: -4, w: 84, d: 48, z: 6, tone: 'white', lines: [44, 56, 34] },
  { x: -8, y: -50, w: 66, d: 34, z: 34, tone: 'mint', lines: [36, 24], me: true },
  { x: -52, y: -16, w: 84, d: 48, z: 62, tone: 'white', lines: [52, 40, 46] },
]

/* A bubble's tail, flat with its top: front left for MindMap AI, back right
   for the reader. */
const tail = ({ x, y, w, d, me }) => me
  ? `M${x + w - 14} ${y + 1}L${x + w + 7} ${y - 7}L${x + w - 1} ${y + 12}Z`
  : `M${x + 10} ${y + d - 1}L${x + 2} ${y + d + 9}L${x + 24} ${y + d - 1}Z`

function AiPic() {
  const id = useUid()
  const b = `${id}b`
  return (
    <Stage id={id} at={[-4, -26]} focus={[0, 0]}>
      {PANELS.map((p, i) => (
        <Shadow key={i} {...p} z={0} blur={b} opacity={0.1} className={cn('dif-shade', i === 1 && 'dif-late', i === 2 && 'dif-later')}/>
      ))}
      {PANELS.map((p, i) => (
        <g key={i} className={cn('dif-float', i === 1 && 'dif-late', i === 2 && 'dif-later')}>
          <Slab {...p} h={3} r={8} tone={p.tone}>
            <path d={tail(p)} fill={TONE[p.tone].top}/>
            <Lines x={p.x + 10} y={p.y + 12} widths={p.lines} gap={8}/>
          </Slab>
        </g>
      ))}
    </Stage>
  )
}

/* ── Toolkit with levels: three steps and a block climbing them ────────── */

const STEPS = [
  { x: -66, y: -24, w: 42, d: 48, h: 48 },
  { x: -24, y: -24, w: 42, d: 48, h: 32 },
  { x: 18, y: -24, w: 42, d: 48, h: 16 },
]
const SPOT = STEPS.map(s => iso(s.x + s.w / 2, 0, s.h))

const HOP = (() => {
  const [a, m, c] = [SPOT[2], SPOT[1], SPOT[0]]
  const at = ([x, y], up = 0) => `transform:translate(${x}px,${r1(y - up)}px)`
  return `@keyframes dif-hop{
0%{${at(a)};opacity:0}6%,18%{${at(a)};opacity:1}
24%{${at([(a[0] + m[0]) / 2, (a[1] + m[1]) / 2], 14)}}30%,46%{${at(m)}}
52%{${at([(m[0] + c[0]) / 2, (m[1] + c[1]) / 2], 14)}}58%,88%{${at(c)};opacity:1}
96%,100%{${at(c)};opacity:0}}`
})()

function ToolkitPic() {
  const id = useUid()
  const b = `${id}b`
  const top = SPOT[0]
  return (
    <Stage id={id} at={[0, -12]} focus={[0, 0]}>
      {STEPS.map((s, i) => <Shadow key={i} {...s} blur={b}/>)}
      {STEPS.map((s, i) => (
        <Slab key={i} {...s} r={5} tone={i === 0 ? 'mint' : 'white'}>
          {Array.from({ length: 3 - i }, (_, k) => (
            <rect key={k} x={s.x + 8 + k * 9} y={s.y + s.d - 14} width="6" height="2.6" rx="1.3"
              fill={ACCENT} opacity={i === 0 ? 0.6 : 0.35}/>
          ))}
        </Slab>
      ))}
      <g className="dif-hop" transform={`translate(${top[0]} ${top[1]})`}>
        <Slab x={-6} y={-6} w={12} d={12} h={12} r={2} tone="accent"/>
      </g>
    </Stage>
  )
}

/* One motion per drawing, and only for the one shown. Static frames are the
   finished ones: the needle at the day's reading, the curve drawn, the block
   on the top step. */
export const DIF_CSS = `
${HOP}
@keyframes dif-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes dif-lift{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes dif-shade{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes dif-needle{0%,100%{transform:rotate(104deg)}50%{transform:rotate(126deg)}}
@keyframes dif-flow{to{stroke-dashoffset:-36}}
@keyframes dif-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes dif-fade{0%,45%{opacity:0}100%{opacity:1}}
@keyframes dif-fill{from{transform:scaleY(0)}to{transform:scaleY(1)}}
.dif-fill{animation:dif-fill linear both}
.dif-on .dif-float,.dif-on .dif-shade{animation:dif-float 6.4s cubic-bezier(.45,.05,.55,.95) infinite}
.dif-on .dif-shade{animation-name:dif-shade}
.dif-on .dif-lift{animation:dif-lift 5s cubic-bezier(.45,.05,.55,.95) infinite}
.dif-on .dif-shade.dif-lift-shade{animation-duration:5s}
.dif-on .dif-late{animation-delay:-2.1s}
.dif-on .dif-later{animation-delay:-4.2s}
.dif-on .dif-needle{animation:dif-needle 7s cubic-bezier(.45,.05,.55,.95) infinite}
.dif-on .dif-flow{animation:dif-flow 4.8s linear infinite}
.dif-on .dif-draw{animation:dif-draw 2.2s cubic-bezier(.65,0,.35,1) both}
.dif-on .dif-fade{animation:dif-fade 2.6s cubic-bezier(.23,1,.32,1) both}
.dif-on .dif-hop{animation:dif-hop 7s cubic-bezier(.45,.05,.55,.95) infinite}
[data-off] .dif-on *{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.dif-on *,.dif-fill{animation:none!important}}
`

/* Small line marks for the list rows, one per point, in the same isometric
   habit: 2 to 1 slopes, one stroke weight. */
const G = {
  score:   'M2 19l12-6 12 6-12 6zM7 16.5a7 7 0 0 1 14 0M14 16.5l3.5-4.5',
  network: 'M2 8.5l5-2.5 5 2.5-5 2.5zM16 8.5l5-2.5 5 2.5-5 2.5zM9 20.5l5-2.5 5 2.5-5 2.5zM8.5 11.5l3.5 6.5M19.5 11.5l-3.5 6.5',
  patch:   'M2 18.5l6-3 6 3-6 3zM12 10.5l5-2.5 10 5-5 2.5z',
  heads:   'M2 17l5-2.5 10 5-5 2.5zM20 3.5h5.5v17H20zM22.75 6.2a1.4 1.4 0 1 1 0 2.8a1.4 1.4 0 1 1 0-2.8zM22.75 10.6a1.4 1.4 0 1 1 0 2.8a1.4 1.4 0 1 1 0-2.8zM22.75 15a1.4 1.4 0 1 1 0 2.8a1.4 1.4 0 1 1 0-2.8z',
  settle:  'M3 3.5v21h22M5 20.5c3 0 4-13 6.5-13S15 19 19 20s4 .5 6 .5',
  event:   'M2 18l12-6 12 6-12 6zM5 18.5c5-.5 9-3 13-12.5M18 6v9',
  ai:      'M2 19.5l8-4 8 4-8 4zM10 10.5l8-4 8 4-8 4z',
  toolkit: 'M3 24.5h22M3 24.5v-6h7v-6h7v-6h8v18.5',
}

export function Glyph({ id, className }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" focusable="false" className={className}>
      <path d={G[id]} {...LINE} stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  )
}

/* Keyed by the point id in Different.jsx. */
export const PICTURES = {
  score: ScorePic,
  network: NetworkPic,
  patch: PatchPic,
  heads: HeadsPic,
  settle: SettlePic,
  event: EventPic,
  ai: AiPic,
  toolkit: ToolkitPic,
}
