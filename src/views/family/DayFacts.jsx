import React from 'react'
import { LampFace } from '../../traffic/Face'
import { cn } from '../../lib/utils'
import { STATUS_SUB, STATUS_WORD, bodyFor, bodySource, bodyWord, sleepOf, sleepShared, sourceTotals } from './data'
import { SOURCE_ICON, SOURCE_NAME } from './Source'

/* One whole day for a parent, as figures and words: the Mind Score against
 * the usual range, how many readings came from where, how often it rose
 * above usual, and sleep the night before when it is shared. Never a time,
 * a single reading, a note or a place. Used for today on a child's page and
 * for a day picked on the calendar. */

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

function Row({ k, children, sub }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5">
      <dt className="text-fine text-ink-2">{k}</dt>
      <dd className="m-0 text-right">
        <span className="whitespace-nowrap font-display text-ui font-bold tabular-nums text-ink">{children}</span>
        {sub && <span className="block text-fine text-ink-2">{sub}</span>}
      </dd>
    </div>
  )
}

export function SourceRows({ teen, totals }) {
  const keys = teen.patch ? ['patch', 'camera', 'survey'] : ['camera', 'survey']
  return (
    <ul className="m-0 list-none p-0">
      {keys.map(k => {
        const Icon = SOURCE_ICON[k]
        return (
          <li key={k} className="flex items-center gap-2.5 border-b border-rule py-2">
            <Icon className="size-5 shrink-0 text-ink-3"/>
            <span className="min-w-0 flex-1 text-fine text-ink-2">{SOURCE_NAME[k]}</span>
            <span className="font-display text-ui font-bold tabular-nums text-ink">{totals[k]}</span>
          </li>
        )
      })}
      {!teen.patch && (
        <li className="flex items-center gap-2.5 border-b border-rule py-2">
          <SOURCE_ICON.patch className="size-5 shrink-0 text-ink-3"/>
          <span className="min-w-0 flex-1 text-fine text-ink-2">Patch</span>
          <span className="text-fine text-ink-2">Not worn</span>
        </li>
      )}
    </ul>
  )
}

export default function DayFacts({ teen, d, prev, signals = false, className }) {
  if (!d || d.score == null) {
    return <p className={cn('m-0 text-ui text-ink-2', className)}>No readings on this day.</p>
  }
  const totals = sourceTotals([d])
  const sleep = sleepShared(teen) ? sleepOf(teen, d) : null
  const change = prev && prev.score != null ? d.score - prev.score : null
  return (
    <div className={className}>
      <div className="flex items-center gap-3.5">
        {d.light && <LampFace light={d.light} size={44}/>}
        <div className="min-w-0 flex-1">
          <p className="m-0 font-display text-row font-bold leading-tight text-ink">
            {d.light ? STATUS_WORD[d.light] : 'Mind Score'}</p>
          <p className="m-0 text-fine text-ink-2">{d.light ? STATUS_SUB[d.light] : 'Their usual range is not shared'}</p>
        </div>
        <p className="m-0 shrink-0 text-right">
          <span className="block font-display text-stat font-bold tabular-nums leading-none text-ink">{d.score}</span>
          <span className="mt-1 block text-fine text-ink-2">Mind Score</span>
        </p>
      </div>
      <dl className="m-0 mt-3 border-t border-rule p-0">
        {teen.usual && <Row k="Usual range">{teen.usual.lo} to {teen.usual.hi}</Row>}
        {change != null && (
          <Row k="Compared with the day before">
            {change === 0 ? 'Same' : `${Math.abs(change)} ${change > 0 ? 'higher' : 'lower'}`}</Row>
        )}
        {d.min != null && d.max != null && <Row k="Lowest to highest">{d.min} to {d.max}</Row>}
        {d.peaks != null && <Row k="Times it rose above usual">{d.peaks}</Row>}
        {d.recovery != null && d.peaks > 0 && <Row k="Time to settle after">{d.recovery} min</Row>}
        {sleepShared(teen) && (
          <Row k="Sleep the night before">{sleep != null ? `${sleep} hours` : 'Not sent yet'}</Row>
        )}
        <Row k="Readings">{plural(totals.total, 'reading', 'readings')}</Row>
      </dl>
      {totals.known && <div className="mt-1"><SourceRows teen={teen} totals={totals}/></div>}
      {signals && !teen.live && (
        <ul className="m-0 mt-3 grid list-none grid-cols-1 gap-x-5 gap-y-1.5 p-0 sm:grid-cols-2">
          {bodyFor(teen).map(m => (
            <li key={m.k} className="flex items-center gap-2 text-fine">
              <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: m.color }}/>
              <span className="min-w-0 flex-1 text-ink-2">{m.label} <span className="text-ink-3">({bodySource(teen, m)})</span></span>
              <span className="shrink-0 font-semibold text-ink">{bodyWord(teen, m, d.date, d[m.k])}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
