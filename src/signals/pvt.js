/* The psychomotor vigilance task, brief form, on a phone screen.
 *
 * A counter starts at a random moment; the student taps as soon as it does;
 * the time from start to tap is one reaction time. Sixty to ninety seconds of
 * that is the PVT-B (Basner, Mollicone and Dinges 2011), which tracks the
 * ten-minute laboratory test under sleep loss (Grant 2017; Benderoth 2021).
 * A lapse is a reaction slower than 355 ms, the PVT-B threshold. A false
 * start is a tap before the counter began.
 *
 * It measures alertness and the cost of a short night. It does not measure
 * stress, and the screen that shows it says so. */

export const LAPSE_MS = 355
export const MIN_TRIALS = 5

export function pvtStats(trials) {
  const valid = trials.filter(t => !t.falseStart && t.rt >= 0)
  const falseStarts = trials.length - valid.length
  const n = valid.length
  if (n < MIN_TRIALS) {
    return { ok: false, n, falseStarts, mean: null, median: null, slowest10: null, lapses: 0 }
  }
  const rts = valid.map(t => t.rt).sort((a, b) => a - b)
  const mean = rts.reduce((a, b) => a + b, 0) / n
  const m = n >> 1
  const median = n % 2 ? rts[m] : (rts[m - 1] + rts[m]) / 2
  const k = Math.max(1, Math.round(n / 10))
  const slow = rts.slice(n - k)
  const slowest10 = slow.reduce((a, b) => a + b, 0) / slow.length
  const lapses = rts.filter(r => r > LAPSE_MS).length
  return { ok: true, n, falseStarts, mean, median, slowest10, lapses }
}

/* The sentence under the number. A duration, never a feeling or a cause. */
export function pvtWords(mean, usual) {
  if (mean == null) return 'Not enough taps to say.'
  const ms = Math.round(mean)
  if (usual == null) return `Your reaction time today is ${ms} ms.`
  const d = ms - Math.round(usual)
  if (d >= 25) return `${ms} ms today, slower than your usual ${Math.round(usual)}.`
  if (d <= -25) return `${ms} ms today, quicker than your usual ${Math.round(usual)}.`
  return `${ms} ms today, about your usual.`
}
