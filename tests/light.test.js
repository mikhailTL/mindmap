import { describe, it, expect } from 'vitest'
import {
  scrollFeatures, typingFeatures, sessionFeatures, emptyBaseline, updateBaseline,
  strainIndex, lightFor, Light, decideLight, nudgeFor, parentSummary,
  SIGNAL, signalsFrom, LIGHT_FACE,
} from '../src/signals/light.js'

const scrollRun = (n, dtMs, dy) => Array.from({ length: n }, (_, i) => ({ t: i * dtMs, y: i * dy }))

describe('scrollFeatures', () => {
  it('measures speed in px per second and the share of direction reversals', () => {
    const f = scrollFeatures(scrollRun(21, 100, 50))
    expect(f.pxPerSec).toBeCloseTo(500, 0)
    expect(f.reversals).toBe(0)
    expect(f.samples).toBe(21)
  })
  it('counts reversals when the direction flips', () => {
    const s = [{ t: 0, y: 0 }, { t: 100, y: 100 }, { t: 200, y: 50 }, { t: 300, y: 120 }, { t: 400, y: 60 }]
    const f = scrollFeatures(s)
    expect(f.reversals).toBeCloseTo(3 / 4, 5)
  })
  it('is null-safe below two samples', () => {
    expect(scrollFeatures([]).pxPerSec).toBeNull()
  })
})

describe('typingFeatures', () => {
  it('gives median gap, deletion share and burst count', () => {
    let t = 0
    const keys = []
    for (let i = 0; i < 30; i++) { t += i % 10 === 9 ? 2500 : 110; keys.push({ t, del: i % 6 === 0 }) }
    const f = typingFeatures(keys)
    expect(f.medianGap).toBe(110)
    expect(f.deletions).toBeCloseTo(5 / 30, 5)
    expect(f.keys).toBe(30)
  })
})

describe('sessionFeatures', () => {
  it('combines the streams into one feature vector with the session length in minutes', () => {
    const f = sessionFeatures({
      scroll: scrollRun(61, 100, 40), keys: [], startedAt: 0, endedAt: 12 * 60000, motionRms: 0.05,
    })
    expect(f.minutes).toBe(12)
    expect(f.pxPerSec).toBeCloseTo(400, 0)
    expect(f.medianGap).toBeNull()
    expect(f.motion).toBe(0.05)
  })
})

describe('baseline', () => {
  it('starts empty and learns the usual from sessions', () => {
    let b = emptyBaseline()
    expect(b.n).toBe(0)
    for (let i = 0; i < 7; i++) b = updateBaseline(b, { pxPerSec: 300, reversals: 0.1, medianGap: 140, deletions: 0.1, minutes: 10, motion: 0.03 })
    expect(b.n).toBe(7)
    expect(b.mean.pxPerSec).toBeCloseTo(300, 0)
  })
  it('never updates from a null feature', () => {
    let b = emptyBaseline()
    b = updateBaseline(b, { pxPerSec: 300, reversals: 0.1, medianGap: null, deletions: null, minutes: 10, motion: 0.03 })
    expect(b.mean.medianGap).toBeNull()
    expect(b.mean.pxPerSec).toBe(300)
  })
})

const calm = { pxPerSec: 300, reversals: 0.1, medianGap: 140, deletions: 0.1, minutes: 10, motion: 0.03 }
const learned = () => { let b = emptyBaseline(); for (let i = 0; i < 10; i++) b = updateBaseline(b, calm); return b }

describe('strainIndex', () => {
  it('is near zero on a usual session', () => {
    const s = strainIndex(calm, learned())
    expect(s.index).toBeLessThan(25)
    expect(s.ready).toBe(true)
  })
  it('rises with faster scrolling, more reversals, faster typing with more deletions, longer sessions', () => {
    const hot = { pxPerSec: 1400, reversals: 0.5, medianGap: 80, deletions: 0.35, minutes: 48, motion: 0.03 }
    const s = strainIndex(hot, learned())
    expect(s.index).toBeGreaterThan(70)
    expect(s.top).toBeDefined()
  })
  it('is not ready before seven sessions and says so', () => {
    let b = emptyBaseline()
    for (let i = 0; i < 3; i++) b = updateBaseline(b, calm)
    expect(strainIndex(calm, b).ready).toBe(false)
  })
  it('never claims a feeling in its words', () => {
    const hot = { pxPerSec: 1400, reversals: 0.5, medianGap: 80, deletions: 0.35, minutes: 48, motion: 0.03 }
    const w = strainIndex(hot, learned()).words.toLowerCase()
    for (const bad of ['anxious', 'anxiety', 'depress', 'sad', 'panic', 'upset']) expect(w).not.toContain(bad)
  })
})

describe('lightFor and decideLight', () => {
  it('maps the index to green, yellow, red', () => {
    expect(lightFor(10)).toBe(Light.GREEN)
    expect(lightFor(55)).toBe(Light.YELLOW)
    expect(lightFor(80)).toBe(Light.RED)
  })
  it('needs the index to stay high for a while before turning red, and holds red for a while after', () => {
    let s = { light: Light.GREEN, since: 0 }
    s = decideLight(s, 80, 0)
    expect(s.light).toBe(Light.YELLOW)
    s = decideLight(s, 80, 20000)
    expect(s.light).toBe(Light.YELLOW)
    s = decideLight(s, 80, 61000)
    expect(s.light).toBe(Light.RED)
    s = decideLight(s, 10, 70000)
    expect(s.light).toBe(Light.RED)
    s = decideLight(s, 10, 70000 + 5 * 60000 + 1)
    expect(s.light).toBe(Light.GREEN)
  })
})

describe('nudgeFor', () => {
  it('offers a break once on red and not again inside the cooldown', () => {
    const a = nudgeFor({ light: Light.RED, lastNudgeAt: null, now: 1000 })
    expect(a.show).toBe(true)
    expect(a.text).toBe('It may be time for a break. You seem stressed.')
    const b = nudgeFor({ light: Light.RED, lastNudgeAt: 1000, now: 1000 + 10 * 60000 })
    expect(b.show).toBe(false)
    const c = nudgeFor({ light: Light.RED, lastNudgeAt: 1000, now: 1000 + 31 * 60000 })
    expect(c.show).toBe(true)
  })
  it('never nudges on green or yellow', () => {
    expect(nudgeFor({ light: Light.YELLOW, lastNudgeAt: null, now: 1 }).show).toBe(false)
  })
})

describe('SIGNAL labels', () => {
  it('names every engine feature with the parent-facing label', () => {
    expect(SIGNAL).toEqual({
      pxPerSec: 'Nervous scrolling', reversals: 'Scrolling back and forth', medianGap: 'Frantic typing',
      deletions: 'Constant backspacing', minutes: "Can't put it down", motion: 'Restless hand',
    })
    expect(Object.isFrozen(SIGNAL)).toBe(true)
  })
})

describe('signalsFrom', () => {
  it('keeps parts above z 0.75, strongest z times weight first', () => {
    const parts = [
      { f: 'pxPerSec', z: 1.0, w: 1.0 },
      { f: 'reversals', z: 2.0, w: 0.9 },
      { f: 'medianGap', z: 0.75, w: 0.8 },
      { f: 'deletions', z: 1.5, w: 0.8 },
      { f: 'minutes', z: 0.76, w: 1.1 },
      { f: 'motion', z: -2, w: 0.5 },
    ]
    expect(signalsFrom({ parts })).toEqual(['Scrolling back and forth', 'Constant backspacing', 'Nervous scrolling', "Can't put it down"])
    expect(signalsFrom(parts)).toEqual(signalsFrom({ parts }))
  })
  it('orders by z times weight, not z alone', () => {
    expect(signalsFrom({ parts: [{ f: 'motion', z: 1.2, w: 0.5 }, { f: 'minutes', z: 1.0, w: 1.1 }] }))
      .toEqual(["Can't put it down", 'Restless hand'])
  })
  it('is empty on a usual session and on nothing', () => {
    expect(signalsFrom(strainIndex(calm, learned()))).toEqual([])
    expect(signalsFrom(null)).toEqual([])
  })
  it('reads the real engine parts on a typing burst', () => {
    const hot = { ...calm, medianGap: 80, deletions: 0.35 }
    const got = signalsFrom(strainIndex(hot, learned()))
    expect(got).toContain('Frantic typing')
    expect(got).toContain('Constant backspacing')
    expect(got).not.toContain('Nervous scrolling')
  })
})

describe('LIGHT_FACE', () => {
  it('smiles on green, neutral on yellow, frowns on red', () => {
    expect(LIGHT_FACE).toEqual({ green: 'smile', yellow: 'neutral', red: 'frown' })
    expect(Object.isFrozen(LIGHT_FACE)).toBe(true)
  })
})

describe('parentSummary', () => {
  const local = (h, m) => new Date(2026, 9, 16, h, m).getTime()
  it('green: no signals, no time', () => {
    expect(parentSummary({ light: Light.GREEN, at: local(9, 41), signals: ['Frantic typing'] }))
      .toEqual({ light: 'green', headline: 'No signs of stress today.', time: null, signals: [] })
  })
  it('yellow: the headline only, no signals and no time (detail reaches a parent only on red)', () => {
    expect(parentSummary({ light: Light.YELLOW, at: local(21, 41), signals: ['Nervous scrolling', 'Scrolling back and forth'] }))
      .toEqual({ light: 'yellow', headline: 'Some signs of stress today.', time: null, signals: [] })
  })
  it('red: the headline, the local time and the signals', () => {
    expect(parentSummary({ light: Light.RED, at: local(21, 41), signals: ['Frantic typing', 'Constant backspacing'] }))
      .toEqual({ light: 'red', headline: 'Strong signs of stress. It may be worth checking in tonight.', time: 'Red at 9:41 pm', signals: ['Frantic typing', 'Constant backspacing'] })
  })
  it('uses a 12-hour clock with lowercase am and pm', () => {
    expect(parentSummary({ light: Light.RED, at: local(0, 5), signals: [] }).time).toBe('Red at 12:05 am')
    expect(parentSummary({ light: Light.RED, at: local(12, 30), signals: [] }).time).toBe('Red at 12:30 pm')
    expect(parentSummary({ light: Light.RED, at: local(21, 41), signals: [] }).time).toBe('Red at 9:41 pm')
  })
  it('drops anything that is not a signal label', () => {
    const s = parentSummary({ light: Light.RED, at: local(21, 41), signals: ['Frantic typing', 'Instagram', '25 minutes'] })
    expect(s.signals).toEqual(['Frantic typing'])
  })
  it('keeps the older call shape working, without minutes or phone use', () => {
    const g = parentSummary({ light: Light.GREEN, at: 0, minutes: 40, top: 'pxPerSec' })
    expect(g.line).toBe('No signs of stress today.')
    expect(g.detail).toBeNull()
    expect(g.signals).toEqual([])
    const r = parentSummary({ light: Light.RED, at: local(21, 40), minutes: 25, top: 'pxPerSec' })
    expect(r.line).toBe('Strong signs of stress. It may be worth checking in tonight.')
    expect(r.detail).toBe('Red at 9:40 pm')
    expect(r.signals).toEqual(['Nervous scrolling'])
  })
  it('never says phone use, a minute count, an app or content', () => {
    for (const light of [Light.GREEN, Light.YELLOW, Light.RED]) {
      for (const arg of [
        { light, at: local(21, 41), signals: Object.values(SIGNAL) },
        { light, at: local(21, 41), minutes: 25, top: 'minutes' },
      ]) {
        const text = JSON.stringify(parentSummary(arg))
        expect(text).not.toMatch(/phone use|minute|\d+ min|instagram|tiktok|snapchat|youtube|message|friend|video|app\b/i)
      }
    }
  })
})

describe('readout words', () => {
  it('waits for input once the usual is learnt, instead of counting sessions past the target', () => {
    const s = strainIndex({ pxPerSec: null, reversals: null, medianGap: null, deletions: null, minutes: 0, motion: null }, learned())
    expect(s.ready).toBe(false)
    expect(s.words).toBe('Waiting for a minute of use.')
  })
})
