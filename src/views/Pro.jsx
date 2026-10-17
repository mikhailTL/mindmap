import React from 'react'
import { Why } from './Monitor'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { DemoNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from '../ui/marks'
import { useAccount } from '../account/store'
import { cn } from '../lib/utils'
import { Caseload, useLayout } from './pro/Caseload'
import { GroupTrends } from './pro/GroupTrends'
import { ProTeenDetail } from './pro/TeenDetail'
import { alertTeen, statusCounts } from './pro/metrics'
import { CASELOAD } from '../lib/roster'
import { K_ANONYMITY } from '../lib/caseload'
import { LightTiles, TrafficLight } from './pro/look'
import { ChatArt, FaceRow, LinkArt, RainbowArt, ToolArt } from './pro/HomeArt'
import TeenDetail from './family/TeenDetail'
import { useLiveTeens } from './family/useLive'

/* THE MEDICAL PROFESSIONAL APP: its home and its Trends screen.
 *
 * ProHome ('app-pro') is a way in: a greeting and four big cards, Trends,
 * Connect, Ask and Toolkit. No teen's figures are on it.
 *
 * Pro ('app-pro-trends') is where the data lives. Heads Up today across the
 * group sits above two tabs. EACH TEEN (the default) is a card per teen, with
 * a toolbar to search, sort, filter, pick a range, switch to a compact list
 * and choose which figures the cards carry. Every card is split into Today
 * and Trends, and takes the colour of that teen's Heads Up light. Clicking a
 * card opens that teen's record. WHOLE GROUP is the school, the class periods
 * and the network as a whole, plus the rules every figure obeys and the log.
 * Nothing on it names one teen's figures.
 *
 * Demo shows the 24-teen sample caseload from src/lib/roster.js. Live shows
 * the teens linked to this account whose link a parent approved, from the
 * account snapshot (day figures only, and only what each teen shares),
 * refreshed every 20 seconds by useLiveSync. `empty` shows nobody, and the
 * empty state points to Connect. No line here mentions a patch being missing:
 * the owner, "dont say 'No Patch' under the medical professional dashboard".
 *
 * The four safeguards, in RULES, sit behind the "?" beside the heading and
 * hold on both tabs. Any count across teens needs five or more. */

/* Where the professional works, from their account (src/account/store.js
   `setting`). The words on the heading change; the k-floor and the consent
   rules do not. Signed out, the demo is a school. */
export const SETTING_WORDS = {
  school: {
    step: 'The whole school',
    head: 'Manage stress across the school',
    lead: 'The whole school',
    across: 'across the school',
  },
  practice: {
    step: 'The whole practice',
    head: 'Manage stress across the practice',
    lead: 'The whole practice',
    across: 'across the practice',
  },
  other: {
    step: 'Everyone you follow',
    head: 'Manage stress for everyone you follow',
    lead: 'Everyone you follow',
    across: 'across everyone you follow',
  },
}
const wordsFor = me => SETTING_WORDS[(me && me.role === 'pro' && me.setting) || 'school']
/* The line under "Start here" for a Medical Professional names the setting
   they chose at sign-up: the dashboard's own `head` words, one source. A
   student or a parent gets null. */
export const settingLineFor = me =>
  me && me.role === 'pro' && SETTING_WORDS[me.setting] ? SETTING_WORDS[me.setting].head + '.' : null

/* The four safeguards. Nothing on this dashboard can switch any of them off.
   Do not shorten these four lines away. */
const RULES = [
  'You see only what a teen agreed to share.',
  'A group under five shows nothing.',
  'Every record you open is logged.',
  'Nothing here is a diagnosis.',
]

const clock = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

/* The live-mode margin note. Not RealNotice: its tag reads "No patch". */
const LiveNote = ({ children, className }) => (
  <span className={cn('inline-flex items-baseline gap-x-2.5 border-l-2 border-accent py-0.5 pl-3', className)}>
    <span className="shrink-0 font-display text-fine font-bold text-accent-ink">Live</span>
    <span className="text-fine text-ink-2">{children}</span>
  </span>
)

/* Today's Heads Up across everyone who shares with you, as three tiles. A
   group under five draws nothing; a live teen with no reading today is not
   counted. */
function todayCounts(real, liveTeens) {
  if (!real) return { counts: statusCounts(CASELOAD, 'day'), n: CASELOAD.length }
  const lit = liveTeens.map(t => t.days[t.days.length - 1]?.light).filter(Boolean)
  const counts = { green: 0, yellow: 0, red: 0 }
  for (const l of lit) counts[l]++
  return { counts, n: lit.length }
}

export function Pro({ go, empty = false, view = 'caseload' }) {
  const [mode] = useMode()
  const real = empty || mode === 'real'
  const words = wordsFor(useAccount())
  const live = useLiveTeens('pro')
  const liveTeens = real && !empty ? live.teens : []
  const [tab, setTab] = React.useState(view === 'trends' ? 'trends' : 'caseload')
  const [layout, setLayout] = useLayout()
  const [open, setOpen] = React.useState(null)          // { teen, at }
  const [log, setLog] = React.useState([])              // this session's lines
  const [notes, setNotes] = React.useState({})
  const [said, setSaid] = React.useState('')
  const alert = real ? null : alertTeen()
  const today = todayCounts(real, liveTeens)

  const announce = msg => { setSaid(''); requestAnimationFrame(() => setSaid(msg)) }
  const write = (action, teen) => setLog(l => [{ at: 'Today, ' + clock(), action, actor: 'You', subject: teen.pseudonym }, ...l])
  const openTeen = teen => {
    const at = clock()
    setOpen({ teen, at }); setTab('caseload')
    write('Opened record', teen)
    announce(`Opened the record for ${teen.pseudonym}`)
    requestAnimationFrame(() => window.scrollTo({ top: 0 }))
  }
  const closeTeen = () => { setOpen(null); announce('Back to the caseload') }
  const saveNote = text => {
    const teen = open.teen
    setNotes(n => ({ ...n, [teen.id]: [...(n[teen.id] || []), { text, at: 'Today, ' + clock() }] }))
    write('Saved a note', teen)
  }
  const onTab = v => { setTab(v); announce(v === 'trends' ? 'Showing group trends' : 'Showing each teen') }

  return (
    <main>
      <Tabs value={tab} onValueChange={onTab}>
        <div className="wrap !pt-4">
          <p aria-live="polite" className="sr-only">{said}</p>
          <div className="flex min-w-0 flex-wrap items-start gap-x-2.5 gap-y-1">
            <h2 className="max-w-[24ch] font-display text-row font-bold tracking-tight text-ink sm:text-head">{words.head}</h2>
            <Why label="The four rules on this screen" className="mt-0.5">
              <ul className="m-0 list-none p-0">{RULES.map(r => <li key={r} className="py-0.5">{r}</li>)}</ul>
            </Why>
          </div>
          <div className="mt-2">
            {real
              ? <LiveNote>{liveTeens.length
                  ? `${liveTeens.length === 1 ? 'One teen shares' : `${liveTeens.length} teens share`} with you. Updated as readings arrive.`
                  : 'Nobody shares with you yet.'}</LiveNote>
              : <DemoNotice inline>A sample caseload of 24 teens.</DemoNotice>}
          </div>
          {today.n >= K_ANONYMITY && !open && (
            <section aria-labelledby="pro-today-h" className="mt-4">
              <h3 id="pro-today-h" className="m-0 flex items-baseline gap-2 font-display text-ui font-bold text-ink">
                Heads Up today<span className="font-body text-fine font-normal text-ink-2">{today.n} teens</span></h3>
              <LightTiles counts={today.counts} className="mt-2 lg:max-w-[820px]"/>
            </section>
          )}
        </div>

        <div className="mt-3 border-b-2 border-ink bg-card sm:sticky sm:top-12 sm:z-30">
          <div className="wrap !py-0">
            <TabsList aria-label="Dashboard" className="gap-x-6 border-b-0">
              <TabsTrigger value="caseload" className="min-h-[48px] text-ui">
                <span className="inline-flex items-center gap-2"><TrafficLight size={11} horizontal cycle={false}
                  className="!rounded-[8px]"/>Each teen</span></TabsTrigger>
              <TabsTrigger value="trends" className="min-h-[48px] text-ui">
                <span className="inline-flex items-center gap-2"><RainbowMark/>Whole group</span></TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="wrap !pt-3 pb-12">
          <TabsContent value="caseload" className="mt-0">
            {open && open.teen.live ? (
              <TeenDetail key={open.teen.id} teen={liveTeens.find(t => t.id === open.teen.id) || open.teen}
                variant="pro" range={layout.range} onBack={closeTeen}/>
            ) : open && !real ? (
              <ProTeenDetail key={open.teen.id} teen={open.teen} initialRange={layout.range} openedAt={open.at}
                isAlert={alert && alert.id === open.teen.id} onBack={closeTeen}
                notes={notes[open.teen.id] || []} onNote={saveNote}/>
            ) : (
              <Caseload go={go} real={real} layout={layout} setLayout={setLayout} onOpen={openTeen} alert={alert}
                liveTeens={liveTeens}/>
            )}
          </TabsContent>
          <TabsContent value="trends" className="mt-0">
            <GroupTrends words={words} real={real} sessionLog={log} go={go}/>
          </TabsContent>
        </div>
      </Tabs>
    </main>
  )
}

/* A small rainbow for the Whole group tab. */
const RainbowMark = () => (
  <svg aria-hidden viewBox="0 0 28 16" width="24" height="14" fill="none" strokeWidth="3" strokeLinecap="round">
    <path d="M3 14.5a11 11 0 0 1 22 0" stroke="#e11919"/>
    <path d="M7 14.5a7 7 0 0 1 14 0" stroke="#e86a05"/>
    <path d="M11 14.5a3 3 0 0 1 6 0" stroke="#1560e0"/>
  </svg>
)

/* ── THE MEDICAL PROFESSIONAL HOME ───────────────────────────────────────
 *
 * A way in, not a dashboard: a greeting, then four big cards, one per part
 * of the app. No teen's figures are on it. The rainbow and the lamps are
 * pictures (see pro/HomeArt.jsx), never a reading. The one number is how many
 * teens share with you. */

const DEMO_NAME = 'Dr. Shah'

const CARD = `group relative flex h-full w-full flex-col overflow-hidden rounded-panel border-2 text-left
  transition-transform duration-200 ease-out hoverOnly:-translate-y-0.5 active:translate-y-px
  focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink`

function Go({ children, tone }) {
  return (
    <span className={cn('mt-auto inline-flex items-center gap-1.5 self-start whitespace-nowrap pt-3 font-display text-ui font-bold', tone)}>
      {children}
      <ArrowRight aria-hidden className="size-4 shrink-0 transition-transform duration-200 groupHoverOnly:translate-x-1"/>
    </span>
  )
}

export function ProHome({ go }) {
  const [mode] = useMode()
  const real = mode === 'real'
  const me = useAccount()
  const live = useLiveTeens('pro')
  const reduce = useReducedMotion()
  const name = real ? String(me?.name || '').trim() : DEMO_NAME
  const setting = real ? settingLineFor(me) : SETTING_WORDS.school.head + '.'
  const n = real ? live.teens.length : CASELOAD.length
  const shares = n === 0 ? 'No teens connected yet' : n === 1 ? 'One teen shares with you' : `${n} teens share with you`

  const item = i => (reduce ? {} : {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.42, delay: 0.06 + i * 0.07, ease: [0.22, 1, 0.36, 1] },
  })

  return (
    <main className="wrap !pt-4 pb-12">
      <motion.section {...item(0)} aria-labelledby="pro-home-h"
        className="relative flex items-center gap-4 overflow-hidden rounded-panel bg-ink p-4 text-paper sm:p-5 lg:p-6">
        <div className="min-w-0 flex-1">
          <h2 id="pro-home-h" className="m-0 font-display text-head font-bold tracking-tight text-paper sm:text-sub">
            {name ? `Welcome, ${name}` : 'Welcome'}</h2>
          {setting && <p className="m-0 mt-1.5 text-sec text-paper/85">{setting}</p>}
          <p className="m-0 mt-3 inline-flex items-center gap-2 rounded-field bg-white/10 px-2.5 py-1.5 font-display text-ui font-bold text-paper">
            <span aria-hidden className={cn('size-2.5 rounded-full', n ? 'bg-accent-lit' : 'bg-paper/50')}/>{shares}</p>
        </div>
        <TrafficLight size={30} className="mr-1"/>
      </motion.section>
      {!real && <DemoNotice inline className="mt-2.5">A sample caseload.</DemoNotice>}

      <ul className="m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-2 lg:mt-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-4">
        <motion.li {...item(1)} className="min-w-0 sm:col-span-2 lg:col-span-1 lg:row-span-2">
          <button type="button" onClick={() => go('app-pro-trends')}
            className={cn(CARD, 'border-sky/40 bg-sky-wash p-4 lg:p-5')}>
            <span className="block font-display text-head font-bold leading-tight text-ink">Trends across your teens</span>
            <span className="mt-1 block text-fine text-ink-2">
              {real && n === 0 ? 'Mind Score and Heads Up, once a teen connects.' : `Mind Score and Heads Up for ${n === 1 ? 'one teen' : `${n} teens`}.`}</span>
            <span className="mt-3 flex w-full flex-col items-center rounded-[12px] bg-white/80 px-2 pb-3 pt-2">
              <RainbowArt size={250} className="w-full max-w-[250px]"/>
              <FaceRow size={22} className="mt-1"/>
            </span>
            <Go tone="text-sky-ink">Open trends</Go>
          </button>
        </motion.li>

        <motion.li {...item(2)} className="min-w-0">
          <button type="button" onClick={() => go('network')}
            className={cn(CARD, 'border-mint/40 bg-mint-wash p-4')}>
            <LinkArt/>
            <span className="mt-3 block font-display text-row font-bold leading-tight text-ink">Connect with families</span>
            <span className="mt-1 block text-fine text-ink-2">A parent approves each link first.</span>
            <Go tone="text-mint-ink">Connect</Go>
          </button>
        </motion.li>

        <motion.li {...item(3)} className="min-w-0">
          <button type="button" onClick={() => go('ai')}
            className={cn(CARD, 'border-lilac/35 bg-lilac-wash p-4')}>
            <ChatArt/>
            <span className="mt-3 block font-display text-row font-bold leading-tight text-ink">Ask MindMap AI</span>
            <span className="mt-1 block text-fine text-ink-2">Questions about teen stress, any time.</span>
            <Go tone="text-lilac-ink">Ask a question</Go>
          </button>
        </motion.li>

        <motion.li {...item(4)} className="min-w-0 sm:col-span-2">
          <button type="button" onClick={() => go('toolkit')}
            className={cn(CARD, 'flex-row items-center gap-3 border-sun/45 bg-sun-wash p-4 sm:gap-4')}>
            <span className="flex min-w-0 flex-1 flex-col self-stretch">
              <span className="block font-display text-row font-bold leading-tight text-ink">Toolkit</span>
              <span className="mt-1 block text-fine text-ink-2">Openers, grounding and referral notes for a session.</span>
              <Go tone="text-sun-ink">Open tools</Go>
            </span>
            <ToolArt className="shrink-0 origin-right scale-90 sm:scale-100"/>
          </button>
        </motion.li>
      </ul>
    </main>
  )
}
