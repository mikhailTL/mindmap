import { FAMILY, TODAY } from '../../lib/roster'
import { DATA } from '../../lib/assets'
import { SIGNAL } from '../../signals/light.js'

/* The demo teen behind the student dashboard: Maya, the first child on the
 * parent's demo (roster FAMILY[0]), so the student, the parent and the
 * Counselor/Professional read the same girl.
 *
 * One change to her record: today. The dial and its sentence are drawn from
 * the demo day series (src/lib/assets DATA.day), so today's calendar cell and
 * today's hours are recomputed from that same series. Otherwise the calendar
 * would print one figure for today and the dial another. Generated, not
 * measured; the screens say "Demo". */

export const DEMO_FIRST = FAMILY[0].first

const avg = a => Math.round(a.reduce((s, v) => s + v, 0) / a.length)

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

/* Heads Up, in the teen's own words. The parent's labels (SIGNAL in
   src/signals/light.js) are written for an adult reading about someone
   else; the teen reads what their own hands did. */
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
