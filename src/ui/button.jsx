import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../lib/utils'

// motion-safe:active:scale is the tap feedback, since input.css turns off the tap highlight.
// hoverOnly: limits hover styles to fine pointers so they do not stick after a tap.
const button = cva(
  'inline-flex items-center justify-center gap-2.5 whitespace-nowrap ' +
  'transition-[background-color,color,box-shadow,border-color,transform] ' +
  'duration-150 ease-[var(--ease-out)] motion-safe:active:scale-[0.97] ' +
  'disabled:pointer-events-none disabled:opacity-45 disabled:active:scale-100 ' +
  'select-none touch-manipulation ' +
  '[&_svg]:shrink-0 [&_svg]:size-[1.05em]',
  {
    variants: {
      variant: {
        solid:   'rounded-field font-display font-semibold bg-accent text-paper ' +
                 'shadow-[0_1px_2px_rgba(13,43,30,.12),0_6px_16px_-8px_rgba(21,116,70,.55)] active:bg-accent-ink ' +
                 'hoverOnly:bg-accent-ink',
        outline: 'rounded-field font-display font-semibold text-ink bg-card ' +
                 'border border-rule shadow-card active:bg-mist ' +
                 'hoverOnly:border-ink-3 hoverOnly:bg-mist',
        ghost:   'rounded-none px-0 font-display font-medium text-accent bg-transparent ' +
                 'border-b-2 border-accent/35 active:text-accent-ink ' +
                 'hoverOnly:border-accent ' +
                 'hoverOnly:text-accent-ink',
      },
      size: { md:'min-h-[54px] px-7 text-ui', sm:'min-h-[46px] px-4 text-ui' },
    },
    defaultVariants: { variant:'solid', size:'md' },
  }
)
export const Button = React.forwardRef(function Button({ className, variant, size, ...p }, ref){
  return <button ref={ref} className={cn(button({variant,size}), className)} {...p} />
})
