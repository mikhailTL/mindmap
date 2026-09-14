import { useSyncExternalStore } from 'react'

/* The demo/real switch, held in one module because the alternative — a prop
 * threaded from App through every view, or a context each screen opts into —
 * has already failed once here: a screen that forgot to read it kept showing
 * fixtures while the rest of the app had gone honest, and a visitor cannot
 * tell a stale panel from a claim.
 *
 *   demo  the generated fixtures. Default, because a cold visitor with no
 *         hardware would otherwise land on an empty product and leave.
 *   real  the app with nothing paired, which is its true state for every
 *         visitor today. It is not an error screen; it is the product before
 *         a device exists, and it has to be shown that way.
 */

const KEY = 'mindmap.mode'
const FALLBACK = 'demo'

export const MODES = ['demo', 'real']

/* Read once at module load and keep the answer in memory. localStorage is a
 * synchronous main-thread call and useSyncExternalStore's snapshot runs on
 * every render of every subscriber; going to storage each time would put a
 * disk-backed read in the render path of the whole app. */
let current = readStored()

const listeners = new Set()

/* Every storage access is guarded. Safari's private mode throws on getItem,
 * not just setItem, and an embedded webview can have storage disabled
 * outright — in both cases the app still has to run, just without memory. */
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

/* Two tabs of the same site disagreeing is the same failure as two panels of
 * the same tab disagreeing, one screenshot later. The storage event only fires
 * in the *other* documents, so this never loops back on the writer. */
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

/* useSyncExternalStore rather than useState + an effect: React tears a single
 * commit across components that subscribe separately, so with the older
 * pattern one screen could paint the new mode while its sibling still showed
 * the old one. This API exists to make that impossible. */
export function useMode() {
  const mode = useSyncExternalStore(subscribe, getMode, getMode)
  return [mode, setMode]
}

export function isReal() {
  return current === 'real'
}
