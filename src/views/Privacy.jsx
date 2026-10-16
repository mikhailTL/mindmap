import React from 'react'
import { ScrollIn, ScrollRow } from '../ui/motion'
import { cn } from '../lib/utils'
import { WhoSeesWhat } from '../charts/infographics'
import { SCORE, NOTES, NOTES_DEF, LOCATION, CONSENT_SHORT } from '../lib/terms'

/* Consent scope for a parent account. Moving an item between these lists is
   a consent change, not copy. Exported so tests can assert the model. */
export const YOU_SEE = [
  `The ${SCORE} for each day and week`,
  'Whether a day was above their usual',
  'Roughly how long they slept',
  'Whether the patch was worn',
  'Days slow to settle each week, never the time',
]
export const YOU_NEVER = [
  `${NOTES}. ${NOTES_DEF}`,
  LOCATION,
  'Their second-by-second readings',
  'Anything they say. The microphone is never recorded or sent',
]

/* The same promises as the two lists, as figures. No fourth may be invented. */
const LIMITS = [
  ['1 day', 'finest detail a parent sees'],
  ['0', `raw readings, ${NOTES} or ${LOCATION} shared`],
  ['5', 'smallest group a report covers'],
]

const PANEL = 'rounded-panel border border-rule bg-card'

function Figures({ items, className }) {
  return (
    <ul className={cn('m-0 flex list-none flex-wrap gap-1.5 p-0', className)}>
      {items.map(([value, label]) => (
        <li key={label} className="inline-flex items-baseline gap-1.5 rounded-chip border
          border-rule bg-paper px-2.5 py-1">
          <span className="font-mono text-ui font-bold tabular-nums leading-none text-accent">
            {value}
          </span>
          <span className="text-fine leading-none text-ink-2">{label}</span>
        </li>
      ))}
    </ul>
  )
}

function Yes() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="mt-[0.3em] size-4 shrink-0 text-accent">
      <circle cx="10" cy="10" r="8" fill="currentColor"/>
      <path d="M6 10.5l2.6 2.6L14 8" fill="none" className="stroke-card" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function No() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="mt-[0.3em] size-4 shrink-0 text-ink-3">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".5"/>
      <path d="M6.5 13.5l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function Scope({ title, meta, items, Mark, ink, index }) {
  return (
    <ScrollRow index={index} className="h-full">
      <section className={`${PANEL} flex h-full flex-col p-4 lg:p-5`}>
        <h3 className="mark flex items-baseline justify-between gap-3">
          <span className="min-w-0">{title}</span>
          <span className="tick hidden shrink-0 sm:inline">{meta}</span>
        </h3>
        <ul className="m-0 mt-1 list-none p-0">
          {items.map(t => (
            <li key={t} className={`flex items-start gap-2.5 border-b border-rule py-2
              text-meta leading-[1.4] last:border-b-0 last:pb-0 ${ink}`}>
              <Mark/>
              <span className="min-w-0">{t}</span>
            </li>
          ))}
        </ul>
      </section>
    </ScrollRow>
  )
}

export function PrivacyBody({ go }) {
  return (
    <>
      <h2 className="font-display font-bold text-ink">What Parents See</h2>

      <ScrollIn className={`${PANEL} mt-3 p-3.5`}>
        <p className="text-meta leading-[1.4] text-ink-2">{CONSENT_SHORT}</p>
        <p className="mt-1 text-meta leading-[1.4] text-ink-2">The student can switch sharing off at any time.</p>
        <Figures items={LIMITS} className="mt-2.5"/>
      </ScrollIn>

      <div className="mt-3 grid gap-3 lg:mt-4 lg:auto-rows-fr lg:grid-cols-2 lg:gap-4">
        <Scope index={0} title="What a Parent Can See" meta="with the student's consent"
          items={YOU_SEE} Mark={Yes} ink="text-ink"/>
        <Scope index={1} title="What a Parent Never Sees" meta="closed to everyone"
          items={YOU_NEVER} Mark={No} ink="text-ink-2"/>
      </div>

      <ScrollIn className="mt-3 lg:mt-4">
        <h3 className="mark">Who Can See What</h3>
        <div className="mt-3"><WhoSeesWhat/></div>
      </ScrollIn>
    </>
  )
}
