import React from 'react'
import { SectionShell } from './shell'
import { StudentBody } from './Monitor'
import { CheckInBody } from './CheckIn'
import { PrivacyBody } from './Privacy'

const TABS = [['today','Today'], ['check','Take a reading'], ['shared','Who sees what']]
const PANES = { today: StudentBody, check: CheckInBody, shared: PrivacyBody }

export function Students({ go, tab = 'today', setTab }) {
  const [local, setLocal] = React.useState(tab)
  React.useEffect(() => setLocal(tab), [tab])
  return (
    <SectionShell go={go} tabs={TABS} panes={PANES} tab={local} onTab={setTab || setLocal}
      title="What a student sees"
      sub="Your own reading, what moved it, and what leaves your phone."
      note="Every figure on the Today tab is generated. The Take a reading tab scores your own answers for real."/>
  )
}
