import { describe, it, expect } from 'vitest'
import {
  scrollFeatures, typingFeatures, sessionFeatures, emptyBaseline, updateBaseline,
  strainIndex, lightFor, Light, decideLight, nudgeFor, parentSummary, NEVER_SHOWN,
} from '../src/signals/light.js'

/* ── features ───────────────────────────────────────────────────────────── */

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

/* ── the adaptive baseline ──────────────────────────────────────────────── */

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

/* ── strain and the light ───────────────────────────────────────────────── */

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

/* ── the nudge to the teen and the summary to the parent ───────────────── */

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

describe('parentSummary', () => {
  it('shows the parent only the light on green and yellow', () => {
    const s = parentSummary({ light: Light.GREEN, at: 0, minutes: 40, top: 'pxPerSec' })
    expect(s.light).toBe(Light.GREEN)
    expect(s.line).toBe('Nothing to see.')
    expect(s.detail).toBeNull()
  })
  it('on red gives the time and the kind of signal, never an app, a person or content', () => {
    const s = parentSummary({ light: Light.RED, at: Date.UTC(2026, 9, 16, 21, 40), minutes: 25, top: 'pxPerSec' })
    expect(s.detail).toContain('25 minutes')
    expect(s.detail).toContain('fast scrolling')
    expect(s.detail).not.toMatch(/instagram|tiktok|message|friend|video/i)
  })
  it('lists what the parent never sees', () => {
    expect(NEVER_SHOWN).toContain('Who your teen talks to')
    expect(NEVER_SHOWN).toContain('What they watch or read')
    expect(NEVER_SHOWN).toContain('Which apps they use')
  })
})

describe('readout words', () => {
  it('waits for input once the usual is learnt, instead of counting sessions past the target', () => {
    const s = strainIndex({ pxPerSec: null, reversals: null, medianGap: null, deletions: null, minutes: 0, motion: null }, learned())
    expect(s.ready).toBe(false)
    expect(s.words).toBe('Waiting for a minute of use.')
  })
})
