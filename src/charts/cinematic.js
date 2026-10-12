/* The walkthrough that runs on the patch model.
 * Nothing here calls setView(): setView writes camera.position, target and
 * frameScale in one frame and then fits, so a sequence of setView calls is a
 * slideshow of cuts. This drives camera.position, controls.target, the
 * orthographic frustum and state.explode / state.opacity, and lets
 * applyState() do the rest.
 * It rides the element's existing rAF loop rather than starting a second one:
 * el.draw is the loop body and the loop re-schedules through `this.draw`, so
 * an own property on the instance wraps it, inheriting draw()'s gates (off
 * screen via _visible, hidden tab).
 * The section is the only discrete step: a section is different triangles
 * (the manifest carries section_a and section_b cuts of 40 and 21 bodies),
 * not a moved camera, so it cannot be interpolated. */

/* One turn, in seconds; the last three are dead — the camera is home. */
const CYCLE = 36

/* az/ele are the camera's spherical angles in degrees about the target (model
   up is +z, so ele is off the xy plane); ty/tz the target, pad the air around
   the assembly, ex the explode fraction, op the shell opacity. Azimuth runs
   -53 to -413: exactly one revolution, so the last keyframe is the first
   camera position to the bit and a cycle cannot drift. -53/ele 30 at sc 59 is
   the manifest's Closed view; -336/14 with target y -5 its Section A-A. */
const KEYS = [
  { t:  0.0, az: -53, ele: 30, ty:  0, tz:  5.0, pad: 1.03, ex: 0,    op: 1    },
  { t:  4.2, az:-108, ele: 27, ty:  0, tz:  6.0, pad: 1.11, ex: 0,    op: 1    },
  { t:  9.4, az:-168, ele: 22, ty:  0, tz: 12.0, pad: 1.14, ex: 1,    op: 1    },
  { t: 14.0, az:-196, ele: 21, ty:  0, tz: 12.5, pad: 1.15, ex: 1,    op: 1    },
  { t: 18.6, az:-252, ele: 17, ty: -2, tz:  8.0, pad: 1.16, ex: 0.35, op: 0.12 },
  { t: 22.8, az:-336, ele: 14, ty: -5, tz:  4.0, pad: 1.04, ex: 0,    op: 0.55 },
  { t: 26.8, az:-352, ele: 14, ty: -5, tz:  4.0, pad: 1.01, ex: 0,    op: 1    },
  { t: 29.2, az:-374, ele: 19, ty: -3, tz:  4.5, pad: 1.04, ex: 0,    op: 0.16 },
  { t: 33.0, az:-413, ele: 30, ty:  0, tz:  5.0, pad: 1.03, ex: 0,    op: 1    },
  { t: 36.0, az:-413, ele: 30, ty:  0, tz:  5.0, pad: 1.03, ex: 0,    op: 1    },
]

/* mode changes geometry, so each entry is a discrete step. 'closed' and
   'exploded' are the same triangles and visibility rule, so that pair costs
   nothing on screen. section_a is the real swap, placed where the shell is at
   14% opacity. */
const MODES = [
  { t:  3.6, mode: 'exploded'  },
  { t: 19.2, mode: 'section_a' },
  { t: 29.0, mode: 'closed'    },
]

const CHANNELS = ['az', 'ele', 'ty', 'tz', 'pad', 'ex', 'op']
const D2R = Math.PI / 180
/* Orthographic: distance only has to keep the model between the near and far
   planes (0.01 and 4000); the frustum does the framing. */
const RADIUS = 152

/* How much world the orthographic frustum has to hold. fit()'s rule is
   half-width = max(projected half-width, projected half-height x aspect) x
   1.4; these are that rule's two terms for this assembly, read off what fit()
   chooses at canvas aspects 1.369 and 0.705 — ~38mm across whichever way the
   patch is turned, and a half-height growing 30 -> 47.5mm as the six stages
   separate. Per-keyframe `pad` is the extra air. A fixed half-width per
   keyframe drew the patch 1.6x too large in the 390px column. */
const HALF_W = 38
const HALF_H_CLOSED = 30
const HALF_H_EXPLODED = 47.5
function baseline(aspect, ex) {
  const h = HALF_H_CLOSED + (HALF_H_EXPLODED - HALF_H_CLOSED) * ex
  return Math.max(HALF_W, h * aspect) * 1.4
}

/* Monotone cubic (Fritsch-Carlson), one interpolator for every channel. Eased
   lerp per segment has zero velocity at both ends, so the camera stops dead at
   all ten keyframes; Catmull-Rom overshoots, and an overshoot on the flat tail
   swings the camera past home. Monotone cubic has continuous velocity through
   the interior keys and cannot overshoot — equal neighbouring keys give slope
   zero, so the exploded hold and the end rest are dead flat. */
function monotone(xs, ys) {
  const n = xs.length
  const dx = [], d = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i])
    d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]))
  }
  /* Both ends clamped flat rather than set to the neighbouring secant: the
     cycle loops from a standstill, so t=0 must start from rest. */
  const m = new Array(n).fill(0)
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue }
    const w1 = 2 * dx[i] + dx[i - 1]
    const w2 = dx[i] + 2 * dx[i - 1]
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
  }
  return x => {
    if (x <= xs[0]) return ys[0]
    if (x >= xs[n - 1]) return ys[n - 1]
    let i = n - 2
    while (i > 0 && x < xs[i]) i--
    const h = dx[i], u = (x - xs[i]) / h, u2 = u * u, u3 = u2 * u
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i]
         + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1]
  }
}

export function createCinematic(el, onChange = () => {}) {
  if (!el || typeof el.draw !== 'function') return null

  const xs = KEYS.map(k => k.t)
  const track = {}
  for (const ch of CHANNELS) track[ch] = monotone(xs, KEYS.map(k => k[ch]))

  let playing = false
  let disposed = false
  let time = 0
  /* The clock is the sum of the gaps between frames that actually ran, each
     capped at one second. A per-frame budget would tie sequence speed to frame
     rate. A wall clock with not-running spans subtracted would account against
     _visible, which is written by an IntersectionObserver whose callbacks are
     themselves delivered on a rendering step — when that flickers the
     accounting slips and the shot jumps backwards. */
  let clock = 0
  let lastFrame = 0
  let staged = -1          /* index of the last MODES entry applied this cycle */

  const $ = s => el.shadowRoot?.querySelector(s)

  /* The panel names the view on screen, so changing mode must also do what
     setView does to the header and the mode grid — and nothing it does to the
     camera. */
  function setMode(m) {
    if (el.state.mode === m) return false
    el.state.mode = m
    el.state.isolate = null
    const t = $('#view-title')
    if (t) t.textContent = el.bymode?.[m]?.title || m
    el.shadowRoot?.querySelectorAll('button[data-view]')
      .forEach(b => b.classList.toggle('active', b.dataset.view === m))
    return true
  }

  /* resize()'s frustum half, without its renderer.setSize() and label-canvas
     reallocation, which would run sixty times a second for an unchanged
     number. */
  function frustum(pad, ex) {
    const c = el.renderer?.domElement
    const w = c && c.width ? c.width : 1
    const h = c && c.height ? c.height : 1
    const s = pad * baseline(w / h, ex)
    el.frameScale = s
    el.camera.left = -s
    el.camera.right = s
    el.camera.top = s * (h / w)
    el.camera.bottom = -s * (h / w)
    el.camera.zoom = 1
    el.camera.updateProjectionMatrix()
  }

  function step(now) {
    const gap = lastFrame ? now - lastFrame : 0
    lastFrame = now
    clock += Math.max(0, Math.min(1000, gap))
    const was = time
    time = (clock / 1000) % CYCLE
    if (time < was) staged = -1

    let dirty = false
    for (let i = 0; i < MODES.length; i++) {
      if (time >= MODES[i].t && staged < i) { dirty = setMode(MODES[i].mode) || dirty; staged = i }
    }

    const ex = track.ex(time), op = track.op(time)
    if (Math.abs(el.state.explode - ex) > 1e-4) { el.state.explode = ex; dirty = true }
    if (Math.abs(el.state.opacity - op) > 1e-4) { el.state.opacity = op; dirty = true }
    /* The element's own 2600ms explode tween writes state.explode in draw()
       and would fight this one frame for frame. */
    if (dirty) { el.transition = null; el.applyState() }

    const az = track.az(time) * D2R, ele = track.ele(time) * D2R
    const ty = track.ty(time), tz = track.tz(time)
    const ce = Math.cos(ele) * RADIUS
    el.controls.target.set(0, ty, tz)
    el.camera.position.set(ce * Math.cos(az), ty + ce * Math.sin(az), tz + Math.sin(ele) * RADIUS)

    /* every frame: it is what keeps the framing right when the box resizes */
    frustum(track.pad(time), ex)
  }

  /* el.draw is the loop body and the loop re-schedules through `this.draw`,
     so an own property on the instance is the whole hook. */
  const baseDraw = el.draw.bind(el)
  el.draw = t => {
    if (playing && !el.disposed && el._visible && !document.hidden) {
      try { step(t) } catch { playing = false; onChange(false) }
    } else {
      lastFrame = 0
    }
    baseDraw(t)
  }

  /* draw() breaks the self-rescheduling rAF chain whenever it is entered off
     screen or with the tab hidden, and only an intersection change or
     visibilitychange restarts it — so a frame landing in either state while
     the browser then stops delivering rAF leaves the model stopped with
     nothing scheduled to notice. startLoop() carries its own not-visible,
     not-loaded, hidden and already-running guards. */
  let watchdog = 0
  function onScreen() {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 &&
           r.top < (innerHeight || 0) && r.left < (innerWidth || 0)
  }
  function watch() {
    clearInterval(watchdog)
    watchdog = setInterval(() => {
      if (!playing || disposed || el.disposed || document.hidden) return
      /* _visible is written by an IntersectionObserver and observer callbacks
         are delivered on a rendering step, so a wrong flag with nothing else
         animating means nothing produces the rendering step that would correct
         it. The rect is ground truth. */
      if (!el._visible && onScreen()) el._visible = true
      if (!el._frame && el._visible) { try { el.startLoop() } catch {} }
    }, 1000)
  }

  function start() {
    if (disposed) return
    time = 0
    clock = 0
    lastFrame = 0
    staged = -1
    el.transition = null
    el.controls.autoRotate = false
    el.state.rotate = false
    $('[data-action=rotate]')?.setAttribute('aria-pressed', 'false')
    el.state.hidden.clear()
    el.state.isolate = null
    try { el.clearSelection() } catch {}
    setMode('closed')
    el.applyState()
    playing = true
    onChange(true)
    try { el.startLoop() } catch {}
    watch()
  }

  /* Yielding leaves the model where the user caught it: no reset, no reframe,
     no sequence frame written after their first drag. */
  function stop() {
    if (!playing) return
    playing = false
    clearInterval(watchdog)
    watchdog = 0
    onChange(false)
  }

  const yielded = e => {
    if (e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return
    stop()
  }
  /* pointerdown and keydown cover a person; click covers activation arriving
     without either — a programmatic press, or assistive technology activating
     a control directly. Capture phase, so the sequence has yielded before the
     viewer's own handler runs. */
  const EVENTS = ['pointerdown', 'wheel', 'touchstart', 'keydown', 'click']
  for (const type of EVENTS) el.addEventListener(type, yielded, { capture: true, passive: true })

  /* a harness driving the page has to read the clock it is measuring */
  const api = {
    start,
    stop,
    get playing() { return playing },
    get time() { return time },
    dispose() {
      disposed = true
      playing = false
      clearInterval(watchdog)
      for (const type of EVENTS) el.removeEventListener(type, yielded, { capture: true })
      try { delete el.draw } catch {}
      if (el.cinematic === api) el.cinematic = null
    },
  }
  el.cinematic = api
  return api
}
