import React from 'react'
import { cn } from '../../lib/utils'
import { ActivityScreen, FIELD, OnDevice } from '../../toolkit/shell'

/* Shared pieces for the School tools: storage, the screen wrapper, labelled
 * fields, a copy button and the icons. */

/* ── storage: this device only, every access wrapped ─────────────────── */

const KEY = id => `mindmap.skills.${id}`

export function load(id, fallback) {
  try {
    const raw = localStorage.getItem(KEY(id))
    if (!raw) return fallback
    const v = JSON.parse(raw)
    return v && typeof v === 'object' ? { ...fallback, ...v } : fallback
  } catch { return fallback }
}

export function save(id, value) {
  try { localStorage.setItem(KEY(id), JSON.stringify(value)); return true } catch { return false }
}

/* State that saves itself on every change. */
export function useSaved(id, fallback) {
  const [v, setV] = React.useState(() => load(id, fallback))
  React.useEffect(() => { save(id, v) }, [id, v])
  return [v, setV]
}

export const uid = () => Math.random().toString(36).slice(2, 9)

/* ── layout ──────────────────────────────────────────────────────────── */

export function Screen({ title, family, icon, onExit, problem, plan, children }) {
  return (
    <ActivityScreen family={family} title={title} onBack={onExit || null}
      icon={icon ? React.createElement(icon) : null}>
      <div className="mx-auto w-full max-w-[40rem]">
        <p className="text-sec text-ink">{problem}</p>
        <p className="mt-1 text-ui text-ink-2">{plan}</p>
        <div className="mt-5 grid gap-4">{children}</div>
        <OnDevice className="mt-5">Saved on this device only. Nothing is sent anywhere.</OnDevice>
      </div>
    </ActivityScreen>
  )
}

export function H({ children, className }) {
  return <h3 className={cn('font-display text-row font-bold tracking-tight text-ink', className)}>{children}</h3>
}

export function Field({ label, hint, className, area = false, short = false, ...rest }) {
  const id = React.useId()
  const Tag = area ? 'textarea' : 'input'
  return (
    <div className={className}>
      <label htmlFor={id} className="font-display text-ui font-semibold text-ink">{label}</label>
      {hint && <p id={id + 'h'} className="text-fine text-ink-2">{hint}</p>}
      <Tag id={id} aria-describedby={hint ? id + 'h' : undefined}
        className={cn(FIELD, 'mt-1.5', area && (short ? 'min-h-[4.5rem] resize-y' : 'min-h-[8rem] resize-y'))} {...rest}/>
    </div>
  )
}

export function Pick({ label, value, onChange, options, className }) {
  const id = React.useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="font-display text-ui font-semibold text-ink">{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className={cn(FIELD, 'mt-1.5 min-h-[52px] appearance-auto')}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </div>
  )
}

/* A row of three answers, as one labelled group. */
export function Seg({ label, value, onChange, options, className, small = false }) {
  return (
    <div role="group" aria-label={label} className={cn('grid gap-2', className)}
      style={{ gridTemplateColumns:`repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(([v, t]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
          className={cn('kit-choice min-h-[48px] rounded-field border px-2 font-display', small ? 'text-fine sm:text-ui' : 'text-ui',
            value === v ? 'kit-fill border-transparent font-bold text-white'
                        : 'kit-hoverable border-rule bg-card font-semibold text-ink')}>
          {t}
        </button>
      ))}
    </div>
  )
}

export function CopyButton({ text, className, children = 'Copy' }) {
  const [done, setDone] = React.useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true) }
    catch { setDone(false) }
    setTimeout(() => setDone(false), 1800)
  }
  return (
    <button type="button" onClick={copy}
      className={cn('kit-quiet inline-flex min-h-[48px] items-center justify-center rounded-[12px] px-5',
        'font-display text-ui font-bold', className)}>
      <span aria-live="polite">{done ? 'Copied' : children}</span>
    </button>
  )
}

/* A small tick or cross box that says its state in words for screen readers. */
export function Tick({ ok }) {
  return (
    <span aria-hidden className={cn('grid size-6 shrink-0 place-items-center rounded-full',
      ok ? 'kit-fill text-white' : 'border border-rule bg-card text-ink-3')}>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round">
        {ok ? <path d="M5 12.5l4.5 4.5L19 7.5"/> : <path d="M8 12h8"/>}
      </svg>
    </span>
  )
}

/* ── icons ───────────────────────────────────────────────────────────── */

const I = ({ children }) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0">{children}</svg>
)
export const CramIcon    = () => <I><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M7 13h4M7 16.5h7"/></I>
export const SourceIcon  = () => <I><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5M8 10.5l2 2 3.5-4"/></I>
export const EnoughIcon  = () => <I><path d="M4 18h16"/><path d="M6 18V9M10 18V6M14 18v-7M18 18v-4"/><path d="M5 5.5l2.5-2 2.5 2"/></I>
export const ActiveIcon  = () => <I><path d="M5 4h10l4 4v12H5z"/><path d="M9.5 10a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 17h.01"/></I>
