import React from 'react'
import { LampFaceG } from '../../traffic/Face'

/* The pictures in the "How to use" guides. Each is a 160 x 100 drawing of one
 * mechanism, small enough to read at 124px wide on a phone. They are
 * decorative: the caption beside each one carries the meaning, so every
 * drawing is aria-hidden.
 *
 * Motion is CSS keyframes on transform and opacity only (MOTION_CSS below).
 * Each animated element's resting style is the state worth seeing when motion
 * is off, so a reduced-motion reader gets a finished picture, not frame one. */

const C = {
  ink: '#0d2b1e', ink2: '#2a5744', ink3: '#426a58', rule: '#c2d7ca', ruling: '#93b2a1',
  mist: '#e3ede7', card: '#ffffff', paper: '#f7faf8',
  accent: '#157446', lit: '#3ecf9a', accentWash: '#dcefe4',
  beam: '#1d8fb0', beamInk: '#11677f', beamWash: '#ddf0f8',
  sky: '#2294e6', skyWash: '#def0fc',
  coral: '#f25424', coralWash: '#ffe8e0',
  sun: '#b5871b', sunWash: '#f5ecd7', gold: '#f2b632',
  mint: '#18a370', mintWash: '#d5f2e8',
  lilac: '#a024f2', lilacWash: '#f6e8ff',
  blush: '#f2248b', crit: '#a8321f',
  skin: '#efd2bd', skinEdge: '#b98d72',
}
const FONT = 'Chivo, -apple-system, system-ui, sans-serif'

export const MOTION_CSS = `
.ht-svg .ht-a{transform-box:fill-box;transform-origin:center}
.ht-a{animation-iteration-count:infinite;animation-timing-function:cubic-bezier(.2,.7,.3,1);animation-fill-mode:both}
@keyframes ht-pulse{0%,100%{opacity:.2}50%{opacity:1}}
.ht-pulse{animation-name:ht-pulse;animation-duration:2.4s}
@keyframes ht-bob{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
.ht-bob{animation-name:ht-bob;animation-duration:2.4s}
@keyframes ht-ripple{0%,30%{transform:scale(.4);opacity:0}38%{opacity:.9}75%,100%{transform:scale(1.9);opacity:0}}
.ht-ripple{opacity:0;animation-name:ht-ripple;animation-duration:2.4s}
@keyframes ht-tap{0%,100%{transform:translateY(9px)}32%,46%{transform:translateY(0)}}
.ht-tap{animation-name:ht-tap;animation-duration:2.4s}
@keyframes ht-in{0%{opacity:0;transform:translateY(6px)}10%,84%{opacity:1;transform:none}94%,100%{opacity:0;transform:none}}
.ht-in{animation-name:ht-in;animation-duration:5s}
@keyframes ht-breathe{0%,100%{transform:scale(.6)}42%,56%{transform:scale(1)}}
.ht-breathe{transform:scale(.85);animation-name:ht-breathe;animation-duration:7s;animation-timing-function:cubic-bezier(.45,.05,.55,.95)}
@keyframes ht-needle{0%,6%{transform:rotate(-90deg)}46%,86%{transform:rotate(40deg)}100%{transform:rotate(-90deg)}}
.ht-needle{transform:rotate(40deg);animation-name:ht-needle;animation-duration:4.8s}
@keyframes ht-scroll{from{transform:translateX(0)}to{transform:translateX(-40px)}}
.ht-scroll{animation-name:ht-scroll;animation-duration:1.4s;animation-timing-function:linear}
@keyframes ht-press{0%,100%{transform:translateY(-12px)}25%,80%{transform:translateY(0)}}
.ht-press{animation-name:ht-press;animation-duration:4s}
@keyframes ht-knob{0%,22%{transform:translateX(0)}36%,84%{transform:translateX(-10px)}96%,100%{transform:translateX(0)}}
.ht-knob{transform:translateX(-10px);animation-name:ht-knob;animation-duration:4.4s}
@keyframes ht-show{0%,22%{opacity:0}36%,84%{opacity:1}96%,100%{opacity:0}}
.ht-show{opacity:1;animation-name:ht-show;animation-duration:4.4s}
@keyframes ht-dim{0%,22%{opacity:1}36%,84%{opacity:.22}96%,100%{opacity:1}}
.ht-dim{opacity:.22;animation-name:ht-dim;animation-duration:4.4s}
@keyframes ht-f1{0%,28%{opacity:1}33%,95%{opacity:0}100%{opacity:1}}
@keyframes ht-f2{0%,28%{opacity:0}33%,61%{opacity:1}66%,100%{opacity:0}}
@keyframes ht-f3{0%,61%{opacity:0}66%,95%{opacity:1}100%{opacity:0}}
.ht-f1{animation-name:ht-f1;animation-duration:6s}
.ht-f2{opacity:0;animation-name:ht-f2;animation-duration:6s}
.ht-f3{opacity:0;animation-name:ht-f3;animation-duration:6s}
@keyframes ht-seg{0%,28%{transform:translateX(0)}33%,61%{transform:translateX(40px)}66%,95%{transform:translateX(80px)}100%{transform:translateX(0)}}
.ht-seg{animation-name:ht-seg;animation-duration:6s}
@keyframes ht-hop{0%,26%{transform:translate(0,0)}33%,59%{transform:translate(48px,0)}66%,92%{transform:translate(72px,24px)}100%{transform:translate(0,0)}}
.ht-hop{animation-name:ht-hop;animation-duration:6s}
@keyframes ht-tabs{0%,16%{transform:translateX(0)}20%,36%{transform:translateX(26px)}40%,56%{transform:translateX(52px)}60%,76%{transform:translateX(78px)}80%,96%{transform:translateX(104px)}100%{transform:translateX(0)}}
.ht-tabs{animation-name:ht-tabs;animation-duration:7s}
@keyframes ht-fill{0%,8%{transform:scaleX(0)}48%,88%{transform:scaleX(1)}100%{transform:scaleX(0)}}
.ht-fill{transform-origin:0 50%;animation-name:ht-fill;animation-duration:4.4s}
@keyframes ht-grow{0%,8%{transform:scaleY(.15)}40%,88%{transform:scaleY(1)}100%{transform:scaleY(.15)}}
.ht-grow{transform-origin:50% 100%;animation-name:ht-grow;animation-duration:4.4s}
@keyframes ht-pop{0%,44%{transform:scale(0)}54%{transform:scale(1.18)}62%,90%{transform:scale(1)}100%{transform:scale(0)}}
.ht-pop{animation-name:ht-pop;animation-duration:4.4s}
@keyframes ht-travel{0%{transform:translateX(0);opacity:0}10%{opacity:1}55%{transform:translateX(62px);opacity:1}66%,100%{transform:translateX(62px);opacity:0}}
.ht-travel{transform:translateX(31px);animation-name:ht-travel;animation-duration:3.2s}
@keyframes ht-swap{0%,40%{transform:translateX(0)}50%,90%{transform:translateX(60px)}100%{transform:translateX(0)}}
.ht-swap{animation-name:ht-swap;animation-duration:5s}
@keyframes ht-swing{0%,40%{transform:rotate(30deg)}50%,90%{transform:rotate(-34deg)}100%{transform:rotate(30deg)}}
.ht-swing{transform:rotate(30deg);animation-name:ht-swing;animation-duration:5s}
@keyframes ht-path{0%,8%{transform:translate(0,0);opacity:0}14%{opacity:1}40%{transform:translate(44px,0)}70%,86%{transform:translate(92px,-22px);opacity:1}100%{transform:translate(92px,-22px);opacity:0}}
.ht-path{transform:translate(92px,-22px);animation-name:ht-path;animation-duration:4.4s}
.ht-still .ht-a{animation:none!important}
@media (prefers-reduced-motion: reduce){.ht-svg .ht-a{animation:none!important}}
`

/* ── pieces ─────────────────────────────────────────────────────────────── */

const a = (name, delay) => ({
  className: 'ht-a ' + name,
  style: delay ? { animationDelay: delay + 's' } : undefined,
})

function Svg({ children }) {
  return (
    <svg viewBox="0 0 160 100" aria-hidden="true" focusable="false"
      className="ht-svg block h-full w-full" preserveAspectRatio="xMidYMid meet">
      {children}
    </svg>
  )
}

/* A head and shoulders, centred on (x, y). */
function Person({ x, y, s = 1, fill, ring }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {ring && <circle cy="0" r="17" fill="none" stroke={ring} strokeWidth="2.4"/>}
      <circle cy="-5" r="6" fill={fill}/>
      <path d="M-10 12a10 10 0 0 1 20 0z" fill={fill}/>
    </g>
  )
}

/* The person with a small cross badge: a Medical Professional. */
function Medic({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Person x={0} y={0} fill={C.beam}/>
      <rect x="4" y="-16" width="11" height="11" rx="3" fill={C.card} stroke={C.beam} strokeWidth="1.2"/>
      <path d="M9.5 -13.5v6M6.5 -10.5h6" stroke={C.beam} strokeWidth="1.8" strokeLinecap="round"/>
    </g>
  )
}

/* A fingertip whose tip sits on (x, y), pointing up-left. */
function Finger({ x, y, rot = -24, tap = true, delay }) {
  const p = tap ? a('ht-tap', delay) : {}
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <g {...p}>
        <rect x="-6.5" y="0" width="13" height="40" rx="6.5" fill={C.skin} stroke={C.skinEdge} strokeWidth="1"/>
        <rect x="-4" y="2.5" width="8" height="8" rx="3.5" fill="#fff" opacity=".6"/>
      </g>
    </g>
  )
}

function Ripple({ x, y, r = 8, color = C.accent, delay }) {
  return <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth="2" {...a('ht-ripple', delay)}/>
}

/* A switch. Animated, it flips from on to off and back. */
function Toggle({ x, y, anim = false, on = true }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="24" height="13" rx="6.5" fill={on ? C.accent : C.ruling}/>
      {anim && <rect width="24" height="13" rx="6.5" fill={C.ruling} {...a('ht-show')}/>}
      <g {...(anim ? a('ht-knob') : {})}>
        <circle cx={on ? 17.5 : 6.5} cy="6.5" r="4.6" fill={C.card}/>
      </g>
    </g>
  )
}

function Lines({ x, y, w = [40, 30], gap = 6, color = C.ink3, sw = 2.4, op = 0.55 }) {
  return (
    <g stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={op}>
      {w.map((len, i) => <path key={i} d={`M${x} ${y + i * gap}h${len}`}/>)}
    </g>
  )
}

function Phone({ x, y, w, h, fill = C.card, children }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="9" fill={fill} stroke={C.ink2} strokeWidth="1.6"/>
      {children}
    </g>
  )
}

function Bubble({ x, y, w, h, fill, stroke, tail = 'left', children, anim }) {
  const tx = tail === 'left' ? x + 8 : x + w - 8
  const d = tail === 'left' ? `M${tx} ${y + h - 1}l-5 7 11-7z` : `M${tx} ${y + h - 1}l5 7-11-7z`
  return (
    <g {...(anim || {})}>
      <path d={d} fill={fill} stroke={stroke} strokeWidth={stroke ? 1.2 : 0}/>
      <rect x={x} y={y} width={w} height={h} rx="8" fill={fill} stroke={stroke} strokeWidth={stroke ? 1.2 : 0}/>
      {stroke && <path d={`M${tx - 5} ${y + h - 0.6}h10`} stroke={fill} strokeWidth="2"/>}
      {children}
    </g>
  )
}

function PatchShape({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-6" y="-34" width="12" height="8" rx="3" fill={C.paper} stroke={C.ruling} strokeWidth="1"/>
      <ellipse rx="22" ry="30" fill={C.card} stroke={C.ruling} strokeWidth="1.6"/>
      <ellipse rx="16" ry="23" fill="none" stroke={C.rule} strokeWidth="1"/>
      <circle cy="12" r="2.6" fill={C.lit}/>
    </g>
  )
}

function Check({ x, y, r = 8, fill = C.accent }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={fill}/>
      <path d={`M${-r * 0.42} 0l${r * 0.3} ${r * 0.32} ${r * 0.55}-${r * 0.62}`}
        fill="none" stroke="#fff" strokeWidth={r * 0.24} strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  )
}

function Lock({ x, y, s = 1, color = C.ink2 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-4 -2v-3a4 4 0 0 1 8 0v3" fill="none" stroke={color} strokeWidth="1.8"/>
      <rect x="-6" y="-2" width="12" height="9" rx="2" fill={color}/>
    </g>
  )
}

/* Notes, Location, raw readings: the three things a parent never sees. */
const NoteGlyph = ({ x, y, c }) => (
  <g transform={`translate(${x} ${y})`} fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round">
    <rect x="-5" y="-6" width="10" height="12" rx="1.5"/><path d="M-2.5 -2h5M-2.5 1h5M-2.5 4h3"/>
  </g>
)
const PinGlyph = ({ x, y, c }) => (
  <g transform={`translate(${x} ${y})`} fill="none" stroke={c} strokeWidth="1.6">
    <path d="M0 7c-4-5-6-7.5-6-10.5a6 6 0 0 1 12 0c0 3-2 5.5-6 10.5z"/><circle cy="-3.5" r="2"/>
  </g>
)
const WaveGlyph = ({ x, y, c }) => (
  <path transform={`translate(${x} ${y})`} d="M-7 0h3l2-5 3 10 2-5h4" fill="none" stroke={c}
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
)

/* A repeating pulse trace, period 40, from x0 to x1 on baseline y. */
function pulsePath(x0, x1, y) {
  let d = `M${x0} ${y}`
  for (let x = x0; x < x1; x += 40) {
    d += `h12l3-6 3 6h3l3-22 4 34 3-14h3l3-4 3 4h3`
  }
  return d
}

/* ── the pictures ───────────────────────────────────────────────────────── */

function Patch() {
  return (
    <Svg>
      <PatchShape x={50} y={54} s={1.05}/>
      <g fill="none" stroke={C.beam} strokeWidth="2.4" strokeLinecap="round">
        {[12, 20, 28].map((r, i) => (
          <path key={r} d={`M${78 + r * 0.2} ${50 - r * 0.7}a${r} ${r} 0 0 1 0 ${r * 1.4}`}
            {...a('ht-pulse', i * 0.3)}/>
        ))}
      </g>
      <Phone x={112} y={22} w={34} h={60}>
        <rect x="117" y="28" width="24" height="5" rx="2.5" fill={C.mist}/>
        <g {...a('ht-pop', 0.2)}><Check x={129} y={54} r={9}/></g>
      </Phone>
    </Svg>
  )
}

function Cards() {
  const tiles = [
    [58, 18, C.mintWash, C.mint], [84, 18, C.skyWash, C.sky],
    [58, 50, C.coralWash, C.coral], [84, 50, C.lilacWash, C.lilac],
  ]
  return (
    <Svg>
      <Phone x={50} y={6} w={60} h={90}>
        {tiles.map(([x, y, wash, hue]) => (
          <g key={x + '.' + y}>
            <rect x={x} y={y} width="22" height="28" rx="5" fill={wash}/>
            <rect x={x + 4} y={y + 4} width="8" height="8" rx="2.5" fill={hue}/>
            <path d={`M${x + 4} ${y + 21}h13`} stroke={hue} strokeWidth="2.2" strokeLinecap="round" opacity=".7"/>
          </g>
        ))}
        <rect x="58" y="82" width="48" height="6" rx="3" fill={C.mist}/>
      </Phone>
      <Ripple x={95} y={32} r={7} color={C.sky}/>
      <Finger x={96} y={34} rot={-32}/>
    </Svg>
  )
}

function TabBar() {
  return (
    <Svg>
      <rect x="18" y="10" width="124" height="42" rx="8" fill={C.card} stroke={C.rule}/>
      <Lines x={28} y={22} w={[60, 80, 44]} gap={8}/>
      <rect x="14" y="60" width="132" height="30" rx="10" fill={C.ink}/>
      <g {...a('ht-tabs')}>
        <rect x="19" y="66" width="18" height="18" rx="6" fill={C.lit}/>
      </g>
      {[28, 54, 80, 106, 132].map((x, i) => (
        <g key={x} transform={`translate(${x} 75)`} fill="none" stroke={C.mist} strokeWidth="1.7"
          strokeLinecap="round" strokeLinejoin="round">
          {i === 0 && <path d="M-6 1h3l2-5 3 9 2-4h3"/>}
          {i === 1 && <path d="M-6 3a6 6 0 0 1 12 0M0 3l3-4"/>}
          {i === 2 && <><rect x="-5.5" y="-5" width="11" height="10" rx="1.5"/><path d="M-5.5 -1.5h11"/></>}
          {i === 3 && <path d="M-2 -6h-4v12h4M2 -6h4v12h-4"/>}
          {i === 4 && <><path d="M-6 -4h12v7h-7l-3 3v-3h-2z"/></>}
        </g>
      ))}
    </Svg>
  )
}

function ThreeWays() {
  const xs = [8, 58, 108]
  return (
    <Svg>
      {xs.map((x, i) => (
        <rect key={x} x={x} y="16" width="44" height="64" rx="9" fill={C.card} stroke={C.rule}/>
      ))}
      {['ht-f1', 'ht-f2', 'ht-f3'].map((f, i) => (
        <rect key={f} x={xs[i] - 2} y="14" width="48" height="68" rx="11" fill="none"
          stroke={C.accent} strokeWidth="2.6" {...a(f)}/>
      ))}
      <PatchShape x={30} y={50} s={0.6}/>
      <g>
        <rect x="68" y="26" width="24" height="44" rx="6" fill={C.ink2}/>
        <circle cx="75" cy="34" r="4.5" fill={C.ink} stroke={C.mist} strokeWidth="1.2"/>
        <circle cx="85" cy="33" r="2" fill={C.gold}/>
      </g>
      <g>
        {[30, 42, 54, 66].map((y, i) => (
          <g key={y}>
            <rect x="116" y={y - 3.5} width="7" height="7" rx="2" fill={i < 3 ? C.mint : C.mist}/>
            <path d={`M127 ${y}h16`} stroke={C.ink3} strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
          </g>
        ))}
      </g>
    </Svg>
  )
}

function FingerCam() {
  return (
    <Svg>
      <defs>
        <clipPath id="ht-wave-clip"><rect x="76" y="26" width="76" height="48" rx="8"/></clipPath>
      </defs>
      <rect x="12" y="10" width="46" height="82" rx="10" fill={C.ink2}/>
      <circle cx="28" cy="27" r="8" fill={C.ink} stroke={C.mist} strokeWidth="1.4"/>
      <circle cx="44" cy="24" r="3" fill={C.gold}/>
      <circle cx="28" cy="27" r="13" fill={C.coral} {...a('ht-pulse')}/>
      <g {...a('ht-press')}>
        <path d="M18 -2h20v22a10 10 0 0 1-20 0z" fill={C.skin} stroke={C.skinEdge} strokeWidth="1"/>
        <path d="M22 18a6 6 0 0 0 12 0" fill="none" stroke="#fff" strokeWidth="2" opacity=".55"/>
      </g>
      <rect x="76" y="26" width="76" height="48" rx="8" fill={C.card} stroke={C.rule}/>
      <g clipPath="url(#ht-wave-clip)">
        <g {...a('ht-scroll')}>
          <path d={pulsePath(76, 200, 54)} fill="none" stroke={C.coral} strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </g>
      <path d="M62 50h9m-4-4 4 4-4 4" fill="none" stroke={C.ink3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}

const RAINBOW = [C.coral, C.gold, C.mint, C.sky, C.lilac]

function Dial() {
  const cx = 80, cy = 86
  return (
    <Svg>
      {RAINBOW.map((c, i) => {
        const r = 66 - i * 9
        return <path key={c} d={`M${cx - r} ${cy}a${r} ${r} 0 0 1 ${r * 2} 0`} fill="none"
          stroke={c} strokeWidth="6.5" strokeLinecap="round" opacity=".9"/>
      })}
      {/* your usual: a dashed tick on the outside of the arc */}
      <g transform={`rotate(18 ${cx} ${cy})`}>
        <path d={`M${cx} ${cy - 72}v-9`} stroke={C.ink3} strokeWidth="2" strokeDasharray="2 2"/>
      </g>
      <g {...a('ht-needle')}>
        <circle cx={cx} cy={cy} r="76" fill="none"/>
        <path d={`M${cx} ${cy - 74}l-5.5-9h11z`} fill={C.ink}/>
      </g>
      <text x={cx} y={cy - 6} textAnchor="middle" fontFamily="Quicksand, system-ui, sans-serif"
        fontWeight="700" fontSize="24" fill={C.ink}>72</text>
    </Svg>
  )
}

function Range() {
  const sets = [
    [30, 52, 40, 64, 46, 58, 36],
    [44, 60, 34, 50, 62, 40, 54],
    [56, 38, 48, 66, 42, 52, 60],
  ]
  return (
    <Svg>
      <rect x="20" y="6" width="120" height="18" rx="9" fill={C.mist}/>
      <g {...a('ht-seg')}>
        <rect x="21.5" y="7.5" width="37" height="15" rx="7.5" fill={C.card} stroke={C.beam} strokeWidth="1.4"/>
      </g>
      {['Day', 'Week', 'Month'].map((t, i) => (
        <text key={t} x={40 + i * 40} y="18.4" textAnchor="middle" fontFamily={FONT} fontSize="8"
          fontWeight="700" fill={C.ink2}>{t}</text>
      ))}
      <path d="M18 92h124" stroke={C.rule} strokeWidth="1.4"/>
      {sets.map((set, k) => (
        <g key={k} {...a(['ht-f1', 'ht-f2', 'ht-f3'][k])}>
          {set.map((h, i) => (
            <rect key={i} x={24 + i * 17} y={92 - h} width="10" height={h} rx="3"
              fill={i === 3 ? C.beam : C.beamWash} stroke={C.beam} strokeWidth="1"/>
          ))}
        </g>
      ))}
    </Svg>
  )
}

function Faces() {
  const row = [['green', 38], ['yellow', 80], ['red', 122]]
  return (
    <Svg>
      {row.map(([l, x], i) => (
        <g key={l}>
          <ellipse cx={x} cy="84" rx="13" ry="3" fill={C.ink} opacity=".08"/>
          <g {...a('ht-bob', i * 0.35)}>
            <LampFaceG light={l} cx={x} cy={52} size={32} px={40}/>
          </g>
        </g>
      ))}
    </Svg>
  )
}

const CAL = [
  'green', 'green', 'yellow', 'green', 'green',
  'green', 'red', 'green', 'yellow', 'green',
  'green', 'green', 'green', 'green', 'yellow',
]

function Calendar() {
  const x0 = 22, y0 = 22, w = 24, h = 24
  return (
    <Svg>
      <rect x="16" y="6" width="128" height="90" rx="9" fill={C.card} stroke={C.rule}/>
      <path d="M16 15a9 9 0 0 1 9-9h110a9 9 0 0 1 9 9v3H16z" fill={C.beam}/>
      {CAL.map((l, i) => {
        const cx = x0 + (i % 5) * w + w / 2, cy = y0 + Math.floor(i / 5) * h + h / 2
        return <LampFaceG key={i} light={l} cx={cx} cy={cy} size={14} px={18}/>
      })}
      <g {...a('ht-hop')}>
        <rect x={x0 + 2} y={y0 + 1} width={w - 4} height={h - 2} rx="6" fill="none"
          stroke={C.ink} strokeWidth="2"/>
      </g>
    </Svg>
  )
}

function ToolPick() {
  return (
    <Svg>
      <rect x="10" y="20" width="42" height="60" rx="9" fill={C.mintWash} stroke={C.mint} strokeWidth="1.4"/>
      <circle cx="31" cy="44" r="12" fill="none" stroke={C.mint} strokeWidth="2.4"/>
      <circle cx="31" cy="44" r="6" fill={C.mint} {...a('ht-breathe')}/>
      <path d="M20 68h22" stroke={C.mint} strokeWidth="2.4" strokeLinecap="round"/>

      <rect x="59" y="14" width="42" height="60" rx="9" fill={C.lilacWash} stroke={C.lilac} strokeWidth="1.4"/>
      <path d="M70 32h20v18H70z" fill="none" stroke={C.lilac} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M80 32v18" stroke={C.lilac} strokeWidth="2"/>
      <path d="M69 62h22" stroke={C.lilac} strokeWidth="2.4" strokeLinecap="round"/>

      <rect x="108" y="22" width="42" height="60" rx="9" fill={C.sunWash} stroke={C.sun} strokeWidth="1.4"/>
      <path d="M129 34l3.6 7.4 8 1.1-5.8 5.6 1.4 8-7.2-3.8-7.2 3.8 1.4-8-5.8-5.6 8-1.1z" fill={C.gold}/>
      <path d="M118 70h22" stroke={C.sun} strokeWidth="2.4" strokeLinecap="round"/>

      <Ripple x={31} y={44} r={9} color={C.mint}/>
      <Finger x={33} y={47} rot={-30}/>
    </Svg>
  )
}

function Breathe() {
  return (
    <Svg>
      <circle cx="80" cy="50" r="42" fill={C.skyWash}/>
      <circle cx="80" cy="50" r="40" fill="none" stroke={C.sky} strokeWidth="1.4" strokeDasharray="3 4"/>
      <circle cx="80" cy="50" r="32" fill={C.sky} opacity=".9" {...a('ht-breathe')}/>
      <circle cx="80" cy="50" r="5" fill={C.card}/>
    </Svg>
  )
}

function Levels() {
  const rows = [[28, 0.9, C.mint], [50, 0.6, C.sky], [72, 0.35, C.gold]]
  return (
    <Svg>
      {rows.map(([y, f, c], i) => (
        <g key={y}>
          <rect x="16" y={y - 6} width="96" height="12" rx="6" fill={C.mist}/>
          <rect x="16" y={y - 6} width={96 * f} height="12" rx="6" fill={c} {...a('ht-fill', i * 0.25)}/>
        </g>
      ))}
      <g {...a('ht-pop')}>
        <circle cx="134" cy="50" r="16" fill={C.sunWash} stroke={C.gold} strokeWidth="2"/>
        <path d="M134 39l3.4 6.9 7.6 1.1-5.5 5.4 1.3 7.5-6.8-3.6-6.8 3.6 1.3-7.5-5.5-5.4 7.6-1.1z" fill={C.gold}/>
      </g>
    </Svg>
  )
}

function Chat() {
  return (
    <Svg>
      <Bubble x={64} y={10} w={84} h={24} fill={C.beam} tail="right" anim={a('ht-in')}>
        <Lines x={73} y={19} w={[58, 38]} color="#fff" op={0.9}/>
      </Bubble>
      <Bubble x={12} y={48} w={96} h={32} fill={C.card} stroke={C.rule} tail="left" anim={a('ht-in', 0.8)}>
        <Lines x={21} y={57} w={[72, 64, 40]} gap={6.5}/>
      </Bubble>
      <g {...a('ht-pulse')}>
        {[118, 127, 136].map(x => <circle key={x} cx={x} cy="70" r="2.6" fill={C.ink3}/>)}
      </g>
    </Svg>
  )
}

function Source() {
  return (
    <Svg>
      <Bubble x={8} y={22} w={74} h={40} fill={C.card} stroke={C.rule} tail="left">
        <Lines x={17} y={32} w={[54, 46, 56, 30]} gap={6.5}/>
      </Bubble>
      <path d="M84 42h18" stroke={C.accent} strokeWidth="1.8" strokeDasharray="3 3"/>
      <g>
        <path d="M106 14h28l12 12v58h-40z" fill={C.accentWash} stroke={C.accent} strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M134 14v12h12" fill="none" stroke={C.accent} strokeWidth="1.6" strokeLinejoin="round"/>
        <Lines x={113} y={36} w={[24, 26, 20, 26]} gap={7} color={C.accent} op={0.7}/>
      </g>
      <g {...a('ht-pop')}><Check x={140} y={80} r={9} fill={C.accent}/></g>
    </Svg>
  )
}

function Help() {
  return (
    <Svg>
      <rect x="8" y="8" width="144" height="24" rx="7" fill={C.card} stroke={C.rule}/>
      <path d="M18 20h30" stroke={C.ink} strokeWidth="3" strokeLinecap="round" opacity=".7"/>
      <rect x="86" y="12" width="60" height="16" rx="5" fill={C.crit}/>
      <rect x="86" y="12" width="60" height="16" rx="5" fill="none" stroke={C.crit} strokeWidth="2"
        {...a('ht-ripple')}/>
      <path d="M92 16.5c0 4 3 7.4 7 7.4l1.4-2-2.2-1.4-1 .9a4.4 4.4 0 0 1-2.4-2.4l.9-1-1.4-2.2z"
        fill="#fff"/>
      <text x="123" y="23.2" textAnchor="middle" fontFamily={FONT} fontSize="8" fontWeight="700" fill="#fff">Get help</text>
      <Bubble x={14} y={46} w={88} h={30} fill={C.card} stroke={C.rule} tail="left">
        <Lines x={23} y={55} w={[66, 52, 34]} gap={6}/>
      </Bubble>
    </Svg>
  )
}

function TogglesOn() {
  const rows = [[24, C.sky], [50, C.mint], [76, C.lilac]]
  return (
    <Svg>
      {rows.map(([y, c], i) => (
        <g key={y} {...a('ht-in', i * 0.35)}>
          <rect x="14" y={y - 10} width="132" height="20" rx="7" fill={C.card} stroke={C.rule}/>
          <rect x="21" y={y - 4} width="8" height="8" rx="2.5" fill={c}/>
          <path d={`M36 ${y}h${46 - i * 8}`} stroke={C.ink3} strokeWidth="2.4" strokeLinecap="round" opacity=".55"/>
          <Toggle x={114} y={y - 6.5}/>
        </g>
      ))}
    </Svg>
  )
}

/* The parent stops seeing it: the switch goes off and the parent dims. */
function ToggleOff() {
  return (
    <Svg>
      <rect x="10" y="20" width="140" height="60" rx="10" fill={C.card} stroke={C.rule}/>
      <g {...a('ht-dim')}>
        <Person x={40} y={50} s={1.25} fill={C.sky}/>
        <g transform="translate(66 50)" fill="none" stroke={C.ink2} strokeWidth="1.8">
          <path d="M-9 0c4-6 14-6 18 0-4 6-14 6-18 0z"/><circle r="2.6" fill={C.ink2}/>
        </g>
      </g>
      <g transform="translate(100 43.5) scale(1.6)">
        <Toggle x={0} y={0} anim/>
      </g>
    </Svg>
  )
}

function TwoAudiences() {
  return (
    <Svg>
      <rect x="8" y="14" width="68" height="74" rx="10" fill={C.skyWash}/>
      <Person x={42} y={42} s={1.15} fill={C.sky}/>
      <g transform="translate(30 66)"><Toggle x={0} y={0}/></g>
      <rect x="84" y="14" width="68" height="74" rx="10" fill={C.beamWash}/>
      <Medic x={118} y={42} s={1.15}/>
      <g transform="translate(106 66)"><Toggle x={0} y={0} anim/></g>
    </Svg>
  )
}

function LinkGlyph({ x, y, c = C.card }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M-1 2.5a3.5 3.5 0 0 0 5 0l2.6-2.6a3.5 3.5 0 0 0-5-5L.4-3.9"/>
      <path d="M1 -2.5a3.5 3.5 0 0 0-5 0l-2.6 2.6a3.5 3.5 0 0 0 5 5L-.4 3.9"/>
    </g>
  )
}

function Invite({ medic = false }) {
  return (
    <Svg>
      <Phone x={12} y={14} w={40} h={72}>
        <rect x="18" y="40" width="28" height="18" rx="6" fill={C.accent}/>
        <LinkGlyph x={32} y={49}/>
      </Phone>
      <path d="M58 50h66" stroke={C.ruling} strokeWidth="1.6" strokeDasharray="3 4"/>
      <g {...a('ht-travel')}>
        <rect x="52" y="41" width="20" height="18" rx="6" fill={C.accent}/>
        <LinkGlyph x={62} y={50}/>
      </g>
      <circle cx="136" cy="50" r="20" fill={medic ? C.beamWash : C.mintWash}/>
      {medic ? <Medic x={136} y={51}/> : <Person x={136} y={51} fill={C.mint}/>}
    </Svg>
  )
}

function ChildPick() {
  const cx = 80, cy = 96
  return (
    <Svg>
      <Person x={50} y={28} fill={C.mint}/>
      <Person x={110} y={28} fill={C.lilac}/>
      <g {...a('ht-swap')}>
        <circle cx="50" cy="28" r="17" fill="none" stroke={C.ink} strokeWidth="2.2"/>
      </g>
      {RAINBOW.map((c, i) => {
        const r = 42 - i * 6
        return <path key={c} d={`M${cx - r} ${cy}a${r} ${r} 0 0 1 ${r * 2} 0`} fill="none"
          stroke={c} strokeWidth="4.5" strokeLinecap="round" opacity=".9"/>
      })}
      <g {...a('ht-swing')}>
        <circle cx={cx} cy={cy} r="50" fill="none"/>
        <path d={`M${cx} ${cy - 48}l-4.5-7h9z`} fill={C.ink}/>
      </g>
    </Svg>
  )
}

function DayCard({ x, y, light = 'green' }) {
  return (
    <g>
      <rect x={x} y={y} width="50" height="62" rx="9" fill={C.card} stroke={C.rule}/>
      <path d={`M${x} ${y + 9}a9 9 0 0 1 9-9h32a9 9 0 0 1 9 9v5H${x}z`} fill={C.beam}/>
      <LampFaceG light={light} cx={x + 25} cy={y + 34} size={22} px={28}/>
      <rect x={x + 9} y={y + 50} width="32" height="5" rx="2.5" fill={C.mist}/>
      <rect x={x + 9} y={y + 50} width="22" height="5" rx="2.5" fill={C.mint}/>
    </g>
  )
}

function DayOnly() {
  const rows = [[30, NoteGlyph], [50, PinGlyph], [70, WaveGlyph]]
  return (
    <Svg>
      <DayCard x={10} y={18}/>
      {rows.map(([y, G], i) => (
        <g key={y} opacity=".85">
          <rect x="74" y={y - 8} width="76" height="16" rx="6" fill={C.mist}/>
          <G x={86} y={y} c={C.ink3}/>
          <path d={`M98 ${y}h28`} stroke={C.ink3} strokeWidth="2.2" strokeLinecap="round" opacity=".45"/>
          <path d={`M78 ${y + 5}l68 -10`} stroke={C.ink2} strokeWidth="1.6" strokeLinecap="round"/>
          <Lock x={140} y={y - 1} s={0.8}/>
        </g>
      ))}
    </Svg>
  )
}

function DayView() {
  return (
    <Svg>
      <DayCard x={55} y={30}/>
      <g transform="translate(80 15)" {...a('ht-pulse')}>
        <path d="M-14 0c6-9 22-9 28 0-6 9-22 9-28 0z" fill={C.accentWash} stroke={C.accent} strokeWidth="2"/>
        <circle r="4" fill={C.accent}/>
      </g>
      <path d="M30 40h16M30 54h12M114 40h16M118 54h12" stroke={C.ink3} strokeWidth="2"
        strokeLinecap="round" opacity=".35"/>
    </Svg>
  )
}

function Locked() {
  const items = [[38, NoteGlyph, C.lilac], [80, PinGlyph, C.lilac], [122, WaveGlyph, C.lilac]]
  return (
    <Svg>
      {items.map(([x, G, c]) => (
        <g key={x}>
          <rect x={x - 18} y="16" width="36" height="40" rx="9" fill={C.lilacWash}/>
          <G x={x} y={36} c={c}/>
        </g>
      ))}
      <path d="M20 66h120" stroke={C.rule} strokeWidth="1.4"/>
      <g {...a('ht-pop')}>
        <circle cx="80" cy="80" r="13" fill={C.ink2}/>
        <Lock x={80} y={79} s={1.05} color={C.card}/>
      </g>
    </Svg>
  )
}

function Opener() {
  return (
    <Svg>
      <Bubble x={12} y={10} w={94} h={34} fill={C.sky} tail="left" anim={a('ht-in')}>
        <text x="22" y="34" fontFamily="Georgia, serif" fontSize="22" fontWeight="700" fill="#fff" opacity=".9">“</text>
        <Lines x={36} y={22} w={[60, 46]} gap={8} color="#fff" op={0.95}/>
      </Bubble>
      <Bubble x={64} y={56} w={84} h={28} fill={C.mintWash} stroke={C.mint} tail="right" anim={a('ht-in', 0.9)}>
        <Lines x={74} y={66} w={[60, 36]} gap={7} color={C.mint} op={0.85}/>
      </Bubble>
    </Svg>
  )
}

function LineCheck() {
  return (
    <Svg>
      <Bubble x={12} y={18} w={104} h={46} fill={C.card} stroke={C.rule} tail="left">
        <Lines x={22} y={30} w={[82, 70, 48]} gap={9} color={C.ink2} op={0.6}/>
      </Bubble>
      <g {...a('ht-pop')}><Check x={128} y={60} r={13} fill={C.mint}/></g>
    </Svg>
  )
}

function GetHelpArt() {
  const rows = [[44, C.coral], [62, C.sky], [80, C.mint]]
  return (
    <Svg>
      <rect x="30" y="8" width="100" height="22" rx="7" fill={C.crit}/>
      <rect x="30" y="8" width="100" height="22" rx="7" fill="none" stroke={C.crit} strokeWidth="2" {...a('ht-ripple')}/>
      <text x="80" y="22.6" textAnchor="middle" fontFamily={FONT} fontSize="9" fontWeight="700" fill="#fff">Get help</text>
      {rows.map(([y, c], i) => (
        <g key={y} {...a('ht-in', 0.3 + i * 0.3)}>
          <rect x="30" y={y - 7} width="100" height="14" rx="5" fill={C.card} stroke={C.rule}/>
          <rect x="36" y={y - 3.5} width="7" height="7" rx="2" fill={c}/>
          <path d={`M49 ${y}h${50 - i * 10}`} stroke={C.ink3} strokeWidth="2" strokeLinecap="round" opacity=".55"/>
        </g>
      ))}
    </Svg>
  )
}

function Roster() {
  const people = [[30, 34, C.mint], [80, 34, C.sky], [130, 34, C.lilac], [30, 74, C.coral], [80, 74, C.gold]]
  return (
    <Svg>
      {people.map(([x, y, c]) => (
        <g key={x + '.' + y}>
          <rect x={x - 22} y={y - 17} width="44" height="34" rx="8" fill={C.card} stroke={C.rule}/>
          <Person x={x} y={y + 1} s={0.9} fill={c}/>
        </g>
      ))}
      <g {...a('ht-pop')}>
        <rect x="108" y="57" width="44" height="34" rx="8" fill={C.beamWash} stroke={C.beam} strokeWidth="1.4"/>
        <Person x={130} y={75} s={0.9} fill={C.beam}/>
      </g>
    </Svg>
  )
}

function Lights() {
  const rows = [[20, C.mint, 'green'], [42, C.sky, 'green'], [64, C.lilac, 'yellow'], [86, C.coral, 'green']]
  return (
    <Svg>
      {rows.map(([y, c, l], i) => (
        <g key={y}>
          <rect x="12" y={y - 9} width="136" height="18" rx="7" fill={C.card} stroke={C.rule}/>
          <circle cx="24" cy={y} r="5" fill={c}/>
          <path d={`M36 ${y}h${54 - i * 6}`} stroke={C.ink3} strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
          <g {...a('ht-bob', i * 0.3)}>
            <LampFaceG light={l} cx={134} cy={y} size={13} px={18}/>
          </g>
        </g>
      ))}
    </Svg>
  )
}

function Group5() {
  return (
    <Svg>
      <rect x="8" y="22" width="60" height="56" rx="10" fill="none" stroke={C.ruling} strokeWidth="1.6" strokeDasharray="4 3"/>
      <Person x={24} y={44} s={0.75} fill={C.ink3}/>
      <Person x={52} y={44} s={0.75} fill={C.ink3}/>
      <Person x={38} y={64} s={0.75} fill={C.ink3}/>
      <rect x="80" y="18" width="72" height="64" rx="10" fill={C.card} stroke={C.rule}/>
      <g stroke={C.rule} strokeWidth="1.4" strokeDasharray="3 3">
        <path d="M88 40h56M88 56h56M88 72h56"/>
      </g>
      <g {...a('ht-pulse')}>
        <circle cx="116" cy="50" r="13" fill={C.lilacWash} stroke={C.lilac} strokeWidth="1.6"/>
        <path d="M107 50c3-5 15-5 18 0" fill="none" stroke={C.lilac} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M108 44l16 12" stroke={C.lilac} strokeWidth="1.8" strokeLinecap="round"/>
      </g>
    </Svg>
  )
}

function Audit() {
  return (
    <Svg>
      <rect x="10" y="16" width="56" height="68" rx="9" fill={C.card} stroke={C.rule}/>
      <Person x={38} y={38} s={0.85} fill={C.mint}/>
      <Lines x={20} y={62} w={[36, 26]} gap={7}/>
      <g transform="translate(38 16)" {...a('ht-pulse')}>
        <circle r="10" fill={C.beamWash} stroke={C.beam} strokeWidth="1.6"/>
        <path d="M-6 0c3-4 9-4 12 0-3 4-9 4-12 0z" fill="none" stroke={C.beam} strokeWidth="1.5"/>
        <circle r="1.8" fill={C.beam}/>
      </g>
      <path d="M72 50h10m-4-4 4 4-4 4" fill="none" stroke={C.ink3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="88" y="16" width="62" height="68" rx="9" fill={C.paper} stroke={C.rule}/>
      {[30, 44, 58].map(y => (
        <g key={y}>
          <circle cx="98" cy={y} r="3" fill={C.ruling}/>
          <path d={`M106 ${y}h34`} stroke={C.ink3} strokeWidth="2.2" strokeLinecap="round" opacity=".4"/>
        </g>
      ))}
      <g {...a('ht-in')}>
        <circle cx="98" cy="72" r="3.4" fill={C.beam}/>
        <path d="M106 72h34" stroke={C.beam} strokeWidth="2.6" strokeLinecap="round"/>
      </g>
    </Svg>
  )
}

function TeenChoose() {
  return (
    <Svg>
      <Phone x={42} y={4} w={76} h={92}>
        <circle cx="80" cy="26" r="11" fill={C.beamWash}/>
        <Medic x={80} y={27} s={0.7}/>
        <Lines x={56} y={46} w={[48, 34]} gap={7}/>
        <rect x="52" y="64" width="56" height="12" rx="5" fill={C.accent}/>
        <text x="80" y="72.6" textAnchor="middle" fontFamily={FONT} fontSize="7.5" fontWeight="700" fill="#fff">Join</text>
        <rect x="52" y="80" width="56" height="11" rx="5" fill={C.mist}/>
        <text x="80" y="88" textAnchor="middle" fontFamily={FONT} fontSize="7" fontWeight="700" fill={C.ink2}>Not now</text>
      </Phone>
      <Ripple x={92} y={70} r={7} color={C.accent}/>
      <Finger x={94} y={72} rot={-30}/>
    </Svg>
  )
}

function Joined() {
  const rows = [[22, C.mint], [44, C.sky], [66, C.lilac]]
  return (
    <Svg>
      {rows.map(([y, c]) => (
        <g key={y}>
          <rect x="16" y={y - 9} width="128" height="18" rx="7" fill={C.card} stroke={C.rule}/>
          <circle cx="28" cy={y} r="5" fill={c}/>
          <path d={`M40 ${y}h48`} stroke={C.ink3} strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
        </g>
      ))}
      <g {...a('ht-in')}>
        <rect x="16" y="79" width="128" height="18" rx="7" fill={C.mintWash} stroke={C.mint} strokeWidth="1.4"/>
        <circle cx="28" cy="88" r="5" fill={C.coral}/>
        <path d="M40 88h40" stroke={C.ink2} strokeWidth="2.2" strokeLinecap="round" opacity=".6"/>
        <Check x={132} y={88} r={6} fill={C.mint}/>
      </g>
    </Svg>
  )
}

function NextStep() {
  return (
    <Svg>
      <path d="M38 64h40M78 64c10 0 10-22 22-22h18M78 64c10 0 10 18 22 18h18" fill="none"
        stroke={C.ruling} strokeWidth="2" strokeLinecap="round"/>
      <rect x="10" y="52" width="30" height="24" rx="7" fill={C.skyWash} stroke={C.sky} strokeWidth="1.6"/>
      <rect x="118" y="30" width="32" height="24" rx="7" fill={C.lilacWash} stroke={C.lilac} strokeWidth="1.8"/>
      <rect x="118" y="70" width="32" height="24" rx="7" fill={C.card} stroke={C.rule}/>
      <path d="M126 42h16" stroke={C.lilac} strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M126 82h16" stroke={C.ink3} strokeWidth="2.4" strokeLinecap="round" opacity=".4"/>
      <path d="M18 64h14" stroke={C.sky} strokeWidth="2.4" strokeLinecap="round"/>
      <g {...a('ht-path')}>
        <circle cx="34" cy="64" r="5" fill={C.lilac}/>
      </g>
      <rect x="14" y="10" width="62" height="20" rx="7" fill={C.card} stroke={C.rule}/>
      <path d="M22 20h22" stroke={C.ink3} strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
      <circle cx="64" cy="20" r="4" fill={C.gold}/>
    </Svg>
  )
}

function Referral() {
  return (
    <Svg>
      <path d="M40 8h56l14 14v70H40z" fill={C.card} stroke={C.ink2} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M96 8v14h14" fill="none" stroke={C.ink2} strokeWidth="1.6" strokeLinejoin="round"/>
      <rect x="50" y="18" width="30" height="6" rx="3" fill={C.mint}/>
      {[36, 46, 56, 66].map((y, i) => (
        <rect key={y} x="50" y={y} width={[48, 42, 50, 30][i]} height="4" rx="2" fill={C.ink3}
          opacity=".45" {...a('ht-fill', i * 0.3)}/>
      ))}
      <g {...a('ht-pop')}>
        <circle cx="122" cy="76" r="14" fill={C.mint}/>
        <path d="M115 76h12m-4.5-5 4.5 5-4.5 5" fill="none" stroke="#fff" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </Svg>
  )
}

export const ART = {
  patch: Patch,
  cards: Cards,
  tabbar: TabBar,
  threeWays: ThreeWays,
  fingerCam: FingerCam,
  dial: Dial,
  range: Range,
  faces: Faces,
  calendar: Calendar,
  toolPick: ToolPick,
  breathe: Breathe,
  levels: Levels,
  chat: Chat,
  source: Source,
  help: Help,
  togglesOn: TogglesOn,
  toggleOff: ToggleOff,
  twoAudiences: TwoAudiences,
  invite: () => <Invite/>,
  inviteMed: () => <Invite medic/>,
  childPick: ChildPick,
  dayOnly: DayOnly,
  dayView: DayView,
  locked: Locked,
  opener: Opener,
  lineCheck: LineCheck,
  getHelp: GetHelpArt,
  roster: Roster,
  lights: Lights,
  group5: Group5,
  audit: Audit,
  teenChoose: TeenChoose,
  joined: Joined,
  nextStep: NextStep,
  referral: Referral,
}
