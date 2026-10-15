/* Proves the account API works against the real store: run with the env
 * pulled from Vercel (`npx vercel env pull .env.local`), then
 * `node --env-file=.env.local tools/kv-smoke.mjs`. Creates and deletes one
 * throwaway account; prints each step. */
import { vercelKV } from '../src/server/kv.js'
import { makeHandler } from '../src/server/account.js'

const kv = await vercelKV()
if (!kv) { console.log('no KV env; nothing to test'); process.exit(1) }
const h = makeHandler({ kv })
const call = (body, token) => new Promise(resolve => {
  const res = { statusCode: 0, setHeader() {}, end: s => resolve({ status: res.statusCode, body: JSON.parse(s) }) }
  h({ method: 'POST', body, headers: { host: 'x', ...(token ? { authorization: 'Bearer ' + token } : {}) }, socket: {} }, res)
})
const name = 'smoke-' + Date.now().toString(36)
const c = await call({ op: 'create', role: 'student', name, passcode: '1234' })
console.log('create', c.status, c.body.ok)
const m = await call({ op: 'me' }, c.body.token)
console.log('me', m.status, m.body.snapshot?.me?.name === name)
const d = await call({ op: 'delete' }, c.body.token)
console.log('delete', d.status, d.body.ok)
const g = await call({ op: 'signin', who: name, passcode: '1234' })
console.log('gone', g.body.reason === 'wrong')
