import React from 'react'
import { cn } from '../../lib/utils'

/* A key and a figure on one rule. */
export function KV({ k, v, tone = 'text-ink' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2 last:border-b-0">
      <dt className="text-fine text-ink-2">{k}</dt>
      <dd className={cn('m-0 shrink-0 text-right font-display text-ui font-medium tabular-nums', tone)}>{v}</dd>
    </div>
  )
}

export const Note = ({ children, className }) =>
  <p className={cn('mt-3 max-w-[66ch] border-t border-rule pt-2.5 text-fine text-ink-3', className)}>{children}</p>

// Each use passes its own id; two patterns with one id in the same document collide.
export const Hatch = ({ id, className, label = 'Hidden, fewer than five teens' }) => (
  <svg className={cn('h-2 w-full', className)} preserveAspectRatio="none" role="img" aria-label={label}>
    <defs>
      <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" className="stroke-ruling" strokeWidth="4"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`}/>
  </svg>
)

export function Seg({ label, value, options, onChange, className }) {
  return (
    <div role="group" aria-label={label}
      className={cn('inline-flex shrink-0 overflow-hidden rounded-field border border-ruling bg-card', className)}>
      {options.map(([v, text], i) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
          className={cn('min-h-[44px] px-3 font-display text-fine font-bold transition-colors duration-100',
            i > 0 && 'border-l border-ruling',
            value === v ? 'bg-accent-wash text-accent-ink shadow-[inset_0_-2px_0_#157446]' : 'text-ink-2 hoverOnly:bg-aqua hoverOnly:text-ink')}>
          {text}
        </button>
      ))}
    </div>
  )
}

/* A field label above a native control, for the toolbar. */
export const fieldCls = `min-h-[40px] w-full rounded-field border border-ruling bg-card px-2.5 font-body
  text-fine text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-accent`

export function Spark({ points, usual, className }) {
  const w = 240, h = 52, p = 3
  const lo = 0, hi = 100
  const x = i => p + (i / Math.max(1, points.length - 1)) * (w - 2 * p)
  const y = v => h - p - ((v - lo) / (hi - lo)) * (h - 2 * p)
  const d = points.map((q, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(q.score).toFixed(1)).join(' ')
  const last = points[points.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden
      className={cn('block h-[52px] w-full', className)}>
      <rect x="0" y={y(usual.hi)} width={w} height={Math.max(1, y(usual.lo) - y(usual.hi))} className="fill-accent-wash"/>
      <path d={d} fill="none" strokeWidth="1.75" strokeLinejoin="round" className="stroke-ink-2"
        vectorEffect="non-scaling-stroke"/>
      <circle cx={x(points.length - 1)} cy={y(last.score)} r="3" className="fill-ink"/>
    </svg>
  )
}

// Measured width of the chart box, so the SVG draws at 1:1 and its labels keep their real size.
export function useWidth(fallback = 720) {
  const ref = React.useRef(null)
  const [w, setW] = React.useState(fallback)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const read = () => setW(Math.max(260, Math.round(el.getBoundingClientRect().width)) || fallback)
    read()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fallback])
  return [ref, w]
}

export function TrendChart({ points, usual, rangeLabel }) {
  const [box, W] = useWidth()
  const H = 210, L = 30, R = 8, T = 8, B = 180
  const narrow = W < 480
  const x = i => L + (i / Math.max(1, points.length - 1)) * (W - L - R)
  const y = v => B - (v / 100) * (B - T)
  const every = points.length > 20 ? (narrow ? 7 : 5) : points.length > 10 ? (narrow ? 4 : 3) : 1
  const d = points.map((q, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(q.score).toFixed(1)).join(' ')
  return (
    <div ref={box} className="mt-3 w-full">
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block w-full overflow-visible" role="img"
      aria-label={`Mind Score ${rangeLabel}, out of 100: ` + points.map(p => `${p.label} ${p.score}`).join(', ')
        + `. Usual range ${usual.lo} to ${usual.hi}.`}>
      <rect x={L} y={y(usual.hi)} width={W - L - R} height={y(usual.lo) - y(usual.hi)} className="fill-accent-wash"/>
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="stroke-rule" strokeWidth="1"/>
          <text x={L - 6} y={y(v) + 4} textAnchor="end" className="fill-ink-3 text-[13px]">{v}</text>
        </g>
      ))}
      <path d={d} fill="none" strokeWidth="2.25" strokeLinejoin="round" className="stroke-ink" vectorEffect="non-scaling-stroke"/>
      {points.map((q, i) => (
        <circle key={i} cx={x(i)} cy={y(q.score)} r={points.length > 20 ? 2.5 : 4}
          className={q.light === 'red' ? 'fill-crit' : q.light === 'yellow' ? 'fill-warn' : 'fill-ink'}/>
      ))}
      {points.map((q, i) => ((i % every === 0 && points.length - 1 - i >= every / 2) || i === points.length - 1) && (
        <text key={'l' + i} x={x(i)} y={H - 6} textAnchor="middle" className="fill-ink-3 text-[13px]">{q.label}</text>
      ))}
    </svg>
    </div>
  )
}
