import React from 'react'
import { cn } from '../lib/utils'
import { Panel, SwitchRow } from '../app/controls'
import { Check, ChevronDown, Copy, Cross, Plus } from '../ui/marks'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { useMode } from '../lib/mode'
import { PRO, PRO_LC, PRO_PLURAL } from '../lib/terms'
import { SHARING, getSharing, getVersion as sharingVersion, setShared, subscribe as onSharing } from '../app/store'
import { shareLabel } from '../app/Sharing'
import {
  approveLink, createInvite, declineLink, getVersion, listNetwork, listPendingApprovals,
  current, myInvite, ready, redeemInvite, removeLink, subscribe, useAccount,
} from './store'
import { DEMO_CASELOAD, DEMO_LINKS, DEMO_PRO_PARENTS, DEMO_TEEN } from './demo-network'
import { Empty, IconButton, LinkMark, PersonRow, field, fieldError, outline, solid } from './ui'
import { SignIn } from './SignIn'

/* The network: teens, parents and Counselors/Professionals linked to each other.
 *
 * The flow, the same on every shape of the screen:
 *   1. A parent or a Counselor/Professional makes an invite link (a six
 *      character code inside a URL). Teens never make one. The link keeps
 *      working for every teen it is sent to, so one link gathers a family or
 *      a caseload.
 *   2. The teen opens it. Signed out, they sign in or make an account, and
 *      they join the network as soon as they are in: useAutoJoin below, run
 *      once by the app shell, redeems the code with no further press.
 *   3. The teen chooses what that person can see. Every switch starts on
 *      and the teen can turn any of it off. A Counselor/Professional link also
 *      needs a parent's OK, which is the store's rule (src/account/store.js)
 *      and the server's.
 *   4. Both of them see the connection.
 *
 * Demo mode shows the network in ./demo-network.js, from any of the three
 * sides (the Counselor/Professional's side is the whole demo caseload, Maya
 * among them), and every button works on that copy only. The reader is
 * "you" on every side, never a demo name (owner, 18 October). Live mode is the
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
/* Kept in sessionStorage too, so a code survives the trip through sign up,
   a reload, or the app home, until it is used. */
const PENDING_KEY = 'mindmap.invite.pending'
let pendingCode = (() => {
  try { const v = window.sessionStorage.getItem(PENDING_KEY); return v && CODE_RE.test(v) ? v : null } catch { return null }
})()
const codeListeners = new Set()
const keepCode = c => { try { c ? window.sessionStorage.setItem(PENDING_KEY, c) : window.sessionStorage.removeItem(PENDING_KEY) } catch {} }
function takeCodeFromUrl() {
  try {
    const hash = window.location.hash
    const q = hash.indexOf('?')
    const fromHash = q >= 0 && /^#\/?network\?/.test(hash) ? new URLSearchParams(hash.slice(q + 1)).get('code') : null
    const fromSearch = new URLSearchParams(window.location.search).get('invite')
    const c = [fromHash, fromSearch].find(v => v && CODE_RE.test(v))
    if (c) { pendingCode = c.toUpperCase(); keepCode(pendingCode); codeListeners.forEach(fn => fn(pendingCode)) }
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
function clearInviteFromUrl() { pendingCode = null; keepCode(null); codeListeners.forEach(fn => fn(null)) }

/* ── Joining by link, automatically ─────────────────────────────────────── */

/* The result of the last automatic join, for the network screen to show:
   { state: 'joining' } while it runs, then { ok, link, name, reason }. Each
   result carries `by`, the account that joined, and belongs to that account
   only: signing out, or any other account signing in, clears it. */
let joined = null
const joinListeners = new Set()
const setJoined = v => { joined = v; joinListeners.forEach(fn => fn(v)) }
const joinedFor = id => (joined && id && joined.by === id ? joined : null)
try {
  subscribe(() => {
    if (!joined) return
    let id = null
    try { id = current()?.id || null } catch {}
    if (joined.by !== id) setJoined(null)
  })
} catch {}
function useJoined(accountId) {
  const [, set] = React.useState(joined)
  React.useEffect(() => { joinListeners.add(set); return () => { joinListeners.delete(set) } }, [])
  return joinedFor(accountId)
}

/* Run once in the app shell. When somebody holding an invite code is signed
   in, by signing in, by making an account, or because they already were,
   the code is redeemed at once and the network screen opens on the result.
   A code that fails for a reason that will not change (wrong role, own,
   expired, unknown, already linked) is dropped; offline keeps it to retry. */
export function useAutoJoin(go) {
  const me = useAccount()
  const [code, setCode] = React.useState(inviteFromUrl)
  React.useEffect(() => { codeListeners.add(setCode); return () => { codeListeners.delete(setCode) } }, [])
  const busy = React.useRef(false)
  React.useEffect(() => {
    if (!me || !code || busy.current) return
    busy.current = true
    const by = me.id
    setJoined({ state: 'joining', code, by })
    ;(async () => {
      await ready()
      const r = await redeemInvite(code)
      busy.current = false
      /* After the redeem, not before: the sign in form sends its reader on
         to the app when it finishes, and this has to land last. */
      go?.('network')
      /* Somebody else signed in while it ran: the result is not theirs. */
      if ((current()?.id || null) !== by) { setJoined(null); return }
      if (!r.ok && (r.reason === 'offline' || r.reason === 'signedout')) { setJoined({ ok: false, reason: r.reason, code, by }); return }
      clearInviteFromUrl()
      const person = r.ok ? listNetwork(by).find(l => l.id === r.link.id)?.person : null
      setJoined(r.ok ? { ok: true, link: r.link, name: person?.name || null, role: person?.role || null, code, by }
        : { ok: false, reason: r.reason, code, by })
    })()
  }, [me?.id, code, go])
}

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

/* A teen joins networks and never makes one: the link comes from a parent
   or a Counselor/Professional. The code field is for a code read out loud. */
function JoinByLink({ demo = false }) {
  return (
    <Panel title="Join a network">
      <p className="max-w-none px-4 pt-4 text-ui text-ink">
        Your parent or {PRO} sends you a link. Open it and you join their network.
      </p>
      <p className="max-w-none px-4 pt-1.5 text-fine text-ink-2">
        {demo ? 'In the demo, you joined Elena’s and Dr. Shah’s networks this way.' : 'Teens do not make networks.'}
      </p>
      {demo ? <div className="h-4"/> : <CodeField/>}
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
          Join
        </button>
      </div>
      {err && <p id="net-code-err" role="alert" className="mt-2 font-display text-fine font-medium text-crit">{err}</p>}
      {done && <p role="status" className="mt-2 font-display text-fine font-medium text-accent-ink">{done}</p>}
    </form>
  )
}

/* Step 2, after the automatic join: what happened, in one panel. */
function JoinedPanel({ result, teen, onDone }) {
  if (!result) return null
  if (result.state === 'joining') {
    return (
      <section role="status" className="rounded-panel border-2 border-accent bg-accent-wash p-4">
        <h3 className="font-display text-meta font-bold text-ink">Joining the network…</h3>
        <p className="mt-1 text-ui text-ink-2">
          Code <span className="font-mono font-bold tracking-[0.12em] text-ink">{result.code}</span>.</p>
      </section>
    )
  }
  const who = result.name || 'them'
  const pending = result.ok && result.link?.status === 'pending'
  return (
    <section className={cn('rounded-panel border-2 p-4', result.ok ? 'border-accent bg-accent-wash' : 'border-crit bg-card')}>
      <h3 className="font-display text-meta font-bold text-ink">
        {result.ok ? (pending ? `Request sent to join ${who}’s network` : `You joined ${who}’s network`) : 'The invite link did not work'}
      </h3>
      <p role={result.ok ? 'status' : 'alert'} className="mt-1 text-ui text-ink">
        {result.ok
          ? (pending ? 'A parent approves it next. Nothing is shared until then.'
            : teen ? 'They see what is switched on below. Switch any of it off.' : 'The teen chooses what you see.')
          : (REDEEM_ERROR[result.reason] || REDEEM_ERROR.unknown)}
      </p>
      <button type="button" onClick={onDone} className={cn(outline, 'mt-3')}>OK</button>
    </section>
  )
}

/* ── How it works ───────────────────────────────────────────────────────── */

const STEPS = [
  `A parent or ${PRO} makes one invite link.`,
  'They send it to each of their teens.',
  'The teen opens it, signs in, and joins.',
  'Everything starts shared. The teen can switch any of it off.',
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
          if (!audience) return null
          const pending = l.status === 'pending'
          /* Linked already, on both sides: nothing waits on the teen, so this
             is a chance to change what they see, not a request. */
          return (
            <Panel key={l.id} title={pending ? 'Waiting for a parent’s OK' : 'Change what they see'}
              className="border-2 border-accent">
              <PersonRow person={l.person} status={STATUS.student[l.status]}
                hint={pending ? 'you joined, a parent approves this one too' : 'you joined their network'} comma/>
              <p className="max-w-none border-t border-rule px-4 py-3 text-fine text-ink-2">
                Every {audience === 'parent' ? 'parent' : PRO_LC} you link with sees what is on. All start on. Switch any of it off.
              </p>
              <ShareSwitches audience={audience}/>
              <div className="flex flex-wrap gap-2 border-t border-rule p-4">
                <button type="button" onClick={() => review(l.id)} className={solid}><Check aria-hidden className="size-4"/>Done</button>
                <button type="button" onClick={() => removeLink(l.id)} className={outline}>Remove {l.person.name}</button>
              </div>
            </Panel>
          )
        })}
        <Groups me={me} empty={`Nobody is linked yet. Open the link your parent or ${PRO_LC} sends you.`}
          sees={l => seesLine(audienceOf(l.person.role), on(audienceOf(l.person.role) || 'parent'))}/>
        <button type="button" onClick={() => go('shared')} className={cn(outline, 'justify-self-start')}>
          Change what each person sees
        </button>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
        <JoinByLink/>
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
        <Groups me={me} empty="Nobody is linked yet. Send your invite link to each of your teens."
          sees={l => (l.person.role === 'student' ? 'Chooses what you see' : undefined)}/>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
        <InviteLink accountId={me.id} line={`Send it to each of your teens, and to their ${PRO_LC}. One link works for all of them.`}><CodeField/></InviteLink>
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
        <Groups me={me} empty="Nobody is linked yet. Send your invite link to your students and their parents."
          sees={l => (l.person.role === 'student' ? 'Chooses what you see' : undefined)}/>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
        <InviteLink accountId={me.id} line="Send it to each of your students and their parents. One link works for all of them. A parent approves each student."><CodeField/></InviteLink>
        <Steps/>
      </div>
    </div>
  )
}

/* ── Demo ───────────────────────────────────────────────────────────────── */

const DEMO_INVITE = { code: 'K7M2QX' }
const VIEWS = [
  { value: 'student', label: 'Student' },
  { value: 'parent',  label: 'Parent' },
  { value: 'pro',     label: PRO },
]

/* The Counselor/Professional's side: every teen on the caseload, by grade. A grade opens to
   its teens, each with their student code (the name the dashboards use) and
   what that teen has chosen to share. Only the teen changes that. */
const proSharesLine = keys => (keys.length
  ? 'Shares ' + keys.map(k => shareLabel('pro', k)).join(', ')
  : 'Shares nothing right now')

function GradeGroup({ grade, rows, open, onToggle, onRemove }) {
  const id = `net-grade-${grade}`
  return (
    <div className="border-t border-rule first:border-t-0">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}
        className="flex min-h-[56px] w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150
          hoverOnly:bg-mist/60">
        <span aria-hidden className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-field border-2 border-beam
          font-display text-ui font-bold tabular-nums text-beam-ink">{grade}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="font-display text-ui font-bold text-ink">Grade {grade}</span>
            <span className="shrink-0 font-mono text-fine tabular-nums text-ink-2">
              {rows.length === 1 ? '1 teen' : `${rows.length} teens`}</span>
          </span>
          <span className="mt-0.5 block text-fine text-ink-2">{rows.map(r => r.person.name).join(', ')}</span>
        </span>
        <ChevronDown aria-hidden className={cn('mt-2 size-4 shrink-0 text-ink-3 transition-transform duration-150',
          open && 'rotate-180')}/>
      </button>
      {open && (
        <div id={id} className="border-t border-rule bg-mist/30">
          {rows.map(r => (
            <PersonRow key={r.id} person={r.person} role={false}
              hint={`${r.code}. ${proSharesLine(r.shares)}`}>
              <IconButton label={`Remove ${r.person.name}`} Mark={Cross} tone="crit" onClick={() => onRemove(r)}/>
            </PersonRow>
          ))}
        </div>
      )}
    </div>
  )
}

function ProCaseload({ rows, parents, onRemove, onRemoveParent }) {
  const grades = [...new Set(rows.map(r => r.grade))].sort((a, b) => a - b)
  const [openGrades, setOpenGrades] = React.useState(() => new Set())
  const flip = g => setOpenGrades(s => { const n = new Set(s); n.has(g) ? n.delete(g) : n.add(g); return n })
  const n = rows.length
  return (
    <>
      <Panel title="Teens sharing with you" aside={String(n)}
        lede={n ? `${n === 1 ? 'One teen shares' : `${n} teens share`} with you. Each teen chooses what you see. Open a grade to see who.`
          : undefined}>
        {n ? grades.map(g => (
          <GradeGroup key={g} grade={g} rows={rows.filter(r => r.grade === g)}
            open={openGrades.has(g)} onToggle={() => flip(g)} onRemove={onRemove}/>
        )) : <Empty>No teens linked. You see nothing now.</Empty>}
      </Panel>
      <Panel title="Linked parents" aside={parents.length ? String(parents.length) : undefined}
        lede="A parent approved each teen’s link. These parents also joined your network.">
        {parents.length ? parents.map(p => (
          <PersonRow key={p.id} person={p.person} role={false} hint={`${p.ofName}’s parent`}>
            <IconButton label={`Remove ${p.person.name}`} Mark={Cross} tone="crit" onClick={() => onRemoveParent(p)}/>
          </PersonRow>
        )) : <Empty>No parent linked.</Empty>}
      </Panel>
    </>
  )
}

function DemoNetwork({ who }) {
  /* Opened from one of the three apps, the demo stays on that side: a
     Counselor/Professional opening Network sees that side, never the teen's
     or the parent's. Only a visit with no app behind it can switch. */
  const fixed = who === 'student' || who === 'parent' || who === 'pro'
  const [view, setView] = React.useState(fixed ? who : 'student')
  const [links, setLinks] = React.useState(DEMO_LINKS)
  const [caseload, setCaseload] = React.useState(DEMO_CASELOAD)
  const [dropped, setDropped] = React.useState([])
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
                You joined {l.person.name}’s network. Choose what they can see. All start on.
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
    <ProCaseload
      rows={caseload.filter(r => (r.maya ? pro && pro.status === 'active' : true))
        .map(r => (r.maya ? { ...r, shares: pro.shares } : r))}
      parents={DEMO_PRO_PARENTS.filter(p => !dropped.includes(p.id))}
      onRemove={r => {
        if (r.maya) { remove(r.id, r.person.name); return }
        setCaseload(c => c.filter(x => x.id !== r.id)); setNote(`${r.person.name} was removed. You see nothing from them now.`)
      }}
      onRemoveParent={p => { setDropped(d => [...d, p.id]); setNote(`${p.person.name} was removed.`) }}/>
  )

  return (
    <>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        {fixed ? <span/> : (
          <Tabs value={view} onValueChange={v => { setView(v); setEditing(null) }} className="min-w-0 max-w-full">
            <TabsList scroll aria-label="Whose side to show" className="gap-x-5 border-rule">
              {VIEWS.map(v => <TabsTrigger key={v.value} value={v.value} className="min-h-[44px] text-ui">{v.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        )}
        <button type="button" onClick={() => { setLinks(DEMO_LINKS); setCaseload(DEMO_CASELOAD); setDropped([]); setNote(null); setEditing(null) }}
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
          {view === 'student' ? <JoinByLink demo/> : (
            <InviteLink demo={DEMO_INVITE}
              line={view === 'pro' ? 'Send it to each of your students and their parents. One link works for all of them.'
                : 'Send it to each of your teens. One link works for all of them.'}/>
          )}
          <Steps/>
        </div>
      </div>
    </>
  )
}

/* ── The screen ─────────────────────────────────────────────────────────── */

export function Network({ go, who }) {
  const me = useAccount()
  const [mode] = useMode()
  const [invite, setInvite] = React.useState(inviteFromUrl)
  React.useEffect(() => { codeListeners.add(setInvite); return () => { codeListeners.delete(setInvite) } }, [])
  const result = useJoined(me?.id)
  const demo = mode === 'demo' && !invite && !result
  if (!demo && !me) {
    return <SignIn go={go} after="network" bare
      note={invite ? 'Sign in or make an account. You join the network as soon as you are in.' : 'Sign in to see your network.'}/>
  }
  const Body = { student: TeenNetwork, parent: ParentNetwork, pro: ProNetwork }[me?.role] || OtherNetwork
  return (
    <main className="wrap">
      <h2 className="sr-only">Network</h2>
      <p className="max-w-[62ch] text-ui text-ink-2">
        Parents and {PRO_PLURAL} make a network and send its link. Teens join by opening it. Teens choose what each person sees, and everything starts on.
        {demo && <span className="block text-fine text-ink-3">Demo. These people are examples.</span>}
      </p>
      {demo ? <DemoNetwork who={who}/> : (
        <>
          {result && <div className="mt-3.5"><JoinedPanel result={result} teen={me.role === 'student'} onDone={() => setJoined(null)}/></div>}
          <Body me={me} go={go}/>
        </>
      )}
    </main>
  )
}
