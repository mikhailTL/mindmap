import React from 'react'
import { FACE_LABEL } from '../../lib/roster'
import { LampFace } from '../../traffic/Face'
import { ArrowRight } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { TeenAvatar } from './TeenCard'
import { SourceLine } from './Source'
import { STATUS_SUB, STATUS_WORD, metaLine, statusOfTeen, subOf } from './data'

/* One child on the parent's home: who, their Heads Up face for the range
 * picked at the top, today's Mind Score with what it means, where the
 * readings come from, and one solid Open button for their page (Today,
 * then their Trends and calendar).
 *
 * Today's figure only. The range on the face is named under it, so a week
 * face is never read as today's. */

export default function ParentCard({ teen, range = 'day', onOpen, className }) {
  const today = teen.days[teen.days.length - 1]
  const light = statusOfTeen(teen, range)
  const shared = teen.consent?.score !== false
  const titleId = React.useId()
  return (
    <article aria-labelledby={titleId}
      className={cn('flex flex-col rounded-panel border border-rule bg-card p-5 shadow-card', className)}>
      <div className="flex items-start gap-3.5">
        <TeenAvatar teen={teen} variant="parent" size="size-14"/>
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="m-0 font-display text-head font-bold leading-tight text-ink">{teen.name}</h3>
          <p className="m-0 mt-0.5 text-fine text-ink-2">{metaLine(teen, 'parent')}</p>
        </div>
        {shared && (
          <div className="flex shrink-0 flex-col items-center gap-1 text-center">
            {light ? <LampFace light={light} size={40}/>
              : <span aria-hidden className="grid size-10 place-items-center rounded-full border-2 border-dashed border-ink-3"/>}
            <span className="font-display text-fine font-bold leading-none text-ink">{light ? STATUS_WORD[light] : 'None yet'}</span>
            <span className="text-fine leading-tight text-ink-2">Heads Up<br/>{FACE_LABEL[range].toLowerCase()}</span>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-rule pt-4">
        <p className="m-0 text-fine font-semibold text-ink-2">Mind Score today</p>
        {!shared ? (
          <p className="m-0 mt-1.5 text-ui text-ink-2">{teen.first} does not share their Mind Score with you.</p>
        ) : today.score == null ? (
          <p className="m-0 mt-1.5 font-display text-ui font-bold text-ink">No readings yet today</p>
        ) : (
          <div className="mt-1 flex items-end gap-4">
            <p className="m-0 flex items-baseline gap-1.5">
              <span className="font-display text-stat font-bold tabular-nums leading-none text-ink">{today.score}</span>
              <span className="text-fine text-ink-2">of 100</span>
            </p>
            <div className="min-w-0 pb-0.5">
              {subOf(teen, today.score) && <p className="m-0 font-display text-ui font-bold leading-tight text-ink">{subOf(teen, today.score)}</p>}
              {teen.usual && <p className="m-0 text-fine text-ink-2">Usual {teen.usual.lo} to {teen.usual.hi}</p>}
            </div>
          </div>
        )}
      </div>

      <SourceLine teen={teen} className="mt-4 border-t border-rule pt-4"/>

      <button type="button" onClick={() => onOpen?.(teen)}
        aria-label={`Open ${teen.first}’s trends. ${light ? `${FACE_LABEL[range]}: ${STATUS_WORD[light]}, ${STATUS_SUB[light].toLowerCase()}.` : ''}`}
        className="group mt-5 flex min-h-[56px] w-full items-center justify-between gap-3 rounded-field bg-accent py-2 pl-5 pr-2
          font-display text-meta font-bold text-paper shadow-card transition-colors duration-150 hoverOnly:bg-accent-ink
          active:bg-accent-ink motion-reduce:transition-none focus-visible:outline focus-visible:outline-[3px]
          focus-visible:outline-offset-2 focus-visible:outline-ink">
        <span className="min-w-0 text-left">Open {teen.first}’s trends</span>
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-paper text-accent-ink">
          <ArrowRight className="size-5 transition-transform duration-150 groupHoverOnly:translate-x-0.5
            motion-reduce:transition-none"/>
        </span>
      </button>
    </article>
  )
}
