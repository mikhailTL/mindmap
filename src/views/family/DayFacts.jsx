import React from 'react'
import { LampFace } from '../../traffic/Face'
import { cn } from '../../lib/utils'
import { STATUS_SUB, STATUS_WORD } from './data'

/* One whole day for a parent: the Heads Up face and word, the Mind Score and
 * how it sits against the usual range. Nothing more; the owner, 18 October,
 * "remove these lengthy descriptions below the calendar". Used for the day
 * picked on the calendar. Never a time, a single reading, a note or a place. */

export default function DayFacts({ d, className }) {
  if (!d || d.score == null) {
    return <p className={cn('m-0 text-ui text-ink-2', className)}>No readings on this day.</p>
  }
  return (
    <div className={cn('flex items-center gap-3.5', className)}>
      {d.light && <LampFace light={d.light} size={44}/>}
      <div className="min-w-0 flex-1">
        <p className="m-0 font-display text-row font-bold leading-tight text-ink">
          {d.light ? STATUS_WORD[d.light] : 'Mind Score'}</p>
        {d.light && <p className="m-0 text-fine text-ink-2">{STATUS_SUB[d.light]}</p>}
      </div>
      <p className="m-0 shrink-0 text-right">
        <span className="block font-display text-stat font-bold tabular-nums leading-none text-ink">{d.score}</span>
        <span className="mt-1 block text-fine text-ink-2">Mind Score</span>
      </p>
    </div>
  )
}
