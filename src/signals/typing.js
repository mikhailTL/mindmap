// Gaps of 2 s or more count as pauses and are left out of the median.
// Typing rhythm inside the app's own text fields: key timestamps and a deletion flag only, not key values.
export const PAUSE_MS = 2000
export const MIN_KEYS = 8

/* `keys` is [{ t: ms, del: boolean }, ...] in order. */
export function typingRhythm(keys) {
  const n = keys.length
  if (n < MIN_KEYS) return { ok: false, keys: n, medianGap: null, pauses: 0, deletions: 0 }
  const gaps = []
  let pauses = 0
  for (let i = 1; i < n; i++) {
    const g = keys[i].t - keys[i - 1].t
    if (g >= PAUSE_MS) pauses++
    else gaps.push(g)
  }
  gaps.sort((a, b) => a - b)
  const m = gaps.length >> 1
  const medianGap = gaps.length ? (gaps.length % 2 ? gaps[m] : (gaps[m - 1] + gaps[m]) / 2) : null
  const deletions = keys.filter(k => k.del).length / n
  return { ok: true, keys: n, medianGap, pauses, deletions }
}

export function fastBurst(gap, usualGap) {
  if (gap == null || usualGap == null) return false
  return gap < usualGap * 0.7
}

export function recorder() {
  const keys = []
  return {
    key(e) {
      if (e.ctrlKey || e.metaKey) return
      keys.push({ t: typeof performance !== 'undefined' ? performance.now() : Date.now(),
                  del: e.key === 'Backspace' || e.key === 'Delete' })
    },
    recent(count = 12) {
      return typingRhythm(keys.slice(-Math.max(count, MIN_KEYS)))
    },
    summary() { return typingRhythm(keys) },
    reset() { keys.length = 0 },
  }
}
