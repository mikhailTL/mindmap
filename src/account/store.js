import { useSyncExternalStore } from 'react'
import { PRO } from '../lib/terms'

/* Accounts, links and invitations, kept on this device.
 *
 * There is no endpoint behind any of this. An account is a name, a role and
 * a hashed passcode in localStorage; a link is a row joining a student to a
 * parent or a Medical Professional; an invitation is a six character code
 * that another account on the same device redeems. The whole flow (invite,
 * redeem, approve) is complete here, and the one screen that says where the
 * data lives is the account settings screen.
 *
 * The slot pattern is src/app/store.js's, copied rather than imported so
 * that a change to the app slots cannot quietly change what an account is:
 *   - versioned shape; anything not v:VERSION is treated as absent.
 *   - every localStorage touch guarded; a blocked store degrades to the
 *     in-memory copy, which is authoritative for this page view.
 *   - a monotonic integer snapshot for useSyncExternalStore.
 *   - a throwing listener must not stop the ones after it.
 *
 * The passcode is never stored. SHA-256 of a salted string via crypto.subtle,
 * which is async, so createAccount, signIn and changePasscode return
 * promises; everything else is synchronous.
 */

const VERSION = 1

export const ROLES = ['student', 'parent', 'pro']

export const ROLE_LABEL = { student: 'Student', parent: 'Parent', pro: PRO }

/* Six characters from an alphabet with no 0/O, 1/I/L, so a code read out
   loud or copied by hand cannot be misread. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 6
const INVITE_DAYS = 7

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

/* For screens: re-render on every commit, and read the slots directly. */
export function useAccount() {
  useSyncExternalStore(subscribe, getVersion, () => 0)
  return current()
}

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
      /* Quota or blocked store. The in-memory copy stays authoritative. */
    }
  }
  return {
    get: () => load(),
    merge(patch) { state = normalise({ ...load(), ...patch }); save(); commit(); return state },
    replace(next) { state = normalise({ ...blank(), ...next }); save(); commit(); return state },
  }
}

const str = (v, fallback) => (typeof v === 'string' && v ? v : fallback)
const oneOf = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback)
const iso = v => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null)
const now = () => new Date().toISOString()

function newId(prefix) {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

/* ── Slots ──────────────────────────────────────────────────────────────── */

export const NAME_MAX = 40

const blankAccounts = () => ({ v: VERSION, items: [] })
function normaliseAccounts(s) {
  const items = Array.isArray(s.items) ? s.items : []
  return {
    v: VERSION,
    items: items
      .filter(a => a && typeof a.id === 'string' && typeof a.name === 'string' && a.name.trim()
                   && ROLES.includes(a.role) && /^[0-9a-f]{64}$/.test(a.passcodeHash || ''))
      .map(a => ({
        id: a.id,
        role: a.role,
        name: a.name.trim().slice(0, NAME_MAX),
        passcodeHash: a.passcodeHash,
        createdAt: iso(a.createdAt) || now(),
      })),
  }
}

const blankSession = () => ({ v: VERSION, accountId: null })
const normaliseSession = s => ({ v: VERSION, accountId: typeof s.accountId === 'string' ? s.accountId : null })

const LINK_ROLES = ['parent', 'pro']
const STATUSES = ['pending', 'active', 'declined']

const blankLinks = () => ({ v: VERSION, items: [] })
function normaliseLinks(s) {
  const items = Array.isArray(s.items) ? s.items : []
  return {
    v: VERSION,
    items: items
      .filter(l => l && typeof l.id === 'string' && typeof l.studentId === 'string'
                   && typeof l.otherId === 'string' && LINK_ROLES.includes(l.role))
      .map(l => ({
        id: l.id,
        studentId: l.studentId,
        otherId: l.otherId,
        role: l.role,
        status: oneOf(l.status, STATUSES, 'pending'),
        invitedBy: str(l.invitedBy, l.otherId),
        needsApprovalFrom: l.needsApprovalFrom === 'parent' ? 'parent' : null,
        createdAt: iso(l.createdAt) || now(),
        decidedAt: iso(l.decidedAt),
      })),
  }
}

const blankInvites = () => ({ v: VERSION, items: [] })
function normaliseInvites(s) {
  const items = Array.isArray(s.items) ? s.items : []
  const re = new RegExp('^[' + ALPHABET + ']{' + CODE_LENGTH + '}$')
  return {
    v: VERSION,
    items: items
      .filter(i => i && re.test(i.code || '') && typeof i.fromId === 'string'
                   && ROLES.includes(i.role) && iso(i.expiresAt))
      .map(i => ({
        code: i.code,
        fromId: i.fromId,
        role: i.role,
        forStudentId: typeof i.forStudentId === 'string' ? i.forStudentId : null,
        createdAt: iso(i.createdAt) || now(),
        expiresAt: i.expiresAt,
      })),
  }
}

const accounts = makeSlot('mindmap.account.accounts', blankAccounts, normaliseAccounts)
const session  = makeSlot('mindmap.account.session',  blankSession,  normaliseSession)
const links    = makeSlot('mindmap.account.links',    blankLinks,    normaliseLinks)
const invites  = makeSlot('mindmap.account.invites',  blankInvites,  normaliseInvites)

/* ── Passcode ───────────────────────────────────────────────────────────── */

export const PASSCODE = /^\d{4,6}$/

/* Salted with a fixed string: the hash is a local lock on a phone, not a
   credential anywhere else, and the point is only that the digits are never
   written down as digits. */
async function hash(passcode) {
  const bytes = new TextEncoder().encode('mindmap.account|' + passcode)
  const buf = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/* ── Accounts ───────────────────────────────────────────────────────────── */

const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

const byId = id => accounts.get().items.find(a => a.id === id) || null

export function current() {
  const id = session.get().accountId
  return id ? byId(id) : null
}

export function listAccounts() {
  return accounts.get().items.map(({ id, name, role, createdAt }) => ({ id, name, role, createdAt }))
}

/* reason: role | name | passcode | taken */
export async function createAccount({ role, name, passcode }) {
  if (!ROLES.includes(role)) return { ok: false, reason: 'role' }
  const clean = String(name ?? '').trim().slice(0, NAME_MAX)
  if (!clean) return { ok: false, reason: 'name' }
  if (!PASSCODE.test(String(passcode ?? ''))) return { ok: false, reason: 'passcode' }
  if (accounts.get().items.some(a => sameName(a.name, clean))) return { ok: false, reason: 'taken' }
  const account = {
    id: newId('a'), role, name: clean, passcodeHash: await hash(String(passcode)), createdAt: now(),
  }
  accounts.merge({ items: [...accounts.get().items, account] })
  session.merge({ accountId: account.id })
  return { ok: true, account }
}

/* 'wrong' for an unknown name as well: the screen says one line either way. */
export async function signIn(name, passcode) {
  const clean = String(name ?? '').trim()
  const a = accounts.get().items.find(x => sameName(x.name, clean))
  if (!a) return 'wrong'
  const h = await hash(String(passcode ?? ''))
  if (h !== a.passcodeHash) return 'wrong'
  session.merge({ accountId: a.id })
  return 'ok'
}

export function signOut() {
  session.merge({ accountId: null })
}

export function updateProfile(patch) {
  const me = current()
  if (!me) return null
  const name = typeof patch?.name === 'string' ? patch.name.trim().slice(0, NAME_MAX) : me.name
  if (!name) return me
  if (accounts.get().items.some(a => a.id !== me.id && sameName(a.name, name))) return me
  accounts.merge({ items: accounts.get().items.map(a => a.id === me.id ? { ...a, name } : a) })
  return current()
}

/* ok | wrong | invalid */
export async function changePasscode(oldPasscode, newPasscode) {
  const me = current()
  if (!me) return 'wrong'
  if (!PASSCODE.test(String(newPasscode ?? ''))) return 'invalid'
  if (await hash(String(oldPasscode ?? '')) !== me.passcodeHash) return 'wrong'
  const passcodeHash = await hash(String(newPasscode))
  accounts.merge({ items: accounts.get().items.map(a => a.id === me.id ? { ...a, passcodeHash } : a) })
  return 'ok'
}

/* Removes the account, every link it is on and every code it issued. There
   is no bin and nothing elsewhere to withdraw. */
export function deleteAccount(id = session.get().accountId) {
  if (!id) return
  links.merge({ items: links.get().items.filter(l => l.studentId !== id && l.otherId !== id) })
  invites.merge({ items: invites.get().items.filter(i => i.fromId !== id && i.forStudentId !== id) })
  accounts.merge({ items: accounts.get().items.filter(a => a.id !== id) })
  if (session.get().accountId === id) session.merge({ accountId: null })
}

/* ── Invitations ────────────────────────────────────────────────────────── */

function randomCode() {
  const out = []
  const buf = new Uint8Array(CODE_LENGTH)
  try { crypto.getRandomValues(buf) } catch {
    for (let i = 0; i < CODE_LENGTH; i++) buf[i] = Math.floor(Math.random() * 256)
  }
  for (let i = 0; i < CODE_LENGTH; i++) out.push(ALPHABET[buf[i] % ALPHABET.length])
  return out.join('')
}

const live = (i, at = new Date()) => Date.parse(i.expiresAt) > at.getTime()

/* The signed in account issues a code. A student's code names the student;
   a parent's or a Medical Professional's names nobody yet, because the
   student who enters it is the one it is for. */
export function createInvite() {
  const me = current()
  if (!me) return null
  let code = randomCode()
  while (invites.get().items.some(i => i.code === code)) code = randomCode()
  const invite = {
    code,
    fromId: me.id,
    role: me.role,
    forStudentId: me.role === 'student' ? me.id : null,
    createdAt: now(),
    expiresAt: new Date(Date.now() + INVITE_DAYS * 86400000).toISOString(),
  }
  /* One live code per issuer: a second press replaces the first rather than
     leaving a trail of codes that all still work. */
  invites.merge({ items: [...invites.get().items.filter(i => i.fromId !== me.id), invite] })
  return invite
}

export function listInvites(accountId = session.get().accountId) {
  return invites.get().items.filter(i => i.fromId === accountId && live(i))
}

export function myInvite(accountId = session.get().accountId) {
  return listInvites(accountId)[0] || null
}

function findLink(studentId, otherId) {
  return links.get().items.find(l => l.studentId === studentId && l.otherId === otherId) || null
}

/* reason: signedout | unknown | expired | own | role | exists
 *
 *   student enters a parent's code   active parent link
 *   student enters a pro's code      pending pro link, a parent approves
 *   parent enters a student's code   active parent link
 *   pro enters a student's code      pending pro link, a parent approves
 */
export function redeemInvite(rawCode, at = new Date()) {
  const me = current()
  if (!me) return { ok: false, reason: 'signedout' }
  const code = String(rawCode ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  const inv = invites.get().items.find(i => i.code === code)
  if (!inv) return { ok: false, reason: 'unknown' }
  if (inv.fromId === me.id) return { ok: false, reason: 'own' }
  if (!live(inv, at)) {
    invites.merge({ items: invites.get().items.filter(i => i.code !== code) })
    return { ok: false, reason: 'expired' }
  }
  const from = byId(inv.fromId)
  if (!from) {
    invites.merge({ items: invites.get().items.filter(i => i.code !== code) })
    return { ok: false, reason: 'unknown' }
  }
  let studentId, otherId, role
  if (me.role === 'student' && (from.role === 'parent' || from.role === 'pro')) {
    studentId = me.id; otherId = from.id; role = from.role
  } else if (from.role === 'student' && (me.role === 'parent' || me.role === 'pro')) {
    studentId = from.id; otherId = me.id; role = me.role
  } else {
    return { ok: false, reason: 'role' }
  }
  const existing = findLink(studentId, otherId)
  if (existing && existing.status !== 'declined') return { ok: false, reason: 'exists' }
  const pending = role === 'pro'
  const link = {
    id: newId('l'),
    studentId, otherId, role,
    status: pending ? 'pending' : 'active',
    invitedBy: from.id,
    needsApprovalFrom: pending ? 'parent' : null,
    createdAt: now(),
    decidedAt: pending ? null : now(),
  }
  links.merge({ items: [...links.get().items.filter(l => l.id !== existing?.id), link] })
  invites.merge({ items: invites.get().items.filter(i => i.code !== code) })
  return { ok: true, link }
}

/* ── Links ──────────────────────────────────────────────────────────────── */

function isParentOf(accountId, studentId) {
  return links.get().items.some(l =>
    l.role === 'parent' && l.status === 'active' && l.studentId === studentId && l.otherId === accountId)
}

/* ok | forbidden | unknown. Only an account with an active parent link to
   the student may decide a pro link. */
function decide(linkId, status) {
  const me = current()
  if (!me) return 'forbidden'
  const link = links.get().items.find(l => l.id === linkId)
  if (!link) return 'unknown'
  if (link.status !== 'pending') return 'unknown'
  if (!isParentOf(me.id, link.studentId)) return 'forbidden'
  links.merge({
    items: links.get().items.map(l => l.id === linkId
      ? { ...l, status, needsApprovalFrom: null, decidedAt: now() } : l),
  })
  return 'ok'
}

export const approveLink = linkId => decide(linkId, 'active')
export const declineLink = linkId => decide(linkId, 'declined')

/* Either side of a link may remove it. */
export function removeLink(linkId) {
  const me = current()
  if (!me) return 'forbidden'
  const link = links.get().items.find(l => l.id === linkId)
  if (!link) return 'unknown'
  if (link.studentId !== me.id && link.otherId !== me.id) return 'forbidden'
  links.merge({ items: links.get().items.filter(l => l.id !== linkId) })
  return 'ok'
}

const person = id => {
  const a = byId(id)
  return a ? { id: a.id, name: a.name, role: a.role } : { id, name: 'Removed', role: null }
}

/* Every link the account is on, each with the other person named. For a
   student, `person` is the parent or pro; for a parent or pro, the student. */
export function listNetwork(accountId = session.get().accountId) {
  if (!accountId) return []
  return links.get().items
    .filter(l => l.studentId === accountId || l.otherId === accountId)
    .map(l => ({
      ...l,
      person: person(l.studentId === accountId ? l.otherId : l.studentId),
      student: person(l.studentId),
    }))
}

/* The pro links waiting on this parent, across every teen they are linked to. */
export function listPendingApprovals(parentId = session.get().accountId) {
  if (!parentId) return []
  return links.get().items
    .filter(l => l.role === 'pro' && l.status === 'pending' && isParentOf(parentId, l.studentId))
    .map(l => ({ ...l, person: person(l.otherId), student: person(l.studentId) }))
}

/* ── Your data ──────────────────────────────────────────────────────────── */

/* Everything for the signed in account, as JSON. Never the hash. */
export function exportAll(accountId = session.get().accountId) {
  const a = accountId ? byId(accountId) : null
  if (!a) return 'null'
  return JSON.stringify({
    v: VERSION,
    exportedAt: now(),
    account: { id: a.id, role: a.role, name: a.name, createdAt: a.createdAt },
    links: listNetwork(a.id),
    invites: listInvites(a.id),
  }, null, 2)
}

export function wipe() {
  session.replace({})
  links.replace({})
  invites.replace({})
  accounts.replace({})
}
