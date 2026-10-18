import React from 'react'
import { Section, SectionHead } from '../../ui/section'
import { ArrowLeft, ArrowRight } from '../../ui/marks'
import { useReduced } from '../../toolkit/useReduced'
import { ScrollRow } from '../../ui/motion'
import { PRO } from '../../lib/terms'
import { cn } from '../../lib/utils'
/* The folder path in full: on a case-insensitive disk './different' is this file. */
import { PICTURES } from './different/index.js'

/* What makes MindMap different: eight points, each a card with one
 * purpose-built picture (./different/pictures.jsx), a title and one line.
 * No links: there is no page per feature, so a card is not a button (the
 * owner, 18 October).
 *
 * Cards are not all the same box. Four looks, shared by the site's radius
 * and type: `tint` (the point's own wash as the ground), `outline` (the
 * site's white card), `rule` (no box, a coloured rule over the picture) and
 * `ink` (the dark band's ground). Neighbours never share a look.
 *
 * At xl the eight sit in a four-column bento: the Mind Score is the 2 by 2
 * feature, the network a wide card across the bottom. Below that they are one
 * row that swipes sideways with the next card peeking in. From sm, arrow
 * buttons beside the heading move the row a card at a time for a mouse; a
 * phone swipes, and the row itself takes keyboard focus and arrow keys.
 *
 * Order is the owner's: the score first, the network second. */

const LOOK = {
  tint: {
    card: '', pane: '',
    title: 'text-ink', body: 'text-ink-2',
  },
  outline: {
    card: 'border border-rule bg-card', pane: '',
    title: 'text-ink', body: 'text-ink-2',
  },
  rule: {
    card: 'bg-card', pane: '',
    title: 'text-ink', body: 'text-ink-2',
  },
  ink: {
    card: 'bg-ink', pane: 'bg-white/[0.06]',
    title: 'text-paper', body: 'text-mist',
  },
}

export const DIFFERENT = [
  { id: 'score', look: 'tint',
    ground: 'bg-accent-wash', pane: 'bg-card/60',
    place: 'xl:col-span-2 xl:row-span-2 xl:col-start-1 xl:row-start-1',
    title: 'Mind Score',
    line: 'One daily number from our own neural network, built from your body’s signals.' },
  { id: 'network', look: 'outline',
    pane: 'bg-coral-wash',
    place: 'xl:col-span-2 xl:col-start-1 xl:row-start-3', wide: true,
    title: 'Support network',
    line: `Link a parent and a ${PRO}. The teen decides what each one sees.` },
  { id: 'patch', look: 'rule',
    rule: 'bg-beam', pane: 'bg-beam-wash',
    place: 'xl:col-start-3 xl:row-start-1',
    title: 'Patch or phone',
    line: 'A patch designed to read pulse, sweat, temperature and movement. No patch? Use the phone camera or the Mental Mirror.' },
  { id: 'heads', look: 'ink',
    place: 'xl:col-start-4 xl:row-start-1',
    title: 'Heads Up',
    line: 'Tells parents when phone use shows signs of stress.' },
  { id: 'settle', look: 'rule',
    rule: 'bg-lilac', pane: 'bg-lilac-wash',
    place: 'xl:col-start-4 xl:row-start-2',
    title: 'Recovery time',
    line: 'The patch shows how fast your body settles after a peak, and what helps.' },
  { id: 'event', look: 'tint',
    ground: 'bg-sun-wash', pane: 'bg-card/70',
    place: 'xl:col-start-3 xl:row-start-2',
    title: 'Stress before events',
    line: 'Mark a test and see how stress builds in the hours before it.' },
  { id: 'ai', look: 'ink',
    place: 'xl:col-start-3 xl:row-start-3',
    title: 'MindMap AI',
    line: 'Ask about stress, sleep and school. Get a plain, practical answer.' },
  { id: 'toolkit', look: 'tint',
    ground: 'bg-mint-wash', pane: 'bg-card/55',
    place: 'xl:col-start-4 xl:row-start-3',
    title: 'Toolkit with levels',
    line: 'Exercises your phone measures. Points open new levels, with no streaks to keep.' },
]

function Point({ d }) {
  const titleId = React.useId()
  const Picture = PICTURES[d.id]
  const look = LOOK[d.look]
  const big = d.id === 'score'
  return (
    <article aria-labelledby={titleId}
      className={cn('relative flex h-full flex-col overflow-hidden rounded-[16px] p-2',
        look.card, d.ground, d.wide && 'xl:flex-row xl:items-stretch')}>
      {d.rule && <span aria-hidden className={cn('mx-1.5 mb-2 mt-0.5 block h-1 rounded-bar', d.rule)}/>}
      <div className={cn('relative shrink-0 overflow-hidden rounded-[12px]', look.pane, d.pane,
        'h-[148px]', big && 'xl:h-auto xl:min-h-[280px] xl:flex-1',
        d.wide && 'xl:h-auto xl:min-h-[168px] xl:w-[54%]')}>
        <Picture/>
      </div>
      <div className={cn('flex flex-1 flex-col px-1.5 pt-3', big && 'xl:flex-none', d.wide && 'xl:justify-center xl:pl-5 xl:pt-1')}>
        <h3 id={titleId} className={cn('m-0 font-display font-bold leading-tight',
          big ? 'text-sec xl:text-head' : 'text-sec', look.title)}>{d.title}</h3>
        <p className={cn('m-0 mt-1 text-fine leading-[1.5]', big && 'xl:max-w-[46ch] xl:text-ui', look.body)}>{d.line}</p>
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

export function Different() {
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
    const card = el?.querySelector(':scope > li')
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
        <ol ref={row} onScroll={read} aria-label="What makes MindMap different" tabIndex={0}
          className="m-0 mt-5 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto p-0 pb-1
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            -mx-[22px] scroll-px-[22px] px-[22px] sm:-mx-10 sm:scroll-px-10 sm:px-10 lg:-mx-14 lg:scroll-px-14 lg:px-14
            focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink
            xl:mx-0 xl:grid xl:grid-cols-4 xl:gap-4 xl:overflow-visible xl:px-0">
          {DIFFERENT.map(d => (
            <li key={d.id} className={cn('w-[80%] max-w-[310px] shrink-0 snap-start xl:w-auto xl:max-w-none', d.place)}>
              <Point d={d}/>
            </li>
          ))}
        </ol>
      </ScrollRow>
    </Section>
  )
}

export default Different
