import React from 'react'
import { Back } from './Monitor'
import KineticGrid from '../s21/texture'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { DemoNotice, RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'

/* One section shell for the three audiences.
 *
 * "For schools" had this layout and the other two did not — a student or a
 * parent arriving from the nav landed straight on a bare dashboard with no
 * heading saying who the page was for. All three are sections now, built from
 * the same piece, so the difference between them is their content and nothing
 * else. */
export function SectionShell({ title, sub, note, realNote, tabs, panes, go, tab, onTab, children }) {
  const [mode] = useMode()
  const [said, setSaid] = React.useState('')
  /* Switching a tab replaces the panel with focus still on <body>. */
  const announce = v => {
    const label = tabs?.find(t => t[0] === v)?.[1]
    setSaid('')
    requestAnimationFrame(() => setSaid(label ? `${label} — showing now` : ''))
  }
  const pick = v => { onTab(v); announce(v) }
  return (
    <main>
      <div className="relative overflow-hidden border-b border-rule bg-mist">
        <KineticGrid aria-hidden className="absolute inset-0" globalColor="monochrome"/>
        {/* Was py-6 sm:py-8. The site's vertical rhythm is now three fixed
            steps — 10 inside a section, 14 between sections, 20 between page
            regions — instead of per-section numbers that each said something
            different about the same kind of break. A header band is the
            smallest step. */}
        <div className="wrap relative py-10">
          <Back go={go} to="site" label="Overview"/>
          <h1 className="font-display font-medium text-major leading-[1.05] tracking-tight text-ink">{title}</h1>
          {sub && <p className="mt-3 max-w-[60ch] text-sec text-ink-2">{sub}</p>}
          {/* One ruled annotation, and which one depends on what the panes below
              are actually showing: the sample-data caveat over fixtures, the
              no-patch fault when the app is running on nothing. The hand-rolled
              paragraph this replaces wrapped a capsule badge inside a bordered
              tinted box — three containers for one sentence. */}
          {note && (mode === 'real'
            ? <RealNotice className="mt-4">{realNote}</RealNotice>
            : <DemoNotice className="mt-4">{note}</DemoNotice>)}
        </div>
      </div>
      {/* Was py-9 sm:py-12. The tab body is a section, so it takes the middle
          step of the same three. */}
      <div className="wrap py-14">
        <p aria-live="polite" className="sr-only text-sec">{said}</p>
        {tabs ? (
          /* Was a hand-classed @radix-ui/react-tabs tree repeating the trigger
             string this shell shared with the pro console; both now come from
             ui/tabs, so the selected-tab rule is defined in one place. */
          <Tabs value={tab} onValueChange={pick}>
            <TabsList aria-label={`${title} views`}>
              {tabs.map(([v, label]) => (
                <TabsTrigger key={v} value={v}>{label}</TabsTrigger>
              ))}
            </TabsList>
            {tabs.map(([v]) => {
              const Pane = panes[v]
              return (
                <TabsContent key={v} value={v}>
                  <Pane go={go} openTab={pick}/>
                </TabsContent>
              )
            })}
          </Tabs>
        ) : children}
      </div>
    </main>
  )
}
