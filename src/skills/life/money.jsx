import React from 'react'
import { cn } from '../../lib/utils'
import { MoneyIcon } from './icons'
import { LifeScreen, Sections, Heading, Lead, Panel, Field, Figure, Chip, RemoveButton,
         Action, Choice, useStored, uid } from './parts'
import { money, moneyShort, monthlyCost, subsTotals, pauseStatus, budget, compound, todayISO, daysBetween,
         niceDate, PAUSE_HOURS, interestQuiz } from './logic'
import { EndCard } from '../../toolkit/game'
import { useSkill, Quest, QuickRound, GoalMeter, Win, PlayCard, leave } from '../../toolkit/game/skill'

/* Money Check: subscriptions, a 24 hour pause list, a monthly budget, a
 * compound interest calculator and a credit score explainer. Educational
 * only. Saved under `mindmap.skills.life-money`. */

const ID = 'life-money'
const digits = v => v.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')

/* ── Subscriptions ─────────────────────────────────────────────────────── */

const CYCLES = [['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']]
const USED = [['week', 'This week'], ['month', 'This month'], ['not-month', 'Not this month'], ['unsure', 'Can\'t remember']]
const IDEAS = ['Music streaming', 'Video streaming', 'Game pass', 'Cloud storage', 'App or game in-app plan']

function Subs({ data, patch, g, win }) {
  const list = data.subs || []
  const [d, setD] = React.useState({ name:'', price:'', cycle:'monthly', used:'week', trial:'' })
  const t = subsTotals(list)
  const today = todayISO()
  const add = e => {
    e.preventDefault()
    if (!d.name.trim() || !(parseFloat(d.price) >= 0)) return
    patch('subs', [...list, { ...d, id: uid(), name: d.name.trim() }])
    g.hit(10, e.currentTarget.querySelector('button[type=submit]') || e)
    setD({ name:'', price:'', cycle:'monthly', used:'week', trial:'' })
  }
  const setUsed = (id, used) => patch('subs', list.map(s => s.id === id ? { ...s, used } : s))
  return (
    <>
      <Panel>
        <Heading>Add what you pay for</Heading>
        <Lead>Check your app store's subscriptions page and your bank or card statement.</Lead>
        <div className="mt-3 flex flex-wrap gap-2">
          {IDEAS.map(i => <Choice key={i} onClick={() => setD({ ...d, name: i })}>{i}</Choice>)}
        </div>
        <form onSubmit={add} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Name" value={d.name} onChange={e => setD({ ...d, name: e.target.value })} placeholder="Music streaming"/>
          <Field label="Price in dollars" inputMode="decimal" value={d.price} onChange={e => setD({ ...d, price: digits(e.target.value) })} placeholder="10.99"/>
          <Field label="Charged" as="select" value={d.cycle} onChange={e => setD({ ...d, cycle: e.target.value })}>
            {CYCLES.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </Field>
          <Field label="Last time you used it" as="select" value={d.used} onChange={e => setD({ ...d, used: e.target.value })}>
            {USED.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </Field>
          <Field label="Free trial ends (if any)" type="date" value={d.trial} onChange={e => setD({ ...d, trial: e.target.value })}/>
          <div className="flex items-end"><Action type="submit" className="w-full" disabled={!d.name.trim() || d.price === ''}>Add</Action></div>
        </form>
      </Panel>

      <Panel>
        <Heading>What it really costs</Heading>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Figure label="Every month" value={money(t.monthly)}/>
          <Figure label="Every year" value={money(t.yearly)}/>
        </div>
        {t.flagged.length > 0 && (
          <p className="mt-3 rounded-[12px] bg-[#f5ecd7] p-3 text-ui text-ink">
            <b className="font-display">{t.flagged.length} not used this month</b>, costing {money(t.flaggedYearly)} a year.
            If you do not miss it, cancel it in the app store or on the company's site.
          </p>
        )}
        {list.length === 0 ? <Lead className="mt-3">Nothing added yet.</Lead> : (
          <ul className="mt-3 divide-y divide-rule">
            {list.map(s => {
              const forgot = t.flagged.includes(s.id)
              const trialDays = s.trial ? daysBetween(today, s.trial) : null
              return (
                <li key={s.id} className="py-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-ui font-bold text-ink">{s.name}</p>
                      <p className="text-fine text-ink-2">{money(s.price)} {s.cycle}, so {money(monthlyCost(s.price, s.cycle))} a month</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {forgot && <Chip state="soon">Forgot? Check this one</Chip>}
                        {trialDays != null && trialDays >= 0 && trialDays <= 3 &&
                          <Chip state="due">Trial ends {niceDate(s.trial)}. Cancel now if you do not want it</Chip>}
                      </div>
                    </div>
                    <RemoveButton name={s.name} onClick={() => patch('subs', list.filter(x => x.id !== s.id))}/>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-fine text-ink-2">Last used
                    <select value={s.used} onChange={e => setUsed(s.id, e.target.value)}
                      className="min-h-[44px] rounded-[10px] border border-rule bg-card px-2 text-fine text-ink">
                      {USED.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                    </select>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
        {list.length > 0 && !g.result && (
          <Action className="mt-3 w-full sm:w-auto" onClick={() => win('Leaks found',
            [['Every month', money(t.monthly)], ['Every year', money(t.yearly)], ['Not used this month', t.flagged.length],
             ['Could save a year', money(t.flaggedYearly)]], ['plan'])}>I have checked them all</Action>
        )}
        {list.length > 0 && <Action kind="quiet" className="mt-2" onClick={() => patch('subs', [])}>Start again</Action>}
      </Panel>
    </>
  )
}

/* ── 24 hour pause ─────────────────────────────────────────────────────── */

function useNow(ms = 30e3) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t) }, [ms])
  return now
}

function Pause({ data, patch, g, win }) {
  const list = data.pause || []
  const kept = data.kept || 0
  const now = useNow()
  const [d, setD] = React.useState({ name:'', price:'' })
  const add = e => {
    e.preventDefault()
    if (!d.name.trim()) return
    patch('pause', [{ id: uid(), name: d.name.trim(), price: d.price, at: Date.now() }, ...list])
    setD({ name:'', price:'' })
  }
  const decide = (item, buy, e) => {
    patch('pause', list.filter(x => x.id !== item.id))
    if (!buy) {
      const add = parseFloat(item.price) || 0
      patch('kept', k => Math.round(((k || 0) + add) * 100) / 100)
      g.hit(10, e, { label:'kept', sound:'good' })
      if (!g.result) win('Skipped it', [['Kept this time', money(add)], ['Kept so far', money(kept + add)]], [])
    } else if (!g.result) win('Decided with a clear head', [['Waited', `${PAUSE_HOURS} hours`], ['Kept so far', money(kept)]], [])
  }
  return (
    <>
      <Panel>
        <Heading>Want it? Wait {PAUSE_HOURS} hours.</Heading>
        <Lead>Put it here instead of the cart. Tomorrow, decide with a clear head.</Lead>
        <form onSubmit={add} className="mt-3 grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
          <Field label="What is it?" value={d.name} onChange={e => setD({ ...d, name: e.target.value })} placeholder="Wireless earbuds"/>
          <Field label="Price" inputMode="decimal" value={d.price} onChange={e => setD({ ...d, price: digits(e.target.value) })} placeholder="49.99"/>
          <div className="flex items-end"><Action type="submit" className="w-full" disabled={!d.name.trim()}>Pause it</Action></div>
        </form>
      </Panel>
      <Panel>
        <Figure label="Kept by skipping" value={money(kept)}/>
        {list.length === 0 ? <Lead className="mt-3">Nothing waiting.</Lead> : (
          <ul className="mt-3 divide-y divide-rule">
            {list.map(i => {
              const s = pauseStatus(i.at, now)
              return (
                <li key={i.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-ui font-bold text-ink">{i.name}{i.price ? `, ${money(i.price)}` : ''}</p>
                    <Chip state={s.ready ? 'ok' : 'unset'}>{s.ready ? 'Ready to decide' : `Wait ${s.left}`}</Chip>
                  </div>
                  {s.ready ? (
                    <div className="mt-2">
                      <p className="text-fine text-ink-2">Do you still want it? Do you have the money without touching savings?</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Action kind="quiet" onClick={e => decide(i, true, e)}>Still want it</Action>
                        <Action onClick={e => decide(i, false, e)}>Skip it</Action>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={e => decide(i, false, e)}
                      className="mt-1 min-h-[44px] text-fine font-semibold text-ink-2 underline underline-offset-4">
                      Changed my mind already, skip it
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {(list.length > 0 || kept > 0) &&
          <Action kind="quiet" className="mt-2" onClick={() => { patch('pause', []); patch('kept', 0) }}>Start again</Action>}
      </Panel>
    </>
  )
}

/* ── Budget ────────────────────────────────────────────────────────────── */

const INCOME = [['job', 'Job or gigs'], ['allowance', 'Allowance'], ['gifts', 'Gifts']]
const SPEND = [['food', 'Food and snacks'], ['transport', 'Transport'], ['phone', 'Phone'], ['fun', 'Fun and going out'],
  ['clothes', 'Clothes'], ['subs', 'Subscriptions'], ['save', 'Saving'], ['other', 'Other']]

function Budget({ data, patch, g, win }) {
  const b = data.budget || {}
  const set = (k, v) => patch('budget', { ...b, [k]: digits(v) })
  const rows = list => list.map(([k]) => ({ amount: b[k] }))
  const r = budget(rows(INCOME), rows(SPEND))
  const share = r.income > 0 ? Math.min(1, r.spending / r.income) : r.spending > 0 ? 1 : 0
  const Money = ([k, label]) => (
    <Field key={k} label={label} inputMode="decimal" value={b[k] || ''} onChange={e => set(k, e.target.value)} placeholder="0"/>
  )
  return (
    <>
      <Panel>
        <Heading>Money in each month</Heading>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{INCOME.map(Money)}</div>
      </Panel>
      <Panel>
        <Heading>Money out each month</Heading>
        <Lead>Put Saving here too, so it happens first, not last.</Lead>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{SPEND.map(Money)}</div>
      </Panel>
      <Panel>
        <Heading>What is left</Heading>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Figure small label="In" value={moneyShort(r.income)}/>
          <Figure small label="Out" value={moneyShort(r.spending)}/>
          <Figure small label="Left" value={moneyShort(r.left)} tone={r.over ? 'bad' : undefined}/>
        </div>
        {r.over ? (
          <div className="mt-3" aria-hidden>
            <div className="kit-ground h-5 overflow-hidden rounded-bar">
              <div className="h-full rounded-bar bg-[#a11b1b]" style={{ width: '100%' }}/>
            </div>
          </div>
        ) : (
          <GoalMeter className="mt-3" reduced={g.reduced} value={share} label="Dollars with a job"
            right={r.income > 0 ? `${Math.round(share * 100)}%` : ''}/>
        )}
        {r.income > 0 && r.left === 0 && <Win className="mt-3" reduced={g.reduced}>Every dollar has a job.</Win>}
        <p className="mt-2 text-ui text-ink" role="status">
          {r.income === 0 && r.spending === 0 ? 'Fill in what comes in and goes out.'
            : r.over ? `You plan to spend ${money(-r.left)} more than comes in. Trim one category until Left is zero or more.`
            : r.left === 0 ? `Every dollar has a job. Nice planning.` : `You have planned ${Math.round(share * 100)}% of what comes in. ${money(r.left)} has no job yet: give it one, like saving.`}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {r.income > 0 && !r.over && !g.result && (
            <Action onClick={() => win('Budget locked in', [['In', money(r.income)], ['Out', money(r.spending)],
              ['Left with no job', money(r.left)], ['Saving', money(parseFloat(b.save) || 0)]], ['plan'])}>Lock in my budget</Action>
          )}
          <Action kind="quiet" onClick={() => patch('budget', {})}>Start again</Action>
        </div>
      </Panel>
    </>
  )
}

/* ── Compound interest ─────────────────────────────────────────────────── */

const C_PUT = '#2294e6', C_GROW = '#067049'   // validated pair, dataviz check

function Growth({ rows }) {
  const [pick, setPick] = React.useState(rows.length)
  React.useEffect(() => setPick(rows.length), [rows.length])
  const max = Math.max(1, ...rows.map(r => r.value))
  const W = 320, H = 170, L = 4, B = 22, top = 8
  const bw = (W - L) / rows.length
  const gap = Math.min(2, bw * 0.25)
  const y = v => top + (H - top - B) * (1 - v / max)
  const sel = rows[Math.max(0, Math.min(rows.length, pick) - 1)]
  const label = i => rows.length <= 10 || i === 0 || (i + 1) % 5 === 0 || i === rows.length - 1
  return (
    <figure className="mt-4">
      <div className="flex flex-wrap gap-4 text-fine text-ink-2">
        <span className="flex items-center gap-1.5"><span aria-hidden className="size-3 rounded-[3px]" style={{ background:C_PUT }}/>Money you put in</span>
        <span className="flex items-center gap-1.5"><span aria-hidden className="size-3 rounded-[3px]" style={{ background:C_GROW }}/>Interest earned</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img"
        aria-label={`Bar chart. After ${rows.length} years, ${money(sel && rows[rows.length - 1].value)} in total.`}>
        <line x1={L} x2={W} y1={H - B} y2={H - B} stroke="#c2d7ca"/>
        {rows.map((r, i) => {
          const x = L + i * bw + gap / 2, w = Math.max(1, bw - gap)
          const yPut = y(Math.min(r.contributed, r.value)), yAll = y(r.value)
          return (
            <g key={r.year} onPointerEnter={() => setPick(r.year)} onClick={() => setPick(r.year)} style={{ cursor:'pointer' }}>
              <rect x={L + i * bw} y={top} width={bw} height={H - top - B} fill="transparent"/>
              <rect x={x} y={yPut} width={w} height={Math.max(0, H - B - yPut)} fill={C_PUT} opacity={pick === r.year ? 1 : 0.85}/>
              {r.value - r.contributed > 0.005 && (
                <rect x={x} y={yAll} width={w} height={Math.max(0, yPut - yAll - (yPut - yAll > 3 ? 1.5 : 0))} rx={Math.min(2, w / 2)}
                  fill={C_GROW} opacity={pick === r.year ? 1 : 0.85}/>
              )}
              {label(i) && <text x={x + w / 2} y={H - 7} textAnchor="middle" fontSize="10" fill="#2a5744">{r.year}</text>}
            </g>
          )
        })}
      </svg>
      <label className="mt-2 block">
        <span className="text-fine font-semibold text-ink-2">Show year</span>
        <input type="range" min="1" max={rows.length} value={Math.min(pick, rows.length)} onChange={e => setPick(+e.target.value)}
          className="mt-1 block w-full accent-[#067049]"/>
      </label>
      {sel && (
        <p role="status" className="mt-1 text-ui text-ink">
          Year {sel.year}: {money(sel.value)} total. You put in {money(sel.contributed)}, interest added {money(sel.value - sel.contributed)}.
        </p>
      )}
      <details className="mt-2">
        <summary className="min-h-[44px] cursor-pointer py-2 text-fine font-semibold text-ink-2">Show as a table</summary>
        <table className="w-full text-left text-fine text-ink">
          <thead><tr className="text-ink-2"><th className="py-1 font-semibold">Year</th><th className="font-semibold">Put in</th><th className="font-semibold">Total</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.year} className="border-t border-rule"><td className="py-1">{r.year}</td><td>{money(r.contributed)}</td><td>{money(r.value)}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  )
}

const GUESS = interestQuiz()

function Interest({ data, patch, g, win }) {
  const c = { start:'100', monthly:'25', rate:'5', years:'10', ...(data.ci || {}) }
  const set = (k, v) => patch('ci', { ...c, [k]: digits(v) })
  const r = compound(c)
  const [quiz, setQuiz] = React.useState(false)
  return (
    <>
    {quiz && !g.result ? (
      <QuickRound className="mt-4" game={g} items={GUESS} label="Guess" seed={5} doneLabel="Finish"
        head={<p className="mb-3 text-fine text-ink-2">Assumes a fixed yearly rate, interest added monthly, no fees and no tax.</p>}
        onDone={grade => { setQuiz(false); win(grade.clean ? 'Interest pro' : 'Guesses done',
          [['Right', `${grade.right} of ${grade.total}`]], grade.clean ? ['clean'] : []) }}/>
    ) : !g.result && (
      <PlayCard title="Guess the total" line="Three quick guesses. Most people guess too low, for savings and for debt."
        onPlay={() => setQuiz(true)}/>
    )}
    <Panel>
      <Heading>Watch money grow</Heading>
      <Lead>Interest earns interest. Time does most of the work.</Lead>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Start with ($)" inputMode="decimal" value={c.start} onChange={e => set('start', e.target.value)}/>
        <Field label="Monthly add ($)" inputMode="decimal" value={c.monthly} onChange={e => set('monthly', e.target.value)}/>
        <Field label="Yearly rate (%)" inputMode="decimal" value={c.rate} onChange={e => set('rate', e.target.value)}/>
        <Field label="Years (1 to 50)" inputMode="numeric" value={c.years} onChange={e => set('years', e.target.value)}/>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Figure small label="Total" value={moneyShort(r.total, true)}/>
        <Figure small label="You put in" value={moneyShort(r.contributed, true)}/>
        <Figure small label="Interest" value={moneyShort(r.interest, true)}/>
      </div>
      <Growth rows={r.byYear}/>
      <div className="mt-4 rounded-[12px] bg-mist/60 p-3 text-fine text-ink">
        <p className="font-semibold">The formula</p>
        <p className="mt-1 font-mono text-[0.85rem]">Total = P(1 + r/12)<sup>12t</sup> + M × ((1 + r/12)<sup>12t</sup> - 1) / (r/12)</p>
        <p className="mt-1 text-ink-2">P is the start amount, M the monthly add, r the yearly rate as a decimal, t the years.
          Assumes the rate stays the same, interest is added monthly, you add money at the end of each month, and no fees or tax.
          Real savings rates and investments change, and investments can lose money.</p>
        <p className="mt-2 text-ink-2">It works against you too: a credit card balance grows the same way, often at 20% a year or more.</p>
      </div>
      <Action kind="quiet" className="mt-3" onClick={() => patch('ci', {})}>Start again</Action>
    </Panel>
    </>
  )
}

/* ── Credit score ──────────────────────────────────────────────────────── */

const FACTORS = [
  ['Payment history', 35, 'Paying every bill on time, every time.', 'Late or missed payments hurt most and stay on your report for years.'],
  ['Amounts owed', 30, 'Using a small part of your limit. Under 30% is common advice, lower is better.', 'Maxing out cards, even if you pay later.'],
  ['Length of history', 15, 'Keeping your oldest account open and in good shape.', 'Closing your oldest card can shorten your history.'],
  ['New credit', 10, 'Only applying for credit you need.', 'Lots of applications close together.'],
  ['Credit mix', 10, 'Handling different kinds well over time, like a card and a loan.', 'Taking on a loan just to change your mix is not worth it.'],
]
const QUIZ = [
  ['Checking your own credit score lowers it.', false, 'Myth. Checking your own score is a soft check and does not change it.'],
  ['Paying the full card balance each month avoids interest on purchases.', true, 'Fact. Pay in full by the due date and most cards charge no interest on purchases.'],
  ['You have to carry a balance to build credit.', false, 'Myth. Using the card and paying it off in full builds history too.'],
  ['One payment over 30 days late can drop a score a lot.', true, 'Fact. Payment history is the biggest part of the score.'],
]

const MYTHS = QUIZ.map(([q, truth, why], i) => ({ id:String(i), prompt:q, why, fixed:true,
  options:[{ id:'myth', text:'Myth', ok:!truth }, { id:'fact', text:'Fact', ok:truth }] }))

function Credit({ data, patch, g, win }) {
  const [open, setOpen] = React.useState(0)
  const [play, setPlay] = React.useState(false)
  const ans = data.quiz || {}
  const answered = Object.keys(ans).length
  const right = QUIZ.filter((q, i) => ans[i] === q[1]).length
  return (
    <>
      {play && !g.result ? (
        <QuickRound className="mt-4" game={g} items={MYTHS} label="Statement" doneLabel="Finish"
          onDone={(grade, picks) => {
            patch('quiz', Object.fromEntries(Object.entries(picks).map(([k, v]) => [k, v === 'fact'])))
            setPlay(false)
            win(grade.clean ? 'Myth buster' : 'Quiz done', [['Right', `${grade.right} of ${grade.total}`]], grade.clean ? ['clean'] : [])
          }}/>
      ) : !g.result && (
        <PlayCard title="Myth or fact?" line="Four things people say about credit. Bust the myths."
          onPlay={() => { patch('quiz', {}); setPlay(true) }}/>
      )}
      <Panel>
        <Heading>What a credit score is</Heading>
        <Lead>A number from 300 to 850 that tells lenders how likely you are to pay back. A higher score can mean
          cheaper loans, and landlords and phone companies may check it too.</Lead>
        <p className="mt-3 font-display text-ui font-semibold text-ink">What goes into it (FICO score weights). Tap one.</p>
        <div className="mt-2 grid gap-2">
          {FACTORS.map(([name, pct, helps, hurts], i) => (
            <div key={name}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}
                className={cn('w-full rounded-[12px] border p-3 text-left', open === i ? 'kit-edge border-2 bg-card' : 'border-rule bg-card')}>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-ui font-bold text-ink">{name}</span>
                  <span className="font-display text-ui font-bold tabular-nums text-ink">{pct}%</span>
                </span>
                <span aria-hidden className="kit-ground mt-2 block h-2.5 overflow-hidden rounded-bar">
                  <span className="kit-fill block h-full rounded-bar" style={{ width: pct / 35 * 100 + '%' }}/>
                </span>
                {open === i && (
                  <span className="mt-2 block text-fine text-ink">
                    <span className="block"><b>Helps:</b> {helps}</span>
                    <span className="mt-1 block"><b>Hurts:</b> {hurts}</span>
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-fine text-ink-2">In the US you usually need to be 18 to open a credit card in your own name, and under 21
          you need to show your own income. Get your free credit reports at AnnualCreditReport.com, the official site.
          This is general education, not financial advice.</p>
      </Panel>
      {answered > 0 && !play && (
      <Panel>
        <Heading>Myth or fact? Your answers</Heading>
        {answered > 0 && <ol className="mt-3 grid gap-3">
          {QUIZ.map(([q, truth, why], i) => (
            <li key={q} className="rounded-[12px] border border-rule p-3">
              <p className="text-ui font-semibold text-ink">{q}</p>
              <div role="group" aria-label="Your answer" className="mt-2 flex gap-2">
                <Choice on={ans[i] === false} onClick={() => patch('quiz', { ...ans, [i]: false })}>Myth</Choice>
                <Choice on={ans[i] === true} onClick={() => patch('quiz', { ...ans, [i]: true })}>Fact</Choice>
              </div>
              {i in ans && (
                <p className="mt-2 text-fine text-ink" role="status">
                  <b>{ans[i] === truth ? 'Right.' : 'Not quite.'}</b> {why}
                </p>
              )}
            </li>
          ))}
        </ol>}
        {answered === QUIZ.length && (
          <Figure className="mt-3" label="Your result" value={`${right} of ${QUIZ.length} right`}/>
        )}
        {answered > 0 && <Action kind="quiet" className="mt-3" onClick={() => patch('quiz', {})}>Start again</Action>}
      </Panel>
      )}
    </>
  )
}

const TABS = [['subs', 'Subscriptions'], ['pause', '24 hour pause'], ['budget', 'Budget'], ['interest', 'Interest'], ['credit', 'Credit score']]

const GOALS = {
  subs:     'Add what you pay for and spot one you could cut.',
  pause:    'Wait a day before you buy, then decide with a clear head.',
  budget:   'Give every dollar a job, saving first.',
  interest: 'Guess three totals, then play with the numbers.',
  credit:   'Bust four credit myths.',
}

export default function LifeMoney({ onExit }) {
  const g = useSkill(ID)
  const [end, setEnd] = React.useState(null)
  const [data, patch] = useStored(ID, { tab:'subs' })
  const tab = data.tab || 'subs'
  const win = (title, stats, marks) => { setEnd({ title, stats }); g.finish({ complete:true, marks }); window.scrollTo(0, 0) }
  const again = () => { setEnd(null); g.reset() }
  const go = v => { patch('tab', v); again() }
  return (
    <LifeScreen id={ID} family="mint" title="Money Check" icon={MoneyIcon} onExit={onExit}
      problem="Small charges and quick buys add up without you noticing."
      doing="Find the leaks, plan a month, and see how interest and credit work. Educational only.">
      <Sections label="Money tools" items={TABS} value={tab} onChange={go}/>
      <Quest className="mt-4" game={g} goal={GOALS[tab]} body="">
        {end && g.result && (
          <EndCard className="mt-4" game={g} title={end.title} stats={end.stats} againLabel="Keep going"
            onAgain={again} onDone={leave(onExit)}/>
        )}
        {tab === 'subs' && <Subs data={data} patch={patch} g={g} win={win}/>}
        {tab === 'pause' && <Pause data={data} patch={patch} g={g} win={win}/>}
        {tab === 'budget' && <Budget data={data} patch={patch} g={g} win={win}/>}
        {tab === 'interest' && <Interest data={data} patch={patch} g={g} win={win}/>}
        {tab === 'credit' && <Credit data={data} patch={patch} g={g} win={win}/>}
      </Quest>
    </LifeScreen>
  )
}
