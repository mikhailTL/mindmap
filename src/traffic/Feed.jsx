import React from 'react'
import { CLIPS, SLIDE_H, scroller, OUT_CUBIC, IOS_CURVE } from './core'
import { StatusBar, IOS } from './ios'
import { cn } from '../lib/utils'

/* A full-bleed short video feed. Each slide is one real clip, served from
 * /headsup/clips/clip-<id>.mp4, muted, looping, inline. The feed is a real
 * scroller: the script moves scrollTop frame by frame and every scroll event
 * the element fires is one sample for the engine, the same path a finger
 * would take. At most three videos decode at once.
 *
 * Handle: { go(idx, ms, kind), fresh(), freeze(on) }. `paused` holds the
 * feed still while the other phone has its turn. Under Reduce Motion no clip
 * plays; each slide shows its first frame. Invented handles only, no real
 * app's name or logo. Follow is an 8 px-corner rectangle. */

const SRC = id => `${(import.meta.env && import.meta.env.BASE_URL) || '/'}headsup/clips/clip-${id}.mp4`

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }
const Heart = () => <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden {...STROKE}><path d="M12 20.3s-7.6-4.6-9.3-9.2C1.4 7.6 3.6 4.2 7 4.2c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.9-1.7 4.6-9.3 9.2-9.3 9.2Z"/></svg>
const Comment = () => <svg width="29" height="29" viewBox="0 0 24 24" aria-hidden {...STROKE}><path d="M20.6 15.8A9 9 0 1 0 17 19.6L21 21l-.4-5.2Z"/></svg>
const Share = () => <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden {...STROKE}><path d="M21.5 3 9.8 13.3M21.5 3l-7 18-4.7-7.7L2.5 9.6 21.5 3Z"/></svg>
const More = () => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>
const Camera = () => <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden {...STROKE}><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7l1.4-2h6.8l1.4 2h1.7A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-9Z"/><circle cx="12" cy="12.8" r="3.8"/></svg>
const Note = () => <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden fill="currentColor"><path d="M9 17.5V5.2l11-2.2v12.3a3 3 0 1 1-2-2.8V7.3l-7 1.4v8.8a3 3 0 1 1-2-2.8Z"/></svg>

/* The avatar's fill, darkened just enough that its white initial clears
   4.5 : 1. */
const lum = h => {
  const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
export function avatarFill(hex) {
  let f = 1, out = hex
  const at = k => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('')
  while (1.05 / (lum(out) + 0.05) < 4.6 && f > 0.3) { f -= 0.02; out = at(f) }
  return out
}

function Clip({ clip, near, current, frozen }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    const v = ref.current
    if (!v) return
    if (current && !frozen) { const p = v.play?.(); if (p && p.catch) p.catch(() => {}) }
    else v.pause?.()
  }, [current, frozen, near])
  return (
    <div className="relative overflow-hidden bg-black" style={{ height: SLIDE_H }} data-clip={clip.id}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${clip.c}, #000 85%)` }}/>
      {near && (
        <video ref={ref} src={SRC(clip.id)} muted playsInline loop autoPlay={current && !frozen}preload="auto" aria-hidden
          className="absolute inset-0 h-full w-full object-cover"/>
      )}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%]"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.62), rgba(0,0,0,0.28) 45%, rgba(0,0,0,0))' }}/>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[130px]"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.36), rgba(0,0,0,0))' }}/>
      <div className="absolute bottom-[96px] right-2.5 flex w-[50px] flex-col items-center gap-[18px] text-white"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}>
        {[[Heart, clip.likes], [Comment, clip.comments], [Share, clip.shares]].map(([I, n], i) => (
          <span key={i} className="flex flex-col items-center gap-1"><I/><span className="text-[12px] font-semibold leading-none">{n}</span></span>
        ))}
        <More/>
      </div>
      <div className="absolute bottom-[34px] left-3.5 right-[78px] text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="grid size-[34px] shrink-0 place-items-center rounded-full border border-white/70 text-[15px] font-semibold"
            style={{ background: avatarFill(clip.c) }}>{clip.handle.charAt(1).toUpperCase()}</span>
          <span className="truncate text-[15px] font-semibold">{clip.handle}</span>
          <span className="shrink-0 rounded-[8px] border border-white/80 px-2.5 py-[3px] text-[13px] font-semibold leading-[18px]">Follow</span>
        </div>
        <p className="m-0 mt-2.5 text-[15px] leading-[19px]">{clip.caption}</p>
        <div className="mt-2 flex items-center gap-1.5 text-[13px] leading-4"><Note/><span>Original audio</span></div>
      </div>
    </div>
  )
}

export default function Feed({ handleRef, onScroll, reduced, paused = false }) {
  const feedRef = React.useRef(null)
  const [cur, setCur] = React.useState(0)
  const [frozen, setFrozen] = React.useState(false)
  const [cut, setCut] = React.useState(false)
  const props = React.useRef({}); props.current = { onScroll, reduced }
  const anim = React.useMemo(() => scroller(
    () => feedRef.current?.scrollTop ?? 0,
    y => { const el = feedRef.current; if (el) el.scrollTop = Math.max(0, Math.min((CLIPS.length - 1) * SLIDE_H, y)) },
  ), [])

  React.useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const on = () => {
      props.current.onScroll?.(el.scrollTop)
      setCur(Math.max(0, Math.min(CLIPS.length - 1, Math.round(el.scrollTop / SLIDE_H))))
    }
    el.addEventListener('scroll', on, { passive: true })
    return () => { el.removeEventListener('scroll', on); anim.stop() }
  }, [anim])

  React.useEffect(() => {
    if (!handleRef) return
    let fade = 0
    handleRef.current = {
      go(idx, ms, kind) {
        const y = idx * SLIDE_H
        /* Reduce Motion: a cut with a short fade, still one scroll event per move */
        if (props.current.reduced) {
          clearTimeout(fade); setCut(true)
          fade = setTimeout(() => { anim.to(y, 0); setCut(false) }, 140)
          return
        }
        anim.to(y, ms, kind === 'flick' ? OUT_CUBIC : IOS_CURVE)
      },
      fresh() { anim.stop(); const el = feedRef.current; if (el) el.scrollTop = 0; setCur(0) },
      /* a freeze stops a swipe where it is, like a held frame */
      freeze(on) { if (on) anim.stop(); setFrozen(!!on) },
    }
    return () => { clearTimeout(fade); handleRef.current = null }
  }, [handleRef, anim])

  return (
    <div className="absolute inset-0 bg-black" style={{ fontFamily: IOS.font }}>
      <div ref={feedRef} aria-hidden className={cn('absolute inset-0 overflow-hidden transition-opacity duration-150', cut && 'opacity-40')}>
        {CLIPS.map((c, i) => <Clip key={c.id} clip={c} near={Math.abs(i - cur) <= 1} current={i === cur} frozen={frozen || paused || reduced}/>)}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
        <StatusBar dark/>
        <div className="flex items-center justify-between px-4 pt-1 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
          <span className="text-[17px] font-semibold tracking-[-0.01em]">For You</span>
          <Camera/>
        </div>
      </div>
      <p className="sr-only" aria-live="off">{CLIPS[cur].caption}</p>
    </div>
  )
}
