import React from 'react'
import { PHOTOS, meta, focal as focalOf } from '../lib/photos'
import { cn } from '../lib/utils'

/* The one photograph frame on the site, per spec 0d rule 4:
 *
 *   "many of the stock images are cutoff and hinder the design significantly,
 *    so make sure each frame is adjusted and optmized for the contained images"
 *
 * Four copies of this component used to live in the view files, each with its
 * own copy of the dimension table and each leaving object-position to the
 * browser default or to a 50% 32% that had been pasted from the frame next to
 * it. The subject of a photograph does not move to suit the box it is put in,
 * so the position comes from src/lib/photos.js and no call site has to know
 * it. A call site that still passes an `object-[x%_y%]` class is simply
 * overruled, which is the point: the recorded focal point is the one answer.
 *
 * Props are the ones the view files already pass, unchanged:
 *   photo    key into PHOTOS
 *   alt      required; a photograph of a person is never decorative here
 *   className extra classes on the img, for rounding, transitions, position
 *   eager    skip lazy loading, for a frame above the fold
 * and two additions:
 *   op       an extra class slot audience.jsx passes; still honoured for
 *            everything except object-position, which photos.js now owns
 *   focal    an explicit override, e.g. '70% 10%', for the rare frame that
 *            wants a different part of a file it shares with another frame
 *
 * Every photograph is a licensed stock frame of models. Nobody in one uses
 * MindMap, nobody is wearing the patch, and no alt text passed here may say or
 * imply otherwise.
 *
 * max-w-none is load-bearing: Tailwind's preflight sets img { max-width: 100% }
 * and that undoes a frame set to fill a box wider than its own file. */
export function Frame({ photo, alt, className, op, focal, eager = false, ...rest }) {
  const src = PHOTOS[photo]
  if (!src || !alt) return null
  const m = meta(photo)
  /* Inline, not a class: it has to beat any object-[..] still sitting in a
     className, and the value is data rather than one of a fixed set. */
  const style = { objectPosition: focal || focalOf(photo) }
  return (
    <img src={src} alt={alt} width={m.w} height={m.h}
      loading={eager ? 'eager' : 'lazy'} decoding="async" style={style}
      onLoad={warnIfShort(photo)}
      className={cn('block h-full w-full max-w-none object-cover', op, className)}
      {...rest}/>
  )
}

/* Spec 0d rule 4 ends "A frame shorter than 170px is not allowed to hold a
   face." A component cannot set the height of the box it was put inside, so
   in development it says so instead, once per key, with the height it got.
   Silent in the build. */
const warned = new Set()
const warnIfShort = photo => {
  if (!import.meta.env?.DEV) return undefined
  return e => {
    const h = e.currentTarget.clientHeight
    const w = e.currentTarget.clientWidth
    const m = meta(photo)
    if (!h || !w || warned.has(photo)) return
    if (m.face && h < 170) {
      warned.add(photo)
      console.warn(`[Frame] "${photo}" holds a face in a ${Math.round(w)}x${Math.round(h)} box. `
        + 'Spec 0d rule 4: a frame shorter than 170px may not hold a face.')
    } else if (w / h > m.minAspect + 0.05) {
      warned.add(photo)
      console.warn(`[Frame] "${photo}" is in a ${Math.round(w)}x${Math.round(h)} box, `
        + `aspect ${(w / h).toFixed(2)}, past the ${m.minAspect} its subject survives. `
        + `Give it at least ${Math.ceil(w / m.minAspect)}px of height.`)
    }
  }
}

export default Frame
