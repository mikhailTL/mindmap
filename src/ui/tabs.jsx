import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

/* shadcn/ui Tabs, adapted.
 *
 * The registry's tabs are a pill group: a grey trough with a white capsule
 * sliding inside it. That is a segmented control, and it is wrong here — these
 * tabs switch between whole views of a record, not between two states of one
 * field. So the trough is deleted and the selected tab is marked the way a
 * ruled sheet marks a column: a 2px accent rule on the baseline the whole
 * strip shares.
 *
 * Also changed: 36px triggers to 52px, the registry's offset focus ring to the
 * project's drawn focus, and `text-sm` to the project's own step. */
export const Tabs = TabsPrimitive.Root

export const TabsList = React.forwardRef(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn('flex flex-wrap items-stretch gap-x-7 gap-y-1 border-b border-ink', className)}
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
        'transition-colors duration-150',
        'hover:text-ink',
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
