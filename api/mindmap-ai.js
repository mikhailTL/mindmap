// Proxy in front of Google's Gemini API or Anthropic's Messages API. Keys come only from
// GEMINI_API_KEY or ANTHROPIC_API_KEY, the system prompt is built here from src/ai/framework.js,
// and message content is never logged or stored.

import { AUDIENCES, MODEL_DEFAULT, systemPrompt } from '../src/ai/framework.js'

const UPSTREAM = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

// Limits: replies of about 120 words, phone-length questions, a dozen turns.
const MAX_BYTES = 24 * 1024
const MAX_TURNS = 24
const MAX_CHARS = 1200
const MAX_TOKENS = 800
const UPSTREAM_TIMEOUT_MS = 28000

// Per-instance rate limit: catches a page stuck in a retry loop, not a distributed flood.
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

// No CORS header is sent, and cross-origin writes are refused as well.
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
  // Bound the table so it cannot grow without limit.
  if (hits.size > 2000) {
    for (const [k, v] of hits) {
      if (!v.length || now - v[v.length - 1] > RATE_WINDOW_MS) hits.delete(k)
    }
  }
  return seen.length > RATE_MAX
}

// Strips control characters and caps length (not an HTML escape).
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

// Rebuilds a valid user/assistant alternation from the posted turns.
function turns(raw) {
  if (!Array.isArray(raw)) return null
  const out = []
  for (const m of raw.slice(-MAX_TURNS)) {
    if (!m || typeof m !== 'object') continue
    const role = m.role === 'assistant' ? 'assistant' : 'user'
    const content = str(m.content, MAX_CHARS)
    if (!content) continue
    // Merge consecutive turns from the same role.
    if (out.length && out[out.length - 1].role === role) {
      out[out.length - 1].content += '\n\n' + content
    } else {
      out.push({ role, content })
    }
  }
  // The API requires the first turn to be from the user.
  while (out.length && out[0].role !== 'user') out.shift()
  return out.length ? out : null
}

// Shared "not configured" response for GET and POST.
const NOT_CONFIGURED = {
  ok: false,
  configured: false,
  error: 'MindMap AI is not connected. No model key is set on this deployment, so nothing here is answering.',
}

// Gemini is used when GEMINI_API_KEY is set; otherwise Anthropic when ANTHROPIC_API_KEY is set.
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/'
const GEMINI_DEFAULT = 'gemini-3.8-flash'
// Tried in order when the configured model errors on the provider's side.
const GEMINI_FALLBACKS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash']

function provider() {
  const gemini = String(process.env.GEMINI_API_KEY || '').trim()
  if (gemini) return { name: 'gemini', key: gemini, model: String(process.env.GEMINI_MODEL || GEMINI_DEFAULT) }
  const anthropic = String(process.env.ANTHROPIC_API_KEY || '').trim()
  if (anthropic) return { name: 'anthropic', key: anthropic, model: String(process.env.ANTHROPIC_MODEL || MODEL_DEFAULT) }
  return null
}

function request(p, system, messages) {
  if (p.name === 'gemini') {
    return {
      url: GEMINI_BASE + encodeURIComponent(p.model) + ':generateContent',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': p.key },
      body: {
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        // Thinking tokens count toward this cap on Gemini 3 models, so it is set above MAX_TOKENS.
        generationConfig: { maxOutputTokens: 4 * MAX_TOKENS },
      },
    }
  }
  return {
    url: UPSTREAM,
    headers: { 'content-type': 'application/json', 'x-api-key': p.key, 'anthropic-version': ANTHROPIC_VERSION },
    body: { model: p.model, max_tokens: MAX_TOKENS, temperature: 0.4, system, messages },
  }
}

function replyText(p, payload) {
  if (p.name === 'gemini') {
    return (payload?.candidates?.[0]?.content?.parts || [])
      .map(part => String(part?.text || '')).join('').trim()
  }
  return (payload?.content || [])
    .filter(b => b?.type === 'text')
    .map(b => String(b.text || ''))
    .join('')
    .trim()
}

export default async function handler(req, res) {
  if (!sameOrigin(req)) {
    return send(res, 403, { ok: false, error: 'Cross-origin requests are not accepted.' })
  }

  const p = provider()
  const configured = Boolean(p)
  const model = p ? p.model : null

  // Returns 200 either way; the page shows a not-connected state when unconfigured.
  if (req.method === 'GET') {
    return send(res, 200, {
      ok: true,
      configured,
      model,
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

  // A `system` field in the request body is ignored.
  const system = systemPrompt(audience)

  // Gemini tries the configured model, then the fallbacks, when a model errors on the provider's side.
  const models = p.name === 'gemini' ? [p.model, ...GEMINI_FALLBACKS.filter(m => m !== p.model)] : [p.model]
  let upstream = null
  let used = p.model
  let failure = null
  for (const m of models) {
    used = m
    const call = request({ ...p, model: m }, system, messages)
    const control = new AbortController()
    const timer = setTimeout(() => control.abort(), UPSTREAM_TIMEOUT_MS)
    try {
      upstream = await fetch(call.url, {
        method: 'POST',
        signal: control.signal,
        headers: call.headers,
        body: JSON.stringify(call.body),
      })
    } catch (err) {
      clearTimeout(timer)
      // Log a fixed string: the error object can contain the request.
      upstream = null
      failure = err?.name === 'AbortError' ? 'timeout' : 'unreachable'
      console.error('mindmap-ai: ' + p.name + ' ' + m + ' ' + failure)
      continue
    }
    clearTimeout(timer)
    if (upstream.ok) break
    // Auth, quota and request-shape errors are the same on every model, so they are not retried.
    if ([400, 401, 403, 429].includes(upstream.status)) break
    failure = null
    if (m !== models[models.length - 1]) {
      console.error('mindmap-ai: ' + p.name + ' ' + m + ' status ' + upstream.status + ', trying the next model')
    }
  }

  if (!upstream) {
    if (failure === 'timeout') {
      return send(res, 504, {
        ok: false, configured,
        error: 'The model did not answer in time. Sending it again usually works.',
      })
    }
    return send(res, 502, {
      ok: false, configured,
      error: 'The model could not be reached from the server.',
    })
  }

  if (!upstream.ok) {
    // Only the error code and status are read from the upstream body, never echoed message content.
    let kind = ''
    try {
      const payload = await upstream.json()
      kind = String(payload?.error?.status || payload?.error?.type || payload?.error?.code || '')
    } catch {
      kind = ''
    }
    const detail = (p.name + ' ' + used + ' HTTP ' + upstream.status + (kind ? ' ' + kind : '')).slice(0, 120)
    console.error('mindmap-ai: ' + detail)

    if (upstream.status === 429) {
      const retry = upstream.headers.get('retry-after')
      if (retry) res.setHeader('Retry-After', retry)
      return send(res, 429, {
        ok: false, configured, detail,
        error: 'The model is rate limited right now. Wait a moment and send it again.',
      })
    }
    if (upstream.status === 401 || upstream.status === 403) {
      return send(res, 502, {
        ok: false, configured, detail,
        error: 'The server key was refused by the model provider. MindMap AI cannot answer until it is replaced.',
      })
    }
    if (upstream.status === 404) {
      return send(res, 502, {
        ok: false, configured, detail,
        error: 'The configured model name was not recognised by the provider.',
      })
    }
    if (upstream.status === 400) {
      return send(res, 400, {
        ok: false, configured, detail,
        error: 'The model refused the shape of that request.',
      })
    }
    return send(res, 502, {
      ok: false, configured, detail,
      error: 'The model returned an error. Nothing was answered.',
    })
  }

  let reply = ''
  try {
    reply = replyText(p, await upstream.json())
  } catch {
    console.error('mindmap-ai: upstream body unreadable')
    return send(res, 502, { ok: false, configured, error: 'The model reply could not be read.' })
  }

  if (!reply) {
    return send(res, 502, { ok: false, configured, detail: p.name + ' ' + used + ' empty', error: 'The model returned an empty reply.' })
  }

  return send(res, 200, { ok: true, configured, model: used, reply })
}
