import { MOVE_LIMIT_G } from './motion.js'

/* One score, from whichever channels the phone actually got.
 *
 * The patch route and the self-report route already end the same way: weighted
 * terms summed, divided by the weight that was available, put through a
 * logistic and read off as 0-100. This does the same thing with the same
 * constant, so a phone reading and a patch reading are the same number on the
 * same scale rather than two scores that happen to share an axis label.
 *
 * Every feature enters as a z-score against the same person's own history,
 * captured the same way. That is what lets a camera HRV index sit next to a
 * patch RMSSD: a fixed scale difference between the two methods cancels when
 * each is measured against its own baseline. It is also the only honest way to
 * read a resting heart rate, which is a personal constant far more than it is
 * a population one.
 */
const K = 2.4                   /* the logistic constant the other two routes use */

/* Direction is the sign, and it is the part worth arguing about:
 *   heart rate up          -> load up
 *   beat-to-beat variation down -> load up, so the weight is negative
 *   pitch up, pitch less steady, loudness less steady -> load up
 * Weights are a starting allocation, not a fitted result. Nothing here has
 * been trained on a person; the heart terms carry more because they are the
 * two the patch itself leans on. */
export const TERMS = [
  { id: 'hr',        ch: 'heart', w:  1.2, label: 'Heart rate' },
  { id: 'hrv',       ch: 'heart', w: -1.4, label: 'Beat-to-beat variation' },
  { id: 'f0Mean',    ch: 'voice', w:  0.6, label: 'Pitch' },
  { id: 'f0Cv',      ch: 'voice', w:  0.4, label: 'Pitch range' },
  { id: 'f0Instab',  ch: 'voice', w:  0.5, label: 'Pitch steadiness' },
  { id: 'ampInstab', ch: 'voice', w:  0.3, label: 'Loudness steadiness' },
]

/* Where a new user starts, before they have any history. Population numbers
   for adolescents at rest, wide on purpose: the confidence band is what
   carries the fact that these are borrowed rather than earned, and it narrows
   as real captures replace them. */
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

/* Welford, so a running mean and variance never need the history kept. One
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
  /* Under about five captures a personal sd is mostly noise, so the prior's
     spread is used with the personal mean once there is one. */
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
  /* Dividing by the weight actually present would let one surviving channel
     speak for all of them: a heart-only capture at three standard deviations
     came out at 97 where the same reading with voice attached came out at 93,
     so losing a channel raised the score. The floor at 55% of the full weight
     stops that — a capture missing half its evidence is pulled toward the
     middle, and the band below widens at the same time. */
  const S = contrib.reduce((a, c) => a + c.raw, 0) / Math.max(wSum, 0.55 * wTotal) / 2
  const score = Math.round(100 / (1 + Math.exp(-K * S)))

  /* The band.
     Three things widen it, and each is a real shortfall rather than a mood:
     channels that did not arrive, a camera signal that was poor, and a
     baseline too short to say what normal is for this person. They are summed
     in quadrature as standard deviations on S, then carried through the
     logistic by its own slope at the score, which is where the 100*K*p*(1-p)
     comes from. */
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

/* What the score is called. Same four bands the self-report route uses, so the
   two never disagree about what "usual" means. */
export function bandOf(n) {
  if (n < 35) return { key: 'low',   word: 'easier than usual' }
  if (n < 58) return { key: 'usual', word: 'in your usual range' }
  if (n < 73) return { key: 'up',    word: 'a little high' }
  return { key: 'high', word: 'high' }
}

/* One sentence, then the number, in the order the rest of the product uses. */
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
