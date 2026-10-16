import React from 'react'
import { PHOTOS, focal } from '../lib/photos'
import { IOS, StatusBar } from './ios'
import { cn } from '../lib/utils'

/* A vertical short video feed, live inside the phone screen. Each clip is a
 * licensed photograph moving like footage. Every position change is reported
 * as { t, y }, where y is the clip index times the screen height plus the
 * current drag offset, so the engine reads speed and reversals off it.
 *
 * Props:
 *   active     false pauses every animation (swipes, footage, progress)
 *   onSample   ({ t, y }) on every position change
 *   handleRef  ref; set to { swipe(dir, ms), flick(dir), index() }
 *   reduced    no footage motion, swipes become cuts, progress holds still */

const CLIPS = [
  { key: 'student-basketball', handle: 'skate.leo', caption: 'Last shot before the bell', likes: '24.1K', comments: '318', shares: '1,204', pan: [-2, 2] },
  { key: 'student-game', handle: 'nico.plays', caption: 'Three of us, one controller left', likes: '8,940', comments: '122', shares: '406', pan: [2, -2] },
  { key: 'friends-steps', handle: 'maya.draws', caption: 'Sketching on the school steps', likes: '51.3K', comments: '902', shares: '3,117', pan: [-1.5, 1.5] },
  { key: 'student-homework', handle: 'jules.cooks', caption: 'Study break, then pasta', likes: '3,212', comments: '47', shares: '88', pan: [1.5, -1] },
  { key: 'students-hallway', handle: 'ava.runs', caption: 'Hallway at 7:58 every day', likes: '112K', comments: '2,310', shares: '9,450', pan: [-2, 1] },
  { key: 'student-controller', handle: 'theo.builds', caption: 'New level unlocked at midnight', likes: '17.6K', comments: '264', shares: '730', pan: [2, -1.5] },
  { key: 'student-bus', handle: 'sam.and.eli', caption: 'Bus ride playlist, part two', likes: '6,055', comments: '91', shares: '213', pan: [-1, 2] },
  { key: 'student-hero', handle: 'rosa.films', caption: 'Testing the new lens outside', likes: '29.8K', comments: '540', shares: '1,876', pan: [1, -2] },
]
const N = CLIPS.length
const mod = (k, n) => ((k % n) + n) % n

/* cubic-bezier(x1, y1, x2, y2) as a function of progress, solved by Newton
   steps with a bisection fallback. */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = t => ((ax * t + bx) * t + cx) * t
  const sy = t => ((ay * t + by) * t + cy) * t
  const dx = t => (3 * ax * t + 2 * bx) * t + cx
  return x => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 6; i++) {
      const e = sx(t) - x, d = dx(t)
      if (Math.abs(e) < 1e-5) return sy(t)
      if (Math.abs(d) < 1e-6) break
      t -= e / d
    }
    let lo = 0, hi = 1
    t = x
    for (let i = 0; i < 20; i++) {
      const v = sx(t)
      if (Math.abs(v - x) < 1e-5) break
      if (v < x) lo = t; else hi = t
      t = (lo + hi) / 2
    }
    return sy(t)
  }
}
const IOS_CURVE = bezier(0.32, 0.72, 0, 1)
const OUT_CUBIC = p => 1 - Math.pow(1 - p, 3)

/* How far a release at v px/ms would coast, with the iOS scroll view's
   normal deceleration rate. */
const project = v => (v * 1000) * 0.998 / (1 - 0.998) / 1000

const KEYFRAMES = `
@keyframes mm-reels-kb {
  from { transform: scale(1.06) translate3d(var(--kb-x0), var(--kb-y0), 0); }
  to   { transform: scale(1.16) translate3d(var(--kb-x1), var(--kb-y1), 0); }
}
@keyframes mm-reels-flicker {
  0%, 100% { filter: brightness(1) contrast(1); }
  17% { filter: brightness(1.035) contrast(1.01); }
  31% { filter: brightness(0.985) contrast(1); }
  48% { filter: brightness(1.02) contrast(1.015); }
  66% { filter: brightness(0.975) contrast(0.995); }
  83% { filter: brightness(1.03) contrast(1.01); }
}
@keyframes mm-reels-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes mm-reels-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes mm-reels-heart {
  0% { transform: translate(-50%, -50%) scale(0.2) rotate(var(--rot)); opacity: 0; }
  18% { transform: translate(-50%, -50%) scale(1.15) rotate(var(--rot)); opacity: 1; }
  32% { transform: translate(-50%, -50%) scale(0.95) rotate(var(--rot)); opacity: 1; }
  70% { transform: translate(-50%, -60%) scale(1) rotate(var(--rot)); opacity: 1; }
  100% { transform: translate(-50%, -120%) scale(0.8) rotate(var(--rot)); opacity: 0; }
}
@keyframes mm-reels-fade { 0%, 70% { opacity: 1; } 100% { opacity: 0; } }
`

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }
const HEART = 'M12 20.3s-7.6-4.6-9.3-9.2C1.4 7.6 3.6 4.2 7 4.2c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.9-1.7 4.6-9.3 9.2-9.3 9.2Z'

function Icon({ name, filled }) {
  if (name === 'heart') return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path d={HEART} {...stroke} fill={filled ? IOS.red : 'none'} stroke={filled ? IOS.red : 'currentColor'}/>
    </svg>)
  if (name === 'comment') return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M20.6 15.8A9 9 0 1 0 17 19.6L21 21l-.4-5.2Z"/>
    </svg>)
  if (name === 'share') return (
    <svg width="27" height="27" viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M21.5 3 9.8 13.3M21.5 3l-7 18-4.7-7.7L2.5 9.6 21.5 3Z"/>
    </svg>)
  if (name === 'more') return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>
    </svg>)
  if (name === 'camera') return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7l1.4-2h6.8l1.4 2h1.7A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-9Z"/>
      <circle cx="12" cy="12.8" r="3.8"/>
    </svg>)
  if (name === 'note') return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M9 17.5V5.2l11-2.2v12.3a3 3 0 1 1-2-2.8V7.3l-7 1.4v8.8a3 3 0 1 1-2-2.8Z"/>
    </svg>)
  return null
}

/* One clip: the photograph moving like footage, the overlay over it. */
function Clip({ clip, k, y, running, reduced, liked, onLike, following, onFollow, current, progressKey }) {
  const play = running ? 'running' : 'paused'
  const motion = !reduced
  return (
    <div className="absolute inset-x-0 top-0 h-full overflow-hidden bg-black will-change-transform"
      style={{ transform: `translate3d(0, ${y}px, 0)` }} aria-hidden={!current}>
      <div className="absolute inset-0"
        style={motion ? { animation: `mm-reels-flicker 2.7s ease-in-out ${(k % 5) * -0.4}s infinite`, animationPlayState: play } : undefined}>
        <img src={PHOTOS[clip.key]} alt="" aria-hidden draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          style={{
            objectPosition: focal(clip.key),
            '--kb-x0': `${clip.pan[0] * 0.7}%`, '--kb-y0': `${clip.pan[1] * 0.3}%`,
            '--kb-x1': `${-clip.pan[0] * 0.7}%`, '--kb-y1': `${-clip.pan[1] * 0.3}%`,
            transformOrigin: focal(clip.key),
            ...(motion
              ? { animation: `mm-reels-kb 11s cubic-bezier(0.45, 0, 0.55, 1) ${(k % 3) * -2.5}s infinite alternate`, animationPlayState: play }
              : { transform: 'scale(1.06)' }),
          }}/>
      </div>

      {/* legibility only: dark under the text at the bottom, nowhere else */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%]"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.62), rgba(0,0,0,0.28) 45%, rgba(0,0,0,0))' }}/>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[120px]"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.32), rgba(0,0,0,0))' }}/>

      {/* right rail */}
      <div className="absolute bottom-[86px] right-2.5 flex w-[48px] flex-col items-center gap-[18px] text-white"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}>
        <button type="button" onClick={onLike} aria-pressed={liked} tabIndex={current ? 0 : -1}
          aria-label="Like" className="flex flex-col items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white">
          <Icon name="heart" filled={liked}/>
          <span className="text-[12px] font-semibold leading-none">{clip.likes}</span>
        </button>
        <span className="flex flex-col items-center gap-1">
          <Icon name="comment"/>
          <span className="text-[12px] font-semibold leading-none">{clip.comments}</span>
        </span>
        <span className="flex flex-col items-center gap-1">
          <Icon name="share"/>
          <span className="text-[12px] font-semibold leading-none">{clip.shares}</span>
        </span>
        <Icon name="more"/>
        <span aria-hidden className="mt-1 block h-[30px] w-[30px] overflow-hidden rounded-[8px] border-2 border-white">
          <img src={PHOTOS[clip.key]} alt="" draggable={false} className="h-full w-full object-cover"
            style={{ objectPosition: focal(clip.key) }}/>
        </span>
      </div>

      {/* bottom left: who, caption, audio */}
      <div className="absolute bottom-[22px] left-3.5 right-[76px] text-white"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="block h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full border border-white/70">
            <img src={PHOTOS[clip.key]} alt="" draggable={false} className="h-full w-full object-cover scale-[2.2]"
              style={{ objectPosition: focal(clip.key), transformOrigin: focal(clip.key) }}/>
          </span>
          <span className="truncate text-[14px] font-semibold">@{clip.handle}</span>
          <button type="button" onClick={onFollow} aria-pressed={following} tabIndex={current ? 0 : -1}
            className="shrink-0 rounded-[8px] border border-white/80 px-2.5 py-[3px] text-[13px] font-semibold leading-[18px] outline-none focus-visible:ring-2 focus-visible:ring-white">
            {following ? 'Following' : 'Follow'}
          </button>
        </div>
        <p className="m-0 mt-2.5 truncate text-[14px] leading-[18px]">{clip.caption}</p>
        <div className="mt-2 flex items-center gap-1.5 text-[13px] leading-[16px]">
          <Icon name="note"/>
          <span className="relative block w-[150px] overflow-hidden whitespace-nowrap">
            <span className="inline-block"
              style={motion ? { animation: 'mm-reels-marquee 7s linear infinite', animationPlayState: play } : undefined}>
              Original audio&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Original audio&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </span>
        </div>
      </div>

      {/* progress: fills over six seconds, then starts again like a loop */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-white/25">
        {current && (
          <div key={progressKey} className="h-full origin-left bg-white"
            style={motion
              ? { animation: 'mm-reels-fill 6s linear infinite', animationPlayState: play }
              : { transform: 'scaleX(0.35)' }}/>
        )}
      </div>
    </div>
  )
}

export default function ReelsScene({ active = true, onSample, handleRef, reduced = false }) {
  const rootRef = React.useRef(null)
  const [H, setH] = React.useState(700)
  const [pos, setPosState] = React.useState(0)
  const [likes, setLikes] = React.useState(() => new Set())
  const [follows, setFollows] = React.useState(() => new Set())
  const [hearts, setHearts] = React.useState([])

  /* Everything the gesture and animation code reads lives in one ref, so the
     handlers never close over a stale value. */
  const s = React.useRef({
    pos: 0, H: 700, anim: null, raf: 0, last: 0, drag: null, wheel: null,
    wheelLock: 0, taps: [], active, reduced, onSample,
  }).current
  s.active = active; s.reduced = reduced; s.onSample = onSample

  const setPos = React.useCallback(y => {
    s.pos = y
    setPosState(y)
    s.onSample?.({ t: performance.now(), y })
  }, [s])

  /* measure the screen */
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => {
      const h = el.clientHeight || 700
      if (h === s.H) return
      const idx = Math.round(s.pos / s.H)
      s.H = h; setH(h)
      if (!s.anim && !s.drag) { s.pos = idx * h; setPosState(s.pos) }
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [s])

  /* the animation loop: elapsed time only advances while active, so a pause
     holds the clip mid-swipe and resumes from the same place */
  const frame = React.useCallback(now => {
    s.raf = 0
    const a = s.anim
    if (!a || !s.active) return
    const dt = s.last ? Math.min(now - s.last, 64) : 16
    s.last = now
    a.elapsed += dt
    const p = Math.min(1, a.elapsed / a.dur)
    setPos(a.from + (a.to - a.from) * a.ease(p))
    if (p >= 1) { s.anim = null; s.last = 0; a.done?.(); return }
    s.raf = requestAnimationFrame(frame)
  }, [s, setPos])

  const kick = React.useCallback(() => {
    if (s.raf || !s.anim || !s.active) return
    s.last = 0
    s.raf = requestAnimationFrame(frame)
  }, [s, frame])

  const stop = React.useCallback(() => {
    if (s.raf) cancelAnimationFrame(s.raf)
    s.raf = 0; s.anim = null; s.last = 0
  }, [s])

  const animateTo = React.useCallback((to, dur, ease, done) => {
    stop()
    if (s.reduced || dur <= 0 || Math.abs(to - s.pos) < 0.5) { setPos(to); done?.(); return }
    s.anim = { from: s.pos, to, dur, ease, elapsed: 0, done }
    kick()
  }, [s, stop, kick, setPos])

  React.useEffect(() => {
    if (active) kick()
    else if (s.raf) { cancelAnimationFrame(s.raf); s.raf = 0; s.last = 0 }
  }, [active, kick, s])

  React.useEffect(() => () => { if (s.raf) cancelAnimationFrame(s.raf) }, [s])

  const index = () => Math.round((s.anim ? s.anim.to : s.pos) / s.H)

  const swipe = React.useCallback((dir = 1, ms = 320) => {
    const from = Math.round((s.anim ? s.anim.to : s.pos) / s.H)
    const to = (from + (dir < 0 ? -1 : 1)) * s.H
    animateTo(to, ms, IOS_CURVE)
  }, [s, animateTo])

  /* Snap after a release, from where the content would coast to, one clip at
     most, with a duration that starts at the finger's own speed. */
  const settle = React.useCallback((startIdx, v) => {
    const H = s.H
    const projected = s.pos + project(v)
    let idx = Math.round(projected / H)
    idx = Math.max(startIdx - 1, Math.min(startIdx + 1, idx))
    const to = idx * H
    const dist = Math.abs(to - s.pos)
    const speed = Math.abs(v)
    const dur = speed > 0.05 ? Math.max(180, Math.min(460, (3 * dist) / speed)) : Math.max(220, Math.min(420, dist * 0.9))
    animateTo(to, dur, speed > 0.05 ? OUT_CUBIC : IOS_CURVE)
  }, [s, animateTo])

  React.useEffect(() => {
    if (!handleRef) return
    handleRef.current = {
      swipe,
      flick: (dir = 1) => swipe(dir, 160),
      index: () => index(),
    }
  })

  /* pointer: 1:1 drag, momentum on release, double tap for a heart */
  const onPointerDown = e => {
    if (e.button !== undefined && e.button !== 0) return
    if (e.target.closest?.('button')) return
    const startIdx = Math.round((s.anim ? s.anim.to : s.pos) / s.H)
    stop()
    s.drag = { id: e.pointerId, y0: e.clientY, x0: e.clientX, p0: s.pos, startIdx, moved: false, pts: [{ t: e.timeStamp, y: e.clientY }] }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }
  const onPointerMove = e => {
    const d = s.drag
    if (!d || d.id !== e.pointerId) return
    const dy = e.clientY - d.y0
    if (!d.moved && Math.abs(dy) < 6) return
    d.moved = true
    d.pts.push({ t: e.timeStamp, y: e.clientY })
    if (d.pts.length > 12) d.pts.shift()
    setPos(d.p0 - dy)
  }
  const onPointerUp = e => {
    const d = s.drag
    if (!d || d.id !== e.pointerId) return
    s.drag = null
    if (!d.moved) {
      if (e.type === 'pointerup') tap(e)
      settle(d.startIdx, 0)
      return
    }
    const now = e.timeStamp
    const recent = d.pts.filter(p => now - p.t < 90)
    let v = 0
    if (recent.length >= 2) {
      const a = recent[0], b = recent[recent.length - 1]
      if (b.t > a.t) v = -(b.y - a.y) / (b.t - a.t)
    }
    settle(d.startIdx, v)
  }

  const tap = e => {
    const now = performance.now()
    const prev = s.taps
    s.taps = [now]
    if (prev.length && now - prev[0] < 320) {
      s.taps = []
      const r = rootRef.current.getBoundingClientRect()
      const id = now
      const rot = Math.round(Math.random() * 30 - 15)
      setHearts(h => [...h, { id, x: e.clientX - r.left, y: e.clientY - r.top, rot }])
      setTimeout(() => setHearts(h => h.filter(x => x.id !== id)), 900)
      const k = Math.round(s.pos / s.H)
      setLikes(l => { const n = new Set(l); n.add(k); return n })
    }
  }

  /* wheel and trackpad: 1:1, then a snap once the wheel goes quiet. A tail of
     inertial events after the snap is swallowed, so one flick is one clip. */
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onWheel = e => {
      e.preventDefault()
      const now = performance.now()
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * s.H : e.deltaY
      if (s.anim || now < s.wheelLock) { s.wheelLock = now + 160; return }
      if (s.drag) return
      if (!s.wheel) s.wheel = { startIdx: Math.round(s.pos / s.H), pts: [], timer: 0 }
      const w = s.wheel
      w.pts.push({ t: now, y: dy })
      if (w.pts.length > 10) w.pts.shift()
      const base = w.startIdx * s.H
      setPos(Math.max(base - s.H, Math.min(base + s.H, s.pos + dy)))
      clearTimeout(w.timer)
      w.timer = setTimeout(() => {
        s.wheel = null
        const off = s.pos - w.startIdx * s.H
        const to = Math.abs(off) > s.H * 0.12 ? (w.startIdx + Math.sign(off)) * s.H : w.startIdx * s.H
        s.wheelLock = performance.now() + 220
        animateTo(to, 300, IOS_CURVE)
      }, 110)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => { el.removeEventListener('wheel', onWheel); if (s.wheel) clearTimeout(s.wheel.timer) }
  }, [s, setPos, animateTo])

  const onKeyDown = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); swipe(1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); swipe(-1) }
  }

  const cur = Math.round(pos / H)
  const ks = [cur - 1, cur, cur + 1]
  const running = active && !reduced

  return (
    <div ref={rootRef} tabIndex={0} role="region" aria-roledescription="video feed"
      aria-label="A short video feed"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onKeyDown={onKeyDown}
      className="relative h-full w-full select-none overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
      style={{ touchAction: 'none', overscrollBehavior: 'contain', fontFamily: IOS.font, WebkitUserSelect: 'none' }}>
      <style>{KEYFRAMES}</style>

      {ks.map(k => {
        const clip = CLIPS[mod(k, N)]
        return (
          <Clip key={k} clip={clip} k={mod(k, N)} y={k * H - pos} running={running} reduced={reduced}
            current={k === cur} progressKey={k}
            liked={likes.has(k)} onLike={() => setLikes(l => { const n = new Set(l); n.has(k) ? n.delete(k) : n.add(k); return n })}
            following={follows.has(clip.handle)}
            onFollow={() => setFollows(f => { const n = new Set(f); n.has(clip.handle) ? n.delete(clip.handle) : n.add(clip.handle); return n })}/>
        )
      })}

      {/* top: status bar, then the title row, over the footage */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
        <StatusBar dark/>
        <div className="flex items-center justify-between px-4 pt-1 text-white"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
          <span className="text-[17px] font-semibold tracking-[-0.01em]">Following</span>
          <Icon name="camera"/>
        </div>
      </div>

      {hearts.map(h => (
        <svg key={h.id} aria-hidden width="96" height="96" viewBox="0 0 24 24"
          className="pointer-events-none absolute z-20"
          style={{ left: h.x, top: h.y, '--rot': `${h.rot}deg`,
            animation: reduced ? 'mm-reels-fade 0.9s ease-out forwards' : 'mm-reels-heart 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            transform: reduced ? 'translate(-50%, -50%)' : undefined,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
          <path d={HEART} fill={IOS.red}/>
        </svg>
      ))}

      <p className="sr-only" aria-live="polite">Clip {mod(cur, N) + 1} of {N}</p>
    </div>
  )
}
