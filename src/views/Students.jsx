import React from 'react'
import { SectionShell } from './shell'
import { ActionRow, Fact, FeltCard, Greeting, HeroLine, Panel, PanelHead, SharedCard,
  Stat, StudentBody } from './Monitor'
import { CheckInBody } from './CheckIn'
import { SharingControls } from '../app'
import { Chevron } from '../ui/marks'
import { ScrollRow } from '../ui/motion'
import { DayChart } from '../charts/day'
import { Diverge } from '../charts/diverge'
import { Bars, RainbowDial, RainbowKey, SensorTrace } from '../charts/rainbow'
import { DATA } from '../lib/assets'
import { useMode } from '../lib/mode'
import { studentRings } from '../lib/readings'
import { SENSORS } from '../lib/sensors'
import { MOVE_LIMIT_G } from '../signals/motion'
import { bandOf, emptyBaseline, scoreCapture, updateBaseline } from '../signals/score'
import { cn } from '../lib/utils'
import { SCORE } from '../lib/terms'

/* The student app's Today screen, and the shell the three student tabs sit in.
 *
 * The screen used to be one dial and one sentence on the app's tint. It is now
 * eight modules, each in its own card: the day in a line with its header
 * figures, the dial with its key, what is behind the reading, which terms moved
 * it, the four signals, the day itself, what leaves the phone, and the action
 * row. Section 7 of docs/design-spec.md is the bar it is built to.
 *
 * Where the figures come from:
 *   rings      src/lib/readings.js, each signal's own distance from this
 *              person's fourteen-day normal, on a 0 to 100 scale
 *   day, band  src/lib/assets.js, injected at build time
 *   everything under the dial  scoreCapture() below, run for real */

/* The reading is produced by the engine rather than typed in, so the band, the
   baseline length, the movement hold, the signal quality and the two term
   contributions on this screen are whatever scoreCapture actually returns for a
   capture. The capture is synthetic and is tuned to land on 51, the figure the
   launcher and the tour already draw for this student. Its raw heart inputs are
   deliberately never printed: the heart numbers a reader sees are the patch
   fixtures in readings.js, and the engine's own inputs are a separate demo
   series, so the contribution module draws direction and size and never a
   value. */
const DEMO_PPG = { ok: true, hr: 64.6, rmssd: 60, hrvOk: true, quality: 0.86 }
const DEMO_MOTION = { ok: true, peak: 0.01, still: true }
/* Fourteen days of history, one capture a day, so baselineDays comes back 14
   rather than asserted in copy. */
const DEMO_HISTORY = [0, 3.5, -3, 6.5, -5.2, 2, -4, 0.8, 5.5, -6, 2.8, -2.2, 1.5, -2]

function demoReading() {
  let b = emptyBaseline()
  DEMO_HISTORY.forEach((off, i) => {
    b = updateBaseline(b, { hr: 64 + off, hrv: 60.6 + off * 1.3 }, 'day' + i)
  })
  return scoreCapture({ ppg: DEMO_PPG, voice: null, motion: DEMO_MOTION, baseline: b })
}
const READ = demoReading()

const BAND = DATA.band || { lo: 0, hi: 1 }
const USUAL = Math.round((BAND.lo + BAND.hi) / 2)

/* 24-hour, because the day series is keyed that way and the chart's axis
   prints it; everything a reader is shown is converted back. */
function clock12(t) {
  const [h, m] = String(t).split(':').map(Number)
  if (!Number.isFinite(h)) return t
  const half = h < 12 ? 'am' : 'pm'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${half}`
}

/* When the capture was taken. Not a free choice: the day series is the same
   0 to 100 scale as the dial, so the clock has to be the point on it where the
   line is at the score, or the hero number contradicts the chart under it. */
const TAKEN_AT = (() => {
  const day = DATA.day || []
  if (!day.length) return '13:10'
  let best = day[0]
  for (const d of day) if (Math.abs(d.v - READ.score) < Math.abs(best.v - READ.score)) best = d
  return best.t
})()
const TODAY = { score: READ.score, day: 'Thursday', clock: clock12(TAKEN_AT),
                at: `Thursday · ${clock12(TAKEN_AT)}` }

/* The first reading after the morning that sits above the normal band. The day
   chart picks the same point out in warn; this names the time it happened. */
const CROSSED = (() => {
  const day = DATA.day || []
  const i = day.findIndex((d, k) => k > 20 && d.v > BAND.hi)
  return i > 0 ? day[i].t : null
})()

/* The day's own maximum, named rather than left for a reader to find on the
   line. Rounded the way the chart's own tooltip rounds. */
const PEAK = (() => {
  const day = DATA.day || []
  if (!day.length) return { v: 0, t: '00:00' }
  const hi = day.reduce((a, d) => (d.v > a.v ? d : a), day[0])
  return { v: Math.round(hi.v), t: hi.t }
})()

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
               'eight', 'nine', 'ten']
const word = n => WORDS[n] ?? String(n)
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
const pct = n => `${Math.round(n * 100)}%`

/* Tier bar beside the band word. Colour is never the only carrier: the word is
   the state, and the dial marks the reader's own usual day on the scale. */
const TIER_BAR = { low:'bg-calm', usual:'bg-calm', up:'bg-warn', high:'bg-crit' }

const nameOf = r => SENSORS[r.id]?.name || r.name || ''
/* How far a signal sits above the top of its own normal band. Negative means
   it is still inside it. */
const over = r => r.value - (r.band?.hi ?? 100)
const topSignal = rings => [...rings].sort((a, b) => over(b) - over(a))[0]

/* Direction against the wearer's own normal, in words first. Colour only
   repeats what the sentence already says. */
function direction(r) {
  const b = r.band
  if (!b) return { word: 'no normal yet', tone: 'text-ink-2' }
  if (r.value > b.hi) return { word: `${r.value - b.hi} above your normal`, tone: 'text-warn' }
  if (r.value < b.lo) return { word: `${b.lo - r.value} below your normal`, tone: 'text-ink-2' }
  return { word: 'inside your normal', tone: 'text-ink-2' }
}

/* ── The one sentence ───────────────────────────────────────────────────── */

/* Design spec section 7c. The screen used to lead with "Today is 51, five
   above a usual 46, with heart furthest above its own normal", which is three
   numbers and is not a sentence anybody reads about their own day.
 *
 * What replaces it is plain, second person, and carries no figure. It is also
 * about the BODY and never about a feeling: MindMap measures four physical
 * signals and has never measured anxiety, mood or how a day felt, so a line
 * like "you are more anxious than usual" would be a claim this product cannot
 * make. Every branch below is generated from the same rings, normal band and
 * day series the rest of the screen draws, so the sentence stays true when the
 * data changes rather than being typed in beside it.
 *
 * The number does not go away. It sits under the sentence, smaller, with the
 * comparison against a usual day beside it. */

const HOURS = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
               'eight', 'nine', 'ten', 'eleven']

/* "14:00" to "about two in the afternoon". Rounded to the hour on purpose: a
   reader is being told roughly when their day turned, not given a timestamp,
   and the exact clock time is printed under the day chart. */
function hourWords(t) {
  const [h, m] = String(t).split(':').map(Number)
  if (!Number.isFinite(h)) return 'earlier today'
  const near = (m >= 30 ? h + 1 : h) % 24
  const part = near < 12 ? 'in the morning' : near < 17 ? 'in the afternoon' : 'in the evening'
  return `about ${HOURS[near % 12]} ${part}`
}

/* How far above its own normal, in words rather than in standard deviations,
   which is what the quieter second line owes a sixteen year old. */
const amountWords = n => (n >= 10 ? 'well above its own normal'
  : n >= 4 ? 'above its own normal' : 'just above its own normal')

function heroFor({ tier, rings, day, band, crossed }) {
  const top = topSignal(rings)
  const moved = rings.filter(r => over(r) > 0)
  const last = day.length ? day[day.length - 1].v : null
  const stillUp = last != null && band && last > band.hi
  let lead
  if (tier.key === 'high' || tier.key === 'up')
    lead = crossed
      ? `You have been running high since ${hourWords(crossed)}.`
      : 'Your body is working harder than usual today.'
  else if (tier.key === 'low')
    lead = 'Today is calmer than your last two weeks.'
  else if (crossed && stillUp)
    lead = `You have been running above your usual since ${hourWords(crossed)}.`
  else if (crossed)
    lead = `You ran above your usual ${hourWords(crossed)}, and you are back inside it now.`
  else if (moved.length)
    lead = 'Your body is working a little harder than usual today.'
  else
    lead = 'Today looks like an ordinary day for you.'
  const note = top && over(top) > 0
    ? `${nameOf(top)} moved the most today, ${amountWords(over(top))}.`
    : 'All four signals stayed inside their own normal ranges today.'
  return { lead, note }
}

/* The comparison the old sentence carried, kept under the number so no figure
   is lost: how far today sits from a usual day, and what the normal range is. */
function compareWords(score, usual) {
  const d = score - usual
  if (d === 0) return `Level with a usual day of ${usual}.`
  return `${cap(word(Math.abs(d)))} ${d > 0 ? 'above' : 'below'} a usual day of ${usual}.`
}

/* ── The week ───────────────────────────────────────────────────────────── */

/* Seven rounded chips, which is the figure every reference dashboard opens
   with and the one this screen never had. The series is the same generated
   week the parent screen draws; the demo day's entry is replaced by the
   reading this screen is actually showing, so the strip cannot contradict the
   number above it. A chip is a figure and not a control: there is no second
   day of readings to open, so none of them pretends to be tappable. */
const TODAY_SHORT = TODAY.day.slice(0, 3)
const WEEK = (DATA.week || []).map(d => (d.d === TODAY_SHORT ? { ...d, v: TODAY.score } : d))
const WBAND = DATA.weekBand || BAND

/* Inside the band, above it, below it. Position on the track is what says
   which: the band itself is drawn behind every chip and the figure is printed
   over each one, so the colour is the third thing carrying it, never the
   first. */
const dayFill = v => (v > WBAND.hi ? 'bg-sun' : v < WBAND.lo ? 'bg-sky' : 'bg-mint')

/* How the seven days fell against the week's own normal range. Counted from
   the same array the chips are drawn from, so the three figures cannot drift
   from the strip beside them. */
const WEEK_COUNT = {
  above: WEEK.filter(d => d.v > WBAND.hi).length,
  inside: WEEK.filter(d => d.v >= WBAND.lo && d.v <= WBAND.hi).length,
  below: WEEK.filter(d => d.v < WBAND.lo).length,
}

function WeekStrip() {
  const read = WEEK.map(d => `${d.d} ${Math.round(d.v)}`).join(', ')
  return (
    <figure className="m-0">
      <div role="img" className="flex items-end justify-between gap-1.5"
        aria-label={`Seven days out of 100: ${read}. Your normal range for the week runs
          ${WBAND.lo} to ${WBAND.hi}.`}>
        {WEEK.map(d => {
          const today = d.d === TODAY_SHORT
          return (
            <div key={d.d} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="font-mono text-fine tabular-nums text-ink">{Math.round(d.v)}</span>
              <span aria-hidden className={cn('relative h-24 w-full max-w-[2.5rem] overflow-hidden',
                'rounded-chip border bg-card', today ? 'border-ink' : 'border-rule')}>
                <span className="absolute inset-x-0 border-y border-ruling bg-aqua-2"
                  style={{ bottom: `${WBAND.lo}%`, height: `${WBAND.hi - WBAND.lo}%` }}/>
                <span className={cn('absolute inset-x-0 bottom-0 rounded-chip', dayFill(d.v))}
                  style={{ height: `${Math.max(4, Math.min(100, d.v))}%` }}/>
              </span>
              <span className={cn('text-fine', today ? 'font-medium text-ink' : 'text-ink-2')}>
                {d.d}</span>
            </div>
          )
        })}
      </div>
      <figcaption className="note mt-3 max-w-[52ch]">
        Each day against your own normal range for the week, {WBAND.lo} to {WBAND.hi}, drawn as the
        band behind every chip. Nothing here is a streak and there is nothing to keep up.
      </figcaption>
    </figure>
  )
}

/* A range on the 0 to 100 scale. Same grammar as RangeBar on the marketing
   pages: mist track, a darker block for the range, a solid mark for the figure
   and a hairline for the usual day. Used twice, for the score's confidence band
   and for each signal's own normal band, so the two read as one idea. */
function BandBar({ low, high, score, usual, color }) {
  return (
    <div aria-hidden className="relative mt-2.5 h-6">
      <div className="absolute inset-x-0 top-2 h-2.5 rounded-xs bg-mist"/>
      <div className="absolute top-2 h-2.5 rounded-xs bg-ink-3/35"
        style={{ left: `${low}%`, width: `${high - low}%` }}/>
      {usual != null && <div className="absolute top-0 h-[26px] w-[2px] -translate-x-1/2 bg-ink"
        style={{ left: `${usual}%` }}/>}
      <div className={cn('absolute top-0 h-[26px] w-[5px] -translate-x-1/2 rounded-bar',
        !color && 'bg-accent')}
        style={{ left: `${score}%`, background: color || undefined }}/>
    </div>
  )
}

/* One signal: its value out of 100, its own measured figure, its direction
   against this person's normal, and its own trace. Opening it adds the
   readings behind the figure, that signal's own normal band drawn on the same
   0 to 100 scale, its day period by period, and dims the other three bands on
   the dial. */
/* Each signal's own hue, as the ground behind its figure. The wash and not the
   whole card: the trace is drawn in the sensor's own colour and two of the four
   fall under the 3 : 1 a non-text graphic owes once they sit on a tint, so the
   line keeps its white ground and the hue arrives as a block behind the number,
   where every value is ink and measured AA on all six washes. */
const SIGNAL_WASH = { heart:'bg-coral-wash', sweat:'bg-sun-wash',
                      temp:'bg-mint-wash', move:'bg-sky-wash' }

function SignalCard({ ring, open, onToggle }) {
  const s = SENSORS[ring.id] || ring
  const tone = s.glow || s.color
  const d = direction(ring)
  const band = ring.band
  return (
    <Panel className="flex h-full flex-col">
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="flex min-h-[44px] w-full flex-col text-left">
        <span className="flex items-center gap-2.5">
          <span aria-hidden className="h-5 w-[3px] shrink-0 rounded-bar" style={{ background: tone }}/>
          <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink">{s.name}</span>
          <span className={cn('shrink-0 rounded-chip px-2.5 py-1 font-mono text-num font-medium',
            'tabular-nums leading-none text-ink', SIGNAL_WASH[ring.id] || 'bg-mist')}>
            {ring.value}</span>
          <Chevron aria-hidden className={cn('size-4 shrink-0 text-ink-3 transition-transform duration-200',
            open && 'rotate-90')}/>
        </span>
        <SensorTrace className="mt-2 h-12" data={ring.series} color={tone}/>
        <span className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="font-mono text-tick tabular-nums text-ink">{ring.big} {s.unit}</span>
          <span className={cn('text-fine', d.tone)}>{d.word}</span>
        </span>
      </button>
      {open && (
        <div className="mt-3 border-t border-rule pt-3">
          <dl className="m-0 grid grid-cols-1 gap-y-1.5">
            {ring.rows?.map(row => (
              <div key={row.label} className="flex items-baseline justify-between gap-3">
                <dt className="text-fine text-ink-2">{row.label}</dt>
                <dd className="m-0 shrink-0 font-mono text-fine tabular-nums text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
          {band && (
            <div className="mt-4" role="img"
              aria-label={`${s.name} is ${ring.value} out of 100. Your own normal band runs
                ${band.lo} to ${band.hi}.`}>
              <p className="tick">Your normal band, {band.lo} to {band.hi}</p>
              <BandBar low={band.lo} high={band.hi} score={ring.value} color={tone}/>
            </div>
          )}
          <Bars className="mt-4" data={ring.bars} color={tone} unit={ring.barUnit}/>
          <p className="mt-3 max-w-[48ch] text-fine text-ink-2">{ring.note || s.about}</p>
        </div>
      )}
    </Panel>
  )
}

/* The two terms the engine actually used, drawn the way the check-in result
   draws its six answers, so a reader who has taken a reading recognises the
   figure. Direction and size only: the heart inputs behind them are a separate
   demo series from the patch fixtures the rest of the screen prints, and
   showing both sets of numbers on one screen would contradict. */
function MovedCard() {
  const items = READ.contrib.map(c => ({
    label: c.label, x: Math.max(-1, Math.min(1, c.raw)),
  }))
  return (
    <Panel tone="sun" className="h-full">
      <PanelHead title="What moved the number" meta={`${items.length} terms used`}/>
      <p className="mt-3 max-w-[72ch] text-fine text-ink-2">How far each term pushed
        today&rsquo;s number, and which way. Right of the centre line raised it, left of it lowered
        it.</p>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-6">
        <div className="min-w-0">
          <Diverge items={items}/>
        </div>
        <div className="mt-3 border-t border-rule pt-3 lg:mt-3 lg:border-l lg:border-t-0 lg:pl-6
          lg:pt-0">
          <p className="max-w-[40ch] text-fine text-ink-2">Voice adds four more terms, from
            pitch and loudness. A patch has no microphone, so they are missing here, which is part
            of why the likely range is as wide as it is.</p>
          <p className="mt-2.5 max-w-[40ch] text-fine text-ink-2">The two terms here are the ones the
            model was fitted on. The figure beside each is in the model&rsquo;s own units, before the
            0 to 100 scale.</p>
        </div>
      </div>
    </Panel>
  )
}

/* `picked` lives here, not in a card: the dial, its key and the four cards
   share one selection, so opening a signal dims the other three bands.

   Tone per module, per design spec section 0b: a dashboard whose tiles are all
   one tint reads as a spreadsheet, so the hero, the working, the week, the
   self-report, the breakdown and the consent card each own a hue. The dial
   keeps the plain card ground section 7 requires, and so does the day chart,
   because both draw their own colour and a ground under them would compete. */
function TodayDemo({ go, openTab }) {
  const rings = studentRings()
  const [picked, setPicked] = React.useState(null)
  const pick = id => setPicked(p => (p === id ? null : id))
  const tier = bandOf(TODAY.score)
  const top = topSignal(rings)
  const open = route => (openTab ? openTab(route) : go(route))
  const hero = heroFor({ tier, rings, day: DATA.day || [], band: BAND, crossed: CROSSED })

  return (
    <div className="grid grid-cols-12 gap-3 lg:gap-4">
      {/* The sentence, then the number. Never the other way round, and never
          the number inside the sentence: design spec section 7c. The four
          figures beside it are the frame the number is read in. */}
      <ScrollRow index={0} className="col-span-12">
        <Panel tone="lilac">
          <Greeting chips={[TODAY.day, `Read at ${TODAY.clock}`, 'Patch and phone']}/>
          <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-6">
            <HeroLine lead={hero.lead} under={hero.note} figure={TODAY.score}
              unit="out of 100" note={compareWords(TODAY.score, USUAL)}>
              <span className="flex items-center gap-2">
                <span aria-hidden
                  className={cn('h-4 w-[3px] shrink-0 rounded-bar', TIER_BAR[tier.key])}/>
                <span className="font-display text-ui font-medium text-ink">{cap(tier.word)}</span>
              </span>
            </HeroLine>
            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-rule pt-3
              lg:mt-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <Fact label="Normal range" value={`${BAND.lo} to ${BAND.hi}`}
                sub="out of 100, from your own last two weeks"/>
              <Fact label="Taken" value={TODAY.clock} sub={TODAY.day}/>
              <Fact label="Signals reading" value="4 of 4"
                sub="heart, sweat, temperature, movement"/>
              <Fact label="Compared with" value="Your own normal"
                sub="never another student, and never a population average"/>
            </div>
          </div>
        </Panel>
      </ScrollRow>

      <ScrollRow index={1} className="col-span-12 lg:col-span-5">
        <Panel className="flex h-full flex-col">
          <PanelHead title={`Your ${SCORE} today`} meta="out of 100"/>
          <div className="mt-1 flex flex-col items-center">
            <RainbowDial score={TODAY.score} usual={USUAL} rings={rings} size={360}
              picked={picked} onPick={pick}/>
            <p className="mt-3 flex items-center gap-2.5 font-display text-ui font-medium text-ink">
              <span aria-hidden
                className={cn('h-4 w-[3px] shrink-0 rounded-bar', TIER_BAR[tier.key])}/>
              {cap(tier.word)}
            </p>
          </div>
          {/* The arch is aria-hidden and its bands are half a tap target wide,
              so the key under it is what a keyboard and a screen reader get,
              and it doubles as the legend the dial has never had. */}
          <p className="mark mt-4">Each band, out of 100</p>
          <RainbowKey rings={rings} picked={picked} onPick={setPicked} className="mt-1"/>
          <p className="mt-3 max-w-[44ch] text-fine text-ink-2">Each band is one signal&rsquo;s distance
            from your own last two weeks. The middle number blends all four, so the bands do not add
            up to it.</p>
        </Panel>
      </ScrollRow>

      {/* The depth under the one number. Every figure in here is returned by
          scoreCapture for the reading, not written into the copy. */}
      <ScrollRow index={2} className="col-span-12 flex flex-col gap-3 lg:col-span-7 lg:gap-4">
        <Panel tone="sky">
          <PanelHead title="Behind this reading" meta="from the model"/>
          <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-3" role="img"
              aria-label={`Today is ${TODAY.score}. The band runs ${READ.low} to ${READ.high} out of 100.
                A usual day is ${USUAL}.`}>
              <Stat label="Likely range" value={`${READ.low} to ${READ.high}`} unit="out of 100"/>
              <BandBar low={READ.low} high={READ.high} score={TODAY.score} usual={USUAL}/>
              <p className="mt-1.5 text-fine text-ink-2">Today is {TODAY.score}, give or take
                {' '}{READ.half}. Thick mark is today, hairline is a usual day.</p>
            </div>
            <Stat label="Your normal" value={READ.baselineDays} unit="days"
              sub="of your own readings behind the comparison"/>
            <Stat label="Signal quality" value={pct(READ.quality)}
              sub="of the pulse trace was clean enough to use"/>
            <Stat label="Movement" value={DEMO_MOTION.peak.toFixed(2)} unit="g"
              sub={`under the ${MOVE_LIMIT_G} g line, so the rise is counted rather than put down to exercise`}/>
            <Stat label="Scored by" value={READ.model.scored ? 'The model' : 'The formula'}
              sub={`a reading taken while moving is scored by the plain formula instead`}/>
            <Stat label="Moved most" value={nameOf(top)}
              sub={`${over(top)} above the top of its own normal band`}/>
            <Stat label="Voice" value={READ.missing.includes('voice') ? 'Not used' : 'Used'}
              sub="a patch has no microphone, which is part of why the range is wide"/>
          </div>
        </Panel>
        <FeltCard go={open} className="flex-1"/>
      </ScrollRow>

      <ScrollRow index={3} className="col-span-12">
        <Panel tone="mint">
          <PanelHead title="Your last seven days" meta={`usual ${WBAND.lo} to ${WBAND.hi}`}/>
          <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-6">
            <WeekStrip/>
            <dl className="m-0 mt-4 border-t border-rule pt-1 lg:mt-0 lg:border-l lg:border-t-0
              lg:pl-6 lg:pt-0">
              {[['Above your usual range', WEEK_COUNT.above], ['Inside it', WEEK_COUNT.inside],
                ['Below it', WEEK_COUNT.below]].map(([label, n]) => (
                <div key={label} className="flex items-baseline justify-between gap-3
                  border-b border-rule py-2.5 last:border-b-0">
                  <dt className="min-w-0 text-meta text-ink-2">{label}</dt>
                  <dd className="m-0 flex shrink-0 items-baseline gap-1.5 font-mono text-head
                    font-medium tabular-nums leading-none text-ink">
                    {n}<span className="font-body text-fine font-normal text-ink-3">
                      {n === 1 ? 'day' : 'days'}</span></dd>
                </div>
              ))}
            </dl>
          </div>
        </Panel>
      </ScrollRow>

      <div className="col-span-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {rings.map((r, i) => (
          <ScrollRow key={r.id} index={5 + i}>
            <SignalCard ring={r} open={picked === r.id} onToggle={() => pick(r.id)}/>
          </ScrollRow>
        ))}
      </div>

      <ScrollRow index={9} className="col-span-12">
        <MovedCard/>
      </ScrollRow>

      <ScrollRow index={10} className="col-span-12 lg:col-span-7">
        <Panel className="h-full">
          <PanelHead title={`Your ${SCORE} through the day`} meta="07:00 to 16:00"/>
          <p className="mt-2 text-fine text-ink-2">One point every ten minutes, on the same 0 to 100
            scale as the dial. The shaded band is your normal range.</p>
          <DayChart data={DATA.day} band={DATA.band}/>
          <dl className="m-0 mt-3 grid grid-cols-1 gap-y-1.5 border-t border-rule pt-3 sm:grid-cols-2 sm:gap-x-6">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-fine text-ink-2">Today&rsquo;s reading was taken at</dt>
              <dd className="m-0 shrink-0 font-mono text-fine tabular-nums text-ink">{TODAY.clock}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-fine text-ink-2">Your normal range</dt>
              <dd className="m-0 shrink-0 font-mono text-fine tabular-nums text-ink">
                {BAND.lo} to {BAND.hi}</dd>
            </div>
            {CROSSED && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-fine text-ink-2">Above that range from</dt>
                <dd className="m-0 shrink-0 font-mono text-fine tabular-nums text-ink">
                  {clock12(CROSSED)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-fine text-ink-2">Highest point of the day</dt>
              <dd className="m-0 shrink-0 font-mono text-fine tabular-nums text-ink">{PEAK.v} at {clock12(PEAK.t)}</dd>
            </div>
          </dl>
        </Panel>
      </ScrollRow>

      <ScrollRow index={11} className="col-span-12 lg:col-span-5">
        <SharedCard go={go} className="h-full"/>
      </ScrollRow>

      <ScrollRow index={12} className="col-span-12">
        <ActionRow go={open}/>
      </ScrollRow>
    </div>
  )
}

/* ── Take a reading ─────────────────────────────────────────────────────── */

/* Both lists are the engine read back, not copy: every row names something
   scoreCapture returns or something the capture screens drop on the device. */
const GIVES = [
  ['One number, 0 to 100',
   'Measured against your own normal, never another student. Under 35 is easier than usual, 73 and over is high.'],
  ['A likely range around it',
   'It widens when a channel is missing, when the pulse trace is noisy, or when your own normal is still being built.'],
  ['Which terms moved it',
   'Every term the reading used, how far it pushed the number, and which way.'],
  ['Whether you were moving',
   `Over ${MOVE_LIMIT_G} g the reading is kept and scored, but a moving reading is not counted as a stressed one.`],
]

const KEPT_HERE = [
  ['Camera frames', 'Turned into numbers on this phone and dropped. Never stored and never sent.'],
  ['Anything the microphone hears', 'Turned into pitch and steadiness figures here, then dropped.'],
  ['Your six answers', 'Scored on this device. Nothing typed leaves it.'],
]

function Rows({ items }) {
  return (
    <dl className="m-0 list-none p-0">
      {items.map(([what, why]) => (
        <div key={what} className="border-b border-rule py-2.5 last:border-b-0 last:pb-0">
          <dt className="font-display text-ui font-medium text-ink">{what}</dt>
          <dd className="m-0 mt-1 max-w-[56ch] text-fine text-ink-2">{why}</dd>
        </div>
      ))}
    </dl>
  )
}

/* The chooser is three short cards and then the fold, which is the blank space
   this screen was called out for. These two modules say what the three cards
   cannot: what the engine hands back whichever route is taken, and what the
   capture drops. They sit under the two reading screens as well, where they
   are below the fold and out of the way of somebody holding the phone. */
function CheckBody({ go }) {
  return (
    <>
      <CheckInBody go={go}/>
      <div className="mt-10 grid grid-cols-12 gap-3 lg:gap-4">
        <ScrollRow index={0} className="col-span-12 lg:col-span-7">
          <Panel className="h-full">
            <PanelHead title="What a reading gives you" meta="any route"/>
            <div className="mt-2"><Rows items={GIVES}/></div>
          </Panel>
        </ScrollRow>
        <ScrollRow index={1} className="col-span-12 lg:col-span-5">
          <Panel className="h-full">
            <PanelHead title="What never leaves this phone" meta="all routes"/>
            <div className="mt-2"><Rows items={KEPT_HERE}/></div>
          </Panel>
        </ScrollRow>
      </div>
    </>
  )
}

/* Real mode has no honest zero for a score, a dial or a signal, so the
   unpaired screen in Monitor.jsx answers for the whole tab rather than drawing
   the dial at 0, which is a calm day and a real measurement. */
function StudentToday({ go, openTab }) {
  const [mode] = useMode()
  if (mode === 'real') return <StudentBody go={go} openTab={openTab}/>
  return <TodayDemo go={go} openTab={openTab}/>
}

/* One screen per route, no tab strip. The strip here listed Today, Take a
   reading and Who sees what, which is what the bar at the bottom of the app
   already offers. The bar won. */
const PANES = { today: StudentToday, check: CheckBody, shared: SharingControls }

const COPY = {
  today: { sub: 'Your reading for today, what moved it, and what leaves your phone.',
           note: 'Every figure on this screen is generated. Take a reading scores your own answers for real.',
           realNote: 'No patch is paired, so today has no reading yet.' },
  check: { sub: 'About a minute, whichever way you pick. All three land on the same 0 to 100 scale.' },
  shared: { sub: 'What leaves your phone, and what never does.' },
}

export function Students({ go, tab = 'today' }) {
  const Pane = PANES[tab] || StudentToday
  const copy = COPY[tab] || {}
  return (
    <SectionShell go={go} sub={copy.sub} note={copy.note} realNote={copy.realNote}>
      <Pane go={go}/>
    </SectionShell>
  )
}
