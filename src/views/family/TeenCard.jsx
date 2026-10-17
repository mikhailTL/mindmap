import React from 'react'
import { RANGE_LABEL, statusOf, summary } from '../../lib/roster'
import { LampFace } from '../../traffic/Face'
import { AvatarArt } from '../../account/avatars'
import { Chevron } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { RangeSwitch, Sparkline } from './RangeTrend'
import { STATUS_SUB, STATUS_WORD, changeWords, displayName, isPro, showsScore, showsTrends,
  sourceLine } from './data'

/* One teen as a card: who, the face for their last three days with its word,
 * the Mind Score for the range with its change and a sparkline, and where the
 * readings come from. The whole card opens the teen's page.
 *
 * TeenCard({ teen, onOpen, variant = 'parent' | 'pro', range, onRange })
 *   range given      the card follows it (a switch shared at the top)
 *   range not given  the card carries its own Day / Week / Month switch
 *
 * The card is a stretched button: the name's button covers the card, and the
 * switch, when there is one, sits above it so both stay reachable. */

export function TeenAvatar({ teen, variant, size = 'size-12' }) {
  if (teen.avatar && !isPro(variant)) return <AvatarArt id={teen.avatar} className={size}/>
  const label = isPro(variant) && !teen.consent?.name ? teen.pseudonym.replace(/\D/g, '').slice(-2) : teen.initial
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-chip bg-accent-wash font-display',
      'text-ui font-bold text-accent-ink', size)}>{label}</span>
  )
}

export function StatusMark({ teen, size = 30, className }) {
  const light = statusOf(teen)
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
  const s = summary(teen, range)
  const light = statusOf(teen)
  const name = displayName(teen, variant)
  const score = showsScore(teen, variant)
  const trends = showsTrends(teen, variant)
  const meta = isPro(variant) ? `Grade ${teen.grade}` : `${teen.age}, grade ${teen.grade}`
  const titleId = React.useId()

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
              aria-label={`${name}. ${STATUS_WORD[light]}, ${STATUS_SUB[light].toLowerCase()}. Open ${isPro(variant) ? 'record' : 'their page'}`}
              className="text-left after:absolute after:inset-0 after:rounded-panel after:content-['']
                focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2
                focus-visible:after:outline-offset-2 focus-visible:after:outline-accent">
              {name}
            </button>
          </h3>
          <p className="m-0 mt-0.5 text-fine text-ink-2">{meta}</p>
        </div>
        {score ? (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusMark teen={teen}/>
            <span className="text-fine text-ink-3">Last 3 days</span>
          </div>
        ) : <span className="shrink-0 text-fine text-ink-2">Not shared</span>}
      </div>

      <div className="mt-5 border-t border-rule pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="m-0 text-fine font-semibold text-ink-2">Mind Score, {RANGE_LABEL[range].toLowerCase()}</p>
          {ownSwitch && <RangeSwitch compact value={range} onChange={onRange ?? setOwn} label={`${name} range`}/>}
        </div>
        {score ? (
          <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-x-4">
            <div>
              <p className="m-0 font-display text-stat font-bold tabular-nums leading-none text-ink">{s.mean}</p>
              <p className="m-0 mt-1.5 text-fine text-ink-2">{trends ? changeWords(s.change, range, variant) : 'Trend not shared'}</p>
            </div>
            {trends && <Sparkline teen={teen} range={range} variant={variant} className="self-center"/>}
          </div>
        ) : (
          <p className="m-0 mt-2 text-ui text-ink-2">Crisis alerts only.</p>
        )}
        {score && (
          <p className="m-0 mt-2 text-fine text-ink-3">Usual {teen.usual.lo} to {teen.usual.hi}</p>
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
