import React from 'react'
import { cn } from '../lib/utils'
import { Logo } from '../ui/logo'
import { ArrowRight } from '../ui/marks'
import { PRO } from '../lib/terms'
import { GuidedTour, captureHarness, replayIntro } from './Intro'
import { setPreferredRole, signedInHere } from '../account/store'

/* The front door, in the owner's words: "What best describes you", Student,
 * Parent, Medical Professional or Other; the first three route, Other starts
 * the tour in Intro.jsx. A question, not a gate: the page behind it stays,
 * the answer is dropped once acted on, and Skip leaves the visitor where they
 * were with the whole navigation in reach. */

/* Audience names come from lib/terms.js. */
const OPTIONS = [
  { id: 'student', label: 'Student' },
  { id: 'parent',  label: 'Parent' },
  { id: 'pro',     label: PRO },
  { id: 'tour',    label: 'Other', hint: 'A guided tour of each page' },
]

/* Which panel is up, held at module scope: the control that reopens the
   chooser lives in App.jsx, when Entry is rendering null. A one-value store
   with subscribers, the shape the survey already uses. */
let at = null                                  // null, 'ask' or 'tour'

/* Spec 0e, section 15: the walkthrough plays on every page load and no storage
   suppresses it. The latch is per document: one load offers the chooser once,
   a refresh offers it again, and `enabled` flipping (the admin route) does not
   bring it back. */
let asked = false
const watchers = new Set()
const read = () => at
const watch = f => { watchers.add(f); return () => { watchers.delete(f) } }
const move = s => { at = s; watchers.forEach(f => f()) }

/** Puts the chooser, and the tour behind its fourth option, back up.
 *  replayIntro() is the published name for "play it again" and stays in the
 *  call. Off the site navigation (spec 0e, section 15); the export stays for
 *  any caller that wants a control of its own. */
export function replayTour() {
  replayIntro()
  asked = true
  move('ask')
}

/** A plain button, no longer in the site navigation (spec 0e, section 15).
 *  Kept as the one import that gives a caller the sequence and its way back. */
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

  /* Modal while up: scroll locked, Tab stays inside, Escape is Skip. */
  React.useEffect(() => {
    const was = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    first.current?.focus({ preventScroll: true })
    /* Focus is held, not just taken: App.jsx focuses its main region from a
       rAF after this effect, which took the keyboard out of the dialog. */
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
    /* The menu drawer's scrim. Bottom sheet on a phone, centred from sm up. */
    <div className="fixed inset-0 z-[400] flex items-end justify-center bg-ink/45 p-3 sm:items-center sm:p-5">
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={headId}
        className="max-h-[94dvh] w-full max-w-[36rem] overflow-y-auto overscroll-contain
          rounded-panel border border-rule bg-card shadow-lift">
        {/* Skip sits here as well as at the foot: the chooser plays on every
            load and the way past it must never be hunted for. */}
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
            Pick one to sign in. Every page stays in the menu.
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
            Your choice stays on this device.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * The whole entry sequence: the chooser, and the tour the fourth choice starts.
 *
 * `go`       the site's router, from App.jsx. Optional: without it the tour
 *            drives the hash instead.
 * `enabled`  false renders nothing, for routes that are not for visitors.
 *            App.jsx passes `!admin`.
 */
export function Entry({ go, enabled = true }) {
  const now = React.useSyncExternalStore(watch, read, () => null)

  /* Decided on mount, because whether this runs depends on a prop. One ask
     per document; only the screenshot harness can hold it down. A device
     with an account signed in is not asked again (the owner: "NOT repeatedly
     do this on the same device where theyre signed in"). */
  React.useEffect(() => {
    if (!enabled || asked || read() !== null || captureHarness() || signedInHere()) return
    asked = true
    move('ask')
  }, [enabled])

  /* One exit for every choice and both ways out. App.jsx gives its main
     region an id and a tabindex for the keyboard to land on. */
  const leave = React.useCallback(() => {
    move(null)
    /* A frame later: while mounted, the chooser's own guard holds the keyboard. */
    requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
  }, [])

  /* Student, Parent and Medical Professional go to sign-in with that role
     pressed; signing in lands in that role's app. The fourth choice is the tour. */
  const pick = React.useCallback(id => {
    if (id === 'tour') { move('tour'); return }
    leave()
    const role = ['student', 'parent', 'pro'].includes(id) ? id : null
    const to = role ? 'signin' : id
    if (role) setPreferredRole(role)
    if (go) go(to)
    else location.hash = '#/' + to
  }, [go, leave])

  if (!enabled || now === null) return null
  if (now === 'tour') return <GuidedTour go={go} onDone={leave}/>
  return <Chooser onPick={pick} onSkip={leave}/>
}
