import React from 'react'
import { cn } from '../../lib/utils'
import { ActivityScreen, Sheet, OnDevice, Choice, Action, FIELD } from '../../toolkit/shell'
import { CopyButton } from '../../kit/pro/common'
import { load, save } from './store'

/* Pieces the four Career tools share: the screen, a saved state hook, a
   step row, a labelled field, a copyable result and the closing buttons. */

export { Sheet, Choice, Action, CopyButton }

export const uid = () => Math.random().toString(36).slice(2, 9)

/* State that lives in localStorage under mindmap.skills.<id>. */
export function useSaved(id, fallback) {
  const [v, setV] = React.useState(() => load(id, fallback))
  React.useEffect(() => { save(id, v) }, [id, v])
  const patch = React.useCallback(p => setV(o => ({ ...o, ...(typeof p === 'function' ? p(o) : p) })), [])
  return [v, patch, setV]
}

export function Screen({ tool, onExit, problem, doing, children }) {
  const Icon = tool.icon
  return (
    <ActivityScreen id={tool.id} family={tool.family} title={tool.title} onBack={onExit || null}
      icon={<Icon/>}>
      <div className="mx-auto w-full max-w-[40rem]">
        <p className="text-sec text-ink">{problem}</p>
        <p className="mt-1 text-ui text-ink-2">{doing}</p>
        <div className="mt-5 grid gap-4">{children}</div>
        <OnDevice className="mt-5">Saved on this device only. Nothing is sent anywhere.</OnDevice>
      </div>
    </ActivityScreen>
  )
}

export function H({ children, className, as: As = 'h3' }) {
  return <As className={cn('font-display text-row font-bold tracking-tight text-ink', className)}>{children}</As>
}

/* A row of numbered steps. A step can be opened once it has been reached. */
export function Steps({ steps, at, reached = 0, onGo }) {
  const i = steps.findIndex(s => s[0] === at)
  return (
    <nav aria-label="Steps">
      <ol className="m-0 grid list-none gap-1.5 p-0" style={{ gridTemplateColumns:`repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map(([id, label], k) => {
          const on = k === i, open = k <= Math.max(reached, i)
          return (
            <li key={id}>
              <button type="button" disabled={!open} aria-current={on ? 'step' : undefined}
                onClick={() => onGo(id)}
                className={cn('flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-[12px] border px-1',
                  'font-display text-fine transition-colors duration-150 disabled:opacity-50',
                  on ? 'kit-fill border-transparent font-bold text-white' : 'kit-hoverable border-rule bg-card font-semibold text-ink')}>
                <span className="tabular-nums">{k + 1}</span>
                <span className="max-w-full truncate">{label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function Field({ label, hint, className, area = false, ...rest }) {
  const id = React.useId()
  const Tag = area ? 'textarea' : 'input'
  return (
    <div className={className}>
      <label htmlFor={id} className="font-display text-ui font-semibold text-ink">{label}</label>
      {hint && <p id={id + 'h'} className="text-fine text-ink-2">{hint}</p>}
      <Tag id={id} aria-describedby={hint ? id + 'h' : undefined}
        className={cn(FIELD, 'mt-1.5', area && 'min-h-[7.5rem] resize-y')} {...rest}/>
    </div>
  )
}

/* Text to copy, shown as it will be pasted. */
export function CopyBlock({ text, label = 'Copy', title, className }) {
  return (
    <div className={cn('rounded-[14px] border border-rule bg-card p-4', className)}>
      {title && <p className="font-display text-ui font-bold text-ink">{title}</p>}
      <p className="mt-1 whitespace-pre-wrap break-words text-sec text-ink">{text}</p>
      <CopyButton text={text} label={label} className="mt-3 flex-wrap"/>
    </div>
  )
}

/* A row that ticks on and off: a real toggle button. */
export function Tick({ on, onClick, children, className }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cn('flex min-h-[52px] w-full items-start gap-3 rounded-[12px] border p-3 text-left',
        'transition-colors duration-150', on ? 'kit-ground border-transparent' : 'kit-hoverable border-rule bg-card', className)}>
      <span aria-hidden className={cn('mt-0.5 grid size-6 shrink-0 place-items-center rounded-[7px] border-2',
        on ? 'kit-fill border-transparent text-white' : 'border-ink-3 bg-card')}>
        {on && (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>
        )}
      </span>
      <span className="min-w-0 flex-1 text-sec text-ink">{children}</span>
    </button>
  )
}

/* Done and Start again, at the end of every tool. */
export function Finish({ onExit, onAgain, againLabel = 'Start again' }) {
  const done = () => { if (onExit) onExit(); else location.hash = '#/toolkit' }
  return (
    <div className="flex flex-wrap gap-3">
      <Action onClick={done}>Done</Action>
      <Action kind="quiet" onClick={onAgain}>{againLabel}</Action>
    </div>
  )
}

export function Nav({ back, next, nextLabel = 'Next', disabled = false }) {
  return (
    <div className="flex flex-wrap gap-3">
      {next && <Action onClick={next} disabled={disabled}>{nextLabel}</Action>}
      {back && <Action kind="quiet" onClick={back}>Back</Action>}
    </div>
  )
}

export function Chips({ children, className }) {
  return <div className={cn('flex flex-wrap gap-2', className)}>{children}</div>
}
