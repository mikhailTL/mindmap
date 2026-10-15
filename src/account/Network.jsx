import React from 'react'
import { cn } from '../lib/utils'
import { Panel } from '../app/controls'
import { Check, Copy, Cross, Grid, Plus } from '../ui/marks'
import { CONSENT_SHORT, PRO, PRO_PLURAL } from '../lib/terms'
import {
  approveLink, createInvite, declineLink, getVersion, listNetwork, listPendingApprovals,
  myInvite, redeemInvite, removeLink, subscribe, useAccount,
} from './store'
import { Empty, IconButton, PersonRow, Row, field, fieldError, outline, solid } from './ui'
import { SignIn } from './SignIn'

/* The network: who is linked to whom.
 *
 * One screen, three shapes. A student sees their people and enters a code;
 * a parent sees their teens, makes a code, and approves or declines a
 * Medical Professional; a Medical Professional sees their students and makes
 * a code. Nothing on any of the three shows a reading, a score or a trend,
 * only names and link status. */

/* The status word, by who is looking. Only a pro to student link is ever
   pending, and a parent never sees one in their own list: for them it sits
   under Waiting for you. */
const STATUS = {
  student: { active: 'Linked', pending: 'Needs a parent’s approval', declined: 'Declined' },
  parent:  { active: 'Linked', pending: 'Waiting',                    declined: 'Declined' },
  pro:     { active: 'Linked', pending: 'Waiting for a parent',       declined: 'Declined' },
}

/* Linked people, one panel per role, in a fixed order. */
const GROUP = {
  student: { student: null,            parent: 'Your parents', pro: `Your ${PRO_PLURAL}` },
  parent:  { student: 'Your teens',    parent: null,           pro: `Your ${PRO_PLURAL}` },
  pro:     { student: 'Your students', parent: 'Linked parents', pro: null },
}
const ORDER = ['student', 'parent', 'pro']

const REDEEM_ERROR = {
  unknown:   'Code not found. Check the letters.',
  expired:   'Code expired. Ask for a new one.',
  own:       'Your own code. Share it instead.',
  role:      'Code is for a different kind of account.',
  exists:    'Already linked.',
  signedout: 'Sign in first.',
  offline:   'No connection. Try again.',
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function CodeField({ label = 'Code', onDone }) {
  const [code, setCode] = React.useState('')
  const [err, setErr] = React.useState(null)
  const [done, setDone] = React.useState(null)
  const ref = React.useRef(null)
  async function submit(e) {
    e.preventDefault()
    const r = await redeemInvite(code)
    if (r.ok) {
      setCode(''); setErr(null)
      setDone(r.link.status === 'pending' ? 'Linked. A parent approves next.' : 'Linked.')
      onDone?.(r.link)
    } else {
      setDone(null); setErr(REDEEM_ERROR[r.reason] || REDEEM_ERROR.unknown)
      requestAnimationFrame(() => ref.current?.focus())
    }
  }
  return (
    <form onSubmit={submit} noValidate className="p-4">
      <label htmlFor="net-code" className="block font-display text-fine font-medium text-ink-2">{label}</label>
      <div className="mt-1 flex gap-2.5">
        <input id="net-code" ref={ref} type="text" value={code} maxLength={7}
          autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false}
          aria-invalid={err ? true : undefined} aria-describedby={err ? 'net-code-err' : undefined}
          onChange={e => { setCode(e.target.value.toUpperCase()); setErr(null); setDone(null) }}
          className={cn(field, '!mt-0 flex-1 uppercase tracking-[0.18em]', err && fieldError)}/>
        <button type="submit" className={cn(solid, 'shrink-0')} disabled={code.replace(/\W/g, '').length < 6}>
          <Plus aria-hidden className="size-4"/>Link
        </button>
      </div>
      {err && <p id="net-code-err" role="alert" className="mt-2 font-display text-fine font-medium text-crit">{err}</p>}
      {done && <p role="status" className="mt-2 font-display text-fine font-medium text-accent-ink">{done}</p>}
    </form>
  )
}

function daysLeft(iso) {
  const d = Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 86400000))
  return d === 1 ? 'Good for 1 day.' : `Good for ${d} days.`
}

/* The code, shown large, with a copy button. */
function InviteCode({ title, cta, line, accountId, children }) {
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const inv = myInvite(accountId)
  const [copied, setCopied] = React.useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(inv.code) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Panel title={title}>
      <div className="p-4">
        {inv ? (
          <>
            <div className="flex items-center gap-3">
              <p aria-label={`Code ${inv.code.split('').join(' ')}`}
                className="min-w-0 flex-1 font-display text-stat font-bold tracking-[0.14em] text-ink">
                {inv.code}
              </p>
              <button type="button" onClick={copy} className={cn(outline, 'shrink-0')}>
                {copied ? <Check aria-hidden className="size-4"/> : <Copy aria-hidden className="size-4"/>}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-2 text-fine text-ink-3">{line} {daysLeft(inv.expiresAt)}</p>
            <button type="button" onClick={() => createInvite()}
              className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-field pr-2 font-display
                text-fine font-medium text-ink-2 transition-colors duration-150 hoverOnly:text-ink">
              <Plus aria-hidden className="size-3.5"/>New code
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => createInvite()} className={solid}>
              <Plus aria-hidden className="size-4"/>{cta}
            </button>
            <p className="mt-2 text-fine text-ink-3">{line}</p>
          </>
        )}
      </div>
      {children}
    </Panel>
  )
}

function Remove({ link }) {
  return (
    <IconButton label={`Remove ${link.person.name}`} Mark={Cross} tone="crit"
      onClick={() => removeLink(link.id)}/>
  )
}

/* ── Pieces, continued ──────────────────────────────────────────────────── */

function Groups({ me, empty }) {
  const rows = listNetwork(me.id)
  const groups = ORDER.filter(r => GROUP[me.role][r] && rows.some(l => l.person.role === r))
  if (!groups.length) return <Panel title="Your people"><Empty>{empty}</Empty></Panel>
  return groups.map(r => {
    const list = rows.filter(l => l.person.role === r)
    return (
      <Panel key={r} title={GROUP[me.role][r]} aside={list.length > 1 ? String(list.length) : undefined}>
        {list.map(l => (
          <PersonRow key={l.id} person={l.person} status={STATUS[me.role][l.status]} role={false}>
            <Remove link={l}/>
          </PersonRow>
        ))}
      </Panel>
    )
  })
}

/* ── Three shapes ───────────────────────────────────────────────────────── */

function StudentNetwork({ me, go }) {
  return (
    <>
      <h2 className="font-display font-bold text-ink">Your network</h2>
      <div className="mt-3.5 grid gap-3 lg:mt-4 lg:grid-cols-2 lg:gap-4">
        <div className="grid gap-3 self-start lg:gap-4">
          <Groups me={me} empty="Nobody yet. Enter a code to link someone."/>
        </div>
        <div className="grid gap-3 self-start lg:gap-4">
          <Panel title="Enter a code">
            <CodeField/>
          </Panel>
          {/* Linking shares nothing. terms.js states the rule; the row opens
              the switches. */}
          <Panel title="What is shared">
            <Row label="Sharing" hint={CONSENT_SHORT} Mark={Grid} onClick={() => go('shared')}/>
          </Panel>
        </div>
      </div>
    </>
  )
}

function ParentNetwork({ me }) {
  const waiting = listPendingApprovals(me.id)
  return (
    <>
      <h2 className="font-display font-bold text-ink">Your network</h2>
      <div className="mt-3.5 grid gap-3 lg:mt-4 lg:grid-cols-3 lg:gap-4">
        <div className="grid gap-3 self-start lg:gap-4">
          <Groups me={me} empty="Nobody yet. Share a code with your teen."/>
        </div>
        <div className="grid gap-3 self-start lg:gap-4">
          <InviteCode title="Invite someone" cta="Make a code" accountId={me.id}
            line="Whoever you invite enters the code.">
            <div className="border-t border-rule"><CodeField label="Enter a code"/></div>
          </InviteCode>
        </div>
        <Panel title="Waiting for you" aside={waiting.length ? String(waiting.length) : undefined}
          className="self-start">
          {waiting.length ? waiting.map(l => (
            <PersonRow key={l.id} person={l.person} hint={`for ${l.who.name}`} comma>
              <IconButton label={`Approve ${l.person.name}`} Mark={Check} tone="accent"
                onClick={() => approveLink(l.id)}/>
              <IconButton label={`Decline ${l.person.name}`} Mark={Cross} tone="crit"
                onClick={() => declineLink(l.id)}/>
            </PersonRow>
          )) : <Empty>Nothing waiting. A {PRO} asks here.</Empty>}
        </Panel>
      </div>
    </>
  )
}

function ProNetwork({ me }) {
  return (
    <>
      <h2 className="font-display font-bold text-ink">Your network</h2>
      <div className="mt-3.5 grid gap-3 lg:mt-4 lg:grid-cols-2 lg:gap-4">
        <div className="grid gap-3 self-start lg:gap-4">
          <Groups me={me} empty="Nobody yet. Make a code to add a student."/>
        </div>
        <div className="grid gap-3 self-start lg:gap-4">
          <InviteCode title="Add a student" cta="Make a code" accountId={me.id}
            line="A student or parent enters the code. A parent approves a student link.">
            <div className="border-t border-rule"><CodeField label="Enter a code"/></div>
          </InviteCode>
        </div>
      </div>
    </>
  )
}

export function Network({ go }) {
  const me = useAccount()
  if (!me) return <SignIn go={go} note="Sign in to see your network."/>
  const Body = { student: StudentNetwork, parent: ParentNetwork, pro: ProNetwork }[me.role]
  return (
    <main className="wrap">
      <Body me={me} go={go}/>
    </main>
  )
}
