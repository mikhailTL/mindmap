import React from 'react'
import { TONES } from './tones'
import './scenes.css'

/* Drawing pieces for the site scenes: a gradient sky, contour lines, layered
 * ridges, a light source, a travelling pulse. Every scene root carries the
 * `sc` class and useSceneWatch, so its loops pause off screen. */

/* An id prefix safe for SVG url(#...) references. */
export const useUid = () => 'sc' + React.useId().replace(/[^a-zA-Z0-9]/g, '')

/* One observer for every scene on the page. */
let watcher = null
export function useSceneWatch(ref) {
  React.useEffect(() => {
    const el = ref.current
    if (typeof IntersectionObserver === 'undefined' || !el) return undefined
    if (!watcher) {
      watcher = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (e.isIntersecting) e.target.removeAttribute('data-off')
          else e.target.setAttribute('data-off', '')
        }
      }, { rootMargin: '80px' })
    }
    watcher.observe(el)
    return () => watcher && watcher.unobserve(el)
  }, [ref])
}

const r1 = n => Math.round(n * 10) / 10

/* Closed, gently wavy rings round (cx, cy): a map's contour lines. */
export function contourPath(cx, cy, r, { amp = 3, lobes = 3, phase = 0, squash = 0.62 } = {}) {
  let d = ''
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2
    const rr = r + amp * Math.sin(a * lobes + phase) + amp * 0.5 * Math.cos(a * (lobes + 2) - phase)
    d += `${i ? 'L' : 'M'}${r1(cx + rr * Math.cos(a))} ${r1(cy + rr * Math.sin(a) * squash)}`
  }
  return d + 'Z'
}

/* A soft rolling ridge from x0 to x1, filled down to `bottom`. */
export function ridgePath(y, amp, { x0 = -40, x1 = 440, period = 120, phase = 0, bottom = 400 } = {}) {
  let d = `M${x0} ${bottom}L${x0} ${y}`
  for (let x = x0; x <= x1; x += 10) {
    const yy = y - amp * Math.sin((x / period) * Math.PI * 2 + phase) - amp * 0.4 * Math.sin((x / period) * Math.PI * 5 + phase * 2)
    d += `L${x} ${r1(yy)}`
  }
  return d + `L${x1} ${bottom}Z`
}

/* The ground of a scene: the tone's gradient, its light source and the
   contour rings round it, and dust that twinkles. `w`/`h` are the viewBox
   size; `light` is where the light source sits; `vertical` runs the
   gradient top to bottom. */
export function Sky({ u, tone = 'dusk', w = 360, h = 180, light = [0.25, 0.5], rings = 6,
  ringGap = 16, vertical = false, dust = true }) {
  const t = TONES[tone]
  const [lx, ly] = [light[0] * w, light[1] * h]
  const dark = tone !== 'dawn'
  const dots = React.useMemo(() => {
    if (!dust) return []
    const out = []
    for (let i = 0; i < 14; i++) {
      out.push([r1(((i * 73) % 97) / 97 * w), r1(((i * 41) % 53) / 53 * h * 0.62 + 4), (i % 3) * 0.3 + 0.6, i])
    }
    return out
  }, [dust, w, h])
  return (
    <>
      <defs>
        <linearGradient id={u + 'sky'} x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
          <stop offset="0" stopColor={t.sky[0]}/>
          <stop offset=".55" stopColor={t.sky[1]}/>
          <stop offset="1" stopColor={t.sky[2]}/>
        </linearGradient>
        <radialGradient id={u + 'glow'}>
          <stop offset="0" stopColor={t.glow} stopOpacity={dark ? 0.55 : 0.9}/>
          <stop offset=".45" stopColor={t.glow} stopOpacity={dark ? 0.18 : 0.5}/>
          <stop offset="1" stopColor={t.glow} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect x="-20" y="-20" width={w + 40} height={h + 40} fill={`url(#${u}sky)`}/>
      <circle className="sc-a sc-breathe" style={{ '--d': '9s' }} cx={lx} cy={ly} r={Math.min(w, h) * 0.62}
        fill={`url(#${u}glow)`}/>
      <g className="sc-a sc-drift" style={{ '--d': '22s' }} fill="none" stroke={t.line}
        strokeOpacity={dark ? 0.12 : 0.16} strokeWidth="1">
        {Array.from({ length: rings }, (_, i) => (
          <path key={i} d={contourPath(lx, ly, 18 + i * ringGap, { amp: 2 + i * 0.7, phase: i * 0.9 })}/>
        ))}
      </g>
      {dots.map(([x, y, s, i]) => (
        <circle key={i} className="sc-a sc-twinkle" style={{ '--d': `${5 + (i % 4)}s`, '--w': `${-i * 0.7}s` }}
          cx={x} cy={y} r={s} fill={dark ? '#ffffff' : t.line}/>
      ))}
    </>
  )
}

/* Layered hills along the bottom, far to near, with a contour line on each. */
export function Ridges({ tone = 'dusk', y = 150, w = 360, gap = 12, amp = 5 }) {
  const t = TONES[tone]
  return (
    <g>
      {t.ridge.map((c, i) => (
        <g key={i}>
          <path d={ridgePath(y + i * gap, amp - i, { x1: w + 40, period: 140 + i * 40, phase: i * 1.7 })} fill={c}/>
          <path d={ridgePath(y + i * gap + 5, amp - i, { x1: w + 40, period: 140 + i * 40, phase: i * 1.7, bottom: y + i * gap + 5 })}
            fill="none" stroke={t.line} strokeOpacity={tone === 'dawn' ? 0.18 : 0.1} strokeWidth="1"/>
        </g>
      ))}
    </g>
  )
}

/* A soft glowing point: a halo and a bright core. */
export function Light({ x, y, r = 3, color = '#3ecf9a', halo = 4, className, style }) {
  return (
    <g className={className} style={style}>
      <circle cx={x} cy={y} r={r * halo} fill={color} opacity=".18"/>
      <circle cx={x} cy={y} r={r * 2} fill={color} opacity=".35"/>
      <circle cx={x} cy={y} r={r} fill={color}/>
      <circle cx={x} cy={y} r={r * 0.4} fill="#ffffff"/>
    </g>
  )
}

/* A pulse travelling from (x1, y1) to (x2, y2) in an arc `lift` high.
   `d` is the loop, `w` its offset, so several pulses run out of step. */
export function Travel({ from, to, lift = -16, d = '3.6s', w = '0s', color = '#3ecf9a', r = 2.6 }) {
  const [x1, y1] = from
  const [x2, y2] = to
  const time = { '--d': d, '--w': w }
  return (
    <g transform={`translate(${x1} ${y1})`}>
      <g className="sc-a sc-tx" style={{ ...time, '--tx': `${x2 - x1}px`, '--te': `${y2 - y1}px` }}>
        <g className="sc-a sc-ty" style={{ ...time, '--ty': `${lift}px` }}>
          <Light x={0} y={0} r={r} color={color}/>
        </g>
      </g>
    </g>
  )
}

/* Ripples leaving a point, `n` out of step. */
export function Ripples({ x, y, r = 10, n = 2, d = '3.6s', color = '#3ecf9a', width = 1.4 }) {
  return Array.from({ length: n }, (_, i) => (
    <circle key={i} className="sc-a sc-ring" cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={width}
      style={{ '--d': d, '--w': `calc(${d} * ${-i / n})` }} vectorEffect="non-scaling-stroke"/>
  ))
}

/* The superellipse the patch drawings use: `a` across the arm, `b` along it
   (36 mm by 54 mm, so b = 1.5 a). */
export function ovalPath(cx, cy, a, b, k = 0.66) {
  const hx = a * k, hy = b * k
  return `M${r1(cx)} ${r1(cy - b)}`
    + `C${r1(cx + hx)} ${r1(cy - b)} ${r1(cx + a)} ${r1(cy - hy)} ${r1(cx + a)} ${r1(cy)}`
    + `C${r1(cx + a)} ${r1(cy + hy)} ${r1(cx + hx)} ${r1(cy + b)} ${r1(cx)} ${r1(cy + b)}`
    + `C${r1(cx - hx)} ${r1(cy + b)} ${r1(cx - a)} ${r1(cy + hy)} ${r1(cx - a)} ${r1(cy)}`
    + `C${r1(cx - a)} ${r1(cy - hy)} ${r1(cx - hx)} ${r1(cy - b)} ${r1(cx)} ${r1(cy - b)}Z`
}

/* The patch seen from above, lit: a side wall, a pale face, an inner ring and
   its light. */
export function PatchMark({ cx, cy, a = 16, b = 24, ripple = true, d = '3.6s' }) {
  return (
    <g>
      <path d={ovalPath(cx + 1.5, cy + 4, a, b)} fill="#000" opacity=".28"/>
      <path d={ovalPath(cx, cy + 2.5, a, b)} fill="#9fbfb0"/>
      <path d={ovalPath(cx, cy, a, b)} fill="#f4faf7"/>
      <path d={ovalPath(cx, cy, a * 0.78, b * 0.8)} fill="none" stroke="#c2d7ca" strokeWidth="1"/>
      {ripple && <Ripples x={cx} y={cy} r={6} d={d}/>}
      <Light x={cx} y={cy} r={2.6}/>
    </g>
  )
}

/* An upper arm, tilted, with a sleeve ending above the patch. Drawn round
   (cx, cy); whatever is passed as children (the patch) is drawn on it and
   turns with it, so the patch's long axis runs along the arm. */
export function Arm({ u, cx, cy, rot = -10, len = 300, w = 80, hem = 44, children }) {
  const top = cy - len / 2, bot = cy + len / 2, n = w * 0.42
  const arm = `M${cx - w / 2} ${top}C${cx - w / 2 - 3} ${cy} ${cx - n - 2} ${cy + len * 0.3} ${cx - n} ${bot}`
    + `L${cx + n} ${bot}C${cx + n + 2} ${cy + len * 0.3} ${cx + w / 2 + 3} ${cy} ${cx + w / 2} ${top}Z`
  const sw = w / 2 + 6
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <defs>
        <linearGradient id={u + 'skin'} x1="0" x2="1">
          <stop offset="0" stopColor="#b98466"/><stop offset=".36" stopColor="#efcdb6"/>
          <stop offset=".7" stopColor="#d9a98b"/><stop offset="1" stopColor="#9c6a50"/>
        </linearGradient>
        <linearGradient id={u + 'sleeve'} x1="0" x2="1">
          <stop offset="0" stopColor="#0f4a5e"/><stop offset=".36" stopColor="#2a8fae"/><stop offset="1" stopColor="#0c3c4c"/>
        </linearGradient>
      </defs>
      <path d={arm} fill={`url(#${u}skin)`}/>
      <path d={`M${cx - sw} ${top}H${cx + sw}V${cy - hem}Q${cx} ${cy - hem + 9} ${cx - sw} ${cy - hem}Z`}
        fill={`url(#${u}sleeve)`}/>
      <path d={`M${cx - sw} ${cy - hem - 5}Q${cx} ${cy - hem + 4} ${cx + sw} ${cy - hem - 5}`} fill="none"
        stroke="#ffffff" strokeOpacity=".25" strokeWidth="1.2"/>
      {children}
    </g>
  )
}

/* The SVG every scene draws in: decorative, scaled to its box. `fit` is the
   preserveAspectRatio, `xMaxYMid slice` to let the art run off the left. */
export function SceneSvg({ w = 360, h = 180, fit = 'xMidYMid slice', className, children }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio={fit} aria-hidden="true" focusable="false"
      className={className}>
      {children}
    </svg>
  )
}
