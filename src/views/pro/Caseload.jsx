import React from 'react'
import { LampFace } from '../../traffic/Face'
import { ArrowRight, Plus, Search } from '../../ui/marks'
import { CASELOAD } from '../../lib/roster'
import { cn } from '../../lib/utils'
import { Seg, fieldCls } from './parts'
import { LIGHT_TONE, TrafficLight } from './look'
import { ProTeenCard, ProTeenRow, ProRowHead } from './TeenCard'
import TeenCard from '../family/TeenCard'
import { RangeSwitch } from '../family/RangeTrend'
import { GRADES, SORTS, cardRange, STATUS_WORD, filterTeens, sortTeens, statusCounts } from './metrics'

/* The Caseload tab: one toolbar, then a card per teen. A card shows today;
 * its record holds the Trends. The owner, 18 October: the cards were "very
 * too complex", so the range switch and the figure chooser are gone. */

/* The reader's own layout choices, kept in this browser only. */
const PREFS = 'mindmap.pro.layout'
function readPrefs() {
  try {
    const v = JSON.parse(localStorage.getItem(PREFS) || 'null')
    return v && typeof v === 'object' ? v : {}
  } catch { return {} }
}
function writePrefs(v) {
  try { localStorage.setItem(PREFS, JSON.stringify(v)) } catch { /* in memory is fine */ }
}

export function useLayout() {
  const [p, setP] = React.useState(() => {
    const s = readPrefs()
    return {
      range: cardRange(s.range),
      density: s.density === 'list' ? 'list' : 'cards',
      sort: SORTS.some(([k]) => k === s.sort) ? s.sort : 'stress',
    }
  })
  const set = patch => setP(cur => { const next = { ...cur, ...patch }; writePrefs(next); return next })
  return [p, set]
}

function Label({ htmlFor, children }) {
  return <label htmlFor={htmlFor} className="tick mb-1 block">{children}</label>
}

function Toolbar({ layout, setLayout, filters, setFilters, counts, disabled }) {
  const toggleStatus = s => setFilters(f => ({ ...f,
    statuses: f.statuses.includes(s) ? f.statuses.filter(x => x !== s) : [...f.statuses, s] }))
  return (
    <fieldset disabled={disabled} className={cn('m-0 min-w-0 rounded-panel border border-rule bg-card p-3 lg:p-3.5',
      disabled && 'opacity-60')}>
      <legend className="sr-only">Find and arrange teens</legend>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[minmax(0,1fr)_12rem_9rem]">
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <Label htmlFor="pro-q">Search</Label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"/>
            <input id="pro-q" type="search" value={filters.query} placeholder="Student code, like 4003"
              onChange={e => setFilters(f => ({ ...f, query: e.target.value }))}
              className={cn(fieldCls, 'pl-8')}/>
          </div>
        </div>
        <div className="min-w-0">
          <Label htmlFor="pro-sort">Sort</Label>
          <select id="pro-sort" value={layout.sort} onChange={e => setLayout({ sort: e.target.value })} className={fieldCls}>
            {SORTS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </div>
        <div className="min-w-0">
          <Label htmlFor="pro-grade">Grade</Label>
          <select id="pro-grade" value={filters.grade} onChange={e => setFilters(f => ({ ...f, grade: e.target.value }))}
            className={fieldCls}>
            <option value="all">All grades</option>
            {GRADES.map(g => <option key={g} value={String(g)}>Grade {g}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-3 border-t border-rule pt-3">
        <div role="group" aria-label="Heads Up today" className="min-w-0">
          <p aria-hidden className="tick mb-1">Heads Up today</p>
          <div className="flex flex-wrap gap-1.5">
            {['red', 'yellow', 'green'].map(s => {
              const on = filters.statuses.includes(s)
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => toggleStatus(s)}
                  aria-label={`${STATUS_WORD[s]}, ${counts[s]} teens`}
                  className={cn('inline-flex min-h-[44px] items-center gap-1.5 rounded-field border-2 px-2.5 transition-colors duration-100',
                    on ? 'border-accent bg-accent-wash text-accent-ink' : cn(LIGHT_TONE[s].band, LIGHT_TONE[s].edge, 'text-ink hoverOnly:border-ink/40'))}>
                  <LampFace light={s} size={22}/>
                  <span className="font-display text-fine font-bold">{STATUS_WORD[s]}</span>
                  <span className={cn('text-fine tabular-nums', on ? 'text-accent-ink' : 'text-ink-2')}>{counts[s]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="min-w-0">
          <p aria-hidden className="tick mb-1">View</p>
          <Seg label="View" value={layout.density} onChange={v => setLayout({ density: v })}
            options={[['cards', 'Cards'], ['list', 'List']]}/>
        </div>
      </div>
    </fieldset>
  )
}

/* Live, with nobody linked yet: the lamps are dark until a teen shares,
   and the one thing to do is add a family in Network. */
function Empty({ go }) {
  return (
    <section aria-labelledby="pro-empty-h"
      className="mt-1 flex flex-col items-start gap-4 rounded-panel border-2 border-mint/40 bg-mint-wash p-4 sm:flex-row
        sm:items-center sm:p-5 lg:mt-2">
      <TrafficLight size={28} horizontal cycle={false} className="opacity-60"/>
      <div className="min-w-0 flex-1">
        <h3 id="pro-empty-h" className="m-0 font-display text-row font-bold leading-tight text-ink">No teens in your network yet</h3>
        <p className="m-0 mt-1.5 max-w-[52ch] text-fine text-ink-2">Add a family in Network. Once a parent approves,
          that teen&rsquo;s Mind Score and Heads Up show here.</p>
      </div>
      <button type="button" onClick={() => go('network')}
        className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-field bg-mint-ink px-5
          font-display text-ui font-bold text-white transition-colors duration-150 hoverOnly:bg-accent-ink sm:w-auto">
        <Plus aria-hidden className="size-4 shrink-0"/> Open Network
      </button>
    </section>
  )
}

/* Live: the teens who share with this account, as the shared card. The
   toolbar's figures need body signals the account does not send, so it is
   not drawn; one range switch sets every card. */
function LiveCaseload({ teens, layout, setLayout, onOpen, go }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <p className="text-fine text-ink-2">{teens.length === 1 ? 'One teen' : `${teens.length} teens`}, day figures only.</p>
        <RangeSwitch value={layout.range} onChange={v => setLayout({ range: v })} label="Range for every card"/>
      </div>
      <ul className="m-0 mt-3 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {teens.map(t => (
          <li key={t.id} className="flex min-w-0">
            <TeenCard teen={t} range={layout.range} variant="pro" onOpen={onOpen} className="w-full"/>
          </li>
        ))}
        <li className="flex min-w-0">
          <button type="button" onClick={() => go('network')}
            className="flex min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-panel border-2
              border-dashed border-ruling bg-paper p-5 text-center transition-colors duration-200 hoverOnly:border-accent
              hoverOnly:bg-accent-wash">
            <span aria-hidden className="grid size-12 place-items-center rounded-chip border-2 border-accent text-accent-ink">
              <Plus className="size-6"/></span>
            <span className="font-display text-head font-bold text-ink">Add to your network</span>
            <span className="max-w-[28ch] text-fine text-ink-2">A parent approves each link before you see anything.</span>
          </button>
        </li>
      </ul>
    </>
  )
}

export function Caseload({ go, real, layout, setLayout, onOpen, alert, liveTeens = [] }) {
  const list = real ? [] : CASELOAD
  const [filters, setFilters] = React.useState({ query: '', statuses: [], grade: 'all' })
  const counts = statusCounts(list, 'day')
  const shown = sortTeens(filterTeens(list, { ...filters, range: 'day' }), layout.sort,
    layout.sort === 'stress' ? 'day' : 'week')
  const filtered = filters.query.trim() || filters.statuses.length || filters.grade !== 'all'
  if (real && liveTeens.length) return <LiveCaseload teens={liveTeens} layout={layout} setLayout={setLayout} onOpen={onOpen} go={go}/>
  return (
    <>
      {alert && (
        <button type="button" onClick={() => onOpen(alert)}
          className="mb-3 flex min-h-[52px] w-full items-center justify-between gap-3 rounded-panel border border-crit/40
            border-l-4 border-l-crit bg-[#fbeae6] px-3.5 text-left transition-colors duration-150 hoverOnly:bg-[#f7ddd6]">
          <span className="min-w-0">
            <span className="block font-display text-ui font-bold text-[#7a2314]">One urgent alert is open</span>
            <span className="block text-fine text-ink-2">{alert.pseudonym}, grade {alert.grade}. Open their record.</span>
          </span>
          <ArrowRight aria-hidden className="size-4 shrink-0 text-crit"/>
        </button>
      )}

      {real ? <Empty go={go}/> : (
        <>
          <Toolbar layout={layout} setLayout={setLayout} filters={filters} setFilters={setFilters} counts={counts}/>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 lg:mt-4">
            <p aria-live="polite" className="text-fine text-ink-2">
              {shown.length} of {list.length} teens, {SORTS.find(([k]) => k === layout.sort)[1].toLowerCase()}</p>
            {filtered && (
              <button type="button" onClick={() => setFilters({ query: '', statuses: [], grade: 'all' })}
                className="min-h-[40px] font-display text-fine font-bold text-accent underline decoration-accent/40
                  underline-offset-4 hoverOnly:text-accent-ink">Clear filters</button>
            )}
          </div>
          {shown.length === 0 && (
            <p className="mt-3 rounded-panel border border-dashed border-ruling p-4 text-fine text-ink-2">
              No teen matches. Clear a filter to see more.</p>
          )}
          {layout.density === 'cards' ? (
            <ul className="m-0 mt-2 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
              {shown.map(t => (
                <li key={t.id} className="min-w-0">
                  <ProTeenCard teen={t} onOpen={onOpen}/>
                </li>
              ))}
            </ul>
          ) : shown.length > 0 && (
            <div className="mt-2 rounded-panel border border-rule bg-card p-2.5 shadow-card lg:p-3">
              <ProRowHead/>
              <ul className="m-0 list-none p-0">
                {shown.map(t => <ProTeenRow key={t.id} teen={t} onOpen={onOpen}/>)}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  )
}
