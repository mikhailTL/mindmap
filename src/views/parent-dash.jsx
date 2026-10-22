import React from 'react'
import { FAMILY } from '../lib/roster'
import { useMode } from '../lib/mode'
import { Check, Plus } from '../ui/marks'
import { cn } from '../lib/utils'
import { TeenAvatar } from './family/TeenCard'
import ParentCard from './family/ParentCard'
import ChildPage from './family/ChildPage'
import ChildTrends from './family/Trends'
import ParentHomeBoard from './family/Home'
import { RangeSwitch } from './family/RangeTrend'
import { sourceOf } from './family/Source'
import { useLiveTeens } from './family/useLive'
import { PartHead, TODAY_LONG, longDate } from './student/PartHead'

// Parent app screens. Consent scope is whole days only, with no single reading, Notes or Location
// (see teenFor() in src/server/account.js).
export function ParentHome({ go }) {
  return <ParentHomeBoard go={go}/>
}

export const ParentDash = ParentHome

export function ParentTrends({ go }) {
  const [mode] = useMode()
  const live = useLiveTeens('parent')
  const real = mode === 'real'
  const list = real ? live.teens : FAMILY
  const [id, setId] = React.useState(null)
  const [range, setRange] = React.useState('day')
  const [openId, setOpenId] = React.useState(null)
  const back = React.useRef(null)
  const refs = React.useRef([])
  const teen = list.find(t => t.id === id) || list[0]
  const opened = list.find(t => t.id === openId)

  const open = t => { back.current = t.id; setOpenId(t.id); window.scrollTo({ top: 0 }) }
  const close = () => setOpenId(null)
  React.useEffect(() => {
    if (openId || !back.current) return
    document.querySelector(`[data-teen="${back.current}"] article > button:last-child`)?.focus()
  }, [openId])

  if (opened) return <ChildPage teen={opened} onBack={close}/>
  if (!teen) return <Invite go={go} live={live}/>

  const i = list.indexOf(teen)
  const key = e => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const n = (i + d + list.length) % list.length
    setId(list[n].id)
    refs.current[n]?.focus()
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {real && (
        <span className="inline-flex items-baseline gap-x-2.5 self-start border-l-2 border-accent py-0.5 pl-3">
          <span className="shrink-0 font-display text-fine font-bold text-accent-ink">Live</span>
          <span className="text-fine text-ink-2">{liveLine(live)}</span>
        </span>
      )}

      <section aria-labelledby="parent-today" className="flex flex-col gap-4">
        <PartHead id="parent-today" kind="today" title="Today"
          line={real ? longDate() : TODAY_LONG}/>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <h3 className="m-0 font-display text-head font-bold leading-tight text-ink">Your children</h3>
          <div className="flex items-center gap-3">
            <span className="text-fine font-semibold text-ink-2">Trends for</span>
            <RangeSwitch compact value={range} onChange={setRange} label="Trends for, on every card"/>
          </div>
        </div>
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 lg:gap-5 xl:grid-cols-3">
          {list.map(t => (
            <li key={t.id} data-teen={t.id} className="flex">
              <ParentCard teen={t} range={range} onOpen={open} className="w-full"/>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="parent-trends" className="mt-4 flex flex-col gap-4">
        <PartHead id="parent-trends" kind="trends" title="Trends"
          line="Pick a child, then a range or a day."/>
        <div role="tablist" aria-label="Child" className="flex flex-wrap gap-2">
          {list.map((t, n) => {
            const on = t === teen
            return (
              <button key={t.id} ref={el => (refs.current[n] = el)} type="button" role="tab" aria-selected={on}
                tabIndex={on ? 0 : -1} onClick={() => setId(t.id)} onKeyDown={key}
                className={cn('flex min-h-[52px] items-center gap-2.5 rounded-panel border-2 py-1.5 pl-1.5 pr-4 transition-colors',
                  'duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  on ? 'border-accent bg-accent-wash' : 'border-rule bg-card hoverOnly:border-ruling')}>
                <TeenAvatar teen={t} variant="parent" size="size-10"/>
                <span className="text-left">
                  <span className={cn('block font-display text-ui leading-tight text-ink', on ? 'font-bold' : 'font-medium')}>{t.first}</span>
                  <span className="block text-fine leading-tight text-ink-2">{sourceOf(t).title}</span>
                </span>
              </button>
            )
          })}
        </div>
        <ChildTrends key={teen.id} teen={teen}/>
      </section>
    </div>
  )
}

function Invite({ go, live }) {
  return (
    <div className="flex w-full flex-col gap-5">
      <PartHead id="parent-invite" kind="trends" title="Trends" line="Trends show here once your teen is linked."/>
      <span className="inline-flex items-baseline gap-x-2.5 self-start border-l-2 border-accent py-0.5 pl-3">
        <span className="shrink-0 font-display text-fine font-bold text-accent-ink">Live</span>
        <span className="text-fine text-ink-2">{liveLine(live)}</span>
      </span>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
        <LinkCard go={go}/>
        <section className="rounded-panel border border-rule bg-card p-5 shadow-card">
          <h3 className="m-0 font-display text-head font-bold leading-tight text-ink">What you will see</h3>
          <ul className="m-0 mt-3 list-none p-0">
            {['Their Mind Score for each day', 'Their Heads Up face for each day', 'Where readings came from: patch or phone',
              'Trends by week and month, with a calendar'].map(x => (
              <li key={x} className="flex items-start gap-2.5 border-b border-rule py-2.5 text-ui text-ink">
                <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-accent"/>{x}</li>
            ))}
          </ul>
          <p className="m-0 mt-3 text-fine text-ink-2">Your teen chooses what is shared. Notes, location and single readings never are.</p>
        </section>
      </div>
    </div>
  )
}

function liveLine({ state, teens }) {
  if (state === 'signedout') return 'Sign in as a parent to see your teen’s readings.'
  if (state === 'role') return 'This account is not a parent account.'
  if (state === 'device') return 'Readings show here once your account syncs.'
  return teens.length
    ? `Readings from ${teens.length === 1 ? 'your linked teen' : `your ${teens.length} linked teens`}, shared by them.`
    : 'No teen is linked to you yet.'
}

/* Live: linking happens in the network, with a real link. */
function LinkCard({ go }) {
  return (
    <button type="button" onClick={() => go?.('network')}
      className="group flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-panel border-2
        border-dashed border-ruling bg-paper p-5 text-center transition-colors duration-200 hoverOnly:border-accent
        hoverOnly:bg-accent-wash motion-reduce:transition-none focus-visible:outline focus-visible:outline-2
        focus-visible:outline-offset-2 focus-visible:outline-accent">
      <span aria-hidden className="grid size-12 place-items-center rounded-field border-2 border-accent text-accent-ink">
        <Plus className="size-6"/>
      </span>
      <span className="font-display text-head font-bold text-ink">Add your teen</span>
      <span className="max-w-[28ch] text-fine text-ink-2">Send them your invite link. They open it and join.</span>
    </button>
  )
}
