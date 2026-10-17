import React from 'react'
import { DemoNotice } from '../../ui/notice'
import { Button } from '../../ui/button'
import { Plus } from '../../ui/marks'
import { cn } from '../../lib/utils'
import { RANGES, USUAL, bandOf, clearReadings, groupByDay, stats, trend, windowFor } from '../../lib/readingLog'
import { BAND, SOURCE, Shape, ShapePath, clock, dayName, when } from './marks'
import { useReadingLog } from './useReadingLog'
import { SCORE } from '../../lib/terms'

/* The reading log, under the three ways in. Read like a glucose log: the
 * latest number large, the trend over a chosen range against the reader's
 * usual band, the share of readings inside that band, then every entry by
 * day. Higher means more stress: 0 calm to 100 peak. */

const PANEL = 'rounded-panel border border-rule bg-card p-4 lg:p-5'

/* ── The latest reading ───────────────────────────────────────────────── */

function Arrow({ dir, className }) {
  const rot = dir === 'up' ? -45 : dir === 'down' ? 45 : 0
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}
      style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function Latest({ entries, now }) {
  const last = entries[entries.length - 1]
  const b = BAND[bandOf(last.score)]
  const t = trend(entries)
  const src = SOURCE[last.source]
  return (
    <section aria-labelledby="log-latest" className={PANEL}>
      <h4 id="log-latest" className="tick">Latest {SCORE}</h4>
      <div className="mt-2 flex items-end gap-3">
        <span className="font-display text-fig font-bold tabular-nums text-ink">{last.score}</span>
        {t && <Arrow dir={t.dir} className={cn('mb-2 size-9 shrink-0', b.ink)}/>}
      </div>
      <p className={cn('mt-2 font-display text-ui font-bold', b.ink)}>{b.word}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-meta text-ink-2">
        <span className="font-mono tabular-nums">{when(last.at, now)}</span>
        <span aria-hidden className="text-ink-3">·</span>
        <span className="inline-flex items-center gap-1.5">
          <src.Icon aria-hidden className="size-4 text-ink-3"/>{src.word}
        </span>
      </p>
      {t && (
        <p className="mt-1 text-fine text-ink-3">
          {t.dir === 'flat'
            ? `About the same as ${clock(t.prev.at)}.`
            : `${t.dir === 'up' ? 'Up' : 'Down'} ${Math.abs(t.delta)} from ${clock(t.prev.at)}.`}
        </p>
      )}
    </section>
  )
}

/* ── Range switch ─────────────────────────────────────────────────────── */

function RangeSwitch({ value, onChange }) {
  return (
    <div role="group" aria-label="Range" className="flex gap-1 border-b border-rule">
      {RANGES.map(r => {
        const on = r.id === value
        return (
          <button key={r.id} type="button" aria-pressed={on} onClick={() => onChange(r.id)}
            className={cn('-mb-px min-h-[44px] border-b-2 px-2.5 font-display text-ui font-bold',
              'transition-colors duration-150',
              on ? 'border-accent text-ink' : 'border-transparent text-ink-3 hoverOnly:text-ink')}>
            {r.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── The trend chart ──────────────────────────────────────────────────── */

const HOUR = 3600e3
function xTicks(range, from, to, narrow) {
  const out = []
  if (range === 'day') {
    const d = new Date(from); d.setMinutes(0, 0, 0)
    while (d.getTime() <= to) {
      if (d.getTime() >= from && d.getHours() % 6 === 0) {
        const h = d.getHours()
        out.push({ t: d.getTime(), label: h === 0 ? '12 am' : h === 12 ? '12 pm' : `${h % 12} ${h < 12 ? 'am' : 'pm'}`, major: h === 0 })
      }
      d.setHours(d.getHours() + 1)
    }
    return out
  }
  const step = range === 'week' ? 1 : range === 'fortnight' ? (narrow ? 3 : 2) : (narrow ? 7 : 5)
  const d = new Date(to); d.setHours(0, 0, 0, 0)
  let k = 0
  while (d.getTime() >= from) {
    out.unshift({
      t: d.getTime(), major: true, show: k % step === 0,
      label: range === 'week'
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
    d.setDate(d.getDate() - 1); k++
  }
  return out.map(x => (x.show ? x : { ...x, label: '' }))
}

function TrendChart({ list, from, to, range, now }) {
  const wrap = React.useRef(null)
  const [w, setW] = React.useState(640)
  const [sel, setSel] = React.useState(null)

  React.useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    setW(Math.round(el.getBoundingClientRect().width) || 640)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width) || 640))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  React.useEffect(() => { setSel(null) }, [range, list.length])

  const H = w < 520 ? 220 : 270
  const P = { l: 30, r: 12, t: 12, b: 28 }
  const iw = Math.max(10, w - P.l - P.r), ih = H - P.t - P.b
  const x = t => P.l + ((t - from) / (to - from)) * iw
  const y = v => P.t + (1 - v / 100) * ih
  const ticks = xTicks(range, from, to, w < 520)
  const r = list.length > 40 ? 4.5 : 5.5
  const i = sel == null ? list.length - 1 : sel
  const pick = list[i]

  const nearest = clientX => {
    if (!list.length) return
    const box = wrap.current.getBoundingClientRect()
    const px = clientX - box.left
    let best = 0
    for (let k = 1; k < list.length; k++) if (Math.abs(x(list[k].at) - px) < Math.abs(x(list[best].at) - px)) best = k
    setSel(best)
  }
  const onKey = e => {
    if (!list.length) return
    if (e.key === 'ArrowLeft') { e.preventDefault(); setSel(Math.max(0, i - 1)) }
    if (e.key === 'ArrowRight') { e.preventDefault(); setSel(Math.min(list.length - 1, i + 1)) }
    if (e.key === 'Home') { e.preventDefault(); setSel(0) }
    if (e.key === 'End') { e.preventDefault(); setSel(list.length - 1) }
  }

  const s = stats(list)
  const label = list.length
    ? `Trend chart, ${list.length} readings. Average ${s.mean}, lowest ${s.min}, highest ${s.max}. Your usual range is ${USUAL.lo} to ${USUAL.hi}. Arrow keys step through readings.`
    : 'Trend chart. No readings in this range.'

  return (
    <div>
      {/* The reading under the pointer or the arrow keys; the latest by default. */}
      <p aria-live="polite" className="flex min-h-[28px] flex-wrap items-center gap-x-2 text-meta text-ink-2">
        {pick ? (
          <>
            <Shape source={pick.source} fill={BAND[bandOf(pick.score)].fill}/>
            <b className="font-display text-ui font-bold tabular-nums text-ink">{pick.score}</b>
            <span className="font-mono tabular-nums">{when(pick.at, now)}</span>
            <span className="text-ink-3">{SOURCE[pick.source].word}</span>
          </>
        ) : <span className="text-ink-3">No readings in this range.</span>}
      </p>
      <div ref={wrap} tabIndex={0} role="group" aria-label={label} onKeyDown={onKey}
        onPointerMove={e => nearest(e.clientX)} onPointerDown={e => nearest(e.clientX)}
        className="relative mt-1 touch-pan-y select-none rounded-field outline-offset-2">
        <svg aria-hidden width={w} height={H} className="block">
          {/* Usual band */}
          <rect x={P.l} width={iw} y={y(USUAL.hi)} height={y(USUAL.lo) - y(USUAL.hi)} fill="#dcefe4"/>
          {[USUAL.lo, USUAL.hi].map(v => (
            <line key={v} x1={P.l} x2={P.l + iw} y1={y(v)} y2={y(v)} stroke="#93b2a1" strokeWidth="1"/>
          ))}
          {[0, 100].map(v => (
            <line key={v} x1={P.l} x2={P.l + iw} y1={y(v)} y2={y(v)} stroke="#c2d7ca" strokeWidth="1"/>
          ))}
          {[0, USUAL.lo, USUAL.hi, 100].map(v => (
            <text key={v} x={P.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11"
              fill={v === USUAL.lo || v === USUAL.hi ? '#157446' : '#426a58'}
              style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</text>
          ))}
          {ticks.map(tk => (
            <g key={tk.t}>
              {tk.major && <line x1={x(tk.t)} x2={x(tk.t)} y1={P.t} y2={P.t + ih} stroke="#e3ede7" strokeWidth="1"/>}
              {tk.label && (
                <text x={x(tk.t)} y={H - 8} textAnchor="middle" fontSize="11" fill="#426a58">{tk.label}</text>
              )}
            </g>
          ))}
          {pick && (
            <line x1={x(pick.at)} x2={x(pick.at)} y1={P.t} y2={P.t + ih} stroke="#0d2b1e"
              strokeOpacity=".28" strokeDasharray="3 3"/>
          )}
          {list.map((p, k) => (
            <ShapePath key={p.id} source={p.source} cx={x(p.at)} cy={y(p.score)} r={r}
              fill={BAND[bandOf(p.score)].fill} stroke="#ffffff" strokeWidth="1.5"/>
          ))}
          {pick && (
            <ShapePath source={pick.source} cx={x(pick.at)} cy={y(pick.score)} r={r + 4}
              fill="none" stroke="#0d2b1e" strokeWidth="1.5"/>
          )}
        </svg>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="mt-3 flex flex-col gap-2 text-fine text-ink-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
        {Object.entries(SOURCE).map(([k, s]) => (
          <li key={k} className="inline-flex items-center gap-1.5">
            <Shape source={k} fill="#2a5744"/>{s.word}
          </li>
        ))}
      </ul>
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
        {['low', 'usual', 'up', 'high'].map(k => (
          <li key={k} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-[2px]" style={{ background: BAND[k].fill }}/>
            {BAND[k].short}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Time in the usual range ──────────────────────────────────────────── */

function InRange({ s, rangeLabel }) {
  const order = ['low', 'usual', 'up', 'high']
  return (
    <section aria-labelledby="log-tir" className={PANEL}>
      <h4 id="log-tir" className="tick">Time in your usual range</h4>
      {s.n === 0 ? (
        <p className="mt-2 text-meta text-ink-3">No readings in this range.</p>
      ) : (
        <>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-gap font-bold tabular-nums text-ink">{s.timeInUsual}%</span>
            <span className="text-fine text-ink-3">of {s.n} reading{s.n === 1 ? '' : 's'}, {rangeLabel}</span>
          </p>
          <div aria-hidden className="mt-3 flex h-4 w-full overflow-hidden rounded-[3px] bg-mist">
            {order.map(k => s.byBand[k] > 0 && (
              <span key={k} style={{ width: `${s.byBand[k]}%`, background: BAND[k].fill }}
                className="h-full border-r-2 border-card last:border-r-0"/>
            ))}
          </div>
          <dl className="m-0 mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1 text-fine">
            {[...order].reverse().map(k => (
              <React.Fragment key={k}>
                <span aria-hidden className="size-3 rounded-[2px]" style={{ background: BAND[k].fill }}/>
                <dt className={k === 'usual' ? 'font-bold text-ink' : 'text-ink-2'}>{BAND[k].word}</dt>
                <dd className="m-0 text-right font-mono tabular-nums text-ink">{s.byBand[k]}%</dd>
              </React.Fragment>
            ))}
          </dl>
          <dl className="m-0 mt-4 grid grid-cols-4 gap-2 border-t border-rule pt-3">
            {[['Average', s.mean], ['Lowest', s.min], ['Highest', s.max], ['Readings', s.n]].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-fine text-ink-3">{k}</dt>
                <dd className="m-0 font-display text-row font-bold tabular-nums text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-fine text-ink-3">
            {Object.entries(SOURCE).map(([k, src]) => `${src.word} ${s.bySource[k]}`).join(' · ')}
          </p>
        </>
      )}
    </section>
  )
}

/* ── Entries by day ───────────────────────────────────────────────────── */

function NoteEditor({ entry, onSave, onCancel }) {
  const [text, setText] = React.useState(entry.note || '')
  const ref = React.useRef(null)
  React.useEffect(() => { ref.current?.focus() }, [])
  return (
    <form className="col-span-full mt-2 flex flex-wrap items-center gap-2"
      onSubmit={e => { e.preventDefault(); onSave(text) }}>
      <label className="sr-only" htmlFor={`note-${entry.id}`}>Note for the {clock(entry.at)} reading</label>
      <input ref={ref} id={`note-${entry.id}`} value={text} maxLength={280}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel() } }}
        placeholder="What was going on?"
        className="min-h-[44px] min-w-0 flex-1 basis-48 rounded-field border border-ruling bg-paper px-3
          text-meta text-ink placeholder:text-ink-3"/>
      <Button type="submit" size="sm">Save</Button>
      <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
    </form>
  )
}

function Entry({ r, editing, onEdit, onSave, onCancel }) {
  const b = BAND[bandOf(r.score)]
  const src = SOURCE[r.source]
  return (
    <li className="grid grid-cols-[4.6rem_3.6rem_minmax(0,1fr)_auto] items-center gap-x-2 border-t
      border-rule py-2 first:border-t-0">
      <span className="font-mono text-meta tabular-nums text-ink-2">{clock(r.at)}</span>
      <span className="inline-flex items-center gap-1.5">
        <Shape source={r.source} fill={b.fill}/>
        <span className="font-display text-row font-bold tabular-nums text-ink">{r.score}</span>
        <span className="sr-only">, {b.word}</span>
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-fine text-ink-2">
          <src.Icon aria-hidden className="size-4 shrink-0 text-ink-3"/>
          <span className="truncate">{src.word}</span>
        </span>
        {r.pulse != null && <span className="block text-fine tabular-nums text-ink-3">{r.pulse} bpm</span>}
      </span>
      {!editing && (
        <button type="button" onClick={onEdit}
          aria-label={`${r.note ? 'Edit the note on' : 'Add a note to'} the ${clock(r.at)} reading`}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-field px-2 font-display text-fine
            font-bold text-accent hoverOnly:bg-aqua">
          {!r.note && <Plus aria-hidden className="size-3.5"/>}{r.note ? 'Edit' : 'Note'}
        </button>
      )}
      {r.note && !editing && (
        <p className="col-span-full m-0 mt-0.5 max-w-[60ch] border-l-2 border-rule pl-2.5 text-fine text-ink-2">
          {r.note}
        </p>
      )}
      {editing && <NoteEditor entry={r} onSave={onSave} onCancel={onCancel}/>}
    </li>
  )
}

function DayList({ list, now, setNote }) {
  const [editing, setEditing] = React.useState(null)
  const groups = groupByDay(list)
  if (!groups.length) return <p className="text-meta text-ink-3">No readings in this range.</p>
  return (
    <div role="region" aria-label="Readings by day" tabIndex={0}
      className="max-h-[30rem] overflow-y-auto overscroll-contain rounded-field">
      {groups.map(g => (
        <section key={g.key} aria-label={dayName(g.at, now)}>
          <h5 className="sticky top-0 z-[1] flex items-baseline justify-between gap-3 border-b border-rule
            bg-card py-2 font-display text-ui font-bold text-ink">
            <span>{dayName(g.at, now)}</span>
            <span className="text-fine font-normal tabular-nums text-ink-3">
              Average <b className="font-bold text-ink-2">{g.mean}</b> · {g.items.length} reading{g.items.length === 1 ? '' : 's'}
            </span>
          </h5>
          <ul className="m-0 list-none p-0">
            {g.items.map(r => (
              <Entry key={r.id} r={r} editing={editing === r.id}
                onEdit={() => setEditing(r.id)}
                onSave={text => { setNote(r, text); setEditing(null) }}
                onCancel={() => setEditing(null)}/>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ClearLog({ n }) {
  const [ask, setAsk] = React.useState(false)
  if (!ask) {
    return (
      <button type="button" onClick={() => setAsk(true)}
        className="min-h-[44px] font-display text-fine font-bold text-ink-3 underline-offset-4 hoverOnly:underline">
        Clear the log
      </button>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="m-0 text-fine text-ink-2">Delete all {n} readings from this phone?</p>
      <Button size="sm" variant="outline" onClick={() => { clearReadings(); setAsk(false) }}>Delete</Button>
      <Button size="sm" onClick={() => setAsk(false)}>Keep</Button>
    </div>
  )
}

/* ── The log ──────────────────────────────────────────────────────────── */

export function ReadingLog({ headRef }) {
  const { entries, now, demo, setNote } = useReadingLog()
  const [range, setRange] = React.useState('fortnight')
  const { from, to } = windowFor(range, now)
  const inRange = React.useMemo(() => entries.filter(r => r.at >= from && r.at <= to), [entries, from, to])
  const s = stats(inRange)
  const rangeLabel = { day: 'last 24 hours', week: 'last 7 days', fortnight: 'last 14 days', month: 'last 30 days' }[range]

  return (
    <section id="reading-log" aria-labelledby="reading-log-h" className="mt-8 scroll-mt-20 lg:mt-10">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h3 id="reading-log-h" ref={headRef} tabIndex={-1} className="font-display text-head font-bold text-ink">
          Your log
        </h3>
        {demo && <DemoNotice inline>Generated readings. Any you take are added.</DemoNotice>}
      </div>

      {entries.length === 0 ? (
        <div className={cn(PANEL, 'mt-3')}>
          <p className="text-meta text-ink-2">Take a reading to start your log.</p>
        </div>
      ) : (
        <>
          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-4">
            <Latest entries={entries} now={now}/>
            <InRange s={s} rangeLabel={rangeLabel}/>
          </div>

          <section aria-labelledby="log-trend" className={cn(PANEL, 'mt-3 lg:mt-4')}>
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <h4 id="log-trend" className="font-display text-ui font-bold text-ink">Trend</h4>
              <RangeSwitch value={range} onChange={setRange}/>
            </div>
            <div className="mt-3">
              <TrendChart list={inRange} from={from} to={to} range={range} now={now}/>
            </div>
            <Legend/>
            <p className="mt-2 text-fine text-ink-3">
              Shaded: your usual range, {USUAL.lo} to {USUAL.hi}. Higher means more stress.
            </p>
          </section>

          <section aria-labelledby="log-list" className={cn(PANEL, 'mt-3 lg:mt-4')}>
            <h4 id="log-list" className="font-display text-ui font-bold text-ink">Every reading</h4>
            <div className="mt-2">
              <DayList list={inRange} now={now} setNote={setNote}/>
            </div>
            {!demo && <div className="mt-3 border-t border-rule pt-2"><ClearLog n={entries.length}/></div>}
          </section>
        </>
      )}
    </section>
  )
}

