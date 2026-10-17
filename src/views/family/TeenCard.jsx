import React from 'react'
import { FACE_LABEL, RANGE_LABEL } from '../../lib/roster'
import { LampFace } from '../../traffic/Face'
import { AvatarArt } from '../../account/avatars'
import { Chevron } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { RangeSwitch, Sparkline } from './RangeTrend'
import { STATUS_SUB, STATUS_WORD, changeWords, displayName, isPro, metaLine, showsScore, showsTrends,
  sourceLine, statusOfTeen, summaryOf } from './data'

/* One teen as a card: who, the Heads Up face for the range shown (today's,
 * or the week's or month's average) with its word,
 * the Mind Score for the range with its change and a sparkline, and where the
 * readings come from. The whole card opens the teen's page.
 *
 * TeenCard({ teen, onOpen, variant = 'parent' | 'pro', range, onRange })
 *   range given      the card follows it (a switch shared at the top)
 *   range not given  the card carries its own Day / Week / Month switch
 *
 * The card is a stretched button: the name's button covers the card, and the
 * switch, when there is one, sits above it so both stay reachable. */

const RANGES_ROW = [['day', 'Today'], ['week', 'Week'], ['month', 'Month']]

export function TeenAvatar({ teen, variant, size = 'size-12' }) {
  if (teen.avatar && !isPro(variant)) return <AvatarArt id={teen.avatar} className={size}/>
  const label = isPro(variant) && !teen.consent?.name ? teen.pseudonym.replace(/\D/g, '').slice(-2) : teen.initial
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-chip bg-accent-wash font-display',
      'text-ui font-bold text-accent-ink', size)}>{label}</span>
  )
}

export function StatusMark({ teen, range = 'week', size = 30, className }) {
  const light = statusOfTeen(teen, range)
  if (!light) return null
  return (
    <span className={cn('flex shrink-0 items-center gap-2', className)}>
      <LampFace light={light} size={size}/>
      <span className="font-display text-ui font-bold leading-none text-ink">{STATUS_WORD[light]}</span>
    </span>
  )
}

export default function TeenCard({ teen, onOpen, variant = 'parent', range: given, onRange, className }) {
  const [own, setOwn] = React.useState('week')
  const range = given ?? own
  const ownSwitch = given == null
  const s = summaryOf(teen, range)
  const light = statusOfTeen(teen, range)
  const name = displayName(teen, variant)
  const score = showsScore(teen, variant)
  const trends = showsTrends(teen, variant)
  const meta = metaLine(teen, variant)
  const titleId = React.useId()
  /* A linked teen with nothing in this range yet: say so, never a number. */
  const empty = s.mean == null
  const status = light ? `${FACE_LABEL[range]}: ${STATUS_WORD[light]}, ${STATUS_SUB[light].toLowerCase()}`
    : !score ? 'Mind Score not shared' : empty ? 'No readings yet' : `Mind Score ${s.mean}`

  return (
    <article aria-labelledby={titleId}
      className={cn('group relative flex flex-col rounded-panel border border-rule bg-card p-5 shadow-card',
        'transition-[box-shadow,border-color] duration-200 ease-out hoverOnly:border-ruling hoverOnly:shadow-raise',
        'focus-within:border-accent motion-reduce:transition-none', className)}>
      <div className="flex items-start gap-3.5">
        <TeenAvatar teen={teen} variant={variant}/>
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="m-0 font-display text-head font-bold leading-tight text-ink">
            <button type="button" onClick={() => onOpen?.(teen)}
              aria-label={`${name}. ${status}. Open ${isPro(variant) ? 'record' : 'their page'}`}
              className="text-left after:absolute after:inset-0 after:rounded-panel after:content-['']
                focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2
                focus-visible:after:outline-offset-2 focus-visible:after:outline-accent">
              {name}
            </button>
          </h3>
          <p className="m-0 mt-0.5 text-fine text-ink-2">{meta}</p>
        </div>
        {score ? light && (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusMark teen={teen} range={range}/>
            <span className="text-fine text-ink-3">{FACE_LABEL[range]}</span>
          </div>
        ) : <span className="shrink-0 text-fine text-ink-2">Not shared</span>}
      </div>

      <div className="mt-5 border-t border-rule pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="m-0 text-fine font-semibold text-ink-2">Mind Score, {RANGE_LABEL[range].toLowerCase()}</p>
          {ownSwitch && <RangeSwitch compact value={range} onChange={onRange ?? setOwn} label={`${name} range`}/>}
        </div>
        {score && empty ? (
          <p className="m-0 mt-2 font-display text-ui font-bold text-ink">No readings yet</p>
        ) : score ? (
          <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-x-4">
            <div>
              <p className="m-0 font-display text-stat font-bold tabular-nums leading-none text-ink">{s.mean}</p>
              <p className="m-0 mt-1.5 text-fine text-ink-2">{!trends ? 'Trend not shared'
                : s.change == null ? 'Nothing earlier to compare' : changeWords(s.change, range, variant)}</p>
            </div>
            {trends && <Sparkline teen={teen} range={range} variant={variant} className="self-center"/>}
          </div>
        ) : (
          <p className="m-0 mt-2 text-ui text-ink-2">{teen.live ? 'Their Mind Score is not shared.' : 'Crisis alerts only.'}</p>
        )}
        {score && teen.usual && (
          <p className="m-0 mt-2 text-fine text-ink-3">Usual {teen.usual.lo} to {teen.usual.hi}
            {teen.usual.general ? ', the general range until three days of readings' : ''}</p>
        )}
        {/* The three ranges side by side, each a mean of whole days. */}
        {score && trends && !empty && (
          <dl className="m-0 mt-3 grid grid-cols-3 gap-2 border-t border-rule pt-2.5">
            {RANGES_ROW.map(([r, label]) => {
              const m = summaryOf(teen, r).mean
              return (
                <div key={r} className="min-w-0">
                  <dt className="text-fine text-ink-3">{label}</dt>
                  <dd className={cn('m-0 font-display text-ui tabular-nums', m == null ? 'font-medium text-ink-2' : 'font-bold text-ink')}>
                    {m == null ? 'None' : m}</dd>
                </div>
              )
            })}
          </dl>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <p className="m-0 text-fine text-ink-2">{sourceLine(teen)}</p>
        <span aria-hidden className="flex items-center gap-1 font-display text-fine font-bold text-accent-ink">
          Open<Chevron className="size-4 transition-transform duration-200 groupHoverOnly:translate-x-0.5
            motion-reduce:transition-none"/>
        </span>
      </div>
    </article>
  )
}
