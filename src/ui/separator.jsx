import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cn } from '@/lib/utils'

export const Separator = React.forwardRef(function Separator(
  { className, orientation = 'horizontal', decorative = true, weight = 'hair', ...props }, ref) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0',
        weight === 'hair' ? 'bg-rule' : 'bg-ink',
        orientation === 'horizontal'
          ? (weight === 'hair' ? 'h-px w-full' : 'h-[2px] w-full')
          : (weight === 'hair' ? 'w-px h-full' : 'w-[2px] h-full'),
        className
      )}
      {...props}
    />
  )
})
