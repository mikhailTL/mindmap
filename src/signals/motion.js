/* Movement during a capture. Movement is a disqualifier, not a stress signal:
 * above 0.35 g the score is held back rather than counted, because a hard run
 * and a hard day look alike in every other channel. Same rule as the patch,
 * and here it doubles as a check on a fingertip sliding off the lens. */
export const MOVE_LIMIT_G = 0.35

export function startMotion() {
  const mags = []
  const on = e => {
    const a = e.accelerationIncludingGravity || e.acceleration
    if (!a || a.x == null) return
    /* Subtract 1 g of magnitude, not an axis, so a phone held at any angle
       reads zero when still. */
    const g = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) / 9.81
    mags.push(Math.abs(g - 1))
  }
  window.addEventListener('devicemotion', on)
  return {
    stop() {
      window.removeEventListener('devicemotion', on)
      if (mags.length < 10) return { ok: false, reason: 'no-sensor', rms: null, still: true }
      const r = Math.sqrt(mags.reduce((a, b) => a + b * b, 0) / mags.length)
      const peak = Math.max(...mags)
      return { ok: true, rms: r, peak, still: peak <= MOVE_LIMIT_G, samples: mags.length }
    },
  }
}

/* iOS needs a user gesture before it will hand over the accelerometer. */
export async function askMotion() {
  const C = typeof DeviceMotionEvent !== 'undefined' ? DeviceMotionEvent : null
  if (!C) return false
  if (typeof C.requestPermission !== 'function') return true
  try { return (await C.requestPermission()) === 'granted' } catch { return false }
}
