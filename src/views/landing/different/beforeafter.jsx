import React from 'react'
import { MIN_PAIRS, effectWords, rankTools, toolName } from '../../../signals/effect'
import { Camera } from '../../../ui/marks'
import { cn } from '../../../lib/utils'
import { Demo, DemoTag, Flow, Stage, Trace, useSteps, useWidth } from './kit'

/* Before and after: a 20 second camera pulse before an exercise and one
 * after (toolkit/after.jsx), the sentence the app writes for the pair, and
 * the ranking that only counts a tool once it has two pairs. The sentences
 * and the ranking are signals/effect.js run on demo pairs. */

const PAIRS = [
  { tool: 'sigh',      before: { hr: 84 }, after: { hr: 78 } },
  { tool: 'sigh',      before: { hr: 80 }, after: { hr: 75 } },
  { tool: 'breathing', before: { hr: 82 }, after: { hr: 79 } },
  { tool: 'breathing', before: { hr: 79 }, after: { hr: 77 } },
  { tool: 'walk',      before: { hr: 81 }, after: { hr: 80 } },
]
const NOW = PAIRS[0]
const RANK = rankTools(PAIRS)
const HOLDS = [2200, 2400, 2200, 4400]

function Pulse({ bpm, on, fast, title }) {
  return (
    <div className="rounded-[12px] bg-ink p-3">
      <p className="m-0 flex items-center gap-1.5 text-fine font-semibold text-mist">
        <Camera aria-hidden size={16}/>{title}
      </p>
      <Trace kind="pulse" color="#3ecf9a" w={150} h={30} fast={fast} className="mt-1.5 w-full"/>
      <p className="m-0 mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-stat font-bold tabular-nums leading-none text-paper">{on ? bpm : '..'}</span>
        <span className="text-fine text-mist">bpm</span>
      </p>
    </div>
  )
}

export default function BeforeAfterDemo() {
  const [ref, w] = useWidth()
  const wide = w >= 640
  const { step } = useSteps(ref, HOLDS)
  const sentence = effectWords(NOW.tool, NOW.before.hr - NOW.after.hr)

  const label = `Before and after, with demo figures. A 20 second camera pulse before an exercise reads
    ${NOW.before.hr} beats a minute. Then ${toolName(NOW.tool)}. A second pulse after reads ${NOW.after.hr}.
    The app writes: ${sentence} Over time it ranks your tools by pulse change, and only once a tool has
    ${MIN_PAIRS} checks: ${RANK.map(r => effectWords(r.tool, r.meanHrDrop)).join(' ')}`

  return (
    <Demo innerRef={ref} label={label}>
      <div className={cn('flex', wide ? 'flex-row items-stretch gap-1' : 'flex-col')}>
        <Stage n="1" title="Before" className={wide ? 'w-[180px]' : ''}>
          <Pulse bpm={NOW.before.hr} on title="Fingertip, 20 s" fast/>
        </Stage>
        <Flow wide={wide} on={step >= 1}/>
        <Stage n="2" title="Exercise" className={wide ? 'w-[150px]' : ''} dim={step < 1}>
          <div className="flex flex-col items-center rounded-[12px] border border-rule bg-card p-3">
            <svg viewBox="0 0 80 80" width={72} height={72} aria-hidden>
              <circle cx="40" cy="40" r="34" fill="none" stroke="#f2248b" strokeWidth="1.6" strokeDasharray="3 4"/>
              <circle cx="40" cy="40" r={step === 1 ? 30 : 16} fill="#fce6f1" stroke="#b2095e" strokeWidth="2"
                style={{ transition: 'r 2s cubic-bezier(0.2,0.7,0.3,1)' }}/>
            </svg>
            <p className="m-0 mt-1 text-center font-display text-ui font-bold leading-tight text-ink">{toolName(NOW.tool)}</p>
            <p className="m-0 text-center text-fine text-ink-2">Five breaths</p>
          </div>
        </Stage>
        <Flow wide={wide} on={step >= 2}/>
        <Stage n="3" title="After" className={wide ? 'w-[180px]' : ''} dim={step < 2}>
          <Pulse bpm={NOW.after.hr} on={step >= 2} title="Fingertip, 20 s"/>
        </Stage>
      </div>

      <div className="mt-3 rounded-[12px] border border-rule bg-blush-wash p-3">
        <p className="m-0 font-display text-row font-bold leading-snug text-blush-ink">
          {step >= 2 ? sentence : 'Waiting for the after reading.'}</p>
        <ul className={cn('mm-dd-fade m-0 mt-2 list-none border-t border-rule p-0 pt-2', step >= 3 ? 'opacity-100' : 'opacity-0')}>
          <li className="pb-1 text-fine font-semibold text-ink-2">Your tools so far</li>
          {RANK.map(r => (
            <li key={r.tool} className="flex flex-wrap items-baseline justify-between gap-x-3 py-0.5 text-fine text-ink">
              <span className="font-semibold">{toolName(r.tool)}</span>
              <span className="text-ink-2">
                {r.meanHrDrop != null ? `${Math.round(r.meanHrDrop)} beats lower, ${r.n} checks` : `${r.n} check, needs ${MIN_PAIRS}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <DemoTag className="mt-2"/>
    </Demo>
  )
}
