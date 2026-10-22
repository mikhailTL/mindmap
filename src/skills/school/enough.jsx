import React from 'react'
import { cn } from '../../lib/utils'
import { Sheet, Action, Meter, Note } from '../../toolkit/shell'
import { Screen, H, Field, Tick, useSaved, uid, EnoughIcon } from './ui'
import { readiness, gutCheck, mistakeEntry } from './logic'
import { EndCard } from '../../toolkit/game'
import { useSkill, Quest, GoalMeter, Win, leave } from '../../toolkit/game/skill'

const ID = 'school-good-enough'
const START = { goal:'', must:[], nice:[], feel:50, mistakes:[], submitted:false }
const BLANK = { what:'', tells:'', next:'' }

function List({ items, onToggle, onRemove, label }) {
  if (!items.length) return null
  return (
    <ul className="mt-3 grid gap-2" aria-label={label}>
      {items.map(m => (
        <li key={m.id} className={cn('flex items-center gap-2 rounded-[12px] border', m.done ? 'kit-ground border-transparent' : 'border-rule bg-card')}>
          <button type="button" role="checkbox" aria-checked={m.done} onClick={e => onToggle(m.id, e)}
            className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 px-3 text-left">
            <Tick ok={m.done}/>
            <span className={cn('text-ui text-ink', m.done && 'font-semibold')}>{m.text}</span>
          </button>
          <button type="button" aria-label={`Remove ${m.text}`} onClick={() => onRemove(m.id)}
            className="grid size-12 shrink-0 place-items-center rounded-[12px] text-ink-2">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </li>
      ))}
    </ul>
  )
}

function AddRow({ label, placeholder, onAdd }) {
  const [t, setT] = React.useState('')
  return (
    <form className="mt-3 flex items-end gap-2" onSubmit={e => { e.preventDefault(); if (t.trim()) { onAdd(t.trim()); setT('') } }}>
      <Field className="min-w-0 flex-1" label={label} placeholder={placeholder} value={t} maxLength={80}
        onChange={e => setT(e.target.value)}/>
      <Action kind="quiet" type="submit" className="px-4" disabled={!t.trim()}>Add</Action>
    </form>
  )
}

export default function Enough({ onExit }) {
  const g = useSkill(ID)
  const [s, setS] = useSaved(ID, START)
  const set = patch => setS(v => ({ ...v, ...patch }))
  const [m, setM] = React.useState(BLANK)
  const r = readiness(s.must)
  const gut = gutCheck(s.feel, r.pct)

  const toggle = key => (id, e) => {
    const was = s[key].find(x => x.id === id)
    if (key === 'must' && was && !was.done) g.hit(10, e, { sound:'tick' })
    set({ [key]:s[key].map(x => x.id === id ? { ...x, done:!x.done } : x) })
  }
  const remove = key => id => set({ [key]:s[key].filter(x => x.id !== id) })
  const add = key => text => set({ [key]:[...s[key], { id:uid(), text, done:false }].slice(0, 12) })
  const log = e => {
    e.preventDefault()
    const entry = mistakeEntry(m)
    if (!entry) return
    set({ mistakes:[{ id:uid(), ...entry }, ...s.mistakes].slice(0, 40) })
    setM(BLANK)
  }
  const again = () => { set({ goal:'', must:[], nice:[], feel:50, submitted:false }); g.reset(); window.scrollTo(0, 0) }
  const submit = () => { set({ submitted:true }); g.finish({ complete:true }); window.scrollTo(0, 0) }
  const step = s.submitted ? 3 : r.total === 0 ? 0 : r.ready ? 2 : 1

  return (
    <Screen title="Good Enough Meter" family="coral" icon={EnoughIcon} onExit={onExit}
      problem="Decide when your work is ready, so worry about mistakes does not stop you finishing."
      plan="List what the work must have and tick each item. When the list is done, hand it in.">
      <Quest game={g} at={step} goal="Tick every must-have, then hand it in. Extras are optional."
        steps={['List the must-haves', 'Tick them off', 'Hand it in']}>

      {s.submitted && g.result ? (
        <EndCard game={g} title="Handed in" againLabel="Start the next one" onAgain={again} onDone={leave(onExit)}
          stats={[['Must-haves met', `${r.done} of ${r.total}`], ['Extras skipped', s.nice.filter(x => !x.done).length]]}>
          <p className="text-ui text-ink">{s.goal ? `${s.goal}: ` : ''}everything the assignment asked for is done.</p>
        </EndCard>
      ) : s.submitted ? (
        <Sheet className="kit-ground border-transparent">
          <H>Submitted</H>
          <p className="mt-1 text-sec text-ink">
            {s.goal ? `${s.goal}: ` : ''}all {r.total} must-haves met. That is what was asked for.
          </p>
          <p className="mt-2 text-ui text-ink-2">When you get feedback, note anything useful below.</p>
          <Action className="mt-4 w-full" kind="quiet" onClick={again}>Start again</Action>
        </Sheet>
      ) : (
        <>
          <Sheet>
            <Field label="What are you handing in?" placeholder="e.g. Biology lab report" value={s.goal} maxLength={80}
              onChange={e => set({ goal:e.target.value })}/>
            <H className="mt-5">Must-haves</H>
            <p className="text-fine text-ink-2">Only what the rubric or assignment sheet actually asks for.</p>
            <List items={s.must} label="Must-haves" onToggle={toggle('must')} onRemove={remove('must')}/>
            <AddRow label="Add a must-have" placeholder="e.g. Graph with labelled axes" onAdd={add('must')}/>
          </Sheet>

          <Sheet>
            <GoalMeter reduced={g.reduced} value={r.pct} label="Good enough to submit"
              right={`${r.done} of ${r.total}`}/>
            {r.ready ? (
              <>
                <Win className="mt-3" reduced={g.reduced}>Ready to submit. Everything required is there.</Win>
                <p className="mt-2 text-ui text-ink-2">Any more polishing is optional.</p>
                <Action className="mt-4 w-full" onClick={submit}>
                  I submitted it
                </Action>
              </>
            ) : r.total > 0 && (
              <p className="mt-3 text-ui text-ink-2">{r.total - r.done} left. Do those before any extras.</p>
            )}
          </Sheet>

          {r.total > 0 && (
            <Sheet>
              <H>Gut check</H>
              <label htmlFor="ge-feel" className="mt-1 block text-ui text-ink-2">How ready does it feel?</label>
              <div className="mt-2 flex items-center gap-3">
                <input id="ge-feel" type="range" min="0" max="100" step="5" value={s.feel}
                  onChange={e => set({ feel:+e.target.value })}
                  className="h-12 min-w-0 flex-1 accent-[color:var(--kit-deep)]"/>
                <span className="w-14 text-right font-display text-row font-bold tabular-nums text-ink">{s.feel}%</span>
              </div>
              <p className="text-ui text-ink-2">The list says {Math.round(r.pct * 100)}%.</p>
              <p className="mt-2 text-sec text-ink">{gut.line}</p>
            </Sheet>
          )}

          <details className="rounded-[18px] border border-rule bg-card p-4">
            <summary className="min-h-[44px] cursor-pointer py-2 font-display text-ui font-bold text-ink">
              Extras, if there is time ({s.nice.length})
            </summary>
            <p className="text-fine text-ink-2">Nice to have. They do not count toward ready.</p>
            <List items={s.nice} label="Extras" onToggle={toggle('nice')} onRemove={remove('nice')}/>
            <AddRow label="Add an extra" placeholder="e.g. Nicer title page" onAdd={add('nice')}/>
          </details>
        </>
      )}

      </Quest>

      <Sheet>
        <H>Mistake log</H>
        <p className="mt-1 text-ui text-ink-2">Write down a mistake, what it shows you, and what to try next time.</p>
        <form onSubmit={log} className="mt-3 grid gap-3">
          <Field label="What happened" placeholder="e.g. Lost marks for missing units" value={m.what} maxLength={140}
            onChange={e => setM({ ...m, what:e.target.value })}/>
          <Field label="What it tells me" placeholder="e.g. I check answers, not units" value={m.tells} maxLength={140}
            onChange={e => setM({ ...m, tells:e.target.value })}/>
          <Field label="Next try" placeholder="e.g. Circle every unit before I hand in" value={m.next} maxLength={140}
            onChange={e => setM({ ...m, next:e.target.value })}/>
          <Action kind="quiet" type="submit" disabled={!m.what.trim()}>Log it</Action>
        </form>
        {s.mistakes.length > 0 && (
          <ol className="mt-4 grid gap-2">
            {s.mistakes.map((x, i) => (
              <li key={x.id} className="kit-ground flex items-start gap-2 rounded-[12px] p-3">
                <div className="min-w-0 flex-1 text-ui text-ink">
                  <p className="font-display font-bold">Data point {s.mistakes.length - i}</p>
                  <p>{x.what}</p>
                  {x.tells && <p className="text-ink-2">Tells me: {x.tells}</p>}
                  {x.next && <p className="text-ink-2">Next try: {x.next}</p>}
                </div>
                <button type="button" aria-label={`Delete data point ${s.mistakes.length - i}`}
                  onClick={() => set({ mistakes:s.mistakes.filter(y => y.id !== x.id) })}
                  className="kit-quiet grid size-11 shrink-0 place-items-center rounded-[10px]">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </li>
            ))}
          </ol>
        )}
        {s.mistakes.length >= 3 && <Note className="mt-3">Look for patterns in the mistakes you log.</Note>}
      </Sheet>
    </Screen>
  )
}
