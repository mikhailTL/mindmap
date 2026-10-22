// One object per tool under mindmap.skills.<id>; blocked storage returns the fallback.
export const keyFor = id => `mindmap.skills.${id}`

const local = () => { try { return globalThis.localStorage } catch { return undefined } }

export function load(id, fallback, store = local()) {
  try {
    const raw = store?.getItem(keyFor(id))
    if (!raw) return fallback
    const v = JSON.parse(raw)
    return v && typeof v === 'object' && !Array.isArray(v) ? { ...fallback, ...v } : fallback
  } catch { return fallback }
}

export function save(id, value, store = local()) {
  try { store.setItem(keyFor(id), JSON.stringify(value)); return true } catch { return false }
}
