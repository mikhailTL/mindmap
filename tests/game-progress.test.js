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

import { recordFinish, awardFor, levelName, LEVEL_NAMES, BADGES, badgesFor, suggestNext,
         FINISH_POINTS, NEW_TOOL_BONUS, CLEAN_BONUS } from '../src/toolkit/game/progress.js'
import { TOOL_IDS, TABS, toolsIn } from '../src/toolkit/game/catalog.js'

describe('awardFor', () => {
  it('gives nothing for an early end, however much was scored', () => {
    expect(awardFor({ complete:false, firstFinish:true, clean:true }).points).toBe(0)
  })
  it('gives a flat amount for a finish, plus a new tool bonus and a clean bonus', () => {
    expect(awardFor({ complete:true }).points).toBe(FINISH_POINTS)
    expect(awardFor({ complete:true, firstFinish:true }).points).toBe(FINISH_POINTS + NEW_TOOL_BONUS)
    expect(awardFor({ complete:true, firstFinish:true, clean:true }).points).toBe(FINISH_POINTS + NEW_TOOL_BONUS + CLEAN_BONUS)
  })
  it('names every part so the end card can show where points came from', () => {
    const a = awardFor({ complete:true, firstFinish:true, clean:true })
    expect(a.parts.reduce((t, [, n]) => t + n, 0)).toBe(a.points)
  })
})

describe('recordFinish', () => {
  it('stores an early end as a session with no points and no badge', () => {
    const was = readProgress()
    const r = recordFinish('pocket', { complete:false })
    expect(r.points).toBe(0)
    expect(r.badges).toEqual([])
    const p = readProgress()
    expect(p.total).toBe(was.total)
    expect(p.tools.pocket.sessions).toBe(1)
    expect(p.done.pocket || 0).toBe(0)
  })
  it('pays the new tool bonus once per tool', () => {
    expect(recordFinish('scan').points).toBe(FINISH_POINTS + NEW_TOOL_BONUS)
    expect(recordFinish('scan').points).toBe(FINISH_POINTS)
  })
  it('awards First finish once, and Clean sweep from a clean mark', () => {
    const a = recordFinish('school-sources', { marks:['clean'] })
    expect(a.badges.map(b => b.id)).toEqual(expect.arrayContaining(['first', 'clean']))
    const b = recordFinish('school-sources', { marks:['clean'] })
    expect(b.badges).toEqual([])
    expect(readProgress().badges).toEqual(expect.arrayContaining(['first', 'clean']))
  })
  it('awards Five tried after five different tools, not five runs of one', () => {
    for (let i = 0; i < 5; i++) recordFinish('move')
    expect(readProgress().badges).not.toContain('five')
    ;['ground', 'reframe', 'sigh'].forEach(t => recordFinish(t))
    const r = recordFinish('walk')
    expect(r.badges.map(b => b.id)).toContain('five')
  })
  it('awards All rounder once every tab has a finish', () => {
    ;['breathing', 'school-cram', 'outside-no', 'life-money'].forEach(t => recordFinish(t))
    expect(readProgress().badges).not.toContain('all-tabs')
    expect(recordFinish('career-email').badges.map(b => b.id)).toContain('all-tabs')
  })
  it('awards a tab set when every tool in a tab is finished', () => {
    toolsIn('outside').forEach(t => recordFinish(t))
    expect(readProgress().badges).toContain('set-outside')
  })
  it('never stores a date or a day count', () => {
    recordFinish('school-cram', { marks:['plan'] })
    const raw = store[PROGRESS_KEY]
    expect(raw).not.toMatch(/20\d\d-|day|streak|date/i)
  })
  it('keeps old progress that has no done map', () => {
    store[PROGRESS_KEY] = JSON.stringify({ v:1, total:500, sessions:9, tools:{ breathing:{ sessions:9, points:500 } } })
    const p = readProgress()
    expect(p.total).toBe(500)
    expect(p.done).toEqual({})
    expect(p.badges).toEqual([])
  })
  it('levels at a steady pace: about four new tools reach level 2', () => {
    ;['breathing', 'scan', 'move'].forEach(t => recordFinish(t))
    expect(levelFor(readProgress().total).level).toBe(1)
    expect(recordFinish('ground').after.level).toBe(2)
  })
})

describe('levelName', () => {
  it('names the first eight levels and keeps counting after', () => {
    expect(LEVEL_NAMES).toHaveLength(8)
    expect(levelName(1)).toBe(LEVEL_NAMES[0])
    expect(levelName(8)).toBe(LEVEL_NAMES[7])
    expect(levelName(10)).toBe(`${LEVEL_NAMES[7]} 3`)
  })
})

describe('badges', () => {
  it('have an id, a name and a plain line about what earns them', () => {
    for (const b of BADGES) {
      expect(b.id).toMatch(/^[a-z-]+$/)
      expect(b.name.length).toBeGreaterThan(2)
      expect(b.line).not.toMatch(/streak|every day|in a row|[–—]/i)
    }
    expect(new Set(BADGES.map(b => b.id)).size).toBe(BADGES.length)
  })
  it('badgesFor is pure and reads only finishes and marks', () => {
    expect(badgesFor({ done:{}, marks:{} })).toEqual([])
    expect(badgesFor({ done:{ alert:1 }, marks:{ plan:1 } })).toEqual(expect.arrayContaining(['first', 'plan']))
  })
})

describe('suggestNext', () => {
  it('offers a tool from a tab not tried yet', () => {
    const s = suggestNext({ tools:{ breathing:{ sessions:1 } }, done:{ breathing:1 } })
    expect(TOOL_IDS).toContain(s.id)
    expect(s.fresh).toBe(true)
    expect(toolsIn('exercise')).not.toContain(s.id)
  })
  it('offers something even when everything is tried', () => {
    const all = Object.fromEntries(TOOL_IDS.map(id => [id, { sessions:1 }]))
    const s = suggestNext({ tools:all, done:Object.fromEntries(TOOL_IDS.map(id => [id, 2])) })
    expect(TOOL_IDS).toContain(s.id)
    expect(s.fresh).toBe(false)
  })
  it('prefers the tab on screen while it has untried tools', () => {
    expect(suggestNext({}, 'career').id).toBe('career-explore')
    const s = suggestNext({ tools:Object.fromEntries(toolsIn('life').map(id => [id, { sessions:1 }])) }, 'life')
    expect(toolsIn('life')).not.toContain(s.id)
  })
  it('covers every tab', () => {
    expect(TABS.map(t => toolsIn(t.id).length)).toEqual([11, 4, 3, 4, 4])
  })
})
