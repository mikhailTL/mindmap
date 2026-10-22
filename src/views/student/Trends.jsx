import React from 'react'
import { LampFace } from '../../traffic/Face'
import { Chevron } from '../../ui/marks'
import { Panel, PanelHead } from '../Monitor'
import { cn } from '../../lib/utils'
import { ScrollIn } from '../../ui/motion'
import { PartHead } from './PartHead'
import { SCORE } from '../../lib/terms'
import { LIGHT_WORD, MONTH_LONG, TODAY, addDays, dayName, shortDate, teenSignal } from './demoTeen'
import { SOURCE, Shape } from '../reading/marks'
import { ScoreChart } from './charts'

// The demo student's Trends: a range picker, a month calendar, the range chart and Heads Up,
// over the demo teen's generated days.
const BANDS = {
  calm: { word: 'Stress is lower than usual', short: 'Lower stress', wash: 'bg-beam-wash', bar: 'bg-beam', fill: '#2294e6', ink: 'text-sky-ink' },
  usual: { word: 'Stress is in your usual range', short: 'Usual stress', wash: 'bg-accent-wash', bar: 'bg-accent', fill: '#157446', ink: 'text-accent' },
  up: { word: 'Stress is slightly higher than usual', short: 'Higher stress', wash: 'bg-warn-wash', bar: 'bg-warn', fill: '#b5871b', ink: 'text-sun-ink' },
  high: { word: 'Stress is much higher than usual', short: 'Much higher stress', wash: 'bg-coral-wash', bar: 'bg-crit', fill: '#a8321f', ink: 'text-crit' },
}
const BAND_ORDER = ['calm', 'usual', 'up', 'high']
// Against the teen's own band: below is calm, up to 8 above the top is 'up', beyond that 'high'.
export const bandKey = (v, usual) =>
  v < usual.lo ? 'calm' : v <= usual.hi ? 'usual' : v <= usual.hi + 8 ? 'up' : 'high'
export const demoBand = usual => v => BANDS[bandKey(v, usual)]

const SOURCES = SOURCE

/* A logged entry as a day reading: local date, 24-hour clock. */
const pad = n => String(n).padStart(2, '0')
const isoOf = at => { const d = new Date(at); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const hhmm = at => { const d = new Date(at); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
function logByDate(log) {
  const out = new Map()
  for (const r of log) {
    const k = isoOf(r.at)
    if (!out.has(k)) out.set(k, [])
    out.get(k).push({ time: hhmm(r.at), score: r.score, source: r.source })
  }
  return out
}
export function SourceMark({ source, className }) {
  return <Shape source={source} fill="#2a5744" size={12} className={cn('shrink-0', className)}/>
}

const KINDS = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['custom', 'Custom']]

function spanOf({ kind, anchor, from, to }) {
  if (kind === 'day') return [anchor, anchor]
  if (kind === 'week') return [addDays(anchor, -6), anchor]
  if (kind === 'month') return [addDays(anchor, -29), anchor]
  return from <= to ? [from, to] : [to, from]
}

function RangePicker({ state, set, first }) {
  const id = React.useId()
  return (
    <div>
      <div role="tablist" aria-label="Date range" className="flex border-b border-rule">
        {KINDS.map(([k, label]) => {
          const on = state.kind === k
          return (
            <button key={k} type="button" role="tab" aria-selected={on}
              onClick={() => set(s => ({ ...s, kind: k }))}
              className={cn('relative min-h-[44px] flex-1 px-2 font-display text-ui font-medium',
                'transition-colors duration-150',
                on ? 'text-ink' : 'text-ink-3 hoverOnly:text-ink')}>
              {label}
              <span aria-hidden className={cn('absolute inset-x-2 -bottom-px h-[3px] rounded-bar',
                on ? 'bg-accent' : 'bg-transparent')}/>
            </button>
          )
        })}
      </div>
      {state.kind === 'custom' && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[['from', 'From'], ['to', 'To']].map(([k, label]) => (
            <label key={k} htmlFor={id + k} className="min-w-0">
              <span className="tick block">{label}</span>
              <input id={id + k} type="date" min={first} max={TODAY} value={state[k]}
                onChange={e => {
                  const v = e.target.value
                  if (v && v >= first && v <= TODAY) set(s => ({ ...s, [k]: v }))
                }}
                className="mt-1 block min-h-[44px] w-full min-w-0 rounded-panel border border-rule
                  bg-card px-2.5 font-body text-ui text-ink"/>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

const ym = iso => iso.slice(0, 7)
function monthDays(key) {
  const [y, m] = key.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1, 12))
  const n = new Date(Date.UTC(y, m, 0, 12)).getUTCDate()
  const lead = start.getUTCDay()
  const cells = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= n; d++) cells.push(`${key}-${String(d).padStart(2, '0')}`)
  while (cells.length % 7) cells.push(null)
  return cells
}
const shiftMonth = (key, n) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}

function MonthCalendar({ teen, byDate, span, month, setMonth, onPick }) {
  const first = teen.days[0].date
  const cells = monthDays(month)
  const [y, m] = month.split('-').map(Number)
  const canBack = month > ym(first)
  const canNext = month < ym(TODAY)
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" disabled={!canBack} onClick={() => setMonth(shiftMonth(month, -1))}
          aria-label="Previous month"
          className="inline-flex size-11 items-center justify-center rounded-panel border border-rule
            bg-card text-ink disabled:opacity-35">
          <Chevron aria-hidden className="size-4 rotate-180"/>
        </button>
        <p className="font-display text-ui font-bold text-ink" aria-live="polite">
          {MONTH_LONG[m - 1]} {y}</p>
        <button type="button" disabled={!canNext} onClick={() => setMonth(shiftMonth(month, 1))}
          aria-label="Next month"
          className="inline-flex size-11 items-center justify-center rounded-panel border border-rule
            bg-card text-ink disabled:opacity-35">
          <Chevron aria-hidden className="size-4"/>
        </button>
      </div>
      <div aria-hidden className="mt-2 grid grid-cols-7 gap-1 text-center text-fine text-ink-3">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          const d = iso && byDate.get(iso)
          if (!d) {
            return (
              <span key={iso || 'x' + i} aria-hidden
                className={cn('flex h-14 flex-col rounded-xs p-1 text-fine text-ink-3/60',
                  iso && 'border border-dashed border-rule')}>
                {iso ? Number(iso.slice(8)) : ''}
              </span>
            )
          }
          const b = BANDS[bandKey(d.score, teen.usual)]
          const inSpan = iso >= span[0] && iso <= span[1]
          const today = iso === TODAY
          return (
            <button key={iso} type="button" onClick={() => onPick(iso)} aria-pressed={inSpan}
              aria-label={`${shortDate(iso)}. ${SCORE} ${d.score}, ${b.word.toLowerCase()}.
                Heads Up ${d.light}.`}
              className={cn('relative flex h-14 min-w-0 flex-col justify-between overflow-hidden rounded-xs',
                'p-1 text-left transition-shadow duration-150', b.wash,
                inSpan ? 'ring-2 ring-ink ring-offset-1 ring-offset-card' : 'hoverOnly:ring-1 hoverOnly:ring-ink-3')}>
              <span aria-hidden className={cn('absolute inset-x-0 top-0 h-[3px]', b.bar)}/>
              <span className="flex items-start justify-between gap-0.5">
                <span className={cn('text-fine leading-none', today ? 'font-bold text-ink' : 'text-ink-2')}>
                  {Number(iso.slice(8))}</span>
                <LampFace light={d.light} size={11}/>
              </span>
              <span className="font-display text-ui font-bold leading-none tabular-nums text-ink">
                {d.score}</span>
            </button>
          )
        })}
      </div>
      <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
        {BAND_ORDER.map(k => (
          <li key={k} className="flex items-center gap-1.5 text-fine text-ink-2">
            <span aria-hidden className={cn('relative size-3.5 overflow-hidden rounded-xs', BANDS[k].wash)}>
              <span className={cn('absolute inset-x-0 top-0 h-[3px]', BANDS[k].bar)}/>
            </span>
            {BANDS[k].short}
          </li>
        ))}
      </ul>
    </div>
  )
}

const clockOf = h => (h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`)
const clock12 = t => {
  const [h, m] = t.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

// Today plots hourly averages, another single day its logged readings, a longer span one point per day.
function chartItems(teen, span, byDate) {
  if (span[0] === span[1]) {
    if (span[0] === TODAY) {
      return teen.hours.map(h => ({ key: 'h' + h.hour, hour: h.hour, label: clockOf(h.hour), v: h.score,
        read: `${h.hour % 12 || 12} ${h.hour < 12 ? 'am' : 'pm'} hour` }))
    }
    const d = byDate.get(span[0])
    if (d && !d.readings.length) {
      return [{ key: d.date, label: d.weekday, v: d.score, read: `${shortDate(d.date)}, day score` }]
    }
    return (d?.readings || []).slice().sort((a, b) => (a.time < b.time ? -1 : 1)).map((r, i) => ({
      key: r.time + i, time: r.time, label: clock12(r.time).replace(':00', '').replace(' ', ''), v: r.score,
      source: r.source,
      read: `${clock12(r.time)}, ${SOURCES[r.source].word.toLowerCase()}`,
    }))
  }
  return teen.days.filter(d => d.date >= span[0] && d.date <= span[1]).map(d => ({
    key: d.date, label: span[1] > addDays(span[0], 8) ? String(Number(d.date.slice(8))) : d.weekday,
    v: d.score, read: shortDate(d.date),
  }))
}

function RangeChart({ items, usual, detail }) {
  const n = items.length
  // About eight labels at most. The last point is labelled, so a regular label too close
  // to it is dropped.
  const every = Math.ceil(n / 8)
  const at = k => (n > 1 ? k / (n - 1) : 0.5)
  const points = items.map((it, k) => ({ key: it.key, x: at(k), v: it.v, read: it.read, item: it }))
  const ticks = items.map((it, k) => ({ x: at(k),
    label: k === n - 1 || (k % every === 0 && n - 1 - k >= every) ? it.label : '' }))
  return <ScoreChart points={points} ticks={ticks} usual={usual} band={v => BANDS[bandKey(v, usual)]}
    label={`${SCORE} over the range`} detail={detail}/>
}

function Taken({ item, byDate }) {
  const rs = item.source ? [{ time: item.time, source: item.source, score: item.v }]
    : item.hour != null ? (byDate.get(TODAY)?.readings || []).filter(r => Number(r.time.slice(0, 2)) === item.hour)
      : byDate.get(item.key)?.readings || []
  const sorted = rs.slice().sort((x, y) => (x.time < y.time ? -1 : 1))
  const title = item.source ? `Reading at ${clock12(item.time)}`
    : `Readings for ${item.hour != null ? `the ${item.read}` : shortDate(item.key)}`
  return (
    <div>
      <p className="m-0 font-display text-ui font-bold text-ink">{title}</p>
      {sorted.length ? (
        <ul className="m-0 mt-1 list-none p-0">
          {sorted.map((r, i) => (
            <li key={r.time + i} className="flex items-center gap-3 border-b border-rule py-1.5 last:border-b-0">
              <SourceMark source={r.source}/>
              <span className="min-w-0 flex-1 text-fine text-ink">{clock12(r.time)}
                <span className="text-ink-3"> · {SOURCES[r.source].word}</span></span>
              <span className="shrink-0 font-display text-ui font-medium tabular-nums text-ink">{r.score}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 mt-1 text-fine text-ink-2">From the patch.</p>
      )}
    </div>
  )
}

function RangeHeadsUp({ days }) {
  const n = l => days.filter(d => d.light === l).length
  const freq = new Map()
  days.forEach(d => d.signals.forEach(s => freq.set(s, (freq.get(s) || 0) + 1)))
  const top = [...freq].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => teenSignal(s))
  return (
    <div>
      <ul className="m-0 grid list-none grid-cols-3 gap-x-3 p-0">
        {['green', 'yellow', 'red'].map(l => (
          <li key={l} className="flex items-center gap-2">
            <LampFace light={l} size={22}/>
            <span className="min-w-0">
              <span className="block font-display text-row font-medium tabular-nums leading-none text-ink">
                {n(l)}</span>
              <span className="block text-fine text-ink-2">{LIGHT_WORD[l]} {n(l) === 1 ? 'day' : 'days'}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-fine text-ink">
        {top.length ? `Noticed most: ${top.join(', ')}.` : 'Nothing stood out in how you used your phone.'}</p>
    </div>
  )
}

const RANGE_WORD = { day: 'Day', week: 'Last 7 days', month: 'Last 30 days', custom: 'Custom range' }

export function Trends({ teen, className, bare = false, log, onSpan }) {
  const first = teen.days[0].date
  const [state, set] = React.useState({ kind: 'week', anchor: TODAY, from: addDays(TODAY, -13), to: TODAY })
  const [month, setMonth] = React.useState(ym(TODAY))
  // With `log`, per-reading figures come from the log, so this section and the log count the same readings.
  const byDate = React.useMemo(() => {
    const logged = log && logByDate(log)
    return new Map(teen.days.map(d => [d.date, logged ? { ...d, readings: logged.get(d.date) || [] } : d]))
  }, [teen, log])
  const span = spanOf(state)
  const clampSpan = [span[0] < first ? first : span[0], span[1]]
  const days = teen.days.filter(d => d.date >= clampSpan[0] && d.date <= clampSpan[1])
    .map(d => byDate.get(d.date))
  const items = chartItems(teen, clampSpan, byDate)
  const single = clampSpan[0] === clampSpan[1]
  const label = single ? `${dayName(clampSpan[0])}, ${shortDate(clampSpan[0]).slice(4)}`
    : `${shortDate(clampSpan[0])} to ${shortDate(clampSpan[1])}`

  React.useEffect(() => {
    onSpan?.({ from: clampSpan[0], to: clampSpan[1],
      label: single ? (clampSpan[0] === TODAY ? 'today' : shortDate(clampSpan[0]))
        : state.kind === 'custom' ? `${shortDate(clampSpan[0])} to ${shortDate(clampSpan[1])}`
          : RANGE_WORD[state.kind].toLowerCase() })
  }, [clampSpan[0], clampSpan[1], state.kind])

  const pick = iso => {
    set(s => (s.kind === 'custom' ? { ...s, kind: 'day', anchor: iso } : { ...s, anchor: iso }))
  }

  return (
    <ScrollIn className={className}>
    <section aria-labelledby={bare ? undefined : 'trends-h'} aria-label={bare ? 'Your days' : undefined}
      className={bare ? 'flex flex-col gap-3 lg:gap-4'
        : 'flex flex-col gap-3 rounded-[24px] border border-beam/25 bg-beam-wash p-3 sm:p-4 lg:gap-4 lg:p-5'}>
      {!bare && <PartHead id="trends-h" kind="trends" title="Trends"
        line="Compared only with your own usual."/>}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-4">
        <Panel className="flex flex-col gap-4">
          <RangePicker state={state} set={set} first={first}/>
          <MonthCalendar teen={teen} byDate={byDate} span={clampSpan} month={month} setMonth={setMonth}
            onPick={pick}/>
        </Panel>
        <div className="flex min-w-0 flex-col gap-3 lg:gap-4">
          <Panel tone="aqua">
            <PanelHead as="h3" title={SCORE} meta={label}/>
            <div className="mt-3"><RangeChart items={items} usual={teen.usual}
              detail={pt => <Taken item={pt.item} byDate={byDate}/>}/></div>
          </Panel>
          <Panel variant="tint" hue="sun">
            <PanelHead as="h3" title="Heads Up" meta={single ? 'that day' : RANGE_WORD[state.kind].toLowerCase()}/>
            <div className="mt-3"><RangeHeadsUp days={days}/></div>
          </Panel>
        </div>
      </div>
    </section>
    </ScrollIn>
  )
}
