import React from 'react'
import { demoDay, runUp } from '../../../signals/recovery'
import { TODAY } from '../../../lib/roster'
import { cn } from '../../../lib/utils'
import { Demo, DemoTag, Flow, Stage, clock, useSteps, useWidth } from './kit'
import { DayChart, pathOf } from './daychart'

/* Stress before events: the student marks a test in the calendar, and the
 * two hours before it are compared minute by minute with their usual for
 * those minutes. Both events and every figure are signals/recovery.js's demo
 * day and its runUp(). */

const DAY = demoDay()
const KIND = { test: 'Test', talk: 'Presentation' }
const EVENTS = DAY.events.map(e => ({ ...e, ...runUp(DAY.index, e.minute, DAY.usual) }))
const DATE = new Date(TODAY + 'T12:00:00Z')
const WEEKDAY = DATE.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
const DAYMONTH = `${DATE.getUTCDate()} ${DATE.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })}`
const HOLDS = [1400, 2600, 4000, 1400, 2600, 4000]

export default function EventsDemo() {
  const [ref, w] = useWidth()
  const wide = w >= 640
  const { step, reduced } = useSteps(ref, HOLDS)
  const which = reduced ? 0 : step < 3 ? 0 : 1
  const phase = reduced ? 2 : step % 3
  const ev = EVENTS[which]
  const from = ev.minute - 150, to = ev.minute + 15
  const chartW = wide ? Math.max(300, w - 240 - 32 - 16) : Math.max(260, w - 16)

  const label = `Stress before events, with the demo day. In: two events marked in the calendar, a
    ${EVENTS[0].label.toLowerCase()} at ${clock(EVENTS[0].minute)} and a ${EVENTS[1].label.toLowerCase()} at
    ${clock(EVENTS[1].minute)}. The chart compares the two hours before each with the usual for those minutes.
    Before the ${EVENTS[0].label.toLowerCase()} the climb began at ${clock(EVENTS[0].climbFrom)} and ran
    ${Math.round(EVENTS[0].points)} points above usual on average. Before the ${EVENTS[1].label.toLowerCase()} it
    began at ${clock(EVENTS[1].climbFrom)} and ran ${Math.round(EVENTS[1].points)} points above usual.`

  return (
    <Demo innerRef={ref} label={label}>
      <div className={cn('flex', wide ? 'flex-row items-stretch gap-1' : 'flex-col')}>
        <Stage n="1" title="Marked in the calendar" className={wide ? 'w-[220px]' : ''}>
          <div className="overflow-hidden rounded-[12px] border border-rule bg-card">
            <div className="border-b border-rule bg-sun-wash px-3 py-2">
              <p className="m-0 text-fine font-semibold text-sun-ink">{WEEKDAY}</p>
              <p className="m-0 font-display text-head font-bold leading-none text-ink">{DAYMONTH}</p>
            </div>
            <ul className="m-0 list-none p-0">
              {EVENTS.map((e, i) => (
                <li key={e.label} className={cn('flex items-center gap-3 border-b border-rule px-3 py-2.5 last:border-b-0 transition-colors duration-300',
                  i === which ? 'bg-sun-wash/60' : '')}>
                  <span aria-hidden className={cn('h-9 w-1 shrink-0 rounded-bar', i === which ? 'bg-sun' : 'bg-rule')}/>
                  <span className="min-w-0">
                    <span className="block text-ui font-bold leading-tight text-ink">{e.label}</span>
                    <span className="block text-fine text-ink-2">{clock(e.minute)}, {KIND[e.kind]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="m-0 mt-2 text-fine leading-snug text-ink-2">Add a name, a day and a time.</p>
        </Stage>

        <Flow wide={wide}/>

        <Stage n="2" title="The two hours before" className="flex-1">
          <div className="rounded-[12px] border border-rule bg-card p-2 pt-3">
            <DayChart w={chartW} h={wide ? 220 : 210} from={from} to={to}>
              {s => (
                <>
                  {/* the rise: the gap between today and usual, from the climb to the event */}
                  <path className="mm-dd-fade" style={{ opacity: phase >= 1 ? 1 : 0 }}
                    d={`${pathOf(DAY.index, ev.climbFrom, ev.minute, s.x, s.y, 1)}${(() => {
                      let d = ''
                      for (let m = ev.minute; m >= ev.climbFrom; m -= 1) d += `L${s.x(m).toFixed(1)} ${s.y(DAY.usual[m]).toFixed(1)}`
                      return d
                    })()}Z`} fill="#b5871b" fillOpacity="0.28"/>
                  <path d={pathOf(DAY.usual, from, to, s.x, s.y)} fill="none" stroke="#426a58" strokeWidth="1.8" strokeDasharray="5 4"/>
                  <text x={s.x(from) + 6} y={s.y(DAY.usual[from]) + 18} fontSize="12" fill="#426a58">Your usual</text>
                  <path key={ev.label} pathLength="1" d={pathOf(DAY.index, from, to, s.x, s.y)} fill="none" stroke="#b5871b"
                    strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" className="mm-dd-drawk"/>
                  <path d={`M${s.x(ev.minute)} ${s.top - 4}V${s.bottom}`} stroke="#0d2b1e" strokeWidth="1.6"/>
                  <text x={s.x(ev.minute) - 6} y={s.top + 8} textAnchor="end" fontSize="13" fontWeight="700" fill="#0d2b1e">
                    {ev.label}</text>
                  <g className="mm-dd-fade" style={{ opacity: phase >= 1 ? 1 : 0 }}>
                    <path d={`M${s.x(ev.climbFrom)} ${s.y(DAY.usual[ev.climbFrom]) + 6}V${s.top + 34}`} stroke="#825d07" strokeWidth="1.6" strokeDasharray="3 3"/>
                    <circle cx={s.x(ev.climbFrom)} cy={s.y(DAY.index[ev.climbFrom])} r="4.5" fill="#825d07"/>
                    <text x={s.x(ev.climbFrom) - 6} y={s.top + 30} textAnchor="end" fontSize="12" fontWeight="600" fill="#825d07">
                      Climb began</text>
                  </g>
                </>
              )}
            </DayChart>
          </div>
        </Stage>
      </div>

      <div className={cn('mm-dd-fade mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2',
        phase >= 2 ? 'opacity-100' : 'opacity-0')}>
        <div className="flex gap-6">
          <div>
            <p className="m-0 text-fine text-ink-2">Climb began</p>
            <p className="m-0 font-display text-row font-bold tabular-nums text-ink">{clock(ev.climbFrom)}</p>
          </div>
          <div>
            <p className="m-0 text-fine text-ink-2">Above usual, on average</p>
            <p className="m-0 font-display text-row font-bold tabular-nums text-sun-ink">+{Math.round(ev.points)} points</p>
          </div>
        </div>
        <p className="m-0 max-w-[30ch] text-fine leading-snug text-ink">
          A {ev.label.toLowerCase()} with a {Math.round(ev.minute - ev.climbFrom)} minute run up.
        </p>
      </div>
      <DemoTag className="mt-2"/>
    </Demo>
  )
}
