/* MindMap AI. A proxy in front of Anthropic's Messages API, so the key stays
 * on the server and the system prompt cannot be replaced by the page.
 *
 * Four invariants, each easy to break quietly:
 *
 * 1. The key is read from process.env.ANTHROPIC_API_KEY and from nowhere else.
 *    It is never in this repository, never in the client bundle, never in a
 *    response body and never in a log line. There is no code path that prints
 *    it, not even truncated.
 * 2. With no key set, GET returns configured: false and POST refuses with 503
 *    and configured: false. The screen renders that as "not connected yet" and
 *    offers no input, so an unconfigured deploy cannot look like it answered.
 * 3. The system prompt is built here, from src/ai/framework.js, for the
 *    audience the request names. A `system` field in the request body is
 *    ignored. The client chooses an audience, never the rules.
 * 4. Message content never goes to stdout. Errors log a fixed string, and no
 *    error response carries any part of the request that caused it.
 *
 * Storage: none. There is no KV, no file and no module-level transcript. The
 * only thing a message is used for is the one upstream call it is part of.
 */

import { AUDIENCES, MODEL_DEFAULT, systemPrompt } from '../src/ai/framework.js'

const UPSTREAM = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

/* Sized to the feature, not to round numbers: a reply is capped at about 120
 * words, a question a teenager types on a phone is rarely past 600 characters,
 * and a useful thread is a dozen turns. */
const MAX_BYTES = 24 * 1024
const MAX_TURNS = 24
const MAX_CHARS = 1200
const MAX_TOKENS = 800
const UPSTREAM_TIMEOUT_MS = 28000

/* Per-instance, so it does not stop a flood spread across instances. It stops
 * the realistic failure: a page stuck in a retry loop, and a single visitor
 * spending the owner's key faster than he can notice. */
const RATE_WINDOW_MS = 60000
const RATE_MAX = 12
const hits = new Map()

function send(res, code, body) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(JSON.stringify(body))
}

/* Access-Control-Allow-Origin is never sent, so a cross-origin read already
 * fails. This also refuses cross-origin writes, which a missing CORS header
 * would let through unread. Matches api/responses.js. */
function sameOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true
  const host = req.headers['x-forwarded-host'] || req.headers.host
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function clientId(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '')
  return fwd.split(',')[0].trim() || String(req.socket?.remoteAddress || 'unknown')
}

function rateLimited(id) {
  const now = Date.now()
  const seen = (hits.get(id) || []).filter(t => now - t < RATE_WINDOW_MS)
  seen.push(now)
  hits.set(id, seen)
  /* Unbounded growth is its own denial of service. */
  if (hits.size > 2000) {
    for (const [k, v] of hits) {
      if (!v.length || now - v[v.length - 1] > RATE_WINDOW_MS) hits.delete(k)
    }
  }
  return seen.length > RATE_MAX
}

/* Strips control characters and caps length. Not an HTML escape. */
function str(v, max) {
  if (v == null) return ''
  return String(v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ').trim().slice(0, max)
}

async function readBody(req) {
  const declared = Number(req.headers['content-length'] || 0)
  if (declared > MAX_BYTES) return { tooBig: true }

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
      if (size > MAX_BYTES) return { tooBig: true }
      chunks.push(chunk)
    }
  } catch {
    return { bad: true }
  }
  if (!size) return { bad: true }
  try { return { data: JSON.parse(Buffer.concat(chunks).toString('utf8')) } } catch { return { bad: true } }
}

/* A turn is a role and a string. Anything else is not a shape this page
 * produces, and the upstream alternation is rebuilt rather than trusted. */
function turns(raw) {
  if (!Array.isArray(raw)) return null
  const out = []
  for (const m of raw.slice(-MAX_TURNS)) {
    if (!m || typeof m !== 'object') continue
    const role = m.role === 'assistant' ? 'assistant' : 'user'
    const content = str(m.content, MAX_CHARS)
    if (!content) continue
    /* Collapse a repeated role rather than sending an invalid sequence. */
    if (out.length && out[out.length - 1].role === role) {
      out[out.length - 1].content += '\n\n' + content
    } else {
      out.push({ role, content })
    }
  }
  /* Anthropic requires the first turn to be a user turn. */
  while (out.length && out[0].role !== 'user') out.shift()
  return out.length ? out : null
}

/* One shape for "not connected", used by both methods, so the page has exactly
 * one unconfigured state to render. */
const NOT_CONFIGURED = {
  ok: false,
  configured: false,
  error: 'MindMap AI is not connected. No model key is set on this deployment, so nothing here is answering.',
}

export default async function handler(req, res) {
  if (!sameOrigin(req)) {
    return send(res, 403, { ok: false, error: 'Cross-origin requests are not accepted.' })
  }

  const key = process.env.ANTHROPIC_API_KEY
  const model = String(process.env.ANTHROPIC_MODEL || MODEL_DEFAULT)
  const configured = Boolean(key && key.trim())

  /* The page asks this before it draws a composer. 200 either way: an
   * unconfigured deployment is a state to render honestly, not a failure. */
  if (req.method === 'GET') {
    return send(res, 200, {
      ok: true,
      configured,
      model: configured ? model : null,
      audiences: Object.keys(AUDIENCES),
      limits: { turns: MAX_TURNS, chars: MAX_CHARS, perMinute: RATE_MAX },
    })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return send(res, 405, { ok: false, error: 'Only GET and POST are supported.' })
  }

  if (!configured) return send(res, 503, NOT_CONFIGURED)

  const body = await readBody(req)
  if (body.tooBig) {
    return send(res, 413, { ok: false, configured, error: 'That message is larger than this endpoint accepts.' })
  }
  if (body.bad || !body.data || typeof body.data !== 'object') {
    return send(res, 400, { ok: false, configured, error: 'Expected a JSON object with an audience and a messages array.' })
  }

  const audience = AUDIENCES[body.data.audience] ? body.data.audience : null
  if (!audience) {
    return send(res, 400, { ok: false, configured, error: 'That audience is not one of the three MindMap AI answers for.' })
  }
  const messages = turns(body.data.messages)
  if (!messages) {
    return send(res, 400, { ok: false, configured, error: 'No message in that request had usable text.' })
  }

  if (rateLimited(clientId(req))) {
    res.setHeader('Retry-After', '60')
    return send(res, 429, {
      ok: false, configured,
      error: 'Too many messages in a minute. Wait a moment and send it again.',
    })
  }

  /* Built here, from the framework file, for the audience the body named. A
   * `system` field in the request is ignored on purpose. */
  const system = systemPrompt(audience)

  const control = new AbortController()
  const timer = setTimeout(() => control.abort(), UPSTREAM_TIMEOUT_MS)
  let upstream
  try {
    upstream = await fetch(UPSTREAM, {
      method: 'POST',
      signal: control.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        temperature: 0.4,
        system,
        messages,
      }),
    })
  } catch (err) {
    clearTimeout(timer)
    /* Fixed strings only. The error object can carry the request. */
    if (err?.name === 'AbortError') {
      console.error('mindmap-ai: upstream timed out')
      return send(res, 504, {
        ok: false, configured,
        error: 'The model did not answer in time. Sending it again usually works.',
      })
    }
    console.error('mindmap-ai: upstream unreachable')
    return send(res, 502, {
      ok: false, configured,
      error: 'The model could not be reached from the server.',
    })
  }
  clearTimeout(timer)

  if (!upstream.ok) {
    /* The upstream body can quote the request back, so it is read for a type
     * and a status and then dropped. Nothing from it is forwarded. */
    let kind = ''
    try {
      const payload = await upstream.json()
      kind = String(payload?.error?.type || '')
    } catch {
      kind = ''
    }
    console.error('mindmap-ai: upstream status ' + upstream.status + (kind ? ' ' + kind : ''))

    if (upstream.status === 429) {
      const retry = upstream.headers.get('retry-after')
      if (retry) res.setHeader('Retry-After', retry)
      return send(res, 429, {
        ok: false, configured,
        error: 'The model is rate limited right now. Wait a moment and send it again.',
      })
    }
    if (upstream.status === 401 || upstream.status === 403) {
      return send(res, 502, {
        ok: false, configured,
        error: 'The server key was refused by the model provider. MindMap AI cannot answer until it is replaced.',
      })
    }
    if (upstream.status === 404) {
      return send(res, 502, {
        ok: false, configured,
        error: 'The configured model name was not recognised by the provider.',
      })
    }
    if (upstream.status === 400) {
      return send(res, 400, {
        ok: false, configured,
        error: 'The model refused the shape of that request.',
      })
    }
    return send(res, 502, {
      ok: false, configured,
      error: 'The model returned an error. Nothing was answered.',
    })
  }

  let reply = ''
  try {
    const payload = await upstream.json()
    reply = (payload?.content || [])
      .filter(b => b?.type === 'text')
      .map(b => String(b.text || ''))
      .join('')
      .trim()
  } catch {
    console.error('mindmap-ai: upstream body unreadable')
    return send(res, 502, { ok: false, configured, error: 'The model reply could not be read.' })
  }

  if (!reply) {
    return send(res, 502, { ok: false, configured, error: 'The model returned an empty reply.' })
  }

  return send(res, 200, { ok: true, configured, model, reply })
}
