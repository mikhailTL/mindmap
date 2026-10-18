import React from 'react'
import { RainbowDial } from '../../charts/rainbow'
import { SeeDetails } from '../Monitor'
import { PartHead, TODAY_LONG, longDate } from '../student/PartHead'
import FamilyPrivacy from './Privacy'
import { TeenAvatar } from './TeenCard'
import { AskAbout, BackButton, LiveShares, ringsFor } from './TeenDetail'
import { SourceLine } from './Source'
import HeadsUpPhone from './HeadsUpPhone'
import ChildTrends from './Trends'
import { STATUS_SUB, lightOf, metaLine, subOf } from './data'

/* One child's page for a parent, opened from their card on the home.
 *
 *   Today            Mind Score today on the rainbow, then Heads Up today.
 *   Trends           the same Trends every child gets (./Trends.jsx).
 *   Recommendations  what to ask about this week.
 *   Then the privacy box.
 *
 * The owner, 18 October, "everything looks too overwhelming": the day in
 * detail (the same day as the rainbow) and the body signal charts (the
 * rainbow's rings already say each one) are gone.
 *
 * Whole days only, never a single reading's time, a note or a place. */

export default function ChildPage({ teen, onBack }) {
  const ids = React.useId()
  const days = teen.days
  const today = days[days.length - 1]
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

      <PartHead id={ids + 'today'} kind="today" title="Today" line={dateLine}
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
            </>
          )}
        </section>

        <section aria-labelledby={ids + 'hu'} className="flex flex-col rounded-panel border border-rule bg-card p-5 shadow-card sm:p-6">
          <h3 id={ids + 'hu'} className="m-0 font-display text-head font-bold leading-tight text-ink">Heads Up today</h3>
          {/* The owner, 18 October: a phone showing what was reported, never
              what was on the screen (./HeadsUpPhone.jsx). */}
          <HeadsUpPhone className="mt-4" teen={teen} day={today} at={at}/>
        </section>
      </div>

      <PartHead id={ids + 'trends'} kind="trends" title="Trends" line="Pick a range or a day."
        className="mt-6"/>
      <ChildTrends teen={teen}/>

      {/* Its own part, after Trends: the owner, 18 October, "should be moved
          to different recommendations section". */}
      {shared && (
        <section aria-labelledby={ids + 'rec'} className="mt-6 flex flex-col gap-4">
          <PartHead id={ids + 'rec'} kind="recs" title="Recommendations"/>
          <AskAbout teen={teen}/>
        </section>
      )}
      {teen.live ? <LiveShares teen={teen} variant="parent"/> : (
        <SeeDetails label="Privacy" sub={`What is shared, what was signed, and who opened ${teen.first}’s record`}>
          <FamilyPrivacy teen={teen}/>
        </SeeDetails>
      )}
    </div>
  )
}
