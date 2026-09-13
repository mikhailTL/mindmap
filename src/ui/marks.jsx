import React from 'react'
import { cn } from '../lib/utils'

/* Drawn marks, no icon library.
 *
 * Each sensor's mark is the shape that signal actually draws on the chart —
 * the ECG spike, the conductance step, the slow thermal drift, the jitter of
 * movement. A heart glyph and a droplet glyph would have been two pictures of
 * nouns; these are four seconds of each trace, which is what the reading is.
 *
 * The navigational marks are a printed chart's marks: a rule with a head, a
 * single stroke pair, a struck cross. Stroke is 1.6 at a 24 box so they sit on
 * the same hairline weight as the rules around them. */

const S = ({ children, className, size = 20, ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    className={cn('shrink-0', className)} {...rest}>{children}</svg>
)

export const ArrowRight = p => <S {...p}><path d="M3.5 12h16M13.5 6l6 6-6 6"/></S>
export const ArrowLeft  = p => <S {...p}><path d="M20.5 12h-16M10.5 6l-6 6 6 6"/></S>
export const Chevron    = p => <S {...p}><path d="M9 5.5l6.5 6.5L9 18.5"/></S>
export const ChevronDown= p => <S {...p}><path d="M5.5 9l6.5 6.5L18.5 9"/></S>
export const Check      = p => <S {...p}><path d="M4 12.5l5 5L20 6.5"/></S>
export const Cross      = p => <S {...p}><path d="M6 6l12 12M18 6L6 18"/></S>
export const Minus      = p => <S {...p}><path d="M5 12h14"/></S>
export const Search     = p => <S {...p}><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></S>

/* One pulse, one response, one drift, one tremor. */
export const PulseMark  = p => <S {...p}><path d="M2 13h4l2.2-7 3 14 2.4-7H22"/></S>
export const SweatMark  = p => <S {...p}><path d="M2 17h3.5c1.6 0 2-8 4-8s2.4 8 4 8H22"/></S>
export const TempMark   = p => <S {...p}><path d="M2 8c5 0 6 2.4 10 3.6S19 14 22 16"/></S>
export const MoveMark   = p => <S {...p}><path d="M2 12h3l1-3 1.4 6L9 12h5l1-2.4L16.4 14 18 12h4"/></S>

/* A reading that exists, a reading withheld, a reading that never existed.
 * Shape carries the meaning; the colour is only reinforcement. */
export const Always     = p => <S {...p}><circle cx="12" cy="12" r="7.5" fill="currentColor" stroke="none"/></S>
export const Sometimes  = p => <S {...p}><circle cx="12" cy="12" r="7.5"/><path d="M12 4.5v15"/></S>
export const Never      = p => <S {...p}><circle cx="12" cy="12" r="7.5" opacity=".45"/><path d="M7 17L17 7"/></S>

/* Page marks for the command palette: numerals and rules, not pictograms. */
export const Rule       = p => <S {...p}><path d="M3 8h18M3 16h10"/></S>
export const Stack      = p => <S {...p}><path d="M4 7.5h16M4 12h16M4 16.5h9"/></S>
export const Frame      = p => <S {...p}><rect x="4" y="5" width="16" height="14"/><path d="M4 10h16"/></S>
export const Bracket    = p => <S {...p}><path d="M9 4H5v16h4M15 4h4v16h-4"/></S>
export const Wave       = p => <S {...p}><path d="M2 12c3 0 3-5 6-5s3 10 6 10 3-5 8-5"/></S>
export const Grid       = p => <S {...p}><path d="M4 4v16M12 4v16M20 4v16M4 9h16M4 15h16"/></S>
