import React from 'react'
import { SectionShell } from './shell'
import { ParentHome as HomeBody, ParentTrends as TrendsBody } from './parent-dash'
import { PrivacyBody } from './Privacy'
import { useMode } from '../lib/mode'

/* The parent app's screens, each in the section shell with its honesty line.
 *   ParentHome    Home: the places to go and the network box, no figures
 *   ParentTrends  Trends: the children's cards (a card opens that child's
 *                 page), then a child picker, Day / Week / Month and the calendar
 *   Parents       the older entry by tab: 'week' is Home, 'shared' Privacy */

const NOTE = 'These children and figures are made up.'
const HOME_NOTE = 'These people are made up.'

function Shell({ go, children, demoNote = NOTE }) {
  const [mode] = useMode()
  /* Live, the screen carries its own line about where the cards come from. */
  const note = mode === 'real' || !demoNote ? undefined : demoNote
  return <SectionShell go={go} note={note}>{children}</SectionShell>
}

export function ParentHome({ go }) {
  return <Shell go={go} demoNote={HOME_NOTE}><HomeBody go={go}/></Shell>
}

export function ParentTrends({ go }) {
  return <Shell go={go}><TrendsBody go={go}/></Shell>
}

export function Parents({ go, openTab, tab = 'week' }) {
  if (tab === 'shared') return <SectionShell go={go}><PrivacyBody go={go} openTab={openTab}/></SectionShell>
  return <ParentHome go={go}/>
}
