import React from 'react'
import { cn } from '../../lib/utils'
import { PRO_WRAP } from '../../lib/terms'
import { Check } from '../../ui/marks'
import { PASSWORD_MIN, SETTINGS, createAccount, signIn, takePreferredRole, validSecret } from '../../account/store'
import { field, fieldError, solid } from '../../account/ui'

// Every success lands on #/app, which is the Launch page once signed in.
const LONG = validSecret('x'.repeat(PASSWORD_MIN))
const PASS_HINT = LONG ? `At least ${PASSWORD_MIN} characters, or 4 to 6 digits.` : '4 to 6 digits.'

const ROLE_TILES = [
  { id: 'student', label: 'Teen' },
  { id: 'parent',  label: 'Parent' },
  { id: 'pro',     label: PRO_WRAP },
  { id: 'other',   label: 'Other' },
]

const ERROR = {
  role:     'Pick your role first.',
  name:     'Add your name.',
  email:    'Enter a working email address.',
  setting:  'Pick where you work.',
  passcode: LONG ? `Use at least ${PASSWORD_MIN} characters, or 4 to 6 digits.` : 'Use a password of 4 to 6 digits.',
  taken:    'That name or email already has an account. Sign in instead.',
  wrong:    'Email or password is wrong. Try again.',
  locked:   'Five wrong tries. Wait fifteen minutes, then try again.',
  offline:  'No connection. Check your internet and try again.',
}

const labelClass = 'block font-display text-fine font-medium text-ink-2'

function Tabs({ mode, onMode }) {
  const tabs = [['signup', 'Sign up'], ['signin', 'Sign in']]
  return (
    <div role="tablist" aria-label="Sign up or sign in" className="grid grid-cols-2 border-b border-rule">
      {tabs.map(([id, label]) => {
        const on = mode === id
        return (
          <button key={id} type="button" role="tab" aria-selected={on} id={`apphome-tab-${id}`}
            aria-controls="apphome-form" onClick={() => onMode(id)}
            className={cn('relative min-h-[48px] font-display text-ui transition-colors duration-150',
              'after:absolute after:inset-x-4 after:bottom-[-1px] after:h-[2px] after:rounded-bar',
              on ? 'font-bold text-ink after:bg-accent' : 'font-medium text-ink-3 after:bg-transparent hoverOnly:text-ink')}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function AuthPanel({ go, className }) {
  const [mode, setMode] = React.useState('signup')
  // Starts on the role picked in the site's onboarding, if any.
  const [role, setRole] = React.useState(takePreferredRole)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [pass, setPass] = React.useState('')
  const [setting, setSetting] = React.useState(null)
  const [err, setErr] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const refs = { role: React.useRef(null), name: React.useRef(null), email: React.useRef(null),
                 passcode: React.useRef(null), setting: React.useRef(null) }
  const up = mode === 'signup'

  function fail(at, code) {
    setErr({ at, code })
    requestAnimationFrame(() => refs[at]?.current?.focus())
  }
  const clear = at => { if (err?.at === at) setErr(null) }
  const bad = at => (err && err.at === at) || undefined
  const errId = 'apphome-error'

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    if (up) {
      if (!role) return fail('role', 'role')
      if (!name.trim()) return fail('name', 'name')
      if (!email.trim()) return fail('email', 'email')
      setBusy(true)
      const r = await createAccount({ role, name,
                                      email, passcode: pass, setting })
      setBusy(false)
      if (r.ok) { setErr(null); go('app'); return }
      const at = { passcode: 'passcode', email: 'email', setting: 'setting', role: 'role' }[r.reason] || 'name'
      fail(at, r.reason)
    } else {
      if (!email.trim()) return fail('email', 'email')
      if (!pass) return fail('passcode', 'wrong')
      setBusy(true)
      const r = await signIn(email, pass)
      setBusy(false)
      if (r === 'ok') { setErr(null); go('app'); return }
      fail('passcode', ERROR[r] ? r : 'wrong')
    }
  }

  return (
    <div className={cn('w-full overflow-hidden rounded-panel border border-rule bg-card shadow-card', className)}>
      <Tabs mode={mode} onMode={m => { setMode(m); setErr(null) }}/>
      <form id="apphome-form" role="tabpanel" aria-labelledby={`apphome-tab-${mode}`}
        onSubmit={submit} noValidate className="grid gap-3.5 p-4 text-left sm:p-5">
        {up && (
          <div>
            <span id="apphome-role" className={labelClass}>Your role</span>
            <div role="radiogroup" aria-labelledby="apphome-role" aria-describedby={bad('role') && errId}
              className="mt-1 grid grid-cols-2 gap-2">
              {ROLE_TILES.map((t, i) => {
                const on = role === t.id
                return (
                  <button key={t.id} type="button" role="radio" aria-checked={on}
                    ref={i === 0 ? refs.role : undefined}
                    onClick={() => { setRole(t.id); clear('role') }}
                    className={cn('flex min-h-[52px] items-center justify-between gap-2 rounded-field border',
                      'px-3 py-2 text-left font-display text-fine leading-[1.2] transition-colors duration-150',
                      on ? 'border-accent bg-accent-wash font-bold text-ink'
                         : 'border-rule bg-card font-medium text-ink-2 hoverOnly:border-accent hoverOnly:text-ink')}>
                    {t.label}
                    {on && <Check aria-hidden className="size-4 shrink-0 text-accent"/>}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {up && (
          <div>
            <label htmlFor="apphome-name" className={labelClass}>Name</label>
            <input id="apphome-name" ref={refs.name} type="text" value={name} maxLength={40}
              autoComplete="name" autoCapitalize="words"
              aria-invalid={bad('name')} aria-describedby={bad('name') && errId}
              onChange={e => { setName(e.target.value); clear('name') }}
              className={cn(field, bad('name') && fieldError)}/>
          </div>
        )}
        <div>
          <label htmlFor="apphome-email" className={labelClass}>Email</label>
          <input id="apphome-email" ref={refs.email} type="email" value={email}
            autoComplete={up ? 'email' : 'username'} inputMode="email" autoCapitalize="none" spellCheck={false}
            aria-invalid={bad('email')} aria-describedby={bad('email') && errId}
            onChange={e => { setEmail(e.target.value); clear('email') }}
            className={cn(field, bad('email') && fieldError)}/>
        </div>
        <div>
          <label htmlFor="apphome-pass" className={labelClass}>Password</label>
          <input id="apphome-pass" ref={refs.passcode} type="password" value={pass}
            autoComplete={up ? 'new-password' : 'current-password'}
            {...(LONG ? { maxLength: 128 } : { inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 })}
            aria-invalid={bad('passcode')}
            aria-describedby={bad('passcode') ? errId : (up ? 'apphome-pass-hint' : undefined)}
            onChange={e => { setPass(LONG ? e.target.value : e.target.value.replace(/\D/g, '')); clear('passcode') }}
            className={cn(field, bad('passcode') && fieldError)}/>
          {up && <span id="apphome-pass-hint" className="mt-1 block text-fine text-ink-3">{PASS_HINT}</span>}
        </div>
        {up && role === 'pro' && (
          <div>
            <span id="apphome-setting" className={labelClass}>Where you work</span>
            <div role="radiogroup" aria-labelledby="apphome-setting" aria-describedby={bad('setting') && errId}
              className="mt-1 grid grid-cols-3 gap-2">
              {SETTINGS.map((s, i) => {
                const on = setting === s.value
                return (
                  <button key={s.value} type="button" role="radio" aria-checked={on}
                    ref={i === 0 ? refs.setting : undefined}
                    onClick={() => { setSetting(s.value); clear('setting') }}
                    className={cn('min-h-[44px] rounded-field border px-1.5 font-display text-fine leading-[1.2]',
                      'transition-colors duration-150',
                      on ? 'border-accent bg-accent-wash font-bold text-ink'
                         : 'border-rule bg-card font-medium text-ink-2 hoverOnly:border-accent')}>
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {err && (
          <p id={errId} role="alert" className="m-0 font-display text-fine font-medium text-crit">
            {ERROR[err.code] || ERROR.wrong}
          </p>
        )}
        <button type="submit" disabled={busy} className={cn(solid, 'mt-1 w-full')}>
          {up ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
