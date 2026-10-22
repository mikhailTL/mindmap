import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'

/* Shared section shell for all three audience views. */
export function SectionShell({ title, sub, tabs, panes, go, tab, onTab, children }) {
  const [said, setSaid] = React.useState('')
  // Clearing `said` first makes the live region re-announce when the same tab is picked twice.
  const announce = v => {
    const label = tabs?.find(t => t[0] === v)?.[1]
    setSaid('')
    requestAnimationFrame(() => setSaid(label ? `${label}, showing now` : ''))
  }
  const pick = v => { onTab(v); announce(v) }
  return (
    <main>
      <div className="wrap !pt-5 pb-14">
        <p aria-live="polite" className="sr-only text-sec">{said}</p>
        {sub && <p className="max-w-[58ch] text-sec text-ink-2">{sub}</p>}
        {/* No gap above the content unless the line above it is drawn. */}
        <div className={sub ? 'mt-7' : undefined}>
        {tabs ? (
          <Tabs value={tab} onValueChange={pick}>
            <TabsList aria-label={`${title} views`} scroll>
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
      </div>
    </main>
  )
}
