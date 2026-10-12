import * as React from 'react'
import { cn } from '@/lib/utils'

/* CardTitle takes `as` so a title never lands outside the heading outline. */
export const Card = React.forwardRef(function Card(
  { className, interactive = false, as: As = 'div', ...props }, ref) {
  return (
    <As
      ref={ref}
      className={cn(
        'bg-card text-ink border border-rule rounded-panel overflow-hidden',
        /* Transition properties are explicit: `transition-all` would animate
           border-left-width, so the 3px rule would grow in from 0 instead of
           appearing. Hover is gated to a fine pointer or the rule latches on
           after a tap. Press squeeze is behind motion-safe:. */
        interactive && [
          'w-full text-left cursor-pointer touch-manipulation',
          'border-l-[3px] border-l-transparent',
          'transition-[border-color,box-shadow,transform] duration-150 ease-[var(--ease-out)]',
          'hoverOnly:border-l-accent',
          'focus-visible:border-l-accent',
          'active:shadow-none motion-safe:active:scale-[0.99]',
          'disabled:pointer-events-none disabled:opacity-45 disabled:active:scale-100',
        ],
        className
      )}
      {...props}
    />
  )
})

export const CardHeader = React.forwardRef(function CardHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col gap-1.5 p-6 pb-0', className)} {...props} />
})

export const CardTitle = React.forwardRef(function CardTitle(
  { className, as: As = 'h3', ...props }, ref) {
  return <As ref={ref} className={cn('font-display font-bold text-head text-ink', className)} {...props} />
})

export const CardDescription = React.forwardRef(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn('text-sec text-ink-2', className)} {...props} />
})

export const CardContent = React.forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn('p-6', className)} {...props} />
})

export const CardFooter = React.forwardRef(function CardFooter({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex items-center gap-4 p-6 pt-0', className)} {...props} />
})
