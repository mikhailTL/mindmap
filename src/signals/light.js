// Heads Up light: how the phone is used (scrolling, typing, session length, hand motion) against the teen's own baseline.
// Inputs are numbers only; no content, app names or contacts.
export const Light = Object.freeze({ GREEN: 'green', YELLOW: 'yellow', RED: 'red' })

export const FEATURES = ['pxPerSec', 'reversals', 'medianGap', 'deletions', 'minutes', 'motion']

// +1 means a higher value is more strain; medianGap is -1 because a shorter gap is faster typing.
const SIGN = { pxPerSec: 1, reversals: 1, medianGap: -1, deletions: 1, minutes: 1, motion: 1 }
const WEIGHT = { pxPerSec: 1.0, reversals: 0.9, medianGap: 0.8, deletions: 0.8, minutes: 1.1, motion: 0.5 }

const KIND = {
  pxPerSec:  'fast scrolling',
  reversals: 'back-and-forth scrolling',
  medianGap: 'fast typing',
  deletions: 'a lot of deleting',
  minutes:   'a long run',
  motion:    'a restless hand',
}

export function scrollFeatures(events) {
  const n = events.length
  if (n < 2) return { pxPerSec: null, reversals: null, samples: n }
  let dist = 0, flips = 0, lastDir = 0, moves = 0
  for (let i = 1; i < n; i++) {
    const dy = events[i].y - events[i - 1].y
    dist += Math.abs(dy)
    const dir = Math.sign(dy)
    if (dir !== 0) {
      moves++
      if (lastDir !== 0 && dir !== lastDir) flips++
      lastDir = dir
    }
  }
  const secs = (events[n - 1].t - events[0].t) / 1000
  return { pxPerSec: secs > 0 ? dist / secs : null, reversals: moves ? flips / moves : 0, samples: n }
}

export function typingFeatures(keys, pauseMs = 2000) {
  const n = keys.length
  if (n < 8) return { medianGap: null, deletions: null, keys: n }
  const gaps = []
  for (let i = 1; i < n; i++) {
    const g = keys[i].t - keys[i - 1].t
    if (g < pauseMs) gaps.push(g)
  }
  gaps.sort((a, b) => a - b)
  const m = gaps.length >> 1
  const medianGap = gaps.length ? (gaps.length % 2 ? gaps[m] : (gaps[m - 1] + gaps[m]) / 2) : null
  return { medianGap, deletions: keys.filter(k => k.del).length / n, keys: n }
}

export function sessionFeatures({ scroll = [], keys = [], startedAt = 0, endedAt = 0, motionRms = null }) {
  const s = scrollFeatures(scroll)
  const k = typingFeatures(keys)
  return {
    pxPerSec: s.pxPerSec, reversals: s.reversals,
    medianGap: k.medianGap, deletions: k.deletions,
    minutes: Math.max(0, (endedAt - startedAt) / 60000),
    motion: motionRms,
  }
}

// Welford running mean and variance per feature.
export function emptyBaseline() {
  const mean = {}, m2 = {}, count = {}
  for (const f of FEATURES) { mean[f] = null; m2[f] = 0; count[f] = 0 }
  return { n: 0, mean, m2, count }
}

export function updateBaseline(b, features) {
  const next = { n: b.n + 1, mean: { ...b.mean }, m2: { ...b.m2 }, count: { ...b.count } }
  for (const f of FEATURES) {
    const x = features[f]
    if (typeof x !== 'number' || !Number.isFinite(x)) continue
    const c = next.count[f] + 1
    const mu = next.mean[f] == null ? x : next.mean[f]
    const delta = x - mu
    const mean = next.count[f] === 0 ? x : mu + delta / c
    next.m2[f] = next.count[f] === 0 ? 0 : next.m2[f] + delta * (x - mean)
    next.mean[f] = mean
    next.count[f] = c
  }
  return next
}

export const READY_AFTER = 7

const sd = (b, f) => {
  if (b.count[f] < 2) return null
  const v = b.m2[f] / (b.count[f] - 1)
  // Per-feature SD floor in that feature's units, so an even first week does not turn small changes into large z.
  const floor = { pxPerSec: 80, reversals: 0.06, medianGap: 20, deletions: 0.05, minutes: 4, motion: 0.02 }[f]
  return Math.max(Math.sqrt(v), floor)
}

// 0 to 100: weighted mean of positive z (clipped at 3) through a logistic with slope 2.2 centred at 1.1.
export function strainIndex(features, baseline) {
  const parts = []
  for (const f of FEATURES) {
    const x = features[f]
    const mu = baseline.mean[f]
    const s = sd(baseline, f)
    if (typeof x !== 'number' || mu == null || s == null) continue
    const z = Math.max(-3, Math.min(3, (SIGN[f] * (x - mu)) / s))
    parts.push({ f, z, w: WEIGHT[f] })
  }
  const ready = baseline.n >= READY_AFTER && parts.length >= 2
  const wsum = parts.reduce((a, p) => a + p.w, 0) || 1
  const score = parts.reduce((a, p) => a + p.w * Math.max(0, p.z), 0) / wsum
  const index = Math.round(100 / (1 + Math.exp(-2.2 * (score - 1.1))))
  const top = parts.length ? [...parts].sort((a, b) => b.z * b.w - a.z * a.w)[0] : null
  const topKey = top && top.z > 0.75 ? top.f : null
  const words = baseline.n < READY_AFTER
    ? `Still learning your usual. ${baseline.n} of ${READY_AFTER} sessions.`
    : !ready ? 'Waiting for a minute of use.'
    : index < 40 ? 'About your usual.'
    : topKey ? `Above your usual, mostly ${KIND[topKey]}.`
    : 'Above your usual.'
  return { index, ready, top: topKey, words, parts }
}

export function lightFor(index) {
  if (index >= 70) return Light.RED
  if (index >= 40) return Light.YELLOW
  return Light.GREEN
}

// Red needs 60 s at red level to switch on and holds for 5 min after the last red reading.
export const RED_AFTER_MS = 60 * 1000
export const RED_HOLD_MS = 5 * 60 * 1000

export function decideLight(state, index, now) {
  const want = lightFor(index)
  if (state.light === Light.RED) {
    if (want === Light.RED) return { light: Light.RED, since: state.since, redSince: state.redSince ?? state.since, lastRedAt: now }
    const lastRed = state.lastRedAt ?? state.since
    if (now - lastRed <= RED_HOLD_MS) return { ...state }
    return { light: want, since: now }
  }
  if (want === Light.RED) {
    const redSince = state.redSince ?? now
    if (now - redSince >= RED_AFTER_MS) return { light: Light.RED, since: now, redSince, lastRedAt: now }
    return { light: Light.YELLOW, since: state.light === Light.YELLOW ? state.since : now, redSince }
  }
  if (want === state.light) return { light: want, since: state.since }
  return { light: want, since: now }
}

export const NUDGE_TEXT = 'It may be time for a break. You seem stressed.'
export const NUDGE_COOLDOWN_MS = 30 * 60 * 1000

export function nudgeFor({ light, lastNudgeAt, now }) {
  if (light !== Light.RED) return { show: false, text: null }
  if (lastNudgeAt != null && now - lastNudgeAt < NUDGE_COOLDOWN_MS) return { show: false, text: null }
  return { show: true, text: NUDGE_TEXT }
}

const clock = ms => {
  const d = new Date(ms)
  let h = d.getHours(), m = d.getMinutes()
  const ap = h >= 12 ? 'pm' : 'am'
  h = h % 12 || 12
  return `${h}:${String(m).padStart(2, '0')} ${ap}`
}

export const SIGNAL = Object.freeze({
  pxPerSec:  'Nervous scrolling',
  reversals: 'Scrolling back and forth',
  medianGap: 'Frantic typing',
  deletions: 'Constant backspacing',
  minutes:   "Can't put it down",
  motion:    'Restless hand',
})

export const SIGNAL_Z = 0.75

export function signalsFrom(strain) {
  const parts = Array.isArray(strain) ? strain : (strain && Array.isArray(strain.parts) ? strain.parts : [])
  return parts
    .filter(p => p && SIGNAL[p.f] && typeof p.z === 'number' && p.z > SIGNAL_Z)
    .sort((a, b) => b.z * (b.w ?? WEIGHT[b.f]) - a.z * (a.w ?? WEIGHT[a.f]))
    .map(p => SIGNAL[p.f])
}

/* The face drawn on each lit lamp. */
export const LIGHT_FACE = Object.freeze({ green: 'smile', yellow: 'neutral', red: 'frown' })

export const HEADLINE = Object.freeze({
  green:  'No signs of stress today.',
  yellow: 'Some signs of stress today.',
  red:    'Strong signs of stress. It may be worth checking in tonight.',
})

const ALLOWED = new Set(Object.values(SIGNAL))

export function parentSummary(arg = {}) {
  const { light: raw, at, signals, top } = arg
  const light = raw === Light.RED || raw === Light.YELLOW ? raw : Light.GREEN
  // Also accepts the older { light, at, minutes, top } call shape and returns line/detail for it.
  const legacy = !('signals' in arg) && ('minutes' in arg || 'top' in arg)
  const given = legacy ? (SIGNAL[top] ? [SIGNAL[top]] : []) : (Array.isArray(signals) ? signals : [])
  // Signal labels and the time reach the parent only on red; yellow shows the colour and headline.
  const list = light !== Light.RED ? [] : [...new Set(given.filter(l => ALLOWED.has(l)))]
  const time = light === Light.RED && typeof at === 'number' && Number.isFinite(at) ? `Red at ${clock(at)}` : null
  const out = { light, headline: HEADLINE[light], time, signals: list }
  return legacy ? { ...out, line: out.headline, detail: time } : out
}
