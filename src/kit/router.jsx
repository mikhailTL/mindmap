import React from 'react'
import { Choice, Hint, Step } from './panel'
import { vars, varsFamily } from './palette'

// A fixed table, five states by three lengths, maps two taps to up to two activities.
const STATES = [
  ['racing', 'Thoughts going fast'],
  ['wired',  'Keyed up, cannot sit still'],
  ['stuck',  'Stuck on one thought'],
  ['flat',   'Flat and heavy'],
  ['before', 'About to walk into something'],
]

const TIMES = [['1', 'A minute'], ['5', 'Five minutes'], ['15', 'Longer']]

const TABLE = {
  racing: { 1:['feelings'],        5:['pacer','feelings'], 15:['pacer','words'] },
  wired:  { 1:['pacer'],           5:['pacer'],            15:['pacer','senses'] },
  stuck:  { 1:['words'],           5:['words'],            15:['pile'] },
  flat:   { 1:['senses'],          5:['senses'],           15:['pile','feelings'] },
  before: { 1:['pacer'],           5:['pacer','feelings'], 15:['pacer','pile'] },
}

const WHY = {
  racing: 'Fast thinking narrows before it slows. A word for it first, then the breath.',
  wired:  'Energy in the body, so the body is where to start.',
  stuck:  'One sentence is doing the damage, so the sentence is the thing to look at.',
  flat:   'Nothing here will lift a flat day by force. The gentlest one first.',
  before: 'Minutes, not hours. Something that works sitting in a corridor.',
}

export function Router({ items, onOpen }) {
  const [state, setState] = React.useState(null)
  const [time, setTime] = React.useState(null)
  const picks = state && time ? TABLE[state][time] : null
  const names = Object.fromEntries(items.map(i => [i.id, i.title]))

  return (
    <section style={varsFamily('leaf')}
      className="kit-block kit-ground rounded-[18px] border border-rule p-5 sm:p-6">
      <h2 className="font-display text-head font-bold tracking-tight text-ink">Pick one for me</h2>
      <p className="mt-2 max-w-[48ch] text-sec text-ink-2">Two taps. Or skip this and read the list.</p>

      <Step className="mt-5">What it feels like right now</Step>
      <div className="mt-3 flex flex-wrap gap-2">
        {STATES.map(([id, label]) => (
          <Choice key={id} on={state === id} onClick={() => setState(s => (s === id ? null : id))}>
            {label}
          </Choice>
        ))}
      </div>

      <Step className="mt-5">How long have you got</Step>
      <div className="mt-3 flex flex-wrap gap-2">
        {TIMES.map(([id, label]) => (
          <Choice key={id} on={time === id} onClick={() => setTime(t => (t === id ? null : id))}>
            {label}
          </Choice>
        ))}
      </div>

      <div aria-live="polite" className="mt-5">
        {picks ? (
          <div className="rounded-[18px] border border-rule bg-card p-4">
            <p className="max-w-[48ch] text-sec text-ink-2">{WHY[state]}</p>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              {picks.map((id, n) => (
                <button key={id} type="button" onClick={() => onOpen(id)}
                  style={vars(id)}
                  className="kit-fill kit-card min-h-[48px] rounded-field border border-rule px-4
                    font-display text-ui font-bold text-paper">
                  {n === 0 ? 'Open' : 'Then'} {names[id]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sec text-ink-3">
            {state || time ? 'One more tap.' : 'Pick one from each row.'}
          </p>
        )}
      </div>

      <Hint className="mt-5">Fifteen answers written in advance, five states by three lengths. The
        same two taps always give the same one.</Hint>
    </section>
  )
}
