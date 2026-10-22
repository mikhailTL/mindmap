// The plain-words sentence under the student's dial, from the day's series [{ t: 'HH:MM', v }] and the
// usual band { lo, hi }. It describes stress against the teen's usual and prints no figure.
export const BANNED = ['anxious', 'anxiety', 'depressed', 'depression', 'panic', 'disorder',
  'symptom', 'agitated', 'score', 'elevated', 'baseline']

const hourOf = t => {
  const [h, m] = String(t).split(':').map(Number)
  return Number.isFinite(h) ? h + (Number.isFinite(m) ? m / 60 : 0) : null
}

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
  // A day averaging in the bottom 30% of the usual band reads as lower than usual.
  if (mean(day) < lo + (hi - lo) * 0.3)
    return { lead: 'Your stress was lower than usual today.', sub: null }
  return { lead: 'Your stress was in your usual range today.', sub: null }
}
