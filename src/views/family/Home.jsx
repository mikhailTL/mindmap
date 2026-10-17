import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FAMILY } from '../../lib/roster'
import { useMode } from '../../lib/mode'
import { useAccount } from '../../account/store'
import { ArrowRight } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { TODAY_LONG, longDate } from '../student/PartHead'
import { TeenAvatar } from './TeenCard'
import { useLiveTeens } from './useLive'
import NetworkBox from './NetworkBox'

/* Sizes: the app shell sets every h2 to `row` and h3 to `meta`. The greeting
 * steps up to `head` so it leads; card titles and the network title share
 * `row`. */

/* The parent's home: a greeting, then the places to go. No figures here at
 * all: every Mind Score, Heads Up face and chart is on Trends.
 *
 *   Your children's trends  -> parent-trends (first names and pictures only)
 *   Your network            the people box, with Add a teen / Add a PRO
 *   Toolkit                 -> toolkit
 *   Ask MindMap AI          -> ai
 *   Privacy and sharing     -> privacy
 *
 * On a wide screen the network box runs down the right; on a phone it sits
 * second, under Trends. */

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
  const live = useLiveTeens('parent')
  const reduced = useReducedMotion()
  const kids = real ? live.teens : FAMILY
  const name = real ? (me?.name ? me.name.split(' ')[0] : null) : 'Elena'

  const rise = i => (reduced ? {} : {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.32, delay: 0.04 * i, ease: [0.23, 1, 0.32, 1] },
  })

  return (
    <div className="flex w-full flex-col gap-6">
      <header>
        <h2 className="m-0 font-display !text-head font-bold leading-none text-ink">{name ? `Hi, ${name}` : 'Hi there'}</h2>
        <p className="m-0 mt-2 text-ui text-ink-2">{real ? longDate() : TODAY_LONG}. Where would you like to go?</p>
      </header>

      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        <motion.li {...rise(0)} className="flex md:col-span-2 lg:col-start-1 lg:row-start-1">
          <NavCard hue="sky" go={go} to="parent-trends" title="Your children’s trends" wide
            line="Mind Score, Heads Up and the calendar for each child." action="See trends" art={<CalendarArt/>}>
            {kids.length ? (
              <span className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
                {kids.map(t => (
                  <span key={t.id} className="flex items-center gap-2.5">
                    <TeenAvatar teen={t} variant="parent" size="size-11"/>
                    <span className="font-display text-ui font-bold text-ink">{t.first}</span>
                  </span>
                ))}
              </span>
            ) : (
              <span className="mt-4 block text-fine text-ink-2">Your teen shows here once they join your network.</span>
            )}
          </NavCard>
        </motion.li>

        <motion.li {...rise(1)} className="flex md:col-span-2 lg:col-span-1 lg:col-start-3 lg:row-span-3 lg:row-start-1">
          <NetworkBox go={go} real={real} me={me} className="w-full"/>
        </motion.li>

        <motion.li {...rise(2)} className="flex lg:col-start-1 lg:row-start-2">
          <NavCard hue="sun" go={go} to="toolkit" title="Toolkit" action="Open Toolkit" art={<TalkArt/>}
            line="Conversation openers, ground rules and when to get help."/>
        </motion.li>

        <motion.li {...rise(3)} className="flex lg:col-start-2 lg:row-start-2">
          <NavCard hue="lilac" go={go} to="ai" title="Ask MindMap AI" action="Ask a question" art={<AskArt/>}
            line="How to start a talk, or what a reading does and does not show."/>
        </motion.li>

        <motion.li {...rise(4)} className="flex md:col-span-2 lg:col-start-1 lg:row-start-3">
          <NavCard hue="mint" go={go} to="privacy" title="Privacy and sharing" action="See what is shared" wide
            art={<ShieldArt/>} line="What your teen shares with you, and what always stays with them."/>
        </motion.li>
      </ul>
    </div>
  )
}

/* One place to go. The whole card is the button; a wide card puts the
 * drawing beside the words, a narrow one above them. */
function NavCard({ hue, go, to, title, line, action, art, wide = false, children }) {
  const h = HUE[hue]
  return (
    <button type="button" onClick={() => go?.(to)}
      className={cn('group relative flex w-full overflow-hidden rounded-panel p-5 text-left sm:p-6', h.ground,
        'transition-transform duration-200 ease-out hoverOnly:-translate-y-0.5 active:translate-y-0',
        'motion-reduce:transition-none motion-reduce:hoverOnly:translate-y-0',
        'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2', h.ring,
        wide ? 'min-h-[170px] flex-row items-stretch gap-4' : 'min-h-[220px] flex-col')}>
      {!wide && <span aria-hidden className="mb-4 block self-start">{art}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="block font-display text-row font-bold leading-tight text-ink">{title}</span>
        <span className="mt-1.5 block max-w-[40ch] text-ui text-ink-2">{line}</span>
        {children}
        <span className={cn('mt-auto inline-flex items-center gap-2 pt-5 font-display text-ui font-bold', h.ink)}>
          {action}
          <ArrowRight aria-hidden className="size-5 transition-transform duration-200 groupHoverOnly:translate-x-1
            motion-reduce:transition-none"/>
        </span>
      </span>
      {wide && <span aria-hidden className="hidden shrink-0 self-center sm:block">{art}</span>}
    </button>
  )
}

/* The drawings. Each is in its card's own hue on white, at the same 2.2
 * stroke, and says what the place holds rather than decorating it. */

function CalendarArt() {
  const c = HUE.sky.art
  return (
    <svg viewBox="0 0 120 96" width="132" height="106" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="12" width="108" height="78" rx="12" fill="#fff" stroke={c} strokeWidth="2.2"/>
      <path d="M6 32h108" stroke={c} strokeWidth="2.2"/>
      <path d="M30 6v12M90 6v12" stroke={c} strokeWidth="3"/>
      {[0, 1, 2, 3, 4].map(i => <rect key={i} x={18 + i * 18} y="42" width="10" height="10" rx="3" fill={c} opacity={0.18 + i * 0.12}/>)}
      <path d="M18 78c10-2 14-12 24-12s14 8 24 6 14-14 30-14" stroke={c} strokeWidth="2.6"/>
    </svg>
  )
}

function TalkArt() {
  const c = HUE.sun.art
  return (
    <svg viewBox="0 0 96 72" width="96" height="72" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 10h46a8 8 0 0 1 8 8v18a8 8 0 0 1-8 8H28l-12 10V44H8a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8z"
        transform="translate(2 0)" fill="#fff" stroke={c} strokeWidth="2.2"/>
      <path d="M44 30h36a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8h-4v10L64 60H44a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8z"
        fill={c} opacity="0.9"/>
      <path d="M16 22h28M16 31h18" stroke={c} strokeWidth="2.2"/>
    </svg>
  )
}

function AskArt() {
  const c = HUE.lilac.art
  return (
    <svg viewBox="0 0 96 72" width="96" height="72" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 6h52a10 10 0 0 1 10 10v26a10 10 0 0 1-10 10H40L24 66V52H14A10 10 0 0 1 4 42V16A10 10 0 0 1 14 6z"
        fill="#fff" stroke={c} strokeWidth="2.2"/>
      <path d="M33 22a7 7 0 1 1 9.5 6.5c-1.8.8-2.5 2-2.5 3.8v1.2" stroke={c} strokeWidth="3"/>
      <circle cx="40" cy="41" r="2.2" fill={c}/>
      <circle cx="84" cy="20" r="6" fill={c} opacity="0.85"/>
      <circle cx="88" cy="40" r="3.5" fill={c} opacity="0.45"/>
    </svg>
  )
}

function ShieldArt() {
  const c = HUE.mint.art
  return (
    <svg viewBox="0 0 96 96" width="104" height="104" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M48 8l32 11v24c0 20-13.5 35-32 41C29.5 78 16 63 16 43V19z" fill="#fff" stroke={c} strokeWidth="2.2"/>
      <path d="M48 18l22 7.6v17.6c0 14-9.2 24.6-22 29V18z" fill={c} opacity="0.2"/>
      <path d="M35 46l9 9 17-19" stroke={c} strokeWidth="3.4"/>
    </svg>
  )
}
