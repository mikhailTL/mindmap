import React from 'react'
import { SectionShell } from './shell'
import { ParentBody } from './Monitor'
import { PrivacyBody } from './Privacy'

const TABS = [['week','This week'], ['shared','What you can see']]
const PANES = { week: ParentBody, shared: PrivacyBody }

export function Parents({ go, tab = 'week', setTab }) {
  const [local, setLocal] = React.useState(tab)
  React.useEffect(() => setLocal(tab), [tab])
  return (
    <SectionShell go={go} tabs={TABS} panes={PANES} tab={local} onTab={setTab || setLocal}
      title="For parents"
      sub="How your child's week went, in one sentence, and the line you cannot cross."
      note="Maya is not a real person and every number on this screen is generated."/>
  )
}
