import React from 'react'
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
    requestAnimationFrame(() => setSaid(label ? `${label}, showing now` : ''))
  }
  const pick = v => { onTab(v); announce(v) }
  return (
    <main>
      {/* The screen header.
       *
       * It was a mist band with a kinetic grid drawn behind it, which is the
       * marketing site's hero construction: a tinted full-bleed ground with a
       * texture on it, read at the top of a page you are being sold. Inside
       * the app it sat two pixels under a 48px white title bar and undid it.
       *
       * So it is the app's own sheet now. Card ground, no texture, a hairline
       * closing it against the canvas below, and half the air: 20px of
       * padding against the band's old 40. It continues the title bar rather
       * than competing with it, and the tinted canvas starts under the rule.
       *
       * Measured on card #ffffff: ink 14.92, ink-2 8.31, warn 5.78,
       * crit 6.69. The weakest is 5.78, so every word on the band clears
       * 4.5 : 1 at body size. The closing hairline is ink-3 at 5.99, the
       * same rule the title bar and the app foot are drawn with. */}
      <div className="border-b border-ink-3 bg-card">
        {/* The "Overview" back link that used to open this band is gone. The
            app has its own chrome now and that chrome carries one way out,
            named once; two back arrows within sixty pixels of each other, both
            going to the same marketing page, is the kind of doubling that
            makes a product read as a prototype. */}
        <div className="wrap !py-5 lg:!py-6">
          <h1 className="font-display font-bold text-major leading-[1.05] tracking-tight text-ink">{title}</h1>
          {sub && <p className="mt-2 max-w-[60ch] text-sec text-ink-2">{sub}</p>}
          {/* One ruled annotation, and which one depends on what the panes below
              are actually showing: the sample-data caveat over fixtures, the
              no-patch fault when the app is running on nothing. The hand-rolled
              paragraph this replaces wrapped a capsule badge inside a bordered
              tinted box — three containers for one sentence. */}
          {note && (mode === 'real'
            ? <RealNotice className="mt-3">{realNote}</RealNotice>
            : <DemoNotice className="mt-3">{note}</DemoNotice>)}
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
