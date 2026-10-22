import React from 'react'
import { ScrollIn } from '../ui/motion'
import { cn } from '../lib/utils'
import { SeeDetails, Why } from '../views/Monitor'
import { SCORE, PRO_LC } from '../lib/terms'
import { Chips, ChoiceRows, Panel, SwitchRow, TimeField } from './controls'
import {
  DAYS, LOCK_COPY, LOCK_LEVELS, getNotify, getVersion, lockLine, setNotify, subscribe,
} from './store'

// Reminder settings. Every default is the quietest option; the lock-screen preview uses lockLine() from store.js.
const DAY_CHIPS = DAYS.map(d => ({ value: d.n, label: d.short, full: d.full }))

const LOCK_SHORT = { name: 'Name only', plain: 'Plain reminder', score: `Reminder and ${SCORE}` }
const LOCK_WHY = {
  name: 'Only the app name shows.',
  plain: 'One plain line, with no score.',
  score: `Your ${SCORE} shows without unlocking.`,
}
const LOCK_OPTIONS = LOCK_LEVELS.map(v => ({ value: v, label: LOCK_SHORT[v] || LOCK_COPY[v].label }))

const PROMISES = [
  ['One line', 'A reminder is one line, at your time.'],
  ['No streaks', 'There are no streaks, tallies or awards.'],
  ['Missed days', 'A missed day is never mentioned.'],
  ['Private', 'Turning reminders on or off tells nobody.'],
]

function spoken(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm
  const suffix = h < 12 ? 'am' : 'pm'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

const cap = str => str.charAt(0).toUpperCase() + str.slice(1)

function dayPhrase(days) {
  if (days.length === 7) return 'every day'
  const weekdays = [1, 2, 3, 4, 5]
  if (days.length === 5 && weekdays.every(n => days.includes(n))) return 'Monday to Friday'
  if (days.length === 2 && days.includes(6) && days.includes(0)) return 'at the weekend'
  const names = DAYS.filter(d => days.includes(d.n)).map(d => d.short)
  return names.length === 1 ? `on ${names[0]}` : `on ${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

function LockPreview({ settings, score }) {
  const line = lockLine(settings, score)
  const [app, ...rest] = line.split(' · ')
  return (
    <div className="rounded-panel border border-rule bg-[linear-gradient(160deg,#def0fc,#e9f6f1_55%,#d5f2e8)] p-4">
      <p className="text-center font-mono text-stat tabular-nums text-ink">
        {spoken(settings.time).replace(/ (am|pm)$/, '')}
      </p>
      <p className="mt-0.5 text-center text-fine text-ink-2">
        {cap(dayPhrase(settings.days))}
      </p>
      <div className="mt-3 rounded-field border border-white/80 bg-white/80 px-3 py-2.5
        shadow-[0_8px_20px_-14px_rgba(13,43,30,.4)] backdrop-blur-sm">
        <p className="font-display text-fine font-bold text-ink">{app}</p>
        <p className="mt-0.5 text-fine text-ink-2">
          {rest.length ? rest.join(' · ') : 'Name only.'}
        </p>
      </div>
    </div>
  )
}

/* Panel's frame with the Why button in its head row. */
function WhyPanel({ title, aside, why, whyLabel, children }) {
  return (
    <section className="overflow-hidden rounded-panel border border-rule bg-card">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-rule px-4 py-2.5">
        <h3 className="font-display text-meta font-bold text-ink">{title}</h3>
        {aside && <span className="ml-auto font-mono text-fine tabular-nums text-ink-3">{aside}</span>}
        <Why label={whyLabel} className={aside ? undefined : 'ml-auto'}>{why}</Why>
      </div>
      {children}
    </section>
  )
}

export function NotificationSettings({ score = null, className }) {
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const s = getNotify()

  const toggleDay = n => {
    const next = s.days.includes(n) ? s.days.filter(d => d !== n) : [...s.days, n]
    /* No days left means off. */
    if (!next.length) setNotify({ on: false })
    else setNotify({ days: next })
  }

  return (
    <div className={cn('min-w-0', className)}>
      <ScrollIn>
        <WhyPanel title="Reminders"
          aside={s.on ? `${spoken(s.time)}, ${dayPhrase(s.days)}` : 'Off'}
          whyLabel="How reminders work"
          why={
            <ul className="m-0 list-disc pl-4">
              <li>One reminder, at the time you pick.</li>
              <li>Hold overnight waits until morning.</li>
              <li>No reminder reaches a parent or a {PRO_LC}.</li>
              <li>This build saves your choice. Nothing is scheduled yet.</li>
            </ul>
          }>
          <SwitchRow
            label="Remind me"
            checked={s.on}
            onChange={on => setNotify({ on })}/>

          <div className={cn('border-t border-rule px-4 py-4',
            !s.on && 'opacity-60')}>
            <p className="font-display text-fine font-medium text-ink-2">Days</p>
            <Chips className="mt-2" label="Days to be reminded" options={DAY_CHIPS}
              selected={s.days} onToggle={toggleDay}/>
            <div className="mt-4 grid max-w-[22rem] gap-3 sm:grid-cols-2">
              <TimeField label="Time" value={s.time} onChange={time => setNotify({ time })}/>
            </div>
          </div>

          <SwitchRow
            label="Hold overnight"
            checked={s.hold}
            onChange={hold => setNotify({ hold })}/>
          <div className={cn('grid max-w-[22rem] gap-3 border-t border-rule px-4 py-4 sm:grid-cols-2',
            !s.hold && 'opacity-60')}>
            <TimeField label="From" value={s.holdFrom} disabled={!s.hold}
              onChange={holdFrom => setNotify({ holdFrom })}/>
            <TimeField label="Until" value={s.holdTo} disabled={!s.hold}
              onChange={holdTo => setNotify({ holdTo })}/>
          </div>
        </WhyPanel>
      </ScrollIn>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:gap-4">
        <ScrollIn delay={0.05}>
          <WhyPanel title="Lock Screen Text"
            whyLabel="What each lock screen option shows"
            why={<>
              <p>Anyone can read a phone on a desk.</p>
              <dl className="m-0 mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {LOCK_LEVELS.map(v => (
                  <React.Fragment key={v}>
                    <dt className="font-medium text-ink">{LOCK_SHORT[v]}</dt>
                    <dd className="m-0">{LOCK_WHY[v]}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </>}>
            <ChoiceRows label="What a reminder may say on a locked screen"
              value={s.lock} options={LOCK_OPTIONS} onChange={lock => setNotify({ lock })}/>
          </WhyPanel>
        </ScrollIn>

        <ScrollIn delay={0.1}>
          <Panel title="Preview">
            <div className="p-4">
              <LockPreview settings={s} score={score}/>
            </div>
          </Panel>
        </ScrollIn>
      </div>

      <ScrollIn delay={0.15}>
        <SeeDetails label="Reminder rules" className="mt-3 lg:mt-4">
          <ul className="m-0 list-none rounded-panel border border-rule bg-card p-0">
            {PROMISES.map(([k, v]) => (
              <li key={k} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 border-t
                border-rule px-4 py-3 first:border-t-0 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <span className="font-mono text-fine text-ink-3">{k}</span>
                <span className="max-w-[62ch] text-fine text-ink-2">{v}</span>
              </li>
            ))}
          </ul>
        </SeeDetails>
      </ScrollIn>
    </div>
  )
}
