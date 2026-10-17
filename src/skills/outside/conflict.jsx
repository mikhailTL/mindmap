import React from 'react'
import { cn } from '../../lib/utils'
import { Bin } from '../../ui/marks'
import { Sheet, Choice, Action, FIELD, Note } from '../../toolkit/shell'
import { Screen, Intro, StepHead, Local, Row, Result, Done, CopyButton, Safety, I } from './parts'
import {
  SITUATIONS, FEELINGS, MOVES, BULLYING_STEPS, scenariosFor, scoreReplies, iStatement, checkWhen,
  readStore, writeStore,
} from './logic'

/* Say It Calmly: an I-statement and de-escalation builder.
 *
 * 1. Pick the situation (peer pressure, online bullying, friend friction,
 *    home, group project). Online bullying opens with the four safety steps.
 * 2. Build "I feel ... when ... because ... I need ...", with a live check
 *    for always/never, name calling and blame.
 * 3. Pick up to three de-escalation moves.
 * 4. Three short scenarios: pick a reply, read why.
 * Result: the script to copy and save. Saved scripts live at
 * `mindmap.skills.outside-conflict`. */

export const ID = 'outside-conflict'
export const ConflictIcon = () => (
  <I><path d="M3.5 5h10v7h-6l-4 3z"/><path d="M13.5 9h7v7.5l-3-2h-5.5v-2.5"/><path d="M7 8.5h3"/></I>
)

const STEPS = 4
const blank = { step:1, sit:'', feel:'', when:'', because:'', need:'', moves:[], picks:[], round:0 }
const MAX_MOVES = 3

function Danger() {
  return (
    <p className="text-ui text-ink">
      <b>Threats, or you feel unsafe?</b> Tell a trusted adult now. If you are in danger, call your local
      emergency number (911 in the US). If it is making you feel hopeless, call or text 988 (US) any time.
    </p>
  )
}

function BullySteps() {
  return (
    <Safety title="If you are being bullied online">
      <ol className="grid gap-2">
        {BULLYING_STEPS.map(([a, b], i) => (
          <li key={a} className="flex gap-3">
            <span aria-hidden className="kit-fill grid size-7 shrink-0 place-items-center rounded-full font-display
              text-fine font-bold text-white">{i + 1}</span>
            <span><b>{a}</b> {b}</span>
          </li>
        ))}
      </ol>
      <Danger/>
    </Safety>
  )
}

function Pick({ s, set }) {
  return (
    <>
      <StepHead n={1} of={STEPS} title="What is going on?" first/>
      <div className="grid gap-2">
        {SITUATIONS.map(x => (
          <Choice key={x.id} on={s.sit === x.id} onClick={() => set({ sit:x.id })}
            className="w-full py-3">
            <span className="min-w-0 flex-1">
              <span className="block">{x.label}</span>
              <span className={cn('block text-fine font-normal', s.sit === x.id ? 'text-white' : 'text-ink-2')}>{x.line}</span>
            </span>
          </Choice>
        ))}
      </div>
      {s.sit === 'online' && <BullySteps/>}
      <Row>
        <Action onClick={() => set({ step:2 })} disabled={!s.sit}>Next: build what to say</Action>
      </Row>
    </>
  )
}

function Field({ id, label, lead, value, onChange, example }) {
  return (
    <div>
      <label htmlFor={id} className="font-display text-ui font-bold text-ink">{label}</label>
      <div className="mt-1.5 flex items-stretch gap-2">
        <span aria-hidden className="kit-ink grid min-w-[4.5rem] place-items-center rounded-[12px] font-display
          text-ui font-bold kit-ground px-2">{lead}</span>
        <input id={id} className={FIELD} value={value} onChange={e => onChange(e.target.value)}
          placeholder={example ? 'For example: ' + example : ''}/>
      </div>
      {!value && example && (
        <button type="button" onClick={() => onChange(example)}
          className="mt-1 min-h-[44px] text-left text-fine font-semibold text-ink-2 underline underline-offset-4">
          Use the example
        </button>
      )}
    </div>
  )
}

function Build({ s, set }) {
  const sit = SITUATIONS.find(x => x.id === s.sit)
  const line = iStatement(s)
  const tips = checkWhen([s.when, s.because, s.need].join(' '))
  return (
    <>
      <StepHead n={2} of={STEPS} title="Build an I-statement"/>
      <Note>Say how it hit you, not what is wrong with them. People listen to that.</Note>
      {s.sit === 'online' && (
        <p className="mt-2 text-ui text-ink">For bullying, use this with a trusted adult or a report, not as a reply
          to the person.</p>
      )}
      <fieldset className="mt-4">
        <legend className="font-display text-ui font-bold text-ink">I feel</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {FEELINGS.map(f => (
            <Choice key={f} on={s.feel === f} onClick={() => set({ feel:f })} className="min-h-[44px] px-3.5">{f}</Choice>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 grid gap-4">
        <Field id="c-when" label="When (what happened)" lead="when" value={s.when}
          onChange={v => set({ when:v })} example={sit?.when}/>
        <Field id="c-because" label="Because (why it matters)" lead="because" value={s.because}
          onChange={v => set({ because:v })} example={sit?.because}/>
        <Field id="c-need" label="I need (what would help)" lead="I need" value={s.need}
          onChange={v => set({ need:v })} example={sit?.need}/>
      </div>
      {tips.length > 0 && (
        <div className="mt-3 rounded-[12px] border-2 border-warn bg-warn-wash p-3" role="status">
          <p className="font-display text-ui font-bold text-ink">Try this</p>
          <ul className="mt-1 grid gap-1 text-ui text-ink">{tips.map(t => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      <Result className="mt-4">
        <p className="text-fine font-semibold text-ink-2">So far</p>
        <p className="mt-1 font-display text-sec font-semibold text-ink" aria-live="polite">
          {line || 'Pick a feeling to start.'}
        </p>
      </Result>
      <Row>
        <Action kind="quiet" onClick={() => set({ step:1 })}>Back</Action>
        <Action onClick={() => set({ step:3 })} disabled={!s.feel || !s.when.trim()}>Next: stay calm</Action>
      </Row>
    </>
  )
}

function Moves({ s, set }) {
  const full = s.moves.length >= MAX_MOVES
  const flip = id => set({ moves:s.moves.includes(id) ? s.moves.filter(m => m !== id)
    : full ? s.moves : [...s.moves, id] })
  return (
    <>
      <StepHead n={3} of={STEPS} title="Pick your calm-down moves"/>
      <Note>Choose up to {MAX_MOVES}. These keep a hard talk from turning into a fight.</Note>
      <div className="mt-4 grid gap-2">
        {MOVES.map(m => (
          <Choice key={m.id} on={s.moves.includes(m.id)} onClick={() => flip(m.id)}
            disabled={full && !s.moves.includes(m.id)}
            className="w-full py-3">
            <span className="min-w-0 flex-1">
              <span className="block">{m.label}</span>
              {!m.say.startsWith('(') && (
                <span className={cn('block text-fine font-normal', s.moves.includes(m.id) ? 'text-white' : 'text-ink-2')}>
                  {m.say}
                </span>
              )}
            </span>
          </Choice>
        ))}
      </div>
      <p className="mt-2 text-fine text-ink-2" aria-live="polite">{s.moves.length} of {MAX_MOVES} picked</p>
      <Row>
        <Action kind="quiet" onClick={() => set({ step:2 })}>Back</Action>
        <Action onClick={() => set({ step:4, round:0, picks:[] })}>Next: practice</Action>
      </Row>
    </>
  )
}

const KIND = { calm:'Clear and calm', avoid:'Avoiding', attack:'Attacking' }

function Practice({ s, set }) {
  const list = scenariosFor(s.sit, 3)
  const sc = list[s.round]
  const pick = s.picks[s.round]
  const chosen = pick != null ? sc.options[pick] : null
  const choose = i => { const picks = [...s.picks]; picks[s.round] = i; set({ picks }) }
  const last = s.round === list.length - 1
  return (
    <>
      <StepHead n={4} of={STEPS} title={`Practice, ${s.round + 1} of ${list.length}`}/>
      <Sheet>
        <p className="text-sec text-ink">{sc.text}</p>
        <p className="mt-3 text-fine font-semibold text-ink-2">What do you do?</p>
        <div className="mt-2 grid gap-2">
          {sc.options.map((o, i) => (
            <Choice key={i} on={pick === i} onClick={() => choose(i)} disabled={pick != null && pick !== i}
              className="w-full py-3">{o.text}</Choice>
          ))}
        </div>
        {chosen && (
          <div className="mt-3 rounded-[12px] kit-ground p-3" role="status">
            <p className="kit-ink font-display text-ui font-bold">{KIND[chosen.kind]}</p>
            <p className="mt-1 text-ui text-ink">{chosen.why}</p>
            {chosen.kind !== 'calm' && (
              <p className="mt-1 text-ui text-ink">
                <b>Calmer option:</b> {sc.options.find(o => o.kind === 'calm').text}
              </p>
            )}
          </div>
        )}
      </Sheet>
      <Row>
        <Action kind="quiet" onClick={() => s.round ? set({ round:s.round - 1 }) : set({ step:3 })}>Back</Action>
        <Action disabled={pick == null}
          onClick={() => last ? set({ step:5 }) : set({ round:s.round + 1 })}>
          {last ? 'See my script' : 'Next scenario'}
        </Action>
      </Row>
    </>
  )
}

function Script({ s, set, onExit, again, saved, setSaved }) {
  const line = iStatement(s)
  const moves = MOVES.filter(m => s.moves.includes(m.id))
  const list = scenariosFor(s.sit, 3)
  const sc = scoreReplies(s.picks.map((p, i) => list[i]?.options[p]?.kind).filter(Boolean))
  const text = [line, ...moves.filter(m => !m.say.startsWith('(')).map(m => m.say)].join('\n')
  const sit = SITUATIONS.find(x => x.id === s.sit)
  const isSaved = saved.some(x => x.text === text)
  const save = () => {
    const next = [{ id:Date.now(), sit:sit?.label || '', text, moves:moves.map(m => m.label) }, ...saved].slice(0, 30)
    setSaved(next)
  }
  return (
    <>
      <StepHead n={0} of={0} title="Your script"/>
      <Result>
        <p className="text-fine font-semibold text-ink-2">{sit?.label}</p>
        <p className="mt-1 font-display text-row font-bold tracking-tight text-ink">{line}</p>
        {moves.length > 0 && (
          <>
            <h4 className="mt-4 font-display text-ui font-bold text-ink">Keep it calm</h4>
            <ul className="mt-1 grid gap-1 text-ui text-ink">
              {moves.map(m => <li key={m.id}>{m.label}{m.say.startsWith('(') ? '' : `: "${m.say}"`}</li>)}
            </ul>
          </>
        )}
        <p className="mt-4 text-ui text-ink">Practice: {sc.calm} of {sc.total} clear and calm.</p>
      </Result>
      {s.sit === 'online' && <div className="mt-4"><BullySteps/></div>}
      {s.sit !== 'online' && (
        <p className="mt-4 text-fine text-ink-2">If it ever turns into threats or you feel unsafe, tell a trusted adult
          now, or call your local emergency number (911 in the US).</p>
      )}
      <Row>
        <CopyButton text={text} label="Copy script"/>
        <Action kind="quiet" onClick={save} disabled={isSaved}>{isSaved ? 'Saved' : 'Save script'}</Action>
      </Row>
      <Row className="mt-3">
        <Done onExit={onExit}/>
        <Action kind="quiet" onClick={again}>Start again</Action>
      </Row>
      <Saved saved={saved} setSaved={setSaved}/>
    </>
  )
}

function Saved({ saved, setSaved }) {
  if (!saved.length) return null
  return (
    <details className="mt-6 rounded-[14px] border border-rule bg-card p-3">
      <summary className="min-h-[44px] cursor-pointer py-2 font-display text-ui font-bold text-ink">
        Saved scripts ({saved.length})
      </summary>
      <ul className="mt-2 grid gap-2">
        {saved.map(x => (
          <li key={x.id} className="kit-ground flex items-start gap-2 rounded-[12px] p-3">
            <div className="min-w-0 flex-1">
              <p className="text-fine text-ink-2">{x.sit}</p>
              <p className="mt-1 whitespace-pre-line text-ui text-ink">{x.text}</p>
            </div>
            <button type="button" aria-label="Delete this script" onClick={() => setSaved(saved.filter(y => y.id !== x.id))}
              className="kit-quiet grid size-11 shrink-0 place-items-center rounded-[12px]">
              <Bin aria-hidden className="size-4"/>
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}

export default function Conflict({ onExit }) {
  const [s, setS] = React.useState(blank)
  const [saved, setSavedState] = React.useState(() => {
    const v = readStore(ID, { scripts:[] }); return Array.isArray(v?.scripts) ? v.scripts : []
  })
  const setSaved = list => { setSavedState(list); writeStore(ID, { scripts:list }) }
  const set = patch => setS(prev => ({ ...prev, ...patch }))
  return (
    <Screen id={ID} family="coral" title="Say It Calmly" icon={<ConflictIcon/>} onExit={onExit}>
      {s.step === 1 && <Intro problem="Some fights get dodged and some blow up. Neither fixes much."
        doing="Build an I-statement, pick calm-down moves, then practice."/>}
      {s.step === 1 && <Pick s={s} set={set}/>}
      {s.step === 2 && <Build s={s} set={set}/>}
      {s.step === 3 && <Moves s={s} set={set}/>}
      {s.step === 4 && <Practice s={s} set={set}/>}
      {s.step === 5 && <Script s={s} set={set} onExit={onExit} again={() => setS(blank)}
        saved={saved} setSaved={setSaved}/>}
      {s.step === 1 && <Saved saved={saved} setSaved={setSaved}/>}
      <Local/>
    </Screen>
  )
}
