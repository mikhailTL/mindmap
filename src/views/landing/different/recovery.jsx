import React from 'react'
import { demoDay, settleTimes, settleWords } from '../../../signals/recovery'
import { cn } from '../../../lib/utils'
import { Demo, DemoTag, clock, useSteps, useWidth } from './kit'
import { DayChart, pathOf } from './daychart'

/* Recovery time: a stress spike in the demo day, the half way mark, and the
 * minutes it took to get there, every figure from signals/recovery.js on the
 * demo day it ships. Then a second peak that ran into the next one before it
 * settled, which the app counts as back to back. */

const DAY = demoDay()
const TIMES = settleTimes(DAY.index, DAY.band)
const A = TIMES.find(t => t.settled && t.peak > DAY.band.hi + 10)
const B = TIMES.find(t => t.carried)
const EVENTS = [
  { ...A, from: A.peakAt - 50, to: A.peakAt + 40, words: settleWords(A.minutes, DAY.usualSettle).line },
  { ...B, from: B.peakAt - 50, to: B.peakAt + 75, words: 'This one ran into the next peak before it settled. That counts as back to back.' },
].filter(e => e.peakAt != null)

const HOLDS = [2600, 4200, 2600, 4200]

export default function RecoveryDemo() {
  const [ref, w] = useWidth()
  const { step, reduced } = useSteps(ref, HOLDS)
  const ev = reduced ? EVENTS[0] : EVENTS[step < 2 ? 0 : 1]
  const marks = reduced || step % 2 === 1
  const wide = w >= 560
  const h = wide ? 250 : 230

  const label = `Recovery time, with the demo day. The line is the minute by minute stress index; the shaded band
    is the wearer's usual range, ${DAY.band.lo} to ${DAY.band.hi}. A peak of ${Math.round(EVENTS[0].peak)} at
    ${clock(EVENTS[0].peakAt)} came half way back to the band in ${EVENTS[0].minutes} minutes. ${EVENTS[0].words}
    A second peak at ${clock(EVENTS[1].peakAt)} ran into the next one before it settled.`

  return (
    <Demo innerRef={ref} label={label}>
      <div className="rounded-[12px] border border-rule bg-card p-2 pt-3">
        <DayChart w={Math.max(260, w - 16)} h={h} from={ev.from} to={ev.to} tickEvery={ev.to - ev.from > 100 ? 30 : 15}>
          {s => {
            const settleAt = ev.peakAt + ev.minutes
            const half = ev.target
            return (
              <>
                <rect x={s.left} y={s.y(DAY.band.hi)} width={s.right - s.left} height={s.y(DAY.band.lo) - s.y(DAY.band.hi)}
                  className="fill-lilac-wash"/>
                <text x={s.left + 8} y={s.y(DAY.band.lo) - 8} fontSize="12" fontWeight="600" fill="#6f09b2">Your usual range</text>
                <path key={ev.peakAt} pathLength="1" d={pathOf(DAY.index, ev.from, ev.to, s.x, s.y)}
                  fill="none" stroke="#a024f2" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round"
                  className="mm-dd-drawk"/>
                <g className="mm-dd-fade" style={{ opacity: marks ? 1 : 0 }}>
                  {/* the half way line, from the peak to where it was crossed */}
                  <path d={`M${s.x(ev.peakAt)} ${s.y(half)}H${s.x(settleAt)}`} stroke="#0d2b1e" strokeWidth="1.6" strokeDasharray="4 4"/>
                  <circle cx={s.x(ev.peakAt)} cy={s.y(ev.peak)} r="5.5" fill="#fff" stroke="#6f09b2" strokeWidth="2.4"/>
                  <text x={s.x(ev.peakAt) + 9} y={s.y(ev.peak) + 4} fontSize="13" fontWeight="700" fill="#0d2b1e">
                    Peak {Math.round(ev.peak)}</text>
                  <circle cx={s.x(settleAt)} cy={s.y(half)} r="4.5" fill={ev.settled ? '#6f09b2' : '#99590c'}/>
                  {/* the bracket: the recovery time itself */}
                  <path d={`M${s.x(ev.peakAt)} ${s.bottom - 10}v6H${s.x(settleAt)}v-6`} fill="none" stroke="#6f09b2" strokeWidth="2"/>
                  <text x={(s.x(ev.peakAt) + s.x(settleAt)) / 2} y={s.bottom - 16} textAnchor="middle" fontSize="13" fontWeight="700" fill="#6f09b2">
                    {ev.minutes} min</text>
                </g>
              </>
            )
          }}
        </DayChart>
      </div>

      <div className={cn('mm-dd-fade mt-3 grid gap-3', wide ? 'grid-cols-3' : 'grid-cols-2', marks ? 'opacity-100' : 'opacity-0')}>
        <div>
          <p className="m-0 text-fine text-ink-2">Peak</p>
          <p className="m-0 font-display text-row font-bold tabular-nums text-ink">{clock(ev.peakAt)}</p>
        </div>
        <div>
          <p className="m-0 text-fine text-ink-2">{ev.settled ? 'Half way back' : 'Next peak began'}</p>
          <p className="m-0 font-display text-row font-bold tabular-nums text-ink">{clock(ev.peakAt + ev.minutes)}</p>
        </div>
        <div className={wide ? '' : 'col-span-2'}>
          <p className="m-0 text-fine text-ink-2">Recovery time</p>
          <p className="m-0 font-display text-row font-bold tabular-nums text-lilac-ink">
            {ev.settled ? `${ev.minutes} min` : 'Did not settle'}</p>
        </div>
      </div>
      <p className={cn('mm-dd-fade m-0 mt-2 text-sec leading-snug text-ink', marks ? 'opacity-100' : 'opacity-0')}>{ev.words}</p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="m-0 text-fine text-ink-2">Half way back to the top of the band. Compared with you only.</p>
        <DemoTag/>
      </div>
    </Demo>
  )
}
