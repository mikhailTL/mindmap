import { describe, expect, it } from 'vitest'
import {
  CONTEXT_WINDOWS, FEATURES, ORDINARY_LOGIT, PARAM_COUNT, SCORE_TEMPERATURE,
  calibratedLogit, displayScore, fitCalibration, forward, identityCalibration, shape,
} from '../src/signals/tnam.js'
import { TNAM_RESULTS } from '../src/signals/tnam-results.js'

const zeros = () => new Array(FEATURES.length).fill(0)

describe('the Mind Score model', () => {
  /* The published parameter count appears on two pages of the site. If the
     weights are regenerated and the count moves, those pages are wrong and
     this is the only thing that would say so. */
  it('carries the number of weights the results file reports', () => {
    expect(PARAM_COUNT).toBe(TNAM_RESULTS.params)
    expect(PARAM_COUNT).toBe(4572)
  })

  it('takes the ten signals in a fixed order', () => {
    expect(FEATURES).toEqual([
      'rmssd', 'sdnn', 'pnn50', 'lfhf', 'hr',
      'edaTonic', 'edaPhasic', 'scrPerMin', 'tempSlope', 'motion',
    ])
    expect(CONTEXT_WINDOWS).toBe(8)
  })

  /* The whole claim of an additive model is that the score decomposes exactly
     into the parts that made it. If this ever drifts, every driver list and
     every bar on the overview figure is a decoration rather than an
     explanation. */
  it('decomposes a score exactly into its parts', () => {
    const x = [-1.2, -0.9, -0.4, 0.6, 1.6, 2.0, 1.2, 1.4, -1.0, 0.05]
    const fw = forward(x)
    const sum = FEATURES.reduce((a, k) => a + fw.contributions[k], 0)
    /* Whatever is left over after the curves and the temporal term is the
       bias, and it must be the same constant for every input. */
    const bias = fw.logit - sum - fw.temporal
    const other = forward(zeros())
    const otherSum = FEATURES.reduce((a, k) => a + other.contributions[k], 0)
    expect(bias).toBeCloseTo(other.logit - otherSum - other.temporal, 10)
    const rebuilt = FEATURES.reduce((a, _k, i) => a + shape(i, x[i]), 0)
    expect(rebuilt).toBeCloseTo(sum, 9)
  })

  it('reads an ordinary day as the middle of the scale', () => {
    expect(displayScore(forward(zeros()).logit)).toBe(50)
    expect(displayScore(ORDINARY_LOGIT)).toBe(50)
    expect(SCORE_TEMPERATURE).toBe(2.5)
  })

  /* The drawn curves on the overview come from the pre-sampled grid rather
     than from calling shape() forty times a frame. The two must agree or the
     figure is drawing something the model does not compute. */
  it('agrees with the pre-sampled curves the site draws', () => {
    let worst = 0
    FEATURES.forEach((k, idx) => {
      const g = TNAM_RESULTS.shapes[k]
      g.x.forEach((x, i) => { worst = Math.max(worst, Math.abs(shape(idx, x) - g.y[i])) })
    })
    expect(worst).toBeLessThan(1e-3)
  })

  /* The motion curve rises with movement: to this model, moving and aroused
     are the same thing, because the training set had no condition where
     somebody exercised calmly. This is why scoreCapture hands moving readings
     back to the formula, and it is stated on the site as a known failure. The
     test pins the direction so the claim and the weights cannot diverge. */
  it('scores a moving body higher, which is the confound the app routes around', () => {
    const still = zeros()
    const moving = zeros(); moving[FEATURES.indexOf('motion')] = 1
    expect(forward(moving).logit).toBeGreaterThan(forward(still).logit)
    const g = TNAM_RESULTS.shapes.motion
    expect(g.y[g.y.length - 1]).toBeGreaterThan(g.y[0])
  })

  it('leaves the score untouched until a person has answered something', () => {
    const cal = identityCalibration()
    const fw = forward([0.5, 0, 0, 0, 1.1, 0.8, 0, 0, -0.3, 0])
    expect(calibratedLogit(fw, cal)).toBeCloseTo(fw.logit, 10)
    expect(cal.n ?? 0).toBe(0)
  })

  /* Calibration is fitted from the person's own check-ins and is the result
     the site leans on hardest, so it has to actually move the answer in the
     direction the labels point. */
  it('moves with the answers a person gives', () => {
    const hard = [-1.2, -0.9, -0.4, 0.6, 1.8, 2.0, 1.2, 1.4, -1.1, 0]
    const calm = [1.0, 0.8, 0.4, -0.4, -0.9, -1.4, -0.7, -0.9, 0.7, 0]
    const ex = []
    for (let i = 0; i < 4; i++) {
      ex.push({ ...pick(forward(hard)), label: 1 })
      ex.push({ ...pick(forward(calm)), label: 0 })
    }
    const cal = fitCalibration(ex)
    expect(cal.n).toBe(8)
    const gap = calibratedLogit(forward(hard), cal) - calibratedLogit(forward(calm), cal)
    const before = forward(hard).logit - forward(calm).logit
    expect(gap).toBeGreaterThan(0)
    expect(gap).toBeGreaterThanOrEqual(before * 0.5)
  })
})

const pick = fw => ({
  contributions: FEATURES.map(k => fw.contributions[k]),
  temporal: fw.temporal,
})
