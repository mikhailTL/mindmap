import React from 'react'
import { useMode } from '../../lib/mode'
import { useAccount } from '../../account/store'
import { useViewerName } from '../../account/viewer'
import { TODAY_LONG, longDate } from '../student/PartHead'
import NetworkBox from './NetworkBox'
import { StartGrid, StartTile } from '../home/StartGrid'
import { AskArt } from '../home/AskArt'
import { LinkArt } from '../pro/HomeArt'

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
  const name = useViewerName('parent')

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      <header>
        <p className="m-0 text-fine text-ink-2">{real ? longDate() : TODAY_LONG}</p>
        <h2 className="m-0 mt-0.5 font-display !text-head font-bold tracking-tight text-ink">{name ? `Welcome, ${name}` : 'Welcome'}</h2>
      </header>

      <StartGrid label="Parent app">
        <StartTile title="Trends" tone={HUE.sky.ground} chevron={HUE.sky.ink}
          onClick={() => go('parent-trends')} art={<CalendarArt className="h-full w-full"/>}/>
        <StartTile title="Toolkit" tone={HUE.sun.ground} chevron={HUE.sun.ink}
          onClick={() => go('toolkit')} art={<TalkArt className="h-full w-full"/>}/>
        <StartTile title="Ask MindMap AI" tone="bg-beam-wash" chevron="text-beam-ink"
          onClick={() => go('ai')} art={<AskArt who="parent"/>}/>
        <StartTile title="Network" tone={HUE.mint.ground} chevron={HUE.mint.ink}
          onClick={() => go('network')} art={<LinkArt/>}/>
      </StartGrid>

      <NetworkBox go={go} real={real} me={me} className="w-full"/>
    </div>
  )
}

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
