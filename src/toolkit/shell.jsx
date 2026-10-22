import React from 'react'
import { ArrowLeft } from '../ui/marks'
import { cn } from '../lib/utils'
import { vars } from './theme'
import { FAMILY_OF } from './index.jsx'
import '../kit/kit.css'

// Colour from the tool's tile, by `id` or by the #/toolkit-<id> route; `family` is the fallback.
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

export function OnDevice({ children, className }) {
  return (
    <p className={cn('flex items-center gap-2 text-fine text-ink-2', className)}>
      <span aria-hidden className="kit-fill size-2 shrink-0 rounded-bar"/>
      <span>{children}</span>
    </p>
  )
}

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

// Kept mounted and hidden with sr-only, because iOS will not play a stream into a <video> created with no layout.
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
