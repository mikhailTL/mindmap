import { describe, it, expect, vi, afterEach } from 'vitest'
import handler from '../api/mindmap-ai.js'

function call({ method = 'GET', body, headers = {} } = {}) {
  const req = { method, headers: { host: 'site.test', ...headers }, body, socket: {} }
  const res = {
    statusCode: 0, headers: {}, out: '',
    setHeader(k, v) { this.headers[k.toLowerCase()] = v },
    end(s) { this.out = s },
  }
  return handler(req, res).then(() => ({ status: res.statusCode, json: JSON.parse(res.out), res }))
}

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('MindMap AI endpoint', () => {
  it('reports not configured with no key', async () => {
    vi.stubEnv('GEMINI_API_KEY', ''); vi.stubEnv('ANTHROPIC_API_KEY', '')
    const { json } = await call()
    expect(json.configured).toBe(false)
  })

  it('uses Gemini when its key is set and returns the reply text', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key'); vi.stubEnv('ANTHROPIC_API_KEY', '')
    const fetch = vi.fn(async () => ({
      ok: true, status: 200, headers: new Map(),
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'Try a slow breath.' }] } }] }),
    }))
    vi.stubGlobal('fetch', fetch)
    const { status, json } = await call({ method: 'POST', body: { audience: 'student',
      messages: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }, { role: 'user', content: 'Help' }] } })
    expect(status).toBe(200)
    expect(json.reply).toBe('Try a slow breath.')
    const [url, init] = fetch.mock.calls[0]
    expect(url).toMatch(/generativelanguage\.googleapis\.com\/v1beta\/models\/.+:generateContent$/)
    expect(init.headers['x-goog-api-key']).toBe('test-key')
    const sent = JSON.parse(init.body)
    expect(sent.contents.map(c => c.role)).toEqual(['user', 'model', 'user'])
    expect(sent.systemInstruction.parts[0].text.length).toBeGreaterThan(50)
  })
})
