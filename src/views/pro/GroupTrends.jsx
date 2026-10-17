import React from 'react'
import { Panel, PanelHead, SeeDetails } from '../Monitor'
import { Button } from '../../ui/button'
import { List, Item } from '../../ui/list'
import { CASELOAD } from '../../lib/roster'
import { K_ANONYMITY, SCHOOL_N, COHORT_PERIOD, COHORT_WEEKDAY, AUDIT_LOG, PROTOCOL } from '../../lib/caseload'
import { RETENTION } from '../../app/store'
import { CONSENT_SHORT } from '../../lib/terms'
import { cn } from '../../lib/utils'
import { LampFace } from '../../traffic/Face'
import { RainbowDial } from '../../charts/rainbow'
import { PartHead, TODAY_LONG } from '../student/PartHead'
import { BarRow, Hatch, KV, Note } from './parts'
import { DailyChart, groupRings } from './charts'
import { SourceCounts } from './sources'
import { STATUS_WORD, gradeGroups, logSubjects, networkSeries, readingsShared, signed, trendsShared } from './metrics'

/* Group trends: the school, the class periods, the network as a whole, and
 * the rules every figure obeys. Nothing on this tab is about one teen; a teen
 * is opened from the Caseload tab. Groups under K_ANONYMITY show nothing,
 * not even their size. */

const ROW = 'mt-3 grid items-start gap-3 [&>*]:min-w-0 lg:mt-4 lg:gap-4'
const TICKS = [25, 50, 75]

const FACTS = [
  ['Raw readings a parent can see', 'Never'],
  ['Single readings you can see', 'Only if the teen agrees'],
  ['Readings sold or passed on', 'Never'],
  ['Location collected by default', 'No'],
]

const BlankRow = ({ children }) => (
  <li className="flex items-center gap-3 py-3">
    <span aria-hidden className="w-8 shrink-0 border-t border-dashed border-ruling"/>
    <span className="text-fine text-ink-3">{children}</span>
  </li>
)

function Periods() {
  const visible = COHORT_PERIOD.filter(p => !p.suppressed)
  const avg = Math.round(visible.reduce((a, b) => a + b.mean, 0) / visible.length)
  return (
    <Panel>
      <PanelHead as="h3" title="Mind Score by class period" meta="out of 100"/>
      <ul className="m-0 mt-3 list-none space-y-3 p-0">
        {COHORT_PERIOD.map(p => (
          <li key={p.key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-fine text-ink-2">{p.label.replace(' · ', ', ')}</span>
              {/* A hidden group prints no size either. */}
              <span className="shrink-0 text-fine tabular-nums text-ink-3">
                {p.suppressed ? 'hidden' : `${p.mean}, ${p.n} teens`}</span>
            </div>
            <div className="relative mt-1.5 h-2.5 w-full overflow-hidden rounded-xs bg-aqua-2">
              {p.suppressed ? <Hatch id={'hatch-' + p.key} className="h-full"/> : (
                <div className={cn('h-full rounded-xs', p.mean >= 65 ? 'bg-warn' : 'bg-accent')}
                  style={{ width: p.mean + '%' }}/>
              )}
              {TICKS.map(t => <span key={t} aria-hidden className="absolute inset-y-0 w-px bg-card/70" style={{ left: t + '%' }}/>)}
              <span aria-hidden className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: avg + '%' }}/>
            </div>
          </li>
        ))}
      </ul>
      <Note>The dark line marks the average period, {avg}. A hatched bar has fewer than {K_ANONYMITY} teens.</Note>
    </Panel>
  )
}

function Weekdays() {
  const wAvg = Math.round(COHORT_WEEKDAY.reduce((a, b) => a + b.mean, 0) / COHORT_WEEKDAY.length)
  const hardest = [...COHORT_WEEKDAY].sort((a, b) => b.mean - a.mean)[0]
  const lightest = [...COHORT_WEEKDAY].sort((a, b) => a.mean - b.mean)[0]
  const H = 118
  return (
    <Panel>
      <PanelHead as="h3" title="Mind Score by weekday" meta="out of 100"/>
      <p className="m-0 mt-3 text-fine text-ink-3">Average Mind Score, 0 calm to 100 peak</p>
      <div className="mt-2 flex gap-2.5" role="img"
        aria-label={'Mean Mind Score by weekday: ' + COHORT_WEEKDAY.map(d => `${d.full} ${d.mean}`).join(', ') + '.'}>
        <div aria-hidden className="flex w-7 shrink-0 flex-col justify-between text-right text-fine tabular-nums text-ink-3"
          style={{ height: H }}><span>100</span><span>50</span><span>0</span></div>
        <div aria-hidden className="relative flex-1" style={{ height: H }}>
          {[0, 50, 100].map(v => <span key={v} className="absolute inset-x-0 h-px bg-rule" style={{ bottom: (v / 100) * H }}/>)}
          <span className="absolute inset-x-0 h-0.5 bg-ink" style={{ bottom: (wAvg / 100) * H }}/>
          <div className="absolute inset-0 flex items-end justify-between gap-2.5">
            {COHORT_WEEKDAY.map(d => (
              <span key={d.key} className="flex h-full flex-1 items-end">
                <span className={cn('w-full rounded-t-xs', d.mean >= 60 ? 'bg-warn' : 'bg-accent')}
                  style={{ height: (d.mean / 100) * H }}/>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden className="mt-1.5 flex gap-2.5 pl-9">
        {COHORT_WEEKDAY.map(d => (
          <span key={d.key} className="flex-1 text-center">
            <span className="block text-fine tabular-nums text-ink">{d.mean}</span>
            <span className="block text-fine text-ink-3">{d.label}</span>
          </span>
        ))}
      </div>
      <p aria-hidden className="m-0 mt-1 pl-9 text-center text-fine text-ink-3">Day of the week. The dark line is the
        average day, {wAvg}.</p>
      <dl className="m-0 mt-2 p-0">
        <KV k="Hardest day" v={`${hardest.full}, ${hardest.mean}`}/>
        <KV k="Lightest day" v={`${lightest.full}, ${lightest.mean}`}/>
      </dl>
    </Panel>
  )
}

/* The whole network over 30 days: a bar per day of the average Mind Score,
   the group's usual range as the soft band behind. No middle-half band. */
function Network({ list }) {
  const s = networkSeries(list, 30)
  if (!s) return null
  const pts = s.points
  const shared = list.filter(trendsShared)
  const usual = { lo: Math.round(shared.reduce((t, x) => t + x.usual.lo, 0) / shared.length),
    hi: Math.round(shared.reduce((t, x) => t + x.usual.hi, 0) / shared.length) }
  const wk = a => Math.round(a.reduce((t, p) => t + p.mean, 0) / a.length)
  const change = wk(pts.slice(-7)) - wk(pts.slice(-14, -7))
  return (
    <Panel>
      <PanelHead as="h3" title="Your network, each day" meta={`${s.n} teens who share trends`}/>
      <DailyChart className="mt-3" days={pts.map(p => ({ date: p.date, score: p.mean }))} usual={usual}
        faces={false} who="the group"/>
      <dl className="m-0 mt-2 grid gap-x-6 p-0 sm:grid-cols-2">
        <KV k="Average, last 7 days" v={`${wk(pts.slice(-7))} of 100`}/>
        <KV k="Against the 7 days before" v={`${signed(change)} points`} tone={change > 0 ? 'text-warn' : 'text-ink'}/>
      </dl>
      <Note>Each bar is the average across {s.n} teens that day.</Note>
    </Panel>
  )
}

/* Today across the group: the average Mind Score on the rainbow (clouds on),
   today's Heads Up faces counted, and today's readings counted by source.
   Under K_ANONYMITY teens, nothing. */
function GroupToday({ list, words }) {
  if (list.length < K_ANONYMITY) return null
  const today = list.map(t => t.days[t.days.length - 1])
  const avg = Math.round(today.reduce((t, d) => t + d.score, 0) / today.length)
  const base = Math.round(list.reduce((t, x) => t + x.usual.base, 0) / list.length)
  const faces = { green: 0, yellow: 0, red: 0 }
  for (const d of today) faces[d.light]++
  const counts = { patch: 0, camera: 0, survey: 0 }
  for (const d of today) for (const r of d.readings) counts[r.source]++
  const onPatch = list.filter(t => t.patch).length
  return (
    <div className={cn(ROW, 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]')}>
      <Panel>
        <PanelHead as="h3" title="Mind Score today, average" meta={`${list.length} teens`}/>
        <div className="mt-2 flex justify-center">
          <RainbowDial score={avg} usual={base} rings={groupRings(list, K_ANONYMITY)} size={320}/>
        </div>
        <p className="mt-2 text-fine text-ink-2">The average of every teen {words.across} today. The mark on the
          scale is the group&rsquo;s usual day, {base}.</p>
      </Panel>
      <div className="flex flex-col gap-3 lg:gap-4">
        <Panel>
          <PanelHead as="h3" title="Heads Up today" meta="teens"/>
          <ul className="m-0 mt-2 list-none p-0">
            {['green', 'yellow', 'red'].map(k => (
              <li key={k} className="flex items-center gap-2.5 border-b border-rule py-2 last:border-b-0">
                <LampFace light={k} size={24}/>
                <span className="min-w-0 flex-1 text-fine text-ink-2">{STATUS_WORD[k]}</span>
                <span className="font-display text-ui font-bold tabular-nums text-ink">{faces[k]}
                  <span className="ml-1 font-body text-fine font-normal text-ink-3">{faces[k] === 1 ? 'teen' : 'teens'}</span></span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelHead as="h3" title="Readings today, by source"/>
          <SourceCounts counts={counts} className="mt-3"/>
          <Note>{onPatch} teens wear the patch. {list.length - onPatch} read from the phone camera and check-in questions.</Note>
        </Panel>
      </div>
    </div>
  )
}

function Grades({ list }) {
  const g = gradeGroups(list)
  return (
    <Panel>
      <PanelHead as="h3" title="By grade, this week" meta="out of 100"/>
      <ul className="m-0 mt-3 list-none space-y-3 p-0">
        {g.map(r => (
          <li key={r.grade}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-fine text-ink-2">Grade {r.grade}</span>
              <span className="shrink-0 text-fine tabular-nums text-ink-3">
                {r.hidden ? 'hidden' : `${r.mean}${r.change === null ? '' : `, ${signed(r.change)} points`}, ${r.n} teens`}</span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-xs bg-aqua-2">
              {r.hidden ? <Hatch id={'hatch-g' + r.grade} className="h-full"/>
                : <div className={cn('h-full rounded-xs', r.mean >= 65 ? 'bg-warn' : 'bg-accent')} style={{ width: r.mean + '%' }}/>}
            </div>
          </li>
        ))}
      </ul>
      <Note>A grade with fewer than {K_ANONYMITY} teens shows nothing. Change shows where {K_ANONYMITY} or more share trends.</Note>
    </Panel>
  )
}

export function GroupTrends({ words, real, list = CASELOAD, sessionLog = [] }) {
  const relabel = logSubjects(list)
  const log = real ? [] : [...sessionLog, ...AUDIT_LOG.filter(r => r.rel === 'Today').map(r => ({
    at: 'Today, ' + r.at.split(', ')[1], action: r.action.replace(/crisis alert/gi, m => (m[0] === 'C' ? 'Urgent alert' : 'urgent alert')),
    actor: relabel(r.actor), subject: relabel(r.subject),
  }))]
  const longest = Math.max(...RETENTION)
  const top = [...COHORT_PERIOD.filter(p => !p.suppressed)].sort((a, b) => b.mean - a.mean)[0]
  const sharing = real ? [] : list
  return (
    <>
      {real ? (
        <Panel tone="brand">
          <PanelHead title={words.lead}/>
          <p className="mt-3 max-w-[30ch] font-display text-row font-bold leading-[1.16] text-ink sm:text-head">
            Group trends appear once five teens share.</p>
          <p className="mt-2 max-w-[52ch] text-fine text-ink-2">A smaller group shows nothing, so no one teen can be picked out.</p>
        </Panel>
      ) : (
        <>
          <Panel tone="brand">
            <PanelHead title={words.lead} meta={`${SCHOOL_N} teens sharing`}/>
            <p className="mt-3 max-w-[34ch] font-display text-row font-bold leading-[1.16] text-ink sm:text-head">
              {top.label.replace(' · ', ', ')} reads highest {words.across}.</p>
            <p className="mt-1.5 text-fine text-ink-2">Mind Score {top.mean} of 100. Nothing here names a teen.</p>
          </Panel>
          <section aria-labelledby="grp-today-h" className="mt-6">
            <PartHead id="grp-today-h" kind="today" title="Today" line={`${TODAY_LONG}. Readings so far today.`}
              className="[&_h2]:text-row"/>
            <GroupToday list={list} words={words}/>
          </section>
          <section aria-labelledby="grp-trends-h" className="mt-8">
            <PartHead id="grp-trends-h" kind="trends" title="Trends" line="The last 30 days, and this term by weekday, period and grade."
              className="[&_h2]:text-row"/>
            <div className={ROW}>
              <Network list={list}/>
            </div>
            <div className={cn(ROW, 'lg:grid-cols-2')}>
              <Weekdays/>
              <Grades list={list}/>
            </div>
            <div className={ROW}>
              <Periods/>
            </div>
          </section>
        </>
      )}

      <h2 className="mark mt-8">Rules and the log</h2>
      <div className={cn(ROW, 'lg:grid-cols-2')}>
        <Panel>
          <PanelHead as="h3" title="When an urgent alert is raised"/>
          <ol className="m-0 mt-2 list-none p-0">
            {PROTOCOL.map((p, i) => (
              <li key={p} className="flex items-baseline gap-3 border-b border-rule py-2 last:border-b-0">
                <span className="w-4 shrink-0 text-fine tabular-nums text-ink-3">{i + 1}</span>
                <span className="text-fine text-ink">{p}</span>
              </li>
            ))}
          </ol>
          <Note>Urgent alerts reach you for every teen. They cannot be switched off.</Note>
        </Panel>

        <Panel tone="aqua">
          <PanelHead as="h3" title="What teens share with you"/>
          <p className="mt-2 max-w-[48ch] text-fine text-ink-2">{CONSENT_SHORT}</p>
          {!real && <dl className="m-0 mt-2 p-0">
            <KV k="Mind Score" v={`${sharing.length} of ${sharing.length}`}/>
            <KV k="Trend and change" v={`${sharing.filter(trendsShared).length} of ${sharing.length}`}/>
            <KV k="Single readings" v={`${sharing.filter(readingsShared).length} of ${sharing.length}`}/>
          </dl>}
          <List className="mt-2 max-w-[56ch] text-fine text-ink-2">
            <Item>You see only what a teen agreed to share.</Item>
            <Item>A group under five shows nothing.</Item>
            <Item>Every record you open is logged.</Item>
          </List>
        </Panel>
      </div>

      <div className={ROW}>
        <Panel>
          <PanelHead as="h3" title="Who opened what today" meta="nothing can be deleted"/>
          <ul className="m-0 mt-2 list-none p-0">
            {log.length === 0 && <BlankRow>Nothing has been logged yet.</BlankRow>}
            {log.map((r, i) => (
              <li key={r.at + r.action + i} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5
                border-b border-rule py-2.5 last:border-b-0">
                <span className="min-w-0 flex-1 basis-[13rem]">
                  <span className="block text-fine text-ink">{r.action}</span>
                  <span className="mt-0.5 block text-fine text-ink-3">{r.actor} · {r.subject}</span>
                </span>
                <span className="shrink-0 text-fine tabular-nums text-ink-3">{r.at}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2.5 border-t border-rule pt-3">
            <Button variant="outline" size="sm" disabled>Export the log</Button>
            <Button variant="outline" size="sm" disabled>Export what was agreed</Button>
          </div>
        </Panel>
      </div>

      <div className={ROW}>
        <SeeDetails label="See how long readings are kept">
          <Panel tone="aqua">
            <PanelHead as="h3" title="How long readings are kept"/>
            <p className="mt-2 max-w-[46ch] text-fine text-ink-2">Raw readings are deleted when the time runs out.</p>
            <ul className="m-0 mt-2 list-none border-t border-rule p-0">
              {RETENTION.map(d => (
                <BarRow key={d} label={d === RETENTION[0] ? `${d} days, the default` : `${d} days`}
                  figure={`${d} days`} pct={(d / longest) * 100} tone={d === RETENTION[0] ? 'bg-accent' : 'bg-ink-3'}/>
              ))}
            </ul>
            <dl className="m-0 mt-2 border-t border-rule p-0">
              {FACTS.map(([k, v]) => <KV key={k} k={k} v={v}/>)}
            </dl>
          </Panel>
        </SeeDetails>
      </div>
    </>
  )
}
