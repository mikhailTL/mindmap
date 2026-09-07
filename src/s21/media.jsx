import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'

/* Media bits from the s21 kit: the fanning avatar badge and the attributed
   quote. Retokenised to the light palette — the dark kit leaned on black
   drop-shadows that read as smudges on paper, so both use the project's
   two-layer raise/lift instead. */

/* ── Images badge ──────────────────────────────────────────────────── */

/* Pill heights all clear 44px because the badge takes an onClick, and the
   counter type is on the 16px floor rather than the kit's 9–12px. */
const CFG = {
  sm: { px: 34, gap: 8,  pill: 'h-11 pl-2   pr-3.5 gap-2   text-label', cnt: 'text-label' },
  md: { px: 42, gap: 10, pill: 'h-11 pl-2.5 pr-4   gap-2.5 text-meta',  cnt: 'text-label' },
  lg: { px: 56, gap: 12, pill: 'h-14 pl-3   pr-5   gap-3   text-sec',   cnt: 'text-label' },
}

const SHAPE = {
  circle: 'rounded-full',
  rounded: 'rounded-lg',
  square: 'rounded',
}

const SPRING = { type: 'spring', stiffness: 280, damping: 24 }

const REST_ROT = [-14, -7, -2, 5, 11, -9, 3, -5]
const HOVER_ROT = [-8, -4, -1, 2, 6, -6, 2, -3]

/** Slight downward bow across the fan, so the row is not a flat strip. */
function arcY(i, total) {
  if (total <= 1) return 0
  const mid = (total - 1) / 2
  const t = (i - mid) / mid
  return t * t * (CFG.md.px * 0.22)
}

export function ImagesBadge({
  images,
  maxVisible = 3,
  revealCount = 2,
  label,
  size = 'md',
  shape = 'rounded',
  className,
  imageClassName,
  onClick,
}) {
  const [hovered, setHovered] = React.useState(false)
  const reduced = useReducedMotion()
  const { px, gap, pill, cnt } = CFG[size] || CFG.md

  const rendered = images.slice(0, maxVisible + revealCount)
  const overflow = Math.max(0, images.length - maxVisible - revealCount)
  // A null slot is the "+N" counter; it is a shape, not an image.
  const slots = overflow > 0 ? [...rendered, null] : rendered
  const total = slots.length

  const peekPx = Math.round(px * 0.32)
  const collapsedW = px + (Math.min(maxVisible, total) - 1) * peekPx
  const spreadW = total * px + (total - 1) * gap
  const spreadX = i => i * (px + gap)
  const collapsedX = i => (i >= maxVisible ? (maxVisible - 1) * peekPx : i * peekPx)

  return (
    <motion.div
      className={cn(
        'inline-flex cursor-default select-none items-center rounded-full',
        'border border-rule bg-paper/80 backdrop-blur-sm',
        'shadow-raise transition-shadow duration-300 hover:shadow-lift',
        pill,
        onClick && 'cursor-pointer',
        className)}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      onKeyDown={onClick ? e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }
      } : undefined}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      whileHover={reduced || !onClick ? undefined : { y: -2, scale: 1.015 }}
      transition={SPRING}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}>
      {/* Reduced motion gets the fan already open: the stack only makes sense
          once it spreads, and there is no spread to watch. */}
      <motion.div className="relative shrink-0" style={{ height: px + 12 }}
        animate={{ width: reduced ? spreadW : hovered ? spreadW : collapsedW }}
        transition={SPRING}>
        {slots.map((slot, i) => {
          const isHidden = i >= maxVisible && slot !== null
          const isOverflow = slot === null
          const tx = hovered ? spreadX(i) : collapsedX(i)
          const ty = hovered ? arcY(i, total) : 0
          const rotate = reduced ? 0 : hovered ? (HOVER_ROT[i] ?? 0) : (REST_ROT[i] ?? 0)
          const opacity = reduced ? 1 : isHidden ? (hovered ? 1 : 0) : 1
          const scale = reduced ? 1 : isHidden ? (hovered ? 1 : 0.6) : 1
          const zIdx = hovered ? i + 1 : total - i

          return (
            <motion.div key={i}
              className={cn(
                'absolute left-0 top-0 flex shrink-0 items-center justify-center',
                !isOverflow && 'overflow-hidden',
                SHAPE[isOverflow ? 'circle' : shape],
                'border-2 border-paper shadow-raise',
                isOverflow && 'bg-sage',
                imageClassName)}
              style={{ width: px, height: px, zIndex: zIdx }}
              animate={{
                x: reduced ? spreadX(i) : tx,
                y: reduced ? 0 : ty,
                rotate, opacity, scale,
              }}
              transition={{ ...SPRING, delay: !reduced && isHidden ? (i - maxVisible) * 0.06 : 0 }}>
              {isOverflow
                ? <span className={cn('font-mono font-semibold text-ink-3', cnt)}>+{overflow}</span>
                : <img src={slot.src} alt={slot.alt} width={px} height={px}
                    className="h-full w-full object-cover" draggable={false}/>}
            </motion.div>
          )
        })}
      </motion.div>

      {label && <span className="whitespace-nowrap font-medium leading-none text-ink-2">{label}</span>}
    </motion.div>
  )
}

/* ── Quote block ───────────────────────────────────────────────────── */

/* The kit's Avatar came from @radix-ui/react-avatar, which this project does
   not depend on. Same props, hand-rolled: the image is dropped from the DOM if
   it fails so the initials are what remain. */
function Avatar({ src, alt, fallback, size = 36, className }) {
  const [failed, setFailed] = React.useState(false)
  return (
    <span style={{ width: size, height: size }}
      className={cn('relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded border border-rule bg-sage', className)}>
      {src && !failed
        ? <img src={src} alt={alt || ''} onError={() => setFailed(true)} className="h-full w-full object-cover"/>
        : <span aria-hidden className="font-mono text-label uppercase leading-none tracking-normal text-ink-2">{fallback}</span>}
    </span>
  )
}

/** Attributed quote. Restrained — no card, no giant quotation mark. */
export function QuoteBlock({ quote, className }) {
  return (
    <figure className={cn('flex flex-col gap-5 border-l border-rule pl-6', className)}>
      <blockquote className="max-w-measure text-body text-ink-2">
        <span className="text-ink">&ldquo;</span>
        {quote.body}
        <span className="text-ink">&rdquo;</span>
      </blockquote>
      <figcaption className="flex flex-wrap items-center gap-3">
        <Avatar fallback={quote.initials} size={36} className="rounded-full"/>
        <span className="text-meta text-ink">{quote.name}</span>
        <span className="font-mono text-label uppercase tracking-[0.16em] text-ink-3">{quote.role}</span>
      </figcaption>
    </figure>
  )
}
