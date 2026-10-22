import { describe, expect, it } from 'vitest'
import * as caseload from '../src/lib/caseload.js'
import {
  AUDIT_LOG, CONSENT, CONSENT_LEDGER, COHORT_PERIOD, COHORT_WEEKDAY, K_ANONYMITY,
  PROTOCOL, PROTOCOL_DONE, PROTOCOL_TIMES, alertsOnly, roster, scoreOnly, tierOf, triage,
} from '../src/lib/caseload.js'
import { LOCATION, NOTES } from '../src/lib/terms.js'

const CONSENT_NAMES = Object.keys(CONSENT)

describe('consent is the single source of truth', () => {
  it('covers every student on the caseload, with no student invented in a view', () => {
    expect(roster().map(s => s.name).sort()).toEqual([...CONSENT_NAMES].sort())
    expect(CONSENT_LEDGER.map(r => r.student).sort()).toEqual([...CONSENT_NAMES].sort())
  })

  it('derives every display flag from the consent record and nothing else', () => {
    for (const s of roster()) {
      const c = CONSENT[s.name]
      expect(s.showScore).toBe(c.score)
      expect(s.showTrend).toBe(c.trends)
      expect(s.showRaw).toBe(c.raw)
      expect(s.scope).toBe(c.scope)
      expect(s.basis).toBe(c.basis)
      expect(s.signedAt).toBe(c.signedAt)
    }
  })

  it('gives every record a legal basis and a signature date', () => {
    for (const [name, c] of Object.entries(CONSENT)) {
      expect(['FERPA', 'COPPA', 'Both'], name).toContain(c.basis)
      expect(c.signedAt, name).toMatch(/^[A-Z][a-z]{2} \d{2}, \d{4}$/)
      expect(typeof c.scope, name).toBe('string')
      expect(c.scope.length, name).toBeGreaterThan(0)
    }
  })

  it('never grants a narrower scope without the scope it sits inside', () => {
    for (const [name, c] of Object.entries(CONSENT)) {
      if (c.trends) expect(c.score, name).toBe(true)
      if (c.raw) expect(c.score, name).toBe(true)
    }
  })

  it('states raw-reading consent in the scope text whenever the flag is set', () => {
    for (const [name, c] of Object.entries(CONSENT)) {
      expect(/raw reading/i.test(c.scope), name).toBe(c.raw)
    }
    expect(Object.values(CONSENT).filter(c => c.raw)).toHaveLength(1)
  })

  it('offers no consent key that could turn crisis alerts off', () => {
    for (const [name, c] of Object.entries(CONSENT)) {
      expect(Object.keys(c).sort(), name)
        .toEqual(['basis', 'raw', 'scope', 'score', 'signedAt', 'trends'])
    }
    const silent = roster().filter(s => !s.showScore)
    expect(silent).toHaveLength(1)
    expect(alertsOnly().map(s => s.name)).toEqual(silent.map(s => s.name))
  })
})

describe('k-anonymity', () => {
  it('sets the constant at five', () => {
    expect(K_ANONYMITY).toBe(5)
  })

  it('marks a group suppressed exactly when it is under the constant', () => {
    for (const row of COHORT_PERIOD) {
      expect(row.suppressed, row.key).toBe(row.n < K_ANONYMITY)
    }
    const small = COHORT_PERIOD.filter(r => r.n < K_ANONYMITY)
    expect(small).toHaveLength(1)
    expect(small[0].n).toBe(3)
    expect(small[0].suppressed).toBe(true)
  })

  it('leaves every school-wide weekday group well above the constant', () => {
    for (const row of COHORT_WEEKDAY) {
      expect(row.n, row.key).toBeGreaterThanOrEqual(K_ANONYMITY)
      expect(row.suppressed, row.key).toBe(false)
    }
  })

  it('still carries the mean on a suppressed group rather than withholding it', () => {
    const small = COHORT_PERIOD.find(r => r.suppressed)
    expect(small.mean).toBeTypeOf('number')
    expect(small.n).toBeTypeOf('number')
  })
})

describe('triage board', () => {
  it('orders only the students who consented to trends', () => {
    for (const s of triage()) expect(s.showTrend, s.name).toBe(true)
    const velocities = triage().map(s => s.velocity)
    expect(velocities).toEqual([...velocities].sort((a, b) => b - a))
  })

  it('splits the caseload into three lists with no overlap and nobody lost', () => {
    const lists = [triage(), scoreOnly(), alertsOnly()]
    const names = lists.flatMap(l => l.map(s => s.name))
    expect(new Set(names).size).toBe(names.length)
    expect([...names].sort()).toEqual([...CONSENT_NAMES].sort())
  })

  it('withholds the score band from a student who did not consent to a score', () => {
    for (const s of roster()) {
      if (s.showScore) expect(s.tier, s.name).toBe(tierOf(s.current))
      else expect(s.tier, s.name).toBeNull()
    }
  })

  it('bands the score at 58, 72 and 85', () => {
    expect(tierOf(57)).toBe('info')
    expect(tierOf(58)).toBe('moderate')
    expect(tierOf(71)).toBe('moderate')
    expect(tierOf(72)).toBe('high')
    expect(tierOf(84)).toBe('high')
    expect(tierOf(85)).toBe('crisis')
  })

  it('still carries the score of a student who withheld it', () => {
    const silent = roster().find(s => !s.showScore)
    expect(silent.current).toBeTypeOf('number')
    expect(silent.weekAgo).toBeTypeOf('number')
    expect(silent.velocity).toBeTypeOf('number')
  })
})

describe('parent and school scope containment', () => {
  const SURFACE = JSON.stringify({
    consent: CONSENT,
    roster: roster(),
    ledger: CONSENT_LEDGER,
    cohortPeriod: COHORT_PERIOD,
    cohortWeekday: COHORT_WEEKDAY,
    audit: AUDIT_LOG,
    referrals: caseload.REFERRALS,
    interventions: caseload.INTERVENTIONS,
  })

  it('surfaces no Notes entry and no Location anywhere in the module', () => {
    expect(SURFACE).not.toContain(`"${NOTES}"`)
    expect(SURFACE.toLowerCase()).not.toContain('location')
    expect(SURFACE.toLowerCase()).not.toContain('journal')
    expect(SURFACE.toLowerCase()).not.toContain('transcript')
    expect(NOTES).toBe('Notes')
    expect(LOCATION).toBe('Location')
  })

  it('holds no sample series, so there is no raw reading to surface', () => {
    for (const s of roster()) {
      for (const v of Object.values(s)) expect(Array.isArray(v)).toBe(false)
    }
    const series = caseload.profile45(roster()[0])
    expect(series).toHaveLength(45)
    for (const point of series) {
      expect(Object.keys(point).sort()).toEqual(['i', 'v'])
      expect(Number.isInteger(point.v)).toBe(true)
    }
  })

  it('never names a guardian or a student, only a pseudonym', () => {
    for (const r of CONSENT_LEDGER) {
      expect(r.guardian).toBe('Guardian')
      expect(r.student).toMatch(/^Student \d{4}$/)
    }
    for (const name of CONSENT_NAMES) expect(name).toMatch(/^Student \d{4}$/)
  })
})

describe('audit log', () => {
  it('records a record being opened, naming the actor and the subject', () => {
    const opened = AUDIT_LOG.filter(r => r.action === 'Opened record')
    expect(opened.length).toBeGreaterThanOrEqual(1)
    for (const r of opened) {
      expect(r.actor.length).toBeGreaterThan(0)
      expect(r.subject).toMatch(/^Student \d{4}$/)
      expect(r.at.length).toBeGreaterThan(0)
    }
  })

  it('gives every row an actor, an action, a subject and a time', () => {
    for (const r of AUDIT_LOG) {
      expect(Object.keys(r).sort()).toEqual(['action', 'actor', 'at', 'rel', 'subject'])
      for (const v of Object.values(r)) {
        expect(typeof v).toBe('string')
        expect(v.length).toBeGreaterThan(0)
      }
    }
  })

  it('offers no field and no export that could suppress a row', () => {
    for (const r of AUDIT_LOG) {
      for (const key of ['hidden', 'visible', 'suppressed', 'deleted', 'redacted', 'internal']) {
        expect(r, key).not.toHaveProperty(key)
      }
    }
    for (const name of Object.keys(caseload)) {
      expect(name, `export ${name}`)
        .not.toMatch(/suppress|redact|purge|clear|delete|remove|hide|unlog/i)
    }
    /* And no consent key can switch logging off for a student. */
    for (const c of Object.values(CONSENT)) expect(c).not.toHaveProperty('audit')
  })

  it('matches the crisis protocol step for step', () => {
    expect(PROTOCOL).toHaveLength(5)
    expect(PROTOCOL_TIMES).toHaveLength(PROTOCOL.length)
    expect(PROTOCOL_DONE).toEqual([0, 1, 2, 3])
    const times = AUDIT_LOG.map(r => r.at)
    for (const step of PROTOCOL_DONE) {
      expect(times.some(t => t.endsWith(PROTOCOL_TIMES[step])), PROTOCOL_TIMES[step]).toBe(true)
    }
    const open = PROTOCOL_TIMES[PROTOCOL_TIMES.length - 1]
    expect(times.some(t => t.endsWith(open)), open).toBe(false)
  })

  it('reads newest first, so an appended row goes to the top', () => {
    const today = AUDIT_LOG.filter(r => r.rel === 'Today')
    expect(today.length).toBeGreaterThan(1)
    const minutes = today.map(r => {
      const m = r.at.match(/(\d+):(\d\d) (AM|PM)/)
      return ((Number(m[1]) % 12) + (m[3] === 'PM' ? 12 : 0)) * 60 + Number(m[2])
    })
    expect(minutes).toEqual([...minutes].sort((a, b) => b - a))
    expect(AUDIT_LOG.map(r => r.rel))
      .toEqual(['Today', 'Today', 'Today', 'Today', 'Today', 'Yesterday', 'Yesterday', 'Monday'])
  })

  it('records what people other than staff did too', () => {
    const actors = AUDIT_LOG.map(r => r.actor)
    expect(actors.some(a => /^Guardian/.test(a))).toBe(true)
    expect(actors.some(a => /^Student/.test(a))).toBe(true)
    expect(actors).toContain('System')
  })
})

describe('generated figures are deterministic', () => {
  it('gives each student a stable driver breakdown that sums to one', () => {
    for (const s of roster()) {
      const drivers = caseload.driversFor(s)
      expect(drivers, s.name).toHaveLength(5)
      expect(drivers.reduce((a, d) => a + d.share, 0), s.name).toBeCloseTo(1, 10)
      expect(caseload.driversFor(s), s.name).toEqual(drivers)
      for (const d of drivers) expect(d.share, s.name).toBeGreaterThan(0)
    }
  })

  it('currently gives two students an identical driver breakdown', () => {
    const shapes = new Map()
    for (const s of roster()) {
      const key = JSON.stringify(caseload.driversFor(s))
      shapes.set(key, [...(shapes.get(key) || []), s.name])
    }
    const collisions = [...shapes.values()].filter(names => names.length > 1)
    expect(collisions).toEqual([['Student 3907', 'Student 4470']])
  })

  it('ends the 45-day line exactly where the board says the student is today', () => {
    for (const s of roster()) {
      const series = caseload.profile45(s)
      expect(series[44].v, s.name).toBe(s.current)
      expect(series[44].i).toBe(44)
      for (const point of series) {
        expect(point.v, s.name).toBeGreaterThanOrEqual(20)
        expect(point.v, s.name).toBeLessThanOrEqual(96)
      }
    }
  })
})
