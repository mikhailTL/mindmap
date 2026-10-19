import React from 'react'
import { contourPath } from '../../ui/scenes/kit'

/* The four pictures on the Reading tab's chooser, one per way in. Owner, 19
 * October: the cards "have an AI generated layout and need to be more subtle
 * or 3d based". So each way gets one small isometric object on a faint
 * contour ground instead of an icon in a tile:
 *
 *   survey   a stack of answer cards, the top one lifting
 *   mirror   a phone standing on a dock, a face mesh on its screen
 *   sensors  a phone lying face down, a pulse ringing out of the lens
 *   patch    the patch hovering over a gridded plate
 *
 * True isometric (30 degrees), site tokens only, the same construction as
 * landing/whatis/pictures.jsx. Decorative (aria-hidden): the row's text
 * carries the meaning. Motion is transform and opacity only, slow eased
 * loops, and none of it runs under prefers-reduced-motion. */

const C = Math.sqrt(3) / 2
const S = 0.5
const r1 = n => Math.round(n * 10) / 10

/* Plane (x, y, z) to screen. x runs down-right, y down-left, z up. */
const iso = (x, y, z = 0) => [r1((x - y) * C), r1((x + y) * S - z)]
/* Children drawn flat on the floor plane at height z. */
const plane = z => `matrix(${C} ${S} ${-C} ${S} 0 ${-z})`
/* Children drawn on an upright face at y = yF whose top edge is at z = top:
   child x runs along the plane's x, child y runs down from the top edge. */
const wall = (yF, top) => `matrix(${C} ${S} 0 1 ${r1(-yF * C)} ${r1(yF * S - top)})`

const INK = '#0d2b1e'
const ACCENT = '#157446'
const MINT = '#3ecf9a'
const BEAM = '#1d8fb0'
const SCREEN = '#eef8f3'
const TONE = {
  white: { top: '#ffffff', left: '#e5efea', right: '#cfe1d8' },
  mint:  { top: '#e4f5ec', left: '#cbe8d9', right: '#b2d9c5' },
  ink:   { top: '#1b4532', left: '#0d2b1e', right: '#071a12' },
}

function roundRect(x, y, w, d, r, n = 6) {
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

function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo = [], hi = []
  for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q) }
  for (const q of p.reverse()) { while (hi.length > 1 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q) }
  return lo.slice(0, -1).concat(hi.slice(0, -1))
}

const useUid = () => React.useId().replace(/[^a-zA-Z0-9]/g, '')

/* A rounded slab lying flat: two shaded sides, a lit top, and whatever sits
   on the top face. */
function Slab({ x, y, z = 0, w, d, h, r = 4, tone = 'white', children }) {
  const id = useUid()
  const t = TONE[tone]
  const flat = roundRect(x, y, w, d, Math.min(r, w / 2, d / 2))
  const top = flat.map(([a, b]) => iso(a, b, z + h))
  const side = hull(flat.map(([a, b]) => iso(a, b, z)).concat(top))
  const xs = side.map(p => p[0])
  const left = Math.min(...xs), right = Math.max(...xs)
  const f = (iso(x + w, y + d)[0] - left) / (right - left || 1)
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={left} x2={right} y1="0" y2="0">
          <stop offset="0" stopColor={t.left}/>
          <stop offset={Math.max(0, f - 0.04)} stopColor={t.left}/>
          <stop offset={Math.min(1, f + 0.04)} stopColor={t.right}/>
          <stop offset="1" stopColor={t.right}/>
        </linearGradient>
      </defs>
      <path d={toPath(side)} fill={`url(#${id})`}/>
      <path d={toPath(top)} fill={t.top}/>
      <path d={toPath(top)} fill="none" stroke="#fff" strokeOpacity={tone === 'ink' ? 0.16 : 0.9} strokeWidth="0.7"/>
      {children && <g transform={plane(z + h)}>{children}</g>}
    </g>
  )
}

/* A rounded slab standing up, its face toward the viewer's left. */
function Upright({ x, y, z = 0, w, t, h, r = 8, tone = 'ink', children }) {
  const k = TONE[tone]
  const flat = roundRect(x, z, w, h, Math.min(r, w / 2, h / 2))
  const back = flat.map(([u, v]) => iso(u, y, v))
  const front = flat.map(([u, v]) => iso(u, y + t, v))
  return (
    <g>
      <path d={toPath(hull(back.concat(front)))} fill={k.right}/>
      <path d={toPath(front)} fill={k.top}/>
      {children && <g transform={wall(y + t, z + h)}>{children}</g>}
    </g>
  )
}

/* A soft contact shadow, tinted green, on the floor or on a top face. */
function Shadow({ x, y, z = 0, w, d, r = 6, blur, opacity = 0.2, className }) {
  return (
    <g transform={plane(z)}>
      <g className={className}>
        <path d={toPath(roundRect(x + 2, y + 4, w, d, Math.min(r, w / 2, d / 2)))} fill="#0f5836"
          opacity={opacity} filter={`url(#${blur})`}/>
      </g>
    </g>
  )
}

/* The ground: no box, only contour rings lying flat round the object and
   fading out at the edges, so the object sits on the page itself. */
function Stage({ id, children, rings = [32, 50, 68, 86] }) {
  return (
    <svg viewBox="-96 -64 192 130" aria-hidden="true" focusable="false" className="block h-auto w-full overflow-visible">
      <defs>
        <radialGradient id={`${id}f`} cx="0.5" cy="0.56" r="0.5">
          <stop offset="0.35" stopColor="#fff"/><stop offset="1" stopColor="#fff" stopOpacity="0"/>
        </radialGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="-96" y="-64" width="192" height="130">
          <rect x="-96" y="-64" width="192" height="130" fill={`url(#${id}f)`}/>
        </mask>
        <radialGradient id={`${id}l`} cx="0.5" cy="0.55" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55"/>
          <stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
        </radialGradient>
        <filter id={`${id}b`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.4"/>
        </filter>
      </defs>
      <ellipse cx="0" cy="8" rx="92" ry="54" fill={`url(#${id}l)`}/>
      <g mask={`url(#${id}m)`}>
        <g className="rc-drift">
          <g transform={plane(0)} fill="none" stroke={ACCENT} strokeOpacity="0.16">
            {rings.map((r, i) => (
              <path key={r} d={contourPath(0, 0, r, { amp: 1.6 + i * 0.7, phase: i * 0.9, squash: 1 })}
                strokeWidth="0.9" vectorEffect="non-scaling-stroke"/>
            ))}
          </g>
        </g>
      </g>
      {children}
    </svg>
  )
}

/* ── 1. survey: a stack of answer cards ─────────────────────────────────── */

const CARD = { w: 58, d: 76, h: 3, r: 6 }
const CARDS = [
  { x: -23, y: -44, z: 0, tone: 'mint' },
  { x: -26, y: -41, z: 3, tone: 'white' },
]
const TOPCARD = { x: -29, y: -38, z: 15, tone: 'white' }

/* Three questions on a card: a line of text and five choices, one picked. */
function Answers({ x, y }) {
  return (
    <g>
      {[0, 1, 2].map(row => (
        <g key={row}>
          <rect x={x + 7} y={y + 9 + row * 22} width={row === 1 ? 24 : 32} height="3.4" rx="1.5" fill={INK} opacity="0.18"/>
          {[0, 1, 2, 3, 4].map(k => {
            const on = k === [3, 1, 2][row]
            return (
              <circle key={k} cx={x + 10 + k * 9.6} cy={y + 18.5 + row * 22} r="2.6"
                fill={on ? (row === 0 ? MINT : ACCENT) : '#fff'} stroke={on ? 'none' : '#93b2a1'}
                strokeWidth="0.8" vectorEffect="non-scaling-stroke"/>
            )
          })}
        </g>
      ))}
    </g>
  )
}

export function SurveyArt() {
  const id = useUid()
  return (
    <Stage id={id}>
      <g className="rc-obj">
        <g transform="translate(0 12)">
          <Shadow {...CARD} x={-23} y={-44} blur={`${id}b`} opacity={0.22}/>
          {CARDS.map(c => <Slab key={c.z} {...CARD} {...c}/>)}
          <Shadow {...CARD} x={TOPCARD.x} y={TOPCARD.y} z={6} blur={`${id}b`} opacity={0.2} className="rc-shade"/>
          <g className="rc-float">
            <Slab {...CARD} {...TOPCARD}><Answers x={TOPCARD.x} y={TOPCARD.y}/></Slab>
          </g>
        </g>
      </g>
    </Stage>
  )
}

/* ── 2. mirror: a standing phone with a face mesh ───────────────────────── */

const DOCK = { x: -30, y: -16, w: 60, d: 32, h: 5, r: 10 }
const PHONE = { x: -23, y: -3, w: 46, t: 6, h: 88, r: 9 }
/* Landmarks round a face centred on (0, 0), in screen units of the phone's
   face: the outline, brows, eyes, nose and lips. */
const OVAL = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 - Math.PI / 2
  return [r1(13.5 * Math.cos(a)), r1(18 * Math.sin(a) + (Math.sin(a) > 0 ? 1.5 : 0))]
})
const INNER = [[-8, -8], [-3.5, -9.5], [3.5, -9.5], [8, -8], [-6.5, -4], [6.5, -4], [0, -2.5],
  [-2.5, 3], [2.5, 3], [-5.5, 8.5], [0, 7.5], [5.5, 8.5], [0, 11], [-9.5, 2], [9.5, 2], [0, -13]]
const MESH = [...OVAL, ...INNER]
/* Each point joined to its three nearest: a light web, not a wireframe. */
const EDGES = (() => {
  const seen = new Set(), out = []
  MESH.forEach((p, i) => {
    MESH.map((q, j) => [j, Math.hypot(p[0] - q[0], p[1] - q[1])]).filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(([j]) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (!seen.has(key)) { seen.add(key); out.push([p, MESH[j]]) }
      })
  })
  return out
})()

export function MirrorArt() {
  const id = useUid()
  const { x, w, h } = PHONE
  const sx = x + 4, sw = w - 8, sh = h - 8
  const fx = x + w / 2, fy = 36
  return (
    <Stage id={id}>
      <g className="rc-obj">
        <g transform="translate(0 34)">
          <Shadow {...DOCK} blur={`${id}b`} opacity={0.22}/>
          <Slab {...DOCK} tone="mint"/>
          <Upright {...PHONE} z={DOCK.h} tone="white">
            <defs>
              <clipPath id={`${id}c`}><rect x={sx} y="4" width={sw} height={sh} rx="6"/></clipPath>
            </defs>
            <rect x={sx} y="4" width={sw} height={sh} rx="6" fill={SCREEN} stroke="#c2d7ca" strokeWidth="0.8" vectorEffect="non-scaling-stroke"/>
            <g clipPath={`url(#${id}c)`}>
              <g transform={`translate(${fx} ${fy})`}>
                <g fill="none" stroke={BEAM} strokeWidth="0.6" strokeOpacity="0.55" vectorEffect="non-scaling-stroke">
                  {EDGES.map(([a, b], i) => <path key={i} d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`}/>)}
                </g>
                {MESH.map(([px, py], i) => (
                  <circle key={i} cx={px} cy={py} r={i >= OVAL.length ? 1.15 : 0.9}
                    fill={i >= OVAL.length ? ACCENT : MINT} className={i % 5 === 2 ? 'rc-blink' : undefined}
                    style={i % 5 === 2 ? { animationDelay: `${(i % 4) * 0.7}s` } : undefined}/>
                ))}
              </g>
              <rect className="rc-scan" x={sx} y={fy - 22} width={sw} height="3" fill={MINT} opacity="0"/>
            </g>
            <rect x={x + w / 2 - 6} y="7" width="12" height="2.4" rx="1.2" fill={INK} opacity="0.85"/>
            <rect x={x + 10} y={fy + 28} width="18" height="2.6" rx="1.3" fill={INK} opacity="0.14"/>
            <rect x={x + 10} y={fy + 34} width="11" height="2.6" rx="1.3" fill={INK} opacity="0.14"/>
          </Upright>
        </g>
      </g>
    </Stage>
  )
}

/* ── 3. camera and microphone: a phone face down, a pulse at the lens ───── */

const BACK = { x: -27, y: -46, w: 54, d: 92, h: 6, r: 11 }

export function SensorsArt() {
  const id = useUid()
  const { x, y } = BACK
  const lx = x + 15, ly = y + 15
  return (
    <Stage id={id}>
      <g className="rc-obj">
        <g transform="translate(0 6)">
          <Shadow {...BACK} blur={`${id}b`} opacity={0.22}/>
          <Slab {...BACK} tone="white">
            {/* The pulse: three rings from the lens, out across the back. */}
            <g fill="none" stroke={BEAM} strokeWidth="1.1" vectorEffect="non-scaling-stroke">
              {[0, 1.4, 2.8].map(dl => (
                <circle key={dl} className="rc-ring" cx={lx} cy={ly} r="9" style={{ animationDelay: `${dl}s` }}/>
              ))}
            </g>
            <rect x={x + 5} y={y + 5} width="20" height="32" rx="7" fill={INK}/>
            {[ly, ly + 13].map(cy => (
              <g key={cy}>
                <circle cx={lx} cy={cy} r="5.4" fill="#1b4532" stroke="#2a5744" strokeWidth="0.8" vectorEffect="non-scaling-stroke"/>
                <circle cx={lx} cy={cy} r="3" fill={BEAM}/>
                <circle cx={lx - 1} cy={cy - 1} r="0.9" fill="#fff" opacity="0.85"/>
              </g>
            ))}
            {/* The trace the lens reads: a heartbeat along the back. */}
            <path d={`M${x + 12} ${y + 62}h10l3 -7 4 13 3 -10 2 4h12`} fill="none" stroke={ACCENT}
              strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.75"/>
            <circle cx={x + 27} cy={y + 82} r="1.3" fill={INK} opacity="0.25"/>
            <circle cx={x + 22} cy={y + 82} r="1.3" fill={INK} opacity="0.25"/>
            <circle cx={x + 32} cy={y + 82} r="1.3" fill={INK} opacity="0.25"/>
          </Slab>
        </g>
      </g>
    </Stage>
  )
}

/* ── 4. patch: the patch over a gridded plate ───────────────────────────── */

const PLATE = { x: -42, y: -42, w: 84, d: 84, h: 6, r: 12 }
const PATCH = { x: -15, y: -20, w: 30, d: 40, h: 4, r: 13 }

export function PatchArt() {
  const id = useUid()
  const { x, y, w, d } = PLATE
  const cx = PATCH.x + PATCH.w / 2, cy = PATCH.y + PATCH.d / 2
  return (
    <Stage id={id}>
      <g className="rc-obj">
        <g transform="translate(0 4)">
          <Shadow {...PLATE} blur={`${id}b`} opacity={0.2}/>
          <Slab {...PLATE} tone="mint">
            <g stroke="#fff" strokeOpacity="0.85" strokeWidth="0.7" vectorEffect="non-scaling-stroke">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <g key={i}>
                  <path d={`M${x + i * 12} ${y + 4}V${y + d - 4}`}/>
                  <path d={`M${x + 4} ${y + i * 12}H${x + w - 4}`}/>
                </g>
              ))}
            </g>
          </Slab>
          <Shadow {...PATCH} z={PLATE.h} blur={`${id}b`} opacity={0.26} className="rc-shade"/>
          <g className="rc-float">
            <Slab {...PATCH} z={PLATE.h + 9} tone="white">
              <rect x={PATCH.x + 5} y={PATCH.y + 5} width={PATCH.w - 10} height={PATCH.d - 10} rx="9"
                fill="none" stroke={ACCENT} strokeOpacity="0.35" strokeWidth="0.9" vectorEffect="non-scaling-stroke"/>
              <circle className="rc-ring" cx={cx} cy={cy} r="4.5" fill="none" stroke={MINT} strokeWidth="1.1"
                vectorEffect="non-scaling-stroke"/>
              <circle cx={cx} cy={cy} r="2.4" fill={MINT}/>
            </Slab>
          </g>
        </g>
      </g>
    </Stage>
  )
}

/* The motion, mounted once by the chooser. The hover lift is on `.rc-obj`
   inside a `.group`, gated to a fine pointer like the site's hoverOnly. */
const CSS = `
.rc-obj{transition:transform .4s cubic-bezier(.22,.61,.36,1)}
@media (hover:hover) and (pointer:fine){.group:hover .rc-obj{transform:translateY(-4px)}}
@keyframes rc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.rc-float{animation:rc-float 7s cubic-bezier(.45,.05,.55,.95) infinite}
@keyframes rc-shade{0%,100%{opacity:1}50%{opacity:.6}}
.rc-shade{animation:rc-shade 7s cubic-bezier(.45,.05,.55,.95) infinite}
@keyframes rc-ring{0%{transform:scale(.6);opacity:0}14%{opacity:.75}70%,100%{transform:scale(2.8);opacity:0}}
.rc-ring{transform-box:fill-box;transform-origin:center;opacity:0;animation:rc-ring 4.2s cubic-bezier(.22,.61,.36,1) infinite}
@keyframes rc-scan{0%{transform:translateY(0);opacity:0}18%,78%{opacity:.55}100%{transform:translateY(46px);opacity:0}}
.rc-scan{animation:rc-scan 5.6s cubic-bezier(.45,.05,.55,.95) infinite}
@keyframes rc-blink{0%,100%{opacity:1}50%{opacity:.35}}
.rc-blink{animation:rc-blink 4.2s ease-in-out infinite}
@keyframes rc-drift{0%,100%{transform:translate(0,0)}50%{transform:translate(-4px,1.5px)}}
.rc-drift{animation:rc-drift 22s cubic-bezier(.45,.05,.55,.95) infinite}
@media (prefers-reduced-motion:reduce){
.rc-obj,.rc-float,.rc-shade,.rc-ring,.rc-scan,.rc-blink,.rc-drift{animation:none !important;transition:none !important}
.group:hover .rc-obj{transform:none !important}
}`

export function ArtStyles() {
  return <style>{CSS}</style>
}
