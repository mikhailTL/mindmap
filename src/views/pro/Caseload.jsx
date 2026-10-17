import React from 'react'
import { Panel } from '../Monitor'
import { LampFace } from '../../traffic/Face'
import { ArrowRight, Plus, Search } from '../../ui/marks'
import { CASELOAD } from '../../lib/roster'
import { cn } from '../../lib/utils'
import { Seg, fieldCls } from './parts'
import { ProTeenCard, ProTeenRow, ProRowHead } from './TeenCard'
import { COLUMNS, DEFAULT_COLUMNS, GRADES, RANGE_SHORT, SORTS, STATUS_WORD, filterTeens, sortTeens,
  statusCounts } from './metrics'

/* The Caseload tab: one toolbar, then a card per teen. A card opens that
 * teen's record; nothing about one teen is shown anywhere else. */

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
      range: RANGE_SHORT[s.range] ? s.range : 'week',
      density: s.density === 'list' ? 'list' : 'cards',
      sort: SORTS.some(([k]) => k === s.sort) ? s.sort : 'stress',
      columns: Array.isArray(s.columns) ? s.columns.filter(k => COLUMNS.some(c => c.key === k)) : [...DEFAULT_COLUMNS],
    }
  })
  const set = patch => setP(cur => { const next = { ...cur, ...patch }; writePrefs(next); return next })
  return [p, set]
}

function Label({ htmlFor, children }) {
  return <label htmlFor={htmlFor} className="tick mb-1 block">{children}</label>
}

function Toolbar({ layout, setLayout, filters, setFilters, counts, disabled }) {
  const [chooser, setChooser] = React.useState(false)
  const toggleStatus = s => setFilters(f => ({ ...f,
    statuses: f.statuses.includes(s) ? f.statuses.filter(x => x !== s) : [...f.statuses, s] }))
  const toggleCol = k => setLayout({ columns: layout.columns.includes(k)
    ? layout.columns.filter(x => x !== k) : COLUMNS.map(c => c.key).filter(x => x === k || layout.columns.includes(x)) })
  return (
    <fieldset disabled={disabled} className={cn('m-0 min-w-0 rounded-panel border border-rule bg-card p-3 lg:p-3.5',
      disabled && 'opacity-60')}>
      <legend className="sr-only">Find and arrange teens</legend>
      <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_12rem_9rem]">
        <div className="min-w-0">
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
        <div role="group" aria-label="Status" className="min-w-0">
          <p aria-hidden className="tick mb-1">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {['red', 'yellow', 'green'].map(s => {
              const on = filters.statuses.includes(s)
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => toggleStatus(s)}
                  aria-label={`${STATUS_WORD[s]}, ${counts[s]} teens`}
                  className={cn('inline-flex min-h-[40px] items-center gap-1.5 rounded-field border px-2.5 transition-colors duration-100',
                    on ? 'border-ink bg-ink text-paper' : 'border-ruling bg-card text-ink hoverOnly:bg-aqua')}>
                  <LampFace light={s} size={18}/>
                  <span className="font-display text-fine font-bold">{STATUS_WORD[s]}</span>
                  <span className={cn('text-fine tabular-nums', on ? 'text-paper' : 'text-ink-3')}>{counts[s]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="min-w-0">
          <p aria-hidden className="tick mb-1">Range</p>
          <Seg label="Range" value={layout.range} onChange={v => setLayout({ range: v })} options={Object.entries(RANGE_SHORT)}/>
        </div>
        <div className="min-w-0">
          <p aria-hidden className="tick mb-1">View</p>
          <Seg label="View" value={layout.density} onChange={v => setLayout({ density: v })}
            options={[['cards', 'Cards'], ['list', 'List']]}/>
        </div>
        <div className="min-w-0">
          <p aria-hidden className="tick mb-1">Figures</p>
          <button type="button" aria-expanded={chooser} aria-controls="pro-cols" onClick={() => setChooser(v => !v)}
            className={cn('inline-flex min-h-[40px] items-center gap-1.5 rounded-field border px-3 font-display text-fine font-bold',
              chooser ? 'border-ink bg-ink text-paper' : 'border-ruling bg-card text-ink hoverOnly:bg-aqua')}>
            Choose figures <span className={cn('font-body font-normal tabular-nums', chooser ? 'text-paper' : 'text-ink-3')}>
              {layout.columns.length} of {COLUMNS.length}</span>
          </button>
        </div>
      </div>

      {chooser && (
        <div id="pro-cols" role="group" aria-label="Figures shown on each teen"
          className="mt-3 grid grid-cols-2 gap-x-4 border-t border-rule pt-2 sm:grid-cols-4">
          {COLUMNS.map(c => (
            <label key={c.key} className="flex min-h-[40px] cursor-pointer items-center gap-2">
              <input type="checkbox" checked={layout.columns.includes(c.key)} onChange={() => toggleCol(c.key)}
                className="size-4 accent-accent"/>
              <span className="text-fine text-ink">{c.label}<span className="ml-1 text-ink-3">{c.unit}</span></span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  )
}

/* Real mode, and any network with nobody in it yet. */
function Empty({ go }) {
  return (
    <Panel tone="brand" className="mt-3 lg:mt-4">
      <p className="max-w-[28ch] font-display text-row font-bold leading-[1.16] text-ink sm:text-head">
        No teens in your network yet</p>
      <p className="mt-2 max-w-[52ch] text-fine text-ink-2">When a teen or a parent connects with you, their card
        appears here.</p>
      <button type="button" onClick={() => go('network')}
        className="mt-3.5 inline-flex min-h-[44px] items-center gap-2 rounded-field border border-accent-ink bg-accent px-4
          font-display text-ui font-medium text-paper transition-colors duration-150 hoverOnly:bg-accent-ink">
        <Plus aria-hidden className="size-4 shrink-0"/> Add to your network
      </button>
    </Panel>
  )
}

export function Caseload({ go, real, layout, setLayout, onOpen, alert }) {
  const list = real ? [] : CASELOAD
  const [filters, setFilters] = React.useState({ query: '', statuses: [], grade: 'all' })
  const counts = statusCounts(list)
  const shown = sortTeens(filterTeens(list, filters), layout.sort, layout.range)
  const filtered = filters.query.trim() || filters.statuses.length || filters.grade !== 'all'
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

      <Toolbar layout={layout} setLayout={setLayout} filters={filters} setFilters={setFilters} counts={counts}
        disabled={real}/>

      {real ? <Empty go={go}/> : (
        <>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 lg:mt-4">
            <p aria-live="polite" className="text-fine text-ink-2">
              Showing {shown.length} of {list.length} teens, sorted by {SORTS.find(([k]) => k === layout.sort)[1].toLowerCase()}</p>
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
                  <ProTeenCard teen={t} range={layout.range} columns={layout.columns} onOpen={onOpen}/>
                </li>
              ))}
            </ul>
          ) : shown.length > 0 && (
            <div className="mt-2 rounded-panel border border-rule bg-card p-2.5 shadow-card lg:p-3">
              <ProRowHead columns={layout.columns}/>
              <ul className="m-0 list-none p-0">
                {shown.map(t => <ProTeenRow key={t.id} teen={t} range={layout.range} columns={layout.columns} onOpen={onOpen}/>)}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  )
}
