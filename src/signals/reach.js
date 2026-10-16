/* Reach: how far from home the week's readings happened.
 *
 * Location variance and the size of a person's daily circle track low mood
 * (Saeb 2015; Canzian and Musolesi 2015; replicated in students, Saeb
 * 2016). Those studies ran GPS in the background for weeks. A web app
 * cannot, and MindMap would not: it asks for a position only at the moment
 * a reading is taken, keeps it on the device, and derives one number from a
 * week of them. No map, no place name, nothing shared. Location is already
 * on the never-shared list for every audience and stays there.
 *
 * Home is not an address the student types. It is the densest point among
 * the readings: the one with the most other readings within 300 metres. */

const R = 6371

export function haversineKm(a, b) {
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

export function homePoint(points, radiusKm = 0.3) {
  if (!points.length) return null
  let best = null, bestN = -1
  for (const p of points) {
    let n = 0
    for (const q of points) if (haversineKm(p, q) <= radiusKm) n++
    if (n > bestN) { bestN = n; best = p }
  }
  return { lat: best.lat, lon: best.lon, support: bestN }
}

/* Readings with `t` in [from, to). */
export function weeklyReach(points, home, from, to, { awayKm = 0.5 } = {}) {
  const week = points.filter(p => p.t >= from && p.t < to)
  if (!home || !week.length) return { readings: week.length, farthestKm: null, awayShare: null, meanKm: null }
  const d = week.map(p => haversineKm(p, home))
  return {
    readings: week.length,
    farthestKm: Math.max(...d),
    meanKm: d.reduce((a, b) => a + b, 0) / d.length,
    awayShare: d.filter(x => x > awayKm).length / d.length,
  }
}

export function reachWords(thisWeek, lastWeek) {
  if (thisWeek?.farthestKm == null) return 'No readings with a location yet this week.'
  const km = thisWeek.farthestKm.toFixed(1)
  if (lastWeek?.farthestKm == null) return `Your readings this week reached ${km} km from home.`
  const last = lastWeek.farthestKm.toFixed(1)
  return `Your readings this week reached ${km} km from home. Last week, ${last} km.`
}
