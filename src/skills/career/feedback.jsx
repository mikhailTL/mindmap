import React from 'react'
import { cn } from '../../lib/utils'
import { Meter } from '../../toolkit/shell'
import { META } from './meta'
import { Screen, Sheet, H, Steps, Field, CopyBlock, Tick, Finish, Nav, Choice, Chips, Action, useSaved, uid } from './parts'
import { SKILLS, FEELINGS, FROM, NEXT_STEPS, splitSentences, suggestSkills, groupSkills, clarifyScript, WARMUP } from './feedback-logic'
import { EndCard } from '../../toolkit/game'
import { useSkill, Quest, QuickRound, leave } from '../../toolkit/game/skill'

const TOOL = META.feedback
const STEPS = [['write', 'Write'], ['sort', 'Sort'], ['skill', 'Skill'], ['next', 'Next'], ['notes', 'Notes']]
const ORDER = STEPS.map(s => s[0])
const EMPTY = { text:'', from:'', about:'', facts:[], feelings:[], own:'', skill:'', good:'', step:'', by:'' }
const BLANK = { stage:'write', reached:0, d:EMPTY, notes:[] }

export default function Feedback({ onExit }) {
  const g = useSkill(TOOL.id)
  const [warm, setWarm] = React.useState(false)
  const [lastSkill, setLastSkill] = React.useState('')
  const [s, patch] = useSaved(TOOL.id, BLANK)
  const d = { ...EMPTY, ...s.d }
  const go = stage => patch(o => ({ stage, reached: Math.max(o.reached, ORDER.indexOf(stage)) }))
  const setD = p => patch(o => ({ d:{ ...EMPTY, ...o.d, ...p } }))
  const sentences = splitSentences(d.text)
  const factText = d.facts.length ? d.facts.join(' ') : d.text
  const suggested = suggestSkills(factText)
  const others = SKILLS.map(k => k.name).filter(n => !suggested.includes(n))
  const feelings = [...d.feelings, ...(d.own.trim() ? [d.own.trim()] : [])]
  const toggle = (list, v) => list.includes(v) ? list.filter(x => x !== v) : [...list, v]

  const saveNote = () => { setLastSkill(d.skill); g.finish({ complete:true }); patch(o => ({
    notes: [{ id:uid(), text:d.text.trim(), from:d.from, about:d.about.trim(), facts:d.facts, feelings,
              skill:d.skill, good:d.good.trim(), step:d.step, by:d.by.trim(), practised:false }, ...o.notes].slice(0, 80),
    d: EMPTY, stage:'notes', reached: 4,
  })) }
  const groups = groupSkills(s.notes)

  return (
    <Screen tool={TOOL} onExit={onExit}
      problem="Use feedback from school or work to improve one skill."
      doing="Separate the facts from the feelings, pick one skill to work on, and plan a next step.">
      <Quest game={g} goal="Turn one piece of feedback into one skill and one next step.">
      <Steps steps={STEPS} at={s.stage} reached={s.reached} onGo={go}/>

      {s.stage === 'write' && warm && !g.result && (
        <QuickRound game={g} items={WARMUP} label="Line" seed={4} doneLabel="Finish the warm up"
          head={<p className="mb-3 text-ui text-ink-2">Is each line about the work, or a judgement about the person?</p>}
          onDone={grade => { setWarm(false); g.finish({ complete:true, marks: grade.clean ? ['clean'] : [] }) }}/>
      )}
      {s.stage === 'write' && g.result && !lastSkill && (
        <EndCard game={g} title="Warm up done" againLabel="Log a real note" onAgain={() => g.reset()} onDone={leave(onExit)}
          stats={[['Score', g.result.score]]}/>
      )}
      {s.stage === 'write' && !warm && (
        <>
          {!g.result && (
            <button type="button" onClick={() => setWarm(true)}
              className="kit-ground flex min-h-[56px] items-center justify-between gap-3 rounded-[14px] px-4 text-left">
              <span><span className="block font-display text-ui font-bold text-ink">Warm up: work or about me?</span>
                <span className="block text-fine text-ink-2">Five quick lines. Is each about the work or about you?</span></span>
              <span aria-hidden className="kit-fill grid size-9 shrink-0 place-items-center rounded-full text-white">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4"
                  strokeLinecap="round" strokeLinejoin="round"><path d="M9 5.5l6.5 6.5L9 18.5"/></svg>
              </span>
            </button>
          )}
          <Sheet>
            <Field area label="What did they say?" hint="Write it as close to their words as you can."
              placeholder="Your report had a lot of careless mistakes and it was late. The ideas were good though."
              value={d.text} onChange={e => setD({ text:e.target.value, facts:[] })}/>
            <p className="mt-4 font-display text-ui font-semibold text-ink">Who said it?</p>
            <Chips className="mt-2">
              {FROM.map(f => <Choice key={f} on={d.from === f} onClick={() => setD({ from: d.from === f ? '' : f })}>{f}</Choice>)}
            </Chips>
            <Field className="mt-4" label="What was it about?" placeholder="my lab report" value={d.about}
              onChange={e => setD({ about:e.target.value })}/>
          </Sheet>
          <Nav next={() => go('sort')} disabled={!d.text.trim()} nextLabel="Sort it"/>
          {s.notes.length > 0 && <Action kind="quiet" onClick={() => go('notes')}>See my skill notes ({s.notes.length})</Action>}
        </>
      )}

      {s.stage === 'sort' && (
        <>
          <Sheet>
            <H>The facts</H>
            <p className="mt-1 text-fine text-ink-2">Tap each part that is about the work: something you could see, check or change.</p>
            <div className="mt-3 grid gap-2">
              {sentences.map(t => (
                <Tick key={t} on={d.facts.includes(t)} onClick={e => { if (!d.facts.includes(t)) g.hit(5, e); setD({ facts: toggle(d.facts, t) }) }}>{t}</Tick>
              ))}
            </div>
          </Sheet>
          <Sheet>
            <H>The feelings</H>
            <p className="mt-1 text-fine text-ink-2">What did it feel like it said about you? Pick any that fit.</p>
            <Chips className="mt-3">
              {FEELINGS.map(f => <Choice key={f} on={d.feelings.includes(f)} onClick={() => setD({ feelings: toggle(d.feelings, f) })}>{f}</Choice>)}
            </Chips>
            <Field className="mt-3" label="Or in your words" placeholder="I felt embarrassed" value={d.own}
              onChange={e => setD({ own:e.target.value })}/>
          </Sheet>
          {(d.facts.length > 0 || feelings.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="kit-ground rounded-[14px] p-4">
                <p className="font-display text-ui font-bold text-ink">What the note says about the work</p>
                <ul className="m-0 mt-2 grid list-disc gap-1 pl-5 text-sec text-ink">
                  {d.facts.length ? d.facts.map(f => <li key={f}>{f}</li>) : <li>Tap a fact above.</li>}
                </ul>
              </div>
              <div className="rounded-[14px] border border-rule bg-card p-4">
                <p className="font-display text-ui font-bold text-ink">How it made you feel</p>
                <ul className="m-0 mt-2 grid list-disc gap-1 pl-5 text-sec text-ink-2">
                  {feelings.length ? feelings.map(f => <li key={f}>{f}</li>) : <li>Nothing picked.</li>}
                </ul>
              </div>
            </div>
          )}
          <Nav next={() => go('skill')} back={() => go('write')} nextLabel="Find the skill"/>
        </>
      )}

      {s.stage === 'skill' && (
        <>
          <Sheet>
            <H>One skill to practise</H>
            <p className="mt-1 text-fine text-ink-2">
              {suggested.length ? 'These match the words in the note. Pick one.' : 'Pick the one closest to the note, or write your own.'}
            </p>
            {suggested.length > 0 && (
              <Chips className="mt-3">
                {suggested.map(k => <Choice key={k} on={d.skill === k} onClick={() => setD({ skill:k })}>{k}</Choice>)}
              </Chips>
            )}
            <details className="mt-3" open={!suggested.length}>
              <summary className="min-h-[44px] cursor-pointer py-2 font-display text-ui font-bold text-ink">Other skills</summary>
              <Chips className="mt-2">
                {others.map(k => <Choice key={k} on={d.skill === k} onClick={() => setD({ skill:k })}>{k}</Choice>)}
              </Chips>
            </details>
            <Field className="mt-3" label="Or name it yourself" placeholder="Planning my week"
              value={SKILLS.some(k => k.name === d.skill) ? '' : d.skill} onChange={e => setD({ skill:e.target.value })}/>
            <Field className="mt-3" label="What good would look like" hint="Optional. One line."
              placeholder="I read it once out loud before I hand it in" value={d.good} onChange={e => setD({ good:e.target.value })}/>
          </Sheet>
          {d.skill.trim() && (
            <div className="kit-ground rounded-[14px] p-4">
              <p className="text-fine font-semibold text-ink-2">Rewritten</p>
              <p className="mt-1 font-display text-row font-bold text-ink">I am practising {d.skill.trim().toLowerCase()}.</p>
              {d.good.trim() && <p className="mt-1 text-sec text-ink">Good looks like: {d.good.trim()}</p>}
            </div>
          )}
          <Nav next={() => go('next')} back={() => go('sort')} disabled={!d.skill.trim()} nextLabel="Pick a next step"/>
        </>
      )}

      {s.stage === 'next' && (
        <>
          <Sheet>
            <H>One next step</H>
            <div className="mt-3 grid gap-2">
              {NEXT_STEPS.map(n => (
                <Choice key={n.id} on={d.step === n.id} onClick={() => setD({ step:n.id })} className="w-full">{n.label}</Choice>
              ))}
            </div>
            <Field className="mt-4" label="By when" placeholder="Before Friday's practice" value={d.by}
              onChange={e => setD({ by:e.target.value })}/>
          </Sheet>
          {d.step === 'ask' && <CopyBlock title="What to say" text={clarifyScript(d.about)}/>}
          <Nav next={saveNote} back={() => go('skill')} disabled={!d.step} nextLabel="Save to my skill notes"/>
        </>
      )}

      {s.stage === 'notes' && (
        <>
          {g.result && lastSkill && (
            <EndCard game={g} title="Skill note saved" againLabel="Log another" onDone={leave(onExit)}
              onAgain={() => { patch({ d:EMPTY, stage:'write', reached:0 }); setLastSkill(''); g.reset() }}
              stats={[['Practising', lastSkill], ['Skill notes', s.notes.length]]}/>
          )}
          {groups.length === 0 ? (
            <Sheet><p className="text-sec text-ink">No notes yet. Log one piece of feedback to start.</p></Sheet>
          ) : (
            <Sheet>
              <H>Your skill notes</H>
              <p className="mt-1 text-fine text-ink-2">Each note is a skill you are building. Tick a note when you have practised it.</p>
              <div className="mt-4 grid gap-4">
                {groups.map(g => (
                  <Meter key={g.skill} value={g.practised / g.count} label={g.skill}
                    right={`${g.practised} of ${g.count} practised`}/>
                ))}
              </div>
            </Sheet>
          )}
          {s.notes.map(n => (
            <Sheet key={n.id} className="p-4">
              <p className="kit-ink font-display text-fine font-bold">{n.skill}{n.from ? ` · from a ${n.from.toLowerCase()}` : ''}</p>
              <p className="mt-1 text-sec text-ink">{n.facts.length ? n.facts.join(' ') : n.text}</p>
              {n.step && <p className="mt-1 text-fine text-ink-2">
                Next: {NEXT_STEPS.find(x => x.id === n.step)?.label}{n.by ? `, by ${n.by}` : ''}
              </p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Tick on={n.practised} className="w-auto flex-1"
                  onClick={() => patch(o => ({ notes: o.notes.map(x => x.id === n.id ? { ...x, practised:!x.practised } : x) }))}>
                  Practised
                </Tick>
                <button type="button" aria-label={`Delete the note on ${n.skill}`}
                  onClick={() => patch(o => ({ notes: o.notes.filter(x => x.id !== n.id) }))}
                  className={cn('kit-quiet min-h-[52px] rounded-[12px] px-4 font-display text-fine font-bold')}>Delete</button>
              </div>
            </Sheet>
          ))}
          {!g.result && <Finish onExit={onExit} onAgain={() => { patch({ d:EMPTY, stage:'write', reached:0 }); g.reset() }} againLabel="Log another"/>}
        </>
      )}
      </Quest>
    </Screen>
  )
}
