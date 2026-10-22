import React from 'react'
import { cn } from '../../lib/utils'
import { STATUS_SUB, TIER_FILL } from './data'

const INK = '#0d2b1e', INK3 = '#426a58', GRID = '#e3ede7', BAND = '#dcefe4', BAND_EDGE = '#93b2a1', LINE = '#157446'
// React useId values contain colons, which break url(#id) references in SVG.
const cleanId = id => id.replace(/[^a-zA-Z0-9_-]/g, '')

export function useWidth(initial = 560, min = 200) {
  const ref = React.useRef(null)
  const [w, setW] = React.useState(initial)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const set = () => setW(Math.max(min, Math.round(el.getBoundingClientRect().width)))
    set()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [min])
  return [ref, w]
}

export function ScoreChart({ teen, points, kind = 'bars', selected, onPick, height = 236, className }) {
  const [ref, W] = useWidth()
  const [hover, setHover] = React.useState(null)
  const gid = cleanId('sc' + React.useId())
  const H = height, top = 24, bottom = 28, left = 32, right = 8
  const plotW = W - left - right, plotH = H - top - bottom
  const y = v => top + (plotH * (100 - v)) / 100
  const n = points.length
  const slot = plotW / Math.max(1, n)
  const cx = i => left + slot * i + slot / 2
  const bw = Math.max(6, Math.min(44, slot * 0.62))
  const every = n > 14 ? (W < 480 ? 7 : 5) : 1
  const fill = p => TIER_FILL[p.light] || LINE
  const hp = hover != null ? points[hover] : null
  const scored = points.filter(p => p.score != null)

  // The month line breaks over a day with no reading rather than bridging it.
  const segs = []
  let cur = []
  points.forEach((p, i) => {
    if (p.score == null) { if (cur.length) segs.push(cur); cur = [] } else cur.push([cx(i), y(p.score)])
  })
  if (cur.length) segs.push(cur)
  const path = s => s.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('')

  const label = `Mind Score by day: ${scored.map(p => `${p.long || p.label} ${p.score}`).join(', ')}.` +
    (teen.usual ? ` Usual range ${teen.usual.lo} to ${teen.usual.hi}.` : '')

  return (
    <div ref={ref} className={cn('relative w-full', className)} onMouseLeave={() => setHover(null)}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={LINE} stopOpacity="0.26"/>
            <stop offset="1" stopColor={LINE} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {teen.usual && (
          <g>
            <rect x={left} y={y(teen.usual.hi)} width={plotW} height={y(teen.usual.lo) - y(teen.usual.hi)} fill={BAND}/>
            <line x1={left} x2={W - right} y1={y(teen.usual.hi)} y2={y(teen.usual.hi)} stroke={BAND_EDGE} strokeDasharray="4 3"/>
            <line x1={left} x2={W - right} y1={y(teen.usual.lo)} y2={y(teen.usual.lo)} stroke={BAND_EDGE} strokeDasharray="4 3"/>
          </g>
        )}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            {v === 0 && <line x1={left} x2={W - right} y1={y(v)} y2={y(v)} stroke={BAND_EDGE}/>}
            {v !== 0 && <line x1={left} x2={W - right} y1={y(v)} y2={y(v)} stroke={GRID} strokeOpacity="0.9"/>}
            <text x={left - 7} y={y(v) + 4} textAnchor="end" fontSize="11.5" fill={INK3}>{v}</text>
          </g>
        ))}

        {selected && points.map((p, i) => p.date === selected && (
          <rect key={'s' + i} x={cx(i) - Math.min(slot, bw + 14) / 2} y={top - 20} width={Math.min(slot, bw + 14)}
            height={plotH + 20} rx="8" fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="3 3"/>
        ))}

        {kind === 'bars' ? points.map((p, i) => {
          if (p.score == null) {
            return <text key={i} x={cx(i)} y={y(0) - 6} textAnchor="middle" fontSize="11" fill={INK3}>none</text>
          }
          const h = Math.max(4, y(0) - y(p.score))
          const r = Math.min(8, bw / 2)
          return (
            <g key={i} opacity={hover != null && hover !== i ? 0.6 : 1}>
              <path d={`M${cx(i) - bw / 2} ${y(0)}V${y(0) - h + r}q0 -${r} ${r} -${r}h${bw - 2 * r}q${r} 0 ${r} ${r}V${y(0)}Z`}
                fill={fill(p)}/>
              <text x={cx(i)} y={y(p.score) - 7} textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}
                style={{ fontVariantNumeric: 'tabular-nums' }}>{p.score}</text>
            </g>
          )
        }) : (
          <>
            {segs.map((s, k) => s.length > 1 && (
              <path key={'a' + k} d={`${path(s)}L${s[s.length - 1][0].toFixed(1)} ${y(0)}L${s[0][0].toFixed(1)} ${y(0)}Z`}
                fill={`url(#${gid})`}/>
            ))}
            {segs.map((s, k) => (
              <path key={'l' + k} d={path(s)} fill="none" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round"
                strokeLinecap="round"/>
            ))}
            {points.map((p, i) => p.score != null && (
              <circle key={'d' + i} cx={cx(i)} cy={y(p.score)} r={p.date === selected || hover === i ? 6.5 : 4}
                fill={fill(p)} stroke="#ffffff" strokeWidth="2"/>
            ))}
          </>
        )}

        {points.map((p, i) => (i % every === 0 || i === n - 1) && !(every > 1 && i !== n - 1 && n - 1 - i < every / 2) && (
          <text key={'x' + i} x={cx(i)} y={H - 8} textAnchor="middle" fontSize="12" fill={i === n - 1 ? INK : INK3}
            fontWeight={i === n - 1 || p.date === selected ? 700 : 400}>{p.label}</text>
        ))}

        {points.map((p, i) => (
          <rect key={'h' + i} x={cx(i) - slot / 2} y={top - 20} width={slot} height={plotH + 20} fill="transparent"
            style={{ cursor: onPick && p.date && p.score != null ? 'pointer' : 'default' }}
            onMouseEnter={() => setHover(i)} onClick={() => onPick && p.date && onPick(p.date)}/>
        ))}
      </svg>
      {hp && hp.score != null && (
        <div aria-hidden className="pointer-events-none absolute z-20 -translate-x-1/2 whitespace-nowrap rounded-field
          border border-rule bg-card px-2.5 py-1.5 text-fine text-ink shadow-raise"
          style={{ left: Math.max(80, Math.min(W - 80, cx(hover))), top: Math.max(0, y(hp.score) - 66) }}>
          <span className="block font-display font-bold">{hp.long || hp.label}: {hp.score}</span>
          {hp.light && <span className="block text-ink-2">{STATUS_SUB[hp.light]}</span>}
        </div>
      )}
    </div>
  )
}

export function ScoreLegend({ teen, className, hint }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-1.5 text-fine text-ink-2', className)}>
      {teen.usual && (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-3 w-6 rounded-xs border border-dashed" style={{ background: BAND, borderColor: BAND_EDGE }}/>
          Usual range, {teen.usual.lo} to {teen.usual.hi}
        </span>
      )}
      {['green', 'yellow', 'red'].map(l => (
        <span key={l} className="inline-flex items-center gap-2">
          <span aria-hidden className="size-3 rounded-full" style={{ background: TIER_FILL[l] }}/>
          {STATUS_SUB[l]}
        </span>
      ))}
      {hint && <span className="text-ink-3">{hint}</span>}
    </div>
  )
}
