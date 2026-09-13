import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* shadcn/ui Badge, adapted. The registry ships four variants in slate and a
 * generic red; this product has exactly three things a badge ever says, and
 * none of them are decorative:
 *   demo  — this figure was generated and nobody was measured
 *   state — a status word beside a record
 *   count — a tally, in the figure face, tabular so a column of them aligns
 * `destructive` is deleted: an alarm on this site is a row in crit, not a pill.
 * Every variant carries a shape or a weight difference as well as a colour,
 * so the three survive grayscale. */
const badge = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap border align-middle',
  {
    variants: {
      variant: {
        demo:  'rounded-chip border-warn/45 bg-warn-wash px-3 py-1 font-mono text-fine text-warn',
        state: 'rounded-field border-rule bg-mist px-2.5 py-0.5 font-display text-fine font-medium text-ink-2',
        count: 'rounded-chip border-transparent bg-accent px-2.5 py-0.5 font-mono text-fine tabular-nums text-paper',
      },
    },
    defaultVariants: { variant: 'state' },
  }
)

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badge({ variant }), className)} {...props} />
}
