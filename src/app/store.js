import { SCORE, NOTES, NOTES_DEF, LOCATION, PRO } from '../lib/terms'

// Device-side state for reminders, sharing, notes and phone measurements: versioned localStorage slots.
// Records without v === VERSION are treated as absent.
const VERSION = 1

const listeners = new Set()
let version = 0

// The integer version is the useSyncExternalStore snapshot; listener errors are caught so one bad subscriber does not block the rest.
function commit() {
  version += 1
  listeners.forEach(fn => { try { fn() } catch {} })
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getVersion() {
  return version
}

// Normalises on read and on write, so a hand-edited record cannot reach a state the UI does not produce.
// Storage errors fall back to the in-memory copy.
function makeSlot(key, blank, normalise) {
  let state = null
  function load() {
    if (state) return state
    let raw = null
    try { raw = window.localStorage.getItem(key) } catch { raw = null }
    let parsed = null
    if (raw) { try { parsed = JSON.parse(raw) } catch { parsed = null } }
    const usable = parsed && typeof parsed === 'object' && parsed.v === VERSION
    state = normalise(usable ? { ...blank(), ...parsed } : blank())
    return state
  }
  function save() {
    try { window.localStorage.setItem(key, JSON.stringify(state)) } catch {
    }
  }
  return {
    get: () => load(),
    merge(patch) { state = normalise({ ...load(), ...patch }); save(); commit(); return state },
    replace(next) { state = normalise({ ...blank(), ...next }); save(); commit(); return state },
  }
}

const str = (v, fallback) => (typeof v === 'string' && v ? v : fallback)
const bool = v => v === true
const oneOf = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback)

export const LOCK_LEVELS = ['name', 'plain', 'score']

export const LOCK_COPY = {
  name:  { label: 'The app name, nothing else',
           hint:  'Whoever is looking at the phone learns only that MindMap sent something.' },
  plain: { label: 'A plain reminder',
           hint:  'One neutral line. No figure, no band word, no detail.' },
  score: { label: `A plain reminder and today’s ${SCORE}`,
           hint:  `Your ${SCORE} is then readable without unlocking the phone.` },
}

export const DAYS = [
  { n: 1, short: 'Mon', full: 'Monday' },
  { n: 2, short: 'Tue', full: 'Tuesday' },
  { n: 3, short: 'Wed', full: 'Wednesday' },
  { n: 4, short: 'Thu', full: 'Thursday' },
  { n: 5, short: 'Fri', full: 'Friday' },
  { n: 6, short: 'Sat', full: 'Saturday' },
  { n: 0, short: 'Sun', full: 'Sunday' },
]

const blankNotify = () => ({
  v: VERSION,
  on: false,
  time: '20:30',
  days: [1, 2, 3, 4, 5],
  lock: 'name',
  hold: true,
  holdFrom: '21:30',
  holdTo: '07:30',
})

// HH:MM, 24-hour, the format <input type="time"> reads and writes.
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/
const time = (v, fallback) => (TIME.test(v) ? v : fallback)

function normaliseNotify(s) {
  const d = Array.isArray(s.days) ? s.days : []
  const days = DAYS.map(x => x.n).filter(n => d.includes(n))
  return {
    v: VERSION,
    on: bool(s.on),
    time: time(s.time, '20:30'),
    // An empty day list falls back to weekdays; the UI turns reminders off rather than saving no days.
    days: days.length ? days : blankNotify().days,
    lock: oneOf(s.lock, LOCK_LEVELS, 'name'),
    hold: bool(s.hold),
    holdFrom: time(s.holdFrom, '21:30'),
    holdTo: time(s.holdTo, '07:30'),
  }
}

const notify = makeSlot('mindmap.app.reminders', blankNotify, normaliseNotify)

export const getNotify = () => notify.get()
export const setNotify = patch => notify.merge(patch)

export function lockLine(settings = getNotify(), score = null) {
  if (settings.lock === 'name') return 'MindMap'
  if (settings.lock === 'plain') return 'MindMap · Time for a reading, if you want one.'
  return score == null
    ? `MindMap · Today’s ${SCORE} is ready.`
    : `MindMap · Today’s ${SCORE} is ${score}.`
}

// Consent model. `needs` names the field that must be on first, and turning it off turns dependents off.
// Keys match SHARE_KEYS in src/server/account.js.
export const SHARING = {
  parent: {
    who: 'A parent',
    /* The same audience, spelled for the middle of a sentence. */
    whom: 'a parent',
    fields: [
      { key: 'score', label: `My ${SCORE} for each day`, short: `my ${SCORE} for each day`,
        hint: 'One number a day. Never the hour, never the minute.' },
      { key: 'week',  label: 'Whether a day ran above my usual', needs: 'score',
        short: 'whether a day ran above my usual',
        hint: 'The direction only, against my own normal.' },
      { key: 'sleep', label: 'Roughly how long I slept', short: 'roughly how long I slept',
        hint: 'To the nearest half hour.' },
      { key: 'worn',  label: 'Whether the patch was being worn',
        short: 'whether the patch was being worn',
        hint: 'On or off. Not where it was.' },
      { key: 'settle', label: 'Days slow to settle', short: 'days slow to settle',
        hint: 'A count of days each week. Never the time of day.' },
    ],
    never: [
      { label: `${NOTES}`, hint: NOTES_DEF },
      { label: LOCATION, hint: 'Never recorded and never sent, at any setting.' },
      { label: 'My readings second by second',
        hint: 'A parent sees nothing finer than a day.' },
      { label: 'Anything I say',
        hint: 'The microphone is never recorded or sent.' },
    ],
  },
  pro: {
    who: PRO,
    whom: `a ${PRO}`,
    fields: [
      { key: 'score',  label: `My ${SCORE}`, short: `my ${SCORE}`,
        hint: 'The band it sits in, against my own normal.' },
      { key: 'trends', label: 'Week over week movement', needs: 'score',
        short: 'week over week movement',
        hint: 'How much it moved since last week.' },
      { key: 'raw',    label: 'My raw readings, second by second', needs: 'score',
        short: 'my raw readings',
        hint: 'The samples behind the score. I can turn this off.' },
      { key: 'settle', label: 'Days slow to settle', short: 'days slow to settle',
        hint: 'A count of days each week. Never the time of day.' },
    ],
    never: [
      { label: `${NOTES}`, hint: NOTES_DEF },
      { label: LOCATION, hint: 'Never recorded and never sent, at any setting.' },
    ],
  },
}

export const AUDIENCES = ['parent', 'pro']

export const RETENTION = [7, 30, 90]

const allOn = () => ({
  parent: { score: true, week: true, sleep: true, worn: true, settle: true },
  pro: { score: true, trends: true, raw: true, settle: true },
})
const allOff = () => ({
  parent: { score: false, week: false, sleep: false, worn: false, settle: false },
  pro: { score: false, trends: false, raw: false, settle: false },
})

const blankSharing = () => ({
  v: VERSION,
  ...allOn(),
  retention: 7,
  log: [],
})

function normaliseSharing(s) {
  const out = { v: VERSION, retention: RETENTION.includes(s.retention) ? s.retention : 7 }
  for (const audience of AUDIENCES) {
    const blank = blankSharing()[audience]
    const given = (s && typeof s[audience] === 'object' && s[audience]) || {}
    const next = {}
    for (const key of Object.keys(blank)) next[key] = bool(given[key])
    // Nesting is applied on read too, so a stored record cannot share a trend without its score.
    for (const f of SHARING[audience].fields) {
      if (f.needs && !next[f.needs]) next[f.key] = false
    }
    out[audience] = next
  }
  const log = Array.isArray(s.log) ? s.log : []
  out.log = log
    .filter(r => r && typeof r.text === 'string' && typeof r.at === 'string')
    .slice(0, 12)
    .map(r => ({ at: r.at, text: r.text.slice(0, 120) }))
  return out
}

const sharing = makeSlot('mindmap.app.sharing', blankSharing, normaliseSharing)

export const getSharing = () => sharing.get()

function note(state, text) {
  const log = [{ at: new Date().toISOString(), text }, ...(state.log || [])].slice(0, 12)
  return { ...state, log }
}

// Applies the account copy from src/account/sync.js without adding a log line.
export function applySharing(next) {
  if (!next || typeof next !== 'object') return getSharing()
  const state = getSharing()
  return sharing.merge({ ...state, parent: { ...state.parent, ...(next.parent || {}) }, pro: { ...state.pro, ...(next.pro || {}) } })
}

export function setShared(audience, key, on) {
  const state = getSharing()
  if (!SHARING[audience]) return state
  const field = SHARING[audience].fields.find(f => f.key === key)
  if (!field) return state
  const next = { ...state[audience], [key]: on === true }
  if (!on) {
    for (const f of SHARING[audience].fields) if (f.needs === key) next[f.key] = false
  }
  return sharing.merge(note({ ...state, [audience]: next },
    `${on ? 'Started' : 'Stopped'} sharing ${field.short} with ${SHARING[audience].whom}`))
}

export function setRetention(days) {
  const state = getSharing()
  if (!RETENTION.includes(days)) return state
  return sharing.merge(note({ ...state, retention: days },
    `Raw readings now kept on this phone for ${days} days`))
}

// Retention and the change log are kept, so the revoke itself stays on record.
export function revokeAll() {
  const state = getSharing()
  return sharing.replace(note(
    { v: VERSION, ...allOff(), retention: state.retention, log: state.log },
    'Stopped sharing everything'))
}

export const NOTE_MAX = 2000

const blankNotes = () => ({ v: VERSION, items: [] })

function normaliseNotes(s) {
  const items = Array.isArray(s.items) ? s.items : []
  return {
    v: VERSION,
    items: items
      .filter(n => n && typeof n.text === 'string' && n.text.trim())
      .slice(0, 400)
      .map(n => ({
        id: str(n.id, 'n-' + Math.random().toString(36).slice(2, 10)),
        text: n.text.slice(0, NOTE_MAX),
        at: str(n.at, new Date().toISOString()),
        editedAt: typeof n.editedAt === 'string' ? n.editedAt : null,
      })),
  }
}

const notes = makeSlot('mindmap.app.notes', blankNotes, normaliseNotes)

export const listNotes = () => notes.get().items

function newId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return 'n-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

export function addNote(text) {
  const clean = String(text ?? '').trim().slice(0, NOTE_MAX)
  if (!clean) return listNotes()
  const row = { id: newId(), text: clean, at: new Date().toISOString(), editedAt: null }
  return notes.merge({ items: [row, ...listNotes()] }).items
}

export function editNote(id, text) {
  const clean = String(text ?? '').trim().slice(0, NOTE_MAX)
  if (!clean) return listNotes()
  return notes.merge({
    items: listNotes().map(n =>
      n.id === id ? { ...n, text: clean, editedAt: new Date().toISOString() } : n),
  }).items
}

export function removeNote(id) {
  return notes.merge({ items: listNotes().filter(n => n.id !== id) }).items
}

const num = (v, fallback = null) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const iso = v => (typeof v === 'string' && v ? v : new Date().toISOString())

const KEEP = 60

/* Reaction tests: one row per completed check. */
const blankAlert = () => ({ v: VERSION, items: [] })
function normaliseAlert(s) {
  const items = Array.isArray(s.items) ? s.items : []
  return { v: VERSION, items: items
    .filter(r => r && num(r.mean) != null)
    .slice(0, KEEP)
    .map(r => ({ at: iso(r.at), mean: num(r.mean), median: num(r.median), slowest10: num(r.slowest10),
                 lapses: num(r.lapses, 0), falseStarts: num(r.falseStarts, 0), n: num(r.n, 0) })) }
}
const alertness = makeSlot('mindmap.app.alertness', blankAlert, normaliseAlert)
export const listAlertness = () => alertness.get().items
export function addAlertness(stats) {
  const row = { at: new Date().toISOString(), mean: stats.mean, median: stats.median,
                slowest10: stats.slowest10, lapses: stats.lapses, falseStarts: stats.falseStarts, n: stats.n }
  return alertness.merge({ items: [row, ...listAlertness()] }).items
}
// Mean of up to 7 checks before the latest one; null with fewer than 2.
export function usualAlertness() {
  const rows = listAlertness().slice(1, 8)
  if (rows.length < 2) return null
  return rows.reduce((a, r) => a + r.mean, 0) / rows.length
}

const blankTyping = () => ({ v: VERSION, items: [] })
function normaliseTyping(s) {
  const items = Array.isArray(s.items) ? s.items : []
  return { v: VERSION, items: items
    .filter(r => r && num(r.medianGap) != null)
    .slice(0, KEEP)
    .map(r => ({ at: iso(r.at), medianGap: num(r.medianGap), pauses: num(r.pauses, 0),
                 deletions: num(r.deletions, 0), keys: num(r.keys, 0) })) }
}
const typing = makeSlot('mindmap.app.typing', blankTyping, normaliseTyping)
export const listTyping = () => typing.get().items
export function addTyping(r) {
  if (!r || !r.ok) return listTyping()
  const row = { at: new Date().toISOString(), medianGap: r.medianGap, pauses: r.pauses, deletions: r.deletions, keys: r.keys }
  return typing.merge({ items: [row, ...listTyping()] }).items
}
// Median of the last 14 sessions' median key gaps (ms); null with fewer than 3.
export function usualTypingGap() {
  const rows = listTyping().slice(0, 14)
  if (rows.length < 3) return null
  const g = rows.map(r => r.medianGap).sort((a, b) => a - b)
  const m = g.length >> 1
  return g.length % 2 ? g[m] : (g[m - 1] + g[m]) / 2
}

const blankReach = () => ({ v: VERSION, items: [], on: false })
// Positions rounded to 3 decimals (about 100 m) before storage.
const round3 = x => Math.round(x * 1000) / 1000
function normaliseReach(s) {
  const items = Array.isArray(s.items) ? s.items : []
  return { v: VERSION, on: bool(s.on), items: items
    .filter(p => p && num(p.lat) != null && num(p.lon) != null && num(p.t) != null)
    .slice(0, 120)
    .map(p => ({ lat: round3(p.lat), lon: round3(p.lon), t: p.t })) }
}
const reach = makeSlot('mindmap.app.reach', blankReach, normaliseReach)
export const getReach = () => reach.get()
export const setReachOn = on => reach.merge({ on: !!on })
export function addReachPoint(lat, lon, t = Date.now()) {
  return reach.merge({ items: [{ lat, lon, t }, ...getReach().items] }).items
}
export function clearReach() { return reach.replace({ on: getReach().on, items: [] }) }

// Calendar marks: day is YYYY-MM-DD, minute is the minute of that day (0 to 1439).
export const EVENT_KINDS = ['test', 'talk', 'game', 'other']
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const blankEvents = () => ({ v: VERSION, items: [] })
function normaliseEvents(s) {
  const items = Array.isArray(s.items) ? s.items : []
  return { v: VERSION, items: items
    .filter(e => e && DAY_RE.test(e.day) && num(e.minute) != null)
    .slice(0, 200)
    .map(e => ({ id: str(e.id, 'e-' + Math.random().toString(36).slice(2, 10)), day: e.day,
                 minute: Math.max(0, Math.min(1439, Math.round(e.minute))),
                 label: String(e.label ?? '').trim().slice(0, 40) || 'Event',
                 kind: oneOf(e.kind, EVENT_KINDS, 'other') })) }
}
const events = makeSlot('mindmap.app.events', blankEvents, normaliseEvents)
export const listEvents = () => events.get().items
export const eventsOn = day => listEvents().filter(e => e.day === day).sort((a, b) => a.minute - b.minute)
export function addEvent({ day, minute, label, kind }) {
  const row = { id: newId(), day, minute, label, kind }
  return events.merge({ items: [row, ...listEvents()] }).items
}
export function removeEvent(id) {
  return events.merge({ items: listEvents().filter(e => e.id !== id) }).items
}

// Before/after pulse readings per exercise, ranked by src/signals/effect.js.
const reading = r => (r && num(r.hr) != null ? { hr: num(r.hr), rmssd: num(r.rmssd) } : null)
const blankEffects = () => ({ v: VERSION, items: [] })
function normaliseEffects(s) {
  const items = Array.isArray(s.items) ? s.items : []
  return { v: VERSION, items: items
    .filter(r => r && typeof r.tool === 'string' && r.tool && reading(r.before) && reading(r.after))
    .slice(0, 120)
    .map(r => ({ at: iso(r.at), tool: r.tool.slice(0, 24), before: reading(r.before), after: reading(r.after) })) }
}
const effects = makeSlot('mindmap.app.effects', blankEffects, normaliseEffects)
export const listEffects = () => effects.get().items
export function addEffect({ tool, before, after, at }) {
  const row = { at: iso(at), tool, before, after }
  return effects.merge({ items: [row, ...listEffects()] }).items
}
