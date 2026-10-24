import React from 'react'
import { ScrollIn, ScrollRow } from '../ui/motion'
import { cn } from '../lib/utils'
import { cardClass, cardInk } from '../ui/card'
import { WhoSeesWhat } from '../charts/infographics'
import { SCORE, NOTES, NOTES_DEF, LOCATION, CONSENT_SHORT } from '../lib/terms'

// Consent scope for a parent account: moving an item between these lists changes what is shared.
export const YOU_SEE = [
  `The ${SCORE} for each day, over weeks and months`,
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

const DayDrawing = () => (
  <svg viewBox="0 0 64 56" aria-hidden className="h-12 w-14 shrink-0">
    <rect x="6" y="9" width="52" height="42" rx="6" className="fill-card stroke-sky-ink" strokeWidth="2.5"/>
    <path d="M6 15a6 6 0 0 1 6-6h40a6 6 0 0 1 6 6v6H6z" className="fill-sky"/>
    <path d="M20 4v10M44 4v10" className="stroke-ink-2" strokeWidth="3" strokeLinecap="round"/>
    <rect x="24" y="28" width="16" height="15" rx="3" className="fill-sun"/>
    <path d="M12 31h6M12 39h6M46 31h6M46 39h6" className="stroke-rule" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)
const FileDrawing = () => (
  <svg viewBox="0 0 64 56" aria-hidden className="h-12 w-14 shrink-0">
    <path d="M16 4h22l12 12v36H16z" className="fill-card stroke-ink-3" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M38 4v12h12" fill="none" className="stroke-ink-3" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M22 24h20M22 31h20M22 38h13" className="stroke-rule" strokeWidth="3" strokeLinecap="round"/>
    <path d="M8 50L56 8" className="stroke-coral" strokeWidth="4.5" strokeLinecap="round"/>
  </svg>
)
const GroupDrawing = () => {
  const hues = ['fill-mint', 'fill-lilac', 'fill-sky', 'fill-sun', 'fill-blush']
  return (
    <svg viewBox="0 0 76 56" aria-hidden className="h-12 w-16 shrink-0">
      {hues.map((h, i) => {
        const x = 8 + i * 15, y = i % 2 ? 22 : 16
        return (
          <g key={h} className={h}>
            <circle cx={x} cy={y} r="5.5"/>
            <path d={`M${x - 7} ${y + 26}a7 9 0 0 1 14 0v2h-14z`} transform={`translate(0 -10)`}/>
          </g>
        )
      })}
    </svg>
  )
}

const LIMITS = [
  { value: '1 day', label: 'finest detail a parent sees', Draw: DayDrawing },
  { value: '0', label: `raw readings, ${NOTES} or ${LOCATION} shared`, Draw: FileDrawing },
  { value: '5', label: 'smallest group a report covers', Draw: GroupDrawing },
]

const PANEL = 'rounded-panel border border-rule bg-card'

function Figures({ items, className }) {
  return (
    <ul className={cn('m-0 grid list-none grid-cols-1 p-0 sm:grid-cols-3', className)}>
      {items.map(({ value, label, Draw }, i) => (
        <li key={label}
          className={cn('flex items-center gap-3.5 py-3 sm:flex-col sm:items-start sm:gap-2 sm:px-4 sm:py-1',
            i > 0 && 'border-t border-rule sm:border-l sm:border-t-0', i === 0 && 'sm:pl-0')}>
          <span className="flex w-16 shrink-0 justify-center sm:justify-start"><Draw/></span>
          <span className="min-w-0">
            <span className="block font-display text-stat font-bold tabular-nums leading-none text-accent-ink">
              {value}
            </span>
            <span className="mt-1 block text-fine leading-snug text-ink-2">{label}</span>
          </span>
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

// Shared items sit on the mint wash and withheld items on an outline, so the open side reads as open.
function Scope({ title, meta, items, Mark, ink, index, variant = 'plain', hue = 'accent' }) {
  return (
    <ScrollRow index={index} className="h-full">
      <section className={cn(cardClass(variant, hue), 'flex h-full flex-col p-4 lg:p-5')}>
        <h3 className="mark flex items-baseline justify-between gap-3">
          <span className="min-w-0">{title}</span>
          <span className="tick hidden shrink-0 sm:inline">{meta}</span>
        </h3>
        <ul className="m-0 mt-1 list-none p-0">
          {items.map(t => (
            <li key={t} className={cn('flex items-start gap-2.5 border-b py-2',
              'text-meta leading-[1.4] last:border-b-0 last:pb-0', cardInk(variant, hue).line, ink)}>
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

      <ScrollIn className={`${PANEL} mt-3 p-4 lg:p-5`}>
        <p className="text-meta leading-[1.4] text-ink-2">{CONSENT_SHORT}</p>
        <p className="mt-1 text-meta leading-[1.4] text-ink-2">The teen can switch sharing off at any time.</p>
        <Figures items={LIMITS} className="mt-3 border-t border-rule pt-1 sm:pt-4"/>
      </ScrollIn>

      <div className="mt-3 grid gap-3 lg:mt-4 lg:auto-rows-fr lg:grid-cols-2 lg:gap-4">
        <Scope index={0} title="What a Parent Can See" meta="with the teen's consent"
          items={YOU_SEE} Mark={Yes} ink="text-ink" variant="tint" hue="mint"/>
        <Scope index={1} title="What a Parent Never Sees" meta="closed to everyone"
          items={YOU_NEVER} Mark={No} ink="text-ink-2" variant="outline"/>
      </div>

      <ScrollIn className="mt-3 lg:mt-4">
        <h3 className="mark">Who Can See What</h3>
        <div className="mt-3"><WhoSeesWhat/></div>
      </ScrollIn>
    </>
  )
}
