import React from 'react'
import * as C from '@radix-ui/react-collapsible'
import { Chevron, ChevronDown, Grid, Never, PulseMark, Sometimes, Wave } from '../ui/marks'
import { SignalTrace } from '../charts/infographics'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { cn } from '../lib/utils'
import { cardClass } from '../ui/card'
import { LOCATION, NOTES, PRO, SCORE, CONSENT_SHORT } from '../lib/terms'

// Shared student-app primitives, and the student screen shown with no patch paired.
// A tone is a ground and an edge. The last six keys alias hue names that other files index by.
export const TONES = {
  card:  'border-rule/60 bg-card',
  brand: 'border-accent/20 bg-accent-wash',
  aqua:  'border-rule/60 bg-aqua',
  deep:  'border-rule/60 bg-aqua-2',
  beam:  'border-beam/20 bg-beam-wash',
  paper: 'border-rule/60 bg-paper',
  lilac: 'border-rule bg-aqua',
  sky:   'border-beam/30 bg-beam-wash',
  mint:  'border-accent/30 bg-accent-wash',
  sun:   'border-rule bg-aqua-2',
  coral: 'border-rule bg-paper',
  blush: 'border-rule bg-aqua',
}

// `variant` (src/ui/card.jsx) replaces the tone when given: tint, ink, rule or outline.
export function Panel({ className, tone = 'card', variant, hue = 'accent', as: As = 'section', children, ...rest }) {
  const surface = variant
    ? cn(cardClass(variant, hue), 'p-3.5 lg:p-4', variant === 'rule' && 'px-0 pb-0 pt-3 lg:px-0 lg:pb-0')
    : cn('rounded-panel border p-3.5 shadow-card lg:p-4', TONES[tone] || TONES.card)
  return (
    <As className={cn(surface, className)}
      {...rest}>
      {children}
    </As>
  )
}

export const HEAD = 'block font-display text-ui font-bold text-ink'
export function PanelHead({ title, meta, as: As = 'h2', className }) {
  return (
    <As className={cn(HEAD, 'flex items-baseline justify-between gap-3', className)}>
      <span className="min-w-0">{title}</span>
      {meta && <span className="tick shrink-0">{meta}</span>}
    </As>
  )
}

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

export function Why({ label = 'What this means', children, className, align = 'left' }) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  /* `contents`: the parent lays out the button and the text. */
  return (
    <div className="contents">
      <button type="button" aria-expanded={open} aria-controls={id} aria-label={label}
        onClick={() => setOpen(v => !v)}
        className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-chip border',
          'font-display text-fine font-bold transition-colors duration-150',
          open ? 'border-accent bg-accent-wash text-accent-ink'
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

const FACES = [
  ['easier',      'bg-aqua',   'M8.5 14.6c1.4 1.7 5.6 1.7 7 0'],
  ['about usual', 'bg-aqua-2', 'M8.5 15h7'],
  ['harder',      'bg-paper',  'M8.5 15.8c1.4 -1.7 5.6 -1.7 7 0'],
]

function Face({ d, className }) {
  return (
    <span aria-hidden className={cn('flex size-9 items-center justify-center rounded-chip',
      'border border-rule', className)}>
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="#0d2b1e"
        strokeWidth="1.6" strokeLinecap="round">
        <circle cx="9" cy="10" r="1.05" fill="#0d2b1e" stroke="none"/>
        <circle cx="15" cy="10" r="1.05" fill="#0d2b1e" stroke="none"/>
        <path d={d}/>
      </svg>
    </span>
  )
}

export function FeltCard({ go, className }) {
  return (
    <Panel tone="aqua" className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHead title="How Today Felt" meta="survey" className="min-w-0 flex-1"/>
        <Why label="What the survey is" className="pt-1.5">
          The patch cannot read a feeling, so a short survey asks. Answers become one
          score, which syncs to your account. The answers are not kept.
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
            Take the survey</span>
          <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
        </span>
      </button>
    </Panel>
  )
}

/* Four routes the bottom bar already carries. */
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

/* The consent model, in three rows. */
const SCOPE = [
  { mark: Sometimes, who: 'A parent, if you agree',
    what: `One ${SCORE} a day, never a raw reading.` },
  { mark: Sometimes, who: `A ${PRO}, if you agree`,
    what: `The ${SCORE} and its weekly change.` },
  { mark: Never, who: 'Nobody, ever',
    what: `${NOTES}, ${LOCATION}, and anything the microphone hears.` },
]

export function SharedCard({ go, className }) {
  return (
    <Panel tone="brand" className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHead title="Who Sees What" meta="on by default" className="min-w-0 flex-1"/>
        <Why label="How sharing works" className="pt-1.5">
          {CONSENT_SHORT} The student can switch any of it off.
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

export function Headline({ children }) {
  return <p className="max-w-[26ch] font-display text-sub font-bold
    leading-[1.15] tracking-tight text-ink">{children}</p>
}

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

/* The reading screens' disclosure. */
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

// No dial at zero, since 0 is a valid score; four empty lanes stand in.
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
      <figcaption className="note mt-2.5">These are drawings, not readings.</figcaption>
    </figure>
  )
}

/* Requirements, not wizard steps. */
const PAIRING = [
  ['A charged patch', 'Sits on the upper arm.'],
  ['A phone with Bluetooth', 'The patch sends four signals once a second.'],
  ['About two weeks of wear', 'Two weeks of readings build your own normal.'],
]

export function StudentBody({ go, openTab }) {
  const open = route => (openTab ? openTab(route) : go(route))
  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
        <Panel className="flex flex-col justify-center">
          <HeroLine centred
            lead="No reading has been taken today."
            whyLabel="Why there is no score"
            why={`A ${SCORE} compares you with your last two weeks. An empty day is not a calm day.`}/>
        </Panel>
        <Panel>
          <PanelHead title="Your Four Signals" meta="0 of 4"/>
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
            <PanelHead title="How Each Signal Looks" meta="drawings"/>
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
