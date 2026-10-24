import React from 'react'
import { SectionShell } from './shell'
import { Panel, PanelHead, SeeDetails, Why } from './Monitor'
import { ArrowLeft, ArrowRight, Check, Chevron, Copy, Cross, Link, Plus } from '../ui/marks'
import { useMode } from '../lib/mode'
import { PRO } from '../lib/terms'
import {
  ROLE_LABEL, createInvite, getVersion as accountVersion, listNetwork, myInvite,
  subscribe as onAccount, useAccount,
} from '../account/store'
import { Avatar } from '../account/ui'
import { VIEWER } from '../account/viewer'
import { EVENT_KINDS, addEvent, eventsOn, getVersion, removeEvent, subscribe } from '../app/store'
import { WBAND, clock12 } from './reading/demo'
import { LampFace } from '../traffic/Face'
import { TEEN } from './student/demoTeen'
import { localDay } from './family/live.js'
import { cn } from '../lib/utils'

// Calendar route: a week or month of days, each read against the usual range, beside the reading network.
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

// Fallback range in live mode, before the reader has a usual week of their own.
const LO = WBAND.lo, HI = WBAND.hi

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DOW_2 = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const DOW_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Monday first, as the week series in src/lib/chartdata.js is keyed.
const mondayIndex = d => (d.getDay() + 6) % 7

const DEMO_PEOPLE = [
  { id: 'demo-student', name: 'Maya', role: 'student', avatar: 'char-maya' },
  { id: 'demo-parent',  name: 'Elena', role: 'parent',  avatar: 'char-elena' },
  { id: 'demo-pro',     name: 'Dr. Shah', role: 'pro',   avatar: 'char-shah' },
]

/* What each person on the network receives. */
const GETS = {
  student: 'Chooses what is shared',
  parent: 'Sees one figure a day',
  pro: 'Sees what the teen approves',
}

const ACTIONS = {
  student: [
    ['Join a network', `Open the link your parent or ${PRO} sends you.`],
  ],
  parent: [
    ['Invite your teen', 'Your teen approves it in their app.'],
    [`Add a ${PRO}`, 'Your teen approves what they see.'],
  ],
  pro: [
    ['Invite your teens and their parents', 'One link works for all of them. A parent approves each teen.'],
  ],
}

// The link carries the code, so a teen who opens it joins as soon as they sign in. The code is in the text too,
// for reading aloud.
const inviteText = code => {
  const at = typeof location === 'undefined' ? '' : `${location.origin}${location.pathname}#/network?code=${code}`
  return `Join my MindMap network: ${at} (code ${code})`
}

function InviteLink({ me, go }) {
  React.useSyncExternalStore(onAccount, accountVersion, () => 0)
  const [copied, setCopied] = React.useState(false)
  const inv = me ? myInvite(me.id) : null
  if (!me || me.role !== 'parent') {
    return (
      <button type="button" onClick={() => go('network')}
        className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-field border border-ink-2
          bg-card px-4 font-display text-ui font-medium text-ink transition-colors duration-150
          hoverOnly:bg-mist active:bg-mist">
        <Link aria-hidden className="size-4"/>Sign in to make a link
      </button>
    )
  }
  async function copy() {
    const code = (inv || createInvite() || {}).code
    if (!code) return
    try { await navigator.clipboard.writeText(inviteText(code)) } catch { /* shown below anyway */ }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="mt-2">
      <button type="button" onClick={copy}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-field bg-accent px-4
          font-display text-ui font-medium text-paper transition-colors duration-150
          hoverOnly:bg-accent-ink active:bg-accent-ink">
        {copied ? <Check aria-hidden className="size-4"/> : <Copy aria-hidden className="size-4"/>}
        {copied ? 'Copied' : 'Copy invite link'}
      </button>
      {inv && (
        <p className="mt-1.5 text-fine text-ink-2">
          Your code is <span className="font-display font-bold tracking-[0.14em] text-ink">{inv.code}</span>
        </p>
      )}
    </div>
  )
}

function NetworkCard({ go, reader, real, className }) {
  const me = useAccount()
  React.useSyncExternalStore(onAccount, accountVersion, () => 0)
  const role = reader || 'student'
  const people = real
    ? (me ? [{ ...me, you: true },
            ...listNetwork(me.id).filter(l => l.status === 'active').map(l => l.person)] : [])
    : DEMO_PEOPLE.map(p => (p.role === role ? { ...p, ...VIEWER[role], you: true } : p))
  const others = people.filter(p => !p.you)
  return (
    <Panel className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHead title="Your Network" className="min-w-0 flex-1"/>
        <Why label="How readings are shared" className="pt-1.5">
          A parent never sees Notes, Location or single readings. A {PRO} sees
          only teens who said yes.
        </Why>
      </div>
      <p className="mt-1.5 text-fine text-ink-2">
        Readings go only to people in this network, and only what the teen approves.
      </p>

      {others.length ? (
        <ul className="m-0 mt-3 list-none border-t border-ink p-0">
          {people.map(p => (
            <li key={p.id} className="flex min-h-[52px] items-center gap-3 border-b border-rule py-2">
              <Avatar name={p.name} avatar={p.avatar} size="sm"/>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-ui font-medium text-ink">
                  {p.name}{p.you ? ' (you)' : ''}</span>
                <span className="block text-fine text-ink-2">
                  {p.role ? ROLE_LABEL[p.role] : 'Removed'}{GETS[p.role] ? `. ${GETS[p.role]}` : ''}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 border-t border-ink pt-2.5 text-ui text-ink-2">
          Nobody is in your network yet.</p>
      )}

      <ul className="m-0 mt-3 list-none p-0">
        {ACTIONS[role].map(([label, hint], i) => (
          <li key={label} className="border-t border-rule py-1 first:border-t-0">
            <button type="button" onClick={() => go('network')}
              className="group flex min-h-[48px] w-full items-center gap-3 text-left">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-field
                bg-accent-wash text-accent-ink">
                <Plus className="size-4"/>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-ui font-medium text-ink transition-colors
                  duration-150 groupHoverOnly:text-accent-ink">{label}</span>
                <span className="block text-fine text-ink-2">{hint}</span>
              </span>
              <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
            </button>
            {role === 'parent' && i === 0 && (
              <div className="pb-2 pl-12">
                <InviteLink me={me} go={go}/>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export const FACE_WORD = Object.freeze({ green: 'Green', yellow: 'Yellow', red: 'Red' })
export const FACE_MEANS = Object.freeze({
  green: 'In the usual range',
  yellow: 'A little above usual',
  red: 'Well above usual',
})
const FACE_GROUND = {
  green: 'bg-accent-wash border-accent/40',
  yellow: 'bg-sun-wash border-sun/60',
  red: 'bg-coral-wash border-coral/60',
  none: 'bg-paper border-rule',
}

const utc = iso => new Date(iso + 'T12:00:00Z')
const isoOf = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`
const monthIndexUTC = iso => (utc(iso).getUTCDay() + 6) % 7
const shiftMonth = (key, n) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1, 12))
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`
}
export const longDay = iso => {
  const d = utc(iso)
  return `${DOW_LONG[(d.getUTCDay() + 6) % 7]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

// `days` is [{ date: 'YYYY-MM-DD', score, light }], oldest first; `today` is the last day that can be picked.
export function MonthCalendar({ days = [], today, selected, onSelect, legend = true, className }) {
  const byDate = React.useMemo(() => new Map(days.map(d => [d.date, d])), [days])
  const first = days.length ? days[0].date : today
  const [month, setMonth] = React.useState(() => (selected || today).slice(0, 7))
  React.useEffect(() => { if (selected) setMonth(selected.slice(0, 7)) }, [selected])
  const cellRefs = React.useRef({})

  const [y, m] = month.split('-').map(Number)
  const count = new Date(Date.UTC(y, m, 0, 12)).getUTCDate()
  const lead = monthIndexUTC(isoOf(y, m - 1, 1))
  const canPrev = month > first.slice(0, 7)
  const canNext = month < today.slice(0, 7)
  const dates = Array.from({ length: count }, (_, i) => isoOf(y, m - 1, i + 1))
  const pickable = iso => iso <= today && byDate.has(iso)
  // One tab stop for the grid: the picked day, else today, else the first pickable day.
  const stop = [selected, today].find(d => d && d.slice(0, 7) === month && pickable(d)) || dates.find(pickable)

  const move = (iso, n) => {
    const t = new Date(utc(iso).getTime() + n * 86400000).toISOString().slice(0, 10)
    if (!pickable(t)) return
    if (t.slice(0, 7) !== month) setMonth(t.slice(0, 7))
    onSelect?.(t)
    requestAnimationFrame(() => cellRefs.current[t]?.focus())
  }
  const key = (e, iso) => {
    const n = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
    if (n) { e.preventDefault(); move(iso, n) }
  }
  const navBtn = 'grid size-11 place-items-center rounded-field border border-rule bg-card text-ink transition-colors ' +
    'duration-150 hoverOnly:bg-aqua disabled:cursor-not-allowed disabled:text-ink-3 disabled:opacity-60 ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <button type="button" className={navBtn} aria-label="Previous month" disabled={!canPrev}
          onClick={() => setMonth(k => shiftMonth(k, -1))}><ArrowLeft aria-hidden className="size-4"/></button>
        <p aria-live="polite" className="m-0 font-display text-ui font-bold text-ink">{MONTHS[m - 1]} {y}</p>
        <button type="button" className={navBtn} aria-label="Next month" disabled={!canNext}
          onClick={() => setMonth(k => shiftMonth(k, 1))}><ArrowRight aria-hidden className="size-4"/></button>
      </div>
      <div aria-hidden className="mt-3 grid grid-cols-7 gap-1 sm:gap-1.5">
        {DOW_2.map(d => <span key={d} className="py-1 text-center text-fine text-ink-2">{d}</span>)}
      </div>
      <ul className="m-0 mt-0.5 grid list-none grid-cols-7 gap-1 p-0 sm:gap-1.5" aria-label={`${MONTHS[m - 1]} ${y}`}>
        {Array.from({ length: lead }, (_, i) => <li key={'p' + i} aria-hidden/>)}
        {dates.map(iso => {
          const rec = byDate.get(iso)
          const ok = pickable(iso)
          const on = iso === selected
          const isToday = iso === today
          const light = rec?.light || null
          const score = rec?.score ?? null
          const n = Number(iso.slice(8))
          const label = `${longDay(iso)}${isToday ? ', today' : ''}: ` + (!ok ? 'no record'
            : score == null ? 'no reading' : `${light ? FACE_WORD[light] + ', ' : ''}Mind Score ${score}`)
          return (
            <li key={iso} className="min-w-0">
              <button type="button" ref={el => (cellRefs.current[iso] = el)} disabled={!ok} aria-pressed={on}
                aria-label={label} tabIndex={iso === stop ? 0 : -1}
                onClick={() => onSelect?.(iso)} onKeyDown={e => key(e, iso)}
                className={cn('flex h-[72px] w-full flex-col items-center justify-center gap-1 rounded-field border px-0.5',
                  'transition-[box-shadow,transform] duration-150 motion-reduce:transition-none sm:h-[84px]',
                  ok ? FACE_GROUND[score == null ? 'none' : light || 'none'] : 'border-transparent bg-transparent',
                  ok && 'hoverOnly:-translate-y-px hoverOnly:shadow-card',
                  on && 'ring-2 ring-ink ring-offset-2 ring-offset-card',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  'disabled:cursor-default')}>
                <span aria-hidden className={cn('relative text-[13px] leading-none tabular-nums',
                  isToday ? 'font-bold text-ink' : ok ? 'text-ink-2' : 'text-ink-3')}>
                  {n}
                  {isToday && <span className="absolute -bottom-[4px] left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-bar bg-ink"/>}
                </span>
                {ok && light && score != null ? (
                  <LampFace light={light} size={28} className="h-[22px] w-[22px] sm:h-7 sm:w-7"/>
                ) : (
                  <span aria-hidden className="grid h-[22px] place-items-center sm:h-7">
                    {ok && <span className="size-2.5 rounded-full border-2 border-ink-3"/>}</span>
                )}
                <span aria-hidden className="text-fine font-bold leading-none tabular-nums text-ink">
                  {ok && score != null ? score : ' '}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {legend && <CalendarLegend className="mt-4"/>}
    </div>
  )
}

/* What the faces, the grounds and the marks in the grid mean. */
export function CalendarLegend({ className }) {
  return (
    <div className={cn('border-t border-rule pt-3', className)}>
      <p className="m-0 text-fine font-semibold text-ink-2">Key</p>
      <ul className="m-0 mt-2 grid list-none grid-cols-1 gap-x-5 gap-y-2 p-0 sm:grid-cols-2">
        {['green', 'yellow', 'red'].map(l => (
          <li key={l} className="flex items-center gap-2.5">
            <span aria-hidden className={cn('grid size-8 shrink-0 place-items-center rounded-field border', FACE_GROUND[l])}>
              <LampFace light={l} size={20}/></span>
            <span className="text-fine text-ink-2"><b className="font-display font-bold text-ink">{FACE_WORD[l]}</b>
              {' '}{FACE_MEANS[l]}</span>
          </li>
        ))}
        <li className="flex items-center gap-2.5">
          <span aria-hidden className={cn('grid size-8 shrink-0 place-items-center rounded-field border', FACE_GROUND.none)}>
            <span className="size-2.5 rounded-full border-2 border-ink-3"/></span>
          <span className="text-fine text-ink-2">No reading that day</span>
        </li>
        <li className="flex items-center gap-2.5">
          <span aria-hidden className="relative grid size-8 shrink-0 place-items-center text-[13px] font-bold text-ink">
            16<span className="absolute bottom-[5px] left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-bar bg-ink"/></span>
          <span className="text-fine text-ink-2">Today</span>
        </li>
        <li className="flex items-center gap-2.5">
          <span aria-hidden className="size-8 shrink-0 rounded-field border border-rule bg-card ring-2 ring-ink ring-offset-2 ring-offset-card"/>
          <span className="text-fine text-ink-2">The day you picked, shown below</span>
        </li>
      </ul>
      <p className="m-0 mt-2.5 text-fine text-ink-3">The figure in each square is that day’s Mind Score, 0 calm to 100 peak.</p>
    </div>
  )
}

function WeekRows({ days, lo, hi, selected, onSelect }) {
  return (
    <ul className="m-0 list-none border-t border-ink p-0">
      {days.map(d => {
        const on = d.date === selected
        return (
          <li key={d.date} className="border-b border-rule">
            <button type="button" aria-pressed={on} onClick={() => onSelect(d.date)}
              aria-label={`${longDay(d.date)}: ${d.score == null ? 'no reading'
                : `${d.light ? FACE_WORD[d.light] + ', ' : ''}Mind Score ${d.score}`}`}
              className={cn('flex min-h-[52px] w-full items-center gap-3 rounded-field px-1.5 text-left transition-colors',
                'duration-150 hoverOnly:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                on && 'bg-mist')}>
              <span className={cn('w-[4ch] shrink-0 font-display text-ui text-ink', on ? 'font-bold' : 'font-medium')}>
                {DOW[monthIndexUTC(d.date)]}</span>
              {d.light && d.score != null ? <LampFace light={d.light} size={24}/>
                : <span aria-hidden className="grid size-6 place-items-center">
                    <span className="size-2.5 rounded-full border-2 border-ink-3"/></span>}
              <span className="w-[3ch] shrink-0 text-ui font-bold tabular-nums text-ink">{d.score ?? '·'}</span>
              <span aria-hidden className="relative h-2 min-w-0 flex-1 rounded-xs bg-mist">
                <span className="absolute inset-y-0 rounded-xs bg-accent/25"
                  style={{ left: `${lo}%`, width: `${Math.max(1, hi - lo)}%` }}/>
                {d.score != null && (
                  <span className={cn('absolute -top-1 h-4 w-[4px] -translate-x-1/2 rounded-bar',
                    d.light === 'red' ? 'bg-crit' : d.light === 'yellow' ? 'bg-sun' : 'bg-accent')}
                    style={{ left: `${Math.max(1, Math.min(99, d.score))}%` }}/>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

const READ_SOURCE = { patch: 'Patch', camera: 'Phone camera', survey: 'Survey' }
function CalendarDay({ d, usual }) {
  if (!d) return null
  const counts = (d.readings || []).reduce((a, r) => ({ ...a, [r.source]: (a[r.source] || 0) + 1 }), {})
  return (
    <section aria-live="polite" className="mt-4 rounded-panel border border-rule bg-paper p-4">
      <h3 className="m-0 font-display text-ui font-bold text-ink">{longDay(d.date)}</h3>
      {d.score == null ? (
        <p className="m-0 mt-2 text-ui text-ink-2">No reading on this day.</p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            {d.light && <LampFace light={d.light} size={40}/>}
            <div>
              <p className="m-0 font-display text-row font-bold leading-tight text-ink">
                {d.light ? FACE_WORD[d.light] : `Mind Score ${d.score}`}</p>
              <p className="m-0 text-fine text-ink-2">{d.light ? FACE_MEANS[d.light] : ''}</p>
            </div>
            <p className="m-0 ml-auto text-right">
              <span className="block font-display text-stat font-bold tabular-nums leading-none text-ink">{d.score}</span>
              <span className="block text-fine text-ink-2">Mind Score</span></p>
          </div>
          {usual && <p className="m-0 mt-2 text-fine text-ink-2">Usual range {usual.lo} to {usual.hi}.</p>}
          {Object.keys(counts).length > 0 && (
            <dl className="m-0 mt-3 border-t border-rule p-0">
              {Object.entries(counts).map(([k, n]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-rule py-2">
                  <dt className="text-fine text-ink-2">{READ_SOURCE[k]}</dt>
                  <dd className="m-0 font-display text-ui font-bold tabular-nums text-ink">
                    {n} {n === 1 ? 'reading' : 'readings'}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </section>
  )
}

// src/signals/recovery.js works out the stress before each marked event and the recovery time after it.
const KIND_WORD = { test: 'Test', talk: 'Presentation', game: 'Game', other: 'Other' }
const pad2 = n => String(n).padStart(2, '0')
const dayKey = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const hhmm = m => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`
const clock = m => clock12(hhmm(m))
const toMinute = t => {
  const [h, m] = String(t).split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}

const FIELD = cn('min-h-[44px] w-full rounded-field border border-rule bg-card px-3 font-body',
  'text-ui text-ink placeholder:text-ink-3 transition-colors duration-150 focus:border-ink')

function MarkEvent({ className }) {
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const [day, setDay] = React.useState(() => dayKey(new Date()))
  const [time, setTime] = React.useState('09:00')
  const [label, setLabel] = React.useState('')
  const [kind, setKind] = React.useState('test')
  const minute = toMinute(time)
  const ready = label.trim().length > 0 && minute != null && DAY_RE.test(day)
  const marks = DAY_RE.test(day) ? eventsOn(day) : []
  const dayWords = React.useMemo(() => {
    if (!DAY_RE.test(day)) return ''
    const [y, m, d] = day.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return `${DOW[mondayIndex(dt)]} ${d} ${MONTHS[m - 1]}`
  }, [day])

  const add = e => {
    e.preventDefault()
    if (!ready) return
    addEvent({ day, minute, label: label.trim(), kind })
    setLabel('')
  }

  return (
    <Panel className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHead title="Mark an Event" meta={dayWords} className="min-w-0 flex-1"/>
        <Why label="What a mark is for" className="pt-1.5">
          The patch reads the two hours before the event. Then how long you took to settle.
        </Why>
      </div>
      <form onSubmit={add} className="mt-3 grid gap-2.5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[minmax(0,1fr)_9.5rem_9.5rem]">
          <label className="col-span-2 block min-w-0 sm:col-span-1">
            <span className="tick">Event</span>
            <input type="text" value={label} maxLength={40} placeholder="Maths test…"
              onChange={e => setLabel(e.target.value)} className={cn(FIELD, 'mt-1')}/>
          </label>
          <label className="block min-w-0">
            <span className="tick">Day</span>
            <input type="date" value={day} onChange={e => setDay(e.target.value)}
              className={cn(FIELD, 'mt-1 tabular-nums')}/>
          </label>
          <label className="block min-w-0">
            <span className="tick">Time</span>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className={cn(FIELD, 'mt-1 tabular-nums')}/>
          </label>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-end">
          <div role="group" aria-label="Kind of event" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EVENT_KINDS.map(k => {
              const on = kind === k
              return (
                <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={on}
                  className={cn('flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-field',
                    'border px-2 font-display text-ui font-medium transition-colors duration-150',
                    on ? 'border-accent bg-accent-wash font-bold text-accent-ink' : 'border-rule bg-card text-ink hoverOnly:bg-aqua')}>
                  {on && <Check aria-hidden className="size-4 shrink-0"/>}
                  <span className="truncate">{KIND_WORD[k]}</span>
                </button>
              )
            })}
          </div>
          <button type="submit" disabled={!ready}
            className={cn('flex min-h-[44px] items-center justify-center gap-2 rounded-field border',
              'font-display text-ui font-semibold transition-colors duration-150',
              ready ? 'border-accent-ink bg-accent text-paper hoverOnly:bg-accent-ink'
                    : 'border-rule bg-mist text-ink-3')}>
            <Plus aria-hidden className="size-4"/>Add
          </button>
        </div>
      </form>
      {marks.length > 0 && (
        <ul className="m-0 mt-3 list-none border-t border-ink p-0">
          {marks.map(ev => (
            <li key={ev.id} className="flex items-center gap-3 border-b border-rule py-1.5">
              <span className="w-[7ch] shrink-0 text-ui tabular-nums text-ink">{clock(ev.minute)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-ui font-medium text-ink">{ev.label}</span>
                <span className="block text-fine text-ink-2">{KIND_WORD[ev.kind] || 'Other'}</span>
              </span>
              <button type="button" onClick={() => removeEvent(ev.id)}
                aria-label={`Remove ${ev.label}`}
                className="flex size-11 shrink-0 items-center justify-center rounded-field
                  text-ink-2 transition-colors duration-150 hoverOnly:bg-mist hoverOnly:text-ink">
                <Cross aria-hidden className="size-4"/>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="note mt-2.5">Only you see your events.</p>
    </Panel>
  )
}

function useCalendarDays(real) {
  return React.useMemo(() => {
    if (!real) return { days: TEEN.days, today: TEEN.days[TEEN.days.length - 1].date, usual: TEEN.usual }
    const today = localDay(Date.now())
    const n = Number(today.slice(8))
    const days = Array.from({ length: n }, (_, i) => ({ date: `${today.slice(0, 8)}${pad2(i + 1)}`, score: null, light: null }))
    return { days, today, usual: null }
  }, [real])
}

export function CalendarBody({ go, who }) {
  const [mode] = useMode()
  const me = useAccount()
  const reader = who || (me && me.role) || null
  const canMark = !reader || reader === 'student'
  const [view, setView] = React.useState('month')
  const real = mode === 'real'
  const { days, today, usual } = useCalendarDays(real)
  const [picked, setPicked] = React.useState(today)
  React.useEffect(() => setPicked(today), [today])
  const pickedDay = days.find(d => d.date === picked)
  const week = days.slice(-7)
  const lo = usual ? usual.lo : LO, hi = usual ? usual.hi : HI

  return (
    <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
      <Panel className="lg:self-start">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <PanelHead title="Calendar" className="min-w-0"/>
          <div role="group" aria-label="Week or month"
            className="inline-flex overflow-hidden rounded-field border border-rule">
            {[['week', 'Week'], ['month', 'Month']].map(([v, label]) => (
              <button key={v} type="button" onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn('min-h-[44px] px-4 font-display text-ui font-medium',
                  'transition-colors duration-150',
                  view === v ? 'bg-accent-wash font-bold text-accent-ink shadow-[inset_0_-2px_0_#157446]' : 'bg-card text-ink hoverOnly:bg-aqua')}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="m-0 mt-1.5 text-fine text-ink-2">
          {real ? 'Your readings show here as they arrive. Pick a day to see it.'
            : 'Each day shows its Heads Up face and Mind Score. Pick a day to see it.'}</p>

        <div className="mt-3">
          {view === 'month'
            ? <MonthCalendar days={days} today={today} selected={picked} onSelect={setPicked}/>
            : <>
                <WeekRows days={week} lo={lo} hi={hi} selected={picked} onSelect={setPicked}/>
                <p className="note mt-2.5">The shaded stretch is the usual range.</p>
                <CalendarLegend className="mt-3"/>
              </>}
        </div>
        <CalendarDay d={pickedDay} usual={usual}/>
      </Panel>

      <NetworkCard go={go} reader={reader} real={real}
        className="lg:self-start"/>

      {canMark && (
        <SeeDetails label="See details" className="lg:col-span-2">
          <MarkEvent/>
        </SeeDetails>
      )}
    </div>
  )
}

export function Calendar({ go, who }) {
  return (
    <SectionShell go={go}>
      <CalendarBody go={go} who={who}/>
    </SectionShell>
  )
}

export default Calendar
