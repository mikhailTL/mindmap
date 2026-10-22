import React from 'react'
import { cn } from '../lib/utils'
import { cardClass, cardInk } from '../ui/card'
import { Check, Cross, Never } from '../ui/marks'

// Shared settings controls. Rows are at least 56 px tall and show state as a word as well as a colour.
export function Panel({ title, lede, aside, children, className, id, variant, hue = 'accent' }) {
  return (
    <section id={id}
      className={cn(variant ? cardClass(variant, hue) : 'rounded-panel border border-rule bg-card',
        'overflow-hidden', className)}>
      <div className={cn('flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b px-4 py-3',
        variant ? cardInk(variant, hue).line : 'border-rule')}>
        <h3 className="font-display text-meta font-bold text-ink">{title}</h3>
        {aside && <span className="ml-auto font-mono text-fine tabular-nums text-ink-3">{aside}</span>}
        {lede && <p className="w-full max-w-[62ch] text-fine text-ink-3">{lede}</p>}
      </div>
      {children}
    </section>
  )
}

function Track({ on }) {
  return (
    <span aria-hidden
      className={cn('relative block h-7 w-[3.25rem] shrink-0 rounded-bar border',
        'transition-colors duration-150 ease',
        on ? 'border-accent-ink bg-accent' : 'border-ruling bg-mist')}>
      <span
        className={cn('absolute left-[3px] top-[3px] block size-5 rounded-chip border bg-card',
          'transition-transform duration-150 ease-[var(--ease-out)]',
          on ? 'translate-x-[1.5rem] border-accent-ink' : 'translate-x-0 border-ink-3')}/>
    </span>
  )
}

let seq = 0
const nextId = () => 'mm-' + (seq += 1)

export function SwitchRow({ label, hint, checked, onChange, disabled = false, note, className }) {
  const id = React.useRef(nextId()).current
  const describedBy = [hint && id + '-h', note && id + '-n'].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('border-t border-rule first:border-t-0', className)}>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled}
        aria-describedby={describedBy}
        onClick={() => onChange(!checked)}
        className={cn('flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left',
          'transition-colors duration-150 ease',
          disabled ? 'cursor-not-allowed opacity-60' : 'hoverOnly:bg-mist/50')}>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-ui font-medium text-ink">{label}</span>
          {hint && <span id={id + '-h'} className="mt-0.5 block text-fine text-ink-3">{hint}</span>}
        </span>
        <span aria-hidden
          className={cn('w-8 shrink-0 text-right font-display text-fine font-bold',
            checked ? 'text-accent' : 'text-ink-3')}>
          {checked ? 'On' : 'Off'}
        </span>
        <Track on={checked}/>
      </button>
      {note && (
        <p id={id + '-n'} className="-mt-1 px-4 pb-3 text-fine text-ink-3">{note}</p>
      )}
    </div>
  )
}

export function NeverRow({ label, hint }) {
  return (
    <div className="flex min-h-[56px] items-start gap-3 border-t border-rule px-4 py-3 first:border-t-0">
      <Never aria-hidden className="mt-0.5 size-5 shrink-0 text-ink-3"/>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-ui font-medium text-ink-2">{label}</span>
        {hint && <span className="mt-0.5 block text-fine text-ink-3">{hint}</span>}
      </span>
      <span className="mt-0.5 shrink-0 font-display text-fine font-bold text-ink-3">Never</span>
    </div>
  )
}

export function FixedRow({ label, hint }) {
  return (
    <div className="flex min-h-[56px] items-start gap-3 border-t border-rule px-4 py-3 first:border-t-0">
      <span aria-hidden
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-chip bg-accent text-paper">
        <Check className="size-3"/>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-ui font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block max-w-[62ch] text-fine text-ink-2">{hint}</span>}
      </span>
      <span className="shrink-0 font-display text-fine font-bold text-ink-2">Always on</span>
    </div>
  )
}

// Radiogroup with a roving tabindex: one tab stop, and arrow keys move the selection.
export function ChoiceRows({ label, value, options, onChange, className }) {
  const refs = React.useRef([])
  const index = Math.max(0, options.findIndex(o => o.value === value))

  function onKey(e) {
    const last = options.length - 1
    let to = null
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') to = index === last ? 0 : index + 1
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') to = index === 0 ? last : index - 1
    else if (e.key === 'Home') to = 0
    else if (e.key === 'End') to = last
    if (to == null) return
    e.preventDefault()
    onChange(options[to].value)
    refs.current[to]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey} className={className}>
      {options.map((o, i) => {
        const on = o.value === value
        return (
          <button key={String(o.value)} type="button" role="radio" aria-checked={on}
            ref={el => { refs.current[i] = el }}
            tabIndex={i === index ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn('flex min-h-[56px] w-full items-start gap-3 border-t border-rule px-4 py-3',
              'text-left transition-colors duration-150 ease first:border-t-0',
              on ? 'bg-accent-wash' : 'hoverOnly:bg-mist/50')}>
            <span aria-hidden
              className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-chip border-2',
                on ? 'border-accent-ink bg-accent text-paper' : 'border-ruling bg-card')}>
              {on && <Check className="size-3"/>}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn('block font-display text-ui text-ink',
                on ? 'font-bold' : 'font-medium')}>{o.label}</span>
              {o.hint && <span className="mt-0.5 block max-w-[62ch] text-fine text-ink-3">{o.hint}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function Chips({ label, options, selected, onToggle, className }) {
  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {options.map(o => {
        const on = selected.includes(o.value)
        return (
          <button key={String(o.value)} type="button" aria-pressed={on}
            onClick={() => onToggle(o.value)}
            className={cn('min-h-[44px] min-w-[44px] rounded-field border px-3 font-display text-ui',
              'transition-colors duration-150 ease',
              on ? 'border-accent-ink bg-accent font-bold text-paper'
                 : 'border-rule bg-card font-medium text-ink-2 hoverOnly:bg-mist')}>
            <span className="sr-only">{o.full || o.label}</span>
            <span aria-hidden>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// text-ui is 16px, the minimum that stops iOS Safari zooming the page on focus.
export function TimeField({ label, value, onChange, disabled = false, className }) {
  const id = React.useRef(nextId()).current
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="block font-display text-fine font-medium text-ink-2">{label}</label>
      <input id={id} type="time" value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className={cn('mt-1 block min-h-[44px] w-full rounded-field border border-rule bg-card px-3',
          'font-mono text-ui tabular-nums text-ink transition-colors duration-150 ease',
          'hoverOnly:border-ink-3 disabled:opacity-60')}/>
    </div>
  )
}

// Two-step destructive button; the armed state resets after 6 s.
export function ArmedButton({ children, armedLabel, onConfirm, className }) {
  const [armed, setArmed] = React.useState(false)
  React.useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 6000)
    return () => clearTimeout(t)
  }, [armed])
  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)}
        className={cn('inline-flex min-h-[44px] items-center gap-2 rounded-field border border-ink-2',
          'px-4 font-display text-ui font-medium text-ink transition-colors duration-150 ease',
          'hoverOnly:bg-mist', className)}>
        {children}
      </button>
    )
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" autoFocus onClick={() => { setArmed(false); onConfirm() }}
        className={cn('inline-flex min-h-[44px] items-center gap-2 rounded-field border border-crit',
          'bg-crit px-4 font-display text-ui font-bold text-paper',
          'transition-colors duration-150 ease', className)}>
        {armedLabel}
      </button>
      <button type="button" onClick={() => setArmed(false)}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-field px-3 font-display
          text-ui font-medium text-ink-2 transition-colors duration-150 ease hoverOnly:text-ink">
        <Cross aria-hidden className="size-3.5"/>Keep it as it is
      </button>
    </span>
  )
}
