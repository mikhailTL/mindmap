import React from 'react'
import { RainbowDial } from '../../charts/rainbow'
import { studentRings } from '../../lib/readings'
import { AvatarArt } from '../../account/avatars'
import { LampFace } from '../../traffic/Face'
import { cn } from '../../lib/utils'

/* The pictures on the Medical Professional home. All of it is art: nothing
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

/* A week of lamp faces in a row, the way a Trends chart sets them under its
   bars. A fixed pattern, not a teen's week. */
const WEEK = ['green', 'green', 'yellow', 'green', 'red', 'yellow', 'green']
export function FaceRow({ size = 22, className }) {
  return (
    <span aria-hidden className={cn('flex items-center gap-1.5', className)}>
      {WEEK.map((k, i) => <LampFace key={i} light={k} size={size}/>)}
    </span>
  )
}

/* Three people, linked: a parent, a teen and you. */
export function LinkArt({ className }) {
  return (
    <span aria-hidden className={cn('relative block h-[76px] w-[168px]', className)}>
      <svg viewBox="0 0 168 76" className="absolute inset-0 size-full" fill="none">
        <path d="M30 40 C 56 8, 92 8, 84 38 S 120 70, 138 40" stroke="#067049" strokeWidth="2.5"
          strokeDasharray="5 6" strokeLinecap="round"/>
      </svg>
      <span className="absolute left-0 top-[14px] size-[52px] rounded-full ring-[3px] ring-white">
        <AvatarArt id="sym-flower" className="size-full"/></span>
      <span className="absolute left-[58px] top-[10px] size-[56px] rounded-full ring-[3px] ring-white">
        <AvatarArt id="fox" className="size-full"/></span>
      <span className="absolute left-[116px] top-[14px] size-[52px] rounded-full ring-[3px] ring-white">
        <AvatarArt id="sym-leaf" className="size-full"/></span>
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

/* Three of the professional tools, as tilted cards. These names are the
   Toolkit's own. */
const TOOLS = [
  ['Session Openers', 'bg-white text-sun-ink border-sun/60', '-rotate-6'],
  ['Grounding Timer', 'bg-sky-wash text-sky-ink border-sky/50', 'rotate-3'],
  ['Referral Note', 'bg-blush-wash text-blush-ink border-blush/50', '-rotate-2'],
]
export function ToolArt({ className }) {
  return (
    <span aria-hidden className={cn('flex flex-col items-end gap-1', className)}>
      {TOOLS.map(([name, tone, tilt], i) => (
        <span key={name} className={cn('block whitespace-nowrap rounded-[9px] border-2 px-2.5 py-1 font-display text-fine font-bold',
          tone, tilt, i === 1 && 'mr-4')}>{name}</span>
      ))}
    </span>
  )
}
