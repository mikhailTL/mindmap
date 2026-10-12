import React from 'react'
import { ScrollIn } from '../ui/motion'
import { PHOTOS } from '../lib/photos'
import { cn } from '../lib/utils'

/* Photographs of people, for pages that are otherwise all drawing and type.
 *
 * Every frame here is a licensed stock photograph of models. Nobody in one is
 * a MindMap user, nobody is wearing the patch, and no caption may claim a
 * story about the person in it: the captions name the ordinary moment in the
 * picture and stop. `Faces` prints that out loud under the grid, so the page
 * never has to be read as a wall of testimonials it has not earned.
 *
 * Entrances are ScrollIn and nothing else. Hover is behind motion-safe:, so a
 * reader with prefers-reduced-motion gets the resting frame with no movement
 * at all. */

/* Intrinsic size per key, so the browser can hold the box before the file
   arrives. Everything is 1600 on the long side; parent-kitchen is the one
   portrait frame. */
const SIZE = {
  'clinic-talk': [1600, 1066],
  'friends-steps': [1418, 1125],
  'parent-kitchen': [1067, 1600],
  'parent-laptop': [1600, 1066],
  'student-basketball': [1600, 1066],
  'student-bus': [1600, 1067],
  'student-controller': [1600, 1067],
  'student-game': [1600, 1066],
  'student-homework': [1592, 1194],
  'students-hallway': [1600, 1068],
}
const dims = key => SIZE[key] || [1600, 1066]

/* alt is what is in the frame, for a reader who cannot see it. caption is what
   a sighted reader gets under it. They are never the same sentence. */
export const FACES = [
  {
    photo: 'student-bus',
    caption: 'The ride to school',
    alt: 'Two boys laughing together on a school bus seat, one holding a phone, trees going past the window behind them',
  },
  {
    photo: 'students-hallway',
    caption: 'Between classes',
    alt: 'Four high school students walking along a bright corridor with folders and backpacks, talking as they go',
  },
  {
    photo: 'student-game',
    caption: 'A game with friends',
    alt: 'Three teenage boys sitting along a sofa with game controllers, headphones round their necks, one leaning in to argue a point',
  },
  {
    photo: 'student-basketball',
    caption: 'A pickup game',
    alt: 'A teenage boy dribbling a basketball past a defender on an outdoor court under a cloudy sky',
  },
  {
    photo: 'parent-kitchen',
    caption: 'Cooking with a parent',
    alt: 'A mother and her teenage son chopping vegetables side by side at a kitchen counter in the afternoon',
  },
  {
    photo: 'friends-steps',
    caption: 'On the steps outside',
    alt: 'Two students sitting on concrete steps outside a building, heads together over an open notebook',
  },
]

/* 56px is the row floor elsewhere in this codebase for anything tappable.
   These tiles are not controls, so they are sized to read rather than to be
   hit: two up at 390px, three at the sm break, the full strip at lg. */
export function Faces({ items = FACES, className, note = true }) {
  const list = items.filter(it => PHOTOS[it.photo])
  if (!list.length) return null
  return (
    <div className={cn('w-full', className)}>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {list.map((it, i) => {
          const [w, h] = dims(it.photo)
          return (
            <ScrollIn as="li" key={it.photo} delay={Math.min(i, 6) * 0.05} y={18} className="m-0">
              <figure className="m-0">
                <img src={PHOTOS[it.photo]} alt={it.alt} width={w} height={h}
                  loading="lazy" decoding="async"
                  className="block h-[132px] w-full rounded-panel object-cover
                    sm:h-[150px] lg:h-[172px]"/>
                <figcaption className="mt-2 font-display text-tick font-medium text-ink-2">
                  {it.caption}
                </figcaption>
              </figure>
            </ScrollIn>
          )
        })}
      </ul>
      {note && (
        <p className="note mt-4 max-w-measure">
          Stock photographs of models, not of anyone using MindMap.
        </p>
      )}
    </div>
  )
}

/* One photograph beside prose. `photo` is a key into PHOTOS; an unknown key
   renders nothing rather than a broken image. `caption` is optional, `alt` is
   not: a decorative photograph of a person is not a thing this site has. */
export function PhotoPanel({ photo, alt, caption, className }) {
  const src = PHOTOS[photo]
  if (!src || !alt) return null
  const [w, h] = dims(photo)
  return (
    <ScrollIn as="figure" y={22} className={cn('m-0 w-full', className)}>
      <img src={src} alt={alt} width={w} height={h} loading="lazy" decoding="async"
        className="block h-[220px] w-full rounded-panel object-cover sm:h-[280px] lg:h-[320px]"/>
      {caption && <figcaption className="note mt-3 max-w-measure">{caption}</figcaption>}
    </ScrollIn>
  )
}
