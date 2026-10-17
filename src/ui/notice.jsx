import * as React from 'react'
import { cn } from '../lib/utils'

/* The sample-data disclosure, as a ruled margin note. No background, so it can
   sit on paper, card or mist without a contrast audit per surface: warn, crit
   and ink-2 all clear 4.5:1 on all three (worst case warn on mist, 4.94:1).
   Do not lighten any of the three. */

function Notice({ tag, tone, rule, inline, children, className }) {
  return (
    <span
      className={cn(
        'rounded-none border-l-2 pl-3',
        rule,
        inline
          ? 'inline-flex items-baseline gap-x-2.5 py-0.5'
          : 'flex flex-wrap items-baseline gap-x-3 gap-y-1 py-1.5',
        className
      )}
    >
      {/* Sentence case, no letterspacing: an all-caps tracked-out word is read
       * letter by letter by some screen readers. */}
      <span className={cn('shrink-0 font-display font-bold', tone, inline ? 'text-fine' : 'text-tick')}>
        {tag}
      </span>
      <span className={cn('text-ink-2', inline ? 'text-fine' : 'max-w-[62ch] text-meta')}>
        {children}
      </span>
    </span>
  )
}

export function DemoNotice({ children = 'Figures shown are sample data.', className, inline = false }) {
  return (
    <Notice tag="Demo" tone="text-warn" rule="border-warn" inline={inline} className={className}>
      {children}
    </Notice>
  )
}

/* 3px rule, not 2px: in grayscale the tag word is the only other difference
   between the two notices. */
export function RealNotice({ children = 'No patch is paired, so there is nothing to read yet.', className, inline = false }) {
  return (
    <Notice tag="No patch" tone="text-crit" rule="border-l-[3px] border-crit" inline={inline} className={className}>
      {children}
    </Notice>
  )
}

/* Neutral, for a note that is neither sample data nor a missing pairing: an
   ink tag on an accent rule, no alarm colour. */
export function PatchNotice({ children = 'Patch use is optional but recommended.', className, inline = false }) {
  return (
    <Notice tag="Patch" tone="text-ink" rule="border-accent" inline={inline} className={className}>
      {children}
    </Notice>
  )
}
