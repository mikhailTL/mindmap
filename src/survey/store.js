import { questionText } from './questions'

/* The whole survey's state, in one module, with no React in it.
 *
 * Why a hand-rolled store and not context: the survey has to be readable from
 * a page component, from a floating card mounted three subtrees away, and from
 * an export button, and it has to survive a hash-route change that unmounts
 * everything in between. A module with a subscribe list is the smallest thing
 * that does that, and it makes the persistence layer the same code path in
 * every consumer.
 *
 * The hard requirement underneath all of it: a reviewer in a private window,
 * or behind blocked site data, must still see a working site. Storage is
 * therefore never assumed — every touch of localStorage is guarded and the
 * failure mode is an in-memory store that loses itself on reload, which is a
 * worse survey but not a broken page.
 */

const KEY = 'mindmap.survey'
const VERSION = 1
const ENDPOINT = import.meta.env?.VITE_SURVEY_ENDPOINT || '/api/responses'

/* Shape is versioned so a later change can migrate instead of throwing on a
 * record it does not recognise. Anything that is not v:1 is treated as absent
 * rather than repaired blind — a reviewer's four answers are not worth a
 * migration guess that corrupts the rest. */
const empty = () => ({ v: VERSION, visitor: null, answers: [] })

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
    return { ...empty(), ...parsed }
  } catch {
    /* Private window, blocked site data, or a half-written record. */
    return empty()
  }
}

function write() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* Quota or a blocked store: the in-memory copy is still authoritative for
     * this page view, so there is nothing to recover from and nothing to say. */
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
  /* A listener that throws must not stop the ones after it from updating, or
   * one broken card freezes every other mounted survey on the page. */
  listeners.forEach(fn => { try { fn() } catch {} })
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/* Paired with subscribe for useSyncExternalStore: a monotonic integer is a
 * stable snapshot, where returning the answers array would hand React a new
 * identity on every render and loop. */
export function getVersion() {
  load()
  return version
}

function newId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  /* Not a UUID and not trying to be — it only has to be unique across the few
   * browsers that will ever open this. */
  return 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

export function getVisitor() {
  load()
  return state.visitor
}

/* An empty or whitespace name is the Skip path, and it is recorded rather than
 * left null: an anonymous response is still a response, and a null visitor
 * would make the gate ask again on the next page. */
export function setVisitor(name) {
  load()
  const clean = String(name ?? '').trim().slice(0, 60)
  state.visitor = {
    id: newId(),
    name: clean || 'Anonymous',
    startedAt: new Date().toISOString(),
  }
  commit()
  return state.visitor
}

export function answersFor(page) {
  load()
  return state.answers.filter(a => a.page === page)
}

/* Re-answering replaces rather than appends: a reviewer who changes a rating
 * should not be counted twice, and the page survey decides whether a question
 * is done by whether an answer for it exists. */
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
  /* Opportunistic: if there is a backend it gets the answer now, and if there
   * is not, the rejection is swallowed and the answer stays pending. */
  syncPending()
  return row
}

/* The impact question carries a score and an optional sentence, and stars carry
 * a fraction. Flattening happens here so the CSV has one scalar per row and
 * Mikhail is not parsing JSON out of a spreadsheet cell. */
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
  const v = state.visitor || { id: '', name: '' }
  return state.answers.map(a => ({
    visitorName: v.name,
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

/* RFC4180: quote anything containing a comma, a quote or a newline, double the
 * quotes inside, and end lines with CRLF so Excel does not eat the last column
 * of a row on Windows. */
function cell(v) {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export function toCSV(rows) {
  const body = (rows || []).map(r => HEAD.map(k => cell(r[k])).join(','))
  return [HEAD.join(','), ...body].join('\r\n')
}

/* One answer's identity, for matching a record against the batch that was just
 * accepted. The separator is a unit separator and not a space or a hyphen
 * because page ids contain hyphens ('app-student'), and a separator a key can
 * itself contain is a collision waiting for the first id that straddles it. */
const rowKey = a => a.page + '\u001f' + a.qid

let syncing = false

/* Resolves either way, always. A peer reviewer on a train with no signal must
 * not see a rejection in the console or lose the answer they just gave, so a
 * failed POST leaves every record pending for the next attempt. */
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
