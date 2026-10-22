import React from 'react'
import { SectionShell } from '../shell'
import { Panel, PanelHead } from '../Monitor'
import { LampFace } from '../../traffic/Face'
import { Chevron } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { SCORE } from '../../lib/terms'
import { bandOf } from '../../lib/readingLog'
import { useReadingLog } from '../reading/useReadingLog'
import { BAND, SOURCE, Shape } from '../reading/marks'
import { Latest, MindScoreLog } from '../reading/Log'
import { Trends } from './Trends'
import { TEEN } from './demoTeen'
import { PartHead, TODAY_LONG, longDate } from './PartHead'
import { DemoTodayDetail } from './TodayDetail'
import { ScoreChart, TakeReading } from './charts'
import { RANGE_LABEL, byDay, clockOf, dayKey, longDay, midnight, rangeView }
  from './liveSeries'

// The student's Trends tab (route `student-trends`): Today, Trends and the Mind Score Log.
// Demo draws the demo teen's days; Live uses only the student's own logged readings.
function TodayPart({ entries, now, go }) {
  const today = dayKey(now)
  const todays = entries.filter(r => dayKey(r.at) === today)
  const last = entries[entries.length - 1]
  if (!todays.length) {
    return (
      <Panel variant="tint" hue="accent" className="flex flex-col items-start gap-1">
        <p className="m-0 font-display text-row font-bold text-ink">No reading yet today.</p>
        <p className="m-0 text-meta text-ink-2">
          {last ? `Your last one was ${last.score}, at ${clockOf(last.at)} on ${longDay(last.at)}.`
            : 'Your Mind Score shows here once you take one.'}</p>
        <TakeReading go={go}/>
      </Panel>
    )
  }
  return <Latest entries={todays} now={now}/>
}

const RANGES = [['day', 'Day'], ['week', 'Week'], ['month', 'Month']]

function RangeTabs({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Range" className="flex border-b border-rule">
      {RANGES.map(([k, label]) => {
        const on = value === k
        return (
          <button key={k} type="button" role="radio" aria-checked={on} onClick={() => onChange(k)}
            className={cn('relative min-h-[44px] flex-1 px-3 font-display text-ui transition-colors duration-150',
              'sm:flex-none sm:px-5', on ? 'font-bold text-ink' : 'font-medium text-ink-2 hoverOnly:text-ink')}>
            {label}
            <span aria-hidden className={cn('absolute inset-x-2 -bottom-px h-[3px] rounded-bar',
              on ? 'bg-accent' : 'bg-transparent')}/>
          </button>
        )
      })}
    </div>
  )
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December']

function LiveCalendar({ days, now, picked, onPick }) {
  const [month, setMonth] = React.useState(() => { const d = new Date(now); return [d.getFullYear(), d.getMonth()] })
  const [y, m] = month
  const first = new Date(y, m, 1)
  const n = new Date(y, m + 1, 0).getDate()
  // Leading nulls pad the first week to its weekday; trailing nulls fill the last row.
  const cells = Array.from({ length: first.getDay() }, () => null)
  for (let d = 1; d <= n; d++) cells.push(new Date(y, m, d).getTime())
  while (cells.length % 7) cells.push(null)
  const nowM = new Date(now)
  const canNext = y < nowM.getFullYear() || (y === nowM.getFullYear() && m < nowM.getMonth())
  const earliest = [...days.values()].reduce((a, d) => Math.min(a, d.at), midnight(now))
  const e = new Date(earliest)
  const canBack = y > e.getFullYear() || (y === e.getFullYear() && m > e.getMonth())
  const shift = k => setMonth(([yy, mm]) => { const d = new Date(yy, mm + k, 1); return [d.getFullYear(), d.getMonth()] })
  const today = dayKey(now)
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" disabled={!canBack} onClick={() => shift(-1)} aria-label="Previous month"
          className="inline-flex size-11 items-center justify-center rounded-panel border border-rule bg-card
            text-ink disabled:opacity-35">
          <Chevron aria-hidden className="size-4 rotate-180"/>
        </button>
        <p className="font-display text-ui font-bold text-ink" aria-live="polite">{MONTHS[m]} {y}</p>
        <button type="button" disabled={!canNext} onClick={() => shift(1)} aria-label="Next month"
          className="inline-flex size-11 items-center justify-center rounded-panel border border-rule bg-card
            text-ink disabled:opacity-35">
          <Chevron aria-hidden className="size-4"/>
        </button>
      </div>
      <div aria-hidden className="mt-2 grid grid-cols-7 gap-1 text-center text-fine text-ink-3">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((at, i) => {
          const k = at && dayKey(at)
          const d = k && days.get(k)
          const isToday = k === today
          if (!d) {
            return (
              <span key={k || 'x' + i} aria-hidden={!at}
                className={cn('flex h-14 flex-col rounded-xs p-1 text-fine',
                  at && 'border border-dashed border-rule', isToday ? 'font-bold text-ink' : 'text-ink-3')}>
                {at ? new Date(at).getDate() : ''}
              </span>
            )
          }
          const b = BAND[bandOf(d.mean)]
          const on = picked === k
          return (
            <button key={k} type="button" onClick={() => onPick(at)} aria-pressed={on}
              aria-label={`${longDay(at)}. Average ${SCORE} ${d.mean}, ${b.word.toLowerCase()}. Heads Up ${d.light}.`}
              className={cn('relative flex h-14 min-w-0 flex-col justify-between overflow-hidden rounded-xs p-1',
                'border border-rule bg-card text-left transition-shadow duration-150',
                on ? 'ring-2 ring-ink ring-offset-1 ring-offset-card' : 'hoverOnly:ring-1 hoverOnly:ring-ink-3')}>
              <span aria-hidden className="absolute inset-x-0 top-0 h-[4px]" style={{ background: b.fill }}/>
              <span className="flex items-start justify-between gap-0.5">
                <span className={cn('text-fine leading-none', isToday ? 'font-bold text-ink' : 'text-ink-2')}>
                  {new Date(at).getDate()}</span>
                <LampFace light={d.light} size={11}/>
              </span>
              <span className="font-display text-ui font-bold leading-none tabular-nums text-ink">{d.mean}</span>
            </button>
          )
        })}
      </div>
      <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
        {['low', 'usual', 'up', 'high'].map(k => (
          <li key={k} className="flex items-center gap-1.5 text-fine text-ink-2">
            <span aria-hidden className="h-[4px] w-3.5 rounded-bar" style={{ background: BAND[k].fill }}/>
            {BAND[k].short}
          </li>
        ))}
      </ul>
      <p className="mt-2 flex items-center gap-1.5 text-fine text-ink-3">
        <LampFace light="green" size={12}/> Each face is that day's Heads Up.
      </p>
    </div>
  )
}

function Taken({ list, title }) {
  return (
    <div>
      <p className="m-0 font-display text-ui font-bold text-ink">{title}</p>
      <ul className="m-0 mt-1 list-none p-0">
        {list.map(r => (
          <li key={r.id} className="flex items-center gap-3 border-b border-rule py-1.5 last:border-b-0">
            <Shape source={r.source} fill={BAND[bandOf(r.score)].fill} size={12}/>
            <span className="min-w-0 flex-1 text-fine text-ink">{clockOf(r.at)}
              <span className="text-ink-3"> · {SOURCE[r.source].word}</span></span>
            <span className="shrink-0 font-display text-ui font-bold tabular-nums text-ink">{r.score}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LiveTrendsPart({ entries, now, go, range, setRange, anchor, setAnchor }) {
  const days = React.useMemo(() => byDay(entries), [entries])
  const view = rangeView(entries, days, now, range, anchor)
  const pick = at => { setAnchor(at); setRange('day') }
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-4">
      <div className="flex min-w-0 flex-col gap-3 lg:gap-4">
      <Panel tone="aqua">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PanelHead as="h3" title={SCORE} meta={view.label} className="min-w-0 flex-1"/>
        </div>
        <div className="mt-2"><RangeTabs value={range} onChange={k => { setRange(k); if (k !== 'day') setAnchor(null) }}/></div>
        <ScoreChart className="mt-3" points={view.points} ticks={view.ticks} go={go} tall
          label={`${SCORE}, ${RANGE_LABEL[range]}`}
          detail={pt => <Taken list={range === 'day' ? view.list.filter(r => r.id === pt.key)
            : view.list.filter(r => dayKey(r.at) === pt.key)} title={pt.read}/>}/>
      </Panel>
      </div>
      <Panel>
        <PanelHead as="h3" title="Your Days" meta="tap a day"/>
        <div className="mt-3">
          <LiveCalendar days={days} now={now} picked={range === 'day' ? dayKey(view.from) : null} onPick={pick}/>
        </div>
      </Panel>
    </div>
  )
}

export function StudentTrendsBody({ go }) {
  const { entries, now, demo, setNote } = useReadingLog()
  const [range, setRange] = React.useState('week')
  const [anchor, setAnchor] = React.useState(null)
  /* The demo range, as the demo Trends above the log reports it. */
  const [demoSpan, setDemoSpan] = React.useState(null)

  // The log covers the same days as the trend above it, so both count the same readings.
  let list = entries, rangeLabel = 'last 14 days'
  if (demo && demoSpan) {
    list = entries.filter(r => { const k = dayKey(r.at); return k >= demoSpan.from && k <= demoSpan.to })
    rangeLabel = demoSpan.label
  } else if (!demo) {
    const v = rangeView(entries, byDay(entries), now, range, anchor)
    list = v.list
    rangeLabel = range === 'day' ? (dayKey(v.from) === dayKey(now) ? 'today' : longDay(v.from)) : RANGE_LABEL[range]
  }

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      <PartHead id="st-today-h" kind="today" title="Today" line={demo ? TODAY_LONG : longDate()}
        action={<TakeReading go={go}/>}/>
      {demo ? <DemoTodayDetail go={go}/> : <TodayPart entries={entries} now={now} go={go}/>}

      <section aria-labelledby="st-trends-h"
        className="mt-4 flex flex-col gap-3 rounded-[24px] border border-beam/25 bg-beam-wash p-3 sm:p-4
          lg:mt-6 lg:gap-4 lg:p-5">
        <PartHead id="st-trends-h" kind="trends" title="Trends" line="Compared only with your own usual."/>
        {demo
          ? <Trends teen={TEEN} bare log={entries} onSpan={setDemoSpan}/>
          : <LiveTrendsPart entries={entries} now={now} go={go} range={range} setRange={setRange}
              anchor={anchor} setAnchor={setAnchor}/>}
      </section>

      <section aria-labelledby="reading-log-h"
        className="mt-4 flex flex-col gap-3 rounded-[24px] border border-lilac/20 bg-lilac-wash/60 p-3 sm:p-4
          lg:mt-6 lg:gap-4 lg:p-5">
        <PartHead id="reading-log-h" kind="log" title={`${SCORE} Log`}
          line={`Every reading, ${rangeLabel}.`}/>
        <MindScoreLog entries={entries} list={list} now={now} demo={demo} setNote={setNote}
          rangeLabel={rangeLabel} head={false} go={go}/>
      </section>
    </div>
  )
}

export function StudentTrends({ go }) {
  return (
    <SectionShell go={go}>
      <StudentTrendsBody go={go}/>
    </SectionShell>
  )
}

export default StudentTrends
