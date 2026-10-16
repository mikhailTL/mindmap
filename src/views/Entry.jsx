import React from 'react'
import { cn } from '../lib/utils'
import { Logo } from '../ui/logo'
import { ArrowRight } from '../ui/marks'
import { PRO } from '../lib/terms'
import { GuidedTour, captureHarness, replayIntro } from './Intro'
import { setPreferredRole, signedInHere } from '../account/store'

/* The front door, asked for in these words: "Upon entering app, there should be
 * an option for WHat best describes you, 'Student' 'parent' 'Medical
 * professional' or 'Other' each should take to different portions of the site
 * and other should give an onboarding tour where the site automatically goes
 * thru pages and simply explains them."
 *
 * So: four choices, three of them a route, the fourth the tour in Intro.jsx.
 *
 * It is a question and not a gate. The page a visitor arrived on is still
 * behind it, the answer is thrown away as soon as it has been acted on, and
 * skipping leaves them exactly where they already were with the whole site's
 * navigation in reach. Nothing here is a step anybody has to complete.
 */

/* Hints are the same sentences the nav's own menu uses for these three pages,
 * so the chooser and the menu cannot describe the same page two ways. The
 * audience names come from lib/terms.js. */
const OPTIONS = [
  { id: 'student', label: 'Student', hint: 'Sign in, or make an account' },
  { id: 'parent',  label: 'Parent',  hint: 'Sign in, or make an account' },
  { id: 'pro',     label: PRO,       hint: 'Sign in, or make an account' },
  { id: 'tour',    label: 'Other',
    hint: 'Take a guided tour that explains each page' },
]

/* Which of the two panels is up, held at module scope rather than in Entry.
 *
 * The control that reopens the chooser cannot be a child of Entry: the header
 * lives in App.jsx, and by the time anybody wants the tour back this component
 * is rendering null. A one-value store with subscribers is how a button
 * anywhere in the tree puts it back, and it is the same shape as the external
 * store the survey already uses. */
let at = null                                  // null, 'ask' or 'tour'

/* Spec 0e, section 15: the walkthrough plays on every page load and no storage
 * suppresses it. This latch is per document, not per browser: it lives as long
 * as the page does, so one load offers the chooser once and a refresh offers it
 * again. It is what stops the question coming back when `enabled` flips, which
 * it does whenever the admin route is entered or left. */
let asked = false
const watchers = new Set()
const read = () => at
const watch = f => { watchers.add(f); return () => { watchers.delete(f) } }
const move = s => { at = s; watchers.forEach(f => f()) }

/** Puts the chooser, and so the guided tour behind its fourth option, back up.
 *  Nothing is stored any more, so there is no refusal to clear; replayIntro()
 *  is kept in the call because it is the published name for "play it again".
 *
 *  Spec 0e, section 15 takes this off the site navigation. The export stays:
 *  the tour is reachable from the chooser's "Other" option, and a caller that
 *  wants a control of its own has one here. */
export function replayTour() {
  replayIntro()
  asked = true
  move('ask')
}

/** A plain button, no longer mounted in the site navigation (spec 0e, section
 *  15). Kept because it is the one import that gives a caller both the sequence
 *  and its way back. */
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

  /* Modal while it is up: the scroll is locked, the keyboard cannot walk out of
     it, and Escape is Skip. It is four buttons and a way out, so the ring is
     whatever is inside rather than a managed list. */
  React.useEffect(() => {
    const was = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    first.current?.focus({ preventScroll: true })
    /* Focus has to be held, not just taken: App.jsx focuses its main region
       from a rAF that runs after this effect, which took the keyboard out of
       this dialog and left Tab walking the page behind it. */
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
    /* bg-ink/45 is the scrim the menu drawer already uses. Bottom sheet on a
       phone, where a centred box leaves the thumb a long way from the choices;
       centred from sm up. */
    <div className="fixed inset-0 z-[400] flex items-end justify-center bg-ink/45 p-3 sm:items-center sm:p-5">
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={headId}
        className="max-h-[94dvh] w-full max-w-[36rem] overflow-y-auto overscroll-contain
          rounded-panel border border-rule bg-card shadow-lift">
        {/* The skip sits here as well as at the foot, because the walkthrough
            now plays on every load and the way past it may never be hunted
            for. Plain type on the label, no capsule, no mono. */}
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
            Pick one to sign in. You can still open every page from the menu.
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
                  <span className="mt-0.5 block text-fine text-ink-3">{o.hint}</span>
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
 *            drives the hash instead, which is the same router's front door.
 * `enabled`  false renders nothing at all, for routes that are not for
 *            visitors. App.jsx passes `!admin`.
 */
export function Entry({ go, enabled = true }) {
  const now = React.useSyncExternalStore(watch, read, () => null)

  /* Decided on mount, not at module load, because whether this runs at all
     depends on a prop. One ask per document: the latch is what makes `enabled`
     flipping -- which it does on the way in and out of the admin route -- stop
     putting the chooser back over a page somebody is already reading. The
     screenshot harness is the only thing that can hold it down, and nothing in
     the interface can set that. */
  React.useEffect(() => {
    /* A device with an account signed in is not asked again: the owner,
       "NOT repeatedly do this on the same device where theyre signed in". */
    if (!enabled || asked || read() !== null || captureHarness() || signedInHere()) return
    asked = true
    move('ask')
  }, [enabled])

  /* One exit for all four choices and both ways out, so there is one place where
     the sequence is put away and one place that decides where the keyboard
     lands. App.jsx gives its main region an id and a tabindex for this; falling
     to <body> would lose a keyboard visitor the page they just arrived on. */
  const leave = React.useCallback(() => {
    move(null)
    /* A frame later, after the panel has gone: while the chooser is still
       mounted it holds the keyboard, so focusing anything else now would be
       undone by its own guard. */
    requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
  }, [])

  /* Student, Parent and Medical Professional go to sign-in, opening on
     Create with that role pressed; signing in lands in that role's app. The
     fourth choice is the tour. */
  const pick = React.useCallback(id => {
    if (id === 'tour') { move('tour'); return }
    leave()
    const role = id === 'student' ? 'student' : id === 'parent' ? 'parent' : id === 'pro' ? 'pro' : null
    const to = role ? 'signin' : id
    if (role) setPreferredRole(role)
    if (go) go(to)
    else location.hash = '#/' + to
  }, [go, leave])

  if (!enabled || now === null) return null
  if (now === 'tour') return <GuidedTour go={go} onDone={leave}/>
  return <Chooser onPick={pick} onSkip={leave}/>
}
