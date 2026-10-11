import React from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { cn } from '../lib/utils'

/* Scroll motion primitives, ported from solace-innovation's s21 kit.
   Every block on the site is wrapped in one of these, so the page assembles
   itself as you move down it rather than arriving whole.

   DURATIONS. The ceiling for UI motion is 300ms, and everything in this file
   sits above it, so each one needs its reason stated rather than inherited
   from the kit. The reason they share: these are not UI. Nothing in here is a
   control responding to a press, and nothing is between the reader and an
   action — each is a block of content entering the viewport once, at reading
   pace, while the reader is already moving. A content entrance clipped to
   200ms does not read as crisp, it reads as a flicker, because the eye arrives
   at the block after the animation has finished and only registers that
   something twitched.

   What was wrong was the size of the exception, not the exception. The kit
   shipped 0.7s to 0.9s on every primitive: on a page of thirty wrapped blocks
   that is most of a second of waiting per block, and scrolling fast meant
   scrolling past half-drawn content the whole way down. They are now 0.42s for
   the two reveals and 0.5s for the two that travel further (a full line height
   under a mask, a rule crossing a whole column), which is still generous for
   an entrance and no longer visibly lags the scroll.

   EASE is the site's --ease-out from input.css, in array form, because these
   are entrances and an entrance decelerates into place. Nothing here is ever
   given an ease-in.

   PROPERTIES. opacity, y and scaleX only — all of them transform or opacity,
   none of them laying anything out. */

const EASE = [0.23, 1, 0.32, 1]

export function Reveal({ children, className, delay = 0, y = 18, as = 'div' }) {
  const reduced = useReducedMotion()
  const Comp = motion[as]
  if (reduced) return <Comp className={className}>{children}</Comp>
  // Deliberately NOT viewport-triggered. Both a whileInView version and a
  // hand-rolled IntersectionObserver version left the hero at opacity 0 until
  // the first scroll — a blank landing page in production. A decorative fade is
  // never worth that failure mode, so it runs on mount and cannot stall.
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

/* A reveal that actually fires on scroll, without the failure mode that made
   the plain one run on mount.
 *
 * The rule: anything already on screen at mount is never hidden. Only elements
 * that start below the fold get the hidden state, so a stalled observer, a
 * missing API or a slow hydrate can leave content invisible above the fold —
 * which is the blank landing page we had before. Below the fold, the worst case
 * is a block that is already visible when you reach it. */
/* ── Why this is a scroll listener and not an IntersectionObserver ───────
 *
 * It was an IntersectionObserver, twice over, and on the deployed site it
 * silently stranded content. The "3 Perspectives" row on the landing page
 * shipped with card one at opacity 0.21 and cards two and three at opacity 0,
 * transform translateY(20px), permanently: three cards' worth of the page
 * simply not drawn, under a heading promising three of them. Measured in a
 * real browser on the live URL, not inferred.
 *
 * The cause is almost certainly `overflow-x: clip` on html and body, which
 * this site needs for its full-bleed bands. A clip container on the document
 * element changes what the implicit observer root clips against, and the
 * entries stop arriving. Chasing the exact interaction is the wrong fix
 * anyway, because it leaves the failure mode in place: an entrance animation
 * must never be the thing that decides whether content exists. If the
 * mechanism fails, the content must be VISIBLE, not hidden.
 *
 * So: one passive scroll and resize listener for the whole page, coalesced
 * into a single rAF, walking a Set of waiting elements and measuring them
 * directly. getBoundingClientRect cannot go stale and does not care what any
 * ancestor's overflow is set to. Each element removes itself the moment it
 * shows, so the Set empties as the reader goes down the page and the listener
 * detaches when it is empty.
 *
 * The belt and braces: a 1500ms timer per element. If no scroll ever happens
 * and the measurement somehow still disagrees, the content appears anyway.
 * The worst case is an entrance a reader did not see. The worst case before
 * was a blank page. */
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

/* Returns a ref to attach and whether the element has arrived. `false` means
   it is below the fold and waiting; it never means "I could not tell". */
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
  /* `shown === null` is the one frame before the first measurement. It renders
     visible, not hidden: a mechanism that has not decided yet must not be
     allowed to hide anything. */
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


/* ══ Scroll-linked motion ═════════════════════════════════════════════════
 *
 * Everything above this line is an ENTRANCE: it starts, it runs for a stated
 * duration, it ends, and the comment at the top of the file argues each of
 * those durations. The two components below are a different kind of thing and
 * are not covered by that argument. They have NO duration, because the
 * reader's own scroll position is the clock: at a given scroll offset the
 * figure is at a given angle, full stop. There is nothing to audit against the
 * 300ms ceiling because nothing here is ever "playing".
 *
 * WHY A SPRING AND NOT A RAW SCRUB. The naive version maps scrollYProgress
 * straight onto the transform. It is correct and it feels like nothing: the
 * figure is welded to the wheel, so a trackpad's stepped deltas come through
 * as stepped rotation and the object reads as a value being set rather than as
 * a thing with mass. useSpring between the two buys the one frame of lag that
 * makes it read as an object. The spring is tuned to arrive and stop:
 * damping / (2 * sqrt(stiffness * mass)) = 27 / (2 * sqrt(190)) = 0.98, just
 * under critical, so it settles without a single overshoot. A bouncy scrub is
 * worse than no scrub, because the figure keeps moving after the reader has
 * stopped and reads as broken.
 *
 * WHY NEITHER ONE TOUCHES OPACITY. This file already carries the post-mortem
 * on an entrance mechanism that shipped three cards at opacity 0 to
 * production. These two are transform-only by construction, so the worst case
 * if useScroll never reports anything is a figure sitting at its `from` angle
 * forever — tilted, and completely visible. There is no code path here that
 * can hide content.
 *
 * WHY THEY CLIP THEMSELVES. A rotation or a translate paints outside the
 * element's own box while leaving that box exactly where it was. The box is
 * what the page lays out, so nothing moves and nothing reflows — but the paint
 * can reach the viewport edge and raise a horizontal scrollbar, which is
 * tested on every route at 1280 and 390. So each one owns its own clip, and
 * `clip` is a prop rather than an assumption because two call sites hold
 * drawings that deliberately paint past their box (the exploded stack's drop
 * shadows, WeekChart's `overflow-visible` value labels) and clipping those is
 * a visible regression. A y-only Parallax2D adds no horizontal extent at all,
 * which is why `clip={false}` is safe there and is never offered to a scene
 * that rotates.
 *
 * PROPERTIES. rotateX, rotateZ, translateZ, translate and scale. All of them
 * transform. None of them lays anything out. */

/* Just under critical damping — see above. restDelta is tight because the
   value this spring is chasing is a 0-to-1 progress, not a pixel count. */
const SCENE_SPRING = { stiffness: 190, damping: 27, mass: 1, restDelta: 0.0005 }

const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d)

/* Shrink a pair of endpoints toward their own midpoint. Used for the
   small-screen reduction: it takes amplitude out of the swing without moving
   the average, so a figure looks the same at 390 as it does at 1280 and only
   travels less far either side of that. Scaling the endpoints toward zero
   instead would flatten the drawing itself, which is a different change. */
function damp(a, b, k) {
  const m = (a + b) / 2
  return [m + (a - m) * k, m + (b - m) * k]
}

/* True below the `sm` breakpoint. Starts false and corrects on mount: it only
   scales how far a transform travels, so one frame at the wider amplitude is
   not something a reader can see, and starting false means a browser with no
   matchMedia still gets motion rather than an exception. */
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
 *  viewport. The 3D half of the site's scroll motion: exploded drawings, where
 *  the whole point of the figure is that it is a stack of objects in space.
 *
 *  from / to   the transform at scroll progress 0 (element's top at the bottom
 *              of the viewport) and 1 (element's bottom at the top of it).
 *              Each is `{ rotateX, rotateZ, z }` in degrees and pixels; any
 *              key left out is 0.
 *  perspective px, on the wrapper. Lower is a wider lens and a more violent
 *              foreshortening; 1100 is a normal one.
 *  narrow      multiplier on the swing below 640px, where a tilt eats
 *              horizontal room fast. 1 disables the reduction.
 *  restAt      which point of the range is the resting state under
 *              prefers-reduced-motion. 1 (the `to` end) by default.
 *  clip        true for both axes, 'x' for horizontal only, false for neither.
 *
 *  `children` may be a function, which is called with
 *  `{ progress, narrow, reduced }` so a caller can drive its own children off
 *  the same sprung progress — that is how the exploded stack separates its
 *  three sheets in depth instead of sliding them as one plate. A function
 *  child must not call hooks itself; it runs inside this component's render.
 *  Put them in a component, as ExplodedStack's Sheet does. */
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
  /* A constant progress, so the reduced-motion path runs through exactly the
     same useTransform chain as the moving one and resolves to a real angle
     rather than to `undefined`. */
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
 *  Everything on the site that is not an exploded drawing gets this one.
 *
 *  distance  total vertical travel in px, split either side of centre, so 40
 *            means +20 on the way in and -20 on the way out. Modest on
 *            purpose: this is meant to be felt as depth, not seen as a slide.
 *            Vary it between figures — a page where everything drifts by the
 *            same amount reads as a rendering fault rather than as parallax.
 *  x         optional total horizontal travel, px. Needs the clip.
 *  scale     optional total scale change, e.g. 0.04 for 0.98 to 1.02.
 *  clip      'x' by default: y-only motion cannot widen anything, but x and
 *            scale can, and the horizontal axis is the one that can produce a
 *            scrollbar. false for a child that paints outside its own box.
 *
 *  This replaces the old `Parallax`, which is still exported below it
 *  unchanged for the call sites that have it. */
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
  /* No opacity in that list, and the element is in flow either way: if the
     progress never arrives the figure sits at +d and is entirely readable. */
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

/** Slow counter-scroll drift, kept at its original signature and behaviour
    for the call sites that import it by this name. New work wants Parallax2D
    above, which is the same idea with a clip of its own, a spring, a
    reduced-motion branch and a travel distance that is not 120px. */
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
  /* On the same arrival watcher as everything else, for the same reason: this
     was the last `whileInView` on the site, which is framer's own observer and
     carries framer's own copy of the failure. A rule that never draws is only
     a missing hairline rather than a missing section, but it fails invisibly
     and there is no reason to keep two mechanisms. */
  const shown = useArrival(ref)
  return (
    <motion.div ref={ref} className={cn('h-px w-full origin-left bg-rule', className)}
      initial={false}
      animate={reduced ? undefined : { scaleX: shown === false ? 0 : 1 }}
      transition={{ duration: 0.5, ease: EASE }}/>
  )
}

/** 1px reading-position bar pinned under the header. Scroll-linked rather than
    timed, so it has no duration to audit: the spring only smooths the value
    the scroll already set. scaleX on a 1px bar, never width. */
export function ScrollProgress({ className }) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 240, damping: 40, restDelta: 0.001 })
  return <motion.div aria-hidden style={{ scaleX }}
    className={cn('absolute inset-x-0 -bottom-px h-px origin-left bg-accent', className)}/>
}

/** Numbers that count up once, then hold. Never used on a clinical value.
 *
 * 1.4s, which is the longest thing in the file and the one duration that is
 * not an entrance. It is left alone: here the motion IS the content — the
 * number has to pass through the intermediate values legibly for the count to
 * mean anything, and a figure that reaches its total in 300ms has simply
 * appeared. It fires once per element, on first view, which is the one place
 * in the frequency gate where a delight budget exists. */
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
