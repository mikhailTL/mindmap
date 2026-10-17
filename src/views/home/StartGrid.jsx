import React from 'react'
import { ArrowRight, Chevron } from '../../ui/marks'
import { cn } from '../../lib/utils'

/* The cards every role home opens with. The owner, 17 October, after the
 * big-card homes: "i liked how it was before with the cards at the top, was
 * more usable". So the earlier start screen's shape comes back: a 2 x 2 grid
 * of even tiles (four across from lg), each a picture panel over a one-line
 * label with a chevron. What stays from the big cards is the picture: every
 * tile keeps its own colour and drawing, so no two look alike.
 *
 * LeadCard is the earlier screen's one dark card, for the single action a
 * role does most (a student taking a reading). */

export function StartGrid({ label, children, className }) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 lg:grid-cols-4 lg:gap-4">
        {React.Children.map(children, c => c && <li className="min-w-0">{c}</li>)}
      </ul>
    </nav>
  )
}

/* tone: the picture panel's ground, e.g. 'bg-sky-wash'. art: the drawing,
   sized by the panel (give it h-[..] or w-[..] classes). */
export function StartTile({ title, art, tone, onClick, chevron = 'text-accent' }) {
  return (
    <button type="button" onClick={onClick}
      className="group flex h-full w-full flex-col items-stretch overflow-hidden rounded-panel border
        border-rule bg-card text-left transition-[border-color,transform] duration-150
        hoverOnly:border-accent active:scale-[0.985] motion-reduce:active:scale-100
        focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink">
      <span aria-hidden className={cn('relative flex aspect-[16/9] w-full shrink-0 items-center justify-center overflow-hidden', tone)}>
        {art}
      </span>
      <span className="flex w-full flex-1 items-center justify-between gap-2 p-3 sm:p-3.5 lg:px-4 lg:py-3.5">
        <span className="min-w-0 font-display text-ui font-bold leading-[1.22] text-ink">{title}</span>
        <Chevron aria-hidden className={cn('size-4 shrink-0 transition-transform duration-150 groupHoverOnly:translate-x-0.5', chevron)}/>
      </span>
    </button>
  )
}

export function LeadCard({ art, title, line, cta, onClick, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 rounded-panel border border-ink bg-ink p-3.5 lg:p-4', className)}>
      <span aria-hidden className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-field bg-paper/10">
        {art}
      </span>
      <span className="min-w-[9rem] flex-1">
        <span className="block font-display text-ui font-bold text-paper">{title}</span>
        {line && <span className="mt-0.5 block text-fine text-paper/80">{line}</span>}
      </span>
      <button type="button" onClick={onClick}
        className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-field
          bg-accent px-4 font-display text-ui font-medium text-paper transition-colors duration-150
          hoverOnly:bg-accent-lit hoverOnly:text-ink active:bg-accent-lit active:text-ink sm:w-auto
          focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent-lit">
        {cta}
        <ArrowRight aria-hidden className="size-4 shrink-0"/>
      </button>
    </div>
  )
}
