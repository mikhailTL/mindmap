import React from 'react'
import { SectionShell } from '../shell'
import { Panel, PanelHead, Why } from '../Monitor'
import { LampFace } from '../../traffic/Face'
import { Chevron } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { SCORE } from '../../lib/terms'
import { bandOf } from '../../lib/readingLog'
import { useMode } from '../../lib/mode'
import { useReadingLog } from '../reading/useReadingLog'
import { BAND, SOURCE, Shape, clock } from '../reading/marks'
import { Latest, MindScoreLog } from '../reading/Log'
import { Trends } from './Trends'
import { TEEN } from './demoTeen'
import { PartHead, TODAY_LONG, longDate } from './PartHead'
import { DemoTodayDetail } from './TodayDetail'
import { NoData, ScoreChart, TakeReading } from './charts'
import { RANGE_LABEL, SOURCE_WORD, byDay, clockOf, dayKey, longDay, midnight, rangeView }
  from './liveSeries'

/* The student's Trends tab: the app tab "Trends", route `student-trends`.
 *
 * The owner, 17 October: "The log, trends, and mindscore data on the live app
 * for student data should be under a separate new tab on app taskbar called
 * trends ... in the Trends tab, there should be option to 'Take a Reading'
 * underlined link especially when theres no data yet, that link should be
 * shown on the trend graphs." And: "Make sure theres difference between Today
 * and Trends sections."
 *
 * So the tab opens with a "Take a reading" link, then two parts with their
 * own heads: Today (the latest reading on the rainbow and today's readings)
 * and Trends (the Day / Week / Month line, the calendar with each day's
 * Heads Up face, readings by source, then the Mind Score Log).
 *
 *   Demo  the demo teen's ninety days (src/views/student/Trends.jsx) and the
 *         generated fortnight of logged readings
 *   Live  the student's own readings (src/lib/readingLog.js, synced to their
 *         account). Nothing is generated: an empty range says "No data yet". */

/* ── Today ─────────────────────────────────────────────────────────────── */

function TodayList({ items, now }) {
  return (
    <ul className="m-0 list-none p-0">
      {[...items].reverse().map(r => {
        const b = BAND[bandOf(r.score)]
        const S = SOURCE[r.source]
        return (
          <li key={r.id} className="grid grid-cols-[4.6rem_auto_minmax(0,1fr)] items-center gap-x-2.5
            border-t border-rule py-2 first:border-t-0">
            <span className="font-mono text-meta tabular-nums text-ink-2">{clock(r.at)}</span>
            <span className="inline-flex items-center gap-1.5">
              <Shape source={r.source} fill={b.fill}/>
              <span className="font-display text-row font-bold tabular-nums text-ink">{r.score}</span>
            </span>
            <span className="min-w-0 text-fine text-ink-2">
              <span className="flex items-center gap-1.5"><S.Icon aria-hidden className="size-4 shrink-0 text-ink-3"/>
                {S.word}{r.pulse != null && <span className="tabular-nums text-ink-3"> · {r.pulse} bpm</span>}</span>
              <span className={cn('block', b.ink)}>{b.short}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function TodayPart({ entries, now, go, listOnly = false }) {
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
  const mean = Math.round(todays.reduce((a, r) => a + r.score, 0) / todays.length)
  return (
    <div className={cn('grid grid-cols-1 gap-3 lg:items-start lg:gap-4',
      !listOnly && 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]')}>
      {!listOnly && <Latest entries={todays} now={now}/>}
      <Panel variant="tint" hue="accent">
        <PanelHead title="Today's Readings" meta={`${todays.length} so far`}/>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-gap font-bold tabular-nums text-ink">{mean}</span>
          <span className="text-fine text-ink-2">average today, {BAND[bandOf(mean)].word.toLowerCase()}</span>
        </p>
        <div className="mt-2"><TodayList items={todays} now={now}/></div>
        <TakeReading go={go} className="mt-1">Take another reading</TakeReading>
      </Panel>
    </div>
  )
}

/* ── Live trends ───────────────────────────────────────────────────────── */

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

/* One month, each day's average Mind Score coloured against the usual range,
   with that day's Heads Up face. A day with no reading is a dashed box. */
function LiveCalendar({ days, now, picked, onPick }) {
  const [month, setMonth] = React.useState(() => { const d = new Date(now); return [d.getFullYear(), d.getMonth()] })
  const [y, m] = month
  const first = new Date(y, m, 1)
  const n = new Date(y, m + 1, 0).getDate()
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

function BySource({ list, go }) {
  const keys = ['camera', 'survey', 'patch', 'mirror']
  const count = k => list.filter(r => r.source === k).length
  const latestOf = k => [...list].reverse().find(r => r.source === k)
  return (
    <div>
      <ul className="m-0 grid list-none grid-cols-4 gap-x-3 p-0">
        {keys.map(k => (
          <li key={k} className="min-w-0">
            <p className="tick flex items-center gap-1.5"><Shape source={k} fill="#2a5744" size={12}/>{SOURCE[k].word}</p>
            <p className="mt-0.5 font-display text-row font-medium tabular-nums leading-none text-ink">{count(k)}</p>
          </li>
        ))}
      </ul>
      {list.length ? (
        <ul className="m-0 mt-3 list-none p-0">
          {keys.map(k => {
            const r = latestOf(k)
            return r ? (
              <li key={k} className="flex items-center gap-3 border-t border-rule py-1.5">
                <Shape source={k} fill={BAND[bandOf(r.score)].fill} size={12}/>
                <span className="min-w-0 flex-1 text-fine text-ink">Latest {SOURCE_WORD[k]},
                  <span className="text-ink-2"> {longDay(r.at)}, {clockOf(r.at)}</span></span>
                <span className="shrink-0 font-display text-ui font-bold tabular-nums text-ink">{r.score}</span>
              </li>
            ) : null
          })}
        </ul>
      ) : (
        <NoData go={go} className="mt-3 items-start text-left"/>
      )}
      <p className="mt-2 text-fine text-ink-3">
        The camera and the check-in questions need no patch.</p>
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
          <PanelHead title={`${SCORE} Trend`} meta={view.label} className="min-w-0 flex-1"/>
          <Why label="How to read the trend" className="pt-1">
            Each point is a reading, or one day's average on Week and Month. The shaded band is your usual
            range. Higher means more stress.
          </Why>
        </div>
        <div className="mt-2"><RangeTabs value={range} onChange={k => { setRange(k); if (k !== 'day') setAnchor(null) }}/></div>
        <ScoreChart className="mt-3" points={view.points} ticks={view.ticks} go={go} tall
          label={`${SCORE}, ${RANGE_LABEL[range]}`}/>
      </Panel>
      <Panel variant="outline">
        <PanelHead title="Readings by Source" meta={`${view.list.length} in this range`}/>
        <div className="mt-3"><BySource list={view.list} go={go}/></div>
      </Panel>
      </div>
      <Panel>
        <PanelHead title="Your Days" meta="tap a day"/>
        <div className="mt-3">
          <LiveCalendar days={days} now={now} picked={range === 'day' ? dayKey(view.from) : null} onPick={pick}/>
        </div>
      </Panel>
    </div>
  )
}

/* ── The tab ───────────────────────────────────────────────────────────── */

export function StudentTrendsBody({ go }) {
  const { entries, now, demo, setNote } = useReadingLog()
  const [range, setRange] = React.useState('week')
  const [anchor, setAnchor] = React.useState(null)
  /* The demo range, as the demo Trends above the log reports it. */
  const [demoSpan, setDemoSpan] = React.useState(null)

  /* The log covers the same days as the trend above it, in both modes, so
     "Readings by Source" and the log count the same readings. */
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
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h1 className="m-0 font-display text-head font-bold tracking-tight text-ink sm:text-sub">Trends</h1>
        <TakeReading go={go}/>
      </div>

      <PartHead id="st-today-h" kind="today" title="Today"
        line={`${demo ? TODAY_LONG : longDate()}. Your readings so far today.`}/>
      {/* The demo day in full moved here from the home on 17 October: the
          home is navigation only, and all data lives on this tab. */}
      {demo && <DemoTodayDetail go={go}/>}
      <TodayPart entries={entries} now={now} go={go} listOnly={demo}/>

      <section aria-labelledby="st-trends-h"
        className="mt-4 flex flex-col gap-3 rounded-[24px] border border-beam/25 bg-beam-wash p-3 sm:p-4
          lg:mt-6 lg:gap-4 lg:p-5">
        <PartHead id="st-trends-h" kind="trends" title="Trends"
          line={`Days, weeks and months, compared only with your own usual.${demo ? ' Demo days.' : ''}`}/>
        {demo
          ? <Trends teen={TEEN} bare log={entries} onSpan={setDemoSpan}/>
          : <LiveTrendsPart entries={entries} now={now} go={go} range={range} setRange={setRange}
              anchor={anchor} setAnchor={setAnchor}/>}
        <MindScoreLog className="mt-2" entries={entries} list={list} now={now} demo={demo} setNote={setNote}
          rangeLabel={rangeLabel} latest go={go}/>
      </section>
    </div>
  )
}

/** The app tab "Trends" (route `student-trends`), in the same shell as the
    student's other tabs. */
export function StudentTrends({ go }) {
  const [mode] = useMode()
  return (
    <SectionShell go={go} note={mode === 'demo' ? 'These are demo figures.' : undefined}>
      <StudentTrendsBody go={go}/>
    </SectionShell>
  )
}

export default StudentTrends
