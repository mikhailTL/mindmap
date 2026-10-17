import React from 'react'
import { ArrowLeft } from '../ui/marks'
import { cn } from '../lib/utils'
import { vars } from './theme'
import { FAMILY_OF } from './index.jsx'
import '../kit/kit.css'

/* The shell every activity renders in: a way back, the name, and the tool.
 *
 * 17 October: calm, not brutalist. Soft rounded white surfaces with the
 * site's gentle shadow, hairline rules instead of heavy ink edges, and the
 * activity's own colour family (theme.js) on its icon wash, its selected
 * choices and its primary button. Every control here is at least 48px tall.
 *
 * The way back is an anchor to `#/toolkit`: App.jsx resolves the hash, so it
 * is a real navigation with a real browser Back. Tools opened in place (the
 * parent and Medical Professional sets) are handed `onBack` and get a button
 * that looks the same. */

/* The colour comes from the tool's tile when the tool is known, by `id` or by
   the `#/toolkit-<id>` route it was opened on, so a tile and its screen always
   match. `family` is the fallback. */
function familyFor(id, family) {
  if (id && FAMILY_OF[id]) return FAMILY_OF[id]
  const routed = typeof location !== 'undefined' ? location.hash.replace(/^#\/?toolkit-/, '') : ''
  return FAMILY_OF[routed] || family
}

export function ActivityScreen({ id = null, family = 'accent', title, back = '#/toolkit',
                                 onBack = null, backLabel = 'Toolkit', icon = null, children }) {
  const WAY = onBack ? 'button' : 'a'
  const wayProps = onBack ? { type:'button', onClick:onBack } : { href:back }
  React.useEffect(() => { if (onBack) window.scrollTo(0, 0) }, [])
  return (
    <div className="wrap" style={vars(familyFor(id, family))}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <WAY {...wayProps}
          className="kit-quiet inline-flex min-h-[48px] items-center gap-2 rounded-field px-4
            font-display text-ui font-semibold">
          <ArrowLeft aria-hidden className="size-4"/>{backLabel}
        </WAY>
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <span aria-hidden className="kit-ground kit-ink grid size-12 shrink-0 place-items-center
              rounded-[14px]">{icon}</span>
          )}
          <h2 className="font-display text-head font-bold tracking-tight text-ink">{title}</h2>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  )
}

/* A white panel, for the parts of a tool somebody reads or types into. */
export function Sheet({ className, children }) {
  return (
    <section className={cn('rounded-[18px] border border-rule bg-card p-4 shadow-card sm:p-6', className)}>
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
      <span aria-hidden className="kit-fill size-2 shrink-0 rounded-bar"/>
      <span>{children}</span>
    </p>
  )
}

/* A choice in a row of choices. Selection is carried by fill, weight and a
   tick, so it survives a greyscale screenshot. */
export function Choice({ on = false, className, children, ...rest }) {
  return (
    <button type="button" aria-pressed={on}
      className={cn('kit-choice inline-flex min-h-[48px] items-center gap-2 rounded-field border px-4',
        'text-left font-display text-ui transition-[background-color,border-color,transform]',
        'duration-150 ease-[var(--ease-out)] motion-safe:active:scale-[0.97]',
        on ? 'kit-fill border-transparent font-bold text-white shadow-card'
           : 'kit-hoverable border-rule bg-card font-semibold text-ink',
        className)} {...rest}>
      {on && (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden focusable="false" fill="none"
          stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0"><path d="M4 12.5l5 5L20 6.5"/></svg>
      )}
      {children}
    </button>
  )
}

/* The two buttons a tool needs. `primary` is filled in the activity's own
   colour; `quiet` is white with a hairline. Both are 52px tall. */
export function Action({ kind = 'primary', className, ...rest }) {
  return (
    <button type="button"
      className={cn(kind === 'primary' ? 'kit-btn' : 'kit-quiet',
        'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[12px] px-6',
        'font-display text-ui font-bold select-none touch-manipulation', className)} {...rest}/>
  )
}

export const FIELD = cn(
  'block w-full rounded-[12px] border border-rule bg-card p-3.5 font-body text-sec text-ink shadow-card',
  'placeholder:text-ink-3 transition-colors duration-150 focus:border-[color:var(--kit-art)]'
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
      <div className={cn('kit-ground mt-2 overflow-hidden rounded-bar', tall ? 'h-6' : 'h-3')}>
        <div className="kit-fill h-full rounded-bar transition-[width] duration-150
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
    <div className={cn('relative mx-auto w-full max-w-[64rem] overflow-hidden rounded-[18px]',
      'bg-ink shadow-raise', on ? 'block' : 'sr-only', className)}>
      <video ref={ref} muted playsInline
        className={cn('block aspect-[4/3] max-h-[58vh] w-full object-cover', mirror && '-scale-x-100')}/>
      {children}
    </div>
  )
})
