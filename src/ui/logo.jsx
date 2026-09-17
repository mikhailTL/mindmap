import React from 'react'
import { cn } from '../lib/utils'

/* The MindMap mark — now the authoritative geometry, not a lookalike.
 *
 * The DI-03 hardware package ships `brand/mindmap-logo-trace.svg`: the capsule,
 * ridge and endpoint fitted to the supplied artwork and engraved 0.25 mm deep
 * into the shell at 11.5 mm nominal width. The numbers below are that trace,
 * verbatim, so the mark on the website and the mark moulded into the product
 * are one drawing rather than two drawings that agree approximately.
 *
 * viewBox is the capsule's own bounds plus half a stroke. The trace file is
 * 81 x 42 because the raster it was fitted to included the wordmark; cropping
 * to the capsule is what lets the mark sit on a text baseline.
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
    <svg viewBox="18.24 5.02 52.96 30.78" className={className} role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true} aria-label={title}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <rect x="19.7713" y="6.54038" width="49.9005" height="27.72706" rx="13.86353"
          strokeWidth="3.04576"/>
        <polyline points="31.59159,26.20790 37.77524,15.11859 44.67690,22.87136
          52.17522,16.26416 57.88540,25.38775" strokeWidth="3.21289"/>
      </g>
      <circle cx="57.8854" cy="25.38775" r="3.38146" fill="var(--logo-peak, currentColor)"/>
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
