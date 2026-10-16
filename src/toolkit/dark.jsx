import React from 'react'

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
