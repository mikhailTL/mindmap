import React from 'react'
import { Button } from '../ui/button'
import { Bin } from '../ui/marks'
import { Meter } from './shell'
import { cn } from '../lib/utils'
import { useMode } from '../lib/mode'
import { clearReach, getReach, getVersion, setReachOn, subscribe } from '../app/store'
import { homePoint, reachWords, weeklyReach } from '../signals/reach'

/* Reach: a dashboard card for the Week pane. One number from a week of
   readings: how far from the student's own most common point they happened.
   The position is asked for only when a reading finishes (PhoneCheck.jsx),
   rounded before it is stored, and never leaves the device. No map, no place
   name. The card reads the `reach` slot and nothing else. */

export const REACH_LABEL = 'Only where you took readings. Never shared, never a map.'

/* Monday 00:00 local of the week holding `now`. */
export function weekStart(now = new Date()) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const back = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - back)
  return d.getTime()
}

const DEMO = { thisWeek: 4.2, lastWeek: 6.0, readings: 9 }

/* A ring with an arrow leaving it sideways: readings around home, and the
   farthest one. Sideways, so it never reads as a gender sign. Same 24 box and
   1.6 stroke as src/ui/marks. */
function ReachMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      className={cn('shrink-0', className)}>
      <circle cx="8.5" cy="12" r="5.5"/>
      <path d="M14 12h7.5M18 8.5l3.5 3.5-3.5 3.5"/>
    </svg>
  )
}

function Switch({ on, label, onClick }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick}
      className="inline-flex min-h-[44px] items-center gap-2.5 rounded-field px-1 text-left
        font-display text-ui font-semibold text-ink">
      <span aria-hidden
        className={cn('relative block h-7 w-[3.25rem] shrink-0 rounded-bar border',
          'transition-colors duration-150 ease-[var(--ease-out)] motion-reduce:transition-none',
          on ? 'border-accent-ink bg-accent' : 'border-ruling bg-mist')}>
        <span className={cn('absolute left-[3px] top-[3px] block size-5 rounded-chip border bg-card',
          'transition-transform duration-150 ease-[var(--ease-out)] motion-reduce:transition-none',
          on ? 'translate-x-[1.5rem] border-accent-ink' : 'translate-x-0 border-ink-3')}/>
      </span>
      <span>{label}</span>
    </button>
  )
}

function Bars({ thisKm, lastKm }) {
  const top = Math.max(thisKm ?? 0, lastKm ?? 0) || 1
  const right = km => (km == null ? 'none' : `${km.toFixed(1)} km`)
  return (
    <div className="mt-3 grid gap-3">
      <Meter label="This week" value={(thisKm ?? 0) / top} right={right(thisKm)}/>
      <Meter label="Last week" value={(lastKm ?? 0) / top} right={right(lastKm)}/>
    </div>
  )
}

function Head() {
  return (
    <h2 className="mark flex items-center gap-2">
      <ReachMark/>
      <span>Reach</span>
    </h2>
  )
}

const CARD = 'rounded-panel border border-rule bg-card p-4 shadow-card'

export function ReachCard({ className }) {
  const [mode] = useMode()
  React.useSyncExternalStore(subscribe, getVersion, () => 0)

  if (mode === 'demo') {
    const words = reachWords({ farthestKm: DEMO.thisWeek }, { farthestKm: DEMO.lastWeek })
    return (
      <section className={cn(CARD, className)}>
        <Head/>
        <p className="mt-3 max-w-[40ch] text-meta text-ink">{words}</p>
        <Bars thisKm={DEMO.thisWeek} lastKm={DEMO.lastWeek}/>
        <p className="mt-3 text-fine text-ink-2">
          <span className="font-mono tabular-nums">{DEMO.readings}</span> readings with a position.
        </p>
        <p className="mt-1 text-fine text-ink-3">Demo figures.</p>
        <p className="mt-3 text-fine text-ink-2">{REACH_LABEL}</p>
      </section>
    )
  }

  const { on, items } = getReach()

  if (!on) {
    return (
      <section className={cn(CARD, className)}>
        <Head/>
        <p className="mt-3 text-meta text-ink">Reach is off.</p>
        <div className="mt-2">
          <Switch on={false} label="Turn on" onClick={() => setReachOn(true)}/>
        </div>
        <p className="mt-1 max-w-[40ch] text-fine text-ink-2">
          Asks your position only when you take a reading.
        </p>
        <p className="mt-3 text-fine text-ink-2">{REACH_LABEL}</p>
      </section>
    )
  }

  const now = Date.now()
  const start = weekStart(new Date(now))
  const home = homePoint(items)
  const thisWeek = weeklyReach(items, home, start, now + 1)
  const lastWeek = weeklyReach(items, home, start - 7 * 86400000, start)
  const words = reachWords(thisWeek, lastWeek)
  const n = items.length

  return (
    <section className={cn(CARD, className)}>
      <Head/>
      <p className="mt-3 max-w-[40ch] text-meta text-ink" aria-live="polite">{words}</p>
      <Bars thisKm={thisWeek.farthestKm} lastKm={lastWeek.farthestKm}/>
      <p className="mt-3 text-fine text-ink-2" aria-live="polite">
        <span className="font-mono tabular-nums">{n}</span> reading{n === 1 ? '' : 's'} with a position.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Switch on label="Turn off" onClick={() => setReachOn(false)}/>
        <Button variant="outline" size="sm" onClick={() => clearReach()} disabled={n === 0}>
          <Bin/> Clear
        </Button>
      </div>
      <p className="mt-3 text-fine text-ink-2">{REACH_LABEL}</p>
    </section>
  )
}

export default ReachCard
