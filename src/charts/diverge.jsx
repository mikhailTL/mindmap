import React from 'react'
import { SCORE_RANGE } from '../lib/terms'
import { cn } from '../lib/utils'

/* Diverging bars off a neutral centre: one row per network term, right of the
 * centre raised the score and left of it lowered it. Real DOM text, so a
 * label is the size it says it is at any width.
 *
 * WHAT IT NOW CARRIES. The figure used to be direction plus a bar of
 * unstated length: there was no scale, so a reader could see which way a term
 * pushed but not how far, and the two bars either side of the line could not
 * be compared against anything. It carries a scale now: the track spans -1.00
 * to +1.00 in the network's own units, which are the units the figure column
 * already printed, and the axis under the list names the five graduations and
 * both directions. Quarter grid lines at -0.50 and +0.50 let a bar be read to
 * the nearest quarter without the number.
 *
 * THE CENTRE LINE was a `linear-gradient` in ink-3 across a 1px band, which
 * cannot land on a device pixel and printed under half strength at every
 * width. It is a real 1px element now, painted after the bar so the bar's
 * root sits on a visible baseline. ink-3 is 5.33 : 1 on paper and 5.61 on
 * card; these rules are non-text graphics and clear the 3 : 1 minimum at full
 * strength. The quarter lines were `ink-3/45`, which the old note claimed
 * cleared 3 : 1 and does not - it measures about 2.1 on card - so they are
 * `rule` now, the flat gridline token the other charts in this directory use.
 * They graduate a track whose ends and centre are numbered, so they carry no
 * value of their own and owe no floor; the point of the change is that a flat
 * token is measurable and a percentage of an ink is not.
 *
 * WIDTHS. Below sm the row was three stacked lines with the bar floating in
 * the middle of them. It is two lines now: the label owns the first, the bar
 * and its figure share the second, so the track keeps the whole column width
 * less the figure. From sm the label column gives up width first and the
 * track holds a 9rem floor; without one, a 22rem label plus a 4.5rem figure
 * inside a 34rem sticky panel left the track about 26px wide and a full -1.00
 * bar rendered as a 13px blob. The label column is 14rem now, not 22rem.
 *
 * NO EN DASH. The flat state is a filled circle and its own 0.00, never a
 * dash glyph: a harness counts U+2013 and U+2014 anywhere in the output. */

/* The scale, in the network's units. -1 and +1 are where the call sites clamp,
   so the track ends are the clamp and not an arbitrary round number. */
const TICKS = [-1, -0.5, 0, 0.5, 1]
/* Only the ends and the centre are numbered. The track is 204px at 390 and
   has a 9rem floor inside the sticky panel at lg; five numbers need more than
   either, and the quarter ticks are read off their position between the three
   that are numbered. */
const NUMBERED = [-1, 0, 1]
const PCT = x => 50 + x * 50

/* One template for the rows and the axis, so a tick lands on the same pixel
   as the bar it graduates. At the base width the label spans both columns on
   its own line and `display:none` keeps the axis spacers out of the grid. */
const COLS = 'grid-cols-[minmax(0,1fr)_5.75rem] '
  + 'sm:grid-cols-[minmax(0,14rem)_minmax(9rem,1fr)_5.75rem]'

const fmt = x => (x > 0 ? '+' : '') + x.toFixed(2)

function Track({ x }) {
  const up = x > 0.02, down = x < -0.02
  return (
    <span className="relative block h-[18px]">
      {[-0.5, 0.5].map(t => (
        <span key={t} aria-hidden style={{ left: `${PCT(t)}%` }}
          className="absolute inset-y-0 block w-px bg-rule"/>
      ))}
      <span aria-hidden style={{ width: `${Math.max(Math.abs(x), 0.012) * 50}%`,
        [x >= 0 ? 'left' : 'right']: '50%' }}
        className={cn('absolute top-px block h-4 rounded-sm',
          up ? 'bg-warn' : down ? 'bg-accent' : 'bg-ruling')}/>
      {/* last, so the baseline stays visible through the bar's root */}
      <span aria-hidden
        className="absolute inset-y-0 left-1/2 block w-px -translate-x-1/2 bg-ink-3"/>
    </span>
  )
}

/* The axis is one row of the same grid: ticks on the rule, their values under
   them, and the two directions named at the ends so the figure says which way
   is which without the surrounding paragraph. */
function Axis() {
  return (
    <span className="relative mt-1.5 block h-[52px] border-t border-ink-3/60">
      {TICKS.map(t => (
        <React.Fragment key={t}>
          <span aria-hidden style={{ left: `${PCT(t)}%` }}
            className="absolute top-0 block h-1.5 w-px -translate-x-1/2 bg-ink-3"/>
          {NUMBERED.includes(t) && (
            <span style={{ left: `${PCT(t)}%` }}
              className={cn('absolute top-2 block whitespace-nowrap text-fine',
                'tabular-nums text-ink-3',
                t === -1 ? 'translate-x-0' : t === 1 ? '-translate-x-full' : '-translate-x-1/2')}>
              {t === 0 ? '0' : (t > 0 ? '+' : '') + t.toFixed(2)}
            </span>
          )}
        </React.Fragment>
      ))}
      <span className="absolute left-0 top-8 block whitespace-nowrap text-fine text-ink-3">
        lowered the score
      </span>
      <span className="absolute right-0 top-8 block whitespace-nowrap text-fine text-ink-3">
        raised the score
      </span>
    </span>
  )
}

export function Diverge({ items }) {
  return (
    <div>
      <ul className="m-0 mt-3.5 list-none p-0">
        {items.map(it => {
          const up = it.x > 0.02, down = it.x < -0.02
          return (
            <li key={it.label}
              className={cn('grid items-center gap-x-4 gap-y-1.5 border-b border-rule py-3.5',
                COLS, 'sm:gap-x-5')}>
              <span className="col-span-2 text-meta text-ink-2 sm:col-span-1">{it.label}</span>
              <Track x={it.x}/>
              {/* Shape as well as colour: a caret up, a caret down, or a dot
                  for a term that moved the score by under half a hundredth. */}
              <span className={cn('whitespace-nowrap text-sec tabular-nums sm:text-right',
                up ? 'text-warn' : down ? 'text-accent' : 'text-ink-3')}>
                {up ? '▲' : down ? '▼' : '●'} {fmt(it.x)}
              </span>
            </li>
          )
        })}
        <li className={cn('grid gap-x-4', COLS, 'sm:gap-x-5')}>
          <span aria-hidden className="hidden sm:block"/>
          <Axis/>
          <span aria-hidden className="hidden sm:block"/>
        </li>
      </ul>
      <p className="mt-1.5 text-fine text-ink-3">
        Bars use network units, not {SCORE_RANGE}. Zero is this
        person&rsquo;s own average.
      </p>
    </div>
  )
}
