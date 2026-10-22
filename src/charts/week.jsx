import React from 'react'
import { useWidth, scale } from './primitives'
import { SCORE, SCORE_RANGE } from '../lib/terms'

const TOP = 100  /* the score's own ceiling, not the week's peak */
const MAJOR = [0, 20, 40, 60, 80, 100]
const MINOR = [10, 30, 50, 70, 90]

const caret = (cx, y, w) =>
  `M${(cx - w).toFixed(1)} ${(y + w * 0.9).toFixed(1)}L${cx.toFixed(1)} ${y.toFixed(1)}`
  + `L${(cx + w).toFixed(1)} ${(y + w * 0.9).toFixed(1)}Z`

function alt(data, band) {
  const over = data.filter(d => d.v > band.hi)
  const rows = data.map(d => `${d.d} ${d.v}${d.v > band.hi ? ', above the range' : ''}`).join(', ')
  return `${SCORE} for seven days, ${SCORE_RANGE}. Their own usual range is `
    + `${band.lo} to ${band.hi}. ${rows}. `
    + `${over.length} of ${data.length} days ran above the range.`
}

export function WeekChart({ data, band }) {
  const [ref, W] = useWidth()
  const small = W < 560
  const H = small ? 232 : 256
  const L = small ? 40 : 50  /* holds a right-aligned "100" at 15px */
  const R = small ? 30 : 42           /* holds the two band-edge values */
  const T = 36, B = 36                /* T holds the caret and the value above a 100 bar */
  const y = v => scale(v, 0, TOP, H - B, T)
  const step = (W - L - R) / data.length
  const bw = Math.min(28, step * 0.46)
  const tick = small ? 15 : 16
  return (
    <div ref={ref} className="mt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
        aria-label={alt(data, band)}>
        <text x="0" y="13" className="fill-ink-3" fontSize={small ? 13 : 14}>out of 100</text>

        <rect x={L} y={y(band.hi)} width={W - R - L} height={y(band.lo) - y(band.hi)}
          className="fill-accent opacity-[0.09]"/>
        {[band.hi, band.lo].map(v => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="stroke-accent"
              strokeWidth="1" strokeDasharray="5 4"/>
            <text x={W - R + 6} y={y(v) + 5} className="fill-accent "
              fontSize={small ? 13 : 14}>{v}</text>
          </g>
        ))}

        {MINOR.map(v => (
          <line key={v} x1={L - 4} x2={L} y1={y(v)} y2={y(v)} className="stroke-ink-3" strokeWidth="1"/>
        ))}
        {MAJOR.map(v => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)}
              className={v === 0 ? 'stroke-ink-3' : 'stroke-rule'} strokeWidth="1"/>
            <line x1={L - 7} x2={L} y1={y(v)} y2={y(v)} className="stroke-ink-3" strokeWidth="1"/>
            <text x={L - 11} y={y(v) + 5} textAnchor="end" className="fill-ink-3 "
              fontSize={tick}>{v}</text>
          </g>
        ))}
        <line x1={L} x2={L} y1={T} y2={H - B} className="stroke-ink-3" strokeWidth="1"/>

        {data.map((d, i) => {
          const cx = L + step * i + step / 2
          const over = d.v > band.hi
          const num = y(d.v) - 10
          return (
            <g key={d.d}>
              <rect x={cx - bw / 2} y={y(d.v)} width={bw} height={(H - B) - y(d.v)} rx="3"
                className={over ? 'fill-warn' : 'fill-ink-3'}/>
              {over && <path d={caret(cx, num - 24, 5)} className="fill-warn"/>}
              <text x={cx} y={num} textAnchor="middle"
                className={over ? 'fill-warn font-medium' : 'fill-ink-2'}
                fontSize={tick + 2}>{d.v}</text>
              <text x={cx} y={H - B + 20} textAnchor="middle" className="fill-ink-3"
                fontSize={tick}>{d.d}</text>
            </g>
          )
        })}
      </svg>

      <ul aria-hidden className="m-0 mt-2 flex list-none flex-wrap gap-x-5 gap-y-1 p-0
        text-fine text-ink-3">
        <li className="flex items-center gap-2">
          <span className="block h-2.5 w-4 shrink-0 border border-accent bg-accent/20"/>
          Their usual range, {band.lo} to {band.hi}
        </li>
        <li className="flex items-center gap-2">
          <span className="block h-2.5 w-2 shrink-0 rounded-xs bg-ink-3"/>Inside the range
        </li>
        <li className="flex items-center gap-2">
          <span className="block h-2.5 w-2 shrink-0 rounded-xs bg-warn"/>▲ Above the range
        </li>
      </ul>
    </div>
  )
}
