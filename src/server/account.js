// Account API: one POST endpoint dispatching on `op`; mutating replies include a full snapshot of what the account may see.
// Secrets are scrypt-hashed with a per-account salt; session tokens are stored only as SHA-256 hashes.
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { AVATAR_ALL_IDS, isPhotoAvatar } from '../account/avatar-catalog.js'

// 'other' matches no link kind, so it cannot link and sees only itself.
export const ROLES = ['student', 'parent', 'pro', 'other']
export const SETTINGS = ['school', 'practice', 'other']
export const AVATARS = AVATAR_ALL_IDS
// Uploaded photo avatars are accepted for every role except student.
const AVATAR_SET = new Set(AVATARS)
const avatarFor = (role, v) => (typeof v === 'string'
  && (AVATAR_SET.has(v) || (role !== 'student' && isPhotoAvatar(v))) ? v : null)
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
// A secret is a 4 to 6 digit passcode or an 8 to 128 character password; the cap bounds scrypt work per request.
const SECRET_MAX = 128
const validSecret = raw => {
  const v = String(raw ?? '')
  return PASSCODE.test(v) || (v.length >= 8 && v.length <= SECRET_MAX)
}
// Invite code alphabet omits I, L, O, 0 and 1, which are easy to misread.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6
const CODE_RE = new RegExp('^[' + ALPHABET + ']{' + CODE_LENGTH + '}$')
const SESSION_S = 30 * 86400
const INVITE_S = 7 * 86400
// Five wrong attempts lock the account for 15 min; a 4-digit passcode is otherwise guessable in about a minute.
const LOCK_AFTER = 5
const LOCK_MS = 15 * 60000
const MAX_BYTES = 96 * 1024
const RATE_WINDOW_MS = 60000
const RATE_MAX = 40

export const READING_CAP = 500
export const READING_SOURCES = ['camera', 'survey', 'patch', 'mirror']
const NOTE_MAX = 280
const READING_ID = /^[A-Za-z0-9_.:-]{1,64}$/
const EARLIEST = Date.UTC(2020, 0, 1)
const DAY_MS = 86400e3
/* Days a linked parent or professional can look back over. */
const TEEN_DAYS = 90

// Same keys as SHARING in src/app/store.js; every switch defaults to on.
// SHARE_NEEDS forces a dependent switch off when its score switch is off.
export const SHARE_KEYS = {
  parent: ['score', 'week', 'sleep', 'worn', 'settle'],
  pro: ['score', 'trends', 'raw', 'settle'],
}
const SHARE_NEEDS = { parent: { week: 'score' }, pro: { trends: 'score', raw: 'score' } }
// Usual band until a teen has 3 days of readings; matches USUAL in src/lib/readingLog.js.
const GENERAL_USUAL = { lo: 35, hi: 57, base: 46 }

function cleanReading(e, t = Date.now()) {
  if (!e || typeof e !== 'object') return null
  if (typeof e.id !== 'string' || !READING_ID.test(e.id)) return null
  if (typeof e.at !== 'number' || !Number.isFinite(e.at) || e.at < EARLIEST || e.at > t + DAY_MS) return null
  if (typeof e.score !== 'number' || !Number.isFinite(e.score) || e.score < 0 || e.score > 100) return null
  if (!READING_SOURCES.includes(e.source)) return null
  const out = { id: e.id, at: Math.round(e.at), score: Math.round(e.score), source: e.source }
  const note = typeof e.note === 'string' ? e.note.trim().slice(0, NOTE_MAX) : ''
  if (note) out.note = note
  return out
}

function cleanSharing(given = {}, base = null) {
  const out = {}
  for (const aud of Object.keys(SHARE_KEYS)) {
    const from = given && typeof given[aud] === 'object' && given[aud] ? given[aud] : {}
    const prev = base ? base[aud] : null
    const next = {}
    for (const k of SHARE_KEYS[aud]) next[k] = k in from ? from[k] === true : (prev ? prev[k] === true : true)
    for (const [k, needs] of Object.entries(SHARE_NEEDS[aud])) if (!next[needs]) next[k] = false
    out[aud] = next
  }
  return out
}

// tz is the phone's offset in minutes (Date#getTimezoneOffset), so days follow the teen's local calendar.
const dayOf = (at, tz) => new Date(at - tz * 60000).toISOString().slice(0, 10)

function dayFigures(items, tz) {
  const days = new Map()
  for (const r of items) {
    const k = dayOf(r.at, tz)
    if (!days.has(k)) days.set(k, [])
    days.get(k).push(r)
  }
  return [...days].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([date, rs]) => {
    const sources = { camera: 0, survey: 0, patch: 0 }
    rs.forEach(r => { sources[r.source] += 1 })
    const scores = rs.map(r => r.score)
    return { date, mean: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
             min: Math.min(...scores), max: Math.max(...scores), count: rs.length, sources }
  })
}

// Personal usual band: mean of the last 30 day means, plus or minus their SD (at least 5 points).
function usualOf(days) {
  const recent = days.slice(-30)
  if (recent.length < 3) return { ...GENERAL_USUAL, general: true }
  const m = recent.reduce((a, d) => a + d.mean, 0) / recent.length
  const sd = Math.sqrt(recent.reduce((a, d) => a + (d.mean - m) ** 2, 0) / recent.length)
  const spread = Math.max(5, Math.round(sd))
  const base = Math.round(m)
  return { lo: Math.max(0, base - spread), hi: Math.min(100, base + spread), base }
}

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

const pub = a => ({ id: a.id, name: a.name, role: a.role, avatar: a.avatar })
const me = a => ({ id: a.id, role: a.role, name: a.name, email: a.email, avatar: a.avatar,
                   setting: a.setting, createdAt: a.createdAt, lastSignInAt: a.lastSignInAt || null })

export function makeHandler({ kv }) {
  const K = {
    acct: id => 'acct:' + id,
    name: n => 'name:' + lower(n),
    email: e => 'email:' + cleanEmail(e),
    sess: t => 'sess:' + sha(t),
    // Set of session hashes per account, so every session can be ended at once.
    sessions: id => 'sessions:' + id,
    inv: c => 'inv:' + c,
    invby: id => 'invby:' + id,
    link: id => 'link:' + id,
    links: id => 'links:' + id,
    reads: id => 'reads:' + id,
    share: id => 'share:' + id,
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

  async function readsOf(id) {
    const r = await kv.get(K.reads(id))
    return r && Array.isArray(r.items) ? r : { tz: 0, items: [] }
  }
  async function sharingOf(id) {
    const s = await kv.get(K.share(id))
    return s ? { ...cleanSharing(s), set: true } : { ...cleanSharing({}), set: false }
  }

  // What a linked parent or pro sees: day figures only, filtered by the student's switches for that audience.
  // Notes, single readings and positions are not part of this shape.
  async function teenFor(student, audience) {
    const share = (await sharingOf(student.id))[audience]
    const out = { id: student.id, name: student.name, avatar: student.avatar, sharing: share, days: [] }
    if (!share.score) return out
    const { tz, items } = await readsOf(student.id)
    const from = Date.now() - TEEN_DAYS * DAY_MS
    let days = dayFigures(items.filter(r => r.at >= from), tz)
    const trend = audience === 'parent' ? share.week : share.trends
    if (trend && days.length) out.usual = usualOf(days)
    if (audience === 'pro' && !share.trends) days = days.slice(-1)
    const withSources = audience === 'pro' || share.worn
    out.days = days.map(d => (withSources ? d : { date: d.date, mean: d.mean, min: d.min, max: d.max, count: d.count }))
    if (audience === 'pro' && share.raw && items.length) out.latestAt = items[items.length - 1].at
    return out
  }

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
    const snap = { me: me(a), people, links, approvals, invite: invite ? { code: invite.code, expiresAt: invite.expiresAt } : null }
    if (a.role === 'student') {
      snap.readings = (await readsOf(a.id)).items
      snap.sharing = await sharingOf(a.id)
    }
    if (a.role === 'parent' || a.role === 'pro') {
      const kind = a.role === 'parent' ? 'parent-student' : 'pro-student'
      snap.teens = []
      for (const l of links) {
        if (l.kind !== kind || l.status !== 'active') continue
        const s = await getAccount(l.student)
        if (s) snap.teens.push(await teenFor(s, a.role))
      }
    }
    return snap
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
      // Name and email indexes are claimed with nx first, so two concurrent requests cannot take the same name.
      if ((await kv.set(K.name(name), id, { nx: true })) === null) return { ok: false, reason: 'taken' }
      if (email && (await kv.set(K.email(email), id, { nx: true })) === null) {
        await kv.del(K.name(name)); return { ok: false, reason: 'taken' }
      }
      const salt = randomBytes(16).toString('hex')
      const a = {
        id, role, name, email: email || null,
        avatar: avatarFor(role, b.avatar),
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
      if ('avatar' in b) a.avatar = b.avatar === null ? null : (avatarFor(a.role, b.avatar) ?? a.avatar)
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
      await kv.del(K.reads(a.id))
      await kv.del(K.share(a.id))
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

    async invite(s) {
      const a = s.a
      if (a.role !== 'parent' && a.role !== 'pro') return { ok: false, reason: 'role' }
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
      // parent-student and parent-pro links are active at once; pro-student waits for a linked parent to approve.
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
      return { ok: true, link, snapshot: await snapshot(a) }
    },

    // Merged by id; invalid rows are counted and dropped, and only the latest READING_CAP are kept.
    // tz must be a whole number of minutes within 14 h (840).
    async readings(s, b) {
      const a = s.a
      if (a.role !== 'student') return { ok: false, reason: 'role' }
      const entries = b.entries ?? []
      const remove = b.remove ?? []
      if (!Array.isArray(entries) || !Array.isArray(remove) || entries.length > READING_CAP) return { ok: false, reason: 'invalid' }
      const held = b.clear === true ? { tz: 0, items: [] } : await readsOf(a.id)
      const tz = Number.isInteger(b.tz) && Math.abs(b.tz) <= 840 ? b.tz : held.tz || 0
      const byId = new Map(held.items.map(r => [r.id, r]))
      for (const id of remove) byId.delete(String(id))
      let accepted = 0, rejected = 0
      const t = Date.now()
      for (const e of entries) {
        const c = cleanReading(e, t)
        if (c) { byId.set(c.id, c); accepted += 1 } else rejected += 1
      }
      const items = [...byId.values()].sort((x, y) => x.at - y.at).slice(-READING_CAP)
      await kv.set(K.reads(a.id), { tz, items })
      return { ok: true, accepted, rejected, snapshot: await snapshot(a) }
    },

    async sharing(s, b) {
      const a = s.a
      if (a.role !== 'student') return { ok: false, reason: 'role' }
      const held = await sharingOf(a.id)
      await kv.set(K.share(a.id), cleanSharing(b, held))
      return { ok: true, snapshot: await snapshot(a) }
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

  const hits = new Map()
  // Per-IP sliding window: more than RATE_MAX requests a minute get a 429.
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
    // ops is a plain object, so `constructor` would resolve through Object.prototype.
    if (!op || body.op === 'constructor') return send(res, 400, { ok: false, reason: 'op' })
    let session = null
    if (!OPEN.has(body.op)) {
      session = await auth(req)
      if (!session) return send(res, 401, { ok: false, reason: 'signedout' })
    }
    try {
      return send(res, 200, await op(session, body))
    } catch {
      // Constant message, so no request content reaches the logs.
      console.error('account: op failed')
      return send(res, 500, { ok: false, reason: 'server' })
    }
  }
}
