import React from 'react'
import { Panel, PanelHead } from '../Monitor'
import { USUAL } from '../../lib/readingLog'
import { SCORE } from '../../lib/terms'
import { useReadingLog } from '../reading/useReadingLog'
import { TEEN, shortDate } from './demoTeen'
import { NoData, SeeTrends, Sparkline } from './charts'
import { byDay, lastDays, monthDay } from './liveSeries'
import { cn } from '../../lib/utils'
import { LampFace } from '../../traffic/Face'

/* The Trends box on the student home. The owner, 17 October: "there should
 * be a new box called Trends on the main student homepage." One card: the
 * last fourteen days as a small line over the usual band, two figures, and
 * "See your trends", which opens the Trends tab. Demo: the demo teen's days.
 * Live: the student's own readings, one point per day that has one. */

const N = 14

function useSeries() {
  const { entries, now, demo } = useReadingLog()
  return React.useMemo(() => {
    if (demo) {
      const days = TEEN.days.slice(-N)
      return { usual: TEEN.usual, values: days.map(d => ({ key: d.date, v: d.score,
        label: shortDate(d.date).split(' ').slice(1).reverse().join(' ') })) }
    }
    const cells = lastDays(byDay(entries), now, N)
    return { usual: USUAL, values: cells.map(c => ({ key: c.key, v: c.day ? c.day.mean : null,
      label: monthDay(c.at) })) }
  }, [entries, now, demo])
}

export function TrendsBox({ go, className }) {
  const { values, usual } = useSeries()
  const real = values.filter(p => p.v != null)
  const inside = real.filter(p => p.v >= usual.lo && p.v <= usual.hi).length
  const mean = real.length ? Math.round(real.reduce((a, p) => a + p.v, 0) / real.length) : null
  return (
    <Panel className={cn('flex flex-col', className)}>
      <PanelHead as="h3" title="Trends" meta={`last ${N} days`}/>
      {real.length ? (
        <>
          <Sparkline className="mt-3" values={values} usual={usual}
            label={`${SCORE} over the last ${N} days: ${real.map(p => p.v).join(', ')}. Your usual range is
              ${usual.lo} to ${usual.hi}.`}/>
          <dl className="m-0 mt-2.5 grid grid-cols-2 gap-x-4 border-t border-rule pt-2.5">
            <div className="min-w-0">
              <dt className="tick">Average</dt>
              <dd className="m-0 mt-0.5 font-display text-row font-medium tabular-nums leading-none text-ink">{mean}</dd>
            </div>
            <div className="min-w-0">
              <dt className="tick">In your usual range</dt>
              <dd className="m-0 mt-0.5 font-display text-row font-medium tabular-nums leading-none text-ink">
                {inside}<span className="ml-1 font-body text-fine font-normal text-ink-3">of {real.length}
                  {real.length === 1 ? ' day' : ' days'}</span></dd>
            </div>
          </dl>
          <p className="mt-2 text-fine text-ink-3">Shaded: your usual range, {usual.lo} to {usual.hi}.</p>
        </>
      ) : (
        <NoData go={go} className="mt-3 items-start rounded-panel border border-dashed border-rule p-3 text-left"/>
      )}
      <SeeTrends go={go} className="mt-auto self-start pt-1"/>
    </Panel>
  )
}

/* The last seven days as faces: each day's Heads Up face over its average
   Mind Score, the word beside the face for the screen reader. A day with no
   reading shows a dash. */
const LIGHT_WORD = { green: 'green', yellow: 'yellow', red: 'red' }

export function WeekFaces({ go, className }) {
  const { entries, now, demo } = useReadingLog()
  const days = React.useMemo(() => {
    if (demo) return TEEN.days.slice(-7).map(d => ({ key: d.date, wd: d.weekday, v: d.score, light: d.light }))
    return lastDays(byDay(entries), now, 7).map(c => ({ key: c.key,
      wd: new Date(c.at).toLocaleDateString('en-US', { weekday: 'short' }),
      v: c.day ? c.day.mean : null, light: c.day ? c.day.light : null }))
  }, [entries, now, demo])
  const any = days.some(d => d.v != null)
  return (
    <Panel className={cn('flex flex-col', className)}>
      <PanelHead as="h3" title="Your Week" meta="Heads Up each day"/>
      <ul className="m-0 mt-3 grid list-none grid-cols-7 gap-1 p-0">
        {days.map((d, i) => (
          <li key={d.key} className={cn('flex min-w-0 flex-col items-center gap-1 rounded-xs py-2',
            i === days.length - 1 ? 'bg-accent-wash' : 'bg-paper')}>
            <span className={cn('text-fine', i === days.length - 1 ? 'font-bold text-ink' : 'text-ink-2')}>{d.wd}</span>
            {d.light ? <LampFace light={d.light} size={22}/>
              : <span aria-hidden className="grid size-[22px] place-items-center text-ink-3">-</span>}
            <span className="font-display text-ui font-bold tabular-nums text-ink">{d.v ?? ''}</span>
            <span className="sr-only">{d.v == null ? 'No reading' : `${SCORE} ${d.v}, Heads Up ${LIGHT_WORD[d.light]}`}</span>
          </li>
        ))}
      </ul>
      {!any && <NoData go={go} className="mt-2 items-start text-left"/>}
    </Panel>
  )
}
