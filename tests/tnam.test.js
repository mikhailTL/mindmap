import { describe, expect, it } from 'vitest'
import {
  CONTEXT_WINDOWS, FEATURES, ORDINARY_LOGIT, PARAM_COUNT, SCORE_TEMPERATURE,
  calibratedLogit, displayScore, fitCalibration, forward, identityCalibration, shape,
} from '../src/signals/tnam.js'
import { TNAM_RESULTS } from '../src/signals/tnam-results.js'

const zeros = () => new Array(FEATURES.length).fill(0)

describe('the Mind Score model', () => {
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

  it('decomposes a score exactly into its parts', () => {
    const x = [-1.2, -0.9, -0.4, 0.6, 1.6, 2.0, 1.2, 1.4, -1.0, 0.05]
    const fw = forward(x)
    const sum = FEATURES.reduce((a, k) => a + fw.contributions[k], 0)
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

  it('agrees with the pre-sampled curves the site draws', () => {
    let worst = 0
    FEATURES.forEach((k, idx) => {
      const g = TNAM_RESULTS.shapes[k]
      g.x.forEach((x, i) => { worst = Math.max(worst, Math.abs(shape(idx, x) - g.y[i])) })
    })
    expect(worst).toBeLessThan(1e-3)
  })

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
