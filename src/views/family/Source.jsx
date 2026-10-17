import React from 'react'
import { cn } from '../../lib/utils'
import { liveSourceLine } from './live.js'

/* Where a teen's readings come from, said the same way on every card and
 * page: a drawn mark, a short title, one line under it.
 *
 *   patch   the patch on the arm, plus the odd phone check
 *   phone   no patch: the phone camera and the check-in questions
 *   none    a linked teen with nothing yet */

export function PatchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden focusable="false" className={className}>
      <rect x="2.5" y="6.5" width="19" height="11" rx="5.5"/>
      <path d="M6 12h2.6l1.4-2.6 2.2 5.2 1.6-2.6H18"/>
    </svg>
  )
}

export function PhoneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden focusable="false" className={className}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.6"/>
      <circle cx="12" cy="7" r="1.6"/>
      <path d="M10.5 18.5h3"/>
    </svg>
  )
}

export function QuestionIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden focusable="false" className={className}>
      <rect x="3.5" y="4" width="17" height="14" rx="3"/>
      <path d="M8 18.5 7 21l4-3"/>
      <path d="M8 9h8M8 13h5"/>
    </svg>
  )
}

/* One icon per source of a single reading. */
export const SOURCE_ICON = { patch: PatchIcon, camera: PhoneIcon, survey: QuestionIcon }
export const SOURCE_NAME = { patch: 'Patch', camera: 'Phone camera', survey: 'Check-in questions' }

export function sourceOf(teen) {
  if (teen.live && !teen.hasReadings) {
    return { kind: 'none', Icon: PhoneIcon, title: 'No readings yet', line: 'Their first reading shows here.' }
  }
  if (teen.patch) {
    return { kind: 'patch', Icon: PatchIcon, title: 'Patch',
      line: teen.live ? `Readings from: ${liveSourceLine(teen).toLowerCase()}` : 'Readings from the patch, plus phone checks' }
  }
  return { kind: 'phone', Icon: PhoneIcon, title: 'Phone only, no patch',
    line: teen.live ? `Readings from: ${liveSourceLine(teen).toLowerCase()}` : 'Readings from the phone camera and check-in questions' }
}

export function SourceLine({ teen, className, compact = false }) {
  const s = sourceOf(teen)
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-field',
        compact ? 'size-8' : 'size-9',
        s.kind === 'patch' ? 'bg-accent-wash text-accent-ink' : 'bg-sky-wash text-sky-ink')}>
        <s.Icon className={compact ? 'size-[18px]' : 'size-5'}/>
      </span>
      <span className="min-w-0">
        <span className="block font-display text-ui font-bold leading-tight text-ink">{s.title}</span>
        <span className="block text-fine text-ink-2">{s.line}</span>
      </span>
    </div>
  )
}
