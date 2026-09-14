import React from 'react'
import { SectionShell } from './shell'
import { ParentBody } from './Monitor'
import { PrivacyBody } from './Privacy'

/* Tab ids are unchanged. "What you can see" read as a promise rather than a
   label; the pane it opens compares all three audiences, so it is named for
   that, and matches the same tab in the student section. */
const TABS = [['week','This week'], ['shared','Who sees what']]
const PANES = { week: ParentBody, shared: PrivacyBody }

/* Was "For parents" — an audience, not a screen. */
export function Parents({ go, tab = 'week', setTab }) {
  const [local, setLocal] = React.useState(tab)
  React.useEffect(() => setLocal(tab), [tab])
  return (
    <SectionShell go={go} tabs={TABS} panes={PANES} tab={local} onTab={setTab || setLocal}
      title="What a parent sees"
      sub="How your child's week went, in one sentence, and what you are never shown."
      note="Maya is not a real person and every number on this screen is generated."/>
  )
}
