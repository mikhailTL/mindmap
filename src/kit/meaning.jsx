import React from 'react'
import * as C from '@radix-ui/react-collapsible'
import { Chevron } from '../ui/marks'
import { Hint, Step, riseAt } from './panel'
import { SENSOR_ORDER, SENSORS } from '../lib/sensors'
import { cn } from '../lib/utils'
import { SCORE } from '../lib/terms'

/* Reading the Mind Score. Six things a parent reads into a high fortnight, and
 * what the reading can actually support.
 *
 * THE LEDGER. Every answer below is a version of one fact, so the fact is
 * drawn once at the top: the four things measured, the one number they become,
 * and the five things a parent will look for in it that are not in there. Both
 * columns are the real data model rather than a reassurance. The left one is
 * src/lib/sensors.js and the right one is the consent model the parent view
 * already enforces, which is why it can be stated this flatly.
 *
 * The answers open as a height transition rather than appearing, because six
 * rows that jump the page down as they open is the reader losing their place
 * six times. Radix supplies the measured height; the two keyframes are the
 * site's own, so a toolkit disclosure opens at the same speed as every other
 * one. Reduced motion collapses them to their end state and the row is simply
 * open. */

const CARRIES = [
  ...SENSOR_ORDER.map(id => ({ k: SENSORS[id].name, v: SENSORS[id].short })),
  { k: 'One number a day', v: `The ${SCORE}, 0 to 100, for each of the fourteen days.` },
  { k: 'Her own normal', v: 'Every value is a distance from her baseline, not from anybody else’s.' },
]

const CARRIES_NOT = [
  { k: 'What happened', v: 'No event, no subject, no reason. A test and a fallout look identical.' },
  { k: 'What was said', v: 'Notes are hers. They are never on a parent’s screen in any form.' },
  { k: 'Where she was', v: 'Location is never shared with a parent.' },
  { k: 'Who she was with', v: 'Nobody else is named, and she is never set beside another student.' },
  { k: 'Anything finer than a day', v: 'No hours, no moments, no raw reading. One value per day is the floor.' },
]

const CLAIMS = [
  { q: 'A high week means something is wrong at school.',
    verdict: 'It cannot say',
    a: 'The score moves with whatever the body treats as load: a test, a fallout, a cold, three short nights, a hard training week. It has no way of telling you which of those it was.' },
  { q: 'A high week means she is not coping.',
    verdict: 'No',
    a: 'A rise above her own baseline is a measurement of load, not of whether she is handling it. Plenty of weeks are heavy and handled.' },
  { q: 'A calm week means everything is fine.',
    verdict: 'Not on its own',
    a: 'A quiet fortnight with one bad Tuesday averages out to a quiet fortnight. The number does not know what was said to her on Tuesday.' },
  { q: 'The number tells me whether to worry.',
    verdict: 'Yours to decide',
    a: 'It tells you what her body did against her own normal. Whether that is worth worrying about is a judgement about your teenager, and you have information the patch does not.' },
  { q: 'If I can see the week, I do not need to ask.',
    verdict: 'No',
    a: 'Four signals and a baseline. Nothing about what happened, nothing about what was said, nobody named. Asking is the only route to any of that.' },
  { q: 'A high week means I should check the app more often.',
    verdict: 'No',
    a: 'Checking more often changes nothing in the week and changes what the app is for. It was built for one look, and for the conversation that follows it.' },
]

function Column({ title, rows, lit }) {
  return (
    <div className={cn('rounded-panel border bg-aqua p-3.5',
      lit ? 'border-accent/45' : 'border-rule')}>
      <p className={cn('font-display text-tick font-bold', lit ? 'text-accent' : 'text-ink-2')}>{title}</p>
      <dl className="m-0 mt-2">
        {rows.map((r, i) => (
          <div key={r.k} style={riseAt(i)} className="kit-rise border-t border-rule py-2 first:border-t-0">
            <dt className="font-display text-ui font-bold text-ink">{r.k}</dt>
            <dd className="m-0 mt-0.5 max-w-[42ch] text-fine text-ink-2">{r.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function Meaning() {
  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">The {SCORE} is four signals measured against your
        teenager’s own fortnight. Here is what that will and will not carry.</p>

      <Step className="mt-5">What a fortnight on your screen is made of</Step>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Column title={`${CARRIES.length} things it carries`} rows={CARRIES} lit/>
        <Column title={`${CARRIES_NOT.length} things it does not`} rows={CARRIES_NOT}/>
      </div>
      <p className="note mt-2.5">The left column is the patch. The right one is not missing by
        accident: a parent’s view never holds any of it, and no setting adds it.</p>

      <Step className="mt-6">Six things parents read into a high fortnight</Step>
      <div className="mt-3 border-t border-rule">
        {CLAIMS.map(c => (
          <C.Root key={c.q} className="border-b border-rule">
            <C.Trigger
              className={cn('group flex min-h-[56px] w-full items-center gap-3 py-3 text-left',
                'transition-colors duration-150 hoverOnly:text-accent-ink')}>
              <Chevron aria-hidden className="size-3.5 shrink-0 text-accent transition-transform
                duration-200 ease-[var(--ease-out)] group-data-[state=open]:rotate-90"/>
              <span className="min-w-0 flex-1 text-body text-ink">{c.q}</span>
              <span className="shrink-0 whitespace-nowrap rounded-field border border-rule bg-mist
                px-2 py-0.5 font-display text-fine font-bold text-ink-2">{c.verdict}</span>
            </C.Trigger>
            <C.Content className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
              <p className="max-w-[56ch] pb-4 pl-6 text-sec text-ink-2">{c.a}</p>
            </C.Content>
          </C.Root>
        ))}
      </div>
      <Hint className="mt-4">None of this is a diagnosis and the app does not make one.</Hint>
    </div>
  )
}
