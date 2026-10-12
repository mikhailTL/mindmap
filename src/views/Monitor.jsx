import React from 'react'
import { Chevron } from '../ui/marks'
import * as C from '@radix-ui/react-collapsible'
import { Button } from '../ui/button'
import { RealNotice } from '../ui/notice'
import { DayChart } from '../charts/day'
import { DATA } from '../lib/assets'
import { RainbowDial, RainbowKey, SensorDetail } from '../charts/rainbow'
import { studentRings } from '../lib/readings'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { useMode } from '../lib/mode'
import { SCORE, CONSENT_SHORT } from '../lib/terms'

/* The student dashboard. SectionShell already carries the sample-data
   disclosure, so this screen must not repeat it. */

export function Headline({ children }) {
  return <p className="max-w-[24ch] font-display text-major font-bold
    leading-[1.15] tracking-tight text-ink">{children}</p>
}

export function AllDetail({ label = 'See every reading', children }) {
  const [open, setOpen] = React.useState(false)
  return (
    <C.Root open={open} onOpenChange={setOpen} className="mt-10">
      <C.Trigger className="group flex min-h-[56px] w-full items-center justify-between gap-4
        border-y border-rule font-display text-ui font-medium text-ink
        transition-colors hoverOnly:text-accent">
        {label}
        <Chevron aria-hidden className="size-4 transition-transform duration-200 ease-out
          group-data-[state=open]:rotate-90"/>
      </C.Trigger>
      <C.Content className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
        <div className="py-10">{children}</div>
      </C.Content>
    </C.Root>
  )
}

/* `picked` lives here, not in RainbowKey: SensorDetail opens below both the
   dial and the key, so they share the selection. */
function Hero({ score, usual, rings, sentence }) {
  const [picked, setPicked] = React.useState(null)
  const open = rings.find(r => r.id === picked)
  return (
    <>
      <div className="mx-auto mt-8 flex max-w-[30rem] flex-col items-center">
        <RainbowDial score={score} usual={usual} rings={rings} size={360}
          picked={picked} onPick={id => setPicked(p => p === id ? null : id)}/>
        <p className="mt-6 max-w-[32ch] text-center text-body text-ink-2">{sentence}</p>
      </div>
      <h2 className="mark mt-12">Each signal, out of 100</h2>
      <RainbowKey className="mt-0" rings={rings} picked={picked} onPick={setPicked}/>
      {open && <SensorDetail ring={open} onClose={() => setPicked(null)}/>}
    </>
  )
}

/* Consent summary, phrased in first person: this is the student's own screen.
   The parent screen states the same scope in the third person. */
function SharedRow({ go, openTab }) {
  return (
    <button type="button" onClick={() => go('shared')}
      className="mt-12 flex min-h-[56px] w-full items-center gap-4 border-y border-rule py-4
        text-left transition-colors duration-150 hoverOnly:bg-mist/50">
      <span className="min-w-0 flex-1">
        <span className="block text-body text-ink">{CONSENT_SHORT}</span>
        <span className="block text-meta text-ink-2">See who can see what</span>
      </span>
      <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
    </button>
  )
}

/* ── Student, with nothing paired ───────────────────────────────────────── */
/* Unpaired state. Do not substitute a dial at zero: 0 is a valid score on
   this scale (a calm day), so an empty dial reads as a real measurement.
   Empty lanes occupy the dial's slot so switching modes does not reflow. */
function SilentChannels() {
  return (
    <figure className="m-0">
      <div className="border-t border-ink">
        {SENSOR_ORDER.map(id => {
          const s = SENSORS[id]
          return (
            <div key={id} className="flex items-center gap-4 border-b border-rule py-5">
              <span className="w-[10ch] shrink-0 font-display text-meta font-medium text-ink">{s.name}</span>
              <span className="tick w-[4ch] shrink-0">{s.unit}</span>
              <span aria-hidden className="flex-1 border-t border-dashed border-ruling"/>
              <span className="shrink-0 whitespace-nowrap text-tick text-ink-3">no signal</span>
            </div>
          )
        })}
      </div>
      <figcaption className="note mt-4 max-w-[36ch]">
        Four channels, nothing written on any of them. A paired patch fills each one once a second.
      </figcaption>
    </figure>
  )
}

/* Requirements, not wizard steps — none of these can be satisfied in-app, so
   do not renumber them or attach actions. */
const PAIRING = [
  ['A charged patch', 'One MindMap patch on the outside of the upper arm. None exists to send you yet. The patch is drawn and printed, not manufactured.'],
  ['A phone with Bluetooth', 'The app pairs over Bluetooth LE and reads the four channels above once a second.'],
  ['About two weeks of wear', `The ${SCORE} compares you with your own normal, and the first two weeks are what build that normal.`],
]

function StudentUnpaired({ go, openTab }) {
  const toCheck = () => openTab ? openTab('check') : go('check')
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-row font-bold text-ink">Your {SCORE} today</h2>
        <span className="note">No patch paired</span>
      </div>
      <RealNotice className="mt-3">Nothing has been measured, so there is no {SCORE}.</RealNotice>

      <div className="mx-auto mt-10 max-w-[30rem]"><SilentChannels/></div>

      <h2 className="mark mt-12">What you need to take a reading</h2>
      <ul className="m-0 list-none p-0">
        {PAIRING.map(([what, why]) => (
          <li key={what} className="border-b border-rule py-4">
            <span className="block text-body text-ink">{what}</span>
            <span className="mt-1 block max-w-[52ch] text-sec text-ink-2">{why}</span>
          </li>
        ))}
      </ul>

      {/* The only route a visitor can actually complete, so it outranks the
          pairing requirements above. */}
      <div className="mt-12 border-l-2 border-accent pl-5">
        <p className="max-w-[46ch] text-body text-ink">Six questions, scored by the same model the
          patch feeds. The same {SCORE}, 0 to 100, on the person reading this.</p>
        <Button className="mt-4" onClick={toCheck}>Answer six questions</Button>
      </div>

      <SharedRow go={go} openTab={openTab}/>
    </>
  )
}

/* ── Student ────────────────────────────────────────────────────────────── */
export function StudentBody({ go, openTab }) {
  const [mode] = useMode()
  /* Real mode swaps the whole screen rather than emptying each figure: score,
     dial and signals have no honest zero state. */
  if (mode === 'real') return <StudentUnpaired go={go} openTab={openTab}/>
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-row font-bold text-ink">Your {SCORE} today</h2>
        <span className="note">Thursday · 4:10 pm</span>
      </div>

      <Hero score={51} usual={46} rings={studentRings()}
        sentence="A little higher than your normal. It went up in third period and has stayed there."/>

      <SharedRow go={go} openTab={openTab}/>

      <AllDetail>
        <h3 className="mark">Your {SCORE} through the day</h3>
        <p className="mt-1.5 mb-2 text-sec text-ink-3">The shaded band is your normal range.</p>
        <DayChart data={DATA.day} band={DATA.band}/>
        <p className="mt-6 max-w-[64ch] text-meta text-ink-2">The {SCORE} is worked out every 30 seconds
          from the last minute of readings, and compared with your own last two weeks. Each band on
          the arch is one signal's distance from that baseline. The middle number blends all four, so
          the bands do not add up to it.</p>
      </AllDetail>
    </>
  )
}

/* The parent dashboard is src/views/parent-dash.jsx, not here. */
