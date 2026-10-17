import React from 'react'
import { cn } from '../../lib/utils'
import { Bin } from '../../ui/marks'
import { Sheet, Choice, Action, FIELD, Note } from '../../toolkit/shell'
import { Screen, Intro, StepHead, Local, Row, Result, Done, CopyButton, Safety, I } from './parts'
import { WHO, NO_STYLES, REPLIES, CONSENT, noLine, pushbackFor, readStore, writeStore } from './logic'
import { EndCard } from '../../toolkit/game'
import { useSkill, Quest, Answer, answerState, Win, leave } from '../../toolkit/game/skill'

/* Saying No: a boundary builder.
 *
 * 1. Who it is with: a friend, the group, someone you are dating, a coach or
 *    teacher. Dating opens the consent card, which stays on every step.
 * 2. What you want to say no to (tap one or type it).
 * 3. How: plain no, no and a reason, no and an offer, broken record, not now.
 *    A back-up person to text if it gets hard.
 * 4. Three rounds of pushback. Hold your line, over-explain or give in;
 *    each gets a short, kind note.
 * Result: the line, how many rounds you held, and "My boundaries", a list
 * you can come back to. Stored at `mindmap.skills.outside-no`. */

export const ID = 'outside-no'
export const NoIcon = () => (
  <I><circle cx="12" cy="12" r="8.5"/><path d="M8 12h8"/></I>
)

const STEPS = 4
const blank = { step:1, who:'', ask:'', style:'', reason:'', other:'', backup:'', picks:[], round:0 }
const BACKUPS = ['A parent', 'An older sibling', 'A friend', 'A school counselor']

const lower = t => t.charAt(0).toLowerCase() + t.slice(1)

function Consent({ compact = false }) {
  if (compact) return (
    <details className="mt-4 rounded-[14px] border-2 border-ink-3 bg-card p-3">
      <summary className="min-h-[44px] cursor-pointer py-2 text-ui text-ink">
        <b>No means no,</b> and you can change your mind at any time. Where to get help
      </summary>
      <div className="mt-2 grid gap-2 text-ui text-ink"><ConsentBody/></div>
    </details>
  )
  return (
    <Safety title="About pressure in dating" className="mt-4"><ConsentBody/></Safety>
  )
}

function ConsentBody() {
  return (
    <>
      <ul className="grid gap-1.5">{CONSENT.map(c => <li key={c}>{c}</li>)}</ul>
      <p><b>Help:</b> talk to a trusted adult. Love Is Respect (US) is free and private: text LOVEIS to 22522
        or call 1-866-331-9474. Take It Down (takeitdown.ncmec.org) helps remove nude images of anyone under 18.</p>
      <p><b>In danger?</b> Call your local emergency number (911 in the US).</p>
    </>
  )
}

function Who({ s, set }) {
  return (
    <>
      <StepHead n={1} of={STEPS} title="Who is asking?" first/>
      <div className="grid gap-2 sm:grid-cols-2">
        {WHO.map(w => (
          <Choice key={w.id} on={s.who === w.id} onClick={() => set({ who:w.id, ask:'' })}
            className="w-full py-3">{w.label}</Choice>
        ))}
      </div>
      {s.who === 'partner' && <Consent/>}
      <Row>
        <Action onClick={() => set({ step:2 })} disabled={!s.who}>Next</Action>
      </Row>
    </>
  )
}

function What({ s, set }) {
  const who = WHO.find(w => w.id === s.who)
  return (
    <>
      <StepHead n={2} of={STEPS} title="What do you want to say no to?"/>
      <div className="flex flex-wrap gap-2">
        {who.asks.map(a => (
          <Choice key={a} on={s.ask === a} onClick={() => set({ ask:a })}>{a}</Choice>
        ))}
      </div>
      <label className="mt-4 block">
        <span className="font-display text-ui font-bold text-ink">Or write your own</span>
        <span className="mt-1.5 flex items-stretch gap-2">
          <span aria-hidden className="kit-ground kit-ink grid shrink-0 place-items-center rounded-[12px] px-3
            font-display text-fine font-bold">I won't</span>
          <input className={FIELD} value={s.ask} onChange={e => set({ ask:e.target.value })}
            placeholder="give them my password"/>
        </span>
      </label>
      {s.who === 'partner' && <Consent compact/>}
      <Row>
        <Action kind="quiet" onClick={() => set({ step:1 })}>Back</Action>
        <Action onClick={() => set({ step:3 })} disabled={!s.ask.trim()}>Next</Action>
      </Row>
    </>
  )
}

function How({ s, set }) {
  const line = s.style ? noLine(s.style, s.ask, s) : ''
  return (
    <>
      <StepHead n={3} of={STEPS} title="Pick a firm, kind way to say it"/>
      <Note>You do not owe a long reason. Kind and firm can be the same sentence.</Note>
      <div className="mt-4 grid gap-2">
        {NO_STYLES.map(st => (
          <Choice key={st.id} on={s.style === st.id} onClick={() => set({ style:st.id })} className="w-full py-3">
            <span className="min-w-0 flex-1">
              <span className="block">{st.label}</span>
              <span className={cn('block text-fine font-normal', s.style === st.id ? 'text-white' : 'text-ink-2')}>{st.line}</span>
            </span>
          </Choice>
        ))}
      </div>
      {s.style === 'reason' && (
        <label className="mt-4 block">
          <span className="font-display text-ui font-bold text-ink">Your one reason</span>
          <input className={cn(FIELD, 'mt-1.5')} value={s.reason} onChange={e => set({ reason:e.target.value })}
            placeholder="I'm not comfortable with it"/>
        </label>
      )}
      {s.style === 'other' && (
        <label className="mt-4 block">
          <span className="font-display text-ui font-bold text-ink">What you can do instead</span>
          <span className="mt-1.5 flex items-stretch gap-2">
            <span aria-hidden className="kit-ground kit-ink grid shrink-0 place-items-center rounded-[12px] px-3
              font-display text-fine font-bold">but I can</span>
            <input className={FIELD} value={s.other} onChange={e => set({ other:e.target.value })}
              placeholder="hang out this weekend"/>
          </span>
        </label>
      )}
      {line && (
        <Result className="mt-4">
          <p className="text-fine font-semibold text-ink-2">Your line</p>
          <p className="mt-1 font-display text-row font-bold tracking-tight text-ink" aria-live="polite">{line}</p>
        </Result>
      )}
      {line && <Win className="mt-3">Line ready. Next, hold it against three rounds of pushback.</Win>}
      <fieldset className="mt-5">
        <legend className="font-display text-ui font-bold text-ink">If it gets hard, I can text</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {BACKUPS.map(b => <Choice key={b} on={s.backup === b} onClick={() => set({ backup:s.backup === b ? '' : b })}>{b}</Choice>)}
        </div>
        <p className="mt-2 text-fine text-ink-2">If they get upset, that is not proof you did something wrong.</p>
      </fieldset>
      {s.who === 'partner' && <Consent compact/>}
      <Row>
        <Action kind="quiet" onClick={() => set({ step:2 })}>Back</Action>
        <Action onClick={() => set({ step:4, round:0, picks:[] })} disabled={!s.style}>Next: practice</Action>
      </Row>
    </>
  )
}

function Practice({ s, set, g }) {
  const lines = pushbackFor(s.who)
  const pick = s.picks[s.round]
  const hold = s.who === 'adult'
    ? `"I understand. I still can't do that, and I'm happy to talk about other options."`
    : `"${noLine('repeat', s.ask)}"`
  const options = REPLIES.map(r => ({ ...r, text:r.kind === 'hold' ? hold : r.text }))
  const order = [[0, 1, 2], [1, 0, 2], [2, 1, 0]][s.round % 3]
  const chosen = pick ? options.find(o => o.kind === pick) : null
  const last = s.round === lines.length - 1
  const choose = (kind, e) => {
    if (pick) return
    const picks = [...s.picks]; picks[s.round] = kind; set({ picks })
    if (kind === 'hold') g.hit(10, e, { sound:'good' }); else g.cue('turn')
  }
  const done = () => {
    set({ step:5 })
    const held = s.picks.filter(p => p === 'hold').length
    g.finish({ complete:true, marks: held === lines.length ? ['script', 'clean'] : ['script'] })
  }
  return (
    <>
      <StepHead n={4} of={STEPS} title={`Pushback, round ${s.round + 1} of ${lines.length}`}/>
      <Sheet>
        <div key={s.round} className={cn(!g.reduced && 'g-card')}>
        <p className="text-fine font-semibold text-ink-2">They say</p>
        <p className="mt-1 font-display text-row font-bold tracking-tight text-ink">{lines[s.round]}</p>
        <p className="mt-4 text-fine font-semibold text-ink-2">You say</p>
        <div role="group" aria-label="Replies" className="mt-2 grid gap-2">
          {order.map(i => options[i]).map(o => (
            <Answer key={o.kind} state={answerState({ id:o.kind }, pick, 'hold')} reduced={g.reduced}
              onClick={e => choose(o.kind, e)}>{o.text}</Answer>
          ))}
        </div>
        {chosen && (
          <div className={cn('mt-3 rounded-[12px] p-3', chosen.kind === 'hold' ? 'bg-accent-wash' : 'bg-warn-wash')} role="status">
            <p className="kit-ink font-display text-ui font-bold">
              {chosen.kind === 'hold' ? 'You held your line' : chosen.kind === 'explain' ? 'Over-explaining' : 'Gave in'}
            </p>
            <p className="mt-1 text-ui text-ink">{chosen.why}</p>
          </div>
        )}
        </div>
      </Sheet>
      {s.who === 'partner' && <Consent compact/>}
      <Row>
        <Action kind="quiet" onClick={() => s.round ? set({ round:s.round - 1 }) : set({ step:3 })}>Back</Action>
        <Action disabled={!pick} onClick={() => last ? done() : set({ round:s.round + 1 })}>
          {last ? 'Finish' : 'Next round'}
        </Action>
      </Row>
    </>
  )
}

function Mine({ list, setList, open = false }) {
  if (!list.length) return null
  return (
    <details open={open} className="mt-6 rounded-[14px] border border-rule bg-card p-3">
      <summary className="min-h-[44px] cursor-pointer py-2 font-display text-ui font-bold text-ink">
        My boundaries ({list.length})
      </summary>
      <ul className="mt-2 grid gap-2">
        {list.map(x => (
          <li key={x.id} className="kit-ground flex items-start gap-2 rounded-[12px] p-3">
            <div className="min-w-0 flex-1">
              <p className="text-fine text-ink-2">With {lower(x.who)}{x.backup ? `. Back-up: ${lower(x.backup)}` : ''}</p>
              <p className="mt-1 text-ui font-semibold text-ink">{x.line}</p>
            </div>
            <button type="button" aria-label="Delete this boundary" onClick={() => setList(list.filter(y => y.id !== x.id))}
              className="kit-quiet grid size-11 shrink-0 place-items-center rounded-[12px]">
              <Bin aria-hidden className="size-4"/>
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}

function Finish({ s, onExit, again, list, setList, g }) {
  const line = noLine(s.style, s.ask, s)
  const who = WHO.find(w => w.id === s.who)
  const held = s.picks.filter(p => p === 'hold').length
  const isSaved = list.some(x => x.line === line && x.who === who.label)
  const add = () => setList([{ id:Date.now(), who:who.label, line, backup:s.backup }, ...list].slice(0, 40))
  return (
    <>
      <StepHead n={0} of={0} title="Your boundary"/>
      {g.result && (
        <EndCard className="mb-4" game={g} title={held === s.picks.length ? 'Held every round' : 'Boundary built'}
          againLabel="Start again" onAgain={again} onDone={leave(onExit)}
          stats={[['Rounds held', `${held} of ${s.picks.length}`], ['Back-up', s.backup || 'None picked']]}/>
      )}
      <Result>
        <p className="text-fine font-semibold text-ink-2">With {lower(who.label)}</p>
        <p className="mt-1 font-display text-row font-bold tracking-tight text-ink">{line}</p>
        <p className="mt-3 text-ui text-ink">You held your line in {held} of {s.picks.length} rounds.
          {held < s.picks.length ? ' Saying it one more time gets easier with practice.' : ''}</p>
        {s.backup && <p className="mt-1 text-ui text-ink">If it gets hard: text {lower(s.backup)}.</p>}
      </Result>
      {s.who === 'partner' && <Consent/>}
      <Row>
        <Action onClick={add} disabled={isSaved}>{isSaved ? 'Added to my boundaries' : 'Add to my boundaries'}</Action>
        <CopyButton text={line} label="Copy line"/>
      </Row>
      <Row className="mt-3">
        <Done onExit={onExit}/>
        <Action kind="quiet" onClick={again}>Start again</Action>
      </Row>
      <Mine list={list} setList={setList} open/>
    </>
  )
}

export default function SayNo({ onExit }) {
  const g = useSkill(ID)
  const [s, setS] = React.useState(blank)
  const [list, setListState] = React.useState(() => {
    const v = readStore(ID, { list:[] }); return Array.isArray(v?.list) ? v.list : []
  })
  const setList = l => { setListState(l); writeStore(ID, { list:l }) }
  const set = patch => setS(prev => ({ ...prev, ...patch }))
  return (
    <Screen id={ID} family="lilac" title="Saying No" icon={<NoIcon/>} onExit={onExit}>
      {s.step === 1 && <Intro problem="Saying no to friends, dates or adults can feel like risking your place."
        doing="Build a firm, kind no, practice it against pushback, and keep a list."/>}
      <Quest game={g} body="mt-5" goal="Build a firm, kind no and hold it for three rounds."
        steps={['Who is asking', 'What to say no to', 'How to say it', 'Pushback']} at={s.step - 1}>
      {s.step === 1 && <Who s={s} set={set}/>}
      {s.step === 2 && <What s={s} set={set}/>}
      {s.step === 3 && <How s={s} set={set}/>}
      {s.step === 4 && <Practice s={s} set={set} g={g}/>}
      {s.step === 5 && <Finish s={s} onExit={onExit} again={() => { setS(blank); g.reset() }} list={list} setList={setList} g={g}/>}
      </Quest>
      {s.step === 1 && <Mine list={list} setList={setList}/>}
      <Local/>
    </Screen>
  )
}
