/* The sentence under the student's dial.
 *
 * The owner, 17 October: "The sentence should talk about calmness, stress, or
 * stuff like that not the score, like 'You were agitated above your baseline
 * today at....' instead of 'your score was elevated..'".
 *
 * So the sentence names how the day went against the teen's own usual, in
 * everyday words (stressed, calm, tense, settled), and never prints a figure.
 * It is still generated from the day's series and the teen's own usual band,
 * so it stays true when the data changes. No clinical or diagnostic words:
 * BANNED below is checked by tests/student-sentence.test.js.
 *
 * `day` is [{ t: 'HH:MM', v }] on the 0 to 100 scale (higher, more stress);
 * `band` is the teen's usual { lo, hi }. Returns { lead, sub }: the lead is
 * one short sentence, `sub` an optional second one, or null. */

export const BANNED = ['anxious', 'anxiety', 'depressed', 'depression', 'panic', 'disorder',
  'symptom', 'agitated', 'score', 'elevated', 'baseline']

const hourOf = t => {
  const [h, m] = String(t).split(':').map(Number)
  return Number.isFinite(h) ? h + (Number.isFinite(m) ? m / 60 : 0) : null
}

/* 14:10 to "2 pm". Rounded to the nearest hour on purpose: the reader is told
   roughly when the day turned, and the exact clock is under the day chart. */
export function hourLabel(t) {
  const x = hourOf(t)
  if (x == null) return 'earlier'
  const h = Math.round(x) % 24
  if (h === 0) return 'midnight'
  if (h === 12) return 'noon'
  return h < 12 ? `${h} am` : `${h - 12} pm`
}

const mean = a => a.reduce((s, p) => s + p.v, 0) / a.length

export function daySentence({ day = [], band } = {}) {
  if (!day.length || !band) return { lead: 'No readings yet today.', sub: null }
  const { lo, hi } = band
  const above = p => p.v > hi
  const below = p => p.v < lo
  const morning = day.filter(p => hourOf(p.t) < 12)
  const morningCalm = morning.length > 0 && !morning.some(above)
  const morningLine = morningCalm
    ? (morning.every(below) ? 'Your stress was lower than usual all morning.' : 'Your stress stayed at or below usual all morning.')
    : null

  if (day.every(above)) return { lead: 'Your stress was higher than usual all day.', sub: null }
  if (day.every(below)) return { lead: 'Your stress was lower than usual all day.', sub: null }

  const first = day.findIndex(above)
  if (first >= 0) {
    const when = hourLabel(day[first].t)
    const last = day[day.length - 1]
    if (above(last)) {
      return { lead: `Your stress was higher than usual from about ${when}.`,
               sub: first > 0 ? morningLine : null }
    }
    const back = day.findIndex((p, i) => i > first && !above(p))
    return { lead: `Your stress was higher than usual around ${when}.`,
             sub: back > 0 ? `It was back in your usual range by ${hourLabel(day[back].t)}.` : morningLine }
  }

  if (morning.length && morning.every(below))
    return { lead: 'Your stress was lower than usual all morning.', sub: 'The rest of the day it was in your usual range.' }
  if (mean(day) < lo + (hi - lo) * 0.3)
    return { lead: 'Your stress was lower than usual today.', sub: null }
  return { lead: 'Your stress was in your usual range today.', sub: null }
}
