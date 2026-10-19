import * as React from 'react'
import { cn } from '@/lib/utils'

/* Four surface treatments, one radius, one palette. A page made of one white
   card repeated reads as a template, so neighbours take different ones and a
   treatment means something:
     plain    the white card. Figures, charts, anything read closely.
     tint     a hue's wash, a hairline in that hue, no shadow. Today, or the
              thing a section is about.
     rule     no box: a 3px rule in the hue on top (or left) and the content on
              the page ground. Reading notes, rules, asides.
     outline  transparent ground and a 1.5px edge. A box on a coloured band.
   The dark `ink` card is gone (owner, 19 October: "stop making things
   dark"); a callout is a tint now. Every ink step (ink, ink-2, ink-3,
   accent, the hue inks) clears 4.5 : 1 on every wash; measured, the weakest is ink-3 on accent-wash at 5.10.
   Tailwind needs whole class names, so each hue is spelled out. */
const TINT = {
  accent: 'border-accent/30 bg-accent-wash',
  beam:   'border-beam/30 bg-beam-wash',
  sky:    'border-sky/30 bg-sky-wash',
  sun:    'border-sun/35 bg-sun-wash',
  lilac:  'border-lilac/25 bg-lilac-wash',
  coral:  'border-coral/30 bg-coral-wash',
  mint:   'border-mint/30 bg-mint-wash',
}
const RULE_TOP = {
  accent: 'border-t-accent', beam: 'border-t-beam', sky: 'border-t-sky', sun: 'border-t-sun',
  lilac: 'border-t-lilac', coral: 'border-t-coral', mint: 'border-t-mint', ink: 'border-t-ink',
}
const RULE_LEFT = {
  accent: 'border-l-accent', beam: 'border-l-beam', sky: 'border-l-sky', sun: 'border-l-sun',
  lilac: 'border-l-lilac', coral: 'border-l-coral', mint: 'border-l-mint', ink: 'border-l-ink',
}
/* The hairline a row divider takes inside each treatment. */
const DIVIDE = {
  accent: 'border-accent/25', beam: 'border-beam/25', sky: 'border-sky/25', sun: 'border-sun/30',
  lilac: 'border-lilac/20', coral: 'border-coral/25', mint: 'border-mint/25',
}

export const VARIANTS = ['plain', 'tint', 'rule', 'outline']

/* The surface only: ground, edge, radius, shadow. Padding and layout stay at
   the call site. `side` is for `rule`: 'top' (default) or 'left'. */
export function cardClass(variant = 'plain', hue = 'accent', side = 'top') {
  switch (variant) {
    case 'tint':
      return cn('rounded-panel border', TINT[hue] || TINT.accent)
    case 'rule':
      return side === 'left'
        ? cn('rounded-none border-0 border-l-[3px] bg-transparent', RULE_LEFT[hue] || RULE_LEFT.accent)
        : cn('rounded-none border-0 border-t-[3px] bg-transparent', RULE_TOP[hue] || RULE_TOP.accent)
    case 'outline':
      return 'rounded-panel border-[1.5px] border-ruling bg-transparent'
    default:
      return 'rounded-panel border border-rule bg-card shadow-card'
  }
}

/* Inner hairlines and text steps that follow the surface. */
export function cardInk(variant = 'plain', hue = 'accent') {
  return {
    line: variant === 'tint' ? (DIVIDE[hue] || DIVIDE.accent) : 'border-rule',
    head: 'text-ink', body: 'text-ink-2', soft: 'text-ink-3', link: 'text-accent',
  }
}

/* CardTitle takes `as` so a title never lands outside the heading outline. */
export const Card = React.forwardRef(function Card(
  { className, interactive = false, variant = 'plain', hue = 'accent', side = 'top', as: As = 'div', ...props }, ref) {
  return (
    <As
      ref={ref}
      className={cn(
        cardClass(variant, hue, side), 'text-ink overflow-hidden',
        /* Transition properties are explicit: `transition-all` would animate
           border-left-width, so the 3px rule would grow in from 0 instead of
           appearing. Hover is gated to a fine pointer or the rule latches on
           after a tap. Press squeeze is behind motion-safe:. */
        interactive && [
          'w-full text-left cursor-pointer touch-manipulation',
          'transition-[border-color,box-shadow,transform] duration-200 ease-[var(--ease-out)]',
          'hoverOnly:border-accent/50 hoverOnly:shadow-raise motion-safe:hoverOnly:-translate-y-0.5',
          'focus-visible:border-accent',
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
