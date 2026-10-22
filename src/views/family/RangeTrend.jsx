import React from 'react'
import { RANGES, RANGE_LABEL } from '../../lib/roster'
import { cn } from '../../lib/utils'
import { RANGE_WORD, PREV, changeWords, fillOf, shortDate, showsHours, showsTrends, subOf,
  summaryOf } from './data'

// Day / Week / Month Mind Score trend for one teen, their usual band shaded behind it.
// Higher means more stress: 0 calm, 100 peak.
const INK = '#0d2b1e', INK3 = '#426a58', GRID = '#e3ede7', BAND = '#dcefe4', BAND_INK = '#0f5836', LINE = '#157446'

export function RangeSwitch({ value, onChange, label = 'Range', className, compact = false }) {
  const refs = React.useRef([])
  const key = (e, i) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const n = (i + d + RANGES.length) % RANGES.length
    onChange(RANGES[n])
    refs.current[n]?.focus()
  }
  return (
    <div role="radiogroup" aria-label={label}
      className={cn('relative z-10 inline-flex items-stretch border-b border-rule', className)}>
      {RANGES.map((r, i) => {
        const on = r === value
        return (
          <button key={r} ref={el => (refs.current[i] = el)} type="button" role="radio" aria-checked={on}
            tabIndex={on ? 0 : -1} onClick={e => { e.stopPropagation(); onChange(r) }} onKeyDown={e => key(e, i)}
            className={cn('relative -mb-px min-h-[44px] font-display text-ui transition-colors duration-150',
              compact ? 'px-2.5' : 'px-3.5',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
              on ? 'font-bold text-ink' : 'font-medium text-ink-2 hoverOnly:text-ink')}>
            {RANGE_WORD[r]}
            <span aria-hidden className={cn('absolute inset-x-2 bottom-0 h-[3px] rounded-bar',
              on ? 'bg-accent' : 'bg-transparent')}/>
          </button>
        )
      })}
    </div>
  )
}

function useWidth(initial = 560, min = 200) {
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
  }, [])
  return [ref, w]
}

// Today as a dot on a 0 to 100 rule, yesterday as a dashed tick; used when hours are not shared.
export function DayGauge({ teen, value, prev, large = false, className }) {
  const [ref, W] = useWidth(large ? 480 : 140, large ? 200 : 48)
  const H = large ? 86 : 40
  const pad = large ? 14 : 7
  const x = v => pad + ((W - pad * 2) * Math.max(0, Math.min(100, v))) / 100
  const cy = large ? 34 : 22
  const fill = fillOf(teen, value)
  return (
    <div ref={ref} className={cn('w-full min-w-0 overflow-hidden', className)}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden className="block">
        <rect x={pad} y={cy - 4} width={W - pad * 2} height={8} rx={4} fill={GRID}/>
        {teen.usual && <rect x={x(teen.usual.lo)} y={cy - (large ? 12 : 8)} width={x(teen.usual.hi) - x(teen.usual.lo)}
          height={large ? 24 : 16} rx={4} fill={BAND}/>}
        {prev != null && (
          <line x1={x(prev)} x2={x(prev)} y1={cy - (large ? 12 : 8)} y2={cy + (large ? 12 : 8)}
            stroke={INK3} strokeWidth="2" strokeDasharray="3 2"/>
        )}
        <circle cx={x(value)} cy={cy} r={large ? 9 : 6} fill={fill} stroke="#ffffff" strokeWidth="2"/>
        {large && (
          <g fontSize="12" fill={INK3}>
            <text x={pad} y={H - 8}>0 calm</text>
            <text x={W - pad} y={H - 8} textAnchor="end">100 peak</text>
            {teen.usual && <text x={(x(teen.usual.lo) + x(teen.usual.hi)) / 2} y={cy - 17} textAnchor="middle" fill={BAND_INK}
              fontWeight="600">Usual {teen.usual.lo} to {teen.usual.hi}</text>}
          </g>
        )}
      </svg>
    </div>
  )
}

function Chart({ teen, range, s, day, onDay }) {
  const [ref, W] = useWidth()
  const [hover, setHover] = React.useState(null)
  const H = 216, top = 26, bottom = 26, left = 30, right = 6
  const plotW = W - left - right, plotH = H - top - bottom
  const y = v => top + (plotH * (100 - v)) / 100
  const n = s.points.length
  const slot = plotW / n
  const cx = i => left + slot * i + slot / 2
  const line = range === 'day'
  const bw = Math.max(4, Math.min(36, slot * (range === 'week' ? 0.56 : 0.64)))
  const labelEvery = range === 'month' ? 5 : range === 'day' ? (W < 420 ? 3 : 2) : 1
  const hp = hover != null ? s.points[hover] : null
  const what = p => (p.date ? `${range === 'week' ? p.label + ', ' : ''}${shortDate(p.date)}` : p.label)

  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" className="block"
        aria-label={`Mind Score, ${RANGE_LABEL[range].toLowerCase()}: ${s.points.map(p =>
          `${what(p)} ${p.score}`).join(', ')}.${teen.usual ? ` Usual is ${teen.usual.lo} to ${teen.usual.hi}.` : ''}`}>
        {[0, 50, 100].map(v => (
          <g key={v}>
            <line x1={left} x2={W - right} y1={y(v)} y2={y(v)} stroke={GRID}/>
            <text x={left - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill={INK3}>{v}</text>
          </g>
        ))}
        {teen.usual && <rect x={left} y={y(teen.usual.hi)} width={plotW} height={y(teen.usual.lo) - y(teen.usual.hi)} fill={BAND}/>}

        {line ? (
          <>
            <path d={s.points.map((p, i) => `${i ? 'L' : 'M'}${cx(i).toFixed(1)} ${y(p.score).toFixed(1)}`).join('')}
              fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
            {s.points.map((p, i) => (
              <circle key={i} cx={cx(i)} cy={y(p.score)} r={hover === i ? 6 : 4}
                fill={fillOf(teen, p.score)} stroke="#ffffff" strokeWidth="2"/>
            ))}
          </>
        ) : s.points.map((p, i) => {
          const h = Math.max(3, y(0) - y(p.score))
          const picked = day && p.date === day
          return (
            <g key={i}>
              {picked && <rect x={cx(i) - slot / 2 + 1} y={top - 22} width={slot - 2} height={plotH + 22}
                rx="6" fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="3 3"/>}
              <path d={`M${cx(i) - bw / 2} ${y(0)}V${y(0) - h + 4}q0 -4 4 -4h${bw - 8}q4 0 4 4V${y(0)}Z`}
                fill={fillOf(teen, p.score)} opacity={hover != null && hover !== i ? 0.55 : 1}/>
              {range === 'week' && (
                <text x={cx(i)} y={y(p.score) - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill={INK}
                  style={{ fontVariantNumeric: 'tabular-nums' }}>{p.score}</text>
              )}
            </g>
          )
        })}

        {s.points.map((p, i) => (i % labelEvery === 0 || i === n - 1) && (
          <text key={'l' + i} x={cx(i)} y={H - 8} textAnchor="middle" fontSize="11.5" fill={i === n - 1 ? INK : INK3}
            fontWeight={i === n - 1 ? 700 : 400}>{range === 'month' && i === n - 1 ? 'Today' : p.label}</text>
        ))}

        {/* Hit areas: a column per point, wider than the mark. */}
        {s.points.map((p, i) => (
          <rect key={'h' + i} x={cx(i) - slot / 2} y={top - 20} width={slot} height={plotH + 20} fill="transparent"
            style={{ cursor: onDay && p.date ? 'pointer' : 'default' }}
            onMouseEnter={() => setHover(i)} onClick={() => onDay && p.date && onDay(p.date)}/>
        ))}
      </svg>
      {hp && (
        <div aria-hidden className="pointer-events-none absolute z-20 -translate-x-1/2 whitespace-nowrap rounded-field
          border border-rule bg-card px-2.5 py-1.5 text-fine text-ink shadow-raise"
          style={{ left: Math.max(70, Math.min(W - 70, cx(hover))), top: Math.max(0, y(hp.score) - 62) }}>
          <span className="block font-display font-bold">{what(hp)}: {hp.score}</span>
          {subOf(teen, hp.score) && <span className="block text-ink-2">{subOf(teen, hp.score)}</span>}
        </div>
      )}
    </div>
  )
}

/* One key and its figure. */
function Fig({ k, v, sub }) {
  return (
    <div className="min-w-0">
      <dt className="text-fine text-ink-2">{k}</dt>
      <dd className="m-0 mt-0.5 font-display text-row font-bold tabular-nums leading-none text-ink">{v}</dd>
      {sub && <dd className="m-0 mt-1 text-fine text-ink-3">{sub}</dd>}
    </div>
  )
}

// `range` and `onRange` make it controlled; without them it keeps its own range.
export default function RangeTrend({ teen, range: given, onRange, variant = 'parent', day, onDay, className, title = 'Mind Score trend' }) {
  const [own, setOwn] = React.useState('week')
  const range = given ?? own
  const setRange = onRange ?? setOwn
  const s = summaryOf(teen, range)
  const trends = showsTrends(teen, variant)
  const hours = showsHours(teen, variant)
  const above = teen.usual ? s.points.filter(p => p.score > teen.usual.hi).length : null
  const prev = teen.days[teen.days.length - 2].score
  const empty = s.mean == null || (range !== 'day' && !s.points.length)

  return (
    <section className={cn('rounded-panel border border-rule bg-card p-5 shadow-card sm:p-6', className)}
      aria-label={`${title}, ${RANGE_LABEL[range].toLowerCase()}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="m-0 font-display text-head font-bold leading-tight text-ink">{title}</h3>
          <p className="m-0 mt-1 text-fine text-ink-2">{RANGE_LABEL[range]}. 0 is calm, 100 is peak.</p>
        </div>
        <RangeSwitch value={range} onChange={setRange} label={`${title} range`}/>
      </div>

      <div className="mt-5">
        {empty ? (
          <p className="m-0 max-w-[52ch] text-ui text-ink-2">No readings {range === 'day' ? 'today' : `in ${RANGE_LABEL[range].toLowerCase()}`} yet.
            {' '}{teen.first}’s Mind Score shows here after their next reading.</p>
        ) : !trends ? (
          <p className="m-0 max-w-[52ch] text-ui text-ink-2">This student has not shared Trends. Only the score
            for the range is shown.</p>
        ) : range === 'day' && !hours ? (
          <>
            <DayGauge teen={teen} value={s.mean} prev={prev} large/>
            <p className="m-0 mt-2 max-w-[56ch] text-fine text-ink-2">The dot is today as a whole day.
              {prev != null ? ' The dashed line is yesterday.' : ''} {teen.live
                ? `${teen.first}’s single readings are not shared, only the day.`
                : `Hour by hour stays with ${teen.first} unless they share it.`}</p>
          </>
        ) : (
          <>
            <Chart teen={teen} range={range} s={s} day={day} onDay={onDay}/>
            <p className="m-0 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-fine text-ink-2">
              {teen.usual && <span className="inline-flex items-center gap-2">
                <span aria-hidden className="h-3 w-5 rounded-xs" style={{ background: BAND }}/>
                Usual range, {teen.usual.lo} to {teen.usual.hi}</span>}
              {onDay && range !== 'day' && <span className="text-ink-3">Pick a bar to see that day below.</span>}
            </p>
          </>
        )}
      </div>

      {!empty && (
      <dl className="m-0 mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-4 sm:grid-cols-4">
        <Fig k={range === 'day' ? 'Today' : 'Average'} v={s.mean} sub={subOf(teen, s.mean)}/>
        {s.change == null
          ? <Fig k={`Change vs ${PREV[range]}`} v="None" sub="Nothing earlier to compare"/>
          : <Fig k={`Change vs ${PREV[range]}`} v={`${s.change > 0 ? '+' : s.change < 0 ? '−' : ''}${Math.abs(s.change)}`}
              sub={changeWords(s.change, range, 'parent')}/>}
        {range === 'day' && !hours ? (
          <Fig k="Yesterday" v={prev ?? 'None'} sub={prev == null ? 'No readings' : subOf(teen, prev)}/>
        ) : (
          <Fig k="Lowest to highest" v={`${s.min} to ${s.max}`}/>
        )}
        {range === 'day' ? (
          <Fig k="Usual range" v={teen.usual ? `${teen.usual.lo} to ${teen.usual.hi}` : 'Not shared'}/>
        ) : above == null ? (
          <Fig k="Days with readings" v={`${s.points.length} of ${range === 'week' ? 7 : 30}`}/>
        ) : (
          <Fig k="Days with higher stress" v={`${above} of ${s.points.length}`}/>
        )}
      </dl>
      )}
    </section>
  )
}
