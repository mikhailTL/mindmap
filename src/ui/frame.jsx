import React from 'react'
import { PHOTOS, meta, focal as focalOf } from '../lib/photos'
import { cn } from '../lib/utils'

export function Frame({ photo, alt, className, op, focal, eager = false, wash = false, ...rest }) {
  const src = PHOTOS[photo]
  if (!src || (!alt && !wash)) return null
  const m = meta(photo)
  // Inline style so the focal point from photos.js overrides any object-[..] class passed in.
  const style = { objectPosition: focal || focalOf(photo) }
  const ref = useKeepTall(wash ? null : photo)
  return (
    <img ref={ref} src={src} alt={wash ? '' : alt} aria-hidden={wash || undefined} width={m.w} height={m.h}
      loading={eager ? 'eager' : 'lazy'} decoding="async" style={style}
      className={cn('block h-full w-full max-w-none object-cover', op, className)}
      {...rest}/>
  )
}

// Sets min-height on the parent when the box is wider than the photo's minAspect, so faces are not cropped.
// It only grows the box, which makes the condition false, so it settles in one pass.
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

const warned = new Set()
if (import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  void warned
}

export default Frame
