import * as React from 'react'
import { cn } from '../lib/utils'
import { MODES, useMode } from '../lib/mode'

/* Selection is carried by fill and weight, never by hue, so it survives
   grayscale. */

/* The value stays 'real' in src/lib/mode.js; only the word changed. */
const LABEL = { demo: 'Demo', real: 'Live' }

/* A radiogroup, not two buttons: screen readers get the "1 of 2" position for
   free. Arrow-key selection is hand-written below. */
export function ModeToggle({ className, compact = false }) {
  const [mode, setMode] = useMode()
  const refs = React.useRef([])
  const helpId = React.useId()

  /* In a radio group the arrow keys select as they move — no confirm step. */
  function onKeyDown(e) {
    const i = MODES.indexOf(mode)
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % MODES.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + MODES.length) % MODES.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = MODES.length - 1
    else return
    e.preventDefault()
    setMode(MODES[next])
    refs.current[next]?.focus()
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      <div
        role="radiogroup"
        aria-label="Data source"
        aria-describedby={helpId}
        className="inline-flex rounded-none border border-ink bg-card"
      >
        {MODES.map((m, i) => {
          const on = mode === m
          return (
            <button
              key={m}
              ref={el => { refs.current[i] = el }}
              type="button"
              role="radio"
              aria-checked={on}
              /* Roving tabindex: the group is one tab stop, and Tab leaves it
               * rather than walking through every option. */
              tabIndex={on ? 0 : -1}
              onClick={() => setMode(m)}
              onKeyDown={onKeyDown}
              className={cn(
                /* 44px is the touch floor; compact drops to 36px because it
                 * sits in the header beside a pointer-sized control. */
                compact ? 'min-h-[36px] px-3 font-display text-fine' : 'min-h-[44px] px-4 font-display text-ui',
                'transition-[background-color,color] duration-150 ease-out',
                'disabled:pointer-events-none disabled:opacity-45',
                /* Rule on the second cell only, or the border doubles. */
                i > 0 && 'border-l border-ink',
                on
                  ? 'bg-ink font-medium text-paper'
                  : 'bg-transparent font-light text-ink-2 hoverOnly:bg-mist active:bg-mist'
              )}
            >
              {LABEL[m]}
            </button>
          )
        })}
      </div>
      {/* Set as text and wired with aria-describedby, not a title attribute:
       * title is unreachable by touch and keyboard and mostly unannounced. */}
      <p id={helpId} className={cn('note max-w-[30ch]', compact ? 'sr-only' : 'hidden lg:block')}>
        Live shows your own readings and network. Demo shows a worked example.
      </p>
    </div>
  )
}
