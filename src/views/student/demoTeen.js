import { FAMILY, TODAY } from '../../lib/roster'
import { DATA } from '../../lib/assets'
import { SIGNAL } from '../../signals/light.js'

export const DEMO_FIRST = FAMILY[0].first

const avg = a => Math.round(a.reduce((s, v) => s + v, 0) / a.length)

// The roster's first child with today rebuilt from the demo day series (DATA.day), so the dial
// and today's calendar cell print the same figure.
export const TEEN = (() => {
  const t = FAMILY[0]
  const day = DATA.day || []
  if (!day.length) return t
  const byHour = new Map()
  for (const p of day) {
    const h = Number(String(p.t).slice(0, 2))
    if (!byHour.has(h)) byHour.set(h, [])
    byHour.get(h).push(p.v)
  }
  const hours = [...byHour].map(([hour, vs]) => ({ hour, score: avg(vs) }))
  const days = t.days.slice()
  const last = days[days.length - 1]
  days[days.length - 1] = { ...last, score: avg(day.map(p => p.v)) }
  return { ...t, days, hours }
})()

export { TODAY }

// Signal names in the teen's own words; SIGNAL in signals/light.js is worded for a parent.
const TEEN_WORDS = {
  pxPerSec: 'fast scrolling',
  reversals: 'scrolling back and forth',
  medianGap: 'fast typing',
  deletions: 'lots of deleting',
  minutes: 'a long stretch without a break',
  motion: 'a restless hand',
}
const KEY_OF = Object.fromEntries(Object.entries(SIGNAL).map(([k, v]) => [v, k]))
export const teenSignal = label => TEEN_WORDS[KEY_OF[label]] || String(label).toLowerCase()

export const LIGHT_WORD = { green: 'Green', yellow: 'Yellow', red: 'Red' }
export const LIGHT_MEANS = {
  green: 'Your phone use looked like your usual.',
  yellow: 'A little more tense than your usual.',
  red: 'Much more tense than your usual.',
}

/* Dates. The roster keys days as YYYY-MM-DD at noon UTC. */
const D = iso => new Date(iso + 'T12:00:00Z')
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WD_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December']
export const shortDate = iso => { const d = D(iso); return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}` }
export const dayName = iso => WD_LONG[D(iso).getUTCDay()]
export const addDays = (iso, n) => new Date(D(iso).getTime() + n * 86400000).toISOString().slice(0, 10)
