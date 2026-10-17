import { describe, expect, it } from 'vitest'
import { trendDir, trendLabel } from '../src/traffic/Face.jsx'
import { FAMILY, CASELOAD, summary } from '../src/lib/roster.js'

describe('Heads Up arrow', () => {
  it('reads up, down and level from the rounded change', () => {
    expect(trendDir(4)).toBe('up')
    expect(trendDir(-2.6)).toBe('down')
    expect(trendDir(0.3)).toBe('level')
    expect(trendDir(null)).toBe(null)
    expect(trendDir(undefined)).toBe(null)
  })
  it('speaks the points and the range before', () => {
    expect(trendLabel(5, 'last week')).toBe('Mind Score up 5 points from last week')
    expect(trendLabel(-1, 'yesterday')).toBe('Mind Score down 1 point from yesterday')
    expect(trendLabel(0, 'last month')).toBe('Mind Score level with last month')
    expect(trendLabel(null, 'yesterday')).toBe('')
  })
  it('has a change for every range on every demo teen', () => {
    for (const t of [...FAMILY, ...CASELOAD]) {
      for (const r of ['day', 'week', 'month']) expect(Number.isFinite(summary(t, r).change)).toBe(true)
    }
  })
})
