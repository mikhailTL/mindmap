import React from 'react'
import { LampFace } from '../../../traffic/Face'
import { IosNotification } from '../../../traffic/ios'
import { NUDGE_TEXT, SIGNAL, parentSummary } from '../../../signals/light'
import { cn } from '../../../lib/utils'
import { Demo, DemoTag, Flow, PhoneFrame, Stage, useSteps, useWidth } from './kit'

/* Heads Up: how the teen's phone is used (never what is on it) is measured
 * against her own usual, the light moves green to yellow to red, red waits a
 * full minute, and only then does the parent's phone get the one line the
 * engine allows: the headline, the time and the signal names. The words are
 * signals/light.js's own; the lamps are traffic/Face.jsx. */

const LIGHTS = ['green', 'yellow', 'red', 'red']
const HOLDS = [2400, 2600, 2600, 4600]
const AT = new Date(2026, 9, 16, 21, 14).getTime()

/* Three of the six measures, as a share of the way to the top of the bar.
   The tick at 40 is her usual. */
const METERS = [
  { key: 'medianGap', v: [30, 64, 84] },
  { key: 'deletions', v: [24, 52, 80] },
  { key: 'reversals', v: [34, 46, 58] },
]

function TeenPhone({ light, nudge }) {
  const blocks = light === 'green' ? [3, 5, 2] : light === 'yellow' ? [4, 2, 5, 3] : [2, 6, 1, 4, 3]
  return (
    <PhoneFrame>
      {/* the conversation, drawn as bars: MindMap never reads the words */}
      <div className="flex flex-col gap-2 px-3 pb-2 pt-3">
        <span className="h-6 w-[70%] rounded-[12px] bg-mist"/>
        <span className="h-6 w-[52%] self-end rounded-[12px] bg-sky/30"/>
        <span className="h-10 w-[78%] rounded-[12px] bg-mist"/>
        <span className="h-6 w-[44%] self-end rounded-[12px] bg-sky/30"/>
        <span className="h-6 w-[60%] rounded-[12px] bg-mist"/>
      </div>
      <div className="absolute inset-x-2 bottom-3 flex min-h-[36px] items-center gap-1 rounded-[18px] border border-rule bg-card px-2.5">
        {blocks.map((n, i) => (
          <span key={i} className={cn('h-2.5 rounded-xs transition-colors duration-300', light === 'red' && i % 2 ? 'bg-crit/60' : 'bg-ink-3/60')}
            style={{ width: n * 5 }}/>
        ))}
        {light !== 'green' && (
          <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden className="shrink-0 text-ink-2" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
            <path d="M8 5h12v14H8l-6-7z"/><path d="M11 9l6 6M17 9l-6 6"/>
          </svg>
        )}
        <span aria-hidden className="mm-dd-blink ml-0.5 h-4 w-[2px] bg-accent"/>
      </div>
      <div className={cn('mm-dd-fade absolute inset-x-2 top-9 rounded-[14px] border border-rule bg-paper px-3 py-2 shadow-raise',
        nudge ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0')}>
        <p className="m-0 text-[13px] font-bold text-ink">MindMap</p>
        <p className="m-0 text-[13px] leading-snug text-ink">{NUDGE_TEXT}</p>
      </div>
    </PhoneFrame>
  )
}

function ParentPhone({ light, sum, alert, red, reduced }) {
  return (
    <PhoneFrame time="9:15">
      <div className="px-3 pt-3">
        <p className="m-0 text-fine font-semibold text-ink-2">Heads Up, Maya</p>
        <div className="mt-2 flex items-start gap-2.5 rounded-[12px] bg-sky-wash p-2.5">
          <LampFace light={light} size={28}/>
          <p className="m-0 font-display text-fine font-bold leading-snug text-ink">{sum.headline}</p>
        </div>
        <p className="m-0 mt-2 text-[13px] leading-snug text-ink-2">
          {light === 'green' ? 'Nothing to send.' : light === 'yellow' ? 'Yellow sends the colour only.' : 'Red adds the time and the signals.'}
        </p>
      </div>
      <IosNotification show={alert} reduced={reduced} tone="crit" time="now" top={30}
        body={`${red.headline} ${red.time}. ${red.signals.join(', ')}.`}/>
    </PhoneFrame>
  )
}

export default function HeadsUpDemo() {
  const [ref, w] = useWidth()
  const wide = w >= 640
  const { step, reduced } = useSteps(ref, HOLDS)
  const light = LIGHTS[step]
  const lvl = Math.min(step, 2)
  const signals = METERS.filter(m => m.v[lvl] > 60).map(m => SIGNAL[m.key])
  const sum = parentSummary({ light, at: AT, signals })
  const alert = step === 3
  const red = parentSummary({ light: 'red', at: AT, signals: METERS.filter(m => m.v[2] > 60).map(m => SIGNAL[m.key]) })

  const label = `How Heads Up works, with demo data. In: how the teen's phone is used, never what is on it:
    typing gaps, backspacing and scrolling, measured against her own usual. The light moves from green to yellow
    to red; red needs a full minute above her usual, and the teen gets a quiet offer: ${NUDGE_TEXT}
    Out: the parent's phone shows ${red.headline} ${red.time}. ${red.signals.join(', ')}. Never an app, a message
    or a minute count.`

  return (
    <Demo innerRef={ref} label={label}>
      <div className={cn('flex', wide ? 'flex-row items-stretch gap-1' : 'flex-col')}>
        <Stage n="1" title="Teen's phone" className={wide ? 'w-[210px]' : ''}>
          <TeenPhone light={light} nudge={step >= 2}/>
          <p className="m-0 mt-2 text-fine leading-snug text-ink-2">Timing and touches only. Never the words.</p>
        </Stage>

        <Flow wide={wide}/>

        <Stage n="2" title="Against her usual" className="flex-1">
          <div className="flex gap-3 rounded-[12px] border border-rule bg-card p-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              {METERS.map(m => {
                const v = m.v[lvl]
                return (
                  <div key={m.key}>
                    <p className="m-0 flex justify-between gap-2 text-fine text-ink">
                      <span className="font-semibold">{SIGNAL[m.key]}</span>
                    </p>
                    <div aria-hidden className="relative mt-1 h-2.5 rounded-bar bg-mist">
                      <span className={cn('absolute inset-y-0 left-0 rounded-bar transition-[width,background-color] duration-700 ease-out',
                        v > 60 ? 'bg-crit' : v > 40 ? 'bg-sun' : 'bg-accent')} style={{ width: `${v}%` }}/>
                      <span className="absolute -inset-y-1 w-[2px] bg-ink" style={{ left: '40%' }}/>
                    </div>
                  </div>
                )
              })}
              <p className="m-0 text-[13px] leading-tight text-ink-2">The line is her usual.</p>
            </div>
            {/* the light itself: three lamps, one lit */}
            <div aria-hidden className="flex shrink-0 flex-col items-center gap-1.5 rounded-[14px] bg-ink px-1.5 py-2">
              {['red', 'yellow', 'green'].map(l => (
                <LampFace key={l} light={l} size={30} lit={l === light} glow={l === light && !reduced}/>
              ))}
            </div>
          </div>
          <p className="m-0 mt-2 text-fine leading-snug text-ink-2">Red only after a full minute above usual.</p>
        </Stage>

        <Flow wide={wide} on={alert}/>

        <Stage n="3" title="Parent's phone" className={wide ? 'w-[220px]' : ''}>
          <ParentPhone light={light} sum={sum} alert={alert} red={red} reduced={reduced}/>
          <p className="m-0 mt-2 text-fine leading-snug text-ink-2">Never an app, a message or a minute count.</p>
        </Stage>
      </div>
      <DemoTag className="mt-3"/>
    </Demo>
  )
}
