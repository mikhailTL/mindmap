import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { FACE_LABEL, RANGE_LABEL } from '../../lib/roster'
import { LampFace } from '../../traffic/Face'
import { MonthCalendar } from '../calendar'
import { cn } from '../../lib/utils'
import { cardClass } from '../../ui/card'
import { RangeSwitch } from './RangeTrend'
import { ScoreChart, ScoreLegend } from './charts'
import DayFacts from './DayFacts'
import { PREV, STATUS_SUB, STATUS_WORD, fullDate, lightCounts, rangeDays, statusOfTeen, summaryOf } from './data'

/* One child's Trends, the same layout for every child: the Mind Score by day
 * for a Day, Week or Month; Heads Up across that range; and the month
 * calendar with each day's face, where picking a day shows its face and
 * Mind Score beside the grid. The owner, 18 October, "everything looks too
 * overwhelming": the "Everything recorded" box and the day's long list of
 * rows are gone.
 *
 * Whole days only (the parent's consent scope). Used on a child's page under
 * its Today part and on the parent's Trends tab. */

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const wd = iso => WD[new Date(iso + 'T12:00:00Z').getUTCDay()]

/* `variant` and `hue` pick the surface (src/ui/card.jsx). Heads Up takes the
   sun wash so it never matches the Mind Score beside it. */
function Card({ title, line, right, children, className, labelId, variant = 'plain', hue = 'accent' }) {
  return (
    <section aria-labelledby={labelId}
      className={cn(cardClass(variant, hue), 'flex min-w-0 flex-col p-4 sm:p-5', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 id={labelId} className="m-0 font-display text-head font-bold leading-tight text-ink">{title}</h3>
          {line && <p className="m-0 mt-1 text-fine text-ink-2">{line}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function Fig({ k, v, sub }) {
  return (
    <div className="min-w-0">
      <dt className="text-fine text-ink-2">{k}</dt>
      <dd className="m-0 mt-0.5 font-display text-row font-bold tabular-nums leading-none text-ink">{v}</dd>
      {sub && <dd className="m-0 mt-1 text-fine text-ink-2">{sub}</dd>}
    </div>
  )
}

function pointsFor(teen, range) {
  const all = teen.days
  const days = range === 'day' ? all.slice(-2) : rangeDays(teen, range)
  const last = all[all.length - 1].date
  return days.map(d => ({
    date: d.date, score: d.score, light: d.light, long: fullDate(d.date),
    label: d.date === last ? 'Today'
      : range === 'day' ? 'Yesterday' : range === 'week' ? wd(d.date) : String(Number(d.date.slice(8))),
  }))
}

export default function ChildTrends({ teen, className }) {
  const reduced = useReducedMotion()
  const ids = React.useId()
  const today = teen.days[teen.days.length - 1].date
  const [range, setRange] = React.useState('week')
  const [picked, setPicked] = React.useState(today)
  React.useEffect(() => { setPicked(teen.days[teen.days.length - 1].date) }, [teen.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const dayRef = React.useRef(null)

  const days = rangeDays(teen, range)
  const s = summaryOf(teen, range)
  const points = pointsFor(teen, range)
  const counts = lightCounts(days)
  const face = statusOfTeen(teen, range)
  const withScore = days.filter(d => d.score != null)
  const calDays = React.useMemo(() => teen.days.map(d => ({ date: d.date, score: d.score, light: d.light })), [teen])
  const pickedDay = teen.days.find(d => d.date === picked)
  const empty = !withScore.length

  const pick = iso => {
    setPicked(iso)
    requestAnimationFrame(() => dayRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' }))
  }

  return (
    <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-5', className)}>
      <Card labelId={ids + 'ms'} title="Mind Score" line={`${RANGE_LABEL[range]}. 0 calm to 100 peak.`}
        right={<RangeSwitch value={range} onChange={setRange} label="Range for the Trends"/>}>
        {empty ? (
          <p className="m-0 mt-5 max-w-[52ch] text-ui text-ink-2">No readings {range === 'day' ? 'today or yesterday'
            : `in ${RANGE_LABEL[range].toLowerCase()}`} yet. {teen.first}’s Mind Score shows here after their next reading.</p>
        ) : (
          <>
            <ScoreChart className="mt-4" teen={teen} points={points} kind={range === 'month' ? 'line' : 'bars'}
              selected={picked} onPick={pick} height={range === 'day' ? 200 : 236}/>
            <ScoreLegend teen={teen} className="mt-2"/>
            <dl className="m-0 mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-4">
              <Fig k={range === 'day' ? 'Today' : 'Average'} v={s.mean ?? 'None'} sub={s.light ? STATUS_SUB[s.light] : undefined}/>
              <Fig k={`Change vs ${PREV[range]}`} v={s.change == null ? 'None'
                : `${s.change > 0 ? '+' : s.change < 0 ? '−' : ''}${Math.abs(s.change)}`}
                sub={s.change == null ? 'Nothing earlier' : s.change === 0 ? 'Same stress' : s.change > 0 ? 'More stress' : 'Less stress'}/>
            </dl>
          </>
        )}
      </Card>

      <Card labelId={ids + 'hu'} variant="tint" hue="sun" title="Heads Up" line={`${RANGE_LABEL[range]}. From phone use, never what is on it.`}>
        {face ? (
          <div className="mt-4 flex items-center gap-3.5">
            <LampFace light={face} size={52}/>
            <div className="min-w-0">
              <p className="m-0 font-display text-row font-bold leading-tight text-ink">{STATUS_WORD[face]}</p>
              <p className="m-0 text-fine text-ink-2">{FACE_LABEL[range]}. {STATUS_SUB[face]}.</p>
            </div>
          </div>
        ) : <p className="m-0 mt-4 text-ui text-ink-2">No Heads Up in this range yet.</p>}
        {range === 'week' && (
          <ul className="m-0 mt-4 grid list-none grid-cols-7 gap-1 p-0">
            {days.map(d => (
              <li key={d.date}>
                <button type="button" aria-pressed={d.date === picked} onClick={() => pick(d.date)}
                  aria-label={`${fullDate(d.date)}: ${d.light && d.score != null ? STATUS_WORD[d.light] : 'no reading'}`}
                  className={cn('flex min-h-[60px] w-full flex-col items-center justify-center gap-1 rounded-field border',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                    d.date === picked ? 'border-ink bg-mist' : 'border-transparent hoverOnly:bg-mist')}>
                  {d.light && d.score != null ? <LampFace light={d.light} size={24}/>
                    : <span aria-hidden className="grid size-6 place-items-center"><span className="size-2.5 rounded-full border-2 border-ink-3"/></span>}
                  <span className={cn('relative text-fine', d.date === today ? 'font-bold text-ink' : 'text-ink-2')}>
                    {wd(d.date).slice(0, 2)}
                    {d.date === today && <span aria-hidden className="absolute -bottom-[3px] left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-bar bg-ink"/>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <dl className="m-0 mt-4 border-t border-rule p-0">
          {['green', 'yellow', 'red'].map(l => (
            <div key={l} className="flex items-center gap-2.5 border-b border-rule py-2">
              <LampFace light={l} size={22}/>
              <dt className="min-w-0 flex-1 text-fine text-ink-2"><b className="font-display font-bold text-ink">{STATUS_WORD[l]}:</b> {STATUS_SUB[l].toLowerCase()}</dt>
              <dd className="m-0 font-display text-ui font-bold tabular-nums text-ink">{counts[l]} {counts[l] === 1 ? 'day' : 'days'}</dd>
            </div>
          ))}
          {counts.none > 0 && (
            <div className="flex items-center gap-2.5 border-b border-rule py-2">
              <span aria-hidden className="grid size-[22px] place-items-center"><span className="size-2.5 rounded-full border-2 border-ink-3"/></span>
              <dt className="min-w-0 flex-1 text-fine text-ink-2">No reading</dt>
              <dd className="m-0 font-display text-ui font-bold tabular-nums text-ink">{counts.none} {counts.none === 1 ? 'day' : 'days'}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Full width, the picked day beside the grid on a wide screen and under
          it on a phone. */}
      <Card labelId={ids + 'cal'} title="Calendar" line="Pick a day to see it." className="lg:col-span-2">
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-5">
          <MonthCalendar days={calDays} today={today} selected={picked} onSelect={pick} legend={false}/>
          <div ref={dayRef} aria-live="polite" className="scroll-mt-24 self-start rounded-panel border border-rule bg-paper p-4">
            <h4 className="m-0 font-display text-ui font-bold text-ink">
              {picked === today ? `Today, ${fullDate(picked)}` : fullDate(picked)}</h4>
            <DayFacts className="mt-3" d={pickedDay}/>
          </div>
        </div>
      </Card>
    </div>
  )
}
