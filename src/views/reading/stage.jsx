import React from 'react'
import { ArrowLeft } from '../../ui/marks'
import { cn } from '../../lib/utils'

/* The chooser and the two readings are one screen in three states, so the swap
 * has to say which way it moved: forward enters from the right, back enters
 * from the left. The chooser is the place you leave and come back to, and that
 * is the only thing this motion carries.
 *
 * Entrance only, and no fill mode, so no transform survives the animation. The
 * reading screens hold xl:sticky columns, and a transform left on this wrapper
 * would make it their containing block instead of the viewport.
 *
 * Reduced motion keeps the fade, which is what reports the pane changed, and
 * drops the travel. The universal rule in input.css collapses animation
 * duration rather than cancelling it, so the override is explicit and
 * !important, as .mm-pane's is. */
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

/** `dir` null on first paint: a tab opening is not a move between states. */
export function Stage({ dir = null, className, children }) {
  return (
    <div className={cn(dir && 'rd-stage', className)} data-dir={dir || undefined}>
      {children}
    </div>
  )
}

/* The way out of a reading. 44px minimum, its own focus outline from
   input.css, and the Escape shortcut named for anything that reads it out.
   The chip is decoration for a pointer device and is hidden from the name. */
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
      {/* No font-mono: design spec 0d section 2 bans a monospace label, and
          `font-mono` resolves to the body face anyway. */}
      <span aria-hidden className="hidden rounded-field border border-rule px-1.5 py-0.5
        text-fine text-ink-3 sm:inline">Esc</span>
    </div>
  )
})
