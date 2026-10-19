import React from 'react'
import { cn } from '../../lib/utils'
import { LogoMark } from '../../ui/logo'
import { Cross } from '../../ui/marks'
import { captureHarness } from '../Intro'
import { getAppearance } from '../../account/appearance'
import { Topo } from '../mirror/Topo'
import {
  PARTS, PROBLEM, STATS, WHY, WHY_QUOTE, PERSONAL, WHAT_LEAD, FEATURES, WHAT_CLOSE, VISION, VISION_MARK,
} from './content'

/* About MindMap, as a full screen sheet. One long page in the site's own
   colours, white and pale mint with green ink, so it reads top to bottom
   without changing voice (owner, 19 October: "make it match site design and
   not be all over the place, needs to be nice and smooth"). A native modal
   <dialog>: the page behind is inert, Esc closes it, focus returns to the
   About button. The sheet is its own scroller, so the rail and the reveals
   read its scroll, not the window's. */

const CSS = `
.ab-sheet { background: #ffffff; color: #0d2b1e; overscroll-behavior: contain; }
.ab-sheet[open] { animation: ab-sheet-in .36s cubic-bezier(.23,1,.32,1) both; }
.ab-sheet::backdrop { background: rgb(13 43 30 / .5); }
@keyframes ab-sheet-in { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
.ab-head { background: rgb(255 255 255 / .92); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.ab-hero { background: linear-gradient(180deg, #edf7f7, #ffffff); }
.ab-vision { background: linear-gradient(170deg, #e3f2e9, #edf7f7 70%); }
[data-rv] { transition: opacity .7s cubic-bezier(.23,1,.32,1), transform .7s cubic-bezier(.23,1,.32,1); transition-delay: var(--d, 0ms); }
[data-rv="wait"] { opacity: 0; transform: translateY(12px); }
.ab-bar { transform-origin: 0 50%; transition: transform .18s linear; }
.ab-vbar { transform-origin: 50% 0; transition: transform .18s linear; }
.ab-sheet .mm-drift { animation: none; }
@media (prefers-reduced-motion: reduce) {
  .ab-sheet[open] { animation: ab-sheet-fade .2s linear both !important; }
  [data-rv="wait"] { opacity: 1; transform: none; }
}
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

/* The same heading for all five parts. */
function PartHead({ part, id }) {
  return (
    <div data-rv="" className="flex items-baseline gap-3">
      <span aria-hidden className="font-display text-ui font-bold tabular-nums text-accent">{part.n}</span>
      <h3 id={id} tabIndex={-1} className="m-0 font-display text-head font-bold text-ink outline-none sm:text-[1.875rem] sm:leading-[1.2]">
        {part.title}
      </h3>
    </div>
  )
}

const prose = 'max-w-[65ch] text-meta leading-[1.8] text-ink-2 sm:text-[1.125rem]'
const part = 'scroll-mt-28 pt-14 sm:pt-20'

/* ── 01 The Problem ─────────────────────────────────────────────────────── */

function Stat({ s, k, i }) {
  const counts = s.to >= 10
  const v = counts ? Math.round(s.to * k) : s.to
  return (
    <li className={cn('border-t border-rule pt-4 sm:grid sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline sm:gap-6 sm:py-4',
      i === STATS.length - 1 && 'col-span-2 sm:col-span-1 sm:border-b')}>
      <span className="block font-display text-[2.25rem] font-bold leading-none tracking-[-0.03em] tabular-nums text-accent-ink sm:text-[2.5rem]">
        {s.pre && <span className="mr-1.5 align-middle text-fine font-bold tracking-normal text-ink-3">{s.pre}</span>}
        {s.fmt(v)}
      </span>
      <span className="mt-2 block text-fine leading-[1.6] text-ink-2 sm:mt-0 sm:text-ui">{s.note}</span>
    </li>
  )
}

function Problem({ k, statsRef }) {
  return (
    <section id="ab-problem" data-part="problem" aria-labelledby="ab-h-problem" className={cn(part, 'pt-10 sm:pt-14')}>
      <PartHead part={PARTS[0]} id="ab-h-problem"/>
      <p data-rv="" className={cn(prose, 'mt-6')}>
        {marked(PROBLEM, STATS.map(s => s.mark), 'font-bold text-ink')}
      </p>
      {/* The same figures, large. The paragraph already says them, so the
          list is hidden from screen readers. */}
      <ul ref={statsRef} aria-hidden
        className="m-0 mt-9 grid max-w-[65ch] list-none grid-cols-2 gap-x-6 gap-y-6 p-0 sm:grid-cols-1 sm:gap-y-0">
        {STATS.map((s, i) => <Stat key={s.mark} s={s} k={k} i={i}/>)}
      </ul>
    </section>
  )
}

/* ── 02 Why MindMap ─────────────────────────────────────────────────────── */

function Why() {
  /* His third sentence is the key line, so it is set as the pull quote and
     the first two run as the paragraph before it. */
  const body = WHY.filter(w => w !== WHY_QUOTE)
  return (
    <section id="ab-why" data-part="why" aria-labelledby="ab-h-why" className={part}>
      <PartHead part={PARTS[1]} id="ab-h-why"/>
      <p data-rv="" className={cn(prose, 'mt-6')}>{body.join(' ')}</p>
      <p data-rv="" className="m-0 mt-9 max-w-[34ch] border-l-[3px] border-accent pl-5 font-display text-[1.25rem] font-bold
        leading-[1.35] tracking-[-0.01em] text-ink sm:pl-7 sm:text-[1.75rem]">
        {WHY_QUOTE}
      </p>
    </section>
  )
}

/* ── 03 Personal Experience & Research ──────────────────────────────────── */

function Personal() {
  return (
    <section id="ab-personal" data-part="personal" aria-labelledby="ab-h-personal" className={part}>
      <PartHead part={PARTS[2]} id="ab-h-personal"/>
      <ol className="m-0 mt-8 list-none p-0">
        {PERSONAL.map((p, i) => {
          const last = i === PERSONAL.length - 1
          return (
            <li key={p.step} data-rv="" style={{ '--d': `${i * 60}ms` }}
              className="relative grid grid-cols-[18px_minmax(0,1fr)] gap-x-4 sm:gap-x-6">
              <span aria-hidden className="relative flex justify-center">
                {!last && <span className="absolute bottom-0 top-3 w-px bg-rule"/>}
                <span className={cn('relative mt-[5px] size-3 rounded-full border-2 border-accent',
                  last ? 'bg-accent' : 'bg-card')}/>
              </span>
              <div className={cn(!last && 'pb-8')}>
                <span className="block font-display text-fine font-bold text-accent-ink">{p.step}</span>
                <p className={cn(prose, 'mt-1.5')}>{p.text}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/* ── 04 What is MindMap ─────────────────────────────────────────────────── */

const ICONS = {
  mint: <><rect x="4" y="7" width="16" height="10" rx="5"/><path d="M7.5 12h2l1.4-2.6 2 5 1.4-2.4h2.2"/></>,
  sky: <><circle cx="12" cy="6" r="2.4"/><circle cx="5.5" cy="17" r="2.4"/><circle cx="18.5" cy="17" r="2.4"/><path d="M10.8 8.1 6.8 15M13.2 8.1l4 6.9M8 17h8"/></>,
  lilac: <><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><path d="M16.5 13.5v6M13.5 16.5h6"/></>,
}

function Feature({ f, i }) {
  return (
    <article data-rv="" style={{ '--d': `${i * 70}ms` }}
      className="rounded-panel border border-rule bg-card p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-field bg-accent-wash text-accent-ink">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7"
            strokeLinecap="round" strokeLinejoin="round">{ICONS[f.hue]}</svg>
        </span>
        <h4 className="m-0 font-display text-row font-bold text-ink">{f.tag}</h4>
      </div>
      <p className="mt-4 max-w-[65ch] text-ui leading-[1.75] text-ink-2">
        {marked(f.text, ['1.6 million', '96%'], 'font-bold text-ink')}
      </p>
      {f.tools && (
        <ul className="m-0 mt-5 list-none divide-y divide-rule border-t border-rule p-0">
          {f.tools.map(t => (
            <li key={t.name} className="py-4 last:pb-0">
              <span className="block font-display text-ui font-bold text-ink">{t.name}</span>
              <p className="mt-1 text-fine leading-[1.7] text-ink-2">{t.text}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

function What() {
  return (
    <section id="ab-what" data-part="what" aria-labelledby="ab-h-what" className={part}>
      <PartHead part={PARTS[3]} id="ab-h-what"/>
      <p data-rv="" className={cn(prose, 'mt-6')}>{WHAT_LEAD}</p>
      <div className="mt-7 grid gap-4">
        {FEATURES.map((f, i) => <Feature key={f.tag} f={f} i={i}/>)}
      </div>
      <p data-rv="" className={cn(prose, 'mt-8')}>{WHAT_CLOSE}</p>
    </section>
  )
}

/* ── 05 Vision ──────────────────────────────────────────────────────────── */

function Vision({ onClose }) {
  /* The first clause of his vision sentence is set large and the sentence runs
     on below it, unchanged. */
  const cut = VISION[0].indexOf(VISION_MARK) + VISION_MARK.length + 1
  return (
    <section id="ab-vision" data-part="vision" aria-labelledby="ab-h-vision"
      className="ab-vision relative isolate -mx-4 mt-14 overflow-hidden px-4 pb-16 pt-14 sm:mx-0 sm:mt-20 sm:rounded-[24px] sm:px-10 sm:py-16">
      <Topo className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-60"/>
      <PartHead part={PARTS[4]} id="ab-h-vision"/>
      <p data-rv="" className="m-0 mt-7 max-w-[30ch] font-display text-[1.5rem] font-bold leading-[1.3] tracking-[-0.015em] text-ink sm:text-[2rem]">
        {marked(VISION[0].slice(0, cut), [VISION_MARK], 'text-accent-ink')}
      </p>
      <p data-rv="" className={cn(prose, 'mt-5 text-ink')}>{VISION[0].slice(cut)}</p>
      <p data-rv="" className={cn(prose, 'mt-5 text-ink')}>{VISION[1]}</p>
      <button type="button" onClick={onClose}
        className="mt-10 inline-flex min-h-[48px] items-center rounded-chip bg-accent px-7 font-display text-ui font-bold text-paper
          transition-colors duration-150 ease-out hoverOnly:bg-accent-ink active:bg-accent-ink">
        Close
      </button>
    </section>
  )
}

/* ── The rail ───────────────────────────────────────────────────────────── */

function Rail({ prog, active, jump }) {
  return (
    <nav aria-label="About parts" className="sticky top-[88px] mt-8">
      <ol className="m-0 grid list-none gap-1 p-0">
        {PARTS.map((p, i) => (
          <li key={p.id}>
            <button type="button" onClick={() => jump(p.id)} aria-current={active === i ? 'step' : undefined}
              className="group grid w-full grid-cols-[3px_minmax(0,1fr)] gap-x-3.5 rounded-field py-2 pr-2 text-left">
              <span aria-hidden className="relative h-full min-h-[40px] overflow-hidden rounded-bar bg-mist">
                <span className="ab-vbar absolute inset-0 rounded-bar bg-accent" style={{ transform: `scaleY(${prog[i]})` }}/>
              </span>
              <span>
                <span className={cn('block font-display text-fine font-bold tabular-nums',
                  active === i ? 'text-accent' : 'text-ink-3')}>{p.n}</span>
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
              <span className="relative block h-1 overflow-hidden rounded-bar bg-mist">
                <span className="ab-bar absolute inset-0 rounded-bar bg-accent" style={{ transform: `scaleX(${prog[i]})` }}/>
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
      <header data-ab-head="" className="ab-head sticky top-0 z-20 border-b border-rule">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 pt-2 sm:px-8 lg:pb-2">
          <LogoMark className="h-auto w-8 shrink-0 text-accent"/>
          <p aria-hidden className="m-0 min-w-0 truncate font-display text-ui font-bold text-ink">
            <span className="tabular-nums text-accent">{PARTS[active].n}</span>
            <span className="ml-2">{PARTS[active].title}</span>
          </p>
          <button type="button" onClick={onClose} aria-label="Close"
            className="ml-auto grid size-11 shrink-0 place-items-center rounded-full text-ink-2 hoverOnly:bg-mist hoverOnly:text-ink">
            <Cross className="size-5"/>
          </button>
        </div>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8"><Strip prog={prog} active={active} jump={jump}/></div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
        <div className="hidden lg:block"><Rail prog={prog} active={active} jump={jump}/></div>
        <article className="min-w-0 max-w-[48rem] sm:pb-24">
          <div className="ab-hero relative isolate -mx-4 overflow-hidden px-4 pb-2 pt-10 sm:mx-0 sm:mt-8 sm:rounded-[24px] sm:px-10 sm:py-12">
            <Topo className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-50"/>
            <h2 id="ab-title" className="m-0 font-display text-[2.5rem] font-bold leading-none tracking-[-0.03em] text-ink sm:text-[3.25rem]">
              About Mind<span className="text-accent">Map</span>
            </h2>
            <ol className="m-0 mt-7 flex list-none flex-wrap gap-2 p-0 lg:hidden">
              {PARTS.map(p => (
                <li key={p.id}>
                  <button type="button" onClick={() => jump(p.id)}
                    className="min-h-[40px] rounded-chip border border-rule bg-card px-3.5 font-display text-fine font-bold text-ink-2
                      transition-colors duration-150 hoverOnly:border-accent hoverOnly:text-ink">
                    <span className="tabular-nums text-accent">{p.n}</span> {p.title}
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <Problem k={k} statsRef={statsRef}/>
          <Why/>
          <Personal/>
          <What/>
          <Vision onClose={onClose}/>
        </article>
      </div>
    </dialog>
  )
}
