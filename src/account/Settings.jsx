import React from 'react'
import { cn } from '../lib/utils'
import { ChoiceRows, Panel, SwitchRow } from '../app/controls'
import { Bell, Bin, Download, Grid, Info, Key, People } from '../ui/marks'
import { useMode } from '../lib/mode'
import { CONSENT_SHORT, PRO_PLURAL } from '../lib/terms'
import { MOTION, TEXT_SIZES, setAppearance, useAppearance } from './appearance'
import { DEMO_LINKS, demoCounts } from './demo-network'
import { backend, homeFor, listNetwork, listPendingApprovals, signOut } from './store'
import { Avatar, HelpMark, LinkMark, Row, ShieldMark, outline, solid } from './ui'

/* Every setting the app has, in one menu. The account page shows it under
 * the profile card; the sign-in page shows it under the form, so a visitor
 * who has not made an account can still reach all of it.
 *
 * Network is first and the largest. The rest are grouped: Profile, Privacy
 * and sharing, Notifications, Appearance, Data, About. Each row opens the
 * screen that already owns the setting; Appearance is the only one set here,
 * because it has no other home.
 */

export const SHARING_ROUTE = { student: 'shared', parent: 'privacy', pro: 'app-pro', other: 'privacy' }
const SHARING_LABEL = { student: 'What you share', parent: 'What a parent can see', pro: 'What teens share', other: 'How sharing works' }

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

function NetworkPanel({ me, go, demo }) {
  let people, linked, waiting
  if (demo) {
    const c = demoCounts()
    people = DEMO_LINKS.map(l => l.person); linked = c.linked; waiting = c.waiting
  } else if (me) {
    const rows = listNetwork(me.id).filter(l => l.status !== 'declined')
    people = rows.map(l => l.person)
    linked = rows.filter(l => l.status === 'active').length
    waiting = me.role === 'parent' ? listPendingApprovals(me.id).length : rows.filter(l => l.status === 'pending').length
  } else {
    people = []; linked = 0; waiting = 0
  }
  const open = () => go('network')
  return (
    <section aria-labelledby="set-network"
      className="overflow-hidden rounded-panel border-2 border-accent bg-card">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="bg-accent-wash p-4 lg:p-5">
          <div className="flex items-center gap-3">
            <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-field bg-accent text-paper">
              <People size={22}/>
            </span>
            <div className="min-w-0">
              <h3 id="set-network" className="font-display text-row font-bold text-ink">Network</h3>
              <p className="text-fine text-ink-2">{demo ? 'Demo: Maya’s network' : me ? 'Your people' : 'Sign in to link people'}</p>
            </div>
          </div>
          <p className="mt-3 max-w-[48ch] text-ui text-ink">
            Teens, parents and {PRO_PLURAL} connect by link. The teen approves what is shared.
          </p>
          {people.length > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <span className="flex -space-x-2">
                {people.slice(0, 4).map(p => (
                  <Avatar key={p.id || p.name} name={p.name} avatar={p.avatar} size="md" className="ring-2 ring-accent-wash"/>
                ))}
              </span>
              <span className="font-display text-fine font-medium text-ink-2">
                {plural(linked, 'linked', 'linked')}{waiting ? `, ${waiting} waiting` : ''}
              </span>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={open} className={solid}><LinkMark size={16}/>Invite by link</button>
            <button type="button" onClick={open} className={outline}>Open network</button>
          </div>
        </div>
        <div className="border-t border-rule lg:border-l lg:border-t-0">
          <Row label="Your people" Mark={People} aside={String(linked)} onClick={open}
            hint="Parents, teens and Medical Professionals"/>
          <Row label="Invite by link" Mark={LinkMark} onClick={open} hint="Copy a link and send it"/>
          <Row label="Waiting for approval" Mark={ShieldMark} aside={String(waiting)} onClick={open}
            hint="Approve or decline a request"/>
          <Row label="What each person can see" Mark={Grid} onClick={open} hint="Change or remove access"/>
        </div>
      </div>
    </section>
  )
}

function Appearance() {
  const a = useAppearance()
  return (
    <Panel title="Appearance">
      <p className="px-4 pt-3 font-display text-fine font-medium text-ink-2">Text size</p>
      <ChoiceRows label="Text size" value={a.text} onChange={text => setAppearance({ text })}
        className="mt-1 border-b border-rule"
        options={TEXT_SIZES.map(t => ({ value: t.value, label: t.label }))}/>
      <SwitchRow label="Reduce motion" hint="Stills fades and slides on this device."
        checked={a.motion === 'reduce'}
        onChange={on => setAppearance({ motion: on ? 'reduce' : MOTION[0].value })}/>
    </Panel>
  )
}

export function Settings({ me, go, className }) {
  const [mode] = useMode()
  const role = me?.role || 'student'
  const where = backend() === 'remote' ? 'Saved to your MindMap account.' : 'Kept on this device.'
  return (
    <section aria-labelledby="settings-h" className={cn('min-w-0', className)}>
      <h2 id="settings-h" className="font-display font-bold text-ink">Settings</h2>
      <div className="mt-3 grid gap-3 lg:gap-4">
        <NetworkPanel me={me} go={go} demo={mode === 'demo'}/>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
          <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
            <Panel title="Profile">
              {me ? (
                <>
                  <button type="button" onClick={() => go('account/profile')}
                    className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors
                      duration-150 hoverOnly:bg-mist/50">
                    <Avatar name={me.name} avatar={me.avatar} size="md"/>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-ui font-medium text-ink">Name and picture</span>
                      <span className="block truncate text-fine text-ink-3">{me.name}</span>
                    </span>
                    <span className="shrink-0 font-display text-fine font-medium text-accent-ink">Edit</span>
                  </button>
                  <Row label="Password and sign-in" Mark={Key} onClick={() => go('account/passcode')}/>
                </>
              ) : (
                <p className="px-4 py-3 text-fine text-ink-2">Make an account above to choose a name and picture.</p>
              )}
            </Panel>
            <Panel title="Privacy and Sharing">
              <Row label={SHARING_LABEL[role]} hint={CONSENT_SHORT} Mark={Grid} onClick={() => go(SHARING_ROUTE[role])}/>
            </Panel>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
            <Panel title="Notifications">
              <Row label="Reminders" hint="When and how MindMap reminds you" Mark={Bell} onClick={() => go('app-notify')}/>
            </Panel>
            <Appearance/>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-3 self-start lg:gap-4">
            <Panel title="Data">
              {me ? (
                <>
                  <Row label="Download a copy" Mark={Download} onClick={() => go('account/data')}/>
                  <Row label="Delete account" Mark={Bin} onClick={() => go('account/data')}/>
                </>
              ) : (
                <p className="px-4 py-3 text-fine text-ink-2">Sign in to download or delete your account.</p>
              )}
              <p className="max-w-none border-t border-rule px-4 py-3 text-fine text-ink-3">{where}</p>
            </Panel>
            <Panel title="About">
              <Row label="About MindMap" Mark={Info} aside={APP_VERSION} onClick={() => go('account/about')}/>
              <Row label="Help" Mark={HelpMark} onClick={() => go('help')}/>
            </Panel>
            {me && (
              <button type="button" onClick={() => { signOut(); go(homeFor(me.role)) }} className={cn(outline, 'justify-self-start')}>
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
