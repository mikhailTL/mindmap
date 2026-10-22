import React from 'react'
import { cn } from '../lib/utils'

const GROUND = {
  paper: 'bg-paper text-ink',
  card:  'bg-card text-ink',
  mist:  'bg-mist text-ink',
  ink:   'bg-ink text-paper',
}

const NAME = {
  paper: 'text-accent',
  card:  'text-accent',
  mist:  'text-accent',
  ink:   'text-accent-lit',
}

// With an id, scroll-mt-14 clears the 56px sticky header when a link jumps to the section.
export function Section({ name, tone = 'paper', id, className, children, bleed = false, tight = false }) {
  return (
    <section id={id} className={cn(GROUND[tone] || GROUND.paper, 'border-t border-rule', id && 'scroll-mt-14 outline-none', className)}>
      <div className={cn(bleed ? 'w-full' : 'wrap', tight ? 'py-5 lg:py-7' : 'py-7 lg:py-10')}>
        {name && (
          <p className={cn('font-body text-ui font-semibold', NAME[tone])}>{name}</p>
        )}
        {children}
      </div>
    </section>
  )
}

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
