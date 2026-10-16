import React from 'react'
import TeenPhone, { useDemoDriver } from './Phone'
import { ParentLight, LightPill, styleFor } from './Parent'
import { initialBaseline, seededBaseline, clearBaseline, saveBaseline } from './baseline'
import { Light, KIND, FEATURES, READY_AFTER } from '../signals/light.js'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { Button } from '../ui/button'
import { ArrowLeft, Check, Never } from '../ui/marks'
import { cn } from '../lib/utils'

/* The Traffic Light page, under Parents. One phone, centred and big, and the
 * two views of it: the teen's, where the engine measures the visitor's own
 * scrolling and typing, and the parent's, which shows one light. Both read
 * the same lifted state, so switching never changes what is being measured.
 *
 * The engine is signals/light.js. The baseline is "learns your usual", never
 * AI, and the light is a prompt to look, never a diagnosis. */

const LG = '(min-width: 1024px)'
const SCALE_LG = 0.9
const SCALE_SM = 0.72

/* The screen's inset inside the IPhone drawing, in device points, so the
   Breathe overlay can sit exactly on the screen. Mirrors MODELS['15-pro']. */
const BEZEL = 10
const SCREEN_R = 55
const BREAK_MS = 10 * 1000

function useScale() {
  const [lg, setLg] = React.useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia?.(LG).matches)
  React.useEffect(() => {
    const mq = window.matchMedia?.(LG)
    if (!mq) return
    const on = () => setLg(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return lg ? SCALE_LG : SCALE_SM
}

const IDLE = { index: 0, light: Light.GREEN, top: null, words: 'About your usual.', features: {}, state: null }

/* ── the readout under the phone ───────────────────────────────────────── */

const fmt = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(d) : null)

const METERS = [
  ['Scroll speed', f => fmt(f.pxPerSec), 'px/s'],
  ['Reversals',    f => fmt(f.reversals == null ? null : f.reversals * 100), '%'],
  ['Typing gap',   f => fmt(f.medianGap), 'ms'],
  ['Deletions',    f => fmt(f.deletions == null ? null : f.deletions * 100), '%'],
  ['Minutes',      f => fmt(f.minutes, 1), 'min'],
]

function Meter({ label, value, unit, className }) {
  return (
    <div className={cn('min-w-0 rounded-field border border-rule bg-card px-3 py-2', className)}>
      <p className="text-fine leading-tight text-ink-3">{label}</p>
      <p className="mt-1 flex items-baseline gap-1 font-display text-row font-bold leading-none tabular-nums text-ink">
        {value == null ? <span className="text-ink-3">none</span> : value}
        {value != null && <span className="text-fine font-medium text-ink-3">{unit}</span>}
      </p>
    </div>
  )
}

function Readout({ live }) {
  const s = styleFor(live.light)
  const f = live.features || {}
  return (
    <div className="mt-5 w-full max-w-[52rem]">
      <div aria-live="polite" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <p className="flex items-baseline gap-2 font-display text-ink">
          <span className="text-fine text-ink-3">Index</span>
          <span className="text-stat font-bold leading-none tabular-nums">{live.index}</span>
          <span className="text-fine text-ink-3">of 100</span>
        </p>
        <p className={cn('font-display text-head font-bold leading-none tabular-nums', s.ink)}>{s.word}</p>
        <p className="w-full text-center text-meta text-ink-2 sm:w-auto">{live.words}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {METERS.map(([label, pick, unit], i) => (
          <Meter key={label} label={label} value={pick(f)} unit={unit}
            className={i === METERS.length - 1 ? 'col-span-2 sm:col-span-1' : undefined}/>
        ))}
      </div>
    </div>
  )
}

/* ── the Breathe screen, inside the mockup, ten seconds ───────────────── */

function BreakScreen({ scale, seconds }) {
  return (
    <div role="status" aria-label="Breathe"
      className="absolute flex flex-col items-center justify-center bg-aqua text-center"
      style={{ inset: BEZEL * scale, borderRadius: SCREEN_R * scale }}>
      <span aria-hidden className="block rounded-full bg-accent-wash"
        style={{ width: 160 * scale, height: 160 * scale, boxShadow: 'inset 0 0 0 3px #0a6e68' }}/>
      <p className="mt-5 font-display font-bold tracking-tight text-ink"
        style={{ fontSize: 34 * scale, lineHeight: 1 }}>Breathe</p>
      <p className="mt-2 text-ink-2 tabular-nums" style={{ fontSize: 18 * scale }}>
        In for four, out for six. {seconds} s
      </p>
    </div>
  )
}

/* ── the page ───────────────────────────────────────────────────────────── */

const TOGGLE = 'min-h-[44px] rounded-field border px-4 font-display text-ui font-medium ' +
  'select-none touch-manipulation transition-colors duration-150 ' +
  'aria-pressed:border-accent-ink aria-pressed:bg-accent aria-pressed:font-bold aria-pressed:text-paper ' +
  'border-rule bg-card text-ink-2 aria-[pressed=false]:hoverOnly:bg-mist'

const HOW = [
  ['Learns your usual', `${READY_AFTER} sessions first, then every session updates it.`, null],
  ['Measures the reaction', 'Six signals, each against their own usual.', FEATURES.map(f => KIND[f])],
  ['Decides', 'Red needs a full minute, then holds for five.', null],
]

const ROWS = [
  ['Watches content',             'yes', 'never'],
  ['Lists apps and contacts',     'yes', 'never'],
  ['Counts hours for the parent', 'yes', 'only on red'],
  ['Measures how the teen reacts', 'no', 'yes'],
  ['Tells the teen first',        'no',  'yes'],
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

export default function TrafficLightPage({ go }) {
  const scale = useScale()
  const [baseline, setBaseline] = React.useState(initialBaseline)
  const [live, setLive] = React.useState(IDLE)
  const [who, setWho] = React.useState('teen')
  const [epoch, setEpoch] = React.useState(0)
  const [breakLeft, setBreakLeft] = React.useState(0)
  const driverRef = React.useRef(null)
  const { play, stop, playing } = useDemoDriver(driverRef)

  const onState = React.useCallback(s => { setLive(s) }, [])
  const onBreak = React.useCallback(() => { setBreakLeft(Math.round(BREAK_MS / 1000)) }, [])
  const clock = React.useCallback(() => Date.now(), [])

  /* The Breathe screen counts down inside the mockup and then gets out of
     the way. The teen's phone stays mounted under it, so nothing resets. */
  React.useEffect(() => {
    if (breakLeft <= 0) return
    const id = setTimeout(() => setBreakLeft(n => n - 1), 1000)
    return () => clearTimeout(id)
  }, [breakLeft])

  function reset() {
    stop()
    clearBaseline()
    const b = seededBaseline()
    saveBaseline(b)
    setBaseline(b)
    setLive(IDLE)
    setBreakLeft(0)
    setEpoch(n => n + 1)
  }

  const teen = who === 'teen'

  return (
    <main>
      {/* ── hero ── */}
      <div className="border-b border-rule bg-beam-wash">
        <div className="wrap py-5 lg:py-7">
          <button onClick={() => go('parents')}
            className="mb-3 flex min-h-[44px] w-fit items-center gap-2 py-2 font-display text-meta
              font-medium text-accent transition-colors duration-150 hoverOnly:text-accent-ink">
            <ArrowLeft aria-hidden className="size-4"/> Parents
          </button>
          <p className="font-body text-ui font-semibold text-accent-ink">The Traffic Light</p>
          <h1 className="mt-2 max-w-[16ch] font-display text-major font-bold leading-[1.06] tracking-tight text-ink">
            One light, not a report
          </h1>
          <p className="mt-3 max-w-[42ch] text-sec font-medium leading-[1.35] text-ink">
            MindMap measures how your teen reacts to their phone, never what is on it.
          </p>
        </div>
      </div>

      {/* ── the phone ── */}
      <Section tone="paper" tight>
        <div className="flex flex-col items-center">
          <div role="group" aria-label="Which phone" className="flex gap-2">
            <button type="button" className={TOGGLE} aria-pressed={teen} onClick={() => setWho('teen')}>
              Teen's phone
            </button>
            <button type="button" className={TOGGLE} aria-pressed={!teen} onClick={() => setWho('parent')}>
              Parent's phone
            </button>
          </div>

          {/* Both phones stay mounted in one cell so the engine keeps
              measuring while the parent's view is up. */}
          <div className="mt-5 grid">
            <div className={cn('relative col-start-1 row-start-1', !teen && 'invisible pointer-events-none')}
              aria-hidden={!teen}>
              <TeenPhone key={epoch} baseline={baseline} scale={scale} onState={onState}
                onBreak={onBreak} driverRef={driverRef} clock={clock}/>
              {breakLeft > 0 && <BreakScreen scale={scale} seconds={breakLeft}/>}
            </div>
            <div className={cn('col-start-1 row-start-1', teen && 'invisible pointer-events-none')}
              aria-hidden={teen}>
              <ParentLight live={live} scale={scale}/>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => (playing ? stop() : play())}>
              {playing ? 'Stop the demo' : 'Play the demo'}
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>Reset</Button>
          </div>
          <p className="mt-2 text-fine text-ink-3">Or scroll and type in the phone yourself. The demo runs the clock four times faster.</p>

          <Readout live={live}/>
        </div>
      </Section>

      {/* ── how the light is decided ── */}
      <Section tone="card" className="bg-aqua" tight>
        <SectionHead>How the light is decided</SectionHead>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:gap-4">
          {HOW.map(([title, line, list]) => (
            <div key={title} className="rounded-panel border border-rule bg-card p-3.5">
              <h3 className="font-display text-row font-bold leading-tight tracking-tight text-ink">{title}</h3>
              <p className="mt-1.5 text-meta leading-[1.4] text-ink-2">{line}</p>
              {list && (
                <ul className="m-0 mt-2.5 flex list-none flex-wrap gap-1.5 p-0">
                  {list.map(k => (
                    <li key={k} className="rounded-chip border border-rule bg-paper px-2 py-0.5 text-fine text-ink-2">{k}</li>
                  ))}
                </ul>
              )}
              {title === 'Decides' && (
                <div className="mt-2.5 flex gap-2">
                  {[Light.GREEN, Light.YELLOW, Light.RED].map(l => <LightPill key={l} light={l}/>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── what makes it different ── */}
      <Section tone="paper" tight>
        <SectionHead>What makes it different</SectionHead>
        <SectionLede>Other apps watch the screen. MindMap watches the reaction.</SectionLede>
        <div className="mt-3 overflow-x-auto rounded-panel border border-rule bg-card">
          <table className="w-full border-collapse text-left">
            <caption className="border-b border-rule bg-aqua px-3.5 py-2 text-left font-display text-fine font-bold text-ink">
              Five things a parental app does, and what MindMap does instead
            </caption>
            <thead>
              <tr className="border-b border-rule">
                <th scope="col" className="px-3.5 py-2 font-body text-fine font-semibold text-ink-3">What it does</th>
                <th scope="col" className="px-3.5 py-2 font-body text-fine font-semibold text-ink-3">Screen Time and Qustodio</th>
                <th scope="col" className="px-3.5 py-2 font-body text-fine font-semibold text-accent-ink">MindMap</th>
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
        <p className="mt-3 max-w-[60ch] text-meta leading-[1.45] text-ink-2">
          On iPhone the engine runs inside MindMap and its keyboard. On Android it can run across apps.
        </p>
      </Section>
    </main>
  )
}
