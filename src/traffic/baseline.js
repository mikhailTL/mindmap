// On-device store for the Heads Up baseline (Welford running stats) and a short log of
// session summaries. Numbers only.
import { emptyBaseline, updateBaseline, FEATURES } from '../signals/light.js'

export const KEY = 'mindmap.light'
export const LOG_MAX = 60

// Every storage call is guarded: Safari private mode throws on localStorage access.
function store() {
  try { return typeof localStorage !== 'undefined' ? localStorage : null } catch { return null }
}

function read() {
  const s = store()
  if (!s) return null
  try {
    const raw = s.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    return v && typeof v === 'object' ? v : null
  } catch { return null }
}

function write(v) {
  const s = store()
  if (!s) return false
  try { s.setItem(KEY, JSON.stringify(v)); return true } catch { return false }
}

function validBaseline(b) {
  if (!b || typeof b.n !== 'number' || !b.mean || !b.m2 || !b.count) return false
  return FEATURES.every(f => f in b.mean && f in b.m2 && f in b.count)
}

export function loadBaseline() {
  const v = read()
  return validBaseline(v?.baseline) ? v.baseline : null
}

export function saveBaseline(baseline) {
  const v = read() || {}
  return write({ ...v, baseline, savedAt: Date.now() })
}

export function loadLog() {
  const v = read()
  return Array.isArray(v?.log) ? v.log : []
}

export function appendLog(entry) {
  const v = read() || {}
  const log = Array.isArray(v.log) ? v.log : []
  const next = [...log, entry].slice(-LOG_MAX)
  write({ ...v, log: next })
  return next
}

export function clearBaseline() {
  const s = store()
  if (!s) return false
  try { s.removeItem(KEY); return true } catch { return false }
}

// Ten ordinary sessions that seed a first-visit baseline. medianGap is ms between keys,
// deletions the share of keys that delete, minutes the session length.
export const CALM_SESSIONS = Object.freeze([
  { pxPerSec: 240, reversals: 0.10, medianGap: 185, deletions: 0.08, minutes: 6, motion: 0.05 },
  { pxPerSec: 300, reversals: 0.12, medianGap: 175, deletions: 0.09, minutes: 8, motion: 0.06 },
  { pxPerSec: 210, reversals: 0.08, medianGap: 195, deletions: 0.07, minutes: 5, motion: 0.04 },
  { pxPerSec: 280, reversals: 0.11, medianGap: 180, deletions: 0.10, minutes: 7, motion: 0.05 },
  { pxPerSec: 330, reversals: 0.14, medianGap: 170, deletions: 0.08, minutes: 9, motion: 0.07 },
  { pxPerSec: 250, reversals: 0.09, medianGap: 190, deletions: 0.06, minutes: 6, motion: 0.05 },
  { pxPerSec: 290, reversals: 0.13, medianGap: 178, deletions: 0.09, minutes: 8, motion: 0.06 },
  { pxPerSec: 220, reversals: 0.10, medianGap: 200, deletions: 0.07, minutes: 5, motion: 0.04 },
  { pxPerSec: 310, reversals: 0.12, medianGap: 172, deletions: 0.10, minutes: 7, motion: 0.06 },
  { pxPerSec: 260, reversals: 0.11, medianGap: 186, deletions: 0.08, minutes: 6, motion: 0.05 },
])

export function seededBaseline() {
  return CALM_SESSIONS.reduce((b, s) => updateBaseline(b, s), emptyBaseline())
}

export function initialBaseline() {
  const stored = loadBaseline()
  if (stored) return stored
  const seeded = seededBaseline()
  saveBaseline(seeded)
  return seeded
}
