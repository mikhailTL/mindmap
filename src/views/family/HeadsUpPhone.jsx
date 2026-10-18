import React from 'react'
import { IPhone } from '../../ui/iphone'
import { parentSummary } from '../../signals/light.js'
import { LampFace } from '../../traffic/Face'
import { AppIcon, MM, StatusBar } from '../../traffic/ios'
import { SignalIcon } from '../../traffic/ParentReport'
import { KEY_OF, known } from '../../traffic/core'
import { cn } from '../../lib/utils'

/* Heads Up today, on a parent's page for one child, drawn on the child's
 * phone.
 *
 * The owner, 18 October: "this is badly designed and needs phone mockup
 * showing the reported stress or calm signals without showing what content
 * child was viewing". So the phone's screen is the child's, with whatever
 * they were looking at blurred under a "Content not read" mask (grey blocks,
 * never an app, a site, a message or a person), and the Heads Up readout
 * sits over it as a sheet: the lamp with its glow, the plain words, and what
 * was reported. Beside the phone, what Heads Up reads.
 *
 * What is reported follows parentSummary in src/signals/light.js, the same
 * rule the teen is told on their own Heads Up card: on red the time and the
 * kind of signal, on yellow the colour and the words only, on green the
 * calm line. No animation, so nothing to hold back under reduced motion. */

/* What Heads Up reads, beside the phone, and on a green day the same four
   as calm rows on the sheet. */
const READS = [
  { k: 'pxPerSec', label: 'Scroll speed', calm: 'Usual scrolling' },
  { k: 'medianGap', label: 'Typing speed', calm: 'Usual typing' },
  { k: 'minutes', label: 'Time without a break', calm: 'Usual breaks' },
  { k: 'motion', label: 'Hand movement', calm: 'Steady hand' },
]

const Lock = ({ size }) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
  </svg>
)
const Check = ({ size }) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>
)

/* What was on the screen, as blocks only, blurred, under a veil. */
function HiddenContent() {
  const block = (style, key) => <span key={key} className="absolute block" style={{ background: '#c9d3ce', ...style }}/>
  return (
    <div aria-hidden className="absolute inset-x-0 bottom-0 top-[47px] overflow-hidden" style={{ background: '#eef2f0' }}>
      <div className="absolute inset-0" style={{ filter: 'blur(7px)' }}>
        {block({ left: 22, top: 18, width: 44, height: 44, borderRadius: 22, background: '#b7c6bf' }, 'a')}
        {block({ left: 78, top: 24, width: 150, height: 13, borderRadius: 7 }, 'b')}
        {block({ left: 78, top: 45, width: 96, height: 11, borderRadius: 6, background: '#d6dedb' }, 'c')}
        {block({ left: 22, top: 78, width: 349, height: 168, borderRadius: 18, background: '#aebfb7' }, 'd')}
        {block({ left: 22, top: 262, width: 300, height: 13, borderRadius: 7 }, 'e')}
        {block({ left: 22, top: 286, width: 250, height: 13, borderRadius: 7 }, 'f')}
        {block({ left: 22, top: 310, width: 200, height: 13, borderRadius: 7, background: '#d6dedb' }, 'g')}
        {block({ left: 22, top: 350, width: 44, height: 44, borderRadius: 22, background: '#b7c6bf' }, 'h')}
        {block({ left: 78, top: 356, width: 170, height: 13, borderRadius: 7 }, 'i')}
        {block({ left: 22, top: 410, width: 349, height: 220, borderRadius: 18, background: '#aebfb7' }, 'j')}
      </div>
      <div className="absolute inset-0" style={{ background: 'rgba(247,250,248,0.42)' }}/>
      <span className="absolute left-1/2 top-[136px] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full px-5 py-3"
        style={{ background: MM.ink, color: '#fff', fontFamily: MM.body, fontSize: 26, fontWeight: 700, lineHeight: '30px',
          boxShadow: '0 6px 18px rgba(13,43,30,0.25)' }}>
        <Lock size={28}/>
        Content not read
      </span>
    </div>
  )
}

/* The Heads Up sheet over the hidden screen, sized to what it holds. Device
   points, so the drawing scales with the phone. */
function Row({ tile, children }) {
  return (
    <li className="flex items-center gap-3.5 py-2.5" style={{ borderTop: `2px solid ${MM.rule}` }}>
      <span aria-hidden className="grid size-[50px] shrink-0 place-items-center rounded-[12px]"
        style={{ background: '#dcefe4', color: MM.accentInk }}>{tile}</span>
      <span className="min-w-0" style={{ fontSize: 30, fontWeight: 700, lineHeight: '36px' }}>{children}</span>
    </li>
  )
}

function Sheet({ first, sum, calm }) {
  const red = sum.light === 'red'
  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col px-6 pb-[40px] pt-3"
      style={{ background: '#fff', borderRadius: '30px 30px 0 0', boxShadow: '0 -10px 30px rgba(13,43,30,0.16)',
        fontFamily: MM.body, color: MM.ink }}>
      <span aria-hidden className="mx-auto block h-[5px] w-[40px] rounded-full" style={{ background: MM.rule }}/>
      <p className="m-0 mt-3 flex items-center gap-2.5"
        style={{ fontFamily: MM.display, fontSize: 26, fontWeight: 700, lineHeight: '32px', color: MM.ink3 }}>
        <AppIcon size={32}/>Heads Up</p>
      <div className="mt-3 flex items-center gap-5">
        <LampFace light={sum.light} size={red ? 76 : 88} className="ml-1"/>
        <p className="m-0 min-w-0 flex-1" style={{ fontFamily: MM.display, fontWeight: 700,
          fontSize: red ? 31 : 36, lineHeight: red ? '37px' : '42px' }}>{sum.headline}</p>
      </div>
      {sum.time && (
        <p className="m-0 mt-3" style={{ fontSize: 28, lineHeight: '34px', color: MM.ink2, fontWeight: 600 }}>{sum.time}</p>
      )}
      <ul className="m-0 mt-4 list-none p-0">
        {sum.signals.length > 0
          ? sum.signals.map(label => <Row key={label} tile={<SignalIcon k={KEY_OF[label]} size={30}/>}>{label}</Row>)
          : sum.light === 'yellow'
            ? <Row tile={<Lock size={28}/>}><span style={{ fontWeight: 500, fontSize: 28, lineHeight: '34px', color: MM.ink2 }}>
                What was noticed stays with {first}. On red, you see it here.</span></Row>
            : calm
              ? READS.map(r => <Row key={r.k} tile={<Check size={30}/>}>{r.calm}</Row>)
              : <Row tile={<Check size={30}/>}><span style={{ fontWeight: 500, fontSize: 28, lineHeight: '34px', color: MM.ink2 }}>
                  Phone activity looked like {first}’s usual.</span></Row>}
      </ul>
    </div>
  )
}

function Phone({ first, sum, calm, scale, className }) {
  return (
    <IPhone interactive scale={scale} screenBg="#eef2f0" showHomeIndicator={false} className={className}
      label={`${first}’s phone, with what is on the screen hidden`}>
      <div className="absolute inset-0 overflow-hidden">
        <StatusBar/>
        <HiddenContent/>
        <Sheet first={first} sum={sum} calm={calm}/>
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
  /* Calm rows only where the day's signals were actually read: a live
     child's light comes from their readings, not from these four. */
  const calm = sum.light === 'green' && !teen.live
  return (
    <div className={cn('flex flex-1 items-stretch gap-3 sm:gap-6', className)}>
      <Phone first={first} sum={sum} calm={calm} scale={0.38} className="sm:hidden"/>
      <Phone first={first} sum={sum} calm={calm} scale={0.44} className="hidden sm:block"/>
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
