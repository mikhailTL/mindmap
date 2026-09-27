import React from 'react'
import { SectionShell } from './shell'
import { ParentDash } from './parent-dash'
import { PrivacyBody } from './Privacy'

/* Tab ids are unchanged. "What you can see" read as a promise rather than a
   label; the pane it opens compares all three audiences, so it is named for
   that, and matches the same tab in the student section. */
const TABS = [['week','This week'], ['shared','Who sees what']]
/* The week pane was ParentBody from Monitor.jsx — the student dashboard with
   the nouns swapped. It is its own screen now; see parent-dash.jsx. */
const PANES = { week: ParentDash, shared: PrivacyBody }

/* Was "For parents" — an audience, not a screen. */
export function Parents({ go, tab = 'week', setTab }) {
  const [local, setLocal] = React.useState(tab)
  React.useEffect(() => setLocal(tab), [tab])
  return (
    /* No `note`: the shell's sample-data line is a fixed string, and half of
       what it claimed stops being true the moment the top-bar switch is set to
       real — there are no numbers on this screen then, generated or otherwise.
       The disclosure moved into the pane, where it can read the mode and say
       which of the two things is actually the case. */
    <SectionShell go={go} tabs={TABS} panes={PANES} tab={local} onTab={setTab || setLocal}
      title="What a parent sees"
      sub="The week in one sentence, the one thing worth asking about tonight, and everything this page will never show you."/>
  )
}
