import { describe, expect, it } from 'vitest'
import { AUDIENCES, SHARING, getSharing, revokeAll, setShared } from '../src/app/store.js'

/* "Days slow to settle" is a shared field, so it has to obey the consent
   model like the rows before it: day level, off by default, switchable off
   by the student, and listed under each audience that may see it. These
   tests run with no window, so the slot is the in-memory copy throughout. */

describe('settle sharing', () => {
  it('lists a settle row under both audiences, at day level', () => {
    for (const audience of AUDIENCES) {
      const row = SHARING[audience].fields.find(f => f.key === 'settle')
      expect(row, audience).toBeTruthy()
      expect(row.label, audience).toBe('Days slow to settle')
      expect(row.short, audience).toBe('days slow to settle')
      expect(row.hint, audience).toMatch(/day/i)
      expect(row.hint, audience).not.toMatch(/hour|minute/i)
    }
  })

  it('is off by default', () => {
    const s = getSharing()
    for (const audience of AUDIENCES) expect(s[audience].settle, audience).toBe(false)
  })

  it('can be switched on and then off by the student', () => {
    for (const audience of AUDIENCES) {
      expect(setShared(audience, 'settle', true)[audience].settle, audience).toBe(true)
      expect(setShared(audience, 'settle', false)[audience].settle, audience).toBe(false)
    }
  })

  it('is cleared by revokeAll', () => {
    for (const audience of AUDIENCES) setShared(audience, 'settle', true)
    const s = revokeAll()
    for (const audience of AUDIENCES) expect(s[audience].settle, audience).toBe(false)
    expect(s.log[0].text).toBe('Stopped sharing everything')
  })
})

import { SETTING_WORDS } from '../src/views/Pro.jsx'
describe('SETTING_WORDS, the one source for the console and the start screen', () => {
  it('names the practice and the school in the head words', () => {
    expect(SETTING_WORDS.practice.head.toLowerCase()).toContain('practice')
    expect(SETTING_WORDS.school.head.toLowerCase()).toContain('school')
    expect(SETTING_WORDS.other.head.split(' ').length).toBeLessThanOrEqual(10)
  })
})
