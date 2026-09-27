import React from 'react'
import { cn } from '../lib/utils'

/* Ruled paper, as a background layer.
 *
 * The review asked for a notebook behind the title. The trap in that request
 * is that a notebook texture is usually an image, and an image behind a
 * headline is the fastest way to lose contrast without noticing. This is two
 * CSS gradients, so the "paper" is one-pixel lines with 37 pixels of ground
 * between them: ink #0d2b1e measures 10.0 : 1 against rule #c2d7ca, so even a
 * letter that lands square on a rule clears AA with room to spare.
 *
 * It is a background, never a border. Nothing in it is allowed to be read as
 * structure, which is why the lines are unlabelled and the pitch does not
 * match any leading on the page: a ruled field that lined up with the text
 * would look like a mistake in the text.
 */
const RULE   = '#c2d7ca'
const RULING = '#93b2a1'

/* Fades exist so the field stops somewhere other than a hard rectangle edge.
   `none` is for a field that already has a border or a ground change to end
   against. */
const FADE = {
  none:   null,
  right:  'linear-gradient(to right, #000 0 46%, rgba(0,0,0,0.42) 76%, transparent 100%)',
  bottom: 'linear-gradient(to bottom, #000 0 58%, transparent 100%)',
  radial: 'radial-gradient(120% 100% at 8% 20%, #000 0 42%, transparent 100%)',
}

export function RuledField({
  className,
  pitch = 37,          /* line spacing in px */
  offset = 0,          /* where the first rule falls, so it can miss the cap height */
  opacity = 0.5,
  fade = 'none',
}) {
  const lines = `repeating-linear-gradient(to bottom,`
    + ` transparent 0 ${pitch - 1}px, ${RULE} ${pitch - 1}px ${pitch}px)`
  const mask = FADE[fade]
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: lines,
        backgroundPosition: `0 ${offset}px`,
        opacity,
        ...(mask ? { maskImage: mask, WebkitMaskImage: mask } : null),
      }}/>
  )
}

/* The margin rule. Separate from the field because it has to land on the
   page's own left inset, which is a responsive value the field knows nothing
   about, and because a notebook margin is one line the reader can see rather
   than part of a texture. */
export function MarginRule({ className }) {
  return (
    <span aria-hidden="true"
      className={cn('pointer-events-none absolute inset-y-0 w-px', className)}
      style={{ backgroundColor: RULING, opacity: 0.38 }}/>
  )
}
