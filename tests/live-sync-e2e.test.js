import { describe, it, expect, beforeAll } from 'vitest'
import { memoryKV } from '../src/server/kv.js'
import { makeHandler } from '../src/server/account.js'

const kv = memoryKV()
const handler = makeHandler({ kv })
let n = 0
async function api(path, opts = {}) {
  const body = opts.body ? JSON.parse(opts.body) : undefined
  const req = { method: opts.method || 'GET', body,
    headers: { host: 'test.local', ...(opts.headers?.Authorization ? { authorization: opts.headers.Authorization } : {}) },
    socket: { remoteAddress: '198.51.100.' + (n++ % 200) } }
  let out = null, status = 0
  const res = { setHeader() {}, set statusCode(v) { status = v }, get statusCode() { return status }, end: s => { out = s } }
  await handler(req, res)
  return { ok: status < 400, status, json: async () => JSON.parse(out) }
}
const direct = async (op, body = {}, token) => (await api('/api/account', {
  method: 'POST', body: JSON.stringify({ op, ...body }), headers: token ? { Authorization: 'Bearer ' + token } : {} })).json()

beforeAll(() => {
  const m = new Map()
  const et = new EventTarget()
  globalThis.window = globalThis
  globalThis.localStorage = { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }
  globalThis.addEventListener = et.addEventListener.bind(et)
  globalThis.removeEventListener = et.removeEventListener.bind(et)
  globalThis.dispatchEvent = et.dispatchEvent.bind(et)
  globalThis.fetch = api
})

const sleep = ms => new Promise(r => setTimeout(r, ms))

describe('a student’s reading reaches their linked parent', () => {
  it('signs up, links, takes a survey reading, and the parent sees today’s mean after a refresh', async () => {
    const store = await import('../src/account/store.js')
    const log = await import('../src/lib/readingLog.js')
    const { toTeen, liveSummary } = await import('../src/views/family/live.js')
    expect(await store.ready()).toBe('remote')
    await sleep(20)

    const parent = await direct('create', { role: 'parent', name: 'Dana', email: 'dana@example.com', passcode: '1234' })
    const code = (await direct('invite', {}, parent.token)).snapshot.invite.code

    const made = await store.createAccount({ role: 'student', name: 'Sam', passcode: '2468' })
    expect(made.ok).toBe(true)
    expect((await store.redeemInvite(code)).ok).toBe(true)

    log.addReading({ score: 58, source: 'survey' })
    log.addReading({ score: 44, source: 'survey' })
    await sleep(1900)

    const snap = (await direct('me', {}, parent.token)).snapshot
    expect(snap.teens).toHaveLength(1)
    const teen = toTeen(snap.teens[0], 'parent')
    expect(teen.name).toBe('Sam')
    expect(liveSummary(teen, 'day').mean).toBe(51)
    expect(snap.teens[0].days.at(-1)).toMatchObject({ count: 2, min: 44, max: 58 })

    const own = (await direct('signin', { who: 'Sam', passcode: '2468' })).snapshot
    expect(own.readings.map(r => r.score).sort()).toEqual([44, 58])
    expect(own.sharing.parent.score).toBe(true)

    /* A switch turned off on the student's side stops the days. */
    const app = await import('../src/app/store.js')
    app.setShared('parent', 'score', false)
    await sleep(900)
    const after = (await direct('me', {}, parent.token)).snapshot.teens[0]
    expect(after.days).toEqual([])
  }, 10000)
})
