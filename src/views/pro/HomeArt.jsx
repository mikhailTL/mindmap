import React from 'react'
import { RainbowDial } from '../../charts/rainbow'
import { studentRings } from '../../lib/readings'
import { AvatarArt } from '../../account/avatars'
import { cn } from '../../lib/utils'

/* The pictures on the Counselor/Professional home. All of it is art: nothing
 * here is a reading, a count of a light or anyone's score. Each picture is
 * aria-hidden, since the card's own words say where it goes. */

/* The Mind Score rainbow as a picture: four bands drawn full and bright, the
   clouds on, and every number and scale word hidden, so it cannot be read as
   anyone's score. */
const ART_FILL = [88, 74, 60, 46]
export function RainbowArt({ size = 240, className }) {
  const rings = React.useMemo(() => studentRings().map((r, i) => ({ ...r, value: ART_FILL[i] ?? r.value })), [])
  return (
    <div aria-hidden className={cn('pointer-events-none [&_.text-dial]:invisible [&_.text-tick]:invisible',
      '[&_svg_text]:hidden', className)}>
      <RainbowDial score={0} rings={rings} size={size}/>
    </div>
  )
}

/* Three avatars joined by a dotted thread: a family linking up. Sized in
   percent of its own box, so it scales with the half-tile it sits in. */
export function LinkArt({ className }) {
  return (
    <span aria-hidden className={cn('relative block aspect-[168/76] w-[168px]', className)}>
      <svg viewBox="0 0 168 76" className="absolute inset-0 size-full" fill="none">
        <path d="M30 40 C 56 8, 92 8, 84 38 S 120 70, 138 40" stroke="#067049" strokeWidth="2.5"
          strokeDasharray="5 6" strokeLinecap="round"/>
      </svg>
      <span className="absolute left-0 top-[18%] aspect-square w-[31%] rounded-full ring-2 ring-white">
        <AvatarArt id="initials-E" className="size-full"/></span>
      <span className="absolute left-[34.5%] top-[13%] aspect-square w-[33.3%] rounded-full ring-2 ring-white">
        <AvatarArt id="fox" className="size-full"/></span>
      <span className="absolute left-[69%] top-[18%] aspect-square w-[31%] rounded-full ring-2 ring-white">
        <AvatarArt id="initials-S" className="size-full"/></span>
    </span>
  )
}

/* Two speech bubbles: a question, and the answer being written. */
export function ChatArt({ className }) {
  return (
    <svg aria-hidden viewBox="0 0 150 84" className={cn('block h-[84px] w-[150px]', className)}>
      <path d="M8 8h84a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10H34l-14 12V48h-2A10 10 0 0 1 8 38V18A10 10 0 0 1 18 8z"
        fill="#ffffff" stroke="#6f09b2" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M26 22h56M26 33h36" stroke="#6f09b2" strokeWidth="3" strokeLinecap="round"/>
      <path d="M60 40h72a10 10 0 0 1 10 10v14a10 10 0 0 1-10 10h-2v10l-12-10H60a10 10 0 0 1-10-10V50a10 10 0 0 1 10-10z"
        fill="#a024f2"/>
      <circle cx="80" cy="57" r="4.5" fill="#fff"/><circle cx="96" cy="57" r="4.5" fill="#fff"/>
      <circle cx="112" cy="57" r="4.5" fill="#fff"/>
    </svg>
  )
}

/* Three of the professional tools as tilted cards, drawn rather than
   written so they still read at half a tile: a conversation opener, a
   grounding timer and a referral note. */
export function ToolArt({ className }) {
  return (
    <svg aria-hidden viewBox="0 0 120 92" className={cn('block h-[92px] w-[120px] overflow-visible', className)}
      fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g transform="rotate(-8 34 46)">
        <rect x="6" y="18" width="52" height="62" rx="9" fill="#ffffff" stroke="#b5871b" strokeWidth="2.4"/>
        <path d="M16 34h24a5 5 0 0 1 5 5v6a5 5 0 0 1-5 5h-14l-6 5v-5h-4a5 5 0 0 1-5-5v-6a5 5 0 0 1 5-5z"
          fill="#f0cf7a"/>
        <path d="M16 64h32M16 71h20" stroke="#b5871b" strokeWidth="2.4"/>
      </g>
      <g transform="rotate(5 86 44)">
        <rect x="60" y="10" width="52" height="62" rx="9" fill="#def0fc" stroke="#2294e6" strokeWidth="2.4"/>
        <circle cx="86" cy="38" r="15" fill="#ffffff" stroke="#2294e6" strokeWidth="2.4"/>
        <path d="M86 29v9l6 4" stroke="#2294e6" strokeWidth="2.6"/>
        <path d="M72 62h28" stroke="#2294e6" strokeWidth="2.4"/>
      </g>
      <g transform="rotate(-3 62 70)">
        <rect x="36" y="50" width="52" height="38" rx="8" fill="#fce6f1" stroke="#f2248b" strokeWidth="2.4"/>
        <path d="M46 62h22M46 70h32M46 78h14" stroke="#f2248b" strokeWidth="2.4"/>
      </g>
    </svg>
  )
}
