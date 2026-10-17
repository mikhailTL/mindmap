/* Practice progress, kept on this device only.
 *
 * One localStorage key, `mindmap.toolkit.progress`. It holds a running total
 * of points, how many sessions each tool has had, and the reader's picks
 * (colour, ring style, sound). It holds NO dates: there is nothing a streak
 * could be built from, so a missed day cannot cost anything and the total
 * never goes down. Every read and write is wrapped, because private windows
 * and blocked storage throw, and the games still run without it.
 *
 * Levels get a little longer as they go and then stop growing, so a level
 * never feels out of reach: 100 points for the first, then +40 a level,
 * capped at 340. */

export const PROGRESS_KEY = 'mindmap.toolkit.progress'

/* Colours a game can be drawn in. `main` is a graphic only (rings, dots,
   fills; clears 3 : 1). `ink` is the only one that may be a word. `wash` is a
   ground. All values are tokens in tailwind.config.js. */
export const THEMES = [
  { id:'leaf',  name:'Leaf',  level:1, main:'#157446', ink:'#0f5836', wash:'#dcefe4' },
  { id:'tide',  name:'Tide',  level:1, main:'#1d8fb0', ink:'#11677f', wash:'#ddf0f8' },
  { id:'mint',  name:'Mint',  level:2, main:'#18a370', ink:'#067049', wash:'#d5f2e8' },
  { id:'sky',   name:'Sky',   level:3, main:'#2294e6', ink:'#0967ab', wash:'#def0fc' },
  { id:'grape', name:'Grape', level:4, main:'#a024f2', ink:'#6f09b2', wash:'#f6e8ff' },
  { id:'honey', name:'Honey', level:5, main:'#b5871b', ink:'#825d07', wash:'#f5ecd7' },
  { id:'ember', name:'Ember', level:6, main:'#f25424', ink:'#b23009', wash:'#ffe8e0' },
  { id:'bloom', name:'Bloom', level:7, main:'#f2248b', ink:'#b2095e', wash:'#fce6f1' },
]

/* Ring styles, drawn by FillRing. */
export const RINGS = [
  { id:'solid',  name:'Solid',  level:1 },
  { id:'dots',   name:'Dots',   level:3 },
  { id:'double', name:'Double', level:5 },
  { id:'beads',  name:'Beads',  level:8 },
]

const DEFAULT = { v:1, total:0, sessions:0, tools:{}, theme:'leaf', ring:'solid', sound:false }

const stepFor = level => Math.min(340, 100 + (level - 1) * 40)

/* { level, into, need, pct } for a running total. `into` is points inside
   the current level and `need` the size of that level. */
export function levelFor(total) {
  let level = 1, left = Math.max(0, Math.floor(total || 0))
  while (left >= stepFor(level)) { left -= stepFor(level); level++ }
  const need = stepFor(level)
  return { level, into:left, need, pct:left / need }
}

export const themeById = id => THEMES.find(t => t.id === id) || THEMES[0]
export const ringById  = id => RINGS.find(r => r.id === id) || RINGS[0]

/* Everything that opens at exactly this level. */
export const unlocksAt = level => [
  ...THEMES.filter(t => t.level === level).map(t => ({ kind:'theme', ...t })),
  ...RINGS.filter(r => r.level === level).map(r => ({ kind:'ring', ...r })),
]

function clean(raw) {
  const p = { ...DEFAULT, ...(raw && typeof raw === 'object' ? raw : {}) }
  p.total = Number.isFinite(p.total) && p.total > 0 ? Math.floor(p.total) : 0
  p.sessions = Number.isFinite(p.sessions) && p.sessions > 0 ? Math.floor(p.sessions) : 0
  p.tools = p.tools && typeof p.tools === 'object' ? p.tools : {}
  const lv = levelFor(p.total).level
  if (themeById(p.theme).level > lv) p.theme = 'leaf'
  if (ringById(p.ring).level > lv) p.ring = 'solid'
  p.sound = p.sound === true
  return p
}

let memory = null                           // used when storage throws
const listeners = new Set()

export function readProgress() {
  try {
    const s = localStorage.getItem(PROGRESS_KEY)
    if (s) return clean(JSON.parse(s))
  } catch { /* blocked or malformed: fall through */ }
  return clean(memory)
}

function write(p) {
  memory = p
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)) } catch { /* kept in memory */ }
  for (const fn of listeners) fn(p)
  return p
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }

/* Change a pick. Locked picks are refused. */
export function setPick(key, value) {
  const p = readProgress()
  const lv = levelFor(p.total).level
  if (key === 'theme' && themeById(value).level > lv) return p
  if (key === 'ring' && ringById(value).level > lv) return p
  if (!['theme', 'ring', 'sound'].includes(key)) return p
  return write({ ...p, [key]: value })
}

/* Add one finished session. Returns what the end card needs: the points, the
   level before and after, and anything that opened on the way. Points are
   never negative and the total only grows. */
export function recordSession(tool, points) {
  const p = readProgress()
  const add = Math.max(0, Math.round(Number(points) || 0))
  const before = levelFor(p.total)
  const total = p.total + add
  const after = levelFor(total)
  const t = p.tools[tool] || { sessions:0, points:0 }
  write({ ...p, total, sessions:p.sessions + 1,
          tools:{ ...p.tools, [tool]: { sessions:t.sessions + 1, points:t.points + add } } })
  const opened = []
  for (let l = before.level + 1; l <= after.level; l++) opened.push(...unlocksAt(l))
  return { tool, points:add, totalBefore:p.total, total, before, after,
           levelUp:after.level > before.level, opened }
}
