import { questionText } from './questions'
import { sendResponse } from './mail'

// Survey state outside React with a subscribe list, so it survives route changes. Storage access is guarded.
const KEY = 'mindmap.survey'
const VERSION = 1

// visitor.name holds only this constant; the API schema expects the field.
const ANON = 'Anonymous'
const ENDPOINT = import.meta.env?.VITE_SURVEY_ENDPOINT || '/api/responses'

// Records without v === 1 are discarded; keys with null defaults (sentAt, queuedAt) do not bump VERSION.
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
    // Any stored name is overwritten with ANON on read.
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
  listeners.forEach(fn => { try { fn() } catch {} })
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getVersion() {
  load()
  return version
}

function newId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

export function getVisitor() {
  load()
  return state.visitor
}

// The argument is ignored: the record holds only an opaque id and a start time.
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

export function visitorCode(id) {
  const s = String(id ?? '').replace(/[^a-zA-Z0-9]/g, '')
  if (!s) return 'unknown'
  return s.slice(-6).toLowerCase()
}

export function answersFor(page) {
  load()
  return state.answers.filter(a => a.page === page)
}

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
  syncPending()
  return row
}

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

// RFC 4180 quoting; rows end in CRLF, which Excel on Windows needs.
function cell(v) {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export function toCSV(rows) {
  const body = (rows || []).map(r => HEAD.map(k => cell(r[k])).join(','))
  return [HEAD.join(','), ...body].join('\r\n')
}

// U+001F separator, because page ids contain hyphens.
const rowKey = a => a.page + '\u001f' + a.qid

let syncing = false

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

// One mail per response. sentAt is persisted so a reload does not resend; other results stay queued for flushQueue.
let submitting = false

export async function submitResponse({ force = false } = {}) {
  load()
  if (submitting) return 'idle'
  if (!state.visitor || !state.answers.length) return 'idle'
  if (state.sentAt && !force) return 'sent'
  submitting = true
  try {
    const result = await sendResponse()
    if (result === 'sent') {
      state.sentAt = new Date().toISOString()
      state.queuedAt = null
      state.answers = state.answers.map(a => (a.synced ? a : { ...a, synced: true }))
      commit()
      return 'sent'
    }
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

export async function flushQueue() {
  load()
  if (!isQueued()) return 'idle'
  return submitResponse({ force: true })
}

if (typeof window !== 'undefined') {
  // Retries a queued response 2.5 s after load and when the browser comes back online.
  const tryFlush = () => { flushQueue().catch(() => {}) }
  setTimeout(tryFlush, 2500)
  window.addEventListener('online', tryFlush)
}

export function wasSent() {
  load()
  return Boolean(state.sentAt)
}
