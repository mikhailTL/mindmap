import React from 'react'
import { IPhone } from '../ui/iphone'
import { cn } from '../lib/utils'
import {
  Light, emptyBaseline, sessionFeatures, strainIndex, decideLight, nudgeFor, NUDGE_TEXT,
} from '../signals/light'
import { startMotion, askMotion } from '../signals/motion'
import { useReduced } from '../toolkit/useReduced'
import { IOS, IosNotification, BANNER_TOP } from './ios'
import MessagesScene from './Messages'
import ReelsScene from './Reels'

/* The teen's phone. Two live scenes, a text conversation and a short video
 * feed, and the Heads Up engine running against them exactly as it would in
 * the product: the feed reports its position as {t, y}, every key reports
 * {t, del} and never the key, and every two seconds the last minute is
 * turned into features, an index and a light. The teen sees nothing of the
 * light. The only thing that reaches them is the notification, on red.
 * Nothing here is stored, sent or kept past the page.
 *
 * Props (the page builds against this):
 *   scene        'messages' | 'reels'. Both stay mounted so a switch is
 *                instant, and the session carries across the switch.
 *   baseline     the teen's learnt usual, from src/traffic/baseline.js
 *   scale        true multiplier for the IPhone drawing
 *   onState      ({ index, light, top, words, features, state }) every 2 s
 *   onBreak      called when the teen taps "Take a break"
 *   driverRef    ref; set to { scene, key(del, ch), send(), receive(text, ms),
 *                swipe(dir, ms), flick(dir), scrollTo(y), focusField(),
 *                reset(), setClockRate(r), feedMax(), drive(on), motion() }
 *                so the demo driver goes through the same paths a visitor's
 *                keys and swipes go through. Input meant for the scene that
 *                is not showing is dropped.
 *   clock        wall source for the session clock, default performance.now
 *   interactive  the IPhone is a group of live controls, not a picture
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
/* The feed's position is sampled ten times a second, the rate a phone would
   log it at, so one swipe is a few samples and a reversal counts once. */
const SAMPLE_MS = 100
const BANNER_MS = 450
/* A swipe is a run of feed samples; a pause longer than this ends it. Speed
   and reversals are not computed from fewer than two swipes: one swipe alone
   is all motion and no watching, and reads as fast scrolling. */
const SWIPE_GAP_MS = 400
const MIN_SWIPES = 2

function swipesIn(samples) {
  let n = samples.length ? 1 : 0
  for (let i = 1; i < samples.length; i++) if (samples[i].t - samples[i - 1].t > SWIPE_GAP_MS) n++
  return n
}

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

export default function TeenPhone({
  scene = 'messages', baseline, scale = 0.9, onState, onBreak, driverRef,
  clock = () => performance.now(), interactive = true,
}) {
  const reduced = useReduced()
  /* off, enter (mounted, still above the screen), on, leave */
  const [banner, setBanner] = React.useState('off')
  const [expanded, setExpanded] = React.useState(false)

  const msgRef = React.useRef(null)
  const reelsRef = React.useRef(null)
  const scrollRing = React.useRef(ring(RING)).current
  const keyRing = React.useRef(ring(RING)).current
  const startRef = React.useRef(null)
  const lightRef = React.useRef({ light: Light.GREEN, since: 0 })
  const lastNudgeRef = React.useRef(null)
  const bannerTimer = React.useRef(0)
  const motionRef = React.useRef(null)
  const sample = React.useRef({ last: -1e9, pending: null, timer: 0 })
  const drivenRef = React.useRef(false)
  const [driven, setDriven] = React.useState(false)
  const sess = React.useRef(null)

  /* latest props, read from the 2 s loop and the driver handle */
  const sceneRef = React.useRef(scene); sceneRef.current = scene
  const clockRef = React.useRef(clock); clockRef.current = clock
  const baselineRef = React.useRef(baseline); baselineRef.current = baseline
  const onStateRef = React.useRef(onState); onStateRef.current = onState
  const onBreakRef = React.useRef(onBreak); onBreakRef.current = onBreak

  const wall = () => clockRef.current()
  const getSess = () => (sess.current ??= { t0: wall(), c0: wall(), rate: 1 })
  const now = () => { const s = getSess(); return s.c0 + (wall() - s.t0) * s.rate }
  const setRate = r => { const s = getSess(); s.c0 = now(); s.t0 = wall(); s.rate = r }

  const startSession = () => { if (startRef.current == null) startRef.current = now() }

  /* every key, from every source, lands here: when, and whether it deleted */
  const recordKey = React.useCallback(del => {
    keyRing.push({ t: wall(), del: !!del }); startSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* every feed position, from a finger, a wheel or the driver, lands here.
     The time is stamped from the same wall the keys use. */
  const onSample = React.useCallback(({ y }) => {
    const s = sample.current, w = wall()
    const push = (t, v) => { scrollRing.push({ t, y: v }); s.last = t; s.pending = null; startSession() }
    if (w - s.last >= SAMPLE_MS) { clearTimeout(s.timer); push(w, y); return }
    s.pending = y
    if (!s.timer) {
      s.timer = setTimeout(() => {
        s.timer = 0
        if (s.pending != null) push(wall(), s.pending)
      }, SAMPLE_MS - (w - s.last))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── the notification ──────────────────────────────────────────────── */
  const hideBanner = () => {
    clearTimeout(bannerTimer.current)
    setExpanded(false)
    setBanner(b => (b === 'off' ? 'off' : 'leave'))
    bannerTimer.current = setTimeout(() => setBanner('off'), BANNER_MS)
  }
  const showBanner = () => {
    clearTimeout(bannerTimer.current)
    setExpanded(false)
    setBanner('enter')
    /* two frames so the banner is painted above the screen before it moves */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setBanner(b => (b === 'enter' ? 'on' : b))
      bannerTimer.current = setTimeout(hideBanner, NUDGE_SHOW_MS)
    }))
  }
  const expand = () => {
    clearTimeout(bannerTimer.current)
    setExpanded(true)
  }
  const takeBreak = () => { hideBanner(); onBreakRef.current?.() }

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
    const scroll = scrollRing.since(w - WINDOW_MS)
    const features = sessionFeatures({
      scroll: swipesIn(scroll) >= MIN_SWIPES ? scroll : [],
      keys: keyRing.since(w - WINDOW_MS),
      startedAt: started ?? t, endedAt: t, motionRms,
    })
    const s = strainIndex(features, baselineRef.current || emptyBaseline())
    const st = decideLight(lightRef.current, s.index, t)
    lightRef.current = st
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
      clearTimeout(sample.current.timer)
      if (motionRef.current) { motionRef.current.stop(); motionRef.current = null }
    }
  }, [])

  const reset = () => {
    scrollRing.clear(); keyRing.clear()
    clearTimeout(sample.current.timer)
    sample.current = { last: -1e9, pending: null, timer: 0 }
    startRef.current = null
    lightRef.current = { light: Light.GREEN, since: now() }
    lastNudgeRef.current = null
    clearTimeout(bannerTimer.current)
    setExpanded(false)
    setBanner('off')
    msgRef.current?.reset()
    tickRef.current()
  }

  const toggleMotion = async () => {
    if (motionRef.current) { motionRef.current.stop(); motionRef.current = null; return false }
    const ok = await askMotion()
    if (!ok) return false
    motionRef.current = startMotion()
    return true
  }

  /* ── the driver handle ─────────────────────────────────────────────── */
  React.useEffect(() => {
    if (!driverRef) return
    const inMessages = () => sceneRef.current === 'messages'
    const inReels = () => sceneRef.current === 'reels'
    let lastY = 0
    driverRef.current = {
      get scene() { return sceneRef.current },
      key(del, ch) { if (inMessages()) msgRef.current?.key(!!del, ch) },
      send() { if (inMessages()) msgRef.current?.send() },
      receive(text, ms) { msgRef.current?.receive(text, ms) },
      swipe(dir = 1, ms) { if (inReels()) reelsRef.current?.swipe(dir, ms) },
      flick(dir = 1) { if (inReels()) reelsRef.current?.flick(dir) },
      /* kept from the scrolling feed: a move to y is one swipe toward it */
      scrollTo(y) {
        const dir = Math.sign(y - lastY); lastY = y
        if (dir && inReels()) reelsRef.current?.swipe(dir)
      },
      focusField() { msgRef.current?.focus() },
      reset,
      setClockRate(r) { setRate(r) },
      feedMax() { return 0 },
      drive(on) { drivenRef.current = !!on; setDriven(!!on) },
      motion: toggleMotion,
    }
    return () => { driverRef.current = null }
  }, [driverRef]) // eslint-disable-line react-hooks/exhaustive-deps

  const showing = banner === 'on'
  const mounted = banner !== 'off'

  return (
    <IPhone interactive={interactive} scale={scale} screenBg="#000" showHomeIndicator={false} label="The teen's phone">
      {/* edge to edge: positioned against the screen, not its safe areas.
          isolate keeps the scenes' own layers (the frosted header, the
          banner) under the Dynamic Island, which is drawn by the IPhone. */}
      <div className="absolute inset-0 isolate overflow-hidden" style={{ fontFamily: IOS.font }}>
        {[
          ['messages', <MessagesScene key="m" active={scene === 'messages'} onKey={recordKey}
            handleRef={msgRef} reduced={reduced} autoReply={!driven}/>],
          ['reels', <ReelsScene key="r" active={scene === 'reels'} onSample={onSample}
            handleRef={reelsRef} reduced={reduced}/>],
        ].map(([k, el]) => (
          <div key={k} className={cn('absolute inset-0', scene !== k && 'invisible')}
            aria-hidden={scene !== k} inert={scene !== k ? '' : undefined}>
            {el}
          </div>
        ))}

        {/* an expanded notification blurs what is behind it; a tap outside
            puts it away, as on the phone */}
        {expanded && (
          <div aria-hidden onClick={hideBanner}
            className={cn('absolute inset-0 z-20 bg-black/20', !reduced && 'animate-[mm-fade_200ms_ease-out]')}
            style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}/>
        )}

        {mounted && (
          <div className="absolute inset-x-2 z-30 flex flex-col gap-2" style={{ top: BANNER_TOP }}>
            <IosNotification show={showing} title="MindMap" body={NUDGE_TEXT} time="now" reduced={reduced}
              top={0} className="relative inset-x-0">
              {/* the whole banner is one button: a tap opens its actions */}
              {showing && (
                <button type="button" aria-expanded={expanded}
                  aria-label={expanded ? 'Close the notification options' : 'Show the notification options'}
                  onClick={() => (expanded ? setExpanded(false) : expand())}
                  className="absolute inset-0 rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]"/>
              )}
            </IosNotification>
            {expanded && showing && (
              <div role="group" aria-label="Notification options"
                className={cn('overflow-hidden rounded-[14px]', !reduced && 'animate-[mm-pop_260ms_cubic-bezier(0.32,0.72,0,1)]')}
                style={{ background: 'rgba(246,246,248,0.9)', backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)', boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }}>
                {[['Take a break', takeBreak], ['Not now', hideBanner]].map(([word, fn], i) => (
                  <button key={word} type="button" onClick={fn}
                    className="block min-h-[48px] w-full px-4 text-left text-[17px] leading-[22px] outline-none active:bg-black/10 focus-visible:bg-black/10"
                    style={{ color: IOS.label, borderTop: i ? '0.5px solid rgba(60,60,67,0.29)' : 'none' }}>
                    {word}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <span aria-hidden className="pointer-events-none absolute bottom-2 left-1/2 z-40 h-[5px] w-[140px] -translate-x-1/2 rounded-full"
          style={{ background: scene === 'reels' ? '#fff' : '#000' }}/>
        <style>{`@keyframes mm-fade{from{opacity:0}to{opacity:1}}@keyframes mm-pop{from{opacity:0;transform:scale(.94) translateY(-6px)}to{opacity:1;transform:none}}`}</style>
      </div>
    </IPhone>
  )
}

/* ── the demo driver ───────────────────────────────────────────────────── */

/* A scripted seventy seconds per scene, deterministic: the same keys, gaps
 * and swipes every play. It goes through the same handle a visitor's keys
 * and swipes go through, so the engine cannot be fed numbers it would not
 * measure. The session clock runs at DEMO_RATE for the length of the script
 * and returns to the wall when it ends.
 *
 * Messages: calm typing for about ten seconds, then faster and faster,
 * with whole lines typed and deleted, so the index passes 70 near eighteen
 * seconds and red, which needs a sustained minute of session clock, arrives
 * in the mid thirties. The stress is in the typing, never in the words.
 *
 * Reels: two unhurried swipes, each clip watched for about four seconds as
 * a calm viewer would, then quicker swipes, then flicks with reversals, the
 * same climb. */
const DEMO_RATE = 4
const DEMO_TOTAL = 70000

/* a small seeded generator so the jitter is the same every run */
function seeded(n) {
  let s = n >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

/* '<' is one press of delete, '\n' is the send button */
const INCOMING = [
  { at: 800, ms: 1500, text: 'like 7 i think' },
  { at: 5400, ms: 1300, text: 'wait did you see the group chat' },
  { at: 10200, ms: 1000, text: 'did you see what they posted' },
  { at: 16500, ms: 1200, text: 'idk its kind of about you' },
  { at: 23000, ms: 1000, text: 'everyone is being weird' },
  { at: 30500, ms: 1400, text: 'ok text me later' },
  { at: 44000, ms: 1600, text: 'i didnt say anything btw' },
  { at: 55000, ms: 1600, text: 'anyway did you do q6' },
  { at: 64500, ms: 1200, text: 'ok cool' },
]
const TEEN = [
  { at: 3000, pace: 'calm', text: 'ok coll<<ol\n' },
  { at: 7300, pace: 'calm', text: 'no whay<t happened\n' },
  { at: 11400, pace: 'hot', text: 'who poste<<<<<<<<<what did they say\n' },
  { at: 0, pace: 'hot', text: 'why would thry<<ey say that\n' },
  { at: 0, pace: 'hot', text: 'thats so<<<<<<<<i dont even ca<<<<<<<<<<<<<<<<whatever\n' },
  { at: 18000, pace: 'hot', text: 'about me<<<<<<<<like whst<<at\n' },
  { at: 0, pace: 'hot', text: 'never mind<<<<<<<<<<its fine\n' },
  { at: 24200, pace: 'hot', text: 'whatever\n' },
  { at: 0, pace: 'hot', text: 'they always d<<<<<<<<<<<<<i dont care\n' },
  { at: 0, pace: 'hot', text: 'can we talk lster<<<<ater\n' },
  { at: 0, pace: 'hot', text: 'like i didnt ev<<<<<<<<<<<<<<<sorry<<<<<\n' },
  { at: 33000, pace: 'warm', text: 'ok\n' },
  { at: 46000, pace: 'warm', text: 'i know<<<<<<ok\n' },
  { at: 57000, pace: 'warm', text: 'not yet<<<<<<<yeah its b i think\n' },
  { at: 66500, pace: 'warm', text: 'brb\n' },
]
const PACE = {
  calm: { gap: 205, jit: 60, del: 240, space: 40, beforeSend: 450, afterSend: 600 },
  warm: { gap: 115, jit: 40, del: 105, space: 20, beforeSend: 240, afterSend: 380 },
  hot: { gap: 80, jit: 34, del: 56, space: 8, beforeSend: 110, afterSend: 240 },
}

export function messagesScript() {
  const rnd = seeded(7)
  const out = INCOMING.map(m => ({ at: m.at, op: 'receive', text: m.text, ms: m.ms }))
  let t = 0
  for (const seg of TEEN) {
    t = Math.max(t, seg.at)
    const p = PACE[seg.pace]
    for (const c of seg.text) {
      if (c === '<') { out.push({ at: t, op: 'key', del: true }); t += p.del + (rnd() - 0.5) * p.jit * 0.5 }
      else if (c === '\n') { t += p.beforeSend; out.push({ at: t, op: 'send' }); t += p.afterSend }
      else { out.push({ at: t, op: 'key', ch: c }); t += p.gap + (rnd() - 0.5) * p.jit + (c === ' ' ? p.space : 0) }
    }
  }
  return out.sort((a, b) => a.at - b.at)
}

export function reelsScript() {
  const rnd = seeded(11)
  const out = []
  /* calm: a clip watched for a few seconds before the next */
  for (const t of [600, 5000]) out.push({ at: t, op: 'swipe', dir: 1, ms: 380 })
  for (let t = 9600; t < 13500; t += 1300) out.push({ at: t, op: 'swipe', dir: t > 10500 && t < 11500 ? -1 : 1, ms: 260 })
  /* restless: quick flicks, mostly back and forth */
  const DIRS = [1, -1, 1, -1, 1, 1, -1, 1, -1, 1, -1, -1]
  let i = 0
  for (let t = 13500; t < 46000; t += 340 + rnd() * 120) out.push({ at: t, op: 'flick', dir: DIRS[i++ % DIRS.length] })
  for (let t = 46500; t < DEMO_TOTAL; t += 1600) out.push({ at: t, op: 'swipe', dir: 1, ms: 300 })
  return out
}

export function useDemoDriver(driverRef, scene = 'messages') {
  const [playing, setPlaying] = React.useState(false)
  const run = React.useRef(null)

  const stop = React.useCallback(() => {
    const r = run.current
    if (!r) return
    clearTimeout(r.timer)
    run.current = null
    driverRef.current?.setClockRate(1)
    driverRef.current?.drive?.(false)
    setPlaying(false)
  }, [driverRef])

  /* run one scene's script from its start; the session is not touched */
  const start = React.useCallback(sc => {
    const prev = run.current
    if (prev) clearTimeout(prev.timer)
    const steps = sc === 'reels' ? reelsScript() : messagesScript()
    const r = { scene: sc, t0: performance.now(), i: 0, timer: 0 }
    run.current = r

    const step = () => {
      if (run.current !== r) return
      /* read the handle fresh each step: the phone may remount under us */
      const x = driverRef.current
      if (!x) { stop(); return }
      const el = performance.now() - r.t0
      while (r.i < steps.length && steps[r.i].at <= el) {
        const s = steps[r.i++]
        if (s.op === 'key') x.key(!!s.del, s.ch)
        else if (s.op === 'send') x.key(false, '\n')
        else if (s.op === 'receive') x.receive(s.text, s.ms)
        else if (s.op === 'swipe') x.swipe(s.dir, s.ms)
        else if (s.op === 'flick') x.flick(s.dir)
      }
      if (r.i >= steps.length || el >= DEMO_TOTAL) { stop(); return }
      r.timer = setTimeout(step, Math.max(0, steps[r.i].at - el))
    }
    step()
  }, [driverRef, stop])

  const sceneRef = React.useRef(scene); sceneRef.current = scene

  const play = React.useCallback(() => {
    const h = driverRef.current
    if (!h) return
    stop()
    h.reset()
    h.setClockRate(DEMO_RATE)
    h.drive?.(true)
    setPlaying(true)
    start(sceneRef.current)
  }, [driverRef, stop, start])

  /* a scene switch mid-demo keeps the session and the fast clock and runs
     the other scene's script */
  React.useEffect(() => {
    const r = run.current
    if (r && r.scene !== scene) start(scene)
  }, [scene, start])

  React.useEffect(() => stop, [stop])
  return { play, stop, playing }
}
