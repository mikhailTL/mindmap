import React from 'react'
import { Section, SectionHead } from '../../ui/section'
import { useReduced } from '../../toolkit/useReduced'
import { useSceneWatch } from '../../ui/scenes/kit'
import { PRO } from '../../lib/terms'
import { cn } from '../../lib/utils'
/* The folder path in full: on a case-insensitive disk './different' is this file. */
import { PICTURES, Glyph, DIF_CSS } from './different/index.js'

/* What makes MindMap different: eight points, one stage. Owner, 18 October:
 * the bento was "very cluttered" and "looks very childish", and on the 19th:
 * "i said redesign not remove". So the eight are a plain list of rows (mark,
 * title, one line) beside one isometric drawing (./different/pictures.jsx)
 * that changes to the row chosen.
 *
 * A row is a tab: focus, a click or tap, the arrow keys, or (from lg) hover
 * choose it. Until the reader does any of that, the rows advance on their own
 * every five seconds, only while the band is on screen and never under
 * reduced motion. The thin green rule beside the chosen row fills over those
 * five seconds.
 *
 * From lg the stage is on the left and stays in view; below lg it sits above
 * the list, shorter, and only the chosen row shows its line.
 *
 * Order is the owner's: the score first, the network second. */

export const DIFFERENT = [
  { id: 'score', title: 'Mind Score',
    line: 'One daily number from our own neural network, built from your body’s signals.',
    alt: 'A dial standing on a plate, its needle at the day’s reading.' },
  { id: 'network', title: 'Support network',
    line: `Link a parent and a ${PRO}. The teen decides what each one sees.`,
    alt: `Three linked tiles for a teen, a parent and a ${PRO}, with a lock on the teen’s.` },
  { id: 'patch', title: 'Patch or phone',
    line: 'A patch designed to read pulse, sweat, temperature and movement. No patch? Use the phone camera or the Mental Mirror.',
    alt: 'The patch and a phone side by side.' },
  { id: 'heads', title: 'Heads Up',
    line: 'Tells parents when phone use shows signs of stress.',
    alt: 'A phone with a traffic light beside it, the green lamp lit.' },
  { id: 'settle', title: 'Recovery time',
    line: 'The patch shows how fast your body settles after a peak, and what helps.',
    alt: 'A curve rising to a peak and settling back to its usual level.' },
  { id: 'event', title: 'Stress before events',
    line: 'Mark a test and see how stress builds in the hours before it.',
    alt: 'A calendar with one day marked and a curve rising towards it.' },
  { id: 'ai', title: 'MindMap AI',
    line: 'Ask about stress, sleep and school. Get a plain, practical answer.',
    alt: 'Three chat panels stacked in the air.' },
  { id: 'toolkit', title: 'Toolkit with levels',
    line: 'Exercises your phone measures. Points open new levels, with no streaks to keep.',
    alt: 'Three steps with a block climbing to the top one.' },
]

const STEP_MS = 5000

/* Hover chooses a row only from lg, where every line shows. Below that the
   chosen row opens and the rest shift, which would put a different row under
   a resting pointer and choose that one too. */
const wide = () => window.matchMedia?.('(min-width: 1024px)').matches ?? true

export function Different() {
  const reduced = useReduced()
  const uid = React.useId()
  const tabId = i => `${uid}t${i}`
  const [on, setOn] = React.useState(0)
  const [prev, setPrev] = React.useState(-1)
  const [auto, setAuto] = React.useState(true)
  const [seen, setSeen] = React.useState(false)
  const box = React.useRef(null)
  const stage = React.useRef(null)
  const tabs = React.useRef([])
  useSceneWatch(stage)

  React.useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const show = i => {
    if (i === on) return
    setPrev(on)
    setOn(i)
  }

  const playing = auto && seen && !reduced
  React.useEffect(() => {
    if (!playing) return undefined
    const t = setTimeout(() => { setPrev(on); setOn((on + 1) % DIFFERENT.length) }, STEP_MS)
    return () => clearTimeout(t)
  }, [playing, on])

  const take = i => { setAuto(false); show(i) }

  const onKey = e => {
    const n = DIFFERENT.length
    const to = { ArrowDown: on + 1, ArrowRight: on + 1, ArrowUp: on - 1, ArrowLeft: on - 1, Home: 0, End: n - 1 }[e.key]
    if (to === undefined) return
    e.preventDefault()
    tabs.current[(to + n) % n]?.focus()
  }

  const cur = DIFFERENT[on]

  return (
    <Section name="Features" id="different" tone="card">
      <style>{DIF_CSS}</style>
      <SectionHead>What makes MindMap different</SectionHead>

      <div ref={box} className="mt-6 grid gap-5 lg:mt-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div role="tabpanel" id={`${uid}p`} aria-labelledby={tabId(on)} tabIndex={0}
          className="relative h-[220px] overflow-hidden rounded-panel border border-rule bg-paper sm:h-[300px]
            lg:sticky lg:top-[76px] lg:h-auto lg:aspect-[6/5]">
          <div ref={stage} className="absolute inset-0">
            {DIFFERENT.map((d, i) => {
              const Picture = PICTURES[d.id]
              return (
                <div key={d.id} aria-hidden="true"
                  className={cn('absolute inset-0 transition-[opacity,transform] ease-quint',
                    'motion-reduce:transform-none motion-reduce:duration-200',
                    i === on ? 'dif-on z-10 translate-y-0 opacity-100 duration-700'
                      : i === prev ? '-translate-y-2 opacity-0 duration-500'
                      : 'translate-y-3 opacity-0 duration-500')}>
                  <Picture/>
                </div>
              )
            })}
          </div>
          <p className="sr-only">{cur.alt}</p>
        </div>

        <div role="tablist" aria-orientation="vertical" aria-label="What makes MindMap different" onKeyDown={onKey}
          className="m-0 border-b border-rule">
          {DIFFERENT.map((d, i) => {
            const sel = i === on
            return (
              <button key={d.id} type="button" role="tab" id={tabId(i)}
                ref={el => { tabs.current[i] = el }}
                aria-selected={sel} aria-controls={`${uid}p`} tabIndex={sel ? 0 : -1}
                aria-labelledby={`${tabId(i)}n`} aria-describedby={`${tabId(i)}l`}
                onClick={() => take(i)} onFocus={() => take(i)}
                onPointerEnter={e => { if (e.pointerType === 'mouse' && wide()) take(i) }}
                className="relative grid w-full grid-cols-[28px_minmax(0,1fr)] items-start gap-x-3.5 border-t border-rule
                  py-3.5 pl-4 pr-1 text-left touch-manipulation lg:py-4">
                {/* The rule: a hairline track, filled green for the chosen row,
                    filling over the five seconds while the rows advance. */}
                <span aria-hidden className="absolute bottom-3 left-0 top-3 w-[2px] overflow-hidden rounded-bar">
                  {sel && (
                    <span key={`${on}${playing}`}
                      className={cn('block h-full w-full origin-top bg-accent', playing && 'dif-fill')}
                      style={playing ? { animationDuration: `${STEP_MS}ms` } : undefined}/>
                  )}
                </span>
                <Glyph id={d.id} className={cn('mt-0.5 size-7 transition-colors duration-200',
                  sel ? 'text-accent' : 'text-ink-3')}/>
                <span className="min-w-0">
                  <span id={`${tabId(i)}n`} className={cn('block font-display text-sec font-bold leading-snug transition-colors duration-200',
                    sel ? 'text-ink' : 'text-ink-2')}>
                    {d.title}
                  </span>
                  {/* Below lg only the chosen row opens; from lg every line shows,
                      so a hover never moves the row under the pointer. */}
                  <span className={cn('grid transition-[grid-template-rows] duration-300 ease-quint motion-reduce:transition-none lg:grid-rows-[1fr]',
                    sel ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                    <span id={`${tabId(i)}l`} className="block overflow-hidden">
                      <span className="block pt-1 text-ui leading-[1.5] text-ink-2">{d.line}</span>
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

export default Different
