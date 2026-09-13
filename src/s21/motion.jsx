import React from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { cn } from '../lib/utils'

/* Scroll motion primitives, ported from solace-innovation's s21 kit.
   Every block on the site is wrapped in one of these, so the page assembles
   itself as you move down it rather than arriving whole. */

const EASE = [0.16, 1, 0.3, 1]

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
      transition={{ duration: 0.75, ease: EASE, delay }}>
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
      transition={{ duration: 0.7, ease: EASE, delay: state === 'hidden' ? 0 : delay }}>
      {children}
    </Comp>
  )
}

/** Children revealed one after another as the group enters. */
export function ScrollRow({ children, index = 0, className, as = 'div' }) {
  return <ScrollIn as={as} className={className} delay={Math.min(index, 10) * 0.06} y={20}>{children}</ScrollIn>
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
            transition={{ duration: 0.9, ease: EASE, delay: reduced ? 0 : i * 0.08 }}>
            {line}
          </motion.span>
        </span>
      ))}
    </As>
  )
}

/** Slow counter-scroll drift. Used on the quiet right-hand column. */
export function Parallax({ children, distance = 60, className }) {
  const ref = React.useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance])
  return <div ref={ref} className={className}><motion.div style={reduced ? undefined : { y }}>{children}</motion.div></div>
}

/** Hairline that draws itself across as it enters. */
/* A photograph that drifts against the scroll. Separate from Parallax because
   an <img> needs the transform on itself — wrapping it in a moving div moves
   the layout box and opens gaps at the edges of the crop. */
export function ParallaxImage({ src, alt, className, pos, distance = 40, scale = 1.12, ...rest }) {
  const reduced = useReducedMotion()
  const ref = React.useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [-distance / 2, distance / 2])
  const smooth = useSpring(y, { stiffness: 120, damping: 26, mass: 0.4 })
  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <motion.img src={src} alt={alt} loading="lazy" decoding="async"
        style={{ objectPosition: pos, y: reduced ? 0 : smooth, scale: reduced ? 1 : scale }}
        className="h-full w-full object-cover" {...rest}/>
    </div>
  )
}

export function RuleDraw({ className }) {
  const reduced = useReducedMotion()
  return (
    <motion.div className={cn('h-px w-full origin-left bg-rule', className)}
      initial={reduced ? undefined : { scaleX: 0 }} whileInView={reduced ? undefined : { scaleX: 1 }}
      viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE }}/>
  )
}

/** 1px reading-position bar pinned under the header. */
export function ScrollProgress({ className }) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 240, damping: 40, restDelta: 0.001 })
  return <motion.div aria-hidden style={{ scaleX }}
    className={cn('absolute inset-x-0 -bottom-px h-px origin-left bg-accent', className)}/>
}

/** Numbers that count up once, then hold. Never used on a clinical value. */
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
