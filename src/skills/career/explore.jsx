import React from 'react'
import { cn } from '../../lib/utils'
import { Meter } from '../../toolkit/shell'
import { META } from './meta'
import { Screen, Sheet, H, Steps, Field, CopyBlock, Tick, Finish, Nav, Action, useSaved } from './parts'
import { CLUSTERS, STATEMENTS, ANSWERS, TEST_KINDS, scoreClusters, pickQuestions, swapQuestion,
         outreachMessage, testPlanText } from './explore-logic'
import { EndCard } from '../../toolkit/game'
import { useSkill, Quest, GoalMeter, leave } from '../../toolkit/game/skill'

/* Try a Career.
 *
 * 1 Sort    twelve quick "is this you" cards.
 * 2 Pick    the three closest clusters, with how close; pick one to test.
 * 3 Plan    three experiments for this month, and a one page test plan for
 *           the tiny project.
 * 4 Ask     five questions for an informational interview, each swappable,
 *           and a short outreach message to copy.
 * 5 Result  the plan in one place. */

const TOOL = META.explore
const STEPS = [['sort', 'Sort'], ['pick', 'Pick'], ['plan', 'Plan'], ['ask', 'Ask'], ['done', 'Result']]
const ORDER = STEPS.map(s => s[0])
const BLANK = { stage:'sort', reached:0, card:0, answers:{}, cluster:null, tried:{}, plan:{},
                ask:{}, seed:1, questions:null }

export default function Explore({ onExit }) {
  const g = useSkill(TOOL.id)
  const [s, patch, set] = useSaved(TOOL.id, BLANK)
  const go = stage => patch(o => ({ stage, reached: Math.max(o.reached, ORDER.indexOf(stage)) }))
  const ranked = React.useMemo(() => scoreClusters(s.answers), [s.answers])
  const cluster = CLUSTERS.find(c => c.id === (s.cluster || ranked[0].id))
  const answered = Object.keys(s.answers).length

  const answer = (id, e) => {
    if (s.answers[s.card] == null) g.hit(5, e, { sound:'tick' })
    const answers = { ...s.answers, [s.card]: id }
    const next = s.card + 1
    if (next >= STATEMENTS.length) patch(o => ({ answers, card: STATEMENTS.length - 1, stage:'pick', reached: Math.max(o.reached, 1) }))
    else patch({ answers, card: next })
  }
  const choose = id => patch(o => ({ cluster:id, questions: pickQuestions(id, 5, o.seed),
    stage:'plan', reached: Math.max(o.reached, 2) }))
  const questions = s.questions || pickQuestions(cluster.id, 5, s.seed)
  const restart = () => { set({ ...BLANK, seed: (s.seed % 97) + 1 }); g.reset() }
  const finish = () => { go('done'); g.finish({ complete:true, marks:['plan'] }) }

  return (
    <Screen tool={TOOL} onExit={onExit}
      problem="Picking a career or a major now can feel like a forever choice."
      doing="Sort what you like, pick a cluster, and plan three small tests for this month.">
      <Quest game={g} goal="Find a career cluster to test, and plan three small tests for this month.">
      <Steps steps={STEPS} at={s.stage} reached={s.reached} onGo={go}/>

      {s.stage === 'sort' && (
        <Sheet>
          <GoalMeter reduced={g.reduced} value={answered / STATEMENTS.length} label="Quick sort" right={`${answered} of ${STATEMENTS.length}`}/>
          <div key={s.card} className={cn(!g.reduced && 'g-card')}>
          <p className="mt-5 text-fine font-semibold text-ink-2">Card {s.card + 1} of {STATEMENTS.length}</p>
          <p className="mt-1 font-display text-head font-bold tracking-tight text-ink" aria-live="polite">{STATEMENTS[s.card].text}</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="Is this you?">
            {ANSWERS.map(a => (
              <button key={a.id} type="button" onClick={e => answer(a.id, e)} aria-pressed={s.answers[s.card] === a.id}
                className={cn('min-h-[64px] rounded-[14px] border px-2 font-display text-ui font-bold transition-[background-color,transform] motion-safe:active:scale-95',
                  s.answers[s.card] === a.id ? 'kit-fill border-transparent text-white' : 'kit-hoverable border-rule bg-card text-ink')}>
                {a.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {s.card > 0 && <Action kind="quiet" onClick={() => patch({ card: s.card - 1 })}>Back a card</Action>}
            {answered >= 6 && <Action kind="quiet" onClick={() => go('pick')}>See my clusters</Action>}
          </div>
        </Sheet>
      )}

      {s.stage === 'pick' && (
        <>
          <Sheet>
            <H>Your closest clusters</H>
            <p className="mt-1 text-fine text-ink-2">A starting point to test, not a verdict. Pick one to try this month.</p>
            <div className="mt-4 grid gap-3">
              {ranked.slice(0, 3).map(r => {
                const c = CLUSTERS.find(x => x.id === r.id)
                return (
                  <button key={r.id} type="button" onClick={() => choose(r.id)} aria-pressed={s.cluster === r.id}
                    className={cn('rounded-[14px] border p-4 text-left transition-colors',
                      s.cluster === r.id ? 'kit-ground border-transparent' : 'kit-hoverable border-rule bg-card')}>
                    <Meter value={r.pct} label={c.name} right={`${Math.round(r.pct * 100)}% match`}/>
                    <p className="mt-2 text-fine text-ink-2">Jobs like {c.jobs}</p>
                    <p className="kit-ink mt-2 font-display text-ui font-bold">Test this one</p>
                  </button>
                )
              })}
            </div>
            <details className="mt-4">
              <summary className="min-h-[44px] cursor-pointer py-2 font-display text-ui font-bold text-ink">The other five</summary>
              <div className="mt-2 grid gap-2">
                {ranked.slice(3).map(r => (
                  <button key={r.id} type="button" onClick={() => choose(r.id)}
                    className="kit-hoverable flex min-h-[48px] items-center justify-between gap-3 rounded-[12px] border border-rule bg-card px-4 text-left">
                    <span className="font-display text-ui font-semibold text-ink">{r.name}</span>
                    <span className="text-fine tabular-nums text-ink-2">{Math.round(r.pct * 100)}%</span>
                  </button>
                ))}
              </div>
            </details>
          </Sheet>
          <Nav back={() => go('sort')}/>
        </>
      )}

      {s.stage === 'plan' && (
        <>
          <Sheet>
            <H>Try {cluster.name} this month</H>
            <p className="mt-1 text-fine text-ink-2">Three small tests. Tick each one when you have done it.</p>
            <div className="mt-4 grid gap-2">
              {cluster.tests.map((t, i) => (
                <Tick key={t.kind} on={!!s.tried[cluster.id + i]}
                  onClick={() => patch(o => ({ tried: { ...o.tried, [cluster.id + i]: !o.tried[cluster.id + i] } }))}>
                  <span className="kit-ink block font-display text-fine font-bold">{TEST_KINDS[t.kind]}</span>
                  {t.text}
                </Tick>
              ))}
            </div>
            <p className="mt-3 text-fine text-ink-2">For a shadow day or a visit, ask a parent or guardian first and meet in a public or work place.</p>
          </Sheet>
          <Sheet>
            <H>One page test plan</H>
            <p className="mt-1 text-fine text-ink-2">For the tiny project. Small enough to finish, with one number that says if it worked.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="The idea" value={s.plan.idea ?? cluster.tests[2].text}
                onChange={e => patch(o => ({ plan:{ ...o.plan, idea:e.target.value } }))} className="sm:col-span-2"/>
              <Field label="Who it is for" placeholder="My robotics club" value={s.plan.who || ''}
                onChange={e => patch(o => ({ plan:{ ...o.plan, who:e.target.value } }))}/>
              <Field label="What I will make or do" placeholder="A sign up page" value={s.plan.make || ''}
                onChange={e => patch(o => ({ plan:{ ...o.plan, make:e.target.value } }))}/>
              <Field label="How I will know it worked" placeholder="10 people use it" value={s.plan.measure || ''}
                onChange={e => patch(o => ({ plan:{ ...o.plan, measure:e.target.value } }))}/>
              <Field label="Finish by" placeholder="End of the month" value={s.plan.by || ''}
                onChange={e => patch(o => ({ plan:{ ...o.plan, by:e.target.value } }))}/>
              <Field label="Most I will spend, in dollars" inputMode="decimal" placeholder="0" value={s.plan.cost || ''}
                onChange={e => patch(o => ({ plan:{ ...o.plan, cost:e.target.value.replace(/[^0-9.]/g, '') } }))}/>
            </div>
          </Sheet>
          <Nav next={() => go('ask')} nextLabel="Plan an interview" back={() => go('pick')}/>
        </>
      )}

      {s.stage === 'ask' && (
        <>
          <Sheet>
            <H>Informational interview</H>
            <p className="mt-1 text-fine text-ink-2">A short chat with someone who does the job. You ask, they talk, you learn what the work is really like.</p>
            <Field className="mt-4" label="Their job or field" placeholder={cluster.jobs.split(',')[0]}
              value={s.ask.role || ''} onChange={e => patch(o => ({ ask:{ ...o.ask, role:e.target.value } }))}/>
            <p className="mt-4 font-display text-ui font-bold text-ink">Five questions to ask</p>
            <ol className="m-0 mt-2 grid list-none gap-2 p-0">
              {questions.map((q, i) => (
                <li key={q} className="flex items-center gap-2 rounded-[12px] border border-rule bg-card p-2 pl-3">
                  <span className="kit-ink w-5 shrink-0 font-display text-ui font-bold tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-sec text-ink">{q}</span>
                  <button type="button" aria-label={`Swap question ${i + 1}`}
                    onClick={() => patch(o => ({ questions: swapQuestion(questions, i, cluster.id, o.seed) }))}
                    className="kit-quiet min-h-[44px] shrink-0 rounded-[10px] px-3 font-display text-fine font-bold">Swap</button>
                </li>
              ))}
            </ol>
          </Sheet>
          <Sheet>
            <H>Ask them</H>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Their name" placeholder="Ms. Ortiz" value={s.ask.theirName || ''}
                onChange={e => patch(o => ({ ask:{ ...o.ask, theirName:e.target.value } }))}/>
              <Field label="Your name" placeholder="Sam" value={s.ask.myName || ''}
                onChange={e => patch(o => ({ ask:{ ...o.ask, myName:e.target.value } }))}/>
              <Field className="sm:col-span-2" label="How you know them" placeholder="My coach Mr. Lee suggested I write to you"
                value={s.ask.how || ''} onChange={e => patch(o => ({ ask:{ ...o.ask, how:e.target.value } }))}/>
            </div>
            <CopyBlock className="mt-4" title="Your message"
              text={outreachMessage({ ...s.ask, role: s.ask.role || cluster.name.toLowerCase() })}/>
          </Sheet>
          <Nav next={finish} nextLabel="See my plan" back={() => go('plan')}/>
        </>
      )}

      {s.stage === 'done' && (
        <>
          {g.result && (
            <EndCard game={g} title={`Testing ${cluster.name}`} againLabel="Start again" onAgain={restart} onDone={leave(onExit)}
              stats={[['Match', `${Math.round((ranked.find(r => r.id === cluster.id)?.pct || 0) * 100)}%`],
                      ['Tests done', `${cluster.tests.filter((t, i) => s.tried[cluster.id + i]).length} of 3`]]}/>
          )}
          <Sheet>
            <p className="text-fine font-semibold text-ink-2">This month I am testing</p>
            <H as="h3" className="mt-1">{cluster.name}</H>
            <p className="mt-3 font-display text-ui font-bold text-ink">
              {cluster.tests.filter((t, i) => s.tried[cluster.id + i]).length} of 3 tests done
            </p>
            <ul className="m-0 mt-2 grid list-none gap-1.5 p-0">
              {cluster.tests.map((t, i) => (
                <li key={t.kind} className="flex gap-2 text-sec text-ink">
                  <span aria-hidden className={cn('mt-[0.55em] size-2 shrink-0 rounded-bar', s.tried[cluster.id + i] ? 'kit-fill' : 'border border-ink-3')}/>
                  <span><span className="font-semibold">{TEST_KINDS[t.kind]}:</span> {t.text}{s.tried[cluster.id + i] ? ' Done.' : ''}</span>
                </li>
              ))}
            </ul>
          </Sheet>
          <CopyBlock title="Test plan" text={testPlanText({ idea: cluster.tests[2].text, ...s.plan })}/>
          <CopyBlock title="Interview questions" label="Copy questions"
            text={questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}/>
          {!g.result && <Finish onExit={onExit} onAgain={restart}/>}
        </>
      )}
      </Quest>
    </Screen>
  )
}
