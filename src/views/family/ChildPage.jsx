import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { RainbowDial } from '../../charts/rainbow'
import { LightCard } from '../../traffic/ParentReport'
import { SeeDetails } from '../Monitor'
import { PartHead, TODAY_LONG, longDate } from '../student/PartHead'
import FamilyPrivacy from './Privacy'
import { TeenAvatar } from './TeenCard'
import { AskAbout, BackButton, LiveShares, ringsFor } from './TeenDetail'
import { SourceLine } from './Source'
import { BodySignals } from './charts'
import DayFacts from './DayFacts'
import ChildTrends from './Trends'
import { STATUS_SUB, lightOf, metaLine, subOf } from './data'

/* One child's page for a parent, opened from their card on the home.
 *
 *   Today    Mind Score today on the rainbow, then Heads Up today; the day
 *            in detail; the body signals as small gradient charts over the
 *            week (a phone-only teen gets the ones the phone reads, and says
 *            so).
 *   Trends   the same Trends every child gets (./Trends.jsx).
 *   Then what to ask about and the privacy boxes.
 *
 * Whole days only, never a single reading's time, a note or a place. */

function Section({ id, title, line, children, className }) {
  return (
    <section aria-labelledby={id} className={'rounded-panel border border-rule bg-card p-4 shadow-card sm:p-5 ' + (className || '')}>
      <h3 id={id} className="m-0 font-display text-head font-bold leading-tight text-ink">{title}</h3>
      {line && <p className="m-0 mt-1 text-fine text-ink-2">{line}</p>}
      {children}
    </section>
  )
}

export default function ChildPage({ teen, onBack }) {
  const reduced = useReducedMotion()
  const ids = React.useId()
  const days = teen.days
  const today = days[days.length - 1]
  const prev = days[days.length - 2]
  const head = React.useRef(null)
  React.useEffect(() => { head.current?.focus({ preventScroll: true }) }, [teen.id])
  const shared = teen.consent?.score !== false
  const rings = teen.live ? [] : ringsFor(teen, today)
  const top = (today.readings || []).reduce((a, r) => (!a || r.score > a.score ? r : a), null)
  const at = today.light === 'red' && top ? new Date(`${today.date}T${top.time}:00`).getTime() : undefined
  const dateLine = teen.live ? longDate() : TODAY_LONG

  return (
    <div className="flex w-full flex-col gap-4 lg:gap-5">
      <div><BackButton onBack={onBack} label="All children"/></div>

      <header className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-panel border border-rule bg-card p-5 shadow-card sm:p-6">
        <TeenAvatar teen={teen} variant="parent" size="size-16"/>
        <div className="min-w-0 flex-1">
          <h2 ref={head} tabIndex={-1} className="m-0 font-display text-sub font-bold leading-none text-ink outline-none">{teen.name}</h2>
          <p className="m-0 mt-1.5 text-fine text-ink-2">{metaLine(teen, 'parent')}</p>
        </div>
        <SourceLine teen={teen} className="w-full sm:w-auto sm:max-w-[22rem]"/>
      </header>

      <PartHead id={ids + 'today'} kind="today" title="Today" line={`${dateLine}. ${teen.first}’s day so far.`}
        className="mt-2"/>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-5">
        <section aria-labelledby={ids + 'dial'}
          className="relative flex flex-col items-center overflow-hidden rounded-panel border border-rule bg-gradient-to-b
            from-card via-card to-aqua p-5 text-center shadow-card sm:p-6">
          <h3 id={ids + 'dial'} className="m-0 self-start font-display text-head font-bold leading-tight text-ink">Mind Score today</h3>
          {!shared ? (
            <p className="m-0 mt-4 text-ui text-ink-2">{teen.first} does not share their Mind Score with you.</p>
          ) : today.score == null ? (
            <div className="my-auto py-8">
              <p className="m-0 font-display text-row font-bold text-ink">No readings yet today</p>
              <p className="m-0 mt-2 text-fine text-ink-2">{teen.first}’s Mind Score shows here after their first reading today.</p>
            </div>
          ) : (
            <>
              <RainbowDial className="mt-3" score={today.score} usual={teen.usual?.base} rings={rings} size={340}/>
              {subOf(teen, today.score) && (
                <p className="m-0 mt-2 font-display text-ui font-bold text-ink">{STATUS_SUB[lightOf(teen, today.score)]}</p>)}
              {teen.usual && <p className="m-0 mt-1 text-fine text-ink-2">Usual range {teen.usual.lo} to {teen.usual.hi}.</p>}
              {rings.length > 0 && (
                <ul className="m-0 mt-4 grid w-full list-none grid-cols-1 gap-x-6 gap-y-2 border-t border-rule p-0 pt-3 text-left sm:grid-cols-2">
                  {rings.map(r => (
                    <li key={r.id} className="flex items-center gap-2 text-fine text-ink-2">
                      <span aria-hidden className="h-3 w-3 shrink-0 rounded-bar" style={{ background: r.glow }}/>
                      <span className="min-w-0 flex-1">{r.name}</span>
                      <span className="font-display font-bold text-ink">
                        {r.value > 64 ? 'Above usual' : r.value < 36 ? 'Below usual' : 'Usual'}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!teen.live && !teen.patch && (
                <p className="m-0 mt-3 text-left text-fine text-ink-2">Two rings, not four: {teen.first} has no patch, so
                  sweat and skin temperature are not read.</p>
              )}
            </>
          )}
        </section>

        <section aria-labelledby={ids + 'hu'} className="flex flex-col rounded-panel border border-rule bg-card p-5 shadow-card sm:p-6">
          <h3 id={ids + 'hu'} className="m-0 font-display text-head font-bold leading-tight text-ink">Heads Up today</h3>
          <div className="mt-5">
            {today.light && today.score != null
              ? <LightCard light={today.light} at={at} signals={today.signals} reduced={reduced} ios={false} lamp={30}/>
              : <p className="m-0 text-ui text-ink-2">No Heads Up yet today.</p>}
          </div>
          <p className="m-0 mt-auto pt-5 text-fine text-ink-2">From how {teen.first} uses their phone, never what is on it.</p>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-5">
        <Section id={ids + 'day'} title="Day in detail" line="Today as a whole day.">
          <DayFacts className="mt-4" teen={teen} d={today} prev={prev}/>
          <p className="m-0 mt-3 text-fine text-ink-2">Times and single readings stay with {teen.first}.</p>
        </Section>
        <Section id={ids + 'body'} title="Body signals"
          line={teen.live ? 'Not shared with parents.' : 'The last seven days, one figure a day.'}>
          <BodySignals className="mt-4" teen={teen} date={today.date}/>
        </Section>
      </div>

      <PartHead id={ids + 'trends'} kind="trends" title="Trends" line="Day, week and month, with the calendar."
        className="mt-6"/>
      <ChildTrends teen={teen}/>

      {shared && <AskAbout teen={teen}/>}
      {teen.live ? <LiveShares teen={teen} variant="parent"/> : (
        <SeeDetails label="Privacy" sub={`What is shared, what was signed, and who opened ${teen.first}’s record`}>
          <FamilyPrivacy teen={teen}/>
        </SeeDetails>
      )}
    </div>
  )
}
