import React from 'react'
import { Section, SectionHead } from '../../ui/section'
import { ArrowRight, ChevronDown } from '../../ui/marks'
import { useReduced } from '../../toolkit/useReduced'
import { PRO, SCORE } from '../../lib/terms'
import { ScrollRow, Parallax2D } from '../../ui/motion'
import { cn } from '../../lib/utils'

/* What makes MindMap different: ten features, one hue each.
 *
 * At lg and up it is a vertical tablist on the left and one large panel on the
 * right. Hovering or pressing a row selects it. While the band is on screen and
 * the reader has not touched it, the selection moves on every five seconds; any
 * hover, press, key or focus stops that for good, and reduced motion never
 * starts it. Under lg the same rows are an accordion and nothing moves by
 * itself, because a row opening on its own would shove the page under a thumb.
 *
 * Every line was checked against the code before it went in:
 *   the score       signals/score.js sends the heart terms through the Mind
 *                   Score network in signals/tnam.js
 *   the patch       a design; no unit has been built or worn (Methods.jsx)
 *   Heads Up        signals/light.js: how the phone is used, never what is on it
 *   no patch        30 s of camera and 15 s of microphone (Methods.jsx)
 *   exercises       the six Phone sensors tools in toolkit/index.jsx; the
 *                   other five do not measure, so the line does not say "each"
 *   did it help     toolkit/after.jsx, a camera pulse before and after
 *   MindMap AI      ai/Ai.jsx; answers only when the server has a key, so the
 *                   line promises a topic and not "any time"
 *
 * Colour: DEFAULT draws, ink writes, wash grounds. The class strings are
 * written out in full so Tailwind finds them. */

const HUES = {
  accent: { draw: 'text-accent', ink: 'text-accent-ink', wash: 'bg-accent-wash', bar: 'bg-accent', btn: 'bg-accent-ink' },
  beam:   { draw: 'text-beam',   ink: 'text-beam-ink',   wash: 'bg-beam-wash',   bar: 'bg-beam',   btn: 'bg-beam-ink' },
  sky:    { draw: 'text-sky',    ink: 'text-sky-ink',    wash: 'bg-sky-wash',    bar: 'bg-sky',    btn: 'bg-sky-ink' },
  coral:  { draw: 'text-coral',  ink: 'text-coral-ink',  wash: 'bg-coral-wash',  bar: 'bg-coral',  btn: 'bg-coral-ink' },
  lilac:  { draw: 'text-lilac',  ink: 'text-lilac-ink',  wash: 'bg-lilac-wash',  bar: 'bg-lilac',  btn: 'bg-lilac-ink' },
  sun:    { draw: 'text-sun',    ink: 'text-sun-ink',    wash: 'bg-sun-wash',    bar: 'bg-sun',    btn: 'bg-sun-ink' },
  mint:   { draw: 'text-mint',   ink: 'text-mint-ink',   wash: 'bg-mint-wash',   bar: 'bg-mint',   btn: 'bg-mint-ink' },
  blush:  { draw: 'text-blush',  ink: 'text-blush-ink',  wash: 'bg-blush-wash',  bar: 'bg-blush',  btn: 'bg-blush-ink' },
}

const ADVANCE_MS = 5000

/* ── the small marks, 24 box, for the row tiles ─────────────────────────── */

const I = ({ children }) => (
  <svg viewBox="0 0 24 24" width={26} height={26} fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const MARKS = {
  network: () => <I><circle cx="5" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="12" r="2.4"/><path d="M7 7.5l3 4M7 7l3-1.6M7 16.5l3-4M7 17l3 1.6M14 5.6l3.4 5M14 12h2.6M14 18.4l3.4-5"/></I>,
  patch:   () => <I><rect x="3" y="7" width="18" height="10" rx="5"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 12h1.5M16 12h1.5"/></I>,
  heads:   () => <I><rect x="6" y="2.5" width="12" height="19" rx="2.6"/><rect x="8" y="5.5" width="8" height="3.4" rx="1.2"/><path d="M9 12.5h6M9 15.5h4"/></I>,
  camera:  () => <I><rect x="6" y="2.5" width="12" height="19" rx="2.6"/><circle cx="12" cy="7.5" r="2"/><path d="M8 15h2l1-2 1.6 4 1-2H16"/></I>,
  settle:  () => <I><path d="M3 17h3.5c2 0 2.4-11 5-11s3 8 5.5 10H21"/><path d="M3 20h18" strokeDasharray="1.5 2.5"/></I>,
  event:   () => <I><rect x="3.5" y="5" width="17" height="15" rx="2.4"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M7 17l3-2.4 2.4 1 3.6-3.6"/></I>,
  breath:  () => <I><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.4" strokeDasharray="2 2.6"/><circle cx="12" cy="12" r="9.4"/></I>,
  helped:  () => <I><path d="M2.5 9h3l1.5-4 2 8 1.5-4h2"/><path d="M12.5 15h2l1.2-2.4 1.6 4.4 1.2-2h3"/><path d="M12 5.5l2 2-2 2" /></I>,
  sharing: () => <I><circle cx="8" cy="8" r="3"/><path d="M3 19c.6-3.4 2.6-5 5-5s4.4 1.6 5 5"/><rect x="14" y="11" width="7.5" height="4.4" rx="2.2"/><circle cx="19.3" cy="13.2" r="1.3" fill="currentColor" stroke="none"/></I>,
  ai:      () => <I><path d="M4 5.5h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-3.4 3v-3H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z"/><path d="M19 9.5h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.6v2.4L16.6 17.5H13"/></I>,
}

/* ── the large drawings, 320 by 200, for the panel ─────────────────────────
   Stroke is currentColor, which the panel sets to the hue's DEFAULT. Grounds
   inside a drawing are card white so the hue reads against its own wash. */

const D = ({ children, label }) => (
  <svg viewBox="0 0 320 200" className="h-auto w-full max-w-[460px]" aria-hidden focusable="false"
    fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
    data-drawing={label}>
    {children}
  </svg>
)

const DRAWINGS = {
  network: () => (
    <D label="network">
      <path d="M14 100c8 0 10-30 18-30s10 60 18 60 10-30 16-30" strokeWidth="2.6"/>
      {[[96, 52], [96, 100], [96, 148]].flatMap(([x1, y1]) =>
        [[176, 40], [176, 84], [176, 128], [176, 164]].map(([x2, y2]) =>
          <path key={`${x1}${y1}${x2}${y2}`} d={`M${x1} ${y1}L${x2} ${y2}`} strokeWidth="1.4" opacity=".55"/>))}
      {[[176, 40], [176, 84], [176, 128], [176, 164]].map(([x, y]) =>
        <path key={`o${y}`} d={`M${x} ${y}L250 100`} strokeWidth="1.4" opacity=".55"/>)}
      <path d="M68 100h18" strokeWidth="2"/>
      {[52, 100, 148].map(y => <circle key={y} cx="96" cy={y} r="11" className="fill-card"/>)}
      {[40, 84, 128, 164].map(y => <circle key={y} cx="176" cy={y} r="11" className="fill-card"/>)}
      <circle cx="268" cy="100" r="30" className="fill-card"/>
      <path d="M248 112a22 22 0 0 1 40 0" strokeWidth="5"/>
      <path d="M268 112l10-14" strokeWidth="3"/>
      <circle cx="268" cy="112" r="3.5" fill="currentColor" stroke="none"/>
    </D>
  ),
  patch: () => (
    <D label="patch">
      <path d="M40 30c30 10 50 40 56 80s4 70 0 90" strokeWidth="2" opacity=".5"/>
      <path d="M150 20c-10 30-12 70-8 110s8 60 6 70" strokeWidth="2" opacity=".5"/>
      <rect x="58" y="72" width="92" height="54" rx="27" className="fill-card" transform="rotate(-8 104 99)"/>
      <circle cx="104" cy="99" r="11" transform="rotate(-8 104 99)"/>
      <circle cx="104" cy="99" r="3.5" fill="currentColor" stroke="none"/>
      <path d="M196 46h8l5-14 7 28 5-14h11" strokeWidth="2.6"/>
      <path d="M196 88h8c4 0 5-14 9-14s5 14 9 14h14" strokeWidth="2.6"/>
      <path d="M196 120c12 0 14 4 22 6s14 6 24 8" strokeWidth="2.6"/>
      <path d="M196 160h6l3-6 4 12 3-6h10l3-5 3 10 3-5h7" strokeWidth="2.6"/>
      <path d="M160 92l24-40M162 100h22M162 108l22 14M160 116l24 40" strokeWidth="1.4" strokeDasharray="3 5" opacity=".6"/>
    </D>
  ),
  heads: () => (
    <D label="heads up">
      <rect x="44" y="14" width="96" height="176" rx="18" className="fill-card"/>
      <rect x="54" y="30" width="76" height="26" rx="8" fill="currentColor" opacity=".18" stroke="none"/>
      <rect x="54" y="30" width="76" height="26" rx="8" strokeWidth="2"/>
      <path d="M62 43h40" strokeWidth="2.4"/>
      {[74, 92, 110, 128, 146, 164].map((y, i) =>
        <path key={y} d={`M58 ${y}h${i % 2 ? 50 : 66}`} strokeWidth="2" opacity=".45"/>)}
      <path d="M150 104h40" strokeWidth="2" strokeDasharray="4 6"/>
      <path d="M184 96l8 8-8 8" strokeWidth="2.4"/>
      <rect x="204" y="44" width="76" height="124" rx="16" className="fill-card"/>
      <circle cx="242" cy="96" r="20" fill="currentColor" opacity=".9" stroke="none"/>
      <path d="M224 134h36M230 146h24" strokeWidth="2.4" opacity=".55"/>
    </D>
  ),
  camera: () => (
    <D label="camera reading">
      <rect x="110" y="14" width="100" height="176" rx="18" className="fill-card"/>
      <rect x="126" y="28" width="34" height="34" rx="9"/>
      <circle cx="143" cy="45" r="8"/>
      <ellipse cx="150" cy="58" rx="26" ry="32" fill="currentColor" opacity=".16" stroke="none"/>
      <path d="M124 128h18l7-20 10 40 8-28 6 8h23" strokeWidth="3"/>
      <circle cx="176" cy="44" r="4" fill="currentColor" stroke="none"/>
      <path d="M232 70a30 30 0 0 1 0 60M248 58a48 48 0 0 1 0 84" strokeWidth="2.4" opacity=".6"/>
    </D>
  ),
  settle: () => (
    <D label="recovery time">
      <path d="M20 168h284" strokeWidth="2" opacity=".5"/>
      <path d="M20 140h284" strokeWidth="2" strokeDasharray="4 6" opacity=".6"/>
      <path d="M20 140c30 0 44-2 60-8s28-102 44-102 30 60 60 96 46 14 120 14" strokeWidth="3.4"/>
      <circle cx="124" cy="30" r="7" className="fill-card"/>
      <circle cx="232" cy="140" r="7" fill="currentColor" stroke="none"/>
      <path d="M124 184h108" strokeWidth="2.4"/>
      <path d="M124 178v12M232 178v12" strokeWidth="2.4"/>
    </D>
  ),
  event: () => (
    <D label="stress before events">
      <rect x="196" y="38" width="104" height="126" rx="14" className="fill-card"/>
      <path d="M196 70h104" strokeWidth="2.4"/>
      <path d="M222 28v20M274 28v20" strokeWidth="3"/>
      <circle cx="248" cy="116" r="22" fill="currentColor" opacity=".18" stroke="none"/>
      <path d="M236 116l9 9 16-18" strokeWidth="3.4"/>
      <path d="M18 170h168" strokeWidth="2" opacity=".5"/>
      <path d="M18 160c40 0 60-2 80-10s50-40 82-64" strokeWidth="3.4"/>
      <path d="M170 84l12 1-2 12" strokeWidth="3"/>
    </D>
  ),
  breath: () => (
    <D label="exercises that measure">
      <circle cx="110" cy="100" r="76" strokeWidth="2" strokeDasharray="4 7" opacity=".55"/>
      <circle cx="110" cy="100" r="52" strokeWidth="2.6" opacity=".75"/>
      <circle cx="110" cy="100" r="28" fill="currentColor" opacity=".2" stroke="none"/>
      <circle cx="110" cy="100" r="28"/>
      <rect x="214" y="30" width="80" height="140" rx="16" className="fill-card"/>
      <path d="M226 100c6 0 6-18 12-18s6 36 12 36 6-18 12-18 6 12 12 12h6" strokeWidth="2.8"/>
      <circle cx="254" cy="146" r="5" fill="currentColor" stroke="none"/>
    </D>
  ),
  helped: () => (
    <D label="did it help">
      <rect x="20" y="40" width="120" height="120" rx="16" className="fill-card"/>
      <rect x="180" y="40" width="120" height="120" rx="16" className="fill-card"/>
      <path d="M32 104h18l7-30 9 52 8-34 6 12h40" strokeWidth="3"/>
      <path d="M192 108h26l6-14 8 26 6-12h44" strokeWidth="3"/>
      <rect x="48" y="138" width="64" height="8" rx="4" fill="currentColor" stroke="none"/>
      <rect x="208" y="138" width="38" height="8" rx="4" fill="currentColor" stroke="none"/>
      <path d="M150 100h20M164 92l8 8-8 8" strokeWidth="3"/>
    </D>
  ),
  sharing: () => (
    <D label="teens control sharing">
      <circle cx="74" cy="72" r="24" className="fill-card"/>
      <path d="M30 156c4-30 22-48 44-48s40 18 44 48" className="fill-card"/>
      <rect x="168" y="44" width="76" height="40" rx="20" fill="currentColor" stroke="none"/>
      <circle cx="224" cy="64" r="14" className="fill-card" stroke="none"/>
      <rect x="168" y="116" width="76" height="40" rx="20" className="fill-card"/>
      <circle cx="188" cy="136" r="14" fill="currentColor" opacity=".35" stroke="none"/>
      <circle cx="276" cy="64" r="11"/>
      <path d="M262 92c2-10 8-14 14-14s12 4 14 14" strokeWidth="2.6"/>
      <circle cx="276" cy="134" r="11" opacity=".5"/>
      <path d="M262 162c2-10 8-14 14-14s12 4 14 14" strokeWidth="2.6" opacity=".5"/>
      <path d="M124 82l34-12M124 128l34 8" strokeWidth="2" strokeDasharray="3 6" opacity=".6"/>
    </D>
  ),
  ai: () => (
    <D label="MindMap AI">
      <path d="M30 34h150a16 16 0 0 1 16 16v44a16 16 0 0 1-16 16H82l-30 24v-24H30a16 16 0 0 1-16-16V50a16 16 0 0 1 16-16z" className="fill-card"/>
      <path d="M38 62h110M38 84h74" strokeWidth="2.6" opacity=".55"/>
      <path d="M150 104h138a16 16 0 0 1 16 16v34a16 16 0 0 1-16 16h-14v22l-26-22H150a16 16 0 0 1-16-16v-34a16 16 0 0 1 16-16z"
        fill="currentColor" opacity=".18" stroke="none"/>
      <path d="M150 104h138a16 16 0 0 1 16 16v34a16 16 0 0 1-16 16h-14v22l-26-22H150a16 16 0 0 1-16-16v-34a16 16 0 0 1 16-16z"/>
      {[192, 216, 240].map(x => <circle key={x} cx={x} cy="138" r="6" fill="currentColor" stroke="none"/>)}
    </D>
  ),
}

/* ── the ten ────────────────────────────────────────────────────────────── */

export const DIFFERENT = [
  { id: 'network', hue: 'accent', go: 'methods',
    title: SCORE,
    line: 'One daily number from our own neural network.' },
  { id: 'patch', hue: 'beam', go: 'patch',
    title: 'Wearable patch',
    line: 'Designed to read pulse, sweat, temperature and movement.' },
  { id: 'heads', hue: 'sky', go: 'heads-up',
    title: 'Heads Up',
    line: 'Tells parents about stressful phone use, never the content.' },
  { id: 'camera', hue: 'coral', go: 'without-patch',
    title: 'No patch needed',
    line: 'A 45 second reading with your camera and microphone.' },
  { id: 'settle', hue: 'lilac', go: 'methods',
    title: 'Recovery time',
    line: 'How fast your body settles after a peak, from the patch.' },
  { id: 'event', hue: 'sun', go: 'calendar',
    title: 'Stress before events',
    line: 'How stress builds before a test you marked, from the patch.' },
  { id: 'breath', hue: 'mint', go: 'toolkit',
    title: 'Measured exercises',
    line: 'Your phone measures breath, stillness and reaction time.' },
  { id: 'helped', hue: 'blush', go: 'toolkit',
    title: 'Before and after',
    line: 'A pulse check before and after shows what works.' },
  { id: 'sharing', hue: 'sky', go: 'privacy',
    title: 'Sharing controls',
    line: `Teens choose what parents and ${PRO}s see.` },
  { id: 'ai', hue: 'coral', go: 'ai',
    title: 'MindMap AI',
    line: 'Ask questions about stress, sleep and school.' },
]

/* Keyframes the panel and the timer bar need. Tailwind's config is not this
   file's to change, so they live here; reduced motion takes both away. */
const KEYFRAMES = `
@keyframes mm-diff-in { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
@keyframes mm-diff-run { from { transform: scaleX(0) } to { transform: scaleX(1) } }
.mm-diff-in { animation: mm-diff-in .32s cubic-bezier(0.23,1,0.32,1) both }
.mm-diff-run { transform-origin: left; animation: mm-diff-run ${ADVANCE_MS}ms linear both }
@media (prefers-reduced-motion: reduce) { .mm-diff-in, .mm-diff-run { animation: none } }
`

const fineHover = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

function Tile({ hue, mark, size = 'lg' }) {
  const h = HUES[hue]
  const Mark = MARKS[mark]
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-[14px]', h.wash, h.draw,
      size === 'lg' ? 'h-12 w-12' : 'h-11 w-11')}>
      <Mark/>
    </span>
  )
}

function GoButton({ hue, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('inline-flex min-h-[48px] items-center gap-2 rounded-field px-5',
        'font-display text-ui font-bold text-card',
        'transition-[filter,transform] duration-150 ease-out hoverOnly:brightness-110',
        'motion-safe:active:scale-[0.98]', HUES[hue].btn)}>
      See how it works<ArrowRight aria-hidden size={18}/>
    </button>
  )
}

/* The large panel, desktop only. Keyed on the feature so it fades in fresh. */
function Panel({ f, go, id, labelledBy }) {
  const h = HUES[f.hue]
  const Drawing = DRAWINGS[f.id]
  return (
    <div role="tabpanel" id={id} aria-labelledby={labelledBy}
      className={cn('flex h-full flex-col rounded-panel px-10 pb-10 pt-8', h.wash)}>
      <div key={f.id} className="mm-diff-in flex flex-1 flex-col">
        <Parallax2D distance={28} scale={0.04}
          className={cn('flex flex-1 flex-col justify-center py-4', h.draw)}>
          <div className="flex justify-center"><Drawing/></div>
        </Parallax2D>
        <p className={cn('mt-4 max-w-[24ch] font-display text-major font-bold leading-[1.12] tracking-tight', h.ink)}>
          {f.line}
        </p>
        <div className="mt-6">
          <GoButton hue={f.hue} onClick={() => go(f.go)}/>
        </div>
      </div>
    </div>
  )
}

export function Different({ go }) {
  const reduced = useReduced()
  const [sel, setSel] = React.useState(0)
  const [open, setOpen] = React.useState(0)
  const [touched, setTouched] = React.useState(false)
  const [inView, setInView] = React.useState(false)
  const [wide, setWide] = React.useState(false)
  const box = React.useRef(null)
  const tabs = React.useRef([])
  const uid = React.useId()

  /* lg and up is the tablist; only there does anything move by itself. */
  React.useEffect(() => {
    const mq = window.matchMedia?.('(min-width: 1024px)')
    if (!mq) return
    const on = () => setWide(mq.matches)
    on()
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])

  React.useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const running = wide && inView && !touched && !reduced

  React.useEffect(() => {
    if (!running) return
    const t = setTimeout(() => setSel(s => (s + 1) % DIFFERENT.length), ADVANCE_MS)
    return () => clearTimeout(t)
  }, [running, sel])

  const pick = i => { setTouched(true); setSel(i) }

  const onKey = e => {
    const n = DIFFERENT.length
    const next = { ArrowDown: sel + 1, ArrowUp: sel - 1, Home: 0, End: n - 1 }[e.key]
    if (next == null) return
    e.preventDefault()
    const i = (next + n) % n
    pick(i)
    tabs.current[i]?.focus()
  }

  const f = DIFFERENT[sel]

  return (
    <Section name="Features" id="different" tone="card">
      <style>{KEYFRAMES}</style>
      <SectionHead>What makes MindMap different</SectionHead>

      <div ref={box} className="mt-6 lg:mt-8">
        {/* ── lg and up: tablist and panel ── */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-8 xl:gap-12">
          <div role="tablist" aria-orientation="vertical" aria-label="What makes MindMap different"
            onKeyDown={onKey} onFocus={() => setTouched(true)} className="flex flex-col gap-1">
            {DIFFERENT.map((d, i) => {
              const h = HUES[d.hue]
              const on = i === sel
              return (
                <button key={d.id} type="button" role="tab"
                  ref={el => { tabs.current[i] = el }}
                  id={`${uid}-tab-${d.id}`}
                  aria-selected={on} aria-controls={`${uid}-panel`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => pick(i)}
                  onMouseEnter={() => { if (fineHover()) pick(i) }}
                  className={cn('relative flex min-h-[60px] w-full items-center gap-4 overflow-hidden',
                    'rounded-[14px] py-1.5 pl-4 pr-3 text-left',
                    'transition-colors duration-150 ease-out',
                    on ? h.wash : 'hoverOnly:bg-mist/60')}>
                  <span aria-hidden className={cn('absolute inset-y-2 left-0 w-1 rounded-bar',
                    on ? h.bar : 'bg-transparent')}/>
                  <ScrollRow as="span" index={i} className="flex min-w-0 items-center gap-4">
                    <Tile hue={d.hue} mark={d.id}/>
                    <span className={cn('min-w-0 font-display text-row font-bold leading-[1.2]',
                      on ? h.ink : 'text-ink')}>
                      {d.title}
                    </span>
                  </ScrollRow>
                  {on && running && (
                    <span aria-hidden key={`run-${sel}`}
                      className={cn('mm-diff-run absolute bottom-0 left-4 right-3 h-[3px] rounded-bar opacity-60', h.bar)}/>
                  )}
                </button>
              )
            })}
          </div>
          <Panel f={f} go={go} id={`${uid}-panel`} labelledBy={`${uid}-tab-${f.id}`}/>
        </div>

        {/* ── under lg: accordion ── */}
        <ul className="flex flex-col gap-2 lg:hidden">
          {DIFFERENT.map((d, i) => {
            const h = HUES[d.hue]
            const on = i === open
            const Drawing = DRAWINGS[d.id]
            const bodyId = `${uid}-acc-${d.id}`
            return (
              <ScrollRow as="li" index={i} key={d.id} className={cn('relative overflow-hidden rounded-[16px] transition-colors duration-150',
                on ? h.wash : 'bg-card')}>
                <span aria-hidden className={cn('absolute inset-y-3 left-0 w-1 rounded-bar',
                  on ? h.bar : 'bg-transparent')}/>
                <button type="button" aria-expanded={on} aria-controls={bodyId}
                  onClick={() => setOpen(on ? -1 : i)}
                  className="flex min-h-[64px] w-full items-center gap-3.5 py-2 pl-3.5 pr-3 text-left">
                  <Tile hue={d.hue} mark={d.id} size="sm"/>
                  <span className={cn('min-w-0 flex-1 font-display text-body font-bold leading-[1.25]',
                    on ? h.ink : 'text-ink')}>
                    {d.title}
                  </span>
                  <ChevronDown aria-hidden size={20}
                    className={cn('text-ink-2 transition-transform duration-200 ease-out', on && 'rotate-180')}/>
                </button>
                {/* Always rendered so aria-controls points at a real element;
                    `hidden` takes it out of view and out of the tab order. */}
                <div id={bodyId} hidden={!on} className="mm-diff-in px-4 pb-5">
                  <div className={cn('mx-auto flex max-w-[300px] justify-center py-2', h.draw)}>
                    <Drawing/>
                  </div>
                  <p className="mt-2 text-sec text-ink">{d.line}</p>
                  <div className="mt-4">
                    <GoButton hue={d.hue} onClick={() => go(d.go)}/>
                  </div>
                </div>
              </ScrollRow>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}

export default Different
