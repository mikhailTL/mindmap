import React from 'react'
import { LampFace } from '../../traffic/Face'
import { Chevron } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { CardDial, TeenAvatar } from '../family/TeenCard'
import { mainSources, SOURCE_NAME, SourceIcon } from './sources'
import { toneOf } from './look'
import { STATUS_WORD, figures, signed, trendsShared } from './metrics'

// A teen whose consent withholds the score shows no figure, dial or face on the card.
const scoreShared = teen => teen.consent?.score !== false

const sourceWords = teen => mainSources(teen).map(k => SOURCE_NAME[k].toLowerCase()).join(' and ')

function usualWord(teen, score) {
  if (score > teen.usual.hi) return 'Stress is higher than usual today'
  if (score < teen.usual.lo) return 'Stress is lower than usual today'
  return 'Stress is in their usual range today'
}

function weekWords(teen) {
  if (!trendsShared(teen)) return null
  const c = figures(teen, 'week').change
  const pts = n => `${n} ${n === 1 ? 'point' : 'points'}`
  return c > 0 ? `${pts(c)} more stress than last week` : c < 0 ? `${pts(Math.abs(c))} less stress than last week`
    : 'Same stress as last week'
}

function ariaFor(teen) {
  const today = teen.days[teen.days.length - 1]
  const lead = `Open the record for ${teen.pseudonym}, grade ${teen.grade}. Readings from ${sourceWords(teen)}.`
  if (!scoreShared(teen)) return `${lead} Mind Score not shared.`
  const week = weekWords(teen)
  return `${lead} Heads Up today: ${STATUS_WORD[today.light]}. Mind Score today ${today.score} of 100, `
    + `${usualWord(teen, today.score).toLowerCase()}.${week ? ` ${week}.` : ''}`
}

export function ProTeenCard({ teen, onOpen }) {
  const today = teen.days[teen.days.length - 1]
  const shared = scoreShared(teen)
  const week = shared ? weekWords(teen) : null
  const tone = (shared && toneOf(today.light)) || { band: 'bg-aqua', edge: 'border-rule', ink: 'text-ink-2' }
  return (
    <article aria-label={teen.pseudonym}
      className={cn('group relative flex h-full w-full flex-col rounded-panel border-2 bg-card p-3.5 text-left',
        'transition-colors duration-150 hoverOnly:border-ink/50 lg:p-4', tone.edge)}>
      <div className="flex items-center gap-3">
        <TeenAvatar teen={teen} variant="pro" size="size-11"/>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate font-display text-ui font-bold text-ink">{teen.pseudonym}</h3>
          <p className="m-0 text-fine text-ink-2">Grade {teen.grade}, age {teen.age}</p>
        </div>
        {shared && today.light && (
          <span className={cn('flex shrink-0 items-center gap-1.5 rounded-field px-2 py-1', tone.band)}>
            <LampFace light={today.light} size={28}/>
            <span className={cn('font-display text-fine font-bold', tone.ink)}>{STATUS_WORD[today.light]}</span>
          </span>
        )}
      </div>

      {shared ? (
        <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4">
          <CardDial teen={teen} range="day" score={today.score} size={136} className="w-[136px]"/>
          <div className="min-w-0">
            <p className="m-0 font-display text-ui font-bold text-ink">{usualWord(teen, today.score)}</p>
            <p className="m-0 mt-1 text-fine text-ink-2">{week || 'Trend not shared'}</p>
          </div>
        </div>
      ) : (
        <p className="m-0 mt-3 text-ui text-ink-2">Mind Score not shared.</p>
      )}

      <div className="mt-auto pt-2">
        <button type="button" onClick={() => onOpen(teen)} aria-label={ariaFor(teen)}
          className="inline-flex min-h-[44px] items-center gap-1 font-display text-ui font-bold text-accent
            after:absolute after:inset-0 after:rounded-panel after:content-[''] hoverOnly:text-accent-ink">
          Open record<Chevron aria-hidden className="size-4"/></button>
      </div>
    </article>
  )
}

export function ProTeenRow({ teen, onOpen }) {
  const today = teen.days[teen.days.length - 1]
  const shared = scoreShared(teen)
  const change = shared && trendsShared(teen) ? figures(teen, 'week').change : null
  return (
    <li className="border-b border-rule last:border-b-0">
      <button type="button" onClick={() => onOpen(teen)} aria-label={ariaFor(teen)}
        className="flex min-h-[56px] w-full items-center gap-3 px-1 py-2 text-left transition-colors duration-150
          hoverOnly:bg-aqua active:bg-aqua">
        {shared && today.light ? <LampFace light={today.light} size={22}/> : <span aria-hidden className="w-[22px] shrink-0"/>}
        <span aria-hidden className="min-w-0 flex-1">
          <span className="block truncate text-fine font-bold text-ink">{teen.pseudonym}</span>
          <span className="flex items-center gap-1 text-fine text-ink-3">
            {mainSources(teen).map(k => <SourceIcon key={k} source={k} size={16}/>)}
            <span className="truncate">Grade {teen.grade}</span>
          </span>
        </span>
        <span aria-hidden className="w-16 shrink-0 text-right text-fine font-bold tabular-nums text-ink">
          {shared ? today.score : 'Not shared'}</span>
        <span aria-hidden className={cn('w-[4.5rem] shrink-0 text-right text-fine font-bold leading-tight tabular-nums',
          change > 0 ? 'text-warn' : change < 0 ? 'text-accent' : 'text-ink-3')}>
          {change === null ? 'Not shared' : signed(change)}</span>
        <Chevron aria-hidden className="size-4 shrink-0 text-ink-3"/>
      </button>
    </li>
  )
}

/* The column heads for the compact list. */
export function ProRowHead() {
  return (
    <div aria-hidden className="flex items-end gap-3 border-b border-ink px-1 pb-1.5">
      <span className="w-[22px] shrink-0"/>
      <span className="tick min-w-0 flex-1">Teen</span>
      <span className="tick w-16 shrink-0 text-right">Today</span>
      <span className="tick w-[4.5rem] shrink-0 text-right">Change</span>
      <span className="w-4 shrink-0"/>
    </div>
  )
}
