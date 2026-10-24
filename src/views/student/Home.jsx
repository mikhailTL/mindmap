import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useMode } from '../../lib/mode'
import { cn } from '../../lib/utils'
import { PatchFront } from '../../charts/patch-front'
import { Button } from '../../ui/button'
import { setReadingIntent } from '../reading/intent'
import { TextLink } from './charts'
import { useViewerName } from '../../account/viewer'
import { TODAY_LONG, longDate } from './PartHead'
import { LeadCard, StartGrid, StartTile } from '../home/StartGrid'
import { AskArt } from '../home/AskArt'
import { LinkArt } from '../pro/HomeArt'

const EASE = [0.23, 1, 0.32, 1]

const PULSE = 'M0 26H34l5-2 4 2h12l5-16 7 30 6-24 4 10h21l5-4 4 4H120l5-2 4 2h12l5-16 7 30 6-24 4 10h21l5-4 4 4H200'

// Two copies of the trace side by side; sliding by one copy's width loops with no visible seam.
function PulseMotif({ calm, className }) {
  const line = (
    <svg viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden className="block h-full w-1/2">
      <path d={PULSE} fill="none" stroke="#18a370" strokeWidth="2.6" strokeLinejoin="round"
        strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  )
  return (
    <div aria-hidden className={cn('relative overflow-hidden', className)}>
      <motion.div className="flex h-full w-[200%]"
        animate={calm ? undefined : { x: ['0%', '-50%'] }}
        transition={{ duration: 4.2, ease: 'linear', repeat: Infinity }}>
        {line}{line}
      </motion.div>
    </div>
  )
}

/* A small rainbow with a cloud drifting across its foot. */
const ARCS = [['#f25424', 34], ['#e2a516', 27], ['#18a370', 20], ['#2294e6', 13]]
function RainbowMotif({ calm, className }) {
  return (
    <svg viewBox="0 0 96 52" aria-hidden className={cn('block overflow-visible', className)}>
      {ARCS.map(([c, r], i) => (
        <motion.path key={c} d={`M${48 - r} 46a${r} ${r} 0 0 1 ${r * 2} 0`} fill="none" stroke={c}
          strokeWidth="5.5" strokeLinecap="round"
          style={{ transformOrigin: '48px 46px', transformBox: 'view-box' }}
          initial={calm ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 + i * 0.07 }}/>
      ))}
      <motion.g animate={calm ? undefined : { x: [0, 7, 0] }}
        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}>
        <path d="M58 48h22a6 6 0 0 0-1.6-11.8A8 8 0 0 0 63 37.5a5.3 5.3 0 0 0-5 10.5Z"
          fill="#ffffff" stroke="#9cc9ec" strokeWidth="1.3"/>
      </motion.g>
      <motion.g animate={calm ? undefined : { x: [0, -5, 0] }}
        transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}>
        <path d="M6 48h16a4.5 4.5 0 0 0-1.2-8.8A6 6 0 0 0 9.4 41a4 4 0 0 0-3.4 7Z"
          fill="#ffffff" stroke="#9cc9ec" strokeWidth="1.3"/>
      </motion.g>
    </svg>
  )
}

/* A slow breath: rings that swell and settle. */
function BreatheMotif({ calm, className }) {
  const breath = calm ? undefined : { scale: [0.82, 1.08, 0.82] }
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn('block overflow-visible', className)}>
      <circle cx="32" cy="32" r="29" fill="none" stroke="#b5871b" strokeOpacity="0.3" strokeWidth="1.5"
        strokeDasharray="2 5" strokeLinecap="round"/>
      <motion.circle cx="32" cy="32" r="22" fill="#f0cf7a" fillOpacity="0.55"
        style={{ transformOrigin: '32px 32px', transformBox: 'view-box' }}
        animate={breath} transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}/>
      <motion.circle cx="32" cy="32" r="13" fill="#e2a516"
        style={{ transformOrigin: '32px 32px', transformBox: 'view-box' }}
        animate={breath} transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity, delay: 0.25 }}/>
    </svg>
  )
}

function PatchStatus({ paired, go }) {
  const reduced = useReducedMotion()
  const camera = () => { setReadingIntent('sensors'); go('reading') }
  return (
    <section aria-labelledby="patch-state-h"
      className={cn('flex flex-col gap-3 rounded-[20px] border p-3.5 sm:flex-row sm:items-center sm:gap-5 sm:p-4',
        paired ? 'border-mint/35 bg-card' : 'border-dashed border-ruling bg-card')}>
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <span className={cn('relative grid size-[68px] shrink-0 place-items-center rounded-[18px]',
          paired ? 'bg-mint-wash' : 'bg-mist')}>
          {paired && !reduced && (
            <motion.span aria-hidden className="absolute inset-1.5 rounded-[14px] border-2 border-mint"
              animate={{ scale: [0.9, 1.18], opacity: [0.7, 0] }}
              transition={{ duration: 2.2, ease: 'easeOut', repeat: Infinity }}/>
          )}
          <PatchFront size={40} className={cn('relative', !paired && 'opacity-55')}/>
        </span>
        <div className="min-w-0">
          <h2 id="patch-state-h"
            className="flex items-center gap-2 font-display text-row font-bold leading-tight text-ink">
            {paired && (
              <span aria-hidden className="relative flex size-2.5 shrink-0">
                {!reduced && (
                  <motion.span className="absolute inset-0 rounded-full bg-mint"
                    animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
                    transition={{ duration: 1.6, ease: 'easeOut', repeat: Infinity }}/>
                )}
                <span className="relative size-2.5 rounded-full bg-mint"/>
              </span>
            )}
            {paired ? 'Patch paired' : 'No patch paired'}
          </h2>
          <p className="m-0 mt-0.5 text-fine text-ink-2">
            {paired ? 'The demo patch is connected. Its readings go to Trends.'
              : 'You can still take a reading with your phone camera.'}</p>
        </div>
      </div>
      {!paired && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pl-[82px] sm:shrink-0 sm:pl-0">
          <TextLink onClick={camera}>Use your phone camera</TextLink>
          <Button variant="outline" size="sm" onClick={() => go('pairing')}>Pair a patch</Button>
        </div>
      )}
    </section>
  )
}

const TILES = [
  { id: 'student-trends', title: 'Trends', tone: 'bg-sky-wash', chevron: 'text-sky-ink',
    Motif: RainbowMotif, motif: 'h-full w-full' },
  { id: 'toolkit', title: 'Toolkit', tone: 'bg-sun-wash', chevron: 'text-sun-ink',
    Motif: BreatheMotif, motif: 'h-full w-full' },
  { id: 'ai', title: 'Ask MindMap AI', tone: 'bg-beam-wash', chevron: 'text-beam-ink',
    Motif: () => <AskArt who="student"/>, motif: '' },
  { id: 'network', title: 'Network', tone: 'bg-coral-wash', chevron: 'text-coral-ink',
    Motif: () => <LinkArt/>, motif: '' },
]

export function StudentHome({ go }) {
  const [mode] = useMode()
  const calm = !!useReducedMotion()
  const demo = mode !== 'real'
  const name = useViewerName('student')
  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      <header>
        <p className="m-0 text-fine text-ink-2">{demo ? TODAY_LONG : longDate()}</p>
        <h1 className="m-0 mt-0.5 font-display text-head font-bold tracking-tight text-ink">
          {name ? `Welcome, ${name}` : 'Welcome'}</h1>
      </header>

      <LeadCard title="Take a reading" line="Your stress level as a Mind Score. Mental Mirror, phone camera, Survey or patch."
        cta="Start a reading" onClick={() => go('reading')}
        art={<PulseMotif calm={calm} className="h-8 w-full"/>}/>

      <StartGrid label="Your MindMap">
        {TILES.map(t => (
          <StartTile key={t.id} title={t.title} tone={t.tone} chevron={t.chevron}
            onClick={() => go(t.id)} art={<t.Motif calm={calm} className={t.motif}/>}/>
        ))}
      </StartGrid>

      {/* Live keeps no stored pairing, so only the demo shows a paired patch. */}
      <PatchStatus paired={demo} go={go}/>
    </div>
  )
}
