import { describe, it, expect, beforeEach } from 'vitest'
import { levelFor, recordSession, readProgress, setPick, PROGRESS_KEY } from '../src/toolkit/game/progress.js'

const store = {}
globalThis.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v) },
  removeItem: k => { delete store[k] },
}

beforeEach(() => { for (const k of Object.keys(store)) delete store[k] })

describe('levelFor', () => {
  it('starts at level 1 with nothing', () => {
    expect(levelFor(0)).toEqual({ level:1, into:0, need:100, pct:0 })
  })
  it('steps up by 100, then 140', () => {
    expect(levelFor(100).level).toBe(2)
    expect(levelFor(239).level).toBe(2)
    expect(levelFor(240).level).toBe(3)
  })
  it('caps the step at 340 points', () => {
    expect(levelFor(1e6).need).toBe(340)
  })
})

describe('recordSession', () => {
  it('only ever adds and never stores a date', () => {
    recordSession('breathing', 80)
    const r = recordSession('ground', -50)
    expect(r.points).toBe(0)
    const p = readProgress()
    expect(p.total).toBe(80)
    expect(p.sessions).toBe(2)
    expect(store[PROGRESS_KEY]).not.toMatch(/20\d\d-/)
  })
  it('reports a level up and what it opened', () => {
    const r = recordSession('scan', 120)
    expect(r.levelUp).toBe(true)
    expect(r.after.level).toBe(2)
    expect(r.opened.map(o => o.id)).toContain('mint')
  })
})

describe('setPick', () => {
  it('refuses a colour that is still locked', () => {
    setPick('theme', 'bloom')
    expect(readProgress().theme).toBe('leaf')
    recordSession('move', 100)
    setPick('theme', 'mint')
    expect(readProgress().theme).toBe('mint')
  })
  it('keeps sound off until turned on', () => {
    expect(readProgress().sound).toBe(false)
    setPick('sound', true)
    expect(readProgress().sound).toBe(true)
  })
  it('survives storage that throws', () => {
    const real = globalThis.localStorage
    globalThis.localStorage = { getItem() { throw new Error('x') }, setItem() { throw new Error('x') } }
    expect(() => recordSession('breathing', 10)).not.toThrow()
    globalThis.localStorage = real
  })
})
