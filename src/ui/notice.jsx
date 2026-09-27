import * as React from 'react'
import { cn } from '../lib/utils'

/* The sample-data disclosure, rebuilt as a margin note.
 *
 * What this replaces: Badge variant="demo" — a rounded-chip capsule of warn
 * text reading "Sample data — not a real person". A floating coloured pill is
 * the most recognisable generated-interface tell there is, and it was doing
 * the job badly as well as loudly: a capsule is an object, so it sat *on* the
 * page instead of *in* the text, and the disclosure it carried is a sentence,
 * not a label.
 *
 * So it is a ruled annotation now, which is the idiom this site already runs
 * on. `.mark` opens a section with a rule and sets its label on it; `.note` is
 * the caption voice. This is the same construction turned ninety degrees: the
 * rule is on the leading edge, the tag sits against it, and the disclosure is
 * ordinary body text beside it. Square corners, no fill, no shadow: it is a
 * mark on the sheet, not a thing lying on top of it.
 *
 * The tag was set in the mono face and read as a stamp: a small grey monospace
 * word at the head of a line is the badge every component library ships, and
 * with one grotesque across the site the face no longer separates it from the
 * sentence anyway. It is the same family now at a heavier weight, which is the
 * separation that was wanted, and its own colour still carries the severity.
 *
 * No background, deliberately. A bed would make it an object again, and it
 * also frees the note to sit on paper, card or mist without a contrast audit
 * per surface: every colour used here clears 4.5 : 1 on all three.
 *   warn  #99590c  5.33 paper / 4.94 mist / 5.36 card
 *   crit  #a8321f  6.50 paper / 6.02 mist / 6.55 card
 *   ink-2 #2a5744  8.00 paper / 7.40 mist / 8.30 card
 */

function Notice({ tag, tone, rule, inline, children, className }) {
  return (
    <span
      className={cn(
        'rounded-none border-l-2 pl-3',
        rule,
        /* inline-flex so it can sit on a heading's baseline without being
         * lifted out of the flow; flex with wrap so the sentence can run to
         * a second line under a long tag rather than squeezing. */
        inline
          ? 'inline-flex items-baseline gap-x-2.5 py-0.5'
          : 'flex flex-wrap items-baseline gap-x-3 gap-y-1 py-1.5',
        className
      )}
    >
      {/* Sentence case, and no letterspacing: an all-caps tracked-out word is
       * read letter by letter by some screen readers, and looked like a chip
       * even after the capsule around it went. */}
      <span className={cn('shrink-0 font-display font-bold', tone, inline ? 'text-fine' : 'text-tick')}>
        {tag}
      </span>
      <span className={cn('text-ink-2', inline ? 'text-fine' : 'max-w-[62ch] text-meta')}>
        {children}
      </span>
    </span>
  )
}

/* A caveat. warn is terracotta: out of range, not on fire. */
export function DemoNotice({ children = 'Every figure here is generated. Nobody has worn a patch and nobody was measured.', className, inline = false }) {
  return (
    <Notice tag="Demo" tone="text-warn" rule="border-warn" inline={inline} className={className}>
      {children}
    </Notice>
  )
}

/* A fault, and it takes crit for that reason. A missing device is not a
 * footnote about the data — there is no data. The rule is 3px rather than 2px
 * so the two notices are still distinguishable in grayscale, where the only
 * other difference between them is the word on the stamp. */
export function RealNotice({ children = 'No patch is paired, so there is nothing to read yet.', className, inline = false }) {
  return (
    <Notice tag="No patch" tone="text-crit" rule="border-l-[3px] border-crit" inline={inline} className={className}>
      {children}
    </Notice>
  )
}
