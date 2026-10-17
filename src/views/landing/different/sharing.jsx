import React from 'react'
import { SHARING } from '../../../app/store'
import { DEMO_LINKS, DEMO_TEEN } from '../../../account/demo-network'
import { FAMILY } from '../../../lib/roster'
import { PRO } from '../../../lib/terms'
import { Cross } from '../../../ui/marks'
import { cn } from '../../../lib/utils'
import { Demo, DemoTag, Flow, Stage, useSteps, useWidth } from './kit'

/* Sharing controls: the teen's own switches for a parent, straight from the
 * SHARING table in app/store.js, and beside them what the parent's screen
 * shows as each switch moves. A parent's view never goes finer than a day,
 * and the "never" rows are the table's own. Figures are Maya's demo week from
 * lib/roster.js. */

const FIELDS = SHARING.parent.fields.filter(f => f.key !== 'worn')
const cap = t => t.charAt(0).toUpperCase() + t.slice(1)
const NEVER = SHARING.parent.never.map(n => cap(n.label.replace(/^My /, '').replace(/^Anything I say$/, 'Anything she says')))
const PARENT = DEMO_LINKS.find(l => l.person.role === 'parent').person
const MAYA = FAMILY.find(t => t.id === 'maya') || FAMILY[0]
const WEEK = MAYA.days.slice(-7)
const LAST3 = MAYA.days.slice(-3)
const ABOVE = WEEK.filter(d => d.score > MAYA.usual.hi).length
const CUT = [...MAYA.days.map(d => d.recovery)].sort((a, b) => a - b)[Math.floor(MAYA.days.length * 0.8)]
const SLOW = WEEK.filter(d => d.recovery >= CUT).length

/* Each step is one switch moving, with the line the teen's own log keeps. */
const STATES = [
  { on: ['score', 'sleep'], log: null },
  { on: ['score', 'sleep', 'week'], log: 'Turned on: whether a day ran above my usual' },
  { on: ['score', 'sleep', 'week', 'settle'], log: 'Turned on: days slow to settle' },
  { on: ['score', 'week', 'settle'], log: 'Turned off: roughly how long I slept' },
]
const HOLDS = [2200, 2400, 2400, 3400]

function Switch({ on }) {
  return (
    <span aria-hidden className={cn('relative inline-block h-[24px] w-[42px] shrink-0 rounded-chip transition-colors duration-300',
      on ? 'bg-accent' : 'bg-ruling')}>
      <span className="absolute top-[3px] size-[18px] rounded-chip bg-card shadow-card transition-[left] duration-300 ease-out"
        style={{ left: on ? 21 : 3 }}/>
    </span>
  )
}

function Row({ show, label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-rule py-1.5 last:border-b-0">
      <span className="min-w-0 text-fine text-ink-2">{label}</span>
      <span className={cn('shrink-0 text-right tabular-nums', show ? 'font-display text-ui font-bold text-ink' : 'text-fine text-ink-2')}>
        {show ? value : 'Not shared'}</span>
    </div>
  )
}

export default function SharingDemo() {
  const [ref, w] = useWidth()
  const wide = w >= 620
  const { step } = useSteps(ref, HOLDS)
  const st = STATES[step]
  const on = k => st.on.includes(k)

  const label = `Sharing controls, with demo data. ${DEMO_TEEN.name} chooses, switch by switch, what a parent sees:
    ${FIELDS.map(f => f.short).join(', ')}. As each switch moves, ${PARENT.name}'s screen changes with it. A parent
    sees nothing finer than a day and never: ${NEVER.join(', ')}. A ${PRO} sees only teens who said yes, groups
    under five show nothing, and every record opened is logged.`

  return (
    <Demo innerRef={ref} label={label}>
      <div className={cn('flex', wide ? 'flex-row items-stretch gap-1' : 'flex-col')}>
        <Stage n="1" title={`${DEMO_TEEN.name}'s switches`} className="flex-1">
          <div className="rounded-[12px] border border-rule bg-card px-3 py-1">
            <p className="m-0 border-b border-rule py-2 text-fine font-semibold text-ink-2">For {PARENT.name}, a parent</p>
            {FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-3 border-b border-rule py-2 last:border-b-0">
                <span className="min-w-0 flex-1">
                  <span className="block text-fine font-semibold leading-snug text-ink">{f.label}</span>
                  <span className="block text-[13px] leading-snug text-ink-2">{f.hint}</span>
                </span>
                <Switch on={on(f.key)}/>
              </div>
            ))}
          </div>
          <p className={cn('mm-dd-fade m-0 mt-2 text-fine leading-snug text-ink-2', st.log ? 'opacity-100' : 'opacity-0')}>
            Her log: {st.log || 'nothing changed'}</p>
        </Stage>

        <Flow wide={wide}/>

        <Stage n="2" title={`What ${PARENT.name} sees`} className={wide ? 'w-[250px]' : ''}>
          <div className="rounded-[12px] border border-rule bg-sky-wash px-3 py-1.5">
            <div className="border-b border-rule py-1.5">
              <p className="m-0 text-fine text-ink-2">Mind Score, one per day</p>
              <div className="mt-1 flex gap-3">
                {LAST3.map(d => (
                  <span key={d.date} className="flex flex-col">
                    <span className="text-[13px] text-ink-2">{d.weekday}</span>
                    <span className="font-display text-ui font-bold tabular-nums text-ink">{d.score}</span>
                  </span>
                ))}
              </div>
            </div>
            <Row show={on('week')} label="Days above her usual" value={`${ABOVE} this week`}/>
            <Row show={on('sleep')} label="Sleep" value="About 7.5 h"/>
            <Row show={on('settle')} label="Days slow to settle" value={`${SLOW} this week`}/>
          </div>
          <p className="m-0 mb-1 mt-3 text-fine font-semibold text-ink-2">Never, at any setting</p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {NEVER.map(n => (
              <li key={n} className="flex items-start gap-1.5 text-fine leading-snug text-ink">
                <Cross aria-hidden size={14} className="mt-[3px] shrink-0 text-ink-3"/>{n}
              </li>
            ))}
          </ul>
        </Stage>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 text-fine leading-snug text-ink-2">
          A {PRO} sees only teens who said yes. Groups under five show nothing. Every record opened is logged.</p>
        <DemoTag/>
      </div>
    </Demo>
  )
}
