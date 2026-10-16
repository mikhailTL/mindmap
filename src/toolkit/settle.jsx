import React from 'react'
import { Panel, PanelHead, Why } from '../views/Monitor'
import { cn } from '../lib/utils'
import { useMode } from '../lib/mode'
import { eventsOn, getVersion, subscribe } from '../app/store'
import { dailySettle, demoDay, runUp, settleWords } from '../signals/recovery'
import { clock12 } from '../views/reading/demo'

/* One dashboard card from the continuous patch stream: how long the body
 * took to settle after each peak today, and under a rule how far it had
 * climbed before each event the student marked. All of it comes from
 * src/signals/recovery.js and nothing here invents a figure: in the demo the
 * series is demoDay(), in real mode there is no patch stream yet and the card
 * says so.
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
      <figcaption className="sr-only">Each bar runs from a peak until the body settled.</figcaption>
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

const WHY = 'Minutes from a peak to halfway back to usual. Slower settling goes with worry in studies of teenagers. MindMap shows the minutes, never a diagnosis.'

/* One marked event as one short row: the label and clock, then the rise
   against usual in the two hours before it and when the climb began. */
function eventLine(ev, index, usual) {
  if (!index) return null
  const r = runUp(index, ev.minute, usual)
  if (r.points < 1 || r.climbFrom >= r.to) return 'near usual before'
  return `+${Math.round(r.points)} points, climb from ${clock(r.climbFrom)}`
}

function EventRows({ events, index, usual }) {
  if (!events.length) return null
  return (
    <ul className="m-0 mt-3 list-none border-t border-rule p-0 pt-2.5">
      {events.map((ev, i) => {
        const line = eventLine(ev, index, usual)
        return (
          <li key={ev.id || i} className="py-1 text-fine tabular-nums text-ink-2">
            <span className="font-display text-ui font-medium text-ink">
              {ev.label}, {clock(ev.minute)}{line ? ':' : ''}</span>
            {line && <> {line}</>}
          </li>
        )
      })}
      <li className="note mt-1.5">Marked events never leave this phone.</li>
    </ul>
  )
}

export function SettleCard({ className }) {
  const [mode] = useMode()
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  if (mode !== 'demo') {
    return (
      <Panel className={className}>
        <PanelHead title="How Your Body Settles" meta="patch"/>
        <p className="mt-3 text-meta text-ink">No patch readings today.</p>
        <EventRows events={eventsOn(dayKey())}/>
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
        {[['Peaks today', day.events], ['Carried over', day.unsettled]].map(([label, n]) => (
          <div key={label} className="min-w-0">
            <dt className="tick">{label}</dt>
            <dd className="m-0 mt-0.5 font-display text-row font-medium tabular-nums leading-none
              text-ink">{n}</dd>
          </div>
        ))}
      </dl>
      <EventRows events={d.events} index={d.index} usual={d.usual}/>
    </Panel>
  )
}

export default SettleCard
