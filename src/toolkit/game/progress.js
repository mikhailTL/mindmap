import { CATALOG, TABS, TOOL_IDS, toolsIn, tabOf } from './catalog'

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

const DEFAULT = { v:1, total:0, sessions:0, tools:{}, done:{}, marks:{}, badges:[],
                  theme:'leaf', ring:'solid', sound:false }

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

/* A map of id to a whole count above zero; anything else is dropped. */
function counts(m) {
  const out = {}
  if (m && typeof m === 'object' && !Array.isArray(m)) {
    for (const [k, v] of Object.entries(m)) if (Number.isFinite(v) && v > 0) out[k] = Math.floor(v)
  }
  return out
}

function clean(raw) {
  const p = { ...DEFAULT, ...(raw && typeof raw === 'object' ? raw : {}) }
  p.total = Number.isFinite(p.total) && p.total > 0 ? Math.floor(p.total) : 0
  p.sessions = Number.isFinite(p.sessions) && p.sessions > 0 ? Math.floor(p.sessions) : 0
  p.tools = p.tools && typeof p.tools === 'object' ? p.tools : {}
  p.done = counts(p.done)
  p.marks = counts(p.marks)
  p.badges = Array.isArray(p.badges) ? p.badges.filter(id => BADGES.some(b => b.id === id)) : []
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
  /* Memory is only the fallback for a write that storage refused; when the
     write lands, storage is the one source, so clearing site data clears
     progress too. */
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); memory = null } catch { memory = p }
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

/* ── Finishing, levels, badges (wave 9) ──────────────────────────────────

   Points are paid only for finishing a tool, as a flat amount, so a long
   round of taps can no longer race the level bar, and an early end pays
   nothing at all. The in-game numbers that float up while you play are a
   round score, shown as "score", and never added to the level.

     finish             20
     first finish of a tool   +10 (rewards trying something new)
     every answer right in a round   +5

   With the level steps above (100, then +40 a level, capped at 340) a teen
   reaches level 2 after about four new tools, level 3 after about eight,
   and level 8 after about sixty finishes. Nothing is ever taken away. */

export const FINISH_POINTS = 20
export const NEW_TOOL_BONUS = 10
export const CLEAN_BONUS = 5

export const LEVEL_NAMES = ['Starter', 'Explorer', 'Regular', 'Skilled', 'Pro', 'Expert', 'Ace', 'Legend']

export function levelName(level) {
  const n = Math.max(1, Math.floor(level || 1))
  return n <= LEVEL_NAMES.length ? LEVEL_NAMES[n - 1] : `${LEVEL_NAMES[LEVEL_NAMES.length - 1]} ${n - LEVEL_NAMES.length + 1}`
}

/* Total needed to reach a level, for the level table. */
export function levelStart(level) {
  let t = 0
  for (let l = 1; l < level; l++) t += stepFor(l)
  return t
}

export function awardFor({ complete = true, firstFinish = false, clean = false } = {}) {
  if (!complete) return { points:0, parts:[] }
  const parts = [['Finished', FINISH_POINTS]]
  if (firstFinish) parts.push(['New tool', NEW_TOOL_BONUS])
  if (clean) parts.push(['All right', CLEAN_BONUS])
  return { points: parts.reduce((t, [, n]) => t + n, 0), parts }
}

/* Badges. Each is earned from what has been finished and what kind of thing
   was made, never from when: there is no date anywhere in the store, so
   nothing here can become a streak. `marks` are what a tool says it made
   when it finishes: plan, script, clean (every answer right), firstaid. */
const finished = p => TOOL_IDS.filter(id => (p.done?.[id] || 0) > 0)
const tabDone = (p, tab) => toolsIn(tab).every(id => (p.done?.[id] || 0) > 0)

export const BADGES = [
  { id:'first',     name:'First finish',   line:'Finish any tool.',
    has:p => finished(p).length >= 1 },
  { id:'plan',      name:'Plan made',      line:'Finish something with a plan in it: a study plan, a screen plan, a budget, a routine or a next step.',
    has:p => (p.marks?.plan || 0) > 0 },
  { id:'script',    name:'Got the words',  line:'Finish a script you can use: a boundary, an I-statement or an email.',
    has:p => (p.marks?.script || 0) > 0 },
  { id:'clean',     name:'Clean sweep',    line:'Get every answer right in a quiz round.',
    has:p => (p.marks?.clean || 0) > 0 },
  { id:'firstaid',  name:'First aider',    line:'Finish the first-aid check in Health Basics.',
    has:p => (p.marks?.firstaid || 0) > 0 },
  { id:'five',      name:'Five tried',     line:'Finish five different tools.',
    has:p => finished(p).length >= 5 },
  { id:'ten',       name:'Ten tried',      line:'Finish ten different tools.',
    has:p => finished(p).length >= 10 },
  { id:'all-tabs',  name:'All rounder',    line:'Finish one tool in each tab: Exercises, School, Outside, Life and Career.',
    has:p => TABS.every(t => toolsIn(t.id).some(id => (p.done?.[id] || 0) > 0)) },
  { id:'calm-kit',  name:'Calm kit',       line:'Finish three different calming exercises.',
    has:p => toolsIn('exercise').filter(id => (p.done?.[id] || 0) > 0).length >= 3 },
  { id:'set-school',  name:'School set',   line:'Finish every School tool.',  has:p => tabDone(p, 'school') },
  { id:'set-outside', name:'Outside set',  line:'Finish every Outside tool.', has:p => tabDone(p, 'outside') },
  { id:'set-life',    name:'Life set',     line:'Finish every Life tool.',    has:p => tabDone(p, 'life') },
  { id:'set-career',  name:'Career set',   line:'Finish every Career tool.',  has:p => tabDone(p, 'career') },
  { id:'whole-kit', name:'Whole Toolkit',  line:'Finish all 26 tools at least once.',
    has:p => finished(p).length >= TOOL_IDS.length },
]
export const badgeById = id => BADGES.find(b => b.id === id) || null

/* Every badge this progress has earned, in list order. Pure. */
export const badgesFor = p => BADGES.filter(b => b.has(p || {})).map(b => b.id)

/* Store one session. An early end (`complete: false`) still counts as a
   session for that tool, so "Try next" knows it was opened, but it pays
   nothing and earns nothing. Returns everything the end card needs. */
export function recordFinish(tool, { complete = true, marks = [] } = {}) {
  const p = readProgress()
  const firstFinish = complete && !(p.done[tool] > 0)
  const ms = Array.isArray(marks) ? marks.filter(m => typeof m === 'string') : []
  const award = awardFor({ complete, firstFinish, clean: ms.includes('clean') })
  const before = levelFor(p.total)
  const total = p.total + award.points
  const after = levelFor(total)
  const t = p.tools[tool] || { sessions:0, points:0 }
  const next = { ...p, total, sessions:p.sessions + 1,
    tools:{ ...p.tools, [tool]: { sessions:t.sessions + 1, points:(t.points || 0) + award.points } } }
  if (complete) {
    next.done = { ...p.done, [tool]: (p.done[tool] || 0) + 1 }
    next.marks = { ...p.marks }
    for (const m of new Set(ms)) next.marks[m] = (next.marks[m] || 0) + 1
  }
  const had = new Set(p.badges)
  const now = badgesFor(next)
  next.badges = [...p.badges, ...now.filter(id => !had.has(id))]
  write(next)
  const opened = []
  for (let l = before.level + 1; l <= after.level; l++) opened.push(...unlocksAt(l))
  return { tool, complete, points:award.points, parts:award.parts, totalBefore:p.total, total, before, after,
           levelUp:after.level > before.level, opened, firstFinish,
           badges: now.filter(id => !had.has(id)).map(badgeById) }
}

/* One tool to try next. Prefers a tool never opened, from a tab with the
   fewest tools opened, rotating through tabs as more get tried so it does
   not always say the same thing. Given a tab (the one on screen), a tool
   from that tab comes first while it has any left. When everything has been
   opened, offers the tool finished least often. `fresh` says which case. */
export function suggestNext(p = {}, tab = null) {
  const tools = p.tools || {}, done = p.done || {}
  const tried = id => !!(tools[id] || done[id])
  const left = TOOL_IDS.filter(id => !tried(id))
  const here = tab ? left.filter(id => tabOf(id) === tab) : []
  if (here.length) return { id:here[0], fresh:true }
  if (left.length) {
    const used = tab => toolsIn(tab).filter(tried).length
    const turn = TOOL_IDS.length - left.length
    const tabs = TABS.map((t, i) => ({ id:t.id, used:used(t.id), i:(i + turn) % TABS.length }))
      .filter(t => left.some(id => tabOf(id) === t.id))
      .sort((a, b) => a.used - b.used || a.i - b.i)
    return { id: left.find(id => tabOf(id) === tabs[0].id), fresh:true }
  }
  const least = [...TOOL_IDS].sort((a, b) => (done[a] || 0) - (done[b] || 0))[0]
  return { id:least, fresh:false }
}

export { CATALOG }
