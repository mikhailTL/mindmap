import React from 'react'
import { ArrowRight, Chevron } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { Frame } from '../../ui/frame'

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
   sized by the panel (give it h-[..] or w-[..] classes).

   photo: a key from src/lib/photos.js. The owner, 17 October: "half the
   graphic you have and half a stock image, have it diagonal split between the
   two". With a photo the drawing keeps the left half on its colour wash and
   the photograph takes the right, cut on a diagonal with a thin white seam.
   The photo box stays near square (about 1:1 at every width), well under the
   widest crop any file survives (minAspect 1.8 and up), so Frame never has to
   grow the panel and its focal point keeps faces inside the visible part.
   photoFocal overrides that point for a file whose subjects sit wide apart. */
const SEAM = 'polygon(26% 0, 100% 0, 100% 100%, 0 100%)'
const CUT = 'polygon(calc(26% + 4px) 0, 100% 0, 100% 100%, 4px 100%)'

export function StartTile({ title, art, tone, onClick, chevron = 'text-accent', photo, photoAlt, photoFocal }) {
  return (
    <button type="button" onClick={onClick}
      className="group flex h-full w-full flex-col items-stretch overflow-hidden rounded-panel border
        border-rule bg-card text-left transition-[border-color,transform] duration-150
        hoverOnly:border-accent active:scale-[0.985] motion-reduce:active:scale-100
        focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink">
      <span aria-hidden className={cn('relative flex aspect-[16/9] w-full shrink-0 items-center justify-center overflow-hidden', tone)}>
        {photo ? (
          <>
            <span className="absolute inset-y-0 left-0 flex w-[50%] items-center justify-center pl-[3%]">{art}</span>
            <span className="absolute inset-y-0 right-0 w-[58%] bg-card" style={{ clipPath: SEAM }}/>
            <span className="absolute inset-y-0 right-0 w-[58%] overflow-hidden" style={{ clipPath: CUT }}>
              <Frame photo={photo} alt={photoAlt || title} focal={photoFocal} eager
                className="transition-transform duration-300 ease-out groupHoverOnly:scale-[1.04] motion-reduce:transition-none motion-reduce:groupHoverOnly:scale-100"/>
            </span>
          </>
        ) : art}
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
