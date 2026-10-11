import React from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
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
export function ScrollIn({ children, className, y = 26, delay = 0, once = true, as = 'div' }) {
  const reduced = useReducedMotion()
  const Comp = motion[as]
  const ref = React.useRef(null)
  const [state, setState] = React.useState('unset')   // unset | hidden | shown
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setState('shown'); return }
    const r = el.getBoundingClientRect()
    if (r.top < window.innerHeight * 0.9) { setState('shown'); return }   // already here
    setState('hidden')
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { setState('shown'); if (once) io.disconnect() }
      else if (!once) setState('hidden')
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [once])
  if (reduced) return <Comp ref={ref} className={className}>{children}</Comp>
  return (
    <Comp ref={ref} className={className}
      initial={false}
      animate={state === 'hidden' ? { opacity: 0, y } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE, delay: state === 'hidden' ? 0 : delay }}>
      {children}
    </Comp>
  )
}

/** Children revealed one after another as the group enters. */
export function ScrollRow({ children, index = 0, className, as = 'div' }) {
  return <ScrollIn as={as} className={className} delay={Math.min(index, 10) * 0.05} y={20}>{children}</ScrollIn>
}

function useInView(once = true) {
  const ref = React.useRef(null)
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setInView(true); if (once) io.disconnect() }
      else if (!once) setInView(false)
    }, { threshold: 0.01 })
    io.observe(el)
    return () => io.disconnect()
  }, [once])
  return [ref, inView]
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

/** Slow counter-scroll drift. A generic wrapper: it moves whatever is put
    inside it. */
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
  return (
    <motion.div className={cn('h-px w-full origin-left bg-rule', className)}
      initial={reduced ? undefined : { scaleX: 0 }} whileInView={reduced ? undefined : { scaleX: 1 }}
      viewport={{ once: true }} transition={{ duration: 0.5, ease: EASE }}/>
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
