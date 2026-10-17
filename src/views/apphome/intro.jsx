import React from 'react'

/* The app home's opening: three typed lines, then a stress trace drawn across
 * the screen that folds into the MindMap mark and lands where the real mark
 * sits. One clock (`t`, in ms) drives every frame, so Skip and reduced motion
 * are the same thing: jump to END.
 *
 * The geometry of the mark is copied from src/ui/logo.jsx LogoMark (viewBox
 * 40 x 28). If that drawing changes, change MARK, RECT and DOT_R here. */

export const LINES = [
  { word: 'Map',     rest: ' your Mind.',    tone: 'text-accent' },
  { word: 'Support', rest: ' your Stress.',  tone: 'text-beam-ink' },
  { word: 'Network', rest: ' your Journey.', tone: 'text-sky-ink' },
]

export const T = {
  lines: [150, 1050, 1950],
  type: 560,
  out: [2900, 3250],
  draw: [3000, 3800],
  morph: [3750, 4550],
  frame: [4200, 4800],
  reveal: 4700,
  end: 5400,
}
export const END = T.end

const clamp = x => (x < 0 ? 0 : x > 1 ? 1 : x)
export const prog = (t, a, b) => clamp((t - a) / (b - a))
const outCubic = x => 1 - Math.pow(1 - x, 3)
const inOutQuart = x => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2)
const lerp = (a, b, k) => a + (b - a) * k

/* LogoMark's five points (viewBox 40 x 28). */
const MARK = [[10.5, 18.2], [15, 10.2], [20, 15.8], [25.4, 11], [29.5, 17.6]]
const RECT = { x: 2, y: 4, w: 36, h: 20, rx: 10, sw: 2.2 }
const PATH_SW = 2.3
const DOT_R = 2.4

/* The trace is a heart signal, the shape a pulse sensor draws: a flat
   baseline, a small P wave, the sharp QRS spike, a rounded T wave, three
   beats across the screen. Both it and the mark are resampled to the same
   number of points spaced evenly along their length, so the fold from one
   to the other is point for point and smooth. */
const N = 96
const BEAT = [
  [0, 0], [0.08, 0], [0.12, -0.1], [0.16, -0.14], [0.2, -0.1], [0.24, 0], [0.3, 0],
  [0.33, 0.14], [0.37, -1], [0.41, 0.38], [0.45, 0], [0.55, 0],
  [0.6, -0.16], [0.66, -0.3], [0.72, -0.16], [0.78, 0], [1, 0],
]
const BEATS = 3

function resample(pts, n) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = seg.reduce((a, c) => a + c, 0)
  const out = []
  for (let k = 0; k < n; k++) {
    let left = (total * k) / (n - 1), i = 0
    while (i < seg.length - 1 && left > seg[i]) { left -= seg[i]; i++ }
    const f = seg[i] ? Math.min(1, left / seg[i]) : 0
    out.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)])
  }
  return out
}

const tracePts = (w, h) => {
  const amp = Math.min(h * 0.16, 120)
  const x0 = w * 0.04, span = w * 0.92
  const knots = []
  for (let b = 0; b < BEATS; b++) {
    BEAT.forEach(([fx, fy], i) => {
      if (b > 0 && i === 0) return
      knots.push([x0 + span * ((b + fx) / BEATS), h / 2 + fy * amp])
    })
  }
  return resample(knots, N)
}

const logoPts = box => {
  const s = box.width / 40
  return resample(MARK.map(([x, y]) => [box.left + x * s, box.top + y * s]), N)
}

const toD = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')

function along(pts, k) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  let left = seg.reduce((a, b) => a + b, 0) * k
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i]) {
      const f = seg[i] ? left / seg[i] : 0
      return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]
    }
    left -= seg[i]
  }
  return pts[pts.length - 1]
}

function TypedLine({ line, t, at, caretUntil }) {
  const full = line.word + line.rest
  const n = Math.round(prog(t, at, at + T.type) * full.length)
  const shown = t >= at
  const caret = shown && t < caretUntil && (t < at + T.type || Math.floor(t / 420) % 2 === 0)
  const w = Math.min(n, line.word.length)
  const r = Math.max(0, n - line.word.length)
  return (
    <p className="m-0 whitespace-nowrap font-display text-[clamp(1.75rem,5.2vw,3.25rem)] font-bold
      leading-[1.15] tracking-[-0.02em] text-ink">
      <span className={line.tone}>{line.word.slice(0, w)}</span>{line.rest.slice(0, r)}
      <span className="relative">
        <span aria-hidden className={'absolute -left-px bottom-[0.12em] top-[0.12em] w-[3px] rounded-bar bg-accent '
          + (caret ? 'opacity-100' : 'opacity-0')}/>
      </span>
      <span className="opacity-0">{line.word.slice(w)}{line.rest.slice(r)}</span>
    </p>
  )
}

/* The overlay. `box` is the real mark's viewport rect; `size` the viewport. */
export function IntroOverlay({ t, box, size, onSkip }) {
  const out = prog(t, T.out[0], T.out[1])
  const draw = outCubic(prog(t, T.draw[0], T.draw[1]))
  const morph = inOutQuart(prog(t, T.morph[0], T.morph[1]))
  const frame = outCubic(prog(t, T.frame[0], T.frame[1]))
  const ready = box && size.w > 0

  let svg = null
  if (ready && t >= T.draw[0]) {
    const s = box.width / 40
    const a = tracePts(size.w, size.h)
    const b = logoPts(box)
    const pts = a.map((p, i) => [lerp(p[0], b[i][0], morph), lerp(p[1], b[i][1], morph)])
    const head = morph > 0 ? pts[pts.length - 1] : along(a, draw)
    const sw = lerp(3, PATH_SW * s, morph)
    const r = lerp(5, DOT_R * s, morph)
    svg = (
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${size.w} ${size.h}`}>
        {frame > 0 && (
          <rect x={box.left + RECT.x * s} y={box.top + RECT.y * s} width={RECT.w * s} height={RECT.h * s}
            rx={RECT.rx * s} pathLength={1} fill="none" strokeWidth={RECT.sw * s}
            className="stroke-accent" strokeDasharray={`${frame} 1`}/>
        )}
        <path d={toD(pts)} pathLength={1} fill="none" strokeWidth={sw} strokeLinecap="round"
          strokeLinejoin="round" className="stroke-accent"
          strokeDasharray={morph > 0 ? undefined : `${draw} 1`}/>
        <circle cx={head[0]} cy={head[1]} r={r} className="fill-beam"/>
      </svg>
    )
  }

  return (
    <div className="fixed inset-0 z-[300]">
      <div aria-hidden className="absolute inset-0 flex items-center justify-center px-4"
        style={{ opacity: 1 - out, transform: `translateY(${-12 * out}px)` }}>
        <div className="flex flex-col items-start gap-1 sm:gap-2">
          {LINES.map((l, i) => (
            <TypedLine key={l.word} line={l} t={t} at={T.lines[i]}
              caretUntil={i < LINES.length - 1 ? T.lines[i + 1] : T.out[0]}/>
          ))}
        </div>
      </div>
      {svg}
      <button type="button" onClick={onSkip}
        className="absolute bottom-6 left-1/2 min-h-[44px] -translate-x-1/2 rounded-field px-5 font-display
          text-ui font-semibold text-ink-2 underline decoration-rule underline-offset-4 transition-colors
          duration-150 hoverOnly:text-ink sm:bottom-10">
        Skip
      </button>
    </div>
  )
}
