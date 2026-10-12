import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { DemoNotice, RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'

/* Shared section shell for all three audience views. */
export function SectionShell({ title, sub, note, realNote, tabs, panes, go, tab, onTab, children }) {
  const [mode] = useMode()
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
      {/* Header contrast on card #ffffff: ink 14.92, ink-2 8.31, crit 6.69,
          warn 5.78. Weakest is warn, so keep text tokens at or above it to
          hold 4.5:1 at body size. */}
      <div className="border-b border-ink-3 bg-card">
        <div className="wrap !py-5 lg:!py-6">
          <h1 className="font-display font-bold text-major leading-[1.05] tracking-tight text-ink">{title}</h1>
          {sub && <p className="mt-2 max-w-[60ch] text-sec text-ink-2">{sub}</p>}
          {note && (mode === 'real'
            ? <RealNotice className="mt-3">{realNote}</RealNotice>
            : <DemoNotice className="mt-3">{note}</DemoNotice>)}
        </div>
      </div>
      <div className="wrap py-14">
        <p aria-live="polite" className="sr-only text-sec">{said}</p>
        {tabs ? (
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
