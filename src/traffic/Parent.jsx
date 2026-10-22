import React from 'react'
import { Light } from '../signals/light.js'
import { LampFace } from './Face'
import { known } from './core'
import { cn } from '../lib/utils'

// Red on top, green at the bottom as on a street light, so position also says which lamp is lit.
const ORDER = [Light.RED, Light.YELLOW, Light.GREEN]
const WORD = { [Light.GREEN]: 'Green', [Light.YELLOW]: 'Yellow', [Light.RED]: 'Red' }
export const STATE_WORD = { [Light.GREEN]: 'Calm', [Light.YELLOW]: 'Above usual', [Light.RED]: 'Stressed' }
const HOUSING = '#1c1c1e'

export const styleFor = light => ({ word: WORD[known(light)] })

/* One lit lamp in a small dark housing, for a line of text. */
export function Lamp({ light, size = 18, className }) {
  return (
    <span aria-hidden className={cn('inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size, borderRadius: size * 0.28, background: HOUSING }}>
      <LampFace light={known(light)} size={Math.round(size * 0.74)}/>
    </span>
  )
}

/* The lamp and its word, side by side. */
export function LampLabel({ light, className, textClassName, words = WORD }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Lamp light={light}/>
      <span className={cn('font-display text-ui font-bold leading-none text-ink', textClassName)}>
        {words[known(light)]}
      </span>
    </span>
  )
}

export function TrafficLight({ light, lamp = 46, reduced, className }) {
  const on = known(light)
  const pad = lamp * 0.22
  return (
    <span aria-hidden className={cn('inline-flex flex-col items-center', className)}
      style={{ background: HOUSING, borderRadius: lamp * 0.36, padding: pad, gap: pad,
        boxShadow: '0 6px 18px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.06)' }}>
      {ORDER.map(l => (
        <span key={l} className={cn('block', !reduced && 'transition-opacity duration-500')}>
          <LampFace light={l} size={lamp} lit={l === on} glow={l === on && lamp >= 14}/>
        </span>
      ))}
    </span>
  )
}

export default TrafficLight
