import React from 'react'
import { cn } from '../lib/utils'

/* Ground, heading size and padding live here, not at the call site. paper and
   card differ by ~2% luminance, so `tone="ink"` is the only real separation. */
const GROUND = {
  paper: 'bg-paper text-ink',
  card:  'bg-card text-ink',
  mist:  'bg-mist text-ink',
  ink:   'bg-ink text-paper',
}

/* accent measures 2.80:1 on the ink ground and fails; that ground takes
   accent-lit, at 7.67:1. */
const NAME = {
  paper: 'text-accent',
  card:  'text-accent',
  mist:  'text-accent',
  ink:   'text-accent-lit',
}

/* Two padding steps, not a number per section. `tight` is for a band that is
   mostly picture; the default is for one that is mostly read. */
export function Section({ name, tone = 'paper', id, className, children, bleed = false, tight = false }) {
  return (
    <section id={id} className={cn(GROUND[tone] || GROUND.paper, 'border-t border-rule', className)}>
      <div className={cn(bleed ? 'w-full' : 'wrap', tight ? 'py-5 lg:py-7' : 'py-7 lg:py-10')}>
        {name && (
          <p className={cn('font-mono text-body font-bold tracking-[0.005em]', NAME[tone])}>{name}</p>
        )}
        {children}
      </div>
    </section>
  )
}

/* text-sub is a single clamp. Do not split it into per-breakpoint sizes: the
   pair it replaced shrank the heading as the viewport grew. */
export function SectionHead({ children, tone = 'paper', className }) {
  return (
    <h2 className={cn('mt-2 font-display font-bold text-sub leading-[1.12] tracking-tight',
      tone === 'ink' ? 'text-paper' : 'text-ink', className)}>
      {children}
    </h2>
  )
}

export function SectionLede({ children, tone = 'paper', className }) {
  return (
    <p className={cn('mt-2.5 max-w-[54ch] text-sec leading-[1.55]',
      tone === 'ink' ? 'text-mist' : 'text-ink-2', className)}>
      {children}
    </p>
  )
}
