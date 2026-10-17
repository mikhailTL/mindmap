import React from 'react'
import { Panel, PanelHead } from '../Monitor'
import { Button } from '../../ui/button'
import { ArrowLeft } from '../../ui/marks'
import { LampFace } from '../../traffic/Face'
import { RainbowDial } from '../../charts/rainbow'
import { HEADLINE } from '../../signals/light'
import { PROTOCOL, PROTOCOL_DONE, PROTOCOL_TIMES } from '../../lib/caseload'
import { getSharing, getVersion, subscribe } from '../../app/store'
import { cn } from '../../lib/utils'
import { PartHead, TODAY_LONG } from '../student/PartHead'
import { KV, Note, Seg } from './parts'
import { DailyChart, FaceCounts, ringsFor } from './charts'
import { SourceCounts, SourceIcon, SourceLine, SOURCE_NAME, countBySource, sourcesOf } from './sources'
import { STATUS_LINE, STATUS_WORD, TREND_PREV, TREND_RANGES, TREND_TITLE, figures, readingsShared, signed,
  trendDays, trendRange, trendsShared } from './metrics'

/* One teen's record, opened from a card. The same layout for every teen, in
 * two clearly headed parts:
 *
 *   Today    the Mind Score on the rainbow (clouds on) with its four bands,
 *            the body today with each reading's source, the Heads Up face,
 *            and today's readings counted by source (single readings listed
 *            only when the teen shares them)
 *   Trends   week or month: a bar per day against the usual band with the
 *            Heads Up face under each day, the average and its change, the
 *            readings by source, the body as daily averages
 *
 * Then what the teen shares and the notes. Opening it writes a log line. */

/* Demo figure for the settle row: days the body took longer than usual to
   settle. A count of days and nothing finer. */
const SETTLE_DAYS = 2

function Urgent({ teen }) {
  const [done, setDone] = React.useState(PROTOCOL_DONE)
  const [what, setWhat] = React.useState('')
  const [closed, setClosed] = React.useState(false)
  const toggle = i => setDone(d => (d.includes(i) ? d.filter(x => x !== i) : [...d, i]))
  return (
    <Panel className="border-l-4 border-crit/40 border-l-crit bg-[#fbeae6]">
      <PanelHead as="h3" title="Urgent alert" meta={`raised ${PROTOCOL_TIMES[0]}`}/>
      <p className="mt-2 max-w-[34ch] font-display text-row font-bold leading-[1.16] text-[#7a2314]">
        An alert was raised for {teen.pseudonym} during AP Chemistry.</p>
      <div className="mt-3 border-t border-rule pt-2.5">
        <h4 className="tick">Steps taken</h4>
        <ul className="m-0 mt-1 list-none p-0">
          {PROTOCOL.map((step, i) => (
            <li key={step}>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={done.includes(i)} onChange={() => toggle(i)} className="size-4 accent-accent"/>
                <span className={cn('text-fine', done.includes(i) ? 'text-ink-3 line-through decoration-rule' : 'text-ink')}>{step}</span>
                <span className="ml-auto shrink-0 whitespace-nowrap text-fine tabular-nums text-ink-3">
                  {done.includes(i) ? PROTOCOL_TIMES[i] : ''}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3 border-t border-rule pt-2.5">
        <label htmlFor="outcome" className="tick block">What happened</label>
        <textarea id="outcome" rows={2} value={what} onChange={e => setWhat(e.target.value)} disabled={closed}
          placeholder="One line, kept with this alert…"
          className="mt-1.5 w-full resize-none rounded-field border-0 border-b-2 border-rule bg-card p-3 text-fine
            text-ink placeholder:text-ink-3 focus-visible:border-ink focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"/>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="text-fine tabular-nums text-ink-3">{done.length} of {PROTOCOL.length} steps done</span>
          <Button size="sm" onClick={() => setClosed(true)}
            disabled={closed || done.length < PROTOCOL.length || !what.trim()}>
            {closed ? 'Finished' : 'Finish and log it'}</Button>
        </div>
        {closed && (
          <p className="mt-2.5 border-l-2 border-accent py-1 pl-3 text-fine text-ink-2">
            Logged at {PROTOCOL_TIMES[PROTOCOL_TIMES.length - 1]}. This alert is now closed.</p>
        )}
      </div>
    </Panel>
  )
}

/* Body readings, each with the source it comes from. Sweat and skin
   temperature come from the patch only, so a teen without one has no row
   for them rather than a blank. */
const BODY = [
  { k: 'pulse', label: 'Resting pulse', unit: 'bpm', from: t => (t.patch ? 'patch' : 'camera') },
  { k: 'hrv', label: 'Heart rate variability', unit: 'ms', from: t => (t.patch ? 'patch' : 'camera') },
  { k: 'eda', label: 'Sweat response', unit: 'µS', from: () => 'patch', patch: true },
  { k: 'temp', label: 'Skin temperature', unit: '°C', from: () => 'patch', patch: true },
  { k: 'steps', label: 'Steps', unit: 'steps', from: t => (t.patch ? 'patch' : 'phone'), fmt: v => Number(v).toLocaleString('en-US') },
]
const bodyFor = teen => BODY.filter(m => teen.patch || !m.patch)

function BodyRow({ m, teen, v, d }) {
  const src = m.from(teen)
  return (
    <div className="flex items-center justify-between gap-3 border-b border-rule py-2 last:border-b-0">
      <dt className="flex min-w-0 items-center gap-2 text-fine text-ink-2">
        <SourceIcon source={src}/>
        <span className="min-w-0">{m.label}<span className="sr-only">, from the {SOURCE_NAME[src].toLowerCase()}</span></span>
      </dt>
      <dd className="m-0 shrink-0 text-right font-display text-ui font-medium tabular-nums text-ink">
        {m.fmt ? m.fmt(v) : v} <span className="font-body text-fine font-normal text-ink-3">{m.unit}</span>
        {d !== null && d !== undefined && <span className="ml-2 font-body text-fine font-normal text-ink-3">{signed(d)}</span>}
      </dd>
    </div>
  )
}

const RING_WORD = { heart: 'Heart', sweat: 'Sweat', temp: 'Temperature', move: 'Movement' }

export function ProTeenDetail({ teen, initialRange = 'week', isAlert, openedAt, onBack, onNote, notes }) {
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const settle = getSharing().pro.settle === true
  const [range, setRange] = React.useState(trendRange(initialRange))
  const [note, setNote] = React.useState('')
  const f = figures(teen, range)
  const trend = trendsShared(teen)
  const raw = readingsShared(teen)
  const today = teen.days[teen.days.length - 1]
  const days = trendDays(teen, range)
  const rings = ringsFor(teen, today)
  const above = days.filter(d => d.score > teen.usual.hi).length
  const totals = countBySource(days, sourcesOf(teen))
  return (
    <div>
      <button type="button" onClick={onBack}
        className="inline-flex min-h-[44px] items-center gap-2 font-display text-ui font-bold text-accent
          hoverOnly:text-accent-ink">
        <ArrowLeft aria-hidden className="size-4"/> Back to caseload
      </button>

      <Panel tone="brand" className="mt-2">
        <h2 className="font-display text-head font-bold tracking-tight text-ink">{teen.pseudonym}</h2>
        <p className="mt-0.5 text-fine text-ink-2">Grade {teen.grade}, age {teen.age}</p>
        <SourceLine teen={teen} className="mt-1.5"/>
        <p className="mt-3 border-t border-rule pt-2.5 text-fine text-ink-3">
          Opening this record is logged. Opened at {openedAt}.</p>
      </Panel>

      {isAlert && <div className="mt-3 lg:mt-4"><Urgent teen={teen}/></div>}

      {/* ── Today ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="pro-today-h" className="mt-6">
        <PartHead id="pro-today-h" kind="today" title="Today" line={`${TODAY_LONG}. Readings so far today.`}
          className="[&_h2]:text-row"/>
        <div className="mt-3 grid items-start gap-3 [&>*]:min-w-0 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
          <div className="flex flex-col gap-3 lg:gap-4">
            <Panel>
              <PanelHead as="h3" title="Mind Score today" meta="out of 100"/>
              <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                <RainbowDial score={today.score} usual={teen.usual.base} rings={rings} size={320}/>
                <ul className="m-0 w-full list-none p-0 sm:max-w-[13rem]">
                  {rings.map(r => (
                    <li key={r.id} className="flex items-center justify-between gap-3 border-b border-rule py-1.5 last:border-b-0">
                      <span className="flex items-center gap-2 text-fine text-ink-2">
                        <span aria-hidden className="size-2.5 rounded-full" style={{ background: r.glow }}/>{RING_WORD[r.id]}</span>
                      <span className="font-display text-ui font-medium tabular-nums text-ink">{r.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-2 text-fine text-ink-2">Usual {teen.usual.lo} to {teen.usual.hi}.{' '}
                {STATUS_LINE[today.light]} today. Each band is 50 on a usual day for this teen.</p>
            </Panel>

            <Panel>
              <PanelHead as="h3" title="Body today"/>
              <dl className="m-0 mt-2 p-0">
                {bodyFor(teen).map(m => <BodyRow key={m.k} m={m} teen={teen} v={today[m.k]}/>)}
              </dl>
            </Panel>
          </div>

          <div className="flex flex-col gap-3 lg:gap-4">
            <Panel>
              <PanelHead as="h3" title="Heads Up today" meta="phone use"/>
              <div className="mt-3 flex items-start gap-3">
                <LampFace light={today.light} size={44}/>
                <div className="min-w-0">
                  <p className="font-display text-ui font-bold text-ink">{STATUS_WORD[today.light]}</p>
                  <p className="mt-0.5 max-w-[40ch] text-fine text-ink-2">{HEADLINE[today.light]}</p>
                  {today.signals.length > 0 && <p className="mt-1 text-fine text-ink-2">Signals: {today.signals.join(', ')}.</p>}
                </div>
              </div>
              <Note>Heads Up reads how the phone is used, never what is on it.</Note>
            </Panel>

            <Panel>
              <PanelHead as="h3" title="Readings today, by source"
                meta={`${today.readings.length} reading${today.readings.length === 1 ? '' : 's'}`}/>
              <SourceCounts counts={countBySource([today], sourcesOf(teen))} className="mt-3"/>
              {raw ? (
                <ul className="m-0 mt-3 list-none border-t border-rule p-0">
                  {today.readings.map((r, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 border-b border-rule py-2 last:border-b-0">
                      <span className="w-12 shrink-0 text-fine tabular-nums text-ink-2">{r.time}</span>
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 text-fine text-ink-2">
                        <SourceIcon source={r.source} size={16}/>{SOURCE_NAME[r.source]}</span>
                      <span className="shrink-0 font-display text-ui font-bold tabular-nums text-ink">{r.score}
                        <span className="ml-1 font-body text-fine font-normal text-ink-3">of 100</span></span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Note>This teen shares day figures only. Single readings stay with them.</Note>
              )}
            </Panel>
          </div>
        </div>
      </section>

      {/* ── Trends ────────────────────────────────────────────────────── */}
      <section aria-labelledby="pro-trends-h" className="mt-8">
        <PartHead id="pro-trends-h" kind="trends" title="Trends" line={`${TREND_TITLE[range]}, against ${TREND_PREV[range]}.`}
          className="[&_h2]:text-row"/>
        <div className="mt-3 flex flex-wrap items-center gap-3 pl-[52px]">
          <span className="text-fine text-ink-3">Show</span>
          <Seg label="Trend range" value={range} onChange={setRange} options={TREND_RANGES}/>
        </div>
        <div className="mt-3 grid items-start gap-3 [&>*]:min-w-0 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
          <Panel>
            <PanelHead as="h3" title="Mind Score each day" meta={TREND_TITLE[range].toLowerCase()}/>
            {trend ? (
              <>
                <DailyChart days={days} usual={teen.usual} className="mt-3"/>
                <FaceCounts days={days} className="mt-3 border-t border-rule pt-2.5"/>
                <dl className="m-0 mt-2 grid gap-x-6 p-0 sm:grid-cols-2">
                  <KV k="Average" v={`${f.score} of 100`}/>
                  <KV k={`Change from ${TREND_PREV[range]}`} v={`${signed(f.change)} points`}
                    tone={f.change > 0 ? 'text-warn' : f.change < 0 ? 'text-accent' : 'text-ink'}/>
                  <KV k="Days above usual" v={`${above} of ${days.length}`}/>
                  <KV k="Peaks" v={`${f.peaks} peaks`}/>
                </dl>
              </>
            ) : (
              <div className="mt-3 border-t border-dashed border-ruling pt-3">
                <p className="font-display text-head font-bold tabular-nums text-ink">{f.score}
                  <span className="ml-1.5 font-body text-fine font-normal text-ink-3">of 100, average</span></p>
                <p className="mt-1 text-fine text-ink-2"><span className="font-medium">Score only.</span> This
                  teen does not share a trend, so no day by day bars or change are shown.</p>
              </div>
            )}
          </Panel>

          <div className="flex flex-col gap-3 lg:gap-4">
            <Panel>
              <PanelHead as="h3" title="Readings by source" meta={TREND_TITLE[range].toLowerCase()}/>
              <SourceCounts counts={totals} className="mt-3"/>
            </Panel>
            <Panel>
              <PanelHead as="h3" title="Body, daily average" meta={TREND_TITLE[range].toLowerCase()}/>
              <dl className="m-0 mt-2 p-0">
                {bodyFor(teen).map(m => (
                  <BodyRow key={m.k} m={m} teen={teen} v={f[m.k]} d={f.delta[m.k]}/>
                ))}
                <KV k="Recovery time, average" v={`${f.recovery} min`}/>
                {settle && <KV k="Slow to settle" v={`${SETTLE_DAYS} days this week`}/>}
              </dl>
              {trend && <Note>The small figure is the change from {TREND_PREV[range]}.</Note>}
            </Panel>
          </div>
        </div>
      </section>

      <div className="mt-8 grid items-start gap-3 [&>*]:min-w-0 lg:grid-cols-2 lg:gap-4">
        <Panel tone="aqua">
          <PanelHead as="h3" title="What this teen shares"/>
          <dl className="m-0 mt-2 p-0">
            <KV k="Mind Score" v="Yes"/>
            <KV k="Trend and change" v={trend ? 'Yes' : 'No'}/>
            <KV k="Single readings" v={raw ? 'Yes' : 'No'}/>
            <KV k="Urgent alerts" v="Always"/>
          </dl>
        </Panel>

        <Panel>
          <PanelHead as="h3" title="Your notes" meta={notes.length ? `${notes.length} saved` : null}/>
          {notes.length > 0 && (
            <ul className="m-0 mt-2 list-none p-0">
              {notes.map((n, i) => (
                <li key={i} className="border-b border-rule py-2 text-fine text-ink">{n.text}
                  <span className="block text-fine text-ink-3">{n.at}</span></li>
              ))}
            </ul>
          )}
          <label htmlFor="pro-note" className="sr-only">Note for {teen.pseudonym}</label>
          <textarea id="pro-note" rows={3} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Add a note…"
            className="mt-3 w-full resize-none rounded-field border-0 border-b-2 border-rule bg-card p-3 text-fine
              text-ink placeholder:text-ink-3 focus-visible:border-ink focus-visible:outline focus-visible:outline-2
              focus-visible:outline-offset-2 focus-visible:outline-accent"/>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-fine text-ink-3">Every saved note is logged</span>
            <Button size="sm" disabled={!note.trim()} onClick={() => { onNote(note.trim()); setNote('') }}>Save note</Button>
          </div>
        </Panel>
      </div>
      <p className="mt-3 text-fine text-ink-3">Nothing here is a diagnosis.</p>
    </div>
  )
}
