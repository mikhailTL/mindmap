import { useSyncExternalStore } from 'react'

// Text size and reduced motion for this device, kept in localStorage and applied to <html>.
// Text size scales the root font size, and every size in lib/type-scale.js is in rem.
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

// For MotionConfig's reducedMotion: 'always' when this device asked for less motion, otherwise the system setting.
export const motionPreference = () => (getAppearance().motion === 'reduce' ? 'always' : 'user')

function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
export function useAppearance() {
  useSyncExternalStore(subscribe, () => version, () => 0)
  return getAppearance()
}

if (typeof window !== 'undefined') { try { apply() } catch {} }
