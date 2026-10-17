import React from 'react'
import { Light } from '../signals/light.js'
import TeenPhone from './TeenPhone'
import { ParentPhone } from './ParentReport'
import { LampFace } from './Face'
import { STATE_WORD } from './Parent'
import { useHeadsUp } from './useHeadsUp'
import { TYPING_KEYS } from './core'
import { cn } from '../lib/utils'

/* The Heads Up tab. Three phones running at once: what the teen sees on the
 * left two, what the parent sees on the right. Nothing to press; it starts on
 * open and loops. Every light is the real engine's, from real key and scroll
 * events, on a 4x session clock. */

const PHONE_W = 413
const PHONE_H = 872

/* where each signal comes from, as a fraction of the drawn phone */
const TARGET = {
  typing: { x: 0.3, y: 0.665 },
  scrolling: { x: 0.68, y: 0.4 },
}

function useWidth(ref) {
  const [w, setW] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const on = () => setW(el.clientWidth)
    on()
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', on); return () => window.removeEventListener('resize', on) }
    const ro = new ResizeObserver(on)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}

/* Row when three phones and two label margins fit; a stack otherwise. */
function layoutFor(W) {
  const g = 28, G = 44
  if (W >= 900) {
    const L = W >= 1180 ? 176 : 140
    const s = Math.max(0.42, Math.min(0.66, (W - 2 * L - g - G) / (3 * PHONE_W)))
    return { row: true, L, g, G, s, font: W >= 1180 ? 24 : 20 }
  }
  const L = Math.round(Math.min(156, Math.max(104, W * 0.31)))
  const s = Math.max(0.4, Math.min(0.62, (W - L - 10) / PHONE_W))
  return { row: false, L, s, font: W >= 600 ? 20 : 16 }
}

/* The callout: a bold label in the margin and an arrow drawn from it, from
   outside the phone, to the place the signal comes from. */
function Callout({ c, side, L, P, H, font, reduced }) {
  if (!c) return null
  const where = TYPING_KEYS.has(c.key) ? TARGET.typing : TARGET.scrolling
  const x0 = side === 'left' ? L : 0
  const E = { x: x0 + P * where.x, y: H * where.y }
  const labelW = L - 18
  const labelTop = Math.max(0, E.y - 128)
  /* the arrow leaves from under the label, at the end nearer the phone */
  const lines = Math.max(1, Math.ceil((c.label.length * font * 0.56) / labelW))
  const below = labelTop + lines * font * 1.12 + 8
  const S = side === 'left' ? { x: labelW - 14, y: below } : { x: P + 18 + 14, y: below }
  const C1 = { x: S.x, y: E.y }
  const ang = Math.atan2(E.y - C1.y, E.x - C1.x)
  const head = 13
  const h1 = { x: E.x - head * Math.cos(ang - 0.5), y: E.y - head * Math.sin(ang - 0.5) }
  const h2 = { x: E.x - head * Math.cos(ang + 0.5), y: E.y - head * Math.sin(ang + 0.5) }
  const d = `M${S.x} ${S.y} Q${C1.x} ${C1.y} ${E.x} ${E.y}`
  const hd = `M${h1.x} ${h1.y} L${E.x} ${E.y} L${h2.x} ${h2.y}`
  return (
    <>
      <p key={c.id} className="pointer-events-none absolute z-20 m-0 font-display font-bold leading-[1.12] tracking-[-0.01em] text-ink"
        style={{ top: labelTop, left: side === 'left' ? 0 : P + 18, width: labelW, fontSize: font,
          textAlign: side === 'left' ? 'right' : 'left', animation: 'hu-label 220ms ease-out both' }}>
        {c.label}
      </p>
      <svg key={`${c.id}-a`} aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-visible" width="100%" height="100%">
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} stroke="#fff" strokeWidth="7" pathLength="1" strokeDasharray="1"
            style={reduced ? undefined : { strokeDashoffset: 1, animation: 'hu-draw 420ms cubic-bezier(0.23,1,0.32,1) forwards' }}/>
          <path d={d} stroke="#0d2b1e" strokeWidth="3" pathLength="1" strokeDasharray="1"
            style={reduced ? undefined : { strokeDashoffset: 1, animation: 'hu-draw 420ms cubic-bezier(0.23,1,0.32,1) forwards' }}/>
          <path d={hd} stroke="#fff" strokeWidth="7" style={reduced ? undefined : { opacity: 0, animation: 'hu-label 120ms 360ms ease-out forwards' }}/>
          <path d={hd} stroke="#0d2b1e" strokeWidth="3" style={reduced ? undefined : { opacity: 0, animation: 'hu-label 120ms 360ms ease-out forwards' }}/>
        </g>
      </svg>
    </>
  )
}

function StateLine({ light }) {
  return (
    <span className="inline-flex items-center gap-2" aria-live="polite">
      <LampFace light={light} size={20}/>
      <span className="font-body text-ui font-semibold text-ink-2">{STATE_WORD[light] || STATE_WORD[Light.GREEN]}</span>
    </span>
  )
}

function TeenFigure({ kind, side, lay, hu, label }) {
  const P = PHONE_W * lay.s, H = PHONE_H * lay.s
  const x0 = side === 'left' ? lay.L : 0
  const light = hu.teen[kind]
  return (
    <figure className="m-0" style={{ width: lay.L + P }}>
      <div className="relative" style={{ height: H }}>
        <div className="absolute top-0" style={{ left: x0 }}>
          <TeenPhone kind={kind} scale={lay.s} viewRef={hu.views[kind]} sessionRef={hu.sessions[kind]} clock={hu.clock}
            reduced={hu.reduced} label={label}/>
        </div>
        <Callout c={hu.callouts[kind]} side={side} L={lay.L} P={P} H={H} font={lay.font} reduced={hu.reduced}/>
        <p className="sr-only" aria-live="polite">{hu.callouts[kind]?.label || ''}</p>
      </div>
      <figcaption className="mt-3 flex flex-col items-center gap-1 text-center" style={{ marginLeft: x0, width: P }}>
        <span className="font-display text-row font-bold text-ink">{kind === 'texting' ? 'Texting' : 'Scrolling videos'}</span>
        <StateLine light={light}/>
      </figcaption>
    </figure>
  )
}

/* One line, centred over its phones even when wider than them: a flex box
   centres an overflowing child on both sides. */
function Heading({ children, className, style }) {
  return (
    <div className={cn('flex items-end justify-center', className)} style={style}>
      <h2 className="m-0 whitespace-nowrap text-center font-display font-bold leading-[1.1] tracking-[-0.022em] text-ink"
        style={{ fontSize: 'clamp(1.75rem, 2.7vw, 2.5rem)' }}>{children}</h2>
    </div>
  )
}

function Stage() {
  const ref = React.useRef(null)
  const W = useWidth(ref)
  const hu = useHeadsUp()
  const lay = layoutFor(W || 1200)
  const P = PHONE_W * lay.s
  const parent = (
    <figure className="m-0" style={{ width: P }}>
      <ParentPhone {...hu.parent} scale={lay.s} reduced={hu.reduced}/>
    </figure>
  )
  return (
    <div ref={ref} className="w-full">
      <style>{`@keyframes hu-draw{to{stroke-dashoffset:0}}@keyframes hu-label{from{opacity:0}to{opacity:1}}`}</style>
      {lay.row ? (
        <div className="grid justify-center"
          style={{ gridTemplateColumns: `${lay.L}px ${P}px ${lay.g}px ${P}px ${lay.L}px ${lay.G}px ${P}px`, rowGap: 22 }}>
          <Heading style={{ gridColumn: '2 / 5', gridRow: 1 }}>What the teen sees</Heading>
          <Heading style={{ gridColumn: '7 / 8', gridRow: 1 }}>What the parent sees</Heading>
          <div style={{ gridColumn: '1 / 3', gridRow: 2 }}>
            <TeenFigure kind="texting" side="left" lay={lay} hu={hu} label="The teen's phone, texting"/>
          </div>
          <div style={{ gridColumn: '4 / 6', gridRow: 2 }}>
            <TeenFigure kind="scrolling" side="right" lay={lay} hu={hu} label="The teen's phone, scrolling videos"/>
          </div>
          <div style={{ gridColumn: '7 / 8', gridRow: 2 }}>{parent}</div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Heading>What the teen sees</Heading>
          <div className="mt-6 flex flex-col items-center gap-10">
            <TeenFigure kind="texting" side="left" lay={lay} hu={hu} label="The teen's phone, texting"/>
            <TeenFigure kind="scrolling" side="left" lay={lay} hu={hu} label="The teen's phone, scrolling videos"/>
          </div>
          <Heading className="mt-14">What the parent sees</Heading>
          <div className="mt-6">{parent}</div>
        </div>
      )}
      <p className="mx-auto mt-8 text-center font-body text-meta text-ink-2">Time runs 4x faster here.</p>
    </div>
  )
}

const STEPS = [
  "Learns your teen's usual in their first week: how fast they type, how often they backspace, how fast they scroll, how often they scroll back, how long they stay on, and how still they hold the phone.",
  'Compares every session with those usuals. Messages, videos and apps are never read.',
  'When signals stay well above usual for a minute, your teen is offered a break first. Then your light turns red and you see which signals.',
]

const ROWS = [
  ['Reads texts and messages', 'Never', 'Many do. Privacy invasion.'],
  ['Logs every website and search', 'Never', 'Many do. Privacy invasion.'],
  ['Tracks location history', 'Never', 'Many do. Privacy invasion.'],
  ['Lists every app and every minute', 'No. Only signs of stress.', 'Yes. Frames use as misbehaviour.'],
  ['Blocks apps and locks the phone', 'No. It offers a break.', 'Yes. Built to punish.'],
  ['Treats your teen as a suspect', 'No', 'Yes. Surveillance that stigmatises.'],
  ['Notices when phone activity causes stress', 'Yes', 'No'],
  ['Tells your teen first', 'Yes', 'No'],
]

function Good({ children }) {
  return (
    <span className="inline-flex items-start gap-2 font-body text-ui font-semibold text-accent-ink">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-[2px] shrink-0" aria-hidden>
        <path d="M4 12.5l5 5L20 6.5"/>
      </svg>
      <span><span className="sr-only">Good: </span>{children}</span>
    </span>
  )
}
function Bad({ children }) {
  return (
    <span className="inline-flex items-start gap-2 font-body text-ui text-crit">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[2px] shrink-0" aria-hidden>
        <path d="M12 3.5 22 20.5H2Z"/><path d="M12 10v4.5M12 17.4h.01"/>
      </svg>
      <span><span className="sr-only">Concern: </span>{children}</span>
    </span>
  )
}

function Comparison() {
  return (
    <>
      <h2 className="m-0 font-display text-sub font-bold leading-[1.12] tracking-tight text-ink">What other apps do</h2>
      <p className="mt-2.5 max-w-[60ch] font-body text-sec leading-[1.5] text-ink-2">
        Other monitoring apps report what your teen does. Heads Up reports how phone activity affects them.
      </p>
      <div className="mt-6 hidden overflow-hidden rounded-panel border border-rule bg-card sm:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule bg-mist">
              <th scope="col" className="w-[38%] px-4 py-3"><span className="sr-only">What it does</span></th>
              <th scope="col" className="px-4 py-3 font-display text-ui font-bold text-ink">Heads Up</th>
              <th scope="col" className="px-4 py-3 font-display text-ui font-bold text-ink">Other apps</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([k, hu, them]) => (
              <tr key={k} className="border-b border-rule last:border-b-0">
                <th scope="row" className="px-4 py-3 align-top font-display text-ui font-bold text-ink">{k}</th>
                <td className="px-4 py-3 align-top"><Good>{hu}</Good></td>
                <td className="px-4 py-3 align-top"><Bad>{them}</Bad></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="m-0 mt-5 list-none space-y-3 p-0 sm:hidden">
        {ROWS.map(([k, hu, them]) => (
          <li key={k} className="rounded-panel border border-rule bg-card px-4 py-3">
            <p className="m-0 font-display text-ui font-bold text-ink">{k}</p>
            <dl className="m-0 mt-2 grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1.5">
              <dt className="font-body text-fine font-semibold text-ink-3">Heads Up</dt>
              <dd className="m-0"><Good>{hu}</Good></dd>
              <dt className="font-body text-fine font-semibold text-ink-3">Other apps</dt>
              <dd className="m-0"><Bad>{them}</Bad></dd>
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}

export function HeadsUpPage() {
  return (
    <main className="bg-paper">
      <section className="border-b border-rule bg-accent-wash">
        <div className="wrap py-8 lg:py-12">
          <h1 className="m-0 font-display text-page font-bold leading-[1] tracking-tight text-ink">Heads Up</h1>
          <p className="mt-4 max-w-[40ch] font-body text-lead font-semibold leading-[1.4] text-ink">
            Heads Up tells you when phone activity is causing your teen stress.
          </p>
          <p className="mt-2 max-w-[48ch] font-body text-sec leading-[1.45] text-ink-2">
            Heads Up never shows what they see or who they talk to.
          </p>
        </div>
      </section>

      <section className="bg-card">
        <div className="wrap py-10 lg:py-14"><Stage/></div>
      </section>

      <section className="border-t border-rule bg-sky-band">
        <div className="wrap py-10 lg:py-14">
          <h2 className="m-0 font-display text-sub font-bold leading-[1.12] tracking-tight text-ink">How it works</h2>
          <ol className="m-0 mt-6 grid list-none gap-6 p-0 md:grid-cols-3 md:gap-8">
            {STEPS.map((t, i) => (
              <li key={i} className="border-t-2 border-sky-ink pt-3">
                <span className="font-display text-head font-bold tabular-nums text-sky-ink">{i + 1}</span>
                <p className="mt-1.5 max-w-[40ch] font-body text-meta leading-[1.5] text-ink">{t}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-rule bg-paper">
        <div className="wrap py-10 lg:py-14"><Comparison/></div>
      </section>

      <footer className="border-t border-rule bg-mist">
        <div className="wrap py-6">
          <p className="m-0 max-w-[70ch] font-body text-fine leading-[1.5] text-ink-2">
            MindMap reports patterns in body signals. It is not a medical device and does not diagnose or treat any condition.
          </p>
        </div>
      </footer>
    </main>
  )
}

export default HeadsUpPage
