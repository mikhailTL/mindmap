/* The account API from the page's side: one POST per op, a bearer token
 * kept in localStorage, and a probe that says whether the deploy has a
 * store behind it at all. Nothing here interprets a reply; the store does. */

const URL = '/api/account'
const TOKEN_KEY = 'mindmap.account.token'

export function readToken() {
  try { return window.localStorage.getItem(TOKEN_KEY) || null } catch { return null }
}
export function writeToken(t) {
  try { t ? window.localStorage.setItem(TOKEN_KEY, t) : window.localStorage.removeItem(TOKEN_KEY) } catch {}
}

/* true, false, or null when the page cannot reach it at all (offline, or a
   dev server with no functions). */
export async function probe() {
  try {
    const r = await fetch(URL, { method: 'GET', cache: 'no-store' })
    if (!r.ok) return null
    const j = await r.json()
    return j && j.configured === true
  } catch { return null }
}

/* Always resolves to an object with ok and, on failure, a reason. A network
   failure is 'offline'; a stale token is 'signedout'. */
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
