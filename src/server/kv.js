/* The store behind the account API: Vercel KV (Upstash Redis over REST) in
 * production, and an in-memory map with the same five calls for tests and
 * for a deploy with no store wired, which the API reports as not configured.
 *
 * Five calls are the whole contract. Anything the API needs is built from
 * them, so the memory version is small enough to be obviously right. */

export function memoryKV() {
  const m = new Map()
  const sets = new Map()
  const alive = k => {
    const e = m.get(k)
    if (e && e.until && e.until < Date.now()) { m.delete(k); return null }
    return e || null
  }
  return {
    async get(k) { const e = alive(k); return e ? e.v : null },
    /* opts.ex: seconds to live. opts.nx: only if absent; returns null when it
       was already there, which is how @vercel/kv reports the same thing. */
    async set(k, v, opts = {}) {
      if (opts.nx && alive(k)) return null
      m.set(k, { v, until: opts.ex ? Date.now() + opts.ex * 1000 : 0 })
      return 'OK'
    },
    async del(k) { m.delete(k); sets.delete(k) },
    async sadd(k, ...vs) { if (!sets.has(k)) sets.set(k, new Set()); vs.forEach(v => sets.get(k).add(v)) },
    async srem(k, ...vs) { sets.get(k) && vs.forEach(v => sets.get(k).delete(v)) },
    async smembers(k) { return [...(sets.get(k) || [])] },
  }
}

/* @vercel/kv serialises JSON itself; the API keeps everything it stores as
   plain objects and strings, so no wrapper is needed beyond the import. */
let kvPromise = null
export async function vercelKV() {
  /* The Upstash marketplace integration names its variables either way
     depending on when the store was made; both spellings are read. */
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!(url && token)) return null
  if (!kvPromise) {
    kvPromise = (async () => {
      try {
        const mod = await import('@vercel/kv')
        return mod?.createClient ? mod.createClient({ url, token }) : (mod?.kv || null)
      } catch { return null }
    })()
  }
  return kvPromise
}
