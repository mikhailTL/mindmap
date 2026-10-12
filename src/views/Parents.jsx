import React from 'react'
import { SectionShell } from './shell'
import { ParentDash } from './parent-dash'
import { PrivacyBody } from './Privacy'

const TABS = [['week','This week'], ['shared','Who sees what']]
const PANES = { week: ParentDash, shared: PrivacyBody }

export function Parents({ go, tab = 'week', setTab }) {
  const [local, setLocal] = React.useState(tab)
  React.useEffect(() => setLocal(tab), [tab])
  return (
    /* No `note`: SectionShell's sample-data line is a fixed string and is
       false in real mode. ParentDash reads the mode and discloses there. */
    <SectionShell go={go} tabs={TABS} panes={PANES} tab={local} onTab={setTab || setLocal}
      title="What a parent sees"
      sub="The week in one sentence, the one thing worth asking about tonight, and everything this page will never show you."/>
  )
}
