import React from 'react'
import { Button } from '../ui/button'
import { OnDevice } from './shell'
import { LevelMeter, Countdown } from './game'

/* Eyes closed. The one wrapper the three sensor exercises share.
 *
 * When an exercise goes dark the screen is a plain near-black sheet with one
 * line of small text, the Screen Wake Lock keeps the display from locking
 * (which would also freeze the sensors: on both platforms page JavaScript
 * stops the moment the screen locks), and a tap anywhere ends the session.
 * Cues reach the student as sound on every phone and as vibration on the
 * phones whose browser has it, which in October 2026 means Android: Safari
 * has no Vibration API and the haptic trick through a switch input was
 * closed in iOS 26.5. The wrapper says which it is doing so nobody waits for
 * a buzz that cannot come.
 *
 * Nothing here records anything. */

export const canVibrate = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

/* A short buzz where the browser has one. Returns false where it does not,
   so a caller can fall back to a tone. */
export function buzz(pattern = 40) {
  if (!canVibrate()) return false
  try { return !!navigator.vibrate(pattern) } catch { return false }
}

/* Hold the screen on while `on` is true. Re-requested when the page comes
   back, because the lock is released whenever the page is hidden. */
export function useWakeLock(on) {
  React.useEffect(() => {
    if (!on || typeof navigator === 'undefined' || !navigator.wakeLock) return
    let lock = null
    let dead = false
    const take = async () => {
      try { lock = await navigator.wakeLock.request('screen') } catch { lock = null }
    }
    const back = () => { if (!dead && document.visibilityState === 'visible') take() }
    take()
    document.addEventListener('visibilitychange', back)
    return () => {
      dead = true
      document.removeEventListener('visibilitychange', back)
      try { lock?.release() } catch { /* already gone */ }
    }
  }, [on])
}

/* The dark sheet. `line` is the one thing it says; `children` can carry a
   large word or count for a student who opens one eye. Tap or key ends it. */
export function DarkSheet({ on, line = 'Eyes closed. Tap anywhere to stop.', onStop, children }) {
  useWakeLock(on)
  React.useEffect(() => {
    if (!on) return
    const key = e => { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') onStop?.() }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [on, onStop])
  if (!on) return null
  return (
    <div role="button" tabIndex={0} aria-label="Eyes closed mode. Tap to stop."
      onClick={onStop}
      className="fixed inset-0 z-50 flex cursor-pointer select-none flex-col items-center justify-center
        bg-[#06161a] text-mist touch-manipulation">
      <div className="text-center">{children}</div>
      <p className="absolute inset-x-0 bottom-10 text-center font-body text-fine text-mist/70">{line}</p>
    </div>
  )
}

/* The one line that says what cues a phone will give, at the point of use. */
export function cueWords(sound) {
  const v = canVibrate()
  if (v && sound) return 'Cues by vibration and a soft tone.'
  if (v) return 'Cues by vibration.'
  if (sound) return 'Cues by a soft tone. This phone has no vibration from the browser.'
  return 'Turn sound on for cues. This phone has no vibration from the browser.'
}

/* ── Pieces the six sensor games share ─────────────────────────────────
 *
 * Each game has the same four steps: a how to play screen, a 3 2 1, the
 * round, and the end card from src/toolkit/game. What lives here is the part
 * the shared game layer does not carry: a hold input that works the same on a
 * laptop (Space) and a phone (press and hold), a personal best kept on this
 * device, and the how to play screen. */

/* `true` while mounted. Every await in a game checks it before it touches
   state, so a permission prompt that resolves after the reader left does
   nothing. */
export function useMounted() {
  const m = React.useRef(true)
  React.useEffect(() => { m.current = true; return () => { m.current = false } }, [])
  return m
}

/* Space held, or a pointer held on whatever `bind` is spread onto. `ref`
   is for a requestAnimationFrame loop; `held` is for drawing. */
export function useHold(active) {
  const [held, setHeld] = React.useState(false)
  const ref = React.useRef(false)
  const set = React.useCallback(v => { if (ref.current !== v) { ref.current = v; setHeld(v) } }, [])
  React.useEffect(() => {
    if (!active) { set(false); return }
    const down = e => {
      if (e.key !== ' ') return
      e.preventDefault()
      if (!e.repeat) set(true)
    }
    const up = e => { if (e.key === ' ') { e.preventDefault(); set(false) } }
    const off = () => set(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', off)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', off)
    }
  }, [active, set])
  const bind = {
    onPointerDown: e => {
      if (!active) return
      e.preventDefault()
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* not capturable */ }
      set(true)
    },
    onPointerUp: () => set(false),
    onPointerCancel: () => set(false),
    onContextMenu: e => e.preventDefault(),
  }
  return { held, ref, bind }
}

/* A personal best per game, on this device only. Never compared with
   anybody else and never sent. `lower` is for times where less is better. */
const BEST_KEY = 'mindmap.toolkit.bests'
export function readBest(id) {
  try {
    const all = JSON.parse(localStorage.getItem(BEST_KEY) || '{}')
    const v = all?.[id]
    return typeof v === 'number' && Number.isFinite(v) ? v : null
  } catch { return null }
}
export function saveBest(id, value, { lower = false } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return { best: readBest(id), isNew: false }
  const old = readBest(id)
  const isNew = old == null || (lower ? value < old : value > old)
  if (isNew) {
    try {
      const all = JSON.parse(localStorage.getItem(BEST_KEY) || '{}') || {}
      localStorage.setItem(BEST_KEY, JSON.stringify({ ...all, [id]: value }))
    } catch { /* storage blocked: the best lasts this visit */ }
  }
  return { best: isNew ? value : old, isNew, before: old }
}

/* The how to play screen: a picture of the game, up to three numbered lines,
   one Start, the level, the line that says what is measured, then anything
   optional (the pulse check). */
export function HowTo({ art, steps = [], onStart, startLabel = 'Start', disabled = false,
                        measured, pick, children }) {
  return (
    <div className="mx-auto w-full max-w-[34rem]">
      <div className="relative overflow-hidden rounded-[22px] border border-rule p-3 shadow-card"
        style={{ background:'radial-gradient(120% 90% at 50% 0%, #ffffff 0%, var(--g-wash, #dcefe4) 100%)' }}>
        {art}
      </div>
      <p className="mt-4 font-display text-fine font-bold uppercase tracking-[0.1em] text-ink-2">How to play</p>
      <ol className="mt-2 space-y-2.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full font-display text-fine
              font-bold text-white" style={{ background:'var(--g-ink, #0d2b1e)' }}>{i + 1}</span>
            <span className="pt-0.5 text-sec text-ink">{s}</span>
          </li>
        ))}
      </ol>
      {pick}
      <Button className="mt-5 w-full" disabled={disabled} onClick={onStart}>{startLabel}</Button>
      <LevelMeter className="mt-5"/>
      {measured && <OnDevice className="mt-3">{measured}</OnDevice>}
      {children}
    </div>
  )
}

/* Back to the top when a round ends, so the end card opens at its start. */
export function useTopOn(on) {
  React.useEffect(() => { if (on) { try { window.scrollTo(0, 0) } catch { /* no window */ } } }, [on])
}

/* A 3 2 1 laid over the game's picture. */
export function CountOver({ on, onDone }) {
  if (!on) return null
  return (
    <div className="absolute inset-0 z-20 grid place-items-center rounded-panel bg-white/60">
      <Countdown from={3} onDone={onDone}/>
    </div>
  )
}
