import React from 'react'
import { Why } from './Monitor'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { DemoNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { ArrowRight, People } from '../ui/marks'
import { useAccount } from '../account/store'
import { cn } from '../lib/utils'
import { Caseload, useLayout } from './pro/Caseload'
import { GroupTrends } from './pro/GroupTrends'
import { ProTeenDetail } from './pro/TeenDetail'
import { alertTeen } from './pro/metrics'
import TeenDetail from './family/TeenDetail'
import { useLiveTeens } from './family/useLive'

/* THE MEDICAL PROFESSIONAL DASHBOARD.
 *
 * Two tabs. CASELOAD (the default) is a card per teen, with a toolbar to
 * search, sort, filter, pick a range, switch to a compact list and choose
 * which figures the cards carry. Clicking a card opens that teen's record,
 * and everything about one teen lives there: trend, body readings, Heads Up,
 * readings, the urgent alert if it is theirs, notes. GROUP TRENDS is the
 * school, the class periods and the network as a whole, plus the rules every
 * figure obeys and the log. Nothing on it names one teen's figures.
 *
 * Demo shows the 24-teen sample caseload from src/lib/roster.js. Live shows
 * the teens linked to this account whose link a parent approved, from the
 * account snapshot (day figures only, and only what each teen shares),
 * refreshed every 20 seconds by useLiveSync. `empty` shows nobody. No line here
 * mentions a patch being missing: the owner, "dont say 'No Patch' under the
 * medical professional dashboard".
 *
 * The four safeguards, in RULES, sit behind the "?" beside the heading and
 * hold on both tabs. */

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

const ActionLink = ({ onClick, children, primary }) => (
  <button type="button" onClick={onClick}
    className={cn('inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-field border px-3 font-display text-ui',
      'font-medium transition-colors duration-150',
      primary ? 'border-accent-ink bg-accent text-paper hoverOnly:bg-accent-ink'
              : 'border-rule bg-card text-accent-ink hoverOnly:bg-aqua')}>
    {children}
  </button>
)

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
  const onTab = v => { setTab(v); announce(v === 'trends' ? 'Showing group trends' : 'Showing the caseload') }

  return (
    <main>
      <Tabs value={tab} onValueChange={onTab}>
        <div className="wrap !pt-4">
          <p aria-live="polite" className="sr-only">{said}</p>
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="flex min-w-0 flex-wrap items-start gap-x-2.5 gap-y-1">
              <h2 className="max-w-[24ch] font-display text-row font-bold tracking-tight text-ink sm:text-head">{words.head}</h2>
              <Why label="The four rules on this screen" className="mt-0.5">
                <ul className="m-0 list-none p-0">{RULES.map(r => <li key={r} className="py-0.5">{r}</li>)}</ul>
              </Why>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {/* The bottom tab is Your Network; this opens the linking screen. */}
              <ActionLink onClick={() => go('network')} primary>
                <People aria-hidden size={16}/> Connect</ActionLink>
              <ActionLink onClick={() => go('ai')}>
                Ask MindMap AI <ArrowRight aria-hidden className="size-4 shrink-0 text-accent"/></ActionLink>
            </div>
          </div>
          <div className="mt-2">
            {real
              ? <LiveNote>{liveTeens.length
                  ? `${liveTeens.length === 1 ? 'One teen shares' : `${liveTeens.length} teens share`} with you. Updated as readings arrive.`
                  : 'Nobody shares with you yet.'}</LiveNote>
              : <DemoNotice inline>A sample caseload of 24 teens. No teen was measured.</DemoNotice>}
          </div>
        </div>

        <div className="mt-3 border-b border-ink bg-card sm:sticky sm:top-12 sm:z-30">
          <div className="wrap !py-0">
            <TabsList aria-label="Dashboard" className="gap-x-6 border-b-0">
              <TabsTrigger value="caseload" className="min-h-[48px] text-ui">Caseload</TabsTrigger>
              <TabsTrigger value="trends" className="min-h-[48px] text-ui">Group trends</TabsTrigger>
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
            <GroupTrends words={words} real={real} sessionLog={log}/>
          </TabsContent>
        </div>
      </Tabs>
    </main>
  )
}
