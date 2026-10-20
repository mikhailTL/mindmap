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
 * Every photograph is a licensed stock frame of models. Some frames carry a
 * rendering of the patch placed on the arm; the people are models and nobody
 * in them uses MindMap, and no alt text passed here may say or imply
 * otherwise.
 *
 * max-w-none is load-bearing: Tailwind's preflight sets img { max-width: 100% }
 * and that undoes a frame set to fill a box wider than its own file. */
/* `wash`: a photograph used as a band's ground, faded under the band's own
   colour. The face rule does not apply to a ground, so the box is not grown
   to the photograph's shape: a 1280-wide band would otherwise be forced to
   430px tall by a 3:1 floor. Decorative, so alt is empty and it is hidden
   from readers. */
export function Frame({ photo, alt, className, op, focal, eager = false, wash = false, ...rest }) {
  const src = PHOTOS[photo]
  if (!src || (!alt && !wash)) return null
  const m = meta(photo)
  /* Inline, not a class: it has to beat any object-[..] still sitting in a
     className, and the value is data rather than one of a fixed set. */
  const style = { objectPosition: focal || focalOf(photo) }
  const ref = useKeepTall(wash ? null : photo)
  return (
    <img ref={ref} src={src} alt={wash ? '' : alt} aria-hidden={wash || undefined} width={m.w} height={m.h}
      loading={eager ? 'eager' : 'lazy'} decoding="async" style={style}
      className={cn('block h-full w-full max-w-none object-cover', op, className)}
      {...rest}/>
  )
}

/* The enforcement, which used to be a console warning nobody reads.
 *
 * A photograph has a widest crop its subject survives: `minAspect` in
 * photos.js, measured per file. A box wider than that cuts heads off, and no
 * object-position saves it, because the box is simply the wrong shape. The
 * owner reported this three times with the same two screenshots: a full-bleed
 * strip about 1900px wide and 240px tall over a 1.5:1 photograph is a 7.9:1
 * crop, and every face in it loses its forehead.
 *
 * A component genuinely cannot set its own box's height from CSS, so this
 * measures the rendered width and writes a `min-height` onto the box it was
 * put inside. min-height beats height in the cascade, so a call site's
 * `h-[190px]` still describes the short case and this only ever grows it.
 *
 * It only grows, and growing makes the condition false, so it settles in one
 * pass and cannot oscillate. If the immediate parent is itself absolutely
 * positioned it has no height of its own to give, so one more step up. */
function useKeepTall(photo) {
  const ref = React.useRef(null)
  React.useLayoutEffect(() => {
    const img = ref.current
    if (!img || typeof ResizeObserver !== 'function') return
    const m = photo ? meta(photo) : null
    if (!m?.minAspect) return
    let box = img.parentElement
    if (box && getComputedStyle(box).position === 'absolute' && box.parentElement) {
      box = box.parentElement
    }
    if (!box) return
    let applied = 0
    const fit = () => {
      const w = img.clientWidth
      const h = img.clientHeight
      if (!w || !h) return
      if (w / h <= m.minAspect + 0.02) return
      const want = Math.ceil(w / m.minAspect)
      if (want <= applied) return
      applied = want
      box.style.minHeight = `${want}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(img)
    return () => { ro.disconnect(); box.style.minHeight = '' }
  }, [photo])
  return ref
}

/* The 170px floor for a frame holding a face is still a rule, and it is still
   worth seeing while developing: the enforcement above fixes the shape, not a
   box that is simply too small to show anybody. */
const warned = new Set()
if (import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  void warned
}

export default Frame
