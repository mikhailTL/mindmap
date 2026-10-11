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
        /* Hover moves the leading rule and nothing else. It used to repaint
           the whole card's background as well, and on a page whose bands are
           already four different tints that read as the card flashing a
           colour from somewhere else in the palette: messy, and on a light
           band the card went white against white. A 3px rule appearing is
           enough to say "this is a control", and it is the same signal
           whatever ground the card is sitting on. */
        /* Motion on an interactive card, under the same rules as Button.
           Press is a 1% squeeze rather than Button's 3%: a card is 400px wide
           and several hundred tall, and 3% off that is 12px of travel at the
           edge, which reads as the layout glitching rather than as a control
           being pressed. The transform is listed in the transition explicitly
           alongside border-color and box-shadow — `transition-all` here would
           also animate border-left-width, so the 3px rule would grow in from
           0 instead of appearing, and would animate padding on any call site
           that sets p-8 at a breakpoint.
           Hover is gated to a fine pointer: on touch the leading rule would
           latch on after a tap and stay lit while you read the next screen.
           The squeeze is behind motion-safe:; under reduced motion the shadow
           dropping is the whole press signal, which is a paint change and not
           a movement. */
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
