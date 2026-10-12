import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../lib/utils'

/* The press squeeze replaces the grey tap flash input.css suppresses with
   -webkit-tap-highlight-color: transparent; without it a tap on a phone
   reports nothing. Behind motion-safe:. Transition properties are explicit —
   `transition-all` would sweep in border-width, the focus outline and any
   layout utility a call site adds. Hover is gated to (hover: hover) and
   (pointer: fine), or :hover latches onto the last button tapped. Spell
   utilities out in full: Tailwind scans this file as text. */
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
        solid:   'rounded-field font-display font-medium bg-ink text-paper active:bg-accent-ink ' +
                 'hoverOnly:bg-accent-ink',
        outline: 'rounded-field font-display font-medium text-ink bg-transparent ' +
                 'border border-ink active:bg-mist ' +
                 'hoverOnly:bg-mist',
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
