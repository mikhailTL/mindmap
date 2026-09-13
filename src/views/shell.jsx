import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Back } from './Monitor'
import KineticGrid from '../s21/texture'
import { cn } from '../lib/utils'

/* One section shell for the three audiences.
 *
 * "For schools" had this layout and the other two did not — a student or a
 * parent arriving from the nav landed straight on a bare dashboard with no
 * heading saying who the page was for. All three are sections now, built from
 * the same piece, so the difference between them is their content and nothing
 * else. */
export function SectionShell({ title, sub, note, tabs, panes, go, tab, onTab, children }) {
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
      <div className="relative overflow-hidden border-b border-rule bg-sage">
        <KineticGrid aria-hidden className="absolute inset-0" globalColor="monochrome"/>
        <div className="wrap relative py-6 sm:py-8">
          <Back go={go} to="site" label="Overview"/>
          <h1 className="font-display font-bold text-major leading-[1.05] tracking-tight text-ink">{title}</h1>
          {sub && <p className="mt-3 max-w-[60ch] text-sec text-ink-2">{sub}</p>}
          {note && (
            <p className="mt-4 inline-flex max-w-[60ch] items-baseline gap-2 border-l-2 border-warn
              bg-paper/70 py-2 pl-3 pr-4 text-meta text-ink-2">
              <b className="font-mono text-label font-medium uppercase tracking-[0.12em] text-warn">Demo</b>
              {note}</p>
          )}
        </div>
      </div>
      <div className="wrap py-9 sm:py-12">
        <p aria-live="polite" className="sr-only text-sec">{said}</p>
        {tabs ? (
          <Tabs.Root value={tab} onValueChange={pick}>
            <Tabs.List aria-label={`${title} views`}
              className="flex flex-wrap gap-x-1 gap-y-1 border-b border-ink pb-px">
              {tabs.map(([v, label]) => (
                <Tabs.Trigger key={v} value={v}
                  className="min-h-[48px] whitespace-nowrap px-4 font-display text-meta font-medium text-ink-2
                    transition-colors duration-150 hover:text-ink data-[state=active]:border-b-2
                    data-[state=active]:border-accent data-[state=active]:text-ink">
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {tabs.map(([v]) => {
              const Pane = panes[v]
              return (
                <Tabs.Content key={v} value={v} className="pt-9 focus-visible:outline-none">
                  <Pane go={go} openTab={pick}/>
                </Tabs.Content>
              )
            })}
          </Tabs.Root>
        ) : children}
      </div>
    </main>
  )
}
