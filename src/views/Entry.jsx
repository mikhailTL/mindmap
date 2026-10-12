import React from 'react'
import { cn } from '../lib/utils'
import { Logo } from '../ui/logo'
import { ArrowRight } from '../ui/marks'
import { PRO, PRO_LC } from '../lib/terms'
import { GuidedTour, introSuppressed, suppressIntro, replayIntro } from './Intro'

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
  { id: 'student', label: 'Student', hint: 'What a week of readings looks like' },
  { id: 'parent',  label: 'Parent',  hint: 'What a parent is shown, and what they are not' },
  { id: 'pro',     label: PRO,       hint: `What a ${PRO_LC} sees across a year group` },
  { id: 'tour',    label: 'Other',
    hint: 'A guided tour: the site turns its own pages and explains each one' },
]

/* Which of the two panels is up, held at module scope rather than in Entry.
 *
 * The control that reopens the chooser cannot be a child of Entry: the header
 * lives in App.jsx, and by the time anybody wants the tour back this component
 * is rendering null. A one-value store with subscribers is how a button
 * anywhere in the tree puts it back, and it is the same shape as the external
 * store the survey already uses. */
let at = null                                  // null, 'ask' or 'tour'
const watchers = new Set()
const read = () => at
const watch = f => { watchers.add(f); return () => { watchers.delete(f) } }
const move = s => { at = s; watchers.forEach(f => f()) }

/** Clears this visit's refusal and puts the chooser back up. Wire a control to
 *  this, or to the <ReplayTour> button below, so the tour is reachable without
 *  clearing site data. */
export function replayTour() {
  replayIntro()
  move('ask')
}

/** A plain button for the header or the footer. Nothing about it is clever; it
 *  exists so the one import gives a caller both the sequence and its way back. */
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
        <div className="flex items-center gap-3 border-b border-rule px-5 py-3.5 sm:px-6">
          <Logo tone="paper" className="text-ui"/>
          <span className="ml-auto font-mono text-fine text-ink-3">Welcome</span>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p id={headId} className="font-display text-head font-bold text-ink">
            What best describes you?
          </p>
          <p className="mt-1.5 max-w-[46ch] text-meta text-ink-2">
            It only decides which page you start on. Every page stays in the menu.
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
            Nothing you pick here leaves your device.
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

  /* Decided on mount, not at module load: whether this runs at all depends on a
     prop, and the refusal is a sessionStorage read that belongs in an effect. A
     throwing storage reads as "not refused", so the worst failure under blocked
     storage is that the question gets asked. */
  React.useEffect(() => {
    if (enabled && read() === null && !introSuppressed()) move('ask')
  }, [enabled])

  /* One exit for all four choices and both ways out, so there is one place where
     the sequence is put away and one place that decides where the keyboard
     lands. App.jsx gives its main region an id and a tabindex for this; falling
     to <body> would lose a keyboard visitor the page they just arrived on. */
  const leave = React.useCallback(() => {
    suppressIntro()
    move(null)
    /* A frame later, after the panel has gone: while the chooser is still
       mounted it holds the keyboard, so focusing anything else now would be
       undone by its own guard. */
    requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
  }, [])

  const pick = React.useCallback(id => {
    if (id === 'tour') { suppressIntro(); move('tour'); return }
    leave()
    if (go) go(id)
    else location.hash = '#/' + id
  }, [go, leave])

  if (!enabled || now === null) return null
  if (now === 'tour') return <GuidedTour go={go} onDone={leave}/>
  return <Chooser onPick={pick} onSkip={leave}/>
}
