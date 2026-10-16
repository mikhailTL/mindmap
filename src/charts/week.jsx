import React from 'react'
import { useWidth, scale } from './primitives'
import { SCORE, SCORE_RANGE } from '../lib/terms'

/* Seven days on the score's own full scale.
 *
 * WHAT IT NOW CARRIES. The chart drew three unlabelled gridlines on a floating
 * ceiling of `max(80, peak + 8)`, so the height of a bar meant something
 * different on every fixture it was handed, and the shaded band behind the
 * bars was the wearer's own usual range with neither of its two values printed
 * anywhere on the figure. It is a fixed 0 to 100 axis now, which is the range
 * the score is defined on: zero baseline, a labelled tick every 20, a minor
 * tick every 10, both band edges drawn as dashed reference lines and labelled
 * with their own value, and the unit stated on the plot.
 *
 * THE COLLISION this fixes: at 390 the above-range days printed their caret
 * and their value on one line, `▲ 64` by `▲ 68`, which at a 34px step ran the
 * two together so Thursday's marker read as part of Wednesday's number. The
 * caret is a drawn triangle on its own line above the number now, so a label
 * is only as wide as its two digits.
 *
 * 1 SVG unit = 1 CSS pixel here, because the viewBox is the measured width of
 * the container (see primitives/useWidth), so a 15px label in this file really
 * renders at 15px and SVG text is as honest as DOM text would be.
 *
 * COLOUR IS NEVER ALONE. An above-range day is amber, bold, and carries the
 * caret; an in-range day is ink-3 and plain. The legend under the plot names
 * all three marks. warn #99590c measures 5.27 : 1 on paper and 4.63 on mist,
 * ink-2 7.85, ink-3 5.33, accent 5.52, so every label here clears AA on any
 * ground this figure lands on. */

const TOP = 100                       /* the score's own ceiling, never the peak */
const MAJOR = [0, 20, 40, 60, 80, 100]
const MINOR = [10, 30, 50, 70, 90]

/* An upward caret, drawn rather than typed: a glyph in a font the reader may
   not have is not a shape you can rely on. */
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
  const L = small ? 40 : 50           /* holds a right-aligned "100" at 15px */
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
        {/* the unit, on the figure rather than only in the caption */}
        <text x="0" y="13" className="fill-ink-3" fontSize={small ? 13 : 14}>out of 100</text>

        {/* the wearer's own usual range: the shaded field, then both edges as
            dashed reference lines, then each edge's value in the gutter */}
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

        {/* the axis: a labelled tick every 20, a minor every 10, and a zero
            baseline that is drawn rather than implied */}
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
              {/* the caret is its own line above the number, which is what
                  keeps two adjacent above-range days from running together */}
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

      {/* The legend is DOM text, so it wraps at 390 instead of being clipped,
          and it names every mark the plot uses. */}
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
