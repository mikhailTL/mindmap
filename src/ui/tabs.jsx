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
 * project's drawn focus, and `text-sm` to the project's own step.
 *
 * THE INDICATOR DOES NOT ANIMATE, and this is the deliberate part.
 *
 * It used to: `transition-colors` covered border-color as well as color, so
 * the 2px accent rule faded in over 150ms on every switch. That is wrong on a
 * frequency argument rather than a taste one. A tab switch is something a
 * reader does tens or hundreds of times in a session — it is navigation, not
 * an event — and an animation on an action at that frequency is a tax paid
 * every time: the rule is still arriving when the eye has already moved to the
 * content, and the content under it has already swapped, so the two disagree
 * for a tenth of a second. Instant is also the only thing that stays honest
 * when a key is held down on the arrow keys.
 *
 * The same reasoning rules out the registry's sliding capsule and any
 * layoutId-style shared-element move between triggers, so neither is here.
 *
 * What is left is a 100ms fade on `color` alone, for hover on a pointer
 * device, which is the near-imperceptible end of the scale a many-times-a-day
 * interaction is allowed; border-color is deliberately not in that list. */
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
        'select-none touch-manipulation',
        /* color only, never border-color: the active rule must appear, not
           arrive. `ease` rather than a cut curve, because this is a hover
           colour and nothing is travelling. */
        'transition-[color] duration-100 ease-[ease]',
        'hoverOnly:text-ink',
        /* the press state a tapped tab needs now that the grey tap flash is
           gone. It rides the same 100ms colour fade above, which is short
           enough to land with the finger; the scale nudge that goes with it on
           touch comes from the global :active rule in input.css. */
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
