import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

// scroll: the strip scrolls sideways when its triggers do not fit a 390px screen, rather than wrapping.
export const TabsList = React.forwardRef(function TabsList({ className, scroll, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'flex items-stretch gap-x-7 border-b border-ink',
        scroll
          ? 'flex-nowrap overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : 'flex-wrap gap-y-1',
        className
      )}
      {...props}
    />
  )
})

export const TabsTrigger = React.forwardRef(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'relative -mb-px inline-flex min-h-[52px] items-center whitespace-nowrap',
        'border-b-2 border-transparent px-0.5 font-display text-row font-medium text-ink-2',
        'select-none touch-manipulation',
        'transition-[color] duration-100 ease-[ease]',
        'hoverOnly:text-ink',
        'active:text-ink',
        'data-[state=active]:border-accent data-[state=active]:text-ink',
        'disabled:pointer-events-none disabled:opacity-45',
        className
      )}
      {...props}
    />
  )
})

export const TabsContent = React.forwardRef(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cn('mt-8 outline-none', className)} {...props} />
})
