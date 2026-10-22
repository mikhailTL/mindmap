// Brief psychomotor vigilance task (PVT-B, Basner 2011); a lapse is a reaction slower than 355 ms.
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
  // Mean of the slowest 10% of trials.
  const k = Math.max(1, Math.round(n / 10))
  const slow = rts.slice(n - k)
  const slowest10 = slow.reduce((a, b) => a + b, 0) / slow.length
  const lapses = rts.filter(r => r > LAPSE_MS).length
  return { ok: true, n, falseStarts, mean, median, slowest10, lapses }
}

export function pvtWords(mean, usual) {
  if (mean == null) return 'Not enough taps to say.'
  const ms = Math.round(mean)
  if (usual == null) return `Your reaction time today is ${ms} ms.`
  const d = ms - Math.round(usual)
  if (d >= 25) return `${ms} ms today, slower than your usual ${Math.round(usual)}.`
  if (d <= -25) return `${ms} ms today, quicker than your usual ${Math.round(usual)}.`
  return `${ms} ms today, about your usual.`
}
