import React from 'react'
import { cn } from '../../lib/utils'
import { Bin, Plus } from '../../ui/marks'
import { Sheet, Choice, Action, FIELD, Note } from '../../toolkit/shell'
import { Screen, Intro, StepHead, Local, Row, Result, Done, I } from './parts'
import {
  START_APPS, FEELS, TRICKS, FREE_TIMES, NOTIF_CUTS, ADS_PER_MINUTE,
  attention, hoursText, drainers, trickCounts, suggestLimit, minutesSaved, readStore, writeStore,
} from './logic'

/* Feed Check: a digital wellness audit.
 *
 * 1. Your apps: minutes a day and how each one leaves you feeling.
 * 2. The trick deck: five persuasive design cards, one at a time; tap which
 *    of your apps use each.
 * 3. Your attention is the product: minutes a week, ads seen at a stated
 *    rate, hours a year.
 * 4. Boundaries: app limits, phone-free times, notification cuts.
 * Result: the saved plan, with where to set it on the phone, and a link to
 * Heads Up. Stored at `mindmap.skills.outside-feed`. */

export const ID = 'outside-feed'
export const FeedIcon = () => (
  <I><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M9 7h6M9 10.5h6M9 14h4"/><path d="M10.5 18.5h3"/></I>
)

const fresh = () => ({
  step:1, apps:START_APPS.map(a => ({ ...a, minutes:'', feel:'', tricks:[] })),
  limits:{}, free:[], notif:[], plan:null,
})

const toggle = (list, v) => list.includes(v) ? list.filter(x => x !== v) : [...list, v]

function Apps({ s, set }) {
  const [name, setName] = React.useState('')
  const edit = (i, patch) => set({ apps:s.apps.map((a, j) => j === i ? { ...a, ...patch } : a) })
  const add = e => {
    e.preventDefault()
    const n = name.trim()
    if (!n || s.apps.some(a => a.name.toLowerCase() === n.toLowerCase())) return
    set({ apps:[...s.apps, { name:n, ads:true, minutes:'', feel:'', tricks:[] }] }); setName('')
  }
  const used = s.apps.filter(a => Number(a.minutes) > 0)
  return (
    <>
      <StepHead n={1} of={4} title="Your apps" first/>
      <Note>Put in minutes a day. For real numbers, check Screen Time on iPhone or Digital Wellbeing on Android.
        Leave 0 for apps you do not use.</Note>
      <ul className="mt-4 grid gap-3">
        {s.apps.map((a, i) => (
          <li key={a.name}>
            <Sheet className="p-3.5 sm:p-4">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1 font-display text-meta font-bold text-ink">{a.name}</span>
                <label className="flex items-center gap-2">
                  <input type="number" inputMode="numeric" min="0" max="1440" step="5" value={a.minutes}
                    onChange={e => edit(i, { minutes:e.target.value })} placeholder="0"
                    aria-label={`${a.name}, minutes a day`}
                    className={cn(FIELD, 'w-[5.5rem] p-2.5 text-right tabular-nums')}/>
                  <span aria-hidden className="text-fine text-ink-2">min a day</span>
                </label>
                <button type="button" onClick={() => set({ apps:s.apps.filter((_, j) => j !== i) })}
                  aria-label={`Remove ${a.name}`}
                  className="kit-quiet grid size-12 shrink-0 place-items-center rounded-[12px]">
                  <Bin aria-hidden className="size-4"/>
                </button>
              </div>
              {Number(a.minutes) > 0 && (
                <fieldset className="mt-3">
                  <legend className="text-fine text-ink-2">After using it, I feel</legend>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {FEELS.map(f => (
                      <Choice key={f.id} on={a.feel === f.id} onClick={() => edit(i, { feel:f.id })}
                        className="min-h-[44px] px-3.5">{f.label}</Choice>
                    ))}
                  </div>
                </fieldset>
              )}
            </Sheet>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Add another app</span>
          <input className={FIELD} value={name} onChange={e => setName(e.target.value)} placeholder="Add another app"/>
        </label>
        <Action kind="quiet" type="submit" disabled={!name.trim()} aria-label="Add app">
          <Plus aria-hidden className="size-4"/>Add
        </Action>
      </form>
      <Row>
        <Action onClick={() => set({ step:2, card:0 })} disabled={!used.length}>Next: spot the tricks</Action>
      </Row>
    </>
  )
}

function Tricks({ s, set }) {
  const card = s.card || 0
  const t = TRICKS[card]
  const used = s.apps.filter(a => Number(a.minutes) > 0)
  const flip = name => set({ apps:s.apps.map(a => a.name === name ? { ...a, tricks:toggle(a.tricks || [], t.id) } : a) })
  return (
    <>
      <StepHead n={2} of={4} title="Spot the tricks"/>
      <Note>Apps are designed to be hard to put down. Read each card and tap the apps that use it.</Note>
      <Sheet className="mt-4">
        <p className="text-fine font-semibold text-ink-2">Card {card + 1} of {TRICKS.length}</p>
        <h4 className="kit-ink mt-1 font-display text-head font-bold tracking-tight">{t.name}</h4>
        <p className="mt-2 text-sec text-ink">{t.how}</p>
        <p className="mt-2 text-ui text-ink-2"><span className="font-bold text-ink">Counter move: </span>{t.fix}</p>
        <fieldset className="mt-4">
          <legend className="text-fine font-semibold text-ink-2">Which of your apps do this?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {used.map(a => (
              <Choice key={a.name} on={(a.tricks || []).includes(t.id)} onClick={() => flip(a.name)}>{a.name}</Choice>
            ))}
          </div>
        </fieldset>
      </Sheet>
      <Row>
        {card > 0
          ? <Action kind="quiet" onClick={() => set({ card:card - 1 })}>Back</Action>
          : <Action kind="quiet" onClick={() => set({ step:1 })}>Back</Action>}
        {card < TRICKS.length - 1
          ? <Action onClick={() => set({ card:card + 1 })}>Next card</Action>
          : <Action onClick={() => set({ step:3 })}>See your numbers</Action>}
      </Row>
    </>
  )
}

function Stat({ value, label, wide = false }) {
  return (
    <div className={cn('rounded-[14px] bg-card p-3.5 shadow-card', wide && 'col-span-2')}>
      <p className="kit-ink font-display text-stat font-bold tabular-nums">{value}</p>
      <p className="mt-1.5 text-fine text-ink-2">{label}</p>
    </div>
  )
}

function Numbers({ s, set }) {
  const a = attention(s.apps)
  const counts = trickCounts(s.apps)
  const top = TRICKS.filter(t => counts[t.id] > 0).sort((x, y) => counts[y.id] - counts[x.id])
  const worse = drainers(s.apps)
  return (
    <>
      <StepHead n={3} of={4} title="Your attention is the product"/>
      <p className="text-sec text-ink">Most of these apps are free because they sell ads. The longer you stay,
        the more ads they can sell. What they are selling is your time and attention.</p>
      <Result className="mt-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat wide value={hoursText(a.weekMinutes)} label="on these apps each week"/>
          <Stat value={a.adsWeek.toLocaleString()} label="ads seen each week, about"/>
          <Stat value={a.yearHours.toLocaleString()} label="hours a year at this pace"/>
        </div>
        <p className="mt-3 text-fine text-ink-2">Estimate. Assumes about {ADS_PER_MINUTE} ads a minute (one every
          {' '}{Math.round(1 / ADS_PER_MINUTE)} minutes) on apps that show ads. Real rates vary by app.</p>
      </Result>
      {worse.length > 0 && (
        <Sheet className="mt-4">
          <h4 className="font-display text-ui font-bold text-ink">Leaves you feeling worse</h4>
          <ul className="mt-2 grid gap-1 text-ui text-ink">
            {worse.map(w => <li key={w.name}>{w.name}, {hoursText(Number(w.minutes))} a day</li>)}
          </ul>
          <p className="mt-2 text-fine text-ink-2">Comparing yourself to other people's best moments drains most
            people. These are good first places for a limit.</p>
        </Sheet>
      )}
      {top.length > 0 && (
        <Sheet className="mt-4">
          <h4 className="font-display text-ui font-bold text-ink">Tricks you spotted</h4>
          <ul className="mt-2 grid gap-1 text-ui text-ink">
            {top.map(t => <li key={t.id}>{t.name}, in {counts[t.id]} {counts[t.id] === 1 ? 'app' : 'apps'}</li>)}
          </ul>
        </Sheet>
      )}
      <Row>
        <Action kind="quiet" onClick={() => set({ step:2, card:TRICKS.length - 1 })}>Back</Action>
        <Action onClick={() => {
          const limits = { ...s.limits }
          worse.forEach(w => { if (limits[w.name] == null) limits[w.name] = suggestLimit(w.minutes) })
          set({ step:4, limits })
        }}>Next: set boundaries</Action>
      </Row>
    </>
  )
}

function Limit({ app, value, onChange }) {
  const on = value != null
  const m = Number(app.minutes)
  return (
    <li className="rounded-[14px] border border-rule bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 font-display text-ui font-bold text-ink">
          {app.name}<span className="block text-fine font-normal text-ink-2">Now {hoursText(m)} a day</span>
        </span>
        <Choice on={on} onClick={() => onChange(on ? null : suggestLimit(m))}
          className="min-h-[44px] px-3.5">{on ? 'Limit on' : 'Add limit'}</Choice>
      </div>
      {on && (
        <div className="mt-2 flex items-center gap-2" role="group" aria-label={`${app.name} daily limit`}>
          <Action kind="quiet" className="min-h-[48px] px-4" aria-label="5 minutes less"
            onClick={() => onChange(Math.max(5, value - 5))}>-5</Action>
          <output className="kit-ink min-w-[6rem] flex-1 text-center font-display text-row font-bold tabular-nums"
            aria-live="polite">{hoursText(value)}</output>
          <Action kind="quiet" className="min-h-[48px] px-4" aria-label="5 minutes more"
            onClick={() => onChange(Math.min(1440, value + 5))}>+5</Action>
        </div>
      )}
    </li>
  )
}

function Bounds({ s, set }) {
  const used = s.apps.filter(a => Number(a.minutes) > 0)
    .sort((a, b) => (b.feel === 'worse') - (a.feel === 'worse') || Number(b.minutes) - Number(a.minutes))
  const setLimit = (name, v) => {
    const limits = { ...s.limits }
    if (v == null) delete limits[name]; else limits[name] = v
    set({ limits })
  }
  const any = Object.keys(s.limits).length || s.free.length || s.notif.length
  const save = () => {
    const plan = { limits:s.limits, free:s.free, notif:s.notif, saved:minutesSaved(s.apps, s.limits) }
    set({ step:5, plan })
  }
  return (
    <>
      <StepHead n={4} of={4} title="Set your boundaries"/>
      <Note>Pick what you will actually keep. Small and real beats big and forgotten.</Note>
      <h4 className="mt-4 font-display text-ui font-bold text-ink">Daily app limits</h4>
      <ul className="mt-2 grid gap-2">
        {used.map(a => <Limit key={a.name} app={a} value={s.limits[a.name]} onChange={v => setLimit(a.name, v)}/>)}
      </ul>
      <fieldset className="mt-5">
        <legend className="font-display text-ui font-bold text-ink">Phone-free times</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {FREE_TIMES.map(f => <Choice key={f} on={s.free.includes(f)} onClick={() => set({ free:toggle(s.free, f) })}>{f}</Choice>)}
        </div>
      </fieldset>
      <fieldset className="mt-5">
        <legend className="font-display text-ui font-bold text-ink">Notification cuts</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {NOTIF_CUTS.map(f => <Choice key={f} on={s.notif.includes(f)} onClick={() => set({ notif:toggle(s.notif, f) })}>{f}</Choice>)}
        </div>
      </fieldset>
      <Row>
        <Action kind="quiet" onClick={() => set({ step:3 })}>Back</Action>
        <Action onClick={save} disabled={!any}>Save my plan</Action>
      </Row>
    </>
  )
}

function Plan({ s, set, onExit, again }) {
  const p = s.plan
  const names = Object.keys(p.limits)
  return (
    <>
      <StepHead n={0} of={0} title="Your screen plan"/>
      <Result>
        {p.saved > 0 && (
          <p className="kit-ink font-display text-row font-bold">Frees up about {hoursText(p.saved)} a week</p>
        )}
        {names.length > 0 && (
          <div className="mt-3">
            <h4 className="font-display text-ui font-bold text-ink">Daily limits</h4>
            <ul className="mt-1 grid gap-0.5 text-ui text-ink">
              {names.map(n => <li key={n}>{n}: {hoursText(p.limits[n])}</li>)}
            </ul>
          </div>
        )}
        {p.free.length > 0 && (
          <div className="mt-3">
            <h4 className="font-display text-ui font-bold text-ink">Phone-free</h4>
            <p className="mt-1 text-ui text-ink">{p.free.join(', ')}</p>
          </div>
        )}
        {p.notif.length > 0 && (
          <div className="mt-3">
            <h4 className="font-display text-ui font-bold text-ink">Notifications</h4>
            <ul className="mt-1 grid gap-0.5 text-ui text-ink">{p.notif.map(n => <li key={n}>{n}</li>)}</ul>
          </div>
        )}
      </Result>
      <Sheet className="mt-4">
        <h4 className="font-display text-ui font-bold text-ink">Make it stick</h4>
        <ul className="mt-2 grid gap-1.5 text-ui text-ink">
          <li><b>iPhone:</b> Settings, Screen Time, App Limits.</li>
          <li><b>Android:</b> Settings, Digital Wellbeing, Dashboard, then tap the app.</li>
          <li>Move the apps you limited off your home screen.</li>
        </ul>
      </Sheet>
      <Sheet className="mt-4">
        <h4 className="font-display text-ui font-bold text-ink">How MindMap fits in</h4>
        <p className="mt-1 text-ui text-ink-2">Heads Up notices when phone time is stressing you out by watching how
          you react, not what you watch. Messages, videos and apps are never read.</p>
        <a href="#/heads-up" className="kit-ink mt-2 inline-flex min-h-[48px] items-center font-display text-ui
          font-bold underline underline-offset-4">How Heads Up works</a>
      </Sheet>
      <Row>
        <Done onExit={onExit}/>
        <Action kind="quiet" onClick={() => set({ step:4 })}>Change plan</Action>
        <Action kind="quiet" onClick={again}>Start again</Action>
      </Row>
    </>
  )
}

export default function Feed({ onExit }) {
  const [s, setS] = React.useState(() => {
    const saved = readStore(ID, null)
    return saved && saved.apps ? { ...fresh(), ...saved, step:saved.plan ? 5 : 1 } : fresh()
  })
  const set = patch => setS(prev => {
    const next = { ...prev, ...patch }
    writeStore(ID, { apps:next.apps, limits:next.limits, free:next.free, notif:next.notif, plan:next.plan })
    return next
  })
  const again = () => { const f = fresh(); writeStore(ID, { ...f, step:undefined }); setS(f) }
  return (
    <Screen id={ID} family="sky" title="Feed Check" icon={<FeedIcon/>} onExit={onExit}>
      {s.step === 1 && <Intro problem="Feeds are built to keep you scrolling, and comparing yourself can wear you down."
        doing="Audit your apps, spot the tricks they use, then set limits you choose."/>}
      {s.step === 1 && <Apps s={s} set={set}/>}
      {s.step === 2 && <Tricks s={s} set={set}/>}
      {s.step === 3 && <Numbers s={s} set={set}/>}
      {s.step === 4 && <Bounds s={s} set={set}/>}
      {s.step === 5 && s.plan && <Plan s={s} set={set} onExit={onExit} again={again}/>}
      <Local/>
    </Screen>
  )
}
