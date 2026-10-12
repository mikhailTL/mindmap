import React from 'react'
import { cn } from '../lib/utils'

/* One drawn mark per activity.
 *
 * The toolkit list was ten headings in a column with nothing to recognise, so
 * a reader had to read every panel to find the one they wanted. Each panel now
 * opens with a drawing of what the tool actually is: concentric rings for the
 * breath, a quadrant for the map, five falling bars for the count.
 *
 * Stroke-only on currentColor, so a mark costs no colour decision and takes
 * the ink the panel gives it. Exactly one of them moves. Ten looping marks in
 * one list is a fairground, and the only loop that teaches anything is the
 * breath, which is showing its own pace before the panel is open. */

function S({ children }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden focusable="false" className="size-full"
      fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

/* Resonance Breathing: two guide rings and the disc that breathes between
   them, at the 40 in / 60 out split the pacer runs. */
export const BreathMark = () => (
  <S>
    <circle cx="20" cy="20" r="17" strokeOpacity=".32"/>
    <circle cx="20" cy="20" r="12" strokeDasharray="2 3.4" strokeOpacity=".55"/>
    <circle className="kit-breathe" cx="20" cy="20" r="9.2" fill="currentColor" stroke="none"/>
  </S>
)

/* Mood Map: the two axes and a dot off centre, because a dot in the middle
   would read as a target rather than as a reading. */
export const MapMark = () => (
  <S>
    <rect x="5.5" y="5.5" width="29" height="29" rx="3.5" strokeOpacity=".5"/>
    <path d="M5.5 20h29M20 5.5v29" strokeDasharray="2 3.4" strokeOpacity=".55"/>
    <circle cx="13" cy="13.5" r="3.6" fill="currentColor" stroke="none"/>
  </S>
)

/* Thought Reframe: a sentence with one phrase marked, and the turn back to
   write it again. */
export const ReframeMark = () => (
  <S>
    <rect x="12.5" y="16.4" width="11.5" height="7.2" rx="2.4"
      fill="currentColor" fillOpacity=".18" stroke="none"/>
    <path d="M7 12h26M7 20h17M7 28h12"/>
    <path d="M26 28h4a3.2 3.2 0 0 0 0-6.4h-1.2"/>
  </S>
)

/* 5-4-3-2-1 Grounding: the count, drawn as the count. */
export const GroundMark = () => (
  <S>
    <path d="M7 7h26M7 13.5h21M7 20h16M7 26.5h11M7 33h6" strokeWidth="2.1"/>
  </S>
)

/* Brain Dump: one pile at the top, two stacks under it, and the shorter stack
   is the one that can move today. */
export const PileMark = () => (
  <S>
    <rect x="6.5" y="6" width="27" height="5.6" rx="2.8" strokeOpacity=".5"/>
    <rect x="6.5" y="17" width="12" height="5" rx="2.5" fill="currentColor" stroke="none"/>
    <rect x="6.5" y="25.5" width="12" height="5" rx="2.5" fill="currentColor" stroke="none"/>
    <rect x="21.5" y="17" width="12" height="5" rx="2.5" strokeOpacity=".65"/>
    <rect x="21.5" y="25.5" width="12" height="5" rx="2.5" strokeOpacity=".65"/>
    <rect x="21.5" y="34" width="12" height="2.4" rx="1.2" strokeOpacity=".65"/>
  </S>
)

/* Conversation Openers: two ways of saying the same thing, one of them the
   one that lands. */
export const OpenersMark = () => (
  <S>
    <path d="M6 7h16v11H12l-4 4v-4H6z" strokeOpacity=".65"/>
    <path d="M18 21h16v11h-4l-4 4v-4H18z" fill="currentColor" fillOpacity=".16"/>
  </S>
)

/* Opening Line Check: your own line, looked at. */
export const CheckMark = () => (
  <S>
    <path d="M7 10h26M7 17h13"/>
    <circle cx="24.5" cy="24.5" r="7.2"/>
    <path d="M29.8 29.8L34.5 34.5"/>
  </S>
)

/* Reading the Mind Score: a gauge read off, with the rule under it that says
   the reading is not the whole story. */
export const GaugeMark = () => (
  <S>
    <path d="M7 27a13 13 0 0 1 26 0"/>
    <path d="M20 27l6.5-7.5"/>
    <circle cx="20" cy="27" r="2.2" fill="currentColor" stroke="none"/>
    <path d="M9 33.5h22" strokeOpacity=".45"/>
  </S>
)

/* Conversation Ground Rules: a short numbered list, read before anything is
   said. */
export const RulesMark = () => (
  <S>
    <circle cx="8.5" cy="11" r="2" fill="currentColor" stroke="none"/>
    <circle cx="8.5" cy="20" r="2" fill="currentColor" stroke="none"/>
    <circle cx="8.5" cy="29" r="2" fill="currentColor" stroke="none"/>
    <path d="M15 11h18M15 20h18M15 29h12" strokeOpacity=".7"/>
  </S>
)

/* When to Get Help: the route out of the house. */
export const HelpMark = () => (
  <S>
    <path d="M20.5 33.5H8.5a2.5 2.5 0 0 1-2.5-2.5V9a2.5 2.5 0 0 1 2.5-2.5h12"/>
    <path d="M16.5 20h17M27.5 14l6 6-6 6"/>
  </S>
)

/* The tile a mark sits in. Nested one level inside the panel, which is the
   depth the spec allows: a card holding a chip. */
export function Mark({ draw: Draw, tone = 'accent', className }) {
  return (
    <span className={cn('grid size-12 shrink-0 place-items-center rounded-field border border-rule',
      'bg-aqua p-2 sm:size-14 sm:p-2.5',
      tone === 'quiet' ? 'text-ink-2' : 'text-accent', className)}>
      <Draw/>
    </span>
  )
}
