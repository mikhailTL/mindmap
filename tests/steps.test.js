import { describe, it, expect } from 'vitest'
import { countSteps, walkWords } from '../src/signals/steps.js'

function walk(stepHz, secs, hz, { spike = 0.25, swing = 0.3, noise = 0.02 } = {}) {
  const out = []
  let seed = 7
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 - 0.5 }
  for (let i = 0; i < secs * hz; i++) {
    const t = i / hz
    const phase = (t * stepHz) % 1
    const strike = Math.exp(-((phase - 0.25) ** 2) / 0.02) * spike
    const sway = Math.sin(2 * Math.PI * stepHz * t) * swing
    const drift = Math.sin(2 * Math.PI * 0.1 * t) * 0.1
    out.push(strike + sway + drift + rnd() * noise)
  }
  return out
}

describe('countSteps', () => {
  it('counts a 2 Hz walk for 60 s at 50 Hz as about 120 steps', () => {
    const r = countSteps(walk(2, 60, 50), 50)
    expect(r.steps).toBeGreaterThanOrEqual(110)
    expect(r.steps).toBeLessThanOrEqual(130)
    expect(r.perMinute).toBeGreaterThanOrEqual(110)
    expect(r.perMinute).toBeLessThanOrEqual(130)
    expect(r.seconds).toBe(60)
  })
  it('counts nothing on a flat series', () => {
    const r = countSteps(new Array(3000).fill(0), 50)
    expect(r.steps).toBe(0)
    expect(r.perMinute).toBe(0)
  })
  it('counts nothing on a still phone with sensor noise', () => {
    const r = countSteps(walk(2, 60, 50, { spike: 0, swing: 0, noise: 0.03 }), 50)
    expect(r.steps).toBe(0)
  })
  it('counts a 1 Hz shuffle for 60 s as about 60 steps', () => {
    const r = countSteps(walk(1, 60, 50, { spike: 0.15, swing: 0.2 }), 50)
    expect(r.steps).toBeGreaterThanOrEqual(54)
    expect(r.steps).toBeLessThanOrEqual(66)
  })
  it('holds at the measured rate when the sample rate changes', () => {
    const r = countSteps(walk(2, 30, 100), 100)
    expect(r.steps).toBeGreaterThanOrEqual(55)
    expect(r.steps).toBeLessThanOrEqual(65)
    expect(r.seconds).toBe(30)
  })
  it('is safe on an empty series or a bad rate', () => {
    expect(countSteps([], 50)).toEqual({ steps: 0, perMinute: null, seconds: 0 })
    expect(countSteps([0.1, 0.2], 0)).toEqual({ steps: 0, perMinute: null, seconds: 0 })
    expect(countSteps(null, 50).steps).toBe(0)
  })
})

describe('walkWords', () => {
  it('says the count and the rate, and nothing about how it felt', () => {
    expect(walkWords(312, 118.4)).toBe('312 steps at 118 a minute.')
    expect(walkWords(0, 0)).toBe('No steps counted.')
    expect(walkWords(1, null)).toBe('1 step.')
  })
  it('keeps to one sentence of at most ten words', () => {
    const line = walkWords(312, 118.4)
    expect(line.split(/[.!?]\s/).length).toBe(1)
    expect(line.split(/\s+/).length).toBeLessThanOrEqual(10)
  })
})
