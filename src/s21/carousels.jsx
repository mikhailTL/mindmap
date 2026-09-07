import React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

/* The two carousels from the s21 kit, retokenised to the light palette.
   Both were built for a dark canvas with 10–13px captions; the type here is
   on the project's steps and every control clears 44px. */

const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

/* ── Coverflow ─────────────────────────────────────────────────────── */

export function CoverflowCarousel({
  slides,
  rotate = 44,
  depth = 0.6,
  perspective = 3,
  falloff = 0.56,
  fade = 0.1,
  cardWidth = 'clamp(148px, 22vw, 260px)',
  gap = 0.05,
  loop = true,
  showCaption = false,
  showPagination = false,
  showNavigation = false,
  label = 'Cover carousel',
  className,
  cardClassName,
}) {
  const count = slides.length
  const reduced = useReducedMotion()
  const frameRef = React.useRef(null)
  const cardRefs = React.useRef([])
  const posRef = React.useRef(0)
  const targetRef = React.useRef(0)
  const widthRef = React.useRef(0)
  const rafRef = React.useRef(null)
  const dragRef = React.useRef(null)
  const [selected, setSelected] = React.useState(0)

  const indexAt = React.useCallback(pos => ((Math.round(pos) % count) + count) % count, [count])

  /* Transforms are written straight to the nodes rather than through state:
     the deck repaints on every pointer move and React cannot keep up. */
  const paint = React.useCallback(() => {
    const width = widthRef.current
    if (!width) return
    const pitch = width * (1 + gap)
    const pos = posRef.current

    cardRefs.current.forEach((card, index) => {
      if (!card) return
      let offset = index - pos
      if (loop) {
        offset = ((offset % count) + count) % count
        if (offset > count / 2) offset -= count
      }
      const distance = Math.abs(offset)
      const ramp = Math.pow(distance, falloff)
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset)
      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`
      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge)
      card.style.zIndex = String(100 - Math.round(distance))
    })
  }, [count, depth, fade, falloff, gap, loop, rotate])

  const settle = React.useCallback((target) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    targetRef.current = target
    setSelected(indexAt(target))
    // Reduced motion gets the destination, not the glide to it.
    if (reduced) { posRef.current = target; paint(); rafRef.current = null; return }
    const step = () => {
      const remaining = target - posRef.current
      if (Math.abs(remaining) < 0.0004) {
        posRef.current = target
        paint()
        rafRef.current = null
        return
      }
      posRef.current += remaining * 0.16
      paint()
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }, [indexAt, paint, reduced])

  const clamp = React.useCallback(
    pos => (loop ? pos : Math.max(0, Math.min(count - 1, pos))), [count, loop])

  const goTo = React.useCallback(index => {
    const target = loop ? index + Math.round((targetRef.current - index) / count) * count : index
    settle(clamp(target))
  }, [clamp, count, loop, settle])

  const nudge = React.useCallback(
    by => settle(clamp(Math.round(targetRef.current) + by)), [clamp, settle])

  const onPointerDown = event => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    targetRef.current = posRef.current
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
    }
  }

  const onPointerMove = event => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    const pitch = widthRef.current * (1 + gap)
    if (!pitch) return
    const now = performance.now()
    const previous = posRef.current
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch)
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000
    drag.t = now
    const index = indexAt(posRef.current)
    if (index !== selected) setSelected(index)
    paint()
  }

  const endDrag = event => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    dragRef.current = null
    // Carry a little of the throw so a flick lands a card or two along.
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18))
    settle(clamp(Math.round(posRef.current + carried)))
  }

  useIsoLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const measure = () => {
      const card = cardRefs.current[0]
      if (!card) return
      widthRef.current = card.offsetWidth
      paint()
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [paint])

  React.useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
  }, [])

  const active = slides[selected]

  return (
    <div className={cn('w-full', className)} style={{ '--cf-card': cardWidth }}
      role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="relative">
        <div ref={frameRef} tabIndex={0}
          role="group"
          aria-label={`${label} — drag, or use the left and right arrow keys`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={event => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); nudge(-1) }
            else if (event.key === 'ArrowRight') { event.preventDefault(); nudge(1) }
          }}
          className="cursor-grab overflow-hidden py-10 outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
          style={{ perspective: `calc(var(--cf-card) * ${perspective})`, touchAction: 'pan-y' }}>
          <div className="relative select-none"
            style={{ height: 'var(--cf-card)', transformStyle: 'preserve-3d' }}>
            {slides.map((slide, index) => (
              <div key={index}
                ref={node => { cardRefs.current[index] = node }}
                role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${count}`}
                className={cn('absolute left-1/2 top-0 aspect-square overflow-hidden rounded-lg bg-sage shadow-lift will-change-transform', cardClassName)}
                style={{ width: 'var(--cf-card)' }}>
                <img src={slide.src} alt={slide.alt} draggable={false}
                  width="1280" height="1280" decoding="async"
                  className="h-full w-full select-none object-cover"/>
              </div>
            ))}
          </div>
        </div>

        {showNavigation && (
          <>
            <button type="button" aria-label="Previous slide" onClick={() => nudge(-1)}
              className="absolute left-3 top-1/2 z-[200] grid size-11 -translate-y-1/2 place-items-center rounded-full border border-rule bg-paper/80 text-ink backdrop-blur transition-colors hover:bg-paper">
              <ChevronLeft aria-hidden className="size-5"/>
            </button>
            <button type="button" aria-label="Next slide" onClick={() => nudge(1)}
              className="absolute right-3 top-1/2 z-[200] grid size-11 -translate-y-1/2 place-items-center rounded-full border border-rule bg-paper/80 text-ink backdrop-blur transition-colors hover:bg-paper">
              <ChevronRight aria-hidden className="size-5"/>
            </button>
          </>
        )}
      </div>

      {showCaption && active && active.title && (
        <motion.div key={selected} className="mt-2 flex flex-col items-center px-6"
          initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}>
          <p className="font-display text-row font-bold text-ink">{active.title}</p>
          {active.subtitle && <p className="mt-1 text-sec text-ink-3">{active.subtitle}</p>}
          {active.meta && active.meta.length > 0 && (
            <dl className="mt-10 w-full max-w-[280px] text-meta">
              {active.meta.map(row => (
                <div key={row.label} className="flex justify-between gap-4 border-b border-rule py-1.5">
                  <dt className="text-ink-3">{row.label}</dt>
                  <dd className="font-mono tabular-nums text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </motion.div>
      )}

      {showPagination && (
        <div className="mt-6 flex items-center justify-center">
          {slides.map((_, index) => (
            <button key={index} type="button"
              aria-label={`Go to slide ${index + 1}`} aria-current={index === selected}
              onClick={() => goTo(index)}
              className="grid h-11 w-6 place-items-center">
              <span aria-hidden className={cn('size-2 rounded-full bg-ink transition-opacity',
                index === selected ? 'opacity-100' : 'opacity-30')}/>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Circular ──────────────────────────────────────────────────────── */

const VISIBLE_COUNT = 5
const RADIUS_X = 250
const RADIUS_Y = 70

function getItemPosition(index, activeIndex, total) {
  const offset = index - activeIndex
  const half = Math.floor(VISIBLE_COUNT / 2)
  let adjustedOffset = offset
  if (offset > half) adjustedOffset = offset - total
  if (offset < -half) adjustedOffset = offset + total
  if (Math.abs(adjustedOffset) > half * 2) return null

  const angle = (adjustedOffset / VISIBLE_COUNT) * Math.PI
  const x = Math.sin(angle) * RADIUS_X
  const y = -Math.cos(angle) * RADIUS_Y
  const distance = Math.abs(adjustedOffset)
  const maxDistance = half + 1
  const scale = Math.max(0, 1 - (distance / maxDistance) * 0.3)
  const opacity = Math.max(0.3, 1 - (distance / maxDistance) * 0.7)
  const zIndex = VISIBLE_COUNT - distance

  return { x, y, scale, opacity, zIndex, adjustedOffset }
}

export function CircularCarousel({
  items,
  activeIndex: controlledIndex,
  onActiveChange,
  autoPlay = true,
  autoPlayInterval = 4000,
  className,
}) {
  const [internalIndex, setInternalIndex] = React.useState(0)
  const [isHovered, setIsHovered] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const reduced = useReducedMotion()
  const intervalRef = React.useRef(null)
  const containerRef = React.useRef(null)

  const activeIndex = controlledIndex ?? internalIndex
  const total = items.length

  const goTo = React.useCallback(index => {
    const newIndex = ((index % total) + total) % total
    if (controlledIndex === undefined) setInternalIndex(newIndex)
    if (onActiveChange) onActiveChange(newIndex)
  }, [total, controlledIndex, onActiveChange])

  const next = React.useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const prev = React.useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  /* Autoplay is motion the reader did not ask for: it stops for a reduced-motion
     preference outright, and for hover or focus while they are reading. */
  React.useEffect(() => {
    if (!autoPlay || reduced || isHovered || isFocused || total < 2) return
    intervalRef.current = setInterval(next, autoPlayInterval)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoPlay, autoPlayInterval, reduced, isHovered, isFocused, next, total])

  React.useEffect(() => {
    const handler = e => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    const el = containerRef.current
    if (el) el.addEventListener('keydown', handler)
    return () => { if (el) el.removeEventListener('keydown', handler) }
  }, [next, prev])

  const activeItem = items[activeIndex]
  if (!activeItem) return null

  return (
    <div ref={containerRef} tabIndex={0} role="region"
      aria-label="Circular carousel" aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={cn('relative flex flex-col items-center justify-center gap-8 outline-none', className)}>
      <div className="relative h-[300px] w-full max-w-xl">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => {
            const pos = getItemPosition(i, activeIndex, total)
            if (!pos) return null
            const isActive = i === activeIndex

            return (
              <motion.button key={item.id} layout
                initial={reduced ? false : { opacity: 0, scale: 0.8 }}
                animate={{ x: pos.x, y: pos.y, scale: pos.scale, opacity: pos.opacity, zIndex: pos.zIndex }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: reduced ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => goTo(i)}
                aria-label={item.title}
                /* Cards are larger than the kit's 192×128: the light project's
                   smallest step is 16px, and the original copy sizes do not fit. */
                className={cn(
                  'absolute left-1/2 top-1/2 flex h-40 w-60 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-start justify-between gap-2 rounded-lg border border-rule bg-paper/90 p-4 text-left backdrop-blur-sm transition-shadow duration-300',
                  isActive ? 'shadow-lift' : 'shadow-raise hover:shadow-lift')}
                style={{ transformOrigin: 'center center' }}>
                {item.tag && (
                  <span className="rounded-xs bg-sage px-2 py-0.5 font-mono text-label uppercase tracking-[0.1em] text-ink-2">
                    {item.tag}
                  </span>
                )}
                <div className="w-full">
                  <h3 className={cn('font-display font-medium leading-tight transition-colors duration-300',
                    isActive ? 'text-row text-ink' : 'text-body text-ink-2')}>
                    {item.title}
                  </h3>
                  <p className={cn('mt-1 line-clamp-2 text-sec leading-snug transition-colors duration-300',
                    isActive ? 'text-ink-2' : 'text-ink-3')}>
                    {item.description}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      <motion.div key={activeItem.id}
        initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.4, ease: 'easeOut' }}
        className="-mt-2 flex flex-col items-center text-center">
        <span className="font-mono text-meta uppercase tracking-[0.2em] text-ink">{activeItem.title}</span>
        <span className="mt-1.5 font-mono text-label uppercase tracking-[0.22em] text-ink-3">
          {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          {activeItem.tag ? ` · ${activeItem.tag}` : ''}
        </span>
      </motion.div>

      <div className="flex items-center gap-4">
        <motion.button whileHover={reduced ? undefined : { scale: 1.08 }}
          whileTap={reduced ? undefined : { scale: 0.95 }}
          onClick={prev} aria-label="Previous item"
          className="flex size-11 items-center justify-center rounded-full border border-rule bg-paper text-ink-2 transition-colors hover:bg-sage hover:text-ink">
          <ChevronLeft aria-hidden className="size-5"/>
        </motion.button>

        <div className="flex items-center" role="tablist">
          {items.map((_, i) => (
            <button key={i} role="tab" aria-selected={i === activeIndex}
              onClick={() => goTo(i)} aria-label={`Go to item ${i + 1}`}
              className="grid h-11 w-6 place-items-center">
              <span aria-hidden className={cn('h-1.5 rounded-full transition-all duration-300',
                i === activeIndex ? 'w-6 bg-ink' : 'w-1.5 bg-ink/25')}/>
            </button>
          ))}
        </div>

        <motion.button whileHover={reduced ? undefined : { scale: 1.08 }}
          whileTap={reduced ? undefined : { scale: 0.95 }}
          onClick={next} aria-label="Next item"
          className="flex size-11 items-center justify-center rounded-full border border-rule bg-paper text-ink-2 transition-colors hover:bg-sage hover:text-ink">
          <ChevronRight aria-hidden className="size-5"/>
        </motion.button>
      </div>
    </div>
  )
}
