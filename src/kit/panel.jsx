import React from 'react'
import * as C from '@radix-ui/react-collapsible'
import { Chevron } from '../ui/marks'
import { Art } from './glyphs'
import { vars } from './palette'
import { cn } from '../lib/utils'
import './kit.css'

export function Panel({ id, kit, title, time, lede, mark, open, onOpenChange, panelRef, index = 0, children }) {
  return (
    <section ref={panelRef} id={id} style={{ ...vars(kit), animationDelay: `${Math.min(index, 6) * 60}ms` }}
      className="kit-card kit-settle scroll-mt-16 overflow-hidden rounded-[18px] border border-rule bg-card">
      <C.Root open={open} onOpenChange={onOpenChange}>
        <h2 className="m-0">
          <C.Trigger className="group block w-full p-3 text-left sm:p-4">
            {mark && <Art draw={mark}/>}
            <span className="mt-3.5 flex items-start gap-3 px-0.5 pb-0.5">
              <span className="min-w-0 flex-1">
                <span className="block font-display text-row font-bold tracking-tight text-ink sm:text-head">
                  {title}
                </span>
                <span className="mt-2 block max-w-[48ch] text-sec text-ink-2 [text-wrap:pretty]">{lede}</span>
                <span className="kit-ink mt-3 block font-display text-fine font-bold">{time}</span>
              </span>
              <span className="kit-ground grid size-11 shrink-0 place-items-center rounded-full">
                <Chevron aria-hidden className="size-4 text-ink transition-transform duration-200
                  ease-[var(--ease-out)] group-data-[state=open]:rotate-90"/>
              </span>
            </span>
          </C.Trigger>
        </h2>
        <C.Content className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
          <div className="border-t border-rule bg-card p-4 sm:p-5">{children}</div>
        </C.Content>
      </C.Root>
    </section>
  )
}

export { Choice, FIELD } from '../toolkit/shell'

export function Step({ children, className }) {
  return (
    <p className={cn('kit-ink border-t border-rule pt-3 font-display text-ui font-bold', className)}>
      {children}
    </p>
  )
}

export function Hint({ children, className }) {
  return <p className={cn('note max-w-[52ch]', className)}>{children}</p>
}

export function Readout({ n, unit, className }) {
  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      <span className="font-mono text-num tabular-nums text-ink">{n}</span>
      <span className="font-display text-fine font-medium text-ink-2">{unit}</span>
    </span>
  )
}

export function Tag({ on = false, className, children, ...rest }) {
  return (
    <span className={cn('inline-block rounded-xs border px-2 py-0.5 font-display text-fine',
      on ? 'kit-mark kit-fill border-transparent font-bold text-white'
         : 'border-rule bg-card font-medium text-ink-2', className)} {...rest}>
      {children}
    </span>
  )
}

// Rows rise 40ms apart, capped at the eighth row so a long list does not wait on its last one.
export const riseAt = i => ({ animationDelay: `${Math.min(i, 7) * 40}ms` })
