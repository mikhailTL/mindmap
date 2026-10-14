import React from 'react'
import { cn } from '../lib/utils'
import { ArmedButton, Panel } from '../app/controls'
import { Bell, Bin, Check, Download, Exit, Grid, Key, People } from '../ui/marks'
import { ROLE_LABEL, SETTINGS, changePasscode, deleteAccount, exportAll, signOut, updateProfile, useAccount } from './store'
import { Avatar, AvatarPicker, Row, field, fieldError, outline, solid } from './ui'
import { SignIn } from './SignIn'

/* The account portal and its settings, one screen.
 *
 * Who you are at the top, then short rows with icons to the places an
 * account reaches, then the passcode, then your data. One sentence says
 * where accounts live, and it is the only place in the app that says so. */

const SHARING_ROUTE = { student: 'shared', parent: 'privacy', pro: 'app-pro' }
const SHARING_LABEL = { student: 'Sharing', parent: 'Sharing', pro: 'Students' }

function download(name, text) {
  try {
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = name
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch {}
}

/* Picture, name and email. The picture saves on the tap; the two fields
   save together. */
function Profile({ me }) {
  const [name, setName] = React.useState(me.name)
  const [email, setEmail] = React.useState(me.email || '')
  const [saved, setSaved] = React.useState(false)
  const [err, setErr] = React.useState(null)
  React.useEffect(() => { setName(me.name); setEmail(me.email || '') }, [me.name, me.email])
  const dirty = name.trim() !== me.name || email.trim().toLowerCase() !== (me.email || '')
  function save(e) {
    e.preventDefault()
    const next = updateProfile({ name, email })
    const mailKept = (next?.email || '') === email.trim().toLowerCase()
    setName(next?.name || me.name); setEmail(next?.email || '')
    if (!mailKept && email.trim()) { setErr('Check the email address.'); return }
    if (!mailKept && me.role !== 'student') { setErr('An email is needed.'); return }
    setErr(null); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
  return (
    <form onSubmit={save} noValidate className="p-4">
      <AvatarPicker value={me.avatar} onChange={a => updateProfile({ avatar: a })} name={me.name}/>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <label htmlFor="acct-name" className="block font-display text-fine font-medium text-ink-2">Name</label>
          <input id="acct-name" type="text" value={name} maxLength={40} autoComplete="username"
            onChange={e => setName(e.target.value)} className={field}/>
        </div>
        <div>
          <label htmlFor="acct-email" className="block font-display text-fine font-medium text-ink-2">Email</label>
          <input id="acct-email" type="email" value={email} autoComplete="email" inputMode="email"
            autoCapitalize="none" spellCheck={false} aria-invalid={err ? true : undefined}
            aria-describedby={err ? 'acct-email-err' : undefined}
            onChange={e => { setEmail(e.target.value); setErr(null) }} className={cn(field, err && fieldError)}/>
        </div>
      </div>
      {err && <p id="acct-email-err" role="alert" className="mt-2 font-display text-fine font-medium text-crit">{err}</p>}
      <button type="submit" className={cn(outline, 'mt-3')} disabled={!dirty || !name.trim()}>
        {saved ? <><Check aria-hidden className="size-4"/>Saved</> : 'Save'}
      </button>
    </form>
  )
}

/* Where a professional works. The console reads the words off the choice.
   The options say where, so the group's name is spoken only. */
function Setting({ me }) {
  return (
    <div role="radiogroup" aria-label="Where you work" className="grid grid-cols-3 gap-2 border-t border-rule p-4">
      {SETTINGS.map(s => {
        const on = me.setting === s.value
        return (
          <button key={s.value} type="button" role="radio" aria-checked={on}
            onClick={() => updateProfile({ setting: s.value })}
            className={cn('min-h-[44px] rounded-field border px-2 font-display text-fine transition-colors duration-150',
              on ? 'border-accent-ink bg-accent font-bold text-paper'
                 : 'border-rule bg-card font-medium text-ink-2 hoverOnly:bg-mist')}>
            {s.label}
          </button>
        )
      })}
    </div>
  )
}

function PasscodeForm() {
  const [cur, setCur] = React.useState('')
  const [next, setNext] = React.useState('')
  const [state, setState] = React.useState(null)   /* 'ok' | 'wrong' | 'invalid' */
  const curRef = React.useRef(null)
  const nextRef = React.useRef(null)
  async function save(e) {
    e.preventDefault()
    const r = await changePasscode(cur, next)
    setState(r)
    if (r === 'ok') { setCur(''); setNext('') }
    else requestAnimationFrame(() => (r === 'wrong' ? curRef : nextRef).current?.focus())
  }
  const digits = v => v.replace(/\D/g, '').slice(0, 6)
  const wrong = state === 'wrong', invalid = state === 'invalid'
  return (
    <form onSubmit={save} noValidate className="p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pass-cur" className="block font-display text-fine font-medium text-ink-2">Current</label>
          <input id="pass-cur" ref={curRef} type="password" value={cur} inputMode="numeric" pattern="[0-9]*"
            autoComplete="current-password" maxLength={6} aria-invalid={wrong || undefined}
            aria-describedby={wrong ? 'pass-err' : undefined}
            onChange={e => { setCur(digits(e.target.value)); setState(null) }}
            className={cn(field, wrong && fieldError)}/>
        </div>
        <div>
          <label htmlFor="pass-new" className="block font-display text-fine font-medium text-ink-2">New</label>
          <input id="pass-new" ref={nextRef} type="password" value={next} inputMode="numeric" pattern="[0-9]*"
            autoComplete="new-password" maxLength={6} aria-invalid={invalid || undefined}
            placeholder="4 to 6 digits" aria-describedby={invalid ? 'pass-err' : undefined}
            onChange={e => { setNext(digits(e.target.value)); setState(null) }}
            className={cn(field, invalid && fieldError)}/>
        </div>
      </div>
      {state && state !== 'ok' && (
        <p id="pass-err" role="alert" className="mt-2 font-display text-fine font-medium text-crit">
          {wrong ? 'Wrong passcode. Try again.' : 'Passcode is 4 to 6 digits.'}
        </p>
      )}
      <button type="submit" className={cn(outline, 'mt-3')} disabled={!cur || !next}>
        <Key aria-hidden className="size-4"/>{state === 'ok' ? 'Saved' : 'Save'}
      </button>
    </form>
  )
}

export function Account({ go }) {
  const me = useAccount()
  if (!me) return <SignIn go={go}/>
  const role = me.role

  function leave() { signOut(); go('app-' + role) }
  function erase() { deleteAccount(); go('app-' + role) }

  return (
    <main className="wrap">
      <div className="flex items-center gap-3.5">
        <Avatar name={me.name} avatar={me.avatar} size="lg"/>
        <div className="min-w-0">
          <p className="truncate font-display text-row font-bold text-ink">{me.name}</p>
          <p className="truncate text-fine text-ink-3">{ROLE_LABEL[role]}</p>
        </div>
      </div>

      <div className="mt-3.5 grid gap-3 lg:mt-4 lg:grid-cols-3 lg:gap-4">
        <Panel title="Your profile">
          <Profile me={me}/>
          {role === 'pro' && <Setting me={me}/>}
        </Panel>

        <Panel title="Your passcode" className="self-start">
          <PasscodeForm/>
        </Panel>

        <div className="grid gap-3 self-start lg:gap-4">
        <Panel title="Your people">
          <Row label="Network" Mark={People} onClick={() => go('network')}/>
          <Row label={SHARING_LABEL[role]} Mark={Grid} onClick={() => go(SHARING_ROUTE[role])}/>
          {role === 'student' && <Row label="Reminders" Mark={Bell} onClick={() => go('app-notify')}/>}
        </Panel>

        <Panel title="Your data">
          <div className="p-4">
            <button type="button" className={solid}
              onClick={() => download(`mindmap-${me.name.replace(/\s+/g, '-').toLowerCase()}.json`, exportAll())}>
              <Download aria-hidden className="size-4"/>Export as JSON
            </button>
          </div>
          <div className="border-t border-rule p-4">
            <ArmedButton armedLabel="Delete for good" onConfirm={erase}>
              <Bin aria-hidden className="size-4"/>Delete my account
            </ArmedButton>
          </div>
        </Panel>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-fine text-ink-3">Accounts are kept on this device.</p>
        <button type="button" onClick={leave} className={outline}>
          <Exit aria-hidden className="size-4"/>Sign out
        </button>
      </div>
    </main>
  )
}
