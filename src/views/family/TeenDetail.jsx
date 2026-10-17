import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { RainbowDial } from '../../charts/rainbow'
import { LightCard } from '../../traffic/ParentReport'
import { SENSORS } from '../../lib/sensors'
import { FACE_LABEL } from '../../lib/roster'
import { SHARING } from '../../app/store'
import { ArrowLeft, Chevron, MoveMark, PulseMark, SweatMark, TempMark, Wave } from '../../ui/marks'
import { SeeDetails } from '../Monitor'
import { cn } from '../../lib/utils'
import RangeTrend from './RangeTrend'
import FamilyPrivacy, { Box } from './Privacy'
import { StatusMark, TeenAvatar } from './TeenCard'
import { LampFace } from '../../traffic/Face'
import { STATUS_SUB, STATUS_WORD, dayLabel, dayOf, displayName, isPro, lightOf, metaLine, showsReadings, showsScore,
  sourceLine, subOf, summaryOf, usualOf } from './data'

/* One teen's page, opened from their card.
 *
 * TeenDetail({ teen, onBack, variant = 'parent' | 'pro', range })
 *
 * Top to bottom: back, who and their face, today's Mind Score on the rainbow
 * dial beside that day's Heads Up, the Day / Week / Month trend, then one day
 * in detail (picked from the trend or stepped through): its readings and the
 * body signals behind the score. A parent sees whole days and plain words; a
 * Counselor/Professional sees figures with units, and single readings only when
 * the teen shares them. A parent's privacy boxes close the page. */

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
const fmt = n => n.toLocaleString('en-US')

/* Each of the four dial bands, 0 to 100, as the day against this teen's own
   last thirty days: 50 is their usual, each standard deviation 18 points. */
export function ringsFor(teen, d) {
  const z = k => (d[k] - usualOf(teen, k, d.date).mean) / usualOf(teen, k, d.date).sd
  const val = v => Math.round(clamp(50 + v * 18, 2, 98))
  const all = [
    { id: 'heart', value: val((z('pulse') - z('hrv')) / 2) },
    { id: 'sweat', value: val(z('eda')), patch: true },
    { id: 'temp', value: val(-z('temp')), patch: true },
    { id: 'move', value: val(z('steps')) },
  ]
  return all.filter(r => teen.patch || !r.patch).map(r => ({ ...r, name: SENSORS[r.id].name, glow: SENSORS[r.id].glow }))
}

/* Body signals for one day. `word` picks the plain-words line for a parent. */
const METRICS = [
  { k: 'pulse', label: 'Pulse', unit: 'bpm', Mark: PulseMark, up: 'Faster than usual', down: 'Slower than usual' },
  { k: 'hrv', label: 'Variability', unit: 'ms', Mark: Wave, up: 'More varied than usual', down: 'Less varied than usual',
    note: 'Time between beats (RMSSD)' },
  { k: 'eda', label: 'Sweat response', unit: 'µS', Mark: SweatMark, up: 'Higher than usual', down: 'Lower than usual', patch: true },
  { k: 'temp', label: 'Skin temperature', unit: '°C', Mark: TempMark, up: 'Warmer than usual', down: 'Cooler than usual', patch: true },
  { k: 'steps', label: 'Steps', unit: 'steps', Mark: MoveMark, up: 'More active than usual', down: 'Less active than usual' },
]

const SHORT = { green: 'usual', yellow: 'above usual', red: 'well above' }
const SOURCE = { patch: 'Patch', camera: 'Phone camera check', survey: 'Check-in questions' }
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

export function BackButton({ onBack, label }) {
  return (
    <button type="button" onClick={onBack}
      className="group -ml-1 inline-flex min-h-[44px] items-center gap-2 rounded-field px-1 font-display text-ui font-bold
        text-accent-ink hoverOnly:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
      <ArrowLeft aria-hidden className="size-5 transition-transform duration-150 groupHoverOnly:-translate-x-0.5
        motion-reduce:transition-none"/>
      {label}
    </button>
  )
}

function DayStepper({ teen, date, setDate, first, live = false }) {
  const i = teen.days.findIndex(d => d.date === date)
  const btn = 'grid size-11 place-items-center rounded-field border border-rule bg-card text-ink hoverOnly:bg-mist ' +
    'disabled:cursor-not-allowed disabled:text-ink-3 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} aria-label="Previous day" disabled={i <= first}
        onClick={() => setDate(teen.days[i - 1].date)}><Chevron aria-hidden className="size-5 rotate-180"/></button>
      <p aria-live={live ? 'polite' : undefined} className="m-0 min-w-[9.5rem] text-center font-display text-ui font-bold text-ink">
        {dayLabel(teen, date)}</p>
      <button type="button" className={btn} aria-label="Next day" disabled={i >= teen.days.length - 1}
        onClick={() => setDate(teen.days[i + 1].date)}><Chevron aria-hidden className="size-5"/></button>
    </div>
  )
}

/* The last seven days as lamps, each one a button that picks its day. */
function WeekLamps({ teen, date, setDate }) {
  const week = teen.days.slice(-7)
  return (
    <div className="mt-6 border-t border-rule pt-4">
      <p className="m-0 font-display text-ui font-bold text-ink">Last seven days</p>
      <ul className="m-0 mt-2 grid list-none grid-cols-7 gap-1 p-0">
        {week.map(x => {
          const on = x.date === date
          return (
            <li key={x.date}>
              <button type="button" aria-pressed={on} onClick={() => setDate(x.date)}
                aria-label={`${dayLabel(teen, x.date)}: ${x.light ? STATUS_WORD[x.light]
                  : x.score != null ? `Mind Score ${x.score}` : 'no readings'}`}
                className={cn('flex min-h-[64px] w-full flex-col items-center justify-center gap-1.5 rounded-field border',
                  'transition-colors duration-150 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                  on ? 'border-ink bg-mist' : 'border-transparent hoverOnly:bg-mist')}>
                {x.light ? (
                  <span className="grid size-7 place-items-center rounded-[8px] bg-[#1c1c1e]">
                    <LampFace light={x.light} size={20}/></span>
                ) : x.score != null ? (
                  <span className="grid size-7 place-items-center font-display text-fine font-bold tabular-nums text-ink">{x.score}</span>
                ) : (
                  <span aria-hidden className="grid size-7 place-items-center">
                    <span className="size-3 rounded-full border-2 border-ink-3"/></span>
                )}
                <span className={cn('text-fine', on ? 'font-bold text-ink' : 'text-ink-2')}>{x.weekday.slice(0, 2)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Readings({ teen, d, variant }) {
  const counts = d.readings.reduce((a, r) => ({ ...a, [r.source]: (a[r.source] || 0) + 1 }), {})
  if (showsReadings(teen, variant)) {
    return (
      <Box title="Readings" meta={plural(d.readings.length, 'reading', 'readings')}>
        <table className="mt-3 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule text-fine text-ink-3">
              <th scope="col" className="py-2 font-normal">Time</th>
              <th scope="col" className="py-2 font-normal">Source</th>
              <th scope="col" className="py-2 text-right font-normal">Mind Score</th>
            </tr>
          </thead>
          <tbody>
            {d.readings.map((r, i) => (
              <tr key={i} className="border-b border-rule">
                <td className="py-2.5 text-fine tabular-nums text-ink">{r.time}</td>
                <td className="py-2.5 text-fine text-ink-2">{SOURCE[r.source]}</td>
                <td className="py-2.5 text-right font-display text-ui font-bold tabular-nums text-ink">
                  {r.score}<span className="ml-2 inline-block w-[5.5rem] text-left font-body text-fine font-normal text-ink-3">{SHORT[lightOf(teen, r.score)]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="m-0 mt-3 text-fine text-ink-3">Shown because this student shares single readings.</p>
      </Box>
    )
  }
  return (
    <Box title="Readings" meta={plural(d.readings.length, 'reading', 'readings')}>
      <ul className="m-0 mt-2 list-none p-0">
        {Object.entries(counts).map(([src, n]) => (
          <li key={src} className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5">
            <span className="text-fine text-ink-2">{SOURCE[src]}</span>
            <span className="font-display text-ui font-medium tabular-nums text-ink">{n}</span>
          </li>
        ))}
      </ul>
      <p className="m-0 mt-3 max-w-[48ch] text-fine text-ink-2">
        {isPro(variant)
          ? 'Times and single values need this student’s consent to share raw readings.'
          : `You see the day as a whole. Times and single readings stay with ${teen.first}.`}
      </p>
    </Box>
  )
}

function BodyTiles({ teen, d, variant }) {
  const pro = isPro(variant)
  return (
    <Box title="Body signals" meta={pro ? 'against their last 30 days' : 'the day as a whole'}>
      <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-3 p-0 xl:grid-cols-3">
        {METRICS.map(m => {
          const missing = m.patch && !teen.patch
          const u = usualOf(teen, m.k, d.date)
          const v = d[m.k]
          const z = (v - u.mean) / u.sd
          const diff = v - u.mean
          const dp = m.k === 'eda' || m.k === 'temp' ? 1 : 0
          return (
            <li key={m.k} className="rounded-field border border-rule bg-paper p-3.5">
              <p className="m-0 flex items-center gap-2 text-fine font-semibold text-ink-2">
                <m.Mark aria-hidden className="size-4 shrink-0 text-accent"/>{m.label}</p>
              {missing ? (
                <p className="m-0 mt-1.5 text-ui text-ink-2">Needs the patch</p>
              ) : pro ? (
                <>
                  <p className="m-0 mt-1.5 flex items-baseline gap-1.5 font-display text-row font-bold tabular-nums leading-none text-ink">
                    {m.k === 'steps' ? fmt(v) : v.toFixed(dp)}
                    {m.k !== 'steps' && <span className="font-body text-fine font-normal text-ink-3">{m.unit}</span>}</p>
                  <p className="m-0 mt-1.5 text-fine tabular-nums text-ink-2">
                    {diff >= 0 ? '+' : '−'}{m.k === 'steps' ? fmt(Math.round(Math.abs(diff))) : Math.abs(diff).toFixed(dp)} vs mean
                    {' '}{m.k === 'steps' ? fmt(Math.round(u.mean)) : u.mean.toFixed(dp)}, z {z >= 0 ? '+' : '−'}{Math.abs(z).toFixed(1)}</p>
                  {m.note && <p className="m-0 mt-0.5 text-fine text-ink-3">{m.note}</p>}
                </>
              ) : (
                <p className="m-0 mt-1.5 font-display text-ui font-bold text-ink">
                  {Math.abs(z) < 0.75 ? 'About usual' : z > 0 ? m.up : m.down}</p>
              )}
            </li>
          )
        })}
      </ul>
      {!teen.patch && <p className="m-0 mt-3 text-fine text-ink-3">Pulse and variability come from the phone camera.</p>}
    </Box>
  )
}

/* The Counselor/Professional's extra figures for one day. */
function Measures({ teen, d }) {
  const u = usualOf(teen, 'score', d.date)
  const rows = [
    ['Mind Score', d.score],
    ['Peaks above usual', d.peaks],
    ['Minutes to settle after a peak', d.recovery],
    ['Usual band', `${teen.usual.lo} to ${teen.usual.hi}`],
    ['30-day mean, SD', `${u.mean.toFixed(1)}, ${u.sd.toFixed(1)}`],
    ['Sources', [d.sources.patch && 'patch', d.sources.camera && 'camera', d.sources.survey && 'questions'].filter(Boolean).join(', ')],
  ]
  return (
    <Box title="Measures" meta="this day">
      <dl className="m-0 mt-2 p-0">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5">
            <dt className="text-fine text-ink-2">{k}</dt>
            <dd className="m-0 text-right font-display text-ui font-medium tabular-nums text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </Box>
  )
}

/* The consent a Counselor/Professional holds for this teen. */
function Consent({ teen }) {
  const c = teen.consent || {}
  const rows = [['Mind Score', c.score], ['Trends', c.trends], ['Single readings', c.raw], ['Name', c.name]]
  return (
    <Box title="Consent" meta="signed by a guardian">
      <dl className="m-0 mt-2 p-0">
        {rows.map(([k, on]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5">
            <dt className="text-fine text-ink-2">{k}</dt>
            <dd className={cn('m-0 font-display text-ui font-medium', on ? 'text-ink' : 'text-ink-3')}>{on ? 'Shared' : 'Not shared'}</dd>
          </div>
        ))}
      </dl>
      <p className="m-0 mt-3 text-fine text-ink-2">Opening this record is logged.</p>
    </Box>
  )
}

/* For a parent: the week's hardest day and a few ways to start. */
export function AskAbout({ teen }) {
  const w = summaryOf(teen, 'week')
  const over = teen.usual ? w.points.filter(p => p.score > teen.usual.hi) : []
  const peak = over.length ? over.reduce((a, b) => (b.score > a.score ? b : a)) : null
  const name = peak && new Date(peak.date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
  return (
    <Box title="What to ask about" meta="this week">
      {!peak ? (
        <p className="m-0 mt-3 max-w-[48ch] text-fine text-ink-2">No day sat above {teen.first}’s own range this week.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <p className="m-0 font-display text-ui font-bold text-ink">{name}</p>
            <p className="m-0 mt-1 font-display text-stat font-bold tabular-nums leading-none text-ink">{peak.score}
              <span className="ml-1.5 font-body text-fine font-normal text-ink-3">out of 100</span></p>
            <p className="m-0 mt-2 text-fine text-ink-2">The app cannot say why.</p>
            <p className="m-0 mt-3 max-w-[50ch] text-fine text-ink-2">Try not to say &ldquo;Your {teen.live ? 'readings say' : 'patch says'} you were
              stressed.&rdquo; {teen.first} can see this page too.</p>
            <p className="m-0 mt-1.5 max-w-[50ch] text-fine text-ink-2">Worried about their safety? Call their counselor/professional
              or a crisis line.</p>
          </div>
          <div>
            <p className="m-0 text-fine font-semibold text-ink-2">Ways to start</p>
            <ul className="m-0 mt-1 list-none p-0">
              {[`How was ${name}?`, 'Anything this week you want to get off your chest?', 'Do you want help with it, or just to talk?']
                .map(o => <li key={o} className="border-b border-rule py-2.5 text-ui text-ink">&ldquo;{o}&rdquo;</li>)}
            </ul>
          </div>
        </div>
      )}
    </Box>
  )
}

/* ── A linked teen, from their account ──────────────────────────────────
 *
 * The same page with what the account sends: day figures, the usual band if
 * shared, where readings came from if shared. No body signals, no hours, no
 * single readings, so those boxes are not drawn. */

const SHARE_WORD = {
  parent: { score: 'Mind Score for each day', week: 'Days above their usual', sleep: 'Hours slept',
            worn: 'Whether the patch was worn', settle: 'Days slow to settle' },
  pro: { score: 'Mind Score', trends: 'Week over week change', raw: 'Time of the latest reading', settle: 'Days slow to settle' },
}

export function LiveShares({ teen, variant }) {
  const audience = isPro(variant) ? 'pro' : 'parent'
  const rows = SHARING[audience].fields.map(f => [SHARE_WORD[audience][f.key] || f.label, teen.sharing?.[f.key] === true])
  return (
    <Box title={`What ${teen.first} shares with you`} meta="their choice">
      <dl className="m-0 mt-2 p-0">
        {rows.map(([k, on]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5">
            <dt className="text-fine text-ink-2">{k}</dt>
            <dd className={cn('m-0 font-display text-ui font-medium', on ? 'text-ink' : 'text-ink-2')}>{on ? 'Shared' : 'Not shared'}</dd>
          </div>
        ))}
      </dl>
      <p className="m-0 mt-3 max-w-[48ch] text-fine text-ink-2">{teen.first} can switch any of these off in their app.
        {audience === 'parent' ? ' Notes, location and single readings are never shared with a parent.' : ' Notes and location are never shared.'}</p>
    </Box>
  )
}

const SOURCE_PLURAL = { patch: 'Patch', camera: 'Phone camera checks', survey: 'Check-in questions' }
const timeOf = t => new Date(t).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })

function LiveDay({ teen, d, variant }) {
  const pro = isPro(variant)
  const rows = d.score == null ? [] : [
    ['Mind Score', d.score, subOf(teen, d.score)],
    ['Lowest to highest', `${d.min} to ${d.max}`],
    ['Readings', d.count],
    ...(d.sources ? Object.entries(d.sources).filter(([, n]) => n > 0).map(([k, n]) => [SOURCE_PLURAL[k], n]) : []),
  ]
  return (
    <Box title="Readings" meta={d.score == null ? 'none' : plural(d.count, 'reading', 'readings')}>
      {d.score == null ? (
        <p className="m-0 mt-3 text-ui text-ink-2">No readings on this day.</p>
      ) : (
        <dl className="m-0 mt-2 p-0">
          {rows.map(([k, v, sub]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5">
              <dt className="text-fine text-ink-2">{k}</dt>
              <dd className="m-0 text-right font-display text-ui font-medium tabular-nums text-ink">{v}
                {sub && <span className="ml-2 font-body text-fine font-normal text-ink-2">{sub}</span>}</dd>
            </div>
          ))}
        </dl>
      )}
      {pro && teen.latestAt && (
        <p className="m-0 mt-3 text-fine text-ink-2">Latest reading: {timeOf(teen.latestAt)}.</p>
      )}
      <p className="m-0 mt-3 max-w-[48ch] text-fine text-ink-2">
        {pro ? 'Day figures only. Single readings and notes are not sent.'
             : `You see the day as a whole. Times and single readings stay with ${teen.first}.`}</p>
    </Box>
  )
}

function LiveDetail({ teen, onBack, variant, range: initial }) {
  const pro = isPro(variant)
  const reduced = useReducedMotion()
  const today = teen.days[teen.days.length - 1]
  const [range, setRange] = React.useState(initial)
  const [date, setDate] = React.useState(today.date)
  const d = dayOf(teen, date)
  const first = teen.days.length - 30
  const name = displayName(teen, variant)
  const head = React.useRef(null)
  const dayRef = React.useRef(null)
  React.useEffect(() => { head.current?.focus({ preventScroll: true }) }, [teen.id])
  const score = showsScore(teen, variant)
  const last = [...teen.days].reverse().find(x => x.score != null)
  const pickDay = iso => {
    if (teen.days.findIndex(x => x.date === iso) < first) return
    setDate(iso)
    dayRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className="flex w-full flex-col gap-4 lg:gap-5">
      <div><BackButton onBack={onBack} label={pro ? 'All students' : 'All children'}/></div>

      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-panel border border-rule bg-card p-5 shadow-card sm:p-6">
        <TeenAvatar teen={teen} variant={variant} size="size-16"/>
        <div className="min-w-0 flex-1">
          <h2 ref={head} tabIndex={-1} className="m-0 font-display text-sub font-bold leading-none text-ink outline-none">{name}</h2>
          <p className="m-0 mt-1.5 text-fine text-ink-2">{metaLine(teen, variant)} · {sourceLine(teen)}</p>
        </div>
        {score && (
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <StatusMark teen={teen} range={range} size={36}/>
            <span className="text-fine text-ink-2">{FACE_LABEL[range]}</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-5">
        <section aria-labelledby="dial-title"
          className="relative flex flex-col items-center overflow-hidden rounded-panel border border-rule bg-gradient-to-b
            from-card via-card to-aqua p-5 text-center shadow-card sm:p-6">
          <h3 id="dial-title" className="m-0 self-start font-display text-head font-bold leading-tight text-ink">Mind Score today</h3>
          {!score ? (
            <p className="m-0 mt-4 text-ui text-ink-2">{teen.first} does not share their Mind Score with you.</p>
          ) : today.score == null ? (
            <div className="my-auto py-8">
              <p className="m-0 font-display text-row font-bold text-ink">No readings yet today</p>
              <p className="m-0 mt-2 text-fine text-ink-2">{last ? `Last reading day: ${dayLabel(teen, last.date)}, Mind Score ${last.score}.`
                : `${teen.first}’s Mind Score shows here after their first reading.`}</p>
            </div>
          ) : (
            <>
              <RainbowDial className="mt-3" score={today.score} usual={teen.usual?.base} rings={[]} size={340}/>
              {subOf(teen, today.score) && <p className="m-0 mt-2 font-display text-ui font-bold text-ink">{subOf(teen, today.score)}</p>}
              <p className="m-0 mt-2 text-fine text-ink-2">The day so far, from {plural(today.count, 'reading', 'readings')}.</p>
            </>
          )}
        </section>

        <section aria-labelledby="week-title" className="flex flex-col rounded-panel border border-rule bg-card p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="week-title" className="m-0 font-display text-head font-bold leading-tight text-ink">Day by day</h3>
            <DayStepper teen={teen} date={date} setDate={setDate} first={first}/>
          </div>
          {score ? <WeekLamps teen={teen} date={date} setDate={setDate}/>
            : <p className="m-0 mt-4 text-ui text-ink-2">Not shared.</p>}
          <p className="m-0 mt-auto pt-5 text-fine text-ink-3">
            {teen.usual?.general ? 'Faces use the general range until three days of readings.'
              : teen.usual ? `Faces compare each day with ${teen.first}’s own usual.`
              : `${teen.first} does not share how a day compares with their usual.`}</p>
        </section>
      </div>

      {score && <RangeTrend teen={teen} range={range} onRange={setRange} variant={variant}
        day={range === 'day' ? undefined : date} onDay={pickDay}/>}

      <div ref={dayRef} className="scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 font-display text-head font-bold text-ink">The day in detail</h3>
          <DayStepper teen={teen} date={date} setDate={setDate} first={first} live/>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          {score ? <LiveDay teen={teen} d={d} variant={variant}/> : null}
          <LiveShares teen={teen} variant={variant}/>
        </div>
      </div>

      {!pro && score && <AskAbout teen={teen}/>}
    </div>
  )
}

export default function TeenDetail({ teen, onBack, variant = 'parent', range = 'week' }) {
  if (teen.live) return <LiveDetail teen={teen} onBack={onBack} variant={variant} range={range}/>
  return <DemoDetail teen={teen} onBack={onBack} variant={variant} range={range}/>
}

function DemoDetail({ teen, onBack, variant = 'parent', range: initial = 'week' }) {
  const pro = isPro(variant)
  const reduced = useReducedMotion()
  const today = teen.days[teen.days.length - 1]
  const [range, setRange] = React.useState(initial)
  const [date, setDate] = React.useState(today.date)
  const d = dayOf(teen, date)
  const first = teen.days.length - 30
  const name = displayName(teen, variant)
  const head = React.useRef(null)
  const dayRef = React.useRef(null)
  React.useEffect(() => { head.current?.focus({ preventScroll: true }) }, [teen.id])

  const rings = ringsFor(teen, today)
  const score = showsScore(teen, variant)
  /* Red: the time of the highest reading that day, for the Heads Up line. */
  const top = d.readings.reduce((a, r) => (r.score > a.score ? r : a), d.readings[0])
  const at = d.light === 'red' && top ? new Date(`${d.date}T${top.time}:00`).getTime() : undefined
  const pickDay = iso => {
    if (teen.days.findIndex(x => x.date === iso) < first) return
    setDate(iso)
    dayRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className="flex w-full flex-col gap-4 lg:gap-5">
      <div><BackButton onBack={onBack} label={pro ? 'All students' : 'All children'}/></div>

      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-panel border border-rule bg-card p-5 shadow-card sm:p-6">
        <TeenAvatar teen={teen} variant={variant} size="size-16"/>
        <div className="min-w-0 flex-1">
          <h2 ref={head} tabIndex={-1} className="m-0 font-display text-sub font-bold leading-none text-ink outline-none">{name}</h2>
          <p className="m-0 mt-1.5 text-fine text-ink-2">
            {pro ? `Grade ${teen.grade}` : `${teen.age}, grade ${teen.grade}`} · {sourceLine(teen)}</p>
        </div>
        {score && (
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <StatusMark teen={teen} range={range} size={36}/>
            <span className="text-fine text-ink-2">{FACE_LABEL[range]}</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-5">
        <section aria-labelledby="dial-title"
          className="relative flex flex-col items-center overflow-hidden rounded-panel border border-rule bg-gradient-to-b
            from-card via-card to-aqua p-5 text-center shadow-card sm:p-6">
          <h3 id="dial-title" className="m-0 self-start font-display text-head font-bold leading-tight text-ink">Mind Score today</h3>
          {score ? (
            <>
              <RainbowDial className="mt-3" score={today.score} usual={teen.usual.base} rings={rings} size={340}/>
              <p className="m-0 mt-2 font-display text-ui font-bold text-ink">{STATUS_SUB[lightOf(teen, today.score)]}</p>
              <ul className="m-0 mt-4 grid w-full list-none grid-cols-1 gap-x-6 sm:grid-cols-2 gap-y-2 border-t border-rule p-0 pt-3 text-left">
                {rings.map(r => (
                  <li key={r.id} className="flex items-center gap-2 text-fine text-ink-2">
                    <span aria-hidden className="h-3 w-3 shrink-0 rounded-bar" style={{ background: r.glow }}/>
                    <span className="min-w-0 flex-1">{r.name}</span>
                    <span className="font-display font-bold tabular-nums text-ink">
                      {pro ? r.value : r.value > 64 ? 'Above usual' : r.value < 36 ? 'Below usual' : 'Usual'}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="m-0 mt-4 text-ui text-ink-2">This student shares crisis alerts only.</p>
          )}
        </section>

        <section aria-labelledby="hu-title" className="flex flex-col rounded-panel border border-rule bg-card p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="hu-title" className="m-0 font-display text-head font-bold leading-tight text-ink">Heads Up</h3>
            <DayStepper teen={teen} date={date} setDate={setDate} first={first}/>
          </div>
          <div className="mt-5">
            <LightCard light={d.light} at={at} signals={d.signals} reduced={reduced} ios={false} lamp={30}/>
          </div>
          <WeekLamps teen={teen} date={date} setDate={setDate}/>
          <p className="m-0 mt-auto pt-5 text-fine text-ink-3">From how {teen.first} uses their phone, never what is on it.</p>
        </section>
      </div>

      <RangeTrend teen={teen} range={range} onRange={setRange} variant={variant}
        day={range === 'day' ? undefined : date} onDay={pickDay}/>

      <div ref={dayRef} className="scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 font-display text-head font-bold text-ink">The day in detail</h3>
          <DayStepper teen={teen} date={date} setDate={setDate} first={first} live/>
        </div>
        <div className={cn('mt-4 grid grid-cols-1 gap-4 lg:gap-5', pro ? 'lg:grid-cols-3' : 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]')}>
          <Readings teen={teen} d={d} variant={variant}/>
          {pro && <Measures teen={teen} d={d}/>}
          {pro ? <Consent teen={teen}/> : <BodyTiles teen={teen} d={d} variant={variant}/>}
        </div>
        {pro && <div className="mt-4 lg:mt-5"><BodyTiles teen={teen} d={d} variant={variant}/></div>}
      </div>

      {!pro && (
        <>
          <AskAbout teen={teen}/>
          <SeeDetails label="Privacy" sub={`What is shared, what was signed, and who opened ${teen.first}’s record`}>
            <FamilyPrivacy teen={teen}/>
          </SeeDetails>
        </>
      )}
    </div>
  )
}
