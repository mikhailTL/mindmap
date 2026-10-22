import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

export const Progress = React.forwardRef(function Progress(
  { className, value = 0, max = 100, tone, label, ...props }, ref) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      max={max}
      aria-label={label}
      className={cn('relative h-2 w-full overflow-hidden rounded-bar bg-rule/60', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full rounded-bar transition-[width] duration-500 ease-out',
          !tone && 'bg-accent')}
        style={tone ? { width: `${pct}%`, background: tone } : { width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  )
})
