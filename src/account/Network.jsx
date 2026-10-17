import React from 'react'
import { cn } from '../lib/utils'
import { Panel, SwitchRow } from '../app/controls'
import { Check, Copy, Cross, Plus } from '../ui/marks'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { useMode } from '../lib/mode'
import { PRO, PRO_PLURAL } from '../lib/terms'
import { SHARING, getSharing, getVersion as sharingVersion, setShared, subscribe as onSharing } from '../app/store'
import { shareLabel } from '../app/Sharing'
import {
  approveLink, createInvite, declineLink, getVersion, listNetwork, listPendingApprovals,
  myInvite, redeemInvite, removeLink, subscribe, useAccount,
} from './store'
import { DEMO_LINKS, DEMO_TEEN } from './demo-network'
import { Empty, IconButton, LinkMark, PersonRow, field, fieldError, outline, solid } from './ui'
import { SignIn } from './SignIn'

/* The network: teens, parents and Medical Professionals linked to each other.
 *
 * The flow, the same on every shape of the screen:
 *   1. Somebody makes an invite link (a six character code inside a URL).
 *   2. The other person opens it, signs in, and asks to connect.
 *   3. The teen approves and chooses what that person can see. Nothing is
 *      shared until then. A Medical Professional link also needs a parent's
 *      OK, which is the store's rule (src/account/store.js) and the server's.
 *   4. Both of them see the connection.
 *
 * Demo mode shows Maya's network from ./demo-network.js, from any of the
 * three sides, and every button works on that copy only. Live mode is the
 * real store. No reading, score or trend is shown here: only names, link
 * status and the names of what is shared.
 */

const STATUS = {
  student: { active: 'Linked', pending: 'Needs a parent’s OK', declined: 'Declined' },
  parent:  { active: 'Linked', pending: 'Waiting',             declined: 'Declined' },
  pro:     { active: 'Linked', pending: 'Waiting for a parent', declined: 'Declined' },
}

const GROUP = {
  student: { student: null,            parent: 'Your parents',   pro: `Your ${PRO_PLURAL}` },
  parent:  { student: 'Your teens',    parent: null,             pro: `Your ${PRO_PLURAL}` },
  pro:     { student: 'Your Network', parent: 'Linked parents', pro: null },
}
const ORDER = ['student', 'parent', 'pro']

const REDEEM_ERROR = {
  unknown:   'Code not found. Check the letters and try again.',
  expired:   'This invite has expired. Ask for a new one.',
  own:       'This is your own invite. Send it to someone else.',
  role:      'This invite is for another kind of account. Ask for a different one.',
  exists:    'You are already linked to this person. Nothing changed.',
  signedout: 'You are signed out. Sign in, then try again.',
  offline:   'No connection. Check your internet and try again.',
}

/* ── The invite link ────────────────────────────────────────────────────── */

const linkFor = code => {
  try { return `${window.location.origin}${window.location.pathname}#/network?code=${code}` }
  catch { return `#/network?code=${code}` }
}

/* An invite link is #/network?code=XXXXXX (or ?invite=XXXXXX before the
   hash, the first spelling). Read once, when this module loads, which is
   before the app reads the hash: the code is kept here and the address
   becomes plain #/network, so the router lands on the network screen. */
const CODE_RE = /^[A-Za-z0-9]{6}$/
let pendingCode = null
const codeListeners = new Set()
function takeCodeFromUrl() {
  try {
    const hash = window.location.hash
    const q = hash.indexOf('?')
    const fromHash = q >= 0 && /^#\/?network\?/.test(hash) ? new URLSearchParams(hash.slice(q + 1)).get('code') : null
    const fromSearch = new URLSearchParams(window.location.search).get('invite')
    const c = [fromHash, fromSearch].find(v => v && CODE_RE.test(v))
    if (c) { pendingCode = c.toUpperCase(); codeListeners.forEach(fn => fn(pendingCode)) }
    if (fromHash !== null || fromSearch !== null) {
      window.history.replaceState(null, '', window.location.pathname + '#/network')
    }
  } catch {}
}
if (typeof window !== 'undefined') {
  takeCodeFromUrl()
  /* Added before the app's own listener, so it runs first when a link is
     opened in a tab that already has the app. */
  try { window.addEventListener('hashchange', takeCodeFromUrl) } catch {}
}
const inviteFromUrl = () => pendingCode
function clearInviteFromUrl() { pendingCode = null }

function useCopied() {
  const [copied, setCopied] = React.useState(null)
  async function copy(what, text) {
    try { await navigator.clipboard.writeText(text) } catch {}
    setCopied(what); setTimeout(() => setCopied(null), 2000)
  }
  return [copied, copy]
}

function daysLeft(iso) {
  const d = Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 86400000))
  return d === 1 ? 'It works for 1 day.' : `It works for ${d} days.`
}

/* The link, shown whole, with Copy link and Copy code. `demo` draws a fixed
   example and makes nothing. */
function InviteLink({ accountId, line, demo = null, children }) {
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const inv = demo || myInvite(accountId)
  const [copied, copy] = useCopied()
  const url = inv ? linkFor(inv.code) : ''
  return (
    <Panel title="Invite by link">
      <div className="p-4">
        {inv ? (
          <>
            <p className="break-all rounded-field border border-rule bg-mist/60 px-3 py-2.5 font-mono text-fine text-ink">
              {url}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" onClick={() => copy('link', url)} className={solid}>
                {copied === 'link' ? <Check aria-hidden className="size-4"/> : <LinkMark size={16}/>}
                {copied === 'link' ? 'Link copied' : 'Copy link'}
              </button>
              <button type="button" onClick={() => copy('code', inv.code)} className={outline}>
                {copied === 'code' ? <Check aria-hidden className="size-4"/> : <Copy aria-hidden className="size-4"/>}
                {copied === 'code' ? 'Copied' : <>Code <span className="font-mono tracking-[0.12em]">{inv.code}</span></>}
              </button>
            </div>
            <p className="mt-2 text-fine text-ink-3">
              {line} {demo ? 'This one is an example.' : daysLeft(inv.expiresAt)}
            </p>
            {!demo && (
              <button type="button" onClick={() => createInvite()}
                className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-field pr-2 font-display
                  text-fine font-medium text-ink-2 transition-colors duration-150 hoverOnly:text-ink">
                <Plus aria-hidden className="size-3.5"/>Make a new link
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" onClick={() => createInvite()} className={solid}>
              <LinkMark size={16}/>Make an invite link
            </button>
            <p className="mt-2 text-fine text-ink-3">{line}</p>
          </>
        )}
      </div>
      {children}
    </Panel>
  )
}

/* For someone who has a code but not the link. */
function CodeField({ onDone }) {
  const [code, setCode] = React.useState('')
  const [err, setErr] = React.useState(null)
  const [done, setDone] = React.useState(null)
  const ref = React.useRef(null)
  async function submit(e) {
    e.preventDefault()
    const r = await redeemInvite(code)
    if (r.ok) {
      setCode(''); setErr(null)
      setDone(r.link.status === 'pending' ? 'Request sent. A parent approves it next.' : 'You are now linked.')
      onDone?.(r.link)
    } else {
      setDone(null); setErr(REDEEM_ERROR[r.reason] || REDEEM_ERROR.unknown)
      requestAnimationFrame(() => ref.current?.focus())
    }
  }
  return (
    <form onSubmit={submit} noValidate className="border-t border-rule p-4">
      <label htmlFor="net-code" className="block font-display text-fine font-medium text-ink-2">
        Got a code instead? Enter it here.
      </label>
      <div className="mt-1 flex gap-2.5">
        <input id="net-code" ref={ref} type="text" value={code} maxLength={7}
          autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false}
          aria-invalid={err ? true : undefined} aria-describedby={err ? 'net-code-err' : undefined}
          onChange={e => { setCode(e.target.value.toUpperCase()); setErr(null); setDone(null) }}
          className={cn(field, '!mt-0 flex-1 uppercase tracking-[0.18em]', err && fieldError)}/>
        <button type="submit" className={cn(outline, 'shrink-0')} disabled={code.replace(/\W/g, '').length < 6}>
          Connect
        </button>
      </div>
      {err && <p id="net-code-err" role="alert" className="mt-2 font-display text-fine font-medium text-crit">{err}</p>}
      {done && <p role="status" className="mt-2 font-display text-fine font-medium text-accent-ink">{done}</p>}
    </form>
  )
}

/* Step 2, for whoever opened an invite link. */
function AnswerInvite({ code, onDone, teen = false }) {
  const [state, setState] = React.useState(null)
  async function ask() {
    const r = await redeemInvite(code)
    if (r.ok) { clearInviteFromUrl(); setState({ ok: true, pending: r.link.status === 'pending' }) }
    else setState({ ok: false, reason: r.reason })
  }
  return (
    <section className="rounded-panel border-2 border-accent bg-accent-wash p-4">
      <h3 className="font-display text-meta font-bold text-ink">You opened an invite link</h3>
      {state?.ok ? (
        <>
          <p role="status" className="mt-1 text-ui text-ink">
            {teen ? 'You are connected. Choose what they can see below.' : state.pending ? 'Request sent. The teen and a parent approve it next.' : 'You are connected. The teen chooses what you see.'}
          </p>
          <button type="button" onClick={onDone} className={cn(outline, 'mt-3')}>See your network</button>
        </>
      ) : (
        <>
          <p className="mt-1 text-ui text-ink-2">
            Code <span className="font-mono font-bold tracking-[0.12em] text-ink">{code}</span>. Ask to connect, and they are told.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={ask} className={solid}><Plus aria-hidden className="size-4"/>Ask to connect</button>
            <button type="button" onClick={() => { clearInviteFromUrl(); onDone() }} className={outline}>Not now</button>
          </div>
          {state && !state.ok && (
            <p role="alert" className="mt-2 font-display text-fine font-medium text-crit">
              {REDEEM_ERROR[state.reason] || REDEEM_ERROR.unknown}
            </p>
          )}
        </>
      )}
    </section>
  )
}

/* ── How it works ───────────────────────────────────────────────────────── */

const STEPS = [
  'Make an invite link and send it.',
  'They open it and ask to connect.',
  'The teen approves and picks what is shared.',
  'You both see the connection.',
]

function Steps() {
  return (
    <Panel title="How linking works">
      <ol className="m-0 list-none p-0">
        {STEPS.map((s, i) => (
          <li key={s} className="flex min-h-[48px] items-center gap-3 border-t border-rule px-4 py-2.5 first:border-t-0">
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-chip border-2 border-accent
              font-display text-fine font-bold text-accent-ink">{i + 1}</span>
            <span className="text-ui text-ink">{s}</span>
          </li>
        ))}
      </ol>
      <p className="max-w-none border-t border-rule px-4 py-3 text-fine text-ink-3">
        A parent sees one figure a day at most. A {PRO} link also needs a parent’s OK.
      </p>
    </Panel>
  )
}

/* ── What a person can see ──────────────────────────────────────────────── */

const audienceOf = role => (role === 'parent' ? 'parent' : role === 'pro' ? 'pro' : null)

function seesLine(audience, keys) {
  if (!audience) return null
  if (!keys.length) return 'Sees nothing yet'
  return 'Sees ' + keys.map(k => shareLabel(audience, k)).join(', ')
}

/* Switches for one audience. With `keys`/`onToggle` they act on a copy (the
   demo); without, on the real sharing store, which is per audience. */
function ShareSwitches({ audience, keys, onToggle }) {
  React.useSyncExternalStore(onSharing, sharingVersion, () => 0)
  const real = !onToggle
  const mine = real ? getSharing()[audience] : Object.fromEntries(SHARING[audience].fields.map(f => [f.key, keys.includes(f.key)]))
  return (
    <div className="border-t border-rule">
      {SHARING[audience].fields.map(f => {
        const blocked = f.needs && !mine[f.needs]
        return (
          <SwitchRow key={f.key} label={shareLabel(audience, f.key)} checked={!!mine[f.key]} disabled={blocked}
            note={blocked ? `Needs “${shareLabel(audience, f.needs)}” on first.` : undefined}
            onChange={on => (real ? setShared(audience, f.key, on) : onToggle(f.key, on))}/>
        )
      })}
    </div>
  )
}

/* ── Live ───────────────────────────────────────────────────────────────── */

/* Links the teen has already said yes to, on this device. */
const REVIEWED = 'mindmap.account.reviewed'
function useReviewed() {
  const [ids, setIds] = React.useState(() => {
    try { const v = JSON.parse(window.localStorage.getItem(REVIEWED) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
  })
  function add(id) {
    setIds(prev => {
      const next = [...new Set([...prev, id])]
      try { window.localStorage.setItem(REVIEWED, JSON.stringify(next)) } catch {}
      return next
    })
  }
  return [ids, add]
}

function Groups({ me, empty, sees }) {
  const rows = listNetwork(me.id).filter(l => l.status !== 'declined')
  const groups = ORDER.filter(r => GROUP[me.role][r] && rows.some(l => l.person.role === r))
  if (!groups.length) return <Panel title="Your people"><Empty>{empty}</Empty></Panel>
  return groups.map(r => {
    const list = rows.filter(l => l.person.role === r)
    return (
      <Panel key={r} title={GROUP[me.role][r]} aside={list.length > 1 ? String(list.length) : undefined}>
        {list.map(l => (
          <PersonRow key={l.id} person={l.person} status={STATUS[me.role][l.status]} role={false}
            hint={sees ? sees(l) : undefined}>
            <IconButton label={`Remove ${l.person.name}`} Mark={Cross} tone="crit" onClick={() => removeLink(l.id)}/>
          </PersonRow>
        ))}
      </Panel>
    )
  })
}

function TeenNetwork({ me, go }) {
  React.useSyncExternalStore(onSharing, sharingVersion, () => 0)
  const [reviewed, review] = useReviewed()
  const sharing = getSharing()
  const on = audience => SHARING[audience].fields.filter(f => sharing[audience][f.key]).map(f => f.key)
  const fresh = listNetwork(me.id).filter(l => l.status !== 'declined' && !reviewed.includes(l.id))
  return (
    <div className="mt-3.5 grid grid-cols-1 gap-3 lg:mt-4 lg:grid-cols-2 lg:gap-4">
      <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
        {fresh.map(l => {
          const audience = audienceOf(l.person.role)
          return (
            <Panel key={l.id} title="Waiting for you" className="border-2 border-accent">
              <PersonRow person={l.person} hint={l.status === 'pending' ? 'A parent approves this link too' : 'Asks to see your data'} comma/>
              <p className="max-w-none border-t border-rule px-4 py-3 text-fine text-ink-2">
                Choose what every {audience === 'parent' ? 'parent' : PRO} you approve can see. All start off.
              </p>
              <ShareSwitches audience={audience}/>
              <div className="flex flex-wrap gap-2 border-t border-rule p-4">
                <button type="button" onClick={() => review(l.id)} className={solid}><Check aria-hidden className="size-4"/>Approve</button>
                <button type="button" onClick={() => removeLink(l.id)} className={outline}>Decline</button>
              </div>
            </Panel>
          )
        })}
        <Groups me={me} empty="Nobody is linked yet. Send an invite link to a parent."
          sees={l => seesLine(audienceOf(l.person.role), on(audienceOf(l.person.role) || 'parent'))}/>
        <button type="button" onClick={() => go('shared')} className={cn(outline, 'justify-self-start')}>
          Change what each person sees
        </button>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
        <InviteLink accountId={me.id} line="A parent or Medical Professional opens it to connect with you."><CodeField/></InviteLink>
        <Steps/>
      </div>
    </div>
  )
}

function ParentNetwork({ me }) {
  const waiting = listPendingApprovals(me.id)
  return (
    <div className="mt-3.5 grid grid-cols-1 gap-3 lg:mt-4 lg:grid-cols-2 lg:gap-4">
      <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
        <Panel title="Waiting for your approval" aside={waiting.length ? String(waiting.length) : undefined}
          className={waiting.length ? 'border-2 border-accent' : undefined}>
          {waiting.length ? waiting.map(l => (
            <PersonRow key={l.id} person={l.person} hint={`for ${l.who.name}`} comma>
              <IconButton label={`Approve ${l.person.name}`} Mark={Check} tone="accent" onClick={() => approveLink(l.id)}/>
              <IconButton label={`Decline ${l.person.name}`} Mark={Cross} tone="crit" onClick={() => declineLink(l.id)}/>
            </PersonRow>
          )) : <Empty>No requests. A {PRO} asking to link to your teen shows here.</Empty>}
        </Panel>
        <Groups me={me} empty="Nobody is linked yet. Send your teen an invite link."
          sees={l => (l.person.role === 'student' ? 'Chooses what you see' : undefined)}/>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
        <InviteLink accountId={me.id} line="Your teen or their Medical Professional opens it to connect."><CodeField/></InviteLink>
        <Steps/>
      </div>
    </div>
  )
}

/* An Other account links to nobody: no link kind names it. */
function OtherNetwork({ go }) {
  return (
    <div className="mt-3.5 grid grid-cols-1 gap-3 lg:mt-4 lg:grid-cols-2 lg:gap-4">
      <Panel title="Your people" className="self-start">
        <Empty>An Other account does not link to anyone. To connect, sign in as a teen, parent or {PRO}.</Empty>
        <div className="border-t border-rule p-4">
          <button type="button" onClick={() => go('account')} className={outline}>Open settings</button>
        </div>
      </Panel>
      <Steps/>
    </div>
  )
}

function ProNetwork({ me }) {
  return (
    <div className="mt-3.5 grid grid-cols-1 gap-3 lg:mt-4 lg:grid-cols-2 lg:gap-4">
      <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
        <Groups me={me} empty="Nobody is linked yet. Send a teen or parent an invite link."
          sees={l => (l.person.role === 'student' ? 'Chooses what you see' : undefined)}/>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
        <InviteLink accountId={me.id} line="A teen or parent opens it. The teen and a parent approve."><CodeField/></InviteLink>
        <Steps/>
      </div>
    </div>
  )
}

/* ── Demo ───────────────────────────────────────────────────────────────── */

const DEMO_INVITE = { code: 'K7M2QX' }
const VIEWS = [
  { value: 'student', label: 'Maya, teen' },
  { value: 'parent',  label: 'Elena, parent' },
  { value: 'pro',     label: `Dr. Shah, ${PRO}` },
]

function DemoNetwork() {
  const [view, setView] = React.useState('student')
  const [links, setLinks] = React.useState(DEMO_LINKS)
  const [note, setNote] = React.useState(null)
  const [editing, setEditing] = React.useState(null)

  const patch = (id, fn) => setLinks(ls => ls.map(l => {
    if (l.id !== id) return l
    const next = fn(l)
    return { ...next, status: next.status === 'declined' ? 'declined' : (next.teenOk && next.parentOk ? 'active' : 'pending') }
  }))
  const toggle = id => (key, on) => patch(id, l => {
    const audience = audienceOf(l.person.role)
    let shares = on ? [...new Set([...l.shares, key])] : l.shares.filter(k => k !== key)
    if (!on) shares = shares.filter(k => SHARING[audience].fields.find(f => f.key === k)?.needs !== key)
    return { ...l, shares }
  })
  const remove = (id, who) => { setLinks(ls => ls.filter(l => l.id !== id)); setNote(`${who} was removed. They see nothing now.`) }

  const live = links.filter(l => l.status === 'active')
  const pending = links.filter(l => l.status === 'pending')
  const pro = links.find(l => l.id === 'demo-pro')

  const Who = ({ l, hint, children }) => (
    <PersonRow person={l.person} hint={hint}>{children}</PersonRow>
  )

  const teen = (
    <>
      {pending.map(l => (
        <Panel key={l.id} title="Waiting for you" aside={l.since} className="border-2 border-accent">
          <Who l={l} hint={l.person.setting}/>
          {l.teenOk ? (
            <p role="status" className="max-w-none border-t border-rule px-4 py-3 text-ui text-ink">
              You approved. Elena, your parent, approves next.
            </p>
          ) : (
            <>
              <p className="max-w-none border-t border-rule px-4 py-3 text-fine text-ink-2">
                {l.person.name} asks to connect. Choose what she can see. All start off.
              </p>
              <ShareSwitches audience="pro" keys={l.shares} onToggle={toggle(l.id)}/>
              <div className="flex flex-wrap gap-2 border-t border-rule p-4">
                <button type="button" className={solid}
                  onClick={() => { patch(l.id, x => ({ ...x, teenOk: true })); setNote(null) }}>
                  <Check aria-hidden className="size-4"/>Approve
                </button>
                <button type="button" className={outline} onClick={() => remove(l.id, l.person.name)}>Decline</button>
              </div>
            </>
          )}
        </Panel>
      ))}
      <Panel title="Your people" aside={String(live.length)}>
        {live.length ? live.map(l => {
          const audience = audienceOf(l.person.role)
          const open = editing === l.id
          return (
            <div key={l.id} className="border-t border-rule first:border-t-0">
              <Who l={l} hint={seesLine(audience, l.shares)}>
                <button type="button" aria-expanded={open} onClick={() => setEditing(open ? null : l.id)}
                  className={cn(outline, 'min-h-[44px] px-3 text-fine')}>{open ? 'Done' : 'Change'}</button>
                <IconButton label={`Remove ${l.person.name}`} Mark={Cross} tone="crit" onClick={() => remove(l.id, l.person.name)}/>
              </Who>
              {open && <ShareSwitches audience={audience} keys={l.shares} onToggle={toggle(l.id)}/>}
            </div>
          )
        }) : <Empty>Nobody is linked.</Empty>}
      </Panel>
    </>
  )

  const parent = (
    <>
      <Panel title="Waiting for your approval" aside={pending.length ? String(pending.length) : undefined}
        className={pending.some(l => !l.parentOk) ? 'border-2 border-accent' : undefined}>
        {pending.length ? pending.map(l => (
          <Who key={l.id} l={l} hint={`For Maya. ${l.teenOk ? 'Maya approved.' : 'Maya has not approved yet.'}`}>
            {l.parentOk ? <span className="font-display text-fine font-bold text-ink-2">You approved</span> : <>
              <IconButton label={`Approve ${l.person.name}`} Mark={Check} tone="accent"
                onClick={() => patch(l.id, x => ({ ...x, parentOk: true }))}/>
              <IconButton label={`Decline ${l.person.name}`} Mark={Cross} tone="crit" onClick={() => remove(l.id, l.person.name)}/>
            </>}
          </Who>
        )) : <Empty>No requests waiting.</Empty>}
      </Panel>
      <Panel title="Your teens">
        <Who l={{ person: DEMO_TEEN }} hint={`Shares with you: ${(links.find(l => l.id === 'demo-parent')?.shares || []).map(k => shareLabel('parent', k)).join(', ') || 'nothing yet'}`}/>
      </Panel>
      <Panel title={`Maya’s ${PRO_PLURAL}`}>
        {live.filter(l => l.person.role === 'pro').map(l => <Who key={l.id} l={l} hint={l.person.setting}/>)}
      </Panel>
    </>
  )

  const proView = (
    <>
      <Panel title="Your Network">
        {pro && pro.status === 'active'
          ? <Who l={{ person: DEMO_TEEN }} hint={`Shares with you: ${pro.shares.map(k => shareLabel('pro', k)).join(', ') || 'nothing yet'}`}/>
          : <Empty>Maya removed this link. You see nothing now.</Empty>}
      </Panel>
      <Panel title="Linked parents">
        {links.find(l => l.id === 'demo-parent')
          ? <Who l={links.find(l => l.id === 'demo-parent')} hint="Maya’s parent"/>
          : <Empty>No parent linked.</Empty>}
      </Panel>
    </>
  )

  return (
    <>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <Tabs value={view} onValueChange={v => { setView(v); setEditing(null) }} className="min-w-0 max-w-full">
          <TabsList scroll aria-label="Whose side to show" className="gap-x-5 border-rule">
            {VIEWS.map(v => <TabsTrigger key={v.value} value={v.value} className="min-h-[44px] text-ui">{v.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <button type="button" onClick={() => { setLinks(DEMO_LINKS); setNote(null); setEditing(null) }}
          className="inline-flex min-h-[44px] items-center font-display text-fine font-medium text-ink-2 hoverOnly:text-ink">
          Reset the demo
        </button>
      </div>
      {note && <p role="status" className="mt-2 font-display text-fine font-medium text-accent-ink">{note}</p>}
      <div className="mt-3.5 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
          {view === 'student' ? teen : view === 'parent' ? parent : proView}
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
          <InviteLink demo={DEMO_INVITE}
            line={view === 'pro' ? 'A teen or parent opens it.' : 'A parent or Medical Professional opens it.'}/>
          <Steps/>
        </div>
      </div>
    </>
  )
}

/* ── The screen ─────────────────────────────────────────────────────────── */

export function Network({ go }) {
  const me = useAccount()
  const [mode] = useMode()
  const [invite, setInvite] = React.useState(inviteFromUrl)
  React.useEffect(() => { codeListeners.add(setInvite); return () => { codeListeners.delete(setInvite) } }, [])
  const demo = mode === 'demo' && !invite
  if (!demo && !me) {
    return <SignIn go={go} after="network" bare
      note={invite ? 'Sign in or create an account to answer the invite.' : 'Sign in to see your network.'}/>
  }
  const Body = { student: TeenNetwork, parent: ParentNetwork, pro: ProNetwork }[me?.role] || OtherNetwork
  return (
    <main className="wrap">
      <h2 className="sr-only">Network</h2>
      <p className="max-w-[62ch] text-ui text-ink-2">
        Teens, parents and {PRO_PLURAL} connect by link. Nothing is shared until the teen says yes.
        {demo && <span className="block text-fine text-ink-3">Demo. These people are examples.</span>}
      </p>
      {demo ? <DemoNetwork/> : (
        <>
          {invite && <div className="mt-3.5"><AnswerInvite code={invite} teen={me.role === 'student'} onDone={() => setInvite(null)}/></div>}
          <Body me={me} go={go}/>
        </>
      )}
    </main>
  )
}
