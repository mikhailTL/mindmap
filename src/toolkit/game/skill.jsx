import React from 'react'
import { cn } from '../../lib/utils'
import { useGame, Pops, Score } from './parts'
import { rightOption, gradeRound, mixOptions, roundLine } from './round'

// Points the shared --g-* colours at the tool's own --kit-* family.
export const SKILL_VARS = { '--g-main':'var(--kit-art)', '--g-ink':'var(--kit-deep)', '--g-wash':'var(--kit-tint)' }

// Position of `target` inside the nearest [data-pops] box, in percent, placed 22px above it.
export function posFrom(target) {
  const el = target?.currentTarget || target?.target || target
  const box = el?.closest?.('[data-pops]')
  if (!el?.getBoundingClientRect || !box) return {}
  const r = el.getBoundingClientRect(), b = box.getBoundingClientRect()
  if (!b.width || !b.height) return {}
  return { x: (r.left + r.width / 2 - b.left) / b.width * 100, y: Math.max(0, r.top - b.top - 22) / b.height * 100 }
}

export function useSkill(id) {
  const g = useGame(id)
  const add = g.add
  const hit = React.useCallback((n, target, o = {}) => add(n, { ...posFrom(target), ...o }), [add])
  return { ...g, hit }
}

export function QuestBar({ game, goal, steps, at = 0, className }) {
  const n = steps?.length || 0
  const k = Math.max(0, Math.min(n, at))          // at >= steps.length: all done
  return (
    <div className={cn('kit-ground rounded-[16px] p-3.5 sm:p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0">
          <span className="block text-fine font-semibold text-ink-2">Goal</span>
          <span className="block font-display text-ui font-bold text-ink">{goal}</span>
        </p>
        {game && <Score game={game} className="shrink-0 pt-0.5"/>}
      </div>
      {n > 1 && (
        <>
          <ol aria-hidden className="mt-3 flex gap-1.5">
            {steps.map((s, i) => (
              <li key={s} className={cn('h-2.5 flex-1 rounded-bar transition-colors duration-300',
                i < k ? 'kit-fill' : i === k ? 'kit-fill-art' : 'bg-card')}/>
            ))}
          </ol>
          <p className="mt-1.5 text-fine font-semibold text-ink-2">
            {k >= n ? 'Every step done' : `Step ${k + 1} of ${n}: ${steps[k]}`}
          </p>
        </>
      )}
    </div>
  )
}

export function Quest({ game, goal, steps, at, children, className, body = 'mt-4 grid gap-4' }) {
  return (
    <div data-pops className={cn('relative', className)} style={SKILL_VARS}>
      <Pops game={game}/>
      <QuestBar game={game} goal={goal} steps={steps} at={at}/>
      <div className={body}>{children}</div>
    </div>
  )
}

export const leave = onExit => () => { if (onExit) onExit(); else location.hash = '#/toolkit' }

function Mark({ ok, ring }) {
  return (
    <span aria-hidden className={cn('relative grid size-7 shrink-0 place-items-center rounded-full',
      ok ? 'bg-white text-[color:var(--kit-deep)]' : 'bg-white text-warn')}>
      {ring && <span className="g-ring absolute inset-0 rounded-full border-2 border-white"/>}
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round">
        {ok ? <path className={ring ? 'g-draw' : undefined} d="M5 12.5l4.5 4.5L19 7.5"/> : <path d="M7 7l10 10M17 7L7 17"/>}
      </svg>
    </span>
  )
}

export function Answer({ state = 'idle', onClick, children, reduced = false, className, ...rest }) {
  const locked = state !== 'idle'
  return (
    <button type="button" onClick={locked ? undefined : onClick} aria-disabled={locked || undefined}
      aria-pressed={state === 'right' || state === 'wrong'}
      className={cn('flex min-h-[56px] w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left',
        'font-display text-ui transition-[background-color,border-color,transform,color] duration-200',
        !locked && 'kit-hoverable motion-safe:active:scale-[0.98]',
        state === 'idle' && 'border-rule bg-card font-semibold text-ink shadow-card',
        state === 'right' && 'kit-fill border-transparent font-bold text-white shadow-card',
        state === 'wrong' && cn('border-warn bg-warn-wash font-semibold text-ink', !reduced && 'g-nudge'),
        state === 'reveal' && 'kit-edge kit-ground border-2 font-bold text-ink',
        state === 'dim' && 'border-rule bg-card font-medium text-ink-2',
        locked && 'cursor-default', className)} {...rest}>
      <span className="min-w-0 flex-1">{children}</span>
      {state === 'right' && <Mark ok ring={!reduced}/>}
      {state === 'wrong' && <Mark ok={false}/>}
      {state === 'reveal' && (
        <span aria-hidden className="kit-fill grid size-7 shrink-0 place-items-center rounded-full text-white">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
        </span>
      )}
    </button>
  )
}

/* What an answer button should look like, given the pick. */
export const answerState = (option, pick, rightId) =>
  pick == null ? 'idle'
    : option.id === pick ? (option.id === rightId ? 'right' : 'wrong')
    : option.id === rightId ? 'reveal' : 'dim'

// `points` is the round score per right answer, not level points.
export function QuickRound({ game, items, label = 'Card', seed = 1, points = 10, onDone, doneLabel = 'See how I did',
                             className, head }) {
  const [i, setI] = React.useState(0)
  const [picks, setPicks] = React.useState({})
  const next = React.useRef(null)
  const item = items[Math.min(i, items.length - 1)]
  const pick = picks[item.id]
  const right = rightOption(item)
  const opts = React.useMemo(() => item.fixed ? item.options : mixOptions(item.options, seed * 31 + i * 7),
    [item, seed, i])
  const picked = pick != null ? item.options.find(o => o.id === pick) : null
  const last = i >= items.length - 1

  React.useEffect(() => { if (pick != null) next.current?.focus({ preventScroll:true }) }, [pick])

  const choose = (o, e) => {
    if (pick != null) return
    setPicks(p => ({ ...p, [item.id]: o.id }))
    if (o.ok) game.add(points, { ...posFrom(e), sound:'good' })
    else game.cue('turn')
  }
  const go = () => {
    if (last) onDone?.(gradeRound(items, picks), picks)
    else setI(i + 1)
  }
  const tally = gradeRound(items, picks)

  return (
    <section className={cn('rounded-[18px] border border-rule bg-card p-4 shadow-card sm:p-5', className)}>
      {head}
      <div className="flex items-center justify-between gap-3">
        <p className="text-fine font-semibold text-ink-2">{label} {i + 1} of {items.length}</p>
        <ol aria-label={`${tally.right} right so far`} className="flex gap-1">
          {items.map((it, k) => {
            const r = tally.results[k]
            return (
              <li key={it.id} className={cn('size-2.5 rounded-full',
                r.pick == null ? (k === i ? 'kit-fill-art' : 'bg-rule')
                  : r.ok ? 'kit-fill' : 'border-2 border-warn bg-card')}/>
            )
          })}
        </ol>
      </div>
      <div key={item.id} className={cn(!game.reduced && 'g-card')}>
        {item.art && <div className="mt-3">{item.art}</div>}
        <p className="mt-2 font-display text-row font-bold tracking-tight text-ink">{item.prompt}</p>
        {item.sub && <p className="mt-1 text-ui text-ink-2">{item.sub}</p>}
        <div role="group" aria-label="Answers" className="mt-4 grid gap-2">
          {opts.map(o => (
            <Answer key={o.id} state={answerState(o, pick, right?.id)} reduced={game.reduced}
              onClick={e => choose(o, e)}>{o.text}</Answer>
          ))}
        </div>
        <div role="status" aria-live="polite">
          {picked && (
            <div className={cn('mt-3 rounded-[12px] p-3', picked.ok ? 'bg-accent-wash' : 'bg-warn-wash')}>
              <p className="font-display text-ui font-bold text-ink">
                {picked.ok ? 'Right.' : `Not quite. Better: ${right?.text}`}
              </p>
              {(picked.why || item.why) && <p className="mt-1 text-ui text-ink">{picked.why || item.why}</p>}
            </div>
          )}
        </div>
        {picked && (
          <button ref={next} type="button" onClick={go}
            className="kit-btn mt-4 inline-flex min-h-[52px] w-full items-center justify-center rounded-[12px] px-6
              font-display text-ui font-bold sm:w-auto">
            {last ? doneLabel : 'Next'}
          </button>
        )}
      </div>
    </section>
  )
}

export { roundLine, gradeRound }

export function GoalMeter({ value = 0, label, right, className, reduced = false }) {
  const v = Math.max(0, Math.min(1, value || 0))
  const full = v >= 1
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-display text-ui font-semibold text-ink-2">{label}</span>
        {right && <span className="font-display text-ui font-bold tabular-nums text-ink">{right}</span>}
      </div>
      <div key={full ? 'full' : 'not'} className={cn('kit-ground mt-2 h-5 overflow-hidden rounded-bar',
        full && !reduced && 'g-full')}>
        <div className="kit-fill h-full rounded-bar transition-[width] duration-500 ease-[var(--ease-out)] motion-reduce:transition-none"
          style={{ width: v * 100 + '%' }}/>
      </div>
    </div>
  )
}

export function Win({ children, className, reduced = false }) {
  return (
    <p role="status" className={cn('flex items-center gap-2.5 rounded-[12px] bg-accent-wash p-3 font-display text-ui font-bold text-ink',
      !reduced && 'g-in', className)}>
      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-white">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  )
}

export function PlayCard({ title, line, onPlay, label = 'Play', className }) {
  return (
    <div className={cn('kit-ground mt-4 flex flex-wrap items-center gap-3 rounded-[18px] p-4', className)}>
      <span aria-hidden className="kit-fill grid size-12 shrink-0 place-items-center rounded-full text-white">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-ui font-bold text-ink">{title}</span>
        <span className="block text-fine text-ink-2">{line}</span>
      </span>
      <button type="button" onClick={onPlay}
        className="kit-btn inline-flex min-h-[52px] w-full items-center justify-center rounded-[12px] px-6 font-display text-ui font-bold sm:w-auto">
        {label}
      </button>
    </div>
  )
}
