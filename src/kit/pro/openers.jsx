import React from 'react'
import { ActivityScreen, Sheet, Choice } from '../../toolkit/shell'
import { CopyButton, Label, Lines } from './common'

/* Session Openers: pick the situation, get three first lines to choose from.
   Written to open a conversation, not to assess. */

const CASES = [
  { id:'first', pick:'First session', lines:[
    'Thanks for coming in. What would make today useful?',
    'You can skip any question. Just say pass.',
    'What should I know about you that is not on a form?',
  ]},
  { id:'follow', pick:'Follow-up', lines:[
    'How has this week been, in a word or two?',
    'What went better than you expected?',
    'Last time we talked about one thing. How has it gone?',
  ]},
  { id:'high', pick:'After a higher week', lines:[
    'Your readings ran higher than usual. What do you make of that?',
    'The numbers show a pattern, not a reason. What was going on?',
    'Was there one day that stood out?',
  ]},
  { id:'quiet', pick:'Teen is quiet', lines:[
    'We can sit for a minute first. No rush.',
    'Want to start with something easy, like music or school?',
    'You can point to a word instead of talking.',
  ]},
  { id:'parent', pick:'Parent in the room', lines:[
    'Before we start, what is OK to talk about here?',
    'Is there anything you want to tell just me later?',
    'Let us agree what we share with home today.',
  ]},
]

const AVOID = [
  'Why did you not tell anyone?',
  'You seem fine to me.',
  'Your score says you are stressed.',
]

export function SessionOpeners({ onBack }) {
  const [at, setAt] = React.useState('first')
  const [line, setLine] = React.useState(0)
  const c = CASES.find(x => x.id === at)

  return (
    <ActivityScreen id="pro-opener" title="Session Openers" onBack={onBack}>
      <Sheet>
        <Label>Situation</Label>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {CASES.map(x => (
            <Choice key={x.id} on={at === x.id} onClick={() => { setAt(x.id); setLine(0) }}>{x.pick}</Choice>
          ))}
        </div>

        <Label className="mt-7">Pick a first line</Label>
        <div role="radiogroup" aria-label="First lines" className="mt-3 grid gap-2.5">
          {c.lines.map((l, i) => {
            const on = line === i
            return (
              <button key={l} type="button" role="radio" aria-checked={on} onClick={() => setLine(i)}
                className={'flex min-h-[56px] w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left ' +
                  'transition-colors duration-150 ' +
                  (on ? 'kit-ground border-transparent' : 'kit-hoverable border-rule bg-card')}>
                <span aria-hidden className={'grid size-6 shrink-0 place-items-center rounded-full border-2 ' +
                  (on ? 'kit-edge' : 'border-ruling')}>
                  {on && <span className="kit-fill size-3 rounded-full"/>}
                </span>
                <span className={'min-w-0 flex-1 text-body ' + (on ? 'font-semibold text-ink' : 'text-ink-2')}>
                  “{l}”
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-4">
          <CopyButton text={c.lines[line]} label="Copy this line" kind="primary"/>
        </div>
      </Sheet>

      <Sheet className="mt-4">
        <Label>Lines to leave out</Label>
        <Lines className="mt-2" rows={AVOID.map(a => `“${a}”`)}/>
        <p className="note mt-3">These can make a teen defensive or speak for them.</p>
      </Sheet>
    </ActivityScreen>
  )
}
