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

/* The lockup. `tone` picks which green the second half of the word takes: the
   accent on paper, accent-lit on an ink field. It is always green. */
export function Logo({ className, markClassName, tone = 'paper', title = 'MindMap', motto = false }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={cn('h-[1.15em] w-auto shrink-0', markClassName)}/>
      <span className="font-display font-bold leading-none tracking-[-0.015em]">
        {/* "Map" is green wherever the mark appears, which the review asked
            for by name. On the dark band it cannot be `accent`: that measures
            2.80 : 1 on ink and fails outright, so the band gets `accent-lit`
            at 7.67 : 1. Same colour idea, two values, because one value cannot
            be legible on both grounds. */}
        Mind<span className={tone === 'paper' ? 'text-accent' : 'text-accent-lit'}>Map</span>
      </span>
      {/* The review asked for the motto on the mark. It sits beside the
          wordmark rather than under the whole lockup: centred underneath it
          starts reading as a tagline inside a logo, which is the thing that
          dates a mark fastest. Hidden below sm — at 390 the bar has six tabs
          to fit and four words of explanation is what gives way first. */}
      {motto && (
        <span className={cn('hidden whitespace-nowrap font-body text-meta font-normal leading-none sm:inline',
          tone === 'paper' ? 'text-ink-3' : 'text-rule')}>
          teen wellness app
        </span>
      )}
      <span className="sr-only">{title}</span>
    </span>
  )
}
