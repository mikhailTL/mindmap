import React from 'react'
import { SectionShell } from './shell'
import { ParentHome as HomeBody, ParentTrends as TrendsBody } from './parent-dash'
import { PrivacyBody } from './Privacy'

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
