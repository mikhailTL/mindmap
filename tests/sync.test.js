import { describe, it, expect, beforeEach } from 'vitest'
import { mergePulled, diffForPush, strip } from '../src/account/sync.js'
import { toTeen, liveSummary, liveStatus, liveSourceLine, localDay } from '../src/views/family/live.js'
import { KEY, addReading, listReadings, setReadings } from '../src/lib/readingLog.js'

/* The client half of the account sync: merging the account's readings into
   this device's log, working out what to send, and shaping a linked teen
   from the snapshot for the dashboards. */

const r = (id, over = {}) => ({ id, at: 1000 + id.charCodeAt(0), score: 50, source: 'survey', ...over })

describe('mergePulled', () => {
  it('adds rows from another device and keeps a local row the account never had', () => {
    const { list, pushNeeded } = mergePulled({ remote: [r('a'), r('b')], local: [r('a'), r('c')], known: new Set(['a']) })
    expect(list.map(x => x.id)).toEqual(['a', 'b', 'c'])
    expect(pushNeeded).toBe(true)
  })
  it('drops a row removed on another device', () => {
    const { list, pushNeeded } = mergePulled({ remote: [r('a')], local: [r('a'), r('b')], known: new Set(['a', 'b']) })
    expect(list.map(x => x.id)).toEqual(['a'])
    expect(pushNeeded).toBe(false)
  })
  it('the account wins an edit, unless a local change waits', () => {
    const remote = [r('a', { note: 'there' })], local = [r('a', { note: 'here', pulse: 70 })]
    expect(mergePulled({ remote, local, known: new Set(['a']) }).list[0]).toMatchObject({ note: 'there', pulse: 70 })
    expect(mergePulled({ remote, local, known: new Set(['a']), dirty: true }).list[0].note).toBe('here')
  })
  it('does not bring back a row removed here while the removal waits to be sent', () => {
    const { list } = mergePulled({ remote: [r('a'), r('b')], local: [r('a')], known: new Set(['a', 'b']), dirty: true })
    expect(list.map(x => x.id)).toEqual(['a'])
  })
})

describe('diffForPush', () => {
  it('sends new and changed rows without the pulse, and the ids that went', () => {
    const d = diffForPush({ local: [r('a'), r('b', { score: 60, pulse: 70 }), r('c')], server: [r('a'), r('b'), r('d')] })
    expect(d.entries).toEqual([strip(r('b', { score: 60 })), strip(r('c'))])
    expect(d.entries[0].pulse).toBeUndefined()
    expect(d.remove).toEqual(['d'])
  })
  it('sends nothing when the two agree', () => {
    expect(diffForPush({ local: [r('a', { pulse: 60 })], server: [r('a')] })).toEqual({ entries: [], remove: [] })
  })
})

describe('setReadings', () => {
  beforeEach(() => {
    const m = new Map()
    globalThis.localStorage = { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }
  })
  it('replaces the log, cleaned, sorted and without demo rows', () => {
    addReading({ at: 5, score: 40, source: 'camera' })
    setReadings([r('b', { at: 20 }), r('a', { at: 10 }), { ...r('x'), demo: true }, { id: 'bad', at: 1, score: 'x', source: 'survey' }])
    expect(listReadings().map(x => x.id)).toEqual(['a', 'b'])
    expect(JSON.parse(localStorage.getItem(KEY))).toHaveLength(2)
  })
})

describe('toTeen: a snapshot teen in the roster shape', () => {
  const NOW = new Date(2026, 9, 17, 15, 0).getTime()
  const today = localDay(NOW)
  const yesterday = localDay(NOW - 86400e3)
  const snap = {
    id: 's1', name: 'Sam Lee', avatar: 'fox',
    sharing: { score: true, week: true, sleep: true, worn: true, settle: true },
    usual: { lo: 35, hi: 57, base: 46, general: true },
    days: [
      { date: yesterday, mean: 40, min: 38, max: 42, count: 2, sources: { camera: 1, survey: 1, patch: 0 } },
      { date: today, mean: 62, min: 62, max: 62, count: 1, sources: { camera: 0, survey: 1, patch: 0 } },
    ],
  }
  it('fills 90 calendar days, real figures on the days that have them and null elsewhere', () => {
    const t = toTeen(snap, 'parent', NOW)
    expect(t.live).toBe(true)
    expect(t.days).toHaveLength(90)
    expect(t.days.at(-1)).toMatchObject({ date: today, score: 62, light: 'yellow' })
    expect(t.days.at(-2)).toMatchObject({ date: yesterday, score: 40, light: 'green' })
    expect(t.days.at(-3).score).toBeNull()
    expect(t.first).toBe('Sam')
    expect(t.consent).toMatchObject({ score: true, trends: true, raw: false })
  })
  it('summarises a day, a week and a month from real days only', () => {
    const t = toTeen(snap, 'parent', NOW)
    expect(liveSummary(t, 'day')).toMatchObject({ mean: 62, change: 22, points: [] })
    expect(liveSummary(t, 'week')).toMatchObject({ mean: 51, min: 38, max: 62, change: null })
    expect(liveSummary(t, 'week').points).toHaveLength(2)
    expect(liveStatus(t, 'day')).toBe('yellow')
    expect(liveSourceLine(t)).toBe('Phone camera and survey')
  })
  it('says nothing when there are no readings, and no light without a usual band', () => {
    const empty = toTeen({ ...snap, days: [] }, 'parent', NOW)
    expect(liveSummary(empty, 'week').mean).toBeNull()
    expect(liveStatus(empty, 'week')).toBeNull()
    expect(liveSourceLine(empty)).toBe('No readings yet')
    const noBand = toTeen({ ...snap, usual: undefined }, 'parent', NOW)
    expect(noBand.usual).toBeNull()
    expect(noBand.days.at(-1).light).toBeNull()
    expect(liveSummary(noBand, 'day').mean).toBe(62)
  })
  it('maps a professional’s consent from the teen’s pro switches', () => {
    const t = toTeen({ ...snap, sharing: { score: true, trends: false, raw: true, settle: true }, latestAt: NOW - 60000 }, 'pro', NOW)
    expect(t.consent).toMatchObject({ score: true, trends: false, raw: true, name: true })
    expect(t.latestAt).toBe(NOW - 60000)
  })
})
