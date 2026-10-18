import React from 'react'
import { Button } from '../../ui/button'
import { Plus } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { bandOf, clearReadings, groupByDay } from '../../lib/readingLog'
import { BAND, SOURCE, Shape, clock, dayName, ringsFor, when } from './marks'
import { SCORE } from '../../lib/terms'
import { NoData } from '../student/charts'
import { RainbowDial } from '../../charts/rainbow'

/* The Mind Score Log, on the student's Trends tab (src/views/student/
 * TrendsTab.jsx). Read like a glucose log: every entry by day, each with a
 * note. The trend line itself is the tab's ScoreChart. Higher means more
 * stress: 0 calm to 100 peak. The "Time in your usual range" breakdown went on
 * 18 October ("everything looks too overwhelming"): the calendar and the
 * chart above already colour each day against the usual range. */

const PANEL = 'rounded-panel border border-rule/60 bg-card p-4 lg:p-5'

/* ── The latest reading ───────────────────────────────────────────────── */

function Latest({ entries, now }) {
  const last = entries[entries.length - 1]
  const b = BAND[bandOf(last.score)]
  const src = SOURCE[last.source]
  return (
    <section aria-labelledby="log-latest" className={PANEL}>
      <h3 id="log-latest" className="m-0 font-display text-head font-bold leading-tight text-ink">Latest {SCORE}</h3>
      {/* The latest reading on the rainbow, the same dial as the student
          screen. The up and down arrow beside it went on 18 October. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1">
        <RainbowDial score={last.score} size={240} className="shrink-0"
          rings={ringsFor(last)}/>
        <div className="min-w-0">
          <p className={cn('m-0 font-display text-row font-bold', b.ink)}>{b.word}</p>
          <p className="m-0 mt-1 flex flex-wrap items-center gap-x-2 text-meta text-ink-2">
            <span className="font-mono tabular-nums">{when(last.at, now)}</span>
            <span aria-hidden className="text-ink-3">·</span>
            <span className="inline-flex items-center gap-1.5">
              <src.Icon aria-hidden className="size-4 text-ink-3"/>{src.word}
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}

/* ── Entries by day ───────────────────────────────────────────────────── */

function NoteEditor({ entry, onSave, onCancel }) {
  const [text, setText] = React.useState(entry.note || '')
  const ref = React.useRef(null)
  React.useEffect(() => { ref.current?.focus() }, [])
  return (
    <form className="col-span-full mt-2 flex flex-wrap items-center gap-2"
      onSubmit={e => { e.preventDefault(); onSave(text) }}>
      <label className="sr-only" htmlFor={`note-${entry.id}`}>Note for the {clock(entry.at)} reading</label>
      <input ref={ref} id={`note-${entry.id}`} value={text} maxLength={280}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel() } }}
        placeholder="What was going on?"
        className="min-h-[44px] min-w-0 flex-1 basis-48 rounded-field border border-ruling bg-paper px-3
          text-meta text-ink placeholder:text-ink-3"/>
      <Button type="submit" size="sm">Save</Button>
      <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
    </form>
  )
}

function Entry({ r, editing, onEdit, onSave, onCancel }) {
  const b = BAND[bandOf(r.score)]
  const src = SOURCE[r.source]
  return (
    <li className="grid grid-cols-[4.6rem_3.6rem_minmax(0,1fr)_auto] items-center gap-x-2 border-t
      border-rule/40 py-2 first:border-t-0">
      <span className="font-mono text-meta tabular-nums text-ink-2">{clock(r.at)}</span>
      <span className="inline-flex items-center gap-1.5">
        <Shape source={r.source} fill={b.fill}/>
        <span className="font-display text-row font-bold tabular-nums text-ink">{r.score}</span>
        <span className="sr-only">, {b.word}</span>
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-fine text-ink-2">
          <src.Icon aria-hidden className="hidden size-4 shrink-0 text-ink-3 sm:block"/>
          <span className="truncate">{src.word}</span>
        </span>
        {r.pulse != null && <span className="block text-fine tabular-nums text-ink-3">{r.pulse} bpm</span>}
      </span>
      {!editing && (
        <button type="button" onClick={onEdit}
          aria-label={`${r.note ? 'Edit the note on' : 'Add a note to'} the ${clock(r.at)} reading`}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-field px-2 font-display text-fine
            font-bold text-accent hoverOnly:bg-aqua">
          {!r.note && <Plus aria-hidden className="size-3.5"/>}{r.note ? 'Edit' : 'Note'}
        </button>
      )}
      {r.note && !editing && (
        <p className="col-span-full m-0 mt-0.5 max-w-[60ch] border-l-2 border-rule pl-2.5 text-fine text-ink-2">
          {r.note}
        </p>
      )}
      {editing && <NoteEditor entry={r} onSave={onSave} onCancel={onCancel}/>}
    </li>
  )
}

function DayList({ list, now, setNote }) {
  const [editing, setEditing] = React.useState(null)
  const groups = groupByDay(list)
  if (!groups.length) return <p className="text-meta text-ink-3">No readings in this range.</p>
  return (
    <div role="region" aria-label="Readings by day" tabIndex={0}
      className="relative max-h-[30rem] overflow-y-auto overscroll-contain rounded-field">
      {groups.map(g => (
        <section key={g.key} aria-label={dayName(g.at, now)}>
          <h5 className="sticky top-0 z-[1] flex items-baseline justify-between gap-3 border-b border-rule/60
            bg-card py-2 font-display text-ui font-bold text-ink">
            <span>{dayName(g.at, now)}</span>
            <span className="text-fine font-normal tabular-nums text-ink-3">
              Average <b className="font-bold text-ink-2">{g.mean}</b> · {g.items.length} reading{g.items.length === 1 ? '' : 's'}
            </span>
          </h5>
          <ul className="m-0 list-none p-0">
            {g.items.map(r => (
              <Entry key={r.id} r={r} editing={editing === r.id}
                onEdit={() => setEditing(r.id)}
                onSave={text => { setNote(r, text); setEditing(null) }}
                onCancel={() => setEditing(null)}/>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ClearLog({ n }) {
  const [ask, setAsk] = React.useState(false)
  if (!ask) {
    return (
      <button type="button" onClick={() => setAsk(true)}
        className="min-h-[44px] font-display text-fine font-bold text-ink-3 underline-offset-4 hoverOnly:underline">
        Clear all readings
      </button>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="m-0 text-fine text-ink-2">Delete all {n} readings?</p>
      <Button size="sm" variant="outline" onClick={() => { clearReadings(); setAsk(false) }}>Delete</Button>
      <Button size="sm" onClick={() => setAsk(false)}>Keep</Button>
    </div>
  )
}

/* ── The log ──────────────────────────────────────────────────────────── */

/* The log as the Trends tab shows it: every entry by day. The range is the
   tab's own, so the chart above and this list always cover the same days.
   The scroller is `relative` so the sr-only spans inside it are clipped by
   it rather than stretching the page below the footer. */
export function MindScoreLog({ entries, list, now, demo, setNote, rangeLabel, headRef, className, go,
  head = true }) {
  return (
    <section id="reading-log" aria-labelledby="reading-log-h" className={cn('scroll-mt-20', className)}>
      {/* head={false}: the page gives the log its own part heading, with
          the id reading-log-h, so the section is still named. */}
      {head && (
        <h3 id="reading-log-h" ref={headRef} tabIndex={-1} className="font-display text-head font-bold text-ink">
          {SCORE} Log
        </h3>
      )}
      {entries.length === 0 ? (
        <div className={cn(PANEL, head && 'mt-3')}>
          <NoData go={go} className="items-start text-left"/>
        </div>
      ) : (
        <section aria-label={`Every reading, ${rangeLabel}`} className={cn(PANEL, head && 'mt-3')}>
          <DayList list={list} now={now} setNote={setNote}/>
          {!demo && <div className="mt-3 border-t border-rule/60 pt-2"><ClearLog n={entries.length}/></div>}
        </section>
      )}
    </section>
  )
}

export { Latest, DayList, ClearLog }
