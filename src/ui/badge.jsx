import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badge = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap border align-middle',
  {
    variants: {
      variant: {
        state: 'rounded-field border-rule bg-mist px-2 py-0.5 font-display text-fine font-medium text-ink-2',
        count: 'rounded-field border-transparent bg-accent px-2 py-0.5 font-display text-fine font-bold tabular-nums text-paper',
      },
    },
    defaultVariants: { variant: 'state' },
  }
)

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badge({ variant }), className)} {...props} />
}
