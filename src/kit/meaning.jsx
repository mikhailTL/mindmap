import React from 'react'
import { Chevron } from '../ui/marks'
import { Hint } from './panel'
import { cn } from '../lib/utils'
import { SCORE } from '../lib/terms'

/* Six things a parent reads into a high week, and what the reading can
 * actually support. Tap one, get the plain answer. */

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

export function Meaning() {
  const [open, setOpen] = React.useState(null)
  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">The {SCORE} is four signals measured against your
        teenager's own fortnight. Here is what that will and will not carry.</p>

      <div className="mt-5 border-t border-rule">
        {CLAIMS.map((c, i) => {
          const on = open === i
          return (
            <div key={c.q} className="border-b border-rule">
              <button type="button" aria-expanded={on} onClick={() => setOpen(o => (o === i ? null : i))}
                className={cn('flex min-h-[56px] w-full items-center gap-3 py-3 text-left',
                  'transition-colors duration-150 hoverOnly:text-accent-ink')}>
                <Chevron aria-hidden className={cn('size-3.5 shrink-0 text-accent',
                  'transition-transform duration-200 ease-[var(--ease-out)]', on && 'rotate-90')}/>
                <span className="min-w-0 flex-1 text-body text-ink">{c.q}</span>
                <span className="shrink-0 whitespace-nowrap font-display text-fine font-bold text-ink-2">
                  {c.verdict}
                </span>
              </button>
              {on && <p className="max-w-[56ch] pb-4 pl-6 text-sec text-ink-2">{c.a}</p>}
            </div>
          )
        })}
      </div>
      <Hint className="mt-4">None of this is a diagnosis and the app does not make one.</Hint>
    </div>
  )
}
