import React from 'react'
import { cn } from '../lib/utils'
import { ArmedButton, Panel } from '../app/controls'
import { ArrowLeft, Bin, Check, Devices, Download, Grid, Info, Key, People } from '../ui/marks'
import { CONSENT_SHORT } from '../lib/terms'
import {
  ROLE_LABEL, SECRET_MAX, SETTINGS, backend, homeFor, changePasscode, deleteAccount, exportAll, listNetwork,
  signOutOthers, updateProfile, useAccount,
} from './store'
import { Avatar, AvatarPicker, Row, field, fieldError, outline, solid } from './ui'
import { SignIn } from './SignIn'
import { APP_VERSION, SHARING_ROUTE, Settings } from './Settings'

/* The account portal: the profile card, then every setting in one menu
   (./Settings.jsx). Its rows lead to sections at #/account/<section>. */

const SECTIONS = {
  profile:  { title: 'Your Profile' },
  passcode: { title: 'Password and Sign-in' },
  sharing:  { title: 'Sharing and Privacy' },
  data:     { title: 'Your Data' },
  about:    { title: 'About MindMap' },
}

const SHARING_LABEL = { student: 'Sharing', parent: 'Sharing record', pro: 'Students', other: 'Privacy' }
const VERSION = APP_VERSION

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


function Index({ me, go }) {
  const role = me.role
  return (
    <main className="wrap">
      <button type="button" onClick={() => go('account/profile')}
        className="flex w-full items-center gap-3.5 rounded-panel border border-rule bg-card p-3.5
          text-left transition-colors duration-150 hoverOnly:bg-mist/50 active:bg-mist/50">
        <Avatar name={me.name} avatar={me.avatar} size="lg"/>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-row font-bold text-ink">{me.name}</span>
          <span className="block truncate text-fine text-ink-3">{ROLE_LABEL[role]}{me.email ? ` · ${me.email}` : ''}</span>
        </span>
        <span className="shrink-0 font-display text-fine font-medium text-accent-ink">Edit</span>
      </button>
      <Settings me={me} go={go} className="mt-5"/>
    </main>
  )
}


function Section({ title, go, children }) {
  return (
    <main className="wrap">
      <button type="button" onClick={() => go('account')}
        className="-ml-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-field px-2 font-display
          text-ui font-medium text-ink-2 transition-colors duration-150 hoverOnly:text-ink">
        <ArrowLeft aria-hidden className="size-4"/>Account
      </button>
      <h2 className="mt-1 font-display font-bold text-ink">{title}</h2>
      <div className="mt-3.5 grid grid-cols-1 gap-3 lg:mt-4 lg:grid-cols-2 lg:gap-4">{children}</div>
    </main>
  )
}


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
    if (!mailKept && email.trim()) { setErr('That email is not valid.'); return }
    if (!mailKept && me.role !== 'student') { setErr('Your account needs an email.'); return }
    setErr(null); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
  return (
    <Section title={SECTIONS.profile.title} go={go}>
      <Panel title="Your Picture" className="self-start">
        <div className="p-4">
          <AvatarPicker value={me.avatar} onChange={a => updateProfile({ avatar: a })} name={me.name}/>
        </div>
      </Panel>
      <Panel title="Your Details" className="self-start">
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


function Passcode({ me, go }) {
  const [cur, setCur] = React.useState('')
  const [next, setNext] = React.useState('')
  const [state, setState] = React.useState(null)
  const [others, setOthers] = React.useState(null)
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
  const wrong = state === 'wrong', invalid = state === 'invalid'
  return (
    <Section title={SECTIONS.passcode.title} go={go}>
      <Panel title="Change Password" className="self-start">
        <form onSubmit={save} noValidate className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pass-cur" className={labelClass}>Current</label>
              <input id="pass-cur" ref={curRef} type="password" value={cur}
                autoComplete="current-password" maxLength={SECRET_MAX} aria-invalid={wrong || undefined}
                aria-describedby={wrong ? 'pass-err' : undefined}
                onChange={e => { setCur(e.target.value); setState(null) }}
                className={cn(field, wrong && fieldError)}/>
            </div>
            <div>
              <label htmlFor="pass-new" className={labelClass}>New</label>
              <input id="pass-new" ref={nextRef} type="password" value={next}
                autoComplete="new-password" maxLength={SECRET_MAX} aria-invalid={invalid || undefined}
                placeholder="8 or more characters" aria-describedby={invalid ? 'pass-err' : undefined}
                onChange={e => { setNext(e.target.value); setState(null) }}
                className={cn(field, invalid && fieldError)}/>
            </div>
          </div>
          {state && state !== 'ok' && (
            <p id="pass-err" role="alert" className="mt-2 font-display text-fine font-medium text-crit">
              {wrong ? 'Wrong password. Try again.' : 'Use 8 or more characters.'}
            </p>
          )}
          <button type="submit" className={cn(outline, 'mt-3')} disabled={!cur || !next}>
            <Key aria-hidden className="size-4"/>{state === 'ok' ? 'Saved' : 'Save'}
          </button>
        </form>
      </Panel>
      <Panel title="Signed-in Devices" className="self-start">
        <div className="flex min-h-[48px] items-center justify-between gap-3 px-4 py-2.5">
          <span className="font-display text-ui font-medium text-ink">Last sign-in</span>
          <span className="font-display text-fine font-bold text-ink-2">{when(me.lastSignInAt)}</span>
        </div>
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


function Sharing({ me, go }) {
  return (
    <Section title={SECTIONS.sharing.title} go={go}>
      <Panel title="What You Share" className="self-start">
        <Row label={SHARING_LABEL[me.role]} hint={CONSENT_SHORT} Mark={Grid} onClick={() => go(SHARING_ROUTE[me.role])}/>
        <Row label="Network" Mark={People} aside={String(listNetwork(me.id).filter(l => l.status === 'active').length)}
          onClick={() => go('network')}/>
      </Panel>
    </Section>
  )
}


function Data({ me, go }) {
  function erase() { deleteAccount(); go(homeFor(me.role)) }
  return (
    <Section title={SECTIONS.data.title} go={go}>
      <Panel title="Download a Copy" className="self-start">
        <div className="p-4">
          <button type="button" className={solid}
            onClick={() => download(`mindmap-${me.name.replace(/\s+/g, '-').toLowerCase()}.json`, exportAll())}>
            <Download aria-hidden className="size-4"/>Download
          </button>
          <p className="mt-2 text-fine text-ink-3">The file holds your account, links and code.</p>
        </div>
      </Panel>
      <Panel title="Delete Account" className="self-start">
        <div className="p-4">
          <ArmedButton armedLabel="Delete for good" onConfirm={erase}>
            <Bin aria-hidden className="size-4"/>Delete my account
          </ArmedButton>
          <p className="mt-2 text-fine text-ink-3">Every link and code goes too.</p>
        </div>
      </Panel>
    </Section>
  )
}


function About({ go }) {
  const rows = [
    ['Version', VERSION],
    ['Your data', WHERE()],
    ['Made by', 'Solace Innovation'],
  ]
  return (
    <Section title={SECTIONS.about.title} go={go}>
      <Panel title="MindMap App" className="self-start">
        {rows.map(([k, v]) => (
          <div key={k} className="flex min-h-[48px] items-center justify-between gap-3 border-t border-rule px-4 py-2.5 first:border-t-0">
            <span className="font-display text-ui font-medium text-ink">{k}</span>
            <span className="text-right font-display text-fine font-bold text-ink-2">{v}</span>
          </div>
        ))}
        <Row label="Help" Mark={Info} onClick={() => go('help')}/>
      </Panel>
    </Section>
  )
}


export function Account({ go, section = null }) {
  const me = useAccount()
  if (!me && section === 'about') return <About go={go}/>
  if (!me) return <SignIn go={go}/>
  const Body = { profile: Profile, passcode: Passcode, sharing: Sharing, data: Data, about: About }[section]
  if (!Body) return <Index me={me} go={go}/>
  return <Body me={me} go={go}/>
}
