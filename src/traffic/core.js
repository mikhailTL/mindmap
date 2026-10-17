/* Heads Up, the moving parts behind the three phones. No React here, so the
 * whole loop runs under fake timers in a test exactly as it runs on the page.
 *
 * One session per teen phone: real key and scroll events in, the engine in
 * signals/light.js turns the last minute into features, an index, a light and
 * the signals that are showing. The session clock runs four times faster than
 * the wall so red, which needs a sustained minute, arrives in fifteen seconds
 * of watching. Key and scroll timestamps stay on the wall, so a speed or a
 * gap is the real one.
 *
 * The scripts are generators. A script yields a wait in ms, or a test that is
 * polled until true. They drive a `view`, which is either the drawn phone or
 * the headless stand-in below, through the same methods. */

import {
  Light, sessionFeatures, strainIndex, decideLight, nudgeFor, signalsFrom, SIGNAL, parentSummary,
} from '../signals/light.js'

export const RATE = 4
export const TICK_MS = 2000
export const WINDOW_MS = 60 * 1000
export const RING = 400
export const SAMPLE_MS = 100
export const SWIPE_GAP_MS = 400
export const MIN_SWIPES = 2
export const SLIDE_H = 852
export const PAUSE_MS = 2000
export const BANNER_HOLD_MS = 4000
export const LOOP_MS = 104 * 1000
export const STAGGER_MS = 52 * 1000
export const WALK_SECS = 120
export const WALK_STEPS = 212
export const REACTION_MS = [243, 229, 251]

/* feature key for each label, so a label can be traced to where it comes from */
export const KEY_OF = Object.freeze(Object.fromEntries(Object.entries(SIGNAL).map(([k, v]) => [v, k])))
export const TYPING_KEYS = new Set(['medianGap', 'deletions'])
export const RANK = { [Light.GREEN]: 0, [Light.YELLOW]: 1, [Light.RED]: 2 }
export const known = l => (l === Light.RED || l === Light.YELLOW ? l : Light.GREEN)

export function swipesIn(samples) {
  let n = samples.length ? 1 : 0
  for (let i = 1; i < samples.length; i++) if (samples[i].t - samples[i - 1].t > SWIPE_GAP_MS) n++
  return n
}

export function ring(size) {
  const buf = new Array(size)
  let head = 0, n = 0
  return {
    push(v) { buf[head] = v; head = (head + 1) % size; if (n < size) n++ },
    since(t) {
      const out = [], start = (head - n + size) % size
      for (let i = 0; i < n; i++) { const v = buf[(start + i) % size]; if (v.t >= t) out.push(v) }
      return out
    },
    clear() { head = 0; n = 0 },
  }
}

/* The page's clock: 4x, starting at 9:38 pm on the viewer's own day. */
export function makeClock(rate = RATE) {
  const t0 = Date.now()
  const d = new Date(t0); d.setHours(21, 38, 0, 0)
  const anchor = d.getTime()
  return { now: () => anchor + (Date.now() - t0) * rate, rate }
}

/* One clock formatter for Heads Up: the engine's own, read through
   parentSummary ("Red at 9:41 pm"), so the parent's time and the thread's
   time can never disagree. Messages writes the meridiem in capitals. */
export function clockText(ms) {
  const t = parentSummary({ light: Light.RED, at: ms, signals: [] }).time || ''
  return t.replace(/^Red at /, '').replace(/ (am|pm)$/, (_, ap) => ` ${ap.toUpperCase()}`)
}

/* One Heads Up session on one phone. */
export function createSession({ baseline, clock, onState, onNudge }) {
  const wall = () => Date.now()
  const scrollRing = ring(RING), keyRing = ring(RING)
  let startAt = null
  let st = { light: Light.GREEN, since: clock.now() }
  let lastNudge = null
  let live = null
  let sample = { last: -1e9, pending: null, timer: 0 }
  const start = () => { if (startAt == null) startAt = clock.now() }

  const recordKey = del => { keyRing.push({ t: wall(), del: !!del }); start() }
  /* feed positions are sampled ten times a second, the rate a phone logs them */
  const onScroll = y => {
    const s = sample, w = wall()
    const push = (t, v) => { scrollRing.push({ t, y: v }); s.last = t; s.pending = null; start() }
    if (w - s.last >= SAMPLE_MS) { clearTimeout(s.timer); s.timer = 0; push(w, y); return }
    s.pending = y
    if (!s.timer) {
      s.timer = setTimeout(() => {
        s.timer = 0
        if (s.pending != null) push(wall(), s.pending)
      }, SAMPLE_MS - (w - s.last))
    }
  }

  const tick = () => {
    const t = clock.now(), w = wall()
    const scroll = scrollRing.since(w - WINDOW_MS)
    const features = sessionFeatures({
      scroll: swipesIn(scroll) >= MIN_SWIPES ? scroll : [],
      keys: keyRing.since(w - WINDOW_MS),
      startedAt: startAt ?? t, endedAt: t, motionRms: null,
    })
    const s = strainIndex(features, baseline)
    st = decideLight(st, s.index, t)
    const signals = signalsFrom(s)
    const n = nudgeFor({ light: st.light, lastNudgeAt: lastNudge, now: t })
    if (n.show) { lastNudge = t; onNudge?.(n.text) }
    live = { index: s.index, light: st.light, signals, keys: signals.map(l => KEY_OF[l]), features, state: st, parts: s.parts }
    onState?.(live)
  }

  const reset = () => {
    scrollRing.clear(); keyRing.clear()
    clearTimeout(sample.timer)
    sample = { last: -1e9, pending: null, timer: 0 }
    startAt = null
    st = { light: Light.GREEN, since: clock.now() }
    lastNudge = null
    tick()
  }

  tick()
  const interval = setInterval(tick, TICK_MS)
  return {
    recordKey, onScroll, tick, reset,
    live: () => live,
    destroy() { clearInterval(interval); clearTimeout(sample.timer) },
  }
}

export function seeded(n) {
  let s = n >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = t => ((ax * t + bx) * t + cx) * t
  const sy = t => ((ay * t + by) * t + cy) * t
  const dx = t => (3 * ax * t + 2 * bx) * t + cx
  return x => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x, d = dx(t)
      if (Math.abs(e) < 1e-5) return sy(t)
      if (Math.abs(d) < 1e-6) break
      t -= e / d
    }
    let lo = 0, hi = 1
    t = x
    for (let i = 0; i < 24; i++) {
      const v = sx(t)
      if (Math.abs(v - x) < 1e-5) break
      if (v < x) lo = t; else hi = t
      t = (lo + hi) / 2
    }
    return sy(t)
  }
}
export const IOS_CURVE = bezier(0.32, 0.72, 0, 1)
export const OUT_CUBIC = p => 1 - Math.pow(1 - p, 3)

const frameFn = () => (typeof requestAnimationFrame === 'function'
  ? { req: fn => requestAnimationFrame(fn), cancel: id => cancelAnimationFrame(id), now: () => performance.now() }
  : { req: fn => setTimeout(() => fn(Date.now()), 16), cancel: clearTimeout, now: () => Date.now() })

/* Animates a scroll position frame by frame; each frame is one scroll event. */
export function scroller(getY, setY) {
  const F = frameFn()
  let raf = 0
  return {
    to(y, ms, ease) {
      if (raf) F.cancel(raf)
      raf = 0
      const from = getY()
      if (ms <= 0 || Math.abs(y - from) < 0.5) { setY(y); return }
      const t0 = F.now()
      const frame = now => {
        const p = Math.min(1, Math.max(0, (now - t0) / ms))
        setY(from + (y - from) * ease(p))
        raf = p < 1 ? F.req(frame) : 0
      }
      raf = F.req(frame)
    },
    stop() { if (raf) F.cancel(raf); raf = 0 },
  }
}

/* ── the scripts ───────────────────────────────────────────────────────── */

const CALM_PACE = { gap: 240, jit: 70, space: 50, del: 240 }
const HOT_PACE = { gap: 82, jit: 34, space: 8, del: 58 }

function* typeText(v, text, p, rnd) {
  for (const c of text) { v.key(c, false); yield Math.round(p.gap + (rnd() - 0.5) * p.jit + (c === ' ' ? p.space : 0)) }
}
function* erase(v, n, p, rnd) {
  for (let i = 0; i < n; i++) { v.key(null, true); yield Math.round(p.del + (rnd() - 0.5) * p.jit * 0.5) }
}
function* incoming(v, text, ms) { v.typing(true); yield ms; v.typing(false); v.receive(text) }

/* The banner holds about four seconds, "Take a break" is pressed, the
   "Take 2 minutes" sheet opens and this phone's activity runs. */
function* breakFlow(v, s, kind) {
  yield () => v.bannerAge() >= BANNER_HOLD_MS
  v.mark('break')
  v.pressAction()
  yield 520
  v.hideBanner()
  v.openSheet()
  yield 1700
  v.pick(kind === 'react' ? 'react' : 'walk')
  yield 650
  v.startActivity(kind)
  yield 500
  if (kind === 'react') {
    for (let i = 0; i < REACTION_MS.length; i++) {
      v.reaction({ trial: i, phase: 'wait' })
      yield 1400
      v.reaction({ trial: i, phase: 'tap', ms: REACTION_MS[i] })
      yield 1200
    }
    v.endCard('Best 229 ms. Quicker than your usual 262.')
  } else {
    /* the walk runs on the session clock: two minutes in thirty seconds */
    const total = (WALK_SECS * 1000) / RATE
    const stepMs = 250
    for (let t = 0; t <= total; t += stepMs) {
      const p = t / total
      v.walk({ steps: Math.round(WALK_STEPS * p), secs: Math.round(WALK_SECS * p) })
      yield stepMs
    }
    v.endCard('212 steps in 2 minutes.')
  }
  yield 2400
  v.showBack(kind === 'react' ? 'Back to Messages' : 'Back to videos')
  yield 1100
  v.pressBack()
  yield 450
  v.closeSheet()
  s.reset()
  v.fresh()
  v.mark('done')
}

export function* textingLoop(v, s, rnd) {
  v.fresh()
  v.mark('calm')
  yield 600
  yield* incoming(v, 'u free saturday?', 1500)
  yield 1500
  yield* typeText(v, "yeah what's up", CALM_PACE, rnd)
  yield 500; v.send()
  yield 800
  yield* incoming(v, 'beach with sam and ellie, leaving at 10', 2000)
  yield 1600
  yield* typeText(v, "down. i'll bring snacks", CALM_PACE, rnd)
  yield 500; v.send()
  yield 700
  yield* incoming(v, 'perfect', 1100)
  yield 3000
  v.mark('stress')
  yield* incoming(v, "did u see maya's story", 1300)
  yield 450
  yield* incoming(v, 'everyone was at her place last night', 1000)
  yield 350
  yield* incoming(v, 'she said she invited you??', 900)
  yield 500
  yield* typeText(v, "she didn't", HOT_PACE, rnd); yield 320
  yield* erase(v, 10, HOT_PACE, rnd); yield 260
  yield* typeText(v, 'i never got', HOT_PACE, rnd); yield 320
  yield* erase(v, 11, HOT_PACE, rnd); yield 260
  yield* typeText(v, 'wait who was there', HOT_PACE, rnd)
  yield 160; v.send()
  yield 500
  yield* incoming(v, 'literally everyone', 800)
  yield 300
  yield* incoming(v, 'also the chem lab is due at 8 tomorrow', 1100)
  yield 300
  yield* incoming(v, 'mr. patel said no extensions', 900)
  yield 400
  yield* typeText(v, "i haven't even started", HOT_PACE, rnd); yield 300
  yield* erase(v, 22, HOT_PACE, rnd); yield 240
  yield* typeText(v, 'how is it due tomorrow', HOT_PACE, rnd); yield 300
  yield* erase(v, 22, HOT_PACE, rnd); yield 240
  yield* typeText(v, "i can't do this rn", HOT_PACE, rnd)
  yield 160; v.send()
  v.mark('sent-last')
  yield* breakFlow(v, s, 'react')
}

/* The feed, in order. Five calm clips, then the six that do the damage. */
export const CLIPS = Object.freeze([
  { id: '51295', handle: '@kai.moves', caption: 'new choreo, learned it in a day', likes: '48.2K', comments: '611', shares: '2,904', c: '#c2366b' },
  { id: '4889', handle: '@sunday.walks', caption: 'no plans today', likes: '3,118', comments: '42', shares: '97', c: '#1f8a70' },
  { id: '2280', handle: '@court.time', caption: '1v1 before dinner', likes: '12.6K', comments: '208', shares: '730', c: '#d9483b' },
  { id: '4897', handle: '@slow.reads', caption: 'chapter 3, finally', likes: '2,540', comments: '61', shares: '133', c: '#4b3bd1' },
  { id: '4815', handle: '@ellie.k', caption: "good hair day, that's the post", likes: '904', comments: '37', shares: '12', c: '#e86a5c' },
  { id: '4606', handle: '@maya.r', caption: 'last night at mine. literally everyone came', likes: '1,872', comments: '254', shares: '61', c: '#7a5cf0' },
  { id: '4560', handle: '@admit.day', caption: "decisions are out. everyone's posting theirs", likes: '86.4K', comments: '3,410', shares: '12.2K', c: '#2c5fd6' },
  { id: '4761', handle: '@study.with.ben', caption: "6 hours a day. if you're not, you're behind", likes: '211K', comments: '5,032', shares: '18.9K', c: '#11677f' },
  { id: '46893', handle: '@jordan.lee', caption: "POV: the group chat you're not in", likes: '640', comments: '88', shares: '9', c: '#5a2a3c' },
  { id: '4720', handle: '@quiet.hours', caption: 'when nobody texts back', likes: '33.7K', comments: '1,206', shares: '4,480', c: '#183a5a' },
  { id: '4537', handle: '@maya.r', caption: 'round two tonight', likes: '1,240', comments: '173', shares: '44', c: '#7a5cf0' },
])

const CALM_FEED = 5
const FLICK_MS = 170, PEEK_MS = 140, PEEK = 0.3, BEAT_MS = 1000
/* back to 4606 (5) twice and to 46893 (8) more than twice */
export const STRESS_PATH = [5, 6, 7, 6, 5, 6, 7, 8, 9, 8, 9, 10, 9, 8, 7, 6, 5, 6, 7, 8, 9, 8, 9, 10]

export function* scrollingLoop(v, s, rnd) {
  v.fresh()
  v.mark('calm')
  yield 4000
  for (let i = 1; i < CALM_FEED; i++) { v.go(i, 460, 'gentle'); yield 4000 }
  v.mark('stress')
  let prev = CALM_FEED - 1
  const beat = function* (idx) {
    const d = Math.sign(idx - prev) || 1
    prev = idx
    v.go(idx, FLICK_MS, 'flick')
    yield FLICK_MS + 200
    v.go(idx - d * PEEK, PEEK_MS, 'flick'); yield PEEK_MS + 20
    v.go(idx, PEEK_MS, 'flick'); yield PEEK_MS + 20
    yield Math.round(BEAT_MS - FLICK_MS - 200 + rnd() * 160)
  }
  for (const idx of STRESS_PATH) {
    if (v.bannerAge() >= 0) break
    yield* beat(idx)
  }
  let k = 0
  while (v.bannerAge() < 0) yield* beat(k++ % 2 ? 10 : 9)
  yield* breakFlow(v, s, 'walk')
}

/* Runs a script forever. Loop k starts at base + k * period. `hold(ms)`
   freezes the script where it is and moves every later loop by the same
   amount, so a pause never shortens the next loop. */
export function runLoop(make, { offset = 0, period = LOOP_MS } = {}) {
  let base = Date.now() + offset
  let k = 0, gen = null, timer = 0, due = 0, pending = null, stopped = false
  const at = (t, fn) => {
    clearTimeout(timer)
    due = t; pending = fn
    timer = setTimeout(() => { pending = null; fn() }, Math.max(0, t - Date.now()))
  }
  const begin = () => { gen = make(k); step() }
  const step = () => {
    if (stopped) return
    const r = gen.next()
    if (r.done) { k++; at(Math.max(Date.now(), base + k * period), begin); return }
    const y = r.value
    if (typeof y === 'function') {
      const poll = () => { if (y()) step(); else at(Date.now() + 100, poll) }
      at(Date.now(), poll)
      return
    }
    at(Date.now() + Math.max(0, y || 0), step)
  }
  at(base, begin)
  return {
    hold(ms) { base += ms; if (pending) at(Math.max(due, Date.now()) + ms, pending) },
    stop() { stopped = true; clearTimeout(timer) },
    loop: () => k,
  }
}

/* ── one teen phone, wired ─────────────────────────────────────────────── */

/* The callouts. In the stress phase, the first time a signal starts showing
   on this phone the phone pauses for PAUSE_MS and the label is drawn. Each
   label once per loop. One at a time: a second signal waits for the next
   tick after the pause. */
export function startTeen({ kind, baseline, clock, view, offset, period = LOOP_MS, seed, onState, onCallout, onNudge, onPhase }) {
  let phase = 'calm', seen = new Set(), busyUntil = 0, loop = null
  let shownAt = null
  const wrapped = {
    ...view,
    bannerAge: () => (shownAt == null ? -1 : Date.now() - shownAt),
    hideBanner() { shownAt = null; view.hideBanner() },
    mark(m) {
      if (m === 'calm') { seen = new Set(); busyUntil = 0 }
      phase = m
      view.mark?.(m)
      onPhase?.(m)
    },
  }
  const session = createSession({
    baseline, clock,
    onState: live => {
      onState?.(live)
      if (phase !== 'stress' || shownAt != null || Date.now() < busyUntil) return
      const key = live.keys.find(k => !seen.has(k))
      if (!key) return
      seen.add(key)
      busyUntil = Date.now() + PAUSE_MS
      loop?.hold(PAUSE_MS)
      view.freeze?.(true, PAUSE_MS)
      setTimeout(() => view.freeze?.(false), PAUSE_MS)
      onCallout?.({ key, label: SIGNAL[key], until: busyUntil })
    },
    onNudge: text => { shownAt = Date.now(); view.showBanner(text); onNudge?.(text) },
  })
  const script = kind === 'texting' ? textingLoop : scrollingLoop
  const base = kind === 'texting' ? 7 : 11
  loop = runLoop(k => script(wrapped, session, seeded((seed ?? base) + k)), { offset, period })
  return {
    session,
    stop() { loop.stop(); session.destroy(); view.dispose?.() },
    phase: () => phase,
  }
}

/* A phone that is not drawn: the panel inside the parent app runs both teen
   engines this way, and so do the tests. The feed is a number, not a div,
   and every move of it is still a scroll sample. */
export function headlessView(kind, getSession) {
  let y = 0
  const sc = scroller(() => y, v => { y = v; getSession()?.onScroll(v) })
  const noop = () => {}
  return {
    key: (ch, del) => getSession()?.recordKey(del),
    send: noop, typing: noop, receive: noop,
    go(idx, ms, k) { sc.to(idx * SLIDE_H, ms, k === 'flick' ? OUT_CUBIC : IOS_CURVE) },
    fresh() { if (kind === 'scrolling') { sc.stop(); y = 0 } },
    showBanner: noop, hideBanner: noop, pressAction: noop,
    openSheet: noop, pick: noop, startActivity: noop, reaction: noop, walk: noop,
    endCard: noop, showBack: noop, pressBack: noop, closeSheet: noop,
    freeze: noop, mark: noop, dispose() { sc.stop() },
  }
}

/* What the parent sees: the higher of the two teen lights, and that phone's
   signals. Today's bar is the higher of the two indexes. */
export function pickParent(a, b) {
  if (!a && !b) return null
  if (!a) return b
  if (!b) return a
  return RANK[known(b.light)] > RANK[known(a.light)] ? b : a
}

export const WEEK_PAST = Object.freeze([22, 31, 58, 24, 19, 27])
export const USUAL_BAND = Object.freeze([15, 40])
export const lightOfIndex = i => (i >= 70 ? Light.RED : i >= 40 ? Light.YELLOW : Light.GREEN)
