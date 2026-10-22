import React from 'react'
import { cn } from '../../lib/utils'
import { META } from './meta'
import { Screen, Sheet, H, Steps, Field, CopyBlock, Tick, Finish, Nav, Choice, Chips, Action, useSaved, uid } from './parts'
import { STRENGTHS, WIN_PROMPTS, topStrengths, listOf, KINDS, advocacyScript, INITIATIVES } from './belong-logic'
import { EndCard } from '../../toolkit/game'
import { useSkill, Quest, leave } from '../../toolkit/game/skill'

const TOOL = META.belong
const STEPS = [['wins', 'Wins'], ['strengths', 'Traits'], ['ask', 'Ask'], ['try', 'Try'], ['done', 'Result']]
const ORDER = STEPS.map(s => s[0])
const BLANK = { stage:'wins', reached:0, wins:[], at:0, kind:'help', a:{}, init:'', own:'', worst:'', best:'', backup:'', did:false }

export default function Belong({ onExit }) {
  const g = useSkill(TOOL.id)
  const [s, patch, set] = useSaved(TOOL.id, BLANK)
  const [win, setWin] = React.useState('')
  const go = stage => patch(o => ({ stage, reached: Math.max(o.reached, ORDER.indexOf(stage)) }))
  const top = topStrengths(s.wins)
  const at = Math.min(s.at, Math.max(0, s.wins.length - 1))
  const cur = s.wins[at]
  const initiative = s.own.trim() || s.init
  const script = advocacyScript({ kind:s.kind, ...s.a, strength: top[0]?.trait })

  const add = e => {
    e.preventDefault()
    if (!win.trim()) return
    g.hit(10, e.currentTarget.querySelector('button[type=submit]') || e, { label:'win', sound:'good' })
    patch(o => ({ wins: [...o.wins, { id:uid(), text:win.trim(), strengths:[] }].slice(-40) }))
    setWin('')
  }
  const tag = (id, e) => {
    if (e && cur && !cur.strengths.includes(id)) g.hit(3, e)
    patch(o => ({ wins: o.wins.map((w, i) => i !== at ? w :
    { ...w, strengths: w.strengths.includes(id) ? w.strengths.filter(x => x !== id) : [...w.strengths, id] }) }))
  }
  const finish = () => { go('done'); g.finish({ complete:true, marks:['plan'] }) }
  const setA = k => e => patch(o => ({ a:{ ...o.a, [k]:e.target.value } }))

  return (
    <Screen tool={TOOL} onExit={onExit}
      problem="For when a new team, class or job makes you feel like you do not fit in."
      doing="List your real wins, see the strengths they show, write one request, and plan one small step.">
      <Quest game={g} goal="List real wins, see the strengths they show, and plan one step.">
      <Steps steps={STEPS} at={s.stage} reached={s.reached} onGo={go}/>

      {s.stage === 'wins' && (
        <>
          <Sheet>
            <H>Your wins log</H>
            <p className="mt-1 text-fine text-ink-2">Real things you did. Small counts. Ideas: {WIN_PROMPTS.join(', ').toLowerCase()}.</p>
            <form onSubmit={add} className="mt-3 flex flex-wrap items-end gap-2">
              <Field className="min-w-0 flex-1 basis-56" label="A win" placeholder="Fixed the club printer before the bake sale"
                value={win} onChange={e => setWin(e.target.value)}/>
              <Action type="submit" disabled={!win.trim()}>Add</Action>
            </form>
            {s.wins.length > 0 && (
              <ul className="m-0 mt-4 grid list-none gap-2 p-0">
                {s.wins.map(w => (
                  <li key={w.id} className="kit-ground flex items-center gap-2 rounded-[12px] p-2 pl-3">
                    <span className="min-w-0 flex-1 text-sec text-ink">{w.text}</span>
                    <button type="button" aria-label={`Remove ${w.text}`}
                      onClick={() => patch(o => ({ wins: o.wins.filter(x => x.id !== w.id) }))}
                      className="kit-quiet min-h-[44px] shrink-0 rounded-[10px] px-3 font-display text-fine font-bold">Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </Sheet>
          <Nav next={() => go('strengths')} disabled={!s.wins.length}
            nextLabel={s.wins.length ? `Find my strengths (${s.wins.length})` : 'Add a win first'}/>
        </>
      )}

      {s.stage === 'strengths' && cur && (
        <>
          <Sheet>
            <p className="text-fine font-semibold text-ink-2">Win {at + 1} of {s.wins.length}</p>
            <p className="mt-1 font-display text-row font-bold text-ink">{cur.text}</p>
            <p className="mt-3 text-fine text-ink-2">What does this show about you? Pick any that are true.</p>
            <Chips className="mt-2">
              {STRENGTHS.map(k => <Choice key={k.id} on={cur.strengths.includes(k.id)} onClick={e => tag(k.id, e)}>{k.name}</Choice>)}
            </Chips>
            <div className="mt-4 flex flex-wrap gap-3">
              {at < s.wins.length - 1
                ? <Action onClick={() => patch({ at: at + 1 })}>Next win</Action>
                : <Action onClick={() => go('ask')}>Write my ask</Action>}
              {at > 0 && <Action kind="quiet" onClick={() => patch({ at: at - 1 })}>Previous win</Action>}
            </div>
          </Sheet>
          {top.length > 0 && (
            <Sheet>
              <H>Your top strengths so far</H>
              <ol className="m-0 mt-3 grid list-none gap-2 p-0">
                {top.slice(0, 3).map((t, i) => (
                  <li key={t.id} className="kit-ground rounded-[12px] p-3">
                    <p className="font-display text-ui font-bold text-ink">{i + 1}. {t.name}</p>
                    <p className="text-fine text-ink-2">Shown in {t.count} {t.count === 1 ? 'win' : 'wins'}: {t.wins.join('; ')}</p>
                  </li>
                ))}
              </ol>
            </Sheet>
          )}
        </>
      )}

      {s.stage === 'ask' && (
        <>
          <Sheet>
            <H>Ask for what you need</H>
            <p className="mt-1 text-fine text-ink-2">Asking is a skill you can practise.</p>
            <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="What kind of ask">
              {KINDS.map(k => (
                <Choice key={k.id} on={s.kind === k.id} onClick={() => patch({ kind:k.id })}
                  className="justify-center px-2 text-center text-fine">{k.label}</Choice>
              ))}
            </div>
            <div className="mt-4 grid gap-3">
              <Field label="Who you are asking" placeholder="Ms. Diaz" value={s.a.to || ''} onChange={setA('to')}/>
              <Field label={s.kind === 'credit' ? 'The part you did' : s.kind === 'chance' ? 'What you want to try' : 'What you are working on'}
                placeholder={s.kind === 'credit' ? 'the survey and the chart' : s.kind === 'chance' ? 'leading the next warm up' : 'the budget sheet'}
                value={s.a.what || ''} onChange={setA('what')}/>
              {s.kind === 'help' && (
                <>
                  <Field label="What you already tried" placeholder="the tutorial and the help page" value={s.a.tried || ''} onChange={setA('tried')}/>
                  <Field label="When suits you" placeholder="after lunch today" value={s.a.when || ''} onChange={setA('when')}/>
                </>
              )}
              {s.kind === 'chance' && (
                <div>
                  <p className="font-display text-ui font-semibold text-ink">Your proof</p>
                  <p className="text-fine text-ink-2">Pick a win to mention.{top[0] ? ` Your top strength goes in too: you are ${top[0].trait}.` : ''}</p>
                  <div className="mt-2 grid gap-2">
                    {s.wins.map(w => (
                      <Choice key={w.id} on={s.a.win === w.text} className="w-full"
                        onClick={() => patch(o => ({ a:{ ...o.a, win: o.a.win === w.text ? '' : w.text } }))}>{w.text}</Choice>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Sheet>
          <CopyBlock title="Your script" text={script}/>
          <Nav next={() => go('try')} back={() => go('strengths')} nextLabel="One step this week"/>
        </>
      )}

      {s.stage === 'try' && (
        <>
          <Sheet>
            <H>One small step this week</H>
            <p className="mt-1 text-fine text-ink-2">Pick something small and planned. It is OK if it does not work out.</p>
            <div className="mt-3 grid gap-2">
              {INITIATIVES.map(t => (
                <Choice key={t} on={!s.own.trim() && s.init === t} className="w-full"
                  onClick={() => patch({ init:t, own:'' })}>{t}</Choice>
              ))}
            </div>
            <Field className="mt-3" label="Or your own" placeholder="Ask to sit in on the planning meeting" value={s.own}
              onChange={e => patch({ own:e.target.value })}/>
          </Sheet>
          <Sheet>
            <div className="grid gap-3">
              <Field label="Worst that could really happen" placeholder="They say not this time" value={s.worst} onChange={e => patch({ worst:e.target.value })}/>
              <Field label="If it goes well" placeholder="I get to lead the next one" value={s.best} onChange={e => patch({ best:e.target.value })}/>
              <Field label="My back-up if it goes wrong" placeholder="Ask what I could do first instead" value={s.backup} onChange={e => patch({ backup:e.target.value })}/>
            </div>
          </Sheet>
          <Nav next={finish} back={() => go('ask')} disabled={!initiative} nextLabel="See my summary"/>
        </>
      )}

      {s.stage === 'done' && (
        <>
          {g.result && (
            <EndCard game={g} title="Plan saved" againLabel="Start again, keep my wins" onDone={leave(onExit)}
              onAgain={() => { set({ ...BLANK, wins:s.wins.map(w => ({ ...w })) }); g.reset() }}
              stats={[['Real wins', s.wins.length], ['Top strength', top[0]?.name || 'Tag a win']]}/>
          )}
          <Sheet>
            <p className="text-fine font-semibold text-ink-2">What your wins show</p>
            <H className="mt-1">{s.wins.length} real {s.wins.length === 1 ? 'win' : 'wins'}.{top.length ? ` They show you are ${listOf(top.slice(0, 3).map(t => t.trait))}.` : ''}</H>
            {top.length > 0 && (
              <ul className="m-0 mt-3 grid list-none gap-2 p-0">
                {top.slice(0, 3).map(t => (
                  <li key={t.id} className="kit-ground rounded-[12px] p-3">
                    <p className="font-display text-ui font-bold text-ink">{t.name}</p>
                    <p className="text-fine text-ink-2">{t.wins.join('; ')}</p>
                  </li>
                ))}
              </ul>
            )}
          </Sheet>
          <Sheet>
            <H>This week</H>
            <p className="mt-1 text-sec text-ink">{initiative || 'No step picked yet.'}</p>
            {(s.worst || s.best || s.backup) && (
              <dl className="mt-2 grid gap-1 text-fine text-ink-2">
                {s.worst && <div><dt className="inline font-semibold text-ink">Worst case: </dt><dd className="inline">{s.worst}</dd></div>}
                {s.best && <div><dt className="inline font-semibold text-ink">If it goes well: </dt><dd className="inline">{s.best}</dd></div>}
                {s.backup && <div><dt className="inline font-semibold text-ink">Back-up: </dt><dd className="inline">{s.backup}</dd></div>}
              </dl>
            )}
            {initiative && <Tick className="mt-3" on={s.did} onClick={() => patch(o => ({ did:!o.did }))}>I did it</Tick>}
          </Sheet>
          <CopyBlock title="Your ask" text={script}/>
          {!g.result && <Finish onExit={onExit}
            onAgain={() => { set({ ...BLANK, wins:s.wins.map(w => ({ ...w })) }); g.reset() }} againLabel="Start again, keep my wins"/>}
          <button type="button" onClick={() => { set(BLANK); g.reset() }}
            className={cn('min-h-[44px] justify-self-start font-display text-fine font-semibold text-ink-2 underline underline-offset-4')}>
            Clear everything
          </button>
        </>
      )}
      </Quest>
    </Screen>
  )
}
