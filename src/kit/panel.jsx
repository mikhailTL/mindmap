import React from 'react'
import * as C from '@radix-ui/react-collapsible'
import { Chevron } from '../ui/marks'
import { Art } from './glyphs'
import { vars } from './palette'
import { cn } from '../lib/utils'
import './kit.css'

/* Shared shell for the toolkit, and the whole of why this page stopped
 * reading as a settings screen.
 *
 * It used to be a hairline border, a white ground and a 48px line glyph, ten
 * times in a column, in one colour. Correct and cold. design-spec 7b lifts the
 * restraint on exactly this page, so a card is now a flat block of the
 * activity's own wash, a heavy ink edge, a hard offset shadow in the
 * activity's own colour rather than in grey, a drawn scene across the top of
 * it, and a confident name under that.
 *
 * WHY THE COLOUR IS A WASH AND NOT A FILL. Young people asked for muted over
 * vivid when they were shown mental health app designs: a bright screen on a
 * bad day "is shouty, it hurts your head" (Western Sydney / UTS, Desirable
 * design, 2022). So the brutalist half of this is the edge, the shadow, the
 * block and the type, and never the saturation.
 *
 * The whole card is the trigger, which is a 300px target rather than a 44px
 * one, and the press runs through the shadow: the block travels along its own
 * offset and the shadow shortens by the same amount, so it reads as pushed.
 *
 * Panels are independent rather than an accordion: closing one to open
 * another would throw away whatever the reader had typed in it. Radix unmounts
 * closed content, so a closed tool holds no state and runs no loop. */

export function Panel({ id, kit, title, time, lede, mark, open, onOpenChange, panelRef, index = 0, children }) {
  return (
    <section ref={panelRef} id={id} style={{ ...vars(kit), animationDelay: `${Math.min(index, 6) * 60}ms` }}
      className="kit-card kit-settle kit-ground scroll-mt-16 overflow-hidden rounded-panel border-2 border-ink">
      <C.Root open={open} onOpenChange={onOpenChange}>
        <h2 className="m-0">
          <C.Trigger className="group block w-full p-3 text-left sm:p-4">
            {mark && <Art draw={mark}/>}
            <span className="mt-3.5 flex items-start gap-3 px-0.5 pb-0.5">
              <span className="min-w-0 flex-1">
                {/* text-wrap is inherited and the base layer balances headings,
                    so inside this h2 the subtitle was being balanced too and
                    wrapped at about 280px on a 670px row. It is a sentence,
                    not a heading. */}
                <span className="block font-display text-row font-bold tracking-tight text-ink sm:text-head">
                  {title}
                </span>
                <span className="mt-2 block max-w-[48ch] text-sec text-ink-2 [text-wrap:pretty]">{lede}</span>
                <span className="kit-fill mt-3 inline-block rounded-chip px-3 py-1 font-display
                  text-fine font-bold text-paper">{time}</span>
              </span>
              {/* A drawn control rather than a bare chevron: on a page built
                  out of edges, the one thing a reader has to press should have
                  one too. */}
              <span className="grid size-11 shrink-0 place-items-center rounded-chip border-2
                border-ink bg-card">
                <Chevron aria-hidden className="size-4 text-ink transition-transform duration-200
                  ease-[var(--ease-out)] group-data-[state=open]:rotate-90"/>
              </span>
            </span>
          </C.Trigger>
        </h2>
        <C.Content className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
          {/* The tool itself goes back onto white. The wash is the activity's
              name badge, not its reading surface: a form filled in on a tint
              is harder to read than one on paper, and this is where somebody
              actually types. */}
          <div className="border-t-2 border-ink bg-card p-4 sm:p-5">{children}</div>
        </C.Content>
      </C.Root>
    </section>
  )
}

/* A chip in a row of choices. Selection is carried by fill, weight and ink, so
   it survives a greyscale screenshot. 44px floor on every target, and the
   selected one takes the activity's own colour rather than a house green, so a
   reader looking at two open panels can tell which is which. */
export function Choice({ on = false, className, ...rest }) {
  return (
    <button type="button" aria-pressed={on}
      className={cn('min-h-[46px] rounded-field border-2 px-3.5 text-left font-display text-ui',
        'transition-colors duration-150 ease-[var(--ease-out)]',
        on ? 'kit-fill border-ink font-bold text-paper'
           : 'kit-hoverable border-ink bg-card font-medium text-ink',
        className)} {...rest}/>
  )
}

export const FIELD = cn(
  'block w-full rounded-field border-2 border-ink bg-card p-3 font-body text-sec text-ink',
  'placeholder:text-ink-3 transition-colors duration-150'
)

/* Ruled label inside a panel, in the activity's own ink. Not .mark: that one
   is a heading. */
export function Step({ children, className }) {
  return (
    <p className={cn('kit-ink border-t-2 border-ink pt-2.5 font-display text-tick font-bold', className)}>
      {children}
    </p>
  )
}

export function Hint({ children, className }) {
  return <p className={cn('note max-w-[52ch]', className)}>{children}</p>
}

/* A figure with its label beside it, which is how every other readout on this
   site is built. Used for the counts a tool produces: breaths left, words
   found, patterns matched. `n` is monospaced and tabular so a changing figure
   does not shift the label next to it. */
export function Readout({ n, unit, className }) {
  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      <span className="font-mono text-num tabular-nums text-ink">{n}</span>
      <span className="font-display text-fine font-medium text-ink-2">{unit}</span>
    </span>
  )
}

/* A chip inside a figure rather than a control: the entries of a tool's own
   rulebook, drawn so the reader can see the whole list and count what matched.
   `on` is a match. Fill, weight and ink all carry it, so the figure survives a
   greyscale screenshot and does not depend on colour alone. It is a span, not
   a button, which is why it is allowed to be smaller than a 44px target. */
export function Tag({ on = false, className, children, ...rest }) {
  return (
    <span className={cn('inline-block rounded-chip border-2 px-2.5 py-0.5 font-display text-fine',
      on ? 'kit-mark kit-fill border-ink font-bold text-paper'
         : 'border-rule bg-card font-medium text-ink-2', className)} {...rest}>
      {children}
    </span>
  )
}

/* Rows that arrive in reading order when the reader asks for them. The delay
   is inline because the rows are a list of unknown length, and it is capped so
   a long answer never leaves the reader waiting on the last row. */
export const riseAt = i => ({ animationDelay: `${Math.min(i, 7) * 40}ms` })
