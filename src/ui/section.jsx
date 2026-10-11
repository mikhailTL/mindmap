import React from 'react'
import { cn } from '../lib/utils'

/* A page section, and the only way one is made.
 *
 * Every section on the site used to declare its own ground, its own heading
 * size and its own top padding at the call site, so no two agreed and each
 * one blended into the next. This component owns all three, so a section
 * cannot be built wrong.
 *
 * `tone` is the ladder. Alternating the two near-whites is not a separation
 * anybody notices: measured against each other, paper and card differ by about
 * 2% in luminance. The dark band is the separation. One inverted section
 * partway down cuts the page in half and everything after it reads as after.
 * Used once per page, never twice.
 *
 * The counting numerals are gone. A section used to open "03 · Why it
 * matters", and numbering a reader through a website is a thing websites do
 * not need to do: it told a visitor how much was left, not what it was.
 */
const GROUND = {
  paper: 'bg-paper text-ink',
  card:  'bg-card text-ink',
  mist:  'bg-mist text-ink',
  ink:   'bg-ink text-paper',
}

/* The label over a heading, when there is one. accent on light; on the dark
   band accent measures 2.80 : 1 and fails, so the band gets accent.lit at
   7.67 : 1. */
const NAME = {
  paper: 'text-accent',
  card:  'text-accent',
  mist:  'text-accent',
  ink:   'text-accent-lit',
}

/* Padding is two steps, not a number per section. `tight` is for a band that
   is mostly picture; the default is for one that is mostly read.

   Both have come down twice now, by about a quarter and then again by about
   a sixth. Generous padding was doing the work of hierarchy, and two separate
   reviews named the same symptom: bands "filled with nothing", sections
   "unnecessarily larger", and a page that takes too much scrolling to get
   through. Space between things is not free, and on a phone it is the most
   expensive thing on the page. */
export function Section({ name, tone = 'paper', id, className, children, bleed = false, tight = false }) {
  return (
    <section id={id} className={cn(GROUND[tone] || GROUND.paper, 'border-t border-rule', className)}>
      <div className={cn(bleed ? 'w-full' : 'wrap', tight ? 'py-6 lg:py-9' : 'py-8 lg:py-12')}>
        {name && (
          <p className={cn('font-mono text-body font-bold tracking-[0.005em]', NAME[tone])}>{name}</p>
        )}
        {children}
      </div>
    </section>
  )
}

/* One heading size for a section, and nothing else. Anything on a page that is
   not this is the inconsistency the review was pointing at.

   `text-sub` is 28px to 40px. It was 26-36, went to 32-48 because a reader
   could not tell a new section had started, and has come back to 28-40
   because 48 was pushing every section's contents down a line for a
   difference nobody was asking for. The ratio is what the first complaint was
   actually about and the ratio survives: 28 over 19 is 1.47 at the narrow end
   and 40 over 18 is 2.2 at the wide one, against the 1.37 that failed.
 *
 * font-bold, not font-medium. The whole site was set at 500, so a heading
 * differed from the paragraph under it by size alone and, at the smaller
 * steps, barely by that. Quicksand is variable to 700 and 700 is loaded now. */
export function SectionHead({ children, tone = 'paper', className }) {
  return (
    /* text-sub, which is clamp(27px, 2.5vw, 38px): one step that grows with
       the viewport. It was `text-view lg:text-head`, which is 34px on a phone
       shrinking to 27px on a desktop, so the heading got smaller as the screen
       got bigger, on every section of the page. */
    <h2 className={cn('mt-3 font-display font-bold text-sub leading-[1.12] tracking-tight',
      tone === 'ink' ? 'text-paper' : 'text-ink', className)}>
      {children}
    </h2>
  )
}

export function SectionLede({ children, tone = 'paper', className }) {
  return (
    <p className={cn('mt-3 max-w-[54ch] text-sec leading-[1.55]',
      tone === 'ink' ? 'text-mist' : 'text-ink-2', className)}>
      {children}
    </p>
  )
}
