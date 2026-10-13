import React from 'react'
import { ArrowLeft } from '../ui/marks'
import { cn } from '../lib/utils'
import { vars } from './theme'
import '../kit/kit.css'

/* The shell every activity is rendered in.
 *
 * Activities used to open inside the index as collapsibles, which the owner
 * read, correctly, as the page not bothering to go anywhere. Each one is now
 * its own route and its own screen: a way back, a name, one line under it, and
 * the tool. The index is not on the screen at all while an activity is open.
 *
 * The app shell's sticky bar carries the h1 for the route, so the activity's
 * own name is an h2. APP_SHELL in App.jsx sets h2 to text-row, which is the
 * step down the 13 October batch asked for throughout the app.
 *
 * The way back is an anchor to `#/toolkit`, not a button: App.jsx resolves the
 * hash and listens for hashchange, so a hash link is a real navigation with a
 * real browser Back, and it works before any script has run. */

export function ActivityScreen({ family = 'leaf', title, lede, minutes, back = '#/toolkit',
                                 onBack = null, backLabel = 'Toolkit', children }) {
  /* Two ways back, because two kinds of activity reach this shell. The five
     student activities each have a route of their own, so their way back is a
     hash link and a real browser Back. The parent set has no route yet (the
     five ids named in this worker's report are not in App.jsx's table), so it
     is opened from the index in place and handed `onBack` instead. The control
     looks and measures the same either way, and swapping one for the other is
     one line at the call site once the routes exist. */
  const WAY = onBack ? 'button' : 'a'
  const wayProps = onBack
    ? { type:'button', onClick:onBack }
    : { href:back }
  return (
    <div className="wrap" style={vars(family)}>
      <div className="mx-auto w-full max-w-[52rem]">
        <WAY {...wayProps}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-field px-1 font-display
            text-ui font-semibold text-accent-ink hoverOnly:text-ink">
          <ArrowLeft aria-hidden className="size-4"/>{backLabel}
        </WAY>

        <header className="kit-block kit-ground mt-2 rounded-panel border-2 border-ink p-4 sm:p-5">
          <h2 className="font-display font-bold tracking-tight text-ink">{title}</h2>
          {lede && <p className="mt-2 max-w-[48ch] text-sec text-ink-2 [text-wrap:pretty]">{lede}</p>}
          {minutes && <p className="mt-2.5 font-display text-fine font-semibold text-ink-2">{minutes}</p>}
        </header>

        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}

/* A panel inside an activity. White stock, because this is where somebody
   reads and types: a form filled in on a tint is harder to read than one on
   paper, and the tint is the activity's name badge rather than its working
   surface. */
export function Sheet({ className, children }) {
  return (
    <section className={cn('rounded-panel border-2 border-ink bg-card p-4 sm:p-5', className)}>
      {children}
    </section>
  )
}

/* A ruled label inside a panel, in the activity's own ink. */
export function Step({ children, className }) {
  return (
    <p className={cn('kit-ink border-t-2 border-ink pt-2.5 font-display text-tick font-bold',
      className)}>{children}</p>
  )
}

export function Note({ children, className }) {
  return <p className={cn('note max-w-[56ch]', className)}>{children}</p>
}

/* The one line that says what a sensor is doing, at the point of use. Nothing
   a reader types or films in the Toolkit leaves the device, and that is said
   next to the camera or the microphone rather than in a panel at the foot of
   the page. */
export function OnDevice({ children, className }) {
  return (
    <p className={cn('mt-2.5 flex items-start gap-2 text-fine text-ink-2', className)}>
      <span aria-hidden className="mt-[0.42em] size-2 shrink-0 rounded-bar bg-accent"/>
      <span className="max-w-[54ch]">{children}</span>
    </p>
  )
}

/* A figure and its label. No monospace face: tabular-nums is what lines
   figures up, and a typewriter face on a display number reads as a generated
   page. */
export function Readout({ n, unit, className }) {
  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      <span className="font-display text-num font-bold tabular-nums text-ink">{n}</span>
      <span className="font-display text-fine font-medium text-ink-2">{unit}</span>
    </span>
  )
}

/* A choice in a row of choices. Selection is carried by fill, weight and ink,
   so it survives a greyscale screenshot. rounded-field rather than a capsule:
   spec 0d section 2 bans the pill in every form. */
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

/* A word or phrase the page matched, drawn so the reader can see the whole
   list and count what matched. Named Hit rather than Mark because marks.jsx
   owns that word for the drawn tiles. A span rather than a control, which is
   why it is allowed to be smaller than a 44px target, and rounded-field rather
   than a capsule. */
export function Hit({ on = false, className, children }) {
  return (
    <span className={cn('inline-block rounded-field border-2 px-2.5 py-0.5 font-display text-fine',
      on ? 'kit-mark kit-fill border-ink font-bold text-paper'
         : 'border-rule bg-card font-medium text-ink-2', className)}>{children}</span>
  )
}

/* A horizontal meter for a measured value: breath level, movement, confidence.
   The figure beside it is what carries the number; the bar is the shape of it
   moving, and never the only thing saying what the value is. */
export function Meter({ value = 0, label, right, className }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-display text-fine font-semibold text-ink-2">{label}</span>
        {right && <span className="font-display text-fine font-semibold tabular-nums text-ink">{right}</span>}
      </div>
      <div className="mt-1.5 h-3 overflow-hidden rounded-bar border-2 border-ink bg-card">
        <div className="kit-fill-art h-full rounded-bar transition-[width] duration-150
          ease-[var(--ease-out)]" style={{ width: pct + '%' }}/>
      </div>
    </div>
  )
}

export const riseAt = i => ({ animationDelay: `${Math.min(i, 7) * 40}ms` })
