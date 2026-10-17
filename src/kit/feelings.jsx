import React from 'react'
import { Hint, Step } from './panel'
import { cn } from '../lib/utils'

/* Mood Map. A two-axis field, energy against pleasantness, and the nearest of
 * sixteen words to wherever the reader puts the dot. The word is the point:
 * "wound up" and "flat" are both bad days and they ask for opposite things.
 *
 * THE FIELD. All sixteen words are drawn as marks where they sit, so the map
 * teaches its own vocabulary: a reader can see that the bottom left is a
 * different country from the top left before they have moved anything. The
 * nearest mark grows and takes the activity's colour as the dot passes it, which is the whole
 * mechanism made visible, and a crosshair follows the dot out to the two axes
 * so the reading is legible as two values rather than one position.
 *
 * The dot tracks the finger 1:1 with no transition: a tap means put it there,
 * and a drag should stay under the thumb. Only the things that are not the
 * dot's position animate, so nothing lags the finger. Arrow keys move it in
 * steps for a keyboard, and the answer is in a live region rather than
 * announced per frame. */

/* x: unpleasant to pleasant. y: low energy to high energy. */
const WORDS = [
  { w:'Panicky',    x:-0.75, y: 0.90, asks:'Energy first. Resonance Breathing is the one built for this.' },
  { w:'Angry',      x:-0.85, y: 0.55, asks:'Wait before you send anything. Energy down first.' },
  { w:'Anxious',    x:-0.55, y: 0.70, asks:'A long out-breath, then name what the worry is actually about.' },
  { w:'Overloaded', x:-0.35, y: 0.45, asks:'Too many things at once. Brain Dump is for splitting them up.' },
  { w:'Restless',   x:-0.10, y: 0.70, asks:'Energy with nowhere to go. Move first, sit still second.' },
  { w:'Keen',       x: 0.45, y: 0.75, asks:'Nothing to fix. Spend it on the thing you were avoiding.' },
  { w:'Excited',    x: 0.80, y: 0.85, asks:'Nothing to fix.' },
  { w:'Proud',      x: 0.85, y: 0.35, asks:'Nothing to fix. Worth telling one person.' },
  { w:'Stuck',      x:-0.70, y:-0.10, asks:'One sentence is doing the damage. Thought Reframe is for that.' },
  { w:'Embarrassed',x:-0.45, y: 0.10, asks:'It shrinks fastest when it is said out loud to one person.' },
  { w:'Low',        x:-0.80, y:-0.55, asks:'Not a problem to solve at speed. 5-4-3-2-1 Grounding is the gentlest one here.' },
  { w:'Drained',    x:-0.40, y:-0.80, asks:'Rest, not technique. None of this is urgent.' },
  { w:'Bored',      x:-0.05, y:-0.60, asks:'Not a stress state. Nothing here is for it.' },
  { w:'Settled',    x: 0.55, y:-0.30, asks:'Nothing to fix.' },
  { w:'Calm',       x: 0.70, y:-0.70, asks:'Nothing to fix. This is the one Resonance Breathing is aiming at.' },
  { w:'Sleepy',     x: 0.25, y:-0.90, asks:'Nothing to fix.' },
]

const clamp = n => Math.max(-1, Math.min(1, n))
const d2 = (x, y, w) => (x - w.x) ** 2 + (y - w.y) ** 2
/* Both ends of the lookup, because the runner-up is information: a dot sitting
   between two words is a real answer and a single word hides it. */
const ranked = (x, y) => [...WORDS].sort((a, b) => d2(x, y, a) - d2(x, y, b))
const pc = (x, y) => ({ left: `${(x + 1) * 50}%`, top: `${(1 - y) * 50}%` })
/* The floating label is clamped away from the map's own edges so a word at the
   far left is readable rather than clipped. The dot itself is not clamped: it
   has to stay under the thumb. */
const labelLeft = x => `${Math.max(16, Math.min(84, (x + 1) * 50))}%`

export function FeelingMap() {
  const [pos, setPos] = React.useState({ x: 0, y: 0 })
  const [placed, setPlaced] = React.useState(false)
  const [held, setHeld] = React.useState(false)
  const box = React.useRef(null)
  const drag = React.useRef(false)
  const order = placed ? ranked(pos.x, pos.y) : null
  const found = order ? order[0] : null
  const next = order ? order[1] : null

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

  const release = () => { drag.current = false; setHeld(false) }

  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">Two questions in one move: how much energy is in
        it, and whether it feels bad or good. Put the dot where you are. The sixteen marks are the
        words, and the one nearest your dot is the answer.</p>

      <p className="mt-5 text-center font-display text-fine font-medium text-ink-2">more energy</p>
      <div ref={box}
        onPointerDown={e => {
          drag.current = true
          setHeld(true)
          e.currentTarget.setPointerCapture?.(e.pointerId)
          at(e.clientX, e.clientY)
        }}
        onPointerMove={e => { if (drag.current) at(e.clientX, e.clientY) }}
        onPointerUp={release}
        onPointerCancel={release}
        className="relative mx-auto mt-1.5 aspect-square w-full max-w-[20rem] touch-none
          overflow-hidden rounded-[18px] border border-rule kit-ground">
        <span aria-hidden className="absolute inset-x-0 top-1/2 border-t border-dashed border-ruling"/>
        <span aria-hidden className="absolute inset-y-0 left-1/2 border-l border-dashed border-ruling"/>

        {/* The sixteen words, where they live. The nearest one grows and takes
            the accent, which is the measurement made visible: the map is not
            guessing, it is finding the closest mark. */}
        {WORDS.map(w => (
          <span key={w.w} aria-hidden style={pc(w.x, w.y)}
            className={cn('absolute block size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-chip',
              'transition-[background-color,transform] duration-200 ease-[var(--ease-out)]',
              found === w ? 'scale-[2.2] kit-fill' : 'bg-ink-3')}/>
        ))}

        {/* The reading, out to both axes. Shown only once the dot is placed, so
            an untouched map is the words and nothing else. */}
        {placed && (
          <>
            <span aria-hidden style={{ left: pc(pos.x, 0).left }}
              className="kit-edge absolute inset-y-0 border-l-2 opacity-50"/>
            <span aria-hidden style={{ top: pc(0, pos.y).top }}
              className="kit-edge absolute inset-x-0 border-t-2 opacity-50"/>
            {/* The answer, written where it lives. Sixteen unlabelled dots are
                a pattern; one of them named under the thumb is the map
                teaching its own vocabulary as the dot moves across it. It
                tracks the finger with no transition, like the dot, and sits
                above the dot in the bottom quarter so it is never off the
                bottom edge. */}
            <span aria-hidden style={{ left: labelLeft(pos.x), top: pc(0, pos.y).top }}
              className={cn('pointer-events-none absolute -translate-x-1/2 whitespace-nowrap',
                'kit-fill rounded-chip px-2.5 py-0.5 font-display text-fine font-bold text-paper',
                pos.y < -0.5 ? '-translate-y-[2.4rem]' : 'translate-y-[1.3rem]')}>{found.w}</span>
          </>
        )}

        <button type="button" onKeyDown={onKey}
          aria-label={found ? `Marker on ${found.w}. Arrow keys move it.` : 'Marker. Arrow keys move it.'}
          style={pc(pos.x, pos.y)}
          className="absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center
            rounded-chip">
          {/* A halo under the thumb, so the finger covering the dot does not
              also cover every sign that it is being held. Opacity, which is
              what still works when motion is reduced. */}
          <span aria-hidden className={cn('absolute size-11 rounded-chip kit-ground',
            'transition-opacity duration-150 ease-[var(--ease-out)]', held ? 'opacity-100' : 'opacity-0')}/>
          <span aria-hidden className={cn('relative block size-6 rounded-chip border-2 border-paper',
            'transition-transform duration-150 ease-[var(--ease-out)]',
            held && 'scale-[1.2]', placed ? 'kit-fill' : 'bg-ink-3')}/>
        </button>
      </div>
      <div className="mx-auto mt-1.5 flex w-full max-w-[20rem] items-baseline justify-between gap-2
        font-display text-fine font-medium text-ink-2">
        <span>feels bad</span><span>less energy</span><span>feels good</span>
      </div>

      <div aria-live="polite"
        className="kit-edge mt-5 min-h-[7rem] rounded-[18px] border border-l-[6px] bg-card p-4">
        {found ? (
          /* Keyed on the word, so a new answer arrives rather than swapping
             under the reader's eye mid-drag. */
          <div key={found.w} className="kit-rise">
            <p className="font-display text-head font-bold text-ink">{found.w}</p>
            <p className="mt-1.5 max-w-[46ch] text-sec text-ink-2">{found.asks}</p>
            <p className="mt-2 text-fine text-ink-2">Next closest: {next.w}. If neither is the right
              word, move the dot.</p>
            <p className="note mt-1.5">Closest of sixteen words to where the dot is, by distance and
              nothing else. The word is yours to pick, not the map's.</p>
          </div>
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
