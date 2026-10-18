import React from 'react'
import { cn } from '../../lib/utils'
import { HealthIcon } from './icons'
import { LifeScreen, Sections, Heading, Lead, Panel, Checklist, Tick, Field, Figure, CopyButton, Chip,
         RemoveButton, Action, Choice, useStored, uid } from './parts'
import { refillStatus, visitNote, todayISO, niceDate, REFILL_SOON } from './logic'
import { EndCard } from '../../toolkit/game'
import { useSkill, Quest, QuickRound, Win, PlayCard, leave } from '../../toolkit/game/skill'

/* Own Your Health: appointment prep, a medicine list with refill dates,
 * first-aid basics and a "my health info" card. No diagnosis and no dosing
 * advice: doses are copied from the label, and every first-aid card says
 * when to call the emergency number. Saved under `mindmap.skills.life-health`. */

const ID = 'life-health'
const EMERGENCY = 'your local emergency number (911 in the US)'

/* ── Appointment prep ──────────────────────────────────────────────────── */

const BOOK = [
  ['find', 'Find the number: your doctor\'s office, the clinic website, or the back of your insurance card.'],
  ['ready', 'Have ready: your full name, date of birth, insurance card and the reason for the visit.'],
  ['say', 'Say what it is for and how long it has been going on. Ask if they think it is urgent.'],
  ['ask', 'Ask what it will cost, what to bring and whether a parent or guardian needs to come or agree.'],
  ['save', 'Put the date, time and address in your calendar straight away.'],
]
const QUESTIONS = [
  'What do you think is causing this?', 'Do I need any tests?', 'What should I do at home?',
  'What signs mean I should come back or get urgent care?', 'When and how will I get results?',
  'Are there side effects I should watch for?',
]

function Visit({ data, patch, g, win }) {
  const v = { questions: [], ...(data.visit || {}) }
  const set = (k, val) => patch('visit', { ...v, [k]: val })
  const [own, setOwn] = React.useState('')
  const toggleQ = q => set('questions', v.questions.includes(q) ? v.questions.filter(x => x !== q) : [...v.questions, q])
  const note = visitNote(v)
  return (
    <>
      <Panel>
        <Heading>How to book</Heading>
        <Checklist items={BOOK} ticks={data.book || {}} onTick={t => patch('book', t)}/>
      </Panel>
      <Panel>
        <Heading>What is going on</Heading>
        <Lead>Visits are short. A note helps you remember everything.</Lead>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Reason for the visit" value={v.reason || ''} onChange={e => set('reason', e.target.value)} placeholder="Knee pain after running"/>
          <Field label="When it started" value={v.started || ''} onChange={e => set('started', e.target.value)} placeholder="About 2 weeks ago"/>
          <Field label="Where, and what it feels like" value={v.feels || ''} onChange={e => set('feels', e.target.value)} placeholder="Sharp, front of left knee"/>
          <Field label="What makes it better" value={v.better || ''} onChange={e => set('better', e.target.value)}/>
          <Field label="What makes it worse" value={v.worse || ''} onChange={e => set('worse', e.target.value)}/>
          <Field label="What you have tried" value={v.tried || ''} onChange={e => set('tried', e.target.value)}/>
        </div>
        <Field className="mt-3" label="Medicines you take" hint="Include ones bought without a prescription and supplements."
          value={v.meds || ''} onChange={e => set('meds', e.target.value)}/>
      </Panel>
      <Panel>
        <Heading>Questions to ask</Heading>
        <div role="group" aria-label="Questions" className="mt-3 flex flex-wrap gap-2">
          {[...QUESTIONS, ...v.questions.filter(q => !QUESTIONS.includes(q))].map(q =>
            <Choice key={q} className="py-2" on={v.questions.includes(q)} onClick={() => toggleQ(q)}>{q}</Choice>)}
        </div>
        <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); const q = own.trim(); if (q && !v.questions.includes(q)) toggleQ(q); setOwn('') }}>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Your own question</span>
            <input className="block w-full rounded-[12px] border border-rule bg-card p-3 text-ui text-ink shadow-card placeholder:text-ink-3"
              value={own} onChange={e => setOwn(e.target.value)} placeholder="Add your own question"/>
          </label>
          <Action kind="quiet" type="submit" disabled={!own.trim()}>Add</Action>
        </form>
      </Panel>
      <Panel>
        <Heading>Your visit note</Heading>
        {note
          ? <pre className="mt-3 whitespace-pre-wrap rounded-[12px] bg-mist/60 p-3 font-body text-ui text-ink">{note}</pre>
          : <Lead>Fill in anything above and your note builds here, ready to read out or show.</Lead>}
        {note && v.questions.length > 0 && !g.result && (
          <div className="mt-3 grid gap-3">
            <Win reduced={g.reduced}>Your note is ready to read out or show.</Win>
            <Action className="sm:w-fit" onClick={() => win('Visit note ready', [['Questions to ask', v.questions.length],
              ['Booking steps done', `${BOOK.filter(([k]) => (data.book || {})[k]).length} of ${BOOK.length}`]])}>My note is ready</Action>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-3">
          <CopyButton text={note} label="Copy note"/>
          <Action kind="quiet" onClick={() => { patch('visit', {}); patch('book', {}) }}>Start again</Action>
        </div>
      </Panel>
    </>
  )
}

/* ── Medicines ─────────────────────────────────────────────────────────── */

const TIMES = [['morning', 'Morning'], ['midday', 'Midday'], ['evening', 'Evening'], ['bedtime', 'Bedtime'], ['needed', 'Only when needed']]
const BLANK = { name:'', dose:'', times:[], refill:'', by:'' }

function Meds({ data, patch }) {
  const list = data.meds || []
  const [d, setD] = React.useState(BLANK)
  const today = todayISO()
  const add = e => {
    e.preventDefault()
    if (!d.name.trim()) return
    patch('meds', [...list, { ...d, id: uid(), name: d.name.trim() }])
    setD(BLANK)
  }
  const due = list.map(m => [m, refillStatus(m.refill, today)]).filter(([, s]) => s.state === 'soon' || s.state === 'overdue')
  return (
    <>
      <p className="mt-4 rounded-[12px] border-2 kit-edge bg-card p-3 text-ui text-ink">
        Take every medicine exactly as your prescriber and pharmacist told you. This list does not give dosing advice.
        Any question about a dose, a missed dose or mixing medicines goes to your pharmacist or doctor.
      </p>
      <Panel>
        <Heading>Add a medicine</Heading>
        <form onSubmit={add} className="mt-3 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={d.name} onChange={e => setD({ ...d, name: e.target.value })} placeholder="As on the label"/>
            <Field label="Dose, as written on the label" value={d.dose} onChange={e => setD({ ...d, dose: e.target.value })} placeholder="Copy it exactly"/>
            <Field label="Refill by" type="date" value={d.refill} onChange={e => setD({ ...d, refill: e.target.value })}/>
            <Field label="Prescribed by (optional)" value={d.by} onChange={e => setD({ ...d, by: e.target.value })}/>
          </div>
          <div>
            <p className="font-display text-ui font-semibold text-ink">When, as the label says</p>
            <div role="group" aria-label="Times" className="mt-2 flex flex-wrap gap-2">
              {TIMES.map(([k, n]) => (
                <Choice key={k} on={d.times.includes(k)}
                  onClick={() => setD({ ...d, times: d.times.includes(k) ? d.times.filter(x => x !== k) : [...d.times, k] })}>{n}</Choice>
              ))}
            </div>
          </div>
          <Action type="submit" className="sm:w-fit" disabled={!d.name.trim()}>Add to my list</Action>
        </form>
      </Panel>
      <Panel>
        <Heading>Refill reminders</Heading>
        {due.length === 0
          ? <Lead>No refills due in the next {REFILL_SOON} days.</Lead>
          : <ul className="mt-2 grid gap-2">{due.map(([m, s]) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 text-ui text-ink">
                <Chip state={s.state}>{s.state === 'overdue' ? 'Overdue' : s.days === 0 ? 'Today' : `In ${s.days} ${s.days === 1 ? 'day' : 'days'}`}</Chip>
                {m.name}: call the pharmacy or use its app.
              </li>))}
            </ul>}
      </Panel>
      <Panel>
        <Heading>My medicines</Heading>
        {list.length === 0 ? <Lead>Nothing added yet.</Lead> : (
          <ul className="mt-2 divide-y divide-rule">
            {list.map(m => {
              const s = refillStatus(m.refill, today)
              return (
                <li key={m.id} className="flex items-start gap-2 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-ui font-bold text-ink">{m.name}</p>
                    {m.dose && <p className="text-ui text-ink">{m.dose}</p>}
                    <p className="text-fine text-ink-2">
                      {m.times.length ? TIMES.filter(([k]) => m.times.includes(k)).map(x => x[1]).join(', ') : 'No times set'}
                      {m.refill ? `. Refill by ${niceDate(m.refill)}` : ''}{m.by ? `. From ${m.by}` : ''}
                    </p>
                    {(s.state === 'soon' || s.state === 'overdue') && <span className="mt-1 inline-block"><Chip state={s.state}>Refill {s.state === 'overdue' ? 'overdue' : 'soon'}</Chip></span>}
                  </div>
                  <RemoveButton name={m.name} onClick={() => patch('meds', list.filter(x => x.id !== m.id))}/>
                </li>
              )
            })}
          </ul>
        )}
        {list.length > 0 && <Action kind="quiet" className="mt-2" onClick={() => patch('meds', [])}>Start again</Action>}
      </Panel>
    </>
  )
}

/* ── First aid ─────────────────────────────────────────────────────────── */

/* Written conservatively from standard first-aid guidance (Red Cross, NHS).
   Every card ends with when to call the emergency number. */
export const FIRST_AID = {
  cuts: { name:'Cuts', steps:[
      'Wash your hands. Wear gloves if you have them.',
      'Press firmly on the wound with a clean cloth or bandage. Keep pressing without lifting to check.',
      'When the bleeding stops, rinse the wound under clean running water.',
      'Cover it with a clean bandage. Change it every day, or when it gets wet or dirty.'],
    dont:['Do not pull out anything stuck in the wound. Press around it instead.'],
    call:['Blood is spurting or soaks through the cloth.', 'It is still bleeding after 10 minutes of firm pressure.',
      'The cut is very deep or something is stuck in it.'],
    doctor:['The edges gape open or it is on the face.', 'It came from a bite, or from something dirty or rusty. Ask about a tetanus shot.',
      'It gets red, hot, swollen or oozes pus.'] },
  burns: { name:'Burns', steps:[
      'Move away from the heat. For an electrical burn, do not touch the person until the power is off.',
      'Cool the burn under cool running water for 20 minutes.',
      'Take off rings, watches or tight clothing near the burn, unless it is stuck to the skin.',
      'Cover it loosely with plastic wrap or a clean dressing that will not shed fluff.'],
    dont:['No ice, butter, oil, toothpaste or creams.', 'Do not pop blisters.'],
    call:['The burn is bigger than the person\'s hand, or looks white, brown or black.',
      'It is on the face, hands, feet, genitals or a joint.', 'It came from chemicals or electricity, or they breathed in smoke.'],
    doctor:['It blisters, or you are not sure how bad it is.', 'It gets more red, swollen or painful after a day or two.'] },
  sprains: { name:'Sprains', steps:[
      'Stop and rest it.',
      'Put ice or a cold pack wrapped in a cloth on it for up to 20 minutes, every 2 to 3 hours for the first 2 days.',
      'Wrap it with an elastic bandage, snug but not tight. Loosen it if fingers or toes go numb, cold or blue.',
      'Raise it above the level of the heart when you can.'],
    dont:['Never put ice straight on skin.'],
    call:['A bone looks bent or out of place, or shows through the skin.', 'The limb below it is cold, blue or numb.'],
    doctor:['You cannot put weight on it or use it.', 'The pain is severe, or it is not getting better after a few days.'] },
  nose: { name:'Nosebleeds', steps:[
      'Sit down and lean forward.', 'Pinch the soft part of the nose, just below the bony bridge.',
      'Keep pinching for 10 to 15 minutes without letting go. Breathe through your mouth and spit out any blood.',
      'Afterwards, avoid blowing your nose or heavy lifting for a day.'],
    dont:['Do not tilt the head back. Blood can run down the throat.'],
    call:['It is still bleeding after 15 minutes of steady pinching.', 'It is very heavy, or there is trouble breathing.',
      'It started after a hard hit to the head or face.'],
    doctor:['Nosebleeds keep happening.'] },
  choking: { name:'Choking', steps:[
      'Ask "Are you choking?" If they can cough, speak or breathe, tell them to keep coughing and stay with them.',
      'If they cannot cough, speak or breathe, call or have someone call the emergency number.',
      'Give 5 firm back blows between the shoulder blades with the heel of your hand, with them bent forward.',
      'Give 5 abdominal thrusts: stand behind, fist just above the belly button, other hand over it, pull sharply in and up.',
      'Repeat 5 and 5 until the object comes out. If they go unresponsive, make sure help is coming and start CPR if you are trained.'],
    dont:['Babies under 1 and pregnant people need different steps. A first-aid course teaches them.'],
    call:['They cannot cough, speak or breathe.', 'After any abdominal thrusts, they need to be checked by a doctor.'],
    doctor:[] },
  allergy: { name:'Allergic reactions', steps:[
      'Mild signs (itchy rash, sneezing, itchy eyes): move away from the trigger, follow their allergy plan and watch closely.',
      'Severe signs: trouble breathing or wheezing, swollen lips, tongue or throat, a hoarse voice, feeling faint, or hives all over with any of these.',
      'For severe signs, call the emergency number now.',
      'If they have an epinephrine auto-injector, help them use it straight away in the outer thigh, following the instructions on it.',
      'Have them lie down with legs raised. If breathing is hard, let them sit up. Stay with them.'],
    dont:['Do not let them stand up or walk about.', 'Do not wait to see if it gets better.'],
    call:['Any severe sign, even if it seems to ease. They still need hospital care after an auto-injector.'],
    doctor:['Any new allergy, so you can find out the trigger and get a plan.'] },
}

/* The first-aid check: one question per card. Conservative on purpose:
   every right answer is the standard first step, and every why says when
   to call the emergency number. */
export const AID_CHECK = [
  { id:'cuts', prompt:'A cut is bleeding a lot. What do you do first?',
    options:[{ id:'press', text:'Press firmly on it with a clean cloth and keep pressing', ok:true },
             { id:'peek', text:'Lift the cloth every minute to check it' }, { id:'rinse', text:'Rinse it and leave it open to the air' }],
    why:`Firm, steady pressure stops most bleeding. Lifting to check lets it start again. Call ${EMERGENCY} if blood spurts, soaks through, or it is still bleeding after 10 minutes.` },
  { id:'burns', prompt:'Someone burns their hand on a hot pan. What helps?',
    options:[{ id:'water', text:'Cool running water for 20 minutes', ok:true },
             { id:'ice', text:'Ice straight on the burn' }, { id:'butter', text:'Butter or toothpaste on it' }],
    why:`Cool running water for 20 minutes. Ice, butter and creams can make it worse. Call ${EMERGENCY} for a large or deep burn, or one on the face, hands, feet or a joint.` },
  { id:'sprains', prompt:'You twist an ankle and it swells. How do you use ice?',
    options:[{ id:'wrap', text:'Wrapped in a cloth, up to 20 minutes at a time', ok:true },
             { id:'bare', text:'Straight on the skin for an hour' }, { id:'none', text:'Never, just keep walking on it' }],
    why:'Wrap ice in a cloth, up to 20 minutes at a time, and rest it. See a doctor if you cannot put weight on it. Call the emergency number if a bone looks out of place.' },
  { id:'nose', prompt:'A nosebleed starts. Which way do you lean?',
    options:[{ id:'fwd', text:'Lean forward and pinch the soft part of the nose', ok:true },
             { id:'back', text:'Tilt your head back' }, { id:'flat', text:'Lie down flat' }],
    why:`Lean forward and pinch for 10 to 15 minutes. Tilting back sends blood down the throat. Call ${EMERGENCY} if it will not stop after 15 minutes or follows a hard hit to the head.` },
  { id:'choking', prompt:'Someone cannot cough, speak or breathe. What first?',
    options:[{ id:'call', text:'Get the emergency number called, then 5 back blows and 5 abdominal thrusts', ok:true },
             { id:'water', text:'Give them a drink of water' }, { id:'wait', text:'Wait a minute to see if it passes' }],
    why:'If they can cough, let them keep coughing. If they cannot cough, speak or breathe, get help called now and give 5 back blows, then 5 abdominal thrusts. Babies and pregnant people need different steps.' },
  { id:'allergy', prompt:'After eating nuts, a friend has swollen lips and trouble breathing. What now?',
    options:[{ id:'call', text:'Call the emergency number and help them use their auto-injector', ok:true },
             { id:'wait', text:'Wait and see if it settles' }, { id:'walk', text:'Walk them outside for fresh air' }],
    why:`Those are severe signs. Call ${EMERGENCY} now, help them use their epinephrine auto-injector if they have one, keep them lying down or sitting if breathing is hard, and stay with them.` },
]

function FirstAid({ data, patch, g, win }) {
  const [pick, setPick] = React.useState('cuts')
  const [check, setCheck] = React.useState(false)
  const read = data.read || {}
  const c = FIRST_AID[pick]
  const n = Object.keys(FIRST_AID).filter(k => read[k]).length
  const List = ({ title, items, tone }) => items.length ? (
    <div className={cn('mt-3 rounded-[12px] p-3', tone === 'call' ? 'border-2 border-[#a11b1b] bg-card' : 'bg-mist/60')}>
      <p className={cn('font-display text-ui font-bold', tone === 'call' ? 'text-[#a11b1b]' : 'text-ink')}>{title}</p>
      <ul className="mt-1 list-disc pl-5 text-ui text-ink">{items.map(s => <li key={s} className="mt-0.5">{s}</li>)}</ul>
    </div>
  ) : null
  return (
    <>
      <p className="mt-4 rounded-[12px] bg-[#a11b1b] p-3 font-display text-ui font-bold text-white">
        In an emergency, call {EMERGENCY} first. They will tell you what to do.
      </p>
      {!check && !g.result && (
        <PlayCard title="First-aid check" line="Six real situations. Pick the first thing to do." onPlay={() => setCheck(true)}/>
      )}
      {check && !g.result && (
        <QuickRound className="mt-4" game={g} items={AID_CHECK} label="Question" seed={9} doneLabel="Finish the check"
          head={<p className="mb-3 rounded-[10px] bg-[#a11b1b] p-2.5 text-fine font-bold text-white">Real emergency? Stop and call {EMERGENCY}.</p>}
          onDone={grade => { setCheck(false); win(grade.clean ? 'First aider' : 'First-aid check done',
            [['Right', `${grade.right} of ${grade.total}`]],
            grade.clean ? ['firstaid', 'clean'] : ['firstaid']) }}/>
      )}
      <Panel>
        <Heading>First-aid basics</Heading>
        <Lead>Pick a card. Read it now so you know what to do in an emergency.</Lead>
        <div role="group" aria-label="First-aid cards" className="mt-3 flex flex-wrap gap-2">
          {Object.entries(FIRST_AID).map(([k, x]) => <Choice key={k} on={pick === k} onClick={() => setPick(k)}>{x.name}</Choice>)}
        </div>
        <h4 className="mt-4 font-display text-row font-bold text-ink">{c.name}</h4>
        <ol className="mt-2 list-decimal pl-5 text-ui text-ink">{c.steps.map(s => <li key={s} className="mt-1">{s}</li>)}</ol>
        <List title="Do not" items={c.dont}/>
        <List title={`Call ${EMERGENCY} if`} items={c.call} tone="call"/>
        <List title="See a doctor if" items={c.doctor}/>
        <Tick className="mt-3" checked={read[pick]} onChange={v => { if (v) g.add(5, { x:50, y:80 }); patch('read', { ...read, [pick]: v }) }}>I have read this card</Tick>
      </Panel>
      <Panel>
        <Figure label="Cards read" value={`${n} of ${Object.keys(FIRST_AID).length}`}/>
        <p className="mt-2 text-ui text-ink">Reading is a start. A first-aid and CPR course, like the ones the Red Cross runs,
          lets you practise with a trainer.</p>
        {n > 0 && <Action kind="quiet" className="mt-3" onClick={() => patch('read', {})}>Start again</Action>}
      </Panel>
    </>
  )
}

/* ── My health info ────────────────────────────────────────────────────── */

function Info({ data, patch }) {
  const i = { contacts: [{ id:'c1', name:'', rel:'', phone:'' }], ...(data.info || {}) }
  const set = (k, v) => patch('info', { ...i, [k]: v })
  const setC = (id, k, v) => set('contacts', i.contacts.map(c => c.id === id ? { ...c, [k]: v } : c))
  const [view, setView] = React.useState(false)
  const contacts = i.contacts.filter(c => c.name || c.phone)
  const card = [
    i.name && `Name: ${i.name}`,
    `Allergies: ${i.allergies || 'None noted'}`,
    i.conditions && `Conditions: ${i.conditions}`,
    i.doctor && `Doctor: ${i.doctor}`,
    ...contacts.map(c => `Emergency contact: ${c.name}${c.rel ? ` (${c.rel})` : ''} ${c.phone}`.trim()),
    i.notes && `Notes: ${i.notes}`,
  ].filter(Boolean).join('\n')
  return (
    <>
      {!view ? (
        <Panel>
          <Heading>My health info</Heading>
          <Lead>Only write what you choose to. Only you see this.</Lead>
          <div className="mt-3 grid gap-3">
            <Field label="Name" value={i.name || ''} onChange={e => set('name', e.target.value)}/>
            <Field label="Allergies" hint="Medicines, foods, insects, latex." value={i.allergies || ''} onChange={e => set('allergies', e.target.value)}/>
            <Field label="Conditions you choose to note" value={i.conditions || ''} onChange={e => set('conditions', e.target.value)} placeholder="e.g. asthma"/>
            <Field label="Doctor and phone" value={i.doctor || ''} onChange={e => set('doctor', e.target.value)}/>
          </div>
          <p className="mt-4 font-display text-ui font-bold text-ink">Emergency contacts</p>
          <div className="mt-2 grid gap-3">
            {i.contacts.map((c, k) => (
              <fieldset key={c.id} className="rounded-[12px] border border-rule p-3">
                <legend className="px-1 text-fine font-semibold text-ink-2">Contact {k + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Name" value={c.name} onChange={e => setC(c.id, 'name', e.target.value)}/>
                  <Field label="Who they are" value={c.rel} onChange={e => setC(c.id, 'rel', e.target.value)} placeholder="Parent"/>
                  <Field label="Phone" type="tel" value={c.phone} onChange={e => setC(c.id, 'phone', e.target.value)}/>
                </div>
                {i.contacts.length > 1 && (
                  <button type="button" className="mt-2 min-h-[44px] text-fine font-semibold text-ink-2 underline underline-offset-4"
                    onClick={() => set('contacts', i.contacts.filter(x => x.id !== c.id))}>Remove contact {k + 1}</button>
                )}
              </fieldset>
            ))}
          </div>
          {i.contacts.length < 3 && (
            <Action kind="quiet" className="mt-3" onClick={() => set('contacts', [...i.contacts, { id: uid(), name:'', rel:'', phone:'' }])}>Add a contact</Action>
          )}
          <Field className="mt-3" as="textarea" label="Notes" value={i.notes || ''} onChange={e => set('notes', e.target.value)}/>
          <Action className="mt-4 w-full sm:w-auto" onClick={() => setView(true)}>Show my card</Action>
        </Panel>
      ) : (
        <Panel>
          <Heading>My health card</Heading>
          <div className="kit-ground mt-3 rounded-[14px] p-4">
            {card.split('\n').map(l => {
              const [k, ...rest] = l.split(': ')
              return <p key={l} className="mt-1 text-ui text-ink first:mt-0"><b className="font-display">{k}:</b> {rest.join(': ')}</p>
            })}
          </div>
          <p className="mt-3 text-fine text-ink-2">Most phones also have a Medical ID or emergency information setting that first
            responders can see from the lock screen. Anyone who uses this device could see this card.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Action onClick={() => setView(false)}>Edit</Action>
            <CopyButton text={card} label="Copy card"/>
            <Action kind="quiet" onClick={() => { patch('info', {}); setView(false) }}>Start again</Action>
          </div>
        </Panel>
      )}
    </>
  )
}

const TABS = [['visit', 'Appointment'], ['meds', 'Medicines'], ['aid', 'First aid'], ['info', 'My info']]

const GOALS = {
  visit: 'Write a note to bring to your doctor visit.',
  aid:   'Read the cards, then pass the six question first-aid check.',
}

export default function LifeHealth({ onExit }) {
  const g = useSkill(ID)
  const [end, setEnd] = React.useState(null)
  const [data, patch] = useStored(ID, { tab:'visit' })
  const tab = data.tab || 'visit'
  const win = (title, stats, marks = []) => { setEnd({ title, stats }); g.finish({ complete:true, marks }); window.scrollTo(0, 0) }
  const again = () => { setEnd(null); g.reset() }
  const go = v => { patch('tab', v); again() }
  return (
    <LifeScreen id={ID} family="coral" title="Health Basics" icon={HealthIcon} onExit={onExit}
      problem="Learn to manage your own health care."
      doing="Prepare for a doctor visit, keep a medicine list, learn first aid and save your key health info.">
      <Sections label="Health tools" items={TABS} value={tab} onChange={go}/>
      {GOALS[tab] ? (
        <Quest className="mt-4" game={g} goal={GOALS[tab]} body="">
          {end && g.result && (
            <EndCard className="mt-4" game={g} title={end.title} stats={end.stats} againLabel="Keep going"
              onAgain={again} onDone={leave(onExit)}/>
          )}
          {tab === 'visit' && <Visit data={data} patch={patch} g={g} win={win}/>}
          {tab === 'aid' && <FirstAid data={data} patch={patch} g={g} win={win}/>}
        </Quest>
      ) : (
        <>
          {tab === 'meds' && <Meds data={data} patch={patch}/>}
          {tab === 'info' && <Info data={data} patch={patch}/>}
        </>
      )}
    </LifeScreen>
  )
}
