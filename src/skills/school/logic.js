export function parseTime(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim())
  if (!m) return null
  const h = +m[1], mi = +m[2]
  if (h > 23 || mi > 59) return null
  return h * 60 + mi
}

export function fmtTime(min) {
  const t = ((Math.round(min) % 1440) + 1440) % 1440
  const h = Math.floor(t / 60), m = t % 60
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export function nightLabel(i, todayDow) {
  if (i === 0) return 'Tonight'
  if (i === 1) return 'Tomorrow'
  return DAYS[(todayDow + i) % 7]
}

// Real minutes over guessed minutes across the last 10 logged tasks, clamped to 0.5..3.
export function learnFactor(history = []) {
  const rows = history.filter(r => r && r.est > 0 && r.actual > 0).slice(-10)
  if (!rows.length) return { factor:1, n:0 }
  const est = rows.reduce((s, r) => s + r.est, 0)
  const act = rows.reduce((s, r) => s + r.actual, 0)
  const f = Math.min(3, Math.max(0.5, act / est))
  return { factor: Math.round(f * 100) / 100, n: rows.length }
}

export function factorLine(f) {
  const pct = Math.round((f - 1) * 100)
  if (Math.abs(pct) < 5) return 'Your guesses are about right.'
  return pct > 0 ? `You usually take about ${pct}% longer than you guess.`
                 : `You usually take about ${-pct}% less time than you guess.`
}

export const adjust = (est, factor = 1) => Math.max(5, Math.ceil((est * factor) / 5) * 5)

// Splits a task into even parts of at most `maxPiece` minutes, each a multiple of 5.
export function splitTask(task, factor = 1, maxPiece = 60) {
  const total = adjust(task.est, factor)
  const n = Math.max(1, Math.ceil(total / maxPiece))
  const base = Math.floor(total / n / 5) * 5
  let extra = total - base * n
  return Array.from({ length:n }, (_, i) => {
    const add = extra > 0 ? 5 : 0
    extra -= add
    return { key:`${task.id}:${i + 1}`, taskId:task.id, name:task.name, part:i + 1, of:n,
             mins:base + add, due:task.due }
  })
}

const order = (a, b) => a.due - b.due || String(a.taskId).localeCompare(String(b.taskId)) || a.part - b.part

// Fills nights in order up to `cap` minutes; null if a part would land on or after its due night.
function fill(pieces, cap) {
  const out = []
  let night = 0, load = 0
  for (const p of pieces) {
    if (load > 0 && load + p.mins > cap) { night++; load = 0 }
    if (night > p.due - 1) return null
    out.push({ ...p, night })
    load += p.mins
  }
  return out
}

export function autoPlan(pieces) {
  if (!pieces.length) return []
  const sorted = [...pieces].sort(order)
  const total = sorted.reduce((s, p) => s + p.mins, 0)
  // The smallest cap that fits wins, tried upward from the largest part in 5 minute steps.
  for (let cap = Math.max(...sorted.map(p => p.mins)); cap <= total; cap += 5) {
    const r = fill(sorted, cap)
    if (r) return r
  }
  // No cap fits: each part goes on the last night before it is due.
  return sorted.map(p => ({ ...p, night: Math.max(0, p.due - 1) }))
}

export function canMove(piece, dir, plan) {
  const to = piece.night + dir
  if (to < 0 || to > piece.due - 1) return false
  const sib = plan.filter(p => p.taskId === piece.taskId)
  const prev = sib.find(p => p.part === piece.part - 1)
  const next = sib.find(p => p.part === piece.part + 1)
  if (prev && to < prev.night) return false
  if (next && to > next.night) return false
  return true
}

export const BREAKS = {
  '50/10': { work:50, rest:10, label:'50 + 10' },
  '25/5':  { work:25, rest:5,  label:'25 + 5' },
  none:    { work:Infinity, rest:0, label:'None' },
}

export function scheduleNight(items, start, mode = '50/10') {
  const { work, rest } = BREAKS[mode] || BREAKS['50/10']
  const segments = []
  let t = start, left = work, workMins = 0
  for (const it of items) {
    let remaining = it.mins
    while (remaining > 0) {
      if (left <= 0) {
        segments.push({ kind:'break', from:t, to:t + rest })
        t += rest; left = work
      }
      const chunk = Math.min(remaining, left)
      segments.push({ kind:'work', key:it.key, label:it.label, from:t, to:t + chunk })
      t += chunk; remaining -= chunk; left -= chunk; workMins += chunk
    }
  }
  return { segments, end:t, workMins }
}

// A bedtime at or before the start time is read as after midnight.
export function minutesPastBed(end, start, bed) {
  const b = bed <= start ? bed + 1440 : bed
  return end - b
}

export const SOURCE_QUESTIONS = [
  { id:'who', title:'Who made it',
    ask:'Is a real person or group named, with a reason to know this topic?',
    next:'Search the author or site name in a new tab and see what others say about them.' },
  { id:'when', title:'When',
    ask:'Is there a date, and is it recent enough for this topic?',
    next:'Find the date. For science, health or tech, look for something from the last few years.' },
  { id:'evidence', title:'Evidence',
    ask:'Does it link to data, a study, or the original source?',
    next:'Follow the claim back to where it started. If you cannot find it, treat it as unproven.' },
  { id:'purpose', title:'Purpose',
    ask:'Is it mainly trying to inform you, not sell, persuade or get clicks?',
    next:'Ask who gains if you believe it. Look for a source with nothing to sell.' },
  { id:'bias', title:'Bias signals',
    ask:'Is the tone calm, with no loaded words, all caps or outrage, and other views mentioned fairly?',
    next:'Rewrite the claim in neutral words. If it sounds less convincing, the tone was making it seem stronger.' },
  { id:'second', title:'Second source',
    ask:'Does a separate source you trust say the same thing?',
    next:'Find one more source that did not copy this one. Chatbot answers do not count until you find the original.' },
]

const PTS = { yes:2, unsure:1, no:0 }

export function scoreSource(answers = {}) {
  const max = SOURCE_QUESTIONS.length * 2
  const points = SOURCE_QUESTIONS.reduce((s, q) => s + (PTS[answers[q.id]] ?? 0), 0)
  const pct = Math.round((points / max) * 100)
  const flags = SOURCE_QUESTIONS.filter(q => answers[q.id] !== 'yes')
    .map(q => ({ id:q.id, title:q.title, answer:answers[q.id] || 'unsure', next:q.next }))
  let level = 'mixed'
  if (pct < 45 || (answers.evidence === 'no' && answers.second === 'no') ||
      (answers.who === 'no' && answers.second !== 'yes')) level = 'weak'
  else if (pct >= 75 && answers.second === 'yes' && answers.evidence !== 'no') level = 'strong'
  return { points, max, pct, level, label: LEVELS[level].label, line: LEVELS[level].line, flags }
}

export const LEVELS = {
  strong: { label:'Solid',        line:'Fine to use. Cite it and say where it came from.' },
  mixed:  { label:'Use with care', line:'Check the flags below before you rely on it.' },
  weak:   { label:'Not yet',      line:'Do not rely on it. Find a better source for this claim.' },
}

/* Practice round. Every source here is made up for practice. */
export const SAMPLES = [
  { id:'s1', title:'State health department page on teen sleep',
    detail:'Updated this year. Lists its authors. Links to three studies.',
    answer:'trust', why:'Named experts, recent, and it shows its evidence.' },
  { id:'s2', title:'"Doctors HATE this one study trick" video',
    detail:'From an account that sells focus supplements in the description.',
    answer:'skip', why:'Clickbait title and it profits if you believe it.' },
  { id:'s3', title:'Chatbot answer with a quote from a scientist',
    detail:'No link. The quote sounds right.',
    answer:'check', why:'Chatbots can invent quotes. Find the quote in its original source first.' },
  { id:'s4', title:'Blog post about phone batteries',
    detail:'Written in 2014. No sources. Author is a hobbyist.',
    answer:'check', why:'Old for a tech topic and nothing backs it up. Look for a newer source.' },
  { id:'s5', title:'News article quoting two experts who disagree',
    detail:'Well known outlet. Reporter named. Dated last week.',
    answer:'trust', why:'Named, recent, and it shows more than one view.' },
  { id:'s6', title:'Screenshot of a post with the account name cropped out',
    detail:'Shared in a group chat. 40,000 likes.',
    answer:'skip', why:'No author, no date, no way to trace it. Likes are not evidence.' },
]

export const SORT_BINS = [
  { id:'trust', label:'Trust more' },
  { id:'check', label:'Check more' },
  { id:'skip',  label:'Skip it' },
]

export function gradeSort(picks = {}) {
  const results = SAMPLES.map(s => ({ ...s, pick:picks[s.id], ok:picks[s.id] === s.answer }))
  return { right: results.filter(r => r.ok).length, total: SAMPLES.length, results }
}

export function readiness(must = []) {
  const total = must.length
  const done = must.filter(m => m.done).length
  return { done, total, pct: total ? done / total : 0, ready: total > 0 && done === total }
}

// feel is 0 to 100; actual is the checklist share, 0 to 1.
export function gutCheck(feel, actual) {
  const a = Math.round(actual * 100)
  if (a - feel >= 25) return { kind:'doubt',
    line:'Your checklist shows more done than it feels. Trust the list.' }
  if (feel - a >= 25) return { kind:'ahead',
    line:'It feels more finished than the checklist says. Finish the must-haves first.' }
  return { kind:'agree', line:'Your gut and your checklist roughly agree. Trust the list.' }
}

export function mistakeEntry({ what = '', tells = '', next = '' } = {}) {
  const w = what.trim()
  if (!w) return null
  return { what:w, tells:tells.trim(), next:next.trim() }
}

const STOP = new Set(['about', 'after', 'again', 'because', 'before', 'being', 'their', 'there',
  'these', 'those', 'which', 'while', 'where', 'other', 'would', 'could', 'should', 'every', 'between'])

const clean = s => s.trim().replace(/[.!?;,]+$/, '').trim()
const lowerLead = s => /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s

export function noteToCard(line) {
  const text = clean(line)
  let m
  if ((m = /^([^:=]{2,40}?)\s*[:=]\s*(.{3,})$/.exec(text)) ||
      (m = /^(.{2,40}?)\s+[-–—]\s+(.{3,})$/.exec(text))) {
    return { q:`What is ${lowerLead(m[1].trim())}?`, a:clean(m[2]) }
  }
  if ((m = /\b(1\d{3}|20\d{2})\b/.exec(text))) {
    return { q:`${text.replace(m[1], '____')}. Fill the blank.`, a:m[1] }
  }
  if ((m = /^(.+?)\s+because\s+(.+)$/i.exec(text))) {
    return { q:`Why is it that ${lowerLead(m[1])}?`, a:`Because ${clean(m[2])}` }
  }
  if ((m = /^(.{2,50}?)\s+(is|are|was|were|means)\s+(.{3,})$/i.exec(text)) &&
      m[1].trim().split(/\s+/).length <= 6) {
    const x = lowerLead(m[1].trim()), v = m[2].toLowerCase()
    return { q: v === 'means' ? `What does ${x} mean?` : `What ${v} ${x}?`, a:clean(m[3]) }
  }
  const words = text.split(/\s+/).map(w => w.replace(/[^\p{L}\p{N}'-]/gu, ''))
  const pick = words.filter(w => w.length >= 5 && !STOP.has(w.toLowerCase()))
    .reduce((best, w) => (w.length > best.length ? w : best), '')
  if (!pick) return { q:`Explain in your own words: ${text}`, a:text }
  return { q:`${text.replace(pick, '____')}. Fill the blank.`, a:pick }
}

export function notesToCards(text = '') {
  return String(text).split(/\n+/)
    .flatMap(l => l.split(/(?<=[.!?])\s+/))
    .map(l => l.replace(/^\s*([-*•]|\d+[.)])\s*/, '').trim())
    .filter(l => l.length >= 8 && l.split(/\s+/).length >= 2)
    .map(l => ({ ...noteToCard(l), src:l }))
}

// Leitner boxes: days until a card is due again in each box.
export const WAIT = { 1:0, 2:1, 3:3, 4:7, 5:14 }

export function review(card, grade, today) {
  if (grade === 'got') { const box = Math.min(5, (card.box || 1) + 1); return { ...card, box, due: today + WAIT[box] } }
  if (grade === 'partly') return { ...card, box: card.box || 1, due: today + 1 }
  return { ...card, box:1, due:today }
}

export const dueCards = (cards, today) =>
  cards.filter(c => c.due <= today).sort((a, b) => a.box - b.box || a.due - b.due)

export const dayNumber = (d = new Date()) =>
  Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000)

const VAGUE = /\b(everything|anything|all of it|the whole thing|nothing|idk|i don'?t (get|know)( it)?|this stuff|any of it)\b/i
const words = s => (s || '').trim().split(/\s+/).filter(Boolean).length
const strip = (s, re) => clean((s || '').replace(re, ''))

export function precision(f = {}) {
  const ok = (s, n) => words(s) >= n && !VAGUE.test(s)
  const checks = [
    { id:'where', ok: (f.where || '').trim().length >= 3 && (/\d/.test(f.where) || words(f.where) >= 2),
      tip:'Name the exact spot: a page, problem number or slide.' },
    { id:'get',   ok: ok(f.get, 2),   tip:'Say one part you do understand.' },
    { id:'stuck', ok: ok(f.stuck, 2), tip:'Name the step where it stops making sense.' },
    { id:'tried', ok: ok(f.tried, 2), tip:'Say what you already tried, so the answer starts from there.' },
    { id:'ask',   ok: ok(f.ask, 3),   tip:'End with one question that has a short answer.' },
  ]
  const score = checks.filter(c => c.ok).length
  const line = score === 5 ? 'Clear. A teacher can answer this quickly.'
    : score >= 3 ? 'Close. Fill the parts marked below.' : 'Still vague. Add the parts marked below.'
  return { score, checks, line }
}

export function buildQuestion(f = {}) {
  const where = clean(f.where || '')
  const get = strip(f.get, /^\s*i (do )?understand\s+/i)
  const stuck = strip(f.stuck, /^\s*i get stuck (when|at|on)\s+/i)
  const tried = strip(f.tried, /^\s*i (already )?tried\s+/i)
  let ask = clean(f.ask || '').replace(/^\s*so my question is\s*/i, '')
  if (ask) ask = ask[0].toUpperCase() + ask.slice(1) + '?'
  return [
    where && `On ${where}:`,
    get && `I understand ${get}.`,
    stuck && `I get stuck when ${stuck}.`,
    tried && `I already tried ${tried}.`,
    ask,
  ].filter(Boolean).join(' ')
}
