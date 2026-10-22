import React from 'react'
import { cn } from '../../lib/utils'
import { HomeIcon } from './icons'
import { LifeScreen, Sections, Heading, Lead, Panel, Checklist, Tick, Field, Figure, CopyButton,
         Chip, Action, Choice, useStored } from './parts'
import { shoppingList, vehicleStatus, todayISO, niceDate, leaveBy, tripCard, clock12 } from './logic'
import { EndCard } from '../../toolkit/game'
import { useSkill, Quest, QuickRound, Win, PlayCard, leave } from '../../toolkit/game/skill'

const ID = 'life-home'

export const RECIPES = {
  oats: { name:'Overnight oats', kind:'No cook', mins:5,
    ingredients:[['Rolled oats', '1/2 cup'], ['Milk or soy milk', '1/2 cup'], ['Plain yogurt', '1/4 cup'], ['Banana or berries', '1 handful']],
    steps:['Mix the oats, milk and yogurt in a jar or tub.', 'Put the fruit on top and close the lid.',
      'Leave it in the fridge overnight. Eat it cold within 2 days.'] },
  wrap: { name:'Bean and corn wraps', kind:'No cook', mins:10,
    ingredients:[['Tortillas', '2'], ['Canned black beans', '1/2 can'], ['Canned corn', '1/4 can'], ['Salsa', '2 tbsp'], ['Grated cheese', '1 handful']],
    steps:['Drain the beans and corn in a sieve and rinse them.', 'Spoon them down the middle of each tortilla.',
      'Add salsa and cheese, fold the ends in and roll.', 'Put leftover beans and corn in a covered tub in the fridge, not in the open can.'] },
  chickpea: { name:'Chickpea salad sandwich', kind:'No cook', mins:10,
    ingredients:[['Canned chickpeas', '1/2 can'], ['Mayo or plain yogurt', '1 tbsp'], ['Cucumber', '1 small piece'], ['Bread', '2 slices'], ['Lemon', 'a squeeze']],
    steps:['Drain and rinse the chickpeas, then squash them with a fork.', 'Stir in the mayo, chopped cucumber and lemon.',
      'Spread it on the bread.'] },
  pasta: { name:'One pot tomato pasta', kind:'One pan', mins:20,
    ingredients:[['Pasta', '100 g, about 1 cup dry'], ['Canned chopped tomatoes', '1/2 can'], ['Garlic', '1 clove'], ['Spinach', '1 handful'], ['Grated cheese', '1 handful']],
    steps:['Put the pasta, tomatoes, chopped garlic and 1 1/2 cups of water in a pot.',
      'Bring it to a boil, then turn it down and simmer for 10 to 12 minutes, stirring often. Add a splash of water if it sticks.',
      'When the pasta is soft, stir in the spinach until it wilts. Top with cheese.'] },
  rice: { name:'Egg fried rice', kind:'One pan', mins:15,
    ingredients:[['Cooked rice, cold', '1 cup'], ['Eggs', '2'], ['Frozen peas and carrots', '1/2 cup'], ['Soy sauce', '1 tbsp'], ['Cooking oil', '1 tbsp']],
    steps:['Use rice that went into the fridge within an hour of cooking and is no more than a day old.',
      'Heat the oil in a frying pan on medium. Cook the peas and carrots for 2 minutes.',
      'Add the rice and stir until it is steaming hot all through.',
      'Push it to one side, crack in the eggs and stir them until fully set, then mix. Add soy sauce.'] },
  tray: { name:'Tray bake chicken and veg', kind:'One pan', mins:40,
    ingredients:[['Chicken thighs or firm tofu', '1 piece'], ['Potato', '1'], ['Broccoli or peppers', '1 cup'], ['Cooking oil', '1 tbsp'], ['Salt and pepper', 'a pinch']],
    steps:['Heat the oven to 425°F (220°C).', 'Cut the potato small and the veg into chunks. Toss with oil, salt and pepper on a tray.',
      'Add the chicken or tofu. Wash your hands and the board after touching raw chicken.',
      'Bake 25 to 30 minutes. Chicken is done at 165°F (74°C) in the thickest part on a food thermometer, with no pink inside.'] },
}
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function Meals({ data, patch, g, win }) {
  const plan = data.plan || Array(7).fill('')
  const [open, setOpen] = React.useState(null)
  const list = shoppingList(plan, RECIPES)
  const got = data.bought || {}
  const left = list.filter(i => !got[i.name]).length
  const setDay = (d, v) => patch('plan', plan.map((x, k) => k === d ? v : x))
  return (
    <>
      <Panel>
        <Heading>Plan this week's meals</Heading>
        <Lead>Pick one recipe for any day you will cook. Leave the rest empty.</Lead>
        <div className="mt-3 grid gap-2">
          {DAYS.map((d, i) => (
            <label key={d} className="flex items-center gap-3">
              <span className="w-10 shrink-0 font-display text-ui font-bold text-ink">{d}</span>
              <select value={plan[i] || ''} onChange={e => setDay(i, e.target.value)}
                className="min-h-[48px] w-full min-w-0 rounded-[12px] border border-rule bg-card px-3 text-ui text-ink shadow-card">
                <option value="">Not cooking</option>
                {Object.entries(RECIPES).map(([id, r]) => <option key={id} value={id}>{r.name}</option>)}
              </select>
            </label>
          ))}
        </div>
      </Panel>

      <Panel>
        <Heading>Shopping list</Heading>
        {list.length === 0
          ? <Lead>Pick at least one meal to build your list.</Lead>
          : <>
              <Lead>{left === 0 ? 'Everything is ticked. You are ready to cook.' : `${left} of ${list.length} still to get. Tick as you shop.`}</Lead>
              <ul className="mt-2 grid gap-0.5">
                {list.map(i => (
                  <li key={i.name}>
                    <Tick checked={got[i.name]} onChange={v => { if (v) g.add(5, { x:50, y:40 }); patch('bought', { ...got, [i.name]: v }) }}>
                      {i.name} <span className="text-ink-2">({i.uses.join(' + ')})</span>
                    </Tick>
                  </li>
                ))}
              </ul>
              {left === 0 && !g.result && (
                <div className="mt-3 grid gap-3">
                  <Win reduced={g.reduced}>Every item ticked. Your week of meals is ready.</Win>
                  <Action className="sm:w-fit" onClick={() => win('Meals planned',
                    [['Meals', plan.filter(Boolean).length], ['Items bought', list.length]], ['plan'])}>Finish the shop</Action>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-3">
                <CopyButton text={list.map(i => `${i.name} (${i.uses.join(' + ')})`).join('\n')} label="Copy list"/>
                <Action kind="quiet" onClick={() => { patch('plan', Array(7).fill('')); patch('bought', {}) }}>Start again</Action>
              </div>
            </>}
      </Panel>

      <Panel>
        <Heading>The recipes</Heading>
        <Lead>Amounts are for one person. Tap one to see the steps.</Lead>
        <div className="mt-3 grid gap-2">
          {Object.entries(RECIPES).map(([id, r]) => (
            <div key={id} className="rounded-[14px] border border-rule">
              <button type="button" aria-expanded={open === id} onClick={() => setOpen(open === id ? null : id)}
                className="flex min-h-[52px] w-full items-center justify-between gap-3 px-3.5 py-2 text-left">
                <span className="font-display text-ui font-bold text-ink">{r.name}</span>
                <span className="shrink-0 text-fine text-ink-2">{r.kind}, {r.mins} min</span>
              </button>
              {open === id && (
                <div className="border-t border-rule px-3.5 pb-3.5 pt-2">
                  <p className="text-fine font-semibold text-ink-2">You need</p>
                  <ul className="mt-1 list-disc pl-5 text-ui text-ink">
                    {r.ingredients.map(([n, a]) => <li key={n}>{n}, {a}</li>)}
                  </ul>
                  <p className="mt-2 text-fine font-semibold text-ink-2">Steps</p>
                  <ol className="mt-1 list-decimal pl-5 text-ui text-ink">
                    {r.steps.map(s => <li key={s} className="mt-1">{s}</li>)}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-fine text-ink-2">Food safety: wash your hands before cooking. Keep raw meat away
          from food you will not cook. Put leftovers in the fridge within 2 hours and eat them within 3 to 4 days.
          Turn pan handles in and stay with the stove while it is on.</p>
      </Panel>
    </>
  )
}

const FABRICS = {
  cotton: { name:'Everyday cotton', eg:'T-shirts, jeans, hoodies',
    water:'Cold or warm', cycle:'Normal', dry:'Tumble dry low or medium, or hang',
    tip:'Turn jeans and printed tops inside out so the colour and print last.' },
  towels: { name:'Towels and sheets', eg:'Bath towels, bedding',
    water:'Warm or hot, if the label allows', cycle:'Normal', dry:'Tumble dry medium',
    tip:'Wash towels apart from clothes. They shed fluff onto everything else.' },
  sport: { name:'Sportswear', eg:'Leggings, team shirts, gym kit',
    water:'Cold', cycle:'Synthetic or gentle', dry:'Hang to dry, or tumble dry low',
    tip:'Skip fabric softener. It coats the fabric and can trap smells.' },
  delicate: { name:'Wool and delicates', eg:'Sweaters, lace, silk',
    water:'Cold', cycle:'Hand wash or the wool cycle', dry:'Lay flat on a towel to dry',
    tip:'Never tumble dry wool unless the label says you can. It shrinks.' },
  new: { name:'New dark or bright clothes', eg:'New jeans, red tops',
    water:'Cold', cycle:'Normal, with similar colours only', dry:'Hang to dry',
    tip:'Wash them apart the first few times. The dye can run onto lighter clothes.' },
}

// Care label symbols: a dot is a heat step and a cross means do not.
const Tub = ({ dots = 0, hand, cross, bars = 0 }) => (
  <>
    <path d="M6 13 L9 27 H27 L30 13" /><path d="M5 13c2-2 4 2 6.5 0s4.5 2 6.5 0 4.5 2 6.5 0 4.5 2 6.5 0"/>
    {hand && <path d="M14 20c0-3 1-4 2.5-4s1.5 1 1.5 2v3m0-3c0-1 .5-1.5 1.5-1.5s1.5.5 1.5 1.5v4"/>}
    {Array.from({ length: dots }, (_, k) => <circle key={k} cx={18 + (k - (dots - 1) / 2) * 4} cy="21" r="1.3" fill="currentColor" stroke="none"/>)}
    {Array.from({ length: bars }, (_, k) => <path key={k} d={`M7 ${30 + k * 2.6} H29`}/>)}
    {cross && <path d="M6 8 L30 30 M30 8 L6 30"/>}
  </>
)
const SYMBOLS = [
  ['w1', 'Wash cold', 'One dot: cold wash, about 30°C (85°F).', <Tub key="a" dots={1}/>],
  ['w2', 'Wash warm', 'Two dots: warm wash, about 40°C (105°F).', <Tub key="a" dots={2}/>],
  ['w3', 'Wash hot', 'Three dots: hot wash, about 50°C (120°F).', <Tub key="a" dots={3}/>],
  ['wp', 'Gentler cycle', 'One line under the tub: permanent press. Two lines: gentle or delicate cycle.', <Tub key="a" bars={2}/>],
  ['wh', 'Hand wash', 'A hand in the tub: hand wash in cool water, or use the hand wash cycle.', <Tub key="a" hand/>],
  ['wx', 'Do not wash', 'A crossed tub: do not wash in water. Usually dry clean only.', <Tub key="a" cross/>],
  ['b',  'Bleach OK', 'An empty triangle: any bleach is fine when needed.', <path key="a" d="M18 6 L31 29 H5 Z"/>],
  ['bx', 'No bleach', 'A crossed triangle: do not use any bleach.', <><path d="M18 6 L31 29 H5 Z"/><path d="M8 8 L28 30 M28 8 L8 30"/></>],
  ['t',  'Tumble dry', 'A circle in a square: tumble dry is fine. One dot inside means low heat.', <><rect x="6" y="6" width="24" height="24" rx="2"/><circle cx="18" cy="18" r="8"/><circle cx="18" cy="18" r="1.3" fill="currentColor" stroke="none"/></>],
  ['tx', 'Do not tumble dry', 'A crossed tumble dryer: hang it or lay it flat instead.', <><rect x="6" y="6" width="24" height="24" rx="2"/><circle cx="18" cy="18" r="8"/><path d="M6 6 L30 30 M30 6 L6 30"/></>],
  ['f',  'Dry flat', 'A square with a line across the middle: lay flat to dry.', <><rect x="6" y="6" width="24" height="24" rx="2"/><path d="M11 18 H25"/></>],
  ['i',  'Iron low', 'An iron with one dot: iron on low heat. More dots mean more heat.', <><path d="M7 26 H29 C29 18 25 13 17 13 H11 L7 26 Z"/><circle cx="18" cy="21" r="1.3" fill="currentColor" stroke="none"/></>],
  ['ix', 'Do not iron', 'A crossed iron: do not iron it.', <><path d="M7 26 H29 C29 18 25 13 17 13 H11 L7 26 Z"/><path d="M8 8 L28 30 M28 8 L8 30"/></>],
  ['dc', 'Dry clean', 'An empty circle: dry clean. A letter inside is for the cleaner.', <circle key="a" cx="18" cy="18" r="11"/>],
]
const LOAD_STEPS = [
  ['pockets', 'Empty every pocket. Tissues, pens and cash ruin a load.'],
  ['sort', 'Sort into darks, lights and towels.'],
  ['labels', 'Check labels for hand wash or wash separately.'],
  ['zips', 'Close zips and fasteners so they do not snag.'],
  ['soap', 'Use the detergent amount on the cap for your load size. More is not cleaner.'],
  ['cycle', 'Pick the cycle and temperature for the fabric.'],
  ['move', 'Move clothes to the dryer or hang them soon after the wash ends, so they do not smell.'],
  ['lint', 'Clean the dryer lint filter every load. A full filter is a fire risk.'],
]

/* The care label quiz: six symbols, three names each. */
const QUIZ_SYMBOLS = [['w1', ['Wash hot', 'Hand wash']], ['wh', ['Do not wash', 'Wash cold']], ['bx', ['Bleach OK', 'Do not iron']],
  ['tx', ['Tumble dry', 'Dry flat']], ['f', ['Tumble dry', 'Do not wash']], ['ix', ['Iron low', 'No bleach']]]
const LABEL_ROUND = QUIZ_SYMBOLS.map(([id, others]) => {
  const [, name, desc, art] = SYMBOLS.find(x => x[0] === id)
  return { id, prompt:'What does this symbol mean?', why:desc,
    art: <svg viewBox="0 0 36 36" width="88" height="88" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Care label symbol" className="kit-ground rounded-[16px] p-2 text-ink">{art}</svg>,
    options:[{ id:name, text:name, ok:true }, ...others.map(o => ({ id:o, text:o }))] }
})

function Laundry({ data, patch, g, win }) {
  const [fab, setFab] = React.useState('cotton')
  const [sym, setSym] = React.useState(null)
  const [quiz, setQuiz] = React.useState(false)
  const f = FABRICS[fab]
  const ticks = data.load || {}
  const done = LOAD_STEPS.filter(([id]) => ticks[id]).length
  const s = SYMBOLS.find(x => x[0] === sym)
  return (
    <>
      {quiz && !g.result ? (
        <QuickRound className="mt-4" game={g} items={LABEL_ROUND} label="Symbol" seed={3} doneLabel="Finish the quiz"
          onDone={grade => { setQuiz(false); win(grade.clean ? 'Every symbol right' : 'Label quiz done',
            [['Right', `${grade.right} of ${grade.total}`]], grade.clean ? ['clean'] : []) }}/>
      ) : !g.result && (
        <PlayCard title="Care label quiz" line="Six symbols, three choices each." onPlay={() => setQuiz(true)}/>
      )}
      <Panel>
        <Heading>What are you washing?</Heading>
        <div role="group" aria-label="Fabric" className="mt-3 flex flex-wrap gap-2">
          {Object.entries(FABRICS).map(([id, x]) => <Choice key={id} on={fab === id} onClick={() => setFab(id)}>{x.name}</Choice>)}
        </div>
        <dl className="mt-4 grid gap-2 sm:grid-cols-3">
          {[['Water', f.water], ['Cycle', f.cycle], ['Dry', f.dry]].map(([k, v]) => (
            <div key={k} className="kit-ground rounded-[14px] p-3">
              <dt className="text-fine font-semibold text-ink-2">{k}</dt>
              <dd className="mt-0.5 font-display text-ui font-bold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-ui text-ink">{f.tip}</p>
        <p className="mt-1 text-fine text-ink-2">For: {f.eg}. If the label says something different, the label wins.</p>
      </Panel>

      <Panel>
        <Heading>Read the label</Heading>
        <Lead>Tap a symbol to see what it means.</Lead>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {SYMBOLS.map(([id, name, , art]) => (
            <button key={id} type="button" aria-pressed={sym === id} aria-label={name} onClick={() => setSym(id)}
              className={cn('grid aspect-square min-h-[56px] place-items-center rounded-[12px] border transition-colors',
                sym === id ? 'kit-ground kit-edge border-2' : 'border-rule bg-card hoverOnly:bg-mist/60')}>
              <svg viewBox="0 0 36 36" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-ink">{art}</svg>
            </button>
          ))}
        </div>
        <p role="status" className="mt-3 min-h-[3rem] text-ui text-ink">
          {s ? <><b className="font-display">{s[1]}.</b> {s[2]}</> : 'No symbol picked yet.'}
        </p>
      </Panel>

      <Panel>
        <Heading>Load checklist</Heading>
        <Lead>{done === LOAD_STEPS.length ? 'All done.' : `${done} of ${LOAD_STEPS.length} done.`}</Lead>
        <Checklist items={LOAD_STEPS} ticks={ticks} onTick={v => {
          if (Object.values(v).filter(Boolean).length > done) g.add(5, { x:50, y:85 })
          patch('load', v)
        }}/>
        {done === LOAD_STEPS.length && <Win className="mt-2" reduced={g.reduced}>Load done.</Win>}
        <Action kind="quiet" className="mt-2" onClick={() => patch('load', {})}>Start again</Action>
      </Panel>
    </>
  )
}

const CAR_ITEMS = [
  ['oil', 'Oil change', 'Use the interval in the owner\'s manual. Many cars say every 5,000 to 10,000 miles or 6 to 12 months.', { everyMonths:'', everyMiles:'' }],
  ['tires', 'Tire pressure and tread', 'Check once a month. Use the pressure on the sticker inside the driver\'s door, not the number on the tire. Penny test: put a penny in the tread, head down. If you can see all of the head, the tread is worn.', { everyMonths:'1', everyMiles:'' }],
  ['lights', 'Lights check', 'Once a month, with a helper: headlights, brake lights, turn signals, hazards.', { everyMonths:'1', everyMiles:'' }],
  ['wipers', 'Wipers and washer fluid', 'Top up the fluid when low. Change blades when they streak.', { everyMonths:'3', everyMiles:'' }],
]
const STATE_WORD = { ok:'OK', soon:'Due soon', due:'Due now', unset:'Not set' }

function Car({ data, patch, g, win }) {
  const car = data.car || {}
  const miles = car.miles || ''
  const today = todayISO()
  const item = id => ({ ...(CAR_ITEMS.find(c => c[0] === id)[3]), ...(car[id] || {}) })
  const setItem = (id, k, v) => patch('car', { ...car, [id]: { ...item(id), [k]: v } })
  const logToday = (id, e) => {
    patch('car', { ...car, [id]: { ...item(id), lastDate: today, lastMiles: miles } })
    g.hit(10, e, { sound:'good' })
    const name = CAR_ITEMS.find(c => c[0] === id)[1]
    if (!g.result) win('Job logged', [['Logged', name], ['Miles now', miles ? Number(miles).toLocaleString('en-US') : 'Not set']], [])
  }
  const status = CAR_ITEMS.map(([id, name]) => [id, name, vehicleStatus(item(id), { today, miles })])
  const flagged = status.filter(([, , s]) => s.state === 'due' || s.state === 'soon')
  return (
    <>
      <Panel>
        <Heading>Your reminders</Heading>
        <Lead>Not driving yet? Fill this in with whoever owns the car.</Lead>
        <Field className="mt-3 max-w-[16rem]" label="Miles on the dashboard now" inputMode="numeric"
          value={miles} onChange={e => patch('car', { ...car, miles: e.target.value.replace(/[^\d]/g, '') })} placeholder="e.g. 42150"/>
        <ul className="mt-3 grid gap-2" aria-live="polite">
          {flagged.length === 0
            ? <li className="text-ui text-ink-2">Nothing due. Log a job below and set how often it is due.</li>
            : flagged.map(([id, name, s]) => (
                <li key={id} className="flex flex-wrap items-center gap-2 text-ui text-ink">
                  <Chip state={s.state}>{STATE_WORD[s.state]}</Chip> {name}
                  <span className="text-ink-2">{dueText(s)}</span>
                </li>
              ))}
        </ul>
      </Panel>
      {CAR_ITEMS.map(([id, name, hint]) => {
        const it = item(id), s = status.find(x => x[0] === id)[2]
        return (
          <Panel key={id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Heading>{name}</Heading>
              <Chip state={s.state}>{STATE_WORD[s.state]}</Chip>
            </div>
            <p className="mt-1 text-fine text-ink-2">{hint}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Last done" type="date" value={it.lastDate || ''} max={today} onChange={e => setItem(id, 'lastDate', e.target.value)}/>
              <Field label="At miles" inputMode="numeric" value={it.lastMiles || ''} onChange={e => setItem(id, 'lastMiles', e.target.value.replace(/[^\d]/g, ''))}/>
              <Field label="Every (months)" inputMode="numeric" value={it.everyMonths} onChange={e => setItem(id, 'everyMonths', e.target.value.replace(/[^\d]/g, ''))}/>
              <Field label="Or every (miles)" inputMode="numeric" value={it.everyMiles} onChange={e => setItem(id, 'everyMiles', e.target.value.replace(/[^\d]/g, ''))}/>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Action onClick={e => logToday(id, e)}>Done today</Action>
              {s.state !== 'unset' && <span className="text-fine text-ink-2">{dueText(s)}</span>}
            </div>
          </Panel>
        )
      })}
      <p className="mt-3 text-fine text-ink-2">A warning light on the dashboard, a flat tire or brakes that feel wrong
        means stop driving and get help from an adult or a mechanic. Reminders show here when you open this tool.</p>
    </>
  )
}
function dueText(s) {
  const parts = []
  if (s.nextDate) parts.push(s.daysLeft <= 0 ? `was due ${niceDate(s.nextDate)}` : `next by ${niceDate(s.nextDate)}`)
  if (s.nextMiles) parts.push(s.milesLeft != null && s.milesLeft <= 0 ? `was due at ${s.nextMiles.toLocaleString('en-US')} miles`
    : `or at ${s.nextMiles.toLocaleString('en-US')} miles`)
  return parts.join('; ')
}

const TRIP_STEPS = [
  ['route', 'Look up the route in the transit agency\'s app or a maps app.'],
  ['day', 'Check times for the day you travel. Weekend and holiday times are often different.'],
  ['fare', 'Have your fare ready: card, pass, app or exact change.'],
  ['charge', 'Charge your phone, and screenshot the route in case you lose signal.'],
  ['tell', 'Tell someone where you are going and when you expect to get there.'],
  ['stop', 'Know the stop before yours, so you are ready to press the bell or stand up.'],
  ['safe', 'Wait in a lit spot. At night, sit near the driver or in a busy train car.'],
]

function Transit({ data, patch, g, win }) {
  const t = { buffer:10, ...(data.trip || {}) }
  const set = (k, v) => patch('trip', { ...t, [k]: v })
  const leave_ = leaveBy(t.arrive, t.minutes, t.buffer)
  const card = tripCard(t)
  const ticks = data.tripTicks || {}
  return (
    <>
      <Panel>
        <Heading>Plan the trip</Heading>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="From" value={t.from || ''} onChange={e => set('from', e.target.value)} placeholder="Home"/>
          <Field label="To" value={t.to || ''} onChange={e => set('to', e.target.value)} placeholder="Library"/>
          <Field label="Arrive by" type="time" value={t.arrive || ''} onChange={e => set('arrive', e.target.value)}/>
          <Field label="Trip time in the app (minutes)" inputMode="numeric" value={t.minutes || ''}
            onChange={e => set('minutes', e.target.value.replace(/[^\d]/g, ''))} placeholder="25"/>
          <Field label="Bus or train line" value={t.line || ''} onChange={e => set('line', e.target.value)} placeholder="Route 6"/>
          <Field label="Get on at" value={t.stop || ''} onChange={e => set('stop', e.target.value)} placeholder="Main St and 4th"/>
          <Field label="Get off at" value={t.off || ''} onChange={e => set('off', e.target.value)}/>
          <Field label="Last ride back" type="time" value={t.back || ''} onChange={e => set('back', e.target.value)}/>
        </div>
        <Field className="mt-3" label="Backup plan" hint="If you miss the last ride or something feels wrong."
          value={t.backup || ''} onChange={e => set('backup', e.target.value)} placeholder="Call a parent for a ride"/>
        <p className="mt-3 font-display text-ui font-semibold text-ink">Spare time before you need to be there</p>
        <div role="group" aria-label="Spare time" className="mt-2 flex flex-wrap gap-2">
          {[5, 10, 15].map(b => <Choice key={b} on={+t.buffer === b} onClick={() => set('buffer', b)}>{b} min</Choice>)}
        </div>
      </Panel>
      <Panel>
        <Heading>Your trip card</Heading>
        {leave_
          ? <Figure className="mt-3" label={`Leave ${t.from || 'home'} by`} value={clock12(leave_)}/>
          : <Lead>Add an arrive by time and the trip time to see when to leave.</Lead>}
        <pre className="mt-3 whitespace-pre-wrap rounded-[12px] bg-mist/60 p-3 font-body text-ui text-ink">{card}</pre>
        <div className="mt-3 flex flex-wrap gap-3">
          <CopyButton text={card} label="Copy trip card"/>
          <Action kind="quiet" onClick={() => { patch('trip', {}); patch('tripTicks', {}) }}>Start again</Action>
        </div>
      </Panel>
      <Panel>
        <Heading>Before you go</Heading>
        <Checklist items={TRIP_STEPS} ticks={ticks} onTick={v => {
          if (Object.values(v).filter(Boolean).length > Object.values(ticks).filter(Boolean).length) g.add(5, { x:50, y:85 })
          patch('tripTicks', v)
        }}/>
        {leave_ && TRIP_STEPS.every(([k]) => ticks[k]) && !g.result && (
          <div className="mt-3 grid gap-3">
            <Win reduced={g.reduced}>Trip card made and every check done.</Win>
            <Action className="sm:w-fit" onClick={() => win('Trip ready', [['Leave by', clock12(leave_)], ['Checks', `${TRIP_STEPS.length} of ${TRIP_STEPS.length}`]], ['plan'])}>
              I am ready to go
            </Action>
          </div>
        )}
      </Panel>
    </>
  )
}

const TABS = [['meals', 'Meals'], ['laundry', 'Laundry'], ['car', 'Car'], ['transit', 'Bus and train']]

const GOALS = {
  meals:   'Plan a few meals and tick off the shopping list.',
  laundry: 'Learn the care label symbols, then run a load.',
  car:     'Log a car job and set when it is next due.',
  transit: 'Make a trip card and tick every check before you go.',
}

export default function LifeHome({ onExit }) {
  const g = useSkill(ID)
  const [end, setEnd] = React.useState(null)
  const [data, patch] = useStored(ID, { tab:'meals' })
  const tab = data.tab || 'meals'
  const win = (title, stats, marks) => { setEnd({ title, stats }); g.finish({ complete:true, marks }); window.scrollTo(0, 0) }
  const again = () => { setEnd(null); g.reset() }
  const go = v => { patch('tab', v); again() }
  return (
    <LifeScreen id={ID} family="sun" title="Home Basics" icon={HomeIcon} onExit={onExit}
      problem="Learn everyday skills for living on your own."
      doing="Pick a task below and work through its card. Your ticks and notes are saved.">
      <Sections label="Home jobs" items={TABS} value={tab} onChange={go}/>
      <Quest className="mt-4" game={g} goal={GOALS[tab]} body="">
        {end && g.result && (
          <EndCard className="mt-4" game={g} title={end.title} stats={end.stats} againLabel="Keep going"
            onAgain={again} onDone={leave(onExit)}/>
        )}
        {tab === 'meals' && <Meals data={data} patch={patch} g={g} win={win}/>}
        {tab === 'laundry' && <Laundry data={data} patch={patch} g={g} win={win}/>}
        {tab === 'car' && <Car data={data} patch={patch} g={g} win={win}/>}
        {tab === 'transit' && <Transit data={data} patch={patch} g={g} win={win}/>}
      </Quest>
    </LifeScreen>
  )
}
