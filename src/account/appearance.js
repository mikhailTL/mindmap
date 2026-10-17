import { useSyncExternalStore } from 'react'

/* How the app looks on this device: text size and motion. Kept in
 * localStorage, applied to <html> on load and on every change, so it holds on
 * every screen without a provider.
 *
 * Text size scales the root font size. Every size in src/lib/type-scale.js is
 * in rem, so the whole scale moves together.
 *
 * Reduce motion sets data-motion="reduce" on <html>, which a global rule
 * below stills CSS transitions and animations under. framer-motion reads only
 * the system setting; App.jsx can pass motionPreference() to MotionConfig's
 * reducedMotion for the same effect on JS animations.
 */

const KEY = 'mindmap.appearance'
const VERSION = 1

export const TEXT_SIZES = [
  { value: 'default', label: 'Default', scale: 100 },
  { value: 'large',   label: 'Large',   scale: 112.5 },
  { value: 'larger',  label: 'Larger',  scale: 125 },
]
export const MOTION = [
  { value: 'system', label: 'Follow this device' },
  { value: 'reduce', label: 'Reduce motion' },
]

const blank = () => ({ v: VERSION, text: 'default', motion: 'system' })
const clean = s => ({
  v: VERSION,
  text: TEXT_SIZES.some(t => t.value === s.text) ? s.text : 'default',
  motion: MOTION.some(m => m.value === s.motion) ? s.motion : 'system',
})

let state = null
let version = 0
const listeners = new Set()

function load() {
  if (state) return state
  let parsed = null
  try { parsed = JSON.parse(window.localStorage.getItem(KEY) || 'null') } catch { parsed = null }
  state = clean(parsed && parsed.v === VERSION ? parsed : blank())
  return state
}

const STYLE_ID = 'mindmap-appearance'
function apply() {
  if (typeof document === 'undefined') return
  const s = load()
  const root = document.documentElement
  const scale = TEXT_SIZES.find(t => t.value === s.text).scale
  root.style.fontSize = scale === 100 ? '' : scale + '%'
  if (s.motion === 'reduce') root.setAttribute('data-motion', 'reduce')
  else root.removeAttribute('data-motion')
  if (!document.getElementById(STYLE_ID)) {
    const el = document.createElement('style')
    el.id = STYLE_ID
    el.textContent = `[data-motion="reduce"] *, [data-motion="reduce"] *::before, [data-motion="reduce"] *::after {
  animation-duration: .001ms !important; animation-iteration-count: 1 !important;
  transition-duration: .001ms !important; scroll-behavior: auto !important; }`
    document.head.appendChild(el)
  }
}

export function getAppearance() {
  return typeof window === 'undefined' ? blank() : load()
}

export function setAppearance(patch) {
  state = clean({ ...load(), ...patch })
  try { window.localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
  apply()
  version += 1
  listeners.forEach(fn => { try { fn() } catch {} })
  return state
}

/* For MotionConfig: 'always' when this device asked for less motion, else
   'user', which follows the system setting. */
export const motionPreference = () => (getAppearance().motion === 'reduce' ? 'always' : 'user')

function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
export function useAppearance() {
  useSyncExternalStore(subscribe, () => version, () => 0)
  return getAppearance()
}

if (typeof window !== 'undefined') { try { apply() } catch {} }
