import { describe, it, expect, beforeEach } from 'vitest'
import {
  KEY, LOG_MAX, loadBaseline, saveBaseline, loadLog, appendLog, clearBaseline,
  seededBaseline, initialBaseline, CALM_SESSIONS,
} from '../src/traffic/baseline.js'
import { READY_AFTER, strainIndex, lightFor, Light } from '../src/signals/light.js'

function fakeStorage() {
  const m = new Map()
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: k => { m.delete(k) },
    get size() { return m.size },
  }
}

beforeEach(() => { globalThis.localStorage = fakeStorage() })

describe('seededBaseline', () => {
  it('is ten calm sessions, ready to measure against', () => {
    const b = seededBaseline()
    expect(b.n).toBe(CALM_SESSIONS.length)
    expect(b.n).toBeGreaterThanOrEqual(READY_AFTER)
    expect(b.mean.medianGap).toBeGreaterThan(160)
    expect(b.mean.medianGap).toBeLessThan(200)
  })
  it('reads a calm session as green and a hot one as red', () => {
    const b = seededBaseline()
    const calm = strainIndex(CALM_SESSIONS[0], b)
    expect(calm.ready).toBe(true)
    expect(lightFor(calm.index)).toBe(Light.GREEN)
    const hot = strainIndex({ pxPerSec: 1800, reversals: 0.5, medianGap: 90, deletions: 0.35, minutes: 25, motion: 0.3 }, b)
    expect(lightFor(hot.index)).toBe(Light.RED)
  })
})

describe('load and save', () => {
  it('round-trips a baseline under one key', () => {
    expect(loadBaseline()).toBeNull()
    const b = seededBaseline()
    expect(saveBaseline(b)).toBe(true)
    expect(loadBaseline()).toEqual(b)
    expect(JSON.parse(localStorage.getItem(KEY)).baseline.n).toBe(b.n)
  })
  it('refuses a stored baseline that is missing a feature', () => {
    localStorage.setItem(KEY, JSON.stringify({ baseline: { n: 3, mean: {}, m2: {}, count: {} } }))
    expect(loadBaseline()).toBeNull()
  })
  it('survives corrupt storage', () => {
    localStorage.setItem(KEY, '{not json')
    expect(loadBaseline()).toBeNull()
    expect(loadLog()).toEqual([])
  })
  it('initialBaseline seeds and saves when nothing is stored', () => {
    const b = initialBaseline()
    expect(b.n).toBe(CALM_SESSIONS.length)
    expect(loadBaseline()).toEqual(b)
  })
})

describe('the session log', () => {
  it('appends, keeps the baseline, and caps at LOG_MAX', () => {
    saveBaseline(seededBaseline())
    for (let i = 0; i < LOG_MAX + 5; i++) appendLog({ at: i, minutes: 1, index: 10, light: 'green' })
    const log = loadLog()
    expect(log.length).toBe(LOG_MAX)
    expect(log[0].at).toBe(5)
    expect(loadBaseline().n).toBe(CALM_SESSIONS.length)
  })
})

describe('clearBaseline', () => {
  it('removes the key', () => {
    saveBaseline(seededBaseline())
    appendLog({ at: 1 })
    expect(clearBaseline()).toBe(true)
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(loadBaseline()).toBeNull()
    expect(loadLog()).toEqual([])
  })
  it('degrades without storage', () => {
    delete globalThis.localStorage
    expect(clearBaseline()).toBe(false)
    expect(saveBaseline(seededBaseline())).toBe(false)
    expect(loadBaseline()).toBeNull()
    expect(initialBaseline().n).toBe(CALM_SESSIONS.length)
  })
})
