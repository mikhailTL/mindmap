import React from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { cn } from '../lib/utils'

// Same curve as --ease-out in input.css.
const EASE = [0.23, 1, 0.32, 1]

export function Reveal({ children, className, delay = 0, y = 18, as = 'div' }) {
  const reduced = useReducedMotion()
  const Comp = motion[as]
  // Animates on mount rather than on viewport entry, so the hero does not wait for a scroll to appear.
  if (reduced) return <Comp className={className}>{children}</Comp>
  return (
    <Comp className={className} initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE, delay }}>
      {children}
    </Comp>
  )
}

export function RevealRow({ children, index = 0, className, as = 'div' }) {
  return <Reveal as={as} className={className} delay={Math.min(index, 12) * 0.035} y={14}>{children}</Reveal>
}

// One shared scroll/resize listener, batched into rAF. IntersectionObserver gets no entries
// once html and body have overflow-x: clip, so positions are measured with getBoundingClientRect.
const waiting = new Set()
let frame = 0, listening = false

function sweep() {
  frame = 0
  const h = window.innerHeight
  for (const w of waiting) {
    const el = w.ref.current
    if (!el) { waiting.delete(w); continue }
    if (el.getBoundingClientRect().top < h * 0.92) { waiting.delete(w); w.show() }
  }
  if (!waiting.size) stop()
}

const onMove = () => { if (!frame) frame = requestAnimationFrame(sweep) }

// Lazy images and late routes change the page height without a scroll, so a ResizeObserver also triggers a sweep.
let ro = null
function start() {
  if (listening) return
  listening = true
  addEventListener('scroll', onMove, { passive: true })
  addEventListener('resize', onMove, { passive: true })
  if (typeof ResizeObserver === 'function') {
    ro = new ResizeObserver(onMove)
    ro.observe(document.documentElement)
    if (document.body) ro.observe(document.body)
  }
}
function stop() {
  if (!listening) return
  listening = false
  removeEventListener('scroll', onMove)
  removeEventListener('resize', onMove)
  if (ro) { ro.disconnect(); ro = null }
}

function useArrival(ref) {
  const [shown, setShown] = React.useState(null)   // null = not measured yet
  React.useEffect(() => {
    const el = ref.current
    if (!el) { setShown(true); return }
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) { setShown(true); return }
    setShown(false)
    const w = { ref, show: () => setShown(true) }
    waiting.add(w)
    start()
    onMove()
    // Fallback for when no sweep runs; the sweep normally reports first.
    const t = setTimeout(() => { waiting.delete(w); setShown(true) }, 90)
    return () => { clearTimeout(t); waiting.delete(w); if (!waiting.size) stop() }
  }, [ref])
  return shown
}

export function ScrollIn({ children, className, y = 26, delay = 0, once = true, as = 'div' }) {
  const reduced = useReducedMotion()
  const Comp = motion[as]
  const ref = React.useRef(null)
  const shown = useArrival(ref)
  if (reduced) return <Comp ref={ref} className={className}>{children}</Comp>
  // null means not measured yet and renders visible. Only y animates, so text stays readable if no measurement arrives.
  const hidden = shown === false
  return (
    <Comp ref={ref} className={className}
      initial={false}
      animate={hidden ? { y } : { y: 0 }}
      transition={{ duration: 0.42, ease: EASE, delay: hidden ? 0 : delay }}>
      {children}
    </Comp>
  )
}
export function ScrollRow({ children, index = 0, className, as = 'div' }) {
  return <ScrollIn as={as} className={className} delay={Math.min(index, 10) * 0.05} y={20}>{children}</ScrollIn>
}

function useInView() {
  const ref = React.useRef(null)
  const shown = useArrival(ref)
  return [ref, shown !== false]
}

export function RevealLines({ lines, className, lineClassName, as: As = 'h2' }) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView()
  return (
    <As ref={ref} className={cn('block', className)}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span className={cn('block', lineClassName)} initial={false}
            animate={reduced || inView ? { y: '0%' } : { y: '110%' }}
            transition={{ duration: 0.5, ease: EASE, delay: reduced ? 0 : i * 0.06 }}>
            {line}
          </motion.span>
        </span>
      ))}
    </As>
  )
}

// Damping ratio about 0.98, so it settles without overshoot; restDelta is small because the value is a 0 to 1 progress.
const SCENE_SPRING = { stiffness: 190, damping: 27, mass: 1, restDelta: 0.0005 }

const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d)

// Pulls two endpoints toward their midpoint: less swing, same average angle.
function damp(a, b, k) {
  const m = (a + b) / 2
  return [m + (a - m) * k, m + (b - m) * k]
}

function useNarrowViewport() {
  const [narrow, setNarrow] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(max-width: 639px)')
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener?.('change', sync)
    return () => mq.removeEventListener?.('change', sync)
  }, [])
  return narrow
}

// Rotates its children in 3D as the element crosses the viewport. from and to are
// { rotateX, rotateZ, z } in degrees and px at progress 0 (entering) and 1 (leaving).
export function ScrollScene({
  children,
  className,
  perspective = 1100,
  from = { rotateX: 13, rotateZ: -3, z: 0 },
  to = { rotateX: -5, rotateZ: 3, z: 0 },
  narrow: narrowScale = 0.45,
  restAt = 1,
  clip = true,
  style,
}) {
  const ref = React.useRef(null)
  const reduced = useReducedMotion()
  const narrow = useNarrowViewport()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const live = useSpring(scrollYProgress, SCENE_SPRING)
  const rest = useMotionValue(restAt)
  React.useEffect(() => { rest.set(restAt) }, [rest, restAt])
  const p = reduced ? rest : live

  const k = narrow ? narrowScale : 1
  const [rx0, rx1] = damp(num(from.rotateX), num(to.rotateX), k)
  const [rz0, rz1] = damp(num(from.rotateZ), num(to.rotateZ), k)
  const [z0, z1] = damp(num(from.z), num(to.z), k)
  const rotateX = useTransform(p, [0, 1], [rx0, rx1])
  const rotateZ = useTransform(p, [0, 1], [rz0, rz1])
  const z = useTransform(p, [0, 1], [z0, z1])

  const kids = typeof children === 'function'
    ? children({ progress: p, narrow, reduced })
    : children

  return (
    <div ref={ref} style={{ perspective: `${perspective}px`, ...style }}
      className={cn('relative',
        clip === 'x' ? 'overflow-x-clip' : clip ? 'overflow-clip' : null, className)}>
      <motion.div className="h-full w-full [transform-style:preserve-3d]"
        style={{ rotateX, rotateZ, z }}>
        {kids}
      </motion.div>
    </div>
  )
}

export function Parallax2D({
  children,
  className,
  distance = 40,
  x: xDistance = 0,
  scale: scaleRange = 0,
  narrow: narrowScale = 0.6,
  clip = 'x',
  as = 'div',
}) {
  const Comp = motion[as] || motion.div
  const ref = React.useRef(null)
  const reduced = useReducedMotion()
  const narrow = useNarrowViewport()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const p = useSpring(scrollYProgress, SCENE_SPRING)
  const k = narrow ? narrowScale : 1
  const d = num(distance) * k / 2
  const dx = num(xDistance) * k / 2
  const ds = num(scaleRange) * k / 2
  const y = useTransform(p, [0, 1], [d, -d])
  const x = useTransform(p, [0, 1], [dx, -dx])
  const s = useTransform(p, [0, 1], [1 - ds, 1 + ds])
  return (
    <div ref={ref}
      className={cn(clip === 'x' ? 'overflow-x-clip' : clip ? 'overflow-clip' : null, className)}>
      <Comp style={reduced ? undefined
        : { y, ...(xDistance ? { x } : null), ...(scaleRange ? { scale: s } : null) }}>
        {children}
      </Comp>
    </div>
  )
}

export function Parallax({ children, distance = 60, className }) {
  const ref = React.useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance])
  return <div ref={ref} className={className}><motion.div style={reduced ? undefined : { y }}>{children}</motion.div></div>
}

export function ScrollProgress({ className }) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 240, damping: 40, restDelta: 0.001 })
  return <motion.div aria-hidden style={{ scaleX }}
    className={cn('absolute inset-x-0 -bottom-px h-px origin-left bg-accent', className)}/>
}

export function Tally({ to, suffix = '', duration = 1.4, className }) {
  const [ref, inView] = useInView()
  const [n, setN] = React.useState(0)
  const reduced = useReducedMotion()
  React.useEffect(() => {
    if (!inView) return
    if (reduced) { setN(to); return }
    let raf, t0
    const step = t => {
      t0 ??= t
      const p = Math.min(1, (t - t0) / (duration * 1000))
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration, reduced])
  return <span ref={ref} className={className}>{n}{suffix}</span>
}
