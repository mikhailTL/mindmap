import React from 'react'
import { Section, SectionHead } from '../../ui/section'
import { ArrowLeft, ArrowRight } from '../../ui/marks'
import { useReduced } from '../../toolkit/useReduced'
import { ScrollRow } from '../../ui/motion'
import { PRO } from '../../lib/terms'
import { cn } from '../../lib/utils'
/* The folder path in full: on a case-insensitive disk './different' is this file. */
import { PICTURES, DIF_CSS } from './different/index.js'

/* What makes MindMap different: eight cards in one sideways row. Owner,
 * 20 October: "have the cards a horizontal carousel that autoscrolls, and
 * revert the images to actual stuff from site ... have it colorful and stuff
 * like it was before with cool animations but not overly overwhelming".
 *
 * Each card is a picture made of the app's own parts (./different/
 * pictures.jsx), a title and one line, on its own two-hue wash. Three looks
 * take turns so neighbours differ: `tint` (the wash is the card), `pane`
 * (white card, washed picture) and `rule` (white card, a coloured rule over
 * a washed picture). Cards are not links: there is no page per feature.
 *
 * The row moves on by one card every four seconds and runs on past the
 * eighth into a copy of the row, then jumps back to the same frame at the
 * start, so the loop has no seam. It holds while the pointer is over it,
 * while a keyboard focus is in it, while a finger is on it, while it is off
 * screen and when paused, and starts again six seconds after the last touch.
 * Under reduced motion it never moves on its own. Arrow buttons and the
 * arrow keys on the row move one card; touch swipes and snaps.
 *
 * Only the card in front plays its picture's motion, once, as it arrives.
 *
 * Order is the owner's: the score first, the network second. */

export const DIFFERENT = [
  { id: 'score', title: 'Mind Score', look: 'tint', wash: ['#dcefe4', '#def0fc'], hue: '#157446',
    line: 'One daily number from our own neural network, built from your body’s signals.' },
  { id: 'network', title: 'Support network', look: 'pane', wash: ['#ffe8e0', '#f5ecd7'], hue: '#f25424',
    line: `Link a parent and a ${PRO}. The teen decides what each one sees.` },
  { id: 'patch', title: 'Patch or phone', look: 'rule', wash: ['#fce6f1', '#f6e8ff'], hue: '#f2248b',
    line: 'A patch designed to read pulse, sweat, temperature and movement. No patch? Use the phone camera or the Mental Mirror.' },
  { id: 'heads', title: 'Heads Up', look: 'tint', wash: ['#def0fc', '#ddf0f8'], hue: '#2294e6',
    line: 'Tells parents when phone use shows signs of stress.' },
  { id: 'settle', title: 'Recovery time', look: 'pane', wash: ['#f6e8ff', '#fce6f1'], hue: '#a024f2',
    line: 'The patch shows how fast your body settles after a peak, and what helps.' },
  { id: 'event', title: 'Stress before events', look: 'rule', wash: ['#f5ecd7', '#ffe8e0'], hue: '#b5871b',
    line: 'Mark a test and see how stress builds in the hours before it.' },
  { id: 'ai', title: 'MindMap AI', look: 'tint', wash: ['#ddf0f8', '#d5f2e8'], hue: '#1d8fb0',
    line: 'Ask about stress, sleep and school. Get a plain, practical answer.' },
  { id: 'toolkit', title: 'Toolkit with levels', look: 'pane', wash: ['#d5f2e8', '#f5ecd7'], hue: '#18a370',
    line: 'Exercises your phone measures. Points open new levels, with no streaks to keep.' },
]

const N = DIFFERENT.length
const STEP_MS = 4000
const REST_MS = 6000
const GLIDE_MS = 900
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

const washOf = d => `linear-gradient(135deg, ${d.wash[0]} 0%, ${d.wash[1]} 100%)`

function Card({ d, play, copy }) {
  const titleId = React.useId()
  const Picture = PICTURES[d.id]
  const tint = d.look === 'tint'
  return (
    <article aria-labelledby={copy ? undefined : titleId}
      className={cn('dif-card relative flex h-full flex-col overflow-hidden rounded-[18px] p-2', play && 'dif-play',
        tint ? '' : 'border border-rule bg-card')}
      style={tint ? { background: washOf(d) } : undefined}>
      {d.look === 'rule' && <span aria-hidden className="mx-1.5 mb-2 mt-0.5 block h-1 shrink-0 rounded-bar" style={{ background: d.hue }}/>}
      <div className={cn('relative shrink-0 overflow-hidden rounded-[13px]', tint ? 'bg-card/55' : '',
        d.look === 'rule' ? 'h-[164px] lg:h-[178px]' : 'h-[176px] lg:h-[190px]')}
        style={tint ? undefined : { background: washOf(d) }}>
        <Picture play={play}/>
      </div>
      <div className="flex flex-1 flex-col px-1.5 pb-2 pt-3">
        <h3 id={copy ? undefined : titleId} className="m-0 font-display text-sec font-bold leading-tight text-ink">{d.title}</h3>
        <p className="m-0 mt-1 text-fine leading-[1.5] text-ink-2 lg:text-ui lg:leading-[1.5]">{d.line}</p>
      </div>
    </article>
  )
}

function Nudge({ label, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-label={label}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-rule bg-card text-ink
        transition-[background-color,transform] duration-150 ease-quint hoverOnly:bg-mist active:scale-95
        focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink">
      {children}
    </button>
  )
}

export function Different() {
  const reduced = useReduced()
  const box = React.useRef(null)
  const row = React.useRef(null)
  const [cur, setCur] = React.useState(0)
  const [seen, setSeen] = React.useState(false)
  const [stopped, setStopped] = React.useState(false)
  /* Pointer, focus and timing live in a ref: they change on every move and
     only the timer reads them. */
  const s = React.useRef({ hover: false, focus: false, held: false, driving: false,
    lastMove: 0, lastTouch: 0, raf: 0, quiet: 0 })

  const posOf = i => {
    const el = row.current
    const li = el?.children[i]
    return li ? li.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft || '0') : 0
  }
  const nearest = () => {
    const el = row.current
    let best = 0, gap = Infinity
    for (let i = 0; i < el.children.length; i++) {
      const g = Math.abs(posOf(i) - el.scrollLeft)
      if (g < gap) { gap = g; best = i }
    }
    return best
  }
  /* Set the scroll without a snap pulling it about, then hand snap back. */
  const place = x => {
    const el = row.current
    el.style.scrollSnapType = 'none'
    el.scrollLeft = x
    el.style.scrollSnapType = ''
  }
  /* On the copy of the row, jump back to the same frame on the real one. */
  const fold = () => {
    const i = nearest()
    if (i >= N) place(posOf(i - N))
  }
  const halt = () => {
    cancelAnimationFrame(s.current.raf)
    if (s.current.driving) { row.current.style.scrollSnapType = ''; s.current.driving = false }
  }

  const glide = to => {
    const el = row.current
    if (!el) return
    halt()
    setCur(to % N)
    s.current.lastMove = performance.now()
    const from = el.scrollLeft, target = posOf(to)
    if (reduced || Math.abs(target - from) < 1) { place(target); fold(); return }
    s.current.driving = true
    el.style.scrollSnapType = 'none'
    const t0 = performance.now()
    const frame = now => {
      const t = Math.min(1, (now - t0) / GLIDE_MS)
      el.scrollLeft = from + (target - from) * easeInOut(t)
      if (t < 1) { s.current.raf = requestAnimationFrame(frame); return }
      el.style.scrollSnapType = ''
      fold()
      /* The last scroll events of the glide arrive after this frame. */
      requestAnimationFrame(() => { s.current.driving = false })
    }
    s.current.raf = requestAnimationFrame(frame)
  }

  const step = dir => {
    if (!row.current) return
    let i = nearest()
    if (dir < 0 && i === 0) { place(posOf(N)); i = N }
    glide(i + dir)
  }

  const touched = () => { s.current.lastTouch = performance.now() }

  /* A scroll the row did not make itself is the reader's. */
  const onScroll = () => {
    if (s.current.driving) return
    touched()
    clearTimeout(s.current.quiet)
    s.current.quiet = setTimeout(() => {
      if (s.current.held || !row.current) return
      setCur(nearest() % N)
      fold()
    }, 160)
  }

  React.useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') { setSeen(true); return undefined }
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  React.useEffect(() => {
    const up = () => {
      if (!s.current.held) return
      s.current.held = false
      touched()
      onScroll()
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('touchend', up)
      cancelAnimationFrame(s.current.raf)
      clearTimeout(s.current.quiet)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const auto = seen && !reduced && !stopped
  React.useEffect(() => {
    if (!auto) return undefined
    s.current.lastMove = performance.now()
    const id = setInterval(() => {
      const st = s.current
      if (st.hover || st.focus || st.held || st.driving || document.hidden) return
      const now = performance.now()
      if (now - st.lastMove >= STEP_MS && now - st.lastTouch >= REST_MS) step(1)
    }, 200)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto])

  const onKey = e => {
    const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (!dir) return
    e.preventDefault()
    touched()
    step(dir)
  }

  const live = seen && !reduced

  return (
    <Section name="Features" id="different" tone="card">
      <style>{DIF_CSS}</style>
      <SectionHead>What makes MindMap different?</SectionHead>

      <div ref={box} className="mt-5 lg:mt-7"
        onPointerEnter={e => { if (e.pointerType === 'mouse') s.current.hover = true }}
        onPointerLeave={e => { if (e.pointerType === 'mouse') { s.current.hover = false; touched() } }}
        onFocus={e => { if (e.target.matches?.(':focus-visible')) s.current.focus = true }}
        onBlur={e => {
          if (box.current?.contains(e.relatedTarget)) return
          s.current.focus = false
          touched()
        }}>
        <ScrollRow index={0}>
          <ol ref={row} onScroll={onScroll} onKeyDown={onKey} tabIndex={0}
            onPointerDown={() => { s.current.held = true; halt(); touched() }}
            onWheel={() => { halt(); touched() }}
            aria-label="What makes MindMap different?"
            className="relative m-0 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto p-0 py-1
              [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4
              -mx-[22px] scroll-px-[22px] px-[22px] sm:-mx-10 sm:scroll-px-10 sm:px-10 lg:-mx-14 lg:scroll-px-14 lg:px-14
              focus-visible:outline focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-ink">
            {[0, 1].map(copy => DIFFERENT.map((d, i) => (
              <li key={`${copy}${d.id}`} aria-hidden={copy ? true : undefined}
                className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-32px)/2.4)] lg:w-[calc((100%-48px)/3.5)]">
                <Card d={d} copy={!!copy} play={live && i === cur}/>
              </li>
            )))}
          </ol>
        </ScrollRow>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div aria-hidden className="flex items-center gap-1.5">
            {DIFFERENT.map((d, i) => (
              <span key={d.id} className={cn('block h-1.5 rounded-bar transition-[width,background-color] duration-500 ease-quint',
                i === cur ? 'w-6' : 'w-1.5 bg-ruling')}
                style={i === cur ? { background: d.hue } : undefined}/>
            ))}
          </div>
          <div className="flex shrink-0 gap-2">
            {!reduced && (
              <Nudge label={stopped ? 'Play the cards' : 'Pause the cards'}
                onClick={() => { setStopped(v => !v); touched() }}>
                {stopped
                  ? <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>
                  : <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6.5" y="5.5" width="4" height="13" rx="1"/><rect x="13.5" y="5.5" width="4" height="13" rx="1"/></svg>}
              </Nudge>
            )}
            <Nudge label="Previous card" onClick={() => { touched(); step(-1) }}><ArrowLeft aria-hidden size={20}/></Nudge>
            <Nudge label="Next card" onClick={() => { touched(); step(1) }}><ArrowRight aria-hidden size={20}/></Nudge>
          </div>
        </div>
      </div>
    </Section>
  )
}

export default Different
