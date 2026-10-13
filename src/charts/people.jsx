import React from 'react'
import { ScrollIn } from '../ui/motion'
import { PHOTOS, minAspect } from '../lib/photos'
import { Frame } from '../ui/frame'
import { cn } from '../lib/utils'

/* Photographs of people, for pages that are otherwise all drawing and type.
 *
 * Every frame here is a licensed stock photograph of models. Nobody in one is
 * a MindMap user, nobody is wearing the patch, and no caption may claim a
 * story about the person in it: the captions name the ordinary moment in the
 * picture and stop. `Faces` prints that out loud under the grid, so the page
 * never has to be read as a wall of testimonials it has not earned.
 *
 * Framing is not decided here. ui/frame.jsx reads the focal point and the
 * intrinsic size out of lib/photos.js, so this file owns box shapes and
 * nothing else. It used to carry its own copy of the dimension table and let
 * every tile crop at the browser default, which is how a strip of six frames
 * ended up cutting four teenagers off at the chin.
 *
 * Entrances are ScrollIn and nothing else. Hover is behind motion-safe:, so a
 * reader with prefers-reduced-motion gets the resting frame with no movement
 * at all. */

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

/* The box a tile gets, as a ratio rather than a height, so the frame grows
   with the column instead of staying 132px tall at every width. Two things
   fix the number: spec 0d rule 4 puts a 170px floor under any frame holding a
   face, which these all do, and no tile may be wider per unit of height than
   the shortest frame its own photograph survives. A square clears both at
   every breakpoint this grid uses, and `minHeight` holds the floor at 390px,
   where two columns leave a tile narrower than 176. */
const tileBox = photo => ({
  aspectRatio: String(Math.min(1, minAspect(photo))),
  minHeight: '176px',
})

export function Faces({ items = FACES, className, note = true }) {
  const list = items.filter(it => PHOTOS[it.photo])
  if (!list.length) return null
  return (
    <div className={cn('w-full', className)}>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {list.map((it, i) => (
          <ScrollIn as="li" key={it.photo} delay={Math.min(i, 6) * 0.05} y={18} className="m-0">
            <figure className="m-0">
              <div className="w-full overflow-hidden rounded-panel" style={tileBox(it.photo)}>
                <Frame photo={it.photo} alt={it.alt}/>
              </div>
              <figcaption className="mt-2 font-display text-tick font-medium text-ink-2">
                {it.caption}
              </figcaption>
            </figure>
          </ScrollIn>
        ))}
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
   not: a decorative photograph of a person is not a thing this site has.

   1.6 is the shape this panel wants. A photograph whose subject cannot take a
   1.6 box gets its own shorter ratio instead, so the panel grows taller rather
   than slicing the person in it. */
const panelBox = photo => ({
  aspectRatio: String(Math.min(1.6, minAspect(photo))),
  minHeight: '220px',
})

export function PhotoPanel({ photo, alt, caption, className }) {
  if (!PHOTOS[photo] || !alt) return null
  return (
    <ScrollIn as="figure" y={22} className={cn('m-0 w-full', className)}>
      <div className="w-full overflow-hidden rounded-panel" style={panelBox(photo)}>
        <Frame photo={photo} alt={alt}/>
      </div>
      {caption && <figcaption className="note mt-3 max-w-measure">{caption}</figcaption>}
    </ScrollIn>
  )
}
