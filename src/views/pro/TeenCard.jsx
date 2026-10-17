import React from 'react'
import { LampFace } from '../../traffic/Face'
import { Chevron } from '../../ui/marks'
import { FACE_LABEL, statusOf, summary } from '../../lib/roster'
import { cn } from '../../lib/utils'
import { Spark } from './parts'
import { COLUMNS, RANGE_NOUN, STATUS_LINE, STATUS_WORD, figures, signed, sourceLine, trendsShared } from './metrics'

/* The Medical Professional's teen card, local to this screen.
 *
 * src/views/family/TeenCard.jsx (the parent's card, with a 'pro' variant in
 * the shared contract) did not exist when this was written, so this is the
 * same idea built here: face and status word, the code, the Mind Score for
 * the chosen range with its change, a line against the teen's own usual band,
 * the three ranges side by side, then the figures the reader chose. Every
 * number carries its unit. A teen who does not share trends shows "Score
 * only": no change, no line, no range comparison. */

const changeTone = v => (v > 0 ? 'text-warn' : v < 0 ? 'text-accent' : 'text-ink-3')
const changeWords = v => (v > 0 ? `up ${v}` : v < 0 ? `down ${Math.abs(v)}` : 'level')

function Figure({ col, f }) {
  const v = f[col.key]
  return (
    <div className="min-w-0 border-t border-rule pt-1.5">
      <dt className="truncate text-fine text-ink-3">{col.label}</dt>
      <dd className="m-0 flex items-baseline gap-1 font-display text-ui font-bold tabular-nums text-ink">
        {v}<span className="font-body text-fine font-normal text-ink-3">{col.unit}</span>
      </dd>
    </div>
  )
}

function ariaFor(teen, f, range) {
  const st = statusOf(teen, range)
  return `${teen.pseudonym}, grade ${teen.grade}, ${FACE_LABEL[range]} ${STATUS_WORD[st]}. Mind Score ${f.score} of 100 ${RANGE_NOUN[range]}`
    + (f.change === null ? ', score only' : `, ${changeWords(f.change)} points`)
    + `. Usual ${teen.usual.lo} to ${teen.usual.hi}. Open record.`
}

export function ProTeenCard({ teen, range, columns, onOpen }) {
  const f = figures(teen, range)
  const st = statusOf(teen, range)
  const trend = trendsShared(teen)
  const show = k => columns.includes(k)
  const rest = COLUMNS.filter(c => c.key !== 'score' && c.key !== 'change' && show(c.key))
  return (
    <button type="button" onClick={() => onOpen(teen)} aria-label={ariaFor(teen, f, range)}
      className="group flex h-full w-full flex-col rounded-panel border border-rule bg-card p-3.5 text-left
        shadow-card transition-colors duration-150 hoverOnly:border-accent active:bg-aqua lg:p-4">
      <span aria-hidden className="flex w-full items-start gap-2.5">
        <LampFace light={st} size={30}/>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-ui font-bold text-ink">{teen.pseudonym}</span>
          <span className="block text-fine text-ink-3">Grade {teen.grade} · age {teen.age}</span>
        </span>
        <span className="shrink-0 pt-0.5 text-fine font-medium text-ink-2">{STATUS_WORD[st]}</span>
      </span>

      <span aria-hidden className="mt-3 flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        {show('score') && (
          <span className="flex items-baseline gap-1.5">
            <span className="font-display text-head font-bold tabular-nums leading-none text-ink">{f.score}</span>
            <span className="text-fine text-ink-3">of 100 {RANGE_NOUN[range]}</span>
          </span>
        )}
        {show('change') && trend && (
          <span className={cn('font-display text-ui font-bold tabular-nums', changeTone(f.change))}>
            {signed(f.change)} <span className="font-body text-fine font-normal text-ink-3">points</span></span>
        )}
      </span>
      {/* The teen's own usual band, so the status word above has a reason. */}
      <span aria-hidden className="mt-1 block w-full text-fine text-ink-2">
        Usual {teen.usual.lo} to {teen.usual.hi}. {FACE_LABEL[range]}: {STATUS_LINE[st].toLowerCase()}.
      </span>

      {trend ? (
        <span aria-hidden className="mt-2 block w-full">
          <Spark points={f.points} usual={teen.usual}/>
          <span className="mt-2 grid grid-cols-3 gap-2">
            {['day', 'week', 'month'].map(r => (
              <span key={r} className="min-w-0">
                <span className="block text-fine text-ink-3">{r === 'day' ? 'Today' : r === 'week' ? 'Week' : 'Month'}</span>
                <span className="block font-display text-ui font-bold tabular-nums text-ink">{summary(teen, r).mean}</span>
              </span>
            ))}
          </span>
        </span>
      ) : (
        <span aria-hidden className="mt-2 block w-full border-t border-dashed border-ruling pt-2 text-fine text-ink-3">
          <span className="font-medium text-ink-2">Score only.</span> No trend is shared.
        </span>
      )}

      {rest.length > 0 && (
        <dl aria-hidden className="m-0 mt-3 grid w-full grid-cols-2 gap-x-3 gap-y-2">
          {rest.map(c => <Figure key={c.key} col={c} f={f}/>)}
        </dl>
      )}

      <span aria-hidden className="mt-auto flex w-full items-center justify-between gap-2 pt-3 text-fine text-ink-3">
        <span className="truncate">{sourceLine(teen)}</span>
        <span className="inline-flex shrink-0 items-center gap-1 font-display font-bold text-accent">
          Open<Chevron className="size-4"/></span>
      </span>
    </button>
  )
}

/* The compact list: one row per teen, the chosen figures as columns from sm
   up and as one wrapped line under the code at phone width. */
export function ProTeenRow({ teen, range, columns, onOpen }) {
  const f = figures(teen, range)
  const st = statusOf(teen, range)
  const cols = COLUMNS.filter(c => columns.includes(c.key))
  const val = c => (c.key === 'change' ? (f.change === null ? 'Score only' : `${signed(f.change)}`) : f[c.key])
  return (
    <li className="border-b border-rule last:border-b-0">
      <button type="button" onClick={() => onOpen(teen)} aria-label={ariaFor(teen, f, range)}
        className="flex min-h-[56px] w-full items-center gap-3 px-1 py-2 text-left transition-colors duration-150
          hoverOnly:bg-aqua active:bg-aqua">
        <LampFace light={st} size={22}/>
        <span aria-hidden className="w-[8.5rem] min-w-0 shrink-0">
          <span className="block truncate text-fine font-bold text-ink">{teen.pseudonym}</span>
          <span className="block text-fine text-ink-3">Grade {teen.grade} · {STATUS_WORD[st]}</span>
        </span>
        <span aria-hidden className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-0.5 sm:flex sm:items-baseline sm:gap-0">
          {cols.map(c => (
            <span key={c.key} className="min-w-0 sm:flex-1 sm:text-right">
              <span className="text-fine text-ink-3 sm:hidden">{c.label} </span>
              <span className={cn('text-fine font-bold tabular-nums',
                c.key === 'change' && f.change !== null ? changeTone(f.change) : 'text-ink')}>{val(c)}</span>
            </span>
          ))}
        </span>
        <Chevron aria-hidden className="size-4 shrink-0 text-ink-3"/>
      </button>
    </li>
  )
}

/* The column heads for the compact list, from sm up. */
export function ProRowHead({ columns }) {
  const cols = COLUMNS.filter(c => columns.includes(c.key))
  return (
    <div aria-hidden className="hidden items-end gap-3 border-b border-ink px-1 pb-1.5 sm:flex">
      <span className="w-[22px] shrink-0"/>
      <span className="tick w-[8.5rem] shrink-0">teen</span>
      <span className="flex min-w-0 flex-1">
        {cols.map(c => (
          <span key={c.key} className="min-w-0 flex-1 text-right">
            <span className="tick block truncate">{c.label}</span>
            <span className="tick block truncate">{c.unit}</span>
          </span>
        ))}
      </span>
      <span className="w-4 shrink-0"/>
    </div>
  )
}
