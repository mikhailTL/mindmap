import React from 'react'
import { SectionShell } from './shell'
import { StudentBody } from './Monitor'
import { CheckInBody } from './CheckIn'
import { PrivacyBody } from './Privacy'

/* Tab ids are unchanged; only the labels moved. "What is shared" named a topic
   without saying who the two parties were, so a student could not tell whether
   the tab was about their parent, their school, or an export. */
const TABS = [['today','Today'], ['check','Take a reading'], ['shared','Who sees what']]
const PANES = { today: StudentBody, check: CheckInBody, shared: PrivacyBody }

/* The title was "For students", which named an audience rather than a screen.
   All three sections now answer "what am I about to look at?" in one shape. */
export function Students({ go, tab = 'today', setTab }) {
  const [local, setLocal] = React.useState(tab)
  React.useEffect(() => setLocal(tab), [tab])
  return (
    <SectionShell go={go} tabs={TABS} panes={PANES} tab={local} onTab={setTab || setLocal}
      title="What a student sees"
      sub="Your own reading, what moved it, and what leaves your phone."
      note="Every figure on the Today tab is generated. Take a reading scores your own answers for real."/>
  )
}
