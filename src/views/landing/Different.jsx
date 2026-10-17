import React from 'react'
import { Section, SectionHead } from '../../ui/section'
import { ArrowLeft, ArrowRight } from '../../ui/marks'
import { useReduced } from '../../toolkit/useReduced'
import { ScrollRow } from '../../ui/motion'
import { PRO, SCORE } from '../../lib/terms'
import { cn } from '../../lib/utils'
/* The folder path in full: on a case-insensitive disk './different' is this file. */
import { PICTURES } from './different/index.js'

/* What makes MindMap different: ten points, each a short card with one plain
 * picture (./different/pictures.jsx), a title, one line, and a link to the
 * page that explains it.
 *
 * At xl and up the ten sit in a 5 by 2 grid. Below that they are one row that
 * swipes sideways with the next card peeking in, so on a phone the whole band
 * is about one card tall. From sm, arrow buttons beside the heading move the
 * row one card at a time for a mouse; a phone swipes, and a keyboard reaches
 * every card's link, which scrolls it into view.
 *
 * Order is the owner's: the score first, the network second, privacy last. */

export const DIFFERENT = [
  { id: 'score', go: 'methods',
    title: SCORE,
    line: 'One daily number from our own neural network.' },
  { id: 'network', go: 'network',
    title: 'Network',
    line: `Teens link a parent and a ${PRO}. Each sees only what the teen shares.` },
  { id: 'patch', go: 'patch',
    title: 'Wearable patch',
    line: 'Designed to read pulse, sweat, temperature and movement.' },
  { id: 'heads', go: 'heads-up',
    title: 'Heads Up',
    line: 'Tells parents when phone use shows signs of stress.' },
  { id: 'settle', go: 'methods',
    title: 'Recovery time',
    line: 'How fast your body settles after a peak.' },
  { id: 'event', go: 'calendar',
    title: 'Stress before events',
    line: 'How stress builds before a test you marked.' },
  { id: 'breath', go: 'toolkit',
    title: 'Measured exercises',
    line: 'Your phone measures breath, stillness and reaction time.' },
  { id: 'helped', go: 'toolkit',
    title: 'Before and after',
    line: 'A pulse check before and after shows what works.' },
  { id: 'ai', go: 'ai',
    title: 'MindMap AI',
    line: 'Ask questions about stress, sleep and school.' },
  { id: 'sharing', go: 'privacy',
    title: 'Privacy',
    line: `Teens choose what parents and ${PRO}s see.` },
]

function Point({ d, go }) {
  const titleId = React.useId()
  const Picture = PICTURES[d.id]
  return (
    <article aria-labelledby={titleId}
      className="flex h-full flex-col rounded-[16px] border border-rule bg-card p-2">
      <Picture/>
      <div className="flex flex-1 flex-col px-1.5 pt-3">
        <h3 id={titleId} className="m-0 font-display text-sec font-bold leading-tight text-ink">{d.title}</h3>
        <p className="m-0 mt-1 text-fine leading-[1.5] text-ink-2">{d.line}</p>
        <div className="mt-auto pt-1">
          <button type="button" onClick={() => go?.(d.go)}
            aria-label={`See how it works: ${d.title}`}
            className="group -ml-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-field px-1
              font-display text-ui font-bold text-accent-ink">
            See how it works
            <ArrowRight aria-hidden size={18} className="transition-transform duration-200 ease-out
              motion-safe:groupHoverOnly:translate-x-1"/>
          </button>
        </div>
      </div>
    </article>
  )
}

function Nudge({ dir, disabled, onClick }) {
  const Icon = dir < 0 ? ArrowLeft : ArrowRight
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      aria-label={dir < 0 ? 'Previous card' : 'Next card'}
      className="grid size-11 place-items-center rounded-full border border-rule bg-card text-ink
        transition-opacity duration-150 disabled:opacity-40">
      <Icon aria-hidden size={20}/>
    </button>
  )
}

export function Different({ go }) {
  const reduced = useReduced()
  const row = React.useRef(null)
  const [ends, setEnds] = React.useState({ start: true, end: false })

  const read = React.useCallback(() => {
    const el = row.current
    if (!el) return
    setEnds({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }, [])

  React.useEffect(() => {
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [read])

  const step = dir => {
    const el = row.current
    const card = el?.querySelector('li')
    if (!el || !card) return
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 12), behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <Section name="Features" id="different" tone="card">
      <div className="flex items-end justify-between gap-4">
        <SectionHead>What makes MindMap different</SectionHead>
        <div className="hidden shrink-0 gap-2 sm:flex xl:hidden">
          <Nudge dir={-1} disabled={ends.start} onClick={() => step(-1)}/>
          <Nudge dir={1} disabled={ends.end} onClick={() => step(1)}/>
        </div>
      </div>

      <ScrollRow index={0}>
        <ol ref={row} onScroll={read} aria-label="What makes MindMap different"
          className="m-0 mt-5 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto p-0 pb-1
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            -mx-[22px] scroll-px-[22px] px-[22px] sm:-mx-10 sm:scroll-px-10 sm:px-10 lg:-mx-14 lg:scroll-px-14 lg:px-14
            xl:mx-0 xl:grid xl:grid-cols-5 xl:gap-4 xl:overflow-visible xl:px-0">
          {DIFFERENT.map(d => (
            <li key={d.id} className="w-[78%] max-w-[300px] shrink-0 snap-start xl:w-auto xl:max-w-none">
              <Point d={d} go={go}/>
            </li>
          ))}
        </ol>
      </ScrollRow>
    </Section>
  )
}

export default Different
