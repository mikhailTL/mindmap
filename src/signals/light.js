/* Heads Up: how a teenager reacts to their phone, not what is on it.
 *
 * Other monitoring apps watch content and
 * time: which apps, which contacts, how many hours. MindMap's Heads Up
 * watches none of that. It measures HOW the teen is using the phone, from
 * signals the phone already has: how fast they scroll and how often they
 * reverse, how fast they type and how much they delete, how long a session
 * runs, how much the hand moves. Each is compared with that teen's own usual,
 * learnt over their first sessions and updated after every one. The result
 * is one light.
 *
 *   green   usual
 *   yellow  above usual; the teen sees it, the parent sees only the colour
 *   red     well above usual and sustained; the teen gets one quiet offer of
 *           a break, the parent sees the time, the length and the KIND of
 *           signal (fast scrolling, fast typing, a long run), never an app, a
 *           person or a piece of content
 *
 * Nothing here reads a message, a username, a page or an app name, and the
 * functions take only numbers. Everything is a pure function so the whole
 * loop can be tested without a phone.
 *
 * Evidence this leans on, as far as it goes: keystroke timing and deletion
 * rate track mood and agitation in adults followed for weeks (Zulueta 2018;
 * Liu 2024) and are weak on their own in teenagers (Braund 2023); the
 * adolescent passive-sensing literature pools at r = 0.12 (Nature Digital
 * Medicine 2026). So the light is a prompt to look, never a diagnosis, and
 * the index is always the teen against themself. */

export const Light = Object.freeze({ GREEN: 'green', YELLOW: 'yellow', RED: 'red' })

export const FEATURES = ['pxPerSec', 'reversals', 'medianGap', 'deletions', 'minutes', 'motion']

/* Which direction counts as strain: faster scrolling, more reversals, FASTER
   typing (a smaller gap), more deletions, longer sessions, more movement. */
const SIGN = { pxPerSec: 1, reversals: 1, medianGap: -1, deletions: 1, minutes: 1, motion: 1 }
const WEIGHT = { pxPerSec: 1.0, reversals: 0.9, medianGap: 0.8, deletions: 0.8, minutes: 1.1, motion: 0.5 }

/* Words for the parent and the teen: the kind of signal, never the content. */
const KIND = {
  pxPerSec:  'fast scrolling',
  reversals: 'back-and-forth scrolling',
  medianGap: 'fast typing',
  deletions: 'a lot of deleting',
  minutes:   'a long run',
  motion:    'a restless hand',
}

/* ── features ───────────────────────────────────────────────────────────── */

/* `events` is [{ t: ms, y: px }] from scroll events in the page. */
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

/* `keys` is [{ t: ms, del: boolean }], never the key itself. */
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

/* ── the adaptive baseline ──────────────────────────────────────────────── */

/* A running mean and variance per feature (Welford), so the teen's usual
   moves with them and never needs a norm from anybody else. */
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
  /* a floor so a teen whose first week was perfectly even cannot be lit up
     by a tiny change */
  const floor = { pxPerSec: 80, reversals: 0.06, medianGap: 20, deletions: 0.05, minutes: 4, motion: 0.02 }[f]
  return Math.max(Math.sqrt(v), floor)
}

/* ── strain ─────────────────────────────────────────────────────────────── */

/* 0 to 100. Each feature's distance from the teen's usual, in their own
   standard deviations, signed toward strain, clipped at +3, weighted and put
   through a logistic so the middle of the scale is where most sessions sit
   and the top is hard to reach by one feature alone. */
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

/* Red needs the index to stay red for a minute, and once red it holds for
   five minutes, so a single burst cannot flash the parent's light and the
   teen's offer of a break does not vanish the moment they slow down.
   `now` is ms. State: { light, since }. */
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

/* ── the two outputs ────────────────────────────────────────────────────── */

export const NUDGE_TEXT = 'It may be time for a break. You seem stressed.'
export const NUDGE_COOLDOWN_MS = 30 * 60 * 1000

/* One quiet offer, on red only, at most every half hour. The teen can
   dismiss it and nothing is counted against them. */
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

/* ── Heads Up v4: what the parent sees ──────────────────────────────────── */

/* The only words a parent ever sees about activity: one label per feature. */
export const SIGNAL = Object.freeze({
  pxPerSec:  'Nervous scrolling',
  reversals: 'Scrolling back and forth',
  medianGap: 'Frantic typing',
  deletions: 'Constant backspacing',
  minutes:   "Can't put it down",
  motion:    'Restless hand',
})

export const SIGNAL_Z = 0.75

/* Labels of the parts whose z is above 0.75, strongest (z times weight)
   first. Takes the object strainIndex returns, or its `parts` array. */
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

/* What the parent's phone shows: a headline, and on red only the time and
   the signal labels. Never a minute count, an app or content.
   The older call shape { light, at, minutes, top } still works: `top` becomes
   the one signal, `minutes` is ignored, and `line` / `detail` are returned
   alongside for screens that have not moved over yet. */
export function parentSummary(arg = {}) {
  const { light: raw, at, signals, top } = arg
  const light = raw === Light.RED || raw === Light.YELLOW ? raw : Light.GREEN
  const legacy = !('signals' in arg) && ('minutes' in arg || 'top' in arg)
  const given = legacy ? (SIGNAL[top] ? [SIGNAL[top]] : []) : (Array.isArray(signals) ? signals : [])
  /* The owner's rule: no specific phone-use detail reaches a parent unless
     the light is red, so yellow carries the colour and the headline only. */
  const list = light !== Light.RED ? [] : [...new Set(given.filter(l => ALLOWED.has(l)))]
  const time = light === Light.RED && typeof at === 'number' && Number.isFinite(at) ? `Red at ${clock(at)}` : null
  const out = { light, headline: HEADLINE[light], time, signals: list }
  return legacy ? { ...out, line: out.headline, detail: time } : out
}
