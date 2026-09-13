import React from 'react'
import { cn } from '../lib/utils'

/* Compare Reveal — from Motiq (https://motiq.dev/components/compare-reveal). MIT.
 *
 * The upstream component shipped its own dark token block (a near-black
 * surface, border and signature set) injected as a <style> tag. That is gone:
 * the frame, labels and handle now sit on the project's paper/rule/accent set, so the
 * component stops fighting the page it is dropped into. */

const SPRING_K = 140
const SPRING_C = 18
const SWEEP_SECONDS = 2.6
const KEY_STEP = 2
const KEY_STEP_LARGE = 10
const LABEL_FADE = 12

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
const lerp = (a, b, t) => a + (b - a) * t
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function sweepAt(u) {
  if (u < 0.38) return lerp(50, 96, easeInOutCubic(u / 0.38))
  if (u < 0.78) return lerp(96, 4, easeInOutCubic((u - 0.38) / 0.4))
  return lerp(4, 50, easeInOutCubic((u - 0.78) / 0.22))
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function useVisibilityPause(ref, { threshold = 0.1 } = {}) {
  const [onScreen, setOnScreen] = React.useState(true)
  const [tabVisible, setTabVisible] = React.useState(true)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold])
  React.useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState !== 'hidden')
    onVis()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])
  return onScreen && tabVisible
}

function useControllableState({ value, defaultValue, onChange }) {
  const isControlled = value !== undefined
  const [internal, setInternal] = React.useState(defaultValue)
  const current = isControlled ? value : internal
  const set = React.useCallback(
    (next) => {
      if (!isControlled) setInternal(next)
      if (onChange) onChange(next)
    },
    [isControlled, onChange],
  )
  return [current, set]
}

function isImageSource(v) {
  return typeof v === 'object' && v !== null && !React.isValidElement(v) && 'src' in v
}

function renderSide(source) {
  if (isImageSource(source)) {
    return <img src={source.src} alt={source.alt || ''} draggable={false} className="h-full w-full object-cover" />
  }
  return source
}

/**
 * Two panes under a draggable divider.
 * @param before/after        A React node, or { src, alt } for a plain image.
 * @param defaultPosition     Uncontrolled start, 0–100.
 * @param position            Controlled percentage.
 * @param onPositionChange    Called with the new percentage.
 * @param introSweep          Run the one-shot attract sweep on first paint.
 * @param stiffness/damping   Spring constants for the divider.
 * @param labels              [beforeLabel, afterLabel].
 * @param snapOnDoubleClick   Percentage a double-click returns to.
 * @param reducedMotion       Force the still variant regardless of the OS.
 * @param pauseWhenHidden     Stop the RAF loop off-screen or in a hidden tab.
 */
export function CompareReveal({
  before,
  after,
  defaultPosition = 50,
  position,
  onPositionChange,
  introSweep = true,
  stiffness = SPRING_K,
  damping = SPRING_C,
  labels = ['Before', 'After'],
  snapOnDoubleClick = 50,
  reducedMotion,
  pauseWhenHidden = true,
  className,
  ...props
}) {
  const rootRef = React.useRef(null)
  const topRef = React.useRef(null)
  const dividerRef = React.useRef(null)
  const handleRef = React.useRef(null)
  const labelRefs = React.useRef([])
  const paintRef = React.useRef(() => {})

  const systemReduced = useReducedMotion()
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => setHydrated(true), [])
  const still = reducedMotion === true || (hydrated && systemReduced)

  const onScreen = useVisibilityPause(rootRef, { threshold: 0.2 })
  const animate = !still && (!pauseWhenHidden || onScreen)

  const [pct, setPct] = useControllableState({
    value: position,
    defaultValue: clamp(defaultPosition, 0, 100),
    onChange: (v) => { if (onPositionChange) onPositionChange(v) },
  })

  const initialPct = clamp(position === undefined ? defaultPosition : position, 0, 100)
  const sim = React.useRef({
    x: initialPct,
    v: 0,
    target: initialPct,
    dragging: false,
    pointerId: null,
    introActive: false,
    introDone: false,
    introStart: 0,
  })

  const params = React.useRef({ stiffness, damping, still, introSweep })
  params.current = { stiffness, damping, still, introSweep }

  const pctRef = React.useRef(pct)
  pctRef.current = pct

  React.useEffect(() => {
    const paint = () => {
      const x = clamp(sim.current.x, 0, 100)
      const top = topRef.current
      if (top) top.style.clipPath = `inset(0 ${(100 - x).toFixed(3)}% 0 0)`
      const divider = dividerRef.current
      if (divider) divider.style.left = `${x.toFixed(3)}%`
      if (handleRef.current) handleRef.current.setAttribute('aria-valuenow', String(Math.round(x)))
      const l0 = labelRefs.current[0]
      const l1 = labelRefs.current[1]
      if (l0) l0.style.opacity = x > LABEL_FADE ? '1' : '0'
      if (l1) l1.style.opacity = x < 100 - LABEL_FADE ? '1' : '0'
    }
    paintRef.current = paint
    paint()

    /* Reduced motion (or off-screen): paint one frame at the resting position
     * and never start the loop. The intro sweep is skipped outright — it is
     * pure attract motion with no information in it. */
    if (!animate) {
      sim.current.introDone = true
      sim.current.introActive = false
      return () => {
        if (sim.current.introActive) {
          sim.current.introActive = false
          sim.current.introDone = false
        }
      }
    }

    if (params.current.introSweep && !sim.current.introDone) {
      sim.current.introActive = true
      sim.current.introStart = performance.now() / 1000
    }

    let raf = 0
    let last = performance.now()
    const frame = (ts) => {
      const dt = Math.min(0.05, Math.max(0.001, (ts - last) / 1000))
      last = ts
      const now = ts / 1000
      const p = params.current
      const s = sim.current

      if (s.introActive) {
        const u = (now - s.introStart) / SWEEP_SECONDS
        if (u >= 1) {
          s.introActive = false
          s.introDone = true
          s.target = clamp(pctRef.current, 0, 100)
        } else {
          s.target = sweepAt(u)
        }
      }

      s.v += ((s.target - s.x) * p.stiffness - s.v * p.damping) * dt
      s.x += s.v * dt
      if (s.x < 0) { s.x = 0; s.v = 0 }
      if (s.x > 100) { s.x = 100; s.v = 0 }
      paint()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      if (sim.current.introActive) {
        sim.current.introActive = false
        sim.current.introDone = false
        sim.current.target = clamp(pctRef.current, 0, 100)
      }
    }
  }, [animate])

  const commit = React.useCallback(
    (next) => {
      sim.current.introActive = false
      sim.current.introDone = true
      setPct(clamp(next, 0, 100))
    },
    [setPct],
  )

  React.useEffect(() => {
    const s = sim.current
    if (s.introActive) return
    const t = clamp(pct, 0, 100)
    if (Math.abs(s.target - t) < 0.0001) return
    s.target = t
    if (params.current.still) {
      s.x = t
      s.v = 0
      paintRef.current()
    }
  }, [pct])

  const positionFromEvent = (clientX) => {
    const root = rootRef.current
    if (!root) return
    const rect = root.getBoundingClientRect()
    commit(((clientX - rect.left) / Math.max(1, rect.width)) * 100)
  }

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    sim.current.dragging = true
    sim.current.pointerId = e.pointerId
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId)
    positionFromEvent(e.clientX)
  }

  const onPointerMove = (e) => {
    if (!sim.current.dragging || e.pointerId !== sim.current.pointerId) return
    positionFromEvent(e.clientX)
  }

  const endDrag = () => {
    sim.current.dragging = false
    sim.current.pointerId = null
  }

  const onKeyDown = (e) => {
    const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP
    const base = sim.current.target
    let next = base
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = base + step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = base - step
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = 100
    else return
    e.preventDefault()
    commit(next)
  }

  const shown = Math.round(clamp(pct, 0, 100))

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={props['aria-label'] || `Comparison: ${labels[0]} versus ${labels[1]}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => commit(snapOnDoubleClick)}
      data-motion={still ? 'static' : 'animated'}
      className={cn(
        'relative aspect-[16/10] w-full touch-pan-y select-none overflow-hidden rounded-lg',
        'border border-rule bg-paper cursor-ew-resize',
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0">{renderSide(after)}</div>
      <div
        ref={topRef}
        className="absolute inset-0 will-change-[clip-path]"
        style={{ clipPath: `inset(0 ${100 - shown}% 0 0)` }}
      >
        {renderSide(before)}
      </div>

      {[labels[0], labels[1]].map((text, i) => (
        <span
          key={text + i}
          ref={(el) => { labelRefs.current[i] = el }}
          aria-hidden="true"
          /* Was white-on-black glass. On paper the same chip is paper-on-paper
           * with a hairline — legible over a light photo without punching a
           * dark hole in the frame. */
          className={cn(
            'pointer-events-none absolute top-4 z-[8] rounded-full px-3 py-1 transition-opacity duration-300',
            'border border-ink bg-paper',
            'font-mono text-tick text-ink-2',
            i === 0 ? 'left-4' : 'right-4',
          )}
        >
          {text}
        </span>
      ))}

      <div
        ref={dividerRef}
        className="pointer-events-none absolute bottom-0 top-0 z-10 -ml-px w-0.5 bg-accent will-change-[left]"
        style={{ left: `${shown}%` }}
      >
        <button
          ref={handleRef}
          type="button"
          role="slider"
          aria-label={`Reveal divider, ${labels[0]} to ${labels[1]}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={shown}
          aria-valuetext={`${shown}% ${labels[0]}`}
          onKeyDown={onKeyDown}
          className={cn(
            'pointer-events-auto absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2',
            'cursor-ew-resize place-items-center rounded-field p-0 transition-colors duration-200',
            /* The handle sat on a 6px halo built from a hand-written rgb
             * triple of the retired green accent — stale, and a spread ring
             * besides, which is the one shadow shape this system does not
             * have. It is now a flat accent-wash bed under the same 2px
             * accent border: the chevrons read at 5.56 : 1 on #dde3f6 and
             * nothing glows. The local focus ring went with it — the site has
             * exactly one focus treatment and it lives in input.css. */
            'border-2 border-accent text-accent bg-accent-wash',
          )}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
            <path d="M6 1 L1 7 L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 1 L17 7 L12 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default CompareReveal
