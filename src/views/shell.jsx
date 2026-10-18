import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'

/* Shared section shell for all three audience views. */
export function SectionShell({ title, sub, tabs, panes, go, tab, onTab, children }) {
  const [said, setSaid] = React.useState('')
  /* Switching a tab swaps the panel while focus stays on <body>, so the new
     label is announced through the aria-live region. Clearing `said` first
     forces a re-announce when the same label is picked twice. */
  const announce = v => {
    const label = tabs?.find(t => t[0] === v)?.[1]
    setSaid('')
    requestAnimationFrame(() => setSaid(label ? `${label}, showing now` : ''))
  }
  const pick = v => { onTab(v); announce(v) }
  return (
    <main>
      {/* No screen header. The app's top bar already carries the screen name,
          and a second band under it said "What a student sees" -- a sentence
          about the product, written for the site, which nobody inside their
          own app needs told. `title` survives only as the strip's label.
          Contrast on card #ffffff: ink 14.92, ink-2 8.31, crit 6.69, warn 5.78. */}
      <div className="wrap !pt-5 pb-14">
        <p aria-live="polite" className="sr-only text-sec">{said}</p>
        {/* The one sentence that says what this screen is for stays; the
            heading above it went. */}
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
