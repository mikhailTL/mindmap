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
/* Motion, decided once here rather than at seventy call sites.

   Press feedback is the one animation every button on the site gets: a 3%
   squeeze under the finger or the cursor, on transform, at 150ms with the
   site's ease-out. It is also what replaces the grey tap flash that
   -webkit-tap-highlight-color: transparent removes in input.css — remove the
   flash without this and a tap on a phone reports nothing at all. It is behind
   motion-safe: under prefers-reduced-motion nothing should move, and the
   per-variant active: colour swap is already a press signal on its own.

   The property list is explicit and `transition-all` is not used anywhere.
   `all` would sweep in border-width, the focus outline and any layout property
   a call site happens to add, so a button that gains px-8 on sm: would animate
   its own width on resize.

   Hover sits behind @media (hover: hover) and (pointer: fine). A tap on a
   touch screen fires :hover and leaves it stuck there, so an ungated
   hoverOnly:bg-accent-ink means the last button you pressed stays dark until you
   press another one. The variant is spelled out in full on every utility and
   never assembled from a prefix constant: Tailwind extracts class names by
   scanning this file as text, so a concatenated prefix is two tokens it does
   not recognise and the rule is simply never generated. */
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
        /* Was set in the mono face at 0px radius, which put a third
           typeface and a third corner treatment next to the two solid keys it
           sits beside. It is the same control at a lower rank, so it is now
           the same shape and the same face, distinguished by fill alone. */
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
