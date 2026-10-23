import React from 'react'
import * as C from '@radix-ui/react-collapsible'
import { Chevron } from '../ui/marks'
import { Hint, Step, riseAt } from './panel'
import { SENSOR_ORDER, SENSORS } from '../lib/sensors'
import { cn } from '../lib/utils'
import { SCORE } from '../lib/terms'

// Reading the Mind Score: what goes into the score, and the things parents look for that it does not contain.
const CARRIES = [
  ...SENSOR_ORDER.map(id => ({ k: SENSORS[id].name, v: SENSORS[id].short })),
  { k: 'One number a day', v: `The ${SCORE}, 0 to 100, for each of the last 14 days.` },
  { k: 'Compared to their usual', v: 'Each value is compared to your teen’s own usual levels, never to other teens.' },
]

const CARRIES_NOT = [
  { k: 'What happened', v: 'No events or reasons. A test and a fight with a friend look the same.' },
  { k: 'What was said', v: 'Your teen’s notes are private and never shown to a parent.' },
  { k: 'Where they were', v: 'Location is never shared with a parent.' },
  { k: 'Who they were with', v: 'No one else is named, and your teen is never compared with other students.' },
  { k: 'Hour by hour detail', v: 'No hours, moments or raw readings. One value per day only.' },
]

const CLAIMS = [
  { q: 'A high stretch means something is wrong at school.',
    verdict: 'It cannot say',
    a: 'The score rises with anything the body treats as load: a test, a fight with a friend, a cold, short nights or a hard training week. It cannot tell you which one.' },
  { q: 'A high stretch means my teen is not coping.',
    verdict: 'No',
    a: 'A rise above their usual shows more load. It does not show whether they are handling it. Many hard weeks are handled well.' },
  { q: 'A calm stretch means everything is fine.',
    verdict: 'Not on its own',
    a: 'Two calm weeks with one bad day still average out as calm. The number does not show what happened on that day.' },
  { q: 'The number tells me whether to worry.',
    verdict: 'Your call',
    a: 'It shows how your teen’s body responded compared to their usual. You know things about your teen that the patch does not.' },
  { q: 'If I can see their Trends, I do not need to ask.',
    verdict: 'No',
    a: 'The score is four signals and a baseline. It does not show what happened, what was said or who was there. Only asking can tell you that.' },
  { q: 'A run of high days means I should check the app more often.',
    verdict: 'No',
    a: 'Checking more often does not change those days. The app is meant for one look, then a conversation.' },
]

function Column({ title, rows, lit }) {
  return (
    <div className={cn('rounded-[18px] border p-3.5',
      lit ? 'kit-ground border-transparent' : 'border-rule bg-card')}>
      <p className={cn('font-display text-tick font-bold', lit ? 'kit-ink' : 'text-ink-2')}>{title}</p>
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
      <p className="max-w-[54ch] text-sec text-ink-2">The {SCORE} is a simple score calculated from body signals or in-app readings to measure
        stress consistently, 0 calm to 100 peak. Here is what it shows and what it does not.</p>

      <Step className="mt-5">What you see</Step>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Column title={`${CARRIES.length} things it shows`} rows={CARRIES} lit/>
        <Column title={`${CARRIES_NOT.length} things it never shows`} rows={CARRIES_NOT}/>
      </div>
      <p className="note mt-2.5">The first list comes from the patch. A parent’s view never includes
        the second list, and no setting adds it.</p>

      <Step className="mt-6">Six common assumptions</Step>
      <div className="mt-3 border-t border-rule">
        {CLAIMS.map(c => (
          <C.Root key={c.q} className="border-b border-rule">
            <C.Trigger
              className={cn('group flex min-h-[56px] w-full items-center gap-3 py-3 text-left',
                'transition-colors duration-150 hoverOnly:text-accent-ink')}>
              <Chevron aria-hidden className="kit-ink size-3.5 shrink-0 transition-transform
                duration-200 ease-[var(--ease-out)] group-data-[state=open]:rotate-90"/>
              <span className="min-w-0 flex-1 text-body text-ink">{c.q}</span>
              <span className="kit-ink shrink-0 whitespace-nowrap font-display text-ui font-bold">{c.verdict}</span>
            </C.Trigger>
            <C.Content className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
              <p className="max-w-[56ch] pb-4 pl-6 text-sec text-ink-2">{c.a}</p>
            </C.Content>
          </C.Root>
        ))}
      </div>
      <Hint className="mt-4">The app does not diagnose.</Hint>
    </div>
  )
}
