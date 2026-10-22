import React from 'react'
import { cn } from '../lib/utils'

// Scale in network units; -1 and +1 are where the call sites clamp.
const TICKS = [-1, -0.5, 0, 0.5, 1]
const NUMBERED = [-1, 0, 1]
const PCT = x => 50 + x * 50

// Rows and axis share one grid template, so each tick lines up with the bars it measures.
const COLS = 'grid-cols-[minmax(0,1fr)_5.75rem] '
  + 'sm:grid-cols-[minmax(0,14rem)_minmax(9rem,1fr)_5.75rem]'

const fmt = x => (x > 0 ? '+' : '') + x.toFixed(2)

function Track({ x }) {
  const up = x > 0.02, down = x < -0.02
  return (
    <span className="relative block h-[18px]">
      {[-0.5, 0.5].map(t => (
        <span key={t} aria-hidden style={{ left: `${PCT(t)}%` }}
          className="absolute inset-y-0 block w-px bg-rule"/>
      ))}
      <span aria-hidden style={{ width: `${Math.max(Math.abs(x), 0.012) * 50}%`,
        [x >= 0 ? 'left' : 'right']: '50%' }}
        className={cn('absolute top-px block h-4 rounded-sm',
          up ? 'bg-warn' : down ? 'bg-accent' : 'bg-ruling')}/>
      <span aria-hidden
        className="absolute inset-y-0 left-1/2 block w-px -translate-x-1/2 bg-ink-3"/>
    </span>
  )
}

function Axis() {
  return (
    <span className="relative mt-1.5 block h-[52px] border-t border-ink-3/60">
      {TICKS.map(t => (
        <React.Fragment key={t}>
          <span aria-hidden style={{ left: `${PCT(t)}%` }}
            className="absolute top-0 block h-1.5 w-px -translate-x-1/2 bg-ink-3"/>
          {NUMBERED.includes(t) && (
            <span style={{ left: `${PCT(t)}%` }}
              className={cn('absolute top-2 block whitespace-nowrap text-fine',
                'tabular-nums text-ink-3',
                t === -1 ? 'translate-x-0' : t === 1 ? '-translate-x-full' : '-translate-x-1/2')}>
              {t === 0 ? '0' : (t > 0 ? '+' : '') + t.toFixed(2)}
            </span>
          )}
        </React.Fragment>
      ))}
      <span className="absolute inset-x-0 top-8 flex justify-between text-fine text-ink-3">
        <span>lowered</span>
        <span>raised</span>
      </span>
    </span>
  )
}

export function Diverge({ items }) {
  return (
    <div>
      <ul className="m-0 mt-3.5 list-none p-0">
        {items.map(it => {
          const up = it.x > 0.02, down = it.x < -0.02
          return (
            <li key={it.label}
              className={cn('grid items-center gap-x-4 gap-y-1.5 border-b border-rule py-3.5',
                COLS, 'sm:gap-x-5')}>
              <span className="col-span-2 text-meta text-ink-2 sm:col-span-1">{it.label}</span>
              <Track x={it.x}/>
              <span className={cn('whitespace-nowrap text-sec tabular-nums sm:text-right',
                up ? 'text-warn' : down ? 'text-accent' : 'text-ink-3')}>
                {up ? '▲' : down ? '▼' : '●'} {fmt(it.x)}
              </span>
            </li>
          )
        })}
        <li className={cn('grid gap-x-4', COLS, 'sm:gap-x-5')}>
          <span aria-hidden className="hidden sm:block"/>
          <Axis/>
          <span aria-hidden className="hidden sm:block"/>
        </li>
      </ul>
    </div>
  )
}
