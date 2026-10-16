import { describe, it, expect } from 'vitest'
import { effectOf, rankTools, effectWords, toolName, TOOL_NAMES, MIN_PAIRS } from '../src/signals/effect.js'

const pair = (tool, hb, ha, vb = null, va = null) =>
  ({ tool, at: '2026-10-16T15:00:00.000Z', before: { hr: hb, rmssd: vb }, after: { hr: ha, rmssd: va } })

describe('effectOf', () => {
  it('reports the pulse drop as before minus after', () => {
    expect(effectOf({ hr: 78, rmssd: 30 }, { hr: 71, rmssd: 36 })).toEqual({ hrDrop: 7, hrvRise: 6 })
  })
  it('gives a negative drop when the pulse rose', () => {
    expect(effectOf({ hr: 70, rmssd: null }, { hr: 74, rmssd: null }).hrDrop).toBe(-4)
  })
  it('leaves the HRV rise null when either RMSSD is missing', () => {
    expect(effectOf({ hr: 78, rmssd: null }, { hr: 71, rmssd: 36 }).hrvRise).toBeNull()
    expect(effectOf({ hr: 78, rmssd: 30 }, { hr: 71, rmssd: null }).hrvRise).toBeNull()
  })
  it('leaves the pulse drop null when a reading is missing or not a number', () => {
    expect(effectOf(null, { hr: 71 }).hrDrop).toBeNull()
    expect(effectOf({ hr: NaN }, { hr: 71 }).hrDrop).toBeNull()
    expect(effectOf({ hr: '78' }, { hr: 71 }).hrDrop).toBeNull()
  })
})

describe('rankTools', () => {
  const pairs = [
    pair('sigh', 80, 74, 30, 36),
    pair('sigh', 78, 72, 32, 34),
    pair('breathing', 76, 73),
    pair('breathing', 74, 69),
    pair('move', 70, 68),
  ]
  it('sorts ranked tools by mean pulse drop, best first', () => {
    const rows = rankTools(pairs)
    expect(rows.map(r => r.tool)).toEqual(['sigh', 'breathing', 'move'])
    expect(rows[0]).toEqual({ tool: 'sigh', n: 2, meanHrDrop: 6, meanHrvRise: 4 })
    expect(rows[1]).toEqual({ tool: 'breathing', n: 2, meanHrDrop: 4, meanHrvRise: null })
  })
  it(`lists a tool with fewer than ${MIN_PAIRS} pairs with a count and null means`, () => {
    const rows = rankTools(pairs)
    expect(rows[2]).toEqual({ tool: 'move', n: 1, meanHrDrop: null, meanHrvRise: null })
  })
  it('needs two resolved HRV pairs before it gives a mean rise', () => {
    const rows = rankTools([pair('chest', 80, 75, 30, 35), pair('chest', 80, 75)])
    expect(rows[0].meanHrDrop).toBe(5)
    expect(rows[0].meanHrvRise).toBeNull()
  })
  it('puts unranked tools after ranked ones, more checks first, then by name', () => {
    const rows = rankTools([pair('scan', 80, 70), pair('ground', 70, 69), pair('steady', 72, 70), pair('steady', 73, 70),
      pair('chest', 80, 70), pair('chest', 80, 70), pair('chest', 80, 70)])
    expect(rows.map(r => r.tool)).toEqual(['chest', 'steady', 'scan', 'ground'])
  })
  it('skips rows without a tool or without two pulse readings', () => {
    const rows = rankTools([pair('', 80, 70), { tool: 'sigh', before: { hr: 80 }, after: {} }, null, pair('sigh', 80, 70), pair('sigh', 80, 72)])
    expect(rows).toEqual([{ tool: 'sigh', n: 2, meanHrDrop: 9, meanHrvRise: null }])
  })
  it('returns an empty list for no pairs', () => {
    expect(rankTools([])).toEqual([])
    expect(rankTools(undefined)).toEqual([])
  })
})

describe('effectWords', () => {
  it('names a number and a tool', () => {
    expect(effectWords('sigh', 6.2)).toBe('After the long exhale your pulse is 6 beats lower.')
  })
  it('uses the singular for one beat', () => {
    expect(effectWords('breathing', 1.4)).toBe('After the box breathing your pulse is 1 beat lower.')
  })
  it('says higher when the pulse rose', () => {
    expect(effectWords('move', -3)).toBe('After the movement break your pulse is 3 beats higher.')
  })
  it('says about the same for a drop that rounds to zero', () => {
    expect(effectWords('scan', 0.3)).toBe('After the body scan your pulse is about the same.')
  })
  it('asks for two checks when there is no mean', () => {
    expect(effectWords('ground', null)).toBe('Two checks after the grounding are needed.')
  })
  it('keeps every sentence to ten words or fewer with no feeling word', () => {
    const tools = Object.keys(TOOL_NAMES)
    expect(tools).toEqual(expect.arrayContaining(['walk', 'pocket', 'alert']))
    for (const t of tools) for (const d of [null, 0, 1, 6, -3, 12]) {
      const s = effectWords(t, d)
      expect(s.split(/\s+/).length).toBeLessThanOrEqual(10)
      expect(s).not.toMatch(/calm|anx|stress|relax|better|worse|feel/i)
    }
  })
  it('reads the walk as a walk inside a sentence', () => {
    expect(effectWords('walk', 5)).toBe('After the walk your pulse is 5 beats lower.')
    expect(effectWords('pocket', null)).toBe('Two checks after the sound breathing are needed.')
  })
  it('reads the reaction test inside a sentence', () => {
    expect(effectWords('alert', 12)).toBe('After the reaction test your pulse is 12 beats lower.')
    expect(effectWords('alert', null)).toBe('Two checks after the reaction test are needed.')
  })
  it('maps every tool id to its display name', () => {
    expect(toolName('alert')).toBe('Reaction Test')
    expect(toolName('sigh')).toBe('Long Exhale')
    expect(toolName('steady')).toBe('Hold Still')
    expect(toolName('walk')).toBe('Short Walk')
    expect(toolName('pocket')).toBe('Breathing by Sound')
    expect(toolName('unknown')).toBe('unknown')
  })
})
