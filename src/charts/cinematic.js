/* The walkthrough that runs on the patch model.
 *
 * The viewer ships eight named views and a 0-1 explode slider, and jumping
 * between those views is a cut: setView() writes camera.position, target and
 * frameScale in one frame and then calls fit(). A sequence of setView() calls
 * is therefore a slideshow of renders, which is the one thing this is not
 * allowed to be. So nothing here calls setView. This drives the four things
 * the model actually reads each frame — camera.position, controls.target, the
 * orthographic frustum, and state.explode / state.opacity — and lets the
 * element's own applyState() do the work it already does for the slider.
 *
 * It rides the element's existing requestAnimationFrame loop rather than
 * starting a second one: el.draw is the loop body and the loop re-schedules
 * itself through `this.draw`, so an own property on the instance wraps it.
 * That inherits the two gates already in draw() for free — the loop does not
 * run while the box is off screen (_visible) or the tab is hidden — and there
 * is no second rAF to leave spinning behind either of them.
 *
 * The only discrete step in the whole sequence is the section. A section in
 * this model is different triangles (the manifest carries a section_a and a
 * section_b cut of 40 and 21 bodies), not a moved camera, so it cannot be
 * interpolated. It is taken at the moment the shell is nearly transparent and
 * the camera is at its fastest, which reads as the inside coming into view
 * rather than as a cut. Everything else — 360 degrees of azimuth, the
 * elevation, the target, the frustum, the explode and the opacity — is a
 * continuous function of time.
 */

/* One turn of the whole thing, in seconds. The last three are dead: the
   camera has arrived home and nothing moves, which is the pause between
   cycles. */
const CYCLE = 36

/* az/ele are the camera's own spherical angles in degrees about the target
   (the model's up is +z, so ele is measured off the xy plane); ty/tz are the
   target, pad how much air the shot holds around the assembly, ex the explode
   fraction and op the shell opacity.

   Azimuth runs -53 to -413: exactly one revolution, so the last keyframe is
   the first camera position to the bit rather than to the eye, and a cycle
   cannot drift. -53 and ele 30 with sc 59 is the manifest's own Closed view;
   -336/14 with the target at y -5 is its Section A-A. */
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

/* mode changes geometry, so each of these is the one step in the sequence.
   'closed' and 'exploded' are the same triangles and the same visibility rule
   — the difference between them is the explode value, which is interpolated —
   so that pair costs nothing on screen and keeps the panel's own title and
   active view button telling the truth about what is on screen. section_a is
   the real swap, and it is placed where the shell is at 14% opacity. */
const MODES = [
  { t:  3.6, mode: 'exploded'  },
  { t: 19.2, mode: 'section_a' },
  { t: 29.0, mode: 'closed'    },
]

const CHANNELS = ['az', 'ele', 'ty', 'tz', 'pad', 'ex', 'op']
const D2R = Math.PI / 180
/* Orthographic, so the distance only has to keep the model between the near
   and far planes (0.01 and 4000); the frustum does the framing. */
const RADIUS = 152

/* How much of the world the orthographic frustum has to hold.
 *
 * A fixed half-width per keyframe is wrong the moment the box is not the
 * proportion it was written for. The viewer's own fit() already knows the
 * rule — half-width = max(projected half-width, projected half-height x
 * aspect) x 1.4 — and these are that rule's two terms for this assembly,
 * read off what fit() itself chooses at two very different canvas shapes
 * (1.369 and 0.705): about 38mm across whichever way the patch is turned,
 * and a half-height that grows from 30 to 47.5mm as the six stages separate.
 * The per-keyframe `pad` on top is the air the shot wants, a little over one.
 *
 * Without this the patch was drawn 1.6x too large in the 390px column and its
 * left and right edges ran off the canvas. */
const HALF_W = 38
const HALF_H_CLOSED = 30
const HALF_H_EXPLODED = 47.5
function baseline(aspect, ex) {
  const h = HALF_H_CLOSED + (HALF_H_EXPLODED - HALF_H_CLOSED) * ex
  return Math.max(HALF_W, h * aspect) * 1.4
}

/* Monotone cubic (Fritsch-Carlson), one interpolator for every channel.
 *
 * Eased lerp per segment was the obvious thing and it is wrong here: every
 * easing curve has zero velocity at both ends, so the camera would come to a
 * full stop at all ten keyframes and a 360-degree orbit would arrive in nine
 * separate shoves. A Catmull-Rom spline fixes the velocity but overshoots,
 * and an overshoot on the flat tail would swing the camera past home and drag
 * it back. Monotone cubic gives continuous velocity through the interior keys
 * and cannot overshoot: where two keys are equal its slope is zero, so the
 * exploded hold is dead flat and the rest at the end is dead still, and where
 * the values turn — explode 1 back to 0 — it flattens instead of bouncing.
 */
function monotone(xs, ys) {
  const n = xs.length
  const dx = [], d = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i])
    d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]))
  }
  /* Both ends are clamped flat rather than set to the neighbouring secant:
     the cycle loops from a standstill into this curve, so t=0 has to start
     from rest the way t=CYCLE ends at it. */
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
  /* The clock is the sum of the gaps between the frames that actually ran,
     each capped at one second.
     
     Two other clocks were wrong here. A per-frame budget ties the sequence's
     speed to the frame rate, so a slow device plays the whole thing in slow
     motion. A wall clock with the not-running spans subtracted plays at the
     right speed but has to account for every span the loop was stopped, and
     the flag it would account against — the element's _visible — is written by
     an IntersectionObserver whose callbacks are themselves delivered on a
     rendering step; when that flickers, the accounting slips and the shot
     jumps backwards.
     
     This cannot run backwards, needs no accounting, and stops dead whenever
     the loop does, which is exactly the required behaviour off screen and in a
     hidden tab. The cap is the whole compromise: it costs real time only on a
     device that cannot render one frame a second, where nothing was going to
     look like an animation anyway. */
  let clock = 0
  let lastFrame = 0
  let staged = -1          /* index of the last MODES entry applied this cycle */

  const $ = s => el.shadowRoot?.querySelector(s)

  /* The panel names the view that is on screen. Changing mode behind its back
     would leave it naming the wrong one, so this does what setView does to the
     header and the mode grid — and nothing it does to the camera. */
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

  /* resize()'s frustum half, without resize()'s renderer.setSize() and its
     reallocation of the label canvas — those would run sixty times a second
     for a number that has not changed. The canvas attributes carry the size
     and reading them costs no layout. */
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

    /* every frame: it is a handful of multiplications, and it is also what
       keeps the framing right when the box itself changes size */
    frustum(track.pad(time), ex)
  }

  /* el.draw is the loop body and the loop re-schedules itself through
     `this.draw`, so an own property on the instance is the whole hook. Every
     gate draw() already has — disposed, off screen, tab hidden — therefore
     gates the sequence too, and there is no second rAF to stop. */
  const baseDraw = el.draw.bind(el)
  el.draw = t => {
    if (playing && !el.disposed && el._visible && !document.hidden) {
      try { step(t) } catch { playing = false; onChange(false) }
    } else {
      /* so the first frame back does not arrive carrying the whole stall */
      lastFrame = 0
    }
    baseDraw(t)
  }

  /* The element's loop is a self-rescheduling rAF chain, and draw() breaks the
     chain whenever it is entered off screen or with the tab hidden. Only an
     intersection change or a visibilitychange starts it again — so a frame that
     lands in either state while the browser then stops delivering rAF (a
     backgrounded tab, a throttled compositor) leaves the model stopped with
     nothing scheduled to notice. One second is far too slow to matter to
     anything and startLoop() carries its own not-visible, not-loaded, hidden
     and already-running guards, so this cannot start a loop behind them. */
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
      /* _visible is written by an IntersectionObserver, and observer callbacks
         are delivered on a rendering step. The element stops drawing when that
         flag is false, so if the flag is ever wrong while nothing else on the
         page is animating, nothing produces the rendering step that would
         correct it and the model stays stopped on screen for good. The rect is
         the ground truth, and this is the only thing that reads it. */
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
    /* the loop is idle whenever the box has been off screen or the tab was
       hidden, and nothing else restarts it until the next intersection */
    try { el.startLoop() } catch {}
    watch()
  }

  /* Yielding leaves the model exactly where the user caught it: no reset, no
     re-frame, no last frame of the sequence written after their first drag. */
  function stop() {
    if (!playing) return
    playing = false
    clearInterval(watchdog)
    watchdog = 0
    onChange(false)
  }

  const yielded = e => {
    /* tabbing through the panel is not taking hold of the model */
    if (e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return
    stop()
  }
  /* pointerdown and keydown cover a person; click is here for the activation
     that arrives without either — a programmatic press, and assistive
     technology that activates a control directly. Capture phase, so the
     sequence has already yielded by the time the viewer's own handler runs
     and applies whatever they pressed. */
  const EVENTS = ['pointerdown', 'wheel', 'touchstart', 'keydown', 'click']
  for (const type of EVENTS) el.addEventListener(type, yielded, { capture: true, passive: true })

  /* the sequence is otherwise unreachable from outside React, and a harness
     driving the page has to be able to read the clock it is measuring */
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
