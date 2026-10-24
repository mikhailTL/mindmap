import React from 'react'
import { cn } from '../lib/utils'
import { Logo } from '../ui/logo'
import { ArrowRight } from '../ui/marks'
import { PRO } from '../lib/terms'
import { GuidedTour, replayIntro } from './Intro'
import { setPreferredRole } from '../account/store'

/* The audience chooser shown over the site, and the guided tour behind its fourth option. */
/* Audience names come from lib/terms.js. */
const OPTIONS = [
  { id: 'student', label: 'Teen' },
  { id: 'parent',  label: 'Parent' },
  { id: 'pro',     label: PRO },
  { id: 'tour',    label: 'Other', hint: 'A guided tour of each page' },
]

// Which panel is up, at module scope: the control that reopens it lives in App.jsx while Entry renders null.
let at = null                                  // null, 'ask' or 'tour'

// Per-document latch: one page load offers the chooser once.
let asked = false
const watchers = new Set()
const read = () => at
const watch = f => { watchers.add(f); return () => { watchers.delete(f) } }
const move = s => { at = s; watchers.forEach(f => f()) }

export function startTour() {
  asked = true
  move('tour')
}

export function replayTour() {
  replayIntro()
  asked = true
  move('ask')
}

export function ReplayTour({ className, children = 'Guided tour' }) {
  return (
    <button type="button" onClick={replayTour}
      className={cn('inline-flex min-h-[44px] items-center gap-2 rounded-field px-3 font-display',
        'text-ui font-medium text-ink-2 transition-colors duration-150 hoverOnly:bg-mist',
        'hoverOnly:text-ink', className)}>
      {children}
    </button>
  )
}

function Chooser({ onPick, onSkip }) {
  const panel = React.useRef(null)
  const first = React.useRef(null)
  const headId = React.useId()

  React.useEffect(() => {
    const was = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    first.current?.focus({ preventScroll: true })
    // App.jsx focuses main from a rAF after this effect, so focus is pulled back into the dialog.
    const onFocusIn = e => {
      if (!panel.current?.contains(e.target)) first.current?.focus({ preventScroll: true })
    }
    document.addEventListener('focusin', onFocusIn)
    const sel = 'button:not([disabled]),[href],input,[tabindex]:not([tabindex="-1"])'
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); onSkip(); return }
      if (e.key !== 'Tab') return
      const f = Array.from(panel.current?.querySelectorAll(sel) || [])
      if (!f.length) return
      const i = f.indexOf(document.activeElement)
      const to = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1)
      e.preventDefault()
      f[to].focus()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = was
    }
  }, [onSkip])

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center bg-ink/45 p-3 sm:items-center sm:p-5">
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={headId}
        className="max-h-[94dvh] w-full max-w-[36rem] overflow-y-auto overscroll-contain
          rounded-panel border border-rule bg-card shadow-lift">
        <div className="flex items-center gap-3 border-b border-rule px-5 py-2.5 sm:px-6">
          <Logo tone="paper" className="text-ui"/>
          <button type="button" onClick={onSkip}
            className="ml-auto min-h-[44px] shrink-0 rounded-field px-3 font-display text-ui
              font-semibold text-accent-ink transition-colors duration-150 hoverOnly:bg-accent-wash
              active:bg-accent-wash">
            Skip
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p id={headId} className="font-display text-head font-bold text-ink">
            What best describes you?
          </p>
          <p className="mt-1.5 max-w-[46ch] text-meta text-ink-2">
            Pick one to see what MindMap does for you. Every page stays in the menu.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {OPTIONS.map((o, i) => (
              <button key={o.id} type="button" ref={i === 0 ? first : null}
                onClick={() => onPick(o.id)}
                className="flex min-h-[72px] w-full items-center gap-3 rounded-panel border
                  border-rule bg-card px-4 py-3 text-left transition-colors duration-150
                  hoverOnly:bg-mist focus-visible:bg-mist active:bg-mist">
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-ui font-bold text-ink">{o.label}</span>
                  {o.hint && <span className="mt-0.5 block text-fine text-ink-3">{o.hint}</span>}
                </span>
                <ArrowRight aria-hidden className="size-4 shrink-0 text-ink-3"/>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-rule
          px-5 py-4 sm:px-6">
          <button type="button" onClick={onSkip}
            className="min-h-[44px] rounded-field border border-ink px-4 font-display text-ui
              font-medium text-ink transition-colors duration-150 hoverOnly:bg-mist active:bg-mist">
            Skip and look around
          </button>
          <p className="max-w-[34ch] text-fine text-ink-3">
            You can switch any time.
          </p>
        </div>
      </div>
    </div>
  )
}

export function Entry({ go, enabled = true }) {
  const now = React.useSyncExternalStore(watch, read, () => null)

  const leave = React.useCallback(() => {
    move(null)
    requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
  }, [])

  const pick = React.useCallback(id => {
    if (id === 'tour') { move('tour'); return }
    leave()
    const role = ['student', 'parent', 'pro'].includes(id) ? id : null
    const to = role ? { student: 'students', parent: 'parents', pro: 'pro' }[role] : id
    if (role) setPreferredRole(role)
    if (go) go(to)
    else location.hash = '#/' + to
  }, [go, leave])

  if (!enabled || now === null) return null
  if (now === 'tour') return <GuidedTour go={go} onDone={leave}/>
  return <Chooser onPick={pick} onSkip={leave}/>
}
