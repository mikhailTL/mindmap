import { describe, expect, it } from 'vitest'
import { MOVE_LIMIT_G } from '../src/signals/motion.js'
import {
  PRIOR, TERMS, emptyBaseline, featuresFrom, scoreCapture, updateBaseline,
} from '../src/signals/score.js'

/* Every number the phone route reports is a distance from the same person's
   own history. That makes the baseline the load-bearing part: get the running
   mean or spread wrong and a calm reading reads as stress for everybody.
   Welford keeps no history, so there is nothing to inspect after the fact,
   which is why it is checked against a direct computation here. */

const FEATURE_KEYS = ['hr', 'hrv', 'f0Mean', 'f0Cv', 'f0Instab', 'ampInstab']

const directMean = xs => xs.reduce((a, x) => a + x, 0) / xs.length
const directVariance = xs => {
  const m = directMean(xs)
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1)
}

const feed = (sequences, dayKeys) => {
  let b = emptyBaseline()
  const n = Object.values(sequences)[0].length
  for (let i = 0; i < n; i++) {
    const features = {}
    for (const [k, xs] of Object.entries(sequences)) features[k] = xs[i]
    b = updateBaseline(b, features, dayKeys ? dayKeys[i] : 'day-' + i)
  }
  return b
}

/* A baseline long enough that the personal spread is used, built from values
   that actually vary so the spread is not zero. */
const settledBaseline = () => {
  let b = emptyBaseline()
  for (let i = 0; i < 40; i++) {
    b = updateBaseline(b, {
      hr: 76 + ((i * 7) % 9) - 4,
      hrv: 26 + ((i * 5) % 11) - 5,
      f0Mean: 175 + ((i * 3) % 13) - 6,
      f0Cv: 0.22 + ((i % 5) - 2) * 0.01,
      f0Instab: 0.025 + ((i % 3) - 1) * 0.002,
      ampInstab: 0.13 + ((i % 4) - 1.5) * 0.004,
    }, 'day-' + i)
  }
  return b
}

const ppgOf = (over = {}) => ({ ok: true, hr: 95, rmssd: 20, hrvOk: true, quality: 0.9, ...over })
const voiceOf = (over = {}) => ({ ok: true, f0Mean: 200, f0Cv: 0.3, f0Instab: 0.03, ampInstab: 0.15, ...over })
const stillMotion = { ok: true, peak: 0.02, still: true }
const zFor = (result, id) => result.contrib.find(c => c.id === id).z

describe('Welford baseline', () => {
  it('matches a direct mean and variance over the same sequence', () => {
    const sequences = {
      hr: [70, 74, 66, 80, 72, 68, 90, 61, 77, 79],
      hrv: [26, 31, 19, 40, 22, 28, 24, 35, 18, 27],
      f0Cv: [0.21, 0.18, 0.3, 0.22, 0.26, 0.19, 0.24, 0.2, 0.28, 0.23],
    }
    const b = feed(sequences)
    for (const [k, xs] of Object.entries(sequences)) {
      const st = b.stats[k]
      expect(st.n).toBe(xs.length)
      expect(st.m).toBeCloseTo(directMean(xs), 10)
      expect(st.m2 / (st.n - 1)).toBeCloseTo(directVariance(xs), 10)
    }
  })

  it('tracks mean and variance correctly at every length, not only at the end', () => {
    const xs = [70, 74, 66, 80, 72, 68, 90]
    let b = emptyBaseline()
    xs.forEach((v, i) => {
      b = updateBaseline(b, { hr: v }, 'day-' + i)
      const seen = xs.slice(0, i + 1)
      expect(b.stats.hr.m).toBeCloseTo(directMean(seen), 10)
      if (seen.length > 1) {
        expect(b.stats.hr.m2 / (b.stats.hr.n - 1)).toBeCloseTo(directVariance(seen), 10)
      }
    })
  })

  it('does not mutate the baseline it was given', () => {
    const before = feed({ hr: [70, 74, 66] })
    const snapshot = JSON.parse(JSON.stringify(before))
    const after = updateBaseline(before, { hr: 200 }, 'later')
    expect(before).toEqual(snapshot)
    expect(after.stats.hr.m).not.toBeCloseTo(before.stats.hr.m, 6)
  })

  /* `days` is what the confidence band reads to decide how much to trust the
     baseline, so it has to count days and not captures. Three readings on one
     afternoon are not three days of normal. */
  it('counts one day per distinct day key, however many captures that day held', () => {
    const sameDay = feed({ hr: [70, 74, 66, 80, 72] }, ['mon', 'mon', 'mon', 'mon', 'mon'])
    expect(sameDay.n).toBe(5)
    expect(sameDay.days).toBe(1)
    expect(sameDay.lastDay).toBe('mon')

    const threeDays = feed({ hr: [70, 74, 66, 80, 72] }, ['mon', 'mon', 'tue', 'wed', 'wed'])
    expect(threeDays.n).toBe(5)
    expect(threeDays.days).toBe(3)

    /* Extra captures on a day still sharpen the mean even though they add no
       day, which is the comment's claim in the source. */
    expect(sameDay.stats.hr.n).toBe(5)
    expect(sameDay.stats.hr.m).toBeCloseTo(directMean([70, 74, 66, 80, 72]), 10)
  })

  it('advances no day when the capture has no day key', () => {
    const b = updateBaseline(emptyBaseline(), { hr: 70 }, null)
    expect(b.n).toBe(1)
    expect(b.days).toBe(0)
    expect(b.lastDay).toBeNull()
  })

  it('ignores a channel that came back null or NaN', () => {
    const b = updateBaseline(emptyBaseline(), { hr: NaN, hrv: null, f0Mean: 175 }, 'mon')
    expect(Object.keys(b.stats)).toEqual(['f0Mean'])
    /* n counts captures, not channels, so the capture still happened. */
    expect(b.n).toBe(1)
    expect(b.days).toBe(1)
  })
})

describe('baseline z-scores', () => {
  /* Under five captures a personal spread is mostly measurement noise. The
     prior's spread is borrowed instead, and the confidence band carries the
     fact that it was borrowed. */
  it('borrows the prior mean and spread with fewer than two captures', () => {
    const r = scoreCapture({ ppg: ppgOf({ hr: 98, rmssd: undefined, hrvOk: false, quality: 1 }), voice: null, motion: stillMotion, baseline: emptyBaseline() })
    expect(zFor(r, 'hr')).toBeCloseTo((98 - PRIOR.hr.m) / PRIOR.hr.s, 10)
  })

  it('uses the personal mean with the prior spread from two to four captures', () => {
    for (const xs of [[80, 90], [80, 90, 70], [80, 90, 70, 100]]) {
      const b = feed({ hr: xs })
      const r = scoreCapture({ ppg: ppgOf({ hr: 98, rmssd: undefined, hrvOk: false, quality: 1 }), voice: null, motion: stillMotion, baseline: b })
      expect(zFor(r, 'hr'), `n=${xs.length}`).toBeCloseTo((98 - directMean(xs)) / PRIOR.hr.s, 10)
      /* The personal spread is deliberately not used yet, and these samples
         are spread wide enough that the two answers differ. */
      const ownSd = Math.sqrt(directVariance(xs))
      expect(zFor(r, 'hr')).not.toBeCloseTo((98 - directMean(xs)) / ownSd, 3)
    }
  })

  it('switches to the personal spread at the fifth capture', () => {
    const xs = [80, 90, 70, 100, 85]
    const b = feed({ hr: xs })
    const r = scoreCapture({ ppg: ppgOf({ hr: 98, rmssd: undefined, hrvOk: false, quality: 1 }), voice: null, motion: stillMotion, baseline: b })
    expect(zFor(r, 'hr')).toBeCloseTo((98 - directMean(xs)) / Math.sqrt(directVariance(xs)), 10)
  })

  /* The model was never shown an input beyond three standard deviations, so an
     extreme reading has to saturate rather than extrapolate. */
  it('clamps a z-score at plus or minus three', () => {
    const b = settledBaseline()
    expect(zFor(scoreCapture({ ppg: ppgOf({ hr: 500 }), voice: null, motion: stillMotion, baseline: b }), 'hr')).toBe(3)
    expect(zFor(scoreCapture({ ppg: ppgOf({ hr: 1 }), voice: null, motion: stillMotion, baseline: b }), 'hr')).toBe(-3)
  })
})

describe('featuresFrom', () => {
  it('takes only what the capture actually produced', () => {
    expect(featuresFrom({ ppg: null, voice: null })).toEqual({})
    expect(featuresFrom({ ppg: { ok: false, hr: 99 }, voice: null })).toEqual({})
    /* A heart rate with an unusable beat-to-beat series still gives a usable
       rate, which is why hrvOk is separate from ok. */
    expect(featuresFrom({ ppg: { ok: true, hr: 80, rmssd: 20, hrvOk: false } })).toEqual({ hr: 80 })
    expect(featuresFrom({ ppg: { ok: true, hr: 80, rmssd: 20, hrvOk: true } })).toEqual({ hr: 80, hrv: 20 })
  })
})

describe('scoreCapture confidence band', () => {
  it('refuses to invent a score when nothing came through', () => {
    const r = scoreCapture({ ppg: null, voice: null, motion: null })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('no-signal')
    expect(r.score).toBeUndefined()
  })

  /* The three shortfalls the band is built from. Each is asserted on its own,
     against the same reading, so a widening cannot be credited to the wrong
     cause. */
  it('widens when a channel is missing', () => {
    const baseline = settledBaseline()
    const both = scoreCapture({ ppg: ppgOf({ quality: 1 }), voice: voiceOf(), motion: stillMotion, baseline })
    const heartOnly = scoreCapture({ ppg: ppgOf({ quality: 1 }), voice: null, motion: stillMotion, baseline })
    expect(both.missing).toEqual([])
    expect(heartOnly.missing).toEqual(['voice'])
    expect(heartOnly.channels).toEqual(['heart'])
    expect(heartOnly.half).toBeGreaterThan(both.half)
  })

  it('widens when the camera signal is poor', () => {
    const baseline = settledBaseline()
    const clean = scoreCapture({ ppg: ppgOf({ quality: 1 }), voice: voiceOf(), motion: stillMotion, baseline })
    const murky = scoreCapture({ ppg: ppgOf({ quality: 0.1 }), voice: voiceOf(), motion: stillMotion, baseline })
    expect(murky.quality).toBe(0.1)
    expect(murky.half).toBeGreaterThan(clean.half)
    /* Quality changes only the band, never the number. */
    expect(murky.score).toBe(clean.score)
  })

  it('widens when the baseline is too short to define a normal', () => {
    const long = scoreCapture({ ppg: ppgOf({ quality: 1 }), voice: voiceOf(), motion: stillMotion, baseline: settledBaseline() })
    let short = emptyBaseline()
    short = updateBaseline(short, { hr: 76, hrv: 26, f0Mean: 175, f0Cv: 0.22, f0Instab: 0.025, ampInstab: 0.13 }, 'mon')
    const thin = scoreCapture({ ppg: ppgOf({ quality: 1 }), voice: voiceOf(), motion: stillMotion, baseline: short })
    expect(long.baselineDays).toBe(40)
    expect(thin.baselineDays).toBe(1)
    expect(thin.half).toBeGreaterThan(long.half)
  })

  it('keeps the band inside three and thirty-four points, and inside the scale', () => {
    const worst = scoreCapture({ ppg: { ok: true, hr: PRIOR.hr.m }, voice: null, motion: null, baseline: emptyBaseline() })
    expect(worst.half).toBe(34)
    const best = scoreCapture({ ppg: ppgOf({ quality: 1 }), voice: voiceOf(), motion: stillMotion, baseline: settledBaseline() })
    expect(best.half).toBe(3)
    for (const r of [worst, best]) {
      expect(r.low).toBeGreaterThanOrEqual(0)
      expect(r.high).toBeLessThanOrEqual(100)
      expect(r.low).toBeLessThanOrEqual(r.score)
      expect(r.high).toBeGreaterThanOrEqual(r.score)
    }
  })
})

describe('scoreCapture movement hold', () => {
  it('flags a reading taken above the exercise line and says so', () => {
    const baseline = settledBaseline()
    const still = scoreCapture({ ppg: ppgOf(), voice: voiceOf(), motion: { ok: true, peak: 0.02, still: true }, baseline })
    const running = scoreCapture({ ppg: ppgOf(), voice: voiceOf(), motion: { ok: true, peak: 0.9, still: false }, baseline })
    expect(still.held).toBe(false)
    expect(still.holdReason).toBeNull()
    expect(running.held).toBe(true)
    expect(running.holdReason).toContain(String(MOVE_LIMIT_G))
    expect(running.holdReason).toContain('0.90 g')
  })

  it('treats a capture with no accelerometer as a still one', () => {
    const baseline = settledBaseline()
    const noMotion = scoreCapture({ ppg: ppgOf(), voice: voiceOf(), motion: null, baseline })
    const still = scoreCapture({ ppg: ppgOf(), voice: voiceOf(), motion: stillMotion, baseline })
    expect(noMotion.held).toBe(false)
    expect(Math.abs(noMotion.score - still.score)).toBeLessThanOrEqual(1)
  })

  /* Documents current behaviour, which contradicts the product's central
     claim and the hold message's own wording. On the patch route the net
     gates: the same arousal with movement at three sigma scores about
     twenty-six points lower. On this route movement enters the T-NAM as a
     tenth additive curve, and that curve is monotone INCREASING, so a reading
     taken mid-run scores HIGHER than the same reading taken at rest. `held`
     is set and the message says the reading is "kept but not counted as
     stress", but it is counted, and counted upward. See the finding reported
     with this suite. */
  it('currently scores a moving reading higher than the same reading at rest', () => {
    const baseline = settledBaseline()
    const at = peak => scoreCapture({
      ppg: ppgOf(), voice: voiceOf(), baseline,
      motion: { ok: true, peak, still: peak <= MOVE_LIMIT_G },
    }).score
    expect(at(0.9)).toBeGreaterThan(at(0))
    expect(at(MOVE_LIMIT_G)).toBeGreaterThan(at(0))
  })

  /* The motion input is normalised to the exercise line and clamped there, so
     the model cannot tell a brisk walk from a sprint. Everything at or above
     0.35 g is the same input, which is why `held` is the only thing that
     changes past the line. */
  it('saturates the motion input at the exercise line', () => {
    const baseline = settledBaseline()
    const at = peak => scoreCapture({
      ppg: ppgOf(), voice: voiceOf(), baseline,
      motion: { ok: true, peak, still: peak <= MOVE_LIMIT_G },
    })
    /* Past the line every reading takes the formula branch, so the model's
       saturated motion input never reaches a score. Same number at 0.5 g and
       at 99 g, and both are marked held. */
    expect(at(0.5).score).toBe(at(99).score)
    expect(at(0.5).model.scored).toBe(false)
    expect(at(MOVE_LIMIT_G).model.scored).toBe(true)
    expect(at(0.5).held).toBe(true)
    expect(at(MOVE_LIMIT_G).held).toBe(false)
  })
})

describe('scoreCapture channel divisor', () => {
  /* The voice divisor is the full weight total across all six terms, not the
     total of the terms actually present. That is what stops a dropped channel
     re-weighting the channels that remain, so the heart half of the score is
     bit-for-bit the same whether voice arrived or not. */
  it('does not re-weight the heart terms when voice is missing', () => {
    const baseline = settledBaseline()
    const withVoice = scoreCapture({ ppg: ppgOf(), voice: voiceOf(), motion: stillMotion, baseline })
    const without = scoreCapture({ ppg: ppgOf(), voice: null, motion: stillMotion, baseline })
    const heartOf = r => r.contrib.filter(c => c.ch === 'heart').map(c => [c.id, c.raw])
    expect(heartOf(without)).toEqual(heartOf(withVoice))
    expect(without.model.logit).toBe(withVoice.model.logit)
    const voiceWeight = TERMS.filter(t => t.ch === 'voice').reduce((a, t) => a + Math.abs(t.w), 0)
    const allWeight = TERMS.reduce((a, t) => a + Math.abs(t.w), 0)
    expect(voiceWeight).toBeCloseTo(1.8, 10)
    expect(allWeight).toBeCloseTo(4.4, 10)
  })

  /* Documents current behaviour, which contradicts what the fixed divisor is
     meant to guarantee. Because the voice terms are a signed addition rather
     than a share of a divisor that shrinks with them, a voice reading BELOW
     this person's own baseline is pulling the score down, and dropping that
     channel removes the pull. Losing a channel therefore can and does raise
     the score. See the finding reported with this suite. */
  it('currently lets a dropped calm voice channel raise the score', () => {
    const baseline = settledBaseline()
    const calmVoice = voiceOf({ f0Mean: 120, f0Cv: 0.1, f0Instab: 0.01, ampInstab: 0.05 })
    const withVoice = scoreCapture({ ppg: ppgOf(), voice: calmVoice, motion: stillMotion, baseline })
    const without = scoreCapture({ ppg: ppgOf(), voice: null, motion: stillMotion, baseline })
    expect(without.score).toBeGreaterThan(withVoice.score)

    /* With a voice reading above baseline the drop lowers the score, which is
       the direction the comment assumes holds in general. */
    const tenseVoice = voiceOf({ f0Mean: 230, f0Cv: 0.4, f0Instab: 0.05, ampInstab: 0.25 })
    const withTense = scoreCapture({ ppg: ppgOf(), voice: tenseVoice, motion: stillMotion, baseline })
    expect(without.score).toBeLessThan(withTense.score)
  })
})
