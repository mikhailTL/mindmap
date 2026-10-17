import React from 'react'
import { LampFace } from '../../traffic/Face'
import { Chevron } from '../../ui/marks'
import { Panel, PanelHead, Why } from '../Monitor'
import { cn } from '../../lib/utils'
import { ScrollIn } from '../../ui/motion'
import { PartHead } from './PartHead'
import { SCORE } from '../../lib/terms'
import { LIGHT_WORD, MONTH_LONG, TODAY, addDays, dayName, shortDate, teenSignal } from './demoTeen'
import { SOURCE, Shape } from '../reading/marks'
import { ScoreChart } from './charts'

/* The student's Trends: a month calendar and a date range, over the demo
 * teen's ninety generated days (src/lib/roster.js).
 *
 * The owner, 17 October: "On the demo dashboard, should have calendar and
 * date ranges of mindscores and biometric data including non patch readings."
 *
 *   range      Day, Week, Month, or a custom From and To
 *   calendar   one month, each day's Mind Score coloured by the teen's OWN
 *              usual band (never anyone else's), with that day's Heads Up lamp
 *   chart      the range as columns over the usual band
 *   body       pulse, variability, sweat response, temperature and steps for
 *              the range, each naming where it comes from
 *   readings   every reading by source: patch, camera, check-in questions; the
 *              phone-only ones listed
 *   Heads Up   the range's lights and what was noticed, in the teen's words
 *
 * P2's shared RangeTrend (src/views/family/RangeTrend.jsx) did not exist when
 * this was written, so the range chart here is local. */

/* ── Bands: the teen against their own usual ───────────────────────────── */

const BANDS = {
  calm: { word: 'Calmer than usual', wash: 'bg-beam-wash', bar: 'bg-beam', fill: '#2294e6', ink: 'text-sky-ink' },
  usual: { word: 'About usual', wash: 'bg-accent-wash', bar: 'bg-accent', fill: '#157446', ink: 'text-accent' },
  up: { word: 'More stressed', wash: 'bg-warn-wash', bar: 'bg-warn', fill: '#b5871b', ink: 'text-sun-ink' },
  high: { word: 'Much more stressed', wash: 'bg-coral-wash', bar: 'bg-crit', fill: '#a8321f', ink: 'text-crit' },
}
const BAND_ORDER = ['calm', 'usual', 'up', 'high']
export const bandKey = (v, usual) =>
  v < usual.lo ? 'calm' : v <= usual.hi ? 'usual' : v <= usual.hi + 8 ? 'up' : 'high'
/* The band a demo day sits in, for a chart dot and the words beside it. */
export const demoBand = usual => v => BANDS[bandKey(v, usual)]

/* ── Sources ────────────────────────────────────────────────────────────── */

/* The Mind Score Log's own words (src/views/reading/marks.jsx), so the two
   panels name a source the same way. */
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
/* A drawn mark per source, the same shapes the Mind Score Log draws
   (src/views/reading/marks.jsx), so the source never rests on colour. */
export function SourceMark({ source, className }) {
  return <Shape source={source} fill="#2a5744" size={12} className={cn('shrink-0', className)}/>
}

/* ── The range ──────────────────────────────────────────────────────────── */

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

/* ── The calendar ───────────────────────────────────────────────────────── */

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
            {BANDS[k].word}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── The range chart ────────────────────────────────────────────────────── */

const clockOf = h => (h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`)
const clock12 = t => {
  const [h, m] = t.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

function chartItems(teen, span, byDate) {
  if (span[0] === span[1]) {
    if (span[0] === TODAY) {
      return teen.hours.map(h => ({ key: 'h' + h.hour, label: clockOf(h.hour), v: h.score,
        read: `${h.hour % 12 || 12} ${h.hour < 12 ? 'am' : 'pm'} hour` }))
    }
    const d = byDate.get(span[0])
    if (d && !d.readings.length) {
      return [{ key: d.date, label: d.weekday, v: d.score, read: `${shortDate(d.date)}, day score` }]
    }
    return (d?.readings || []).slice().sort((a, b) => (a.time < b.time ? -1 : 1)).map((r, i) => ({
      key: r.time + i, label: clock12(r.time).replace(':00', '').replace(' ', ''), v: r.score, source: r.source,
      read: `${clock12(r.time)}, ${SOURCES[r.source].word.toLowerCase()}`,
    }))
  }
  return teen.days.filter(d => d.date >= span[0] && d.date <= span[1]).map(d => ({
    key: d.date, label: span[1] > addDays(span[0], 8) ? String(Number(d.date.slice(8))) : d.weekday,
    v: d.score, read: shortDate(d.date),
  }))
}

/* The range as one line over the usual band (src/views/student/charts.jsx):
   evenly spaced, a label under every few points. */
function RangeChart({ items, usual }) {
  const n = items.length
  const every = Math.ceil(n / 8)
  const at = k => (n > 1 ? k / (n - 1) : 0.5)
  const points = items.map((it, k) => ({ key: it.key, x: at(k), v: it.v, read: it.read }))
  const ticks = items.map((it, k) => ({ x: at(k), label: k % every === 0 || k === n - 1 ? it.label : '' }))
  return <ScoreChart points={points} ticks={ticks} usual={usual} band={v => BANDS[bandKey(v, usual)]}
    label={`${SCORE} over the range`}/>
}

/* ── The body, over the range ───────────────────────────────────────────── */

const METRICS = [
  { key: 'pulse', label: 'Pulse', unit: 'bpm', from: 'patch and camera', dp: 0 },
  { key: 'hrv', label: 'Variability', unit: 'ms', from: 'patch and camera', dp: 0 },
  { key: 'eda', label: 'Sweat response', unit: 'µS', from: 'patch', dp: 1 },
  { key: 'temp', label: 'Skin temperature', unit: '°C', from: 'patch', dp: 1 },
  { key: 'steps', label: 'Steps', unit: 'a day', from: 'phone', dp: 0 },
]
const fmt = (v, dp) => (dp ? v.toFixed(dp) : Math.round(v).toLocaleString('en-US'))

function Body({ days, all }) {
  return (
    <dl className="m-0 grid grid-cols-1">
      {METRICS.map(m => {
        const vs = days.map(d => d[m.key]).filter(v => typeof v === 'number')
        if (!vs.length) return null
        const mean = vs.reduce((a, b) => a + b, 0) / vs.length
        const usual = all.reduce((a, d) => a + d[m.key], 0) / all.length
        const min = Math.min(...vs), max = Math.max(...vs)
        return (
          <div key={m.key} className="flex items-baseline justify-between gap-3 border-b border-rule py-2">
            <dt className="min-w-0">
              <span className="block font-display text-ui font-medium text-ink">{m.label}</span>
              <span className="block text-fine text-ink-3">From the {m.from}</span>
            </dt>
            <dd className="m-0 shrink-0 text-right">
              <span className="font-display text-row font-medium tabular-nums leading-none text-ink">
                {fmt(mean, m.dp)}</span>
              <span className="ml-1 text-fine text-ink-3">{m.unit}</span>
              <span className="block text-fine tabular-nums text-ink-2">
                {vs.length > 1 ? `${fmt(min, m.dp)} to ${fmt(max, m.dp)}, ` : ''}usual {fmt(usual, m.dp)}</span>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

/* ── Readings by source ─────────────────────────────────────────────────── */

function Readings({ days, single }) {
  const all = days.flatMap(d => d.readings.map(r => ({ ...r, date: d.date })))
  const count = s => all.filter(r => r.source === s).length
  const phone = all.filter(r => r.source !== 'patch').reverse()
  const shown = single ? all.slice().sort((a, b) => (a.time < b.time ? -1 : 1)) : phone.slice(0, 6)
  return (
    <div>
      <ul className="m-0 grid list-none grid-cols-4 gap-x-3 gap-y-2 p-0 lg:grid-cols-2">
        {Object.keys(SOURCES).map(s => (
          <li key={s} className="min-w-0">
            <p className="tick flex items-center gap-1.5"><SourceMark source={s}/>{SOURCES[s].word}</p>
            <p className="mt-0.5 font-display text-row font-medium tabular-nums leading-none text-ink">
              {count(s)}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-fine text-ink-2">
        {single ? (shown.length ? 'Every reading that day.' : 'No readings logged that day.') : phone.length
          ? 'Latest readings taken on the phone, without the patch.'
          : 'No phone-only readings in this range.'}</p>
      {shown.length > 0 && (
        <ul className="m-0 mt-1 list-none p-0">
          {shown.map((r, i) => (
            <li key={r.date + r.time + i} className="flex items-center gap-3 border-b border-rule py-1.5
              last:border-b-0">
              <SourceMark source={r.source}/>
              <span className="min-w-0 flex-1 text-fine text-ink">
                {single ? '' : `${shortDate(r.date)}, `}{clock12(r.time)}
                <span className="text-ink-3"> · {SOURCES[r.source].word}</span></span>
              <span className="shrink-0 font-display text-ui font-medium tabular-nums text-ink">{r.score}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── Heads Up over the range ────────────────────────────────────────────── */

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

/* ── The section ────────────────────────────────────────────────────────── */

const RANGE_WORD = { day: 'Day', week: 'Last 7 days', month: 'Last 30 days', custom: 'Custom range' }

/* `log`: the Mind Score Log's entries. When given, every per-reading figure
   here (the source counts, the readings listed, a single day's line) comes
   from the log, so this section and the log under it count the same
   readings. `onSpan` hears the range in use, so the log can show the same
   days. */
export function Trends({ teen, className, bare = false, log, onSpan }) {
  const first = teen.days[0].date
  const [state, set] = React.useState({ kind: 'week', anchor: TODAY, from: addDays(TODAY, -13), to: TODAY })
  const [month, setMonth] = React.useState(ym(TODAY))
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
  const counts = BAND_ORDER.map(k => [k, days.filter(d => bandKey(d.score, teen.usual) === k).length])
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
    /* Its own tinted band with a part heading, rising in as it arrives, so
       the move from today's readings to the trends is plain. */
    <ScrollIn className={className}>
    <section aria-labelledby={bare ? undefined : 'trends-h'} aria-label={bare ? 'Your days' : undefined}
      className={bare ? 'flex flex-col gap-3 lg:gap-4'
        : 'flex flex-col gap-3 rounded-[24px] border border-beam/25 bg-beam-wash p-3 sm:p-4 lg:gap-4 lg:p-5'}>
      {!bare && <PartHead id="trends-h" kind="trends" title="Trends"
        line="Days, weeks and months, compared only with your own usual. Demo days."/>}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-4">
        <Panel className="flex flex-col gap-4">
          <RangePicker state={state} set={set} first={first}/>
          <MonthCalendar teen={teen} byDate={byDate} span={clampSpan} month={month} setMonth={setMonth}
            onPick={pick}/>
        </Panel>
        <div className="flex min-w-0 flex-col gap-3 lg:gap-4">
          <Panel tone="aqua">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <PanelHead title={`${SCORE}, ${RANGE_WORD[state.kind]}`} meta={label} className="min-w-0 flex-1"/>
              <Why label="How the colours work" className="pt-1">
                Each day is coloured against your own usual range, {teen.usual.lo} to {teen.usual.hi}.
                Higher means more stress. Nobody else is in the comparison.
              </Why>
            </div>
            <div className="mt-3"><RangeChart items={items} usual={teen.usual}/></div>
            {!single && (
              <dl className="m-0 mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-rule pt-2.5 sm:grid-cols-4">
                {counts.map(([k, n]) => (
                  <div key={k} className="min-w-0">
                    <dt className="tick flex items-center gap-1.5">
                      <span aria-hidden className={cn('h-3.5 w-[3px] rounded-bar', BANDS[k].bar)}/>
                      {BANDS[k].word}</dt>
                    <dd className="m-0 mt-0.5 font-display text-row font-medium tabular-nums leading-none text-ink">
                      {n}<span className="ml-1 font-body text-fine font-normal text-ink-3">
                        {n === 1 ? 'day' : 'days'}</span></dd>
                  </div>
                ))}
              </dl>
            )}
          </Panel>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
            <Panel>
              <PanelHead title="Your Body" meta={single ? 'that day' : 'average'}/>
              <div className="mt-1"><Body days={days} all={teen.days}/></div>
            </Panel>
            <div className="flex flex-col gap-3 lg:gap-4">
              <Panel variant="outline">
                <PanelHead title="Readings by Source" meta={`${days.reduce((a, d) => a + d.readings.length, 0)} in all`}/>
                <div className="mt-3"><Readings days={days} single={single}/></div>
              </Panel>
              <Panel variant="tint" hue="sun">
                <PanelHead title="Heads Up" meta={RANGE_WORD[state.kind].toLowerCase()}/>
                <div className="mt-3"><RangeHeadsUp days={days}/></div>
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </section>
    </ScrollIn>
  )
}
