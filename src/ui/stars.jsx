import React from 'react'
import { cn } from '../lib/utils'

/* A rating control drawn, not imported.
 *
 * Two things usually go wrong with half-star widgets and both are fixed here.
 * The first is that they are built from five buttons, which makes the keyboard
 * experience five tab stops and no concept of a value; this is one focusable
 * slider, the way a rating actually behaves. The second is that the value
 * exists only as a row of shapes in one colour, so a reader who cannot resolve
 * the fill — or who is listening — has nothing. The number is printed beside
 * the stars for that reason, and it is the same number the screen reader
 * announces.
 *
 * The half fill is a clip rectangle over a second copy of the path. A gradient
 * with two hard stops would render the same pixels and is banned here for good
 * reason: once one gradient exists in the stylesheet, the next one is easier.
 */

const STAR = 'M12 2.4l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.4l-5.88 3.1 ' +
             '1.12-6.55L2.48 9.32l6.58-.96z'

function Star({ frac, clipId }) {
  const shown = Math.max(0, Math.min(1, frac))
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden className="shrink-0">
      {shown > 0 && (
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={24 * shown} height="24" />
          </clipPath>
        </defs>
      )}
      <path d={STAR} className="stroke-ink-3" strokeWidth="1.4" strokeLinejoin="round" />
      {shown > 0 && <path d={STAR} className="fill-accent" clipPath={`url(#${clipId})`} />}
    </svg>
  )
}

export function StarRating({
  value = null,
  onChange,
  max = 5,
  step = 0.5,
  label = 'Rating',
  disabled = false,
  className,
}) {
  const uid = React.useId()
  const [hover, setHover] = React.useState(null)

  /* Floating point: 0.5 added five times is not 2.5, and a value of
   * 2.4999999 renders a star at 99.996% fill and reads "2.4999999 out of 5". */
  const snap = v => {
    const n = Math.round(v / step) * step
    return Math.min(max, Math.max(step, +n.toFixed(4)))
  }

  const set = v => { if (!disabled && onChange) onChange(snap(v)) }

  const fromPointer = (e, i) => {
    const r = e.currentTarget.getBoundingClientRect()
    const frac = (e.clientX - r.left) / r.width
    /* Never lands on the lower star's own value: pointing anywhere inside the
     * third star means at least 2.5, which is what a person pressing it meant. */
    const within = Math.max(step, Math.min(1, Math.ceil((frac - 1e-9) / step) * step))
    return snap(i + within)
  }

  const onKeyDown = e => {
    if (disabled) return
    const base = value == null ? 0 : value
    let next = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = base + step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = base - step
    else if (e.key === 'PageUp') next = base + 1
    else if (e.key === 'PageDown') next = base - 1
    else if (e.key === 'Home') next = step
    else if (e.key === 'End') next = max
    if (next == null) return
    e.preventDefault()
    set(next)
  }

  const shown = hover != null ? hover : value
  const text = shown == null
    ? 'Not rated yet'
    : `${shown} out of ${max} stars`

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        role="slider"
        aria-label={label}
        aria-valuemin={step}
        aria-valuemax={max}
        aria-valuenow={value == null ? undefined : value}
        aria-valuetext={text}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={onKeyDown}
        onPointerLeave={() => setHover(null)}
        className={cn(
          'flex min-h-[44px] items-center rounded-field',
          disabled && 'pointer-events-none opacity-45'
        )}
      >
        {Array.from({ length: max }, (_, i) => {
          const frac = shown == null ? 0 : Math.max(0, Math.min(1, shown - i))
          return (
            <span
              key={i}
              onPointerDown={e => set(fromPointer(e, i))}
              onPointerMove={e => !disabled && setHover(fromPointer(e, i))}
              className={cn(
                'flex h-11 w-11 cursor-pointer items-center justify-center rounded-field',
                'transition-colors duration-150 ease-out',
                'hover:bg-mist active:bg-accent-wash'
              )}
            >
              <Star frac={frac} clipId={`${uid}-star-${i}`} />
            </span>
          )
        })}
      </div>
      {/* The rating in words and figures, so it never depends on the fill.
          Unrated says so in words: a placeholder glyph in the figure's slot
          reads as a value the reader cannot make out. */}
      <span className="font-mono text-meta tabular-nums text-ink">
        {shown == null ? <span className="text-ink-3">Not rated</span> : <>
          {shown.toFixed(1)}<span className="text-ink-3"> / {max}</span>
        </>}
      </span>
    </div>
  )
}

export default StarRating
