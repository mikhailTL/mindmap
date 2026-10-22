import React from 'react'
import { cn } from '../../lib/utils'
import { Action } from '../../toolkit/shell'
import { RESOURCES } from '../../app/resources'

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch { return false }
  }
}

export function CopyButton({ text, label = 'Copy', kind = 'quiet', className }) {
  const [state, setState] = React.useState('idle')
  React.useEffect(() => {
    if (state === 'idle') return
    const t = setTimeout(() => setState('idle'), 2200)
    return () => clearTimeout(t)
  }, [state])
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <Action kind={kind} onClick={async () => setState((await copyText(text)) ? 'ok' : 'fail')}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8.5" y="8.5" width="12" height="12" rx="1.5"/>
          <path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>
        </svg>
        {label}
      </Action>
      <span aria-live="polite" className="text-fine font-semibold text-ink-2">
        {state === 'ok' ? 'Copied' : state === 'fail' ? 'Select the text to copy it' : ''}
      </span>
    </span>
  )
}

/* A small heading inside a tool. */
export function Label({ children, className }) {
  return <h3 className={cn('font-display text-ui font-bold text-ink', className)}>{children}</h3>
}

// Crisis wording points to the local emergency number and the 988 line listed in app/resources.js.
const LINE = RESOURCES.find(r => r.id === '988')

export function Crisis({ className, strong = false }) {
  return (
    <section role={strong ? 'alert' : undefined}
      className={cn('rounded-[18px] border bg-card p-4 sm:p-5',
        strong ? 'border-crit shadow-card' : 'border-rule', className)}>
      <h3 className="flex items-center gap-2 font-display text-ui font-bold text-crit">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden focusable="false" fill="none"
          stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l9.5 17h-19z"/><path d="M12 10v4.5M12 17.5h.01"/>
        </svg>
        If a teen may be in danger now
      </h3>
      <ul className="m-0 mt-2.5 flex list-none flex-col gap-1.5 p-0 text-sec text-ink">
        <li>Follow your service's safety protocol.</li>
        <li>Call your local emergency number.</li>
        <li>Do not leave them alone if risk is immediate.</li>
        <li>In the US, the 988 Lifeline takes calls and texts.</li>
      </ul>
      {LINE && (
        <div className="mt-3 flex flex-wrap gap-2.5">
          {LINE.actions.filter(a => a.kind !== 'chat').map(a => (
            <a key={a.href} href={a.href}
              className="inline-flex min-h-[48px] items-center rounded-[12px] border border-rule bg-card px-4
                font-display text-ui font-bold text-crit hoverOnly:bg-mist">{a.label}</a>
          ))}
          <a href="#/help"
            className="inline-flex min-h-[48px] items-center rounded-[12px] border border-rule bg-card px-4
              font-display text-ui font-bold text-ink hoverOnly:bg-mist">All crisis lines</a>
        </div>
      )}
    </section>
  )
}

export function Lines({ rows, className }) {
  return (
    <ul className={cn('m-0 flex list-none flex-col p-0', className)}>
      {rows.map(r => (
        <li key={r} className="flex items-start gap-3 border-t border-rule py-2.5 first:border-t-0">
          <span aria-hidden className="kit-fill mt-[0.6em] size-2 shrink-0 rounded-bar"/>
          <span className="min-w-0 flex-1 text-sec text-ink">{r}</span>
        </li>
      ))}
    </ul>
  )
}

export const TODAY_LONG = () => new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
