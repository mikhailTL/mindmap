import React from 'react'
import * as C from '@radix-ui/react-collapsible'
import { Chevron } from '../ui/marks'
import { cn } from '../lib/utils'

/* Shared shell for the toolkit. One panel per activity: the title, how long it
   takes, and the tool itself behind a disclosure.

   Panels are independent rather than an accordion — closing one to open
   another would throw away whatever the reader had typed in it. Radix
   unmounts closed content, so a closed tool holds no state and runs no loop. */

export function Panel({ id, title, time, lede, open, onOpenChange, panelRef, children }) {
  return (
    <section ref={panelRef} id={id}
      className="scroll-mt-16 overflow-hidden rounded-panel border border-rule bg-card">
      <C.Root open={open} onOpenChange={onOpenChange}>
        <h2 className="m-0">
          <C.Trigger
            className={cn('group flex w-full items-start gap-4 p-5 text-left',
              'transition-colors duration-150 hoverOnly:bg-mist/60')}>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-row font-bold tracking-tight text-ink">{title}</span>
              <span className="mt-1.5 block max-w-[46ch] text-sec text-ink-2">{lede}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-2.5">
              <span className="whitespace-nowrap rounded-field border border-rule bg-mist px-2 py-0.5
                font-display text-fine font-medium text-ink-2">{time}</span>
              <Chevron aria-hidden className="size-4 text-accent transition-transform duration-200
                ease-[var(--ease-out)] group-data-[state=open]:rotate-90"/>
            </span>
          </C.Trigger>
        </h2>
        <C.Content className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
          <div className="border-t border-rule p-5">{children}</div>
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
