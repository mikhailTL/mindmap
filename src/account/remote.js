const URL = '/api/account'
const TOKEN_KEY = 'mindmap.account.token'

export function readToken() {
  try { return window.localStorage.getItem(TOKEN_KEY) || null } catch { return null }
}
export function writeToken(t) {
  try { t ? window.localStorage.setItem(TOKEN_KEY, t) : window.localStorage.removeItem(TOKEN_KEY) } catch {}
}

// true, false, or null when the API cannot be reached (offline, or a dev server without functions).
export async function probe() {
  try {
    const r = await fetch(URL, { method: 'GET', cache: 'no-store' })
    if (!r.ok) return null
    const j = await r.json()
    return j && j.configured === true
  } catch { return null }
}

export async function call(op, body = {}) {
  const token = readToken()
  try {
    const r = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({ op, ...body }),
    })
    const j = await r.json().catch(() => null)
    if (j && typeof j === 'object') return j
    return { ok: false, reason: 'server' }
  } catch { return { ok: false, reason: 'offline' } }
}
