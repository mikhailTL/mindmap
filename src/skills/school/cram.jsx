import React from 'react'
import { cn } from '../../lib/utils'
import { Sheet, Action, Note } from '../../toolkit/shell'
import { Screen, H, Field, Pick, Seg, useSaved, uid, CramIcon } from './ui'
import { parseTime, fmtTime, nightLabel, learnFactor, factorLine, adjust, splitTask, autoPlan,
         canMove, scheduleNight, minutesPastBed, BREAKS } from './logic'

/* Time-block planner. List what is due, guess the minutes, and the plan puts
 * the work on the nights before each due date, in blocks with breaks, early
 * rather than late. Log how long things really took and the guesses get
 * corrected from your own numbers. */

const ID = 'school-cram'
const START = { tasks:[], start:'16:00', bed:'22:30', mode:'50/10', useAdjust:true,
                history:[], plan:null, stage:'list', logged:{} }
const DUE = [1, 2, 3, 4, 5, 6, 7].map(d => [String(d), d === 1 ? 'Tomorrow' : `In ${d} days`])
const HEAVY = 180

const hm = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`
const pieceName = p => p.of > 1 ? `${p.name}, part ${p.part} of ${p.of}` : p.name

export default function Cram({ onExit }) {
  const [s, setS] = useSaved(ID, START)
  const set = patch => setS(v => ({ ...v, ...patch }))
  const [draft, setDraft] = React.useState({ name:'', est:'', due:'2' })
  const [actual, setActual] = React.useState({})

  const learned = learnFactor(s.history)
  const factor = s.useAdjust && learned.n ? learned.factor : 1
  const start = parseTime(s.start) ?? 960
  const bed = parseTime(s.bed) ?? 1350
  const dow = new Date().getDay()

  const add = e => {
    e.preventDefault()
    const est = Math.round(+draft.est)
    if (!draft.name.trim() || !(est > 0)) return
    set({ tasks:[...s.tasks, { id:uid(), name:draft.name.trim(), est:Math.min(600, est), due:+draft.due }] })
    setDraft({ name:'', est:'', due:draft.due })
  }
  const makePlan = () => {
    const pieces = s.tasks.flatMap(t => splitTask(t, factor))
    set({ plan:autoPlan(pieces), stage:'plan' })
    window.scrollTo(0, 0)
  }
  const move = (key, dir) => set({ plan:s.plan.map(p => p.key === key ? { ...p, night:p.night + dir } : p) })
  const again = () => { set({ tasks:[], plan:null, stage:'list', logged:{} }); setActual({}) }
  const logReal = t => {
    const a = Math.round(+actual[t.id])
    if (!(a > 0)) return
    set({ history:[...s.history, { est:t.est, actual:a }].slice(-30), logged:{ ...s.logged, [t.id]:a } })
  }

  const nights = React.useMemo(() => {
    if (!s.plan) return []
    const count = Math.max(...s.plan.map(p => p.night)) + 1
    return Array.from({ length:count }, (_, i) => {
      const items = s.plan.filter(p => p.night === i)
      const sched = scheduleNight(items.map(p => ({ key:p.key, label:pieceName(p), mins:p.mins })), start, s.mode)
      return { i, items, ...sched, past: minutesPastBed(sched.end, start, bed) }
    }).filter(n => n.items.length)
  }, [s.plan, start, bed, s.mode])

  return (
    <Screen title="Time-Block Planner" family="sky" icon={CramIcon} onExit={onExit}
      problem="Leaving it all to one late night ends in a crash the next day."
      plan="List what is due, guess the minutes, and spread the work over the nights before.">

      {s.stage === 'list' && (
        <>
          <Sheet>
            <H>Your guesses</H>
            {learned.n ? (
              <>
                <p className="mt-1 text-sec text-ink">{factorLine(learned.factor)}</p>
                <p className="text-fine text-ink-2">From your last {learned.n} logged {learned.n === 1 ? 'task' : 'tasks'}.</p>
                <label className="mt-3 flex min-h-[48px] items-center gap-3 font-display text-ui font-semibold text-ink">
                  <input type="checkbox" className="size-5 accent-[color:var(--kit-deep)]" checked={s.useAdjust}
                    onChange={e => set({ useAdjust:e.target.checked })}/>
                  Correct my guesses by this much
                </label>
              </>
            ) : (
              <p className="mt-1 text-sec text-ink-2">
                After you finish, log how long each task really took. The planner learns how far off
                your guesses run and corrects them next time.
              </p>
            )}
          </Sheet>

          <Sheet>
            <H>What is due</H>
            <form onSubmit={add} className="mt-3 grid gap-3">
              <Field label="Task" placeholder="e.g. History essay draft" value={draft.name} maxLength={60}
                onChange={e => setDraft({ ...draft, name:e.target.value })}/>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Your guess (minutes)" type="number" inputMode="numeric" min="5" max="600" step="5"
                  placeholder="e.g. 45" value={draft.est} onChange={e => setDraft({ ...draft, est:e.target.value })}/>
                <Pick label="Due" value={draft.due} options={DUE} onChange={v => setDraft({ ...draft, due:v })}/>
              </div>
              <Action kind="quiet" type="submit" disabled={!draft.name.trim() || !(+draft.est > 0)}>Add task</Action>
            </form>
            {s.tasks.length > 0 && (
              <ul className="mt-4 grid gap-2">
                {s.tasks.map(t => (
                  <li key={t.id} className="kit-ground flex items-center gap-3 rounded-[12px] p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-ui font-bold text-ink">{t.name}</p>
                      <p className="text-fine text-ink-2">
                        {DUE[t.due - 1][1]}. Guess {t.est} min
                        {factor !== 1 && `, planned ${adjust(t.est, factor)} min`}
                      </p>
                    </div>
                    <button type="button" aria-label={`Remove ${t.name}`}
                      onClick={() => set({ tasks:s.tasks.filter(x => x.id !== t.id) })}
                      className="kit-quiet grid size-12 shrink-0 place-items-center rounded-[12px]">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Sheet>

          <Sheet>
            <H>Your evenings</H>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Start work" type="time" value={s.start} onChange={e => set({ start:e.target.value })}/>
              <Field label="Bedtime" type="time" value={s.bed} onChange={e => set({ bed:e.target.value })}/>
            </div>
            <p className="mt-4 font-display text-ui font-semibold text-ink">Breaks</p>
            <p className="text-fine text-ink-2">Minutes of work + minutes of rest.</p>
            <Seg label="Breaks" className="mt-1.5" value={s.mode} onChange={v => set({ mode:v })}
              options={Object.entries(BREAKS).map(([k, b]) => [k, b.label])}/>
          </Sheet>

          <Action disabled={!s.tasks.length} onClick={makePlan}>Make my plan</Action>
        </>
      )}

      {s.stage !== 'list' && s.plan && (
        <>
          {s.stage === 'done' && (
            <Sheet className="kit-ground border-transparent">
              <H>Plan saved</H>
              <p className="mt-1 text-sec text-ink">
                {hm(nights.reduce((a, n) => a + n.workMins, 0))} of work over {nights.length}{' '}
                {nights.length === 1 ? 'night' : 'nights'}. Latest finish {fmtTime(Math.max(...nights.map(n => n.end)))}.
              </p>
            </Sheet>
          )}
          {nights.map(n => (
            <Sheet key={n.i}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <H>{nightLabel(n.i, dow)}</H>
                <p className="font-display text-ui font-semibold tabular-nums text-ink-2">
                  {fmtTime(start)} to {fmtTime(n.end)}
                </p>
              </div>
              <p className="text-fine text-ink-2">{hm(n.workMins)} of work</p>
              {n.past > 0 && (
                <p role="note" className="mt-2 rounded-[12px] bg-warn-wash p-3 text-ui font-semibold text-warn">
                  Runs {hm(n.past)} past your {fmtTime(bed)} bedtime. Move a part to another night or start earlier.
                </p>
              )}
              {n.past <= 0 && n.workMins > HEAVY && (
                <p role="note" className="mt-2 rounded-[12px] bg-warn-wash p-3 text-ui font-semibold text-warn">
                  Heavy night: over {HEAVY / 60} hours of work. Spread it out if you can.
                </p>
              )}
              <ol className="mt-3 grid gap-1">
                {n.segments.map((g, k) => (
                  <li key={k} className={cn('flex gap-3 rounded-[10px] px-3 py-2 text-ui',
                    g.kind === 'break' ? 'text-ink-2' : 'kit-ground text-ink')}>
                    <span className="w-[4.75rem] shrink-0 tabular-nums">{fmtTime(g.from)}</span>
                    <span className={g.kind === 'break' ? 'italic' : 'font-semibold'}>
                      {g.kind === 'break' ? `Break, ${g.to - g.from} min` : `${g.label}, ${g.to - g.from} min`}
                    </span>
                  </li>
                ))}
              </ol>
              {s.stage === 'plan' && (
                <ul className="mt-3 grid gap-2 border-t border-rule pt-3">
                  {n.items.map(p => (
                    <li key={p.key} className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1 text-ui text-ink">{pieceName(p)}</span>
                      <Action kind="quiet" className="min-h-[44px] px-3 text-fine"
                        aria-label={`Move ${pieceName(p)} to an earlier night`}
                        disabled={!canMove(p, -1, s.plan)} onClick={() => move(p.key, -1)}>Earlier</Action>
                      <Action kind="quiet" className="min-h-[44px] px-3 text-fine"
                        aria-label={`Move ${pieceName(p)} to a later night`}
                        disabled={!canMove(p, 1, s.plan)} onClick={() => move(p.key, 1)}>Later</Action>
                    </li>
                  ))}
                </ul>
              )}
            </Sheet>
          ))}
          {s.stage === 'plan' && (
            <>
              <Note>Parts can only move to nights before they are due.</Note>
              <div className="grid grid-cols-2 gap-3">
                <Action kind="quiet" onClick={() => set({ stage:'list', plan:null })}>Edit list</Action>
                <Action onClick={() => { set({ stage:'done' }); window.scrollTo(0, 0) }}>Done</Action>
              </div>
            </>
          )}
          {s.stage === 'done' && (
            <>
              <Sheet>
                <H>Log how long it really took</H>
                <p className="mt-1 text-fine text-ink-2">After you finish a task, log the real minutes. This is what teaches the planner your guesses.</p>
                <ul className="mt-3 grid gap-3">
                  {s.tasks.map(t => (
                    <li key={t.id}>
                      {s.logged[t.id] ? (
                        <p className="text-ui text-ink"><span className="font-semibold">{t.name}</span>: guessed {t.est}, took {s.logged[t.id]} min. Logged.</p>
                      ) : (
                        <form className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); logReal(t) }}>
                          <Field className="min-w-0 flex-1" label={t.name} hint={`You guessed ${t.est} min.`} type="number"
                            inputMode="numeric" min="1" max="900" placeholder="Real minutes"
                            value={actual[t.id] || ''} onChange={e => setActual({ ...actual, [t.id]:e.target.value })}/>
                          <Action kind="quiet" type="submit" className="px-4" aria-label={`Log real minutes for ${t.name}`}
                            disabled={!(+actual[t.id] > 0)}>Log</Action>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
                {learned.n > 0 && <p className="mt-3 text-ui font-semibold text-ink">{factorLine(learned.factor)}</p>}
              </Sheet>
              <Action kind="quiet" onClick={again}>Start again</Action>
            </>
          )}
        </>
      )}
    </Screen>
  )
}
