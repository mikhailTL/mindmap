import React from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import * as C from '@radix-ui/react-collapsible'
import { Label } from '../ui/misc'
import { Spark } from '../charts/primitives'
import { DayChart } from '../charts/day'
import { WeekChart } from '../charts/week'
import { DATA } from '../lib/assets'
import { RevealRow } from '../s21/motion'
import { WeekStrip } from '../charts/infographics'
import { Spark as MiniSpark } from '../charts/primitives'
import { cn } from '../lib/utils'

/* The dashboard shows one number, one sentence, and three reasons.
   Everything else is behind a control the reader chooses to open — the pattern
   the Oura app uses, and the reason a parent can read this in five seconds. */

export function Back({ go, to = 'hub', label = 'All views' }) {
  return (
    <button onClick={() => go(to)}
      className="mb-8 flex w-fit min-h-[44px] items-center gap-2 py-2 font-display text-meta
        font-medium text-accent transition-colors duration-150 hover:text-accent-ink">
      <ArrowLeft aria-hidden className="size-4"/> {label}
    </button>
  )
}

/* The score, drawn as a quiet arc. Colour never carries the reading on its
   own — the number and the word beside it say the same thing. */
/* Every tester asked the same question of the dial: 58 out of what, and is
   that bad? The number now arrives with its own scale and its own comparison,
   and the band is stated in words so the colour is never carrying it alone. */
export function ScoreDial({ value, band, usual, size = 200 }) {
  const r = 84, C0 = 2 * Math.PI * r, span = 0.74
  const [shown, setShown] = React.useState(0)
  React.useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return }
    let raf, t0
    const step = t => { t0 ??= t
      const p = Math.min(1, (t - t0) / 900)
      setShown(value * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  const tone = band === 'high' ? 'stroke-warn' : band === 'up' ? 'stroke-warn' : 'stroke-accent'
  return (
    <div className="shrink-0">
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="size-full -rotate-[133deg]" aria-hidden>
        <circle cx="100" cy="100" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          className="stroke-sage" strokeDasharray={`${C0 * span} ${C0}`}/>
        <circle cx="100" cy="100" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          className={cn(tone, 'transition-colors')}
          strokeDasharray={`${C0 * span * (shown / 100)} ${C0}`}/>
      </svg>
      {/* The number, the scale and the comparison read to a screen reader as
          three loose fragments — "51", "OUT OF 100", "usually 46" — with the
          counting animation firing on every frame. One name, one reading. */}
      <div role="img" aria-label={`${Math.round(value)} out of 100${usual != null ? `, usually ${usual}` : ''}. 0 is calm, 100 is peak.`}
        className="absolute inset-0 grid place-content-center px-6 text-center">
        <span aria-hidden className="font-display text-dial font-bold leading-none tracking-tight text-ink">
          {Math.round(shown)}</span>
        <span aria-hidden className="mt-1 font-mono text-label uppercase tracking-[0.12em] text-ink-3">out of 100</span>
        {usual != null && (
          <span aria-hidden className="mt-2 text-sec text-ink-2">usually <b className="font-medium text-ink">{usual}</b></span>
        )}
      </div>
      </div>
      <p aria-hidden className="mt-3 text-center text-sec text-ink-2" style={{ width: size }}>
        0 is calm · 100 is peak</p>
    </div>
  )
}

export function Headline({ children }) {
  return <p className="max-w-[24ch] font-display text-[clamp(1.75rem,3.2vw,2.5rem)] font-bold
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
    <RevealRow as="div" index={index}>
      <C.Root ref={ref} open={open} onOpenChange={setOpen}
        className="border-b border-rule transition-colors data-[state=open]:bg-sage/40">
        <C.Trigger className="group flex min-h-[64px] w-full items-center gap-4 px-3 py-5 text-left
          transition-colors hover:bg-sage/60">
          <span className="font-mono text-label tabular-nums text-ink-3">0{index + 1}</span>
          <span className="flex-1 text-body text-ink">{claim}</span>
          <span className="flex shrink-0 items-center gap-1.5 font-mono text-label uppercase
            tracking-[0.12em] text-accent">
            <span className="hidden sm:inline group-data-[state=open]:sm:hidden">Why</span>
            <ChevronRight aria-hidden className="size-4 transition-transform duration-200 ease-out
              group-data-[state=open]:rotate-90"/>
          </span>
        </C.Trigger>
        <C.Content className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
          <div className="grid gap-6 px-3 pb-6 pl-10 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-start">
            <div>
              <p className="max-w-[52ch] text-sec text-ink-2">{plain}</p>
              <p className="mt-3 font-mono text-label uppercase tracking-[0.12em] text-ink-3">{source}</p>
            </div>
            {chart && <div className="rounded-xs bg-sage px-3 py-3">{chart}</div>}
          </div>
        </C.Content>
      </C.Root>
    </RevealRow>
  )
}

/* Everything a reader might want and almost none of them will open. */
export function AllDetail({ label = 'See every reading', children }) {
  const [open, setOpen] = React.useState(false)
  return (
    <C.Root open={open} onOpenChange={setOpen} className="mt-10">
      <C.Trigger className="group flex min-h-[56px] w-full items-center justify-between gap-4
        border-y border-rule font-display text-ui font-medium text-ink
        transition-colors hover:text-accent">
        {label}
        <ChevronRight aria-hidden className="size-4 transition-transform duration-200 ease-out
          group-data-[state=open]:rotate-90"/>
      </C.Trigger>
      <C.Content className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
        <div className="py-8">{children}</div>
      </C.Content>
    </C.Root>
  )
}

const STATS = 'grid gap-x-8 border-t border-rule sm:grid-cols-2 lg:grid-cols-3'
function Stat({ label, value, unit, trend, children }) {
  return (
    <div className="border-b border-rule py-6">
      <div className="lab">{label}</div>
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
  return (
    <span className="inline-flex items-baseline gap-2 rounded-full border border-rule bg-sage/60 px-3 py-1
      font-mono text-label uppercase tracking-[0.12em] text-ink-2">
      <span aria-hidden className="mt-[0.35em] size-1.5 shrink-0 rounded-full bg-warn"/>{children}
    </span>
  )
}

/* ── Student ────────────────────────────────────────────────────────────── */
export function Student({ go }) {
  return (
    <main className="wrap py-9 sm:py-14">
      <Back go={go}/>
      <div className="flex flex-wrap items-baseline gap-3.5">
        <h1 className="font-display text-row font-bold text-ink">Today</h1>
        <Label>Thursday · 4:10 pm</Label>
        <SampleTag/>
      </div>

      <div className="mt-8 flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-12">
        <ScoreDial value={51} band="up" usual={46}/>
        <div>
          <Headline>Today is a little higher than your normal.</Headline>
          <p className="mt-4 max-w-[42ch] text-body text-ink-2">It went up in third period and has stayed
            there.</p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="lab font-normal">Three reasons</h2>
        <div className="mt-2 border-t border-rule">
          <Reason index={0}
            claim="Your heart rate has not come back down between classes."
            plain="Most days it drops back to about 64 in the ten minutes after a lesson. Today it stayed near 70 through three of those breaks."
            source="Heart rate against your own resting level"
            chart={<><MiniSpark data={DATA.spark.hr} className="!mt-0 w-full"/>
              <p className="mt-1 font-mono text-label tabular-nums text-ink-3">64 → 70 bpm</p></>}/>
          <Reason index={1}
            claim="The time between your heartbeats got more even."
            plain="When you are settled, the gaps between beats vary. They even out before you notice feeling tense, which is why this changed before your heart rate did."
            source="Heart rate variability, 1% below your normal"
            chart={<><MiniSpark data={DATA.spark.hrv} className="!mt-0 w-full"/>
              <p className="mt-1 font-mono text-label tabular-nums text-ink-3">60 ms, −1%</p></>}/>
          <Reason index={2}
            claim="You were sitting still, so this is not exercise."
            plain="The movement sensor read 0.01 g. Above 0.35 g the score is held back, because running and a hard day can look the same in heart rate alone."
            source="Movement sensor"
            chart={<><MiniSpark data={DATA.spark.mot} className="!mt-0 w-full"/>
              <p className="mt-1 font-mono text-label tabular-nums text-ink-3">0.01 g · limit 0.35</p></>}/>
        </div>
      </section>

      <div className="mt-10 border-l-2 border-accent py-1 pl-5">
        <p className="max-w-[52ch] text-sec text-ink-2">Chemistry has been your hardest lesson for four weeks.
          A two-minute breathing exercise is set for before it tomorrow.</p>
      </div>

      {/* A teen tester went looking for this first and had to read it off a
          parent's screen, in the third person. It belongs here, in first person. */}
      <button onClick={() => go('privacy')}
        className="mt-8 flex min-h-[56px] w-full items-center justify-between gap-4 rounded-xs
          border border-rule px-5 py-4 text-left transition-colors hover:border-ink hover:bg-sage/60">
        <span className="text-body text-ink">Nobody can read what you write. Not your parent, not your
          counselor.</span>
        <ChevronRight aria-hidden className="size-4 shrink-0 text-accent"/>
      </button>

      <AllDetail>
        <h3 className="lab font-normal">Across today</h3>
        <p className="mt-1.5 mb-2 text-sec text-ink-3">The shaded band is your normal range. Hover the line.</p>
        <DayChart data={DATA.day} band={DATA.band}/>
        <h3 className="lab mt-10 font-normal">Each sensor, the last hour</h3>
        <div className={cn(STATS, 'mt-3')}>
          <Stat label="Heart rate" value="70" unit="bpm" trend={DATA.spark.hr}>Your resting level is 64.</Stat>
          <Stat label="Heart rate variability" value="60" unit="ms" trend={DATA.spark.hrv}>1% below your normal.</Stat>
          <Stat label="Sweat response" value="3.00" unit="µS" trend={DATA.spark.eda}>Four responses in ten minutes.</Stat>
          <Stat label="Skin temperature" value="33.5" unit="°C" trend={DATA.spark.temp}>Steady. No sign of fever.</Stat>
          <Stat label="Movement" value="0.01" unit="g" trend={DATA.spark.mot}>Sitting still.</Stat>
        </div>
        <p className="mt-6 max-w-[64ch] text-meta text-ink-2">The score is worked out every 30 seconds from
          the previous minute of readings, and compared with your own last two weeks.</p>
      </AllDetail>
    </main>
  )
}

/* ── Parent ─────────────────────────────────────────────────────────────── */
export function Parent({ go }) {
  return (
    <main className="wrap py-9 sm:py-14">
      <Back go={go}/>
      <div className="flex flex-wrap items-baseline gap-3.5">
        <h1 className="font-display text-row font-bold text-ink">Maya</h1>
        <Label>This week · shared since March</Label>
        <SampleTag/>
      </div>

      <div className="mt-8 flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-12">
        <ScoreDial value={58} band="up" usual={47}/>
        <div className="min-w-0 flex-1">
          <Headline>Maya had a harder week than usual.</Headline>
          <p className="mt-4 max-w-[42ch] text-body text-ink-2">Three school mornings were above her normal.
            The weekend was normal.</p>
          <WeekStrip days={DATA.week} band={DATA.weekBand} className="mt-6 max-w-[22rem]"/>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="lab font-normal">Three reasons</h2>
        <div className="mt-2 border-t border-rule">
          <Reason index={0}
            claim="Three of five school days were above her normal before lunch."
            plain="Monday, Wednesday and Thursday. Her normal is worked out from her own last two weeks. She is never compared with other students."
            source="Daily average against her own normal range"
            chart={<><WeekStrip days={DATA.week} band={DATA.weekBand}/>
              <p className="mt-2 font-mono text-label tabular-nums text-ink-3">3 of 7 above</p></>}/>
          <Reason index={1}
            claim="The weekend was normal, so this is about school hours."
            plain="Saturday and Sunday were both inside her normal range. A week that was high every day would point to something else."
            source="School days and weekend, compared"
            chart={<><WeekStrip days={DATA.week.slice(5)} band={DATA.weekBand}/>
              <p className="mt-2 font-mono text-label tabular-nums text-ink-3">Sat 43 · Sun 45</p></>}/>
          <Reason index={2}
            claim="She slept less on the same three nights."
            plain="About 5 and a half hours of still time, against her usual 8. This is worked out from movement, not from anything she wrote."
            source="Movement sensor overnight"
            chart={<p className="font-mono text-head font-medium tabular-nums leading-tight text-ink">5.4<span className="ml-1 text-label text-ink-3">h</span>
              <span className="mt-1 block font-mono text-label tabular-nums text-ink-3">usually 7.9</span></p>}/>
        </div>
      </section>

      <div className="mt-10 border-l-2 border-accent py-1 pl-5">
        <p className="max-w-[52ch] text-sec text-ink-2">Thursday morning is worth asking about.</p>
      </div>

      <button onClick={() => go('privacy')}
        className="mt-8 flex min-h-[56px] w-full items-center justify-between gap-4 rounded-xs
          border border-rule px-5 py-4 text-left transition-colors hover:border-ink hover:bg-sage/60">
        <span className="text-body text-ink">You are not told what she wrote or where she was.
          See exactly what you can and cannot see.</span>
        <ChevronRight aria-hidden className="size-4 shrink-0 text-accent"/>
      </button>

      <AllDetail label="See the whole week">
        <h3 className="lab font-normal">The last seven days</h3>
        <p className="mt-1.5 mb-2 text-sec text-ink-3">The shaded band is her normal range.</p>
        <WeekChart data={DATA.week} band={DATA.weekBand}/>
        <div className={cn(STATS, 'mt-8')}>
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
    </main>
  )
}
