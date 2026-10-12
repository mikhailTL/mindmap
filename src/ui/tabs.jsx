import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

/* The selected tab is a 2px accent rule on the baseline the strip shares, and
   it must not animate: a tab switch is navigation, repeated tens of times a
   session, and a fading rule lags the content that already swapped. Keep
   border-color out of the transition list, and no sliding indicator. */
export const Tabs = TabsPrimitive.Root

/* `scroll` is for a strip with more triggers than fit a 390px screen: wrapping
   one to three rows costs a third of the viewport, so it scrolls sideways
   instead and bleeds to the gutter edge so the cut tab reads as cut. */
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
        /* color only, never border-color. */
        'transition-[color] duration-100 ease-[ease]',
        'hoverOnly:text-ink',
        /* Press state, since the grey tap flash is suppressed; the scale nudge
           on touch comes from the global :active rule in input.css. */
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
