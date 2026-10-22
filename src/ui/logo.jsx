import React from 'react'
import { cn } from '../lib/utils'

export function LogoMark({ className, title }) {
  return (
    <svg viewBox="0 0 40 28" className={className} role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true} aria-label={title}>
      <rect x="2" y="4" width="36" height="20" rx="10"
        fill="none" stroke="currentColor" strokeWidth="2.2"/>
      <path d="M10.5 18.2 15 10.2 20 15.8 25.4 11 29.5 17.6"
        fill="none" stroke="currentColor" strokeWidth="2.3"
        strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="29.5" cy="17.6" r="2.4" fill="var(--logo-peak, currentColor)"/>
    </svg>
  )
}

// tone picks the green for "Map": accent is 2.80:1 on the ink ground, so ink uses accent-lit (7.67:1).
export function Logo({ className, markClassName, tone = 'paper', title = 'MindMap', motto = false }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={cn('h-[1.15em] w-auto shrink-0', markClassName)}/>
      <span className="font-display font-bold leading-none tracking-[-0.015em]">
        Mind<span className={tone === 'paper' ? 'text-accent' : 'text-accent-lit'}>Map</span>
      </span>
      {/* Hidden below sm: at 390 the bar has six tabs to fit. */}
      {motto && (
        <span className={cn('hidden whitespace-nowrap font-body text-meta font-normal leading-none sm:inline',
          tone === 'paper' ? 'text-ink-3' : 'text-rule')}>
          teen wellness app
        </span>
      )}
      <span className="sr-only">{title}</span>
    </span>
  )
}
