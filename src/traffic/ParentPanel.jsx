import React from 'react'
import { LightCard, WeekGraph } from './ParentReport'
import { useHeadsUp } from './useHeadsUp'

// Heads Up inside the parent app section: both teen engines run headless and feed the parent's card.
export function HeadsUpParentPanel({ onOpen }) {
  const hu = useHeadsUp({ headless: true })
  const p = hu.parent
  return (
    <section aria-labelledby="hu-panel-title" className="rounded-panel border border-rule bg-card p-5 sm:p-6">
      <h3 id="hu-panel-title" className="m-0 font-display text-head font-bold leading-tight text-ink">Heads Up</h3>
      <div className="mt-4 grid gap-6 md:grid-cols-2 md:gap-8">
        <LightCard light={p.light} at={p.at} signals={p.signals} reduced={hu.reduced} ios={false} lamp={34}/>
        <div>
          <p className="m-0 font-display text-ui font-bold text-ink">Trends</p>
          <div className="mt-2 max-w-[420px]"><WeekGraph today={p.today} ios={false}/></div>
        </div>
      </div>
      {onOpen && (
        <button type="button" onClick={onOpen}
          className="mt-5 min-h-[44px] font-display text-ui font-bold text-accent underline decoration-accent/40 underline-offset-4 hoverOnly:text-accent-ink">
          See how Heads Up works
        </button>
      )}
    </section>
  )
}

export default HeadsUpParentPanel
