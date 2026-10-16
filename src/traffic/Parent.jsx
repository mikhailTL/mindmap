import React from 'react'
import { IPhone } from '../ui/iphone'
import { Never } from '../ui/marks'
import { Light, NEVER_SHOWN, parentSummary } from '../signals/light.js'
import { cn } from '../lib/utils'

/* The parent's phone. One light, one line, the week as seven small lights,
 * and under a rule the six things the parent never sees. Everything it shows
 * comes from the same live state as the teen's phone.
 *
 * Colour never carries the state alone: every light has its word beside it,
 * for colour-blind readers and for anyone glancing. The three fills are
 * tokens from tailwind.config.js: mint (a green that reads as green), sun
 * (an amber) and crit (the one red the site has). */

export const LIGHT_STYLE = {
  [Light.GREEN]:  { fill: 'bg-mint', wash: 'bg-mint-wash', ink: 'text-mint-ink', border: 'border-mint/40', word: 'Green' },
  [Light.YELLOW]: { fill: 'bg-sun',  wash: 'bg-sun-wash',  ink: 'text-sun-ink',  border: 'border-sun/40',  word: 'Yellow' },
  [Light.RED]:    { fill: 'bg-crit', wash: 'bg-coral-wash', ink: 'text-crit',    border: 'border-crit/40', word: 'Red' },
}

export const styleFor = light => LIGHT_STYLE[light] || LIGHT_STYLE[Light.GREEN]

/* A small pill: dot plus word. Used on both phones and on the parent app. */
export function LightPill({ light, className }) {
  const s = styleFor(light)
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-chip border px-2.5 py-1',
      'font-display text-fine font-bold leading-none', s.wash, s.ink, s.border, className)}>
      <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', s.fill)}/>
      {s.word}
    </span>
  )
}

/* The light itself: a large circle with its word under it. `size` in px. */
export function BigLight({ light, size = 150, className }) {
  const s = styleFor(light)
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <span aria-hidden className={cn('block rounded-full', s.fill)}
        style={{ width: size, height: size, boxShadow: 'inset 0 -6px 0 rgb(11 43 51 / 0.14)' }}/>
      <span className="mt-3 font-display text-head font-bold leading-none tracking-tight text-ink">
        {s.word}
      </span>
    </div>
  )
}

/* The demo week: six fixed days (five green, one yellow) and today, which is
   the live light. The week never shows more than one red. */
const WEEK_FIXED = [Light.GREEN, Light.GREEN, Light.YELLOW, Light.GREEN, Light.GREEN, Light.GREEN]
const DAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function WeekLights({ today }) {
  const week = [...WEEK_FIXED, today]
  const words = week.map(l => styleFor(l).word.toLowerCase())
  return (
    <ol aria-label={`This week: ${words.join(', ')}`}
      className="m-0 flex list-none justify-between gap-1 p-0">
      {week.map((l, i) => {
        const s = styleFor(l)
        const isToday = i === week.length - 1
        return (
          <li key={i} className="flex flex-col items-center gap-1.5">
            <span aria-hidden className={cn('block size-7 rounded-full', s.fill,
              isToday && 'ring-2 ring-ink ring-offset-2 ring-offset-card')}/>
            <span className="text-fine font-medium leading-none text-ink-3">
              <span aria-hidden>{DAY[i]}</span>
              <span className="sr-only">{s.word}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/* `live` is the state the teen's phone lifts every two seconds. */
export function ParentLight({ live, scale = 0.9, className }) {
  const light = live?.light || Light.GREEN
  const minutes = live?.features?.minutes ?? 0
  const at = live?.state?.since ?? Date.now()
  const sum = parentSummary({ light, at, minutes, top: live?.top })
  return (
    <IPhone interactive scale={scale} label="The parent's phone" className={className}>
      <div className="flex h-full min-h-0 flex-col bg-paper px-5 pb-2 pt-1 text-left">
        <div className="flex items-center justify-between">
          <span className="font-display text-ui font-bold text-ink">MindMap</span>
          <LightPill light={light}/>
        </div>

        <div className="mt-7 flex flex-col items-center text-center">
          <BigLight light={light}/>
          <p aria-live="polite" className="mt-4 max-w-[26ch] font-display text-meta font-semibold leading-snug text-ink">
            {sum.line}
          </p>
          {sum.detail && (
            <p className="mt-1 max-w-[30ch] text-fine leading-snug text-ink-2">{sum.detail}</p>
          )}
        </div>

        <div className="mt-6 rounded-panel border border-rule bg-card px-3.5 py-3">
          <p className="mark mb-2.5">This week</p>
          <WeekLights today={light}/>
        </div>

        <div className="mt-6 flex-1">
          <p className="mark">What you never see</p>
          <ul className="m-0 mt-1.5 list-none p-0">
            {NEVER_SHOWN.map(t => (
              <li key={t} className="flex items-start gap-2 border-b border-rule py-1.5 text-fine leading-snug text-ink-2 last:border-b-0">
                <Never aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-3"/>
                <span className="min-w-0">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </IPhone>
  )
}

export default ParentLight
