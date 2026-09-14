import React from 'react'
import { ArrowLeft, Chevron } from '../ui/marks'
import * as C from '@radix-ui/react-collapsible'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import { Label } from '../ui/misc'
import { Spark } from '../charts/primitives'
import { DayChart } from '../charts/day'
import { WeekChart } from '../charts/week'
import { DATA } from '../lib/assets'
import { ScrollIn, ScrollRow } from '../s21/motion'
import { WeekStrip } from '../charts/infographics'
import { RainbowDial, RainbowKey, SensorDetail } from '../charts/rainbow'
import { studentRings, parentRings } from '../lib/readings'
import { Spark as MiniSpark } from '../charts/primitives'
import { cn } from '../lib/utils'

/* The dashboard shows one number, one sentence, and the reasons under it.
   Everything else is behind a control the reader chooses to open. (This note
   used to say "three reasons" — there are two — and to claim a five-second
   read nobody timed. A comment that miscounts the code is worse than no
   comment.) */

export function Back({ go, to = 'hub', label = 'All views' }) {
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

/* Every number on these two screens comes from a fixture, and a reviewer read
   all of them as measurements of a real child. Saying so once, at the top, is
   cheaper than a disclaimer under each figure. */
export function SampleTag({ children = 'Sample data — not a real person' }) {
  /* Badge's `demo` variant is this disclosure's own variant: it carries the
     warn hue in the border, bed and text, so the hand-rolled mist pill with a
     warn dot glued to it — one colour doing the work of three — is gone. */
  return <Badge variant="demo">{children}</Badge>
}

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

/* ── Student ────────────────────────────────────────────────────────────── */
export function StudentBody({ go, openTab }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline gap-3.5">
        {/* "Today" alone did not say today's what; the date badge beside it
            reads as the answer and is not. */}
        <h2 className="font-display text-row font-medium text-ink">Your reading today</h2>
        <Label>Thursday · 4:10 pm</Label>
        <SampleTag/>
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

/* ── Parent ─────────────────────────────────────────────────────────────── */
export function ParentBody({ go, openTab }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline gap-3.5">
        <h2 className="font-display text-row font-medium text-ink">Maya</h2>
        <Label>This week · shared since March</Label>
        <SampleTag/>
      </div>

      <Rings score={58} usual={47} rings={parentRings()}>
        <Headline>Maya had a harder week than usual.</Headline>
        <p className="mt-4 max-w-[42ch] text-body text-ink-2">Three school mornings were above her normal.
          The weekend was normal.</p>
        <WeekStrip days={DATA.week} band={DATA.weekBand} className="mt-6 max-w-[22rem]"/>
      </Rings>

      {/* mt was 12; this is a section break, which is the middle step. */}
      <ScrollIn as="section" className="mt-14">
        {/* "What the week looked like" described the week without saying what
            the two rows under it do, which is give the evidence for the
            sentence above. */}
        <h2 className="mark">Why her week reads higher</h2>
        <div className="mt-2 border-t border-rule">
          <Reason index={0}
            claim="Three of five school days were above her normal before lunch."
            plain="Monday, Wednesday and Thursday. Her normal is worked out from her own last two weeks. She is never compared with other students."
            source="Daily average against her own normal range"
            chart={<><WeekStrip days={DATA.week} band={DATA.weekBand}/>
              <p className="mt-2 font-mono text-tick tabular-nums text-ink-3">3 of 7 above</p></>}/>
          <Reason index={1}
            claim="The weekend was normal, so this is about school hours."
            plain="Saturday and Sunday were both inside her normal range. A week that was high every day would point to something else."
            source="School days and weekend, compared"
            chart={<><WeekStrip days={DATA.week.slice(5)} band={DATA.weekBand}/>
              <p className="mt-2 font-mono text-tick tabular-nums text-ink-3">Sat 43 · Sun 45</p></>}/>
        </div>
      </ScrollIn>

      <ScrollIn className="mt-10 border-l-2 border-accent py-1 pl-5">
        <p className="max-w-[52ch] text-sec text-ink-2">Thursday morning is worth asking about.</p>
      </ScrollIn>

      <ScrollIn as="div"><Card interactive as="button"
        onClick={() => openTab ? openTab('shared') : go('privacy')}
        className="mt-10 flex min-h-[56px] items-center justify-between gap-4 px-5 py-4">
        <span className="text-body text-ink">Her notes and her location are never shared with you.
          <span className="block text-meta text-ink-2">See who can see what</span></span>
        <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
      </Card></ScrollIn>

      <AllDetail label="See the whole week">
        <h3 className="mark">The last seven days</h3>
        <p className="mt-1.5 mb-2 text-sec text-ink-3">The shaded band is her normal range.</p>
        <WeekChart data={DATA.week} band={DATA.weekBand}/>
        <div className={cn(STATS, 'mt-10')}>
          <Stat label="Days above normal" value="3" unit="of 5">Monday, Wednesday, Thursday. All before noon.</Stat>
          <Stat label="Week average" value="58" unit="of 100">Her usual average is 47.</Stat>
          <Stat label="Weekend" value="44" unit="of 100">Inside her normal range both days.</Stat>
          <Stat label="Sleep" value="5.4" unit="h">Her usual is 7.9 hours.</Stat>
          <Stat label="Patch worn" value="94" unit="%">Off her skin for 41 minutes on Tuesday.</Stat>
          <Stat label="Check-ins" value="6" unit="of 7">She skipped Saturday.</Stat>
        </div>
        <p className="mt-6 max-w-[64ch] text-meta text-ink-2">Maya sees this page too. Her second-by-second
          readings, her notes and her location stay on her account.</p>
      </AllDetail>
    </>
  )
}
