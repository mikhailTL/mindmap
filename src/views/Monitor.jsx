import React from 'react'
import * as C from '@radix-ui/react-collapsible'
import { Chevron, Never, PulseMark, Sometimes, Wave } from '../ui/marks'
import { RealNotice } from '../ui/notice'
import { SignalTrace } from '../charts/infographics'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { cn } from '../lib/utils'
import { LOCATION, NOTES, PRO, SCORE, CONSENT_SHORT, CONSENT_OFF } from '../lib/terms'

/* The student app's furniture, and the screen the app shows when no patch is
   paired. The demo Today screen lives in Students.jsx and imports the
   primitives below, so both states of the same screen are built from one set
   of parts and switching Demo to Real does not change the layout grammar.
   SectionShell already carries the sample-data disclosure; nothing here
   repeats it. */

/* ── Primitives ─────────────────────────────────────────────────────────── */

/* Section 0b of the design spec: the six measured hues in tailwind.config.js
   are here so the app stops reading as one tint. A tone is a ground and an
   edge and never a state, so every tile that means something still says so in
   words. ink 12.57, ink-2 7.00, ink-3 5.05, warn 4.87 and crit 5.63 are the
   worst cases across all six washes, so nothing inside a tile has to change
   when its tone does. */
export const TONES = {
  card:  'border-rule bg-card',
  brand: 'border-accent/30 bg-accent-wash',
  lilac: 'border-lilac/30 bg-lilac-wash',
  sky:   'border-sky/30 bg-sky-wash',
  mint:  'border-mint/35 bg-mint-wash',
  sun:   'border-sun/35 bg-sun-wash',
  coral: 'border-coral/30 bg-coral-wash',
  blush: 'border-blush/30 bg-blush-wash',
}

/* Section 2 of the design spec: content may not sit on a tint. The app ground
   is bg-beam/15, so every module on a student screen is one of these. */
export function Panel({ className, tone = 'card', as: As = 'section', children, ...rest }) {
  return (
    <As className={cn('rounded-panel border p-4 lg:p-5', TONES[tone] || TONES.card, className)}
      {...rest}>
      {children}
    </As>
  )
}

/* The module label. `.mark` is exempt from the app shell's heading step up, so
   a card title stays a 15px ruled label instead of becoming a 22px headline. */
export function PanelHead({ title, meta, as: As = 'h2', className }) {
  return (
    <As className={cn('mark flex items-baseline justify-between gap-3', className)}>
      <span className="min-w-0">{title}</span>
      {meta && <span className="tick shrink-0">{meta}</span>}
    </As>
  )
}

/* One figure, label above and unit beside it, per section 3 of the spec. */
export function Stat({ label, value, unit, sub, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="tick">{label}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 font-mono text-head font-medium
        tabular-nums leading-none text-ink">
        {value}
        {unit && <span className="font-body text-fine font-normal text-ink-3">{unit}</span>}
      </p>
      {sub && <p className="mt-1.5 max-w-[34ch] text-fine text-ink-2">{sub}</p>}
    </div>
  )
}

/* Smaller than Stat, for a header strip beside a sentence: the value is a word
   rather than a figure, so it keeps the display face and does not compete with
   the one number on the screen. */
export function Fact({ label, value, sub, bar, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="tick">{label}</p>
      <p className="mt-1 flex items-center gap-2 font-display text-ui font-medium text-ink">
        {bar && <span aria-hidden className={cn('h-4 w-[3px] shrink-0 rounded-bar', bar)}/>}
        <span className="min-w-0">{value}</span>
      </p>
      {sub && <p className="mt-0.5 max-w-[30ch] text-fine text-ink-2">{sub}</p>}
    </div>
  )
}

/* A rounded chip. The references all open with a row of them and so does this
   screen; it is a label, not a control, so it carries no tap target and no
   focus ring. Anything tappable is a button elsewhere in this file. */
export function Chip({ children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-chip border border-rule bg-card',
      'px-2.5 py-1 font-display text-fine font-medium text-ink-2', className)}>
      {children}
    </span>
  )
}

/* The greeting the reference dashboards all open with, and the one thing they
   do that this product may not copy: they greet by name. Design spec section 7
   forbids an invented person's name and there is no account to hold a real
   one, so the hour does the work instead. The hour is the reader's own clock,
   not the demo day's. */
const HELLO = h => (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon'
  : h < 22 ? 'Good evening' : 'Hello')

export function Greeting({ chips = [], className }) {
  const hour = new Date().getHours()
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', className)}>
      <p className="font-display text-row font-bold leading-none text-ink">{HELLO(hour)}</p>
      {chips.map(c => <Chip key={c}>{c}</Chip>)}
    </div>
  )
}

/* ── The one thing the patch cannot measure ─────────────────────────────── */

/* Three faces, which is what every reference dashboard opens with and what
   this product has to be careful about. MindMap measures a body and never a
   feeling, so the faces are not a rating that gets stored and they are not an
   inference drawn from the reading: they are the legend for the six questions,
   and the whole tile is one button that opens them. Shape carries the meaning,
   the word under each face repeats it, and colour only repeats the word. */
const FACES = [
  ['easier',      'bg-mint-wash',  'M8.5 14.6c1.4 1.7 5.6 1.7 7 0'],
  ['about usual', 'bg-sun-wash',   'M8.5 15h7'],
  ['harder',      'bg-coral-wash', 'M8.5 15.8c1.4 -1.7 5.6 -1.7 7 0'],
]

function Face({ d, className }) {
  return (
    <span aria-hidden className={cn('flex size-11 items-center justify-center rounded-chip',
      'border border-rule', className)}>
      <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="#0b2b33"
        strokeWidth="1.6" strokeLinecap="round">
        <circle cx="9" cy="10" r="1.05" fill="#0b2b33" stroke="none"/>
        <circle cx="15" cy="10" r="1.05" fill="#0b2b33" stroke="none"/>
        <path d={d}/>
      </svg>
    </span>
  )
}

export function FeltCard({ go, className }) {
  return (
    <Panel tone="blush" className={cn('flex flex-col', className)}>
      <PanelHead title="Only you can say how today felt" meta="six questions"/>
      <p className="mt-3 max-w-[46ch] text-meta text-ink">The patch reads a body. It cannot
        read a feeling, and it never guesses at one.</p>
      <button type="button" onClick={() => go('check')}
        className="group mt-3 flex min-h-[44px] w-full flex-col gap-3 rounded-panel border
          border-rule bg-card p-3.5 text-left transition-colors duration-150
          hoverOnly:bg-mist/50">
        <span aria-hidden className="flex w-full items-end justify-around gap-2">
          {FACES.map(([word, bg, d]) => (
            <span key={word} className="flex min-w-0 flex-col items-center gap-1.5">
              <Face d={d} className={bg}/>
              <span className="text-fine text-ink-2">{word}</span>
            </span>
          ))}
        </span>
        <span className="flex w-full items-center gap-3 border-t border-rule pt-3">
          <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink
            transition-colors duration-150 groupHoverOnly:text-accent-ink">
            Answer the six questions</span>
          <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
        </span>
      </button>
      <p className="mt-3 max-w-[46ch] text-fine text-ink-2">About a minute. Your answers are
        scored on this phone and none of them is kept as a record of your mood.</p>
    </Panel>
  )
}

/* ── The action row ─────────────────────────────────────────────────────── */

/* Section 7 of the spec asks every app screen for an action row. These are the
   three routes the bottom bar already carries, repeated here as the end of the
   screen rather than as a fourth navigation: a reader who has just been told
   what today looks like is at the point of doing something about it.
   Subtitles are lifted from the screens they open, not written fresh. One hue
   each, because three identical tiles read as one tile printed three times. */
const ACTIONS = [
  ['check',       'Take a reading', 'coral', PulseMark,
   'The phone’s camera and microphone, a paired patch, or six questions.'],
  ['kit-student', 'Open the Toolkit', 'sun', Wave,
   'Short activities to run when the number is up, and when it is not.'],
  ['shared',      'Who can see what', 'sky', Sometimes,
   'Change what leaves this phone, field by field, and switch any of it off.'],
]

const ICON_INK = { coral:'text-coral', sun:'text-sun', sky:'text-sky' }

export function ActionRow({ go, className }) {
  return (
    <Panel className={className}>
      <PanelHead title="What you can do next" meta="three screens"/>
      <ul className="m-0 mt-3 grid list-none gap-3 p-0 sm:grid-cols-3 lg:gap-4">
        {ACTIONS.map(([route, title, tone, Icon, why]) => (
          <li key={route} className="min-w-0">
            <button type="button" onClick={() => go(route)}
              className={cn('group flex h-full min-h-[76px] w-full flex-col items-start gap-2',
                'rounded-panel border p-3.5 text-left transition-colors duration-150',
                TONES[tone], 'hoverOnly:bg-card')}>
              <span className="flex w-full items-center gap-2.5">
                <span aria-hidden className="flex size-9 shrink-0 items-center justify-center
                  rounded-chip border border-rule bg-card">
                  <Icon className={cn('size-5', ICON_INK[tone])}/>
                </span>
                <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink
                  transition-colors duration-150 groupHoverOnly:text-accent-ink">{title}</span>
                <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
              </span>
              <span className="max-w-[40ch] text-fine text-ink-2">{why}</span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/* ── What leaves the phone ──────────────────────────────────────────────── */

/* The consent model, in the first person, because this is the student's own
   screen; the parent screen states the same scope in the third person. Three
   rows rather than two sentences: a reader can see at a glance that the two
   audiences have the same ceiling and that the third row is closed to both.
   Mark, label and indent all carry the state, so it survives greyscale. */
const SCOPE = [
  { mark: Sometimes, who: 'A parent, only if you agree',
    what: `Your ${SCORE} for each day, and whether a day ran above your usual.` },
  { mark: Sometimes, who: `A ${PRO}, only if you agree`,
    what: `Your ${SCORE}, how far it moved since last week, and nothing finer unless you turn it on.` },
  { mark: Never, who: 'Nobody, at any setting',
    what: `${NOTES}, ${LOCATION}, and anything the microphone hears.` },
]

/* The brand tone rather than one of the six: this is the one tile on the
   screen a reader has to trust, and the teal is the colour the rest of the
   product keeps its promises in. */
export function SharedCard({ go, className }) {
  return (
    <Panel tone="brand" className={cn('flex flex-col', className)}>
      <PanelHead title="What leaves your phone" meta="off by default"/>
      <p className="mt-3 max-w-[44ch] text-meta text-ink">{CONSENT_SHORT}</p>
      <ul className="m-0 mt-3 list-none p-0">
        {SCOPE.map(row => {
          const Mark = row.mark
          return (
            <li key={row.who} className="grid grid-cols-[1.25rem_1fr] items-start gap-x-3 gap-y-1
              border-t border-rule py-2.5">
              <Mark aria-hidden className="mt-[0.15rem] size-5 text-ink-3"/>
              <div className="min-w-0">
                <p className="font-display text-ui font-medium text-ink">{row.who}</p>
                <p className="mt-0.5 max-w-[44ch] text-fine text-ink-2">{row.what}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 max-w-[44ch] text-fine text-ink-2">{CONSENT_OFF}</p>
      <button type="button" onClick={() => go('shared')}
        className="group mt-auto flex min-h-[44px] w-full items-center gap-3 border-t border-rule pt-3
          text-left">
        <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink
          transition-colors duration-150 groupHoverOnly:text-accent-ink">See who can see what</span>
        <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
      </button>
    </Panel>
  )
}

export function Headline({ children }) {
  return <p className="max-w-[24ch] font-display text-major font-bold
    leading-[1.15] tracking-tight text-ink">{children}</p>
}

/* The hero sentence, which design spec section 7c makes the largest thing on
   an app screen. Plain words at display size, the number under it and smaller,
   and one quieter line naming the signal that moved most. The sentence itself
   is generated by the screen from its own rings and bands; this only prints
   it, so the demo screen and the unpaired screen set it the same way. */
export function HeroLine({ lead, under, figure, unit, note, children }) {
  return (
    <div className="min-w-0">
      <p className="max-w-[26ch] font-display text-sub font-bold text-ink">{lead}</p>
      {under && <p className="mt-2.5 max-w-[46ch] text-meta text-ink-2">{under}</p>}
      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-rule pt-3">
        <span className="font-mono text-head font-medium tabular-nums leading-none text-ink">
          {figure}</span>
        {unit && <span className="text-fine text-ink-3">{unit}</span>}
        {children}
      </div>
      {note && <p className="mt-1.5 max-w-[46ch] text-fine text-ink-2">{note}</p>}
    </div>
  )
}

/* Kept for the reading screens, which still fold their working away. The
   student Today screen no longer hides its trend behind this. */
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

/* ── Student, with nothing paired ───────────────────────────────────────── */

/* Do not substitute a dial at zero: 0 is a valid score on this scale, a calm
   day, so an empty dial reads as a real measurement. The four lanes stand in
   its place instead, drawn empty. */
function SilentChannels() {
  return (
    <figure className="m-0">
      <div className="border-t border-ink">
        {SENSOR_ORDER.map(id => {
          const s = SENSORS[id]
          return (
            <div key={id} className="flex items-center gap-4 border-b border-rule py-3.5">
              <span className="w-[10ch] shrink-0 font-display text-meta font-medium text-ink">{s.name}</span>
              <span className="tick w-[4ch] shrink-0">{s.unit}</span>
              <span aria-hidden className="flex-1 border-t border-dashed border-ruling"/>
              <span className="shrink-0 whitespace-nowrap text-tick text-ink-3">no signal</span>
            </div>
          )
        })}
      </div>
      <figcaption className="note mt-3 max-w-[40ch]">
        Nothing is written on any of them. A paired patch fills each one once a second.
      </figcaption>
    </figure>
  )
}

/* The four traces, as drawings. They sit in a module of their own rather than
   in the lanes above, because a coloured line inside an empty channel reads as
   a reading: here the caption says what they are and the lanes stay flat. */
function SignalShapes() {
  return (
    <figure className="m-0">
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
        {SENSOR_ORDER.map(id => {
          const s = SENSORS[id]
          return (
            <li key={id} className="rounded-panel border border-rule bg-card p-3">
              <p className="flex items-baseline justify-between gap-3">
                <span className="font-display text-ui font-medium text-ink">{s.name}</span>
                <span className="tick shrink-0">{s.unit}</span>
              </p>
              <SignalTrace kind={id} className="mt-2 h-9"/>
              <p className="mt-1.5 max-w-[34ch] text-fine text-ink-2">{s.short}</p>
            </li>
          )
        })}
      </ul>
      <figcaption className="note mt-3 max-w-[52ch]">
        Drawings of the shape each signal makes over about a minute. None of them is a reading,
        and nothing here was measured from anybody.
      </figcaption>
    </figure>
  )
}

/* Requirements, not wizard steps: none of these can be satisfied in-app, so
   they are not numbered and none of them carries an action. */
const PAIRING = [
  ['A charged patch', 'One MindMap patch on the outside of the upper arm. None exists to send you yet. The patch is drawn and printed, not manufactured.'],
  ['A phone with Bluetooth', 'The app pairs over Bluetooth LE and reads the four channels once a second.'],
  ['About two weeks of wear', `The ${SCORE} compares you with your own normal, and the first two weeks are what build that normal.`],
]

/* Real mode. Same grid, the same card grammar and the same hero sentence as
   the demo screen, so the screen is recognisably the same instrument with its
   readings missing. No invented figure anywhere on it: every number below is a
   property of the product, not a measurement. The sentence is the honest one,
   and it says the thing an empty screen must never let a reader assume. */
export function StudentBody({ go, openTab }) {
  const open = route => (openTab ? openTab(route) : go(route))
  return (
    <div className="grid grid-cols-12 gap-3 lg:gap-4">
      <Panel tone="lilac" className="col-span-12">
        <Greeting chips={['No patch paired', 'Nothing measured']}/>
        <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6">
          <HeroLine
            lead="Nothing has been measured today."
            under={`A ${SCORE} compares you with your own last two weeks, so an empty day is not a calm day and this screen will not draw it as one.`}
            figure="No reading"
            note="Six questions still work with no patch, and they score on this phone."/>
          <div className="mt-4 border-t border-rule pt-3 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-6
            lg:pt-0">
            <RealNotice>Nothing has been measured, so there is no {SCORE}.</RealNotice>
            <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3">
              <Fact label="Signals reading" value="0 of 4" sub="heart, sweat, temperature, movement"/>
              <Fact label="Your normal" value="0 days" sub="about fourteen days of your own readings build it"/>
              <Fact label="Scale" value="0 to 100" sub="against your own normal, never anybody else"/>
              <Fact label="Last reading" value="None yet" sub="nothing has been stored on this phone"/>
            </div>
          </div>
        </div>
      </Panel>

      <Panel tone="sky" className="col-span-12 lg:col-span-5">
        <PanelHead title="The four channels" meta="0 of 4 reading"/>
        <div className="mt-3"><SilentChannels/></div>
      </Panel>

      <Panel tone="mint" className="col-span-12 lg:col-span-7">
        <PanelHead title="What you need to take a reading"/>
        <ul className="m-0 list-none p-0">
          {PAIRING.map(([what, why]) => (
            <li key={what} className="border-b border-rule py-3 last:border-b-0 last:pb-0">
              <span className="block font-display text-ui font-medium text-ink">{what}</span>
              <span className="mt-1 block max-w-[56ch] text-fine text-ink-2">{why}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel tone="sun" className="col-span-12 lg:col-span-7">
        <PanelHead title="What each signal looks like" meta="drawings, not readings"/>
        <div className="mt-3"><SignalShapes/></div>
      </Panel>

      <FeltCard go={open} className="col-span-12 h-full lg:col-span-5"/>

      <SharedCard go={go} className="col-span-12 h-full lg:col-span-7"/>

      {/* The only route a visitor can actually finish leads this row: six
          questions score the person reading, with no patch anywhere in it. */}
      <ActionRow go={open} className="col-span-12"/>
    </div>
  )
}

/* The parent dashboard is src/views/parent-dash.jsx, not here. */
