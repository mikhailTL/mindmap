import { questionText } from './questions'
import { sendResponse } from './mail'

/* The survey's state, in one React-free module with a subscribe list rather
 * than context: it is read from a page component, from a floating card three
 * subtrees away and from an export button, and has to survive a hash-route
 * change that unmounts everything between.
 *
 * Storage is never assumed. Every localStorage touch is guarded, and a private
 * window or blocked site data degrades to an in-memory store. */

const KEY = 'mindmap.survey'
const VERSION = 1

/* The only value `visitor.name` ever holds. The survey collects no name; this
 * fills a field the API's schema still has. */
const ANON = 'Anonymous'
const ENDPOINT = import.meta.env?.VITE_SURVEY_ENDPOINT || '/api/responses'

/* Versioned shape: anything not v:1 is treated as absent rather than repaired
 * blind. Additive keys with a null default (sentAt, queuedAt) do NOT bump
 * VERSION, the spread in read() fills them in, and a bump would discard the
 * half-finished response already in a reviewer's browser. */
const empty = () => ({ v: VERSION, visitor: null, answers: [], sentAt: null, queuedAt: null })

let state = empty()
let loaded = false
let version = 0
const listeners = new Set()

function read() {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.v !== VERSION || !Array.isArray(parsed.answers)) return empty()
    const next = { ...empty(), ...parsed }
    /* A record written before 13 October may carry a name the survey used to
     * ask for. It is dropped here, on the first read in every browser that has
     * one, rather than left to be posted on the next answer. No VERSION bump:
     * bumping would discard the answers alongside it, which is a worse trade
     * than scrubbing one field in place. */
    if (next.visitor) next.visitor = { ...next.visitor, name: ANON }
    return next
  } catch {
    /* Private window, blocked site data, or a half-written record. */
    return empty()
  }
}

function write() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* Quota or blocked store: the in-memory copy stays authoritative for this
     * page view, so there is nothing to recover. */
  }
}

function load() {
  if (loaded) return
  loaded = true
  if (typeof window !== 'undefined') state = read()
}

function commit() {
  write()
  version += 1
  /* A throwing listener must not stop the ones after it, or one broken card
   * freezes every other mounted survey on the page. */
  listeners.forEach(fn => { try { fn() } catch {} })
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/* Snapshot for useSyncExternalStore. A monotonic integer is stable; returning
 * the answers array would hand React a new identity each render and loop. */
export function getVersion() {
  load()
  return version
}

function newId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  /* Not a UUID: only has to be unique across the browsers that open this. */
  return 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

export function getVisitor() {
  load()
  return state.visitor
}

/* The visitor record: an opaque id and a start time, and nothing else.
 *
 * THE ARGUMENT IS IGNORED, DELIBERATELY. The survey used to take a first name
 * here. Teenagers answer it, and a first name beside an age band and a
 * school-level band identifies a person in a way that none of the three does
 * alone, so the field came off the panel on 13 October. The parameter is kept
 * so that any caller still passing a name compiles and stores nothing; do not
 * reconnect it. `name` stays in the record because api/responses.js reads
 * `visitor.name`, and it is a constant, not an input.
 *
 * Called with no argument from NameGate's Start, which is the consent step:
 * a null visitor would make the panel ask again on the next page. */
export function setVisitor(_ignored) {
  load()
  state.visitor = {
    id: newId(),
    name: ANON,
    startedAt: new Date().toISOString(),
  }
  commit()
  return state.visitor
}

/* A display handle for the responses page: the last six characters of the
 * opaque id. It is not a name and cannot be turned into one. Printed so that
 * two cards on the page can be told apart and an answer can be matched to the
 * row it came from. */
export function visitorCode(id) {
  const s = String(id ?? '').replace(/[^a-zA-Z0-9]/g, '')
  if (!s) return 'unknown'
  return s.slice(-6).toLowerCase()
}

export function answersFor(page) {
  load()
  return state.answers.filter(a => a.page === page)
}

/* Re-answering replaces rather than appends, completeness is decided by
 * whether an answer for the question exists. */
export function recordAnswer({ page, qid, kind, value, label }) {
  load()
  const row = {
    page,
    qid,
    kind,
    value,
    label: label ?? null,
    at: new Date().toISOString(),
    synced: false,
  }
  const i = state.answers.findIndex(a => a.page === page && a.qid === qid)
  if (i >= 0) state.answers[i] = row
  else state.answers.push(row)
  commit()
  /* Opportunistic: a backend gets the answer now; with none, the rejection is
   * swallowed and the answer stays pending. */
  syncPending()
  return row
}

/* Stars carry a fraction, and impact answers given before it became a plain
 * text question carry { score, note }. Flattened here so the CSV holds one
 * scalar per row instead of JSON in a cell. */
function flatten(value) {
  if (value == null) return ''
  if (typeof value === 'object') {
    const score = value.score ?? ''
    const note = value.note ?? ''
    return note ? `${score}: ${note}` : String(score)
  }
  return String(value)
}

export function exportRows() {
  load()
  const v = state.visitor || { id: '', name: ANON }
  return state.answers.map(a => ({
    /* Always the constant. The column is kept because existing spreadsheets
     * expect this header in this position; it carries no personal data. */
    visitorName: ANON,
    visitorId: v.id,
    page: a.page,
    questionId: a.qid,
    question: questionText(a.qid),
    kind: a.kind,
    value: flatten(a.value),
    label: a.label ?? '',
    at: a.at,
  }))
}

const HEAD = ['visitorName', 'visitorId', 'page', 'questionId', 'question', 'kind', 'value', 'label', 'at']

/* RFC4180: quote anything holding a comma, quote or newline, double inner
 * quotes, and end lines with CRLF or Excel on Windows eats the last column. */
function cell(v) {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export function toCSV(rows) {
  const body = (rows || []).map(r => HEAD.map(k => cell(r[k])).join(','))
  return [HEAD.join(','), ...body].join('\r\n')
}

/* One answer's identity, for matching records against an accepted batch. The
 * separator is U+001F and not a hyphen, because page ids contain hyphens
 * ('app-student') and a separator a key can contain collides. */
const rowKey = a => a.page + '\u001f' + a.qid

let syncing = false

/* Always resolves, never rejects. A failed POST leaves every record pending
 * for the next attempt rather than losing the answer. */
export async function syncPending() {
  load()
  if (syncing) return false
  const pending = state.answers.filter(a => !a.synced)
  if (!pending.length || !state.visitor) return false
  if (typeof fetch !== 'function') return false
  syncing = true
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor: state.visitor, answers: pending }),
    })
    if (!res || !res.ok) return false
    const sent = new Set(pending.map(rowKey))
    state.answers = state.answers.map(a =>
      sent.has(rowKey(a)) ? { ...a, synced: true } : a)
    commit()
    return true
  } catch {
    return false
  } finally {
    syncing = false
  }
}

/* One mail for the whole response, sent once. Distinct from syncPending's
 * per-answer POST: different trigger, payload and success condition.
 *
 * Returns mail.js's 'sent' | 'waiting' | 'unreachable', or 'idle'. Only 'sent'
 * is terminal; the other two leave the response queued for flushQueue, so a
 * failed delivery loses nothing.
 *
 * sentAt is persisted, not in memory, so a reviewer who finishes, reloads and
 * answers an optional question does not post a second copy. force is the
 * explicit button. Never throws. */
let submitting = false

export async function submitResponse({ force = false } = {}) {
  load()
  /* In-flight guard: the last answer can land as the button is pressed, and a
   * doubled response is worse than one that has to be pressed again. */
  if (submitting) return 'idle'
  if (!state.visitor || !state.answers.length) return 'idle'
  if (state.sentAt && !force) return 'sent'
  submitting = true
  try {
    const result = await sendResponse()
    if (result === 'sent') {
      state.sentAt = new Date().toISOString()
      state.queuedAt = null
      /* Delivered, so nothing is pending. This is also what stops
       * recordAnswer's opportunistic syncPending from retrying an absent
       * backend on every later keystroke. */
      state.answers = state.answers.map(a => (a.synced ? a : { ...a, synced: true }))
      commit()
      return 'sent'
    }
    /* Not delivered, not lost: stamped as queued and retried on every later
     * visit and when the network returns. Both causes, an unclicked
     * activation link, a relay that is down, are the owner's, not the
     * reviewer's, so this is not surfaced as a failure. */
    state.queuedAt = state.queuedAt || new Date().toISOString()
    commit()
    return result
  } catch {
    state.queuedAt = state.queuedAt || new Date().toISOString()
    commit()
    return 'unreachable'
  } finally {
    submitting = false
  }
}


export function isQueued() {
  load()
  return !!state.queuedAt && !state.sentAt
}

/* The retry. Safe on any event: a no-op unless something is queued, and
 * submitResponse's in-flight guard stops two overlapping. */
export async function flushQueue() {
  load()
  if (!isQueued()) return 'idle'
  return submitResponse({ force: true })
}

/* Wired once at module load, on the two events that change the answer: the
 * page being opened again, and the network returning. */
if (typeof window !== 'undefined') {
  const tryFlush = () => { flushQueue().catch(() => {}) }
  /* Delayed, so a queued retry never competes with first paint. */
  setTimeout(tryFlush, 2500)
  window.addEventListener('online', tryFlush)
}

export function wasSent() {
  load()
  return Boolean(state.sentAt)
}
