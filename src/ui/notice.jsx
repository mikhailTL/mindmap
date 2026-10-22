import * as React from 'react'
import { cn } from '../lib/utils'

function Notice({ tag, tone, rule, inline, children, className }) {
  return (
    <span
      className={cn(
        'rounded-none border-l-2 pl-3',
        rule,
        inline
          ? 'inline-flex items-baseline gap-x-2.5 py-0.5'
          : 'flex flex-wrap items-baseline gap-x-3 gap-y-1 py-1.5',
        className
      )}
    >
      <span className={cn('shrink-0 font-display font-bold', tone, inline ? 'text-fine' : 'text-tick')}>
        {tag}
      </span>
      <span className={cn('text-ink-2', inline ? 'text-fine' : 'max-w-[62ch] text-meta')}>
        {children}
      </span>
    </span>
  )
}

/* An ink tag on an accent rule, no alarm colour. */
export function PatchNotice({ children = 'Patch use is optional but recommended.', className, inline = false }) {
  return (
    <Notice tag="Patch" tone="text-ink" rule="border-accent" inline={inline} className={className}>
      {children}
    </Notice>
  )
}
