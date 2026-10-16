import React from 'react'
import { Panel, PanelHead, Why } from '../views/Monitor'
import { cn } from '../lib/utils'
import { useMode } from '../lib/mode'
import { eventsOn, getVersion, subscribe } from '../app/store'
import { dailySettle, demoDay, runUp, settleWords } from '../signals/recovery'
import { clock12 } from '../views/reading/demo'

/* Two dashboard cards from the continuous patch stream: how long the body
 * took to settle after each peak today, and how far it had climbed before
 * each event the student marked. Both come from src/signals/recovery.js and
 * nothing here invents a figure: in the demo the series is demoDay(), in real
 * mode there is no patch stream yet and the cards say so.
 *
 * Every number is the wearer against themself. The sentence under the figure
 * names minutes, never a feeling, and the "?" holds the two sentences of
 * working. Events are read from the device store and never leave it. */

const pad2 = n => String(n).padStart(2, '0')
const hhmm = m => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`
/* Every time a reader sees is the dashboard's 12-hour clock. */
const clock = m => clock12(hhmm(m))

/* Local YYYY-MM-DD, which is how store.js keys an event's day. */
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/* ── The settle strip ───────────────────────────────────────────────────── */

/* 07:00 to 16:00 as one ruled strip. Each event is a bar from its peak minute
   to the minute it had settled, or to the minute the next peak began when it
   carried over. Settled bars are the brand green; carried ones are the
   turquoise with a hatch, so the state survives greyscale. Each bar prints
   its minutes beside it where there is room. */
function SettleStrip({ times, span, offset }) {
  const pid = React.useId()
  const [a, b] = span
  const W = b - a, H = 30
  const x = m => m - a
  const hours = []
  for (let m = a; m <= b; m += 60) hours.push(m)
  const read = times.length
    ? times.map(t => `${clock(offset + t.peakAt)} ${t.minutes} minutes${t.carried ? ', carried over' : ''}`).join('; ')
    : 'no peaks'
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
        aria-label={`Peaks between ${clock(a)} and ${clock(b)}: ${read}.`}
        className="block h-8 w-full">
        <defs>
          <pattern id={pid} width="4" height="4" patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)">
            <rect width="4" height="4" className="fill-beam-wash"/>
            <rect width="1.5" height="4" className="fill-beam"/>
          </pattern>
        </defs>
        <rect x="0" y={H / 2 - 1} width={W} height="2" className="fill-mist"/>
        {hours.map(m => (
          <rect key={m} x={x(m)} y={H / 2 - 4} width="1" height="8" className="fill-ruling"/>
        ))}
        {times.map((t, i) => (
          <g key={i}>
            <rect x={x(offset + t.peakAt)} y="6" width={Math.max(2, t.minutes)} height={H - 12} rx="2"
              fill={t.carried ? `url(#${pid})` : undefined}
              className={cn(!t.carried && 'fill-accent')}/>
            <rect x={x(offset + t.peakAt)} y="3" width="2" height={H - 6} className="fill-ink"/>
          </g>
        ))}
      </svg>
      <div aria-hidden className="mt-0.5 flex justify-between text-fine tabular-nums text-ink-3">
        <span>{clock(a)}</span><span>{clock(b)}</span>
      </div>
      <figcaption className="sr-only">Each bar runs from a peak until the body had settled.</figcaption>
    </figure>
  )
}

function SettleKey() {
  return (
    <p aria-hidden className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-fine text-ink-2">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-4 rounded-xs bg-accent"/>settled</span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-4 rounded-xs border border-beam
          bg-[repeating-linear-gradient(45deg,#ddf0f8_0_2px,#1d8fb0_2px_3px)]"/>carried over</span>
    </p>
  )
}

/* ── How your body settles ──────────────────────────────────────────────── */

const WHY = 'Slower settling goes with worry in studies of teenagers. MindMap shows the minutes, never a diagnosis.'

export function SettleCard({ className }) {
  const [mode] = useMode()
  if (mode !== 'demo') {
    return (
      <Panel className={className}>
        <PanelHead title="How Your Body Settles" meta="patch"/>
        <p className="mt-3 text-meta text-ink">No patch readings today.</p>
      </Panel>
    )
  }
  const d = demoDay()
  const day = dailySettle(d.index.slice(d.span[0], d.span[1]), d.band)
  const words = settleWords(day.median, d.usualSettle)
  return (
    <Panel className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHead title="How Your Body Settles" meta="demo" className="min-w-0 flex-1"/>
        <Why label="What settle time means" className="pt-1.5">{WHY}</Why>
      </div>
      <div className="mt-3 flex items-end gap-4">
        <p className="min-w-0">
          <span className="block font-display text-dial font-bold tabular-nums leading-none text-ink">
            {day.median == null ? '0' : Math.round(day.median)}</span>
          <span className="tick mt-1 block">min to settle</span>
        </p>
        <p className="min-w-0 flex-1 pb-0.5 text-fine text-ink-2">{words.line}</p>
      </div>
      <div className="mt-3">
        <SettleStrip times={day.times} span={d.span} offset={d.span[0]}/>
        <SettleKey/>
      </div>
      <dl className="m-0 mt-3 grid grid-cols-2 gap-x-3 border-t border-rule pt-2.5">
        {[['Peaks today', day.events], ['Carried over', day.carried]].map(([label, n]) => (
          <div key={label} className="min-w-0">
            <dt className="tick">{label}</dt>
            <dd className="m-0 mt-0.5 font-display text-row font-medium tabular-nums leading-none
              text-ink">{n}</dd>
          </div>
        ))}
      </dl>
      <p className="note mt-2.5">Minutes from a peak to halfway back to usual.</p>
    </Panel>
  )
}

/* ── Before your events ─────────────────────────────────────────────────── */

/* The two hours before one event: the index as a line, the wearer's usual for
   those minutes as a hairline under it. 120 samples wide, so one unit is one
   minute. */
function RunUpLine({ day, usual, from, to }) {
  const n = Math.max(1, to - from)
  const H = 28
  const vals = []
  for (let m = from; m < to; m++) vals.push(day[m], usual[m])
  const lo = Math.min(...vals), hi = Math.max(...vals)
  const span = hi - lo || 1
  const y = v => H - 2 - ((v - lo) / span) * (H - 4)
  const path = (s) => {
    let d = ''
    for (let m = from; m < to; m++) d += (m === from ? 'M' : 'L') + (m - from) + ' ' + y(s[m]).toFixed(1)
    return d
  }
  return (
    <svg viewBox={`0 0 ${n} ${H}`} preserveAspectRatio="none" aria-hidden
      className="block h-7 w-24 shrink-0 sm:w-28">
      <path d={path(usual)} fill="none" className="stroke-ruling" strokeWidth="1"
        strokeDasharray="3 3" vectorEffect="non-scaling-stroke"/>
      <path d={path(day)} fill="none" className="stroke-beam" strokeWidth="2"
        strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  )
}

/* The line under an event. Nine words at most, a time and a count. */
function runUpLine(r, minute) {
  if (r.points < 1 || r.climbFrom >= r.to) return 'Your body stayed near usual before this one.'
  return `Started climbing at ${clock(r.climbFrom)}, ${minute - r.climbFrom} minutes before.`
}

function EventRow({ ev, index, usual, children }) {
  const r = index ? runUp(index, ev.minute, usual) : null
  return (
    <li className="border-b border-rule py-2.5 last:border-b-0 last:pb-0">
      <p className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 font-display text-ui font-medium text-ink">{ev.label}</span>
        <span className="shrink-0 text-fine tabular-nums text-ink-2">{clock(ev.minute)}</span>
      </p>
      {r ? (
        <div className="mt-1.5 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-ui font-semibold tabular-nums leading-none text-ink">
              {r.points >= 0 ? '+' : ''}{Math.round(r.points)} points</p>
            <p className="mt-1 text-fine text-ink-2">{runUpLine(r, ev.minute)}</p>
          </div>
          <RunUpLine day={index} usual={usual} from={r.from} to={r.to}/>
        </div>
      ) : children}
    </li>
  )
}

export function RunUpCard({ className }) {
  const [mode] = useMode()
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const demo = mode === 'demo'
  const d = demo ? demoDay() : null
  const events = demo ? d.events : eventsOn(dayKey())
  return (
    <Panel className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHead title="Before Your Events" meta={demo ? 'demo' : 'today'} className="min-w-0 flex-1"/>
        <Why label="What the run-up means" className="pt-1.5">
          Each line is the two hours before the event. Points are the rise against your usual.
        </Why>
      </div>
      {events.length ? (
        <ul className="m-0 mt-1 list-none p-0">
          {events.map((ev, i) => (
            <EventRow key={ev.id || i} ev={ev} index={d?.index} usual={d?.usual}>
              <p className="mt-1 text-fine text-ink-2">Wear the patch to see the run-up.</p>
            </EventRow>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-meta text-ink">No events marked today.</p>
      )}
      <p className="note mt-2.5 border-t border-rule pt-2.5">
        Marked on the calendar. Never shared with anyone.</p>
    </Panel>
  )
}

export default SettleCard
