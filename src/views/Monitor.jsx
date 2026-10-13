import React from 'react'
import * as C from '@radix-ui/react-collapsible'
import { Chevron, ChevronDown, Grid, Never, PulseMark, Sometimes, Wave } from '../ui/marks'
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
   repeats it.

   THE 13 OCTOBER CORRECTION (design spec 0d section 6, 0e sections 14 and 17).
   Two things changed in this file and they are the reason every size below is
   smaller than it was.

   1. COLOUR. The six hues are retired. `coral`, `lilac`, `sun`, `mint`, `sky`
      and `blush` are gone from every class string here; the grounds are the
      near-whites of the green system and nothing else. The six keys survive
      in TONES only as aliases onto those grounds, because two files this
      worker does not own read `TONES[hue]` by name.

   2. SIZE. This is a phone interface. The hero sentence came down from
      `text-major` (34px at 390) to `text-row` / `text-head`, cards from
      `p-4 lg:p-5` to `p-3.5 lg:p-4`, and the one figure per card from
      `text-head` to `text-row`. `font-mono` is gone: it resolves to the body
      face anyway and `tabular-nums` is what lines figures up. */

/* ── Primitives ─────────────────────────────────────────────────────────── */

/* A tone is a ground and an edge, never a state: every tile that means
   something still says so in words. Only the grounds design spec 0d section 1
   allows appear here. Measured on all six: ink 12.57, ink-2 7.00, ink-3 4.86,
   warn 4.87 and crit 5.63 at worst, so nothing inside a tile has to change
   when its tone does.

   The last six entries are the retired hue names. src/views/Pro.jsx and
   src/views/parent-dash.jsx both index this map by hue, and neither is this
   worker's file, so removing the keys would silently drop their grounds.
   They are aliases onto allowed grounds instead, which is what makes the
   retired colours unreachable from here rather than merely unused. */
export const TONES = {
  card:  'border-rule bg-card',
  brand: 'border-accent/30 bg-accent-wash',
  aqua:  'border-rule bg-aqua',
  deep:  'border-rule bg-aqua-2',
  beam:  'border-beam/30 bg-beam-wash',
  paper: 'border-rule bg-paper',
  /* retired, aliased */
  lilac: 'border-rule bg-aqua',
  sky:   'border-beam/30 bg-beam-wash',
  mint:  'border-accent/30 bg-accent-wash',
  sun:   'border-rule bg-aqua-2',
  coral: 'border-rule bg-paper',
  blush: 'border-rule bg-aqua',
}

/* Section 2 of the design spec: content may not sit on a tint. The app ground
   is bg-beam/15, so every module on a student screen is one of these. One step
   smaller than it was, on both axes. */
export function Panel({ className, tone = 'card', as: As = 'section', children, ...rest }) {
  return (
    <As className={cn('rounded-panel border p-3.5 lg:p-4', TONES[tone] || TONES.card, className)}
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

/* One figure, label above and unit beside it. `text-row` rather than
   `text-head`: on a phone a card figure at 25px competes with the one number
   the screen is about. */
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

/* Smaller than Stat, for a header strip beside a sentence: the value is a word
   rather than a figure, so it keeps the display face and does not compete with
   the one number on the screen. */
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

/* The context line a reference dashboard carries at the top of its first card.
   It used to be a row of rounded-full capsules, which design spec 0d section 2
   bans in every form. It is plain type now, the items separated by a thin
   rule, and it carries no enclosure of any kind. */
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

/* The greeting the reference dashboards all open with, and the one thing they
   do that this product may not copy: they greet by name. Design spec section 7
   forbids an invented person's name and there is no account to hold a real
   one, so the hour does the work instead. The hour is the reader's own clock,
   not the demo day's. One line, at ui size: it is a label on the screen, not a
   headline above the sentence. */
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

/* ── The one disclosure ─────────────────────────────────────────────────────
 *
 * Design spec 0d section 6 and 0e section 17: the dashboard opens on the
 * sentence and the dial, and everything else is behind one control that says
 * See details. This is that control. It is a 48px row with a rule over it, a
 * chevron that turns, and nothing inside it until it is opened.
 *
 * `defaultOpen` exists for nothing on these screens and is kept false: the
 * point of the disclosure is that the fold is the sentence and the dial. */
export function SeeDetails({ label = 'See details', sub, children, className }) {
  const [open, setOpen] = React.useState(false)
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

/* Three faces, which is what every reference dashboard opens with and what
   this product has to be careful about. MindMap measures a body and never a
   feeling, so the faces are not a rating that gets stored and they are not an
   inference drawn from the reading: they are the legend for the six questions,
   and the whole tile is one button that opens them. Shape carries the meaning
   and the word under each face repeats it. The grounds are ground STEPS now,
   not three hues: design spec 0d section 1 says to tell a set apart by label,
   order or ground step. */
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
      <PanelHead title="How Today Felt" meta="six questions"/>
      <p className="mt-2.5 max-w-[46ch] text-meta text-ink">The patch reads a body. It cannot
        read a feeling, and it never guesses at one.</p>
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
            Answer the six questions</span>
          <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
        </span>
      </button>
      <p className="mt-2.5 max-w-[46ch] text-fine text-ink-2">About a minute. Your answers are
        scored on this phone and none of them is kept as a record of your mood.</p>
    </Panel>
  )
}

/* ── The action row ─────────────────────────────────────────────────────── */

/* Section 7 of the spec asks every app screen for an action row. These are
   four routes the bottom bar already carries, repeated here as the end of the
   screen rather than as a fourth navigation: a reader who has just been told
   what today looks like is at the point of doing something about it.
   Subtitles are lifted from the screens they open, not written fresh.

   The hue per tile is gone. Four tiles on one ground in a two-by-two block
   read as a block; four tiles each in their own colour read as a toy. The
   icon is the only mark, and it is the brand green. */
const ACTIONS = [
  ['check',       'Take a Reading', PulseMark,
   'The phone’s camera and microphone, a paired patch, or six questions.'],
  ['toolkit',     'Open the Toolkit', Wave,
   'Short activities to run when the number is up, and when it is not.'],
  ['calendar',    'See the Calendar', Grid,
   'Your week and your month against a target score you set.'],
  ['shared',      'Who Can See What', Sometimes,
   'Change what leaves this phone, field by field, and switch any of it off.'],
]

export function ActionRow({ go, className }) {
  return (
    <Panel className={className}>
      <PanelHead title="Where to Go Next" meta="four screens"/>
      <ul className="m-0 mt-2.5 grid list-none grid-cols-2 gap-2.5 p-0 lg:grid-cols-4 lg:gap-3">
        {ACTIONS.map(([route, title, Icon, why]) => (
          <li key={route} className="min-w-0">
            <button type="button" onClick={() => go(route)}
              className="group flex h-full min-h-[64px] w-full flex-col items-start gap-1.5
                rounded-panel border border-rule bg-aqua p-2.5 text-left transition-colors
                duration-150 hoverOnly:bg-card">
              <span className="flex w-full items-center gap-2">
                <Icon aria-hidden className="size-4 shrink-0 text-accent"/>
                <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink
                  transition-colors duration-150 groupHoverOnly:text-accent-ink">{title}</span>
                <Chevron aria-hidden className="size-3.5 shrink-0 text-accent"/>
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

/* The brand tone rather than a ground step: this is the one tile on the
   screen a reader has to trust, and the teal is the colour the rest of the
   product keeps its promises in. */
export function SharedCard({ go, className }) {
  return (
    <Panel tone="brand" className={cn('flex flex-col', className)}>
      <PanelHead title="What Leaves the Phone" meta="off by default"/>
      <p className="mt-2.5 max-w-[44ch] text-meta text-ink">{CONSENT_SHORT}</p>
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
      <p className="mt-2 max-w-[44ch] text-fine text-ink-2">{CONSENT_OFF}</p>
      <button type="button" onClick={() => go('shared')}
        className="group mt-auto flex min-h-[44px] w-full items-center gap-3 border-t border-rule
          pt-2.5 text-left">
        <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink
          transition-colors duration-150 groupHoverOnly:text-accent-ink">See who can see what</span>
        <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
      </button>
    </Panel>
  )
}

/* The reading screens' own lead line. Stepped down from `text-major` with
   everything else on the app screens: 28px at 390 rather than 34px. */
export function Headline({ children }) {
  return <p className="max-w-[26ch] font-display text-sub font-bold
    leading-[1.15] tracking-tight text-ink">{children}</p>
}

/* The hero sentence, which design spec section 7c makes the largest thing on
   an app screen, and which 0d section 6 brings down a size. `text-row` at 390
   and `text-head` from sm: still the biggest type on the screen, no longer a
   poster headline. Plain words, the number under the dial rather than beside
   it, and one quieter line naming the signal that moved most. The sentence
   itself is generated by the screen from its own rings and bands; this only
   prints it, so the demo screen and the unpaired screen set it the same way.
 *
 * `centred` is how the student and parent dashboards now draw it: one column,
 * the sentence over the dial. The left-aligned form is kept for the screens
 * that still put the sentence beside a column of facts. */
export function HeroLine({ lead, under, figLabel, figure, unit, note, centred, children }) {
  return (
    <div className={cn('min-w-0', centred && 'flex flex-col items-center text-center')}>
      <p className={cn('font-display text-row font-bold leading-[1.14] tracking-tight text-ink',
        'sm:text-head', centred ? 'max-w-[30ch]' : 'max-w-[26ch]')}>{lead}</p>
      {under && <p className={cn('mt-2 text-fine text-ink-2',
        centred ? 'max-w-[42ch]' : 'max-w-[46ch]')}>{under}</p>}
      {/* The figure's own field, labelled. The sentence above is about the day
          and the figure is one capture inside it, so without a label saying
          which, a sentence about the afternoon and a band word about one
          reading read as a contradiction. */}
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

/* Kept for the reading screens, which still fold their working away. One step
   smaller, like everything else on these screens. */
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
    <figure className="m-0">
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
      <figcaption className="note mt-2.5 max-w-[40ch]">
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
      <ul className="m-0 grid list-none gap-2.5 p-0 grid-cols-2">
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
      <figcaption className="note mt-2.5 max-w-[52ch]">
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

/* Real mode. The same shape as the demo screen, per design spec 0e section 17:
   the sentence in one centred card, everything else behind one See details.
   No invented figure anywhere on it, and no dial, because 0 is a calm day and
   drawing it would be a measurement. The sentence is the honest one, and it
   says the thing an empty screen must never let a reader assume. */
export function StudentBody({ go, openTab }) {
  const open = route => (openTab ? openTab(route) : go(route))
  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <Panel className="mx-auto w-full max-w-[34rem]">
        <Greeting items={['No patch paired', 'Nothing measured']}/>
        <div className="mt-3">
          <HeroLine centred
            lead="Nothing has been measured today."
            under={`A ${SCORE} compares you with your own last two weeks, so an empty day is not a calm day and this screen will not draw it as one.`}
            note="Six questions still work with no patch, and they score on this phone."/>
        </div>
        <div className="mt-3 border-t border-rule pt-2.5">
          <RealNotice>Nothing has been measured, so there is no {SCORE}.</RealNotice>
        </div>
      </Panel>

      <SeeDetails label="See details" sub="The four channels, and what a reading needs">
        <div className="flex flex-col gap-3 lg:gap-4">
          <Panel>
            <PanelHead title="The Four Channels" meta="0 of 4 reading"/>
            <div className="mt-2.5"><SilentChannels/></div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-rule pt-2.5">
              <Fact label="Your normal" value="0 days" sub="about fourteen days of your own readings build it"/>
              <Fact label="Scale" value="0 to 100" sub="against your own normal, never anybody else"/>
              <Fact label="Last reading" value="None yet" sub="nothing has been stored on this phone"/>
              <Fact label="Compared with" value="Your own normal" sub="never another student"/>
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

          <Panel tone="deep">
            <PanelHead title="What Each Signal Looks Like" meta="drawings, not readings"/>
            <div className="mt-2.5"><SignalShapes/></div>
          </Panel>
        </div>
      </SeeDetails>

      {/* The only route a visitor can actually finish leads this row: six
          questions score the person reading, with no patch anywhere in it. */}
      <ActionRow go={open}/>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <FeltCard go={open} className="h-full"/>
        <SharedCard go={go} className="h-full"/>
      </div>
    </div>
  )
}

/* The parent dashboard is src/views/parent-dash.jsx, not here. */
