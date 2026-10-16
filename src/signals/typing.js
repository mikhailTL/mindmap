/* Typing rhythm, inside MindMap's own text fields and nowhere else.
 *
 * A web app cannot see what is typed into other apps, and this one does not
 * want to. In Notes and the check-in it records the TIME of each key and
 * whether it was a deletion, never the key itself. From those timestamps:
 * the median gap between keys, how many pauses longer than two seconds, and
 * the share of keys that were deletions.
 *
 * Longer inter-key delays went with lower mood in adults followed for weeks
 * (Zulueta 2018, BiAffect); backspace-heavy typing went with agitation (Liu
 * 2024); in 934 adolescents the keystroke signal on its own was weak (Braund
 * 2023). So this is labelled exploratory in the app, it is only ever
 * compared with the student's own earlier sessions, and the one thing it
 * does in the moment is offer a breath when a burst is much faster than
 * usual. */

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

/* A burst is fast when its median gap is under 70% of the usual gap. */
export function fastBurst(gap, usualGap) {
  if (gap == null || usualGap == null) return false
  return gap < usualGap * 0.7
}

/* A small recorder for a text field. Call `key(event)` from onKeyDown and
 * `summary()` when the field blurs or the note is saved. */
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
