import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import { ActivityScreen, FIELD } from './shell'

/* Thought Reframe. Three fields and nothing else.
 *
 * What happened, what the reader told themselves, and another way to say it.
 * The reader writes all three; the page holds them until the screen closes
 * and never sends them anywhere. No word list, no marking, no explanation:
 * the owner asked for a form, and a form is what the reader operates. */

const FIELDS = [
  { id:'what', label:'What happened',          ph:'One line.' },
  { id:'told', label:'What I told myself',     ph:'Your sentence.' },
  { id:'else', label:'Another way to say it',  ph:'Fairer words.' },
]

export default function Reframe() {
  const [v, setV] = React.useState({ what:'', told:'', else:'' })
  const filled = Object.values(v).some(s => s.trim())
  return (
    <ActivityScreen family="leaf" title="Thought Reframe">
      <div className="grid gap-3 lg:grid-cols-3">
        {FIELDS.map((f, i) => (
          <label key={f.id} className={cn('rounded-panel border-2 border-ink p-3 sm:p-4',
            i === 2 ? 'bg-accent-wash' : 'bg-card')}>
            <span className="block font-display text-ui font-bold text-ink">{f.label}</span>
            <textarea className={cn(FIELD, 'mt-2 min-h-[7rem] resize-y lg:min-h-[12rem]')}
              value={v[f.id]} rows={3} placeholder={f.ph}
              onChange={e => setV(s => ({ ...s, [f.id]: e.target.value }))}/>
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" disabled={!filled}
          onClick={() => setV({ what:'', told:'', else:'' })}>Clear</Button>
        <span className="text-fine text-ink-3">Stays on this device.</span>
      </div>
    </ActivityScreen>
  )
}
