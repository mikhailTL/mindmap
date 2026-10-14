import React from 'react'
import { cn } from '../lib/utils'
import { Panel } from '../app/controls'
import { ArrowRight, Check, People, Person, Plus } from '../ui/marks'
import { PRO } from '../lib/terms'
import { createAccount, signIn } from './store'
import { field, fieldError, outline, solid } from './ui'

/* Sign in.
 *
 * Three tiles for who you are, then a name and a passcode. "Create" opens an
 * account with the chosen role; "Sign in" needs only the name and passcode.
 * A conventional form on purpose: labels, autocomplete, a numeric keypad for
 * the passcode, one inline error, focus on the first field at fault.
 *
 * No email and no server. The app never waits on this screen: every start
 * screen works signed out, and the top bar's account button is the way here. */

/* A stethoscope-free mark for the third audience: the caduceus and the cross
   both read as "hospital". A clipboard with a tick is the console. */
const ClipMark = p => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0">
    <rect x="5" y="4.5" width="14" height="16" rx="1.5"/>
    <path d="M9 4.5V3h6v1.5M9 13l2 2 4-4"/>
  </svg>
)

const TILES = [
  { role: 'student', label: 'Student', Mark: Person },
  { role: 'parent',  label: 'Parent',  Mark: People },
  { role: 'pro',     label: PRO,       Mark: ClipMark },
]

const ERROR = {
  role:     'Choose who you are.',
  name:     'Enter a name.',
  passcode: 'Passcode is 4 to 6 digits.',
  taken:    'Name already in use here. Sign in instead.',
  wrong:    'Wrong passcode. Try again.',
}

export function SignIn({ go, note }) {
  const [role, setRole] = React.useState(null)
  const [name, setName] = React.useState('')
  const [pass, setPass] = React.useState('')
  const [err, setErr] = React.useState(null)     /* { at: 'role'|'name'|'passcode', code } */
  const [busy, setBusy] = React.useState(false)
  const tiles = React.useRef([])
  const nameRef = React.useRef(null)
  const passRef = React.useRef(null)

  function fail(at, code) {
    setErr({ at, code })
    requestAnimationFrame(() => {
      if (at === 'role') tiles.current[0]?.focus()
      else if (at === 'name') nameRef.current?.focus()
      else passRef.current?.focus()
    })
  }

  async function create() {
    if (busy) return
    if (!role) return fail('role', 'role')
    setBusy(true)
    const r = await createAccount({ role, name, passcode: pass })
    setBusy(false)
    if (r.ok) { setErr(null); go('account'); return }
    fail(r.reason === 'passcode' ? 'passcode' : 'name', r.reason)
  }

  async function enter(e) {
    e.preventDefault()
    if (busy) return
    if (!name.trim()) return fail('name', 'name')
    if (!pass) return fail('passcode', 'passcode')
    setBusy(true)
    const r = await signIn(name, pass)
    setBusy(false)
    if (r === 'ok') { setErr(null); go('account'); return }
    fail('passcode', 'wrong')
  }

  const errId = 'signin-error'
  const nameBad = err && err.at === 'name'
  const passBad = err && err.at === 'passcode'

  return (
    <main className="wrap">
      <h2 className="font-display font-bold text-ink">Who are you?</h2>
      {note && <p className="mt-1 text-fine text-ink-3">{note}</p>}

      <div className="mt-3.5 grid gap-3 lg:mt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-4">
        {/* The role. A radiogroup drawn as tiles. */}
        <div role="radiogroup" aria-label="Who you are" aria-describedby={err?.at === 'role' ? errId : undefined}
          className="grid grid-cols-3 gap-2.5 lg:grid-cols-1 lg:gap-3">
          {TILES.map((t, i) => {
            const on = role === t.role
            return (
              <button key={t.role} type="button" role="radio" aria-checked={on}
                ref={el => { tiles.current[i] = el }}
                onClick={() => { setRole(t.role); if (err?.at === 'role') setErr(null) }}
                className={cn('flex min-h-[104px] flex-col items-start justify-between gap-3',
                  'rounded-panel border p-3 text-left transition-colors duration-150',
                  'sm:min-h-[120px] sm:p-4 lg:min-h-0 lg:flex-row lg:items-center lg:py-4',
                  on ? 'border-accent bg-accent-wash' : 'border-rule bg-card hoverOnly:border-accent')}>
                <span aria-hidden className={cn('grid size-9 shrink-0 place-items-center rounded-field',
                  on ? 'bg-accent text-paper' : 'bg-accent-wash text-accent-ink')}>
                  <t.Mark size={18}/>
                </span>
                <span className="flex w-full min-w-0 items-end justify-between gap-2 lg:items-center">
                  <span className="font-display text-ui font-bold leading-[1.22] text-ink">{t.label}</span>
                  {on && <Check aria-hidden className="mb-0.5 size-4 shrink-0 text-accent"/>}
                </span>
              </button>
            )
          })}
        </div>

        <form onSubmit={enter} noValidate>
          <Panel title="Your details">
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <div>
                <label htmlFor="signin-name" className="block font-display text-fine font-medium text-ink-2">
                  Name
                </label>
                <input id="signin-name" ref={nameRef} type="text" value={name}
                  autoComplete="username" autoCapitalize="words" maxLength={40}
                  aria-invalid={nameBad || undefined} aria-describedby={nameBad ? errId : undefined}
                  onChange={e => { setName(e.target.value); if (nameBad) setErr(null) }}
                  className={cn(field, nameBad && fieldError)}/>
              </div>
              <div>
                <label htmlFor="signin-pass" className="block font-display text-fine font-medium text-ink-2">
                  Passcode
                </label>
                <input id="signin-pass" ref={passRef} type="password" value={pass}
                  autoComplete="current-password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                  aria-invalid={passBad || undefined} aria-describedby={passBad ? errId : 'signin-hint'}
                  onChange={e => { setPass(e.target.value.replace(/\D/g, '')); if (passBad) setErr(null) }}
                  className={cn(field, passBad && fieldError)}/>
                <span id="signin-hint" className="mt-1 block text-fine text-ink-3">4 to 6 digits.</span>
              </div>
            </div>
            {err && (
              <p id={errId} role="alert" className="px-4 pb-1 font-display text-fine font-medium text-crit">
                {ERROR[err.code] || ERROR.wrong}
              </p>
            )}
            <div className="flex flex-wrap gap-2.5 border-t border-rule p-4">
              <button type="button" onClick={create} disabled={busy} className={cn(solid, 'flex-1 sm:flex-none')}>
                <Plus aria-hidden className="size-4"/>Create
              </button>
              <button type="submit" disabled={busy} className={cn(outline, 'flex-1 sm:flex-none')}>
                Sign in<ArrowRight aria-hidden className="size-4"/>
              </button>
            </div>
          </Panel>
        </form>
      </div>
    </main>
  )
}
