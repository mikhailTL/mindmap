import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from '@/ui/marks'
import { cn } from '@/lib/utils'

/* shadcn/ui Accordion, adapted.
 *  - lucide-react is out. It is banned on this project and it was pulling a
 *    whole icon package in for one glyph; `Chevron` is the site's own drawn
 *    mark and is already in the bundle.
 *  - The registry's `hover:underline` on the trigger is deleted: underline
 *    means link here, and this is a disclosure.
 *  - The trigger is 54px tall, not the registry's 36. Posture on this site is
 *    a teenager one-handed on a phone.
 *  - Content animates on the project's own easing curve and respects reduced
 *    motion through the global rule in input.css. */
export const Accordion = AccordionPrimitive.Root

export const AccordionItem = React.forwardRef(function AccordionItem({ className, ...props }, ref) {
  return <AccordionPrimitive.Item ref={ref} className={cn('border-b border-rule', className)} {...props} />
})

export const AccordionTrigger = React.forwardRef(function AccordionTrigger(
  { className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          'group flex min-h-[54px] flex-1 items-center justify-between gap-4 py-4 text-left',
          'font-display text-row font-medium text-ink',
          'transition-colors duration-150 hover:text-accent',
          'data-[state=open]:text-accent',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="size-5 shrink-0 text-ink-3 transition-transform duration-200
          group-data-[state=open]:rotate-180"/>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
})

export const AccordionContent = React.forwardRef(function AccordionContent(
  { className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden data-[state=closed]:animate-up data-[state=open]:animate-down"
      {...props}
    >
      <div className={cn('pb-5 pt-0 text-sec text-ink-2', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
})
