import React from 'react'
import { FAMILY } from '../../lib/roster'
import { PRO, PRO_PLURAL, PRO_WRAP } from '../../lib/terms'
import { Avatar } from '../../account/ui'
import { DEMO_LINKS } from '../../account/demo-network'
import {
  createInvite, getVersion, listNetwork, listPendingApprovals, myInvite, subscribe,
} from '../../account/store'
import { ArrowRight, Check, Copy, Cross, Link, People, Plus } from '../../ui/marks'
import { cn } from '../../lib/utils'

/* NetworkBox({ go, real, me, className }): the parent home's network box.
 *
 * Who is in this parent's network (teens and Counselors/Professionals: picture,
 * name, role, nothing else) and the two ways to add someone. Both make the
 * same invite link: one multi-use link per parent, of the form
 * #/network?code=CODE (src/account/Network.jsx reads it). The reader copies
 * or shares it; the teen opens it and joins.
 *
 * Demo shows Elena's people (the two demo children and the
 * Counselors/Professionals from src/account/demo-network.js) and an example link that
 * never reaches the server. Live uses the account store. No reading, score
 * or trend is ever shown here. */

const DEMO_CODE = 'K7M2QX'

const linkFor = code => {
  try { return `${window.location.origin}${window.location.pathname}#/network?code=${code}` }
  catch { return `#/network?code=${code}` }
}
const shareText = (code, who) => (who === 'pro'
  ? `Join my MindMap network as my teen’s ${PRO}: ${linkFor(code)} (code ${code})`
  : `Join my MindMap network: ${linkFor(code)} (code ${code})`)

const ROLE = { student: 'Teen', parent: 'Parent', pro: PRO_WRAP }

function daysLeft(iso) {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  const d = Math.max(1, Math.ceil((t - Date.now()) / 86400000))
  return d === 1 ? 'The link works for 1 more day.' : `The link works for ${d} more days.`
}

/* People, in one shape for both modes: { id, name, avatar, role, note }. */
function demoPeople() {
  const teens = FAMILY.map(t => ({ id: 'demo-' + t.id, name: t.first, avatar: t.avatar, role: 'student' }))
  const pros = DEMO_LINKS.filter(l => l.person.role === 'pro').map(l => ({
    id: l.id, name: l.person.name, avatar: l.person.avatar, role: 'pro',
    note: l.status === 'pending' ? 'Waiting for your OK' : null,
  }))
  return [...teens, ...pros]
}

function livePeople(me) {
  const mine = listNetwork(me.id)
    .filter(l => l.status !== 'declined' && (l.person.role === 'student' || l.person.role === 'pro'))
    .map(l => ({ id: l.id, name: l.person.name, avatar: l.person.avatar, role: l.person.role,
      note: l.status === 'pending' ? 'Waiting' : null }))
  const asking = listPendingApprovals(me.id).map(l => ({
    id: 'ask-' + l.id, name: l.person.name, avatar: l.person.avatar, role: 'pro',
    note: `Waiting for your OK, for ${l.who.name}`,
  }))
  return [...mine, ...asking.filter(a => !mine.some(m => m.name === a.name && m.role === 'pro'))]
}

export default function NetworkBox({ go, real, me, className }) {
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const parent = real && me?.role === 'parent'
  const people = real ? (parent ? livePeople(me) : []) : demoPeople()
  const [adding, setAdding] = React.useState(null)
  const titleId = React.useId()
  const panelId = React.useId()

  const start = who => {
    setAdding(who)
    if (parent && !myInvite(me.id)) createInvite()
  }

  const canAdd = !real || parent

  return (
    <section aria-labelledby={titleId}
      className={cn('flex min-w-0 flex-col rounded-panel border-2 border-accent bg-card', className)}>
      <div className="flex items-start gap-3 border-b-2 border-accent bg-accent-wash px-5 pb-4 pt-5 [border-top-left-radius:12px] [border-top-right-radius:12px]">
        <People aria-hidden className="mt-0.5 size-7 text-accent-ink"/>
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="m-0 font-display !text-row font-bold leading-tight text-ink">Your network</h3>
          <p className="m-0 mt-1 text-fine text-ink-2">
            Your teens and their {PRO_PLURAL}. Your teen chooses what each person sees.</p>
        </div>
      </div>

      <div className="px-5 pt-3">
        {people.length ? (
          <ul aria-label="People in your network" className="m-0 list-none p-0">
            {people.map(p => (
              <li key={p.id} className="flex min-h-[56px] items-center gap-3 border-b border-rule py-2 last:border-b-0">
                <Avatar name={p.name} avatar={p.avatar} size="md"/>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-ui font-bold text-ink">{p.name}</span>
                  <span className="block text-fine text-ink-2">{ROLE[p.role] || 'Removed'}</span>
                </span>
                {p.note && (
                  <span className="max-w-[45%] shrink-0 text-right text-fine font-semibold text-warn">{p.note}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 py-3 text-ui text-ink-2">
            {!real || parent ? 'Nobody is in your network yet. Add your teen first.'
              : !me ? 'Sign in as a parent to see and add your people.'
                : 'This account is not a parent account.'}
          </p>
        )}
      </div>

      <div className="mt-auto px-5 pb-5 pt-4">
        {canAdd ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
            <AddButton on={adding === 'teen'} controls={panelId} onClick={() => start('teen')} solid>Add a teen</AddButton>
            <AddButton on={adding === 'pro'} controls={panelId} onClick={() => start('pro')}>Add a {PRO}</AddButton>
          </div>
        ) : (
          <button type="button" onClick={() => go?.('network')}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-field bg-accent px-4
              font-display text-ui font-bold text-paper hoverOnly:bg-accent-ink focus-visible:outline focus-visible:outline-2
              focus-visible:outline-offset-2 focus-visible:outline-accent">
            {me ? 'Open your network' : 'Sign in'}<ArrowRight aria-hidden className="size-5"/>
          </button>
        )}

        <div id={panelId}>
          {adding && canAdd && (
            <InvitePanel who={adding} real={real} me={me} onClose={() => setAdding(null)}/>
          )}
        </div>

        <button type="button" onClick={() => go?.('network')}
          className="group mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-field font-display text-ui font-bold
            text-accent-ink underline decoration-accent/40 decoration-2 underline-offset-4 hoverOnly:decoration-accent
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          Manage network
          <ArrowRight aria-hidden className="size-4 transition-transform duration-150 groupHoverOnly:translate-x-0.5
            motion-reduce:transition-none"/>
        </button>
      </div>
    </section>
  )
}

function AddButton({ on, controls, onClick, solid, children }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={on} aria-controls={controls}
      className={cn('inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-field border-2 px-4',
        'font-display text-ui font-bold transition-colors duration-150 motion-reduce:transition-none',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        solid ? 'border-accent bg-accent text-paper hoverOnly:border-accent-ink hoverOnly:bg-accent-ink'
          : 'border-accent bg-card text-accent-ink hoverOnly:bg-accent-wash',
        on && !solid && 'bg-accent-wash')}>
      <Plus aria-hidden className="size-5"/>{children}
    </button>
  )
}

/* The link, with Copy and (where the device has a share sheet) Share. */
function InvitePanel({ who, real, me, onClose }) {
  const inv = real ? (me ? myInvite(me.id) : null) : { code: DEMO_CODE }
  const [said, setSaid] = React.useState('')
  const timer = React.useRef(null)
  React.useEffect(() => () => clearTimeout(timer.current), [])
  const canShare = real && typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const url = inv ? linkFor(inv.code) : ''

  const flash = s => { setSaid(s); clearTimeout(timer.current); timer.current = setTimeout(() => setSaid(''), 2400) }
  async function copy() {
    try { await navigator.clipboard.writeText(url); flash('Link copied.') }
    catch { flash('Copy did not work. Select the link and copy it.') }
  }
  async function share() {
    try { await navigator.share({ title: 'Join my MindMap network', text: shareText(inv.code, who), url }) }
    catch (e) { if (e?.name !== 'AbortError') copy() }
  }

  return (
    <div className="mt-3 rounded-panel border border-rule bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 font-display text-ui font-bold text-ink">
          {who === 'pro' ? `Send this link to your teen’s ${PRO}` : 'Send this link to your teen'}</p>
        <button type="button" onClick={onClose} aria-label="Close the invite link"
          className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-field text-ink-2 hoverOnly:bg-mist
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
          <Cross className="size-5"/>
        </button>
      </div>
      <p className="m-0 mt-1 text-fine text-ink-2">
        {who === 'pro'
          ? 'They open it and join. Your teen then chooses what they see.'
          : 'They open it, sign in and join. Then they choose what you see.'}</p>

      {inv ? (
        <>
          <p className="m-0 mt-3 break-all rounded-field border border-rule bg-card px-3 py-2.5 text-fine text-ink">{url}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button type="button" onClick={copy}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-field bg-ink px-4 font-display text-ui font-bold
                text-paper hoverOnly:bg-accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-accent">
              {said === 'Link copied.' ? <Check aria-hidden className="size-4"/> : <Copy aria-hidden className="size-4"/>}
              Copy link
            </button>
            {canShare && (
              <button type="button" onClick={share}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-field border-2 border-ink px-4 font-display
                  text-ui font-bold text-ink hoverOnly:bg-mist focus-visible:outline focus-visible:outline-2
                  focus-visible:outline-offset-2 focus-visible:outline-accent">
                <Link aria-hidden className="size-4"/>Share
              </button>
            )}
          </div>
          <p className="m-0 mt-2 text-fine text-ink-2">
            Code <b className="font-display font-bold tracking-[0.12em] text-ink">{inv.code}</b>.{' '}
            {real ? `One link works for everyone you send it to. ${daysLeft(inv.expiresAt)}`
              : 'An example for the demo. It does not make a real invite.'}
          </p>
        </>
      ) : (
        <p role="status" className="m-0 mt-3 text-ui text-ink-2">Making your link…</p>
      )}
      <p aria-live="polite" className="m-0 mt-1 min-h-[1.25rem] text-fine font-semibold text-accent-ink">{said}</p>
    </div>
  )
}
