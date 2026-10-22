import React from 'react'
import { LampFace } from '../../traffic/Face'
import { Chevron } from '../../ui/marks'
import { Panel, PanelHead } from '../Monitor'
import { cn } from '../../lib/utils'
import { LIGHT_MEANS, LIGHT_WORD, dayName, teenSignal } from './demoTeen'

const list = a => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`)

// The two most recent non-green days of the week, newest first, in the teen's own words.
function weekLines(days) {
  return days.filter(d => d.light !== 'green').slice(-2).reverse().map(d => {
    const what = d.signals.map(teenSignal)
    return `${dayName(d.date)} was ${d.light}${what.length ? `: ${list(what)}` : ''}.`
  })
}

export function WeekLamps({ days, size = 22, className }) {
  const read = days.map(d => `${dayName(d.date)} ${d.light}`).join(', ')
  return (
    <ol role="img" aria-label={`Heads Up for the last ${days.length} days: ${read}.`}
      className={cn('m-0 flex list-none items-end justify-between gap-1 p-0', className)}>
      {days.map((d, i) => (
        <li key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <LampFace light={d.light} size={size}/>
          <span className={cn('text-fine', i === days.length - 1 ? 'font-medium text-ink' : 'text-ink-3')}>
            {dayName(d.date).slice(0, 3)}</span>
        </li>
      ))}
    </ol>
  )
}

export function HeadsUpCard({ teen, go, className }) {
  const today = teen.days[teen.days.length - 1]
  const week = teen.days.slice(-7)
  const now = today.signals.map(teenSignal)
  const lines = weekLines(week)
  return (
    <Panel variant="tint" hue="sun" className={cn('flex flex-col', className)} aria-label="Heads Up">
      <PanelHead title="Heads Up" meta="how you used your phone"/>
      <div className="mt-3 flex items-center gap-3">
        <LampFace light={today.light} size={44} glow/>
        <div className="min-w-0">
          <p className="font-display text-row font-bold leading-tight text-ink">
            Today: {LIGHT_WORD[today.light]}</p>
          <p className="text-fine text-ink-2">{LIGHT_MEANS[today.light]}</p>
        </div>
      </div>
      {now.length > 0 && (
        <p className="mt-2 text-fine text-ink">Noticed today: {list(now)}.</p>
      )}
      <WeekLamps days={week} className="mt-4"/>
      <ul className="m-0 mt-2 list-none space-y-0.5 p-0 text-fine text-ink">
        {lines.length ? lines.map(l => <li key={l}>{l}</li>) : <li>All week looked like your usual.</li>}
      </ul>
      <p className="mt-2.5 max-w-[52ch] text-fine text-ink-2">
        You see this first. Your parent sees only the colour. On red, they also see the time and
        what was noticed, never an app, a message or a person.
      </p>
      {go && (
        <button type="button" onClick={() => go('heads-up')}
          className="group mt-2 flex min-h-[44px] w-full items-center gap-3 border-t border-sun/25 pt-2 text-left">
          <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink transition-colors
            duration-150 groupHoverOnly:text-accent-ink">How Heads Up works</span>
          <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
        </button>
      )}
    </Panel>
  )
}
