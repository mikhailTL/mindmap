import React from 'react'
import { FaceTrend, LampFace, trendLabel } from '../../traffic/Face'
import { FACE_LABEL, statusOf, summary } from '../../lib/roster'
import { RainbowDial } from '../../charts/rainbow'
import { Chevron } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { TODAY_LONG } from '../student/PartHead'
import { ProPart, toneOf } from './look'
import { DailyChart, FaceCounts, ringsFor } from './charts'
import { SourceCounts, SourceIcon, SourceLine, SOURCE_NAME, countBySource, mainSources, sourcesOf } from './sources'
import { COLUMNS, STATUS_LINE, STATUS_WORD, TREND_PREV, TREND_TITLE, figures, signed, trendDays, trendRange,
  trendsShared } from './metrics'

/* The Counselor/Professional's teen card. Every teen's card has the same
 * three parts in the same order:
 *
 *   who        code, grade, age, and where the readings come from, with icons
 *   Today      today's Mind Score on the rainbow (clouds on), today's Heads Up
 *              face, and today's readings counted by source
 *   Trends     the chosen range: a bar per day against the teen's usual band,
 *              the Heads Up face per day, the average and its change, the
 *              readings by source, then the figures the reader chose
 *
 * The owner: "you need to clearly section between 'Today' data and 'Trend'
 * data on all pages that report it." A teen who does not share trends shows
 * Today in full and "Score only" under Trends: no change, no bars.
 *
 * The coloured band at the top follows the range picked for every card, as
 * the parent's card does: today's face, or the week's or month's average,
 * named under the word, with an arrow for the Mind Score against the range
 * before it. The band takes its colour from that face. */

const FACE_RANGES = ['day', 'week', 'month']
const faceRange = r => (FACE_RANGES.includes(r) ? r : 'week')
const SINCE = { day: 'yesterday', ...TREND_PREV }

const changeTone = v => (v > 0 ? 'text-warn' : v < 0 ? 'text-accent' : 'text-ink-3')
const changeWords = v => (v > 0 ? `up ${v}` : v < 0 ? `down ${Math.abs(v)}` : 'level')

function Figure({ col, f }) {
  return (
    <div className="min-w-0 border-t border-rule pt-1.5">
      <dt className="truncate text-fine text-ink-3">{col.label}</dt>
      <dd className="m-0 flex items-baseline gap-1 font-display text-ui font-bold tabular-nums text-ink">
        {f[col.key]}<span className="font-body text-fine font-normal text-ink-3">{col.unit}</span>
      </dd>
    </div>
  )
}

const sourceWords = teen => mainSources(teen).map(k => SOURCE_NAME[k].toLowerCase()).join(' and ')

/* The face for the band and its arrow. No arrow without trend consent. */
function headsUp(teen, chosen) {
  const r = faceRange(chosen)
  const light = statusOf(teen, r)
  const change = trendsShared(teen) ? summary(teen, r).change : null
  return { r, light, change, since: SINCE[r] }
}

function ariaFor(teen, range, chosen) {
  const today = teen.days[teen.days.length - 1]
  const f = figures(teen, range)
  const h = headsUp(teen, chosen)
  const move = trendLabel(h.change, h.since)
  return `Open the record for ${teen.pseudonym}, grade ${teen.grade}. Readings from ${sourceWords(teen)}. `
    + `Heads Up, ${FACE_LABEL[h.r].toLowerCase()}: ${STATUS_WORD[h.light]}.${move ? ` ${move}.` : ''} `
    + `Today: Mind Score ${today.score} of 100, Heads Up ${STATUS_WORD[today.light]}. `
    + (trendsShared(teen) ? `${TREND_TITLE[range]}: average ${f.score}, ${changeWords(f.change)} points.` : 'Trends: score only.')
}

export function ProTeenCard({ teen, range: chosen, columns, onOpen }) {
  const range = trendRange(chosen)
  const f = figures(teen, range)
  const trend = trendsShared(teen)
  const today = teen.days[teen.days.length - 1]
  const days = trendDays(teen, range)
  const rest = COLUMNS.filter(c => c.key !== 'score' && c.key !== 'change' && columns.includes(c.key))
  const totals = countBySource(days, sourcesOf(teen))
  const h = headsUp(teen, chosen)
  const tone = toneOf(h.light) || { band: 'bg-aqua', edge: 'border-rule', ink: 'text-ink-2' }
  const todayTone = toneOf(today.light) || tone
  return (
    <article aria-label={teen.pseudonym}
      className={cn('group relative flex h-full w-full flex-col overflow-hidden rounded-panel border-2 bg-card text-left',
        'transition-colors duration-150 hoverOnly:border-ink/50', tone.edge)}>
      <div className={cn('flex items-center gap-3 border-b-2 px-3.5 py-3 lg:px-4', tone.band, tone.edge)}>
        {h.light && <LampFace light={h.light} size={44}/>}
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate font-display text-ui font-bold text-ink">{teen.pseudonym}</p>
          <p className="m-0 text-fine text-ink-2">Grade {teen.grade}, age {teen.age}</p>
          {h.light && <p className="m-0 text-fine text-ink-2">{FACE_LABEL[h.r]}:{' '}
            <span className={cn('font-display font-bold', tone.ink)}>{STATUS_WORD[h.light]}</span></p>}
        </div>
        <FaceTrend change={h.change} since={h.since}/>
      </div>
      <div className="flex flex-1 flex-col p-3.5 lg:p-4">
      <SourceLine teen={teen}/>

      <ProPart kind="today" title="Today" line={TODAY_LONG} as="h3" small className="mt-3.5"/>
      <div className="mt-2 flex justify-center">
        <RainbowDial score={today.score} usual={teen.usual.base} rings={ringsFor(teen, today)} size={260}/>
      </div>
      <div className="mt-2 grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-3">
        <div className="min-w-0">
          <p className="m-0 text-fine text-ink-3">Usual range</p>
          <p className="m-0 mt-1 font-display text-ui font-bold tabular-nums text-ink">{teen.usual.lo} to {teen.usual.hi}</p>
        </div>
        <div className="min-w-0">
          <p className="m-0 text-fine text-ink-3">Readings today</p>
          <SourceCounts counts={countBySource([today], sourcesOf(teen))} unit={false} className="mt-1 !gap-1"/>
        </div>
      </div>
      <p className={cn('m-0 mt-2 flex items-center gap-1.5 rounded-field px-2 py-1.5 text-fine font-medium text-ink', todayTone.band)}>
        {today.light && <LampFace light={today.light} size={18}/>}{STATUS_LINE[today.light]} today.</p>

      <ProPart kind="trends" title="Trends" line={TREND_TITLE[range]} as="h3" small className="mt-4"/>
      {trend ? (
        <div className="mt-2">
          <DailyChart days={days} usual={teen.usual} compact/>
          <FaceCounts days={days} className="mt-2"/>
          <p className="m-0 mt-1.5 text-fine text-ink-2">
            Average <span className="font-display font-bold tabular-nums text-ink">{f.score}</span> of 100,{' '}
            <span className={cn('font-display font-bold tabular-nums', changeTone(f.change))}>{signed(f.change)}</span>
            {' '}points from {TREND_PREV[range]}.</p>
        </div>
      ) : (
        <p className="m-0 mt-2 border-t border-dashed border-ruling pt-2 text-fine text-ink-3">
          <span className="font-medium text-ink-2">Score only.</span> This teen shares today, not a trend.
          {' '}Average {f.score} of 100.</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-fine text-ink-2">
        <span className="text-ink-3">Readings</span>
        {Object.entries(totals).map(([k, n]) => (
          <span key={k} className="inline-flex items-center gap-1">
            <SourceIcon source={k} size={16}/><span className="sr-only">{SOURCE_NAME[k]}</span>
            <span className="font-display font-bold tabular-nums text-ink">{n}</span></span>
        ))}
      </div>

      {rest.length > 0 && (
        <dl className="m-0 mt-3 grid w-full grid-cols-2 gap-x-3 gap-y-2">
          {rest.map(c => <Figure key={c.key} col={c} f={f}/>)}
        </dl>
      )}

      <div className="mt-auto pt-3">
        <button type="button" onClick={() => onOpen(teen)} aria-label={ariaFor(teen, range, chosen)}
          className="inline-flex min-h-[44px] items-center gap-1 font-display text-ui font-bold text-accent
            after:absolute after:inset-0 after:rounded-panel after:content-[''] hoverOnly:text-accent-ink">
          Open record<Chevron aria-hidden className="size-4"/></button>
      </div>
      </div>
    </article>
  )
}

/* The compact list: one row per teen, the chosen figures as columns from sm
   up and as one wrapped line under the code at phone width. The face for the
   picked range and the source icons sit beside the code. */
export function ProTeenRow({ teen, range: chosen, columns, onOpen }) {
  const range = trendRange(chosen)
  const f = figures(teen, range)
  const today = teen.days[teen.days.length - 1]
  const cols = COLUMNS.filter(c => columns.includes(c.key))
  const val = c => (c.key === 'change' ? (f.change === null ? 'Score only' : `${signed(f.change)}`) : f[c.key])
  return (
    <li className="border-b border-rule last:border-b-0">
      <button type="button" onClick={() => onOpen(teen)} aria-label={ariaFor(teen, range, chosen)}
        className="flex min-h-[56px] w-full items-center gap-3 px-1 py-2 text-left transition-colors duration-150
          hoverOnly:bg-aqua active:bg-aqua">
        <LampFace light={headsUp(teen, chosen).light || today.light} size={22}/>
        <span aria-hidden className="w-[9.5rem] min-w-0 shrink-0">
          <span className="block truncate text-fine font-bold text-ink">{teen.pseudonym}</span>
          <span className="flex items-center gap-1 text-fine text-ink-3">
            {mainSources(teen).map(k => <SourceIcon key={k} source={k} size={16}/>)}
            <span className="truncate">{teen.patch ? 'Patch' : 'Phone'}, grade {teen.grade}</span>
          </span>
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
      <span className="tick w-[9.5rem] shrink-0">teen and source</span>
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

