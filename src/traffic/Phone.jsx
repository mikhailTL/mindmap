import React from 'react'
import { IPhone } from '../ui/iphone'
import { cn } from '../lib/utils'
import {
  Light, emptyBaseline, sessionFeatures, strainIndex, decideLight, nudgeFor, NUDGE_TEXT,
} from '../signals/light'
import { startMotion, askMotion } from '../signals/motion'
import { useReduced } from '../toolkit/useReduced'
import { LightPill } from './Parent'

/* The teen's phone. A feed to scroll and a thread to type in, and the Traffic
 * Light engine running against them exactly as it would in the product: the
 * scroll container records {t, y}, the field records {t, del} and never the
 * key, and every two seconds the last minute is turned into features, an
 * index and a light. Nothing here is stored, sent or kept past the page.
 *
 * Props (T2 builds the page against this):
 *   baseline   the teen's learnt usual, from src/traffic/baseline.js
 *   scale      true multiplier for the IPhone drawing
 *   onState    ({ index, light, top, words, features, state }) every 2 s
 *   onBreak    called when the teen taps "Take a breath"
 *   driverRef  ref; set to { scrollTo(y), key(del, ch), focusField(),
 *              reset(), setClockRate(r), feedMax() } so the demo driver
 *              drives the same event paths a visitor would
 *   clock      wall source for the session clock, default performance.now
 *
 * Time. Scroll and key timestamps are always wall time, so a speed or a gap
 * is the real one. The SESSION clock (minutes, the one-minute red rule, the
 * five-minute hold, the nudge cooldown) can be run faster than the wall via
 * setClockRate, and the demo driver runs it at 4x so red, which needs a
 * minute sustained, arrives in fifteen seconds of watching. The demo
 * compresses time; the product does not. */

const TICK_MS = 2000
const WINDOW_MS = 60 * 1000
const RING = 400
const NUDGE_SHOW_MS = 12 * 1000

function ring(size) {
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

const HUES = [
  ['bg-coral-wash', 'bg-coral'], ['bg-lilac-wash', 'bg-lilac'], ['bg-sun-wash', 'bg-sun'],
  ['bg-mint-wash', 'bg-mint'], ['bg-sky-wash', 'bg-sky'], ['bg-blush-wash', 'bg-blush'],
]
const KINDS = ['A post', 'A clip', 'A photo']
const CARDS = Array.from({ length: 40 }, (_, i) => ({
  hue: HUES[(i * 5) % HUES.length], kind: KINDS[i % KINDS.length], h: 120 + ((i * 7) % 4) * 28,
}))

const SEED = [
  { who: 'Someone', text: 'You around later?' },
  { who: 'You', text: 'Maybe, still finishing stuff' },
  { who: 'Someone', text: 'Ok, tell me' },
]

export default function TeenPhone({
  baseline, scale = 0.9, onState, onBreak, driverRef, clock = () => performance.now(),
}) {
  const reduced = useReduced()
  const [tab, setTab] = React.useState('feed')
  const [light, setLight] = React.useState(Light.GREEN)
  const [banner, setBanner] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [bubbles, setBubbles] = React.useState(SEED)
  const [motion, setMotion] = React.useState('off')
  const [hotField, setHotField] = React.useState(false)

  const feedRef = React.useRef(null)
  const threadRef = React.useRef(null)
  const scrollRing = React.useRef(ring(RING)).current
  const keyRing = React.useRef(ring(RING)).current
  const startRef = React.useRef(null)
  const lightRef = React.useRef({ light: Light.GREEN, since: 0 })
  const lastNudgeRef = React.useRef(null)
  const bannerTimer = React.useRef(0)
  const motionRef = React.useRef(null)
  const muteScroll = React.useRef(false)
  const lastKeyRef = React.useRef(-1e9)
  const draftRef = React.useRef('')
  const sess = React.useRef(null)
  /* `mounted` gates the await in toggleMotion: a late answer is dropped. */
  const mounted = React.useRef(true)
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  /* latest props, read from the 2 s loop and the driver handle */
  const clockRef = React.useRef(clock); clockRef.current = clock
  const baselineRef = React.useRef(baseline); baselineRef.current = baseline
  const onStateRef = React.useRef(onState); onStateRef.current = onState
  const onBreakRef = React.useRef(onBreak); onBreakRef.current = onBreak

  const wall = () => clockRef.current()
  const getSess = () => (sess.current ??= { t0: wall(), c0: wall(), rate: 1 })
  const now = () => { const s = getSess(); return s.c0 + (wall() - s.t0) * s.rate }
  const setRate = r => { const s = getSess(); s.c0 = now(); s.t0 = wall(); s.rate = r }

  const startSession = () => { if (startRef.current == null) startRef.current = now() }
  const recordKey = del => { keyRing.push({ t: wall(), del: !!del }); startSession() }
  const putDraft = v => { draftRef.current = v; setDraft(v) }

  const showBanner = () => {
    clearTimeout(bannerTimer.current)
    setBanner(true)
    bannerTimer.current = setTimeout(() => setBanner(false), NUDGE_SHOW_MS)
  }
  const hideBanner = () => { clearTimeout(bannerTimer.current); setBanner(false) }

  const send = () => {
    const text = draftRef.current.trim()
    if (text) setBubbles(b => [...b, { who: 'You', text }])
    putDraft('')
  }

  /* ── the feature loop ──────────────────────────────────────────────── */
  const tick = () => {
    const t = now(), w = wall()
    let motionRms = null
    if (motionRef.current) {
      const r = motionRef.current.stop()
      motionRef.current = startMotion()
      motionRms = r.ok ? r.rms : null
    }
    const started = startRef.current
    const features = sessionFeatures({
      scroll: scrollRing.since(w - WINDOW_MS),
      keys: keyRing.since(w - WINDOW_MS),
      startedAt: started ?? t, endedAt: t, motionRms,
    })
    const s = strainIndex(features, baselineRef.current || emptyBaseline())
    const st = decideLight(lightRef.current, s.index, t)
    lightRef.current = st
    setLight(st.light)
    const n = nudgeFor({ light: st.light, lastNudgeAt: lastNudgeRef.current, now: t })
    if (n.show) { lastNudgeRef.current = t; showBanner() }
    onStateRef.current?.({ index: s.index, light: st.light, top: s.top, words: s.words, features, state: st })
  }
  const tickRef = React.useRef(tick); tickRef.current = tick

  React.useEffect(() => {
    tickRef.current()
    const id = setInterval(() => tickRef.current(), TICK_MS)
    return () => {
      clearInterval(id)
      clearTimeout(bannerTimer.current)
      if (motionRef.current) { motionRef.current.stop(); motionRef.current = null }
    }
  }, [])

  const reset = () => {
    scrollRing.clear(); keyRing.clear()
    startRef.current = null
    lightRef.current = { light: Light.GREEN, since: now() }
    lastNudgeRef.current = null
    lastKeyRef.current = -1e9
    hideBanner()
    setLight(Light.GREEN)
    putDraft('')
    setBubbles(SEED)
    setTab('feed')
    setHotField(false)
    const el = feedRef.current
    if (el && el.scrollTop !== 0) { muteScroll.current = true; el.scrollTop = 0 }
    tickRef.current()
  }

  /* ── the driver handle ─────────────────────────────────────────────── */
  React.useEffect(() => {
    if (!driverRef) return
    driverRef.current = {
      scrollTo(y) { const el = feedRef.current; if (el) el.scrollTop = y },
      key(del, ch) {
        if (ch === '\n') { send(); return }
        recordKey(del)
        putDraft(del ? draftRef.current.slice(0, -1) : draftRef.current + (ch ?? 'a'))
      },
      focusField() { setTab('messages'); setHotField(true) },
      reset,
      setClockRate(r) { setRate(r) },
      feedMax() { const el = feedRef.current; return el ? el.scrollHeight - el.clientHeight : 0 },
    }
    return () => { driverRef.current = null }
  }, [driverRef]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── events the visitor makes ──────────────────────────────────────── */
  const onScroll = e => {
    if (muteScroll.current) { muteScroll.current = false; return }
    scrollRing.push({ t: wall(), y: e.currentTarget.scrollTop })
    startSession()
  }
  const onKeyDown = e => {
    if (e.key === 'Enter') { e.preventDefault(); send(); return }
    const del = e.key === 'Backspace' || e.key === 'Delete'
    if (!del && e.key.length !== 1) return
    lastKeyRef.current = wall()
    recordKey(del)
  }
  /* some phone keyboards send keydown as "Unidentified"; the input event
     still says whether it was a deletion, and that is all we keep */
  const onInput = e => {
    putDraft(e.target.value)
    if (wall() - lastKeyRef.current < 40) return
    const kind = e.nativeEvent?.inputType || ''
    if (kind.startsWith('delete')) recordKey(true)
    else if (kind.startsWith('insert')) recordKey(false)
  }

  const toggleMotion = async () => {
    if (motionRef.current) { motionRef.current.stop(); motionRef.current = null; setMotion('off'); return }
    const ok = await askMotion()
    if (!mounted.current) return
    if (!ok) { setMotion('none'); return }
    motionRef.current = startMotion()
    setMotion('on')
  }

  React.useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [bubbles])

  const motionWord = motion === 'on' ? 'Motion on' : motion === 'none' ? 'No sensor' : 'Motion off'

  return (
    <IPhone interactive scale={scale} screenBg="#f5fafa" label="The teen's phone">
      <div className="relative flex h-full min-h-0 flex-col font-body text-ink">

        {/* status bar */}
        <div className="flex h-9 shrink-0 items-center px-5">
          <span className="w-[72px] text-fine font-semibold tabular-nums">9:41</span>
          <span className="mx-auto" aria-live="polite">
            <LightPill light={light}/>
          </span>
          <button type="button" onClick={toggleMotion} aria-pressed={motion === 'on'}
            aria-label="Use the motion sensor"
            className="w-[72px] text-right text-fine text-ink-3 active:text-ink">
            {motionWord}
          </button>
        </div>

        {/* content */}
        <div className="relative min-h-0 flex-1">

          {/* the feed: scrollTop goes into the ring, nothing else */}
          <div ref={feedRef} onScroll={onScroll}
            className={cn('absolute inset-0 overflow-y-auto overscroll-contain px-4 pb-4 pt-1',
              tab !== 'feed' && 'invisible')}
            aria-hidden={tab !== 'feed'} aria-label="Feed">
            {CARDS.map((c, i) => (
              <div key={i} className="mb-3 rounded-lg bg-card p-3 shadow-card">
                <div className={cn('relative overflow-hidden rounded', c.hue[0])} style={{ height: c.h }}>
                  <span aria-hidden className={cn('absolute left-3 top-3 h-2 w-2/5 rounded-full opacity-70', c.hue[1])}/>
                </div>
                <p className="mt-2.5 text-ui text-ink-2">{c.kind}</p>
              </div>
            ))}
          </div>

          {/* the thread: the field times keys and keeps none */}
          <div className={cn('absolute inset-0 flex flex-col', tab !== 'messages' && 'invisible')}
            aria-hidden={tab !== 'messages'}>
            <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-2">
              {bubbles.map((b, i) => (
                <div key={i} className={cn('mb-2.5 flex flex-col', b.who === 'You' ? 'items-end' : 'items-start')}>
                  <span className="mb-1 px-1 text-fine text-ink-3">{b.who}</span>
                  <span className={cn('max-w-[78%] rounded-panel px-3.5 py-2.5 text-ui',
                    b.who === 'You' ? 'bg-mist text-ink' : 'bg-card text-ink shadow-card')}>
                    {b.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="shrink-0 border-t border-rule bg-card px-4 py-3">
              <label htmlFor="mm-teen-field" className="sr-only">Message</label>
              <input id="mm-teen-field" type="text" value={draft} placeholder="Type here"
                autoComplete="off" autoCorrect="off" spellCheck={false}
                onKeyDown={onKeyDown} onInput={onInput} onChange={() => {}}
                onFocus={() => setHotField(false)}
                className={cn('h-11 w-full rounded-chip border bg-paper px-4 text-ui text-ink',
                  'placeholder:text-ink-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30',
                  hotField ? 'border-accent ring-2 ring-accent/30' : 'border-rule')}/>
            </div>
          </div>

          {/* the nudge: one quiet offer, on red, at most every half hour */}
          <div role="status" aria-live="polite" aria-hidden={!banner}
            className={cn('absolute inset-x-3 top-2 rounded-panel bg-card p-4 shadow-raise',
              !reduced && 'transition-[transform,opacity] duration-300 ease-quint',
              banner ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-[130%] opacity-0')}>
            {banner && (
              <>
                <p className="font-display text-fine font-bold text-accent">MindMap</p>
                <p className="mt-1 text-ui text-ink">{NUDGE_TEXT}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => { hideBanner(); onBreakRef.current?.() }}
                    className="min-h-[44px] flex-1 rounded-field bg-ink font-display text-ui font-semibold text-paper active:bg-accent-ink">
                    Take a breath
                  </button>
                  <button type="button" onClick={hideBanner}
                    className="min-h-[44px] flex-1 rounded-field border border-rule bg-card font-display text-ui font-semibold text-ink active:bg-mist">
                    Not now
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* tabs */}
        <div className="flex shrink-0 border-t border-rule bg-card">
          {[['feed', 'Feed'], ['messages', 'Messages']].map(([k, w]) => (
            <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k}
              className={cn('min-h-[52px] flex-1 font-display text-ui font-bold',
                tab === k ? 'text-accent' : 'text-ink-3')}>
              {w}
            </button>
          ))}
        </div>
      </div>
    </IPhone>
  )
}

/* ── the demo driver ───────────────────────────────────────────────────── */

/* A scripted seventy seconds: a steady scroll, then a fast one with
 * reversals, then the thread, typed at a hot cadence with a lot of deleting.
 * It goes through the same handle a visitor's scroll and keys go through,
 * so the engine cannot be fed numbers it would not measure. The session
 * clock runs at DEMO_RATE for the length of the script and returns to the
 * wall when it ends. */
const DEMO_RATE = 4
const WARM_UNTIL = 9000
const SCROLL_UNTIL = 35000
const DEMO_TOTAL = 70000
const WORDS = ['ok', 'wait', 'no', 'yeah', 'what', 'later', 'sure', 'idk', 'fine', 'maybe', 'soon', 'why']

function typingScript() {
  const ops = []
  let w = 0
  while (ops.length < 480) {
    const word = WORDS[w++ % WORDS.length]
    for (const c of word) ops.push({ ch: c })
    const back = Math.min(3, word.length)
    for (let i = 0; i < back; i++) ops.push({ del: true })
    for (const c of word.slice(word.length - back)) ops.push({ ch: c })
    if (w % 3 === 0) {
      for (let i = 0; i < word.length; i++) ops.push({ del: true })
      for (const c of word) ops.push({ ch: c })
    }
    ops.push({ ch: ' ' })
    if (w % 5 === 0) ops.push({ ch: '\n' })
  }
  return ops
}

export function useDemoDriver(driverRef) {
  const [playing, setPlaying] = React.useState(false)
  const run = React.useRef(null)

  const stop = React.useCallback(() => {
    const r = run.current
    if (!r) return
    cancelAnimationFrame(r.raf)
    clearTimeout(r.timer)
    run.current = null
    driverRef.current?.setClockRate(1)
    setPlaying(false)
  }, [driverRef])

  const play = React.useCallback(() => {
    const h = driverRef.current
    if (!h) return
    stop()
    h.reset()
    h.setClockRate(DEMO_RATE)
    const r = { raf: 0, timer: 0, t0: performance.now(), last: performance.now(), y: 0, dir: 1, frame: 0, i: 0 }
    const ops = typingScript()
    run.current = r

    /* read the handle fresh each step: the phone may remount under us */
    const live = () => { const x = driverRef.current; if (!x) stop(); return x }

    const scroll = () => {
      if (run.current !== r) return
      const x = live(); if (!x) return
      const t = performance.now(), el = t - r.t0
      if (el >= SCROLL_UNTIL) { x.focusField(); r.timer = setTimeout(type, 500); return }
      const k = Math.min(3, (t - r.last) / 16.7); r.last = t
      const hot = el >= WARM_UNTIL
      const step = !hot ? 9 : (r.frame % 4 === 3 ? -22 : 30)
      r.frame++
      const max = x.feedMax() || 4000
      let y = r.y + step * k * r.dir
      if (y > max) { r.dir = -1; y = max - 1 } else if (y < 0) { r.dir = 1; y = 1 }
      r.y = y
      x.scrollTo(Math.round(y))
      r.raf = requestAnimationFrame(scroll)
    }
    const type = () => {
      if (run.current !== r) return
      const x = live(); if (!x) return
      if (performance.now() - r.t0 >= DEMO_TOTAL) { stop(); return }
      const op = ops[r.i++ % ops.length]
      x.key(!!op.del, op.ch)
      r.timer = setTimeout(type, op.ch === ' ' ? 160 : 70 + Math.random() * 50)
    }

    r.raf = requestAnimationFrame(scroll)
    setPlaying(true)
  }, [driverRef, stop])

  React.useEffect(() => stop, [stop])
  return { play, stop, playing }
}
