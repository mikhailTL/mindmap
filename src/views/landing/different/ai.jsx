import React from 'react'
import { AUDIENCES } from '../../../ai/framework'
import { NOTES, PRO_LC, SCORE } from '../../../lib/terms'
import { cn } from '../../../lib/utils'
import { Demo, useSteps, useWidth } from './kit'

/* MindMap AI: a question from the student starters in ai/framework.js, the
 * path the words take, and what never goes. The "what leaves" rows repeat
 * the ones the MindMap AI screen prints (ai/Ai.jsx). The reply here is a
 * sample written for this page and says so: on the real screen every reply
 * carries the name of the model that wrote it. */

const STARTERS = AUDIENCES.student.starters
const ASK = STARTERS[0]
const REPLY = [
  'A week of bad sleep is hard.',
  'Try the same wake time every day, weekends too.',
  'Screens off half an hour before bed.',
  'If it keeps up, tell a parent or your doctor.',
]
const LEAVES = [
  ['Sent', 'Your words, to MindMap’s server and on to the model.'],
  ['Not sent', `No name, reading, ${SCORE}, ${NOTES.toLowerCase()} or location.`],
  ['Kept', 'Nothing. Leaving the screen ends the conversation.'],
  ['Shown to', `Nobody else. Not a parent, not a ${PRO_LC}.`],
]
const HOLDS = [1600, 1300, 1500, 4800]

export default function AiDemo() {
  const [ref, w] = useWidth()
  const wide = w >= 620
  const { step } = useSteps(ref, HOLDS)

  const label = `MindMap AI, with a sample conversation. A student taps a starter: "${ASK}" The words go to
    MindMap's server and on to the model. A sample reply: ${REPLY.join(' ')} ${LEAVES.map(([k, v]) => `${k}: ${v}`).join(' ')}`

  return (
    <Demo innerRef={ref} label={label}>
      <div className={cn('flex gap-3', wide ? 'flex-row items-stretch' : 'flex-col')}>
        <div className="flex min-w-0 flex-1 flex-col rounded-[12px] border border-rule bg-card p-3" style={{ minHeight: 300 }}>
          <p className="m-0 font-display text-ui font-bold text-ink">MindMap AI</p>
          <p className="m-0 text-fine text-ink-2">Ask about sleep, school or a worry.</p>
          <ul className={cn('mm-dd-fade m-0 mt-3 flex list-none flex-col gap-1.5 p-0', step >= 1 ? 'opacity-0' : 'opacity-100')}
            style={{ display: step >= 1 ? 'none' : undefined }}>
            {STARTERS.map((s, i) => (
              <li key={s} className={cn('rounded-[10px] border px-3 py-2 text-fine text-ink',
                i === 0 ? 'border-coral bg-coral-wash' : 'border-rule')}>{s}</li>
            ))}
          </ul>
          {step >= 1 && (
            <div className="mt-3 flex flex-col gap-2">
              <p className="mm-dd-fade m-0 max-w-[85%] self-end rounded-[14px] rounded-br-[4px] bg-coral-ink px-3 py-2 text-fine text-card">{ASK}</p>
              {step === 2 && (
                <p aria-hidden className="m-0 flex gap-1.5 self-start rounded-[14px] bg-mist px-3 py-3">
                  {[0, 1, 2].map(i => <span key={i} className="mm-dd-blink size-2 rounded-chip bg-ink-2" style={{ animationDelay: `${i * 0.18}s` }}/>)}
                </p>
              )}
              {step >= 3 && (
                <div className="mm-dd-fade max-w-[92%] self-start rounded-[14px] rounded-bl-[4px] bg-mist px-3 py-2">
                  {REPLY.map(l => <p key={l} className="m-0 text-fine leading-snug text-ink">{l}</p>)}
                </div>
              )}
              {step >= 3 && (
                <p className="m-0 text-[13px] leading-snug text-ink-2">
                  Sample reply, written for this page. Real replies name the model that wrote them.</p>
              )}
            </div>
          )}
        </div>

        <div className={cn('rounded-[12px] border border-rule bg-coral-wash p-3', wide ? 'w-[250px] shrink-0' : '')}>
          <p className="m-0 font-display text-ui font-bold text-ink">What leaves the phone</p>
          <dl className="m-0 mt-2 grid grid-cols-[4.75rem_minmax(0,1fr)] gap-x-2 gap-y-1.5 text-fine">
            {LEAVES.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="font-semibold text-coral-ink">{k}</dt>
                <dd className="m-0 leading-snug text-ink">{v}</dd>
              </React.Fragment>
            ))}
          </dl>
          <p className="m-0 mt-3 border-t border-rule pt-2 text-fine leading-snug text-ink-2">
            Short answers. Help lines sit beside the chat.</p>
        </div>
      </div>
    </Demo>
  )
}
