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
   is mostly picture; the default is for one that is mostly read. Both shrink
   on a phone, because the review's loudest note was that a phone could not be
   scrolled past a section quickly. */
export function Section({ name, tone = 'paper', id, className, children, bleed = false, tight = false }) {
  return (
    <section id={id} className={cn(GROUND[tone] || GROUND.paper, 'border-t border-rule', className)}>
      <div className={cn(bleed ? 'w-full' : 'wrap', tight ? 'py-10 lg:py-14' : 'py-12 lg:py-20')}>
        {name && (
          <p className={cn('font-display text-tick font-bold tracking-[0.01em]', NAME[tone])}>{name}</p>
        )}
        {children}
      </div>
    </section>
  )
}

/* One heading size for a section, and nothing else. Anything on a page that is
   not this is the inconsistency the review was pointing at.
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
    <p className={cn('mt-3.5 max-w-[54ch] text-sec leading-[1.55]',
      tone === 'ink' ? 'text-mist' : 'text-ink-2', className)}>
      {children}
    </p>
  )
}
