// Survey backend: POST upserts one reviewer's answers, GET returns all of them.
// Without a KV store it falls back to an in-memory Map and marks every response
// `ephemeral: true`. Answer content is never logged.

const STORE_KEY = 'mindmap:responses'

// 40 answers is twice the question count; 16 KB is about four times the largest submission.
const MAX_BYTES = 16 * 1024
const MAX_ANSWERS = 40
const MAX_RESPONDENTS = 500
const LIMIT = {
  id: 64, name: 60, page: 32, qid: 64, kind: 16,
  label: 160, value: 600, iso: 40,
}

// Per-instance rate limit: catches a page stuck in a retry loop.
const RATE_WINDOW_MS = 60000
const RATE_MAX = 40

// Module scope only survives between invocations on a warm instance.
const memory = new Map()
const hits = new Map()

let kvPromise = null

// Guarded import: without @vercel/kv the build still succeeds and uses memory storage.
async function getKV() {
  if (!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)) return null
  if (!kvPromise) {
    kvPromise = (async () => {
      try {
        const mod = await import('@vercel/kv')
        return mod?.kv || null
      } catch {
        return null
      }
    })()
  }
  return kvPromise
}

function send(res, code, body) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  // Never cache responses.
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(JSON.stringify(body))
}

// No CORS header is sent, and cross-origin writes are refused as well.
function sameOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true /* same-origin fetches and server-side calls send none */
  const host = req.headers['x-forwarded-host'] || req.headers.host
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

// Constant-time comparison for the shared key.
function keyMatches(given, expected) {
  const a = String(given || '')
  const b = String(expected || '')
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// Strips control characters and caps length so a value cannot break a CSV row or a log line.
function str(v, max) {
  if (v == null) return ''
  return String(v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max)
}

function isoOrNow(v) {
  const s = str(v, LIMIT.iso)
  const t = Date.parse(s)
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString()
}

// A value is a number, a string, or the impact question's { score, note }.
function value(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') return str(v, LIMIT.value)
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const score = typeof v.score === 'number' && Number.isFinite(v.score)
      ? v.score
      : str(v.score, LIMIT.kind)
    return { score, note: str(v.note, LIMIT.value) }
  }
  return null
}

function answer(a) {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return null
  const page = str(a.page, LIMIT.page)
  const qid = str(a.qid, LIMIT.qid)
  if (!page || !qid) return null
  return {
    page,
    qid,
    kind: str(a.kind, LIMIT.kind),
    value: value(a.value),
    label: a.label == null ? null : str(a.label, LIMIT.label),
    at: isoOrNow(a.at),
  }
}

async function readBody(req) {
  const declared = Number(req.headers['content-length'] || 0)
  if (declared > MAX_BYTES) return { tooBig: true }

  // Vercel's Node helpers may already have parsed the body.
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return { data: req.body }
  }
  const preparsed = typeof req.body === 'string'
    ? req.body
    : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : null
  if (preparsed != null) {
    if (Buffer.byteLength(preparsed) > MAX_BYTES) return { tooBig: true }
    try { return { data: JSON.parse(preparsed) } } catch { return { bad: true } }
  }

  let size = 0
  const chunks = []
  try {
    for await (const chunk of req) {
      size += chunk.length
      // Count bytes as they arrive: Content-Length can be missing or wrong.
      if (size > MAX_BYTES) return { tooBig: true }
      chunks.push(chunk)
    }
  } catch {
    return { bad: true }
  }
  if (!size) return { bad: true }
  try { return { data: JSON.parse(Buffer.concat(chunks).toString('utf8')) } } catch { return { bad: true } }
}

function rateLimited(id) {
  const now = Date.now()
  const seen = (hits.get(id) || []).filter(t => now - t < RATE_WINDOW_MS)
  seen.push(now)
  hits.set(id, seen)
  // Drop cold entries once the table passes any plausible reviewer count.
  if (hits.size > 2000) {
    for (const [k, v] of hits) {
      if (!v.length || now - v[v.length - 1] > RATE_WINDOW_MS) hits.delete(k)
    }
  }
  return seen.length > RATE_MAX
}

// Storage

async function readAll(kv) {
  if (!kv) return [...memory.values()]
  const all = await kv.hgetall(STORE_KEY)
  if (!all) return []
  return Object.values(all).map(v => {
    if (typeof v === 'string') { try { return JSON.parse(v) } catch { return null } }
    return v
  }).filter(Boolean)
}

async function readOne(kv, id) {
  if (!kv) return memory.get(id) || null
  const v = await kv.hget(STORE_KEY, id)
  if (typeof v === 'string') { try { return JSON.parse(v) } catch { return null } }
  return v || null
}

async function writeOne(kv, id, record) {
  if (!kv) {
    // Memory storage has no eviction, so cap it here.
    if (!memory.has(id) && memory.size >= MAX_RESPONDENTS) return false
    memory.set(id, record)
    return true
  }
  await kv.hset(STORE_KEY, { [id]: record })
  return true
}

// Handler

export default async function handler(req, res) {
  if (!sameOrigin(req)) {
    return send(res, 403, { ok: false, error: 'Cross-origin requests are not accepted.' })
  }

  const kv = await getKV()
  const ephemeral = !kv
  const storage = kv ? 'kv' : 'memory'

  if (req.method === 'GET') {
    // The read key is only in the server env and the results URL.
    const expected = process.env.RESPONSES_KEY
    if (expected && !keyMatches(req.headers['x-responses-key'], expected)) {
      return send(res, 403, { ok: false, error: 'A valid key is required to read responses.' })
    }
    let records
    try {
      records = await readAll(kv)
    } catch {
      console.error('responses: read failed')
      return send(res, 502, { ok: false, error: 'The response store could not be read.' })
    }
    records.sort((a, b) => String(a?.startedAt || '').localeCompare(String(b?.startedAt || '')))
    return send(res, 200, {
      ok: true,
      ephemeral,
      storage,
      count: records.length,
      respondents: records,
    })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return send(res, 405, { ok: false, error: 'Only GET and POST are supported.' })
  }

  const body = await readBody(req)
  if (body.tooBig) {
    return send(res, 413, { ok: false, error: 'That submission is larger than this endpoint accepts.' })
  }
  if (body.bad || !body.data || typeof body.data !== 'object') {
    return send(res, 400, { ok: false, error: 'Expected a JSON object with a visitor and an answers array.' })
  }

  const { visitor, answers } = body.data
  if (!visitor || typeof visitor !== 'object' || Array.isArray(visitor) || !Array.isArray(answers)) {
    return send(res, 400, { ok: false, error: 'Expected a JSON object with a visitor and an answers array.' })
  }
  const id = str(visitor.id, LIMIT.id)
  if (!id) return send(res, 400, { ok: false, error: 'The visitor record has no usable id.' })
  if (answers.length > MAX_ANSWERS) {
    return send(res, 400, { ok: false, error: 'That submission carries more answers than the survey has questions.' })
  }
  const clean = answers.map(answer).filter(Boolean)
  if (!clean.length) {
    return send(res, 400, { ok: false, error: 'No answer in that submission had a usable shape.' })
  }

  if (rateLimited(id)) {
    res.setHeader('Retry-After', '60')
    return send(res, 429, { ok: false, error: 'Too many submissions from this visitor. Try again in a minute.' })
  }

  try {
    // Upsert so a reviewer who re-syncs stays one row; one browser is the only writer per key.
    const prev = await readOne(kv, id)
    const merged = new Map((prev?.answers || []).map(a => [a.page + '/' + a.qid, a]))
    clean.forEach(a => merged.set(a.page + '/' + a.qid, a))
    const record = {
      id,
      name: str(visitor.name, LIMIT.name) || prev?.name || 'Anonymous',
      startedAt: prev?.startedAt || isoOrNow(visitor.startedAt),
      updatedAt: new Date().toISOString(),
      answers: [...merged.values()],
    }
    const stored = await writeOne(kv, id, record)
    if (!stored) {
      return send(res, 507, { ok: false, error: 'The in-memory store is full. Configure a KV store.' })
    }
  } catch {
    console.error('responses: write failed')
    return send(res, 502, { ok: false, error: 'The response store could not be written.' })
  }

  return send(res, 200, { ok: true, ephemeral, storage, saved: clean.length })
}
