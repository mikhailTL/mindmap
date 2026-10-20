import { describe, expect, it } from 'vitest'
import { BANNED, daySentence, hourLabel } from '../src/views/student/sentence.js'

const band = { lo: 36, hi: 55 }
const series = (vals, start = 7) => vals.map((v, i) => {
  const m = start * 60 + i * 30
  return { t: `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`, v }
})

const all = s => [s.lead, s.sub].filter(Boolean).join(' ')

describe('student day sentence', () => {
  it('names the hour the day turned and the calm morning, without a figure', () => {
    const day = series([44, 43, 45, 44, 42, 44, 45, 43, 44, 46, 48, 52, 56, 58, 60, 62])
    const s = daySentence({ day, band })
    expect(s.lead).toBe('Your stress was higher than usual from about 1 pm.')
    expect(s.sub).toBe('Your stress stayed at or below usual all morning.')
    expect(all(s)).not.toMatch(/\d{2}/)
  })

  it('says when the day settled again', () => {
    const day = series([44, 45, 58, 60, 50, 46])
    expect(daySentence({ day, band })).toEqual({
      lead: 'Your stress was higher than usual around 8 am.',
      sub: 'It was back in your usual range by 9 am.',
    })
  })

  it('covers a usual day, a calm day and a hard day', () => {
    expect(daySentence({ day: series([45, 47, 46]), band }).lead).toBe('Your stress was in your usual range today.')
    expect(daySentence({ day: series([30, 31, 29]), band }).lead).toBe('Your stress was lower than usual all day.')
    expect(daySentence({ day: series([60, 70, 65]), band }).lead).toBe('Your stress was higher than usual all day.')
    expect(daySentence({ day: [], band }).lead).toBe('No readings yet today.')
  })

  it('never uses a clinical word or talks about the score', () => {
    const cases = [
      series([44, 43, 45, 60, 62]), series([44, 58, 46]), series([45, 47, 46]), series([30, 31, 29]),
      series([60, 70, 65]), series([30, 32, 45, 46], 9), series([37, 38, 39]),
    ]
    for (const day of cases) {
      const s = daySentence({ day, band })
      const text = all(s).toLowerCase()
      for (const w of BANNED) expect(text).not.toContain(w)
      for (const one of [s.lead, s.sub].filter(Boolean)) expect(one.split(/\s+/).length).toBeLessThanOrEqual(12)
    }
  })

  it('rounds the clock to a spoken hour', () => {
    expect(hourLabel('14:10')).toBe('2 pm')
    expect(hourLabel('11:40')).toBe('noon')
    expect(hourLabel('08:20')).toBe('8 am')
  })
})
