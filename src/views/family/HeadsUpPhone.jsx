import React from 'react'
import { IPhone } from '../../ui/iphone'
import { parentSummary } from '../../signals/light.js'
import { TrafficLight } from '../../traffic/Parent'
import { MM, StatusBar } from '../../traffic/ios'
import { SignalIcon } from '../../traffic/ParentReport'
import { KEY_OF, known } from '../../traffic/core'
import { cn } from '../../lib/utils'

/* Heads Up today, on a parent's page for one child, drawn on the child's
 * phone.
 *
 * The owner, 18 October: a phone mockup "showing the reported stress or calm
 * signals without showing what content child was viewing". Later the same day:
 * "heads up today should show a vertical traffic light with the heads up
 * status face highlighted, within the phone mockup, not the phone mockup
 * notification". So the screen holds the Heads Up traffic light (the same
 * housing and lamps as everywhere else, ../../traffic/Parent.jsx), today's
 * lamp lit with its face and glow, the plain line under it, and on red the
 * signals. Behind it, faint and blurred, whatever was on the screen as grey
 * blocks only (never an app, a site, a message or a person).
 *
 * What is reported follows parentSummary in src/signals/light.js, the same
 * rule the teen is told on their own Heads Up card: on red the time and the
 * kind of signal, on yellow and green the plain line only. No animation, so
 * nothing to hold back under reduced motion. */

/* What Heads Up reads, beside the phone. */
const READS = [
  { k: 'pxPerSec', label: 'Scroll speed' },
  { k: 'medianGap', label: 'Typing speed' },
  { k: 'minutes', label: 'Time without a break' },
  { k: 'motion', label: 'Hand movement' },
]

const Lock = ({ size }) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
  </svg>
)

/* What was on the screen, as blocks only, blurred and faint, so the light
   reads first and the content is plainly not shown. */
function HiddenContent() {
  const block = (style, key) => <span key={key} className="absolute block" style={{ background: '#c9d3ce', ...style }}/>
  return (
    <div aria-hidden className="absolute inset-x-0 bottom-0 top-[47px] overflow-hidden" style={{ background: '#eef2f0' }}>
      <div className="absolute inset-0" style={{ filter: 'blur(9px)' }}>
        {block({ left: 22, top: 18, width: 44, height: 44, borderRadius: 22, background: '#b7c6bf' }, 'a')}
        {block({ left: 78, top: 24, width: 150, height: 13, borderRadius: 7 }, 'b')}
        {block({ left: 22, top: 78, width: 349, height: 168, borderRadius: 18, background: '#aebfb7' }, 'd')}
        {block({ left: 22, top: 262, width: 300, height: 13, borderRadius: 7 }, 'e')}
        {block({ left: 22, top: 286, width: 250, height: 13, borderRadius: 7 }, 'f')}
        {block({ left: 22, top: 350, width: 44, height: 44, borderRadius: 22, background: '#b7c6bf' }, 'h')}
        {block({ left: 22, top: 410, width: 349, height: 220, borderRadius: 18, background: '#aebfb7' }, 'j')}
      </div>
      <div className="absolute inset-0" style={{ background: 'rgba(247,250,248,0.78)' }}/>
    </div>
  )
}

/* The light and what it says, in device points so the drawing scales with
   the phone. Smaller lamps on red, the more so the more signals, so the
   rows always fit the screen. */
function Readout({ sum }) {
  const red = sum.light === 'red'
  const lamp = red ? Math.max(56, 92 - 16 * Math.max(0, sum.signals.length - 2)) : 124
  return (
    <div className={cn('absolute inset-x-0 bottom-0 top-[47px] flex flex-col items-center px-7 pb-[36px]',
      red ? 'pt-9' : 'justify-center')} style={{ fontFamily: MM.body, color: MM.ink }}>
      <TrafficLight light={sum.light} lamp={lamp} reduced className="shrink-0"/>
      <p className="m-0 text-center" style={{ fontFamily: MM.display, fontWeight: 700, marginTop: red ? 28 : 48,
        fontSize: red ? 32 : 40, lineHeight: red ? '38px' : '48px' }}>{sum.headline}</p>
      {sum.time && (
        <p className="m-0 mt-2 text-center" style={{ fontSize: 28, lineHeight: '34px', color: MM.ink2, fontWeight: 600 }}>{sum.time}</p>
      )}
      {sum.signals.length > 0 && (
        <ul className="m-0 mt-4 w-full list-none p-0">
          {sum.signals.map(label => (
            <li key={label} className="flex items-center gap-3.5 py-2.5" style={{ borderTop: `2px solid ${MM.rule}` }}>
              <span aria-hidden className="grid size-[50px] shrink-0 place-items-center rounded-[12px]"
                style={{ background: '#dcefe4', color: MM.accentInk }}><SignalIcon k={KEY_OF[label]} size={30}/></span>
              <span className="min-w-0" style={{ fontSize: 30, fontWeight: 700, lineHeight: '36px' }}>{label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Phone({ first, sum, scale, className }) {
  return (
    <IPhone interactive scale={scale} screenBg="#eef2f0" showHomeIndicator={false} className={className}
      label={`${first}’s phone, showing Heads Up today`}>
      <div className="absolute inset-0 overflow-hidden">
        <StatusBar/>
        <HiddenContent/>
        <Readout sum={sum}/>
        <span aria-hidden className="pointer-events-none absolute bottom-2 left-1/2 h-[5px] w-[140px] -translate-x-1/2 rounded-full bg-black/30"/>
      </div>
    </IPhone>
  )
}

export default function HeadsUpPhone({ teen, day, at, className }) {
  const first = teen.first
  const has = day && day.light && day.score != null
  const foot = <p className="m-0 text-fine text-ink-2">From how {first} uses their phone, never what is on it.</p>
  if (!has) {
    return (
      <div className={cn('flex flex-1 flex-col', className)}>
        <div className="my-auto py-8">
          <p className="m-0 font-display text-row font-bold text-ink">No Heads Up yet today</p>
          <p className="m-0 mt-1 text-fine text-ink-2">It shows here once {first} has used their phone for a while today.</p>
        </div>
        <div className="mt-auto pt-5">{foot}</div>
      </div>
    )
  }
  const sum = parentSummary({ light: known(day.light), at, signals: day.signals || [] })
  return (
    <div className={cn('flex flex-1 items-stretch gap-3 sm:gap-6', className)}>
      <Phone first={first} sum={sum} scale={0.38} className="sm:hidden"/>
      <Phone first={first} sum={sum} scale={0.44} className="hidden sm:block"/>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="m-0 font-display text-ui font-bold text-ink">What is read</p>
        <ul className="m-0 mt-1.5 list-none p-0">
          {READS.map(r => (
            <li key={r.k} className="flex items-center gap-2 border-t border-rule py-2 text-fine leading-snug text-ink-2
              first:border-t-0 sm:gap-2.5">
              <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-[7px] bg-accent-wash text-accent-ink sm:size-7">
                <SignalIcon k={r.k} size={17}/>
              </span>
              <span className="min-w-0">{r.label}</span>
            </li>
          ))}
        </ul>
        <p className="m-0 mt-3 hidden font-display text-ui font-bold text-ink sm:block">Never read</p>
        <p className="m-0 mt-1.5 hidden items-center gap-2.5 text-fine text-ink-2 sm:flex">
          <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-mist text-ink-2"><Lock size={16}/></span>
          Apps, sites, messages, photos or people
        </p>
        <div className="mt-auto pt-4">{foot}</div>
      </div>
    </div>
  )
}
