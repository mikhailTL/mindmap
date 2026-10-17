import React from 'react'
import { cn } from '../../lib/utils'
import { TODAY } from '../../lib/roster'

/* The two parts of the student screen, Today and Trends, each open on one of
 * these: an icon tile, the part's name, a rule running to the edge, and one
 * line under it. Same shape both times, so the change of part reads at a
 * glance. */

const ICONS = {
  today: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>
    </svg>
  ),
  trends: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9h18M8 2.8v3.4M16 2.8v3.4"/>
      <path d="M6.5 17l3-3.2 2.6 2 4.4-4.6"/>
    </svg>
  ),
}

const TONE = {
  today: 'bg-accent-wash text-accent-ink',
  trends: 'bg-card text-beam-ink',
}

/* "Friday, October 16": the demo's today, and the reader's own for Live. */
const LONG = { weekday: 'long', month: 'long', day: 'numeric' }
export const TODAY_LONG = new Intl.DateTimeFormat('en-US', { ...LONG, timeZone: 'UTC' })
  .format(new Date(`${TODAY}T12:00:00Z`))
export const longDate = (d = new Date()) => new Intl.DateTimeFormat('en-US', LONG).format(d)

export function PartHead({ id, kind, title, line, className }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-3">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-[12px]', TONE[kind])}>{ICONS[kind]}</span>
        <h2 id={id} className="m-0 shrink-0 font-display font-bold leading-none tracking-tight text-ink">{title}</h2>
        <span aria-hidden className="h-[2px] min-w-6 flex-1 rounded-bar bg-ink/10"/>
      </div>
      {line && <p className="m-0 pl-[52px] text-fine text-ink-2">{line}</p>}
    </div>
  )
}
