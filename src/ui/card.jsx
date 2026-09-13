import * as React from 'react'
import { cn } from '@/lib/utils'

/* shadcn/ui Card (new-york), adapted.
 *
 * What changed from the registry source, and why:
 *  - slate-200 / white / slate-950 and every dark: variant are gone. This
 *    product has one theme and one palette; carrying a second one in the class
 *    string is how a sourced component keeps looking sourced.
 *  - `rounded-xl` (12px) down to `rounded-panel` (10px), which is the radius
 *    this system gives a containing surface. The registry's own shadow is
 *    replaced by the site's single depth mechanism: a hard offset, no blur.
 *  - `interactive` added. A card that is a button needs seven more states than
 *    the registry ships, and the leading rule — not a lift — is what marks it.
 *  - CardTitle renders an element you choose. The registry hard-codes a div,
 *    which puts a heading-shaped thing outside the heading outline.
 */
export const Card = React.forwardRef(function Card(
  { className, interactive = false, as: As = 'div', ...props }, ref) {
  return (
    <As
      ref={ref}
      className={cn(
        'bg-card text-ink border border-rule rounded-panel overflow-hidden',
        interactive && [
          'w-full text-left cursor-pointer',
          'border-l-[3px] border-l-transparent',
          'transition-[border-color,background-color,box-shadow] duration-150 ease-out',
          'hover:border-l-accent hover:bg-mist/70',
          'focus-visible:border-l-accent focus-visible:bg-mist/70',
          'active:bg-mist active:shadow-none',
          'disabled:pointer-events-none disabled:opacity-45',
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
  return <As ref={ref} className={cn('font-display font-medium text-head text-ink', className)} {...props} />
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
