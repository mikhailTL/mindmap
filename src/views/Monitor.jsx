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

/* The student's screen, and it is one surface.
 *
 * What this replaces: an instrument panel. A 24rem dial column on the left,
 * and beside it a headline, a paragraph, a ruled sub-heading and a two-up grid
 * of four bordered signal cards; then a bordered suggestion card, then a
 * bordered privacy card, then a drawer. Sixteen framed objects on a screen
 * whose entire job is to report one number, and the number was one of sixteen
 * things competing for the first look.
 *
 * The order is the order of the question being asked now: the figure, the one
 * sentence that reads it, the four signals as four rows, the one row that says
 * what leaves the phone. One arc, one figure, one sentence, one list. Nothing
 * on this screen is in a box.
 *
 * What came off and is not coming back:
 *   the four signal cards      four rows, see RainbowKey
 *   the plate behind the dial  see the note on PLATE in charts/rainbow.jsx
 *   the second paragraph       the sentence absorbed it
 *   the suggestion card        a bordered card for one sentence of advice
 *   the sample-data notice     the section band above already carries it, and
 *                              the same disclosure twice in one screenful
 *                              reads as two disclosures
 *   the "scored out of 100" repetition  the heading says the scale once; the
 *                              four rows do not each need a caption saying it
 *
 * What is behind a control the reader chooses to open: the day chart and the
 * paragraph about how the figure is worked out.
 */

export function Headline({ children }) {
  return <p className="max-w-[24ch] font-display text-major font-bold
    leading-[1.15] tracking-tight text-ink">{children}</p>
}

/* The full record, reachable without it occupying the default view. (The note
   here used to guess at how many readers open it; nobody counted.) */
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

/* The hero, and the whole of the top of the screen: the arc, the figure inside
   it, one sentence under it, then the four signals as rows. `picked` lives
   here because the detail opens below all of it, across the column.

   Centred and capped at 30rem rather than parked in a grid column. The dial is
   the one thing on the screen and a thing that is the one thing is in the
   middle; the two-column layout existed to give the four signal cards somewhere
   to live, and there are no cards now. */
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

/* What leaves the phone, as a row rather than a card. A teen tester went
   looking for this first and had to read it off a parent's screen, in the
   third person, so it is here and in first person. The row shape is the same
   one the parent screen uses, and both are plain rules now: a bordered card
   holding one line and a chevron is a card drawn around a list row. */
function SharedRow({ go, openTab }) {
  return (
    <button type="button" onClick={() => openTab ? openTab('shared') : go('privacy')}
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
/* Four lanes of chart paper with the pen never lowered.
 *
 * The alternative was a dial at zero, and it is unusable here: zero on this
 * scale means a calm day, so an empty dial would be a reading — the one number
 * on the screen, stating something false with total confidence. This figure
 * cannot be misread as a measurement, and it occupies the place the dial
 * occupies in demo, so flipping modes exchanges one drawn object for another
 * instead of collapsing the layout. */
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
              {/* The lane itself: ruled, dashed, empty. */}
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

/* Written as requirements, not as a wizard: nothing here can be completed by
   clicking, so presenting them as steps would be a promise the screen cannot
   keep. */
const PAIRING = [
  ['A charged patch', 'One MindMap patch on the outside of the upper arm. None exists to send you yet. The hardware is drawn and printed, not manufactured.'],
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

      {/* This outranks the pairing requirements above on purpose. A visitor has
          no patch and cannot get one, but the six questions score a real person
          on the same scale with no hardware at all. It was a bordered card
          with a header, a description and a button; it is the one ruled block
          on the screen now, which is louder, not quieter. */}
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
  /* The whole screen swaps rather than each figure emptying in place: a score,
     a dial and four signals have no honest empty form, and a page of blanks
     reads as a failure rather than as a product waiting for a device. */
  if (mode === 'real') return <StudentUnpaired go={go} openTab={openTab}/>
  return (
    <>
      {/* "Today" alone did not say today's what; the date beside it reads as
          the answer and is not. */}
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

/* Back, Reason and Stat lived here and are gone with the screen that used
   them: Back was a second way out of the app, which the app chrome now owns
   and names once; Reason was the collapsible claim row from the version of
   this screen that argued its own case, and Stat was a bordered figure tile
   from the version before that. Nothing imported any of the three.

   ParentBody lived here too: StudentBody with the nouns swapped — same dial,
   same four signal tiles, same layout, for a reader who opens the screen once
   a week rather than daily. It was replaced by src/views/parent-dash.jsx. */
