// Store for the account API: Vercel KV (Upstash REST) when configured, otherwise an in-memory map with the same calls.
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
    // opts.ex: TTL in seconds. opts.nx: set only if absent, returning null otherwise, as @vercel/kv does.
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

let kvPromise = null
export async function vercelKV() {
  // The Upstash integration uses either variable prefix, depending on the store's creation date.
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
