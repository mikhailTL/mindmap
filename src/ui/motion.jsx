import React from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { cn } from '../lib/utils'

/* Scroll motion primitives. Content entrances, not UI, so they sit past the
   300ms UI ceiling: 0.42s for the reveals, 0.5s for the two that travel
   further. EASE is input.css's --ease-out in array form. opacity, y and scaleX
   only — nothing that lays out. Every component checks
   prefers-reduced-motion and renders the resting state with no animation. */

const EASE = [0.23, 1, 0.32, 1]

export function Reveal({ children, className, delay = 0, y = 18, as = 'div' }) {
  const reduced = useReducedMotion()
  const Comp = motion[as]
  if (reduced) return <Comp className={className}>{children}</Comp>
  // Runs on mount, not on viewport entry: whileInView and a hand-rolled
  // IntersectionObserver both left the hero at opacity 0 until the first scroll.
  return (
    <Comp className={className} initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE, delay }}>
      {children}
    </Comp>
  )
}

/** Rows that wipe up one after another. Give each child its index. */
export function RevealRow({ children, index = 0, className, as = 'div' }) {
  return <Reveal as={as} className={className} delay={Math.min(index, 12) * 0.035} y={14}>{children}</Reveal>
}

/* One shared passive scroll/resize listener, coalesced into a rAF, measuring
 * with getBoundingClientRect. NOT an IntersectionObserver: `overflow-x: clip`
 * on html/body — which the full-bleed bands need — breaks the implicit
 * observer root, entries stop arriving, and content shipped stranded at
 * opacity 0 twice.
 * Elements render visible by default; only what starts below the fold is ever
 * hidden, and each has a 1500ms fallback, so nothing can stay invisible. */
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

function start() {
  if (listening) return
  listening = true
  addEventListener('scroll', onMove, { passive: true })
  addEventListener('resize', onMove, { passive: true })
}
function stop() {
  if (!listening) return
  listening = false
  removeEventListener('scroll', onMove)
  removeEventListener('resize', onMove)
}

/* Whether `ref`'s element has arrived. `false` means below the fold and
   waiting; it never means "could not tell". */
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
    const t = setTimeout(() => { waiting.delete(w); setShown(true) }, 1500)
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
  /* null is the frame before the first measurement: render visible. */
  const hidden = shown === false
  return (
    <Comp ref={ref} className={className}
      initial={false}
      animate={hidden ? { opacity: 0, y } : { opacity: 1, y: 0 }}
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

/** Line mask-wipe. Driven by our own observer so it can never stall. */
export function RevealLines({ lines, className, lineClassName, as: As = 'h2' }) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView()
  return (
    <As ref={ref} className={cn('block', className)}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span className={cn('block', lineClassName)} initial={false}
            animate={reduced || inView ? { y: '0%', opacity: 1 } : { y: '110%', opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: reduced ? 0 : i * 0.06 }}>
            {line}
          </motion.span>
        </span>
      ))}
    </As>
  )
}


/* ══ Scroll-linked motion ════════════════════════════════════════════════
 *
 * Scroll position is the clock, so these have no duration. Transform only, no
 * opacity: if useScroll never reports, the figure sits at its `from` value and
 * stays visible. Both clip themselves — a rotate or translate paints outside
 * the element's box and can reach the viewport edge, raising a horizontal
 * scrollbar. `clip` is a prop because two call sites paint past their box on
 * purpose; `clip={false}` is only safe for y-only motion. */

/* Damping ratio 0.98 — just under critical, so it settles without overshoot.
   restDelta is tight because the value is a 0-to-1 progress, not pixels. */
const SCENE_SPRING = { stiffness: 190, damping: 27, mass: 1, restDelta: 0.0005 }

const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d)

/* Shrink a pair of endpoints toward their own midpoint: takes amplitude out of
   the swing without moving the average. Scaling toward zero instead would
   flatten the drawing itself. */
function damp(a, b, k) {
  const m = (a + b) / 2
  return [m + (a - m) * k, m + (b - m) * k]
}

/* True below the `sm` breakpoint. Starts false and corrects on mount, so a
   browser without matchMedia still gets motion. */
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

/** A perspective box whose contents rotate in 3D as the element crosses the
 *  viewport.
 *
 *  from / to   the transform at scroll progress 0 (element's top at the bottom
 *              of the viewport) and 1 (its bottom at the top). Each is
 *              `{ rotateX, rotateZ, z }` in degrees and px; missing keys are 0.
 *  perspective px, on the wrapper. Lower is a wider lens.
 *  narrow      multiplier on the swing below 640px. 1 disables the reduction.
 *  restAt      point of the range used as the resting state under
 *              prefers-reduced-motion. Defaults to 1.
 *  clip        true for both axes, 'x' for horizontal only, false for neither.
 *
 *  `children` may be a function, called with `{ progress, narrow, reduced }`
 *  so a caller can drive its own children off the same sprung progress. It
 *  must not call hooks — it runs inside this component's render. */
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
  /* A constant progress, so the reduced-motion path runs the same useTransform
     chain and resolves to a real angle rather than `undefined`. */
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

/** The 2D half: a figure drifts against the scroll as it crosses the viewport.
 *
 *  distance  total vertical travel in px, split either side of centre (40 is
 *            +20 in, -20 out).
 *  x         optional total horizontal travel, px. Needs the clip.
 *  scale     optional total scale change, e.g. 0.04 for 0.98 to 1.02.
 *  clip      'x' by default: x and scale can widen the page, y cannot. false
 *            for a child that paints outside its own box.
 *
 *  Replaces `Parallax`, still exported below for the call sites that use it. */
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

/** Slow counter-scroll drift. Kept at its original signature for the call
    sites that import it by name; new work wants Parallax2D above. */
export function Parallax({ children, distance = 60, className }) {
  const ref = React.useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance])
  return <div ref={ref} className={className}><motion.div style={reduced ? undefined : { y }}>{children}</motion.div></div>
}

/** Hairline that draws itself across as it enters. scaleX on a 1px div, so the
    draw is a transform and not an animated width. */
export function RuleDraw({ className }) {
  const reduced = useReducedMotion()
  const ref = React.useRef(null)
  /* Same arrival watcher as everything else: whileInView is framer's own
     observer and carries the same stall. */
  const shown = useArrival(ref)
  return (
    <motion.div ref={ref} className={cn('h-px w-full origin-left bg-rule', className)}
      initial={false}
      animate={reduced ? undefined : { scaleX: shown === false ? 0 : 1 }}
      transition={{ duration: 0.5, ease: EASE }}/>
  )
}

/** 1px reading-position bar pinned under the header. scaleX, never width. */
export function ScrollProgress({ className }) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 240, damping: 40, restDelta: 0.001 })
  return <motion.div aria-hidden style={{ scaleX }}
    className={cn('absolute inset-x-0 -bottom-px h-px origin-left bg-accent', className)}/>
}

/** Numbers that count up once on first view, then hold. 1.4s because the
 *  number has to pass through the intermediate values legibly. Never used on a
 *  clinical value. */
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
