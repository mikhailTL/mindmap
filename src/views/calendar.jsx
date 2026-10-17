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
import { EVENT_KINDS, addEvent, eventsOn, getVersion, removeEvent, subscribe } from '../app/store'
import { WBAND, clock12, monthScores } from './reading/demo'
import { cn } from '../lib/utils'

/* The calendar: route id `calendar`, design spec 0d section 6 and 0e section
 * 18. A week and a month on one switch, each day read against the usual
 * range, beside the network the readings travel through.
 * Every figure comes from src/views/reading/demo.js, seeded; in real mode
 * there are no readings and every square shows the no reading dot. Colour
 * never carries a state alone: every square prints its figure. */

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

/* The usual range is the reader's own usual week, so the tolerance is
   theirs and nobody sets it. */
const LO = WBAND.lo, HI = WBAND.hi

const stateOf = (v, lo, hi) => (v == null ? 'none' : v > hi ? 'above' : v < lo ? 'below' : 'inside')
/* `ground` is a pale square ground; `mark` the same state as a filled graphic
   that clears 3 : 1 on card and on mist. */
const STATE = {
  inside: { word: 'inside', ground: 'bg-accent-wash border-accent/30', mark: 'bg-accent border-accent' },
  above:  { word: 'above',  ground: 'bg-warn-wash border-warn/40',    mark: 'bg-warn border-warn' },
  below:  { word: 'below',  ground: 'bg-beam-wash border-beam/30',    mark: 'bg-beam border-beam' },
  none:   { word: 'no reading', ground: 'bg-paper border-rule',       mark: 'bg-mist border-rule' },
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DOW_2 = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const DOW_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/* Monday first, as the week series in src/lib/chartdata.js is keyed. */
const mondayIndex = d => (d.getDay() + 6) % 7

/* ── The network ────────────────────────────────────────────────────────── */

/* Readings move between the three apps only along these links, and only what
   the teen has switched on. The links themselves are made and approved on the
   network screen (src/account/Network.jsx); this card shows who is on them
   and starts the invite. */

/* The demo network: the student, a parent and a Medical Professional. */
const DEMO_PEOPLE = [
  { id: 'demo-student', name: 'Maya', role: 'student', avatar: 'fox' },
  { id: 'demo-parent',  name: 'Elena', role: 'parent',  avatar: null },
  { id: 'demo-pro',     name: 'Dr. Shah', role: 'pro',   avatar: null },
]

/* What each person on the network receives. */
const GETS = {
  student: 'Chooses what is shared',
  parent: 'Sees one figure a day',
  pro: 'Sees what the teen approves',
}

/* The ways in, by who is reading. Every one opens the network screen. */
const ACTIONS = {
  student: [
    ['Join a network', `Open the link your parent or ${PRO} sends you.`],
  ],
  parent: [
    ['Invite your teen', 'Your teen approves it in their app.'],
    [`Add a ${PRO}`, 'Your teen approves what they see.'],
  ],
  pro: [
    ['Invite your students and their parents', 'One link works for all of them. A parent approves each student.'],
  ],
}

/* The link a parent sends carries the code, so opening it is all a teen
   does: they sign in or make an account and join at once. The code is in
   the message as well, for reading out loud. */
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
  /* Demo: the worked network. Real: you, then whoever you have linked. */
  const people = real
    ? (me ? [{ ...me, you: true },
            ...listNetwork(me.id).filter(l => l.status === 'active').map(l => l.person)] : [])
    : DEMO_PEOPLE.map(p => ({ ...p, you: p.role === role }))
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

/* ── The month ──────────────────────────────────────────────────────────── */

function MonthGrid({ year, month, values, today, lo, hi }) {
  const pad = mondayIndex(new Date(year, month, 1))
  const cells = [...Array(pad).fill(null), ...values.map((v, i) => ({ v, day: i + 1 }))]
  return (
    <figure className="m-0">
      <div aria-hidden className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {DOW_2.map(d => (
          <span key={d} className="py-1 text-center text-fine text-ink-3">{d}</span>
        ))}
      </div>
      <ul className="m-0 mt-0.5 grid list-none grid-cols-7 gap-1 p-0 sm:gap-1.5">
        {cells.map((c, i) => {
          if (!c) return <li key={`pad${i}`} aria-hidden/>
          const st = STATE[stateOf(c.v, lo, hi)]
          const isToday = c.day === today
          const dow = DOW_LONG[mondayIndex(new Date(year, month, c.day))]
          return (
            <li key={c.day} className="min-w-0">
              <div role="img" aria-label={c.v == null
                ? `${dow} ${c.day} ${MONTHS[month]}, no reading yet`
                : `${dow} ${c.day} ${MONTHS[month]}, ${c.v} out of 100, ${st.word} the usual range`}
                className={cn('flex aspect-square flex-col items-center justify-center rounded-field',
                  'border px-0.5', st.ground, isToday && 'ring-1 ring-ink ring-offset-0')}>
                <span aria-hidden className="text-fine leading-none text-ink-3">{c.day}</span>
                <span aria-hidden className={cn('mt-0.5 text-ui font-medium tabular-nums leading-none',
                  c.v == null ? 'text-ink-3' : 'text-ink')}>
                  {c.v == null ? '·' : c.v}</span>
              </div>
            </li>
          )
        })}
      </ul>
      <figcaption className="note mt-2.5">A dot means no reading. The ring marks today.</figcaption>
    </figure>
  )
}

function StateKey() {
  const rows = [
    ['Inside', STATE.inside.ground],
    ['Above', STATE.above.ground],
    ['Below', STATE.below.ground],
  ]
  return (
    <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-5 gap-y-1.5 border-t border-rule
      pt-2.5 p-0">
      {rows.map(([label, ground]) => (
        <li key={label} className="flex min-w-0 items-center gap-2">
          <span aria-hidden className={cn('size-4 shrink-0 rounded-xs border', ground)}/>
          <span className="min-w-0 text-fine text-ink-2">{label}</span>
        </li>
      ))}
    </ul>
  )
}

/* ── The week ───────────────────────────────────────────────────────────── */

/* Seven rows: a 45px column cannot carry day, figure, word and position. */
function WeekRows({ days, lo, hi }) {
  return (
    <ul className="m-0 list-none border-t border-ink p-0">
      {days.map(d => {
        const st = STATE[stateOf(d.v, lo, hi)]
        return (
          <li key={d.label} className="border-b border-rule py-2">
            <div className="flex items-center gap-3">
              <span className={cn('w-[4ch] shrink-0 font-display text-ui text-ink',
                d.today ? 'font-semibold' : 'font-medium')}>{d.label}</span>
              <span className="w-[3ch] shrink-0 text-ui tabular-nums text-ink">
                {d.v == null ? '·' : d.v}</span>
              <span aria-hidden className="relative h-2 min-w-0 flex-1 rounded-xs bg-mist">
                <span className="absolute inset-y-0 rounded-xs bg-ink-3/30"
                  style={{ left: `${lo}%`, width: `${Math.max(1, hi - lo)}%` }}/>
                {d.v != null && (
                  <span className={cn('absolute -top-1 h-4 w-[4px] -translate-x-1/2 rounded-bar border',
                    st.mark)} style={{ left: `${Math.max(1, Math.min(99, d.v))}%` }}/>
                )}
              </span>
              <span className="w-[5ch] shrink-0 text-right text-fine text-ink-2">
                {d.v == null ? 'none' : st.word}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ── Mark an event ──────────────────────────────────────────────────────── */

/* A day, a time and a word; src/signals/recovery.js works out the stress before events and
   the recovery time around it. Marks live in the device store and never leave
   the phone. */
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
                    on ? 'border-ink bg-ink text-paper' : 'border-rule bg-card text-ink hoverOnly:bg-aqua')}>
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
      <p className="note mt-2.5">Events stay on this phone and are never shared.</p>
    </Panel>
  )
}

/* ── The screen ─────────────────────────────────────────────────────────── */

export function CalendarBody({ go, who }) {
  const [mode] = useMode()
  /* Marks are the student's own (spec 0g), so only a student, or a reader
     whose app is not known, gets the form. */
  const me = useAccount()
  const reader = who || (me && me.role) || null
  const canMark = !reader || reader === 'student'
  const [view, setView] = React.useState('month')
  const now = React.useMemo(() => new Date(), [])
  const [offset, setOffset] = React.useState(0)
  const lo = LO, hi = HI

  const shown = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const year = shown.getFullYear(), month = shown.getMonth()
  const thisMonth = offset === 0
  const today = thisMonth ? now.getDate() : null
  const real = mode === 'real'

  /* Real mode has no readings: the month is all dots up to today. */
  const monthVals = React.useMemo(() => {
    if (!real) return monthScores(year, month, thisMonth ? now.getDate() : null)
    const n = thisMonth ? now.getDate() : new Date(year, month + 1, 0).getDate()
    return Array(n).fill(null)
  }, [real, year, month, thisMonth, now])

  /* The week is the seven days ending on the newest scored day in the month
     shown, so the week and the month cannot disagree. With no scored day it
     ends on the last day shown. */
  const weekDays = React.useMemo(() => {
    const scored = monthVals.reduce((a, v, i) => (v != null ? i : a), -1)
    const end = scored >= 0 ? scored : monthVals.length - 1
    if (end < 0) return []
    const out = []
    for (let i = Math.max(0, end - 6); i <= end; i += 1) {
      const d = new Date(year, month, i + 1)
      out.push({ label: DOW[mondayIndex(d)], v: monthVals[i],
                 today: today != null && i + 1 === today })
    }
    return out
  }, [monthVals, year, month, today])

  return (
    <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
      <Panel className="lg:self-start">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div role="group" aria-label="Week or month"
            className="inline-flex overflow-hidden rounded-field border border-rule">
            {[['week', 'Week'], ['month', 'Month']].map(([v, label]) => (
              <button key={v} type="button" onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn('min-h-[44px] px-4 font-display text-ui font-medium',
                  'transition-colors duration-150',
                  view === v ? 'bg-ink text-paper' : 'bg-card text-ink hoverOnly:bg-aqua')}>
                {label}
              </button>
            ))}
          </div>
          {view === 'month' && (
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setOffset(o => o - 1)}
                aria-label="Previous month"
                className="flex size-11 items-center justify-center rounded-field border
                  border-rule text-ink transition-colors duration-150 hoverOnly:bg-aqua">
                <ArrowLeft aria-hidden className="size-4"/>
              </button>
              <p className="min-w-[9ch] text-center font-display text-ui font-medium text-ink">
                {MONTHS[month]} {year}</p>
              <button type="button" onClick={() => setOffset(o => Math.min(0, o + 1))}
                disabled={thisMonth} aria-label="Next month"
                className="flex size-11 items-center justify-center rounded-field border
                  border-rule text-ink transition-colors duration-150 hoverOnly:bg-aqua
                  disabled:border-rule disabled:text-ink-3">
                <ArrowRight aria-hidden className="size-4"/>
              </button>
            </div>
          )}
        </div>

        <div className="mt-3">
          {view === 'month'
            ? <MonthGrid year={year} month={month} values={monthVals} today={today}
                lo={lo} hi={hi}/>
            : <>
                <WeekRows days={weekDays} lo={lo} hi={hi}/>
                <p className="note mt-2.5">The shaded stretch is the usual range.</p>
              </>}
        </div>
        <StateKey/>
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

const COPY = {
  note: 'These are demo figures. Nobody has been measured.',
}

/* Real mode carries no notice: the shared one is tagged No patch, and here
   the empty grid and the network card already say where readings come from. */
export function Calendar({ go, who }) {
  const [mode] = useMode()
  return (
    <SectionShell go={go} note={mode === 'real' ? null : COPY.note}>
      <CalendarBody go={go} who={who}/>
    </SectionShell>
  )
}

export default Calendar
