import React from 'react'
import { cn } from '../../lib/utils'
import { TODAY } from '../../lib/roster'

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
  log: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>
    </svg>
  ),
  recs: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>
    </svg>
  ),
}

const TONE = {
  today: 'bg-accent-wash text-accent-ink',
  trends: 'bg-card text-beam-ink',
  log: 'bg-card text-accent-ink',
  recs: 'bg-sun-wash text-sun-ink',
}

const LONG = { weekday: 'long', month: 'long', day: 'numeric' }
// The demo's fixed today, formatted in UTC to match the roster's noon-UTC dates.
// longDate formats the reader's own day for Live.
export const TODAY_LONG = new Intl.DateTimeFormat('en-US', { ...LONG, timeZone: 'UTC' })
  .format(new Date(`${TODAY}T12:00:00Z`))
export const longDate = (d = new Date()) => new Intl.DateTimeFormat('en-US', LONG).format(d)

export function PartHead({ id, kind, title, line, action, className, as: H = 'h2' }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-3">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-[12px]', TONE[kind])}>{ICONS[kind]}</span>
        <H id={id} className="m-0 shrink-0 font-display font-bold leading-none tracking-tight text-ink">{title}</H>
        <span aria-hidden className="h-[2px] min-w-6 flex-1 rounded-bar bg-ink/10"/>
        {action && <span className="shrink-0">{action}</span>}
      </div>
      {line && <p className="m-0 pl-[52px] text-fine text-ink-2">{line}</p>}
    </div>
  )
}
