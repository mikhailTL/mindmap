// Peak movement above 0.35 g holds the score back, since exercise and stress look alike on the other channels.
export const MOVE_LIMIT_G = 0.35

export function startMotion() {
  const mags = []
  const on = e => {
    const a = e.accelerationIncludingGravity || e.acceleration
    if (!a || a.x == null) return
    // Magnitude in g minus 1 g, so a still phone reads zero at any angle.
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

// iOS grants accelerometer access only after a tap or click.
export async function askMotion() {
  const C = typeof DeviceMotionEvent !== 'undefined' ? DeviceMotionEvent : null
  if (!C) return false
  if (typeof C.requestPermission !== 'function') return true
  try { return (await C.requestPermission()) === 'granted' } catch { return false }
}
