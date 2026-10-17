import React from 'react'
import { cn } from '../../lib/utils'
import { Sheet, Action, Meter, Note } from '../../toolkit/shell'
import { Screen, H, Field, Seg, CopyButton, useSaved, uid, SourceIcon } from './ui'
import { SOURCE_QUESTIONS, scoreSource, SAMPLES, SORT_BINS, gradeSort } from './logic'

/* Source checker. Type the claim and where it came from, answer six quick
 * checks, and get a confidence result with what to do about each weak spot.
 * A practice round sorts six made-up sources. */

const ID = 'school-sources'
const START = { mode:'check', claim:'', source:'', answers:{}, done:false, note:'', saved:[], picks:{}, graded:false }
const ANSWERS = [['yes', 'Yes'], ['unsure', 'Not sure'], ['no', 'No']]
const TONE = { strong:'kit-fill text-white', mixed:'bg-warn-wash text-warn', weak:'bg-[#fbe3de] text-crit' }

export default function Sources({ onExit }) {
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
    set({ saved:[{ id:uid(), claim:s.claim, source:s.source, label:r.label, pct:r.pct, note:s.note }, ...s.saved].slice(0, 30),
          claim:'', source:'', answers:{}, done:false, note:'' })
    window.scrollTo(0, 0)
  }
  const reset = () => set({ claim:'', source:'', answers:{}, done:false, note:'' })

  return (
    <Screen title="Source Checker" family="lilac" icon={SourceIcon} onExit={onExit}
      problem="Endless links, chatbot answers and opinions that disagree."
      plan="Run a claim through six checks before you trust it, or practise on sample sources.">

      <Seg label="Mode" value={s.mode} onChange={v => set({ mode:v })}
        options={[['check', 'Check a source'], ['practice', 'Practice round']]}/>

      {s.mode === 'check' && !s.done && (
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
                <li key={q.id}>
                  <p className="font-display text-ui font-bold text-ink">{i + 1}. {q.title}</p>
                  <p className="text-ui text-ink-2">{q.ask}</p>
                  <Seg label={q.title} className="mt-2" value={s.answers[q.id]} options={ANSWERS}
                    onChange={v => set({ answers:{ ...s.answers, [q.id]:v } })}/>
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
            <Meter className="mt-3" value={r.pct / 100} label="Checks passed" right={`${r.points} of ${r.max}`}/>
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
              <Action onClick={keep}>Save</Action>
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

      {s.mode === 'practice' && (
        <>
          {s.graded && (
            <Sheet className="kit-ground border-transparent">
              <H>{sort.right} of {sort.total} sorted the same way a careful checker would</H>
              <p className="mt-1 text-ui text-ink">Read why for each one below. The habit matters more than the score.</p>
            </Sheet>
          )}
          <Note>Every source here is made up for practice. Sort each one.</Note>
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
          {s.graded
            ? <Action kind="quiet" onClick={() => { set({ picks:{}, graded:false }); window.scrollTo(0, 0) }}>Start again</Action>
            : <Action disabled={Object.keys(s.picks).length < SAMPLES.length}
                onClick={() => { set({ graded:true }); window.scrollTo(0, 0) }}>
                {Object.keys(s.picks).length < SAMPLES.length ? `Sort all six (${Object.keys(s.picks).length} of 6)` : 'Check my sort'}
              </Action>}
        </>
      )}
    </Screen>
  )
}
