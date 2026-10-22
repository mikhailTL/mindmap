import React from 'react'
import { cn } from '../../lib/utils'
import { ActivityScreen, Sheet, Choice, Action, FIELD, OnDevice } from '../../toolkit/shell'
import { storeKey } from './logic'

export function useStored(id, initial) {
  const key = storeKey(id)
  const [state, setState] = React.useState(() => {
    try {
      const raw = typeof localStorage !== 'undefined' && localStorage.getItem(key)
      const v = raw ? JSON.parse(raw) : null
      return v && typeof v === 'object' ? { ...initial, ...v } : initial
    } catch { return initial }
  })
  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) { first.current = false; return }
    try { localStorage.setItem(key, JSON.stringify(state)) } catch {}
  }, [key, state])
  /* patch(section, value) or patch(section, fn(old)) */
  const patch = React.useCallback((part, v) =>
    setState(s => ({ ...s, [part]: typeof v === 'function' ? v(s[part]) : v })), [])
  return [state, patch, setState]
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export function LifeScreen({ id, family, title, icon: Icon, onExit, problem, doing, children }) {
  return (
    <ActivityScreen id={id} family={family} title={title} onBack={onExit || null}
      icon={Icon ? <Icon/> : null}>
      <div className="mx-auto w-full max-w-[44rem]">
        <p className="text-sec text-ink">{problem}</p>
        <p className="mt-1 text-sec text-ink-2">{doing}</p>
        {children}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
          <OnDevice>Only you see this.</OnDevice>
          <Action kind="quiet" onClick={() => onExit ? onExit() : (location.hash = '#/toolkit')}>Done</Action>
        </div>
      </div>
    </ActivityScreen>
  )
}

export function Sections({ items, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="mt-4 flex flex-wrap gap-2">
      {items.map(([id, name]) => (
        <Choice key={id} on={value === id} onClick={() => onChange(id)}>{name}</Choice>
      ))}
    </div>
  )
}

export function Heading({ children, className }) {
  return <h3 className={cn('font-display text-row font-bold tracking-tight text-ink', className)}>{children}</h3>
}

export function Lead({ children, className }) {
  return <p className={cn('mt-1 text-ui text-ink-2', className)}>{children}</p>
}

export function Panel({ className, children }) {
  return <Sheet className={cn('mt-4', className)}>{children}</Sheet>
}

export function Tick({ checked, onChange, children, className }) {
  return (
    <label className={cn('flex min-h-[48px] cursor-pointer items-start gap-3 rounded-[12px] px-2 py-2.5',
      'hoverOnly:bg-mist/60', className)}>
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)}
        className="peer sr-only"/>
      <span aria-hidden className={cn('mt-0.5 grid size-6 shrink-0 place-items-center rounded-[7px] border-2',
        'peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2',
        'peer-focus-visible:outline-[color:var(--kit-deep)]',
        checked ? 'kit-fill border-transparent text-white' : 'border-ruling bg-card')}>
        {checked && (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>
        )}
      </span>
      <span className={cn('min-w-0 flex-1 text-ui', checked ? 'text-ink-2 line-through decoration-ink-3' : 'text-ink')}>
        {children}
      </span>
    </label>
  )
}

export function Checklist({ items, ticks = {}, onTick, className }) {
  return (
    <ul className={cn('mt-2 grid gap-0.5', className)}>
      {items.map(([id, text]) => (
        <li key={id}><Tick checked={ticks[id]} onChange={v => onTick({ ...ticks, [id]: v })}>{text}</Tick></li>
      ))}
    </ul>
  )
}

export function Field({ label, hint, className, as = 'input', children, ...rest }) {
  const id = React.useId()
  const As = as
  return (
    <div className={className}>
      <label htmlFor={id} className="block font-display text-ui font-semibold text-ink">{label}</label>
      {hint && <p className="mt-0.5 text-fine text-ink-2">{hint}</p>}
      <As id={id} className={cn(FIELD, 'mt-1.5 text-ui', as === 'textarea' && 'min-h-[6rem] resize-y')} {...rest}>
        {children}
      </As>
    </div>
  )
}

export function Figure({ label, value, tone, small, className }) {
  return (
    <div className={cn('min-w-0 rounded-[14px]', small ? 'p-2.5' : 'p-3.5', tone === 'bad' ? 'bg-[#fdece8]' : 'kit-ground', className)}>
      <p className="text-fine font-semibold text-ink-2">{label}</p>
      <p className={cn('mt-1 font-display font-bold tabular-nums', small ? 'text-sec' : 'text-num',
        tone === 'bad' ? 'text-[#a11b1b]' : 'kit-ink')}>{value}</p>
    </div>
  )
}

export function CopyButton({ text, label = 'Copy', className }) {
  const [said, setSaid] = React.useState('')
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setSaid('Copied.') }
    catch { setSaid('Copy is blocked here. Select the text and copy it.') }
  }
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-3', className)}>
      <Action kind="quiet" onClick={copy} disabled={!text}>{label}</Action>
      <span role="status" className="text-fine text-ink-2">{said}</span>
    </span>
  )
}

/* Remove a row: a 48px square button with a spoken name. */
export function RemoveButton({ name, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={`Remove ${name}`}
      className="grid size-12 shrink-0 place-items-center rounded-[12px] text-ink-2 hoverOnly:bg-mist hoverOnly:text-ink">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/></svg>
    </button>
  )
}

const CHIP = {
  ok:      'bg-[#dcefe4] text-[#0f5836]',
  soon:    'bg-[#f5ecd7] text-[#6b4c05]',
  due:     'bg-[#fdece8] text-[#a11b1b]',
  overdue: 'bg-[#fdece8] text-[#a11b1b]',
  unset:   'bg-mist text-ink-2',
}
export function Chip({ state = 'unset', children }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-fine font-bold', CHIP[state])}>{children}</span>
}

export { Action, Choice, FIELD }
