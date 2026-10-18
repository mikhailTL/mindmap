import React from 'react'
import { SectionShell } from './shell'
import { ParentHome as HomeBody, ParentTrends as TrendsBody } from './parent-dash'
import { PrivacyBody } from './Privacy'

/* The parent app's screens, each in the section shell.
 *   ParentHome    Home: the places to go and the network box, no figures
 *   ParentTrends  Trends: the children's cards (a card opens that child's
 *                 page), then a child picker, Day / Week / Month and the calendar
 *   Parents       the older entry by tab: 'week' is Home, 'shared' Privacy */

export function ParentHome({ go }) {
  return <SectionShell go={go}><HomeBody go={go}/></SectionShell>
}

export function ParentTrends({ go }) {
  return <SectionShell go={go}><TrendsBody go={go}/></SectionShell>
}

export function Parents({ go, openTab, tab = 'week' }) {
  if (tab === 'shared') return <SectionShell go={go}><PrivacyBody go={go} openTab={openTab}/></SectionShell>
  return <ParentHome go={go}/>
}
