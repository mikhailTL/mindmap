import React from 'react'
import { Panel, PanelHead } from '../Monitor'
import { Bars, RainbowDial } from '../../charts/rainbow'
import { DATA } from '../../lib/assets'
import { studentRings } from '../../lib/readings'
import { SENSORS } from '../../lib/sensors'
import { LampFace } from '../../traffic/Face'
import { Chevron } from '../../ui/marks'
import { BAND, TODAY, USUAL } from '../reading/demo'
import { daySentence } from './sentence'
import { WeekLamps } from './HeadsUpCard'
import { LIGHT_MEANS, LIGHT_WORD, TEEN, teenSignal } from './demoTeen'

/* The demo's today on the Trends tab: the dial with its one line, and Heads
 * Up for today and the week. The owner, 17 October: "data always goes under
 * trends section", so it lives on the Trends tab and the home is navigation
 * only. The owner, 18 October: "everything looks too overwhelming", so the
 * live signals, the "See today in detail" working and the long Heads Up
 * explainer went.
 *
 * Where the figures come from:
 *   rings      src/lib/readings.js, each signal's own distance from this
 *              person's fourteen-day normal, on a 0 to 100 scale
 *   day, band  src/lib/assets.js, injected at build time
 *   the rest   src/views/reading/demo.js, where scoreCapture is run for real
 *              on the demo capture */

/* The working behind one ring of the dial, opened by tapping the ring. */
function SignalDetail({ ring }) {
  const s = SENSORS[ring.id] || ring
  const tone = s.glow || s.color
  const band = ring.band
  return (
    <div className="mt-3 rounded-panel border border-rule bg-card p-3">
      <p className="flex items-baseline justify-between gap-3">
        <span className="font-display text-ui font-medium text-ink">{s.name}</span>
        <span className="shrink-0 text-fine tabular-nums text-ink-2">{ring.big} {s.unit}</span>
      </p>
      <dl className="m-0 mt-2 grid grid-cols-1 gap-y-1">
        {ring.rows?.map(row => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-fine text-ink-2">{row.label}</dt>
            <dd className="m-0 shrink-0 text-fine tabular-nums text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      {band && (
        <p className="mt-3 text-fine text-ink-2">
          {s.name} is <b className="font-bold tabular-nums text-ink">{ring.value}</b> out of 100. Your own
          normal runs {band.lo} to {band.hi}.</p>
      )}
      <Bars className="mt-3" data={ring.bars} color={tone} unit={ring.barUnit}/>
      <p className="mt-2.5 max-w-[48ch] text-fine text-ink-2">{ring.note || s.about}</p>
    </div>
  )
}

/* Heads Up today: the face, one line, the week's faces. */
function HeadsUpToday({ teen, go }) {
  const today = teen.days[teen.days.length - 1]
  const seen = today.signals.map(teenSignal)
  return (
    <Panel variant="tint" hue="sun" className="flex flex-col">
      <PanelHead as="h3" title="Heads Up" meta="your phone use"/>
      {/* Centred in the height the dial beside it gives on a wide screen. */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="mt-3 flex items-center gap-3">
          <LampFace light={today.light} size={44} glow/>
          <div className="min-w-0">
            <p className="font-display text-row font-bold leading-tight text-ink">Today: {LIGHT_WORD[today.light]}</p>
            <p className="text-fine text-ink-2">
              {seen.length ? `Noticed: ${seen.join(', ')}.` : LIGHT_MEANS[today.light]}</p>
          </div>
        </div>
        <WeekLamps days={teen.days.slice(-7)} size={26} className="mt-4 border-t border-rule/50 pt-3 lg:mt-6 lg:pt-5"/>
      </div>
      {go && (
        <button type="button" onClick={() => go('heads-up')}
          className="group mt-2 flex min-h-[44px] w-full items-center gap-3 border-t border-rule pt-2 text-left">
          <span className="min-w-0 flex-1 font-display text-fine font-medium text-ink-2 transition-colors
            duration-150 groupHoverOnly:text-accent-ink">How Heads Up works</span>
          <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
        </button>
      )}
    </Panel>
  )
}

/** The demo's today on the Trends tab: the dial and its line, then Heads Up. */
export function DemoTodayDetail({ go }) {
  const rings = studentRings()
  const [picked, setPicked] = React.useState(null)
  const said = daySentence({ day: DATA.day || [], band: BAND })
  const openRing = rings.find(r => r.id === picked)

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
      <Panel className="relative flex flex-col justify-center overflow-hidden
        bg-gradient-to-b from-card via-card to-aqua">
        {/* Named the way the parent and Counselor/Professional dials are. */}
        <h3 className="relative m-0 font-display text-head font-bold leading-tight text-ink">Mind Score today</h3>
        <div className="relative mt-3 flex flex-col items-center text-center">
          <RainbowDial score={TODAY.score} usual={USUAL} rings={rings}
            size={352} picked={picked}
            onPick={id => setPicked(p => (p === id ? null : id))}/>
          <p className="mt-3 max-w-[30ch] font-display text-row font-bold leading-[1.18]
            tracking-tight text-ink sm:text-head">{said.lead}</p>
        </div>
        {openRing && <SignalDetail ring={openRing}/>}
      </Panel>
      <HeadsUpToday teen={TEEN} go={go}/>
    </div>
  )
}
