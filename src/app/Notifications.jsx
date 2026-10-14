import React from 'react'
import { ScrollIn } from '../ui/motion'
import { cn } from '../lib/utils'
import { SeeDetails, Why } from '../views/Monitor'
import { SCORE } from '../lib/terms'
import { Chips, ChoiceRows, Panel, SwitchRow, TimeField } from './controls'
import {
  DAYS, LOCK_COPY, LOCK_LEVELS, getNotify, getVersion, lockLine, setNotify, subscribe,
} from './store'

/* Reminder settings.
 *
 * Four questions and no fifth: whether to be reminded at all, on which days,
 * at what time, and what the phone may put on a locked screen. Every default
 * is the quietest answer the control offers, and the master switch starts off.
 *
 * What is deliberately not here: a streak, a count of days in a row, a tally
 * of readings missed, a second reminder sent because the first was ignored,
 * and any copy that treats a skipped day as a failure. A reminder that keeps
 * score is not a reminder.
 *
 * The lock screen preview is built by store.js's lockLine() from the live
 * setting rather than written out per option, so the sample cannot drift from
 * the thing that was chosen.
 *
 * Design spec 0f: 15 to 45 words above the fold. Every row is its label; the
 * hints and the delivery note sit behind a "?" on each panel, and the four
 * promises about what a reminder is not sit behind one disclosure.
 */

const DAY_CHIPS = DAYS.map(d => ({ value: d.n, label: d.short, full: d.full }))

/* Short labels for the three levels. store.js keeps the long ones, which
   the "?" shows beside their hints. */
const LOCK_SHORT = { name: 'Name only', plain: 'Plain reminder', score: `Reminder and ${SCORE}` }
const LOCK_WHY = {
  name: 'Only the app name shows.',
  plain: 'One neutral line. No figure.',
  score: `Your ${SCORE}, readable without unlocking.`,
}
const LOCK_OPTIONS = LOCK_LEVELS.map(v => ({ value: v, label: LOCK_SHORT[v] || LOCK_COPY[v].label }))

/* The four promises. One line each, none a paragraph. */
const PROMISES = [
  ['A reminder', 'A line on your phone, at your time.'],
  ['Not a score', 'No streaks, no tallies, no awards.'],
  ['Not a check', 'A missed day is never mentioned.'],
  ['Not a message', 'Turning reminders on or off tells nobody.'],
]

/* 20:30 reads as 8:30 pm here, because nothing else in the app speaks in 24
   hours. The field itself stays on the browser's own clock. */
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

/* The preview. A phone's own lock screen, drawn with the tokens this project
   already has: one rule, no gradient and no blur. It is on `ink` because a
   locked phone is dark and drawing it on `card` would not read as one; it is
   a figure inside a card rather than the page's ink band, which section 6 of
   the design spec allows one of and this screen does not use.
   It updates as the choice changes, which is the whole reason it is here. */
function LockPreview({ settings, score }) {
  const line = lockLine(settings, score)
  const [app, ...rest] = line.split(' · ')
  return (
    <div className="rounded-panel border border-ink-3 bg-ink p-4">
      <p className="text-center font-mono text-stat tabular-nums text-paper">
        {spoken(settings.time).replace(/ (am|pm)$/, '')}
      </p>
      {/* The chosen days, not the first of them: a Monday-to-Friday choice
          previewed as "Monday" reads as a reminder that comes once. */}
      <p className="mt-0.5 text-center text-fine text-mist">
        {cap(dayPhrase(settings.days))}
      </p>
      <div className="mt-3 rounded-field border border-ink-2 bg-ink-2/60 px-3 py-2.5">
        <p className="font-display text-fine font-bold text-paper">{app}</p>
        <p className="mt-0.5 text-fine text-mist">
          {rest.length ? rest.join(' · ') : 'Name only.'}
        </p>
      </div>
    </div>
  )
}

/**
 * The reminder screen.
 *
 * Props
 *   score      number | null  Optional. A reading to print in the lock screen
 *                             preview when the top setting is chosen. With
 *                             none, the preview says the figure is ready
 *                             rather than inventing one. Pass the screen's own
 *                             demo score, or leave it out.
 *   className  string         Optional.
 *
 * Mount at: the student app, as a new route `app-notify`, tab label
 * "Reminders", inside <SectionShell>. It is a settings screen rather than a
 * reading, so it belongs beside Sharing in APP_NAV.student rather than on
 * Today.
 */
export function NotificationSettings({ score = null, className }) {
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const s = getNotify()

  const toggleDay = n => {
    const next = s.days.includes(n) ? s.days.filter(d => d !== n) : [...s.days, n]
    /* Clearing the last day would be a reminder that never arrives. Off is
       the honest way to say that, so that is what it does. */
    if (!next.length) setNotify({ on: false })
    else setNotify({ days: next })
  }

  return (
    <div className={cn('min-w-0', className)}>
      <ScrollIn>
        <Panel title="Reminders"
          aside={s.on ? `${spoken(s.time)}, ${dayPhrase(s.days)}` : 'Off'}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-rule px-4 py-2">
            <Why label="How reminders work" className="ml-auto">
              <ul className="m-0 list-disc pl-4">
                <li>One reminder, at the time you pick.</li>
                <li>Off until you turn them on.</li>
                <li>Held overnight, a reminder waits until morning.</li>
                <li>No reminder reaches a parent or a Medical Professional.</li>
                <li>In this build the choice is saved on the phone. Nothing is scheduled.</li>
              </ul>
            </Why>
          </div>
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
        </Panel>
      </ScrollIn>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:gap-4">
        <ScrollIn delay={0.05}>
          <Panel title="Lock screen text">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-rule px-4 py-2">
              <Why label="What each lock screen option shows" className="ml-auto">
                <p>A phone on a desk is read by anyone. The quietest option is the default.</p>
                <dl className="m-0 mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  {LOCK_LEVELS.map(v => (
                    <React.Fragment key={v}>
                      <dt className="font-medium text-ink">{LOCK_SHORT[v]}</dt>
                      <dd className="m-0">{LOCK_WHY[v]}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </Why>
            </div>
            <ChoiceRows label="What a reminder may say on a locked screen"
              value={s.lock} options={LOCK_OPTIONS} onChange={lock => setNotify({ lock })}/>
          </Panel>
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
