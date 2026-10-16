import React from 'react'
import { SectionShell } from './shell'
import { Panel, PanelHead, Why } from './Monitor'
import { ArrowLeft, ArrowRight, Check, Chevron, Cross, Minus, Plus } from '../ui/marks'
import { RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { useAccount } from '../account/store'
import { EVENT_KINDS, addEvent, eventsOn, getVersion, removeEvent, subscribe } from '../app/store'
import { BAND, USUAL, WBAND, clock12, monthScores } from './reading/demo'
import { cn } from '../lib/utils'

/* The calendar: route id `calendar`, design spec 0d section 6 and 0e section
 * 18. The owner's words:
 *
 *   > Should also be able to see weekly and monthly stats on a calendar and
 *   > have "streaks" over days above a user selected target score, with
 *   > percentages detailing how often the user stayed in target range or
 *   > deviated on either the low or high end.
 *
 * So the screen is four things and no more:
 *
 *   1. A TARGET the reader sets. One number, 0 to 100, and a range around it
 *      the width of this reader's own usual week range. Nothing picks it for
 *      them and nothing recommends one.
 *   2. A WEEK and a MONTH, on one switch.
 *   3. THREE PERCENTAGES: inside the target range, above it, below it.
 *   4. A STREAK, which is a NEUTRAL COUNT. It is the longest run of days
 *      inside the range and the run the reader is on. It never congratulates,
 *      never warns, never says a run was broken and never compares this reader
 *      with another one. A count of days is all it is, and the screen says so.
 *
 * WHAT IS GENERATED. Every number on this screen comes out of
 * src/views/reading/demo.js, seeded, so the month is the same month on every
 * load. No patch has been built or worn and nothing here was measured from
 * anybody. In real mode there are no readings, so the target still works and
 * the grid is honestly empty rather than drawn at zero.
 *
 * COLOUR. Three states, three grounds from the green system: the brand wash
 * inside the range, warn where a day ran above it, the turquoise wash below
 * it. Colour is never the only carrier: every square prints its own figure and
 * the key prints the two edges of the range, so the state of a square is
 * readable in greyscale. */

const KEY = 'mindmap.target'
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const MIN_T = 20, MAX_T = 80

/* The range is the target plus and minus half the width of this reader's own
   usual week range, so a target carries the same tolerance their own normal
   does rather than an arbitrary one. 38 to 56 is 18 wide, so the range is the
   target plus or minus 9. */
const HALF = Math.max(4, Math.round(((WBAND.hi - WBAND.lo) || 18) / 2))

const clampT = n => Math.max(MIN_T, Math.min(MAX_T, Math.round(n)))

function readTarget() {
  try {
    const v = Number(localStorage.getItem(KEY))
    return Number.isFinite(v) && v >= MIN_T && v <= MAX_T ? v : USUAL
  } catch { return USUAL }
}

function useTarget() {
  const [t, setT] = React.useState(readTarget)
  const set = n => {
    const v = clampT(n)
    setT(v)
    try { localStorage.setItem(KEY, String(v)) } catch { /* session only is fine */ }
  }
  return [t, set]
}

/* Where one day sits against the range. The word is the state; the ground only
   repeats it. */
const stateOf = (v, lo, hi) => (v == null ? 'none' : v > hi ? 'above' : v < lo ? 'below' : 'inside')
/* `ground` is the square's ground, pale enough that ink on it stays well past
   AA. `mark` is the same state as a filled graphic, for a 4px mark or a share
   bar, where a wash on mist would not clear the 3 : 1 a non-text graphic owes.
   Each DEFAULT clears 3 : 1 on card and on mist. */
const STATE = {
  inside: { word: 'inside', ground: 'bg-accent-wash border-accent/30', mark: 'bg-accent border-accent' },
  above:  { word: 'above',  ground: 'bg-warn-wash border-warn/40',    mark: 'bg-warn border-warn' },
  below:  { word: 'below',  ground: 'bg-beam-wash border-beam/30',    mark: 'bg-beam border-beam' },
  none:   { word: 'no reading', ground: 'bg-paper border-rule',       mark: 'bg-mist border-rule' },
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
/* Two letters in the grid header: a single M T W T F S S repeats T and S, and
   a 45px square at 390 has room for two. */
const DOW_2 = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const DOW_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/* Monday first, which is how the week series in src/lib/chartdata.js is keyed.
   Date.getDay() is Sunday first, so it is shifted here once. */
const mondayIndex = d => (d.getDay() + 6) % 7

function counts(values, lo, hi) {
  const scored = values.filter(v => v != null)
  const n = scored.length || 1
  const inside = scored.filter(v => v >= lo && v <= hi).length
  const above = scored.filter(v => v > hi).length
  const below = scored.filter(v => v < lo).length
  return { n: scored.length, inside, above, below,
           pInside: Math.round((inside / n) * 100),
           pAbove: Math.round((above / n) * 100),
           pBelow: Math.round((below / n) * 100) }
}

/* Two counts, both neutral. `longest` is the longest run of days inside the
   range anywhere in the window; `current` is the run the last scored day is
   on, which is 0 when that day was not inside it. Neither is a target and
   neither is compared with anything. */
function streaks(values, lo, hi) {
  let longest = 0, run = 0, current = 0
  for (const v of values) {
    if (v == null) continue
    if (v >= lo && v <= hi) { run += 1; longest = Math.max(longest, run) }
    else run = 0
    current = run
  }
  return { longest, current }
}

const dayLabel = n => `${n} day${n === 1 ? '' : 's'}`

/* ── The target ─────────────────────────────────────────────────────────── */

/* The owner, 14 October: "Calendar is too complex and not user friendly".
   One card for the target and what the month did against it: the number, a
   minus and a plus, the range, and three facts. The slider, the three
   percentage bars and the how-it-works list are gone. */
function TargetCard({ target, setTarget, lo, hi, c, s, className }) {
  const facts = [
    ['In range', c.n ? `${c.inside} of ${c.n} days` : 'No days yet'],
    ['Longest run', dayLabel(s.longest)],
    ['Current run', dayLabel(s.current)],
  ]
  return (
    <Panel className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHead title="Your Target" meta="0 to 100" className="min-w-0 flex-1"/>
        <Why label="What the target is" className="pt-1.5">
          You pick the number, and lower is calmer. Your usual day is {USUAL}, and nobody else sees it.
        </Why>
      </div>
      <div className="mt-3 flex items-center justify-center gap-4">
        <button type="button" onClick={() => setTarget(target - 1)}
          aria-label="Lower the target by one"
          className="flex size-11 shrink-0 items-center justify-center rounded-field border
            border-ink text-ink transition-colors duration-150 hoverOnly:bg-mist active:bg-mist">
          <Minus aria-hidden className="size-4"/>
        </button>
        <p className="min-w-[3ch] text-center font-display text-stat font-medium tabular-nums leading-none text-ink">
          {target}</p>
        <button type="button" onClick={() => setTarget(target + 1)}
          aria-label="Raise the target by one"
          className="flex size-11 shrink-0 items-center justify-center rounded-field border
            border-ink font-display text-ui font-medium text-ink transition-colors duration-150
            hoverOnly:bg-mist active:bg-mist">+</button>
      </div>
      <p className="mt-2 text-center text-fine text-ink-2">In range means {lo} to {hi}</p>
      <dl className="m-0 mt-3 grid grid-cols-3 gap-x-3 border-t border-rule pt-3">
        {facts.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="tick">{k}</dt>
            <dd className="m-0 mt-0.5 font-display text-ui font-bold tabular-nums leading-tight text-ink">{v}</dd>
          </div>
        ))}
      </dl>
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
                : `${dow} ${c.day} ${MONTHS[month]}, ${c.v} out of 100, ${st.word} your target range`}
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

function StateKey({ lo, hi }) {
  const rows = [
    ['Inside', `${lo} to ${hi}`, STATE.inside.ground],
    ['Above', `over ${hi}`, STATE.above.ground],
    ['Below', `under ${lo}`, STATE.below.ground],
  ]
  return (
    <ul className="m-0 mt-3 grid list-none grid-cols-1 gap-x-5 gap-y-1.5 border-t border-rule
      pt-2.5 p-0 sm:grid-cols-3">
      {rows.map(([label, range, ground]) => (
        <li key={label} className="flex min-w-0 items-center gap-2">
          <span aria-hidden className={cn('size-4 shrink-0 rounded-xs border', ground)}/>
          <span className="min-w-0 text-fine text-ink-2">{label}, <span
            className="tabular-nums text-ink">{range}</span></span>
        </li>
      ))}
    </ul>
  )
}

/* ── The week ───────────────────────────────────────────────────────────── */

/* Seven rows rather than seven columns: at 390 a row carries the day, the
   figure, the state in words and the figure's position in the range, and a
   column of 45px cannot carry four things. */
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

/* A test, a presentation, a game: the student marks it with a day, a time and
   a word, and the patch works out the run-up and the settle time around it
   (src/signals/recovery.js). The marks live in the device store's `events`
   slot and never leave the phone: not to a parent, not to a Medical
   Professional, not to the server. */
const KIND_WORD = { test: 'Test', talk: 'Presentation', game: 'Game', other: 'Other' }
const pad2 = n => String(n).padStart(2, '0')
const dayKey = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const hhmm = m => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`
/* The 12-hour clock the dashboard prints, from a minute of the day. */
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
          The patch reads the two hours before it. Then how long you took to settle.
        </Why>
      </div>
      {/* On a phone: the event, then day and time side by side, then the four
          kinds as a two-by-two of chips, then Add across the width. Every target
          is 44px tall. On a wider screen the three fields share one row. */}
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
  /* Event marks are the student's own and never reach a parent or a Medical
     Professional (spec 0g), so only a student, or a reader whose app is not
     known, gets the form. The audience is the one App passes, or failing
     that the signed in account's role. */
  const me = useAccount()
  const reader = who || (me && me.role) || null
  const canMark = !reader || reader === 'student'
  const [target, setTarget] = useTarget()
  const [view, setView] = React.useState('month')
  const now = React.useMemo(() => new Date(), [])
  const [offset, setOffset] = React.useState(0)
  const lo = clampT(target - HALF), hi = clampT(target + HALF)

  const shown = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const year = shown.getFullYear(), month = shown.getMonth()
  const thisMonth = offset === 0
  const today = thisMonth ? now.getDate() : null
  const real = mode === 'real'

  const monthVals = React.useMemo(
    () => (real ? [] : monthScores(year, month, thisMonth ? now.getDate() : null)),
    [real, year, month, thisMonth, now])

  /* The week the calendar reads is the last seven days ending on the newest
     scored day in the month shown, so the week and the month cannot disagree
     about a Tuesday. */
  const weekDays = React.useMemo(() => {
    if (real) return []
    const end = monthVals.reduce((a, v, i) => (v != null ? i : a), -1)
    if (end < 0) return []
    const out = []
    for (let i = Math.max(0, end - 6); i <= end; i += 1) {
      const d = new Date(year, month, i + 1)
      out.push({ label: DOW[mondayIndex(d)], v: monthVals[i],
                 today: today != null && i + 1 === today })
    }
    return out
  }, [real, monthVals, year, month, today])

  const vals = view === 'month' ? monthVals : weekDays.map(d => d.v)
  const c = counts(vals, lo, hi)
  const s = streaks(vals, lo, hi)

  return (
    <div className={cn('grid w-full grid-cols-1 gap-3 lg:gap-4',
      !real && 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]')}>
      <TargetCard target={target} setTarget={setTarget} lo={lo} hi={hi} c={c} s={s}
        className="lg:col-start-1 lg:row-start-1"/>

      {real ? (
        <Panel>
          <PanelHead title="No Readings Yet"/>
          <div className="mt-2.5">
            <RealNotice>No patch is paired yet. Your target is saved.</RealNotice>
          </div>
          <button type="button" onClick={() => go('reading')}
            className="group mt-3 flex min-h-[44px] w-full items-center gap-3 border-t border-rule
              pt-2.5 text-left">
            <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink
              transition-colors duration-150 groupHoverOnly:text-accent-ink">Take a reading</span>
            <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
          </button>
        </Panel>
      ) : (
        <>
          <Panel className="lg:col-start-2 lg:row-start-1 lg:self-start">
            {/* The switch and the month stepper on one line. Two buttons in a
                bordered field, body face, normal case: design spec 0d section
                2, a thing a reader toggles is a field and never a capsule. */}
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
                    <PanelHead title="Last Seven Days" meta="out of 100"/>
                    <div className="mt-2.5"><WeekRows days={weekDays} lo={lo} hi={hi}/></div>
                    <p className="note mt-2.5">The shaded stretch is your target range.</p>
                  </>}
            </div>
            <StateKey lo={lo} hi={hi}/>
          </Panel>

        </>
      )}

      {canMark && <MarkEvent className={cn(!real && 'lg:col-span-2')}/>}
    </div>
  )
}

const COPY = {
  note: 'These are demo figures. Nobody has been measured.',
  realNote: 'No patch is paired yet.',
}

export function Calendar({ go, who }) {
  return (
    <SectionShell go={go} sub={COPY.sub} note={COPY.note} realNote={COPY.realNote}>
      <CalendarBody go={go} who={who}/>
    </SectionShell>
  )
}

export default Calendar
