import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../lib/utils'

/* shadcn/ui Button pattern (cva + asChild-less slot), adapted:
   registry radii and ring colours swapped for project tokens, sizes re-fit to a
   glancing/anxious posture (48px floor, not 36px), and all eight states filled in. */
const button = cva(
  'inline-flex items-center justify-center gap-2.5 font-display font-medium whitespace-nowrap ' +
  'rounded-xs transition-[background-color,color,box-shadow,transform] duration-150 ease-out ' +
  'disabled:pointer-events-none disabled:opacity-45 select-none active:translate-y-px ' +
  '[&_svg]:shrink-0 [&_svg]:size-[1.05em]',
  {
    variants: {
      variant: {
        solid:   'bg-ink text-paper hover:bg-accent-ink active:bg-accent-ink',
        outline: 'bg-paper text-ink shadow-[inset_0_0_0_1px_theme(colors.rule)] ' +
                 'hover:shadow-[inset_0_0_0_1px_theme(colors.ink.3)] hover:bg-sage/40',
        ghost:   'bg-transparent text-accent hover:bg-accent-wash',
      },
      size: { md:'min-h-[54px] px-7 text-ui', sm:'min-h-[46px] px-4 text-ui' },
    },
    defaultVariants: { variant:'solid', size:'md' },
  }
)
export const Button = React.forwardRef(function Button({ className, variant, size, ...p }, ref){
  return <button ref={ref} className={cn(button({variant,size}), className)} {...p} />
})
