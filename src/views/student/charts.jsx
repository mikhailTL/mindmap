import React from 'react'
import { ArrowRight } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { USUAL, bandOf } from '../../lib/readingLog'
import { BAND } from '../reading/marks'
import { SCORE } from '../../lib/terms'

const INK = '#0d2b1e', INK3 = '#426a58', GRID = '#e3ede7', BAND_FILL = '#dcefe4',
  BAND_EDGE = '#93b2a1', LINE = '#157446'

export function TextLink({ onClick, children, className, arrow = false }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('inline-flex min-h-[44px] items-center gap-1.5 font-display text-ui font-bold',
        'text-accent underline decoration-2 underline-offset-4 hoverOnly:text-ink', className)}>
      {children}
      {arrow && <ArrowRight aria-hidden className="size-4 shrink-0"/>}
    </button>
  )
}

export const TakeReading = ({ go, className, children = 'Take a reading' }) => (
  <TextLink className={className} onClick={() => go?.('reading')}>{children}</TextLink>
)

export const SeeTrends = ({ go, className, children = 'See Trends' }) => (
  <TextLink className={className} arrow onClick={() => go?.('student-trends')}>{children}</TextLink>
)

export function useWidth(initial = 560) {
  const ref = React.useRef(null)
  const [w, setW] = React.useState(initial)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const set = () => setW(Math.max(220, Math.round(el.getBoundingClientRect().width) || initial))
    set()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [initial])
  return [ref, w]
}

// Monotone cubic interpolation (Fritsch and Carlson): the curve passes through every point and
// does not overshoot between two of them.
export function smoothPath(pts) {
  const n = pts.length
  if (!n) return ''
  const f = v => v.toFixed(1)
  if (n === 1) return `M${f(pts[0][0])} ${f(pts[0][1])}`
  const dx = [], m = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0]
    m[i] = dx[i] > 0 ? (pts[i + 1][1] - pts[i][1]) / dx[i] : 0
  }
  const t = [m[0]]
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0 || !dx[i - 1] || !dx[i] ? 0
      : 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i])
  }
  t[n - 1] = m[n - 2]
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]
    if (dx[i] <= 0) { d += `L${f(x1)} ${f(y1)}`; continue }
    const h = dx[i] / 3
    d += `C${f(x0 + h)} ${f(y0 + t[i] * h)} ${f(x1 - h)} ${f(y1 - t[i + 1] * h)} ${f(x1)} ${f(y1)}`
  }
  return d
}

const bandFor = v => BAND[bandOf(v)]
const fillFor = v => bandFor(v).fill

export function NoData({ go, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-0.5 text-center', className)}>
      <p className="m-0 font-display text-ui font-bold text-ink">No data yet</p>
      <TakeReading go={go}/>
    </div>
  )
}

// points: [{ key, x (0 to 1 across), v, read }], oldest first. detail(point) renders how that
// point was taken, shown once the point is tapped.
export function ScoreChart({ points = [], ticks = [], usual = USUAL, go, band = bandFor, label,
  className, tall = false, detail }) {
  const [ref, w] = useWidth()
  const [sel, setSel] = React.useState(null)
  const [open, setOpen] = React.useState(null)
  // useId values contain colons, which break url(#id) references.
  const gid = 'sc' + React.useId().replace(/:/g, '')
  React.useEffect(() => { setSel(null); setOpen(null) }, [points.length, points[0]?.key])

  const H = (w < 520 ? 210 : w < 640 ? 250 : 320) + (tall ? 30 : 0)
  const P = { l: 38, r: 14, t: 26, b: 30 }
  const iw = w - P.l - P.r, ih = H - P.t - P.b
  const x = u => P.l + u * iw
  const y = v => P.t + (1 - v / 100) * ih
  const pts = points.map(p => [x(p.x), y(p.v)])
  const line = smoothPath(pts)
  const area = pts.length > 1
    ? `${line}L${pts[pts.length - 1][0].toFixed(1)} ${y(0)}L${pts[0][0].toFixed(1)} ${y(0)}Z` : ''
  const i = sel == null ? points.length - 1 : sel
  const pick = points[i]
  const r = points.length > 40 ? 3 : 4.5
  const empty = !points.length

  const nearest = clientX => {
    if (empty) return null
    const box = ref.current.getBoundingClientRect()
    const px = ((clientX - box.left) / box.width) * w
    let best = 0
    for (let k = 1; k < pts.length; k++) if (Math.abs(pts[k][0] - px) < Math.abs(pts[best][0] - px)) best = k
    setSel(best)
    return best
  }
  const onKey = e => {
    if (empty) return
    if (detail && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(i); return }
    const go_ = { ArrowLeft: Math.max(0, i - 1), ArrowRight: Math.min(points.length - 1, i + 1),
      Home: 0, End: points.length - 1 }[e.key]
    if (go_ == null) return
    e.preventDefault(); setSel(go_)
    if (open != null) setOpen(go_)
  }
  const vs = points.map(p => p.v)
  const aria = empty ? `${label || SCORE + ' chart'}. No data yet.`
    : `${label || SCORE + ' chart'}, ${points.length} point${points.length === 1 ? '' : 's'}, lowest
      ${Math.min(...vs)}, highest ${Math.max(...vs)}. Your usual range is ${usual.lo} to ${usual.hi}.
      Arrow keys step through the points.${detail ? ' Enter shows how that point was taken.' : ''}`

  return (
    <figure className={cn('m-0', className)}>
      <p aria-live="polite" className="m-0 flex min-h-[28px] flex-wrap items-baseline gap-x-2 text-meta text-ink-2">
        {pick ? (
          <>
            <b className="font-display text-row font-bold tabular-nums text-ink">{pick.v}</b>
            <span>{pick.read}</span>
            <span className={cn('text-fine font-bold', band(pick.v).ink)}>{band(pick.v).word}</span>
          </>
        ) : <span className="sr-only">No data yet</span>}
      </p>
      <div ref={ref} tabIndex={empty ? -1 : 0} role="group" aria-label={aria} onKeyDown={onKey}
        onPointerMove={e => nearest(e.clientX)} onPointerDown={e => { const k = nearest(e.clientX); if (detail && k != null) setOpen(k) }}
        className="relative mt-1 touch-pan-y select-none rounded-field outline-offset-2">
        <svg aria-hidden width={w} height={H} className="block max-w-full">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={LINE} stopOpacity="0.16"/>
              <stop offset="1" stopColor={LINE} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <text x={4} y={12} fontSize="12" fontWeight="700" fill={INK}>{SCORE}</text>
          <text x={w - P.r} y={12} fontSize="11" textAnchor="end" fill={INK3}>higher is more stress</text>
          {[0, 25, 50, 75, 100].map(v => (
            <g key={v}>
              <line x1={P.l} x2={P.l + iw} y1={y(v)} y2={y(v)} stroke={v === 0 ? BAND_EDGE : GRID} strokeWidth="1"/>
              <text x={P.l - 7} y={y(v) + 4} textAnchor="end" fontSize="11" fill={INK3}
                style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</text>
            </g>
          ))}
          <rect x={P.l} width={iw} y={y(usual.hi)} height={y(usual.lo) - y(usual.hi)} fill={BAND_FILL}/>
          {[usual.lo, usual.hi].map(v => (
            <line key={'u' + v} x1={P.l} x2={P.l + iw} y1={y(v)} y2={y(v)} stroke={LINE} strokeOpacity=".55"
              strokeDasharray="5 4"/>
          ))}
          {ticks.map(tk => tk.label && (
            <text key={tk.x + tk.label} x={x(tk.x)} y={H - 9} fontSize="11" fill={INK3}
              textAnchor={tk.x < 0.03 ? 'start' : tk.x > 0.97 ? 'end' : 'middle'}>{tk.label}</text>
          ))}
          {area && <path d={area} fill={`url(#${gid})`}/>}
          {line && pts.length > 1 && (
            <path d={line} fill="none" stroke={LINE} strokeWidth="2.6" strokeLinejoin="round"
              strokeLinecap="round"/>
          )}
          {pick && (
            <line x1={x(pick.x)} x2={x(pick.x)} y1={P.t} y2={y(0)} stroke={INK} strokeOpacity=".25"
              strokeDasharray="3 3"/>
          )}
          {pts.map(([px, py], k) => (
            <circle key={points[k].key} cx={px} cy={py} r={k === i ? r + 2 : r} fill={band(points[k].v).fill}
              stroke="#ffffff" strokeWidth={k === i ? 2.5 : 1.5}/>
          ))}
        </svg>
        {empty && (
          <div className="absolute flex justify-center"
            style={{ top: P.t + ih / 2 - 40, left: P.l, width: iw }}>
            <NoData go={go} className="rounded-panel border border-rule bg-card px-4 py-1.5 shadow-card"/>
          </div>
        )}
      </div>
      <figcaption className="mt-1.5 text-fine text-ink-3">
        Shaded: your usual range, {usual.lo} to {usual.hi}.
        {detail && !empty && open == null && ' Tap a point to see how it was taken.'}
      </figcaption>
      {detail && open != null && points[open] && (
        <div aria-live="polite" className="mt-2.5 border-t border-rule pt-2.5">{detail(points[open])}</div>
      )}
    </figure>
  )
}

export function Sparkline({ values = [], usual = USUAL, className, label }) {
  const [ref, w] = useWidth(300)
  const gid = 'sp' + React.useId().replace(/:/g, '')
  const H = 120, P = { l: 4, r: 30, t: 10, b: 20 }
  const iw = w - P.l - P.r, ih = H - P.t - P.b
  const n = values.length
  const x = k => P.l + (n > 1 ? k / (n - 1) : 0.5) * iw
  // The y scale covers the data and the usual band, padded by 5 and rounded out to tens.
  const vs = values.filter(p => p.v != null).map(p => p.v).concat([usual.lo, usual.hi])
  const lo = Math.max(0, Math.floor((Math.min(...vs) - 5) / 10) * 10)
  const hi = Math.min(100, Math.ceil((Math.max(...vs) + 5) / 10) * 10)
  const y = v => P.t + (1 - (v - lo) / (hi - lo || 1)) * ih
  const real = values.map((p, k) => (p.v == null ? null : [x(k), y(p.v), p])).filter(Boolean)
  const line = smoothPath(real)
  const last = real[real.length - 1]
  const area = real.length > 1
    ? `${line}L${last[0].toFixed(1)} ${y(lo)}L${real[0][0].toFixed(1)} ${y(lo)}Z` : ''
  return (
    <div ref={ref} className={cn('relative', className)}>
      <svg role="img" aria-label={label} width={w} height={H} className="block max-w-full">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={LINE} stopOpacity="0.24"/>
            <stop offset="1" stopColor={LINE} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <rect x={P.l} width={iw} y={y(usual.hi)} height={y(usual.lo) - y(usual.hi)} fill={BAND_FILL}/>
        <line x1={P.l} x2={P.l + iw} y1={y(lo)} y2={y(lo)} stroke={BAND_EDGE}/>
        {area && <path d={area} fill={`url(#${gid})`}/>}
        {real.length > 1 && <path d={line} fill="none" stroke={LINE} strokeWidth="2.4" strokeLinecap="round"
          strokeLinejoin="round"/>}
        {real.map(([px, py, p], k) => (
          <circle key={p.key} cx={px} cy={py} r={k === real.length - 1 ? 4.5 : 2.6} fill={fillFor(p.v)}
            stroke="#ffffff" strokeWidth="1.5"/>
        ))}
        {last && (
          <text x={last[0] + 8} y={last[1] + 4} fontSize="13" fontWeight="700" fill={INK}
            style={{ fontVariantNumeric: 'tabular-nums' }}>{last[2].v}</text>
        )}
        {n > 0 && (
          <>
            <text x={P.l} y={H - 5} fontSize="11" fill={INK3}>{values[0].label}</text>
            <text x={P.l + iw} y={H - 5} fontSize="11" fill={INK3} textAnchor="end">{values[n - 1].label}</text>
          </>
        )}
      </svg>
    </div>
  )
}

const PULSE = '#e11919', PULSE_FILL = '#fde3e3'

// wave is the band-passed pulse from analysePPG at `fs` samples a second; the last `seconds` are drawn.
export function PulseChart({ wave = [], fs = 30, seconds = 10, className }) {
  const [ref, w] = useWidth(420)
  const gid = 'pc' + React.useId().replace(/:/g, '')
  const H = 150, P = { l: 8, r: 8, t: 10, b: 26 }
  const iw = w - P.l - P.r, ih = H - P.t - P.b
  const take = Math.min(wave.length, Math.round(seconds * fs))
  const tail = wave.slice(wave.length - take)
  // Thins the trace to about one point per 3 px, at least 60 points, to keep the path short.
  const step = Math.max(1, Math.floor(tail.length / Math.max(60, Math.round(iw / 3))))
  const raw = []
  for (let k = 0; k < tail.length; k += step) raw.push([k, tail[k]])
  const lo = Math.min(...tail, -1), hi = Math.max(...tail, 1)
  const span = hi - lo || 1
  const pts = raw.map(([k, v]) => [P.l + (k / Math.max(1, tail.length - 1)) * iw,
    P.t + (1 - (v - lo) / span) * ih])
  const line = smoothPath(pts)
  const shown = tail.length / fs
  const ticks = []
  for (let s = 0; s <= shown + 0.01; s += 1) ticks.push(s)
  const tx = s => P.l + (s / (shown || 1)) * iw
  return (
    <div ref={ref} className={cn('relative', className)}>
      <svg aria-hidden width={w} height={H} className="block max-w-full">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={PULSE} stopOpacity="0.28"/>
            <stop offset="1" stopColor={PULSE} stopOpacity="0"/>
          </linearGradient>
          <linearGradient id={gid + 'l'} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#f08a8a"/>
            <stop offset="1" stopColor={PULSE}/>
          </linearGradient>
        </defs>
        <rect x={P.l} y={P.t} width={iw} height={ih} fill={PULSE_FILL} fillOpacity="0.35" rx="6"/>
        {pts.length > 1 && (
          <>
            <path d={`${line}L${pts[pts.length - 1][0].toFixed(1)} ${P.t + ih}L${pts[0][0].toFixed(1)} ${P.t + ih}Z`}
              fill={`url(#${gid})`}/>
            <path d={line} fill="none" stroke={`url(#${gid}l)`} strokeWidth="2.4" strokeLinejoin="round"
              strokeLinecap="round"/>
          </>
        )}
        {ticks.map(s => (
          <line key={s} x1={tx(s)} x2={tx(s)} y1={P.t + ih} y2={P.t + ih + 4} stroke={INK3}/>
        ))}
        <text x={P.l} y={H - 6} fontSize="11" fill={INK3}>{Math.round(shown)} seconds before the end</text>
        <text x={P.l + iw} y={H - 6} fontSize="11" fill={INK3} textAnchor="end">end</text>
      </svg>
    </div>
  )
}
