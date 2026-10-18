import React from 'react'
import { SectionShell } from './shell'
import { Panel, PanelHead, SeeDetails } from './Monitor'
import { CheckInBody } from './CheckIn'
import { SharingControls } from '../app'
import { MOVE_LIMIT_G } from '../signals/motion'
import { StudentHome } from './student/Home'

/* The student app's Home and Reading screens, and the shell the student tabs
 * sit in.
 *
 * The owner, 17 October: "the home for all audiences needs to have the 4-5
 * boxes and for student a update whether the patch is paired or not (yes for
 * demo) and not the data, data always goes under trends section!" and "log
 * and trends needs to be moved from home and readings into the trends
 * category for students both live and demo."
 *
 *   today   src/views/student/Home.jsx: greeting, patch status, five cards
 *   check   the ways to take a reading and the result of the one just taken
 *   shared  the sharing switches
 *
 * Everything the home used to show (the dial, Heads Up, the live signals, the
 * day and the working behind the score) is on the Trends tab now:
 * src/views/student/TrendsTab.jsx and src/views/student/TodayDetail.jsx. */

/* ── Take a reading ─────────────────────────────────────────────────────── */

/* Both lists are the engine read back, not copy: every row names something
   scoreCapture returns or something the capture screens drop on the device. */
const GIVES = [
  ['One number, 0 to 100', 'The score is compared with your own normal only.'],
  ['A likely range', 'The range widens when a signal is missing or noisy.'],
  ['What moved your score', 'Each input, how far it moved, and which way.'],
  ['Whether you were moving', `Over ${MOVE_LIMIT_G} g, movement is not counted as stress.`],
]

const KEPT_HERE = [
  ['Camera frames', 'The phone turns them into numbers, then deletes them.'],
  ['Microphone audio', 'The phone turns it into pitch figures, then deletes it.'],
  ['Your survey answers', 'Turned into one score. Only the score syncs to your account.'],
]

function Rows({ items }) {
  return (
    <dl className="m-0 list-none p-0">
      {items.map(([what, why]) => (
        <div key={what} className="border-b border-rule py-2 last:border-b-0 last:pb-0">
          <dt className="font-display text-ui font-medium text-ink">{what}</dt>
          <dd className="m-0 mt-0.5 max-w-[56ch] text-fine text-ink-2">{why}</dd>
        </div>
      ))}
    </dl>
  )
}

function CheckBody({ go }) {
  return (
    <>
      <CheckInBody go={go}/>
      <SeeDetails className="mt-6" label="What you get back">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          <Panel className="h-full">
            <PanelHead title="What You Get Back" meta="every way"/>
            <div className="mt-1.5"><Rows items={GIVES}/></div>
          </Panel>
          <Panel className="h-full">
            <PanelHead title="What Is Not Kept" meta="every way"/>
            <div className="mt-1.5"><Rows items={KEPT_HERE}/></div>
          </Panel>
        </div>
      </SeeDetails>
    </>
  )
}

/* One screen per route, no tab strip: the bar at the bottom of the app is the
   navigation. */
const PANES = { today: StudentHome, check: CheckBody, shared: SharingControls }

export function Students({ go, tab = 'today' }) {
  const Pane = PANES[tab] || StudentHome
  return (
    <SectionShell go={go}>
      <Pane go={go}/>
    </SectionShell>
  )
}
