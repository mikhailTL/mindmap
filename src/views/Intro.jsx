import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'
import { Button } from '../ui/button'
import { Logo } from '../ui/logo'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { IntroSky } from '../charts/intro-sky'
import { PHOTOS } from '../lib/photos'
import { RainbowDial } from '../charts/rainbow'
import { studentRings } from '../lib/readings'

/* Every plate is card at 85%: that keeps ink-3 at 4.74 : 1 over the worst band
 * the arch behind it can produce, and still lets the arch read through.
 *
 * Every drawing's RESTING state is the finished picture and motion is layered
 * on top, so reduced motion and an interrupted beat need no second artwork.
 */

/* "Has refused", not "has watched". Reaching the end sets nothing and the
   sequence plays again next load; only Skip, or Esc, writes this. */
const OFF_KEY = 'mindmap.intro.off'

/** True when the visitor has pressed Skip, in which case the sequence must
 *  never mount again. A throwing localStorage reads as "not suppressed", so the
 *  worst failure under blocked storage is that the intro plays. */
export function introSuppressed() {
  try { return window.localStorage.getItem(OFF_KEY) === '1' } catch { return false }
}

/** Suppress the sequence permanently. Called by Skip and by Esc; exported so a
 *  settings control elsewhere could set the same flag. */
export function suppressIntro() {
  try { window.localStorage.setItem(OFF_KEY, '1') } catch {}
}

/* The grounds sit .044 to .083 apart in relative luminance, which keeps
 * one distinguishable from the next across the crossfade. Worst case over all
 * five: ink 12.16 : 1, ink-2 6.60, ink-3 4.48, accent 4.64. ink-3 only ever
 * appears inside a plate; paper, mist, rule and ruling have no contrast left.
 */
const BEATS = [
  { ms: 6300, bg: '#e8f6f4', head: 'One number for your day.' },
  { ms: 7000, bg: '#dcf0ef', head: 'The patch goes on your arm.' },
  { ms: 5200, bg: '#e3f2ed', head: 'Your usual day is marked.',
    sub: 'So an ordinary day reads as ordinary.' },
  { ms: 6300, bg: '#eef7f3', head: 'You choose who sees it.',
    sub: 'Nothing leaves your phone unless you say so.' },
  { ms: 5000, bg: '#eaf6f2', head: 'MindMap',
    sub: 'A patch, or six questions. One score a day.' },
]
const LAST = BEATS.length - 1
const EXIT_MS = 620          // must match the opacity transition on the overlay
const SKIP_MS = 180          // a skip is an interruption, so it clears faster
const OUT_MS = 900           // how long before a beat ends its stage starts leaving
const FADE_MS = 1500         // the ground crossfade, in step with the longer beats

const svgProps = {
  preserveAspectRatio: 'xMidYMid meet',
  className: 'h-full w-full',
  'aria-hidden': true,
  focusable: 'false',
}

/* beam #1d8fb0 measures 2.69 on a pale aqua and fails even as a graphic, so the
   peak is beam-ink #11677f: the same turquoise, 3.96 on the lightest ground. */
const PEAK = { '--logo-peak': '#11677f' }

/* Deterministic; Math.random() would redraw every render. --len has to be at
   least the path length or the stroke-draw never completes. */
function waveLine(y, seed, amp, steps, x0, x1) {
  let d = '', len = 0, px = 0, py = 0
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps
    const n = Math.sin(i * seed) * 0.62 + Math.sin(i * seed * 2.3 + 1.7) * 0.38
    const yy = y - n * amp
    if (i) len += Math.hypot(x - px, yy - py)
    d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + yy.toFixed(1)
    px = x; py = yy
  }
  return { d, len: Math.ceil(len) + 4 }
}

/* Written to the node: as state this re-rendered the stage 60x a second. */
function Count({ to, ms = 1400, delay = 0, ...p }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    let raf = 0, t0 = 0
    const tick = t => {
      if (!t0) t0 = t
      const e = t - t0 - delay
      const q = e <= 0 ? 0 : Math.min(1, e / ms)
      if (ref.current) ref.current.textContent = String(Math.round(to * (1 - (1 - q) ** 3)))
      if (q < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms, delay])
  return <text ref={ref} {...p}>0</text>
}

/* The logo's five ridge points, shared by the route beat and the closing morph. */
const RIDGE = 'M10.5 18.2 15 10.2 20 15.8 25.4 11 29.5 17.6'

/* Five marks on the closing line's 40-440 span; the last sits under the morph. */
const HOURS = [['6am', 60], ['10am', 150], ['2pm', 240], ['6pm', 330], ['10pm', 420]]

/* Point and bearing rather than three corners. The notch at -0.72 stops it
   reading as a paper dart. */
function headPath(x, y, deg, s = 10) {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r), si = Math.sin(r)
  const p = (dx, dy) =>
    `${(x + dx * c - dy * si).toFixed(1)} ${(y + dx * si + dy * c).toFixed(1)}`
  return `M${p(0, 0)} L${p(-s, s * 0.5)} L${p(-s * 0.72, 0)} L${p(-s, -s * 0.5)} Z`
}

function Arrow({ d, len, x, y, deg, t, dur = 0.8, color = '#0b2b33', w = 2.4, still }) {
  if (still) {
    return (
      <g stroke={color} fill={color}>
        <path d={d} fill="none" strokeWidth={w} strokeLinecap="round"/>
        <path d={headPath(x, y, deg)} strokeWidth="0"/>
      </g>
    )
  }
  return (
    <g stroke={color} fill={color}>
      <path d={d} fill="none" strokeWidth={w} strokeLinecap="round"
        className="iv-a iv-draw" style={{ '--len': len, '--d': `${dur}s`, '--t': `${t}s` }}/>
      <path d={headPath(x, y, deg)} strokeWidth="0" className="iv-a iv-pop"
        style={{ '--d': '.28s', '--t': `${(t + dur - 0.06).toFixed(2)}s` }}/>
    </g>
  )
}

function Spot({ cx, cy, r, t, still, color = '#0a6e68' }) {
  if (still) return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2.4"/>
  return (
    <g fill="none" stroke={color} strokeWidth="2.6">
      {[0, 0.52].map((o, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} className="iv-a iv-ring"
          style={{ '--d': '1.3s', '--t': `${(t + o).toFixed(2)}s` }}/>
      ))}
    </g>
  )
}

function Chip({ x, y, t, still, anchor = 'middle', size = 17, tone = 'fill-ink', children }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight="600"
      className={cn('font-display', tone, !still && 'iv-a iv-rise')}
      style={still ? undefined : { '--d': '.5s', '--t': `${t}s` }}>{children}</text>
  )
}

/* Drawn, not laid out: an arrow can be aimed at a rect, not at a moving box. */
function Card({ x, y, w, h, t, still, dim = false }) {
  return (
    <rect x={x} y={y} width={w} height={h} rx="16"
      fill="#ffffff" fillOpacity={dim ? 0.34 : 0.85} stroke="#8eb0b6"
      strokeOpacity={dim ? 0.45 : 1} strokeWidth="1.5"
      className={cn(!still && 'iv-a iv-lift')}
      style={still ? undefined : { '--d': '.6s', '--t': `${t}s` }}/>
  )
}

/* -- Beat 1 -- a whole day arrives as one number ------------------------- */
const DAYLINE = waveLine(150, 1.05, 30, 30, 48, 300)

function StageOneNumber({ still }) {
  const a = still ? undefined : 'iv-a'
  return (
    <div className="iv-real mx-auto w-full max-w-[720px]">
      <div className="aspect-[16/9] w-full">
        <svg {...svgProps} viewBox="0 0 560 300">
          <line x1="44" y1="226" x2="306" y2="226" strokeWidth="1.5"
            className={cn('stroke-ink-3', !still && 'iv-a iv-draw')}
            style={still ? undefined : { '--len': 300, '--d': '.6s', '--t': '.2s' }}/>
          <path d={DAYLINE.d} fill="none" stroke="#11677f" strokeWidth="3.2" strokeLinecap="round"
            strokeLinejoin="round" className={cn(a, !still && 'iv-draw')}
            style={still ? undefined : { '--len': DAYLINE.len, '--d': '2.2s', '--t': '.6s' }}/>
          <Chip x="175" y="256" t={1.1} still={still} size={16} tone="fill-ink-2">one day</Chip>

          <Arrow still={still} t={3.3} dur={0.9} d="M318 168 C 348 178, 366 176, 386 166"
            len={92} x={390} y={164} deg={-24}/>

          <circle cx="462" cy="150" r="62" fill="#ffffff" fillOpacity="0.85" stroke="#0a6e68"
            strokeWidth="2.4" className={cn(a, !still && 'iv-pop')}
            style={still ? undefined : { '--d': '.5s', '--t': '4.15s' }}/>
          {still
            ? <text x="462" y="166" textAnchor="middle" fontSize="54" fontWeight="700"
                className="font-display fill-ink">64</text>
            : <Count to={64} ms={1250} delay={2850} x="462" y="166" textAnchor="middle"
                fontSize="54" fontWeight="700" className="font-display fill-ink"/>}
          <Chip x="462" y="236" t={6.0} still={still} size={16} tone="fill-ink-2">out of 100</Chip>
          <Spot cx={462} cy={150} r={76} t={6.3} still={still}/>
        </svg>
      </div>
    </div>
  )
}

/* -- Beat 2 -- where it goes, and where the readings go -------------------
 * The licensed plate from the patch page, patch composited onto the outer upper
 * arm at its real 36 x 54 mm. Placed by arithmetic: the patch sits at
 * (0.5737, 0.7869) of the plate and is 0.0352 of its width, measured off the
 * file, and PATCH_W is how wide it reads here. Re-crop and only these change.
 */
const PHOTO = { w: 1024, h: 688 }
const PATCH_AT = { x: 0.5737, y: 0.7869, w: 0.0352 }
const PANEL = { x: 20, y: 20, w: 280, h: 200 }
const PATCH_W = 27                               // how wide the patch reads, in viewBox units
const SPOT_AT = { x: 168, y: 146 }               // where it lands in the 560 x 300 viewBox

/* A nested <svg>, not a full-size <image> behind a clipPath: a clip hides the
 * pixels but the element keeps its real geometry, which measured 479px inside a
 * 350px column, gave the dialog a 33px horizontal scroll, and on a 390px phone
 * pushed every heading 13px off the left edge. */
const CROP_W = (PATCH_AT.w * PHOTO.w * PANEL.w) / PATCH_W
const CROP_H = (CROP_W * PANEL.h) / PANEL.w
const CROP_X = PATCH_AT.x * PHOTO.w - ((SPOT_AT.x - PANEL.x) / PANEL.w) * CROP_W
const CROP_Y = PATCH_AT.y * PHOTO.h - ((SPOT_AT.y - PANEL.y) / PANEL.h) * CROP_H

function StagePatch({ still }) {
  const a = still ? undefined : 'iv-a'
  const clip = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const dot = (i, c) => (
    <circle key={i} r="6" fill={c}
      className={cn(!still && 'iv-a iv-run')}
      style={still
        ? { transform: `translate(${332 + i * 22}px, ${146 - i * 5}px)`, transformBox: 'view-box' }
        : { offsetPath: 'path("M312 152 C 344 150, 370 142, 392 134")',
            '--d': '2.4s', '--t': `${(4.4 + i * 0.45).toFixed(2)}s` }}/>
  )
  return (
    <div className="iv-real mx-auto w-full max-w-[760px]">
      <div className="aspect-[16/9] w-full">
        <svg {...svgProps} viewBox="0 0 560 300">
          <defs>
            <clipPath id={clip}>
              <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx="20"/>
            </clipPath>
          </defs>
          <g clipPath={`url(#${clip})`} className={cn(a, !still && 'iv-fade')}
            style={still ? undefined : { '--d': '.9s', '--t': '.3s' }}>
            <svg x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h}
              viewBox={`${CROP_X.toFixed(1)} ${CROP_Y.toFixed(1)} ${CROP_W.toFixed(1)} ${CROP_H.toFixed(1)}`}
              preserveAspectRatio="xMidYMid slice">
              <image href={PHOTOS['patch-worn']} x="0" y="0"
                width={PHOTO.w} height={PHOTO.h}/>
            </svg>
          </g>
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx="20" fill="none"
            stroke="#8eb0b6" strokeWidth="1.6" className={cn(a, !still && 'iv-fade')}
            style={still ? undefined : { '--d': '.9s', '--t': '.3s' }}/>

          <Spot cx={SPOT_AT.x} cy={SPOT_AT.y} r={26} t={1.8} still={still}/>

          <Arrow still={still} t={3.4} dur={0.9} d="M312 152 C 344 150, 370 142, 392 134"
            len={100} x={396} y={132} deg={-20} color="#1f5560" w={2.2}/>
          {!still && SENSOR_ORDER.map((i2, i) => dot(i, SENSORS[i2].glow))}

          <rect x="408" y="62" width="100" height="176" rx="18" fill="#ffffff" fillOpacity="0.92"
            stroke="#8eb0b6" strokeWidth="1.6" className={cn(a, !still && 'iv-lift')}
            style={still ? undefined : { '--d': '.6s', '--t': '3.2s' }}/>
          <g className={cn(a, !still && 'iv-fade')}
            style={still ? undefined : { '--d': '.5s', '--t': '6.4s' }}>
            <text x="458" y="152" textAnchor="middle" fontSize="42" fontWeight="700"
              className="font-display fill-ink">64</text>
            <text x="458" y="176" textAnchor="middle" fontSize="14"
              className="font-mono fill-ink-2">out of 100</text>
          </g>
          <Chip x="458" y="264" t={6.8} still={still} size={16} tone="fill-ink-2">your phone</Chip>
        </svg>
      </div>
    </div>
  )
}

/* -- Beat 4 -- the mark on the dial --------------------------------------
   The overlay shares the dial's own 320 x 232 viewBox, so the arrow lands on the
   mark by coordinates rather than by nudging. The mark sits at 180 + 1.8 x usual
   degrees from the arch's centre, so changing USUAL moves the arrow. */
const USUAL = 46
const DIAL_SCORE = 64

function StageMarkOnDial({ still }) {
  return (
    <div className="iv-real mx-auto flex w-full max-w-[560px] flex-col items-center">
      <div className="relative w-[min(100%,430px)]">
        <RainbowDial score={DIAL_SCORE} usual={USUAL} rings={studentRings()} size={430}/>
        <svg viewBox="0 0 320 232" aria-hidden focusable="false"
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{ aspectRatio: '320 / 232' }}>
          <Chip x="14" y="30" t={2.4} still={still} anchor="start" size={16}>your usual day</Chip>
          <Arrow still={still} t={3.0} dur={0.75} d="M76 42 C 100 40, 118 33, 132 25"
            len={80} x={135} y={23} deg={-27}/>
          <Spot cx={146} cy={54} r={26} t={3.9} still={still}/>
        </svg>
      </div>
    </div>
  )
}

/* -- Beat 6 -- the switch, and what happens when it goes off ------------- */
function StageShare({ still }) {
  const a = still ? undefined : 'iv-a'
  const off = still ? undefined : 'iv-a iv-fade-out'
  return (
    <div className="iv-real mx-auto w-full max-w-[760px]">
      <div className="aspect-[16/9] w-full">
        <svg {...svgProps} viewBox="0 0 560 300">
          <rect x="232" y="64" width="96" height="164" rx="18" fill="#ffffff" fillOpacity="0.92"
            stroke="#8eb0b6" strokeWidth="1.6" className={cn(a, !still && 'iv-lift')}
            style={still ? undefined : { '--d': '.6s', '--t': '.3s' }}/>
          <g className={cn(a, !still && 'iv-fade')}
            style={still ? undefined : { '--d': '.5s', '--t': '.8s' }}>
            <text x="280" y="148" textAnchor="middle" fontSize="40" fontWeight="700"
              className="font-display fill-ink">64</text>
          </g>
          <Chip x="280" y="254" t={1.1} still={still} size={17}>You</Chip>

          <Card x={22} y={102} w={150} h={88} t={1.6} still={still}/>
          <Chip x="97" y="152" t={2.0} still={still} size={19}>Parent</Chip>

          {/* the medical professional's card is the one that goes */}
          <g className={off} style={still ? undefined : { '--d': '.7s', '--t': '7.4s' }}>
            <Card x={388} y={102} w={150} h={88} t={2.0} still={still}/>
            <Chip x="463" y="152" t={2.4} still={still} size={19}>Medical Professional</Chip>
          </g>

          <Arrow still={still} t={3.2} dur={0.7} d="M224 138 L 186 140" len={50}
            x={182} y={140} deg={183} color="#1f5560" w={2.2}/>
          <g className={off} style={still ? undefined : { '--d': '.7s', '--t': '7.4s' }}>
            <Arrow still={still} t={4.0} dur={0.7} d="M336 138 L 374 140" len={50}
              x={378} y={140} deg={3} color="#1f5560" w={2.2}/>
          </g>

          <g className={cn(a, !still && 'iv-lift')}
            style={still ? undefined : { '--d': '.55s', '--t': '5.2s' }}>
            <rect x="424" y="212" width="78" height="38" rx="19" fill="#0a6e68"
              className={cn(!still && 'iv-a iv-switch')}
              style={still ? undefined : { '--d': '.6s', '--t': '6.9s' }}/>
            <circle cx="483" cy="231" r="14" fill="#ffffff"
              className={cn(!still && 'iv-a iv-knob')}
              style={still ? undefined : { '--d': '.6s', '--t': '6.9s' }}/>
          </g>
          <Spot cx={463} cy={231} r={52} t={6.6} still={still}/>
          <Chip x="463" y="286" t={5.7} still={still} size={16} tone="fill-ink-2">
            you switch it off
          </Chip>
        </svg>
      </div>
    </div>
  )
}

function StageMark({ still }) {
  const a = still ? undefined : 'iv-a'
  return (
    <div className="mx-auto flex h-full w-full max-w-[820px] flex-col items-center justify-center">
      <div className="mx-auto aspect-[16/9] w-[min(100%,500px)]">
        <svg {...svgProps} viewBox="0 0 480 270">
          {/* the chart furniture, present only while the line is a day */}
          {!still && (
            <g className="iv-a iv-fade-out" style={{ '--d': '.4s', '--t': '1.55s' }}>
              {/* --t is restated at every level: custom properties inherit,
                  so a child that omits it adopts the group's 1.55s cue. */}
              <line x1="40" y1="226" x2="440" y2="226" strokeWidth="1.25"
                className="stroke-ink-3 iv-a iv-draw" style={{ '--len': 402, '--d': '.5s', '--t': '0s' }} />
              {HOURS.map(([h, x], i) => (
                <g key={h} className="iv-a iv-rise" style={{ '--d': '.4s', '--t': `${0.25 + i * 0.07}s` }}>
                  <line x1={x} y1="226" x2={x} y2="234" strokeWidth="1.25" className="stroke-ink-3" />
                  <text x={x} y="252" textAnchor="middle" fontSize="16"
                    className="font-mono fill-ink-2">{h}</text>
                </g>
              ))}
              <circle cx="419.1" cy="199.8" r="6.5" fill="#11677f" className="iv-a iv-pop"
                style={{ '--d': '.35s', '--t': '1.15s' }} />
            </g>
          )}

          <g className={cn(a, !still && 'iv-morph')} style={still
            ? { transform: 'translate(136px,125.2px) scale(5.2)', transformBox: 'view-box',
                transformOrigin: '0 0', strokeWidth: 0.5 }
            : { '--d': '1s', '--t': '1.55s', transformBox: 'view-box', transformOrigin: '0 0' }}>
            <rect x="2" y="4" width="36" height="20" rx="10" fill="none" stroke="#0b2b33"
              className={cn(a, !still && 'iv-draw')}
              style={still ? undefined : { '--len': 96, '--d': '.8s', '--t': '2.3s' }} />
            <path d={RIDGE} fill="none" stroke="#11677f" strokeLinecap="round" strokeLinejoin="round"
              className={cn(a, !still && 'iv-draw')}
              style={still ? undefined : { '--len': 33, '--d': '1.3s', '--t': '.15s' }} />
            <circle cx="29.5" cy="17.6" r="2.4" fill="#11677f" strokeWidth="0"
              className={cn(a, !still && 'iv-pop')}
              style={still ? undefined : { '--d': '.4s', '--t': '3s' }} />
          </g>
        </svg>
      </div>

      {/* beam-ink, not text-beam: beam measures 2.69 here. The wordmark is
          36px or larger, so 3.96 clears the 3 : 1 large-text bar. */}
      <p className={cn(a, !still && 'iv-rise', 'mt-2 font-display text-view font-bold tracking-tight text-ink')}
        style={still ? undefined : { '--d': '.6s', '--t': '3.15s' }}>
        Mind<span className="text-beam-ink">Map</span>
      </p>

      {/* The four signal hues, in the arch's order; names from lib/sensors.js. */}
      <ul className={cn(a, !still && 'iv-rise',
        'm-0 mt-5 flex list-none flex-wrap items-center justify-center gap-x-5 gap-y-2 p-0')}
        style={still ? undefined : { '--d': '.6s', '--t': '3.5s' }}>
        {SENSOR_ORDER.map(id => (
          <li key={id} className="flex items-center gap-2">
            <span aria-hidden className="block h-2.5 w-2.5 rounded-chip"
              style={{ background: SENSORS[id].glow }}/>
            <span className="font-display text-ui font-medium text-ink">{SENSORS[id].name}</span>
          </li>
        ))}
      </ul>

    </div>
  )
}

const STAGES = [StageOneNumber, StagePatch, StageMarkOnDial, StageShare, StageMark]

/* Keyframes are local to this sequence, not the design system. The
   reduced-motion rule at the bottom of the sheet is the whole no-motion story. */
const CSS = `
/* Cue vocabulary. --t is when a mark starts and --d how long it takes, both
   relative to the start of its beat, both authored in seconds. --iv-pace and
   --iv-dur scale every cue from one place; .iv-real is the walkthrough stages,
   which run faster than the closing beat. */
.iv-root{--iv-pace:1;--iv-dur:1}
.iv-root .iv-real{--iv-pace:.62;--iv-dur:.82}
.iv-root .iv-a{animation-duration:calc(var(--d,1s) * var(--iv-dur,1));animation-delay:calc(var(--t,0s) * var(--iv-pace,1));animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.3,1)}
/* --len must be >= the real path length or the stroke never finishes drawing. */
.iv-root .iv-draw{stroke-dasharray:var(--len);stroke-dashoffset:0;animation-name:iv-draw}
.iv-root .iv-rise{animation-name:iv-rise}
.iv-root .iv-pop{transform-box:fill-box;transform-origin:center;animation-name:iv-pop}
.iv-root .iv-fade{animation-name:iv-fade}
.iv-root .iv-fade-out{animation-name:iv-fade-out}
.iv-root .iv-morph{animation-name:iv-morph;animation-timing-function:cubic-bezier(.55,0,.25,1)}
.iv-root .iv-stage{animation:iv-stage .55s cubic-bezier(.2,.7,.3,1) both}
.iv-root .iv-ring{transform-box:fill-box;transform-origin:center;animation-name:iv-ring}
.iv-root .iv-lift{animation-name:iv-lift}
/* Dots travelling a wire. One pass each, staggered by --t; a loop would still
   be moving while the next beat is being read. */
.iv-root .iv-run{offset-rotate:0deg;animation-name:iv-run;animation-iteration-count:1;animation-timing-function:cubic-bezier(.45,0,.55,1)}
.iv-root .iv-switch{animation-name:iv-switch}
.iv-root .iv-knob{animation-name:iv-knob}
.iv-root .iv-out{animation:iv-out ${OUT_MS}ms cubic-bezier(.55,0,.25,1) both}
@keyframes iv-draw{from{stroke-dashoffset:var(--len)}}
@keyframes iv-rise{from{opacity:0;transform:translateY(10px)}}
@keyframes iv-pop{from{opacity:0;transform:scale(.35)}}
@keyframes iv-fade{from{opacity:0}}
@keyframes iv-fade-out{from{opacity:1}to{opacity:0}}
@keyframes iv-ring{0%{opacity:0;transform:scale(.5)}30%{opacity:.95}100%{opacity:0;transform:scale(1.45)}}
@keyframes iv-lift{from{opacity:0;transform:translateY(18px)}}
@keyframes iv-run{0%{offset-distance:0%;opacity:0}12%{opacity:1}86%{opacity:1}100%{offset-distance:100%;opacity:0}}
@keyframes iv-switch{to{fill:#9fb9bd}}
@keyframes iv-knob{to{transform:translateX(-40px)}}
@keyframes iv-morph{from{transform:translate(-138.5px,-132.8px) scale(18.9);stroke-width:.18px}
to{transform:translate(136px,125.2px) scale(5.2);stroke-width:.5px}}
@keyframes iv-stage{from{opacity:0;transform:translateY(16px)}}
@keyframes iv-out{to{opacity:0;transform:translateY(-14px)}}
/* Reduced motion: no animation at all. Every stage renders its finished state,
   so the sequence is still readable. */
@media (prefers-reduced-motion:reduce){.iv-root [class*="iv-"]{animation:none !important}}
`

export function Intro({ onDone }) {
  const reduced = useReducedMotion()
  const [beat, setBeat] = React.useState(0)
  const [leaving, setLeaving] = React.useState(false)
  const [exiting, setExiting] = React.useState(false)
  const rootRef = React.useRef(null)
  const skipRef = React.useRef(null)
  const prevRef = React.useRef(null)
  const nextRef = React.useRef(null)
  /* When the beat now playing began. Zero means "re-anchor on the next frame",
     which is how a jump hands the beat it lands on that beat's whole dwell. */
  const startRef = React.useRef(0)
  const fills = React.useRef([])
  const beatRef = React.useRef(0)
  const leaveRef = React.useRef(false)
  const doneRef = React.useRef(false)
  const timerRef = React.useRef(0)

  /* The latch is a ref, not state: a skip landing on the frame the timeline ends,
     or an exit timer resolving after unmount, must not fire onDone twice. */
  const finish = React.useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onDone?.()
  }, [onDone])

  const close = React.useCallback(ms => {
    if (doneRef.current || timerRef.current) return
    setExiting(true)
    timerRef.current = setTimeout(finish, ms)
  }, [finish])

  /* The only thing that suppresses the sequence, hence not in `finish`. */
  const skip = React.useCallback(() => {
    suppressIntro()
    close(SKIP_MS)
  }, [close])

  /* A jump re-anchors the beat timer. Next past the last beat ends the sequence,
     and that is not Skip: reaching the end suppresses nothing. */
  const goTo = React.useCallback(i => {
    if (doneRef.current || timerRef.current) return
    if (i > LAST) { close(EXIT_MS); return }
    const n = Math.max(0, Math.min(LAST, i))
    if (n === beatRef.current) return
    beatRef.current = n
    startRef.current = 0
    leaveRef.current = false
    setLeaving(false)
    setBeat(n)
  }, [close])

  const goNext = React.useCallback(() => goTo(beatRef.current + 1), [goTo])
  const goPrev = React.useCallback(() => goTo(beatRef.current - 1), [goTo])

  /* Boundaries come off the frame timestamp, so a dropped frame or a backgrounded
     tab cannot leave the headline and the rail disagreeing. Under reduced motion
     it does not run at all: every beat renders finished, Back/Next are the clock. */
  React.useEffect(() => {
    if (reduced) return
    let raf = 0
    startRef.current = 0
    const tick = t => {
      if (!startRef.current) startRef.current = t
      const i = beatRef.current
      const dur = BEATS[i].ms
      const e = t - startRef.current
      const p = Math.min(1, e / dur)
      /* Straight to the DOM: this runs 60x a second for a decorative rail. */
      fills.current.forEach((el, k) => {
        if (el) el.style.transform = `scaleX(${k < i ? 1 : k === i ? p : 0})`
      })
      /* The stage clears before the beat ends. Two state writes per beat. */
      const out = i < LAST && e > dur - OUT_MS
      if (out !== leaveRef.current) { leaveRef.current = out; setLeaving(out) }
      if (e >= dur) {
        if (i >= LAST) { close(EXIT_MS); return }
        beatRef.current = i + 1
        startRef.current = t
        leaveRef.current = false
        setLeaving(false)
        setBeat(i + 1)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, close])

  React.useEffect(() => () => clearTimeout(timerRef.current), [])

  /* Scroll lock, and the document taken out of the accessibility tree. Siblings
     are walked from this node up because the caller decides where this mounts,
     and their previous aria-hidden values are restored, not removed. */
  React.useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const touched = []
    for (let el = rootRef.current; el && el !== document.body; el = el.parentElement) {
      for (const sib of Array.from(el.parentElement?.children || [])) {
        if (sib === el || sib.tagName === 'SCRIPT' || sib.tagName === 'STYLE') continue
        touched.push([sib, sib.getAttribute('aria-hidden')])
        sib.setAttribute('aria-hidden', 'true')
      }
    }
    rootRef.current?.focus({ preventScroll: true })
    /* Focus has to be held, not just taken: this app focuses its main region from
       a rAF that runs after this effect, which pulled the keyboard out of the
       dialog and left Esc and the tab trap doing nothing. */
    const onFocusIn = e => {
      const el = rootRef.current
      if (el && !el.contains(e.target)) el.focus({ preventScroll: true })
    }
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.body.style.overflow = prev
      touched.forEach(([el, was]) =>
        was === null ? el.removeAttribute('aria-hidden') : el.setAttribute('aria-hidden', was))
    }
  }, [])

  /* Tab walks Back, Skip, Next and wraps; Back leaves the ring on the first beat,
     where it is disabled. Arrows mirror the buttons. Esc is Skip. */
  const ring = () =>
    [prevRef.current, skipRef.current, nextRef.current].filter(el => el && !el.disabled)

  const onKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); skip() }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext() }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev() }
    else if (e.key === 'Tab') {
      e.preventDefault()
      const els = ring()
      if (!els.length) return
      const at = els.indexOf(document.activeElement)
      const to = at < 0 ? 0 : (at + (e.shiftKey ? -1 : 1) + els.length) % els.length
      els[to].focus()
    }
  }

  const Stage = STAGES[beat]
  const b = BEATS[beat]

  return (
    <div ref={rootRef} tabIndex={-1} onKeyDown={onKey}
      role="dialog" aria-modal="true" aria-label="Introduction to MindMap"
      style={{ background: BEATS[beat]?.bg || '#0b2b33',
        transition: `background ${FADE_MS}ms cubic-bezier(0.4,0,0.2,1)` }}
      /* Belt and braces: an oversized drawing must not push the words off. */
      onScroll={e => { e.currentTarget.scrollLeft = 0 }}
      className={cn('iv-root fixed inset-0 z-[400] flex flex-col overflow-hidden outline-none',
        'transition-opacity duration-[480ms] ease-out', exiting ? 'opacity-0' : 'opacity-100')}>
      <style>{CSS}</style>

      {/* The arch is the only transition between beats. Off entirely for the
          dial, where no opacity makes two concentric arches read as one. */}
      {beat !== 3 && (
        <div aria-hidden className="pointer-events-none absolute inset-0 transition-opacity
          duration-[900ms]" style={{ opacity: beat === LAST ? 1 : 0.26 }}>
          <IntroSky beat={beat} count={BEATS.length}/>
        </div>
      )}

      {/* Its own node, so the visible headline is not announced twice. */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">{b.head + (b.sub ? ' ' + b.sub : '')}</p>

      {/* ── the frame, top: wordmark, beat number, and the rail ───────────── */}
      <div className="relative z-10 shrink-0">
        {/* --logo-peak on a wrapper: Logo takes no style prop. tone="paper" is
            the light-ground lockup, accent #0a6e68 at 4.64 : 1. */}
        <div aria-hidden style={PEAK}
          className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4
            px-5 py-3 text-ink sm:px-10 sm:py-4">
          <Logo tone="paper" className="text-ui sm:text-head"/>
          <span className="flex items-center gap-1.5">
            {BEATS.map((_, i) => (
              <span key={i} className={cn('block h-[3px] w-4',
                i === beat ? 'bg-accent' : i < beat ? 'bg-ink/35' : 'bg-ink/15')}/>
            ))}
          </span>
        </div>
        {!reduced && (
          <div className="flex h-[3px] w-full gap-px" role="progressbar"
            aria-label="Introduction progress" aria-valuemin={1}
            aria-valuemax={BEATS.length} aria-valuenow={beat + 1}>
            {BEATS.map((_, i) => (
              <span key={i} className="block h-full flex-1 overflow-hidden bg-ink/10">
                <span ref={el => { fills.current[i] = el }}
                  className="block h-full w-full origin-left bg-accent"
                  style={{ transform: 'scaleX(0)' }} />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── the stage ─────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <div key={beat} className={cn('mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col',
          'justify-center gap-4 px-5 py-5 sm:gap-6 sm:px-10 sm:py-7', leaving && 'iv-out')}>
          <div className="iv-stage flex min-h-0 flex-1 flex-col justify-center gap-4 sm:gap-6">
            <div aria-hidden className="shrink-0">
              <span className="mb-3 flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  {BEATS.map((_, i) => (
                    <span key={i} className={cn('block size-1.5 rounded-chip',
                      i === beat ? 'bg-accent' : 'bg-ink/20')}/>
                  ))}
                </span>
              </span>
              {beat < LAST && (
                <>
                  <p className="iv-a iv-rise font-display text-sub font-bold text-ink"
                    style={{ '--d': '.7s' }}>{b.head}</p>
                  {/* 1s between head and sub; at 160ms they read as one block. */}
                  {b.sub && (
                    <p className="iv-a iv-rise mt-2.5 max-w-[52ch] text-sec text-ink-2 sm:mt-3 sm:text-body"
                      style={{ '--d': '.7s', '--t': '.9s' }}>{b.sub}</p>
                  )}
                </>
              )}
            </div>
            {/* overflow-hidden: a taller drawing bled over the head on beat 1. */}
            <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
              <Stage still={reduced}/>
            </div>
          </div>
        </div>

      </main>

      {/* ── the frame, bottom: the three controls ──────────────────────────── */}
      <div className="relative z-10 shrink-0 px-5 py-4 sm:px-10 sm:py-5">
        {/* Back and Next are the drawings' plate: ink on card at 85%, 11.8 : 1
            over the worst band behind them, 4.74 : 1 when Back dims to ink-3.
            Button's disabled state is opacity 45, which would take that label to
            about 2.4, so it is overridden to a colour. Skip is the one dark
            object. 54px tall, never narrower than 44. */}
        <div className="mx-auto flex w-full max-w-[660px] items-stretch justify-center gap-2 sm:gap-3">
          <Button ref={prevRef} onClick={goPrev} disabled={beat === 0}
            aria-label="Previous section"
            className="h-auto min-h-[54px] min-w-[44px] shrink-0 border border-rule bg-card/85 px-4
              font-display text-ui font-medium text-ink hoverOnly:bg-card active:bg-card
              disabled:opacity-100 disabled:text-ink-3 sm:px-6">
            Back
          </Button>
          <Button ref={skipRef} onClick={skip}
            className="flex h-auto min-h-[54px] w-full max-w-[430px] flex-col gap-0.5 bg-ink py-3
              text-paper hoverOnly:bg-ink-2 active:bg-ink-2">
            <span className="font-display text-ui font-medium">Skip the intro</span>
            <span className="font-body text-fine font-normal text-mist">
              and don&rsquo;t show it again on this device
            </span>
          </Button>
          <Button ref={nextRef} onClick={goNext} aria-label="Next section"
            className="h-auto min-h-[54px] min-w-[44px] shrink-0 border border-rule bg-card/85 px-4
              font-display text-ui font-medium text-ink hoverOnly:bg-card active:bg-card sm:px-6">
            Next
          </Button>
        </div>
        <p aria-hidden className="mx-auto mt-2.5 w-full text-center font-mono text-fine text-ink-3">
          Arrow keys move between sections. Esc skips.
        </p>
      </div>
    </div>
  )
}
