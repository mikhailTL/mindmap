import { describe, it, expect, beforeEach } from 'vitest'
import { memoryKV } from '../src/server/kv.js'
import { makeHandler, SHARE_KEYS, READING_SOURCES, READING_CAP } from '../src/server/account.js'
import { SHARING } from '../src/app/store.js'
import { SOURCES, CAP } from '../src/lib/readingLog.js'

/* The account API, driven through its handler with a memory store: the same
   code path production runs on Vercel KV, minus the network. */

function req(method, body, token, extra = {}) {
  return {
    method, body,
    headers: { host: 'test.local', ...(token ? { authorization: 'Bearer ' + token } : {}), ...extra },
    socket: { remoteAddress: '203.0.113.9' },
  }
}
function res() {
  const r = { statusCode: 0, headers: {}, body: null }
  r.setHeader = (k, v) => { r.headers[k] = v }
  r.end = s => { r.body = s ? JSON.parse(s) : null }
  return r
}

let kv, handler
const call = async (op, body = {}, token) => {
  const r = res(); await handler(req('POST', { op, ...body }, token), r); return r
}
const create = (over = {}) => call('create', {
  role: 'parent', name: 'Dana', email: 'dana@example.com', passcode: '1234', avatar: 'owl', ...over,
})

beforeEach(() => { kv = memoryKV(); handler = makeHandler({ kv }) })

describe('health', () => {
  it('GET says it is configured', async () => {
    const r = res(); await handler(req('GET'), r)
    expect(r.statusCode).toBe(200)
    expect(r.body).toMatchObject({ ok: true, configured: true })
  })
})

describe('create and sign in', () => {
  it('creates a parent and returns a token and a snapshot', async () => {
    const r = await create()
    expect(r.statusCode).toBe(200)
    expect(r.body.ok).toBe(true)
    expect(typeof r.body.token).toBe('string')
    expect(r.body.snapshot.me).toMatchObject({ name: 'Dana', role: 'parent', email: 'dana@example.com' })
    expect(r.body.snapshot.me.passHash).toBeUndefined()
  })
  it('refuses a parent without an email, a pro without a setting, a bad passcode', async () => {
    expect((await create({ email: '' })).body).toMatchObject({ ok: false, reason: 'email' })
    expect((await create({ role: 'pro', name: 'Lee' })).body).toMatchObject({ ok: false, reason: 'setting' })
    expect((await create({ passcode: '12' })).body).toMatchObject({ ok: false, reason: 'passcode' })
  })
  it('a student may have no email', async () => {
    const r = await create({ role: 'student', name: 'Sam', email: '' })
    expect(r.body.ok).toBe(true)
  })
  it('refuses a taken name or email, case-insensitively', async () => {
    await create()
    expect((await create({ name: 'dana', email: 'x@example.com' })).body.reason).toBe('taken')
    expect((await create({ name: 'Other', email: 'DANA@example.com' })).body.reason).toBe('taken')
  })
  it('signs in by name or email, refuses a wrong passcode', async () => {
    await create()
    expect((await call('signin', { who: 'dana@example.com', passcode: '1234' })).body.ok).toBe(true)
    expect((await call('signin', { who: 'Dana', passcode: '1234' })).body.ok).toBe(true)
    expect((await call('signin', { who: 'Dana', passcode: '9999' })).body).toMatchObject({ ok: false, reason: 'wrong' })
  })
  it('locks an account after five wrong passcodes', async () => {
    await create()
    for (let i = 0; i < 5; i++) await call('signin', { who: 'Dana', passcode: '0000' })
    expect((await call('signin', { who: 'Dana', passcode: '1234' })).body.reason).toBe('locked')
  })
  it('me returns the snapshot for a valid token and 401 for a bad one', async () => {
    const { body } = await create()
    const ok = await call('me', {}, body.token)
    expect(ok.body.snapshot.me.name).toBe('Dana')
    const bad = await call('me', {}, 'nope')
    expect(bad.statusCode).toBe(401)
  })
  it('signout revokes the token', async () => {
    const { body } = await create()
    await call('signout', {}, body.token)
    expect((await call('me', {}, body.token)).statusCode).toBe(401)
  })
  it('records the last sign-in time, and never an address', async () => {
    const { body } = await create()
    expect(body.snapshot.me.lastSignInAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    const first = body.snapshot.me.lastSignInAt
    await new Promise(r => setTimeout(r, 5))
    const again = (await call('signin', { who: 'Dana', passcode: '1234' })).body.snapshot.me
    expect(again.lastSignInAt > first).toBe(true)
    expect(JSON.stringify(again)).not.toMatch(/203\.0\.113|ip/i)
  })
  it('signout_all ends every other session and keeps the current one', async () => {
    const { body } = await create()
    const a = body.token
    const b = (await call('signin', { who: 'Dana', passcode: '1234' })).body.token
    const c = (await call('signin', { who: 'Dana', passcode: '1234' })).body.token
    expect(a !== b && b !== c).toBe(true)
    const r = await call('signout_all', {}, b)
    expect(r.body.ok).toBe(true)
    expect(r.body.ended).toBe(2)
    expect((await call('me', {}, a)).statusCode).toBe(401)
    expect((await call('me', {}, c)).statusCode).toBe(401)
    expect((await call('me', {}, b)).statusCode).toBe(200)
    /* Nothing left to end. */
    expect((await call('signout_all', {}, b)).body.ended).toBe(0)
  })
  it('delete ends every session for the account', async () => {
    const { body } = await create()
    const other = (await call('signin', { who: 'Dana', passcode: '1234' })).body.token
    expect((await call('delete', {}, body.token)).body.ok).toBe(true)
    expect((await call('me', {}, other)).statusCode).toBe(401)
    expect(await kv.smembers('sessions:' + body.snapshot.me.id)).toHaveLength(0)
  })
})

describe('profile and passcode', () => {
  it('updates name, email, avatar and setting with the same rules as create', async () => {
    const { body } = await create({ role: 'pro', name: 'Lee', email: 'lee@example.com', setting: 'school' })
    const r = await call('update', { name: 'Dr Lee', setting: 'practice', avatar: 'frog' }, body.token)
    expect(r.body.snapshot.me).toMatchObject({ name: 'Dr Lee', setting: 'practice', avatar: 'frog' })
    expect((await call('update', { avatar: 'sky-wave' }, body.token)).body.snapshot.me.avatar).toBe('frog')
    expect((await call('signin', { who: 'Dr Lee', passcode: '1234' })).body.ok).toBe(true)
    expect((await call('signin', { who: 'Lee', passcode: '1234' })).body.ok).toBe(false)
  })
  it('changes the passcode only with the old one', async () => {
    const { body } = await create()
    expect((await call('passcode', { old: '0000', next: '5678' }, body.token)).body.reason).toBe('wrong')
    expect((await call('passcode', { old: '1234', next: '5678' }, body.token)).body.ok).toBe(true)
    expect((await call('signin', { who: 'Dana', passcode: '5678' })).body.ok).toBe(true)
  })
})

describe('passwords, the Other role and every picture', () => {
  it('takes a password of 8 or more characters and still takes a 4 to 6 digit passcode', async () => {
    const r = await create({ passcode: 'correct horse 9!' })
    expect(r.body.ok).toBe(true)
    expect(JSON.stringify(r.body)).not.toContain('correct horse')
    expect((await call('signin', { who: 'Dana', passcode: 'correct horse 9!' })).body.ok).toBe(true)
    expect((await call('signin', { who: 'Dana', passcode: 'correct horse 9' })).body.reason).toBe('wrong')
    const old = await create({ name: 'Kim', email: 'kim@example.com', passcode: '4321' })
    expect(old.body.ok).toBe(true)
    expect((await call('signin', { who: 'Kim', passcode: '4321' })).body.ok).toBe(true)
  })
  it('refuses a secret of 7 characters, 7 digits, letters under 8, or over 128', async () => {
    for (const passcode of ['abcdefg', '1234567', 'abcd', '12', 'x'.repeat(129), '']) {
      expect((await create({ passcode })).body, passcode).toMatchObject({ ok: false, reason: 'passcode' })
    }
  })
  it('changes a passcode to a password only with the old one, and refuses a short one', async () => {
    const { body } = await create()
    expect((await call('passcode', { old: '1234', next: 'short' }, body.token)).body.reason).toBe('invalid')
    expect((await call('passcode', { old: '0000', next: 'longer password' }, body.token)).body.reason).toBe('wrong')
    expect((await call('passcode', { old: '1234', next: 'longer password' }, body.token)).body.ok).toBe(true)
    expect((await call('signin', { who: 'Dana', passcode: '1234' })).body.ok).toBe(false)
    expect((await call('signin', { who: 'Dana', passcode: 'longer password' })).body.ok).toBe(true)
  })
  it('a long wrong password still counts toward the lock', async () => {
    await create({ passcode: 'a good password' })
    for (let i = 0; i < 5; i++) await call('signin', { who: 'Dana', passcode: 'y'.repeat(500) })
    expect((await call('signin', { who: 'Dana', passcode: 'a good password' })).body.reason).toBe('locked')
  })
  it('makes an Other account that needs an email and can never link to anyone', async () => {
    expect((await create({ role: 'other', name: 'Robin', email: '' })).body.reason).toBe('email')
    const other = (await create({ role: 'other', name: 'Robin', email: 'robin@example.com' })).body
    expect(other.ok).toBe(true)
    expect(other.snapshot.me.role).toBe('other')
    const parent = (await create()).body
    await call('invite', {}, parent.token)
    const code = (await call('me', {}, parent.token)).body.snapshot.invite.code
    expect((await call('redeem', { code }, other.token)).body.reason).toBe('role')
    expect((await call('invite', {}, other.token)).body.reason).toBe('role')
    const mine = (await call('me', {}, other.token)).body.snapshot
    expect(mine.invite).toBeNull()
    expect(mine.people).toEqual([])
    expect(mine.links).toEqual([])
    expect(mine.approvals).toEqual([])
  })
  it('keeps any picture on the client list, and nothing else', async () => {
    const { body } = await create({ avatar: 'pat-stripes-ember' })
    expect(body.snapshot.me.avatar).toBe('pat-stripes-ember')
    expect((await call('update', { avatar: 'emo-rocket' }, body.token)).body.snapshot.me.avatar).toBe('emo-rocket')
    expect((await call('update', { avatar: 'sym-not-a-shape' }, body.token)).body.snapshot.me.avatar).toBe('emo-rocket')
    expect((await call('update', { avatar: 'fox' }, body.token)).body.snapshot.me.avatar).toBe('fox')
  })
  it('keeps an uploaded photo for a parent or a pro, never for a teen', async () => {
    const PHOTO = 'data:image/jpeg;base64,' + 'A'.repeat(400)
    const { body } = await create({ avatar: PHOTO })
    expect(body.snapshot.me.avatar).toBe(PHOTO)
    expect((await call('update', { avatar: 'owl' }, body.token)).body.snapshot.me.avatar).toBe('owl')
    expect((await call('update', { avatar: PHOTO }, body.token)).body.snapshot.me.avatar).toBe(PHOTO)
    const teen = (await create({ role: 'student', name: 'Sam', email: '', avatar: PHOTO })).body
    expect(teen.snapshot.me.avatar).toBeNull()
    expect((await call('update', { avatar: PHOTO }, teen.token)).body.snapshot.me.avatar).toBeNull()
  })
})

describe('invitations and links', () => {
  async function trio() {
    const parent = (await create()).body
    const student = (await create({ role: 'student', name: 'Sam', email: '' })).body
    const pro = (await create({ role: 'pro', name: 'Lee', email: 'lee@example.com', setting: 'school' })).body
    return { parent, student, pro }
  }
  it('a parent code links a student on redeem, active at once', async () => {
    const { parent, student } = await trio()
    const inv = (await call('invite', {}, parent.token)).body
    expect(inv.snapshot.invite.code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    const r = await call('redeem', { code: inv.snapshot.invite.code.toLowerCase() }, student.token)
    expect(r.body.ok).toBe(true)
    expect(r.body.snapshot.links[0]).toMatchObject({ kind: 'parent-student', status: 'active' })
    expect(r.body.snapshot.people.find(p => p.role === 'parent').name).toBe('Dana')
    /* The same teen again is already linked; a second teen joins too. */
    expect((await call('redeem', { code: inv.snapshot.invite.code }, student.token)).body.reason).toBe('exists')
    const alex = (await create({ role: 'student', name: 'Alex', email: '' })).body
    expect((await call('redeem', { code: inv.snapshot.invite.code }, alex.token)).body.ok).toBe(true)
    const theirs = (await call('me', {}, parent.token)).body.snapshot
    expect(theirs.links.filter(l => l.kind === 'parent-student')).toHaveLength(2)
    expect(theirs.invite.code).toBe(inv.snapshot.invite.code)
  })
  it('a teen cannot make an invite', async () => {
    const { student } = await trio()
    expect((await call('invite', {}, student.token)).body.reason).toBe('role')
  })
  it('a pro code waits for the parent, who approves it', async () => {
    const { parent, student, pro } = await trio()
    const pcode = (await call('invite', {}, parent.token)).body.snapshot.invite.code
    await call('redeem', { code: pcode }, student.token)
    const code = (await call('invite', {}, pro.token)).body.snapshot.invite.code
    const r = await call('redeem', { code }, student.token)
    expect(r.body.snapshot.links.find(l => l.kind === 'pro-student').status).toBe('pending')
    const waiting = (await call('me', {}, parent.token)).body.snapshot.approvals
    expect(waiting).toHaveLength(1)
    expect((await call('approve', { linkId: waiting[0].id }, student.token)).body.reason).toBe('forbidden')
    const ok = await call('approve', { linkId: waiting[0].id }, parent.token)
    expect(ok.body.ok).toBe(true)
    expect((await call('me', {}, pro.token)).body.snapshot.links[0].status).toBe('active')
  })
  it('two of one role never link; a parent and a pro link at once', async () => {
    const { parent, pro } = await trio()
    const other = (await create({ role: 'parent', name: 'Kim', email: 'kim@example.com' })).body
    const code = (await call('invite', {}, parent.token)).body.snapshot.invite.code
    expect((await call('redeem', { code }, other.token)).body.reason).toBe('role')
    expect((await call('redeem', { code }, pro.token)).body.snapshot.links[0]).toMatchObject({ kind: 'parent-pro', status: 'active' })
  })
  it('either side removes a link; deleting an account removes its links', async () => {
    const { parent, student } = await trio()
    const code = (await call('invite', {}, parent.token)).body.snapshot.invite.code
    const link = (await call('redeem', { code }, student.token)).body.snapshot.links[0]
    expect((await call('remove', { linkId: link.id }, parent.token)).body.ok).toBe(true)
    expect((await call('me', {}, student.token)).body.snapshot.links).toHaveLength(0)
    const code2 = (await call('invite', {}, parent.token)).body.snapshot.invite.code
    await call('redeem', { code: code2 }, student.token)
    expect((await call('delete', {}, parent.token)).body.ok).toBe(true)
    expect((await call('me', {}, parent.token)).statusCode).toBe(401)
    expect((await call('me', {}, student.token)).body.snapshot.links).toHaveLength(0)
    expect((await call('signin', { who: 'Dana', passcode: '1234' })).body.reason).toBe('wrong')
  })
})

describe('readings and sharing: what follows a teen and what the people they link see', () => {
  const NOW = Date.now()
  const H = 3600e3
  const entry = (id, over = {}) => ({ id, at: NOW - H, score: 50, source: 'survey', ...over })
  async function family() {
    const parent = (await create()).body
    const student = (await create({ role: 'student', name: 'Sam', email: '' })).body
    const pro = (await create({ role: 'pro', name: 'Lee', email: 'lee@example.com', setting: 'school' })).body
    const pcode = (await call('invite', {}, parent.token)).body.snapshot.invite.code
    await call('redeem', { code: pcode }, student.token)
    return { parent, student, pro }
  }
  async function linkPro({ parent, student, pro }, approve = true) {
    const code = (await call('invite', {}, pro.token)).body.snapshot.invite.code
    await call('redeem', { code }, student.token)
    if (approve) {
      const waiting = (await call('me', {}, parent.token)).body.snapshot.approvals
      await call('approve', { linkId: waiting[0].id }, parent.token)
    }
  }

  it('a student pushes readings, merged by id, and a second sign in gets them back', async () => {
    const { student } = await family()
    const r = await call('readings', { tz: 240, entries: [entry('a', { note: 'Test day' }), entry('b', { at: NOW - 2 * H, score: 40 })] }, student.token)
    expect(r.body.ok).toBe(true)
    expect(r.body.accepted).toBe(2)
    /* The same id again replaces; nothing is duplicated. */
    await call('readings', { entries: [entry('a', { score: 61, note: 'Test day' })] }, student.token)
    const again = (await call('signin', { who: 'Sam', passcode: '1234' })).body.snapshot
    expect(again.readings.map(e => e.id).sort()).toEqual(['a', 'b'])
    expect(again.readings.find(e => e.id === 'a')).toMatchObject({ score: 61, source: 'survey', note: 'Test day' })
  })
  it('refuses bad entries: score outside 0 to 100, unknown source, bad id or time', async () => {
    const { student } = await family()
    const r = await call('readings', { entries: [
      entry('ok'), entry('hi', { score: 101 }), entry('lo', { score: -1 }), entry('str', { score: '50' }),
      entry('src', { source: 'mic' }), entry('', {}), entry('t', { at: 'yesterday' }), entry('fut', { at: NOW + 3 * 86400e3 }),
      { ...entry('x'.repeat(80)) },
    ] }, student.token)
    expect(r.body).toMatchObject({ ok: true, accepted: 1, rejected: 8 })
    expect(r.body.snapshot.readings.map(e => e.id)).toEqual(['ok'])
    expect((await call('readings', { entries: 'nope' }, student.token)).body.reason).toBe('invalid')
  })
  it('keeps the most recent 500, removes by id, and clears', async () => {
    const { student } = await family()
    const many = Array.from({ length: 520 }, (_, i) => entry('r' + i, { at: NOW - (520 - i) * 60000 }))
    for (let i = 0; i < many.length; i += 130) await call('readings', { entries: many.slice(i, i + 130) }, student.token)
    let snap = (await call('me', {}, student.token)).body.snapshot
    expect(snap.readings).toHaveLength(500)
    expect(snap.readings.some(e => e.id === 'r0')).toBe(false)
    expect(snap.readings.some(e => e.id === 'r519')).toBe(true)
    snap = (await call('readings', { remove: ['r519'] }, student.token)).body.snapshot
    expect(snap.readings.some(e => e.id === 'r519')).toBe(false)
    snap = (await call('readings', { clear: true }, student.token)).body.snapshot
    expect(snap.readings).toEqual([])
  })
  it('only a student pushes readings or sharing', async () => {
    const { parent, pro } = await family()
    expect((await call('readings', { entries: [entry('a')] }, parent.token)).body.reason).toBe('role')
    expect((await call('sharing', { parent: { score: true } }, pro.token)).body.reason).toBe('role')
  })
  it('sharing starts with every switch on, is stored, and keeps a trend under its score', async () => {
    const { student } = await family()
    const first = (await call('me', {}, student.token)).body.snapshot.sharing
    expect(first.parent).toEqual({ score: true, week: true, sleep: true, worn: true, settle: true })
    expect(first.pro).toEqual({ score: true, trends: true, raw: true, settle: true })
    expect(first.set).toBe(false)
    const r = await call('sharing', { parent: { score: false, week: true, sleep: 'yes' }, pro: { raw: false } }, student.token)
    expect(r.body.snapshot.sharing.parent).toMatchObject({ score: false, week: false, sleep: false, worn: true })
    expect(r.body.snapshot.sharing.pro).toMatchObject({ score: true, trends: true, raw: false })
    expect(r.body.snapshot.sharing.set).toBe(true)
  })
  it('a linked parent sees day figures only: no notes, no single readings, no times', async () => {
    const { parent, student } = await family()
    await call('readings', { tz: 0, entries: [
      entry('a', { score: 40, note: 'Secret' }), entry('b', { score: 60, source: 'patch' }),
    ] }, student.token)
    const snap = (await call('me', {}, parent.token)).body.snapshot
    expect(snap.teens).toHaveLength(1)
    const t = snap.teens[0]
    expect(t).toMatchObject({ id: student.snapshot.me.id, name: 'Sam' })
    expect(t.sharing).toMatchObject({ score: true })
    const today = new Date(NOW - H).toISOString().slice(0, 10)
    expect(t.days).toEqual([{ date: today, mean: 50, min: 40, max: 60, count: 2, sources: { camera: 0, survey: 1, patch: 1 } }])
    const raw = JSON.stringify(t)
    expect(raw).not.toContain('Secret')
    expect(raw).not.toMatch(/"at"|latestAt|"note"|"id":"a"/)
    expect(snap.readings).toBeUndefined()
  })
  it('a switch the teen turned off is not sent', async () => {
    const { parent, student } = await family()
    await call('readings', { tz: 0, entries: [entry('a')] }, student.token)
    await call('sharing', { parent: { worn: false, week: false } }, student.token)
    let t = (await call('me', {}, parent.token)).body.snapshot.teens[0]
    expect(t.days[0].sources).toBeUndefined()
    expect(t.usual).toBeUndefined()
    await call('sharing', { parent: { score: false } }, student.token)
    t = (await call('me', {}, parent.token)).body.snapshot.teens[0]
    expect(t.days).toEqual([])
    expect(t.sharing.score).toBe(false)
  })
  it('a pro sees nothing while the link waits, and days once a parent approves', async () => {
    const f = await family()
    await call('readings', { tz: 0, entries: [entry('a', { score: 70 })] }, f.student.token)
    await linkPro(f, false)
    expect((await call('me', {}, f.pro.token)).body.snapshot.teens).toEqual([])
    const waiting = (await call('me', {}, f.parent.token)).body.snapshot.approvals
    await call('approve', { linkId: waiting[0].id }, f.parent.token)
    const t = (await call('me', {}, f.pro.token)).body.snapshot.teens[0]
    expect(t.days[0]).toMatchObject({ mean: 70, count: 1 })
    expect(t.latestAt).toBe(NOW - H)
    expect(JSON.stringify(t)).not.toContain('"note"')
  })
  it('a declined pro link gets nothing; a pro without raw gets no reading time; without trends one day only', async () => {
    const f = await family()
    await call('readings', { tz: 0, entries: [entry('a', { score: 30, at: NOW - 3 * 86400e3 }), entry('b', { score: 70 })] }, f.student.token)
    await linkPro(f)
    await call('sharing', { pro: { raw: false, trends: false } }, f.student.token)
    const t = (await call('me', {}, f.pro.token)).body.snapshot.teens[0]
    expect(t.latestAt).toBeUndefined()
    expect(t.days).toHaveLength(1)
    expect(t.days[0].mean).toBe(70)
    expect(t.usual).toBeUndefined()

    const g = { ...f, pro: (await create({ role: 'pro', name: 'Ira', email: 'ira@example.com', setting: 'practice' })).body }
    await linkPro(g, false)
    const waiting = (await call('me', {}, f.parent.token)).body.snapshot.approvals
    await call('decline', { linkId: waiting[0].id }, f.parent.token)
    expect((await call('me', {}, g.pro.token)).body.snapshot.teens).toEqual([])
  })
  it('a usual range comes from the teen’s own days once there are three', async () => {
    const { parent, student } = await family()
    await call('readings', { tz: 0, entries: [entry('a', { score: 40 })] }, student.token)
    let t = (await call('me', {}, parent.token)).body.snapshot.teens[0]
    expect(t.usual).toMatchObject({ general: true, lo: 35, hi: 57 })
    await call('readings', { entries: [
      entry('b', { score: 44, at: NOW - 2 * 86400e3 }), entry('c', { score: 48, at: NOW - 3 * 86400e3 }),
    ] }, student.token)
    t = (await call('me', {}, parent.token)).body.snapshot.teens[0]
    expect(t.usual.general).toBeUndefined()
    expect(t.usual.base).toBe(44)
    expect(t.usual.lo).toBeLessThan(44)
    expect(t.usual.hi).toBeGreaterThan(44)
  })
  it('deleting a student removes their readings and sharing', async () => {
    const { student } = await family()
    const id = student.snapshot.me.id
    await call('readings', { entries: [entry('a')] }, student.token)
    await call('sharing', { parent: { score: false } }, student.token)
    await call('delete', {}, student.token)
    expect(await kv.get('reads:' + id)).toBeNull()
    expect(await kv.get('share:' + id)).toBeNull()
  })
})

describe('the server and the app agree', () => {
  it('on the sharing keys and their nesting, the reading sources and the cap', () => {
    for (const aud of Object.keys(SHARING)) {
      expect(SHARE_KEYS[aud]).toEqual(SHARING[aud].fields.map(f => f.key))
    }
    expect(READING_SOURCES).toEqual([...SOURCES])
    expect(READING_CAP).toBe(CAP)
  })
})
