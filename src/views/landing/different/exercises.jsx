import React from 'react'
import { cn } from '../../../lib/utils'
import { Demo, DemoTag, useSteps, useWidth } from './kit'

/* Measured exercises: three of the six Phone sensors tools in toolkit/, each
 * with the sensor it reads, the figure it turns that into, and what happens
 * to the raw input. The rules are the tools' own (sigh.jsx: 6 s goal on a
 * 12 s gauge, no audio kept; steady.jsx: 5 to 20 s stages, readings dropped
 * each frame; alert.jsx: nine lights, only the best average stored). */

const HOLDS = [1500, 1500, 1500, 2600]
const EXHALE = [2.4, 4.6, 6.8, 7.4]
const HELD = [3, 6, 9, 12]
const LIT = [4, 0, 8, 2]
const TAP = [0.36, 0.33, 0.31, 0.29]

function Candle({ bend }) {
  return (
    <svg viewBox="0 0 80 96" width={80} height={96} aria-hidden className="block shrink-0">
      <g style={{ transform: `skewX(${-bend}deg)`, transformOrigin: '40px 52px', transition: 'transform .6s cubic-bezier(0.23,1,0.32,1)' }}>
        <path className="mm-dd-flick" d="M40 14c8 10 12 18 12 26a12 12 0 0 1-24 0c0-8 4-16 12-26z" fill="#f25424"/>
        <path d="M40 30c4 5 6 9 6 13a6 6 0 0 1-12 0c0-4 2-8 6-13z" fill="#ffe8e0"/>
      </g>
      <path d="M40 52v8" stroke="#0d2b1e" strokeWidth="2"/>
      <rect x="28" y="60" width="24" height="32" rx="4" fill="#d5f2e8" stroke="#067049" strokeWidth="1.6"/>
    </svg>
  )
}

function Bowl() {
  return (
    <svg viewBox="0 0 96 96" width={96} height={96} aria-hidden className="block shrink-0">
      <circle cx="48" cy="48" r="44" fill="#d5f2e8" stroke="#067049" strokeWidth="1.6"/>
      <circle cx="48" cy="48" r="18" fill="#fff" stroke="#18a370" strokeWidth="2" strokeDasharray="4 3"/>
      <g className="mm-dd-wobble"><circle cx="48" cy="48" r="8" fill="#067049"/></g>
    </svg>
  )
}

function Lights({ lit }) {
  return (
    <div aria-hidden className="grid shrink-0 grid-cols-3 gap-1.5 rounded-[12px] bg-ink p-2" style={{ width: 96 }}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={cn('aspect-square rounded-chip transition-colors duration-200',
          i === lit ? 'bg-accent-lit' : 'bg-ink-2')}/>
      ))}
    </div>
  )
}

function Tile({ wide, art, title, sensor, figure, unit, sub, keep }) {
  return (
    <div className={cn('flex min-w-0 rounded-[12px] border border-rule bg-card p-3',
      wide ? 'flex-col items-center text-center' : 'flex-row items-center gap-3')}>
      <div className={cn('grid shrink-0 place-items-center', wide ? 'h-[104px]' : 'w-[96px]')}>{art}</div>
      <div className={cn('min-w-0', wide ? 'mt-2' : 'flex-1')}>
        <p className="m-0 font-display text-ui font-bold leading-tight text-ink">{title}</p>
        <p className="m-0 text-fine text-ink-2">Reads the {sensor}</p>
        <p className="m-0 mt-1.5 font-display text-row font-bold tabular-nums leading-none text-mint-ink">
          {figure}<span className="ml-1 text-fine font-semibold text-ink-2">{unit}</span></p>
        <p className="m-0 mt-1 text-fine leading-snug text-ink">{sub}</p>
        <p className="m-0 mt-1.5 text-[13px] leading-snug text-ink-2">{keep}</p>
      </div>
    </div>
  )
}

export default function ExercisesDemo() {
  const [ref, w] = useWidth()
  const wide = w >= 600
  const { step } = useSteps(ref, HOLDS)
  const ex = EXHALE[step]

  const label = `Three exercises the phone measures, with demo figures. Long Exhale reads the microphone and
    times each breath out against a 6 second goal; no audio is kept. Hold Still reads the motion sensor and times
    how long a marble stays in the middle circle; each reading is dropped after use. Reaction Test reads taps on
    the screen and times how fast a light is hit; only your own best is stored.`

  return (
    <Demo innerRef={ref} label={label}>
      <div className={cn('grid gap-3', wide ? 'grid-cols-3' : 'grid-cols-1')}>
        <Tile wide={wide} art={<Candle bend={Math.min(28, ex * 4)}/>} title="Long Exhale" sensor="microphone"
          figure={ex.toFixed(1)} unit="s out"
          sub={<span className="flex items-center gap-2">
            <span aria-hidden className="relative inline-block h-2 w-20 rounded-bar bg-mist">
              <span className="absolute inset-y-0 left-0 rounded-bar bg-mint transition-[width] duration-700 ease-out"
                style={{ width: `${(ex / 12) * 100}%` }}/>
              <span className="absolute -inset-y-1 w-[2px] bg-ink" style={{ left: '50%' }}/>
            </span>
            Goal 6 s</span>}
          keep="No audio is kept."/>
        <Tile wide={wide} art={<Bowl/>} title="Hold Still" sensor="motion sensor"
          figure={HELD[step]} unit="of 12 s" sub="Marble kept in the middle." keep="Each reading is used once, then dropped."/>
        <Tile wide={wide} art={<Lights lit={LIT[step]}/>} title="Reaction Test" sensor="touch screen"
          figure={TAP[step].toFixed(2)} unit="s to tap" sub="Fifteen lights a round." keep="Only your own best is stored."/>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="m-0 text-fine text-ink-2">Three of the tools that measure, shown here.</p>
        <DemoTag/>
      </div>
    </Demo>
  )
}
