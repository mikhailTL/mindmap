import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* shadcn/ui Badge, adapted. The registry ships four variants in slate and a
 * generic red; this product has exactly two things a badge ever says, and
 * neither is decorative:
 *   state — a status word beside a record
 *   count — a tally, in the figure face, tabular so a column of them aligns
 * `destructive` is deleted: an alarm on this site is a row in crit, not a pill.
 * Both variants carry a shape or a weight difference as well as a colour, so
 * they survive grayscale.
 *
 * `demo` is deleted, and must not come back. It was a rounded-chip capsule
 * reading "Sample data — not a real person": a coloured pill floating beside
 * the figures it was disclaiming. Two problems, one of them serious. The
 * capsule is the single most recognisable generated-interface shape, and it
 * made the disclosure read as ornament — but worse, the thing it carries is a
 * sentence about what this data is, and a badge is a label, so the sentence
 * was being compressed into something that looked like a tag.
 * It now lives in src/ui/notice.jsx as DemoNotice (and RealNotice, for the
 * no-patch-paired fault), built as a ruled margin annotation in the same
 * idiom as .mark and .note. Put the disclosure there; do not re-add a
 * variant here.
 */
const badge = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap border align-middle',
  {
    variants: {
      variant: {
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
