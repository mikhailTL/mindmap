import React from 'react'
import { SectionShell } from './shell'
import { ParentDash } from './parent-dash'
import { PrivacyBody } from './Privacy'

/* One screen per route. The strip here offered This week and Who sees what,
   both of which are tabs on the bar at the bottom of the app. */
const PANES = { week: ParentDash, shared: PrivacyBody }

const COPY = {
  week: { sub: 'One score a day, and one sentence about the week.' },
  shared: { sub: 'What you are shown about your child, and what you are not.' },
}

export function Parents({ go, tab = 'week' }) {
  const Pane = PANES[tab] || ParentDash
  /* No `note`: the shell's sample-data line is a fixed string and is false in
     real mode. ParentDash reads the mode and discloses there. */
  return (
    <SectionShell go={go} sub={COPY[tab]?.sub}>
      <Pane go={go}/>
    </SectionShell>
  )
}
