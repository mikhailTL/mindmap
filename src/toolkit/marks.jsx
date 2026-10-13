import React from 'react'
import { cn } from '../lib/utils'

/* One small drawn mark per activity, 40 by 40.
 *
 * The Toolkit used to open each card with a 440 by 150 scene, which is what
 * made the list a stack of posters. The index is now a tight list of rows, so
 * the drawing is a 40px block that sits in the row rather than a picture the
 * row is built around. Flat blocks, discs and rounded ends in the activity's
 * own two tones: the brutalist half is the edge and the block, the calm half
 * is the radius. No outline-icon vocabulary, no mascot, no face.
 *
 * Nothing in here loops. A list of five looping drawings is a fairground and
 * the reader came here because the day had already been loud. */

function Tile({ children }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden focusable="false" className="size-full">
      {children}
    </svg>
  )
}

/* Box Breathing: the square the pace is named after, with the breath at its
   centre. Four equal sides, four equal counts. */
export const BreathMark = () => (
  <Tile>
    <rect x="6" y="6" width="28" height="28" rx="7" className="kit-s" fill="none" strokeWidth="3"/>
    <circle cx="20" cy="20" r="7" className="kit-f-art"/>
  </Tile>
)

/* Body Scan: attention moving down, drawn as four bars narrowing toward the
   feet, with the live one filled. */
export const ScanMark = () => (
  <Tile>
    <rect x="8"  y="7"  width="24" height="5" rx="2.5" className="kit-f"/>
    <rect x="10" y="16" width="20" height="5" rx="2.5" className="kit-f-art"/>
    <rect x="12" y="25" width="16" height="5" rx="2.5" className="kit-f-art" opacity="0.6"/>
    <rect x="15" y="33" width="10" height="4" rx="2"   className="kit-f-art" opacity="0.4"/>
  </Tile>
)

/* Movement: three steps rising, the last one rounded off, so the mark reads as
   going somewhere rather than as a bar chart. */
export const MoveMark = () => (
  <Tile>
    <rect x="5"  y="24" width="8" height="11" rx="3" className="kit-f-art" opacity="0.55"/>
    <rect x="16" y="17" width="8" height="18" rx="3" className="kit-f-art"/>
    <rect x="27" y="8"  width="8" height="27" rx="4" className="kit-f"/>
  </Tile>
)

/* Grounding: five, four, three, two, one, counted down the tile. */
export const GroundMark = () => (
  <Tile>
    {[5, 4, 3, 2, 1].map((n, row) => (
      <g key={n}>
        {Array.from({ length: n }, (_, i) => (
          <circle key={i} cx={6 + i * 7} cy={7 + row * 6.5} r="2.3"
            className={row === 0 ? 'kit-f' : 'kit-f-art'}
            opacity={row === 0 ? 1 : 0.85 - row * 0.12}/>
        ))}
      </g>
    ))}
  </Tile>
)

/* Thought Reframe: one block lifted off the line and set level again, which is
   what the tool does to a sentence. */
export const ReframeMark = () => (
  <Tile>
    <rect x="6"  y="10" width="13" height="9" rx="3" className="kit-f-art" opacity="0.5"
      transform="rotate(-9 12.5 14.5)"/>
    <rect x="21" y="21" width="13" height="9" rx="3" className="kit-f"/>
    <rect x="6"  y="33" width="28" height="3" rx="1.5" className="kit-f-art"/>
  </Tile>
)

/* The parent set. Two blocks facing each other, a line being checked, a dial,
   a rule and a route out. Same vocabulary, same tile. */
export const TalkMark = () => (
  <Tile>
    <rect x="4" y="8"  width="19" height="13" rx="4" className="kit-f"/>
    <rect x="17" y="21" width="19" height="13" rx="4" className="kit-f-art" opacity="0.75"/>
  </Tile>
)

export const CheckLineMark = () => (
  <Tile>
    <rect x="5" y="11" width="30" height="4" rx="2" className="kit-f-art" opacity="0.5"/>
    <rect x="5" y="20" width="18" height="4" rx="2" className="kit-f-art" opacity="0.5"/>
    <path d="M9 31.5 15 36.5 31 21.5" fill="none" className="kit-s" strokeWidth="3.4"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Tile>
)

export const DialMark = () => (
  <Tile>
    <path d="M6 28a14 14 0 0 1 28 0" fill="none" className="kit-s-art" strokeWidth="3.6"
      strokeLinecap="round"/>
    <rect x="18.6" y="13" width="2.8" height="15" rx="1.4" className="kit-f"
      transform="rotate(32 20 28)"/>
    <circle cx="20" cy="28" r="3.4" className="kit-f"/>
  </Tile>
)

export const RulesMark = () => (
  <Tile>
    <rect x="6" y="9"  width="28" height="4" rx="2" className="kit-f"/>
    <rect x="6" y="18" width="21" height="4" rx="2" className="kit-f-art" opacity="0.8"/>
    <rect x="6" y="27" width="25" height="4" rx="2" className="kit-f-art" opacity="0.55"/>
  </Tile>
)

export const ReachMark = () => (
  <Tile>
    <circle cx="13" cy="20" r="8" className="kit-f-art" opacity="0.6"/>
    <path d="M22 20h11m-4.5-4.5L33 20l-4.5 4.5" fill="none" className="kit-s" strokeWidth="3.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Tile>
)

/* The mark in its frame: a 44px block of card stock with the activity's edge
   around it, so the row has one object in it rather than a floating glyph. */
export function Mark({ draw: Draw, className }) {
  return (
    <span aria-hidden className={cn('grid size-11 shrink-0 place-items-center rounded-panel',
      'border-2 border-ink bg-card p-1.5', className)}>
      <Draw/>
    </span>
  )
}
