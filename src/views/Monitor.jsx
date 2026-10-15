import React from 'react'
import * as C from '@radix-ui/react-collapsible'
import { Chevron, ChevronDown, Grid, Never, PulseMark, Sometimes, Wave } from '../ui/marks'
import { RealNotice } from '../ui/notice'
import { SignalTrace } from '../charts/infographics'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { cn } from '../lib/utils'
import { LOCATION, NOTES, PRO, SCORE, CONSENT_SHORT } from '../lib/terms'

/* The student app's furniture, and the screen the app shows when no patch is
   paired. The demo Today screen lives in Students.jsx and imports the
   primitives below, so both states of the same screen are built from one set
   of parts.

   14 OCTOBER, design spec 0f. Two things changed in this file.

   1. WORDS. An app screen holds 15 to 45 words above the fold, labels
      included, and no sentence over ten words. Every paragraph that used to
      sit under a card title is gone. Where a line still has to exist (the
      consent rule, what the faces are) it is behind `Why`, a small "?"
      control, the way Dexcom Clarity hides its definitions.

   2. WIDTH. Nothing here caps itself at 34rem or centres itself. The screens
      that use these parts lay them out in columns at 1280 and in one column
      at 390. */

/* ── Primitives ─────────────────────────────────────────────────────────── */

/* A tone is a ground and an edge, never a state. Only the grounds design spec
   0d section 1 allows appear here, plus `ink`, the one dark card spec 0f rule
   7 lets a screen carry. Measured on the near-whites: ink 12.57, ink-2 7.00,
   ink-3 4.86, warn 4.87 and crit 5.63 at worst. On ink: paper 14.47, mist
   12.1, accent-lit 7.67.

   The last six entries are the retired hue names, aliased onto allowed
   grounds because two files index this map by hue. */
export const TONES = {
  card:  'border-rule bg-card',
  brand: 'border-accent/30 bg-accent-wash',
  aqua:  'border-rule bg-aqua',
  deep:  'border-rule bg-aqua-2',
  beam:  'border-beam/30 bg-beam-wash',
  paper: 'border-rule bg-paper',
  ink:   'border-ink bg-ink text-paper',
  /* retired, aliased */
  lilac: 'border-rule bg-aqua',
  sky:   'border-beam/30 bg-beam-wash',
  mint:  'border-accent/30 bg-accent-wash',
  sun:   'border-rule bg-aqua-2',
  coral: 'border-rule bg-paper',
  blush: 'border-rule bg-aqua',
}

export function Panel({ className, tone = 'card', as: As = 'section', children, ...rest }) {
  return (
    <As className={cn('rounded-panel border p-3.5 shadow-card lg:p-4', TONES[tone] || TONES.card, className)}
      {...rest}>
      {children}
    </As>
  )
}

/* The module label. `.mark` is exempt from the app shell's heading step up, so
   a card title stays a ruled label instead of becoming a headline. */
export function PanelHead({ title, meta, as: As = 'h2', className }) {
  return (
    <As className={cn('mark flex items-baseline justify-between gap-3', className)}>
      <span className="min-w-0">{title}</span>
      {meta && <span className="tick shrink-0">{meta}</span>}
    </As>
  )
}

/* One figure, label above and unit beside it. */
export function Stat({ label, value, unit, sub, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="tick">{label}</p>
      <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-display text-row
        font-medium tabular-nums leading-none text-ink">
        {value}
        {unit && <span className="font-body text-fine font-normal text-ink-3">{unit}</span>}
      </p>
      {sub && <p className="mt-1 max-w-[34ch] text-fine text-ink-2">{sub}</p>}
    </div>
  )
}

/* Smaller than Stat, for a value that is a word rather than a figure. */
export function Fact({ label, value, sub, bar, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="tick">{label}</p>
      <p className="mt-0.5 flex items-center gap-2 font-display text-ui font-medium text-ink">
        {bar && <span aria-hidden className={cn('h-4 w-[3px] shrink-0 rounded-bar', bar)}/>}
        <span className="min-w-0">{value}</span>
      </p>
      {sub && <p className="mt-0.5 max-w-[30ch] text-fine text-ink-2">{sub}</p>}
    </div>
  )
}

/* A context line: plain type, the items separated by a thin rule. */
export function MetaLine({ items = [], className }) {
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2.5 gap-y-1 text-fine text-ink-3',
      className)}>
      {items.filter(Boolean).map((t, i) => (
        <React.Fragment key={t}>
          {i > 0 && <span aria-hidden className="h-3 w-px shrink-0 bg-rule"/>}
          <span className="min-w-0">{t}</span>
        </React.Fragment>
      ))}
    </p>
  )
}

/* The greeting the reference dashboards open with. Kept as a part; the
   dashboards no longer spend their word budget on it. */
const HELLO = h => (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon'
  : h < 22 ? 'Good evening' : 'Hello')

export function Greeting({ items = [], className }) {
  const hour = new Date().getHours()
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-3 gap-y-0.5', className)}>
      <p className="font-display text-ui font-semibold leading-none text-ink">{HELLO(hour)}</p>
      <MetaLine items={items}/>
    </div>
  )
}

/* ── The "?" control ─────────────────────────────────────────────────────
 *
 * Design spec 0f rule 2: anything that needs a paragraph goes behind a
 * disclosure or a "?" control. This is the "?". A 28px round button (a
 * genuinely circular mark, so rounded-chip is allowed) with the explanation
 * under it, hidden until pressed. `label` names what it explains for a screen
 * reader. The explanation is still held to short sentences. */
export function Why({ label = 'What this means', children, className, align = 'left' }) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  /* `contents`: the button and the text are laid out by the parent, so in a
     wrapping head row the button sits on the title's line and the text takes
     a full line under it, and in a centred column both centre. */
  return (
    <div className="contents">
      <button type="button" aria-expanded={open} aria-controls={id} aria-label={label}
        onClick={() => setOpen(v => !v)}
        className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-chip border',
          'font-display text-fine font-bold transition-colors duration-150',
          open ? 'border-ink bg-ink text-paper'
               : 'border-ink-3 bg-card text-ink-2 hoverOnly:border-ink hoverOnly:text-ink',
          className)}>
        ?
      </button>
      {open && (
        <div id={id} className={cn('w-full basis-full text-fine text-ink-2',
          align === 'center' ? 'mt-2 text-center' : 'mt-1.5')}>
          <div className={cn('max-w-[52ch]', align === 'center' && 'mx-auto')}>{children}</div>
        </div>
      )}
    </div>
  )
}

/* ── The one disclosure ─────────────────────────────────────────────────── */

/* Design spec 0d section 6 and 0e section 17: the dashboard opens on the
   sentence and the dial, and everything else is behind one control that says
   See details. */
export function SeeDetails({ label = 'See details', sub, children, className, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <C.Root open={open} onOpenChange={setOpen} className={className}>
      <C.Trigger className="group flex min-h-[48px] w-full items-center justify-between gap-4
        rounded-panel border border-rule bg-card px-3.5 text-left transition-colors duration-150
        hoverOnly:bg-aqua">
        <span className="min-w-0">
          <span className="block font-display text-ui font-medium text-ink">{label}</span>
          {sub && <span className="mt-0.5 block text-fine text-ink-3">{sub}</span>}
        </span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-ink-3 transition-transform
          duration-200 ease-out group-data-[state=open]:rotate-180"/>
      </C.Trigger>
      <C.Content className="overflow-hidden data-[state=open]:animate-down
        data-[state=closed]:animate-up">
        <div className="pt-3">{children}</div>
      </C.Content>
    </C.Root>
  )
}

/* ── The one thing the patch cannot measure ─────────────────────────────── */

/* Three faces: the legend for the six questions, not a rating that is stored
   and not an inference from the reading. MindMap measures a body, never a
   feeling. Grounds are ground steps, not hues. */
const FACES = [
  ['easier',      'bg-aqua',   'M8.5 14.6c1.4 1.7 5.6 1.7 7 0'],
  ['about usual', 'bg-aqua-2', 'M8.5 15h7'],
  ['harder',      'bg-paper',  'M8.5 15.8c1.4 -1.7 5.6 -1.7 7 0'],
]

function Face({ d, className }) {
  return (
    <span aria-hidden className={cn('flex size-9 items-center justify-center rounded-chip',
      'border border-rule', className)}>
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="#0b2b33"
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
    <Panel tone="aqua" className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHead title="How Today Felt" meta="six questions" className="min-w-0 flex-1"/>
        <Why label="What the six questions are" className="pt-1.5">
          The patch reads a body, never a feeling. Six questions ask how today felt. Scored on
          this phone, never stored.
        </Why>
      </div>
      <button type="button" onClick={() => go('check')}
        className="group mt-2.5 flex min-h-[44px] w-full flex-col gap-2.5 rounded-panel border
          border-rule bg-card p-3 text-left transition-colors duration-150
          hoverOnly:bg-aqua">
        <span aria-hidden className="flex w-full items-end justify-around gap-2">
          {FACES.map(([word, bg, d]) => (
            <span key={word} className="flex min-w-0 flex-col items-center gap-1">
              <Face d={d} className={bg}/>
              <span className="text-fine text-ink-2">{word}</span>
            </span>
          ))}
        </span>
        <span className="flex w-full items-center gap-3 border-t border-rule pt-2.5">
          <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink
            transition-colors duration-150 groupHoverOnly:text-accent-ink">
            Answer six questions</span>
          <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
        </span>
      </button>
    </Panel>
  )
}

/* ── The action row ─────────────────────────────────────────────────────── */

/* Four routes the bottom bar already carries, repeated as the end of the
   screen. Spec 0f rule 4: an action is an icon and two to four words. No
   sentence under any of them. */
const ACTIONS = [
  ['check',    'Take a Reading',  PulseMark],
  ['toolkit',  'Open the Toolkit', Wave],
  ['calendar', 'See the Calendar', Grid],
  ['shared',   'Who Sees What',   Sometimes],
]

export function ActionRow({ go, className, actions = ACTIONS }) {
  return (
    <ul className={cn('m-0 grid list-none grid-cols-2 gap-2.5 p-0 lg:grid-cols-4 lg:gap-4',
      className)}>
      {actions.map(([route, title, Icon]) => (
        <li key={route} className="min-w-0">
          <button type="button" onClick={() => go(route)}
            className="group flex min-h-[56px] w-full items-center gap-2.5 rounded-panel border
              border-rule bg-card px-2.5 py-2.5 text-left transition-colors duration-150
              hoverOnly:border-accent hoverOnly:bg-accent-wash active:bg-accent-wash sm:gap-3
              sm:px-3">
            <span aria-hidden className="flex size-8 shrink-0 items-center justify-center
              rounded-field bg-accent-wash text-accent-ink sm:size-9">
              <Icon size={18}/>
            </span>
            <span className="min-w-0 flex-1 font-display text-ui font-medium leading-[1.22]
              text-ink">{title}</span>
            <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ── What leaves the phone ──────────────────────────────────────────────── */

/* The consent model, in three rows. Mark, label and indent all carry the
   state. Each line is under ten words. */
const SCOPE = [
  { mark: Sometimes, who: 'A parent, if you agree',
    what: `One ${SCORE} a day. Never a reading.` },
  { mark: Sometimes, who: `A ${PRO}, if you agree`,
    what: `The ${SCORE} and its weekly change.` },
  { mark: Never, who: 'Nobody, ever',
    what: `${NOTES}, ${LOCATION}, and anything the microphone hears.` },
]

export function SharedCard({ go, className }) {
  return (
    <Panel tone="brand" className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHead title="Who Sees What" meta="off by default" className="min-w-0 flex-1"/>
        <Why label="How sharing is decided" className="pt-1.5">
          {CONSENT_SHORT} Any of it can be switched off, at any time.
        </Why>
      </div>
      <ul className="m-0 mt-2.5 list-none p-0">
        {SCOPE.map(row => {
          const Mark = row.mark
          return (
            <li key={row.who} className="grid grid-cols-[1.125rem_1fr] items-start gap-x-2.5
              gap-y-1 border-t border-rule py-2">
              <Mark aria-hidden className="mt-[0.15rem] size-4 text-ink-3"/>
              <div className="min-w-0">
                <p className="font-display text-ui font-medium text-ink">{row.who}</p>
                <p className="mt-0.5 max-w-[44ch] text-fine text-ink-2">{row.what}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <button type="button" onClick={() => go('shared')}
        className="group mt-auto flex min-h-[44px] w-full items-center gap-3 border-t border-rule
          pt-2.5 text-left">
        <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink
          transition-colors duration-150 groupHoverOnly:text-accent-ink">Sharing settings</span>
        <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
      </button>
    </Panel>
  )
}

/* The reading screens' own lead line. */
export function Headline({ children }) {
  return <p className="max-w-[26ch] font-display text-sub font-bold
    leading-[1.15] tracking-tight text-ink">{children}</p>
}

/* The hero sentence, which design spec section 7c makes the largest thing on
   an app screen. Plain words, never a feeling, never over ten words. `under`
   is one short line; anything longer belongs in `why`, which renders as the
   "?" control. */
export function HeroLine({ lead, under, why, whyLabel, figLabel, figure, unit, note, centred, children }) {
  return (
    <div className={cn('min-w-0', centred && 'flex flex-col items-center text-center')}>
      <p className={cn('font-display text-row font-bold leading-[1.14] tracking-tight text-ink',
        'sm:text-head', centred ? 'max-w-[30ch]' : 'max-w-[26ch]')}>{lead}</p>
      {under && <p className={cn('mt-2 text-fine text-ink-2',
        centred ? 'max-w-[42ch]' : 'max-w-[46ch]')}>{under}</p>}
      {why && <Why label={whyLabel} className="mt-2" align={centred ? 'center' : 'left'}>{why}</Why>}
      {figure != null && (
        <div className={cn('mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-t',
          'border-rule pt-2.5', centred ? 'justify-center' : '')}>
          {figLabel && <span className="tick w-full">{figLabel}</span>}
          <span className="font-display text-row font-medium tabular-nums leading-none text-ink">
            {figure}</span>
          {unit && <span className="text-fine text-ink-3">{unit}</span>}
          {children}
        </div>
      )}
      {note && <p className={cn('mt-1 text-fine text-ink-2',
        centred ? 'max-w-[42ch]' : 'max-w-[46ch]')}>{note}</p>}
    </div>
  )
}

/* Kept for the reading screens, which still fold their working away. */
export function AllDetail({ label = 'See every reading', children }) {
  const [open, setOpen] = React.useState(false)
  return (
    <C.Root open={open} onOpenChange={setOpen} className="mt-8">
      <C.Trigger className="group flex min-h-[48px] w-full items-center justify-between gap-4
        border-y border-rule font-display text-ui font-medium text-ink
        transition-colors hoverOnly:text-accent">
        {label}
        <ChevronDown aria-hidden className="size-4 transition-transform duration-200 ease-out
          group-data-[state=open]:rotate-180"/>
      </C.Trigger>
      <C.Content className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
        <div className="py-6">{children}</div>
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
    <div className="border-t border-ink">
      {SENSOR_ORDER.map(id => {
        const s = SENSORS[id]
        return (
          <div key={id} className="flex items-center gap-3 border-b border-rule py-2.5">
            <span className="w-[9ch] shrink-0 font-display text-ui font-medium text-ink">{s.name}</span>
            <span className="tick w-[4ch] shrink-0">{s.unit}</span>
            <span aria-hidden className="flex-1 border-t border-dashed border-ruling"/>
            <span className="shrink-0 whitespace-nowrap text-fine text-ink-3">no signal</span>
          </div>
        )
      })}
    </div>
  )
}

/* The four traces, as drawings, with the caption saying so. */
function SignalShapes() {
  return (
    <figure className="m-0">
      <ul className="m-0 grid list-none gap-2.5 p-0 grid-cols-2 lg:grid-cols-4">
        {SENSOR_ORDER.map(id => {
          const s = SENSORS[id]
          return (
            <li key={id} className="rounded-panel border border-rule bg-card p-2.5">
              <p className="flex items-baseline justify-between gap-2">
                <span className="font-display text-ui font-medium text-ink">{s.name}</span>
                <span className="tick shrink-0">{s.unit}</span>
              </p>
              <SignalTrace kind={id} className="mt-1.5 h-8"/>
              <p className="mt-1 max-w-[34ch] text-fine text-ink-2">{s.short}</p>
            </li>
          )
        })}
      </ul>
      <figcaption className="note mt-2.5">Drawings, not readings.</figcaption>
    </figure>
  )
}

/* Requirements, not wizard steps. */
const PAIRING = [
  ['A charged patch', 'On the upper arm. None exists to send yet.'],
  ['A phone with Bluetooth', 'Four channels, once a second.'],
  ['About two weeks of wear', 'That is what builds your own normal.'],
]

/* Real mode. The same shape as the demo screen: the sentence in one card,
   the channels beside it at 1280, everything else behind one See details.
   No invented figure anywhere, and no dial. */
export function StudentBody({ go, openTab }) {
  const open = route => (openTab ? openTab(route) : go(route))
  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
        <Panel className="flex flex-col justify-center">
          <HeroLine centred
            lead="Nothing measured today."
            whyLabel="Why there is no score"
            why={`A ${SCORE} compares you with your own last two weeks. An empty day is not a calm day. No dial is drawn.`}/>
          <div className="mt-3 border-t border-rule pt-2.5">
            <RealNotice>Nothing paired yet.</RealNotice>
          </div>
        </Panel>
        <Panel>
          <PanelHead title="Four Channels" meta="0 of 4"/>
          <div className="mt-2.5"><SilentChannels/></div>
        </Panel>
      </div>

      <SeeDetails label="See details">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          <Panel>
            <PanelHead title="Your Normal" meta="0 days"/>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
              <Fact label="Scale" value="0 to 100"/>
              <Fact label="Compared with" value="Your own normal"/>
              <Fact label="Builds over" value="About 14 days"/>
              <Fact label="Last reading" value="None yet"/>
            </div>
          </Panel>
          <Panel tone="aqua">
            <PanelHead title="What a Reading Needs"/>
            <ul className="m-0 list-none p-0">
              {PAIRING.map(([what, why]) => (
                <li key={what} className="border-b border-rule py-2.5 last:border-b-0 last:pb-0">
                  <span className="block font-display text-ui font-medium text-ink">{what}</span>
                  <span className="mt-0.5 block max-w-[56ch] text-fine text-ink-2">{why}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel tone="deep" className="lg:col-span-2">
            <PanelHead title="Each Signal's Shape" meta="drawings"/>
            <div className="mt-2.5"><SignalShapes/></div>
          </Panel>
        </div>
      </SeeDetails>

      <ActionRow go={open}/>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <FeltCard go={open} className="h-full"/>
        <SharedCard go={go} className="h-full"/>
      </div>
    </div>
  )
}

/* The parent dashboard is src/views/parent-dash.jsx, not here. */
