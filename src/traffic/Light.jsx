import React from 'react'
import TeenPhone, { useDemoDriver } from './Phone'
import { ParentLight, LampLabel } from './Parent'
import { IOS, StatusBar } from './ios'
import { initialBaseline, seededBaseline, clearBaseline, saveBaseline } from './baseline'
import { Light } from '../signals/light.js'
import { Section, SectionHead } from '../ui/section'
import { Button } from '../ui/button'
import { ArrowLeft, Check, Never } from '../ui/marks'
import { useReduced } from '../toolkit/useReduced'
import { cn } from '../lib/utils'

/* The Heads Up page, under Parents. The teen's phone and the parent's phone,
 * side by side on a desktop and one at a time on a phone. Both read the same
 * lifted state, so switching never changes what is being measured.
 *
 * The engine is signals/light.js. The baseline "learns your teen's usual",
 * never AI, and the light is a prompt to look, never a diagnosis. */

const LG = '(min-width: 1024px)'
const TEEN_SCALE = 0.82
const PARENT_SCALE_LG = 0.7

/* The screen's inset inside the IPhone drawing, in device points, so the
   breathing screen can sit exactly on the teen's screen. Mirrors
   MODELS['15-pro'] in ui/iphone.jsx. */
const BEZEL = 10
const SCREEN_W = 393
const SCREEN_H = 852
const SCREEN_R = 55
const IN_MS = 4000
const BREAK_MS = 10 * 1000

function useLg() {
  const [lg, setLg] = React.useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia?.(LG).matches)
  React.useEffect(() => {
    const mq = window.matchMedia?.(LG)
    if (!mq) return
    const on = () => setLg(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return lg
}

const IDLE = { index: 0, light: Light.GREEN, top: null, words: '', features: {}, state: null }

/* ── the segmented control ─────────────────────────────────────────────── */

function Segmented({ label, value, options, onChange, className }) {
  return (
    <div role="group" aria-label={label}
      className={cn('grid w-full max-w-[22rem] grid-cols-2 gap-1 rounded-[12px] bg-mist p-1', className)}>
      {options.map(([k, word]) => {
        const on = value === k
        return (
          <button key={k} type="button" aria-pressed={on} onClick={() => onChange(k)}
            className={cn('min-h-[44px] rounded-[9px] px-3 font-display text-ui select-none touch-manipulation',
              'transition-[background-color,color,box-shadow] duration-150',
              on ? 'bg-card font-bold text-ink shadow-[0_1px_3px_rgba(13,43,30,0.16),0_0_0_0.5px_rgba(13,43,30,0.08)]'
                : 'font-medium text-ink-2 hoverOnly:text-ink')}>
            {word}
          </button>
        )
      })}
    </div>
  )
}

/* ── the readout under the phones ──────────────────────────────────────── */

const fmt = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(d) : null)
const pct = v => fmt(v == null ? null : v * 100)

const MEASURES = [
  ['Scroll speed',   f => fmt(f.pxPerSec), 'px/s'],
  ['Back and forth', f => pct(f.reversals), '%'],
  ['Time per key',   f => fmt(f.medianGap), 'ms'],
  ['Deleting',       f => pct(f.deletions), '%'],
  ['Minutes',        f => fmt(f.minutes, 1), 'min'],
]

function Readout({ live }) {
  const f = live.features || {}
  return (
    <div className="mt-6 w-full max-w-[52rem] rounded-panel border border-rule bg-card">
      <div aria-live="polite" className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <span className="font-body text-ui font-semibold text-ink-2">Light now</span>
        <LampLabel light={live.light}/>
      </div>
      <dl className="m-0 grid grid-cols-1 sm:grid-cols-5">
        {MEASURES.map(([label, pick, unit]) => {
          const v = pick(f)
          return (
            <div key={label}
              className="flex items-baseline justify-between gap-3 border-b border-rule px-4 py-2.5 last:border-b-0
                sm:block sm:border-b-0 sm:border-l sm:first:border-l-0">
              <dt className="text-meta leading-tight text-ink-2">{label}</dt>
              <dd className="m-0 font-display text-row font-bold leading-none tabular-nums text-ink sm:mt-1.5">
                {v == null ? <span className="font-medium text-ink-3">none yet</span> : v}
                {v != null && <span className="ml-1 text-fine font-medium text-ink-3">{unit}</span>}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

/* ── the breathing screen, inside the teen's phone, ten seconds ────────── */

function BreakScreen({ scale, onDone, boxRef }) {
  const reduced = useReduced()
  const [phase, setPhase] = React.useState('start')
  const doneRef = React.useRef(onDone); doneRef.current = onDone
  const doneBtn = React.useRef(null)

  /* Focus goes to Done on open. The page puts it back on close. */
  React.useEffect(() => { doneBtn.current?.focus({ preventScroll: true }) }, [])

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase('in'))
    const a = setTimeout(() => setPhase('out'), IN_MS)
    const b = setTimeout(() => doneRef.current?.(), BREAK_MS)
    return () => { cancelAnimationFrame(raf); clearTimeout(a); clearTimeout(b) }
  }, [])

  const grow = phase === 'in'
  const ms = phase === 'in' ? IN_MS : BREAK_MS - IN_MS
  return (
    <div ref={boxRef} className="absolute overflow-hidden"
      style={{ left: BEZEL * scale, top: BEZEL * scale, width: SCREEN_W * scale, height: SCREEN_H * scale,
        borderRadius: SCREEN_R * scale }}>
      <div role="dialog" aria-label="Breathe"
        onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); doneRef.current?.() } }}
        className="flex flex-col items-center"
        style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${scale})`, transformOrigin: 'top left',
          background: '#f2f2f7', fontFamily: IOS.font, color: IOS.label }}>
        <span aria-hidden className="absolute left-1/2 top-3 h-9 w-[126px] -translate-x-1/2 rounded-[20px] bg-black"/>
        <StatusBar className="w-full"/>
        <div className="flex flex-1 flex-col items-center justify-center">
          <span aria-hidden className="grid size-[260px] place-items-center rounded-full"
            style={{ background: 'rgba(29,143,176,0.12)' }}>
            <span className="block size-[240px] rounded-full"
              style={{ background: '#1d8fb0',
                transform: `scale(${reduced ? 0.8 : grow ? 1 : 0.5})`,
                transition: reduced ? 'none' : `transform ${ms}ms cubic-bezier(0.37,0,0.63,1)` }}/>
          </span>
          <p aria-live="polite" className="m-0 mt-10 text-[28px] font-semibold leading-[34px]">
            {phase === 'out' ? 'Breathe out' : 'Breathe in'}
          </p>
          <p className="m-0 mt-1 text-[17px] leading-[22px]" style={{ color: IOS.secondary }}>
            {phase === 'out' ? 'Slowly, for six seconds.' : 'Through your nose, for four.'}
          </p>
        </div>
        <div className="w-full px-6 pb-12">
          <button ref={doneBtn} type="button" onClick={() => doneRef.current?.()}
            className="h-[52px] w-full rounded-[14px] text-[17px] font-semibold text-white active:opacity-80"
            style={{ background: IOS.blue }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── How it works: three steps, each with a small drawing ──────────────── */

function DrawUsual() {
  return (
    <svg viewBox="0 0 160 64" className="h-16 w-40" aria-hidden>
      <path d="M8 44h144" stroke="currentColor" className="text-rule" strokeWidth="2"/>
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} cx={14 + i * 22} cy={44} r={7} className="fill-sky" opacity={0.35 + i * 0.1}/>
      ))}
      <path d="M10 22c30-10 50 8 76 0s44-8 66 0" fill="none" className="stroke-sky-ink" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function DrawReact() {
  return (
    <svg viewBox="0 0 160 64" className="h-16 w-40" aria-hidden>
      <rect x="6" y="22" width="148" height="18" rx="4" className="fill-beam-wash"/>
      <path d="M6 34c18 0 22-4 36-4s18 6 32 4 16-22 30-24 18 10 26 10 14-4 24-4" fill="none"
        className="stroke-beam" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function DrawLight() {
  return (
    <svg viewBox="0 0 160 64" className="h-16 w-40" aria-hidden>
      <rect x="34" y="12" width="92" height="40" rx="20" fill="#1c1c1e"/>
      <circle cx="56" cy="32" r="12" fill={IOS.green}/>
      <circle cx="80" cy="32" r="12" fill={IOS.yellow}/>
      <circle cx="104" cy="32" r="12" fill={IOS.red}/>
    </svg>
  )
}

const STEPS = [
  ['Learns your teen\'s usual', 'The first seven sessions set the usual. Each one after updates it.', DrawUsual],
  ['Watches how they react', 'Heads Up times scrolling, typing and deleting. Content is never read.', DrawReact],
  ['Turns green, yellow or red', 'Red needs a full minute well above usual. Parents hear about red only.', DrawLight],
]

/* ── the comparison table ──────────────────────────────────────────────── */

const ROWS = [
  ['Watches content',              'yes', 'never'],
  ['Lists apps and contacts',      'yes', 'never'],
  ['Counts hours for the parent',  'yes', 'only on red'],
  ['Measures how the teen reacts', 'no',  'yes'],
  ['Tells the teen first',         'no',  'yes'],
]

function Cell({ v }) {
  const yes = v === 'yes'
  const never = v === 'never' || v === 'no'
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-display text-ui font-semibold',
      yes ? 'text-ink' : never ? 'text-ink-3' : 'text-accent-ink')}>
      {yes ? <Check aria-hidden className="size-4"/> : never ? <Never aria-hidden className="size-4"/> : null}
      {v}
    </span>
  )
}

/* ── the page ───────────────────────────────────────────────────────────── */

export default function TrafficLightPage({ go }) {
  const lg = useLg()
  const [baseline, setBaseline] = React.useState(initialBaseline)
  const [live, setLive] = React.useState(IDLE)
  const [scene, setScene] = React.useState('messages')
  const [who, setWho] = React.useState('teen')
  const [epoch, setEpoch] = React.useState(0)
  const [breathing, setBreathing] = React.useState(false)
  const driverRef = React.useRef(null)
  const { play, stop, playing } = useDemoDriver(driverRef, scene)

  const onState = React.useCallback(s => { setLive(s) }, [])
  /* The breathing screen takes focus when it opens. When it closes with focus
     still inside, focus goes back to what opened it, or to the teen's phone
     when that is gone (the notification's own button unmounts on a break). */
  const openerRef = React.useRef(null)
  const breakBox = React.useRef(null)
  const teenBox = React.useRef(null)
  const onBreak = React.useCallback(() => {
    openerRef.current = document.activeElement
    setBreathing(true)
  }, [])
  const endBreak = React.useCallback(() => {
    const had = !!breakBox.current?.contains(document.activeElement)
    setBreathing(false)
    if (!had) return
    requestAnimationFrame(() => {
      const o = openerRef.current
      openerRef.current = null
      if (o && o !== document.body && o.isConnected && o.getClientRects().length
        && !o.closest('[inert],[aria-hidden="true"]')) {
        o.focus({ preventScroll: true })
        return
      }
      const g = teenBox.current?.querySelector('[role="group"]') || teenBox.current
      if (!g) return
      if (!g.hasAttribute('tabindex')) g.setAttribute('tabindex', '-1')
      g.focus({ preventScroll: true })
    })
  }, [])
  const clock = React.useCallback(() => Date.now(), [])

  function pickScene(k) {
    if (k === scene) return
    stop()
    setScene(k)
  }

  function reset() {
    stop()
    clearBaseline()
    const b = seededBaseline()
    saveBaseline(b)
    setBaseline(b)
    setLive(IDLE)
    setBreathing(false)
    setEpoch(n => n + 1)
  }

  const showTeen = lg || who === 'teen'
  const showParent = lg || who === 'parent'
  const parentScale = lg ? PARENT_SCALE_LG : TEEN_SCALE

  return (
    <main>
      {/* ── 1. hero ── */}
      <div className="border-b border-rule bg-beam-wash">
        <div className="wrap py-5 lg:py-8">
          <button onClick={() => go('parents')}
            className="mb-3 flex min-h-[44px] w-fit items-center gap-2 py-2 font-display text-meta
              font-medium text-accent transition-colors duration-150 hoverOnly:text-accent-ink">
            <ArrowLeft aria-hidden className="size-4"/> Parents
          </button>
          <h1 className="font-display text-major font-bold leading-[1.06] tracking-tight text-ink">Heads Up</h1>
          <p className="mt-3 max-w-[56ch] text-sec font-medium leading-[1.4] text-ink">
            Heads Up tells you when your teen's phone use looks stressful.
          </p>
          <p className="mt-1 max-w-[42ch] text-sec leading-[1.4] text-ink-2">
            Heads Up never shows what they see or who they talk to.
          </p>
        </div>
      </div>

      {/* ── 2. the demo ── */}
      <Section tone="paper" tight>
        <div className="flex flex-col items-center">
          <Segmented label="What the teen is doing" value={scene} onChange={pickScene}
            options={[['messages', 'Texting'], ['reels', 'Scrolling videos']]}/>
          {!lg && (
            <Segmented label="Which phone" value={who} onChange={setWho} className="mt-2.5"
              options={[['teen', 'Teen\'s phone'], ['parent', 'Your phone']]}/>
          )}

          {/* Both phones stay mounted so the engine keeps measuring while the
              parent's view is up. Under lg they share one grid cell. */}
          <div className="mt-6 grid justify-items-center lg:flex lg:items-end lg:justify-center lg:gap-14">
            <figure className={cn('col-start-1 row-start-1 m-0 flex flex-col items-center',
              !showTeen && 'invisible pointer-events-none')} aria-hidden={!showTeen}>
              <div ref={teenBox} className="relative">
                <TeenPhone key={epoch} scene={scene} baseline={baseline} scale={TEEN_SCALE}
                  onState={onState} onBreak={onBreak} driverRef={driverRef} clock={clock} interactive/>
                {breathing && <BreakScreen scale={TEEN_SCALE} onDone={endBreak} boxRef={breakBox}/>}
              </div>
              {lg && <figcaption className="mt-3 font-display text-ui font-semibold text-ink">Your teen's phone</figcaption>}
            </figure>
            <figure className={cn('col-start-1 row-start-1 m-0 flex flex-col items-center',
              !showParent && 'invisible pointer-events-none')} aria-hidden={!showParent}>
              <ParentLight live={live} scale={parentScale}/>
              {lg && <figcaption className="mt-3 font-display text-ui font-semibold text-ink">Your phone</figcaption>}
            </figure>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => (playing ? stop() : play())}>
              {playing ? 'Stop' : 'Play the demo'}
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>Start over</Button>
          </div>
          <p className="mt-2.5 max-w-[40ch] text-center text-meta leading-[1.45] text-ink-2">
            Or text and scroll in the phone yourself. The demo runs the clock four times faster.
          </p>

          <Readout live={live}/>
        </div>
      </Section>

      {/* ── 3. how it works ── */}
      <Section tone="card" className="bg-aqua" tight>
        <SectionHead>How it works</SectionHead>
        <ol className="m-0 mt-4 grid list-none gap-6 p-0 sm:grid-cols-3 sm:gap-8">
          {STEPS.map(([title, line, Draw], i) => (
            <li key={title} className="border-t-2 border-beam pt-3">
              <Draw/>
              <h3 className="mt-2 font-display text-row font-bold leading-tight tracking-tight text-ink">
                <span className="mr-2 tabular-nums text-beam-ink">{i + 1}</span>{title}
              </h3>
              <p className="mt-1.5 max-w-[34ch] text-meta leading-[1.45] text-ink-2">{line}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── 4. compared with other apps ── */}
      <Section tone="paper" tight>
        <SectionHead>Compared with other parental control apps</SectionHead>
        <div className="mt-4 overflow-x-auto rounded-panel border border-rule bg-card">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-rule bg-sky-wash">
                <th scope="col" className="px-3.5 py-2.5 font-body text-fine font-semibold text-ink-2">What it does</th>
                <th scope="col" className="px-3.5 py-2.5 font-body text-fine font-semibold text-ink-2">Screen Time and Qustodio</th>
                <th scope="col" className="px-3.5 py-2.5 font-body text-fine font-bold text-ink">Heads Up</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([k, them, us]) => (
                <tr key={k} className="border-b border-rule last:border-b-0">
                  <th scope="row" className="px-3.5 py-2.5 font-display text-ui font-semibold text-ink">{k}</th>
                  <td className="px-3.5 py-2.5"><Cell v={them}/></td>
                  <td className="px-3.5 py-2.5"><Cell v={us}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 5. where it runs ── */}
      <Section tone="card" className="bg-beam-wash" tight>
        <p className="max-w-[60ch] text-sec leading-[1.5] text-ink">
          On iPhone the engine runs inside MindMap and its keyboard. On Android it can run across apps.
        </p>
      </Section>
    </main>
  )
}
