// Account API. The logic lives in src/server/account.js so tests can run it on a memory store.
import { makeHandler } from '../src/server/account.js'
import { vercelKV } from '../src/server/kv.js'

let handlerPromise = null

export default async function handler(req, res) {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const kv = await vercelKV()
      return kv ? makeHandler({ kv }) : null
    })()
  }
  const h = await handlerPromise
  if (!h) {
    res.statusCode = req.method === 'GET' ? 200 : 503
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.end(JSON.stringify({ ok: req.method === 'GET', configured: false }))
  }
  return h(req, res)
}
