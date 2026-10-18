import React from 'react'
import { cn } from '../../lib/utils'
import { useReduced } from '../../toolkit/useReduced'
import { StressIcon } from './icons'
import { LifeScreen, Sections, Heading, Lead, Panel, Tick, Field, Figure, CopyButton,
         Action, Choice, useStored, uid } from './parts'
import { checkinSuggest, burnoutResult, BURNOUT_ITEMS, todayISO } from './logic'
import { EndCard, FillRing } from '../../toolkit/game'
import { useSkill, Quest, Win, leave } from '../../toolkit/game/skill'

/* Overwhelm Reset: a 60 second body check-in, quick body-based exercises
 * (with links to the toolkit's breathing and grounding tools), an early
 * burnout signs check and a self-care routine. No diagnosis. Saved under
 * `mindmap.skills.life-stress`. */

const ID = 'life-stress'

/* ── Exercises ─────────────────────────────────────────────────────────── */

export const EXERCISES = {
  shoulders: { name:'Shoulder drop', time:'30 sec', steps:[
    'Breathe in and lift your shoulders up toward your ears.', 'Hold for 5 seconds.',
    'Breathe out and let them drop. Notice the difference.', 'Do it 3 times.'] },
  jaw: { name:'Jaw release', time:'30 sec', steps:[
    'Let your teeth come apart and your tongue rest low in your mouth.',
    'Put your fingertips just in front of your ears and make slow small circles for 20 seconds.',
    'Open your mouth wide, gently, then close it. Do it 3 times.'] },
  hands: { name:'Squeeze and let go', time:'45 sec', steps:[
    'Make tight fists for 5 seconds.', 'Let go and feel your hands for 10 seconds.', 'Do it 3 times.',
    'Then press your palms together hard for 5 seconds and let go.'] },
  breathing: { name:'Longer out-breath', time:'1 min', link:['toolkit-breathing', 'Open Box Breathing'], steps:[
    'Breathe in through your nose for a count of 4.', 'Breathe out slowly through your mouth for a count of 6.',
    'Keep going for about 1 minute.', 'If you feel dizzy, stop and breathe normally.'] },
  ground: { name:'5-4-3-2-1 grounding', time:'2 min', link:['toolkit-ground', 'Open 5-4-3-2-1 Grounding'], steps:[
    'Name 5 things you can see.', '4 things you can feel, like your feet on the floor.', '3 things you can hear.',
    '2 things you can smell.', '1 thing you can taste.'] },
  feet: { name:'Feet on the floor', time:'30 sec', steps:[
    'Sit with both feet flat on the floor.', 'Press down through your heels for 10 seconds.',
    'Let go and notice the weight of your body in the chair.', 'Do it 3 times.'] },
  cool: { name:'Cool water', time:'30 sec', steps:[
    'Run cool water over your wrists, or splash your face.', 'Breathe out slowly while you do it.'] },
}

function Exercise({ id, did, onDid, g }) {
  const x = EXERCISES[id]
  return (
    <article className="rounded-[14px] border border-rule bg-card p-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-display text-ui font-bold text-ink">{x.name}</h4>
        <span className="shrink-0 text-fine text-ink-2">{x.time}</span>
      </div>
      <ol className="mt-1.5 list-decimal pl-5 text-ui text-ink">{x.steps.map(s => <li key={s} className="mt-0.5">{s}</li>)}</ol>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Tick checked={did} onChange={v => { if (v && g) g.add(10, { x:50, y:50, sound:'good' }); onDid(v) }} className="pr-3">I did it</Tick>
        {x.link && (
          <a href={'#/' + x.link[0]} className="kit-quiet inline-flex min-h-[48px] items-center rounded-[12px] px-4
            font-display text-ui font-bold">{x.link[1]}</a>
        )}
      </div>
    </article>
  )
}

/* ── 60 second check-in ────────────────────────────────────────────────── */

const PARTS = [['jaw', 'Jaw'], ['shoulders', 'Shoulders'], ['chest', 'Chest'], ['breath', 'Fast or shallow breathing'],
  ['stomach', 'Stomach'], ['hands', 'Hands'], ['mind', 'Racing thoughts']]
const ENERGY = [['low', 'Low'], ['ok', 'OK'], ['wired', 'Wired']]

function CheckIn({ data, patch, go, g, win }) {
  const c = data.checkin || { tight:[], energy:'' }
  const [secs, setSecs] = React.useState(null)
  const [done, setDone] = React.useState(false)
  const reduced = useReduced()
  React.useEffect(() => {
    if (secs == null || secs <= 0) return
    const t = setTimeout(() => setSecs(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secs])
  const toggle = p => patch('checkin', { ...c, tight: c.tight.includes(p) ? c.tight.filter(x => x !== p) : [...c.tight, p] })
  const picks = checkinSuggest(c.tight)
  const ticks = data.did || {}
  return (
    <>
      <Panel>
        <Heading>60 second body check-in</Heading>
        <Lead>Sit still. Move your attention from your head down to your hands. Tap any part that feels tight, tense or uneasy.</Lead>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {secs == null || secs <= 0
            ? <Action onClick={() => { setSecs(60); setDone(false) }}>{secs === 0 ? 'Run the timer again' : 'Start 60 seconds'}</Action>
            : <Action kind="quiet" onClick={() => setSecs(null)}>Stop timer</Action>}
          <p className="font-display text-num font-bold tabular-nums text-ink" aria-live={secs === 0 ? 'polite' : 'off'}>
            {secs == null ? '' : secs > 0 ? `0:${String(secs).padStart(2, '0')}` : 'Time.'}
          </p>
        </div>
        {secs != null && secs > 0 && (
          <div aria-hidden className="mt-3 flex justify-center" style={{ '--g-main':'var(--kit-art)' }}>
            <FillRing value={(60 - secs) / 60} className="w-32">
              <span className="font-display text-num font-bold tabular-nums text-ink">{secs}</span>
            </FillRing>
          </div>
        )}
        <p className="mt-4 font-display text-ui font-semibold text-ink">Where do you feel it?</p>
        <div role="group" aria-label="Tight or tense parts" className="mt-2 flex flex-wrap gap-2">
          {PARTS.map(([id, n]) => <Choice key={id} on={c.tight.includes(id)} onClick={() => toggle(id)}>{n}</Choice>)}
        </div>
        <p className="mt-4 font-display text-ui font-semibold text-ink">Energy right now</p>
        <div role="group" aria-label="Energy" className="mt-2 flex flex-wrap gap-2">
          {ENERGY.map(([id, n]) => <Choice key={id} on={c.energy === id} onClick={() => patch('checkin', { ...c, energy:id })}>{n}</Choice>)}
        </div>
        <Action className="mt-4 w-full sm:w-auto" onClick={() => { setDone(true); setSecs(null) }}>See what might help</Action>
      </Panel>
      {done && (
        <Panel>
          <Heading>Try this next</Heading>
          <Lead>{c.tight.length ? `You noticed ${c.tight.length} ${c.tight.length === 1 ? 'spot' : 'spots'}. Start with the first card.`
            : 'Nothing felt tight. Grounding is a good way to stay steady.'}
            {c.energy === 'low' && ' Low energy can mean you need rest or food more than an exercise.'}
          </Lead>
          <div className="mt-3 grid gap-3">
            {picks.map(id => <Exercise key={id} id={id} g={g} did={ticks[id]} onDid={v => patch('did', { ...ticks, [id]: v })}/>)}
          </div>
          {picks.some(id => ticks[id]) && !g.result && (
            <div className="mt-3 grid gap-3">
              <Win reduced={g.reduced}>One small thing done. Notice how your body feels now.</Win>
              <Action className="sm:w-fit" onClick={() => win('Reset done', [['Spots noticed', c.tight.length],
                ['Resets done', picks.filter(id => ticks[id]).length]])}>Finish my reset</Action>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            <Action kind="quiet" onClick={() => go('reset')}>More exercises</Action>
            <Action kind="quiet" onClick={() => { patch('checkin', { tight:[], energy:'' }); patch('did', {}); setDone(false) }}>Start again</Action>
          </div>
        </Panel>
      )}
    </>
  )
}

function Reset({ data, patch, g, win }) {
  const ticks = data.did || {}
  const n = Object.values(ticks).filter(Boolean).length
  return (
    <Panel>
      <Heading>Quick body reset</Heading>
      <Lead>Stress shows up in the body too. Each one takes under 2 minutes. Stop any that hurts.</Lead>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {Object.keys(EXERCISES).map(id => <Exercise key={id} id={id} g={g} did={ticks[id]} onDid={v => patch('did', { ...ticks, [id]: v })}/>)}
      </div>
      <p className="mt-3 text-ui text-ink" role="status">{n ? `${n} done. Notice how your body feels now.` : 'Tick each one you try.'}</p>
      {n > 0 && !g.result && <Action className="mt-3 sm:w-fit" onClick={() => win('Body reset done', [['Resets done', n]])}>Finish my reset</Action>}
      {n > 0 && <Action kind="quiet" className="mt-2" onClick={() => patch('did', {})}>Start again</Action>}
    </Panel>
  )
}

/* ── Burnout signs ─────────────────────────────────────────────────────── */

const SIGNS = [
  'I feel tired even after a full night\'s sleep.',
  'Things I used to enjoy feel like a chore.',
  'I get headaches or stomach aches more than usual.',
  'I snap at people more easily.',
  'I cannot focus, even on easy things.',
  'I feel like nothing I do is good enough.',
  'I am pulling away from friends or family.',
  'My sleep or eating has changed a lot.',
]
const SCALE = [[0, 'Not really'], [1, 'Sometimes'], [2, 'Often']]
const RESULT = {
  low: { title:'A few signs right now', say:'Keep doing what is working. A steady routine helps you notice early if that changes.',
    steps:['Keep a regular bedtime.', 'Build your routine in the Routine section.', 'Check in again in a couple of weeks.'] },
  some: { title:'Some signs of being stretched thin', say:'This is common when a lot changes at once. Small changes this week can help.',
    steps:['Pick one thing to drop, move or ask help with this week.', 'Protect sleep: same bedtime, phone away 30 minutes before.',
      'Take one 10 minute break a day that is not a screen or a task.', 'Tell one person you trust how you are really doing.'] },
  high: { title:'A lot of signs. Please do not handle this alone.', say:'Please talk to a trusted adult this week: a parent, school counselor, coach or your doctor. Show them this list if it is easier than saying it.',
    steps:['Choose who you will talk to and when.', 'Drop or postpone one thing on your list today.', 'Protect sleep and eat regular meals.',
      'If body symptoms like headaches or stomach aches keep going, see a doctor.'] },
}

function Burnout({ data, patch }) {
  const a = data.signs || Array(BURNOUT_ITEMS).fill(null)
  const r = burnoutResult(a)
  const [show, setShow] = React.useState(r.complete)
  const set = (i, v) => { patch('signs', a.map((x, k) => k === i ? v : x)); setShow(false) }
  const R = RESULT[r.level]
  return (
    <>
      <Panel>
        <Heading>Early burnout signs</Heading>
        <Lead>Over the last two weeks, how often has this been true? This is a check-in, not a test or a diagnosis.</Lead>
        <ol className="mt-3 grid gap-3">
          {SIGNS.map((s, i) => (
            <li key={s} className="rounded-[12px] border border-rule p-3">
              <p className="text-ui font-semibold text-ink">{s}</p>
              <div role="group" aria-label={s} className="mt-2 flex flex-wrap gap-2">
                {SCALE.map(([v, n]) => <Choice key={v} on={a[i] === v} onClick={() => set(i, v)}>{n}</Choice>)}
              </div>
            </li>
          ))}
        </ol>
        <Action className="mt-3 w-full sm:w-auto" disabled={!r.complete} onClick={() => setShow(true)}>
          {r.complete ? 'See where to start' : `${a.filter(x => x != null).length} of ${BURNOUT_ITEMS} answered`}
        </Action>
      </Panel>
      {show && r.complete && (
        <Panel>
          <Heading>{R.title}</Heading>
          <p className="mt-1 text-ui text-ink">{R.say}</p>
          <ul className="mt-3 grid gap-1.5">
            {R.steps.map(s => <li key={s} className="kit-ground rounded-[12px] px-3 py-2.5 text-ui text-ink">{s}</li>)}
          </ul>
          <Action kind="quiet" className="mt-3" onClick={() => { patch('signs', Array(BURNOUT_ITEMS).fill(null)); setShow(false) }}>Start again</Action>
        </Panel>
      )}
      <p className="mt-4 rounded-[12px] border-2 border-[#a11b1b] bg-card p-3 text-ui text-ink">
        <b className="font-display">If you feel unsafe or think about hurting yourself</b>, call or text <a className="font-bold underline" href="tel:988">988</a> (Suicide
        and Crisis Lifeline, US) or call your local emergency number now. You can also tell any adult you trust.
      </p>
    </>
  )
}

/* ── Routine builder ───────────────────────────────────────────────────── */

const SLOTS = [
  ['morning', 'Morning', ['Drink a glass of water', 'Open the curtains or step outside', 'Eat something before school', 'Stretch for 2 minutes']],
  ['after', 'After school', ['Snack and a 10 minute break before homework', 'Move: walk, sport or dance', 'Message or see a friend', 'Write tomorrow\'s top 3 tasks']],
  ['night', 'Night', ['Phone away 30 minutes before bed', 'Same bedtime each night', 'Shower or wash up', 'Write down one good thing from today']],
]

function Routine({ data, patch, g, win }) {
  const r = data.routine || { morning:[], after:[], night:[] }
  const today = todayISO()
  const ticks = data.rDay === today ? (data.rTicks || {}) : {}
  const [own, setOwn] = React.useState({ morning:'', after:'', night:'' })
  const toggle = (slot, item) => patch('routine', { ...r, [slot]: r[slot].includes(item) ? r[slot].filter(x => x !== item) : [...r[slot], item] })
  const addOwn = slot => { const v = own[slot].trim(); if (!v) return; if (!r[slot].includes(v)) toggle(slot, v); setOwn({ ...own, [slot]: '' }) }
  const total = SLOTS.reduce((t, [k]) => t + r[k].length, 0)
  const done = SLOTS.reduce((t, [k]) => t + r[k].filter(x => ticks[k + ':' + x]).length, 0)
  const tick = (key, v) => { patch('rDay', today); patch('rTicks', { ...ticks, [key]: v }) }
  const text = SLOTS.filter(([k]) => r[k].length).map(([k, n]) => `${n}:\n${r[k].map(x => '- ' + x).join('\n')}`).join('\n\n')
  return (
    <>
      <Panel>
        <Heading>Build a self-care routine</Heading>
        <Lead>Pick two or three small things for each part of the day. Small habits are easier to keep.</Lead>
        {SLOTS.map(([k, name, ideas]) => (
          <div key={k} className="mt-4">
            <p className="font-display text-ui font-bold text-ink">{name}</p>
            <div role="group" aria-label={name} className="mt-2 flex flex-wrap gap-2">
              {[...ideas, ...r[k].filter(x => !ideas.includes(x))].map(i =>
                <Choice key={i} className="py-2" on={r[k].includes(i)} onClick={() => toggle(k, i)}>{i}</Choice>)}
            </div>
            <form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); addOwn(k) }}>
              <label className="min-w-0 flex-1">
                <span className="sr-only">Add your own for {name}</span>
                <input className={cn('block w-full rounded-[12px] border border-rule bg-card p-3 text-ui text-ink shadow-card placeholder:text-ink-3')}
                  value={own[k]} onChange={e => setOwn({ ...own, [k]: e.target.value })} placeholder="Add your own"/>
              </label>
              <Action kind="quiet" type="submit" disabled={!own[k].trim()}>Add</Action>
            </form>
          </div>
        ))}
      </Panel>
      <Panel>
        <Heading>My routine</Heading>
        {total === 0 ? <Lead>Pick something above and it shows here.</Lead> : (
          <>
            <Lead>Tick what you did today. Ticks clear tomorrow. Missing a day is fine.</Lead>
            {SLOTS.filter(([k]) => r[k].length).map(([k, n]) => (
              <div key={k} className="mt-3">
                <p className="text-fine font-semibold text-ink-2">{n}</p>
                <ul className="grid gap-0.5">
                  {r[k].map(x => <li key={x}><Tick checked={ticks[k + ':' + x]} onChange={v => tick(k + ':' + x, v)}>{x}</Tick></li>)}
                </ul>
              </div>
            ))}
            <Figure className="mt-3" label="Today" value={`${done} of ${total}`}/>
            <div className="mt-3 flex flex-wrap gap-3">
              {!g.result && <Action onClick={() => win('Routine saved', [['Small things', total],
                ['Parts of the day', SLOTS.filter(([k]) => r[k].length).length]], ['plan'])}>Save my routine</Action>}
              <CopyButton text={text} label="Copy routine"/>
              <Action kind="quiet" onClick={() => { patch('routine', { morning:[], after:[], night:[] }); patch('rTicks', {}) }}>Start again</Action>
            </div>
          </>
        )}
      </Panel>
    </>
  )
}

const TABS = [['check', 'Check-in'], ['reset', 'Body reset'], ['burnout', 'Burnout signs'], ['routine', 'Routine']]

const GOALS = {
  check:   'Notice where you feel stress in your body, then do one small thing.',
  reset:   'Try one body reset and notice the difference.',
  routine: 'Build a small routine you can keep. Missing a day is fine.',
}

export default function LifeStress({ onExit }) {
  const g = useSkill(ID)
  const [end, setEnd] = React.useState(null)
  const [data, patch] = useStored(ID, { tab:'check' })
  const tab = data.tab || 'check'
  const win = (title, stats, marks = []) => { setEnd({ title, stats }); g.finish({ complete:true, marks }); window.scrollTo(0, 0) }
  const again = () => { setEnd(null); g.reset() }
  const go = v => { patch('tab', v); again() }
  return (
    <LifeScreen id={ID} family="sky" title="Overwhelm Reset" icon={StressIcon} onExit={onExit}
      problem="For when changes in life, your body or what people expect pile up and you feel stuck."
      doing="Check in with your body for a minute, then do one small thing that helps.">
      <Sections label="Reset tools" items={TABS} value={tab} onChange={go}/>
      {tab === 'burnout' ? <Burnout data={data} patch={patch}/> : (
        <Quest className="mt-4" game={g} goal={GOALS[tab]} body="">
          {end && g.result && (
            <EndCard className="mt-4" game={g} title={end.title} stats={end.stats} againLabel="Keep going"
              onAgain={again} onDone={leave(onExit)}/>
          )}
          {tab === 'check' && <CheckIn data={data} patch={patch} go={go} g={g} win={win}/>}
          {tab === 'reset' && <Reset data={data} patch={patch} g={g} win={win}/>}
          {tab === 'routine' && <Routine data={data} patch={patch} g={g} win={win}/>}
        </Quest>
      )}
    </LifeScreen>
  )
}
