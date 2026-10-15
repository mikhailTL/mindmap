/* Serves dist/ with the account API on a memory store: the remote path end
 * to end on one machine, no Vercel and no Redis. `node tools/serve-with-api.mjs
 * [port]` after `npm run build`. Accounts last as long as the process. */
import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { makeHandler } from '../src/server/account.js'
import { memoryKV } from '../src/server/kv.js'

const port = Number(process.argv[2] || 4174)
const root = new URL('../dist/', import.meta.url).pathname
const api = makeHandler({ kv: memoryKV() })
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' }

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  if (url.pathname === '/api/account') return api(req, res)
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
  if (p === '/' || p === '') p = '/index.html'
  try {
    const f = join(root, p)
    const s = await stat(f)
    const body = await readFile(s.isDirectory() ? join(f, 'index.html') : f)
    res.setHeader('Content-Type', TYPES[extname(p)] || 'application/octet-stream')
    res.end(body)
  } catch {
    res.setHeader('Content-Type', TYPES['.html'])
    res.end(await readFile(join(root, 'index.html')))
  }
}).listen(port, '127.0.0.1', () => console.log('serving dist with /api/account on http://127.0.0.1:' + port))
