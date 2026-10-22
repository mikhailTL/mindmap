import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { LampFace } from '../../traffic/Face'
import { cn } from '../../lib/utils'
import { STATUS_WORD } from './metrics'

// Per light: band ground, border, ink for words on it, and a bar fill that clears 3:1 on white.
export const LIGHT_TONE = Object.freeze({
  green:  { band: 'bg-mint-wash', edge: 'border-mint/45', ink: 'text-mint-ink', bar: '#18a370' },
  yellow: { band: 'bg-sun-wash',  edge: 'border-sun/45',  ink: 'text-sun-ink',  bar: '#e3a400' },
  red:    { band: 'bg-coral-wash', edge: 'border-coral/45', ink: 'text-coral-ink', bar: '#e5482a' },
})
export const toneOf = light => LIGHT_TONE[light] || null

const ICON = {
  today: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>
    </svg>
  ),
  trends: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M3.5 19.5h17"/><path d="M5 15.5l4.2-4.4 3.3 2.6 6-6.4"/><path d="M14.5 7.3h4v4"/>
    </svg>
  ),
  rules: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M12 3l7.5 3v5.5c0 4.4-3.1 7.9-7.5 9.5-4.4-1.6-7.5-5.1-7.5-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.3-4.6"/>
    </svg>
  ),
}

// Today's tile is the yellow lamp with an ink icon (13:1); Trends is sky with a white icon (3.4:1, graphic).
const PART = {
  today:  { tile: 'bg-[#ffcc00] text-ink', rule: 'bg-[#ffcc00]' },
  trends: { tile: 'bg-sky text-white', rule: 'bg-sky/50' },
  rules:  { tile: 'bg-lilac-wash text-lilac-ink', rule: 'bg-lilac/30' },
}

export function ProPart({ id, kind, title, line, as: As = 'h2', small = false, className }) {
  const t = PART[kind] || PART.today
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2.5">
        <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-[11px]', small ? 'size-8' : 'size-10', t.tile)}>
          {ICON[kind]}</span>
        <As id={id} className={cn('m-0 shrink-0 font-display font-bold leading-none tracking-tight text-ink',
          small ? 'text-ui' : 'text-row')}>{title}</As>
        <span aria-hidden className={cn('h-[3px] min-w-6 flex-1 rounded-bar', t.rule)}/>
      </div>
      {line && <p className={cn('m-0 text-fine text-ink-2', small ? 'pl-[42px]' : 'pl-[50px]')}>{line}</p>}
    </div>
  )
}

export function LightTiles({ counts, unit = 'teens', className, label = 'Heads Up today' }) {
  return (
    <ul aria-label={label} className={cn('m-0 grid list-none grid-cols-3 gap-2 p-0 sm:gap-3', className)}>
      {['green', 'yellow', 'red'].map(k => {
        const t = LIGHT_TONE[k]
        const n = counts[k] || 0
        return (
          <li key={k} className={cn('flex min-w-0 flex-col items-center gap-1.5 rounded-panel border-2 px-1.5 py-3 text-center',
            'sm:flex-row sm:gap-3 sm:px-3.5 sm:text-left', t.band, t.edge)}>
            <LampFace light={k} size={40} className="sm:!size-12"/>
            <span className="min-w-0">
              <span className="block font-display text-stat font-bold tabular-nums leading-none text-ink">{n}</span>
              <span className={cn('mt-1 block text-fine font-bold', t.ink)}>{STATUS_WORD[k]}
                <span className="sr-only">, {n} {n === 1 ? unit.replace(/s$/, '') : unit}</span></span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

// Decorative: `cycle` lights one lamp every 1.5 s; under reduced motion all three stay lit.
export function TrafficLight({ size = 30, horizontal = false, cycle = true, className }) {
  const reduce = useReducedMotion()
  const [on, setOn] = React.useState(0)
  const live = cycle && !reduce
  React.useEffect(() => {
    if (!live) return undefined
    const id = setInterval(() => setOn(v => (v + 1) % 3), 1500)
    return () => clearInterval(id)
  }, [live])
  const pad = Math.round(size * 0.28)
  return (
    <span aria-hidden className={cn('inline-flex shrink-0 rounded-[18px] bg-[#082016] ring-1 ring-white/10',
      horizontal ? 'flex-row' : 'flex-col', className)}
      style={{ padding: pad, gap: Math.round(size * 0.24) }}>
      {['red', 'yellow', 'green'].map((k, i) => (
        <motion.span key={k} className="block" initial={false}
          animate={{ opacity: !live || on === i ? 1 : 0.38, scale: live && on === i ? 1.06 : 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <LampFace light={k} size={size}/>
        </motion.span>
      ))}
    </span>
  )
}

