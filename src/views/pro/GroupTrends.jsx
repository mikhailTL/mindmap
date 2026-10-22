import React from 'react'
import { Panel, PanelHead } from '../Monitor'
import { CASELOAD } from '../../lib/roster'
import { K_ANONYMITY, COHORT_PERIOD, COHORT_WEEKDAY, AUDIT_LOG, PROTOCOL } from '../../lib/caseload'
import { CONSENT_SHORT } from '../../lib/terms'
import { cn } from '../../lib/utils'
import { RainbowDial } from '../../charts/rainbow'
import { TODAY_LONG } from '../student/PartHead'
import { ProPart, TrafficLight } from './look'
import { Plus } from '../../ui/marks'
import { Hatch, KV, Note } from './parts'
import { DailyChart, groupRings } from './charts'
import { logSubjects, networkSeries, readingsShared, signed, trendsShared } from './metrics'

// Group-level views only: nothing here is about one teen, and groups under K_ANONYMITY show
// nothing, not even their size.
const ROW = 'mt-3 grid items-start gap-3 [&>*]:min-w-0 lg:mt-4 lg:gap-4'
const TICKS = [25, 50, 75]
// Groups averaging 65 or more take the yellow lamp's hue; every bar also prints its figure.
const HIGH = 'bg-[#e3a400]'
const LOW = 'bg-mint'

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
            <div className="relative mt-1.5 h-2.5 w-full overflow-hidden rounded-bar bg-aqua-2">
              {p.suppressed ? <Hatch id={'hatch-' + p.key} className="h-full"/> : (
                <div className={cn('h-full rounded-xs', p.mean >= 65 ? HIGH : LOW)}
                  style={{ width: p.mean + '%' }}/>
              )}
              {TICKS.map(t => <span key={t} aria-hidden className="absolute inset-y-0 w-px bg-card/70" style={{ left: t + '%' }}/>)}
              <span aria-hidden className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: avg + '%' }}/>
            </div>
          </li>
        ))}
      </ul>
      <Note>The dark line is the average, {avg}. Yellow is 65 or more. Hatched means fewer than {K_ANONYMITY} teens.</Note>
    </Panel>
  )
}

function Weekdays() {
  const wAvg = Math.round(COHORT_WEEKDAY.reduce((a, b) => a + b.mean, 0) / COHORT_WEEKDAY.length)
  const H = 118
  return (
    <Panel>
      <PanelHead as="h3" title="Mind Score by weekday" meta="out of 100"/>
      <div className="mt-3 flex gap-2.5" role="img"
        aria-label={'Mean Mind Score by weekday: ' + COHORT_WEEKDAY.map(d => `${d.full} ${d.mean}`).join(', ') + '.'}>
        <div aria-hidden className="flex w-7 shrink-0 flex-col justify-between text-right text-fine tabular-nums text-ink-3"
          style={{ height: H }}><span>100</span><span>50</span><span>0</span></div>
        <div aria-hidden className="relative flex-1" style={{ height: H }}>
          {[0, 50, 100].map(v => <span key={v} className="absolute inset-x-0 h-px bg-rule" style={{ bottom: (v / 100) * H }}/>)}
          <span className="absolute inset-x-0 h-0.5 bg-ink" style={{ bottom: (wAvg / 100) * H }}/>
          <div className="absolute inset-0 flex items-end justify-between gap-2.5">
            {COHORT_WEEKDAY.map(d => (
              <span key={d.key} className="flex h-full flex-1 items-end">
                <span className={cn('w-full rounded-t-[5px]', d.mean >= 60 ? HIGH : 'bg-sky')}
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
      <Note>The dark line is the average, {wAvg}. Yellow is 60 or more.</Note>
    </Panel>
  )
}

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
      <PanelHead as="h3" title="Your network, each day" meta={`${s.n} teens who share Trends`}/>
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

function GroupToday({ list, words }) {
  if (list.length < K_ANONYMITY) return null
  const today = list.map(t => t.days[t.days.length - 1])
  const avg = Math.round(today.reduce((t, d) => t + d.score, 0) / today.length)
  const base = Math.round(list.reduce((t, x) => t + x.usual.base, 0) / list.length)
  return (
    <div className={ROW}>
      <Panel className="lg:max-w-[620px]">
        <PanelHead as="h3" title="Mind Score today, average" meta={`${list.length} teens`}/>
        <div className="mt-2 flex justify-center">
          <RainbowDial score={avg} usual={base} rings={groupRings(list, K_ANONYMITY)} size={300}/>
        </div>
        <p className="mt-2 text-fine text-ink-2">The average {words.across}. The mark on the scale is the usual day, {base}.</p>
      </Panel>
    </div>
  )
}

export function GroupTrends({ words, real, list = CASELOAD, sessionLog = [], go }) {
  const relabel = logSubjects(list)
  const log = real ? [] : [...sessionLog, ...AUDIT_LOG.filter(r => r.rel === 'Today').map(r => ({
    at: 'Today, ' + r.at.split(', ')[1], action: r.action.replace(/crisis alert/gi, m => (m[0] === 'C' ? 'Urgent alert' : 'urgent alert')),
    actor: relabel(r.actor), subject: relabel(r.subject),
  }))]
  const sharing = real ? [] : list
  return (
    <>
      {real ? (
        <Panel tone="brand">
          <PanelHead title={words.lead}/>
          <p className="mt-3 max-w-[30ch] font-display text-row font-bold leading-[1.16] text-ink sm:text-head">
            The whole group shows once five teens share.</p>
          <p className="mt-2 max-w-[52ch] text-fine text-ink-2">A smaller group shows nothing, so no one teen can be picked out.</p>
          {go && (
            <div className="mt-3.5 flex flex-wrap items-center gap-4">
              <TrafficLight size={22} horizontal cycle={false} className="opacity-60"/>
              <button type="button" onClick={() => go('network')}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-field bg-mint-ink px-5 font-display text-ui
                  font-bold text-white transition-colors duration-150 hoverOnly:bg-accent-ink">
                <Plus aria-hidden className="size-4 shrink-0"/> Open Network</button>
            </div>
          )}
        </Panel>
      ) : (
        <>
          <section aria-labelledby="grp-today-h">
            <ProPart id="grp-today-h" kind="today" title="Today" line={TODAY_LONG}/>
            <GroupToday list={list} words={words}/>
          </section>
          <section aria-labelledby="grp-trends-h" className="mt-8">
            <ProPart id="grp-trends-h" kind="trends" title="Trends" line="The last 30 days, then this term."/>
            <div className={ROW}>
              <Network list={list}/>
            </div>
            <div className={cn(ROW, 'lg:grid-cols-2')}>
              <Weekdays/>
              <Periods/>
            </div>
          </section>
        </>
      )}

      <ProPart kind="rules" title="Rules and the log" className="mt-8"/>
      <div className={cn(ROW, 'lg:grid-cols-2')}>
        <Panel variant="tint" hue="coral">
          <PanelHead as="h3" title="When an urgent alert is raised"/>
          <ol className="m-0 mt-2 list-none p-0">
            {PROTOCOL.map((p, i) => (
              <li key={p} className="flex items-baseline gap-3 border-b border-coral/25 py-2 last:border-b-0">
                <span className="w-4 shrink-0 text-fine font-bold tabular-nums text-coral-ink">{i + 1}</span>
                <span className="text-fine text-ink">{p}</span>
              </li>
            ))}
          </ol>
          <Note className="border-coral/25 text-ink-2">Urgent alerts reach you for every teen. They cannot be switched off.</Note>
        </Panel>

        <div className="flex flex-col gap-3 lg:gap-4">
          <Panel tone="aqua">
            <PanelHead as="h3" title="What teens share with you"/>
            <p className="mt-2 max-w-[48ch] text-fine text-ink-2">{CONSENT_SHORT}</p>
            {!real && <dl className="m-0 mt-2 p-0">
              <KV k="Mind Score" v={`${sharing.length} of ${sharing.length}`}/>
              <KV k="Trend and change" v={`${sharing.filter(trendsShared).length} of ${sharing.length}`}/>
              <KV k="Single readings" v={`${sharing.filter(readingsShared).length} of ${sharing.length}`}/>
            </dl>}
          </Panel>

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
          </Panel>
        </div>
      </div>
    </>
  )
}
