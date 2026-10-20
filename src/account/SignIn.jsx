import React from 'react'
import { cn } from '../lib/utils'
import { Panel } from '../app/controls'
import { ArrowRight, Check, People, Person, Plus } from '../ui/marks'
import { PRO_WRAP } from '../lib/terms'
import { SECRET_MAX, SETTINGS, createAccount, current, homeFor, signIn, takePreferredRole, useAccount } from './store'
import { AvatarChooser, field, fieldError, outline, solid } from './ui'
import { fitsRole } from './avatar-catalog'
import { Settings } from './Settings'

/* Sign in, or create an account.
 *
 * Two modes on one screen. Sign in wants a name or email and a password.
 * Create asks who you are (four tiles: the three audiences or Other), then
 * name, email, password (8 or more characters; an old 4 to 6 digit passcode
 * still signs in), where
 * a professional works, and a picture. A conventional form on purpose:
 * labels, autocomplete, the right keypad, one inline error, focus on the
 * first field at fault.
 *
 * No server. Nothing typed here goes anywhere, so the screen never says an
 * email will arrive. The app never waits on this screen either: every start
 * screen works signed out, and the top bar's account button is the way here. */

const ClipMark = p => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0">
    <rect x="5" y="4.5" width="14" height="16" rx="1.5"/>
    <path d="M9 4.5V3h6v1.5M9 13l2 2 4-4"/>
  </svg>
)

const OtherMark = p => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="shrink-0">
    <circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>
  </svg>
)

const TILES = [
  { role: 'student', label: 'Student', Mark: Person },
  { role: 'parent',  label: 'Parent',  Mark: People },
  { role: 'pro',     label: PRO_WRAP,  Mark: ClipMark },
  { role: 'other',   label: 'Other',   Mark: OtherMark },
]

const ERROR = {
  role:     'No role chosen yet. Pick who you are first.',
  name:     'The name field is empty. Fill it in.',
  email:    'Email is missing or not valid. Enter a working address.',
  setting:  'Nothing chosen under Where you work. Pick one.',
  passcode: 'Password is missing or too short. Use 8 or more characters.',
  taken:    'That name or email already has an account. Sign in instead.',
  wrong:    'Wrong password. Try again.',
  locked:   'Five wrong tries. Wait fifteen minutes, then try again.',
  offline:  'No connection. Check your internet and try again.',
}

const labelClass = 'block font-display text-fine font-medium text-ink-2'

/* `after` is the route to open once signed in, for a screen that sent the
   reader here (the network, answering an invite); without it, the app for
   the account's role. `bare` leaves out the settings menu under the form. */
export function SignIn({ go, note, after = null, bare = false }) {
  /* Arriving from the front door's chooser: Create, with that role pressed. */
  const preset = React.useMemo(() => takePreferredRole(), [])
  /* Signed in, the settings under the form are this account's: its profile
     and its network. */
  const me = useAccount()
  const [mode, setMode] = React.useState(preset ? 'create' : 'signin')
  const [role, setRole] = React.useState(preset)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [pass, setPass] = React.useState('')
  const [setting, setSetting] = React.useState(null)
  const [avatar, setAvatar] = React.useState(null)
  /* Each role has its own pictures (fitsRole): a role change drops the one
     that no longer fits. */
  React.useEffect(() => {
    setAvatar(a => (a && !fitsRole(role || 'student', a) ? null : a))
  }, [role])
  const [err, setErr] = React.useState(null)     /* { at, code } */
  const [busy, setBusy] = React.useState(false)
  const refs = { role: React.useRef(null), name: React.useRef(null), email: React.useRef(null),
                 passcode: React.useRef(null), setting: React.useRef(null) }
  const creating = mode === 'create'

  function fail(at, code) {
    setErr({ at, code })
    requestAnimationFrame(() => refs[at]?.current?.focus())
  }
  function switchTo(m) { setMode(m); setErr(null) }

  async function create(e) {
    e.preventDefault()
    if (busy) return
    if (!role) return fail('role', 'role')
    setBusy(true)
    const r = await createAccount({ role, name, passcode: pass, email, setting, avatar })
    setBusy(false)
    if (r.ok) { setErr(null); go(after || homeFor(r.account.role)); return }
    const at = { passcode: 'passcode', email: 'email', setting: 'setting', role: 'role' }[r.reason] || 'name'
    fail(at, r.reason)
  }

  async function enter(e) {
    e.preventDefault()
    if (busy) return
    if (!name.trim()) return fail('name', 'name')
    if (!pass) return fail('passcode', 'passcode')
    setBusy(true)
    const r = await signIn(name, pass)
    setBusy(false)
    if (r === 'ok') { setErr(null); go(after || homeFor(current()?.role)); return }
    fail('passcode', ERROR[r] ? r : 'wrong')
  }

  const errId = 'signin-error'
  const bad = at => (err && err.at === at) || undefined
  const describe = (at, hint) => (bad(at) ? errId : hint)

  return (
    <main className="wrap">
      <h2 className="font-display font-bold text-ink">{creating ? 'Create your account' : 'Welcome back'}</h2>
      {note && <p className="mt-1 text-fine text-ink-3">{note}</p>}

      <div className="mt-3.5 grid grid-cols-1 gap-3 lg:mt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-4">
        {creating ? (
          <div role="radiogroup" aria-label="Who you are" aria-describedby={bad('role') && errId}
            className="grid grid-cols-2 gap-2.5 self-start sm:grid-cols-4 lg:grid-cols-1 lg:gap-3">
            {TILES.map((t, i) => {
              const on = role === t.role
              return (
                <button key={t.role} type="button" role="radio" aria-checked={on}
                  ref={i === 0 ? refs.role : undefined}
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
        ) : (
          <div className="lit flex flex-wrap items-center gap-3 self-start p-3.5 lg:flex-col lg:items-start lg:p-4">
            <span className="min-w-[9rem] flex-1 font-display text-ui font-bold text-ink">New here?</span>
            <button type="button" onClick={() => switchTo('create')}
              className={cn(solid, 'w-full sm:w-auto')}>
              <Plus aria-hidden className="size-4"/>Create an account
            </button>
          </div>
        )}

        <form onSubmit={creating ? create : enter} noValidate className="min-w-0">
          <Panel title={creating ? 'Your details' : 'Sign in'}>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              <div className={cn(!creating && 'sm:col-span-2')}>
                <label htmlFor="signin-name" className={labelClass}>{creating ? 'Name' : 'Name or email'}</label>
                <input id="signin-name" ref={refs.name} type="text" value={name}
                  autoComplete="username" autoCapitalize={creating ? 'words' : 'none'} maxLength={80}
                  aria-invalid={bad('name')} aria-describedby={describe('name')}
                  onChange={e => { setName(e.target.value); if (bad('name')) setErr(null) }}
                  className={cn(field, bad('name') && fieldError)}/>
              </div>
              {creating && (
                <div>
                  <label htmlFor="signin-email" className={labelClass}>Email</label>
                  <input id="signin-email" ref={refs.email} type="email" value={email}
                    autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false}
                    aria-invalid={bad('email')} aria-describedby={describe('email', role === 'student' ? 'signin-email-hint' : undefined)}
                    onChange={e => { setEmail(e.target.value); if (bad('email')) setErr(null) }}
                    className={cn(field, bad('email') && fieldError)}/>
                  {role === 'student' && (
                    <span id="signin-email-hint" className="mt-1 block text-fine text-ink-3">A student can leave this blank.</span>
                  )}
                </div>
              )}
              <div>
                <label htmlFor="signin-pass" className={labelClass}>Password</label>
                <input id="signin-pass" ref={refs.passcode} type="password" value={pass}
                  autoComplete={creating ? 'new-password' : 'current-password'}
                  maxLength={SECRET_MAX} spellCheck={false} autoCapitalize="none"
                  aria-invalid={bad('passcode')} aria-describedby={describe('passcode', 'signin-hint')}
                  onChange={e => { setPass(e.target.value); if (bad('passcode')) setErr(null) }}
                  className={cn(field, bad('passcode') && fieldError)}/>
                <span id="signin-hint" className="mt-1 block text-fine text-ink-3">
                  {creating ? 'Use 8 or more characters.' : 'An old 4 to 6 digit passcode still works.'}
                </span>
              </div>
              {creating && role === 'pro' && (
                <div className="sm:col-span-2" role="radiogroup" aria-label="Where you work"
                  aria-describedby={bad('setting') && errId}>
                  <span className={labelClass}>Where you work</span>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {SETTINGS.map((s, i) => {
                      const on = setting === s.value
                      return (
                        <button key={s.value} type="button" role="radio" aria-checked={on}
                          ref={i === 0 ? refs.setting : undefined}
                          onClick={() => { setSetting(s.value); if (bad('setting')) setErr(null) }}
                          className={cn('min-h-[44px] rounded-field border px-2 font-display text-fine',
                            'transition-colors duration-150',
                            on ? 'border-accent-ink bg-accent font-bold text-paper'
                               : 'border-rule bg-card font-medium text-ink-2 hoverOnly:bg-mist')}>
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {creating && (
                <div className="min-w-0 sm:col-span-2">
                  <span className={labelClass}>Picture</span>
                  <AvatarChooser role={role || 'student'} value={avatar} onChange={setAvatar} name={name} className="mt-1"/>
                </div>
              )}
            </div>
            {err && (
              <p id={errId} role="alert" className="px-4 pb-1 font-display text-fine font-medium text-crit">
                {ERROR[err.code] || ERROR.wrong}
              </p>
            )}
            <div className="flex flex-wrap gap-2.5 border-t border-rule p-4">
              {creating ? (
                <>
                  <button type="submit" disabled={busy} className={cn(solid, 'flex-1 sm:flex-none')}>
                    <Plus aria-hidden className="size-4"/>Create
                  </button>
                  <button type="button" onClick={() => switchTo('signin')} className={cn(outline, 'flex-1 sm:flex-none')}>
                    Sign in instead
                  </button>
                </>
              ) : (
                <button type="submit" disabled={busy} className={cn(solid, 'flex-1 sm:flex-none')}>
                  Sign in<ArrowRight aria-hidden className="size-4"/>
                </button>
              )}
            </div>
          </Panel>
        </form>
      </div>
      {!bare && <Settings me={me} go={go} className="mt-8 border-t border-rule pt-6"/>}
    </main>
  )
}
