import React from 'react'
import { FAMILY, RANGE_LABEL } from '../lib/roster'
import TeenCard from './family/TeenCard'
import TeenDetail from './family/TeenDetail'
import AddCard from './family/AddCard'
import { RangeSwitch } from './family/RangeTrend'

/* The parent dashboard: one card per child and a card to add another. Nothing
 * else. A card opens that child's page (Mind Score dial, Day / Week / Month
 * trend, the day's readings and body signals, their Heads Up, and the privacy
 * boxes); Back returns here with focus on the card that was opened.
 *
 * CONSENT SCOPE, never widened here: whole days only, no single reading, no
 * Notes, no Location. See src/views/family/data.js. */

export function ParentDash() {
  const [range, setRange] = React.useState('week')
  const [openId, setOpenId] = React.useState(null)
  const back = React.useRef(null)
  const teen = FAMILY.find(t => t.id === openId)

  const open = t => { back.current = t.id; setOpenId(t.id); window.scrollTo({ top: 0 }) }
  const close = () => setOpenId(null)
  React.useEffect(() => {
    if (openId || !back.current) return
    document.querySelector(`[data-teen="${back.current}"] h3 button`)?.focus()
  }, [openId])

  if (teen) return <TeenDetail teen={teen} onBack={close} variant="parent" range={range}/>

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="m-0 font-display text-sub font-bold leading-none text-ink">Your children</h2>
          <p className="m-0 mt-2 text-ui text-ink-2">{RANGE_LABEL[range]}. Open a card for their full page.</p>
        </div>
        <RangeSwitch value={range} onChange={setRange} label="Range for every card"/>
      </div>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 lg:gap-5 xl:grid-cols-3">
        {FAMILY.map(t => (
          <li key={t.id} data-teen={t.id} className="flex">
            <TeenCard teen={t} range={range} variant="parent" onOpen={open} className="w-full"/>
          </li>
        ))}
        <li className="flex"><AddCard label="Add a child" who="your teen"/></li>
      </ul>
    </div>
  )
}
