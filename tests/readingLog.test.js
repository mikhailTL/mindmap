import { describe, it, expect, beforeEach } from 'vitest'
import {
  KEY, CAP, USUAL, addReading, listReadings, updateReading, clearReadings, stats,
  bandOf, groupByDay, demoReadings, trend, RANGES, windowFor,
} from '../src/lib/readingLog.js'
import { band as engineBand } from '../src/lib/engine.js'

function fakeStorage() {
  const m = new Map()
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: k => { m.delete(k) },
  }
}

const T0 = new Date(2026, 9, 10, 8, 0).getTime()
const H = 3600e3

beforeEach(() => { globalThis.localStorage = fakeStorage() })

describe('addReading and listReadings', () => {
  it('stores an entry under its own key and returns it with an id', () => {
    const e = addReading({ at: T0, score: 51, source: 'camera', pulse: 66 })
    expect(e.id).toBeTruthy()
    expect(e).toMatchObject({ at: T0, score: 51, source: 'camera', pulse: 66 })
    const raw = JSON.parse(localStorage.getItem(KEY))
    expect(raw).toHaveLength(1)
    expect(listReadings()).toHaveLength(1)
  })

  it('rounds and clamps the score to 0..100 and rejects junk', () => {
    expect(addReading({ at: T0, score: 140.4, source: 'survey' }).score).toBe(100)
    expect(addReading({ at: T0, score: -3, source: 'survey' }).score).toBe(0)
    expect(addReading({ at: T0, score: 'x', source: 'survey' })).toBeNull()
    expect(addReading({ at: T0, score: 40, source: 'dream' })).toBeNull()
    expect(listReadings()).toHaveLength(2)
  })

  it('lists oldest first and filters by from and to inclusive', () => {
    addReading({ at: T0 + 2 * H, score: 30, source: 'survey' })
    addReading({ at: T0, score: 50, source: 'camera' })
    addReading({ at: T0 + 5 * H, score: 70, source: 'patch' })
    expect(listReadings().map(r => r.score)).toEqual([50, 30, 70])
    expect(listReadings({ from: T0 + H }).map(r => r.score)).toEqual([30, 70])
    expect(listReadings({ to: T0 + 2 * H }).map(r => r.score)).toEqual([50, 30])
  })

  it('keeps only the newest CAP entries', () => {
    for (let i = 0; i < CAP + 20; i++) addReading({ at: T0 + i * 60e3, score: i % 100, source: 'survey' })
    const all = listReadings()
    expect(all).toHaveLength(CAP)
    expect(all[0].at).toBe(T0 + 20 * 60e3)
  })

  it('survives broken or missing storage', () => {
    localStorage.setItem(KEY, '{not json')
    expect(listReadings()).toEqual([])
    globalThis.localStorage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
    expect(listReadings()).toEqual([])
    expect(addReading({ at: T0, score: 40, source: 'survey' })).toMatchObject({ score: 40 })
    delete globalThis.localStorage
    expect(listReadings()).toEqual([])
  })

  it('updates a note or a score in place, and clears', () => {
    const e = addReading({ at: T0, score: 44, source: 'survey' })
    updateReading(e.id, { note: '  after practice  ' })
    expect(listReadings()[0].note).toBe('after practice')
    updateReading(e.id, { score: 61 })
    expect(listReadings()[0].score).toBe(61)
    clearReadings()
    expect(listReadings()).toEqual([])
  })
})

describe('bands and stats', () => {
  it('uses the same band edges as the survey and the phone score', () => {
    for (let n = 0; n <= 100; n++) expect(bandOf(n)).toBe(engineBand(n).key)
    expect(USUAL).toEqual({ lo: 35, hi: 57 })
  })

  it('summarises a list', () => {
    const list = [
      { at: 1, score: 20, source: 'camera' },
      { at: 2, score: 40, source: 'survey' },
      { at: 3, score: 50, source: 'survey' },
      { at: 4, score: 80, source: 'patch' },
    ]
    const s = stats(list)
    expect(s.n).toBe(4)
    expect(s.mean).toBe(48)
    expect(s.min).toBe(20)
    expect(s.max).toBe(80)
    expect(s.timeInUsual).toBe(50)
    expect(s.bySource).toEqual({ camera: 1, survey: 2, patch: 1, mirror: 0 })
    expect(s.byBand).toEqual({ low: 25, usual: 50, up: 0, high: 25 })
  })

  it('returns nulls, not zeros, for an empty list', () => {
    const s = stats([])
    expect(s).toMatchObject({ n: 0, mean: null, min: null, max: null, timeInUsual: null })
    expect(s.bySource).toEqual({ camera: 0, survey: 0, patch: 0, mirror: 0 })
  })

  it('band percentages always add to 100', () => {
    const list = [30, 40, 60, 80, 45, 46, 47].map((score, i) => ({ at: i, score, source: 'survey' }))
    const b = stats(list).byBand
    expect(b.low + b.usual + b.up + b.high).toBe(100)
  })

  it('trend compares the latest with the reading before it', () => {
    expect(trend([{ at: 1, score: 40 }, { at: 2, score: 52 }])).toMatchObject({ dir: 'up', delta: 12 })
    expect(trend([{ at: 1, score: 52 }, { at: 2, score: 40 }])).toMatchObject({ dir: 'down', delta: -12 })
    expect(trend([{ at: 1, score: 50 }, { at: 2, score: 52 }])).toMatchObject({ dir: 'flat' })
    expect(trend([{ at: 1, score: 50 }])).toBeNull()
  })
})

describe('days and ranges', () => {
  it('groups by local day, newest day first, newest entry first', () => {
    const list = [
      { at: T0, score: 40, source: 'survey' },
      { at: T0 + 4 * H, score: 50, source: 'camera' },
      { at: T0 + 24 * H, score: 60, source: 'patch' },
    ]
    const g = groupByDay(list)
    expect(g).toHaveLength(2)
    expect(g[0].items.map(r => r.score)).toEqual([60])
    expect(g[1].items.map(r => r.score)).toEqual([50, 40])
    expect(g[1].mean).toBe(45)
  })

  it('windows end at now', () => {
    const now = T0
    expect(RANGES.map(r => r.id)).toEqual(['day', 'week', 'fortnight', 'month'])
    expect(windowFor('day', now)).toEqual({ from: now - 24 * H, to: now })
    expect(windowFor('month', now).from).toBe(now - 30 * 24 * H)
  })
})

describe('demoReadings', () => {
  const end = new Date(2026, 9, 16, 13, 40).getTime()

  it('is deterministic and covers fourteen days', () => {
    const a = demoReadings({ end, last: { score: 51, clock: '13:10' } })
    const b = demoReadings({ end, last: { score: 51, clock: '13:10' } })
    expect(a).toEqual(b)
    const days = new Set(a.map(r => new Date(r.at).toDateString()))
    expect(days.size).toBe(14)
    expect(a.every(r => r.demo === true)).toBe(true)
    expect(a.every(r => r.at <= end)).toBe(true)
  })

  it('ends on the figure the rest of the demo shows', () => {
    const a = demoReadings({ end, last: { score: 51, clock: '13:10' } })
    const last = a[a.length - 1]
    expect(last.score).toBe(51)
    expect(new Date(last.at).getHours()).toBe(13)
    expect(new Date(last.at).getMinutes()).toBe(10)
  })

  it('is believable: every source, mostly usual, a few outside', () => {
    const a = demoReadings({ end, last: { score: 51, clock: '13:10' } })
    const s = stats(a)
    expect(s.bySource.camera).toBeGreaterThan(0)
    expect(s.bySource.survey).toBeGreaterThan(0)
    expect(s.bySource.patch).toBeGreaterThan(0)
    expect(s.timeInUsual).toBeGreaterThanOrEqual(55)
    expect(s.timeInUsual).toBeLessThanOrEqual(85)
    expect(s.min).toBeLessThan(35)
    expect(s.max).toBeGreaterThan(57)
    expect(localStorage.getItem(KEY)).toBeNull()
  })
})
