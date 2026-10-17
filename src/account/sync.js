import React from 'react'
import { applySnapshot, current, isRemote, liveData, onSnapshot, refresh } from './store'
import { call, readToken } from './remote'
import { EVENT, listReadings, setReadings } from '../lib/readingLog'
import { applySharing, getSharing, subscribe as onAppStore } from '../app/store'

/* The student's readings and sharing switches, kept in step with their
 * account, and the live refresh every dashboard reads.
 *
 *   readings  every add, edit or clear in src/lib/readingLog.js is sent
 *             (debounced) as the rows the account does not have yet, the
 *             rows that changed and the ids that went. Every snapshot that
 *             comes back is merged into the log, so a reading taken on one
 *             device shows on the next one the student signs in on.
 *   sharing   a switch changed in src/app/store.js is sent; the account's
 *             copy comes back on every snapshot and replaces the local one.
 *   refresh   useLiveSync() asks for a fresh snapshot every 20 seconds while
 *             the tab is visible, and on focus, so a parent's or a Medical
 *             Professional's dashboard shows a teen's new reading without a
 *             reload.
 *
 * Only on the account backend and only for a signed in student does anything
 * get sent. A parent or a professional only ever reads. */

const SYNCED = 'mindmap.readings.synced'
const CHUNK = 100
const POLL_MS = 20000

/* ── Pure parts, tested in tests/sync.test.js ─────────────────────────── */

/* What the server keeps of a row. A local `pulse` is not sent. */
export const strip = e => ({ id: e.id, at: e.at, score: e.score, source: e.source, ...(e.note ? { note: e.note } : {}) })
const same = (a, b) => JSON.stringify(strip(a)) === JSON.stringify(strip(b))

/* The account's rows merged into this device's.
 *   remote  the rows in the snapshot
 *   local   the rows in this device's log
 *   known   ids this device last saw on the account
 *   dirty   a local change is waiting to be sent
 * A row on the account wins, unless a local change is waiting. A local row
 * the account never had is kept and sent. A row the account had and no
 * longer has was removed on another device, so it goes here too; while a
 * local change waits, a row removed here is not brought back. */
export function mergePulled({ remote = [], local = [], known = new Set(), dirty = false }) {
  const localById = new Map(local.map(r => [r.id, r]))
  const remoteIds = new Set(remote.map(r => r.id))
  const out = []
  let pushNeeded = false
  for (const r of remote) {
    const l = localById.get(r.id)
    if (!l) {
      if (dirty && known.has(r.id)) continue
      out.push({ ...r })
      continue
    }
    if (dirty && !same(l, r)) { out.push(l); continue }
    const keep = l.pulse != null && l.at === r.at ? { pulse: l.pulse } : {}
    out.push({ ...r, ...keep })
  }
  for (const l of local) {
    if (remoteIds.has(l.id)) continue
    if (known.has(l.id) && !dirty) continue
    out.push(l)
    pushNeeded = true
  }
  return { list: out.sort((a, b) => a.at - b.at), pushNeeded }
}

/* What to send: rows the account lacks or holds differently, and ids it
   holds that this device no longer has. */
export function diffForPush({ local = [], server = [] }) {
  const held = new Map(server.map(r => [r.id, r]))
  const here = new Set(local.map(r => r.id))
  return {
    entries: local.filter(l => !held.has(l.id) || !same(held.get(l.id), l)).map(strip),
    remove: server.map(r => r.id).filter(id => !here.has(id)),
  }
}

/* ── State ─────────────────────────────────────────────────────────────── */

function readSynced() {
  try {
    const v = JSON.parse(globalThis.localStorage?.getItem(SYNCED) || 'null')
    return v && typeof v === 'object' ? { owner: v.owner || null, ids: Array.isArray(v.ids) ? v.ids : [] } : { owner: null, ids: [] }
  } catch { return { owner: null, ids: [] } }
}
function writeSynced(v) {
  try { globalThis.localStorage?.setItem(SYNCED, JSON.stringify(v)) } catch { /* in memory is enough */ }
}

let started = false
let dirty = false
let pushTimer = null
let pushing = false
let again = false
let lastSharing = null
let sharingDirty = false
let sharingTimer = null

const signedInStudent = () => isRemote() && !!readToken() && current()?.role === 'student'
const pick = s => JSON.stringify({ parent: s.parent, pro: s.pro })

function schedulePush(ms = 1500) {
  clearTimeout(pushTimer)
  pushTimer = setTimeout(pushReadings, ms)
}

export async function pushReadings() {
  if (!signedInStudent()) return
  if (pushing) { again = true; return }
  const server = liveData().readings || []
  const { entries, remove } = diffForPush({ local: listReadings(), server })
  if (!entries.length && !remove.length) { dirty = false; return }
  pushing = true
  let ok = true
  const tz = new Date().getTimezoneOffset()
  const chunks = entries.length ? [] : [[]]
  for (let i = 0; i < entries.length; i += CHUNK) chunks.push(entries.slice(i, i + CHUNK))
  for (let i = 0; i < chunks.length; i++) {
    const r = await call('readings', { tz, entries: chunks[i], ...(i === 0 && remove.length ? { remove } : {}) })
    if (!r.ok) { ok = false; break }
    applySnapshot(r.snapshot)
  }
  pushing = false
  if (ok) dirty = false
  else schedulePush(30000)
  if (again) { again = false; schedulePush(200) }
}

function schedulePushSharing(ms = 600) {
  clearTimeout(sharingTimer)
  sharingTimer = setTimeout(pushSharing, ms)
}

async function pushSharing() {
  if (!signedInStudent()) return
  const s = getSharing()
  const r = await call('sharing', { parent: s.parent, pro: s.pro })
  if (!r.ok) { schedulePushSharing(30000); return }
  lastSharing = pick(s)
  sharingDirty = false
  applySnapshot(r.snapshot)
}

/* One snapshot in. Only a student's carries readings and sharing. */
function handleSnapshot(snap) {
  if (!snap?.me || snap.me.role !== 'student') return
  const synced = readSynced()
  const foreign = !!synced.owner && synced.owner !== snap.me.id
  if (Array.isArray(snap.readings)) {
    const local = foreign ? [] : listReadings()
    const known = new Set(foreign ? [] : synced.ids)
    const { list, pushNeeded } = mergePulled({ remote: snap.readings, local, known, dirty })
    const before = listReadings()
    if (foreign || list.length !== before.length || list.some((r, i) => !same(r, before[i]))) setReadings(list, { remote: true })
    writeSynced({ owner: snap.me.id, ids: snap.readings.map(r => r.id) })
    if (pushNeeded) { dirty = true; schedulePush(300) }
  }
  if (snap.sharing && !sharingDirty) {
    const local = getSharing()
    if (!snap.sharing.set && !foreign && local.log.length) { sharingDirty = true; schedulePushSharing(300); return }
    const theirs = { parent: snap.sharing.parent, pro: snap.sharing.pro }
    lastSharing = pick(theirs)
    if (pick(local) !== lastSharing) applySharing(theirs)
  }
}

/* Idempotent. Called by src/account/store.js once the backend is known, and
   by useLiveSync(). */
export function startSync() {
  if (started || typeof window === 'undefined') return
  started = true
  onSnapshot(handleSnapshot)
  window.addEventListener(EVENT, e => {
    if (e?.detail?.remote) return
    if (!signedInStudent()) return
    dirty = true
    schedulePush()
  })
  onAppStore(() => {
    if (!signedInStudent()) return
    const now = pick(getSharing())
    if (now === lastSharing) return
    sharingDirty = true
    schedulePushSharing()
  })
  /* A snapshot that arrived before the sync started. */
  const me = current()
  const live = liveData()
  if (me && (live.readings || live.sharing)) handleSnapshot({ me, readings: live.readings, sharing: live.sharing })
}

let pulling = null
function pull() {
  if (pulling) return pulling
  pulling = refresh().finally(() => { pulling = null })
  return pulling
}

/* Mount once in the app shell. Refreshes the account's snapshot every 20
   seconds while somebody is signed in and the tab is visible, and on focus,
   so a dashboard shows a linked teen's new readings as they arrive. */
export function useLiveSync() {
  React.useEffect(() => {
    startSync()
    let timer = null
    const visible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
    const tick = () => { if (visible()) pull() }
    const start = () => { if (!timer) timer = setInterval(tick, POLL_MS) }
    const stop = () => { clearInterval(timer); timer = null }
    const onVis = () => { if (visible()) { pull(); start() } else stop() }
    const onFocus = () => pull()
    start()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stop()
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])
}
