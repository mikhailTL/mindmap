import React from 'react'
import { LampFace, LampFaceG } from '../../traffic/Face'
import { SENSORS } from '../../lib/sensors'
import { cn } from '../../lib/utils'
import { useWidth } from './parts'
import { STATUS_WORD } from './metrics'
import { LIGHT_TONE } from './look'

/* The charts the Medical Professional reads, one kind per job, the same on
 * every teen. The owner: "graphs ... should be easy to read, not like the box
 * whisker looking one u use". So: a bar per day, the teen's usual range as a
 * soft band behind the bars, both axes named, and the Heads Up face under each
 * day. No min to max bands, no whiskers. */

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
const mean = a => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length)

/* The four dial bands for one day, each 0 to 100 against this teen's own last
   thirty days: 50 is their usual, a standard deviation is 18 points. Sweat
   and temperature come from the patch, so a teen without one has two bands. */
export function ringsFor(teen, d = teen.days[teen.days.length - 1]) {
  const past = teen.days.slice(-31, -1)
  const z = k => {
    const v = past.map(x => x[k]), m = mean(v)
    const sd = Math.sqrt(mean(v.map(x => (x - m) ** 2))) || 1
    return (d[k] - m) / sd
  }
  const val = v => Math.round(clamp(50 + v * 18, 2, 98))
  return [
    { id: 'heart', value: val((z('pulse') - z('hrv')) / 2) },
    { id: 'sweat', value: val(z('eda')), patch: true },
    { id: 'temp', value: val(-z('temp')), patch: true },
    { id: 'move', value: val(z('steps')) },
  ].filter(r => teen.patch || !r.patch).map(r => ({ ...r, name: SENSORS[r.id].name, glow: SENSORS[r.id].glow }))
}

/* A group's bands: the average of each band across the teens who have it,
   and only where at least `k` teens do. */
export function groupRings(teens, k) {
  const by = {}
  for (const t of teens) for (const r of ringsFor(t)) (by[r.id] = by[r.id] || []).push(r.value)
  return Object.keys(SENSORS).filter(id => (by[id] || []).length >= k)
    .map(id => ({ id, value: Math.round(mean(by[id])), name: SENSORS[id].name, glow: SENSORS[id].glow }))
}

const dayNum = iso => String(Number(iso.slice(8)))

/* Daily Mind Score as bars. `days` are { date, weekday, score, light? };
   `usual` is { lo, hi } or null. `compact` is the card's smaller version. */
export function DailyChart({ days, usual, compact = false, faces = true, who = 'this teen', className }) {
  const [box, W] = useWidth(compact ? 320 : 640)
  const n = days.length
  const L = 34, R = 6, T = 8
  const PH = compact ? 100 : 168
  const slot = (W - L - R) / n
  const showFaces = faces && slot >= 11
  const face = Math.min(compact ? 18 : 22, Math.floor(slot - 3))
  const FH = showFaces ? face + 8 : 0
  const base = T + PH
  const H = base + FH + 18 + 18
  const y = v => base - (v / 100) * PH
  const bw = Math.min(compact ? 26 : 34, slot * 0.64)
  const cx = i => L + slot * (i + 0.5)
  const ticks = compact ? [0, 50, 100] : [0, 25, 50, 75, 100]
  const week = n <= 7
  const values = slot >= 26
  const labelAt = i => week || i === n - 1 || (n - 1 - i) % 5 === 0
  const aria = `Mind Score each day, out of 100: `
    + days.map(d => `${week ? d.weekday : dayNum(d.date)} ${d.score}${d.light ? ` ${STATUS_WORD[d.light]}` : ''}`).join(', ')
    + (usual ? `. Usual range for ${who}, ${usual.lo} to ${usual.hi}.` : '.')
  return (
    <div className={cn('w-full', className)}>
      <p className="m-0 text-fine text-ink-3">Mind Score each day, 0 calm to 100 peak</p>
      <div ref={box} className="mt-1 w-full">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block w-full overflow-visible" role="img"
          aria-label={aria}>
          {usual && <rect x={L} y={y(usual.hi)} width={W - L - R} height={y(usual.lo) - y(usual.hi)}
            className="fill-accent-wash"/>}
          {ticks.map(v => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} strokeWidth="1"
                className={v === 0 ? 'stroke-ink-3' : 'stroke-rule'}/>
              <text x={L - 6} y={y(v) + 4} textAnchor="end" className="fill-ink-3 text-[12px]">{v}</text>
            </g>
          ))}
          {usual && <>
            <line x1={L} x2={W - R} y1={y(usual.hi)} y2={y(usual.hi)} strokeWidth="1" strokeDasharray="3 3" className="stroke-accent"/>
            <line x1={L} x2={W - R} y1={y(usual.lo)} y2={y(usual.lo)} strokeWidth="1" strokeDasharray="3 3" className="stroke-accent"/>
          </>}
          {days.map((d, i) => {
            const top = y(d.score), last = i === n - 1
            return (
              <g key={d.date}>
                {/* A day with a light takes the lamp's hue; the face under the
                    bar and the printed figure carry the meaning. Today is
                    outlined in ink. */}
                <rect x={cx(i) - bw / 2} y={top} width={bw} height={Math.max(1, base - top)} rx={Math.min(4, bw / 3)}
                  className={d.light ? undefined : last ? 'fill-sky-ink' : 'fill-sky'}
                  style={d.light ? { fill: LIGHT_TONE[d.light].bar } : undefined}
                  stroke={last ? '#0d2b1e' : 'none'} strokeWidth={last ? 1.5 : 0}/>
                {values && <text x={cx(i)} y={top - 4} textAnchor="middle"
                  className={cn('text-[12px] tabular-nums', last ? 'fill-ink font-bold' : 'fill-ink-2')}>{d.score}</text>}
                {showFaces && d.light && <LampFaceG light={d.light} cx={cx(i)} cy={base + 4 + face / 2} size={face} px={face}/>}
                {labelAt(i) && <text x={cx(i)} y={base + FH + 14} textAnchor="middle"
                  className={cn('text-[12px]', last ? 'fill-ink font-bold' : 'fill-ink-3')}>
                  {last ? 'Today' : week ? d.weekday : dayNum(d.date)}</text>}
              </g>
            )
          })}
          <text x={L + (W - L - R) / 2} y={H - 3} textAnchor="middle" className="fill-ink-3 text-[12px]">
            {week ? 'Day of the week' : 'Day of the month'}</text>
        </svg>
      </div>
      <ul aria-hidden className="m-0 mt-1.5 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-fine text-ink-2">
        {usual && <li className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-xs border border-dashed border-accent bg-accent-wash"/>
          Usual for {who}, {usual.lo} to {usual.hi}</li>}
        {showFaces && days.some(d => d.light) && <li className="flex items-center gap-1.5">
          <LampFace light="green" size={14}/>Heads Up face for the day</li>}
      </ul>
    </div>
  )
}

/* Heads Up across a range, in counts, so a month reads at phone width too. */
export function FaceCounts({ days, className }) {
  const c = { green: 0, yellow: 0, red: 0 }
  for (const d of days) c[d.light]++
  return (
    <p className={cn('m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-fine text-ink-2', className)}>
      <span className="text-ink-3">Heads Up days</span>
      {['green', 'yellow', 'red'].map(k => (
        <span key={k} className="inline-flex items-center gap-1">
          <LampFace light={k} size={16}/>
          <span className="font-display font-bold tabular-nums text-ink">{c[k]}</span> {STATUS_WORD[k].toLowerCase()}
        </span>
      ))}
    </p>
  )
}
