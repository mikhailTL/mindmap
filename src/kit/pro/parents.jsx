import React from 'react'
import { ActivityScreen, Sheet, Action } from '../../toolkit/shell'
import { CopyButton, Label } from './common'

const STEPS = [
  { name:'Before', lines:[
    'Ask the teen what they agree to share.',
    'Write down the two or three points.',
    'Tell the teen when the talk will happen.',
  ]},
  { name:'Open', lines:[
    'Thank the parent for making time.',
    'Say what you will cover, and for how long.',
    'Say what stays private, and why.',
  ]},
  { name:'Share', lines:[
    'Describe patterns, not single numbers.',
    'Say what the readings cannot tell anyone.',
    'Name one strength you see in their teen.',
  ]},
  { name:'Plan', lines:[
    'Agree one small thing to try at home.',
    'Agree who checks in, and when.',
    'Ask what support the parent needs.',
  ]},
  { name:'Close', lines:[
    'Say when you will next update them.',
    'Give the local emergency number and 988.',
    'Tell the teen afterwards what was said.',
  ]},
]

const HELPS = [
  '“Here is what I am seeing, and what I am not.”',
  '“What have you noticed at home?”',
  '“This is a pattern to watch, not a label.”',
]

const plain = () => STEPS.map((s, i) => `${i + 1}. ${s.name}\n` + s.lines.map(l => `[ ] ${l}`).join('\n')).join('\n\n')

export function TalkingWithParents({ onBack }) {
  const [at, setAt] = React.useState(0)
  const [ticks, setTicks] = React.useState({})
  const s = STEPS[at]
  const flip = k => setTicks(t => ({ ...t, [k]: !t[k] }))
  const doneIn = i => STEPS[i].lines.every((_, j) => ticks[`${i}.${j}`])

  return (
    <ActivityScreen id="pro-parents" title="Talking With Parents" onBack={onBack}>
      <Sheet>
        <nav aria-label="Steps" className="-mx-1 overflow-x-auto px-1 pb-1">
          <ol className="m-0 flex min-w-max list-none gap-2 p-0">
            {STEPS.map((x, i) => {
              const on = i === at, full = doneIn(i)
              return (
                <li key={x.name}>
                  <button type="button" aria-current={on ? 'step' : undefined} onClick={() => setAt(i)}
                    className={'flex min-h-[48px] items-center gap-2 rounded-[12px] border px-3.5 font-display ' +
                      'text-ui transition-colors duration-150 ' +
                      (on ? 'kit-fill border-transparent font-bold text-white'
                          : 'kit-hoverable border-rule bg-card font-semibold text-ink')}>
                    <span aria-hidden className={'grid size-6 place-items-center rounded-full text-fine font-bold ' +
                      (on ? 'bg-white/20' : full ? 'kit-fill text-white' : 'kit-ground kit-ink')}>
                      {full && !on ? '✓' : i + 1}
                    </span>
                    {x.name}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <Label className="mt-6">{at + 1}. {s.name}</Label>
        <ul className="m-0 mt-3 flex list-none flex-col gap-2.5 p-0">
          {s.lines.map((l, j) => {
            const k = `${at}.${j}`, on = !!ticks[k]
            return (
              <li key={k}>
                <label className={'flex min-h-[56px] cursor-pointer items-center gap-3 rounded-[14px] border px-4 py-3 ' +
                  (on ? 'kit-ground border-transparent' : 'kit-hoverable border-rule bg-card')}>
                  <input type="checkbox" checked={on} onChange={() => flip(k)}
                    className="size-5 shrink-0 accent-[color:var(--kit-deep)]"/>
                  <span className={'text-body ' + (on ? 'text-ink-2' : 'text-ink')}>{l}</span>
                </label>
              </li>
            )
          })}
        </ul>

        <div className="mt-5 flex flex-wrap gap-3">
          <Action kind="quiet" disabled={at === 0} onClick={() => setAt(a => a - 1)}>Back</Action>
          {at < STEPS.length - 1
            ? <Action onClick={() => setAt(a => a + 1)}>Next: {STEPS[at + 1].name}</Action>
            : <Action onClick={() => { setTicks({}); setAt(0) }}>Clear and start over</Action>}
        </div>
      </Sheet>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Sheet>
          <Label>Lines that help</Label>
          <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0 text-sec text-ink">
            {HELPS.map(h => <li key={h}>{h}</li>)}
          </ul>
        </Sheet>
        <Sheet>
          <Label>Use it during the call</Label>
          <p className="mt-2 text-sec text-ink-2">Copies all five steps as a plain checklist.</p>
          <div className="mt-3"><CopyButton text={plain()} label="Copy checklist"/></div>
        </Sheet>
      </div>
      <p className="note mt-4 max-w-[64ch]">A parent sees only what the teen agreed to share, as daily summaries.</p>
    </ActivityScreen>
  )
}
