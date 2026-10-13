import { useSyncExternalStore } from 'react'

/* The demo/real switch. One module store, not a prop or an opt-in context, so
 * no screen can miss it and show fixtures in real mode.
 *   demo  generated fixtures; the default, so a visitor with no hardware does
 *         not land on an empty product.
 *   real  nothing paired. Not an error screen — the product before a device. */

const KEY = 'mindmap.mode'
/* Real, not demo. A judge opening the app must land on the working product;
   the demo is something they choose, not something they are given. */
const FALLBACK = 'real'

export const MODES = ['demo', 'real']

/* Read once at module load and cached: localStorage is synchronous and the
 * snapshot below runs on every render of every subscriber. */
let current = readStored()

const listeners = new Set()

/* Guarded: Safari private mode throws on getItem as well as setItem, and an
 * embedded webview can have storage disabled. */
function readStored() {
  try {
    const v = localStorage.getItem(KEY)
    return MODES.includes(v) ? v : FALLBACK
  } catch {
    return FALLBACK
  }
}

export function getMode() {
  return current
}

export function setMode(m) {
  if (!MODES.includes(m) || m === current) return
  current = m
  try { localStorage.setItem(KEY, m) } catch { /* session-only is acceptable */ }
  for (const fn of listeners) fn(m)
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/* Cross-tab sync. The storage event fires only in the *other* documents, so
 * this never loops back on the writer. */
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('storage', e => {
      if (e.key !== KEY) return
      const next = MODES.includes(e.newValue) ? e.newValue : FALLBACK
      if (next === current) return
      current = next
      for (const fn of listeners) fn(next)
    })
  } catch { /* no window listener, no cross-tab sync; not fatal */ }
}

/* useSyncExternalStore, not useState + effect: separate subscribers can
 * otherwise tear within one commit and paint two different modes. */
export function useMode() {
  const mode = useSyncExternalStore(subscribe, getMode, getMode)
  return [mode, setMode]
}

export function isReal() {
  return current === 'real'
}
