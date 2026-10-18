import { useSyncExternalStore } from 'react'
import { PRO } from '../lib/terms'
import { call, probe, readToken, writeToken } from './remote'
import { AVATAR_ALL_IDS, isPhotoAvatar } from './avatar-catalog'

/* Accounts, links and invitations.
 *
 * Two backends, one store. With the account API behind the deploy (GET
 * /api/account says configured), the server holds the truth: every write
 * goes there and the reply carries a snapshot of what this account may see,
 * which replaces the mirror below. Without it, the whole flow runs on this
 * device, as it did before the API existed, and the settings screen says so.
 * Screens read the same slots either way and never know which.
 *
 * The device-only path: an account is a name, a role and a hashed passcode
 * in localStorage; a link is a row joining a student to a parent or a
 * Counselor/Professional; an invitation is a six character code that another
 * account on the same device redeems.
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

/* `other` is anyone outside the three audiences. It has the least access:
   no link kind names it, so it never links and sees only itself, like a
   parent linked to nobody. It lands on the launcher, not a role's app. */
export const ROLES = ['student', 'parent', 'pro', 'other']

export const ROLE_LABEL = { student: 'Student', parent: 'Parent', pro: PRO, other: 'Other' }

/* Where an account lands after signing in or signing out. */
export const homeFor = role => (role === 'student' || role === 'parent' || role === 'pro' ? 'app-' + role : 'app')

/* Where a Counselor/Professional works. The console reads the words off this;
   the k-floor and the consent rules are the same for all three. */
export const SETTINGS = [
  { value: 'school',   label: 'School' },
  { value: 'practice', label: 'Private practice' },
  { value: 'other',    label: 'Other professional' },
]
const SETTING_IDS = SETTINGS.map(s => s.value)

/* The twelve premade pictures, drawn in ./avatars.jsx. Ids only here, so the
   store stays free of JSX. */
export const AVATAR_IDS = [
  'fox', 'owl', 'panda', 'frog', 'cat', 'bear',
  'koala', 'penguin', 'bunny', 'whale', 'hedgehog', 'sloth',
]

/* Every picture on offer: the twelve above plus the shapes, faces and
   patterns in ./avatar-catalog.js, over a hundred in all. The server checks
   against the same list. AVATAR_IDS stays the original twelve. */
export { AVATAR_ALL_IDS }
const AVATAR_SET = new Set(AVATAR_ALL_IDS)
/* A drawing's id, or an uploaded photo (a small data URL). */
export const isAvatar = v => typeof v === 'string' && (AVATAR_SET.has(v) || isPhotoAvatar(v))
/* A teen never holds a photo: teens pick from the drawings. */
const avatarFor = (role, v) => (isAvatar(v) && !(role === 'student' && isPhotoAvatar(v)) ? v : null)

/* Who may link to whom. Two of the same role never link: a teen to teen link
   is social comparison on a product about stress, and is not offered. */
export const LINK_KINDS = {
  'parent-student': ['parent', 'student'],
  'pro-student':    ['pro', 'student'],
  'parent-pro':     ['parent', 'pro'],
}
const kindOf = (a, b) => Object.keys(LINK_KINDS)
  .find(k => LINK_KINDS[k].includes(a) && LINK_KINDS[k].includes(b) && a !== b) || null

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
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const cleanEmail = v => (typeof v === 'string' ? v.trim().toLowerCase() : '')

const blankAccounts = () => ({ v: VERSION, items: [] })
function normaliseAccounts(s) {
  const items = Array.isArray(s.items) ? s.items : []
  return {
    v: VERSION,
    items: items
      .filter(a => a && typeof a.id === 'string' && typeof a.name === 'string' && a.name.trim()
                   && ROLES.includes(a.role)
                   && (a.passcodeHash == null || /^[0-9a-f]{64}$/.test(a.passcodeHash)))
      .map(a => ({
        id: a.id,
        role: a.role,
        name: a.name.trim().slice(0, NAME_MAX),
        email: EMAIL.test(cleanEmail(a.email)) ? cleanEmail(a.email) : null,
        avatar: avatarFor(a.role, a.avatar),
        setting: a.role === 'pro' && SETTING_IDS.includes(a.setting) ? a.setting : null,
        passcodeHash: a.passcodeHash || null,
        createdAt: iso(a.createdAt) || now(),
        lastSignInAt: iso(a.lastSignInAt),
      })),
  }
}

const blankSession = () => ({ v: VERSION, accountId: null })
const normaliseSession = s => ({ v: VERSION, accountId: typeof s.accountId === 'string' ? s.accountId : null })

const STATUSES = ['pending', 'active', 'declined']
const id = v => (typeof v === 'string' && v ? v : null)

/* A link names its two members by role: `student`, `parent`, `pro`, with the
   third null. `kind` says which two. */
const blankLinks = () => ({ v: VERSION, items: [] })
function normaliseLinks(s) {
  const items = Array.isArray(s.items) ? s.items : []
  return {
    v: VERSION,
    items: items
      .filter(l => l && typeof l.id === 'string' && LINK_KINDS[l.kind]
                   && LINK_KINDS[l.kind].every(r => id(l[r])))
      .map(l => ({
        id: l.id,
        kind: l.kind,
        student: LINK_KINDS[l.kind].includes('student') ? l.student : null,
        parent:  LINK_KINDS[l.kind].includes('parent')  ? l.parent  : null,
        pro:     LINK_KINDS[l.kind].includes('pro')     ? l.pro     : null,
        status: oneOf(l.status, STATUSES, 'pending'),
        invitedBy: str(l.invitedBy, l[LINK_KINDS[l.kind][0]]),
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
        createdAt: iso(i.createdAt) || now(),
        expiresAt: i.expiresAt,
      })),
  }
}

const accounts = makeSlot('mindmap.account.accounts', blankAccounts, normaliseAccounts)
const session  = makeSlot('mindmap.account.session',  blankSession,  normaliseSession)
const links    = makeSlot('mindmap.account.links',    blankLinks,    normaliseLinks)
const invites  = makeSlot('mindmap.account.invites',  blankInvites,  normaliseInvites)

/* ── The front door ─────────────────────────────────────────────────────── */

/* The chooser on the site's front door hands the role it was told to the
   sign-in screen, which opens on Create with that tile pressed. Held in
   memory only: it is a hint for the next screen, not a setting. */
let preferredRole = null
export const setPreferredRole = r => { preferredRole = ROLES.includes(r) ? r : null }
export const takePreferredRole = () => { const r = preferredRole; preferredRole = null; return r }

/* Whether this device has an account signed in, before the probe has
   answered: a server token, or a device-only session. The chooser reads it
   to stay away from somebody who already signed in here. */
export function signedInHere() {
  if (readToken()) return true
  return !!session.get().accountId
}

/* ── Which backend ──────────────────────────────────────────────────────── */

/* 'unknown' until the probe answers, then 'remote' or 'device'. */
let backendState = 'unknown'
export const backend = () => backendState
const remote = () => backendState === 'remote'
export const isRemote = remote

/* The live part of a snapshot: a student's own readings and sharing, and,
   for a parent or a Counselor/Professional, the linked teens they may see.
   Held in memory only; src/account/sync.js turns the student's half into the
   reading log and the sharing switches, and the dashboards read `teens`. */
let liveState = { readings: null, sharing: null, teens: [], at: 0 }
const snapListeners = new Set()
export const liveData = () => liveState
export function onSnapshot(fn) {
  snapListeners.add(fn)
  return () => snapListeners.delete(fn)
}

/* The server's view of this account becomes the mirror, wholesale. */
export function applySnapshot(snap) {
  if (!snap || !snap.me) return
  liveState = {
    readings: Array.isArray(snap.readings) ? snap.readings : null,
    sharing: snap.sharing && typeof snap.sharing === 'object' ? snap.sharing : null,
    teens: Array.isArray(snap.teens) ? snap.teens : [],
    at: Date.now(),
  }
  const mine = { ...snap.me, passcodeHash: null }
  const people = (snap.people || []).map(p => ({ ...p, passcodeHash: null, createdAt: now() }))
  accounts.replace({ items: [mine, ...people] })
  links.replace({ items: [...(snap.links || []), ...(snap.approvals || [])] })
  invites.replace({ items: snap.invite
    ? [{ code: snap.invite.code, fromId: mine.id, role: mine.role, createdAt: now(), expiresAt: snap.invite.expiresAt }]
    : [] })
  session.replace({ accountId: mine.id })
  snapListeners.forEach(fn => { try { fn(snap) } catch {} })
}
function clearMirror() {
  liveState = { readings: null, sharing: null, teens: [], at: 0 }
  session.replace({}); links.replace({}); invites.replace({}); accounts.replace({})
}

/* Asks the server for this account's snapshot again, for the dashboards'
   live refresh. Resolves to true when a fresh one arrived. */
export async function refresh() {
  if (!remote() || !readToken()) return false
  const r = await call('me')
  if (r.ok) { applySnapshot(r.snapshot); return true }
  if (r.reason === 'signedout') { writeToken(null); clearMirror() }
  return false
}

/* Decided once per page: ask the deploy, and if it has a store and this
   browser holds a token, pull the account back in. */
let probed = null
export function ready() {
  if (probed) return probed
  probed = (async () => {
    if (typeof window === 'undefined') { backendState = 'device'; return backendState }
    const has = await probe()
    backendState = has ? 'remote' : 'device'
    if (has) {
      if (readToken()) {
        const r = await call('me')
        if (r.ok) applySnapshot(r.snapshot)
        else if (r.reason === 'signedout') { writeToken(null); clearMirror() }
      } else if (session.get().accountId) {
        /* A device-only session from before the store was wired. */
        clearMirror()
      }
    }
    commit()
    /* The reading and sharing sync starts once the backend is known. Loaded
       here, after the fact, so the two modules never import each other at
       load time. */
    if (has) import('./sync.js').then(m => m.startSync()).catch(() => {})
    return backendState
  })()
  return probed
}
if (typeof window !== 'undefined') ready()

/* ── Passcode ───────────────────────────────────────────────────────────── */

export const PASSCODE = /^\d{4,6}$/
/* A secret is a password of 8 to 128 characters of any kind, or the 4 to 6
   digit passcode accounts had before passwords. The server's rule is the
   same, and both are hashed the same way. */
export const PASSWORD_MIN = 8
export const SECRET_MAX = 128
export function validSecret(raw) {
  const v = String(raw ?? '')
  return PASSCODE.test(v) || (v.length >= PASSWORD_MIN && v.length <= SECRET_MAX)
}

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

const pub = a => ({ id: a.id, name: a.name, role: a.role, avatar: a.avatar })

export function listAccounts() {
  return accounts.get().items.map(pub)
}

/* reason: role | name | passcode | email | setting | taken
   Email is required for a parent and a professional and optional for a
   student, who may not have one. A professional also says where they work. */
export async function createAccount({ role, name, passcode, email, avatar, setting }) {
  if (remote()) {
    const r = await call('create', { role, name, passcode, email, avatar, setting })
    if (!r.ok) return { ok: false, reason: r.reason }
    writeToken(r.token)
    applySnapshot(r.snapshot)
    return { ok: true, account: r.snapshot.me }
  }
  if (!ROLES.includes(role)) return { ok: false, reason: 'role' }
  const clean = String(name ?? '').trim().slice(0, NAME_MAX)
  if (!clean) return { ok: false, reason: 'name' }
  const mail = cleanEmail(email)
  if (mail && !EMAIL.test(mail)) return { ok: false, reason: 'email' }
  if (!mail && role !== 'student') return { ok: false, reason: 'email' }
  if (role === 'pro' && !SETTING_IDS.includes(setting)) return { ok: false, reason: 'setting' }
  if (!validSecret(passcode)) return { ok: false, reason: 'passcode' }
  if (accounts.get().items.some(a => sameName(a.name, clean))) return { ok: false, reason: 'taken' }
  if (mail && accounts.get().items.some(a => a.email === mail)) return { ok: false, reason: 'taken' }
  const account = {
    id: newId('a'), role, name: clean,
    email: mail || null,
    avatar: avatarFor(role, avatar),
    setting: role === 'pro' ? setting : null,
    passcodeHash: await hash(String(passcode)), createdAt: now(), lastSignInAt: now(),
  }
  accounts.merge({ items: [...accounts.get().items, account] })
  session.merge({ accountId: account.id })
  return { ok: true, account }
}

/* A name or an email. 'wrong' for an unknown one as well: the screen says
   one line either way. */
export async function signIn(nameOrEmail, passcode) {
  if (remote()) {
    const r = await call('signin', { who: nameOrEmail, passcode })
    if (!r.ok) return r.reason === 'locked' || r.reason === 'offline' ? r.reason : 'wrong'
    writeToken(r.token)
    applySnapshot(r.snapshot)
    return 'ok'
  }
  const clean = String(nameOrEmail ?? '').trim()
  const mail = cleanEmail(clean)
  const a = accounts.get().items.find(x => sameName(x.name, clean) || (x.email && x.email === mail))
  if (!a) return 'wrong'
  const h = await hash(String(passcode ?? ''))
  if (h !== a.passcodeHash) return 'wrong'
  accounts.merge({ items: accounts.get().items.map(x => x.id === a.id ? { ...x, lastSignInAt: now() } : x) })
  session.merge({ accountId: a.id })
  return 'ok'
}

/* Every other device signed out; this one stays. Only the server holds more
   than one session, so on the device path there is nothing to end. */
export async function signOutOthers() {
  if (!current()) return { ok: false, ended: 0 }
  if (!remote()) return { ok: true, ended: 0 }
  const r = await call('signout_all')
  return { ok: r.ok === true, ended: r.ended || 0 }
}

export function signOut() {
  if (remote()) {
    call('signout')
    writeToken(null)
    clearMirror()
    return
  }
  session.merge({ accountId: null })
}

/* name, email, avatar, setting. A field left out is left alone; a bad value
   is ignored rather than written. */
export function updateProfile(patch = {}) {
  const me = current()
  if (!me) return null
  const next = { ...me }
  if (typeof patch.name === 'string') {
    const name = patch.name.trim().slice(0, NAME_MAX)
    if (name && !accounts.get().items.some(a => a.id !== me.id && sameName(a.name, name))) next.name = name
  }
  if ('email' in patch) {
    const mail = cleanEmail(patch.email)
    if (!mail && me.role === 'student') next.email = null
    else if (EMAIL.test(mail) && !accounts.get().items.some(a => a.id !== me.id && a.email === mail)) next.email = mail
  }
  if ('avatar' in patch) {
    if (patch.avatar === null) next.avatar = null
    else if (avatarFor(me.role, patch.avatar)) next.avatar = patch.avatar
  }
  if ('setting' in patch && me.role === 'pro' && SETTING_IDS.includes(patch.setting)) next.setting = patch.setting
  accounts.merge({ items: accounts.get().items.map(a => a.id === me.id ? next : a) })
  if (remote()) {
    call('update', patch).then(r => {
      if (r.ok) applySnapshot(r.snapshot)
      else call('me').then(m => m.ok && applySnapshot(m.snapshot))
    })
  }
  return current()
}

/* ok | wrong | invalid */
export async function changePasscode(oldPasscode, newPasscode) {
  const me = current()
  if (!me) return 'wrong'
  if (remote()) {
    const r = await call('passcode', { old: oldPasscode, next: newPasscode })
    return r.ok ? 'ok' : (r.reason === 'invalid' ? 'invalid' : 'wrong')
  }
  if (!validSecret(newPasscode)) return 'invalid'
  if (await hash(String(oldPasscode ?? '')) !== me.passcodeHash) return 'wrong'
  const passcodeHash = await hash(String(newPasscode))
  accounts.merge({ items: accounts.get().items.map(a => a.id === me.id ? { ...a, passcodeHash } : a) })
  return 'ok'
}

/* Removes the account, every link it is on and every code it issued. There
   is no bin and nothing elsewhere to withdraw. */
export function deleteAccount(who = session.get().accountId) {
  if (!who) return
  if (remote()) {
    call('delete')
    writeToken(null)
    clearMirror()
    return
  }
  links.merge({ items: links.get().items.filter(l => !members(l).includes(who)) })
  invites.merge({ items: invites.get().items.filter(i => i.fromId !== who) })
  accounts.merge({ items: accounts.get().items.filter(a => a.id !== who) })
  if (session.get().accountId === who) session.merge({ accountId: null })
}

const members = l => LINK_KINDS[l.kind].map(r => l[r])

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

/* Only a parent or a Counselor/Professional makes a network: they issue the
   code, and it keeps working for every teen (or parent, or professional) it
   is sent to until it expires, so one link gathers a whole family or
   caseload. A teen joins networks; a teen never issues a code. */
export const INVITE_ROLES = ['parent', 'pro']
export const canInvite = role => INVITE_ROLES.includes(role)
export function createInvite() {
  const me = current()
  if (!me || !canInvite(me.role)) return null
  if (remote()) {
    call('invite').then(r => r.ok && applySnapshot(r.snapshot))
    return null
  }
  let code = randomCode()
  while (invites.get().items.some(i => i.code === code)) code = randomCode()
  const invite = {
    code,
    fromId: me.id,
    role: me.role,
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

function findLink(a, b) {
  return links.get().items.find(l => members(l).includes(a) && members(l).includes(b)) || null
}

/* reason: signedout | unknown | expired | own | role | exists
 *
 *   parent and student     active on redeem, either way round
 *   parent and pro         active on redeem, either way round
 *   pro and student        pending, a parent approves, either way round
 *   two of the same role   refused
 */
export function redeemInvite(rawCode, at = new Date()) {
  const me = current()
  if (!me) return { ok: false, reason: 'signedout' }
  if (remote()) {
    return call('redeem', { code: rawCode }).then(r => {
      if (r.ok) applySnapshot(r.snapshot)
      return r.ok ? { ok: true, link: r.link } : { ok: false, reason: r.reason }
    })
  }
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
  const kind = kindOf(me.role, from.role)
  if (!kind) return { ok: false, reason: 'role' }
  const existing = findLink(me.id, from.id)
  if (existing && existing.status !== 'declined') return { ok: false, reason: 'exists' }
  const pending = kind === 'pro-student'
  const link = {
    id: newId('l'),
    kind,
    student: null, parent: null, pro: null,
    [me.role]: me.id, [from.role]: from.id,
    status: pending ? 'pending' : 'active',
    invitedBy: from.id,
    needsApprovalFrom: pending ? 'parent' : null,
    createdAt: now(),
    decidedAt: pending ? null : now(),
  }
  /* The code stays live: the next teen it is sent to joins the same way. */
  links.merge({ items: [...links.get().items.filter(l => l.id !== existing?.id), link] })
  return { ok: true, link }
}

/* ── Links ──────────────────────────────────────────────────────────────── */

function isParentOf(parentId, studentId) {
  return links.get().items.some(l =>
    l.kind === 'parent-student' && l.status === 'active' && l.student === studentId && l.parent === parentId)
}

/* ok | forbidden | unknown. Only an account with an active parent link to
   the student may decide a pro link. */
function decide(linkId, status) {
  const me = current()
  if (!me) return 'forbidden'
  if (remote()) {
    call(status === 'active' ? 'approve' : 'decline', { linkId }).then(r => r.ok && applySnapshot(r.snapshot))
    return 'ok'
  }
  const link = links.get().items.find(l => l.id === linkId)
  if (!link) return 'unknown'
  if (link.status !== 'pending') return 'unknown'
  if (!isParentOf(me.id, link.student)) return 'forbidden'
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
  if (remote()) {
    call('remove', { linkId }).then(r => r.ok && applySnapshot(r.snapshot))
    return 'ok'
  }
  const link = links.get().items.find(l => l.id === linkId)
  if (!link) return 'unknown'
  if (!members(link).includes(me.id)) return 'forbidden'
  links.merge({ items: links.get().items.filter(l => l.id !== linkId) })
  return 'ok'
}

const person = who => {
  const a = byId(who)
  return a ? pub(a) : { id: who, name: 'Removed', role: null, avatar: null }
}

/* Every link the account is on, each with the other person named. */
export function listNetwork(accountId = session.get().accountId) {
  if (!accountId) return []
  return links.get().items
    .filter(l => members(l).includes(accountId))
    .map(l => ({
      ...l,
      person: person(members(l).find(m => m !== accountId)),
    }))
}

/* The pro links waiting on this parent, across every teen they are linked to. */
export function listPendingApprovals(parentId = session.get().accountId) {
  if (!parentId) return []
  return links.get().items
    .filter(l => l.kind === 'pro-student' && l.status === 'pending' && isParentOf(parentId, l.student))
    .map(l => ({ ...l, person: person(l.pro), who: person(l.student) }))
}

/* ── Your data ──────────────────────────────────────────────────────────── */

/* Everything for the signed in account, as JSON. Never the hash. */
export function exportAll(accountId = session.get().accountId) {
  const a = accountId ? byId(accountId) : null
  if (!a) return 'null'
  return JSON.stringify({
    v: VERSION,
    exportedAt: now(),
    account: { id: a.id, role: a.role, name: a.name, email: a.email, avatar: a.avatar,
               setting: a.setting, createdAt: a.createdAt, lastSignInAt: a.lastSignInAt },
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
