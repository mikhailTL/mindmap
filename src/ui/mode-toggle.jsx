import * as React from 'react'
import { cn } from '../lib/utils'
import { MODES, useMode } from '../lib/mode'

/* The demo/real switch, built as a two-cell ruled field rather than a pill.
 *
 * Square on purpose: this sits in the top bar beside the band index, which is
 * a printed chart's index, and a capsule floating next to ruled cells is the
 * generated-UI shape the rest of this pass is removing. It is the same object
 * as a two-column cell in a table — a box, a dividing rule, one cell filled.
 *
 * The selection is carried by fill *and* weight, never by hue: the chosen cell
 * is an ink block with paper text at Quicksand 500, the other is unfilled at
 * 300. Desaturate the screenshot and you can still read which side is live.
 * (700 is loaded now, but it belongs to headings; a control that shouts as
 * loudly as a section head is a control competing with the page.)
 */

const LABEL = { demo: 'Demo', real: 'Real' }

/* A radiogroup, not two buttons or a checkbox. "Which of these two is the data
 * source" is exactly what a radio group means, and screen-reader users get the
 * "1 of 2" position and the arrow-key behaviour for free — behaviour that has
 * to be hand-written and is usually half-written on a segmented control. */
export function ModeToggle({ className, compact = false }) {
  const [mode, setMode] = useMode()
  const refs = React.useRef([])
  const helpId = React.useId()

  /* In a radio group the arrow keys select as they move; there is no separate
   * confirm step. Home/End are included because the group is a line and a line
   * has ends. */
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
                /* Compact is the header size: it sits beside the Launch
                 * control and next to it the full-size switch read as a second
                 * primary action rather than a setting. 44px is still the
                 * touch floor, so only the padding and the step move. */
                compact ? 'min-h-[36px] px-3 font-display text-fine' : 'min-h-[44px] px-4 font-display text-ui',
                'transition-[background-color,color] duration-150 ease-out',
                'disabled:pointer-events-none disabled:opacity-45',
                /* The dividing rule belongs to the second cell so the outer
                 * border is not doubled at the join. */
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
      {/* A title attribute is not an explanation: it is unreachable by touch,
       * unreachable by keyboard, and unread by most screen readers. The one
       * sentence that makes "Real" mean anything is set as text, and the group
       * points at it with aria-describedby so it is announced with the
       * control rather than found afterwards. */}
      <p id={helpId} className={cn('note max-w-[30ch]', compact ? 'sr-only' : 'hidden lg:block')}>
        Real shows the app with no patch paired. That is what a visitor gets today.
      </p>
    </div>
  )
}
