import React from 'react'
import { Why } from './Monitor'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { useMode } from '../lib/mode'
import { PRO } from '../lib/terms'
import { ArrowRight } from '../ui/marks'
import { useAccount } from '../account/store'
import { useViewerName } from '../account/viewer'
import { cn } from '../lib/utils'
import { Caseload, useLayout } from './pro/Caseload'
import { GroupTrends } from './pro/GroupTrends'
import { ProTeenDetail } from './pro/TeenDetail'
import { alertTeen, statusCounts } from './pro/metrics'
import { CASELOAD } from '../lib/roster'
import { K_ANONYMITY } from '../lib/caseload'
import { LightTiles, TrafficLight } from './pro/look'
import { ChatArt, LinkArt, RainbowArt, ToolArt } from './pro/HomeArt'
import { StartGrid, StartTile } from './home/StartGrid'
import TeenDetail from './family/TeenDetail'
import { useLiveTeens } from './family/useLive'

// Counselor/Professional app. ProHome is the way in; Pro ('app-pro-trends') is the caseload, per teen or whole group.
// Heading words per work setting (src/account/store.js `setting`). The k-floor and consent rules stay the same.
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
export const settingLineFor = me =>
  me && me.role === 'pro' && SETTING_WORDS[me.setting] ? SETTING_WORDS[me.setting].head + '.' : null

const RULES = [
  'You see only what a teen agreed to share.',
  'A group under five shows nothing.',
  'Every record you open is logged.',
  'Nothing here is a diagnosis.',
]

const clock = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

const LiveNote = ({ children, className }) => (
  <span className={cn('inline-flex items-baseline gap-x-2.5 border-l-2 border-accent py-0.5 pl-3', className)}>
    <span className="shrink-0 font-display text-fine font-bold text-accent-ink">Live</span>
    <span className="text-fine text-ink-2">{children}</span>
  </span>
)

// Heads Up counts for today. A group under five draws nothing, and a live teen with no reading today is not counted.
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
  // `open` is { teen, at }; `log` holds this session's lines.
  const [open, setOpen] = React.useState(null)
  const [log, setLog] = React.useState([])
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
  const onTab = v => { setTab(v); announce(v === 'trends' ? 'Showing the whole group' : 'Showing each teen') }

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
          {real && (
            <div className="mt-2">
              <LiveNote>{liveTeens.length
                ? `${liveTeens.length === 1 ? 'One teen shares' : `${liveTeens.length} teens share`} with you. Updated as readings arrive.`
                : 'Nobody shares with you yet.'}</LiveNote>
            </div>
          )}
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

export function ProHome({ go }) {
  const [mode] = useMode()
  const real = mode === 'real'
  const me = useAccount()
  const live = useLiveTeens('pro')
  const name = useViewerName('pro')
  const setting = real ? settingLineFor(me) : SETTING_WORDS.school.head + '.'
  const n = real ? live.teens.length : CASELOAD.length
  const shares = n === 0 ? 'No teens connected yet' : n === 1 ? 'One teen shares with you' : `${n} teens share with you`

  return (
    <main className="wrap !pt-4 pb-12">
      <header>
        <h2 className="m-0 font-display !text-head font-bold tracking-tight text-ink">{name ? `Welcome, ${name}` : 'Welcome'}</h2>
        {setting && <p className="m-0 mt-0.5 text-fine text-ink-2">{setting}</p>}
      </header>

      <StartGrid label={`${PRO} app`} className="mt-3 lg:mt-4">
        <StartTile title="Trends" tone="bg-sky-wash" chevron="text-sky-ink"
          onClick={() => go('app-pro-trends')} art={<RainbowArt size={260} className="aspect-[320/232] h-full w-auto"/>}/>
        <StartTile title="Toolkit" tone="bg-sun-wash" chevron="text-sun-ink"
          onClick={() => go('toolkit')} art={<ToolArt className="h-full w-full"/>}/>
        <StartTile title="Ask MindMap AI" tone="bg-lilac-wash" chevron="text-lilac-ink"
          onClick={() => go('ai')} art={<ChatArt className="h-full w-full"/>}/>
        <StartTile title="Network" tone="bg-mint-wash" chevron="text-mint-ink"
          onClick={() => go('network')} art={<LinkArt className="w-full"/>}/>
      </StartGrid>

      <section aria-label="Who shares with you"
        className="lit mt-3 flex flex-wrap items-center gap-x-4 gap-y-3 p-3.5 lg:mt-4 lg:p-4">
        <TrafficLight size={16} horizontal className="shrink-0"/>
        <span className="min-w-[9rem] flex-1 font-display text-ui font-bold text-ink">{shares}</span>
        <button type="button" onClick={() => go(n ? 'app-pro-trends' : 'network')}
          className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-field
            bg-accent px-4 font-display text-ui font-medium text-paper transition-colors duration-150
            hoverOnly:bg-accent-ink active:bg-accent-ink sm:w-auto">
          {n ? 'Open Trends' : 'Open Network'}
          <ArrowRight aria-hidden className="size-4 shrink-0"/>
        </button>
      </section>
    </main>
  )
}
