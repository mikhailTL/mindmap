import { MOVE_LIMIT_G } from './motion.js'

/* One score, from whichever channels the phone got. Same last step and same K
 * as the patch and self-report routes, so all three land on one scale.
 *
 * Every feature enters as a z-score against the same person's own history,
 * captured the same way. That is what lets a camera HRV index sit beside a
 * patch RMSSD: a fixed scale difference between methods cancels against each
 * method's own baseline. */
const K = 2.4                   /* the logistic constant the other two routes use */

/* The sign carries direction:
 *   heart rate up                                     -> load up
 *   beat-to-beat variation down                       -> load up (weight < 0)
 *   pitch up, pitch less steady, loudness less steady -> load up
 * Weights are a starting allocation, NOT fitted — nothing here is trained on a
 * person. Heart terms carry more because the patch leans on those two. */
export const TERMS = [
  { id: 'hr',        ch: 'heart', w:  1.2, label: 'Heart rate' },
  { id: 'hrv',       ch: 'heart', w: -1.4, label: 'Beat-to-beat variation' },
  { id: 'f0Mean',    ch: 'voice', w:  0.6, label: 'Pitch' },
  { id: 'f0Cv',      ch: 'voice', w:  0.4, label: 'Pitch range' },
  { id: 'f0Instab',  ch: 'voice', w:  0.5, label: 'Pitch steadiness' },
  { id: 'ampInstab', ch: 'voice', w:  0.3, label: 'Loudness steadiness' },
]

/* Starting point before a user has history: population figures for adolescents
   at rest, deliberately wide. The confidence band carries the fact that these
   are borrowed. */
export const PRIOR = {
  hr:        { m: 76,    s: 11 },
  hrv:       { m: 26,    s: 11 },     /* the camera index, not clinical RMSSD */
  f0Mean:    { m: 175,   s: 38 },
  f0Cv:      { m: 0.22,  s: 0.08 },
  f0Instab:  { m: 0.025, s: 0.012 },
  ampInstab: { m: 0.13,  s: 0.05 },
}

export function emptyBaseline() {
  return { n: 0, days: 0, stats: {}, lastDay: null }
}

/* Welford: running mean and variance without keeping the history. Only one
   capture per day counts toward `days`; the rest still sharpen the mean. */
export function updateBaseline(baseline, features, dayKey) {
  const b = { ...baseline, stats: { ...baseline.stats } }
  for (const [k, v] of Object.entries(features)) {
    if (v == null || !Number.isFinite(v)) continue
    const st = b.stats[k] ? { ...b.stats[k] } : { n: 0, m: 0, m2: 0 }
    st.n += 1
    const d = v - st.m
    st.m += d / st.n
    st.m2 += d * (v - st.m)
    b.stats[k] = st
  }
  b.n += 1
  if (dayKey && dayKey !== b.lastDay) { b.days += 1; b.lastDay = dayKey }
  return b
}

function zOf(key, value, baseline) {
  const st = baseline.stats[key]
  const prior = PRIOR[key]
  /* Under five captures a personal sd is mostly noise: use the prior's spread
     with the personal mean. */
  if (!st || st.n < 2) return prior ? (value - prior.m) / prior.s : 0
  const sd = st.n >= 5 ? Math.sqrt(st.m2 / (st.n - 1)) : (prior ? prior.s : 1)
  const m = st.m
  return sd > 0 ? (value - m) / sd : 0
}

/* Assembles the feature set from whatever the capture produced. */
export function featuresFrom({ ppg, voice }) {
  const f = {}
  if (ppg?.ok) {
    f.hr = ppg.hr
    if (ppg.hrvOk) f.hrv = ppg.rmssd
  }
  if (voice?.ok) {
    f.f0Mean = voice.f0Mean
    f.f0Cv = voice.f0Cv
    if (voice.f0Instab != null) f.f0Instab = voice.f0Instab
    if (voice.ampInstab != null) f.ampInstab = voice.ampInstab
  }
  return f
}

export function scoreCapture({ ppg, voice, motion, baseline = emptyBaseline() }) {
  const features = featuresFrom({ ppg, voice })
  const used = TERMS.filter(t => features[t.id] != null && Number.isFinite(features[t.id]))
  if (!used.length) {
    return { ok: false, reason: 'no-signal', message: 'Nothing came through to score.' }
  }

  const contrib = used.map(t => {
    const z = clamp(zOf(t.id, features[t.id], baseline), -3, 3)
    return { ...t, value: features[t.id], z, raw: t.w * z }
  })
  const wTotal = TERMS.reduce((a, t) => a + Math.abs(t.w), 0)
  const wSum = used.reduce((a, t) => a + Math.abs(t.w), 0)
  /* Floor the divisor at 55% of full weight. Dividing by only the weight
     present lets one surviving channel speak for all: a heart-only capture at
     3 sd scored 97 against 93 with voice attached, so losing a channel raised
     the score. */
  const S = contrib.reduce((a, c) => a + c.raw, 0) / Math.max(wSum, 0.55 * wTotal) / 2
  const score = Math.round(100 / (1 + Math.exp(-K * S)))

  /* Band. Three shortfalls widen it: missing channels, poor camera signal, and
     a baseline too short to define this person's normal. Summed in quadrature
     as standard deviations on S, then carried through the logistic by its
     slope at the score — hence 100*K*p*(1-p). */
  const chPresent = new Set(contrib.map(c => c.ch))
  const missingW = TERMS.filter(t => !used.includes(t)).reduce((a, t) => a + Math.abs(t.w), 0)
  const sMissing = 0.55 * (missingW / wTotal)
  const sQuality = 0.45 * (1 - (ppg?.quality ?? 0))
  const sBaseline = 0.75 * Math.exp(-(baseline.days || 0) / 6)
  const sigmaS = Math.sqrt(sMissing ** 2 + sQuality ** 2 + sBaseline ** 2)
  const p = score / 100
  const half = clamp(Math.round(1.0 * sigmaS * 100 * K * p * (1 - p)), 3, 34)

  const held = motion?.ok ? !motion.still : false

  return {
    ok: true,
    score, S, contrib, features,
    low: Math.max(0, score - half), high: Math.min(100, score + half), half,
    channels: [...chPresent],
    missing: TERMS.filter(t => !used.includes(t)).map(t => t.ch)
      .filter((v, i, a) => a.indexOf(v) === i && !chPresent.has(v)),
    baselineDays: baseline.days || 0,
    quality: ppg?.quality ?? 0,
    held,
    holdReason: held
      ? `You were moving at ${motion.peak.toFixed(2)} g, over the ${MOVE_LIMIT_G} g line. The reading is kept but not counted as stress.`
      : null,
  }
}

/* Same four bands as the self-report route, so the two agree on "usual". */
export function bandOf(n) {
  if (n < 35) return { key: 'low',   word: 'easier than usual' }
  if (n < 58) return { key: 'usual', word: 'in your usual range' }
  if (n < 73) return { key: 'up',    word: 'a little high' }
  return { key: 'high', word: 'high' }
}

/* One sentence, then the number. Never the other way round. */
export function sentenceFor(r) {
  const b = bandOf(r.score)
  const top = [...r.contrib].sort((a, c) => Math.abs(c.raw) - Math.abs(a.raw))[0]
  const verb = b.key === 'usual' ? 'sitting' : 'running'
  const tail = Math.abs(top.raw) < 0.3
    ? 'Nothing in the reading stands out on its own.'
    : `${top.label} is the biggest single part of that: ${fmtZ(top.z)} your own average.`
  return { lead: `Right now you are ${verb} `, word: b.word, tail, calm: b.key === 'usual' || b.key === 'low' }
}

const fmtZ = z => {
  const n = Math.abs(z).toFixed(1)
  return `${n} standard deviation${n === '1.0' ? '' : 's'} ${z > 0 ? 'above' : 'below'}`
}
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))
