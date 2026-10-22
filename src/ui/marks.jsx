import React from 'react'
import { cn } from '../lib/utils'

// Stroke 1.6 in a 24 unit box, matching the hairline rules the marks sit beside.
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

/* Sensor marks: the shape each signal draws on the chart. */
export const PulseMark  = p => <S {...p}><path d="M2 13h4l2.2-7 3 14 2.4-7H22"/></S>
export const SweatMark  = p => <S {...p}><path d="M2 17h3.5c1.6 0 2-8 4-8s2.4 8 4 8H22"/></S>
export const TempMark   = p => <S {...p}><path d="M2 8c5 0 6 2.4 10 3.6S19 14 22 16"/></S>
export const MoveMark   = p => <S {...p}><path d="M2 12h3l1-3 1.4 6L9 12h5l1-2.4L16.4 14 18 12h4"/></S>

export const Always     = p => <S {...p}><circle cx="12" cy="12" r="7.5" fill="currentColor" stroke="none"/></S>
export const Sometimes  = p => <S {...p}><circle cx="12" cy="12" r="7.5"/><path d="M12 4.5v15"/></S>
export const Never      = p => <S {...p}><circle cx="12" cy="12" r="7.5" opacity=".45"/><path d="M7 17L17 7"/></S>

export const Rule       = p => <S {...p}><path d="M3 8h18M3 16h10"/></S>
export const Stack      = p => <S {...p}><path d="M4 7.5h16M4 12h16M4 16.5h9"/></S>
export const Frame      = p => <S {...p}><rect x="4" y="5" width="16" height="14"/><path d="M4 10h16"/></S>
export const Bracket    = p => <S {...p}><path d="M9 4H5v16h4M15 4h4v16h-4"/></S>
export const Wave       = p => <S {...p}><path d="M2 12c3 0 3-5 6-5s3 10 6 10 3-5 8-5"/></S>
export const Grid       = p => <S {...p}><path d="M4 4v16M12 4v16M20 4v16M4 9h16M4 15h16"/></S>

export const Person     = p => <S {...p}><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></S>
export const People     = p => <S {...p}><circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.5a3.5 3.5 0 0 1 0 6.5M18.5 13.5a6 6 0 0 1 3 5.5"/></S>
export const Key        = p => <S {...p}><circle cx="8" cy="14" r="4.5"/><path d="M11.5 10.5L20 2M16 6l2.5 2.5M13.5 8.5l2.5 2.5"/></S>
export const Download   = p => <S {...p}><path d="M12 3.5v12M7 11l5 5 5-5M4 20.5h16"/></S>
export const Copy       = p => <S {...p}><rect x="8.5" y="8.5" width="12" height="12" rx="1.5"/><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/></S>
export const Bell       = p => <S {...p}><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15ZM10 20.5a2 2 0 0 0 4 0"/></S>
export const Exit       = p => <S {...p}><path d="M14 4.5h4.5v15H14M3.5 12h11M10.5 8l4 4-4 4"/></S>
export const Plus       = p => <S {...p}><path d="M12 5v14M5 12h14"/></S>
export const Bin        = p => <S {...p}><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></S>

/* Reading marks: the two ways in and the device handshake. */
export const Camera     = p => <S {...p}><path d="M3.5 8h4l1.5-2.5h6L16.5 8h4v11h-17z"/><circle cx="12" cy="13" r="3.2"/></S>
export const Link       = p => <S {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/></S>

export const Info       = p => <S {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/></S>
export const Devices    = p => <S {...p}><rect x="3" y="5" width="13" height="10" rx="1.5"/><path d="M7 19h5M9.5 15v4"/><rect x="17" y="9" width="4.5" height="10" rx="1.2"/></S>
