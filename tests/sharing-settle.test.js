import { describe, expect, it } from 'vitest'
import { AUDIENCES, SHARING, getSharing, revokeAll, setShared } from '../src/app/store.js'

/* "Days slow to settle" is a shared field, so it has to obey the consent
   model like the rows before it: day level, on by default, switchable off
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

  it('is on by default, like every switch', () => {
    const s = getSharing()
    for (const audience of AUDIENCES) {
      for (const f of SHARING[audience].fields) expect(s[audience][f.key], `${audience} ${f.key}`).toBe(true)
    }
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

import { SETTING_WORDS, settingLineFor } from '../src/views/Pro.jsx'
import { YOU_SEE } from '../src/views/Privacy.jsx'
describe('SETTING_WORDS, the one source for the console and the start screen', () => {
  it('names the practice and the school in the head words', () => {
    expect(SETTING_WORDS.practice.head.toLowerCase()).toContain('practice')
    expect(SETTING_WORDS.school.head.toLowerCase()).toContain('school')
    expect(SETTING_WORDS.other.head.split(' ').length).toBeLessThanOrEqual(10)
  })
})

describe('settingLineFor, the setting line under Start here', () => {
  it('names the practice for a Counselor/Professional in a practice', () => {
    const line = settingLineFor({ role: 'pro', setting: 'practice' })
    expect(line).toBeTruthy()
    expect(line.toLowerCase()).toContain('practice')
  })
  it('is null for a student, a parent and nobody', () => {
    expect(settingLineFor({ role: 'student', setting: 'practice' })).toBeNull()
    expect(settingLineFor({ role: 'parent' })).toBeNull()
    expect(settingLineFor(null)).toBeNull()
  })
})

describe('YOU_SEE, the privacy page list of what a parent may see', () => {
  it('has one entry that names days slow to settle', () => {
    expect(YOU_SEE.some(e => /slow to settle/i.test(e))).toBe(true)
  })
})
