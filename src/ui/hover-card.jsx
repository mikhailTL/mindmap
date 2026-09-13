import * as React from 'react'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import { cn } from '@/lib/utils'

/* shadcn/ui HoverCard, adapted. Used for one job on this site: the definition
 * behind a term in a reading ("velocity", "index"), so a counselor does not
 * have to leave the row to find out what a column means.
 *
 * Changed from the registry: the drop shadow becomes the project's hard
 * offset, the slate surface becomes card stock with a rule, and the open delay
 * goes from 0 to 180ms — at 0 the card fires on every pass of the cursor. */
export const HoverCard = HoverCardPrimitive.Root
export const HoverCardTrigger = HoverCardPrimitive.Trigger

export const HoverCardContent = React.forwardRef(function HoverCardContent(
  { className, align = 'start', sideOffset = 8, ...props }, ref) {
  return (
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-72 rounded-panel border border-rule bg-card p-4 text-sec text-ink-2 shadow-raise',
        'data-[state=open]:animate-down',
        className
      )}
      {...props}
    />
  )
})
