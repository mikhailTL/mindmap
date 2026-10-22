import React from 'react'
import { cn } from '../../lib/utils'

export const SOURCE_NAME = Object.freeze({ patch: 'Patch', camera: 'Phone camera', survey: 'Survey', phone: 'Phone' })
const TONE = { patch: 'text-accent-ink', camera: 'text-beam-ink', survey: 'text-lilac-ink', phone: 'text-beam-ink' }

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

// Every source the teen can read from is counted, zeros included, so teens with the same kit read alike.
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
