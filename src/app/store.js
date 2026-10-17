import { SCORE, NOTES, NOTES_DEF, LOCATION, PRO } from '../lib/terms'

/* State for the four app features: reminders, what the student shares, and
 * their Notes. Three localStorage slots behind one listener list.
 *
 * There is no fetch in this file. The sharing switches are sent to the
 * student's account by src/account/sync.js, which reads them from here and
 * hands back the account's copy through applySharing(), so a parent and a
 * Medical Professional see what the student chose, on any device.
 *
 * Conventions taken from src/survey/store.js on purpose, because a second set
 * of storage habits in one codebase is how a guarded read becomes an
 * unguarded one:
 *   - versioned shape. Anything not v:VERSION is treated as absent rather
 *     than repaired blind.
 *   - every localStorage touch guarded. A private window, blocked site data
 *     or a half-written record degrades to an in-memory copy that is
 *     authoritative for this page view.
 *   - a monotonic integer snapshot for useSyncExternalStore. Returning an
 *     object would hand React a new identity every render and loop.
 *   - a throwing listener must not stop the ones after it, or one broken
 *     card freezes every other mounted screen.
 */

const VERSION = 1

const listeners = new Set()
let version = 0

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

/* One slot: one key, one blank shape, one normaliser that is applied to
 * whatever comes back off disk as well as to every write, so a hand-edited
 * record cannot put the slot into a state the UI never produces. */
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
      /* Quota or blocked store. The in-memory copy stays authoritative for
       * this page view, so there is nothing to recover. */
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

/* ── Reminders ──────────────────────────────────────────────────────────── */

/* What a lock screen may carry. Least informative first, and `name` is the
 * default: a reminder that says nothing but the app's own name cannot read
 * anybody's week off a phone lying face up on a desk. */
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

/* Off, on weekdays, late enough to be after school, and silent on the lock
 * screen. Every default here is the quietest one the setting offers. */
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

/* HH:MM on a 24-hour clock, which is what <input type="time"> reads and
 * writes. Anything else is replaced rather than parsed. */
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/
const time = (v, fallback) => (TIME.test(v) ? v : fallback)

function normaliseNotify(s) {
  const d = Array.isArray(s.days) ? s.days : []
  const days = DAYS.map(x => x.n).filter(n => d.includes(n))
  return {
    v: VERSION,
    on: bool(s.on),
    time: time(s.time, '20:30'),
    /* A reminder on no days is a reminder that never arrives, which reads as
     * a broken setting rather than as off. Clearing the last day turns the
     * whole thing off instead. */
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

/* The one line that would actually appear, built from the live setting rather
 * than written out per option, so the preview cannot drift from the choice.
 * `score` is optional: with none, the line names the figure without printing
 * one, because this module has no reading of its own and must not invent one. */
export function lockLine(settings = getNotify(), score = null) {
  if (settings.lock === 'name') return 'MindMap'
  if (settings.lock === 'plain') return 'MindMap · Time for a reading, if you want one.'
  return score == null
    ? `MindMap · Today’s ${SCORE} is ready.`
    : `MindMap · Today’s ${SCORE} is ${score}.`
}

/* ── What is shared ─────────────────────────────────────────────────────── */

/* The consent model, expressed once.
 *
 * It is not invented here. The parent column is src/views/Privacy.jsx's
 * YOU_SEE and YOU_NEVER; the Medical Professional column is the three keys on
 * every record in src/lib/caseload.js (`score`, `trends`, `raw`). Moving a
 * row between `fields` and `never`, or adding one, is a consent change and
 * belongs in those files first.
 *
 * `needs` carries the nesting caseload.js enforces: a trend is movement in
 * the score and a raw reading is the score before it was a score, so neither
 * can be shared without the score itself. Switching the score off switches
 * both off with it. */
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

/* How long raw samples are kept on the phone. Shortest first and shortest by
 * default: a retention choice whose default is the longest option is a
 * default nobody chose. */
export const RETENTION = [7, 30, 90]

/* Every switch starts on. The owner: "Have all the privacy features
 * defaulted to ON so that parents and med profs can see student data". The
 * student can switch any of them off, any time, and Turn everything off
 * still does what it says. */
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
    /* Nesting, applied after the read as well as after a write, so a record
     * edited by hand cannot leave a trend shared without its score. */
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

/* Every change writes one line the student can read back. The real product
 * keeps an audit log; this is the part of it that belongs to them. */
function note(state, text) {
  const log = [{ at: new Date().toISOString(), text }, ...(state.log || [])].slice(0, 12)
  return { ...state, log }
}

/* The account's copy of the switches, from src/account/sync.js. Replaces
 * the two audiences and writes no log line: the student did not just change
 * anything here, they changed it on another device or before. */
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
    /* Switching a parent off takes everything that depends on it with it. */
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

/* Revoke. Every optional switch off in one action, which is the thing a
 * per-field screen otherwise makes into eleven taps. */
export function revokeAll() {
  const state = getSharing()
  /* Retention and the log survive: neither is a thing being shared, and
   * wiping the log would delete the record of the revoke itself. */
  return sharing.replace(note(
    { v: VERSION, ...allOff(), retention: state.retention, log: state.log },
    'Stopped sharing everything'))
}

/* ── Notes ─────────────────────────────────────────────────────────────── */

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
  /* Not a UUID. It only has to be unique inside one phone's list. */
  return 'n-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

/* Newest first, because the thing just written is the thing being looked for. */
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

/* Deleting removes the row. There is no bin, nothing is kept behind it, and
 * nothing was ever sent, so there is nothing elsewhere to withdraw. */
export function removeNote(id) {
  return notes.merge({ items: listNotes().filter(n => n.id !== id) }).items
}

/* ── Phone sensors: four more device-only slots ───────────────────── */

/* Every row below is a measurement the phone made in the page: a reaction
 * time, a typing rhythm, a position at the moment of a reading, a mark on
 * the calendar. None of it is sent anywhere, none of it is shared with a
 * parent or a Medical Professional, and each list is capped so the slot can
 * never grow past a phone's patience. */

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
/* The student's own usual: the mean of the last seven checks before today. */
export function usualAlertness() {
  const rows = listAlertness().slice(1, 8)
  if (rows.length < 2) return null
  return rows.reduce((a, r) => a + r.mean, 0) / rows.length
}

/* Typing rhythm: one row per field session (a note saved, a check-in sent). */
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
export function usualTypingGap() {
  const rows = listTyping().slice(0, 14)
  if (rows.length < 3) return null
  const g = rows.map(r => r.medianGap).sort((a, b) => a - b)
  const m = g.length >> 1
  return g.length % 2 ? g[m] : (g[m - 1] + g[m]) / 2
}

/* Reach: a coarse position at the moment of a reading. Rounded to three
 * decimals (about 100 m) before it is stored, so the slot never holds a
 * doorstep. */
const blankReach = () => ({ v: VERSION, items: [], on: false })
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

/* Calendar marks: an exam, a presentation, a game. `day` is YYYY-MM-DD,
 * `minute` the minute of that day, `label` the student's own word. */
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

/* Effects: one row per exercise with a camera pulse taken before it and one
 * taken after. Two readings and a tool id, nothing else: no frames, no
 * waveform, no time of day finer than the stamp. src/signals/effect.js turns
 * the rows into the "What works for you" ranking. */
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
