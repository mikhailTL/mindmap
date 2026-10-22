import { useSyncExternalStore } from 'react'

const KEY = 'mindmap.mode'
const FALLBACK = 'real'

export const MODES = ['demo', 'real']

let current = readStored()

const listeners = new Set()

// sessionStorage, so a demo choice lasts only for this visit. Guarded: Safari private mode throws on getItem.
function readStored() {
  try {
    const v = sessionStorage.getItem(KEY)
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
  try { sessionStorage.setItem(KEY, m) } catch { /* in-memory is acceptable */ }
  for (const fn of listeners) fn(m)
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

// The storage event fires only in other tabs, so this does not loop back to the writer.
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

export function useMode() {
  const mode = useSyncExternalStore(subscribe, getMode, getMode)
  return [mode, setMode]
}

export function isReal() {
  return current === 'real'
}

// Guest flag: viewing the demo without an account, kept for this visit only.
const GUEST_KEY = 'mindmap.guest'
let guest = (() => { try { return sessionStorage.getItem(GUEST_KEY) === '1' } catch { return false } })()
const guestListeners = new Set()

export function isGuest() { return guest }

export function setGuest(on) {
  guest = !!on
  try { on ? sessionStorage.setItem(GUEST_KEY, '1') : sessionStorage.removeItem(GUEST_KEY) } catch {}
  for (const fn of guestListeners) fn(guest)
}

export function useGuest() {
  return useSyncExternalStore(
    fn => { guestListeners.add(fn); return () => guestListeners.delete(fn) },
    () => guest, () => false)
}
