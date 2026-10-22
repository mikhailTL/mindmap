import { describe, it, expect } from 'vitest'
import { breathsFromEnvelope, exhales, breathsFromMotion } from '../src/signals/breath.js'
import { pvtStats, LAPSE_MS } from '../src/signals/pvt.js'
import { typingRhythm, fastBurst } from '../src/signals/typing.js'
import { haversineKm, homePoint, weeklyReach } from '../src/signals/reach.js'

function envelope() {
  const hz = 20
  const out = []
  const push = (secs, level) => { for (let i = 0; i < secs * hz; i++) out.push(level) }
  push(3, 0.01); push(4, 0.2); push(3, 0.01); push(6, 0.25); push(3, 0.01)
  return { samples: out, hz }
}

describe('exhales from a level envelope', () => {
  it('finds each run of sound above the floor and its length in seconds', () => {
    const { samples, hz } = envelope()
    const ex = exhales(samples, hz, { floor: 0.05, minSeconds: 1 })
    expect(ex).toHaveLength(2)
    expect(ex[0].seconds).toBeCloseTo(4, 1)
    expect(ex[1].seconds).toBeCloseTo(6, 1)
    expect(ex[1].start).toBeCloseTo(10, 1)
  })
  it('ignores a click shorter than the minimum', () => {
    const hz = 20
    const s = [...Array(60).fill(0.01), 0.5, 0.5, ...Array(60).fill(0.01)]
    expect(exhales(s, hz, { floor: 0.05, minSeconds: 1 })).toEqual([])
  })
  it('gives breaths per minute from the exhale count over the window', () => {
    const { samples, hz } = envelope()
    const r = breathsFromEnvelope(samples, hz, { floor: 0.05, minSeconds: 1 })
    /* two exhales in 19 seconds */
    expect(r.breaths).toBe(2)
    expect(r.perMinute).toBeCloseTo(2 * 60 / 19, 1)
    expect(r.meanExhale).toBeCloseTo(5, 1)
  })
})

describe('breaths from chest motion', () => {
  it('counts the cycles of a slow sine on the chest axis', () => {
    /* 60 s at 50 Hz, 6 breaths per minute, with a little noise */
    const hz = 50, secs = 60, bpm = 6
    const s = Array.from({ length: hz * secs }, (_, i) =>
      Math.sin(2 * Math.PI * bpm / 60 * i / hz) * 0.02 + Math.sin(i * 7.1) * 0.002)
    const r = breathsFromMotion(s, hz)
    expect(r.perMinute).toBeGreaterThan(5.4)
    expect(r.perMinute).toBeLessThan(6.6)
  })
  it('refuses a series too short to count', () => {
    expect(breathsFromMotion([0, 0, 0], 50).perMinute).toBeNull()
  })
})

describe('pvtStats', () => {
  it('reports mean, median, slowest tenth, lapses and false starts', () => {
    const trials = [
      { rt: 250 }, { rt: 260 }, { rt: 240 }, { rt: 300 }, { rt: 420 },
      { rt: 230 }, { rt: 270 }, { rt: 500 }, { rt: 255 }, { rt: 265 },
      { rt: -1, falseStart: true },
    ]
    const s = pvtStats(trials)
    expect(s.n).toBe(10)
    expect(s.falseStarts).toBe(1)
    expect(s.lapses).toBe(2)
    expect(LAPSE_MS).toBe(355)
    expect(s.mean).toBeCloseTo(299, 0)
    expect(s.median).toBe(262.5)
    expect(s.slowest10).toBe(500)
  })
  it('is honest with too few trials', () => {
    expect(pvtStats([{ rt: 300 }]).ok).toBe(false)
    expect(pvtStats([]).mean).toBeNull()
  })
})

describe('typingRhythm', () => {
  const keys = (gaps, dels = 0) => {
    let t = 1000
    const out = [{ t, del: false }]
    gaps.forEach((g, i) => { t += g; out.push({ t, del: i < dels }) })
    return out
  }
  it('measures the median gap between keys, the pause count and the deletion share', () => {
    const r = typingRhythm(keys([120, 130, 125, 2500, 110, 118, 3000, 122], 2))
    expect(r.keys).toBe(9)
    expect(r.medianGap).toBe(121)
    expect(r.pauses).toBe(2)
    expect(r.deletions).toBeCloseTo(2 / 9, 5)
  })
  it('needs a handful of keys before it says anything', () => {
    expect(typingRhythm(keys([100, 100])).ok).toBe(false)
  })
  it('flags a fast burst against the usual gap', () => {
    expect(fastBurst(80, 125)).toBe(true)
    expect(fastBurst(120, 125)).toBe(false)
    expect(fastBurst(80, null)).toBe(false)
  })
})

describe('reach', () => {
  it('haversine between two Sarasota points is about 10 km', () => {
    const d = haversineKm({ lat: 27.3364, lon: -82.5307 }, { lat: 27.3364 + 0.09, lon: -82.5307 })
    expect(d).toBeGreaterThan(9.5)
    expect(d).toBeLessThan(10.5)
  })
  it('home is the densest point: the one with most other points within 300 m', () => {
    const pts = [
      { lat: 27.3364, lon: -82.5307 }, { lat: 27.3365, lon: -82.5306 }, { lat: 27.3363, lon: -82.5308 },
      { lat: 27.40, lon: -82.50 },
    ]
    const h = homePoint(pts)
    expect(h.lat).toBeCloseTo(27.3364, 3)
  })
  it('a week’s reach is the farthest reading from home that week, and the share of readings away', () => {
    const home = { lat: 27.3364, lon: -82.5307 }
    const day = n => Date.UTC(2026, 9, 12 + n)
    const pts = [
      { ...home, t: day(0) }, { ...home, t: day(1) },
      { lat: 27.3364 + 0.045, lon: -82.5307, t: day(2) },
      { lat: 27.3364, lon: -82.5307 - 0.02, t: day(3) },
    ]
    const r = weeklyReach(pts, home, Date.UTC(2026, 9, 12), Date.UTC(2026, 9, 19))
    expect(r.readings).toBe(4)
    expect(r.farthestKm).toBeGreaterThan(4.8)
    expect(r.farthestKm).toBeLessThan(5.2)
    expect(r.awayShare).toBeCloseTo(0.5, 5)
  })
  it('says nothing without a home point', () => {
    expect(weeklyReach([], null, 0, 1).farthestKm).toBeNull()
  })
})
