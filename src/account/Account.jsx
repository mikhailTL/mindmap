import React from 'react'
import { cn } from '../lib/utils'
import { ArmedButton, Panel } from '../app/controls'
import { ArrowLeft, Bin, Check, Devices, Download, Grid, Info, Key, People, Person } from '../ui/marks'
import { CONSENT_SHORT } from '../lib/terms'
import { useMode } from '../lib/mode'
import { demoCounts } from './demo-network'
import {
  ROLE_LABEL, SECRET_MAX, SETTINGS, backend, homeFor, changePasscode, deleteAccount, exportAll, listNetwork,
  signOutOthers, updateProfile, useAccount,
} from './store'
import { Avatar, AvatarPicker, Row, field, fieldError, outline, solid } from './ui'
import { SignIn } from './SignIn'
import { APP_VERSION, SHARING_ROUTE, Segmented, Settings } from './Settings'

/* The account portal: the profile card, then every setting in one menu
   (./Settings.jsx). Its rows lead to sections at #/account/<section>. */

const SECTIONS = {
  profile:  { title: 'Your profile' },
  passcode: { title: 'Password and sign-in' },
  sharing:  { title: 'Privacy and sharing' },
  data:     { title: 'Your data' },
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


/* A band of small shapes in the six hues, behind the top of the profile
   card. Decoration only. */
function Confetti() {
  return (
    <svg aria-hidden viewBox="0 0 640 96" preserveAspectRatio="xMidYMid slice"
      className="block h-20 w-full bg-accent-wash sm:h-24">
      <g fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 70q14-22 28 0t28 0" className="stroke-sky"/>
        <path d="M300 26q12-16 24 0t24 0" className="stroke-coral"/>
        <path d="M520 74q12-16 24 0t24 0" className="stroke-mint"/>
        <path d="M206 58l12 12M218 58l-12 12" className="stroke-lilac"/>
        <path d="M612 24l12 12M624 24l-12 12" className="stroke-sun"/>
        <path d="M444 30v18M435 39h18" className="stroke-blush"/>
      </g>
      <circle cx="140" cy="28" r="9" className="fill-sun"/>
      <circle cx="392" cy="72" r="7" className="fill-sky"/>
      <circle cx="590" cy="60" r="5" className="fill-coral"/>
      <rect x="250" y="66" width="16" height="16" rx="3" transform="rotate(18 258 74)" className="fill-mint"/>
      <rect x="96" y="58" width="12" height="12" rx="2" transform="rotate(-14 102 64)" className="fill-blush"/>
      <path d="M480 14l10 17h-20z" className="fill-lilac"/>
      <path d="M356 10l8 14h-16z" className="fill-beam"/>
    </svg>
  )
}

function ProfileHeader({ me, go }) {
  const setting = me.role === 'pro' ? SETTINGS.find(s => s.value === me.setting)?.label : null
  const [mode] = useMode()
  const linked = mode === 'demo' ? demoCounts().linked : listNetwork(me.id).filter(l => l.status === 'active').length
  const facts = [
    ['Linked', linked === 0 ? 'Nobody yet' : String(linked)],
    ['Last sign-in', when(me.lastSignInAt)],
    ['Your data', WHERE()],
  ]
  return (
    <section aria-labelledby="acct-name-h" className="overflow-hidden rounded-panel border border-rule bg-card">
      <Confetti/>
      <div className="px-4 pb-4 sm:px-6 sm:pb-5">
        <div className="-mt-10 flex flex-wrap items-end gap-x-4 gap-y-3 sm:-mt-12">
          <span className="rounded-chip bg-card p-1">
            <Avatar name={me.name} avatar={me.avatar} size="lg" className="size-20 text-head sm:size-24"/>
          </span>
          <div className="min-w-0 flex-1 basis-[12rem] pb-1">
            <h2 id="acct-name-h" className="truncate font-display text-head font-bold text-ink">{me.name}</h2>
            <p className="truncate text-fine text-ink-3">
              <span className="font-display font-bold text-accent-ink">{ROLE_LABEL[me.role]}</span>
              {setting ? `, ${setting}` : ''}{me.email ? ` · ${me.email}` : ''}
            </p>
          </div>
          <button type="button" onClick={() => go('account/profile')} className={cn(solid, 'mb-1')}>
            <Pencil/>Edit profile
          </button>
        </div>
        <dl className="mt-4 grid grid-cols-3 border-t border-rule pt-3">
          {facts.map(([k, v], i) => (
            <div key={k} className={cn('min-w-0 pr-2', i > 0 && 'border-l border-rule pl-3')}>
              <dt className="text-fine text-ink-3">{k}</dt>
              <dd className="m-0 font-display text-fine font-bold leading-snug text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

const Pencil = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5zM13.5 7l3 3"/>
  </svg>
)

function Index({ me, go }) {
  return (
    <main className="wrap">
      <ProfileHeader me={me} go={go}/>
      <Settings me={me} go={go} className="mt-7"/>
    </main>
  )
}


/* Each section page carries the hue of the tile that opened it. */
const SECTION_HUE = {
  profile:  'bg-accent-wash text-accent-ink',
  passcode: 'bg-sun-wash text-sun-ink',
  sharing:  'bg-lilac-wash text-lilac-ink',
  data:     'bg-mint-wash text-mint-ink',
  about:    'bg-beam-wash text-beam-ink',
}
const SECTION_MARK = { profile: Person, passcode: Key, sharing: Grid, data: Download, about: Info }

function Section({ id, go, children }) {
  const Mark = SECTION_MARK[id]
  return (
    <main className="wrap">
      <button type="button" onClick={() => go('account')}
        className="-ml-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-field px-2 font-display
          text-ui font-medium text-ink-2 transition-colors duration-150 hoverOnly:text-ink">
        <ArrowLeft aria-hidden className="size-4"/>Account
      </button>
      <div className="mt-1 flex items-center gap-3">
        <span aria-hidden className={cn('grid size-10 shrink-0 place-items-center rounded-field', SECTION_HUE[id])}>
          <Mark size={20}/>
        </span>
        <h2 className="font-display font-bold text-ink">{SECTIONS[id].title}</h2>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">{children}</div>
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
    <Section id="profile" go={go}>
      <section aria-labelledby="acct-details-h"
        className="self-start rounded-panel border border-rule bg-card p-4 lg:p-5">
        <h3 id="acct-details-h" className="font-display text-row font-bold text-ink">Your details</h3>
        <form onSubmit={save} noValidate className="mt-3">
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
          <button type="submit" className={cn(solid, 'mt-3 disabled:opacity-50')} disabled={!dirty || !name.trim()}>
            {saved ? <><Check aria-hidden className="size-4"/>Saved</> : 'Save changes'}
          </button>
        </form>
        {me.role === 'pro' && (
          <div className="mt-5 border-t border-rule pt-4">
            <p id="acct-where" className={labelClass}>Where you work</p>
            <Segmented label="Where you work" value={me.setting}
              onChange={v => updateProfile({ setting: v })}
              options={SETTINGS.map(s => ({ value: s.value, label: s.label }))} className="mt-1.5"/>
          </div>
        )}
      </section>
      <section aria-labelledby="acct-pic-h"
        className="self-start overflow-hidden rounded-panel border border-rule bg-card">
        <h3 id="acct-pic-h" className="border-b border-rule bg-sky-wash px-4 py-3 font-display text-row font-bold text-ink lg:px-5">
          Your picture
        </h3>
        <div className="p-4 lg:p-5">
          <AvatarPicker value={me.avatar} onChange={a => updateProfile({ avatar: a })} name={me.name}/>
        </div>
      </section>
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
    <Section id="passcode" go={go}>
      <Panel title="Change your password" className="self-start">
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
      <Panel title="Signed-in devices" className="self-start">
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
    <Section id="sharing" go={go}>
      <Panel title="What you share" className="self-start">
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
    <Section id="data" go={go}>
      <section aria-labelledby="data-dl-h" className="self-start rounded-panel border border-rule bg-card p-4 lg:p-5">
        <div className="flex items-start gap-3">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-field bg-mint-wash text-mint-ink">
            <Download size={20}/>
          </span>
          <div className="min-w-0">
            <h3 id="data-dl-h" className="font-display text-row font-bold text-ink">Download a copy</h3>
            <p className="mt-0.5 text-fine text-ink-3">The file holds your account, links and code.</p>
          </div>
        </div>
        <button type="button" className={cn(solid, 'mt-4')}
          onClick={() => download(`mindmap-${me.name.replace(/\s+/g, '-').toLowerCase()}.json`, exportAll())}>
          <Download aria-hidden className="size-4"/>Download
        </button>
      </section>
      <section aria-labelledby="data-del-h" className="self-start rounded-panel border border-dashed border-crit bg-paper p-4 lg:p-5">
        <h3 id="data-del-h" className="font-display text-row font-bold text-crit">Delete your account</h3>
        <p className="mt-0.5 text-fine text-ink-3">Every link and code goes too.</p>
        <div className="mt-4">
          <ArmedButton armedLabel="Delete for good" onConfirm={erase}>
            <Bin aria-hidden className="size-4"/>Delete my account
          </ArmedButton>
        </div>
      </section>
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
    <Section id="about" go={go}>
      <Panel title="The MindMap app" className="self-start">
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
