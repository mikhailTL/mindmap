/* The pure parts of the Life tools: sums, dates and checks. No React and no
 * storage here, so every rule can be tested on its own (tests/skills-life). */

export const storeKey = id => 'mindmap.skills.' + id

const num = v => { const n = typeof v === 'number' ? v : parseFloat(v); return Number.isFinite(n) ? n : 0 }
const pos = v => Math.max(0, num(v))

const USD = new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' })
export const money = n => USD.format(num(n))
/* Drops the cents when there are none, or always with `whole`, for a figure
   that has to fit a third of a phone screen. */
const USD0 = new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 })
export const moneyShort = (n, whole = false) => {
  const v = Math.round(num(n) * 100) / 100
  return whole || Number.isInteger(v) ? USD0.format(v) : USD.format(v)
}

/* ── Money ─────────────────────────────────────────────────────────────── */

const PER_MONTH = { weekly: 52 / 12, monthly: 1, yearly: 1 / 12 }
export const monthlyCost = (price, cycle) => pos(price) * (PER_MONTH[cycle] ?? 1)

/* A subscription is flagged when it has not been used this month or the
   person cannot remember when they last used it. */
const FORGOTTEN = new Set(['not-month', 'unsure'])
export function subsTotals(list = []) {
  let monthly = 0, flaggedMonthly = 0
  const flagged = []
  for (const s of list) {
    const m = monthlyCost(s.price, s.cycle)
    monthly += m
    if (FORGOTTEN.has(s.used)) { flagged.push(s.id); flaggedMonthly += m }
  }
  return { monthly, yearly: monthly * 12, flagged, flaggedYearly: flaggedMonthly * 12 }
}

export const PAUSE_HOURS = 24
export function pauseStatus(addedAt, now, hours = PAUSE_HOURS) {
  const ms = num(addedAt) + hours * 3600e3 - num(now)
  if (ms <= 0) return { ready: true, left: '' }
  const mins = Math.floor(ms / 60e3)
  const h = Math.floor(mins / 60), m = mins % 60
  const left = mins < 1 ? 'under 1 min' : h ? `${h} h ${m} min` : `${m} min`
  return { ready: false, left }
}

export function budget(income = [], spend = []) {
  const sum = rows => Math.round(rows.reduce((t, r) => t + pos(r.amount), 0) * 100) / 100
  const i = sum(income), s = sum(spend)
  const left = Math.round((i - s) * 100) / 100
  return { income: i, spending: s, left, over: left < 0 }
}

/* Future value with monthly compounding and a deposit at the end of each
   month:  FV = P(1 + r/12)^(12t) + PMT * ((1 + r/12)^(12t) - 1) / (r/12)
   Walked month by month so the chart can show every year. */
export function compound({ start = 0, monthly = 0, rate = 0, years = 10 } = {}) {
  const P = pos(start), PMT = pos(monthly), r = Math.min(pos(rate), 100) / 100
  const Y = Math.max(1, Math.min(50, Math.round(pos(years)) || 1))
  const i = r / 12
  let value = P, contributed = P
  const byYear = []
  for (let m = 1; m <= Y * 12; m++) {
    value = value * (1 + i) + PMT
    contributed += PMT
    if (m % 12 === 0) byYear.push({ year: m / 12, contributed, value })
  }
  return { total: value, contributed, interest: value - contributed, byYear }
}

/* ── Dates (YYYY-MM-DD, read as calendar days, never as a time zone) ───── */

const parse = s => { const [y, m, d] = String(s).split('-').map(Number); return [y, m, d] }
const valid = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export function addMonths(s, n) {
  const [y, m, d] = parse(s)
  const total = (m - 1) + num(n)
  const ny = y + Math.floor(total / 12), nm = ((total % 12) + 12) % 12 + 1
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate()
  return iso(ny, nm, Math.min(d, last))
}

export function daysBetween(a, b) {
  const [y1, m1, d1] = parse(a), [y2, m2, d2] = parse(b)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5)
}

export function todayISO(d = new Date()) { return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()) }

export function niceDate(s) {
  if (!valid(s)) return ''
  const [y, m, d] = parse(s)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', timeZone:'UTC' })
}

/* ── Vehicle ───────────────────────────────────────────────────────────── */

export const SOON_DAYS = 30, SOON_MILES = 500

/* Due by whichever comes first, date or miles, using the intervals the
   person set from their owner's manual. */
export function vehicleStatus(item = {}, { today, miles } = {}) {
  const byDate = valid(item.lastDate) && pos(item.everyMonths) > 0
  const byMiles = item.lastMiles !== '' && item.lastMiles != null && pos(item.everyMiles) > 0
  if (!byDate && !byMiles) return { state: 'unset' }
  const out = { state: 'ok' }
  const rank = { ok: 0, soon: 1, due: 2 }
  const worse = s => { if (rank[s] > rank[out.state]) out.state = s }
  if (byDate) {
    out.nextDate = addMonths(item.lastDate, pos(item.everyMonths))
    out.daysLeft = daysBetween(today, out.nextDate)
    worse(out.daysLeft <= 0 ? 'due' : out.daysLeft <= SOON_DAYS ? 'soon' : 'ok')
  }
  if (byMiles) {
    out.nextMiles = pos(item.lastMiles) + pos(item.everyMiles)
    if (miles !== '' && miles != null && Number.isFinite(num(miles)) && num(miles) > 0) {
      out.milesLeft = out.nextMiles - num(miles)
      worse(out.milesLeft <= 0 ? 'due' : out.milesLeft <= SOON_MILES ? 'soon' : 'ok')
    }
  }
  return out
}

/* ── Transit ───────────────────────────────────────────────────────────── */

export function leaveBy(arrive, minutes, buffer) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(arrive || ''))
  if (!m) return ''
  let t = (+m[1] * 60 + +m[2] - pos(minutes) - pos(buffer)) % 1440
  if (t < 0) t += 1440
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

/* "15:25" to "3:25 PM", the way a US phone shows it. */
export function clock12(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''))
  if (!m) return ''
  const h = +m[1] % 24
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`
}

export function tripCard(t = {}) {
  const lines = [`Trip: ${t.from || 'Start'} to ${t.to || 'destination'}`]
  if (t.arrive) lines.push(`Arrive by ${clock12(t.arrive)}. Leave by ${clock12(leaveBy(t.arrive, t.minutes, t.buffer))}.`)
  if (t.line) lines.push(`Take: ${t.line}`)
  if (t.stop) lines.push(`Get on at: ${t.stop}`)
  if (t.off) lines.push(`Get off at: ${t.off}`)
  if (t.back) lines.push(`Last ride back: ${clock12(t.back)}`)
  if (t.backup) lines.push(`Backup plan: ${t.backup}`)
  return lines.join('\n')
}

/* ── Meals ─────────────────────────────────────────────────────────────── */

export function shoppingList(plan = [], recipes = {}) {
  const map = new Map()
  for (const id of plan) {
    const r = id && recipes[id]
    if (!r) continue
    for (const [name, amount] of r.ingredients) {
      if (!map.has(name)) map.set(name, { name, uses: [] })
      map.get(name).uses.push(amount)
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/* ── Stress ────────────────────────────────────────────────────────────── */

const PART_TO_EXERCISE = {
  jaw: 'jaw', shoulders: 'shoulders', hands: 'hands',
  chest: 'breathing', breath: 'breathing', stomach: 'breathing', mind: 'ground',
}
export function checkinSuggest(tight = []) {
  const out = []
  for (const p of tight) { const e = PART_TO_EXERCISE[p]; if (e && !out.includes(e)) out.push(e) }
  return out.length ? out : ['ground']
}

/* Eight signs, each 0 not really, 1 sometimes, 2 often. A sorting of where
   to start, not a test and not a diagnosis. */
export const BURNOUT_ITEMS = 8
export function burnoutResult(answers = []) {
  const complete = answers.length === BURNOUT_ITEMS && answers.every(a => a === 0 || a === 1 || a === 2)
  const score = answers.reduce((t, a) => t + (a === 1 || a === 2 ? a : 0), 0)
  const level = score >= 10 ? 'high' : score >= 5 ? 'some' : 'low'
  return { complete, score, level }
}

/* ── Health ────────────────────────────────────────────────────────────── */

export const REFILL_SOON = 7
export function refillStatus(date, today) {
  if (!valid(date)) return { state: 'unset' }
  const days = daysBetween(today, date)
  return { state: days < 0 ? 'overdue' : days <= REFILL_SOON ? 'soon' : 'ok', days }
}

export function visitNote(p = {}) {
  const lines = []
  const add = (label, v) => { if (v && String(v).trim()) lines.push(`${label}: ${String(v).trim()}`) }
  add('Reason', p.reason)
  add('Started', p.started)
  add('Where and what it feels like', p.feels)
  add('Better with', p.better)
  add('Worse with', p.worse)
  add('What I have tried', p.tried)
  add('Medicines I take', p.meds)
  const qs = (p.questions || []).filter(q => q && q.trim())
  if (qs.length) { lines.push('Questions:'); for (const q of qs) lines.push(`- ${q.trim()}`) }
  return lines.join('\n')
}
