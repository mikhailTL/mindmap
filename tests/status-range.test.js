import { describe, it, expect } from 'vitest'
import { statusOf, FACE_LABEL, FAMILY, CASELOAD } from '../src/lib/roster.js'

const RANK = { green: 0, yellow: 1, red: 2 }
const avgLight = days => {
  const m = days.reduce((s, d) => s + RANK[d.light], 0) / days.length
  return m >= 1.5 ? 'red' : m >= 0.5 ? 'yellow' : 'green'
}

describe('the Heads Up face for a range', () => {
  const teens = [...FAMILY, ...CASELOAD]
  it('is today’s light for the day', () => {
    for (const t of teens) expect(statusOf(t, 'day')).toBe(t.days[t.days.length - 1].light)
  })
  it('is the average of the daily lights for the week and the month', () => {
    for (const t of teens) {
      expect(statusOf(t, 'week')).toBe(avgLight(t.days.slice(-7)))
      expect(statusOf(t, 'month')).toBe(avgLight(t.days.slice(-30)))
    }
  })
  it('names the range it covers, never a count of days', () => {
    expect(FACE_LABEL).toEqual({ day: 'Today', week: 'Week average', month: 'Month average' })
  })
})
