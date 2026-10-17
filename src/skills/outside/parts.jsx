import React from 'react'
import { cn } from '../../lib/utils'
import { ActivityScreen, Sheet, OnDevice, Action } from '../../toolkit/shell'

/* Pieces the three Outside tools share: the screen, the opening two lines,
   the step heading that takes focus when the step changes, a copy button and
   the "only on this phone" line. */

export const I = ({ children }) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0">{children}</svg>
)

export function Screen({ id, family, title, icon, onExit, children }) {
  const back = onExit ? { onBack:onExit } : { back:'#/toolkit' }
  return (
    <ActivityScreen id={id} family={family} title={title} icon={icon} backLabel="Toolkit" {...back}>
      <div className="mx-auto max-w-[44rem]">{children}</div>
    </ActivityScreen>
  )
}

export function Intro({ problem, doing }) {
  return (
    <div className="mb-5">
      <p className="font-body text-sec text-ink">{problem}</p>
      <p className="mt-1 font-body text-ui text-ink-2">{doing}</p>
    </div>
  )
}

/* "Step 2 of 4" and the step's name. Takes focus when it changes so a screen
   reader and a keyboard land at the top of the new step. */
export function StepHead({ n, of, title, first = false }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (first) return
    ref.current?.focus({ preventScroll:true })
    ref.current?.scrollIntoView?.({ block:'start', behavior:'auto' })
  }, [n, title])
  return (
    <div className="mb-3">
      {of > 0 && <p className="text-fine font-semibold text-ink-2">Step {n} of {of}</p>}
      <h3 ref={ref} tabIndex={-1} className="scroll-mt-4 font-display text-row font-bold tracking-tight text-ink
        outline-none">{title}</h3>
    </div>
  )
}

export function Local({ className }) {
  return <OnDevice className={cn('mt-6', className)}>Only you see this.</OnDevice>
}

export function Row({ className, children }) {
  return <div className={cn('mt-5 flex flex-wrap gap-3', className)}>{children}</div>
}

export function CopyButton({ text, label = 'Copy' }) {
  const [done, setDone] = React.useState(false)
  const copy = async () => {
    let ok = false
    try { await navigator.clipboard.writeText(text); ok = true } catch {}
    if (!ok) {
      try {
        const t = document.createElement('textarea')
        t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'
        document.body.appendChild(t); t.select(); ok = document.execCommand('copy'); t.remove()
      } catch {}
    }
    setDone(ok)
    if (ok) setTimeout(() => setDone(false), 1800)
  }
  return (
    <Action kind="quiet" onClick={copy} aria-live="polite">{done ? 'Copied' : label}</Action>
  )
}

/* A panel in the tool's own wash, for the one result a tool ends on. */
export function Result({ className, children }) {
  return (
    <section className={cn('kit-ground rounded-[18px] p-4 sm:p-6', className)}>{children}</section>
  )
}

/* A safety panel. Always ink on white with a heavier rule, never a colour
   that could be missed. */
export function Safety({ title, children, className }) {
  return (
    <Sheet className={cn('border-2 border-ink-3', className)}>
      <h4 className="font-display text-ui font-bold text-ink">{title}</h4>
      <div className="mt-2 grid gap-2 text-ui text-ink">{children}</div>
    </Sheet>
  )
}

export function Done({ onExit, children = 'Done' }) {
  return onExit
    ? <Action onClick={onExit}>{children}</Action>
    : <a href="#/toolkit" className="kit-btn inline-flex min-h-[52px] items-center justify-center rounded-[12px]
        px-6 font-display text-ui font-bold">{children}</a>
}
