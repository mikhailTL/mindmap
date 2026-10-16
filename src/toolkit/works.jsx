import React from 'react'
import { Panel, PanelHead } from '../views/Monitor'
import { cn } from '../lib/utils'
import { useMode } from '../lib/mode'
import { getVersion, listEffects, subscribe } from '../app/store'
import { rankTools, toolName } from '../signals/effect'

/* What works for you. The tools ranked by the student's own pulse, from the
   before-and-after pairs in the `effects` slot. One bar per tool, the mean
   drop beside it, and one sentence for the tool at the top. Nothing here is
   shared with anyone; the slot is device-only like the rest of the store. */

const DEMO = [
  { tool: 'sigh',      n: 4, meanHrDrop: 6, meanHrvRise: 4 },
  { tool: 'chest',     n: 2, meanHrDrop: 5, meanHrvRise: null },
  { tool: 'breathing', n: 3, meanHrDrop: 4, meanHrvRise: 3 },
  { tool: 'move',      n: 2, meanHrDrop: 2, meanHrvRise: null },
]

function Rows({ rows }) {
  const top = Math.max(1, ...rows.map(r => Math.abs(r.meanHrDrop ?? 0)))
  return (
    <ol className="mt-3 grid gap-2.5" aria-label="Tools, best pulse drop first">
      {rows.map(r => {
        const ranked = r.meanHrDrop != null
        const pct = ranked ? Math.max(0, Math.min(100, Math.round((r.meanHrDrop / top) * 100))) : 0
        return (
          <li key={r.tool} className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate font-display text-ui font-semibold text-ink">
                {toolName(r.tool)}</span>
              <span className="tick shrink-0">{r.n} check{r.n === 1 ? '' : 's'}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2.5 flex-1 overflow-hidden rounded-bar bg-mist">
                <div className={cn('h-full rounded-bar', ranked ? 'bg-accent' : 'bg-rule')}
                  style={{ width: `${pct}%` }}/>
              </div>
              <span className="w-14 shrink-0 text-right font-display text-fine font-semibold tabular-nums text-ink-2">
                {ranked ? `${Math.round(r.meanHrDrop)} bpm` : 'one more'}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function WhatWorksCard({ className }) {
  const [mode] = useMode()
  React.useSyncExternalStore(subscribe, getVersion, () => 0)

  const rows = (mode === 'demo' ? DEMO : rankTools(listEffects())).slice(0, 3)

  return (
    <Panel className={className}>
      <PanelHead title="What Works for You" meta="pulse drop"/>
      {rows.length === 0 ? (
        <p className="mt-3 max-w-[40ch] text-meta text-ink">Check your pulse after a tool to start.</p>
      ) : (
        <Rows rows={rows}/>
      )}
      {mode === 'demo' && <p className="mt-1 text-fine text-ink-3">Demo figures.</p>}
    </Panel>
  )
}

export default WhatWorksCard
