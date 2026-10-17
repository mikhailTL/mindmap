import React from 'react'
import { Panel, PanelHead } from '../Monitor'
import { Button } from '../../ui/button'
import { ArrowLeft } from '../../ui/marks'
import { LampFace } from '../../traffic/Face'
import { HEADLINE } from '../../signals/light'
import { statusOf, summary, RANGE_LABEL } from '../../lib/roster'
import { PROTOCOL, PROTOCOL_DONE, PROTOCOL_TIMES } from '../../lib/caseload'
import { getSharing, getVersion, subscribe } from '../../app/store'
import { cn } from '../../lib/utils'
import { KV, Note, Seg, TrendChart } from './parts'
import { RANGE_NOUN, RANGE_SHORT, SOURCE_WORD, STATUS_LINE, STATUS_WORD, figures, readingsShared,
  signed, sourceLine, trendsShared } from './metrics'

/* One teen's record, opened from a card. Local to this screen: the shared
 * src/views/family/TeenDetail.jsx did not exist when this was written.
 *
 * Everything about one teen lives here and nowhere else on the screen: the
 * trend at three ranges, the biometrics with units, the Heads Up light, the
 * individual readings when shared, the open urgent alert if it is theirs,
 * notes, and what they agreed to share. Opening it writes a log line. */

/* Demo figure for the settle row: days the body took longer than usual to
   settle. A count of days and nothing finer. */
const SETTLE_DAYS = 2

/* A figure with its change beside it, smaller, only when trends are shared. */
const WithDelta = ({ v, unit, d }) => (
  <>{v} {unit}{d !== null && d !== undefined && (
    <span className="ml-2 font-body text-fine font-normal text-ink-3">{signed(d)}</span>)}</>
)

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

function HeadsUp({ teen, trend }) {
  const week = teen.days.slice(-7)
  const today = week[week.length - 1]
  return (
    <Panel>
      <PanelHead as="h3" title="Heads Up" meta={trend ? 'phone use, last 7 days' : 'phone use, today'}/>
      <div className="mt-3 flex items-start gap-3">
        <LampFace light={today.light} size={40}/>
        <div className="min-w-0">
          <p className="font-display text-ui font-bold text-ink">{STATUS_WORD[today.light]} today</p>
          <p className="mt-0.5 max-w-[40ch] text-fine text-ink-2">{HEADLINE[today.light]}</p>
          {today.signals.length > 0 && (
            <p className="mt-1 text-fine text-ink-2">Signals: {today.signals.join(', ')}.</p>
          )}
        </div>
      </div>
      {trend && <ol className="m-0 mt-3 grid list-none grid-cols-7 gap-1 border-t border-rule p-0 pt-3"
        aria-label={'Last 7 days: ' + week.map(d => `${d.weekday} ${STATUS_WORD[d.light]}`).join(', ')}>
        {week.map(d => (
          <li key={d.date} aria-hidden className="flex flex-col items-center gap-1">
            <LampFace light={d.light} size={22}/>
            <span className="text-fine text-ink-3">{d.weekday}</span>
          </li>
        ))}
      </ol>}
      <Note>Heads Up reads how the phone is used, never what is on it.</Note>
    </Panel>
  )
}

export function ProTeenDetail({ teen, initialRange = 'week', isAlert, openedAt, onBack, onNote, notes }) {
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const settle = getSharing().pro.settle === true
  const [range, setRange] = React.useState(initialRange)
  const [note, setNote] = React.useState('')
  const f = figures(teen, range)
  const st = statusOf(teen)
  const trend = trendsShared(teen)
  const raw = readingsShared(teen)
  const today = teen.days[teen.days.length - 1]
  const prevLabel = { day: 'yesterday', week: 'last week', month: 'the month before' }[range]
  return (
    <div>
      <button type="button" onClick={onBack}
        className="inline-flex min-h-[44px] items-center gap-2 font-display text-ui font-bold text-accent
          hoverOnly:text-accent-ink">
        <ArrowLeft aria-hidden className="size-4"/> Back to caseload
      </button>

      <Panel tone="brand" className="mt-2">
        <div className="flex flex-wrap items-start gap-3">
          <LampFace light={st} size={44}/>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-head font-bold tracking-tight text-ink">{teen.pseudonym}</h3>
            <p className="mt-0.5 text-fine text-ink-2">Grade {teen.grade} · age {teen.age} · {sourceLine(teen)}</p>
            <p className="mt-1 text-fine font-medium text-ink">{STATUS_WORD[st]}: {STATUS_LINE[st]}, last three days.</p>
          </div>
        </div>
        <p className="mt-3 border-t border-rule pt-2.5 text-fine text-ink-3">
          Opening this record is logged. Opened at {openedAt}.</p>
      </Panel>

      {isAlert && <div className="mt-3 lg:mt-4"><Urgent teen={teen}/></div>}

      <div className="mt-3 grid items-start gap-3 [&>*]:min-w-0 lg:mt-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
        <div className="flex flex-col gap-3 lg:gap-4">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="mark m-0 min-w-0 flex-1">Mind Score {RANGE_NOUN[range]}</h3>
              <Seg label="Range" value={range} onChange={setRange}
                options={Object.entries(RANGE_SHORT)}/>
            </div>
            {trend ? (
              <>
                <TrendChart points={f.points} usual={teen.usual} rangeLabel={RANGE_LABEL[range].toLowerCase()}/>
                <p className="mt-1 text-fine text-ink-3">Shaded: this teen&rsquo;s usual range, {teen.usual.lo} to {teen.usual.hi}.</p>
                <dl className="m-0 mt-2 grid gap-x-6 p-0 sm:grid-cols-2">
                  <KV k={range === 'day' ? 'Today' : 'Average'} v={`${f.score} of 100`}/>
                  <KV k={`Change from ${prevLabel}`} v={`${signed(f.change)} points`}
                    tone={f.change > 0 ? 'text-warn' : f.change < 0 ? 'text-accent' : 'text-ink'}/>
                  <KV k="Lowest to highest" v={`${f.min} to ${f.max}`}/>
                  <KV k="Today, week, month" v={`${summary(teen, 'day').mean}, ${summary(teen, 'week').mean}, ${summary(teen, 'month').mean}`}/>
                </dl>
              </>
            ) : (
              <div className="mt-3 border-t border-dashed border-ruling pt-3">
                <p className="font-display text-head font-bold tabular-nums text-ink">{f.score}
                  <span className="ml-1.5 font-body text-fine font-normal text-ink-3">of 100 {RANGE_NOUN[range]}</span></p>
                <p className="mt-1 text-fine text-ink-2"><span className="font-medium">Score only.</span> This
                  teen does not share a trend, so no line or change is shown.</p>
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHead as="h3" title="Body readings" meta={RANGE_NOUN[range]}/>
            <dl className="m-0 mt-2 grid gap-x-6 p-0 sm:grid-cols-2">
              <KV k="Peaks" v={`${f.peaks} peaks`}/>
              <KV k="Recovery time, average" v={<WithDelta v={f.recovery} unit="min" d={f.delta.recovery}/>}/>
              <KV k="Resting pulse" v={<WithDelta v={f.pulse} unit="bpm" d={f.delta.pulse}/>}/>
              <KV k="Heart rate variability" v={<WithDelta v={f.hrv} unit="ms" d={f.delta.hrv}/>}/>
              <KV k="Sweat response" v={<WithDelta v={f.eda} unit="µS" d={f.delta.eda}/>}/>
              <KV k="Skin temperature" v={`${f.temp} °C`}/>
              <KV k="Steps, daily average" v={`${f.steps.toLocaleString('en-US')}`}/>
              <KV k="Readings" v={`${f.readings}`}/>
              {settle && <KV k="Slow to settle" v={`${SETTLE_DAYS} days this week`}/>}
            </dl>
            {trend && <Note>The small figure is the change from {prevLabel}.</Note>}
          </Panel>

          <Panel>
            <PanelHead as="h3" title="Readings today" meta={raw ? `${today.readings.length} reading${today.readings.length === 1 ? '' : 's'}` : 'not shared'}/>
            {raw ? (
              <ul className="m-0 mt-2 list-none p-0">
                {today.readings.map((r, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 border-b border-rule py-2 last:border-b-0">
                    <span className="w-14 shrink-0 text-fine tabular-nums text-ink-2">{r.time}</span>
                    <span className="min-w-0 flex-1 text-fine text-ink-2">{SOURCE_WORD[r.source]}</span>
                    <span className="shrink-0 font-display text-ui font-bold tabular-nums text-ink">{r.score}
                      <span className="ml-1 font-body text-fine font-normal text-ink-3">of 100</span></span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-fine text-ink-2">This teen shares day figures only. Single readings stay with them.</p>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-3 lg:gap-4">
          <HeadsUp teen={teen} trend={trend}/>

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
      </div>
      <p className="mt-3 text-fine text-ink-3">Nothing here is a diagnosis.</p>
    </div>
  )
}
