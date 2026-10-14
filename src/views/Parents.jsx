import React from 'react'
import { SectionShell } from './shell'
import { ParentDash } from './parent-dash'
import { PrivacyBody } from './Privacy'

/* One screen per route. The strip here offered This week and Who sees what,
   both of which are tabs on the bar at the bottom of the app. */
const PANES = { week: ParentDash, shared: PrivacyBody }

/* The shell carries the honesty line, a few words each (design spec 0f). The
   sentence about what the screen is for is gone: the screen shows it. */
const COPY = {
  week: {
    note: 'Generated figures. No child is named.',
    realNote: 'Nothing paired yet.',
  },
  shared: {},
}

export function Parents({ go, openTab, tab = 'week' }) {
  const Pane = PANES[tab] || ParentDash
  const copy = COPY[tab] || {}
  return (
    <SectionShell go={go} sub={copy.sub} note={copy.note} realNote={copy.realNote}>
      <Pane go={go} openTab={openTab}/>
    </SectionShell>
  )
}
