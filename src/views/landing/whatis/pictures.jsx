import React from 'react'
import { contourPath } from '../../../ui/scenes/kit'

/* The three illustrations for the What is MindMap? band. Owner, 18 October:
 * the old demo pictures (readings, a consent table, role tabs, a Toolkit
 * panel) were "wayyy too complex"; he asked for simple isometric drawings
 * with better animation. So each card gets one drawing and one slow motion:
 *
 *   patch    a patch on a forearm sends a signal to a phone showing one number
 *   network  teen, parent and Counselor/Professional tiles, the teen's locked
 *   app      a phone with three app layers (Trends, Toolkit, AI) lifting off
 *
 * Drawn here by hand: true isometric (30 degrees), site tokens only. The
 * ground is lit from the top left and carries the site scenes' contour rings
 * (owner, 18 October: more depth and light across the site). The
 * drawings are decorative (aria-hidden); the card text carries the meaning.
 * Motion is CSS transform and opacity only, 5 to 7 second eased loops, and
 * stops under prefers-reduced-motion. */

const C = Math.sqrt(3) / 2
const S = 0.5
const r1 = n => Math.round(n * 10) / 10

/* Plane (x, y, z) to screen. x runs down-right, y down-left, z up. */
const iso = (x, y, z = 0) => [r1((x - y) * C), r1((x + y) * S - z)]
/* Draw children flat on the plane at height z. Strokes inside should be
   non-scaling. */
const plane = z => `matrix(${C} ${S} ${-C} ${S} 0 ${-z})`

const INK = '#0d2b1e'
const TONE = {
  white:  { top: '#ffffff', left: '#e5efea', right: '#cfe1d8' },
  arm:    { top: '#f4f7f5', left: '#dde9e3', right: '#c6dace' },
  ink:    { top: '#1b4532', left: '#0d2b1e', right: '#071a12' },
  accent: { top: '#1f8d58', left: '#157446', right: '#0f5836' },
  beam:   { top: '#2aa3c5', left: '#1d8fb0', right: '#146f8a' },
}

/* Points round a rounded rectangle on the plane, corner arcs sampled. */
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
const toPath = pts => 'M' + pts.map(p => p.join(' ')).join('L') + 'Z'

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
   with a fine highlight, and whatever sits on its top face. */
function Slab({ x, y, z = 0, w, d, h, r = 4, tone = 'white', children }) {
  const id = useUid()
  const t = TONE[tone]
  const flat = roundRect(x, y, w, d, Math.min(r, w / 2, d / 2))
  const top = flat.map(([a, b]) => iso(a, b, z + h))
  const side = hull(flat.map(([a, b]) => iso(a, b, z)).concat(top))
  const xs = side.map(p => p[0])
  const left = Math.min(...xs), right = Math.max(...xs)
  const front = iso(x + w, y + d)[0]
  const f = (front - left) / (right - left || 1)
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
      <path d={toPath(top)} fill="none" stroke="#fff" strokeOpacity={tone === 'white' || tone === 'arm' ? 0.9 : 0.18}
        strokeWidth="0.8"/>
      {children && <g transform={plane(z + h)}>{children}</g>}
    </g>
  )
}

/* A soft contact shadow on the ground (or on whatever z it is given). */
function Shadow({ x, y, z = 0, w, d, r = 4, blur, opacity = 0.16, className, style }) {
  return (
    <g transform={plane(z)}>
      <path d={toPath(roundRect(x + 3, y + 5, w, d, r))} fill={INK} opacity={opacity}
        filter={`url(#${blur})`} className={className} style={style}/>
    </g>
  )
}

/* The ground: a soft wash lit from the top left, and contour rings lying
   flat on the plane round `focus`, the same map lines the site's scenes use
   (ui/scenes). They drift a little; under reduced motion they hold. */
function Stage({ id, ground, children, viewBox = '-128 -36 260 152.5', focus = [40, 40] }) {
  const [vx, vy, vw, vh] = viewBox.split(' ').map(Number)
  return (
    <svg viewBox={viewBox} aria-hidden="true" focusable="false" className="block h-auto w-full">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ground[0]}/><stop offset="1" stopColor={ground[1]}/>
        </linearGradient>
        <radialGradient id={`${id}l`} cx="0.18" cy="0.05" r="0.85">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95"/>
          <stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
        </radialGradient>
        <filter id={`${id}b`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2"/>
        </filter>
        <filter id={`${id}glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.2"/>
        </filter>
      </defs>
      <rect x={vx} y={vy} width={vw} height={vh} fill={`url(#${id}g)`}/>
      <rect x={vx} y={vy} width={vw} height={vh} fill={`url(#${id}l)`}/>
      <g className="mm-iso-rings">
        <g transform={plane(0)} fill="none" stroke="#157446" strokeOpacity="0.13">
          {[34, 58, 82, 106, 130].map((r, i) => (
            <path key={r} d={contourPath(focus[0], focus[1], r, { amp: 2 + i, phase: i * 0.9, squash: 1 })}
              strokeWidth="1" vectorEffect="non-scaling-stroke"/>
          ))}
        </g>
      </g>
      {children}
    </svg>
  )
}

/* A travelling point: keyframes sampled along a quadratic curve, eased, so
   the motion is transform only. */
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
function travel(name, [a, ctl, b], { from = 6, to = 58 } = {}) {
  const at = t => [0, 1].map(k => r1((1 - t) ** 2 * a[k] + 2 * (1 - t) * t * ctl[k] + t * t * b[k]))
  const N = 14
  const steps = []
  for (let i = 0; i <= N; i++) {
    const [px, py] = at(ease(i / N))
    const pct = r1(from + ((to - from) * i) / N)
    const op = i === 0 ? 0 : i === N ? 0.9 : 1
    steps.push(`${pct}%{transform:translate(${px}px,${py}px);opacity:${op}}`)
  }
  const [ax, ay] = a, [bx, by] = b
  return `@keyframes ${name}{0%{transform:translate(${ax}px,${ay}px);opacity:0}${steps.join('')}` +
    `${to + 8}%{transform:translate(${bx}px,${by}px);opacity:0}100%{transform:translate(${bx}px,${by}px);opacity:0}}`
}
const curve = ([a, ctl, b]) => `M${a.join(' ')}Q${ctl.join(' ')} ${b.join(' ')}`

function Dot({ name, dur, delay = 0 }) {
  return (
    <g className="mm-iso-dot" style={{ animation: `${name} ${dur}s linear ${delay}s infinite` }}>
      <circle r="5.5" fill="#3ecf9a" opacity="0.28"/>
      <circle r="2.4" fill="#3ecf9a"/>
      <circle r="1" fill="#fff"/>
    </g>
  )
}

/* ── 1. the patch ──────────────────────────────────────────────────────── */

const ARM = { x: 0, y: -20, w: 46, d: 190, h: 18, r: 22 }
const PATCH = { x: 7, y: 36, w: 32, d: 40, h: 4, r: 9 }
const PHONE1 = { x: 80, y: -16, w: 52, d: 92, h: 7, r: 10 }
const P1 = [iso(23, 56, ARM.h + PATCH.h + 3), [16, -36], iso(108, 52, PHONE1.h + 6)]
const P1_DUR = 5.6

/* ── 2. the network ────────────────────────────────────────────────────── */

const TEEN = { x: 60, y: 60, w: 58, d: 58, h: 12, r: 10 }
const PARENT = { x: -16, y: 62, w: 46, d: 46, h: 9, r: 9 }
const PROF = { x: 62, y: -16, w: 46, d: 46, h: 9, r: 9 }
const centre = (b, z = b.h) => iso(b.x + b.w / 2, b.y + b.d / 2, z)
const lift = ([px, py], dz) => [px, r1(py - dz)]
const arc = (a, b, up) => [a, [r1((a[0] + b[0]) / 2), r1((a[1] + b[1]) / 2 - up)], b]
/* From the teen's tile edge to the near edge of the other two. */
const P2A = arc(iso(TEEN.x + 4, TEEN.y + 26, TEEN.h + 2), iso(PARENT.x + PARENT.w - 4, PARENT.y + 22, PARENT.h + 2), 22)
const P2B = arc(iso(TEEN.x + 26, TEEN.y + 4, TEEN.h + 2), iso(PROF.x + 22, PROF.y + PROF.d - 4, PROF.h + 2), 22)
const P2_DUR = 6.4

/* ── 3. the app ────────────────────────────────────────────────────────── */

const PHONE3 = { x: 15, y: -5, w: 70, d: 110, h: 8, r: 13 }
const LAYERS = [
  { y: 4, z: 42, tone: 'white', glyph: 'trends' },
  { y: 38, z: 26, tone: 'white', glyph: 'toolkit' },
  { y: 72, z: 10, tone: 'accent', glyph: 'ai' },
]

export const PICTURE_CSS = `
${travel('mm-iso-p1', P1)}
${travel('mm-iso-p2a', P2A)}
${travel('mm-iso-p2b', P2B)}
.mm-iso-dot{opacity:0;will-change:transform,opacity}
@keyframes mm-iso-ripple{0%,8%{transform:scale(.6);opacity:0}14%{opacity:.7}46%,100%{transform:scale(2.4);opacity:0}}
.mm-iso-ripple{transform-box:fill-box;transform-origin:center;opacity:0;animation:mm-iso-ripple ${P1_DUR}s cubic-bezier(.22,.61,.36,1) infinite}
@keyframes mm-iso-arrive{0%,52%{opacity:0}64%{opacity:1}100%{opacity:0}}
.mm-iso-arrive{opacity:0;animation:mm-iso-arrive ${P1_DUR}s ease-out infinite}
@keyframes mm-iso-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.mm-iso-float{animation:mm-iso-float 6.6s cubic-bezier(.45,.05,.55,.95) infinite}
@keyframes mm-iso-shade{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes mm-iso-rings{0%,100%{transform:translate(0,0)}50%{transform:translate(-6px,2px)}}
.mm-iso-rings{animation:mm-iso-rings 20s cubic-bezier(.45,.05,.55,.95) infinite}
.mm-iso-shade{animation:mm-iso-shade 6.6s cubic-bezier(.45,.05,.55,.95) infinite}
[data-off] .mm-iso-dot,[data-off] .mm-iso-ripple,[data-off] .mm-iso-arrive,[data-off] .mm-iso-float,
[data-off] .mm-iso-shade,[data-off] .mm-iso-rings{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){
  .mm-iso-dot{display:none}
  .mm-iso-ripple,.mm-iso-arrive,.mm-iso-float,.mm-iso-shade,.mm-iso-dot,.mm-iso-rings{animation:none}
}
`

const STROKE = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' }

export function PatchPicture() {
  const id = useUid()
  const b = `${id}b`
  const [sx, sy] = [PHONE1.x + 6, PHONE1.y + 8]
  return (
    <Stage id={id} ground={['#eef7f2', '#d6ebe0']} focus={[23, 56]}>
      <Shadow {...ARM} blur={b}/>
      <Shadow {...PHONE1} blur={b} opacity={0.2}/>
      {/* The forearm, then the patch on it, its light, and the ripple. */}
      <Slab {...ARM} tone="arm"/>
      <Slab {...PATCH} z={ARM.h} tone="ink">
        <circle cx={PATCH.x + PATCH.w / 2} cy={PATCH.y + PATCH.d / 2} r="5" {...STROKE}
          stroke="#3ecf9a" strokeWidth="1" opacity="0.5"/>
        <circle cx={PATCH.x + PATCH.w / 2} cy={PATCH.y + PATCH.d / 2} r="2.4" fill="#3ecf9a"/>
        <circle className="mm-iso-ripple" cx={PATCH.x + PATCH.w / 2} cy={PATCH.y + PATCH.d / 2} r="7"
          {...STROKE} stroke="#3ecf9a" strokeWidth="1.2"/>
      </Slab>
      {/* The phone: one number on its screen. */}
      <Slab {...PHONE1} tone="ink">
        <rect x={sx} y={sy} width={PHONE1.w - 12} height={PHONE1.d - 16} rx="6" fill="#103a28"/>
        <rect className="mm-iso-arrive" x={sx} y={sy} width={PHONE1.w - 12} height={PHONE1.d - 16} rx="6"
          fill="#3ecf9a" opacity="0"/>
        <text x={sx + 7} y={sy + 34} fill="#3ecf9a" fontFamily="Quicksand, system-ui, sans-serif"
          fontWeight="700" fontSize="26" letterSpacing="-0.5">38</text>
        <rect x={sx + 7} y={sy + 50} width="26" height="3" rx="1.5" fill="#fff" opacity="0.14"/>
        <rect x={sx + 7} y={sy + 58} width="18" height="3" rx="1.5" fill="#fff" opacity="0.14"/>
      </Slab>
      <path d={curve(P1)} fill="none" stroke="#1d8fb0" strokeWidth="1.1" strokeDasharray="1.5 4.5"
        strokeLinecap="round" opacity="0.6"/>
      <Dot name="mm-iso-p1" dur={P1_DUR}/>
    </Stage>
  )
}

/* A person token: a short cylinder with a sphere above. No face. */
function Token({ at, color, dark }) {
  const [x, y] = at
  return (
    <g>
      <ellipse cx={x} cy={y} rx="9" ry="5.2" fill={INK} opacity="0.12"/>
      <path d={`M${x - 8} ${y - 13}v13a8 4.6 0 0 0 16 0v-13z`} fill={dark}/>
      <ellipse cx={x} cy={y - 13} rx="8" ry="4.6" fill={color}/>
      <circle cx={x} cy={y - 24} r="6.2" fill={color}/>
      <circle cx={x - 2} cy={y - 26} r="2.2" fill="#fff" opacity="0.35"/>
    </g>
  )
}

/* A small padlock standing on the teen's tile: a body block and a shackle
   drawn upright in the plane that runs down-right. */
function Lock({ x, y, z }) {
  const w = 12, d = 7, h = 10
  const y0 = y + d / 2, top = z + h
  const upright = `matrix(${C} ${S} 0 -1 ${r1(-y0 * C)} ${r1(y0 * S)})`
  return (
    <g>
      <g transform={upright}>
        <path d={`M${x + 3} ${top - 1}V${top + 4}a3 3 0 0 0 6 0V${top - 1}`} {...STROKE} stroke={INK}
          strokeWidth="2.2"/>
      </g>
      <Slab x={x} y={y} z={z} w={w} d={d} h={h} r={1.5} tone="accent">
        <circle cx={x + w / 2} cy={y + d / 2} r="1.4" fill="#3ecf9a"/>
      </Slab>
    </g>
  )
}

export function NetworkPicture() {
  const id = useUid()
  const b = `${id}b`
  const p = centre(PARENT), q = centre(PROF)
  return (
    <Stage id={id} ground={['#eef7f2', '#d6ebe0']} viewBox="-112 -6 224 131.4" focus={[89, 89]}>
      {[TEEN, PARENT, PROF].map((s, i) => <Shadow key={i} {...s} blur={b}/>)}
      <Slab {...PROF} tone="white"/>
      <Slab {...PARENT} tone="white"/>
      <Token at={[q[0], q[1] + 4]} color="#2a5744" dark={INK}/>
      <Token at={[p[0], p[1] + 4]} color="#1d8fb0" dark="#146f8a"/>
      <Slab {...TEEN} tone="white">
        <rect x={TEEN.x + 6} y={TEEN.y + 6} width={TEEN.w - 12} height={TEEN.d - 12} rx="7" {...STROKE}
          stroke="#157446" strokeWidth="1" strokeOpacity="0.35"/>
      </Slab>
      {/* The links run from the teen, who decides what each one carries. */}
      <path d={curve(P2A)} fill="none" stroke="#1d8fb0" strokeWidth="1.1" strokeDasharray="1.5 4.5"
        strokeLinecap="round" opacity="0.6"/>
      <path d={curve(P2B)} fill="none" stroke="#1d8fb0" strokeWidth="1.1" strokeDasharray="1.5 4.5"
        strokeLinecap="round" opacity="0.6"/>
      <Lock x={TEEN.x + 36} y={TEEN.y + 12} z={TEEN.h}/>
      <Token at={iso(TEEN.x + 22, TEEN.y + 36, TEEN.h)} color="#3ecf9a" dark="#157446"/>
      <Dot name="mm-iso-p2a" dur={P2_DUR}/>
      <Dot name="mm-iso-p2b" dur={P2_DUR} delay={P2_DUR / 2}/>
    </Stage>
  )
}

/* Three marks for the app layers, drawn flat on each layer's top. */
function Glyph({ kind, x, y, w, d, light }) {
  const cx = x + w / 2, cy = y + d / 2
  const ink = light ? '#ffffff' : '#157446'
  if (kind === 'trends') {
    return (
      <g>
        <path d={`M${x + 8} ${cy + 8}L${x + 18} ${cy}L${x + 26} ${cy + 5}L${x + w - 8} ${cy - 9}`} {...STROKE}
          stroke="#1d8fb0" strokeWidth="1.8"/>
        <path d={`M${x + 8} ${y + d - 6}H${x + w - 8}`} {...STROKE} stroke={INK} strokeOpacity="0.15" strokeWidth="1"/>
      </g>
    )
  }
  if (kind === 'toolkit') {
    return (
      <g>
        <circle cx={cx} cy={cy} r="9" {...STROKE} stroke={ink} strokeWidth="1.8"/>
        <circle cx={cx} cy={cy} r="3.2" fill="#3ecf9a"/>
      </g>
    )
  }
  return (
    <g>
      <path d={`M${cx - 11} ${cy - 8}h22a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-12l-6 5v-5h-4a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2z`}
        {...STROKE} stroke={ink} strokeWidth="1.6"/>
      <circle cx={cx - 5} cy={cy - 1} r="1.3" fill={ink}/>
      <circle cx={cx} cy={cy - 1} r="1.3" fill={ink}/>
      <circle cx={cx + 5} cy={cy - 1} r="1.3" fill={ink}/>
    </g>
  )
}

export function AppPicture() {
  const id = useUid()
  const b = `${id}b`
  const L = { x: PHONE3.x + 10, w: PHONE3.w - 20, d: 26, h: 4, r: 6 }
  return (
    <Stage id={id} ground={['#eef7f2', '#d6ebe0']} viewBox="-125 -52 250 146.6" focus={[50, 50]}>
      <Shadow {...PHONE3} blur={b} opacity={0.2}/>
      <Slab {...PHONE3} tone="ink">
        <rect x={PHONE3.x + 5} y={PHONE3.y + 8} width={PHONE3.w - 10} height={PHONE3.d - 16} rx="7" fill="#103a28"/>
      </Slab>
      {/* Each layer's shadow on the screen, then the layers back to front,
          floating out of step. */}
      {LAYERS.map((l, i) => (
        <Shadow key={i} x={L.x} y={l.y} z={PHONE3.h} w={L.w} d={L.d} r={L.r} blur={b} opacity={0.35}
          className="mm-iso-shade" style={{ animationDelay: `${-i * 2.2}s` }}/>
      ))}
      {LAYERS.map((l, i) => (
        <g key={i} className="mm-iso-float" style={{ animationDelay: `${-i * 2.2}s` }}>
          <Slab x={L.x} y={l.y} z={PHONE3.h + l.z} w={L.w} d={L.d} h={L.h} r={L.r} tone={l.tone}>
            <Glyph kind={l.glyph} x={L.x} y={l.y} w={L.w} d={L.d} light={l.tone === 'accent'}/>
          </Slab>
        </g>
      ))}
    </Stage>
  )
}
