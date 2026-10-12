import React from 'react'
import * as C from '@radix-ui/react-collapsible'
import { Chevron } from '../ui/marks'
import { Mark } from './glyphs'
import { cn } from '../lib/utils'
import './kit.css'

/* Shared shell for the toolkit. One panel per activity: a drawn mark, the
   feature name, a one-line description of what it does, how long it takes,
   and the tool itself behind a disclosure.

   The mark is not decoration. A reader scanning ten panels for the breathing
   one should find it without reading, and the closed row had nothing in it to
   find.

   Panels are independent rather than an accordion: closing one to open
   another would throw away whatever the reader had typed in it. Radix unmounts
   closed content, so a closed tool holds no state and runs no loop. */

export function Panel({ id, title, time, lede, mark, tone, open, onOpenChange, panelRef, children }) {
  return (
    <section ref={panelRef} id={id}
      className="scroll-mt-16 overflow-hidden rounded-panel border border-rule bg-card">
      <C.Root open={open} onOpenChange={onOpenChange}>
        <h2 className="m-0">
          {/* The time sits on the title's own line rather than in a right-hand
              column. In a column it was 72px of permanent width taken out of a
              314px row at 390, which pushed every subtitle to six lines and
              broke "5-4-3-2-1 Grounding" across two. */}
          <C.Trigger
            className={cn('group flex w-full items-start gap-3.5 p-4 text-left sm:gap-4 sm:p-5',
              'transition-colors duration-150 hoverOnly:bg-mist/60')}>
            {mark && <Mark draw={mark} tone={tone}/>}
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-display text-row font-bold tracking-tight text-ink">{title}</span>
                <span className="whitespace-nowrap rounded-field border border-rule bg-mist px-2 py-0.5
                  font-display text-fine font-medium text-ink-2">{time}</span>
              </span>
              {/* text-wrap is inherited and the base layer balances headings,
                  so inside this h2 the subtitle was being balanced too and wrapped
                  at about 280px on a 670px row. It is a sentence, not a heading. */}
              <span className="mt-1.5 block max-w-[46ch] text-sec text-ink-2 [text-wrap:pretty]">{lede}</span>
            </span>
            <Chevron aria-hidden className="mt-1 size-4 shrink-0 text-accent transition-transform
              duration-200 ease-[var(--ease-out)] group-data-[state=open]:rotate-90"/>
          </C.Trigger>
        </h2>
        <C.Content className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
          <div className="border-t border-rule p-4 sm:p-5">{children}</div>
        </C.Content>
      </C.Root>
    </section>
  )
}

/* A chip in a row of choices. Selection is carried by fill, weight and ink, so
   it survives a greyscale screenshot. 44px floor on every target. */
export function Choice({ on = false, className, ...rest }) {
  return (
    <button type="button" aria-pressed={on}
      className={cn('min-h-[44px] rounded-field border px-3.5 text-left font-display text-ui',
        'transition-colors duration-150 ease-[var(--ease-out)]',
        on ? 'border-ink bg-ink font-bold text-paper'
           : 'border-rule bg-card font-medium text-ink-2 hoverOnly:border-ink-3 hoverOnly:bg-mist',
        className)} {...rest}/>
  )
}

export const FIELD = cn(
  'block w-full rounded-field border border-rule bg-card p-3 font-body text-sec text-ink',
  'placeholder:text-ink-3 transition-colors duration-150 hoverOnly:border-ink-3'
)

/* Ruled label inside a panel. Not .mark: that one is a heading. */
export function Step({ children, className }) {
  return (
    <p className={cn('border-t border-rule pt-2.5 font-display text-tick font-bold text-ink-2', className)}>
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
    <span className={cn('inline-block rounded-field border px-2 py-0.5 font-display text-fine',
      on ? 'kit-mark border-accent bg-accent font-bold text-paper'
         : 'border-rule bg-card font-medium text-ink-2', className)} {...rest}>
      {children}
    </span>
  )
}

/* Rows that arrive in reading order when the reader asks for them. The delay
   is inline because the rows are a list of unknown length, and it is capped so
   a long answer never leaves the reader waiting on the last row. */
export const riseAt = i => ({ animationDelay: `${Math.min(i, 7) * 40}ms` })
