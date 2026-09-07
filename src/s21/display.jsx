import React from 'react'
import { cn } from '../lib/utils'

/* Display primitives from the s21 kit. The dark-site tokens are gone; the
   status ramp is re-pointed at the clinical roles (amber = out of range,
   red = critical and reserved). */

const STATUS = {
  Urgent:   'border-crit/40 text-crit bg-crit/5',
  Elevated: 'border-warn/40 text-warn bg-warn/5',
  Watch:    'border-warn/25 text-warn',
  Steady:   'border-rule text-ink-2',
  Settled:  'border-calm/40 text-calm bg-calm/5',
}
export function StatusPill({ status, className }) {
  return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-xs border px-2 py-0.5',
    'font-mono text-label uppercase tracking-[0.1em]', STATUS[status] || STATUS.Steady, className)}>
    <span aria-hidden className="size-1.5 rounded-full bg-current"/>{status}</span>
}
export function Badge({ children, tone = 'quiet', className }) {
  const tones = { quiet:'border-rule text-ink-2', accent:'border-accent/35 text-accent bg-accent-wash' }
  return <span className={cn('inline-flex items-center rounded-xs border px-2 py-0.5 font-mono',
    'text-label uppercase tracking-[0.1em]', tones[tone], className)}>{children}</span>
}
export function Progress({ value = 0, label, className }) {
  const v = Math.max(0, Math.min(100, value))
  return <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-sage', className)}
    role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
    <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: v + '%' }}/>
  </div>
}
export function Kbd({ children, className }) {
  return <kbd className={cn('rounded-xs border border-rule px-1.5 py-0.5 font-mono text-[0.9375rem] text-ink-3', className)}>{children}</kbd>
}
export function EmptyState({ title, body, className }) {
  return <div className={cn('rounded border border-dashed border-rule bg-sage/30 p-8 text-center', className)}>
    <p className="font-display text-row font-bold text-ink">{title}</p>
    <p className="mx-auto mt-2 max-w-[42ch] text-sec text-ink-2">{body}</p>
  </div>
}
export function Panel({ children, label, action, className, as:H = 'h2' }) {
  return (
    <section className={cn(className)}>
      {(label || action) && (
        <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-rule pb-2.5">
          <H className="lab font-normal">{label}</H>
          {action && <span className="text-sec text-ink-3">{action}</span>}
        </div>
      )}
      {children}
    </section>
  )
}
