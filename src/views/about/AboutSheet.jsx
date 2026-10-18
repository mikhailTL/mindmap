import React from 'react'
import { cn } from '../../lib/utils'
import { LogoMark } from '../../ui/logo'
import { Cross } from '../../ui/marks'
import { captureHarness } from '../Intro'
import { getAppearance } from '../../account/appearance'
import { GoldStar } from './AboutButton'
import {
  PARTS, PROBLEM, STATS, WHY, WHY_QUOTE, PERSONAL, WHAT_LEAD, FEATURES, WHAT_CLOSE, VISION, VISION_MARK,
} from './content'

/* About MindMap, as a full screen sheet (owner, 18 October: "NICELY design
   this ... not boring so ppl want to keep reading"). Five parts, each set its
   own way, on a warm paper ground the rest of the app does not use. A native
   modal <dialog>: the page behind is inert, Esc closes it, focus returns to
   the About button. The sheet is its own scroller, so the rail and the
   reveals read its scroll, not the window's. */

const CSS = `
.ab-sheet { background: #fbf7ee; color: #0d2b1e; overscroll-behavior: contain; }
.ab-sheet[open] { animation: ab-sheet-in .36s cubic-bezier(.23,1,.32,1) both; }
.ab-sheet::backdrop { background: rgb(13 43 30 / .5); }
@keyframes ab-sheet-in { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
.ab-head { background: rgb(251 247 238 / .92); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
[data-rv] { transition: opacity .6s cubic-bezier(.23,1,.32,1), transform .6s cubic-bezier(.23,1,.32,1); transition-delay: var(--d, 0ms); }
[data-rv="wait"] { opacity: 0; transform: translateY(18px); }
.ab-bar { transform-origin: 0 50%; transition: transform .18s linear; }
.ab-vbar { transform-origin: 50% 0; transition: transform .18s linear; }
.ab-mark { color: #f2b705; font-weight: 700; }
.ab-swash { background-image: linear-gradient(transparent 62%, rgb(242 183 5 / .5) 62%, rgb(242 183 5 / .5) 92%, transparent 92%); }
.ab-serif { font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif; }
.ab-drop::first-letter {
  float: left; font-family: Quicksand, system-ui, sans-serif; font-weight: 700; color: #825d07;
  font-size: 3.4em; line-height: .82; margin: .08em .1em 0 0;
}
.ab-tape { background: rgb(242 183 5 / .32); transform: translateX(-50%) rotate(-2.5deg); }
.ab-vision {
  background:
    radial-gradient(ellipse 70% 60% at 85% 0%, rgb(62 207 154 / .20), transparent 70%),
    radial-gradient(ellipse 60% 70% at 0% 100%, rgb(242 183 5 / .14), transparent 70%),
    linear-gradient(160deg, #0f3324, #0a2218 70%);
}
.ab-twinkle { animation: ab-tw 4.2s ease-in-out infinite; }
@keyframes ab-tw { 0%, 100% { opacity: .35; transform: scale(.85) } 50% { opacity: 1; transform: scale(1.1) } }
@media (prefers-reduced-motion: reduce) {
  .ab-sheet[open] { animation: ab-sheet-fade .2s linear both !important; }
  [data-rv="wait"] { opacity: 1; transform: none; }
  .ab-twinkle { animation: none !important; opacity: .8; }
}
[data-motion="reduce"] .ab-twinkle { animation: none !important; opacity: .8; }
[data-motion="reduce"] [data-rv="wait"] { opacity: 1; transform: none; }
@keyframes ab-sheet-fade { from { opacity: 0 } to { opacity: 1 } }
`

function stillMotion() {
  if (captureHarness()) return true
  try { if (getAppearance().motion === 'reduce') return true } catch {}
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

/* Wraps each `marks` phrase found in `text` in a span with `cls`. */
function marked(text, marks, cls) {
  const out = []
  let rest = text, k = 0
  for (const m of marks) {
    const i = rest.indexOf(m)
    if (i < 0) continue
    out.push(rest.slice(0, i), <span key={k++} className={cls}>{m}</span>)
    rest = rest.slice(i + m.length)
  }
  out.push(rest)
  return out
}

function PartHead({ part, tone = 'paper', id }) {
  const dark = tone === 'ink'
  return (
    <div className="flex items-baseline gap-3">
      <span aria-hidden className={cn('font-display text-ui font-bold tabular-nums',
        dark ? 'text-[#f2b705]' : 'text-[#825d07]')}>{part.n}</span>
      <h3 id={id} tabIndex={-1} className={cn('font-display text-head font-bold outline-none sm:text-sub',
        dark ? 'text-[#fbf7ee]' : 'text-ink')}>{part.title}</h3>
    </div>
  )
}

/* ── 01 The Problem ─────────────────────────────────────────────────────── */

function Stat({ s, k, i }) {
  const counts = s.to >= 10
  const v = counts ? Math.round(s.to * k) : s.to
  return (
    <li data-rv="" style={{ '--d': `${i * 90}ms` }}
      className={cn('border-t border-white/15 pt-4', i === STATS.length - 1 && 'col-span-2 lg:col-span-1')}>
      {s.pre && <span className="block font-display text-fine font-bold text-[#c9d8cf]">{s.pre}</span>}
      <span className={cn('block font-display text-[2.6rem] font-bold leading-none tracking-[-0.03em] tabular-nums sm:text-[3.1rem]',
        i % 2 ? 'text-[#f2b705]' : 'text-[#3ecf9a]')}>{s.fmt(v)}</span>
      <span className="mt-2 block max-w-[30ch] text-fine text-[#c9d8cf]">{s.note}</span>
    </li>
  )
}

function Problem({ k, statsRef }) {
  return (
    <section id="ab-problem" data-part="problem" aria-labelledby="ab-h-problem"
      className="-mx-4 bg-[#0d2b1e] px-5 py-12 text-[#eef3ee] sm:mx-0 sm:rounded-[28px] sm:px-10 sm:py-14 lg:px-12">
      <div data-rv=""><PartHead part={PARTS[0]} tone="ink" id="ab-h-problem"/></div>
      <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] lg:gap-14">
        <p data-rv="" className="max-w-[60ch] text-meta leading-[1.75] text-[#eef3ee] sm:text-lead">
          {marked(PROBLEM, STATS.map(s => s.mark), 'ab-mark')}
        </p>
        {/* The same figures, large. The paragraph already says them, so the
            column is hidden from screen readers. */}
        <ul ref={statsRef} aria-hidden className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-7 p-0 lg:grid-cols-1 lg:gap-y-6">
          {STATS.map((s, i) => <Stat key={s.mark} s={s} k={k} i={i}/>)}
        </ul>
      </div>
    </section>
  )
}

/* ── 02 Why MindMap ─────────────────────────────────────────────────────── */

function Why() {
  const lead = 'the only app that bridges the gap'
  return (
    <section id="ab-why" data-part="why" aria-labelledby="ab-h-why" className="py-14 sm:py-20">
      <div data-rv=""><PartHead part={PARTS[1]} id="ab-h-why"/></div>
      <figure aria-hidden data-rv="" className="relative m-0 mt-6 pt-12 sm:mt-8 sm:pt-16">
        <span className="pointer-events-none absolute -left-1 top-0 h-12 select-none overflow-visible font-display text-[6rem] font-bold leading-[0.9] text-[#f2b705] sm:h-16 sm:text-[8rem]">“</span>
        <blockquote className="relative m-0 max-w-[24ch] font-display text-[1.75rem] font-bold leading-[1.18] tracking-[-0.02em] text-ink sm:max-w-[26ch] sm:text-[2.6rem]">
          {marked(WHY_QUOTE, [lead], 'ab-swash')}
        </blockquote>
      </figure>
      <p data-rv="" className="mt-9 max-w-[62ch] text-meta leading-[1.75] text-ink-2 sm:ml-[12%] sm:mt-12 sm:border-l-[3px] sm:border-[#f2b705] sm:pl-6">
        {WHY.join(' ')}
      </p>
    </section>
  )
}

/* ── 03 Personal Experience & Research ──────────────────────────────────── */

function Personal() {
  return (
    <section id="ab-personal" data-part="personal" aria-labelledby="ab-h-personal" className="pb-14 sm:pb-20">
      <div data-rv="" className="relative rounded-[22px] border lg:max-w-[54rem] border-[#eadfc8] bg-[#fffdf8] px-5 pb-8 pt-10
        shadow-[0_1px_2px_rgb(90_60_10/.05),0_24px_48px_-28px_rgb(90_60_10/.35)] sm:px-10 sm:pb-12 sm:pt-12">
        <span aria-hidden className="ab-tape absolute left-1/2 top-[-12px] h-6 w-28 rounded-[3px]"/>
        <PartHead part={PARTS[2]} id="ab-h-personal"/>
        <ol className="m-0 mt-8 list-none p-0">
          {PERSONAL.map((p, i) => {
            const last = i === PERSONAL.length - 1
            return (
              <li key={p.step} data-rv="" style={{ '--d': `${i * 60}ms` }}
                className="relative grid grid-cols-[26px_minmax(0,1fr)] gap-x-4 sm:gap-x-6">
                <span aria-hidden className="relative flex justify-center">
                  {!last && <span className="absolute bottom-0 top-3 w-[2px] bg-[#eadfc8]"/>}
                  {last
                    ? <GoldStar className="relative mt-[-2px] size-[26px]"/>
                    : <span className="relative mt-1 size-[14px] rounded-full border-[3px] border-[#d9a514] bg-[#fffdf8]"/>}
                </span>
                <div className={cn(!last && 'pb-8')}>
                  <span className="block font-display text-fine font-bold text-[#825d07]">{p.step}</span>
                  <p className={cn('ab-serif mt-1.5 max-w-[62ch] text-[1.0625rem] leading-[1.75] text-[#2b2a24] sm:text-[1.125rem]',
                    i === 0 && 'ab-drop')}>{p.text}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/* ── 04 What is MindMap ─────────────────────────────────────────────────── */

const HUE = {
  mint:  { ink: 'text-mint-ink',  wash: 'bg-mint-wash',  bar: 'bg-mint' },
  sky:   { ink: 'text-sky-ink',   wash: 'bg-sky-wash',   bar: 'bg-sky' },
  lilac: { ink: 'text-lilac-ink', wash: 'bg-lilac-wash', bar: 'bg-lilac' },
}

const ICONS = {
  mint: <><rect x="4" y="7" width="16" height="10" rx="5"/><path d="M7.5 12h2l1.4-2.6 2 5 1.4-2.4h2.2"/></>,
  sky: <><circle cx="12" cy="6" r="2.4"/><circle cx="5.5" cy="17" r="2.4"/><circle cx="18.5" cy="17" r="2.4"/><path d="M10.8 8.1 6.8 15M13.2 8.1l4 6.9M8 17h8"/></>,
  lilac: <><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><path d="M16.5 13.5v6M13.5 16.5h6"/></>,
}

function Feature({ f, i }) {
  const h = HUE[f.hue]
  return (
    <article data-rv="" style={{ '--d': `${i * 80}ms` }}
      className={cn('relative overflow-hidden rounded-[20px] border border-[#e7e0cf] bg-white p-5 shadow-card sm:p-7',
        f.tools && 'md:col-span-2')}>
      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1.5', h.bar)}/>
      <div className="flex items-center gap-3">
        <span aria-hidden className={cn('grid size-12 shrink-0 place-items-center rounded-[14px]', h.wash, h.ink)}>
          <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">{ICONS[f.hue]}</svg>
        </span>
        <h4 className={cn('m-0 font-display text-row font-bold', h.ink)}>
          <span className="tabular-nums">{i + 1}.</span> {f.tag}
        </h4>
      </div>
      <p className="mt-4 max-w-[62ch] text-meta leading-[1.7] text-ink-2">
        {marked(f.text, ['1.6 million', '96%'], 'font-bold text-ink')}
      </p>
      {f.tools && (
        <ul className="m-0 mt-5 grid list-none gap-3 p-0 lg:grid-cols-3">
          {f.tools.map(t => (
            <li key={t.name} className={cn('rounded-[14px] p-4', h.wash)}>
              <span className={cn('block font-display text-ui font-bold', h.ink)}>{t.name}</span>
              <p className="mt-1.5 text-note leading-[1.6] text-ink-2">{t.text}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

function What() {
  return (
    <section id="ab-what" data-part="what" aria-labelledby="ab-h-what" className="pb-16 sm:pb-24">
      <div data-rv=""><PartHead part={PARTS[3]} id="ab-h-what"/></div>
      <p data-rv="" className="mt-6 max-w-[58ch] font-display text-[1.25rem] font-medium leading-[1.5] text-ink sm:text-[1.45rem]">
        {WHAT_LEAD}
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 sm:gap-5">
        {FEATURES.map((f, i) => <Feature key={f.tag} f={f} i={i}/>)}
      </div>
      <div data-rv="" className="mt-8 flex gap-4 rounded-[20px] bg-[#f5ecd7] p-5 sm:p-7">
        <GoldStar className="mt-0.5 size-7 shrink-0"/>
        <p className="max-w-[62ch] text-meta font-medium leading-[1.7] text-[#3b2e0c]">{WHAT_CLOSE}</p>
      </div>
    </section>
  )
}

/* ── 05 Vision ──────────────────────────────────────────────────────────── */

const SKY = [
  { x: '8%', y: '14%', s: 14, d: '0s' }, { x: '86%', y: '10%', s: 18, d: '1.1s' },
  { x: '92%', y: '62%', s: 12, d: '2.3s' }, { x: '4%', y: '78%', s: 10, d: '.6s' },
  { x: '70%', y: '88%', s: 9, d: '1.8s' },
]

function Vision({ onClose }) {
  /* The first clause of his vision sentence is set large and the sentence runs
     on below it, unchanged. */
  const cut = VISION[0].indexOf(VISION_MARK) + VISION_MARK.length + 1
  return (
    <section id="ab-vision" data-part="vision" aria-labelledby="ab-h-vision"
      className="ab-vision relative overflow-hidden px-5 py-20 text-[#eef3ee] sm:px-10 sm:py-28">
      {SKY.map((p, i) => (
        <span key={i} aria-hidden className="pointer-events-none absolute" style={{ left: p.x, top: p.y }}>
          <svg viewBox="0 0 24 24" className="ab-twinkle" style={{ width: p.s, height: p.s, animationDelay: p.d }}>
            <path d="M12 2c.6 4.6 2.4 7.4 10 10-7.6 2.6-9.4 5.4-10 10-.6-4.6-2.4-7.4-10-10 7.6-2.6 9.4-5.4 10-10z" fill="#f2b705"/>
          </svg>
        </span>
      ))}
      <div className="relative mx-auto max-w-[62rem]">
        <div data-rv=""><PartHead part={PARTS[4]} tone="ink" id="ab-h-vision"/></div>
        <p data-rv="" className="mt-8 max-w-[30ch] font-display text-[1.7rem] font-bold leading-[1.2] tracking-[-0.02em] text-[#fbf7ee] sm:text-[2.6rem]">
          {marked(VISION[0].slice(0, cut), [VISION_MARK], 'text-[#f2b705]')}
        </p>
        <p data-rv="" className="mt-5 max-w-[60ch] text-meta leading-[1.75] text-[#c9d8cf] sm:text-lead">
          {VISION[0].slice(cut)}
        </p>
        <p data-rv="" className="mt-8 max-w-[60ch] border-l-[3px] border-[#3ecf9a] pl-5 text-meta leading-[1.75] text-[#eef3ee] sm:text-lead">
          {VISION[1]}
        </p>
        <button type="button" onClick={onClose}
          className="mt-12 inline-flex min-h-[48px] items-center gap-2.5 rounded-chip bg-[#f2b705] px-6 font-display text-ui
            font-bold text-[#0d2b1e] transition-transform duration-150 ease-out hoverOnly:-translate-y-px active:scale-[0.97]
            focus-visible:outline-[#f2b705]">
          Close
        </button>
      </div>
    </section>
  )
}

/* ── The rail ───────────────────────────────────────────────────────────── */

function Rail({ prog, active, jump }) {
  return (
    <nav aria-label="About parts" className="sticky top-[88px] mt-[136px]">
      <ol className="m-0 grid list-none gap-1 p-0">
        {PARTS.map((p, i) => (
          <li key={p.id}>
            <button type="button" onClick={() => jump(p.id)} aria-current={active === i ? 'step' : undefined}
              className="group grid w-full grid-cols-[3px_minmax(0,1fr)] gap-x-3.5 rounded-field py-2 pr-2 text-left">
              <span aria-hidden className="relative h-full min-h-[40px] overflow-hidden rounded-bar bg-[#eadfc8]">
                <span className="ab-vbar absolute inset-0 rounded-bar bg-[#d9a514]" style={{ transform: `scaleY(${prog[i]})` }}/>
              </span>
              <span>
                <span className={cn('block font-display text-fine font-bold tabular-nums',
                  active === i ? 'text-[#825d07]' : 'text-ink-3')}>{p.n}</span>
                <span className={cn('block font-display text-ui font-bold leading-snug transition-colors duration-150',
                  active === i ? 'text-ink' : 'text-ink-3 groupHoverOnly:text-ink-2')}>{p.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function Strip({ prog, active, jump }) {
  return (
    <nav aria-label="About parts" className="lg:hidden">
      <ol className="m-0 grid list-none grid-cols-5 gap-1.5 p-0">
        {PARTS.map((p, i) => (
          <li key={p.id}>
            <button type="button" onClick={() => jump(p.id)} aria-current={active === i ? 'step' : undefined}
              aria-label={`${p.n} ${p.title}`} className="block w-full py-2.5">
              <span className="relative block h-1 overflow-hidden rounded-bar bg-[#eadfc8]">
                <span className="ab-bar absolute inset-0 rounded-bar bg-[#d9a514]" style={{ transform: `scaleX(${prog[i]})` }}/>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ── The sheet ──────────────────────────────────────────────────────────── */

export function AboutSheet({ open, onClose }) {
  const ref = React.useRef(null)
  const statsRef = React.useRef(null)
  const [prog, setProg] = React.useState(() => PARTS.map(() => 0))
  const [active, setActive] = React.useState(0)
  const [k, setK] = React.useState(1)

  React.useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal?.()
    if (!open && d.open) d.close()
  }, [open])

  /* While open: the page behind stays put, the rail follows the scroll, and
     what starts below the fold rises in once. */
  React.useEffect(() => {
    const d = ref.current
    if (!open || !d) return
    const html = document.documentElement
    const was = html.style.overflow
    html.style.overflow = 'hidden'
    d.scrollTop = 0
    const still = stillMotion()

    const parts = () => PARTS.map(p => d.querySelector(`[data-part="${p.id}"]`))
    let raf = 0
    const measure = () => {
      raf = 0
      const top = d.getBoundingClientRect().top
      const line = d.clientHeight * 0.35
      const atEnd = d.scrollTop >= d.scrollHeight - d.clientHeight - 2
      let on = 0
      const p = parts().map((el, i) => {
        if (!el) return 0
        const r = el.getBoundingClientRect()
        const t = r.top - top
        if (t <= line) on = i
        return Math.min(1, Math.max(0, (line - t) / r.height))
      })
      if (atEnd) { on = PARTS.length - 1; p[on] = 1 }
      setProg(p)
      setActive(on)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure) }
    d.addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    measure()

    /* Reveals: only what is below the fold is ever hidden, and the observer
       watches the sheet, not the window. */
    const els = [...d.querySelectorAll('[data-rv]')]
    els.forEach(el => { el.dataset.rv = '' })
    let io = null, timer = 0, count = 0
    const runCount = () => {
      if (still) { setK(1); return }
      const t0 = performance.now()
      const step = now => {
        const e = Math.min(1, (now - t0) / 1100)
        setK(1 - Math.pow(1 - e, 3))
        if (e < 1) count = requestAnimationFrame(step)
      }
      count = requestAnimationFrame(step)
    }
    if (!still && typeof IntersectionObserver === 'function') {
      setK(0)
      const fold = d.clientHeight * 0.92
      els.forEach(el => { if (el.getBoundingClientRect().top > fold) el.dataset.rv = 'wait' })
      io = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          if (e.target === statsRef.current) runCount()
          else e.target.dataset.rv = 'in'
          io.unobserve(e.target)
        }
      }, { root: d, rootMargin: '0px 0px -8% 0px' })
      els.forEach(el => { if (el.dataset.rv === 'wait') io.observe(el) })
      if (statsRef.current) io.observe(statsRef.current)
      /* Nothing stays hidden if the observer never reports. */
      timer = setTimeout(() => {
        if (!d.querySelector('[data-rv="in"]') && d.scrollTop > 0) els.forEach(el => { el.dataset.rv = 'in' })
      }, 2500)
    } else setK(1)

    return () => {
      html.style.overflow = was
      d.removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
      cancelAnimationFrame(count)
      clearTimeout(timer)
      io?.disconnect()
    }
  }, [open])

  const jump = id => {
    const d = ref.current
    const el = d?.querySelector(`[data-part="${id}"]`)
    if (!el) return
    const head = d.querySelector('[data-ab-head]')?.offsetHeight || 0
    const y = el.getBoundingClientRect().top - d.getBoundingClientRect().top + d.scrollTop - head - 12
    d.scrollTo({ top: Math.max(0, y), behavior: stillMotion() ? 'auto' : 'smooth' })
    d.querySelector(`#ab-h-${id}`)?.focus({ preventScroll: true })
  }

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="ab-title"
      className="ab-sheet fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-y-auto border-0 p-0 text-left">
      <style>{CSS}</style>
      <header data-ab-head="" className="ab-head sticky top-0 z-20 border-b border-[#eadfc8]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 pt-2 sm:px-8 lg:pb-2">
          <LogoMark className="h-auto w-8 shrink-0 text-accent"/>
          <p aria-hidden className="m-0 min-w-0 truncate font-display text-ui font-bold text-ink">
            <span className="tabular-nums text-[#825d07]">{PARTS[active].n}</span>
            <span className="ml-2">{PARTS[active].title}</span>
          </p>
          <button type="button" onClick={onClose} aria-label="Close"
            className="ml-auto grid size-11 shrink-0 place-items-center rounded-full text-ink-2 hoverOnly:bg-[#f1e8d4] hoverOnly:text-ink">
            <Cross className="size-5"/>
          </button>
        </div>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8"><Strip prog={prog} active={active} jump={jump}/></div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
        <div className="hidden lg:block"><Rail prog={prog} active={active} jump={jump}/></div>
        <div className="min-w-0">
          <div className="pb-10 pt-10 sm:pb-12 sm:pt-14">
            <div className="flex items-center gap-2">
              <h2 id="ab-title" className="font-display text-[2.6rem] font-bold leading-none tracking-[-0.035em] text-ink sm:text-[3.6rem]">
                About Mind<span className="text-accent">Map</span>
              </h2>
              <GoldStar className="size-8 shrink-0 self-start sm:size-10"/>
            </div>
            <ol className="m-0 mt-7 flex list-none flex-wrap gap-2 p-0 lg:hidden">
              {PARTS.map(p => (
                <li key={p.id}>
                  <button type="button" onClick={() => jump(p.id)}
                    className="min-h-[40px] rounded-chip border border-[#e3d6b8] bg-white px-3.5 font-display text-fine font-bold text-ink-2
                      hoverOnly:border-[#d9a514] hoverOnly:text-ink">
                    <span className="tabular-nums text-[#825d07]">{p.n}</span> {p.title}
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <Problem k={k} statsRef={statsRef}/>
          <Why/>
          <Personal/>
          <What/>
        </div>
      </div>
      <Vision onClose={onClose}/>
    </dialog>
  )
}
