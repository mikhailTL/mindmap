import React from 'react'
import { ArrowLeft } from '../ui/marks'
import { cn } from '../lib/utils'
import { vars } from './theme'
import '../kit/kit.css'

/* The shell every activity renders in: a way back, the name, and the tool.
 *
 * No lede, no minutes line, no intro panel. The tool itself is the first thing
 * under the name and it runs the full width of the wrap (spec 0f rule 5), so
 * at 1280 the pacer, the camera and the silhouette are large and centred
 * rather than boxed into a 52rem column.
 *
 * The way back is an anchor to `#/toolkit`: App.jsx resolves the hash, so it
 * is a real navigation with a real browser Back. The parent set, which has no
 * routes yet, is handed `onBack` and gets a button that looks the same. */

export function ActivityScreen({ family = 'leaf', title, back = '#/toolkit',
                                 onBack = null, backLabel = 'Toolkit', children }) {
  const WAY = onBack ? 'button' : 'a'
  const wayProps = onBack ? { type:'button', onClick:onBack } : { href:back }
  return (
    <div className="wrap" style={vars(family)}>
      <div className="flex items-center gap-3">
        <WAY {...wayProps}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-field px-1 font-display
            text-ui font-semibold text-accent-ink hoverOnly:text-ink">
          <ArrowLeft aria-hidden className="size-4"/>{backLabel}
        </WAY>
        <h2 className="font-display font-bold tracking-tight text-ink">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

/* A white panel, for the parts of a tool somebody reads or types into. */
export function Sheet({ className, children }) {
  return (
    <section className={cn('rounded-panel border-2 border-ink bg-card p-4 sm:p-5', className)}>
      {children}
    </section>
  )
}

export function Note({ children, className }) {
  return <p className={cn('note', className)}>{children}</p>
}

/* The one line that says what a sensor is doing, at the point of use. */
export function OnDevice({ children, className }) {
  return (
    <p className={cn('flex items-center gap-2 text-fine text-ink-2', className)}>
      <span aria-hidden className="size-2 shrink-0 rounded-bar bg-accent"/>
      <span>{children}</span>
    </p>
  )
}

/* A choice in a row of choices. Selection is carried by fill, weight and ink,
   so it survives a greyscale screenshot. rounded-field, never a capsule. */
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

/* A large horizontal meter. The word beside it carries the reading, so the
   bar is never the only thing saying what the value is. */
export function Meter({ value = 0, label, right, className, tall = false }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-display text-ui font-semibold text-ink-2">{label}</span>
        {right && <span className="font-display text-ui font-bold tabular-nums text-ink">{right}</span>}
      </div>
      <div className={cn('mt-2 overflow-hidden rounded-bar border-2 border-ink bg-card',
        tall ? 'h-6' : 'h-3')}>
        <div className="h-full rounded-bar bg-accent transition-[width] duration-150
          ease-[var(--ease-out)] motion-reduce:transition-none" style={{ width: pct + '%' }}/>
      </div>
    </div>
  )
}

/* A camera view. Always mounted, because a <video> created at the moment a
   stream arrives has no layout yet and iOS refuses to play into it. Hidden
   with sr-only until there is a stream, and capped at about 60vh so the tool
   under it stays above the fold on a laptop. */
export const Video = React.forwardRef(function Video({ on, mirror = false, children, className }, ref) {
  return (
    <div className={cn('relative mx-auto w-full max-w-[64rem] overflow-hidden rounded-panel',
      'border-2 border-ink bg-ink', on ? 'block' : 'sr-only', className)}>
      <video ref={ref} muted playsInline
        className={cn('block aspect-[4/3] max-h-[58vh] w-full object-cover', mirror && '-scale-x-100')}/>
      {children}
    </div>
  )
})
