import { describe, it, expect } from 'vitest'
import { excursions, settleTimes, dailySettle, runUp, carryOver, settleWords, demoDay } from '../src/signals/recovery.js'

/* A per-minute arousal index, 0 to 100. The usual band is lo..hi. An
   excursion is a run above hi; its recovery time is the minutes from the peak
   until the index first comes back to halfway between the peak and hi. */

const flat = (n, v) => Array.from({ length: n }, () => v)

/* 20 minutes flat at 45, a peak to 75 at minute 20, then a straight line
   back down over 20 minutes to 45. Band 36..55. Half way between 75 and 55
   is 65, reached 20 * (75 - 65) / (75 - 45) = 6.67 minutes after the peak,
   so the first minute at or below 65 is minute 27 (7 minutes after). */
const ramp = [...flat(20, 45), ...Array.from({ length: 21 }, (_, i) => 75 - i * 1.5), ...flat(10, 45)]
const BAND = { lo: 36, hi: 55 }

describe('excursions', () => {
  it('finds one run above the band with its peak minute', () => {
    const ex = excursions(ramp, BAND)
    expect(ex).toHaveLength(1)
    expect(ex[0].start).toBe(20)
    expect(ex[0].peakAt).toBe(20)
    expect(ex[0].peak).toBe(75)
  })
  it('ignores a series that never leaves the band', () => {
    expect(excursions(flat(60, 50), BAND)).toEqual([])
  })
  it('treats a single-minute blip above the band as an excursion only when minimum length allows', () => {
    const s = [...flat(10, 45), 60, ...flat(10, 45)]
    expect(excursions(s, BAND, { minLength: 2 })).toEqual([])
    expect(excursions(s, BAND, { minLength: 1 })).toHaveLength(1)
  })
})

describe('settleTimes', () => {
  it('measures minutes from the peak to half way back to the band', () => {
    const t = settleTimes(ramp, BAND)
    expect(t).toHaveLength(1)
    expect(t[0].minutes).toBe(7)
    expect(t[0].settled).toBe(true)
  })
  it('reports an excursion that never settles as unsettled, capped', () => {
    const s = [...flat(10, 45), ...flat(100, 80)]
    const t = settleTimes(s, BAND, { cap: 90 })
    expect(t[0].settled).toBe(false)
    expect(t[0].minutes).toBe(90)
  })
  it('recovery time is zero when the peak itself is the last high minute and the next minute is back', () => {
    const s = [...flat(10, 45), 70, 45, ...flat(10, 45)]
    const t = settleTimes(s, BAND, { minLength: 1 })
    expect(t[0].minutes).toBe(1)
  })
})

describe('dailySettle', () => {
  it('gives the median recovery time and the count of events', () => {
    const two = [...ramp, ...ramp]
    const d = dailySettle(two, BAND)
    expect(d.events).toBe(2)
    expect(d.median).toBe(7)
    expect(d.unsettled).toBe(0)
  })
  it('is null-safe on a flat day', () => {
    const d = dailySettle(flat(60, 50), BAND)
    expect(d.events).toBe(0)
    expect(d.median).toBeNull()
  })
})

describe('runUp', () => {
  it('is the rise in the two hours before an event against the usual for those minutes', () => {
    /* A 24h per-minute day at 45, an event at minute 600 (10:00), and the
       two hours before it at 55. Usual for every minute is 45. */
    const day = flat(1440, 45)
    for (let m = 480; m < 600; m++) day[m] = 55
    const usual = flat(1440, 45)
    const r = runUp(day, 600, usual)
    expect(r.points).toBeCloseTo(10, 5)
    expect(r.from).toBe(480)
    expect(r.to).toBe(600)
  })
  it('finds when the climb started: the last minute before the event that was within 2 points of usual', () => {
    const day = flat(1440, 45)
    for (let m = 540; m < 600; m++) day[m] = 55
    const r = runUp(day, 600, flat(1440, 45))
    expect(r.climbFrom).toBe(540)
    expect(r.points).toBeCloseTo(5, 5)
  })
  it('clamps the window at the start of the day', () => {
    const r = runUp(flat(1440, 45), 30, flat(1440, 45))
    expect(r.from).toBe(0)
    expect(r.points).toBe(0)
  })
})

describe('carryOver', () => {
  it('counts peaks that ran into the next peak before settling', () => {
    /* Two excursions: the first never gets half way down before the second
       starts, the second settles. */
    const s = [...flat(10, 45), ...flat(10, 80), ...flat(5, 70), ...flat(10, 85),
               ...Array.from({ length: 30 }, (_, i) => 85 - i * 2).map(v => Math.max(v, 45)), ...flat(10, 45)]
    /* The dip to 70 between the two peaks has a prominence of 10 and 15, so
       it splits the run into two events. The first event's settle target
       is (80 + 55) / 2 = 67.5, never reached before the second peak starts,
       so it carried. */
    const c = carryOver(s, BAND)
    expect(c.events).toBe(2)
    expect(c.carried).toBe(1)
    expect(c.share).toBeCloseTo(0.5, 5)
    /* With a drop inside the band between them, the first settles. */
    const s2 = [...flat(10, 45), ...flat(10, 80), ...flat(3, 50), ...flat(10, 85),
                ...Array.from({ length: 30 }, (_, i) => 85 - i * 2).map(v => Math.max(v, 45)), ...flat(10, 45)]
    const c2 = carryOver(s2, BAND)
    expect(c2.events).toBe(2)
    expect(c2.carried).toBe(0)
  })
  it('splits a run only at a trough with enough prominence', () => {
    const s = [...flat(10, 45), ...flat(10, 80), ...flat(5, 77), ...flat(10, 82), ...flat(40, 45)]
    expect(excursions(s, BAND)).toHaveLength(1)
  })
})

describe('the spec numbers are pinned', () => {
  it('an event that takes longer than the default 90-minute cap did not settle', () => {
    const s = [...flat(10, 45), ...Array.from({ length: 200 }, (_, i) => 85 - i * 0.1), ...flat(10, 45)]
    const t = settleTimes(s, BAND)
    expect(t[0].minutes).toBe(90)
    expect(t[0].settled).toBe(false)
  })
  it('a peak that runs into the end of the day counts as carried over', () => {
    const s = [...flat(10, 45), ...flat(30, 80)]
    const c = carryOver(s, BAND)
    expect(c.events).toBe(1)
    expect(c.carried).toBe(1)
  })
  it('splits at a dip of 8 points, not 7', () => {
    const mk = dip => [...flat(10, 45), ...flat(10, 80), ...flat(5, 80 - dip), ...flat(10, 82), ...flat(40, 45)]
    expect(excursions(mk(7), BAND)).toHaveLength(1)
    expect(excursions(mk(8), BAND)).toHaveLength(2)
  })
})

describe('settleWords', () => {
  it('says longer, shorter or about the same against the usual', () => {
    expect(settleWords(18, 11).key).toBe('longer')
    expect(settleWords(8, 11).key).toBe('shorter')
    expect(settleWords(11, 11).key).toBe('usual')
    expect(settleWords(null, 11).key).toBe('none')
  })
  it('never claims a feeling', () => {
    for (const [a, b] of [[18, 11], [8, 11], [11, 11], [null, 11]]) {
      const w = settleWords(a, b).line.toLowerCase()
      for (const bad of ['anxious', 'anxiety', 'depress', 'sad', 'panic', 'stressed out'])
        expect(w).not.toContain(bad)
    }
  })
})

describe('demoDay', () => {
  it('is deterministic and has the two marked events', () => {
    const a = demoDay(), b = demoDay()
    expect(a.index).toEqual(b.index)
    expect(a.index).toHaveLength(1440)
    expect(a.events.map(e => e.label)).toEqual(['Maths test', 'Presentation'])
    const d = dailySettle(a.index.slice(a.span[0], a.span[1]), a.band)
    expect(d.events).toBeGreaterThanOrEqual(2)
    expect(d.median).toBeGreaterThan(0)
  })
})
