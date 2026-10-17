import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { AVATAR_ALL_IDS } from '../account/avatar-catalog.js'

/* The account API. One POST endpoint, one `op` per request, and a snapshot
 * of everything the signed-in account may see in every mutating reply, so
 * the client never has to reconcile: it replaces its mirror with the
 * snapshot and renders.
 *
 * What the server holds, and what it never gives out:
 *   - a passcode is scrypt-hashed with a per-account salt and compared in
 *     constant time. It is never stored as digits and never returned.
 *   - a session token is 32 random bytes; the store keeps its SHA-256, so a
 *     copy of the store is not a set of working tokens. 30 days.
 *   - five wrong passcodes lock the account for fifteen minutes. A four
 *     digit passcode needs the lock; without it 10,000 guesses is a minute.
 *   - an account sees itself, the people it is linked to (name, role,
 *     picture, nothing else), its links, its one live code, and, for a
 *     parent, the professional links waiting on them.
 *   - no reading, score or trend ever passes through here. This API knows
 *     nothing about measurements.
 *
 * Links follow the product's consent rule exactly as the device-only store
 * did: parent-student and parent-pro are active on redeem; pro-student waits
 * until a parent with an active link to that student approves it; two of one
 * role never link.
 */

/* `other` is anyone who is not one of the three audiences. It has the least
   access there is: no link kind names it, so it can never link to anybody and
   sees nothing but itself, like a parent linked to nobody. */
export const ROLES = ['student', 'parent', 'pro', 'other']
export const SETTINGS = ['school', 'practice', 'other']
/* Every picture the client offers, read from the one list both sides use
   (src/account/avatar-catalog.js): the twelve animals and the shapes, faces
   and patterns. An id not on it is stored as null, and the client draws the
   initial instead. */
export const AVATARS = AVATAR_ALL_IDS
export const LINK_KINDS = {
  'parent-student': ['parent', 'student'],
  'pro-student':    ['pro', 'student'],
  'parent-pro':     ['parent', 'pro'],
}
const kindOf = (a, b) => Object.keys(LINK_KINDS)
  .find(k => LINK_KINDS[k].includes(a) && LINK_KINDS[k].includes(b) && a !== b) || null
const members = l => LINK_KINDS[l.kind].map(r => l[r])

const NAME_MAX = 40
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSCODE = /^\d{4,6}$/
/* A secret is a password of 8 to 128 characters of any kind, or the 4 to 6
   digit passcode every account had before passwords. Both are hashed the same
   way. The ceiling keeps one request from buying a very long scrypt. */
const SECRET_MAX = 128
const validSecret = raw => {
  const v = String(raw ?? '')
  return PASSCODE.test(v) || (v.length >= 8 && v.length <= SECRET_MAX)
}
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6
const CODE_RE = new RegExp('^[' + ALPHABET + ']{' + CODE_LENGTH + '}$')
const SESSION_S = 30 * 86400
const INVITE_S = 7 * 86400
const LOCK_AFTER = 5
const LOCK_MS = 15 * 60000
const MAX_BYTES = 8 * 1024
const RATE_WINDOW_MS = 60000
const RATE_MAX = 40

const now = () => new Date().toISOString()
const lower = v => String(v ?? '').trim().toLowerCase()
const cleanEmail = v => lower(v)
const sha = s => createHash('sha256').update(s).digest('hex')
const newId = () => randomBytes(12).toString('hex')

function hashPasscode(passcode, salt) {
  return scryptSync(String(passcode), salt, 32).toString('hex')
}
function passcodeMatches(account, passcode) {
  const a = Buffer.from(hashPasscode(passcode, account.salt), 'hex')
  const b = Buffer.from(account.passHash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}
function randomCode() {
  const buf = randomBytes(CODE_LENGTH)
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) out += ALPHABET[buf[i] % ALPHABET.length]
  return out
}

/* The public face of an account: what another person in the network sees. */
const pub = a => ({ id: a.id, name: a.name, role: a.role, avatar: a.avatar })
/* What the account sees of itself. Never the hash, the salt or the lock.
   lastSignInAt is a time only; no address is ever kept. */
const me = a => ({ id: a.id, role: a.role, name: a.name, email: a.email, avatar: a.avatar,
                   setting: a.setting, createdAt: a.createdAt, lastSignInAt: a.lastSignInAt || null })

export function makeHandler({ kv }) {
  const K = {
    acct: id => 'acct:' + id,
    name: n => 'name:' + lower(n),
    email: e => 'email:' + cleanEmail(e),
    sess: t => 'sess:' + sha(t),
    /* Every live session hash for an account, so one op can end them all. */
    sessions: id => 'sessions:' + id,
    inv: c => 'inv:' + c,
    invby: id => 'invby:' + id,
    link: id => 'link:' + id,
    links: id => 'links:' + id,
  }

  const getAccount = async id => (id ? kv.get(K.acct(id)) : null)
  const putAccount = a => kv.set(K.acct(a.id), a)

  async function linksOf(id) {
    const ids = await kv.smembers(K.links(id))
    const out = []
    for (const lid of ids) { const l = await kv.get(K.link(lid)); if (l) out.push(l); else await kv.srem(K.links(id), lid) }
    return out
  }
  async function isParentOf(parentId, studentId) {
    return (await linksOf(parentId)).some(l =>
      l.kind === 'parent-student' && l.status === 'active' && l.student === studentId && l.parent === parentId)
  }
  async function liveInvite(id) {
    const code = await kv.get(K.invby(id))
    if (!code) return null
    const inv = await kv.get(K.inv(code))
    if (!inv) { await kv.del(K.invby(id)); return null }
    return inv
  }

  /* Everything the signed-in account may see. Built fresh for every reply. */
  async function snapshot(a) {
    const links = await linksOf(a.id)
    const peopleIds = new Set()
    links.forEach(l => members(l).forEach(m => m !== a.id && peopleIds.add(m)))
    const approvals = []
    if (a.role === 'parent') {
      for (const l of links) {
        if (l.kind !== 'parent-student' || l.status !== 'active') continue
        for (const s of await linksOf(l.student)) {
          if (s.kind === 'pro-student' && s.status === 'pending') { approvals.push(s); peopleIds.add(s.pro); peopleIds.add(s.student) }
        }
      }
    }
    const people = []
    for (const id of peopleIds) { const p = await getAccount(id); people.push(p ? pub(p) : { id, name: 'Removed', role: null, avatar: null }) }
    const invite = await liveInvite(a.id)
    return { me: me(a), people, links, approvals, invite: invite ? { code: invite.code, expiresAt: invite.expiresAt } : null }
  }

  async function auth(req) {
    const h = req.headers.authorization || ''
    const token = h.startsWith('Bearer ') ? h.slice(7).trim() : ''
    if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return null
    const id = await kv.get(K.sess(token))
    if (!id) return null
    const a = await getAccount(id)
    if (!a) { await kv.del(K.sess(token)); return null }
    return { a, token }
  }
  async function issue(a) {
    const token = randomBytes(32).toString('base64url')
    await kv.set(K.sess(token), a.id, { ex: SESSION_S })
    await kv.sadd(K.sessions(a.id), sha(token))
    return token
  }
  /* Ends every session but `keep` (a token hash, or null for all of them).
     Returns how many were live. */
  async function endSessions(id, keep = null) {
    let ended = 0
    for (const h of await kv.smembers(K.sessions(id))) {
      if (h === keep) continue
      if (await kv.get('sess:' + h)) ended += 1
      await kv.del('sess:' + h)
      await kv.srem(K.sessions(id), h)
    }
    if (!keep) await kv.del(K.sessions(id))
    return ended
  }
  async function stamp(a) {
    a.lastSignInAt = now()
    await putAccount(a)
  }

  /* ── ops ── */
  const ops = {
    async create(_, b) {
      const role = b.role
      if (!ROLES.includes(role)) return { ok: false, reason: 'role' }
      const name = String(b.name ?? '').trim().slice(0, NAME_MAX)
      if (!name) return { ok: false, reason: 'name' }
      const email = cleanEmail(b.email)
      if (email && !EMAIL.test(email)) return { ok: false, reason: 'email' }
      if (!email && role !== 'student') return { ok: false, reason: 'email' }
      if (role === 'pro' && !SETTINGS.includes(b.setting)) return { ok: false, reason: 'setting' }
      if (!validSecret(b.passcode)) return { ok: false, reason: 'passcode' }
      const id = newId()
      /* The name and email indexes are claimed first, with nx, so two
         requests cannot both win the same name. */
      if ((await kv.set(K.name(name), id, { nx: true })) === null) return { ok: false, reason: 'taken' }
      if (email && (await kv.set(K.email(email), id, { nx: true })) === null) {
        await kv.del(K.name(name)); return { ok: false, reason: 'taken' }
      }
      const salt = randomBytes(16).toString('hex')
      const a = {
        id, role, name, email: email || null,
        avatar: AVATARS.includes(b.avatar) ? b.avatar : null,
        setting: role === 'pro' ? b.setting : null,
        salt, passHash: hashPasscode(b.passcode, salt),
        failed: 0, lockedUntil: 0, createdAt: now(), lastSignInAt: now(),
      }
      await putAccount(a)
      return { ok: true, token: await issue(a), snapshot: await snapshot(a) }
    },

    async signin(_, b) {
      const who = String(b.who ?? '').trim()
      const id = (await kv.get(K.email(who))) || (await kv.get(K.name(who)))
      const a = await getAccount(id)
      if (!a) return { ok: false, reason: 'wrong' }
      if (a.lockedUntil && a.lockedUntil > Date.now()) return { ok: false, reason: 'locked' }
      if (String(b.passcode ?? '').length > SECRET_MAX || !passcodeMatches(a, b.passcode ?? '')) {
        a.failed = (a.failed || 0) + 1
        if (a.failed >= LOCK_AFTER) { a.failed = 0; a.lockedUntil = Date.now() + LOCK_MS }
        await putAccount(a)
        return { ok: false, reason: a.lockedUntil > Date.now() ? 'locked' : 'wrong' }
      }
      if (a.failed || a.lockedUntil) { a.failed = 0; a.lockedUntil = 0 }
      await stamp(a)
      return { ok: true, token: await issue(a), snapshot: await snapshot(a) }
    },

    async me(s) { return { ok: true, snapshot: await snapshot(s.a) } },

    async signout(s) {
      await kv.del(K.sess(s.token))
      await kv.srem(K.sessions(s.a.id), sha(s.token))
      return { ok: true }
    },

    /* Every other device signed out; the one asking stays signed in. */
    async signout_all(s) {
      const ended = await endSessions(s.a.id, sha(s.token))
      return { ok: true, ended }
    },

    async update(s, b) {
      const a = s.a
      if (typeof b.name === 'string') {
        const name = b.name.trim().slice(0, NAME_MAX)
        if (name && lower(name) !== lower(a.name)) {
          if ((await kv.set(K.name(name), a.id, { nx: true })) === null) return { ok: false, reason: 'taken' }
          await kv.del(K.name(a.name)); a.name = name
        }
      }
      if ('email' in b) {
        const email = cleanEmail(b.email)
        if (!email) { if (a.role === 'student') { if (a.email) await kv.del(K.email(a.email)); a.email = null } }
        else if (EMAIL.test(email) && email !== a.email) {
          if ((await kv.set(K.email(email), a.id, { nx: true })) === null) return { ok: false, reason: 'taken' }
          if (a.email) await kv.del(K.email(a.email)); a.email = email
        }
      }
      if ('avatar' in b) a.avatar = b.avatar === null ? null : (AVATARS.includes(b.avatar) ? b.avatar : a.avatar)
      if ('setting' in b && a.role === 'pro' && SETTINGS.includes(b.setting)) a.setting = b.setting
      await putAccount(a)
      return { ok: true, snapshot: await snapshot(a) }
    },

    async passcode(s, b) {
      if (!validSecret(b.next)) return { ok: false, reason: 'invalid' }
      if (!passcodeMatches(s.a, b.old ?? '')) return { ok: false, reason: 'wrong' }
      s.a.salt = randomBytes(16).toString('hex')
      s.a.passHash = hashPasscode(b.next, s.a.salt)
      await putAccount(s.a)
      return { ok: true }
    },

    async delete(s) {
      const a = s.a
      for (const l of await linksOf(a.id)) {
        for (const m of members(l)) await kv.srem(K.links(m), l.id)
        await kv.del(K.link(l.id))
      }
      await kv.del(K.links(a.id))
      const inv = await liveInvite(a.id)
      if (inv) await kv.del(K.inv(inv.code))
      await kv.del(K.invby(a.id))
      await kv.del(K.name(a.name))
      if (a.email) await kv.del(K.email(a.email))
      await endSessions(a.id)
      await kv.del(K.sess(s.token))
      await kv.del(K.acct(a.id))
      return { ok: true }
    },

    /* One live code per issuer: a new one replaces the old. */
    async invite(s) {
      const a = s.a
      const old = await liveInvite(a.id)
      if (old) await kv.del(K.inv(old.code))
      let code = randomCode()
      while (await kv.get(K.inv(code))) code = randomCode()
      const inv = { code, fromId: a.id, role: a.role, createdAt: now(),
                    expiresAt: new Date(Date.now() + INVITE_S * 1000).toISOString() }
      await kv.set(K.inv(code), inv, { ex: INVITE_S })
      await kv.set(K.invby(a.id), code, { ex: INVITE_S })
      return { ok: true, snapshot: await snapshot(a) }
    },

    /* reason: unknown | own | role | exists */
    async redeem(s, b) {
      const a = s.a
      const code = String(b.code ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
      if (!CODE_RE.test(code)) return { ok: false, reason: 'unknown' }
      const inv = await kv.get(K.inv(code))
      if (!inv) return { ok: false, reason: 'unknown' }
      if (inv.fromId === a.id) return { ok: false, reason: 'own' }
      const from = await getAccount(inv.fromId)
      if (!from) { await kv.del(K.inv(code)); return { ok: false, reason: 'unknown' } }
      const kind = kindOf(a.role, from.role)
      if (!kind) return { ok: false, reason: 'role' }
      const mine = await linksOf(a.id)
      const existing = mine.find(l => members(l).includes(from.id))
      if (existing && existing.status !== 'declined') return { ok: false, reason: 'exists' }
      if (existing) { await kv.del(K.link(existing.id)); for (const m of members(existing)) await kv.srem(K.links(m), existing.id) }
      const pending = kind === 'pro-student'
      const link = {
        id: newId(), kind, student: null, parent: null, pro: null,
        [a.role]: a.id, [from.role]: from.id,
        status: pending ? 'pending' : 'active',
        invitedBy: from.id, needsApprovalFrom: pending ? 'parent' : null,
        createdAt: now(), decidedAt: pending ? null : now(),
      }
      await kv.set(K.link(link.id), link)
      await kv.sadd(K.links(a.id), link.id)
      await kv.sadd(K.links(from.id), link.id)
      await kv.del(K.inv(code))
      await kv.del(K.invby(from.id))
      return { ok: true, link, snapshot: await snapshot(a) }
    },

    approve: (s, b) => decide(s, b, 'active'),
    decline: (s, b) => decide(s, b, 'declined'),

    async remove(s, b) {
      const link = await kv.get(K.link(String(b.linkId ?? '')))
      if (!link) return { ok: false, reason: 'unknown' }
      if (!members(link).includes(s.a.id)) return { ok: false, reason: 'forbidden' }
      for (const m of members(link)) await kv.srem(K.links(m), link.id)
      await kv.del(K.link(link.id))
      return { ok: true, snapshot: await snapshot(s.a) }
    },
  }

  async function decide(s, b, status) {
    const link = await kv.get(K.link(String(b.linkId ?? '')))
    if (!link || link.status !== 'pending') return { ok: false, reason: 'unknown' }
    if (!(await isParentOf(s.a.id, link.student))) return { ok: false, reason: 'forbidden' }
    const next = { ...link, status, needsApprovalFrom: null, decidedAt: now() }
    await kv.set(K.link(link.id), next)
    return { ok: true, snapshot: await snapshot(s.a) }
  }

  const OPEN = new Set(['create', 'signin'])

  /* ── transport ── */
  const hits = new Map()
  function limited(req) {
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim()
    const t = Date.now()
    const h = hits.get(ip) || []
    const recent = h.filter(x => t - x < RATE_WINDOW_MS)
    recent.push(t); hits.set(ip, recent)
    if (hits.size > 5000) hits.clear()
    return recent.length > RATE_MAX
  }
  function send(res, code, body) {
    res.statusCode = code
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.end(JSON.stringify(body))
  }
  function sameOrigin(req) {
    const origin = req.headers.origin
    if (!origin) return true
    const host = req.headers['x-forwarded-host'] || req.headers.host
    try { return new URL(origin).host === host } catch { return false }
  }
  async function readBody(req) {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
    const raw = typeof req.body === 'string' ? req.body
      : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : null
    if (raw !== null) { try { return JSON.parse(raw) } catch { return null } }
    return new Promise(resolve => {
      let s = ''
      req.on('data', c => { s += c; if (s.length > MAX_BYTES) { resolve(null); req.destroy() } })
      req.on('end', () => { try { resolve(JSON.parse(s || '{}')) } catch { resolve(null) } })
      req.on('error', () => resolve(null))
    })
  }

  return async function handler(req, res) {
    if (req.method === 'GET') return send(res, 200, { ok: true, configured: true })
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(res, 405, { ok: false, reason: 'method' }) }
    if (!sameOrigin(req)) return send(res, 403, { ok: false, reason: 'origin' })
    if (limited(req)) return send(res, 429, { ok: false, reason: 'rate' })
    const body = await readBody(req)
    if (!body || typeof body !== 'object') return send(res, 400, { ok: false, reason: 'body' })
    const op = ops[body.op]
    if (!op || body.op === 'constructor') return send(res, 400, { ok: false, reason: 'op' })
    let session = null
    if (!OPEN.has(body.op)) {
      session = await auth(req)
      if (!session) return send(res, 401, { ok: false, reason: 'signedout' })
    }
    try {
      return send(res, 200, await op(session, body))
    } catch {
      /* A fixed string: nothing from the request reaches a log line. */
      console.error('account: op failed')
      return send(res, 500, { ok: false, reason: 'server' })
    }
  }
}
