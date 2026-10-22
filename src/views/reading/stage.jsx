import React from 'react'
import { ArrowLeft } from '../../ui/marks'
import { cn } from '../../lib/utils'

// Entrance only, with no fill mode: a transform left on the wrapper would become the containing block for the
// readings' xl:sticky columns. input.css shortens animations under reduced motion, so the override is !important.
const CSS = `
.rd-stage{animation:rd-fwd .22s var(--ease-out)}
.rd-stage[data-dir=back]{animation-name:rd-back}
@keyframes rd-fwd{from{opacity:0;transform:translate3d(16px,0,0)}}
@keyframes rd-back{from{opacity:0;transform:translate3d(-16px,0,0)}}
@keyframes rd-fade{from{opacity:0}}
@media (prefers-reduced-motion:reduce){
.rd-stage,.rd-stage[data-dir=back]{animation:rd-fade .18s linear !important}
}`

/** Mounted once by the screen that owns the three states. */
export function StageStyles() {
  return <style>{CSS}</style>
}

export function Stage({ dir = null, className, children }) {
  return (
    <div className={cn(dir && 'rd-stage', className)} data-dir={dir || undefined}>
      {children}
    </div>
  )
}

export const BackBar = React.forwardRef(function BackBar(
  { onBack, children, className }, ref) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      <button ref={ref} type="button" onClick={onBack} aria-keyshortcuts="Escape"
        className="-ml-2 inline-flex min-h-[44px] items-center gap-2 rounded-field px-2
          font-display text-ui font-medium text-ink-2 transition-colors duration-150
          hoverOnly:text-ink active:text-ink">
        <ArrowLeft aria-hidden className="size-4 shrink-0"/>
        {children}
      </button>
      <span aria-hidden className="hidden rounded-field border border-rule px-1.5 py-0.5
        text-fine text-ink-3 sm:inline">Esc</span>
    </div>
  )
})
