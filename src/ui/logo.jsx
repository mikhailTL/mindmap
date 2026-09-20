import React from 'react'
import { cn } from '../lib/utils'

/* The MindMap mark.
 *
 * Two ideas had to land in one shape, and the shape had to survive 16px.
 *
 *  - The product is a patch: a wide, fully radiused stadium. That silhouette
 *    is already the most recognisable thing the project owns — the hero
 *    drawing, the hardware page, the intro — so the mark is that outline
 *    rather than a new invention.
 *  - Inside it, one continuous stroke rises and falls across two peaks. It is
 *    three things at once and deliberately so: a day of readings, a ridge line
 *    on a map, and an M. The terminal dot is where the reading lands today,
 *    which is how every chart on this site already marks "now".
 *
 * The first version put concentric contour rings around a centre dot. Rendered
 * at 96px it was unmistakably an eye — pupil, iris, and the trailing stroke
 * reading as a lash. An eye is the worst possible mark for a product whose
 * entire argument is that it is not surveillance, so the rings are gone and
 * nothing in the mark is closed or centred any more.
 *
 * Everything is `currentColor` except the terminal dot, which takes the
 * accent. So the mark inherits whatever it sits on — ink on paper, paper on
 * ink in the header — and needs no second variant.
 */

export function LogoMark({ className, title }) {
  return (
    <svg viewBox="0 0 40 28" className={className} role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true} aria-label={title}>
      {/* the patch: a 36 x 20 stadium, the same 1.8:1 the hardware drawing uses */}
      <rect x="2" y="4" width="36" height="20" rx="10"
        fill="none" stroke="currentColor" strokeWidth="2.2"/>
      {/* one stroke: the day, the ridge, the M. Round joins so it stays soft
          next to Quicksand rather than turning into a zigzag. */}
      <path d="M10.5 18.2 15 10.2 20 15.8 25.4 11 29.5 17.6"
        fill="none" stroke="currentColor" strokeWidth="2.3"
        strokeLinecap="round" strokeLinejoin="round"/>
      {/* where it lands today — held off the stadium wall, because at 96px a
          dot tangent to the outline reads as a clipped stroke, not a marker */}
      <circle cx="29.5" cy="17.6" r="2.4" fill="var(--logo-peak, currentColor)"/>
    </svg>
  )
}

/* The lockup. `tone` picks which colour the second half of the word takes: on
   paper it is the accent, on an ink field both halves stay in the field's own
   foreground, because accent on ink does not clear 4.5:1. */
export function Logo({ className, markClassName, tone = 'paper', title = 'MindMap' }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={cn('h-[1.15em] w-auto shrink-0', markClassName)}/>
      <span className="font-display font-medium leading-none tracking-[-0.015em]">
        Mind<span className={tone === 'paper' ? 'text-accent' : undefined}>Map</span>
      </span>
      <span className="sr-only">{title}</span>
    </span>
  )
}
