import React from 'react'
import { Light } from '../signals/light.js'
import TeenPhone from './TeenPhone'
import { ParentPhone, SignalIcon } from './ParentReport'
import { LampFace } from './Face'
import { STATE_WORD } from './Parent'
import { useHeadsUp } from './useHeadsUp'
import { KEY_OF, RATE } from './core'
import { cn } from '../lib/utils'

/* The Heads Up tab. Three phones running at once: what the teen sees on the
 * two teen phones, what the parent sees on the third. Nothing to press; it
 * starts on open and loops. The teen phones take turns: about three seconds
 * of usual use, then the stressed use until the light is red, a hold on that
 * moment, then the other phone. The phone in its turn gets a ring once the
 * stressed use starts, with the signals called out under it; the other teen
 * phone dims. Every light is the real engine's, from real key and scroll
 * events, on a faster session clock.
 *
 * Every layout is symmetric about the column's centre line: equal tracks,
 * equal gaps, captions under the phones and never beside them, so the phones
 * sit exactly in the middle at every width. */

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

/* Three across when they fit, the two teen phones side by side over the
   parent's when two fit, one column otherwise. */
function layoutFor(W) {
  if (W >= 900) {
    const g = W >= 1180 ? 56 : 40
    return { cols: 3, g, s: clamp((W - 2 * g) / (3 * PHONE_W), 0.42, 0.66) }
  }
  if (W >= 560) {
    const g = 32
    return { cols: 2, g, s: clamp((W - g) / (2 * PHONE_W), 0.4, 0.62) }
  }
  return { cols: 1, g: 0, s: clamp((W - 2 * RING_GAP - 8) / PHONE_W, 0.4, 0.62) }
}

function StateLine({ light }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LampFace light={light} size={20}/>
      <span className="font-body text-ui font-semibold text-ink-2">{STATE_WORD[light] || STATE_WORD[Light.GREEN]}</span>
    </span>
  )
}

function TeenFigure({ kind, s, hu, label }) {
  const P = PHONE_W * s
  const phase = hu.phase[kind]
  const lit = phase === 'stress' || phase === 'detected'
  const dim = hu.focus != null && hu.focus !== kind
  const fade = hu.reduced ? undefined : 'opacity 400ms ease, filter 400ms ease'
  return (
    <figure className="m-0" style={{ width: P }} data-phone={kind}>
      <div className="relative" style={{ width: P, height: PHONE_H * s }}>
        <span aria-hidden className="pointer-events-none absolute"
          style={{ inset: -RING_GAP, borderRadius: PHONE_R * s + RING_GAP, boxShadow: RING, opacity: lit ? 1 : 0, transition: fade }}/>
        <div style={{ opacity: dim ? 0.6 : 1, filter: dim ? 'saturate(0.6)' : 'none', transition: fade }}>
          <TeenPhone kind={kind} scale={s} viewRef={hu.views[kind]} sessionRef={hu.sessions[kind]} clock={hu.clock}
            reduced={hu.reduced} label={label}/>
        </div>
      </div>
      <figcaption className="mt-4 flex flex-col items-center gap-1 text-center">
        <span className="font-display text-row font-bold text-ink">{TITLE[kind]}</span>
        <StateLine light={hu.teen[kind]}/>
        <ul aria-live="polite" aria-label={`Signals on the ${TITLE[kind].toLowerCase()} phone`}
          className="m-0 mt-1.5 flex min-h-[3.5rem] list-none flex-col items-center gap-1 p-0">
          {hu.detected[kind].map(l => (
            <li key={l} className="flex items-center gap-2 font-body text-ui font-semibold leading-snug text-ink"
              style={hu.reduced ? undefined : { animation: 'hu-label 220ms ease-out both' }}>
              <span className="shrink-0 text-beam-ink"><SignalIcon k={KEY_OF[l]} size={18}/></span>{l}
            </li>
          ))}
        </ul>
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
  const texting = <TeenFigure kind="texting" s={lay.s} hu={hu} label="The teen's phone, texting"/>
  const scrolling = <TeenFigure kind="scrolling" s={lay.s} hu={hu} label="The teen's phone, scrolling videos"/>
  const parent = (
    <figure className="m-0" style={{ width: P }} data-phone="parent">
      <ParentPhone {...hu.parent} scale={lay.s} reduced={hu.reduced}/>
    </figure>
  )
  return (
    <div ref={ref} className="w-full" data-stage>
      <style>{`@keyframes hu-label{from{opacity:0}to{opacity:1}}`}</style>
      {lay.cols === 3 ? (
        <div className="grid justify-center"
          style={{ gridTemplateColumns: `repeat(3, ${P}px)`, columnGap: lay.g, rowGap: 22 }}>
          <Heading style={{ gridColumn: '1 / 3', gridRow: 1 }}>What the teen sees</Heading>
          <Heading style={{ gridColumn: '3 / 4', gridRow: 1 }}>What the parent sees</Heading>
          <div style={{ gridColumn: 1, gridRow: 2 }}>{texting}</div>
          <div style={{ gridColumn: 2, gridRow: 2 }}>{scrolling}</div>
          <div style={{ gridColumn: 3, gridRow: 2 }}>{parent}</div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Heading>What the teen sees</Heading>
          {lay.cols === 2 ? (
            <div className="mt-6 grid justify-center" style={{ gridTemplateColumns: `repeat(2, ${P}px)`, columnGap: lay.g }}>
              {texting}{scrolling}
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-8">{texting}{scrolling}</div>
          )}
          <Heading className="mt-10">What the parent sees</Heading>
          <div className="mt-6">{parent}</div>
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
