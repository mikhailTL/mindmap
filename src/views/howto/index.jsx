import React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { ArrowRight } from '../../ui/marks'
import { ART, MOTION_CSS } from './art'
import { GUIDES, guideFor, storageKey } from './guides'

export { GUIDES, guideFor, storageKey }

/* "How to use" for every app tab: a 44px row under the top bar that opens
 * into three pictures of how the section works and one line on what it is
 * for. Closed by default; whether each guide was left open is remembered per
 * app and tab in localStorage, read and written inside try/catch so a private
 * window or blocked storage only costs the memory.
 *
 *   <HowTo app="student" tab="student-trends" go={go}/>
 *
 * Renders nothing for a tab with no guide. */

/* Literal class names so Tailwind sees every one. wash is the picture's
   ground, ink the step number (each ink clears 4.5 : 1 on card), dot the
   small key in the closed row. */
const TONE = {
  accent: { wash: 'bg-accent-wash', ink: 'text-accent-ink', dot: 'bg-accent' },
  mint:   { wash: 'bg-mint-wash',   ink: 'text-mint-ink',   dot: 'bg-mint' },
  beam:   { wash: 'bg-beam-wash',   ink: 'text-beam-ink',   dot: 'bg-beam' },
  sky:    { wash: 'bg-sky-wash',    ink: 'text-sky-ink',    dot: 'bg-sky' },
  coral:  { wash: 'bg-coral-wash',  ink: 'text-coral-ink',  dot: 'bg-coral' },
  sun:    { wash: 'bg-sun-wash',    ink: 'text-sun-ink',    dot: 'bg-sun' },
  lilac:  { wash: 'bg-lilac-wash',  ink: 'text-lilac-ink',  dot: 'bg-lilac' },
  blush:  { wash: 'bg-blush-wash',  ink: 'text-blush-ink',  dot: 'bg-blush' },
}
const tone = name => TONE[name] || TONE.accent

function readOpen(key) {
  try {
    return globalThis.localStorage?.getItem(key) === 'open'
  } catch {
    return false
  }
}

function writeOpen(key, open) {
  try {
    globalThis.localStorage?.setItem(key, open ? 'open' : 'closed')
  } catch {
    /* storage blocked: the guide still works, it just forgets */
  }
}

/* A play triangle in a rounded square: "this shows you". */
function PlayMark() {
  return (
    <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-sm bg-accent">
      <svg viewBox="0 0 16 16" width="12" height="12">
        <path d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.4-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5z" fill="#fff"/>
      </svg>
    </span>
  )
}

function Chevron({ open }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={cn('shrink-0 text-ink-2 transition-transform duration-200 ease-out',
        'motion-reduce:transition-none', open && 'rotate-180')}>
      <path d="M5.5 9l6.5 6.5L18.5 9"/>
    </svg>
  )
}

function Step({ step, n, t, last }) {
  const Art = ART[step.art]
  return (
    <li data-howto-step={n}
      className="relative flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-2.5">
      <div className={cn('h-[84px] w-[132px] shrink-0 overflow-hidden rounded-field px-1.5 py-1',
        'sm:h-[128px] sm:w-full sm:px-3 sm:py-2', t.wash)}>
        {Art ? <Art/> : null}
      </div>
      <p className="flex min-w-0 items-baseline gap-2 text-meta leading-snug text-ink">
        <span aria-hidden className={cn('font-display text-head font-bold leading-none', t.ink)}>{n}</span>
        <span className="sr-only">Step {n}: </span>
        <span>{step.cap}</span>
      </p>
      {/* Between steps, past sm, an arrow that says "then". */}
      {!last && (
        <span aria-hidden className="absolute -right-[24px] top-[56px] hidden text-ruling sm:block lg:-right-[30px]">
          <ArrowRight size={16}/>
        </span>
      )}
    </li>
  )
}

function Guide({ app, tab, guide, go }) {
  const key = storageKey(app, tab)
  const reduced = useReducedMotion()
  const [open, setOpen] = React.useState(() => readOpen(key))
  const id = 'howto-' + React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const tones = guide.tones || []

  const toggle = () => {
    setOpen(was => {
      writeOpen(key, !was)
      return !was
    })
  }

  return (
    <div data-howto={`${app}.${tab}`}
      className={cn('wrap !pb-0 !pt-3 sm:!pt-4',
        reduced && 'ht-still')}>
      <style>{MOTION_CSS}</style>
      <div className={cn('overflow-hidden rounded-panel border bg-card transition-colors duration-200',
        open ? 'border-accent/40' : 'border-rule')}>
        <button type="button" onClick={toggle} aria-expanded={open} aria-controls={open ? id : undefined}
          className={cn('flex min-h-[44px] w-full items-center gap-3 px-2 py-1.5 text-left sm:px-3',
            'transition-colors duration-150 hoverOnly:bg-accent-wash/60',
            'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2',
            'focus-visible:outline-accent')}>
          <PlayMark/>
          <span className="min-w-0 flex-1 truncate font-display text-ui font-bold text-ink">
            {guide.title}
          </span>
          <span aria-hidden className="flex items-center gap-1">
            {[0, 1, 2].map(i => (
              <span key={i} className={cn('h-2 w-2 rounded-xs', tone(tones[i]).dot)}/>
            ))}
          </span>
          <span className="hidden text-fine text-ink-3 sm:inline">3 steps</span>
          <Chevron open={open}/>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div id={id} key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.28, ease: [0.2, 0.7, 0.3, 1] }}
              className="overflow-hidden">
              <div className="border-t border-rule px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
                <ol aria-label={guide.title}
                  className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3 sm:gap-8 lg:gap-11">
                  {guide.steps.map((s, i) => (
                    <Step key={i} step={s} n={i + 1} t={tone(tones[i])} last={i === guide.steps.length - 1}/>
                  ))}
                </ol>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-field bg-paper
                  px-3 py-2.5 sm:mt-5">
                  <p className="w-full min-w-0 text-meta text-ink-2 sm:w-auto sm:flex-1">
                    <span className="font-display font-bold text-accent-ink">Use it for </span>
                    {guide.use}
                  </p>
                  {guide.go && typeof go === 'function' && (
                    <button type="button" onClick={() => go(guide.go.route)}
                      className={cn('inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-field sm:w-auto',
                        'bg-accent px-4 font-display text-ui font-bold text-paper transition-colors',
                        'duration-150 hoverOnly:bg-accent-ink focus-visible:outline focus-visible:outline-2',
                        'focus-visible:outline-offset-2 focus-visible:outline-accent')}>
                      {guide.go.label}
                      <ArrowRight aria-hidden size={16}/>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function HowTo({ app, tab, go }) {
  const guide = guideFor(app, tab)
  if (!guide) return null
  /* keyed, so moving between tabs reads that tab's remembered state afresh */
  return <Guide key={app + '.' + tab} app={app} tab={tab} guide={guide} go={go}/>
}

export default HowTo
