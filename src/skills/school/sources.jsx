import React from 'react'
import { cn } from '../../lib/utils'
import { Sheet, Action, Meter, Note } from '../../toolkit/shell'
import { Screen, H, Field, Seg, CopyButton, useSaved, uid, SourceIcon } from './ui'
import { SOURCE_QUESTIONS, scoreSource, SAMPLES, SORT_BINS, gradeSort } from './logic'
import { EndCard } from '../../toolkit/game'
import { useSkill, Quest, QuickRound, GoalMeter, leave, roundLine } from '../../toolkit/game/skill'

/* The practice sort as a quick round: one made-up source at a time. */
const ROUND = SAMPLES.map(x => ({ id:x.id, prompt:x.title, sub:x.detail, fixed:true, why:x.why,
  options: SORT_BINS.map(b => ({ id:b.id, text:b.label, ok:b.id === x.answer })) }))

/* Source checker. Type the claim and where it came from, answer six quick
 * checks, and get a confidence result with what to do about each weak spot.
 * A practice round sorts six made-up sources. */

const ID = 'school-sources'
const START = { mode:'check', claim:'', source:'', answers:{}, done:false, note:'', saved:[], picks:{}, graded:false }
const ANSWERS = [['yes', 'Yes'], ['unsure', 'Not sure'], ['no', 'No']]
const TONE = { strong:'kit-fill text-white', mixed:'bg-warn-wash text-warn', weak:'bg-[#fbe3de] text-crit' }

export default function Sources({ onExit }) {
  const g = useSkill(ID)
  const tap = React.useRef(null)
  const [last, setLast] = React.useState(null)
  const [s, setS] = useSaved(ID, START)
  const set = patch => setS(v => ({ ...v, ...patch }))
  const answered = SOURCE_QUESTIONS.every(q => s.answers[q.id])
  const r = scoreSource(s.answers)
  const sort = gradeSort(s.picks)

  const summary = `Claim: ${s.claim || 'not given'}\nSource: ${s.source || 'not given'}\n` +
    `Result: ${r.label} (${r.pct}%)\n` +
    (r.flags.length ? `Check: ${r.flags.map(f => f.title.toLowerCase()).join(', ')}\n` : '') +
    (s.note ? `Note: ${s.note}` : '')

  const keep = () => {
    setLast({ label:r.label, pct:r.pct, points:r.points, max:r.max })
    g.finish({ complete:true })
    set({ saved:[{ id:uid(), claim:s.claim, source:s.source, label:r.label, pct:r.pct, note:s.note }, ...s.saved].slice(0, 30),
          claim:'', source:'', answers:{}, done:false, note:'' })
    window.scrollTo(0, 0)
  }
  const reset = () => { set({ claim:'', source:'', answers:{}, done:false, note:'' }); g.reset(); setLast(null) }
  const answer = (id, v) => {
    if (!s.answers[id]) g.hit(5, tap.current)
    set({ answers:{ ...s.answers, [id]:v } })
  }
  const practiseAgain = () => { set({ picks:{}, graded:false }); g.reset(); window.scrollTo(0, 0) }
  const step = s.mode === 'practice' ? (s.graded ? 3 : 0)
    : !s.claim.trim() && !Object.keys(s.answers).length ? 0 : !s.done ? 1 : g.result ? 3 : 2

  return (
    <Screen title="Source Checker" family="lilac" icon={SourceIcon} onExit={onExit}
      problem="Endless links, chatbot answers and opinions that disagree."
      plan="Run a claim through six checks before you trust it, or practise on sample sources.">

      <Seg label="Mode" value={s.mode} onChange={v => { set({ mode:v }); g.reset(); setLast(null) }}
        options={[['check', 'Check a source'], ['practice', 'Practice round']]}/>
      <Quest game={g} at={step}
        goal={s.mode === 'practice' ? 'Sort six sources the way a careful checker would.' : 'Run one claim through six checks before you trust it.'}
        steps={s.mode === 'practice' ? ['Sort six sources'] : ['Write the claim', 'Answer six checks', 'Save the result']}>

      {s.mode === 'check' && last && g.result && (
        <EndCard game={g} title={`Checked: ${last.label}`} againLabel="Check another" onAgain={reset}
          onDone={leave(onExit)} stats={[['Confidence', `${last.pct}%`], ['Checks passed', `${last.points} of ${last.max}`]]}/>
      )}

      {s.mode === 'check' && !s.done && !(last && g.result) && (
        <>
          <Sheet className="grid gap-3">
            <Field label="The claim" area placeholder="e.g. Teens need 8 to 10 hours of sleep." value={s.claim}
              maxLength={300} onChange={e => set({ claim:e.target.value })}/>
            <Field label="Where it came from" placeholder="Website, author, video, chatbot" value={s.source}
              maxLength={160} onChange={e => set({ source:e.target.value })}/>
          </Sheet>
          <Sheet>
            <H>Six checks</H>
            <ol className="mt-3 grid gap-5">
              {SOURCE_QUESTIONS.map((q, i) => (
                <li key={q.id} onClickCapture={e => { tap.current = e.target }}>
                  <p className="font-display text-ui font-bold text-ink">{i + 1}. {q.title}</p>
                  <p className="text-ui text-ink-2">{q.ask}</p>
                  <Seg label={q.title} className="mt-2" value={s.answers[q.id]} options={ANSWERS}
                    onChange={v => answer(q.id, v)}/>
                </li>
              ))}
            </ol>
          </Sheet>
          <Action disabled={!answered} onClick={() => { set({ done:true }); window.scrollTo(0, 0) }}>
            {answered ? 'See result' : `Answer all six (${Object.keys(s.answers).length} of 6)`}
          </Action>
        </>
      )}

      {s.mode === 'check' && s.done && (
        <>
          <Sheet>
            <p className="text-fine text-ink-2">Confidence</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className={cn('rounded-chip px-4 py-1.5 font-display text-row font-bold', TONE[r.level])}>{r.label}</span>
              <span className="font-display text-num font-bold tabular-nums text-ink">{r.pct}%</span>
            </div>
            <GoalMeter className="mt-3" reduced={g.reduced} value={r.pct / 100} label="Checks passed" right={`${r.points} of ${r.max}`}/>
            <p className="mt-3 text-sec text-ink">{r.line}</p>
            {s.claim && <p className="mt-2 text-ui text-ink-2">"{s.claim}"</p>}
          </Sheet>
          {r.flags.length > 0 && (
            <Sheet>
              <H>What to check next</H>
              <ul className="mt-3 grid gap-3">
                {r.flags.map(f => (
                  <li key={f.id} className="kit-ground rounded-[12px] p-3">
                    <p className="font-display text-ui font-bold text-ink">
                      {f.title}: {f.answer === 'no' ? 'No' : 'Not sure'}
                    </p>
                    <p className="text-ui text-ink">{f.next}</p>
                  </li>
                ))}
              </ul>
            </Sheet>
          )}
          <Sheet className="grid gap-3">
            <Field label="Your note" hint="What will you do with this source?" value={s.note} maxLength={200}
              placeholder="e.g. Use it, but find the study it mentions." onChange={e => set({ note:e.target.value })}/>
            <div className="grid grid-cols-2 gap-3">
              <CopyButton text={summary}>Copy result</CopyButton>
              <Action onClick={keep}>Save and finish</Action>
            </div>
          </Sheet>
          <Action kind="quiet" onClick={reset}>Start again</Action>
        </>
      )}

      {s.mode === 'check' && s.saved.length > 0 && (
        <details className="rounded-[18px] border border-rule bg-card p-4">
          <summary className="min-h-[44px] cursor-pointer py-2 font-display text-ui font-bold text-ink">
            Saved checks ({s.saved.length})
          </summary>
          <ul className="mt-2 grid gap-2">
            {s.saved.map(x => (
              <li key={x.id} className="kit-ground flex items-start gap-2 rounded-[12px] p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-ui font-bold text-ink">{x.label}, {x.pct}%</p>
                  <p className="text-ui text-ink">{x.claim || 'No claim written'}</p>
                  {x.source && <p className="text-fine text-ink-2">{x.source}</p>}
                  {x.note && <p className="text-fine text-ink-2">Note: {x.note}</p>}
                </div>
                <button type="button" aria-label="Delete this check"
                  onClick={() => set({ saved:s.saved.filter(y => y.id !== x.id) })}
                  className="kit-quiet grid size-11 shrink-0 place-items-center rounded-[10px]">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {s.mode === 'practice' && !s.graded && (
        <>
          <Note>Every source here is made up for practice.</Note>
          <QuickRound game={g} items={ROUND} label="Source" doneLabel="See my sort"
            onDone={(grade, picks) => {
              set({ picks, graded:true })
              g.finish({ complete:true, marks: grade.clean ? ['clean'] : [] })
            }}/>
        </>
      )}

      {s.mode === 'practice' && s.graded && (
        <>
          {g.result ? (
            <EndCard game={g} title={sort.right === sort.total ? 'Clean sweep' : 'Sort done'} againLabel="Sort again"
              onAgain={practiseAgain} onDone={leave(onExit)}
              stats={[['Same call as a careful checker', `${sort.right} of ${sort.total}`]]}>
              <p className="text-ui text-ink">{roundLine(sort.right, sort.total)}</p>
            </EndCard>
          ) : (
            <Sheet className="kit-ground border-transparent">
              <H>{sort.right} of {sort.total} sorted the same way a careful checker would</H>
              <p className="mt-1 text-ui text-ink">Read why for each one below. The habit matters more than the score.</p>
            </Sheet>
          )}
          <ul className="grid gap-3">
            {sort.results.map(x => (
              <li key={x.id}>
                <Sheet>
                  <p className="font-display text-ui font-bold text-ink">{x.title}</p>
                  <p className="text-ui text-ink-2">{x.detail}</p>
                  <Seg label={`Sort: ${x.title}`} className="mt-3" value={s.picks[x.id]}
                    options={SORT_BINS.map(b => [b.id, b.label])}
                    onChange={v => !s.graded && set({ picks:{ ...s.picks, [x.id]:v } })}/>
                  {s.graded && (
                    <p className={cn('mt-3 rounded-[12px] p-3 text-ui', x.ok ? 'kit-ground text-ink' : 'bg-warn-wash text-ink')}>
                      <span className="font-bold">{x.ok ? 'Same call. ' : `A careful checker would say ${SORT_BINS.find(b => b.id === x.answer).label}. `}</span>
                      {x.why}
                    </p>
                  )}
                </Sheet>
              </li>
            ))}
          </ul>
          {!g.result && <Action kind="quiet" onClick={practiseAgain}>Start again</Action>}
        </>
      )}
      </Quest>
    </Screen>
  )
}
