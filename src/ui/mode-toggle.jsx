import * as React from 'react'
import { cn } from '../lib/utils'
import { MODES, useMode } from '../lib/mode'

const LABEL = { demo: 'Demo', real: 'Live' }

export function ModeToggle({ className, compact = false }) {
  const [mode, setMode] = useMode()
  const refs = React.useRef([])
  const helpId = React.useId()

  // Arrow keys move and select in one step, as in a native radio group; the group is one tab stop.
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
    <div className={cn('flex flex-wrap items-center gap-y-1.5', compact ? 'gap-x-0' : 'gap-x-4', className)}>
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
              tabIndex={on ? 0 : -1}
              onClick={() => setMode(m)}
              onKeyDown={onKeyDown}
              className={cn(
                compact ? 'min-h-[36px] px-3 font-display text-fine' : 'min-h-[44px] px-4 font-display text-ui',
                'transition-[background-color,color] duration-150 ease-out',
                'disabled:pointer-events-none disabled:opacity-45',
                /* Rule on the second cell only, or the border doubles. */
                i > 0 && 'border-l border-ink',
                on
                  ? 'bg-accent-wash font-bold text-accent-ink'
                  : 'bg-transparent font-light text-ink-2 hoverOnly:bg-mist active:bg-mist'
              )}
            >
              {LABEL[m]}
            </button>
          )
        })}
      </div>
      {mode === 'demo' && <DemoInfo/>}
      <p id={helpId} className={cn('note max-w-[30ch]', compact ? 'sr-only' : 'hidden lg:block')}>
        Live shows your own readings and network. Demo shows a worked example.
      </p>
    </div>
  )
}

function DemoInfo() {
  const [open, setOpen] = React.useState(false)
  const box = React.useRef(null)
  const btn = React.useRef(null)
  const id = React.useId()

  React.useEffect(() => {
    if (!open) return
    const away = e => { if (!box.current?.contains(e.target)) setOpen(false) }
    const esc = e => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus() } }
    const shut = () => setOpen(false)
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', esc)
    // The top bar stays mounted across routes, so a route change closes the popover.
    window.addEventListener('hashchange', shut)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', esc)
      window.removeEventListener('hashchange', shut)
    }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button ref={btn} type="button" aria-label="About demo mode"
        aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}
        className="group grid h-11 w-9 min-h-[44px] place-items-center !px-0 lg:w-11">
        <span aria-hidden className={cn('grid size-6 place-items-center rounded-full border border-ink',
          'font-display text-fine font-bold leading-none transition-colors duration-150',
          open ? 'bg-accent-wash text-accent-ink' : 'bg-card text-ink groupHoverOnly:bg-mist')}>?</span>
      </button>
      {open && (
        <p id={id} role="status"
          className="absolute right-0 top-full z-50 m-0 mt-1 w-max max-w-[16rem] rounded-field border border-ink
            bg-card px-3 py-2 text-fine text-ink shadow-card">
          Demo mode. The people and data are made up.
        </p>
      )}
    </div>
  )
}
