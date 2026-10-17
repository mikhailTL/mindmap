import React from 'react'
import { Light, SIGNAL } from '../signals/light.js'
import TeenPhone from './TeenPhone'
import { ParentPhone, SignalIcon } from './ParentReport'
import { LampFace } from './Face'
import { STATE_WORD } from './Parent'
import { useHeadsUp } from './useHeadsUp'
import { KEY_OF, RATE, TYPING_KEYS } from './core'
import { cn } from '../lib/utils'

/* The Heads Up tab. Three phones running at once: what the teen sees on the
 * two teen phones, what the parent sees on the third. Nothing to press; it
 * starts on open and loops. The teen phones take turns: about three seconds
 * of usual use, then the stressed use until the light is red, a hold on that
 * moment, then the other phone. The phone in its turn gets a ring once the
 * stressed use starts, with the signals called out under it; the other teen
 * phone loses its colour. Every light is the real engine's, from real key and
 * scroll events, on a faster session clock.
 *
 * Every layout is symmetric about the column's centre line, so the phones sit
 * exactly in the middle at every width; see the arrows note below. */

const PHONE_W = 413
const PHONE_H = 872
const PHONE_R = 65
const RING_GAP = 9
const RING = '0 0 0 3px #1d8fb0, 0 0 32px 6px rgba(29,143,176,0.32)'
const TITLE = { texting: 'Texting', scrolling: 'Scrolling videos' }

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

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

/* The arrows. Each signal, the moment the engine first sees it, gets a bold
   label beside the phone and an arrow drawn from the label to the part of the
   screen it comes from: the keyboard for typing signals, the feed for scroll
   and session signals. The parent's phone gets one too, at its light, when it
   turns red. The tip pulses so the eye lands on the screen, not the label.

   Every layout stays symmetric about the stage's centre line: from 900 up the
   columns are margin, phone, gap, phone, margin, phone, margin, with the
   texting label in the first margin, the scrolling label in the second and
   the parent's in the third, so both outer margins match. Under 560 there is
   no room beside a phone, so the label sits above it and the arrow drops in. */

/* where each signal comes from, as a fraction of the drawn phone */
const TARGET = {
  typing:    { x: 0.30, y: 0.665 },
  scrolling: { x: 0.66, y: 0.40 },
  parent:    { x: 0.155, y: 0.215, above: true, run: 0.108 },
}
const ARROW = '#1d8fb0'
const targetFor = label => (TYPING_KEYS.has(KEY_OF[label]) ? TARGET.typing : TARGET.scrolling)

/* The biggest label size at which the longest word of any signal
   ("backspacing") still fits its margin on one line. */
const LONGEST = Math.max(...Object.values(SIGNAL).flatMap(l => l.split(' ').map(w => w.length)))
const fontFor = L => Math.min(24, Math.floor((L - 16) / (LONGEST * 0.58)))

/* Three across when they fit, the two teen phones side by side over the
   parent's when two fit, one column otherwise. `L` is a label margin. */
function layoutFor(W) {
  if (W >= 900) {
    const L = W >= 1180 ? 168 : 150, g = 28
    return { cols: 3, L, g, s: clamp((W - 3 * L - g) / (3 * PHONE_W), 0.42, 0.66), font: fontFor(L) }
  }
  if (W >= 560) {
    const L = 128, g = 24
    return { cols: 2, L, g, s: clamp((W - 2 * L - g) / (2 * PHONE_W), 0.4, 0.62), font: fontFor(L) }
  }
  return { cols: 1, L: 0, g: 0, s: clamp((W - 2 * RING_GAP - 8) / PHONE_W, 0.4, 0.62), font: 19, top: 66 }
}

/* One arrow, in a box the size of the phone plus its label room. `side` is
   where the label sits: 'left' or 'right' of the phone, or 'top'. */
function Callout({ id, label, icon, where, side, L, P, H, T = 0, font, reduced }) {
  if (!label) return null
  const x0 = side === 'left' ? L : 0
  const E = { x: x0 + P * where.x, y: T + H * where.y }
  const R = 15
  let S, C, box, d, ang
  if (side === 'top') {
    /* down the outside of the phone on the target's side, then in, so the
       arrow never crosses the screen it points at */
    const left = where.x < 0.5
    const X = left ? -32 : P + 32
    S = { x: left ? P * 0.2 : P * 0.8, y: T - 8 }
    const tip = { x: E.x + (left ? -R - 3 : R + 3), y: E.y }
    d = `M${S.x} ${S.y} Q${X} ${S.y} ${X} ${S.y + 34} L${X} ${E.y - 26} Q${X} ${E.y} ${tip.x} ${tip.y}`
    ang = left ? 0 : Math.PI
    C = tip
    box = { top: 0, left: -24, width: P + 48, height: T - 14, textAlign: 'center', justifyContent: 'center' }
  } else {
    const w = L - 16
    const lines = Math.max(1, Math.ceil(((label.length + 3) * font * 0.55) / w))
    const top = where.above ? 0 : Math.max(0, E.y - 150)
    const below = top + lines * font * 1.15 + 12
    S = side === 'left' ? { x: w - 18, y: below } : { x: P + 16 + 18, y: below }
    if (where.above) {
      /* the parent's light: down the margin, across the strip just above the
         card, then down onto the light, so the arrow crosses no words */
      const run = T + H * where.run
      ang = Math.PI / 2
      C = { x: E.x, y: E.y - R - 3 }
      d = `M${S.x} ${S.y} L${S.x} ${run - 18} Q${S.x} ${run} ${S.x - 18} ${run} L${E.x + 18} ${run} Q${E.x} ${run} ${E.x} ${run + 18} L${C.x} ${C.y}`
    } else {
      const K = { x: S.x, y: E.y }
      ang = Math.atan2(E.y - K.y, E.x - K.x)
      /* the tip stops at the target ring, so the head stays visible */
      C = { x: E.x - (R + 3) * Math.cos(ang), y: E.y - (R + 3) * Math.sin(ang) }
      d = `M${S.x} ${S.y} Q${K.x} ${K.y} ${C.x} ${C.y}`
    }
    box = { top, left: side === 'left' ? 0 : P + 16, width: w,
      textAlign: side === 'left' ? 'right' : 'left', justifyContent: side === 'left' ? 'flex-end' : 'flex-start' }
  }
  const head = 16
  const tip = C
  const h1 = { x: tip.x - head * Math.cos(ang - 0.45), y: tip.y - head * Math.sin(ang - 0.45) }
  const h2 = { x: tip.x - head * Math.cos(ang + 0.45), y: tip.y - head * Math.sin(ang + 0.45) }
  const hd = `M${h1.x} ${h1.y} L${tip.x} ${tip.y} L${h2.x} ${h2.y} Z`
  const draw = reduced ? undefined : { strokeDashoffset: 1, animation: 'hu-draw 460ms cubic-bezier(0.23,1,0.32,1) forwards' }
  const late = reduced ? undefined : { opacity: 0, animation: 'hu-label 140ms 400ms ease-out forwards' }
  return (
    <React.Fragment key={id}>
      <p aria-hidden className="pointer-events-none absolute z-20 m-0 flex items-start gap-2 font-display font-bold
        leading-[1.15] tracking-[-0.01em] text-ink"
        style={{ ...box, fontSize: font, animation: reduced ? undefined : 'hu-label 220ms ease-out both' }}>
        {side !== 'left' && icon}
        {/* a highlighter stroke under the lower half of each line */}
        <span className="[text-wrap:balance]">
          <span className="[box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
            style={{ background: 'linear-gradient(transparent 56%, rgba(29,143,176,0.26) 56%, rgba(29,143,176,0.26) 94%, transparent 94%)' }}>
            {label}</span></span>
        {side === 'left' && icon}
      </p>
      <svg aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-visible" width="100%" height="100%">
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} stroke="#fff" strokeWidth="10" pathLength="1" strokeDasharray="1" style={draw}/>
          <path d={d} stroke={ARROW} strokeWidth="4.5" pathLength="1" strokeDasharray="1" style={draw}/>
          <path d={hd} stroke="#fff" strokeWidth="6" fill="#fff" style={late}/>
          <path d={hd} stroke={ARROW} strokeWidth="2.5" fill={ARROW} style={late}/>
          <circle cx={E.x} cy={E.y} r={R} stroke="#fff" strokeWidth="6" style={late}/>
          <circle cx={E.x} cy={E.y} r={R} stroke={ARROW} strokeWidth="3" style={late}/>
          {!reduced && (
            <circle cx={E.x} cy={E.y} r={R} stroke={ARROW} strokeWidth="3"
              style={{ transformOrigin: `${E.x}px ${E.y}px`, animation: 'hu-pulse 1.1s 460ms ease-out infinite' }}/>
          )}
        </g>
      </svg>
    </React.Fragment>
  )
}

function StateLine({ light }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LampFace light={light} size={20}/>
      <span className="font-body text-ui font-semibold text-ink-2">{STATE_WORD[light] || STATE_WORD[Light.GREEN]}</span>
    </span>
  )
}

/* A phone in its label room. The box is margin + phone (or label band +
   phone), and the phone sits at the box's own offset, so a column of these
   lines up with the grid. */
function Framed({ side, lay, children, callout, caption, dataPhone }) {
  const P = PHONE_W * lay.s, H = PHONE_H * lay.s
  const T = side === 'top' ? lay.top : 0
  const x0 = side === 'left' ? lay.L : 0
  const w = side === 'top' ? P : lay.L + P
  return (
    <figure className="m-0" style={{ width: w }} data-phone={dataPhone}>
      <div className="relative" style={{ height: T + H }}>
        <div className="absolute" style={{ left: x0, top: T, width: P, height: H }}>{children}</div>
        {callout && <Callout key={callout.id} {...callout} side={side} L={lay.L} P={P} H={H} T={T} font={lay.font}/>}
      </div>
      {caption && <figcaption className="mt-4 flex flex-col items-center gap-1 text-center"
        style={{ marginLeft: x0, width: P }}>{caption}</figcaption>}
    </figure>
  )
}

function TeenFigure({ kind, side, lay, hu, label }) {
  const s = lay.s, P = PHONE_W * s
  const phase = hu.phase[kind]
  const lit = phase === 'stress' || phase === 'detected'
  const dim = hu.focus != null && hu.focus !== kind
  const fade = hu.reduced ? undefined : 'opacity 400ms ease, filter 400ms ease'
  const list = hu.detected[kind]
  const now = list[list.length - 1]
  const callout = now ? {
    id: `${kind}-${now}`, label: now, where: targetFor(now), reduced: hu.reduced,
  } : null
  /* the phone out of its turn steps back by losing its colour, not its
     contrast: every word on it still clears 4.5 : 1 */
  return (
    <Framed side={side} lay={lay} dataPhone={kind} callout={callout} caption={<>
      <span className="font-display text-row font-bold text-ink">{TITLE[kind]}</span>
      <StateLine light={hu.teen[kind]}/>
      <ul aria-live="polite" aria-label={`Signals on the ${TITLE[kind].toLowerCase()} phone`}
        className="m-0 mt-1.5 flex min-h-[3.5rem] list-none flex-col items-center gap-1 p-0">
        {list.map(l => (
          <li key={l} className="flex items-center gap-2 font-body text-ui font-semibold leading-snug text-ink"
            style={hu.reduced ? undefined : { animation: 'hu-label 220ms ease-out both' }}>
            <span className="shrink-0 text-beam-ink"><SignalIcon k={KEY_OF[l]} size={18}/></span>{l}
          </li>
        ))}
      </ul>
    </>}>
      <div className="relative" style={{ width: P, height: PHONE_H * s }}>
        <span aria-hidden className="pointer-events-none absolute"
          style={{ inset: -RING_GAP, borderRadius: PHONE_R * s + RING_GAP, boxShadow: RING, opacity: lit ? 1 : 0, transition: fade }}/>
        <div style={{ filter: dim ? 'saturate(0.2)' : 'none', transition: fade }}>
          <TeenPhone kind={kind} scale={s} viewRef={hu.views[kind]} sessionRef={hu.sessions[kind]} clock={hu.clock}
            reduced={hu.reduced} label={label}/>
        </div>
      </div>
    </Framed>
  )
}

function ParentFigure({ side, lay, hu }) {
  const red = hu.parent.light === Light.RED
  const callout = red ? { id: 'parent-red', label: 'Light turns red', where: TARGET.parent, reduced: hu.reduced,
    icon: <span className="mt-[0.1em] shrink-0"><LampFace light="red" size={Math.round(lay.font * 0.95)}/></span> } : null
  return (
    <Framed side={side} lay={lay} dataPhone="parent" callout={callout}>
      <ParentPhone {...hu.parent} scale={lay.s} reduced={hu.reduced}/>
    </Framed>
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

const KEYFRAMES = `@keyframes hu-draw{to{stroke-dashoffset:0}}@keyframes hu-label{from{opacity:0}to{opacity:1}}
@keyframes hu-pulse{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(2.4)}}`

function Stage() {
  const ref = React.useRef(null)
  const W = useWidth(ref)
  const hu = useHeadsUp()
  const lay = layoutFor(W || 1200)
  const P = PHONE_W * lay.s
  const one = lay.cols === 1
  const texting = <TeenFigure kind="texting" side={one ? 'top' : 'left'} lay={lay} hu={hu} label="The teen's phone, texting"/>
  const scrolling = <TeenFigure kind="scrolling" side={one ? 'top' : 'right'} lay={lay} hu={hu} label="The teen's phone, scrolling videos"/>
  return (
    <div ref={ref} className="w-full" data-stage>
      <style>{KEYFRAMES}</style>
      {lay.cols === 3 ? (
        <div className="grid justify-center"
          style={{ gridTemplateColumns: `${lay.L}px ${P}px ${lay.g}px ${P}px ${lay.L}px ${P}px ${lay.L}px`, rowGap: 22 }}>
          <Heading style={{ gridColumn: '2 / 5', gridRow: 1 }}>What the teen sees</Heading>
          <Heading style={{ gridColumn: '6 / 7', gridRow: 1 }}>What the parent sees</Heading>
          <div style={{ gridColumn: '1 / 3', gridRow: 2 }}>{texting}</div>
          <div style={{ gridColumn: '4 / 6', gridRow: 2 }}>{scrolling}</div>
          <div style={{ gridColumn: '6 / 8', gridRow: 2 }}><ParentFigure side="right" lay={lay} hu={hu}/></div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Heading>What the teen sees</Heading>
          {lay.cols === 2 ? (
            <div className="mt-6 grid justify-center"
              style={{ gridTemplateColumns: `${lay.L + P}px ${lay.g}px ${lay.L + P}px` }}>
              {texting}<span/>{scrolling}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-8">{texting}{scrolling}</div>
          )}
          <Heading className="mt-10">What the parent sees</Heading>
          {/* two columns: an empty margin on the left keeps the phone centred */}
          <div className={one ? 'mt-4' : 'mt-6 grid'} style={one ? undefined : { gridTemplateColumns: `${lay.L}px ${lay.L + P}px` }}>
            {!one && <span/>}
            <ParentFigure side={one ? 'top' : 'right'} lay={lay} hu={hu}/>
          </div>
        </div>
      )}
      <p className="mx-auto mt-8 text-center font-body text-meta text-ink-2">Time runs {RATE}x faster here.</p>
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
