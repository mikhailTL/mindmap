import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../lib/utils'

/* shadcn/ui Button pattern (cva + asChild-less slot), adapted:
   registry radii and ring colours swapped for project tokens, sizes re-fit to a
   glancing/anxious posture (48px floor, not 36px), and all eight states filled in.

   The three variants are three different objects, not one shape at three fill
   levels — filled and outlined side by side is the component-library default
   and reads as the same control twice. `solid` is a printed key: an ink block
   that inverts. `outline` is a ruled field: no fill, a hairline box, its label
   typed rather than set, because it is the secondary control on a form.
   `ghost` is not a button shape at all — it is an underlined inline link with
   a rule that thickens. */
const button = cva(
  'inline-flex items-center justify-center gap-2.5 whitespace-nowrap ' +
  'transition-[background-color,color,box-shadow,border-color] duration-150 ease-out ' +
  'disabled:pointer-events-none disabled:opacity-45 select-none ' +
  '[&_svg]:shrink-0 [&_svg]:size-[1.05em]',
  {
    variants: {
      variant: {
        solid:   'rounded-field font-display font-medium bg-ink text-paper ' +
                 'hover:bg-accent-ink active:bg-accent-ink',
        /* Was set in the mono face at 0px radius, which put a third
           typeface and a third corner treatment next to the two solid keys it
           sits beside. It is the same control at a lower rank, so it is now
           the same shape and the same face, distinguished by fill alone. */
        outline: 'rounded-field font-display font-medium text-ink bg-transparent ' +
                 'border border-ink hover:bg-mist active:bg-mist',
        ghost:   'rounded-none px-0 font-display font-medium text-accent bg-transparent ' +
                 'border-b-2 border-accent/35 hover:border-accent hover:text-accent-ink',
      },
      size: { md:'min-h-[54px] px-7 text-ui', sm:'min-h-[46px] px-4 text-ui' },
    },
    defaultVariants: { variant:'solid', size:'md' },
  }
)
export const Button = React.forwardRef(function Button({ className, variant, size, ...p }, ref){
  return <button ref={ref} className={cn(button({variant,size}), className)} {...p} />
})
