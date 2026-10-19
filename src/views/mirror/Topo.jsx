import React from 'react'
import { cn } from '../../lib/utils'

/* Contour lines and a faint isometric grid behind the mirror. Drawn once from
   a fixed formula, so every visit shows the same map. Decoration only. */

const VW = 800, VH = 600
const HILLS = [
  { x: 610, y: 150, n: 9, step: 26, seed: 1.3 },
  { x: 170, y: 470, n: 8, step: 24, seed: 4.1 },
]

function loop(cx, cy, r, seed) {
  const k = 48, pts = []
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2
    const wob = 1 + 0.16 * Math.sin(3 * a + seed) + 0.09 * Math.sin(5 * a - seed * 1.7) + 0.05 * Math.cos(7 * a + r * 0.02)
    pts.push([cx + r * 1.25 * wob * Math.cos(a), cy + r * wob * Math.sin(a)])
  }
  /* Smooth closed curve through the points (midpoint quadratics). */
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  let d = `M${mid(pts[k - 1], pts[0]).map(v => v.toFixed(1)).join(' ')}`
  for (let i = 0; i < k; i++) {
    const p = pts[i], m = mid(p, pts[(i + 1) % k])
    d += `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`
  }
  return d + 'Z'
}

const PATHS = HILLS.flatMap(h =>
  Array.from({ length: h.n }, (_, i) => ({ d: loop(h.x, h.y, 22 + i * h.step, h.seed + i * 0.35), major: i % 3 === 2 })))

export function Topo({ className }) {
  const id = React.useId().replace(/:/g, '')
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false"
      className={cn('mm-topo', className)}>
      <defs>
        <pattern id={`iso-${id}`} width="40" height="23.094" patternUnits="userSpaceOnUse">
          <path d="M0 0L40 23.094M40 0L0 23.094M0 0V23.094" fill="none" stroke="rgba(29,143,176,.08)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width={VW} height={VH} fill={`url(#iso-${id})`}/>
      <g className="mm-drift" fill="none" strokeLinejoin="round">
        {PATHS.map((p, i) => (
          <path key={i} d={p.d} stroke={p.major ? 'rgba(21,116,70,.22)' : 'rgba(21,116,70,.11)'}
            strokeWidth={p.major ? 1.4 : 1}/>
        ))}
      </g>
    </svg>
  )
}
