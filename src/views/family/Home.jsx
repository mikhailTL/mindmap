import React from 'react'
import { useMode } from '../../lib/mode'
import { useAccount } from '../../account/store'
import { TODAY_LONG, longDate } from '../student/PartHead'
import NetworkBox from './NetworkBox'
import { StartGrid, StartTile } from '../home/StartGrid'

/* The parent's home: a greeting, four tiles (children's trends, Toolkit,
 * Ask MindMap AI, Privacy and sharing), then the network box with Add a teen
 * and Add a PRO. No figures here at all: every Mind Score, Heads Up face and
 * chart is on Trends. */

const HUE = {
  sky:   { ground: 'bg-sky-wash',   ink: 'text-sky-ink',   art: '#2294e6', ring: 'focus-visible:outline-sky-ink' },
  sun:   { ground: 'bg-sun-wash',   ink: 'text-sun-ink',   art: '#b5871b', ring: 'focus-visible:outline-sun-ink' },
  lilac: { ground: 'bg-lilac-wash', ink: 'text-lilac-ink', art: '#a024f2', ring: 'focus-visible:outline-lilac-ink' },
  mint:  { ground: 'bg-mint-wash',  ink: 'text-mint-ink',  art: '#18a370', ring: 'focus-visible:outline-mint-ink' },
}

export default function ParentHomeBoard({ go }) {
  const [mode] = useMode()
  const real = mode === 'real'
  const me = useAccount()
  const name = real ? (me?.name ? me.name.split(' ')[0] : null) : 'Elena'

  /* Cards first, as on the earlier start screen, then the network. */
  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      <header>
        <p className="m-0 text-fine text-ink-2">{real ? longDate() : TODAY_LONG}</p>
        <h2 className="m-0 mt-0.5 font-display !text-head font-bold tracking-tight text-ink">{name ? `Hi, ${name}` : 'Hi there'}</h2>
      </header>

      <StartGrid label="Parent app">
        <StartTile title="Your children’s trends" tone={HUE.sky.ground} chevron={HUE.sky.ink}
          onClick={() => go('parent-trends')} art={<CalendarArt className="h-[66%] w-auto"/>}/>
        <StartTile title="Toolkit" tone={HUE.sun.ground} chevron={HUE.sun.ink}
          onClick={() => go('toolkit')} art={<TalkArt className="h-[58%] w-auto"/>}/>
        <StartTile title="Ask MindMap AI" tone={HUE.lilac.ground} chevron={HUE.lilac.ink}
          onClick={() => go('ai')} art={<AskArt className="h-[58%] w-auto"/>}/>
        <StartTile title="Privacy and sharing" tone={HUE.mint.ground} chevron={HUE.mint.ink}
          onClick={() => go('privacy')} art={<ShieldArt className="h-[66%] w-auto"/>}/>
      </StartGrid>

      <NetworkBox go={go} real={real} me={me} className="w-full"/>
    </div>
  )
}

/* The drawings. Each is in its card's own hue on white, at the same 2.2
 * stroke, and says what the place holds rather than decorating it. */

function CalendarArt({ className }) {
  const c = HUE.sky.art
  return (
    <svg viewBox="0 0 120 96" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="12" width="108" height="78" rx="12" fill="#fff" stroke={c} strokeWidth="2.2"/>
      <path d="M6 32h108" stroke={c} strokeWidth="2.2"/>
      <path d="M30 6v12M90 6v12" stroke={c} strokeWidth="3"/>
      {[0, 1, 2, 3, 4].map(i => <rect key={i} x={18 + i * 18} y="42" width="10" height="10" rx="3" fill={c} opacity={0.18 + i * 0.12}/>)}
      <path d="M18 78c10-2 14-12 24-12s14 8 24 6 14-14 30-14" stroke={c} strokeWidth="2.6"/>
    </svg>
  )
}

function TalkArt({ className }) {
  const c = HUE.sun.art
  return (
    <svg viewBox="0 0 96 72" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 10h46a8 8 0 0 1 8 8v18a8 8 0 0 1-8 8H28l-12 10V44H8a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8z"
        transform="translate(2 0)" fill="#fff" stroke={c} strokeWidth="2.2"/>
      <path d="M44 30h36a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8h-4v10L64 60H44a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8z"
        fill={c} opacity="0.9"/>
      <path d="M16 22h28M16 31h18" stroke={c} strokeWidth="2.2"/>
    </svg>
  )
}

function AskArt({ className }) {
  const c = HUE.lilac.art
  return (
    <svg viewBox="0 0 96 72" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 6h52a10 10 0 0 1 10 10v26a10 10 0 0 1-10 10H40L24 66V52H14A10 10 0 0 1 4 42V16A10 10 0 0 1 14 6z"
        fill="#fff" stroke={c} strokeWidth="2.2"/>
      <path d="M33 22a7 7 0 1 1 9.5 6.5c-1.8.8-2.5 2-2.5 3.8v1.2" stroke={c} strokeWidth="3"/>
      <circle cx="40" cy="41" r="2.2" fill={c}/>
      <circle cx="84" cy="20" r="6" fill={c} opacity="0.85"/>
      <circle cx="88" cy="40" r="3.5" fill={c} opacity="0.45"/>
    </svg>
  )
}

function ShieldArt({ className }) {
  const c = HUE.mint.art
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M48 8l32 11v24c0 20-13.5 35-32 41C29.5 78 16 63 16 43V19z" fill="#fff" stroke={c} strokeWidth="2.2"/>
      <path d="M48 18l22 7.6v17.6c0 14-9.2 24.6-22 29V18z" fill={c} opacity="0.2"/>
      <path d="M35 46l9 9 17-19" stroke={c} strokeWidth="3.4"/>
    </svg>
  )
}
