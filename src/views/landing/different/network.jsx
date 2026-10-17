import React from 'react'
import { AvatarArt } from '../../../account/avatars'
import { DEMO_LINKS, DEMO_TEEN } from '../../../account/demo-network'
import { SHARING } from '../../../app/store'
import { PRO } from '../../../lib/terms'
import { Check, Cross } from '../../../ui/marks'
import { cn } from '../../../lib/utils'
import { Demo, DemoTag, useSteps, useWidth } from './kit'

/* Network: the teen in the middle. Her parent and a Medical Professional
 * each make a network and send her its link; she joins and chooses what
 * each of them sees. Teens never make a network. Names, avatars and what each person
 * may see come from account/demo-network.js and the SHARING table in
 * app/store.js, so this cannot say a parent sees more than the app lets them. */

const PARENT = DEMO_LINKS.find(l => l.person.role === 'parent')
const DOC = DEMO_LINKS.find(l => l.person.role === 'pro' && l.status === 'active')
const WAITING = DEMO_LINKS.find(l => l.status === 'pending')

/* "my Mind Score for each day" to "Her Mind Score for each day". */
const third = s => {
  const t = s.replace(/\bmy\b/g, 'her').replace(/\bI\b/g, 'she')
  return t.charAt(0).toUpperCase() + t.slice(1)
}
const sees = (audience, keys) =>
  keys.map(k => SHARING[audience].fields.find(f => f.key === k)).filter(Boolean).map(f => third(f.short))

const PARENT_SEES = sees('parent', PARENT.shares)
const PARENT_NEVER = ['Notes', 'Location', 'Readings finer than a day']
const DOC_SEES = sees('pro', DOC.shares)

/* Steps: 0 Elena sends her link, 1 Maya joins, 2 Maya picks what Elena
   sees, 3 Dr. Shah sends his link and Maya joins, 4 a parent approves,
   5 all linked. */
const HOLDS = [1500, 1300, 1500, 1300, 1700, 4200]

function Person({ p, role, children, on }) {
  return (
    <div className={cn('flex min-w-0 flex-col rounded-[12px] border bg-card p-3 transition-colors duration-300',
      on ? 'border-accent' : 'border-rule')}>
      <div className="flex items-center gap-2.5">
        {p.avatar ? <AvatarArt id={p.avatar} className="size-10"/> : (
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-chip bg-mist font-display text-ui font-bold text-ink">
            {p.name[0]}</span>
        )}
        <span className="min-w-0">
          <span className="block font-display text-ui font-bold leading-tight text-ink">{p.name}</span>
          <span className="block text-fine leading-tight text-ink-2">{role}</span>
        </span>
      </div>
      <div className="mt-2.5 min-w-0">{children}</div>
    </div>
  )
}

function List({ items, never = false, show = true }) {
  return (
    <ul className={cn('mm-dd-fade m-0 flex list-none flex-col gap-1 p-0', show ? 'opacity-100' : 'opacity-0')}>
      {items.map(t => (
        <li key={t} className="flex items-start gap-1.5 text-fine leading-snug text-ink">
          {never
            ? <Cross aria-hidden size={14} className="mt-[3px] shrink-0 text-ink-3"/>
            : <Check aria-hidden size={14} className="mt-[3px] shrink-0 text-accent"/>}
          <span className={never ? 'text-ink-2' : ''}>{t}</span>
        </li>
      ))}
    </ul>
  )
}

/* The line between two people, with what is happening on it. */
function Link({ wide, state, words }) {
  const live = state === 'moving'
  const done = state === 'done'
  return (
    <div aria-hidden className={cn('flex shrink-0 items-center justify-center',
      wide ? 'w-[92px] flex-col self-center' : 'h-[64px] flex-row gap-3 pl-5')}>
      <svg width={wide ? 92 : 12} height={wide ? 12 : 40} className="block shrink-0 overflow-visible">
        {wide
          ? <path d="M4 6H88" stroke={done ? '#157446' : '#93b2a1'} strokeWidth="2.4" strokeLinecap="round"
              className={live ? 'mm-dd-flow' : ''}/>
          : <path d="M6 2V38" stroke={done ? '#157446' : '#93b2a1'} strokeWidth="2.4" strokeLinecap="round"
              className={live ? 'mm-dd-flow' : ''}/>}
      </svg>
      <span className={cn('text-[13px] font-semibold leading-tight',
        wide ? 'mt-1.5 text-center' : 'text-left', done ? 'text-accent-ink' : 'text-ink-2')}>{words}</span>
    </div>
  )
}

export default function NetworkDemo() {
  const [ref, w] = useWidth()
  const wide = w >= 640
  const { step } = useSteps(ref, HOLDS)

  const parentLink = step === 0 ? ['moving', `${PARENT.person.name} sends her link`]
    : step === 1 ? ['moving', `${DEMO_TEEN.name} joins`] : ['done', `${DEMO_TEEN.name} chose what she sees`]
  const docLink = step < 3 ? ['idle', 'Not linked'] : step === 3 ? ['moving', `Link sent, ${DEMO_TEEN.name} joins`]
    : ['done', step === 4 ? 'A parent gives the OK' : 'Linked']

  const label = `The network, with demo people. ${DEMO_TEEN.name}, a teen, is in the middle. ${PARENT.person.name}, her
    parent, makes a network and sends her its link; ${DEMO_TEEN.name} opens it, joins, and chooses what her parent sees.
    ${DOC.person.name}, a ${PRO}, sends a link the same way; ${DEMO_TEEN.name} joins and a parent gives an OK.
    Teens never make a network. Each person sees only what
    ${DEMO_TEEN.name} shares. ${PARENT.person.name} sees: ${PARENT_SEES.join(', ')}; never ${PARENT_NEVER.join(', ')}.
    ${DOC.person.name} sees: ${DOC_SEES.join(', ')}, and only for teens who said yes. ${WAITING.person.name} is
    still waiting for ${DEMO_TEEN.name} to approve.`

  const parent = (
    <Person p={PARENT.person} role="Parent" on={step >= 2}>
      <p className="m-0 mb-1 text-fine font-semibold text-ink-2">Sees</p>
      {step >= 2 ? <List items={PARENT_SEES} show/>
        : <p className="m-0 text-fine text-ink-2">Nothing until {DEMO_TEEN.name} approves.</p>}
      <p className="m-0 mb-1 mt-2 text-fine font-semibold text-ink-2">Never sees</p>
      <List items={PARENT_NEVER} never/>
    </Person>
  )
  const teen = (
    <Person p={DEMO_TEEN} role="Teen" on>
      <div className="rounded-[8px] bg-mist/70 px-2.5 py-2">
        <p className="m-0 text-fine font-semibold text-ink">Joined by link</p>
        <p className="m-0 text-fine text-ink-2">Opened {PARENT.person.name}’s, code <span className="font-code text-ink">K7Q2MX</span></p>
      </div>
      <p className="m-0 mt-2 text-fine leading-snug text-ink">Joins networks, never makes one.</p>
      <p className="m-0 text-fine leading-snug text-ink">Chooses what each person sees.</p>
      <p className="m-0 text-fine leading-snug text-ink">Can switch any of it off.</p>
    </Person>
  )
  const doc = (
    <Person p={DOC.person} role={`${PRO}, ${DOC.person.setting.toLowerCase()}`} on={step >= 4}>
      <p className="m-0 mb-1 text-fine font-semibold text-ink-2">Sees</p>
      {step >= 4 ? <List items={DOC_SEES} show/>
        : <p className="m-0 text-fine text-ink-2">Nothing until {DEMO_TEEN.name} approves.</p>}
      <p className="m-0 mt-2 text-fine leading-snug text-ink-2">Only teens who said yes. Groups under five show nothing.</p>
    </Person>
  )

  return (
    <Demo innerRef={ref} label={label}>
      <div className={cn('flex', wide ? 'flex-row items-stretch' : 'flex-col')}>
        <div className={wide ? 'min-w-0 flex-1' : ''}>{parent}</div>
        <Link wide={wide} state={parentLink[0]} words={parentLink[1]}/>
        <div className={wide ? 'min-w-0 flex-1' : ''}>{teen}</div>
        <Link wide={wide} state={docLink[0]} words={docLink[1]}/>
        <div className={wide ? 'min-w-0 flex-1' : ''}>{doc}</div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="m-0 flex items-center gap-2 text-fine text-ink-2">
          <span aria-hidden className="mm-dd-blink size-2 shrink-0 rounded-chip bg-sun"/>
          {WAITING.person.name}, {WAITING.person.setting.toLowerCase()}: waiting for {DEMO_TEEN.name}.
        </p>
        <DemoTag/>
      </div>
    </Demo>
  )
}
