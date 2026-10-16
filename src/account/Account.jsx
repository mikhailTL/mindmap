import React from 'react'
import { cn } from '../lib/utils'
import { ArmedButton, Panel } from '../app/controls'
import { ArrowLeft, Bell, Bin, Check, Devices, Download, Exit, Grid, Info, Key, People, Person } from '../ui/marks'
import { CONSENT_SHORT, PRO } from '../lib/terms'
import {
  ROLE_LABEL, SETTINGS, backend, changePasscode, deleteAccount, exportAll, listNetwork,
  signOut, signOutOthers, updateProfile, useAccount,
} from './store'
import { Avatar, AvatarPicker, Row, field, fieldError, outline, solid } from './ui'
import { SignIn } from './SignIn'

/* The account portal.
 *
 * An index of grouped rows, each leading to one focused screen, the way the
 * Settings app and Dexcom Clarity do it: nothing on the index is a field.
 * The sections live at #/account/<section>; `section` arrives from App.jsx.
 * Every section has a way back, a short title, and no paragraph.
 *
 * Where the data lives is said in one place, on About, from the store's
 * own answer: the server when the deploy has one, otherwise this device. */

const SECTIONS = {
  profile:  { title: 'Your profile',          Mark: Person },
  passcode: { title: 'Passcode and sign-in',  Mark: Key },
  sharing:  { title: 'Sharing and privacy',   Mark: Grid },
  data:     { title: 'Your data',             Mark: Download },
  about:    { title: 'About MindMap',         Mark: Info },
}

const SHARING_ROUTE = { student: 'shared', parent: 'privacy', pro: 'app-pro' }
const SHARING_LABEL = { student: 'Sharing', parent: 'Sharing record', pro: 'Students' }

const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

const WHERE = () => (backend() === 'remote' ? 'Saved to your MindMap account' : 'Kept on this device')

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

const when = iso => {
  if (!iso) return 'Not yet'
  try {
    return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  } catch { return iso.slice(0, 10) }
}

const labelClass = 'block font-display text-fine font-medium text-ink-2'

/* ── The index ──────────────────────────────────────────────────────────── */

function Index({ me, go }) {
  const role = me.role
  const linked = listNetwork(me.id).filter(l => l.status === 'active').length
  const open = s => go('account/' + s)
  return (
    <main className="wrap">
      <button type="button" onClick={() => open('profile')}
        className="flex w-full items-center gap-3.5 rounded-panel border border-rule bg-card p-3.5
          text-left transition-colors duration-150 hoverOnly:bg-mist/50 active:bg-mist/50">
        <Avatar name={me.name} avatar={me.avatar} size="lg"/>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-row font-bold text-ink">{me.name}</span>
          <span className="block truncate text-fine text-ink-3">{ROLE_LABEL[role]}{me.email ? ` · ${me.email}` : ''}</span>
        </span>
        <span className="shrink-0 font-display text-fine font-medium text-accent-ink">Edit</span>
      </button>

      <div className="mt-3.5 grid gap-3 lg:mt-4 lg:grid-cols-3 lg:gap-4">
        <Panel title="Your account" className="self-start">
          <Row label="Profile" Mark={Person} onClick={() => open('profile')}/>
          <Row label="Passcode and sign-in" Mark={Key} onClick={() => open('passcode')}/>
        </Panel>
        <Panel title="Your settings" className="self-start">
          <Row label="Notifications" Mark={Bell} onClick={() => go('app-notify')}/>
          <Row label="Sharing and privacy" Mark={Grid} onClick={() => open('sharing')}/>
          <Row label="Network" Mark={People} aside={String(linked)} onClick={() => go('network')}/>
        </Panel>
        <Panel title="Data and app" className="self-start">
          <Row label="Your data" Mark={Download} onClick={() => open('data')}/>
          <Row label="About" Mark={Info} aside={VERSION} onClick={() => open('about')}/>
        </Panel>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-fine text-ink-3">{WHERE()}.</p>
        <button type="button" onClick={() => { signOut(); go('app-' + role) }} className={outline}>
          <Exit aria-hidden className="size-4"/>Sign out
        </button>
      </div>
    </main>
  )
}

/* ── A section shell ────────────────────────────────────────────────────── */

function Section({ title, go, children }) {
  return (
    <main className="wrap">
      <button type="button" onClick={() => go('account')}
        className="-ml-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-field px-2 font-display
          text-ui font-medium text-ink-2 transition-colors duration-150 hoverOnly:text-ink">
        <ArrowLeft aria-hidden className="size-4"/>Account
      </button>
      <h2 className="mt-1 font-display font-bold text-ink">{title}</h2>
      <div className="mt-3.5 grid gap-3 lg:mt-4 lg:grid-cols-2 lg:gap-4">{children}</div>
    </main>
  )
}

/* ── Profile ────────────────────────────────────────────────────────────── */

function Profile({ me, go }) {
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
    if (!mailKept && email.trim()) { setErr('That email address is not valid. Check it and try again.'); return }
    if (!mailKept && me.role !== 'student') { setErr('Your account needs an email. Enter one.'); return }
    setErr(null); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
  return (
    <Section title={SECTIONS.profile.title} go={go}>
      <Panel title="Your picture" className="self-start">
        <div className="p-4">
          <AvatarPicker value={me.avatar} onChange={a => updateProfile({ avatar: a })} name={me.name}/>
        </div>
      </Panel>
      <Panel title="Your details" className="self-start">
        <form onSubmit={save} noValidate className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="acct-name" className={labelClass}>Name</label>
              <input id="acct-name" type="text" value={name} maxLength={40} autoComplete="username"
                onChange={e => setName(e.target.value)} className={field}/>
            </div>
            <div>
              <label htmlFor="acct-email" className={labelClass}>Email</label>
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
        <div className="flex min-h-[48px] items-center justify-between gap-3 border-t border-rule px-4 py-2.5">
          <span className="font-display text-ui font-medium text-ink">Role</span>
          <span className="font-display text-fine font-bold text-ink-2">{ROLE_LABEL[me.role]}</span>
        </div>
        {me.role === 'pro' && (
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
        )}
      </Panel>
    </Section>
  )
}

/* ── Passcode and sign-in ───────────────────────────────────────────────── */

function Passcode({ me, go }) {
  const [cur, setCur] = React.useState('')
  const [next, setNext] = React.useState('')
  const [state, setState] = React.useState(null)   /* 'ok' | 'wrong' | 'invalid' */
  const [others, setOthers] = React.useState(null) /* null | 'busy' | number */
  const curRef = React.useRef(null)
  const nextRef = React.useRef(null)
  async function save(e) {
    e.preventDefault()
    const r = await changePasscode(cur, next)
    setState(r)
    if (r === 'ok') { setCur(''); setNext('') }
    else requestAnimationFrame(() => (r === 'wrong' ? curRef : nextRef).current?.focus())
  }
  async function endOthers() {
    setOthers('busy')
    const r = await signOutOthers()
    setOthers(r.ok ? r.ended : null)
  }
  const digits = v => v.replace(/\D/g, '').slice(0, 6)
  const wrong = state === 'wrong', invalid = state === 'invalid'
  return (
    <Section title={SECTIONS.passcode.title} go={go}>
      <Panel title="Change passcode" className="self-start">
        <form onSubmit={save} noValidate className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pass-cur" className={labelClass}>Current</label>
              <input id="pass-cur" ref={curRef} type="password" value={cur} inputMode="numeric" pattern="[0-9]*"
                autoComplete="current-password" maxLength={6} aria-invalid={wrong || undefined}
                aria-describedby={wrong ? 'pass-err' : undefined}
                onChange={e => { setCur(digits(e.target.value)); setState(null) }}
                className={cn(field, wrong && fieldError)}/>
            </div>
            <div>
              <label htmlFor="pass-new" className={labelClass}>New</label>
              <input id="pass-new" ref={nextRef} type="password" value={next} inputMode="numeric" pattern="[0-9]*"
                autoComplete="new-password" maxLength={6} aria-invalid={invalid || undefined}
                placeholder="4 to 6 digits" aria-describedby={invalid ? 'pass-err' : undefined}
                onChange={e => { setNext(digits(e.target.value)); setState(null) }}
                className={cn(field, invalid && fieldError)}/>
            </div>
          </div>
          {state && state !== 'ok' && (
            <p id="pass-err" role="alert" className="mt-2 font-display text-fine font-medium text-crit">
              {wrong ? 'Wrong passcode. Try again.' : 'Passcode not saved. Use 4 to 6 digits.'}
            </p>
          )}
          <button type="submit" className={cn(outline, 'mt-3')} disabled={!cur || !next}>
            <Key aria-hidden className="size-4"/>{state === 'ok' ? 'Saved' : 'Save'}
          </button>
        </form>
      </Panel>
      <Panel title="Signed-in devices" className="self-start">
        <div className="flex min-h-[48px] items-center justify-between gap-3 px-4 py-2.5">
          <span className="font-display text-ui font-medium text-ink">Last sign-in</span>
          <span className="font-display text-fine font-bold text-ink-2">{when(me.lastSignInAt)}</span>
        </div>
        {/* Only the server can hold a second session, so on the device path
            there is nothing to end and no button to press. */}
        {backend() === 'remote' && (
          <div className="border-t border-rule p-4">
            <button type="button" onClick={endOthers} disabled={others === 'busy'} className={outline}>
              <Devices aria-hidden className="size-4"/>Sign out of other devices
            </button>
            {typeof others === 'number' && (
              <p role="status" className="mt-2 font-display text-fine font-medium text-accent-ink">
                {others === 0 ? 'No other device was signed in.' : `Signed out of ${others} other ${others === 1 ? 'device' : 'devices'}.`}
              </p>
            )}
          </div>
        )}
      </Panel>
    </Section>
  )
}

/* ── Sharing and privacy ────────────────────────────────────────────────── */

function Sharing({ me, go }) {
  return (
    <Section title={SECTIONS.sharing.title} go={go}>
      <Panel title="What you share" className="self-start">
        <Row label={SHARING_LABEL[me.role]} hint={CONSENT_SHORT} Mark={Grid} onClick={() => go(SHARING_ROUTE[me.role])}/>
      </Panel>
      <Panel title="Who is linked" className="self-start">
        <Row label="Network" Mark={People} aside={String(listNetwork(me.id).filter(l => l.status === 'active').length)}
          onClick={() => go('network')}/>
      </Panel>
    </Section>
  )
}

/* ── Your data ──────────────────────────────────────────────────────────── */

function Data({ me, go }) {
  const remote = backend() === 'remote'
  function erase() { deleteAccount(); go('app-' + me.role) }
  return (
    <Section title={SECTIONS.data.title} go={go}>
      <Panel title="Download a copy" className="self-start">
        <div className="p-4">
          <button type="button" className={solid}
            onClick={() => download(`mindmap-${me.name.replace(/\s+/g, '-').toLowerCase()}.json`, exportAll())}>
            <Download aria-hidden className="size-4"/>{remote ? 'Download from your account' : 'Export as JSON'}
          </button>
          <p className="mt-2 text-fine text-ink-3">The file holds your account, links and code.</p>
        </div>
      </Panel>
      <Panel title="Delete account" className="self-start">
        <div className="p-4">
          <ArmedButton armedLabel="Delete for good" onConfirm={erase}>
            <Bin aria-hidden className="size-4"/>Delete my account
          </ArmedButton>
          <p className="mt-2 text-fine text-ink-3">
            {me.role === 'student'
              ? `Deleting also removes every parent and ${PRO} link.`
              : 'Deleting also removes every link and code.'}
          </p>
        </div>
      </Panel>
    </Section>
  )
}

/* ── About ──────────────────────────────────────────────────────────────── */

function About({ go }) {
  const rows = [
    ['Version', VERSION],
    ['Your data', WHERE()],
    ['Made by', 'Solace Innovation'],
  ]
  return (
    <Section title={SECTIONS.about.title} go={go}>
      <Panel title="MindMap app" className="self-start">
        {rows.map(([k, v]) => (
          <div key={k} className="flex min-h-[48px] items-center justify-between gap-3 border-t border-rule px-4 py-2.5 first:border-t-0">
            <span className="font-display text-ui font-medium text-ink">{k}</span>
            <span className="text-right font-display text-fine font-bold text-ink-2">{v}</span>
          </div>
        ))}
      </Panel>
      <Panel title="Help" className="self-start">
        <Row label="Open the help page" Mark={Info} onClick={() => go('help')}/>
      </Panel>
    </Section>
  )
}

/* ── Entry ──────────────────────────────────────────────────────────────── */

export function Account({ go, section = null }) {
  const me = useAccount()
  if (!me) return <SignIn go={go}/>
  const Body = { profile: Profile, passcode: Passcode, sharing: Sharing, data: Data, about: About }[section]
  if (!Body) return <Index me={me} go={go}/>
  return <Body me={me} go={go}/>
}
