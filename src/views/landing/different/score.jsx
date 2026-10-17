import React from 'react'
import { RainbowDial } from '../../../charts/rainbow'
import { studentRings } from '../../../lib/readings'
import { SENSORS } from '../../../lib/sensors'
import { FEATURES, PARAM_COUNT, displayScore, forward, shape } from '../../../signals/tnam'
import { cn } from '../../../lib/utils'
import { Card, Demo, DemoTag, Flow, Stage, Trace, useSteps, useWidth } from './kit'

/* Mind Score: four patch signals in, the real network in the middle, the
 * real dial out. The curves are the trained network's own (tnam.js shape()),
 * the score is its forward pass on the demo inputs, and the dial is the one
 * the student screen draws. */

/* The demo's inputs, as z-scores against the wearer's own usual. Every other
   measure the network takes is held at usual (0). */
const Z = { rmssd: -1.2, sdnn: -0.8, pnn50: -0.9, lfhf: 0.6, hr: 1.1, edaTonic: 0.7, edaPhasic: 1.0,
  scrPerMin: 1.2, tempSlope: -0.3, motion: -0.6 }
const RUN = forward(FEATURES.map(k => Z[k] ?? 0))
const SCORE = displayScore(RUN.logit)
const USUAL = 50 // the network maps a day with every signal at usual to 50

const SHOWN = [
  { ring: 'heart', f: 'hr',        name: 'Heart rate' },
  { ring: 'sweat', f: 'scrPerMin', name: 'Sweat' },
  { ring: 'temp',  f: 'tempSlope', name: 'Temperature' },
  { ring: 'move',  f: 'motion',    name: 'Movement' },
]
const WAVE = { heart: 'pulse', sweat: 'sweat', temp: 'temp', move: 'move' }

/* f(z) minus f(0): how far one signal pushes the score from a usual day. */
const CURVES = SHOWN.map(s => {
  const k = FEATURES.indexOf(s.f)
  const zero = shape(k, 0)
  const pts = Array.from({ length: 31 }, (_, i) => { const z = -3 + i * 0.2; return [z, shape(k, z) - zero] })
  return { ...s, pts, z: Z[s.f], push: shape(k, Z[s.f]) - zero }
})
const LO = Math.min(...CURVES.flatMap(c => c.pts.map(p => p[1])))
const HI = Math.max(...CURVES.flatMap(c => c.pts.map(p => p[1])))

function Curve({ c, on, color }) {
  const W = 120, H = 40
  const x = z => ((z + 3) / 6) * W
  const y = v => H - 3 - ((v - LO) / (HI - LO)) * (H - 6)
  const d = c.pts.map(([z, v], i) => `${i ? 'L' : 'M'}${x(z).toFixed(1)} ${y(v).toFixed(1)}`).join('')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className="block h-10 w-full">
      <rect x="0" y="0" width={W} height={H} rx="6" className="fill-mist/60"/>
      <path d={`M${x(0)} 2V${H - 2}`} stroke="#93b2a1" strokeWidth="1" strokeDasharray="2 3"/>
      <path d={`M2 ${y(0)}H${W - 2}`} stroke="#93b2a1" strokeWidth="1"/>
      <path d={d} fill="none" stroke="#2a5744" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx={x(c.z)} cy={y(c.push)} r={on ? 4.5 : 0} fill={color} stroke="#fff" strokeWidth="1.5"
        style={{ transition: 'r .35s cubic-bezier(0.23,1,0.32,1)' }}/>
    </svg>
  )
}

export default function ScoreDemo() {
  const [ref, w] = useWidth()
  const wide = w >= 640
  const { step } = useSteps(ref, HOLDS)
  const rings = React.useMemo(() => studentRings(), [])
  const lit = Math.max(0, step - 1) // curves lit so far
  const out = step >= 5

  const label = `How the Mind Score is made, with demo data. In: four patch signals, heart ${rings[0].value},
    sweat ${rings[1].value}, temperature ${rings[2].value} and movement ${rings[3].value}, each out of 100 against
    the wearer's own usual. Middle: the Mind Score network, one learned curve per measure. Heart rate pushes the
    score up most. Out: a Mind Score of ${SCORE} out of 100 on the dial, where a usual day sits at ${USUAL}.`

  return (
    <Demo innerRef={ref} label={label}>
      <div className={cn('flex', wide ? 'flex-row items-stretch gap-1' : 'flex-col')}>
        <Stage n="1" title="Signals in" className={wide ? 'w-[200px]' : ''}>
          <Card className="flex flex-col gap-2.5">
            {SHOWN.map((s, i) => {
              const r = rings.find(x => x.id === s.ring)
              const sen = SENSORS[s.ring]
              return (
                <div key={s.ring} className="flex items-center gap-2.5">
                  <span aria-hidden className="h-7 w-[3px] shrink-0 rounded-bar" style={{ background: sen.glow }}/>
                  <span className="min-w-0 flex-1">
                    <span className="block text-fine font-semibold leading-tight text-ink">{sen.name}</span>
                    <Trace kind={WAVE[s.ring]} color={sen.glow} w={wide ? 88 : 120} h={18} fast={s.ring === 'heart'}/>
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className="block font-display text-ui font-bold leading-none text-ink">{r.value}</span>
                    <span className="text-[13px] leading-tight text-ink-2">of 100</span>
                  </span>
                </div>
              )
            })}
          </Card>
          <p className="m-0 mt-2 text-fine text-ink-2">Each against your own usual.</p>
        </Stage>

        <Flow wide={wide} on={step >= 1}/>

        <Stage n="2" title="Mind Score network" className="flex-1" dim={step < 1}>
          <Card className="flex flex-col gap-2">
            <div className={cn("grid gap-x-3 gap-y-2.5", wide ? "grid-cols-1" : "grid-cols-2")}>
              {CURVES.map((c, i) => {
                const on = lit > i
                return (
                  <div key={c.f} className="min-w-0">
                    <p className="m-0 flex items-baseline justify-between gap-1">
                      <span className="min-w-0 truncate text-[13px] font-semibold leading-tight text-ink">{c.name}</span>
                      <span className={cn('mm-dd-fade shrink-0 font-display text-fine font-bold tabular-nums text-ink',
                        on ? 'opacity-100' : 'opacity-0')}>
                        {c.push >= 0 ? '+' : '−'}{Math.abs(c.push).toFixed(1)}
                      </span>
                    </p>
                    <div className="mt-1"><Curve c={c} on={on} color={SENSORS[c.ring].glow}/></div>
                  </div>
                )
              })}
            </div>
            <p className="m-0 border-t border-rule pt-2 text-fine leading-snug text-ink-2">
              One learned curve per measure, ten in all. Plus a memory of the last four minutes.
              {' '}{PARAM_COUNT.toLocaleString('en-US')} weights.
            </p>
          </Card>
          <p className="m-0 mt-2 text-fine text-ink-2">The dot is today. The dashed line is usual.</p>
        </Stage>

        <Flow wide={wide} on={out}/>

        <Stage n="3" title="Score out" className={wide ? 'w-[236px]' : ''} dim={!out}>
          <div className="flex flex-col items-center">
            <RainbowDial score={out ? SCORE : USUAL} usual={USUAL} rings={rings} size={wide ? 236 : 280}/>
            <p className="m-0 mt-2 text-center text-fine text-ink">
              {out ? <><b className="font-display font-bold">{SCORE}</b> today. </> : 'Waiting for the signals. '}
              A usual day is {USUAL}.
            </p>
          </div>
        </Stage>
      </div>
      <DemoTag className="mt-3"/>
    </Demo>
  )
}

const HOLDS = [1500, 700, 700, 700, 900, 4200]
