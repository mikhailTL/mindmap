import React from 'react'
import { Section, SectionHead } from '../../ui/section'
import { ArrowRight, ChevronDown } from '../../ui/marks'
import { useReduced } from '../../toolkit/useReduced'
import { PRO, SCORE } from '../../lib/terms'
import { ScrollRow } from '../../ui/motion'
import { cn } from '../../lib/utils'
/* The folder path in full: on a case-insensitive disk './different' is this file. */
import { DEMOS, DEMO_CSS } from './different/index.js'

/* What makes MindMap different: ten features, one hue each, and for each a
 * working demo of how it works (./different/*), built from the app's own
 * components and demo data.
 *
 * At lg and up it is a vertical tablist on the left and one large panel on the
 * right. Hovering or pressing a row selects it. While the band is on screen and
 * the reader has not touched it, the selection moves on every ten seconds, long
 * enough for a demo to run through once; any hover, press, key or focus stops
 * that for good, and reduced motion never starts it. Under lg the same rows are
 * an accordion and nothing moves by itself, because a row opening on its own
 * would shove the page under a thumb.
 *
 * Order is the owner's: the score first, the network second, privacy last.
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

const ADVANCE_MS = 10000

/* ── the small marks, 24 box, for the row tiles ─────────────────────────── */

const I = ({ children }) => (
  <svg viewBox="0 0 24 24" width={26} height={26} fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const MARKS = {
  score:   () => <I><circle cx="5" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="12" r="2.4"/><path d="M7 7.5l3 4M7 7l3-1.6M7 16.5l3-4M7 17l3 1.6M14 5.6l3.4 5M14 12h2.6M14 18.4l3.4-5"/></I>,
  network: () => <I><circle cx="12" cy="5.5" r="2.6"/><circle cx="5" cy="17.5" r="2.6"/><circle cx="19" cy="17.5" r="2.6"/><path d="M10.6 7.8L6.4 15.2M13.4 7.8l4.2 7.4M7.6 17.5h8.8"/></I>,
  patch:   () => <I><rect x="3" y="7" width="18" height="10" rx="5"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 12h1.5M16 12h1.5"/></I>,
  heads:   () => <I><rect x="6" y="2.5" width="12" height="19" rx="2.6"/><rect x="8" y="5.5" width="8" height="3.4" rx="1.2"/><path d="M9 12.5h6M9 15.5h4"/></I>,
  settle:  () => <I><path d="M3 17h3.5c2 0 2.4-11 5-11s3 8 5.5 10H21"/><path d="M3 20h18" strokeDasharray="1.5 2.5"/></I>,
  event:   () => <I><rect x="3.5" y="5" width="17" height="15" rx="2.4"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M7 17l3-2.4 2.4 1 3.6-3.6"/></I>,
  breath:  () => <I><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.4" strokeDasharray="2 2.6"/><circle cx="12" cy="12" r="9.4"/></I>,
  helped:  () => <I><path d="M2.5 9h3l1.5-4 2 8 1.5-4h2"/><path d="M12.5 15h2l1.2-2.4 1.6 4.4 1.2-2h3"/><path d="M12 5.5l2 2-2 2" /></I>,
  sharing: () => <I><circle cx="8" cy="8" r="3"/><path d="M3 19c.6-3.4 2.6-5 5-5s4.4 1.6 5 5"/><rect x="14" y="11" width="7.5" height="4.4" rx="2.2"/><circle cx="19.3" cy="13.2" r="1.3" fill="currentColor" stroke="none"/></I>,
  ai:      () => <I><path d="M4 5.5h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-3.4 3v-3H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z"/><path d="M19 9.5h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.6v2.4L16.6 17.5H13"/></I>,
}

/* ── the ten ────────────────────────────────────────────────────────────── */

export const DIFFERENT = [
  { id: 'score', hue: 'accent', go: 'methods',
    title: SCORE,
    line: 'One daily number from our own neural network.' },
  { id: 'network', hue: 'coral', go: 'network',
    title: 'Network',
    line: `Teens link a parent and a ${PRO}. Each sees only what the teen shares.` },
  { id: 'patch', hue: 'beam', go: 'patch',
    title: 'Wearable patch',
    line: 'Designed to read pulse, sweat, temperature and movement.' },
  { id: 'heads', hue: 'sky', go: 'heads-up',
    title: 'Heads Up',
    line: 'Tells parents when phone use shows signs of stress.' },
  { id: 'settle', hue: 'lilac', go: 'methods',
    title: 'Recovery time',
    line: 'How fast your body settles after a peak.' },
  { id: 'event', hue: 'sun', go: 'calendar',
    title: 'Stress before events',
    line: 'How stress builds before a test you marked.' },
  { id: 'breath', hue: 'mint', go: 'toolkit',
    title: 'Measured exercises',
    line: 'Your phone measures breath, stillness and reaction time.' },
  { id: 'helped', hue: 'blush', go: 'toolkit',
    title: 'Before and after',
    line: 'A pulse check before and after shows what works.' },
  { id: 'ai', hue: 'coral', go: 'ai',
    title: 'MindMap AI',
    line: 'Ask questions about stress, sleep and school.' },
  { id: 'sharing', hue: 'sky', go: 'privacy',
    title: 'Privacy',
    line: `Teens choose what parents and ${PRO}s see.` },
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

/* The large panel, desktop only. Keyed on the feature so it fades in fresh
   and its demo starts from the top. */
function Panel({ f, go, id, labelledBy }) {
  const h = HUES[f.hue]
  const Demo = DEMOS[f.id]
  return (
    <div role="tabpanel" id={id} aria-labelledby={labelledBy}
      className={cn('flex min-w-0 flex-col rounded-panel px-7 pb-7 pt-6 lg:sticky lg:top-20 xl:px-8', h.wash)}>
      <div key={f.id} className="mm-diff-in flex flex-1 flex-col">
        <p className={cn('m-0 max-w-[40ch] font-display text-head font-bold leading-[1.2] tracking-tight', h.ink)}>
          {f.line}
        </p>
        <div className="mt-5 flex-1"><Demo/></div>
        <div className="mt-5">
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
      <style>{KEYFRAMES + DEMO_CSS}</style>
      <SectionHead>What makes MindMap different</SectionHead>

      <div ref={box} className="mt-6 lg:mt-8">
        {/* ── lg and up: tablist and panel ── */}
        <div className="hidden lg:grid lg:items-start lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] xl:gap-8">
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
            const Demo = DEMOS[d.id]
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
                <div id={bodyId} hidden={!on} className="mm-diff-in px-3 pb-5 sm:px-4">
                  <p className={cn('m-0 font-display text-sec font-bold leading-snug', h.ink)}>{d.line}</p>
                  {/* mounted only while open, so ten demos do not run at once */}
                  <div className="mt-3">{on && <Demo/>}</div>
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
