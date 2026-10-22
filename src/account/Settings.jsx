import React from 'react'
import { cn } from '../lib/utils'
import { Bell, Chevron, Download, Exit, Grid, Info, Key } from '../ui/marks'
import { useMode } from '../lib/mode'
import { PRO_PLURAL } from '../lib/terms'
import { MOTION, TEXT_SIZES, setAppearance, useAppearance } from './appearance'
import { demoSide } from './demo-network'
import { backend, canInvite, homeFor, listNetwork, listPendingApprovals, signOut } from './store'
import { Avatar, HelpMark, LinkMark, outline, solid } from './ui'

export const SHARING_ROUTE = { student: 'shared', parent: 'privacy', pro: 'app-pro', other: 'privacy' }
const SHARING_LABEL = { student: 'What you share', parent: 'What a parent can see', pro: 'What teens share', other: 'How sharing works' }

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

const GroupHead = ({ id, children, aside }) => (
  <div className="flex items-baseline justify-between gap-3">
    <h3 id={id} className="font-display text-row font-bold text-ink">{children}</h3>
    {aside}
  </div>
)

function People({ me, go, demo, role }) {
  let people, linked, waiting
  if (demo) {
    const d = demoSide(role)
    people = d.people; linked = d.linked; waiting = d.waiting
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
    <section aria-labelledby="set-network">
      <GroupHead id="set-network">Your people</GroupHead>
      <div className="mt-2.5 flex flex-col gap-4 rounded-panel border-2 border-sky bg-sky-wash p-4
        sm:flex-row sm:items-center lg:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {people.length > 0 ? (
              <span className="flex shrink-0 -space-x-3">
                {people.slice(0, 4).map(p => (
                  <Avatar key={p.id || p.name} name={p.name} avatar={p.avatar} size="md"
                    className="size-11 ring-[3px] ring-sky-wash"/>
                ))}
              </span>
            ) : (
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-chip border-2
                border-dashed border-sky-ink text-sky-ink">
                <LinkMark size={20}/>
              </span>
            )}
            <p className="min-w-0 font-display text-ui font-bold leading-tight text-ink">
              {demo ? 'Your network' : linked === 0 ? 'Nobody linked yet' : `${linked} linked`}
              {demo && <span className="block font-medium text-ink-2">
                Demo, {linked} linked{waiting > 0 ? `, ${waiting} waiting` : ''}
              </span>}
              {!demo && waiting > 0 && <span className="block font-medium text-sky-ink">{waiting} waiting</span>}
            </p>
          </div>
          <p className="mt-2.5 max-w-[52ch] text-fine text-ink-2">
            Teens, parents and {PRO_PLURAL} connect by link. Teens choose what each person sees, and everything starts on.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {/* Only parents and pros make invite links; a teen joins one. */}
          {canInvite(role)
            ? <button type="button" onClick={open} className={solid}><LinkMark size={16}/>Invite by link</button>
            : role === 'student' && <button type="button" onClick={open} className={solid}><LinkMark size={16}/>Join a network</button>}
          <button type="button" onClick={open} className={cn(outline, 'border-sky-ink')}>Open network</button>
        </div>
      </div>
    </section>
  )
}

const TILE = {
  sun:   { edge: 'hoverOnly:border-sun',   mark: 'bg-sun-wash text-sun-ink',     bar: 'bg-sun' },
  lilac: { edge: 'hoverOnly:border-lilac', mark: 'bg-lilac-wash text-lilac-ink', bar: 'bg-lilac' },
  coral: { edge: 'hoverOnly:border-coral', mark: 'bg-coral-wash text-coral-ink', bar: 'bg-coral' },
  mint:  { edge: 'hoverOnly:border-mint',  mark: 'bg-mint-wash text-mint-ink',   bar: 'bg-mint' },
}

function Tile({ label, hint, Mark, hue, onClick }) {
  const t = TILE[hue]
  return (
    <button type="button" onClick={onClick}
      className={cn('group relative flex min-h-[112px] min-w-0 flex-col items-start overflow-hidden rounded-panel',
        'border border-rule bg-card p-3.5 pt-4 text-left transition-colors duration-150 active:bg-mist/50', t.edge)}>
      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', t.bar)}/>
      <span className="flex w-full items-start justify-between gap-2">
        <span aria-hidden className={cn('grid size-10 place-items-center rounded-field', t.mark)}>
          <Mark size={20}/>
        </span>
        <Chevron aria-hidden className="mt-1 size-4 shrink-0 text-ink-3 transition-transform duration-150
          groupHoverOnly:translate-x-0.5"/>
      </span>
      <span className="mt-auto pt-3 font-display text-ui font-bold leading-tight text-ink">{label}</span>
      {hint && <span className="mt-0.5 text-fine leading-snug text-ink-3">{hint}</span>}
    </button>
  )
}

function AccountTiles({ me, go, role }) {
  return (
    <section aria-labelledby="set-account">
      <GroupHead id="set-account">Account and privacy</GroupHead>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
        {me && <Tile label="Password and sign-in" hint="Change it, sign out elsewhere" Mark={Key} hue="sun"
          onClick={() => go('account/passcode')}/>}
        <Tile label="Privacy and sharing" hint={SHARING_LABEL[role]} Mark={Grid} hue="lilac"
          onClick={() => go(SHARING_ROUTE[role])}/>
        <Tile label="Reminders" hint="When and how MindMap reminds you" Mark={Bell} hue="coral"
          onClick={() => go('app-notify')}/>
        {me && <Tile label="Your data" hint="Download a copy or delete" Mark={Download} hue="mint"
          onClick={() => go('account/data')}/>}
      </div>
    </section>
  )
}

// A radiogroup with one tab stop and arrow-key selection.
export function Segmented({ label, value, options, onChange, className }) {
  const refs = React.useRef([])
  const index = Math.max(0, options.findIndex(o => o.value === value))
  function onKey(e) {
    const last = options.length - 1
    let to = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = index === last ? 0 : index + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = index === 0 ? last : index - 1
    else if (e.key === 'Home') to = 0
    else if (e.key === 'End') to = last
    if (to == null) return
    e.preventDefault()
    onChange(options[to].value)
    refs.current[to]?.focus()
  }
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey}
      className={cn('flex rounded-field border border-ink-3 bg-mist p-1', className)}>
      {options.map((o, i) => {
        const on = i === index
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on}
            ref={el => { refs.current[i] = el }} tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn('min-h-[44px] min-w-0 flex-1 rounded-sm px-2 font-display text-fine transition-colors duration-150',
              on ? 'bg-card font-bold text-ink shadow-card ring-1 ring-ink-3'
                 : 'font-medium text-ink-2 hoverOnly:text-ink')}>
            {o.render || o.label}
          </button>
        )
      })}
    </div>
  )
}

const SIZE_LOOK = { default: 'text-[15px]', large: 'text-[18px]', larger: 'text-[21px]' }

function Appearance() {
  const a = useAppearance()
  const reduce = a.motion === 'reduce'
  return (
    <section aria-labelledby="set-appearance-h" id="set-appearance" className="scroll-mt-20">
      <GroupHead id="set-appearance-h">Appearance</GroupHead>
      <div className="mt-2.5 grid overflow-hidden rounded-panel border border-rule bg-card lg:grid-cols-2">
        <div className="p-4 lg:p-5">
          <p id="set-text-l" className="font-display text-ui font-bold text-ink">Text size</p>
          <Segmented label="Text size" value={a.text} onChange={text => setAppearance({ text })}
            className="mt-2.5"
            options={TEXT_SIZES.map(t => ({
              value: t.value, label: t.label,
              render: <span className="flex items-baseline justify-center gap-1.5">
                <span aria-hidden className={cn('font-bold leading-none', SIZE_LOOK[t.value])}>A</span>{t.label}
              </span>,
            }))}/>
          <p className="mt-2.5 text-fine text-ink-3">Changes every screen on this device.</p>
        </div>
        <div className="border-t border-rule p-4 lg:border-l lg:border-t-0 lg:p-5">
          <button type="button" role="switch" aria-checked={reduce}
            aria-describedby="set-motion-h"
            onClick={() => setAppearance({ motion: reduce ? MOTION[0].value : 'reduce' })}
            className="flex min-h-[56px] w-full items-center gap-3 rounded-field text-left">
            <span className="min-w-0 flex-1">
              <span className="block font-display text-ui font-bold text-ink">Reduce motion</span>
              <span id="set-motion-h" className="mt-0.5 block text-fine text-ink-3">Stills fades and slides on this device.</span>
            </span>
            <span aria-hidden className={cn('w-8 text-right font-display text-fine font-bold',
              reduce ? 'text-accent' : 'text-ink-3')}>{reduce ? 'On' : 'Off'}</span>
            <span aria-hidden className={cn('relative block h-7 w-[3.25rem] shrink-0 rounded-bar border transition-colors duration-150',
              reduce ? 'border-accent-ink bg-accent' : 'border-ruling bg-mist')}>
              <span className={cn('absolute left-[3px] top-[3px] block size-5 rounded-chip border bg-card transition-transform duration-150',
                reduce ? 'translate-x-[1.5rem] border-accent-ink' : 'translate-x-0 border-ink-3')}/>
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}

function AboutLine({ me, go }) {
  const where = backend() === 'remote' ? 'Saved to your MindMap account' : 'Kept on this device'
  const link = 'inline-flex min-h-[44px] items-center gap-1.5 font-display text-ui font-medium text-accent-ink ' +
    'underline decoration-rule underline-offset-4 transition-colors duration-150 hoverOnly:decoration-accent'
  return (
    <section aria-label="About" className="flex flex-col gap-3 border-t border-rule pt-4
      sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-fine text-ink-3">
          MindMap <span className="font-mono tabular-nums">{APP_VERSION}</span>. {where}.
        </p>
        <div className="flex flex-wrap gap-x-5">
          <button type="button" onClick={() => go('account/about')} className={link}>
            <Info aria-hidden className="size-4"/>About MindMap
          </button>
          <button type="button" onClick={() => go('help')} className={link}>
            <HelpMark size={16}/>Get help
          </button>
        </div>
      </div>
      {me && (
        <button type="button" onClick={() => { signOut(); go(homeFor(me.role)) }}
          className={cn(outline, 'self-start sm:self-auto')}>
          <Exit aria-hidden className="size-4"/>Sign out
        </button>
      )}
    </section>
  )
}

export function Settings({ me, go, className }) {
  const [mode] = useMode()
  const role = me?.role || 'student'
  return (
    <section aria-labelledby="settings-h" className={cn('min-w-0', className)}>
      <h2 id="settings-h" className="sr-only">Settings</h2>
      <div className="grid gap-7 lg:gap-8">
        <People me={me} go={go} demo={mode === 'demo'} role={role}/>
        <AccountTiles me={me} go={go} role={role}/>
        <Appearance/>
        <AboutLine me={me} go={go}/>
      </div>
    </section>
  )
}
