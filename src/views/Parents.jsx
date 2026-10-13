import React from 'react'
import { SectionShell } from './shell'
import { ParentDash } from './parent-dash'
import { PrivacyBody } from './Privacy'

/* One screen per route. The strip here offered This week and Who sees what,
   both of which are tabs on the bar at the bottom of the app. */
const PANES = { week: ParentDash, shared: PrivacyBody }

/* The shell carries the honesty line, as it does on the student screens, so
   the parent screen itself opens on the week's sentence and the dial and
   nothing above them (design spec 0d section 6, 0e section 17). Two routes are
   named separately in the demo line: the scores are the scoring model's output
   and the still-time figures are read off the patch's movement channel, so one
   sentence crediting the model for all of them would not be true of the sleep
   figures. */
const COPY = {
  week: {
    sub: 'One score a day, and one sentence about the week.',
    note: 'Every figure is generated: the scores by the scoring model, the still time off the movement channel. No child is named, and nobody has worn a patch.',
    realNote: 'No patch is paired, so this week has no readings and no day to ask about.',
  },
  shared: { sub: 'What you are shown about your child, and what you are not.' },
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
