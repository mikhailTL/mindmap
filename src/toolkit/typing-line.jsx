import React from 'react'
import { cn } from '../lib/utils'
import { ArrowRight, Wave } from '../ui/marks'
import { OnDevice } from './shell'
import { recorder, fastBurst, MIN_KEYS } from '../signals/typing'
import { addTyping, listTyping } from '../app/store'

/* Typing rhythm, under MindMap's own text fields and nowhere else.
 *
 * WHAT RUNS. `useTypingRecorder` wraps `recorder()` from src/signals/typing.js:
 * every key down is handed to it as a timestamp and a deletion flag, never the
 * key. Every fourth key the last twelve are summarised into `rhythm`; the
 * summary of the whole field session is stored by `finish()` when the note or
 * check-in is sent. Nothing else is kept and nothing leaves the device.
 *
 * WHAT IT SAYS. `TypingLine` is silent until eight keys are in, and stays
 * silent unless the burst is well under the student's own usual gap. Then it
 * offers thirty seconds of breathing, once, with a one-tap yes and an easy
 * no. No streak, no judgement, no comparison with anyone else. */

const SESSION_KEY = 'mindmap.typing.keepGoing'
let keepGoing = false

function readDismiss() {
  if (keepGoing) return true
  try { return sessionStorage.getItem(SESSION_KEY) === '1' } catch { return false }
}
function writeDismiss() {
  keepGoing = true
  try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}
}

export function useTypingRecorder() {
  const rec = React.useRef(null)
  if (!rec.current) rec.current = recorder()
  const count = React.useRef(0)
  const [rhythm, setRhythm] = React.useState(null)

  const onKeyDown = React.useCallback(e => {
    rec.current.key(e)
    count.current += 1
    if (count.current % 4 === 0) setRhythm(rec.current.recent(12))
  }, [])

  const finish = React.useCallback(() => {
    addTyping(rec.current.summary())
    rec.current.reset()
    count.current = 0
    setRhythm(null)
  }, [])

  return { onKeyDown, finish, rhythm }
}

const SMALL = cn(
  'inline-flex min-h-[44px] items-center gap-1.5 rounded-field border px-3',
  'font-display text-ui font-semibold transition-colors duration-150 ease-[var(--ease-out)]'
)

export function TypingLine({ rhythm, usual, onBreath, className }) {
  const [shown, setShown] = React.useState(false)
  const [gone, setGone] = React.useState(readDismiss)

  const ready = !!rhythm && rhythm.ok && rhythm.keys >= MIN_KEYS
  const fast = ready && fastBurst(rhythm.medianGap, usual)

  React.useEffect(() => {
    if (!rhythm) setShown(false)
    else if (fast) setShown(true)
  }, [rhythm, fast])

  if (!ready || gone || !shown) return null

  function keep() { writeDismiss(); setGone(true) }

  return (
    <div aria-live="polite" className={cn('mt-2 flex flex-wrap items-center gap-x-3 gap-y-2', className)}>
      <p className="text-fine text-ink-2">
        You are typing faster than usual. Take 30 seconds to breathe first?
      </p>
      <div className="flex gap-2">
        <a href="#/toolkit-breathing" onClick={onBreath}
          className={cn(SMALL, 'border-ink bg-card text-ink hoverOnly:bg-mist')}>
          <Wave className="size-4"/>Thirty seconds
        </a>
        <button type="button" onClick={keep}
          className={cn(SMALL, 'border-rule bg-transparent text-ink-2 hoverOnly:text-ink')}>
          <ArrowRight className="size-4"/>Keep going
        </button>
      </div>
    </div>
  )
}

/* The last fourteen field sessions as a strip of median gaps, oldest on the
   left. A taller bar is a longer gap between keys. Each bar carries its figure
   for a screen reader; the strip is never the only thing saying the value. */
export function TypingWeek({ className }) {
  const rows = listTyping().slice(0, 14).reverse()
  const max = rows.reduce((a, r) => Math.max(a, r.medianGap), 0) || 1
  return (
    <section className={cn('rounded-panel border border-rule bg-card p-4', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display font-bold text-ink">Typing Rhythm</h3>
        <span className="font-display text-ui font-semibold tabular-nums text-ink-2">
          {rows.length} {rows.length === 1 ? 'session' : 'sessions'}
        </span>
      </div>
      <ul aria-label="Median gap between keys, last fourteen sessions"
        className="mt-3 flex h-12 items-end gap-1">
        {rows.map((r, i) => (
          <li key={r.at + i} className="flex h-full w-4 items-end">
            <span className="block w-full rounded-bar bg-accent"
              style={{ height: Math.max(8, Math.round(r.medianGap / max * 100)) + '%' }}/>
            <span className="sr-only">{Math.round(r.medianGap)} ms</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-fine text-ink-3">{"Measured only in MindMap's own text boxes."}</p>
      <OnDevice className="mt-1">Records the time between keys, never what you type.</OnDevice>
    </section>
  )
}
