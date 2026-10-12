import React from 'react'
import { Hint, Step } from './panel'
import { cn } from '../lib/utils'

/* A two-axis map, energy against pleasantness, and the nearest of sixteen
 * words to wherever the reader puts the dot. The word is the point: "wound up"
 * and "flat" are both bad days and they ask for opposite things.
 *
 * The dot tracks the finger 1:1 with no transition — a tap means put it there,
 * and a drag should stay under the thumb. Arrow keys move it in steps for a
 * keyboard, and the answer is in a live region rather than announced per
 * frame. */

/* x: unpleasant to pleasant. y: low energy to high energy. */
const WORDS = [
  { w:'Panicky',    x:-0.75, y: 0.90, asks:'Energy first. The pacer is the one built for this.' },
  { w:'Angry',      x:-0.85, y: 0.55, asks:'Wait before you send anything. Energy down first.' },
  { w:'Anxious',    x:-0.55, y: 0.70, asks:'A long out-breath, then name what the worry is actually about.' },
  { w:'Overloaded', x:-0.35, y: 0.45, asks:'Too many things at once. The pile is for splitting them up.' },
  { w:'Restless',   x:-0.10, y: 0.70, asks:'Energy with nowhere to go. Move first, sit still second.' },
  { w:'Keen',       x: 0.45, y: 0.75, asks:'Nothing to fix. Spend it on the thing you were avoiding.' },
  { w:'Excited',    x: 0.80, y: 0.85, asks:'Nothing to fix.' },
  { w:'Proud',      x: 0.85, y: 0.35, asks:'Nothing to fix. Worth telling one person.' },
  { w:'Stuck',      x:-0.70, y:-0.10, asks:'One sentence is doing the damage. Absolute words is for that.' },
  { w:'Embarrassed',x:-0.45, y: 0.10, asks:'It shrinks fastest when it is said out loud to one person.' },
  { w:'Low',        x:-0.80, y:-0.55, asks:'Not a problem to solve at speed. Senses count is the gentlest one here.' },
  { w:'Drained',    x:-0.40, y:-0.80, asks:'Rest, not technique. None of this is urgent.' },
  { w:'Bored',      x:-0.05, y:-0.60, asks:'Not a stress state. Nothing here is for it.' },
  { w:'Settled',    x: 0.55, y:-0.30, asks:'Nothing to fix.' },
  { w:'Calm',       x: 0.70, y:-0.70, asks:'Nothing to fix. This is the one the pacer is aiming at.' },
  { w:'Sleepy',     x: 0.25, y:-0.90, asks:'Nothing to fix.' },
]

const clamp = n => Math.max(-1, Math.min(1, n))
const nearest = (x, y) =>
  WORDS.reduce((best, w) =>
    (x - w.x) ** 2 + (y - w.y) ** 2 < (x - best.x) ** 2 + (y - best.y) ** 2 ? w : best)

export function FeelingMap() {
  const [pos, setPos] = React.useState({ x: 0, y: 0 })
  const [placed, setPlaced] = React.useState(false)
  const box = React.useRef(null)
  const drag = React.useRef(false)
  const found = placed ? nearest(pos.x, pos.y) : null

  const at = (clientX, clientY) => {
    const r = box.current?.getBoundingClientRect()
    if (!r || !r.width) return
    setPos({ x: clamp(((clientX - r.left) / r.width) * 2 - 1),
             y: clamp(1 - ((clientY - r.top) / r.height) * 2) })
    setPlaced(true)
  }

  const nudge = (dx, dy) => {
    setPos(p => ({ x: clamp(p.x + dx), y: clamp(p.y + dy) }))
    setPlaced(true)
  }

  const onKey = e => {
    const k = { ArrowLeft:[-0.12,0], ArrowRight:[0.12,0], ArrowUp:[0,0.12], ArrowDown:[0,-0.12] }[e.key]
    if (!k) return
    e.preventDefault()
    nudge(k[0], k[1])
  }

  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">Two questions in one move: how much energy is in
        it, and whether it feels bad or good. Put the dot where you are.</p>

      <p className="mt-5 text-center font-display text-fine font-medium text-ink-2">more energy</p>
      <div ref={box}
        onPointerDown={e => {
          drag.current = true
          e.currentTarget.setPointerCapture?.(e.pointerId)
          at(e.clientX, e.clientY)
        }}
        onPointerMove={e => { if (drag.current) at(e.clientX, e.clientY) }}
        onPointerUp={() => { drag.current = false }}
        onPointerCancel={() => { drag.current = false }}
        className="relative mx-auto mt-1.5 aspect-square w-full max-w-[20rem] touch-none
          rounded-panel border border-ruling bg-aqua">
        <span aria-hidden className="absolute inset-x-0 top-1/2 border-t border-dashed border-ruling"/>
        <span aria-hidden className="absolute inset-y-0 left-1/2 border-l border-dashed border-ruling"/>
        <button type="button" onKeyDown={onKey}
          aria-label={found ? `Marker on ${found.w}. Arrow keys move it.` : 'Marker. Arrow keys move it.'}
          style={{ left: `${(pos.x + 1) * 50}%`, top: `${(1 - pos.y) * 50}%` }}
          className="absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center
            rounded-chip">
          <span aria-hidden className={cn('block size-6 rounded-chip border-2 border-paper',
            placed ? 'bg-accent' : 'bg-ink-3')}/>
        </button>
      </div>
      <div className="mx-auto mt-1.5 flex w-full max-w-[20rem] items-baseline justify-between gap-2
        font-display text-fine font-medium text-ink-2">
        <span>feels bad</span><span>less energy</span><span>feels good</span>
      </div>

      <div aria-live="polite" className="mt-5 min-h-[7rem] rounded-panel border-l-2 border-accent bg-card pl-4">
        {found ? (
          <>
            <p className="font-display text-head font-bold text-ink">{found.w}</p>
            <p className="mt-1.5 max-w-[46ch] text-sec text-ink-2">{found.asks}</p>
            <p className="note mt-2">Closest of sixteen words to where the dot is. If it is the wrong
              word, move the dot. The word is yours to pick, not the map's.</p>
          </>
        ) : (
          <p className="text-sec text-ink-2">Drag the dot, tap the square, or move it with the arrow keys.</p>
        )}
      </div>

      <Step className="mt-6">Why a word and not a number</Step>
      <p className="mt-2.5 max-w-[58ch] text-sec text-ink-2">Putting a specific word to a feeling is
        called affect labelling, and it is a different move from rating it out of ten: the rating keeps
        you in the feeling and the word puts a frame round it. The map holds sixteen words and measures
        which one sits closest to the dot. That is the whole of it.</p>
      <Hint className="mt-3">Nothing here is a diagnosis and nothing is recorded. Close the panel and
        the dot is gone.</Hint>
    </div>
  )
}
