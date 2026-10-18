import React from 'react'
import { FACE_LABEL } from '../../lib/roster'
import { FaceTrend, LampFace } from '../../traffic/Face'
import { AvatarArt } from '../../account/avatars'
import { RainbowDial } from '../../charts/rainbow'
import { ringsFor } from '../pro/charts'
import { Chevron } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { toneOf } from '../pro/look'
import { PREV, RANGE_DAYS, STATUS_WORD, displayName, isPro, metaLine, showsScore, showsTrends, statusOfTeen,
  summaryOf } from './data'

/* A linked teen as a card in the Counselor/Professional's live caseload, and
 * the parts the other cards share: TeenAvatar, CardDial and StatusMark.
 *
 * TeenCard({ teen, onOpen, variant, range })   range: the figure in the dial */

export function TeenAvatar({ teen, variant, size = 'size-12' }) {
  if (teen.avatar && !isPro(variant)) return <AvatarArt id={teen.avatar} className={size}/>
  const label = isPro(variant) && !teen.consent?.name ? teen.pseudonym.replace(/\D/g, '').slice(-2) : teen.initial
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-chip bg-accent-wash font-display',
      'text-ui font-bold text-accent-ink', size)}>{label}</span>
  )
}

/* The small rainbow on a card, with the Mind Score for the range in its
   centre. The owner, 18 October: "On the parent cards for kids, it should show
   the rainbow (small) with the mindscore, same for counselors (except kids
   that dont share with them)". The caller decides whether the score is shared
   and draws nothing when it is not; this only draws.
   The bands are the day's signals for Day and their average over the days
   for Week and Month, so the arch and the figure cover the same days. A
   linked account sends no body signals, so a live teen's dial is the scale,
   the usual-day mark and the figure, as on their page. */
export function cardRings(teen, range = 'day') {
  if (teen.live || !teen.days?.length) return []
  const days = teen.days.slice(-(RANGE_DAYS[range] || 1)).filter(d => d.pulse != null)
  if (!days.length) return []
  const per = days.map(d => ringsFor(teen, d))
  return per[0].map((r, i) => ({ ...r, value: Math.round(per.reduce((t, p) => t + p[i].value, 0) / per.length) }))
}

export function CardDial({ teen, range = 'day', score, size = 148, className }) {
  const rings = React.useMemo(() => cardRings(teen, range), [teen, range])
  return <RainbowDial compact score={score} usual={teen.usual?.base} rings={rings} size={size} weather={false}
    className={className}/>
}

/* `change`, when given, puts the up / down / level arrow beside the face. */
export function StatusMark({ teen, range = 'week', size = 30, change = null, className }) {
  const light = statusOfTeen(teen, range)
  if (!light) return null
  return (
    <span className={cn('flex shrink-0 items-center gap-2', className)}>
      <LampFace light={light} size={size}/>
      <span className="font-display text-ui font-bold leading-none text-ink">{STATUS_WORD[light]}</span>
      <FaceTrend change={change} since={PREV[range]} small/>
    </span>
  )
}

/* Where the range's Mind Score sits against this teen's own usual range. */
const WHEN = { day: 'today', week: 'this week', month: 'this month' }
function usualWord(teen, v, range) {
  if (!teen.usual) return null
  const when = WHEN[range] || WHEN.week
  if (v > teen.usual.hi) return `Above usual ${when}`
  if (v < teen.usual.lo) return `Below usual ${when}`
  return `In their usual range ${when}`
}

/* The week against the 7 days before, in words. */
function weekWords(teen) {
  const c = summaryOf(teen, 'week').change
  if (c == null) return 'Nothing earlier to compare'
  const pts = n => `${n} ${n === 1 ? 'point' : 'points'}`
  return c > 0 ? `Week up ${pts(c)}` : c < 0 ? `Week down ${pts(Math.abs(c))}` : 'Week unchanged'
}

/* The owner, 18 October: the live card is drawn like the demo
   Counselor/Professional card (../pro/TeenCard.jsx): avatar, Heads Up face,
   the small rainbow with the Mind Score when shared, one line against the
   usual range, one line for the week, Open record. No sparkline, no row of
   ranges. `range` picks the figure in the rainbow. */
export default function TeenCard({ teen, onOpen, variant = 'parent', range = 'week', className }) {
  const s = summaryOf(teen, range)
  const light = statusOfTeen(teen, range)
  const name = displayName(teen, variant)
  const score = showsScore(teen, variant)
  const trends = showsTrends(teen, variant)
  const tone = (score && toneOf(light)) || null
  const empty = s.mean == null
  const usual = score && !empty ? usualWord(teen, s.mean, range) : null
  const week = score && !empty ? (trends ? weekWords(teen) : 'Trend not shared') : null
  const status = !score ? 'Mind Score not shared' : empty ? 'No readings yet'
    : [light && `${FACE_LABEL[range]}: ${STATUS_WORD[light]}`, `Mind Score ${s.mean} of 100`, usual, week]
      .filter(Boolean).join('. ')

  return (
    <article aria-label={name}
      className={cn('group relative flex h-full w-full flex-col rounded-panel border-2 bg-card p-3.5 text-left',
        'transition-colors duration-150 hoverOnly:border-ink/50 lg:p-4', tone ? tone.edge : 'border-rule', className)}>
      <div className="flex items-center gap-3">
        <TeenAvatar teen={teen} variant={variant} size="size-11"/>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate font-display text-ui font-bold text-ink">{name}</h3>
          <p className="m-0 text-fine text-ink-2">{metaLine(teen, variant)}</p>
        </div>
        {tone && (
          <span className={cn('flex shrink-0 items-center gap-1.5 rounded-field px-2 py-1', tone.band)}>
            <LampFace light={light} size={28}/>
            <span className={cn('font-display text-fine font-bold', tone.ink)}>{STATUS_WORD[light]}</span>
          </span>
        )}
      </div>

      {!score ? (
        <p className="m-0 mt-3 text-ui text-ink-2">Mind Score not shared.</p>
      ) : empty ? (
        <p className="m-0 mt-3 font-display text-ui font-bold text-ink">No readings yet</p>
      ) : (
        <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4">
          <CardDial teen={teen} range={range} score={s.mean} size={136} className="w-[136px]"/>
          <div className="min-w-0">
            {usual && <p className="m-0 font-display text-ui font-bold text-ink">{usual}</p>}
            <p className="m-0 mt-1 text-fine text-ink-2">{week}</p>
          </div>
        </div>
      )}

      <div className="mt-auto pt-2">
        <button type="button" onClick={() => onOpen?.(teen)} aria-label={`${name}. ${status}. Open record`}
          className="inline-flex min-h-[44px] items-center gap-1 font-display text-ui font-bold text-accent
            after:absolute after:inset-0 after:rounded-panel after:content-[''] hoverOnly:text-accent-ink">
          Open record<Chevron aria-hidden className="size-4"/></button>
      </div>
    </article>
  )
}
