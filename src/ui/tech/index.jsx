import React from 'react'
import { cn } from '../../lib/utils'
import './tech.css'

/* The tech register's pieces (see ./tech.css). Used by How it works (AI,
 * Machine Learning, Mental Mirror), the MindMap AI chat and the Mental Mirror
 * capture screen. Nothing here is shared with the Toolkit's sky scenes. */

/* Whether `ref`'s element is on screen and the tab is visible. A coalesced
   scroll and resize listener, not an IntersectionObserver: overflow-x: clip
   on html and body stops observer entries arriving (ui/motion.jsx). */
export function useLive(ref) {
  const [on, setOn] = React.useState(false)
  React.useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setOn(!document.hidden && r.bottom > 0 && r.top < innerHeight && r.width > 0)
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(check) }
    check()
    addEventListener('scroll', queue, { passive: true })
    addEventListener('resize', queue, { passive: true })
    document.addEventListener('visibilitychange', queue)
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(queue) : null
    ro?.observe(document.documentElement)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', queue)
      removeEventListener('resize', queue)
      document.removeEventListener('visibilitychange', queue)
      ro?.disconnect()
    }
  }, [ref])
  return on
}

/* The root every tech surface sits in: sets the tokens and runs or pauses
   the motion inside it. */
export const TechRoot = React.forwardRef(function TechRoot({ as: As = 'div', className, children, ...p }, outer) {
  const ref = React.useRef(null)
  const on = useLive(ref)
  const set = el => { ref.current = el; if (typeof outer === 'function') outer(el); else if (outer) outer.current = el }
  return <As ref={set} data-live={on ? 'on' : 'off'} className={cn('tech', className)} {...p}>{children}</As>
})

/* Topographic contours: nested loops round one summit, each a circle bent by
   three slow waves. Built once per seed, drawn as hairlines in currentColor.
   19 October, the owner: "keep adding the topographic, isometric, and
   technological designs". */
const TOPO = {}
function topoPaths(seed) {
  if (TOPO[seed]) return TOPO[seed]
  const out = []
  for (let k = 0; k < 11; k++) {
    const r0 = 34 + k * 27, pts = []
    for (let s = 0; s < 120; s++) {
      const a = (s / 120) * Math.PI * 2
      const r = r0 * (1 + 0.13 * Math.sin(2 * a + seed + k * 0.16)
        + 0.07 * Math.sin(3 * a + 1.9 * seed - k * 0.11) + 0.035 * Math.sin(5 * a + k * 0.3))
      pts.push(`${(300 + r * Math.cos(a)).toFixed(1)} ${(300 + r * Math.sin(a) * 0.82).toFixed(1)}`)
    }
    out.push('M' + pts.join('L') + 'Z')
  }
  return (TOPO[seed] = out)
}
export function Topo({ seed = 0.6, className, style }) {
  return (
    <svg viewBox="0 0 600 600" aria-hidden focusable="false" fill="none"
      className={cn('pointer-events-none absolute', className)} style={style}>
      {topoPaths(seed).map((d, i) => (
        <path key={i} d={d} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke"
          strokeOpacity={i % 4 === 3 ? 1 : 0.55}/>
      ))}
    </svg>
  )
}

/* An isometric floor: a diamond of 30° lines with a few lit nodes, for a
   drawing to stand on. */
export function IsoPlate({ className, n = 6 }) {
  const W = 240, H = W * Math.tan(Math.PI / 6), cx = W / 2, cy = H / 2
  const at = (i, j) => [cx + (i - j) * (W / 2 / n), (i + j) * (H / 2 / n)]
  const lines = []
  for (let k = 0; k <= n; k++) {
    lines.push([at(k, 0), at(k, n)], [at(0, k), at(n, k)])
  }
  const nodes = [[0, 0], [n, 0], [0, n], [n, n], [2, 4], [4, 2]]
  return (
    <svg viewBox={`-6 -6 ${W + 12} ${H + 12}`} aria-hidden focusable="false" fill="none"
      className={cn('pointer-events-none block', className)}>
      <path d={`M${at(0, 0)}L${at(n, 0)}L${at(n, n)}L${at(0, n)}Z`} fill="rgba(62,207,154,.07)"
        stroke="#18a370" strokeOpacity=".55" strokeWidth="1.2"/>
      {lines.map(([a, b], i) => (
        <path key={i} d={`M${a}L${b}`} stroke="#157446" strokeOpacity=".16" strokeWidth="1"/>
      ))}
      {nodes.map(([i, j]) => {
        const [x, y] = at(i, j)
        return <g key={i + ':' + j}>
          <circle cx={x} cy={y} r="6" fill="#3ecf9a" fillOpacity=".22"/>
          <circle cx={x} cy={y} r="2.4" fill="#18a370"/>
        </g>
      })}
    </svg>
  )
}

/* A band on the light ground with the grid, two drifting blooms and faint
   contour lines in two corners. `hue` tints the second bloom: 'mint'
   (default), 'vio' for MindMap AI. */
export function TechBand({ as = 'section', hue = 'mint', className, inner, children, ...p }) {
  const second = hue === 'vio' ? 'rgba(167,139,250,.12)' : 'rgba(29,143,176,.1)'
  return (
    <TechRoot as={as} className={cn('t-band border-t border-rule', className)} {...p}>
      <span aria-hidden className="t-bloom t-drift t-anim -left-24 -top-24 size-[26rem]"
        style={{ background: 'radial-gradient(closest-side, rgba(62,207,154,.14), transparent)' }}/>
      <span aria-hidden className="t-bloom t-drift-2 t-anim -bottom-32 -right-20 size-[30rem]"
        style={{ background: `radial-gradient(closest-side, ${second}, transparent)` }}/>
      <Topo seed={0.6} className="t-topo -right-40 -top-48 size-[40rem] text-[#157446]"/>
      <Topo seed={2.1} className="t-topo -bottom-56 -left-48 size-[34rem] text-[#1d8fb0]"/>
      <div className={cn('wrap py-8 lg:py-12', inner)}>{children}</div>
    </TechRoot>
  )
}

/* Glass with a gradient edge. tone: 'mint' | 'vio' | 'coral' | 'quiet'. */
export function Glass({ as: As = 'div', tone = 'mint', sheen = false, className, children, ...p }) {
  return (
    <As className={cn('t-glass', tone !== 'mint' && `t-glass--${tone}`, sheen && 't-sheen t-anim', className)} {...p}>
      {children}
    </As>
  )
}

/* A heading lit by a slow sheen. */
export function TechTitle({ as: As = 'h2', className, children }) {
  return (
    <As className={cn('t-title t-anim font-display font-bold tracking-tight', className)}>{children}</As>
  )
}

export function Chip({ className, children, dot = false }) {
  return (
    <span className={cn('t-chip t-mono', className)}>
      {dot && <span aria-hidden className="t-dot t-anim"/>}
      {children}
    </span>
  )
}

/* A primary action: the accent with a mint glow, white text (5.8 : 1). */
export const TechButton = React.forwardRef(function TechButton({ className, variant = 'solid', ...p }, ref) {
  return (
    <button ref={ref} type="button" {...p}
      className={cn('inline-flex min-h-[48px] items-center justify-center gap-2 rounded-field px-5',
        'font-display text-ui font-bold transition-[background-color,color,transform,box-shadow] duration-150',
        'ease-[var(--ease-out)] motion-safe:active:scale-[0.97] select-none touch-manipulation',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'solid'
          ? 'bg-accent text-white shadow-[0_6px_22px_-8px_rgba(62,207,154,.9)] hoverOnly:bg-accent-ink'
          : 'border border-ruling bg-card text-ink hoverOnly:bg-mist',
        className)}/>
  )
})
