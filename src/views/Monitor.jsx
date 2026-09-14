import React from 'react'
import { ArrowLeft, Chevron } from '../ui/marks'
import * as C from '@radix-ui/react-collapsible'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { DemoNotice, RealNotice } from '../ui/notice'
import { Label } from '../ui/misc'
import { Spark } from '../charts/primitives'
import { DayChart } from '../charts/day'
import { WeekChart } from '../charts/week'
import { DATA } from '../lib/assets'
import { ScrollIn, ScrollRow } from '../s21/motion'
import { WeekStrip } from '../charts/infographics'
import { RainbowDial, RainbowKey, SensorDetail } from '../charts/rainbow'
import { studentRings, parentRings } from '../lib/readings'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { useMode } from '../lib/mode'
import { cn } from '../lib/utils'

/* The dashboard shows one number, one sentence, and the reasons under it.
   Everything else is behind a control the reader chooses to open. (This note
   used to say "three reasons" — there are two — and to claim a five-second
   read nobody timed. A comment that miscounts the code is worse than no
   comment.) */

export function Back({ go, to = 'site', label = 'Overview' }) {
  return (
    <button onClick={() => go(to)}
      className="mb-8 flex w-fit min-h-[44px] items-center gap-2 py-2 font-display text-meta
        font-medium text-accent transition-colors duration-150 hover:text-accent-ink">
      <ArrowLeft aria-hidden className="size-4"/> {label}
    </button>
  )
}

export function Headline({ children }) {
  return <p className="max-w-[24ch] font-display text-major font-medium
    leading-[1.15] tracking-tight text-ink">{children}</p>
}

/* One reason. Closed it is a single line; opened it explains the measurement
   in words a parent has not had to look up. */
export function Reason({ claim, plain, source, index, chart }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)
  // The panel opened 300px below the fold with only a 20px chevron as feedback,
  // so a phone user saw nothing happen and tapped again to close it.
  React.useEffect(() => {
    if (!open || !ref.current) return
    const t = setTimeout(() => ref.current?.scrollIntoView({ block: 'nearest' }), 300)
    return () => clearTimeout(t)
  }, [open])
  return (
    <ScrollRow as="div" index={index}>
      <C.Root ref={ref} open={open} onOpenChange={setOpen}
        className="border-b border-rule transition-colors data-[state=open]:bg-mist/40">
        <C.Trigger className="group flex min-h-[64px] w-full items-center gap-4 px-3 py-5 text-left
          transition-colors hover:bg-mist/60">
          <span className="font-mono text-tick tabular-nums text-ink-3">0{index + 1}</span>
          <span className="flex-1 text-body text-ink">{claim}</span>
          <span className="flex shrink-0 items-center gap-1.5 font-mono text-tick
            text-accent">
            <span className="hidden sm:inline group-data-[state=open]:sm:hidden">Why</span>
            <Chevron aria-hidden className="size-4 transition-transform duration-200 ease-out
              group-data-[state=open]:rotate-90"/>
          </span>
        </C.Trigger>
        <C.Content className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
          <div className="grid gap-6 px-3 pb-6 pl-10 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-start">
            <div>
              <p className="max-w-[52ch] text-sec text-ink-2">{plain}</p>
              <p className="mt-3 font-mono text-tick text-ink-3">{source}</p>
            </div>
            {chart && <div className="rounded-xs bg-mist px-3 py-3">{chart}</div>}
          </div>
        </C.Content>
      </C.Root>
    </ScrollRow>
  )
}

/* The full record, reachable without it occupying the default view. (The note
   here used to guess at how many readers open it; nobody counted.) */
export function AllDetail({ label = 'See every reading', children }) {
  const [open, setOpen] = React.useState(false)
  return (
    /* mt-10 / py-10: the vertical scale on these views is three fixed steps —
       10 inside a section, 14 between sections, 20 between page regions. This
       panel and its body are both inside-a-section breaks; py was 8. */
    <C.Root open={open} onOpenChange={setOpen} className="mt-10">
      <C.Trigger className="group flex min-h-[56px] w-full items-center justify-between gap-4
        border-y border-rule font-display text-ui font-medium text-ink
        transition-colors hover:text-accent">
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

const STATS = 'grid gap-x-8 border-t border-rule sm:grid-cols-2 lg:grid-cols-3'
function Stat({ label, value, unit, trend, children }) {
  return (
    <div className="border-b border-rule py-6">
      <div className="note">{label}</div>
      <div className="mt-2 font-mono font-medium tabular-nums text-num leading-none text-ink">
        {value}{unit && <span className="ml-1 text-meta text-ink-3">{unit}</span>}
      </div>
      {trend && <Spark data={trend}/>}
      <p className="mt-1.5 max-w-[36ch] text-meta text-ink-2">{children}</p>
    </div>
  )
}

/* SampleTag is gone. It was one component whose whole body was `<Badge
   variant="demo">`, so it bought an indirection and nothing else, and the
   badge it wrapped was a capsule — the disclosure it carried is a sentence
   about the figures beside it, not a label on them. Call sites set
   `<DemoNotice inline>` directly now; the sentence they were passing is the
   same sentence, set in the ruled annotation from ui/notice.jsx. */

/* The dial, the sentence and the four rows are one unit on every screen that
   has a score, so they are built once. `picked` lives here because the detail
   panel has to sit below all of it, full width. */
function Rings({ score, usual, rings, children }) {
  const [picked, setPicked] = React.useState(null)
  const open = rings.find(r => r.id === picked)
  return (
    <>
      <div className="mt-10 grid gap-9 lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start lg:gap-14">
        <RainbowDial score={score} usual={usual} rings={rings} size={376}
          picked={picked} onPick={id => setPicked(p => p === id ? null : id)}/>
        <div className="min-w-0">
          {children}
          <h2 className="mark mt-10">Each signal, out of 100</h2>
          <RainbowKey className="mt-3" rings={rings} picked={picked}
            onPick={setPicked}/>
        </div>
      </div>
      {open && <SensorDetail ring={open} onClose={() => setPicked(null)}/>}
    </>
  )
}

/* ── Student, with nothing paired ───────────────────────────────────────── */
/* Four lanes of chart paper with the pen never lowered.
 *
 * The alternative was a dial at zero, and it is unusable here: zero on this
 * scale means a calm day, so an empty dial would be a reading — the one number
 * on the screen, stating something false with total confidence. This figure
 * cannot be misread as a measurement, and it occupies the column the dial
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
              <span className="shrink-0 whitespace-nowrap font-mono text-tick text-ink-3">no signal</span>
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

/* Written as requirements rather than as a three-step wizard: nothing here can
   be completed by clicking, so numbering them as actions would be a promise
   the screen cannot keep. */
const PAIRING = [
  ['A patch, charged', 'One MindMap patch on the inside of the forearm. None exists to send you yet — the hardware is drawn and printed, not manufactured.'],
  ['A phone with Bluetooth', 'The app pairs over Bluetooth LE and reads the four channels above once a second.'],
  ['About two weeks of wear', 'The score is a comparison with your own normal, and the first fortnight is what builds that normal. Before it, there is no baseline to compare against.'],
]

function StudentUnpaired({ go, openTab }) {
  const toCheck = () => openTab ? openTab('check') : go('check')
  return (
    <>
      <div className="flex flex-wrap items-baseline gap-3.5">
        <h2 className="font-display text-row font-medium text-ink">Your reading today</h2>
        <Label>No patch paired</Label>
        <RealNotice inline>Nothing has been measured, so there is no score.</RealNotice>
      </div>

      <div className="mt-10 grid gap-9 lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start lg:gap-14">
        <SilentChannels/>
        <div className="min-w-0">
          <Headline>No patch is paired to this account.</Headline>
          <p className="mt-4 max-w-[42ch] text-body text-ink-2">The screen fills the moment one is.
            Until then there is nothing to read, and nothing has gone wrong.</p>
          <h3 className="mark mt-10">What a reading from the patch needs</h3>
          <ol className="m-0 mt-3 list-none p-0">
            {PAIRING.map(([what, why], i) => (
              <li key={what} className="flex gap-4 border-b border-rule py-4">
                <span className="pt-0.5 font-mono text-tick tabular-nums text-ink-3">0{i + 1}</span>
                <span>
                  <span className="block font-display text-ui font-medium text-ink">{what}</span>
                  <span className="mt-1 block max-w-[46ch] text-sec text-ink-2">{why}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* This outranks the pairing requirements above on purpose. A visitor has
          no patch and cannot get one, but the six questions score a real person
          on the same scale with no hardware at all — so the screen's one
          working route out is a key, not a footnote. */}
      <ScrollIn as="div">
        <Card as="section" className="mt-10 border-l-[3px] border-l-accent">
          <CardHeader className="p-6 pb-0">
            <CardTitle as="h3" className="text-row">You can take a reading now, without a patch.</CardTitle>
            <CardDescription className="max-w-[56ch]">Six questions, scored by the same model the
              patch feeds, on the same scale out of 100 — one ring instead of four. It is the only
              screen on this site that measures the person reading it.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-5">
            <Button onClick={toCheck}>Answer six questions</Button>
          </CardContent>
        </Card>
      </ScrollIn>

      {/* Unchanged from the paired screen: what leaves the phone does not
          depend on whether anything is measuring. */}
      <ScrollIn as="div"><Card interactive as="button"
        onClick={() => openTab ? openTab('shared') : go('privacy')}
        className="mt-10 flex min-h-[56px] items-center justify-between gap-4 px-5 py-4">
        <span className="text-body text-ink">What you write in the app stays on your device.
          <span className="block text-meta text-ink-2">See who can see what</span></span>
        <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
      </Card></ScrollIn>

      <p className="mt-10 max-w-[64ch] text-meta text-ink-2">Once a patch is paired the score is
        worked out every 30 seconds from the previous minute of readings, and compared with your own
        last two weeks. Each ring is one signal's own distance from that baseline; the number in the
        middle is the model's blend of all four, so the rings do not add up to it.</p>
    </>
  )
}

/* ── Student ────────────────────────────────────────────────────────────── */
export function StudentBody({ go, openTab }) {
  const [mode] = useMode()
  /* The whole screen swaps rather than each figure emptying in place: a score,
     a dial and four rings have no honest empty form, and a page of blanks
     reads as a failure rather than as a product waiting for a device. */
  if (mode === 'real') return <StudentUnpaired go={go} openTab={openTab}/>
  return (
    <>
      <div className="flex flex-wrap items-baseline gap-3.5">
        {/* "Today" alone did not say today's what; the date badge beside it
            reads as the answer and is not. */}
        <h2 className="font-display text-row font-medium text-ink">Your reading today</h2>
        <Label>Thursday · 4:10 pm</Label>
        <DemoNotice inline>Sample data — not a real person.</DemoNotice>
      </div>

      <Rings score={51} usual={46} rings={studentRings()}>
        <Headline>Today is a little higher than your normal.</Headline>
        <p className="mt-4 max-w-[42ch] text-body text-ink-2">It went up in third period and has stayed
          there.</p>
      </Rings>

      <ScrollIn className="mt-10 border-l-2 border-accent py-1 pl-5">
        <p className="max-w-[52ch] text-sec text-ink-2">Chemistry has been your hardest lesson for four weeks.
          A two-minute breathing exercise is set for before it tomorrow.</p>
      </ScrollIn>

      {/* A teen tester went looking for this first and had to read it off a
          parent's screen, in the third person. It belongs here, in first person. */}
      {/* Card `interactive` in place of the hand-rolled border / hover stack
          this row carried — the same eight classes were copied onto the parent
          screen's row below, so the two could drift apart on any edit. */}
      <ScrollIn as="div"><Card interactive as="button"
        onClick={() => openTab ? openTab('shared') : go('privacy')}
        className="mt-10 flex min-h-[56px] items-center justify-between gap-4 px-5 py-4">
        <span className="text-body text-ink">What you write in the app stays on your device.
          <span className="block text-meta text-ink-2">See who can see what</span></span>
        <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
      </Card></ScrollIn>

      <AllDetail>
        <h3 className="mark">Your score across today</h3>
        <p className="mt-1.5 mb-2 text-sec text-ink-3">The shaded band is your normal range.</p>
        <DayChart data={DATA.day} band={DATA.band}/>
        <p className="mt-6 max-w-[64ch] text-meta text-ink-2">The score is worked out every 30 seconds from
          the previous minute of readings, and compared with your own last two weeks. Each ring above is
          one signal's own distance from that baseline; the number in the middle is the model's blend of
          all four, so the rings do not add up to it.</p>
      </AllDetail>
    </>
  )
}

/* ParentBody lived here: StudentBody with the nouns swapped — same dial, same
   four signal tiles, same layout, for a reader who opens the screen once a
   week rather than daily. It was replaced by src/views/parent-dash.jsx, which
   is built around the week's one sentence instead of an instrument panel. */
