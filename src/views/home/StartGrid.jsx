import React from 'react'
import { ArrowRight, Chevron } from '../../ui/marks'
import { cn } from '../../lib/utils'

export function StartGrid({ label, children, className }) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 lg:grid-cols-4 lg:gap-4">
        {React.Children.map(children, c => c && <li className="min-w-0">{c}</li>)}
      </ul>
    </nav>
  )
}

// `tone` is the tile's ground, e.g. 'bg-sky-wash'. Give `art` h-full w-full, or h-full w-auto with an aspect,
// so it scales into the panel.
export function StartTile({ title, art, tone, onClick, chevron = 'text-accent' }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('group flex h-full w-full flex-col items-stretch overflow-hidden rounded-panel border',
        'border-ink/10 text-left transition-[border-color,transform] duration-150',
        'hoverOnly:border-accent active:scale-[0.985] motion-reduce:active:scale-100',
        'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink', tone)}>
      <span aria-hidden className={cn('relative flex aspect-[16/9] w-full shrink-0 items-center justify-center overflow-hidden', chevron)}>
        <span className="pointer-events-none absolute -bottom-1/3 -right-[12%] aspect-square w-[62%] rounded-full bg-white/40"/>
        <span className="relative flex h-[72%] w-[78%] items-center justify-center transition-transform duration-300 ease-out
          groupHoverOnly:scale-[1.04] motion-reduce:transition-none motion-reduce:groupHoverOnly:scale-100">{art}</span>
      </span>
      <span className="flex w-full flex-1 items-center justify-between gap-2 border-t border-ink/[0.07] bg-white/45 p-3 sm:p-3.5 lg:px-4 lg:py-3.5">
        <span className="min-w-0 font-display text-ui font-bold leading-[1.22] text-ink">{title}</span>
        <Chevron aria-hidden className={cn('size-4 shrink-0 transition-transform duration-150 groupHoverOnly:translate-x-0.5', chevron)}/>
      </span>
    </button>
  )
}

export function LeadCard({ art, title, line, cta, onClick, className }) {
  return (
    <div className={cn('lit flex flex-wrap items-center gap-x-4 gap-y-3 p-3.5 lg:p-4', className)}>
      <span aria-hidden className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-field border border-accent/20 bg-accent-wash">
        {art}
      </span>
      <span className="min-w-[9rem] flex-1">
        <span className="block font-display text-ui font-bold text-ink">{title}</span>
        {line && <span className="mt-0.5 block text-fine text-ink-2">{line}</span>}
      </span>
      <button type="button" onClick={onClick}
        className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-field
          bg-accent px-4 font-display text-ui font-medium text-paper transition-colors duration-150
          hoverOnly:bg-accent-ink active:bg-accent-ink sm:w-auto
          focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent">
        {cta}
        <ArrowRight aria-hidden className="size-4 shrink-0"/>
      </button>
    </div>
  )
}
