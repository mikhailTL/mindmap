import React from 'react'
import { cn } from '../../lib/utils'

/* Where a teen's readings come from, drawn the same way on every card, row
 * and record. The owner: "u need to make it clear that its readings come from
 * the specific source". A patch teen reads from the patch; a teen without one
 * reads from the phone camera and the check-in questions. Each source has its
 * own drawn icon, so the source never rests on colour or on a word alone. */

export const SOURCE_NAME = Object.freeze({ patch: 'Patch', camera: 'Phone camera', survey: 'Check-in questions', phone: 'Phone' })
const TONE = { patch: 'text-accent-ink', camera: 'text-beam-ink', survey: 'text-lilac-ink', phone: 'text-beam-ink' }

/* The sources a teen's readings can come from, in a fixed order. */
export const sourcesOf = teen => (teen.patch ? ['patch', 'camera', 'survey'] : ['camera', 'survey'])
/* The main source, the one the card's source line names. */
export const mainSources = teen => (teen.patch ? ['patch'] : ['camera', 'survey'])

export function SourceIcon({ source, size = 18, className }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false"
      className={cn('shrink-0', TONE[source], className)}>
      {source === 'patch' && <>
        <rect x="2.5" y="6" width="19" height="12" rx="5"/>
        <path d="M6 12h2.6l1.5-2.8 2.6 5.6 1.6-2.8H18"/>
      </>}
      {source === 'camera' && <>
        <rect x="6" y="2.5" width="12" height="19" rx="2.6"/>
        <circle cx="12" cy="8" r="2.2"/>
        <path d="M10.5 18.2h3"/>
      </>}
      {source === 'phone' && <>
        <rect x="6" y="2.5" width="12" height="19" rx="2.6"/>
        <path d="M10.5 18.2h3"/>
      </>}
      {source === 'survey' && <>
        <path d="M4 5h16v11h-9l-4.5 3.5V16H4z"/>
        <path d="M8 9h8M8 12.2h5"/>
      </>}
    </svg>
  )
}

/* "Readings from [patch] Patch" or "Readings from [camera] Phone camera and
   [questions] check-in questions". One line, the same on every teen. */
export function SourceLine({ teen, className, lead = 'Readings from' }) {
  const s = mainSources(teen)
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-fine text-ink-2', className)}>
      {lead && <span className="text-ink-3">{lead}</span>}
      {s.map((k, i) => (
        <React.Fragment key={k}>
          {i > 0 && <span className="text-ink-3">and</span>}
          <span className="inline-flex items-center gap-1 font-medium text-ink">
            <SourceIcon source={k} size={18}/>{i > 0 ? SOURCE_NAME[k].toLowerCase() : SOURCE_NAME[k]}
          </span>
        </React.Fragment>
      ))}
    </span>
  )
}

/* A count per source, every source the teen can read from, zeros included,
   so two teens with the same kit read the same way. */
export function countBySource(days, list) {
  const c = Object.fromEntries(list.map(k => [k, 0]))
  for (const d of days) for (const r of d.readings) if (r.source in c) c[r.source]++
  return c
}

export function SourceCounts({ counts, className, unit = true }) {
  return (
    <ul className={cn('m-0 grid list-none gap-1.5 p-0', className)}>
      {Object.entries(counts).map(([k, n]) => (
        <li key={k} className="flex items-center gap-2 text-fine">
          <SourceIcon source={k}/>
          <span className="min-w-0 flex-1 text-ink-2">{SOURCE_NAME[k]}</span>
          <span className="shrink-0 font-display font-bold tabular-nums text-ink">{n}
            {unit && <span className="ml-1 font-body font-normal text-ink-3">{n === 1 ? 'reading' : 'readings'}</span>}</span>
        </li>
      ))}
    </ul>
  )
}
