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
@keyframes ht-q1{0%,22%{opacity:1}25%,97%{opacity:0}100%{opacity:1}}
@keyframes ht-q2{0%,22%{opacity:0}25%,47%{opacity:1}50%,100%{opacity:0}}
@keyframes ht-q3{0%,47%{opacity:0}50%,72%{opacity:1}75%,100%{opacity:0}}
@keyframes ht-q4{0%,72%{opacity:0}75%,97%{opacity:1}100%{opacity:0}}
.ht-q1{animation-name:ht-q1;animation-duration:8s}
.ht-q2{opacity:0;animation-name:ht-q2;animation-duration:8s}
.ht-q3{opacity:0;animation-name:ht-q3;animation-duration:8s}
.ht-q4{opacity:0;animation-name:ht-q4;animation-duration:8s}
@keyframes ht-tabs6{0%,13%{transform:translateX(0)}16%,29%{transform:translateX(24px)}32%,45%{transform:translateX(48px)}48%,61%{transform:translateX(72px)}64%,77%{transform:translateX(96px)}80%,95%{transform:translateX(120px)}100%{transform:translateX(0)}}
.ht-tabs6{animation-name:ht-tabs6;animation-duration:9s}
@keyframes ht-sw2{0%,40%{transform:translateX(0)}50%,90%{transform:translateX(72px)}100%{transform:translateX(0)}}
.ht-sw2{animation-name:ht-sw2;animation-duration:6s}
@keyframes ht-g1{0%,42%{opacity:1}48%,92%{opacity:0}100%{opacity:1}}
@keyframes ht-g2{0%,42%{opacity:0}48%,92%{opacity:1}100%{opacity:0}}
.ht-g1{animation-name:ht-g1;animation-duration:6s}
.ht-g2{opacity:0;animation-name:ht-g2;animation-duration:6s}
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

/* The person with a small cross badge: the Professional. */
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


/* A small face with the landmark mesh over it, centred on (x, y). */
function MiniFace({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse rx="11" ry="14" fill={C.skin}/>
      <g fill="none" stroke={C.beam} strokeWidth="1" opacity=".9">
        <ellipse rx="11" ry="14"/>
        <path d="M-11 0h22M0 -14v28M-8 -7l8 7 8-7M-8 7l8-7 8 7"/>
      </g>
      <path d="M-6 -3h3M3 -3h3M-3.5 7q3.5 2 7 0" fill="none" stroke={C.accent} strokeWidth="1.6"
        strokeLinecap="round"/>
    </g>
  )
}

/* The four ways to take a reading, one lit at a time: patch, fingertip on
   the camera, check-in questions, Mental Mirror. */
function FourWays() {
  const xs = [5, 44, 83, 122]
  return (
    <Svg>
      {xs.map(x => (
        <rect key={x} x={x} y="18" width="33" height="64" rx="8" fill={C.card} stroke={C.rule}/>
      ))}
      {['ht-q1', 'ht-q2', 'ht-q3', 'ht-q4'].map((q, i) => (
        <rect key={q} x={xs[i] - 2} y="16" width="37" height="68" rx="10" fill="none"
          stroke={C.accent} strokeWidth="2.6" {...a(q)}/>
      ))}
      <PatchShape x={21.5} y={52} s={0.5}/>
      <g>
        <rect x="50" y="28" width="21" height="44" rx="5" fill={C.ink2}/>
        <circle cx="57" cy="36" r="4.5" fill={C.coral}/>
        <path d="M51 28h12v6a6 6 0 0 1-12 0z" fill={C.skin} stroke={C.skinEdge} strokeWidth=".8"/>
        <circle cx="66" cy="35" r="1.8" fill={C.gold}/>
      </g>
      <g>
        {[32, 44, 56, 68].map((y, i) => (
          <g key={y}>
            <rect x="89" y={y - 3.5} width="7" height="7" rx="2" fill={i < 3 ? C.mint : C.mist}/>
            <path d={`M100 ${y}h10`} stroke={C.ink3} strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
          </g>
        ))}
      </g>
      <MiniFace x={138.5} y={50} s={0.95}/>
    </Svg>
  )
}

/* Each way, on the phone: fingertip on the lens, a check-in question, the
   face in front of the camera. A bar fills as it reads. */
function HowWays() {
  return (
    <Svg>
      <rect x="50" y="4" width="60" height="92" rx="11" fill={C.ink}/>
      <rect x="56" y="12" width="48" height="68" rx="6" fill={C.ink2}/>
      <g {...a('ht-f1')}>
        <circle cx="80" cy="44" r="13" fill={C.coral} opacity=".55"/>
        <circle cx="80" cy="44" r="8" fill={C.ink} stroke={C.mist} strokeWidth="1.2"/>
        <path d="M70 18h20v20a10 10 0 0 1-20 0z" fill={C.skin} stroke={C.skinEdge} strokeWidth="1"/>
      </g>
      <g {...a('ht-f2')}>
        <rect x="60" y="20" width="40" height="12" rx="3" fill={C.card}/>
        <path d="M64 26h28" stroke={C.ink3} strokeWidth="2" strokeLinecap="round" opacity=".6"/>
        {[0, 1, 2, 3].map(i => (
          <circle key={i} cx={66 + i * 9.3} cy="48" r="3.6" fill={i === 2 ? C.lit : 'none'}
            stroke={C.mist} strokeWidth="1.3"/>
        ))}
        <rect x="60" y="60" width="40" height="10" rx="3" fill={C.accent}/>
      </g>
      <g {...a('ht-f3')}>
        <MiniFace x={80} y={46} s={1.3}/>
      </g>
      <rect x="58" y="86" width="44" height="4" rx="2" fill={C.ink3}/>
      <rect x="58" y="86" width="44" height="4" rx="2" fill={C.lit} {...a('ht-fill')}/>
      <g transform="translate(132 50)">
        <circle r="13" fill={C.card} stroke={C.rule} strokeWidth="1.4"/>
        <path d="M0 -13a13 13 0 0 1 13 13" fill="none" stroke={C.accent} strokeWidth="2.6" strokeLinecap="round"/>
        <path d="M0 0v-7M0 0l5 3" stroke={C.ink2} strokeWidth="1.8" strokeLinecap="round"/>
      </g>
      <g transform="translate(28 50)">
        <path d="M-12 0h5l3-8 5 16 3-8h8" fill="none" stroke={C.coral} strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round" {...a('ht-pulse')}/>
      </g>
    </Svg>
  )
}

/* Home's first band: the dark Take a reading bar with its button. */
function StartBar() {
  return (
    <Svg>
      <rect x="8" y="16" width="144" height="40" rx="9" fill={C.ink}/>
      <rect x="14" y="23" width="28" height="26" rx="5" fill={C.ink2}/>
      <path d="M16 36h6l2-6 3 12 2-6h11" fill="none" stroke={C.lit} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" {...a('ht-pulse')}/>
      <path d="M48 31h34M48 40h24" stroke={C.mist} strokeWidth="2.4" strokeLinecap="round" opacity=".8"/>
      <rect x="98" y="27" width="46" height="18" rx="6" fill={C.accent}/>
      <path d="M108 36h20m-5-5 5 5-5 5" fill="none" stroke="#fff" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
      {[8, 46, 84, 122].map((x, i) => (
        <rect key={x} x={x} y="64" width="30" height="30" rx="6"
          fill={[C.skyWash, C.sunWash, C.lilacWash, C.coralWash][i]} opacity=".9"/>
      ))}
      <Ripple x={121} y={36} r={8} color={C.lit}/>
      <Finger x={123} y={39} rot={-28}/>
    </Svg>
  )
}

/* Today on Trends: a small dial with its clouds, and the Heads Up face. */
function TodayDial() {
  const cx = 54, cy = 72
  return (
    <Svg>
      {RAINBOW.map((c, i) => {
        const r = 46 - i * 6.5
        return <path key={c} d={`M${cx - r} ${cy}a${r} ${r} 0 0 1 ${r * 2} 0`} fill="none"
          stroke={c} strokeWidth="5" strokeLinecap="round" opacity=".9"/>
      })}
      <Weather cx={cx} cy={cy} rIn={20} rOut={46} s={0.44}/>
      <g {...a('ht-needle')}>
        <circle cx={cx} cy={cy} r="54" fill="none"/>
        <path d={`M${cx} ${cy - 52}l-4.5-8h9z`} fill={C.ink}/>
      </g>
      <text x={cx} y={cy - 6} textAnchor="middle" fontFamily="Quicksand, system-ui, sans-serif"
        fontWeight="700" fontSize="17" fill={C.ink}>51</text>
      <rect x="116" y="18" width="40" height="64" rx="9" fill={C.card} stroke={C.rule}/>
      <g {...a('ht-bob')}>
        <LampFaceG light="yellow" cx={136} cy={44} size={28} px={34}/>
      </g>
      <path d="M124 70h24" stroke={C.ink3} strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
    </Svg>
  )
}

/* Day, Week, Month above a calendar of Heads Up faces; a day gets picked. */
function RangeCal() {
  const x0 = 8, y0 = 34, w = 24
  const faces = ['green', 'green', 'yellow', 'green', 'red', 'green',
    'green', 'yellow', 'green', 'green', 'green', 'yellow']
  return (
    <Svg>
      <rect x="20" y="4" width="120" height="18" rx="9" fill={C.mist}/>
      <g {...a('ht-seg')}>
        <rect x="21.5" y="5.5" width="37" height="15" rx="7.5" fill={C.card} stroke={C.beam} strokeWidth="1.4"/>
      </g>
      {['Day', 'Week', 'Month'].map((t, i) => (
        <text key={t} x={40 + i * 40} y="16.4" textAnchor="middle" fontFamily={FONT} fontSize="8"
          fontWeight="700" fill={C.ink2}>{t}</text>
      ))}
      <rect x="4" y="30" width="152" height="56" rx="8" fill={C.card} stroke={C.rule}/>
      {faces.map((l, i) => (
        <LampFaceG key={i} light={l} cx={x0 + 4 + (i % 6) * w + w / 2} cy={y0 + Math.floor(i / 6) * w + w / 2}
          size={14} px={18}/>
      ))}
      <g {...a('ht-hop')}>
        <rect x={x0 + 6} y={y0 + 1} width={w - 4} height={w - 2} rx="6" fill="none" stroke={C.ink} strokeWidth="2"/>
      </g>
    </Svg>
  )
}

/* The Mind Score Log: a reading a row, and a note added to one. */
function Log() {
  const rows = [[14, 'green', '51'], [36, 'yellow', '69'], [58, 'green', '35']]
  return (
    <Svg>
      {rows.map(([y, l, n], i) => (
        <g key={y}>
          <rect x="8" y={y - 9} width="144" height="18" rx="6" fill={C.card} stroke={C.rule}/>
          <LampFaceG light={l} cx={19} cy={y} size={11} px={14}/>
          <text x="34" y={y + 3.4} fontFamily={FONT} fontSize="9.5" fontWeight="700" fill={C.ink}>{n}</text>
          <path d={`M54 ${y}h${34 - i * 6}`} stroke={C.ink3} strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
          <rect x="116" y={y - 6} width="30" height="12" rx="5" fill={i === 1 ? C.lilacWash : C.mist}/>
          <text x="131" y={y + 2.8} textAnchor="middle" fontFamily={FONT} fontSize="7" fontWeight="700"
            fill={i === 1 ? C.lilac : C.ink2}>Note</text>
        </g>
      ))}
      <g {...a('ht-show')}>
        <rect x="8" y="72" width="144" height="22" rx="6" fill={C.lilacWash} stroke={C.lilac} strokeWidth="1.2"/>
        <path d="M17 87l2-6 8-8 4 4-8 8z" fill="none" stroke={C.lilac} strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M38 80h56M38 87h36" stroke={C.lilac} strokeWidth="2.2" strokeLinecap="round" opacity=".75"/>
      </g>
      <Ripple x={131} y={36} r={7} color={C.lilac}/>
      <Finger x={133} y={39} rot={-26}/>
    </Svg>
  )
}

/* Six tabs along the top, the lit one moving; its activities below. */
function TabGlyph({ i, x, y, c }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={c} strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round">
      {i === 0 && <><circle r="4.2"/><circle r="1.6" fill={c}/></>}
      {i === 1 && <path d="M-5 -3.5h4a1 1 0 0 1 1 1V4a1 1 0 0 0-1-1h-4zM5 -3.5H1a1 1 0 0 0-1 1V4a1 1 0 0 1 1-1h4z"/>}
      {i === 2 && <><path d="M0 4.5v-3"/><path d="M0 1.5l-4.5 0 4.5-6 4.5 6z"/></>}
      {i === 3 && <path d="M-4.5 4.5v-5L0 -4.5l4.5 4v5z"/>}
      {i === 4 && <><rect x="-5" y="-2.5" width="10" height="7" rx="1.3"/><path d="M-2 -2.5v-2h4v2"/></>}
      {i === 5 && <path d="M-3 -4.5l7.5 4.5-7.5 4.5z" fill={c}/>}
    </g>
  )
}

function ToolTabs() {
  const hue = [C.mint, C.sky, C.accent, C.coral, C.lilac, C.sun]
  const sets = [
    [[C.mintWash, C.mint], [C.skyWash, C.sky], [C.sunWash, C.gold]],
    [[C.lilacWash, C.lilac], [C.coralWash, C.coral], [C.mintWash, C.mint]],
    [[C.skyWash, C.sky], [C.sunWash, C.gold], [C.lilacWash, C.lilac]],
  ]
  return (
    <Svg>
      <rect x="6" y="6" width="148" height="22" rx="8" fill={C.card} stroke={C.rule}/>
      <g {...a('ht-tabs6')}>
        <rect x="9" y="9" width="22" height="16" rx="5" fill={C.accentWash} stroke={C.accent} strokeWidth="1.4"/>
      </g>
      {hue.map((c, i) => <TabGlyph key={i} i={i} x={20 + i * 24} y={17} c={c}/>)}
      {sets.map((set, k) => (
        <g key={k} {...a(['ht-f1', 'ht-f2', 'ht-f3'][k])}>
          {set.map(([wash, c], i) => (
            <g key={i}>
              <rect x={6 + i * 50} y="38" width="46" height="54" rx="8" fill={wash}/>
              <circle cx={29 + i * 50} cy="58" r="9" fill="none" stroke={c} strokeWidth="2.4"/>
              <path d={`M${17 + i * 50} 81h24`} stroke={c} strokeWidth="2.4" strokeLinecap="round"/>
            </g>
          ))}
        </g>
      ))}
    </Svg>
  )
}

/* An adult and a teen doing an exercise together. */
function Together() {
  return (
    <Svg>
      <circle cx="80" cy="34" r="24" fill={C.skyWash}/>
      <circle cx="80" cy="34" r="22" fill="none" stroke={C.sky} strokeWidth="1.2" strokeDasharray="3 4"/>
      <circle cx="80" cy="34" r="16" fill={C.sky} opacity=".85" {...a('ht-breathe')}/>
      <Person x={44} y={76} s={1.5} fill={C.beam}/>
      <Person x={116} y={80} s={1.25} fill={C.mint}/>
    </Svg>
  )
}

/* Raw readings kept 7, 30 or 90 days; Notes and Location stay locked. */
function KeepDays() {
  const opts = [[10, '7'], [58, '30'], [106, '90']]
  return (
    <Svg>
      {opts.map(([x, n], i) => (
        <g key={n}>
          <rect x={x} y="8" width="44" height="40" rx="8" fill={i === 0 ? C.accentWash : C.card}
            stroke={i === 0 ? C.accent : C.rule} strokeWidth={i === 0 ? 2 : 1}/>
          <text x={x + 22} y="31" textAnchor="middle" fontFamily="Quicksand, system-ui, sans-serif"
            fontWeight="700" fontSize="17" fill={i === 0 ? C.accent : C.ink2}>{n}</text>
          <path d={`M${x + 13} 40h18`} stroke={C.ink3} strokeWidth="2" strokeLinecap="round" opacity=".45"/>
        </g>
      ))}
      <g {...a('ht-pop')}><Check x={50} y={10} r={7}/></g>
      <rect x="10" y="58" width="140" height="34" rx="9" fill={C.lilacWash}/>
      <NoteGlyph x={34} y={75} c={C.lilac}/>
      <PinGlyph x={64} y={75} c={C.lilac}/>
      <path d="M84 75h30" stroke={C.lilac} strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
      <Lock x={134} y={74} s={1.05} color={C.lilac}/>
    </Svg>
  )
}

/* The parent's network box: two teens, their Professional, one waiting. */
function FamilyNet() {
  const tiles = [[10, 12, 'teen', C.mint], [82, 12, 'teen', C.lilac], [10, 54, 'pro'], [82, 54, 'wait']]
  return (
    <Svg>
      {tiles.map(([x, y, kind, c]) => (
        <g key={x + '.' + y}>
          <rect x={x} y={y} width="68" height="34" rx="8" fill={kind === 'wait' ? 'none' : C.card}
            stroke={kind === 'wait' ? C.ruling : C.rule} strokeWidth={kind === 'wait' ? 1.4 : 1}
            strokeDasharray={kind === 'wait' ? '4 3' : undefined}/>
          {kind === 'teen' && <Person x={x + 17} y={y + 18} s={0.85} fill={c}/>}
          {kind !== 'teen' && <Medic x={x + 17} y={y + 18} s={0.8}/>}
          <path d={`M${x + 33} ${y + 14}h24M${x + 33} ${y + 22}h16`} stroke={C.ink3} strokeWidth="2"
            strokeLinecap="round" opacity=".5"/>
          {kind === 'wait' && (
            <g transform={`translate(${x + 56} ${y + 25})`} {...a('ht-pulse')}>
              <circle r="5" fill={C.sunWash} stroke={C.sun} strokeWidth="1.2"/>
              <path d="M0 -2.6v2.6l1.8 1.2" fill="none" stroke={C.sun} strokeWidth="1.2" strokeLinecap="round"/>
            </g>
          )}
        </g>
      ))}
    </Svg>
  )
}

/* A link sent from your phone to a teen and to their Professional. */
function InviteBoth() {
  return (
    <Svg>
      <Phone x={10} y={14} w={40} h={72}>
        <rect x="16" y="40" width="28" height="18" rx="6" fill={C.accent}/>
        <LinkGlyph x={30} y={49}/>
      </Phone>
      <path d="M56 50h40M96 50c8 0 10-22 22-22M96 50c8 0 10 22 22 22" fill="none" stroke={C.ruling}
        strokeWidth="1.6" strokeDasharray="3 4"/>
      <g {...a('ht-travel')}>
        <rect x="50" y="41" width="20" height="18" rx="6" fill={C.accent}/>
        <LinkGlyph x={60} y={50}/>
      </g>
      <circle cx="136" cy="28" r="17" fill={C.mintWash}/>
      <Person x={136} y={29} s={0.9} fill={C.mint}/>
      <circle cx="136" cy="72" r="17" fill={C.beamWash}/>
      <Medic x={136} y={73} s={0.9}/>
    </Svg>
  )
}

/* Who sees what: student, parent, Professional across the top; always,
   if the student agrees, never down the rows. */
function Table() {
  const rows = [
    ['ok', 'opt', 'opt'],
    ['ok', 'opt', 'opt'],
    ['ok', 'no', 'no'],
    ['ok', 'no', 'no'],
  ]
  const xs = [76, 106, 136]
  return (
    <Svg>
      <rect x="6" y="6" width="148" height="88" rx="9" fill={C.card} stroke={C.rule}/>
      <Person x={76} y={20} s={0.7} fill={C.mint}/>
      <Person x={106} y={20} s={0.7} fill={C.sky}/>
      <Medic x={136} y={20} s={0.7}/>
      {rows.map((r, j) => {
        const y = 40 + j * 15
        return (
          <g key={j} {...a('ht-in', j * 0.3)}>
            <path d={`M14 ${y}h${36 - j * 5}`} stroke={C.ink3} strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
            {r.map((k, i) => (
              <g key={i}>
                {k === 'ok' && <Check x={xs[i]} y={y} r={5}/>}
                {k === 'opt' && (
                  <g transform={`translate(${xs[i] - 8.4} ${y - 4.5}) scale(.7)`}><Toggle x={0} y={0}/></g>
                )}
                {k === 'no' && <Lock x={xs[i]} y={y - 1.5} s={0.75} color={C.ink3}/>}
              </g>
            ))}
          </g>
        )
      })}
    </Svg>
  )
}

/* The three tool shortcuts on the Professional's home. */
function QuickTools() {
  return (
    <Svg>
      <rect x="6" y="18" width="46" height="64" rx="9" fill={C.skyWash}/>
      <Bubble x={13} y={30} w={32} h={20} fill={C.sky} tail="left">
        <path d="M20 40h18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
      </Bubble>
      <path d="M16 70h26" stroke={C.sky} strokeWidth="2.4" strokeLinecap="round"/>
      <rect x="57" y="18" width="46" height="64" rx="9" fill={C.mintWash}/>
      <circle cx="80" cy="44" r="13" fill="none" stroke={C.mint} strokeWidth="2.4"/>
      <path d="M80 44v-8M80 44l6 4" stroke={C.mint} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M67 70h26" stroke={C.mint} strokeWidth="2.4" strokeLinecap="round"/>
      <rect x="108" y="18" width="46" height="64" rx="9" fill={C.lilacWash}/>
      <path d="M121 28h16l6 6v22h-22z" fill={C.card} stroke={C.lilac} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M125 40h12M125 46h14M125 52h8" stroke={C.lilac} strokeWidth="1.8" strokeLinecap="round" opacity=".8"/>
      <path d="M118 70h26" stroke={C.lilac} strokeWidth="2.4" strokeLinecap="round"/>
      <Ripple x={80} y={44} r={9} color={C.mint}/>
      <Finger x={83} y={48} rot={-30}/>
    </Svg>
  )
}

/* Heads Up today: three tiles, green, yellow, red, and an urgent alert row. */
function HeadsCount() {
  const tiles = [[8, 'green', C.mint, 0.9], [57, 'yellow', C.gold, 0.55], [106, 'red', C.coral, 0.15]]
  return (
    <Svg>
      {tiles.map(([x, l, rim, f], i) => (
        <g key={l}>
          <rect x={x} y="6" width="46" height="58" rx="9" fill={C.card} stroke={rim} strokeWidth="1.6"/>
          <g {...a('ht-bob', i * 0.3)}>
            <LampFaceG light={l} cx={x + 23} cy={28} size={24} px={30}/>
          </g>
          <rect x={x + 8} y="50" width="30" height="6" rx="3" fill={C.mist}/>
          <rect x={x + 8} y="50" width={30 * f} height="6" rx="3" fill={C.ink2} opacity=".7"/>
        </g>
      ))}
      <rect x="8" y="72" width="144" height="20" rx="6" fill={C.card} stroke={C.coral} strokeWidth="1.2"/>
      <rect x="8" y="72" width="4" height="20" rx="2" fill={C.crit}/>
      <path d="M20 82h80" stroke={C.crit} strokeWidth="2.4" strokeLinecap="round" opacity=".8"/>
      <path d="M136 82h8m-3.5-3.5 3.5 3.5-3.5 3.5" fill="none" stroke={C.crit} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" {...a('ht-pulse')}/>
    </Svg>
  )
}

/* Each teen or Whole group: the switch slides, the view below changes. */
function EachGroup() {
  return (
    <Svg>
      <rect x="8" y="4" width="144" height="20" rx="8" fill={C.mist}/>
      <g {...a('ht-sw2')}>
        <rect x="10" y="6" width="68" height="16" rx="6" fill={C.card} stroke={C.accent} strokeWidth="1.4"/>
      </g>
      <text x="44" y="17" textAnchor="middle" fontFamily={FONT} fontSize="7.5" fontWeight="700" fill={C.ink2}>Each teen</text>
      <text x="116" y="17" textAnchor="middle" fontFamily={FONT} fontSize="7.5" fontWeight="700" fill={C.ink2}>Whole group</text>
      <g {...a('ht-g1')}>
        {[0, 1, 2].map(i => (
          <g key={i}>
            <rect x={8 + i * 49} y="32" width="46" height="62" rx="8" fill={C.card} stroke={C.rule}/>
            <LampFaceG light={['red', 'yellow', 'green'][i]} cx={31 + i * 49} cy={50} size={20} px={26}/>
            <path d={`M${18 + i * 49} 70h26M${18 + i * 49} 80h18`} stroke={C.ink3} strokeWidth="2"
              strokeLinecap="round" opacity=".5"/>
          </g>
        ))}
      </g>
      <g {...a('ht-g2')}>
        <rect x="8" y="32" width="144" height="62" rx="8" fill={C.card} stroke={C.rule}/>
        {[34, 26, 40, 46, 22].map((h, i) => (
          <rect key={i} x={22 + i * 25} y={86 - h} width="14" height={h} rx="3"
            fill={i === 3 ? C.gold : C.beamWash} stroke={i === 3 ? C.sun : C.beam} strokeWidth="1"/>
        ))}
        <rect x="134" y="62" width="12" height="24" rx="3" fill="none" stroke={C.ruling}
          strokeWidth="1.2" strokeDasharray="2.5 2.5"/>
      </g>
    </Svg>
  )
}

/* Search and sort, a teen's card, Open record, and the line it writes in
   the log. */
function FilterOpen() {
  return (
    <Svg>
      <rect x="6" y="4" width="92" height="18" rx="6" fill={C.card} stroke={C.rule}/>
      <g fill="none" stroke={C.ink3} strokeWidth="1.6" strokeLinecap="round">
        <circle cx="16" cy="12.5" r="3.6"/><path d="M18.8 15.3l2.6 2.6"/>
      </g>
      <path d="M28 13h44" stroke={C.ink3} strokeWidth="2" strokeLinecap="round" opacity=".4"/>
      <rect x="104" y="4" width="50" height="18" rx="6" fill={C.accentWash}/>
      <path d="M112 9.5h20M112 13h14M112 16.5h8" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="6" y="30" width="148" height="44" rx="8" fill={C.card} stroke={C.rule}/>
      <LampFaceG light="yellow" cx={24} cy={52} size={22} px={28}/>
      {[18, 24, 20, 30, 26].map((h, i) => (
        <rect key={i} x={44 + i * 9} y={64 - h} width="6" height={h} rx="2" fill={C.beamWash}
          stroke={C.beam} strokeWidth=".8"/>
      ))}
      <rect x="98" y="44" width="50" height="17" rx="6" fill={C.accent}/>
      <text x="123" y="55.4" textAnchor="middle" fontFamily={FONT} fontSize="7.5" fontWeight="700" fill="#fff">Open record</text>
      <g {...a('ht-in')}>
        <rect x="6" y="80" width="148" height="15" rx="6" fill={C.paper} stroke={C.rule}/>
        <g transform="translate(18 87.5)" fill="none" stroke={C.beam} strokeWidth="1.4">
          <path d="M-6 0c3-4 9-4 12 0-3 4-9 4-12 0z"/><circle r="1.6" fill={C.beam}/>
        </g>
        <path d="M30 87.5h64" stroke={C.beam} strokeWidth="2.2" strokeLinecap="round" opacity=".7"/>
      </g>
      <Ripple x={123} y={52} r={8} color={C.accent}/>
      <Finger x={126} y={56} rot={-28}/>
    </Svg>
  )
}

/* The Professional's own tools, a row each. */
function ProTools() {
  const rows = [[16, C.sky, 'quote'], [38, C.lilac, 'branch'], [60, C.mint, 'timer'], [82, C.coral, 'doc']]
  return (
    <Svg>
      {rows.map(([y, c, k], i) => (
        <g key={y} {...a('ht-in', i * 0.3)}>
          <rect x="12" y={y - 9} width="136" height="18" rx="6" fill={C.card} stroke={C.rule}/>
          <g transform={`translate(26 ${y})`} fill="none" stroke={c} strokeWidth="1.7"
            strokeLinecap="round" strokeLinejoin="round">
            {k === 'quote' && <path d="M-5 -4h10v6h-6l-3 3v-3h-1z"/>}
            {k === 'branch' && <path d="M-5 0h4M-1 0c2 0 2-4 5-4h1M-1 0c2 0 2 4 5 4h1"/>}
            {k === 'timer' && <><circle r="4.6"/><path d="M0 0v-3"/></>}
            {k === 'doc' && <path d="M-4 -5h5l3 3v7h-8z"/>}
          </g>
          <path d={`M40 ${y}h${70 - i * 9}`} stroke={C.ink3} strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
          <path d={`M136 ${y - 3}l3 3-3 3`} fill="none" stroke={C.ink3} strokeWidth="1.6" strokeLinecap="round"/>
        </g>
      ))}
    </Svg>
  )
}


const RAINBOW = [C.coral, C.gold, C.mint, C.sky, C.lilac]

/* The two clouds at the rainbow's feet, as the app's dials draw them
   (src/charts/rainbow.jsx): a white calm cloud under the left foot, a dark
   rain cloud with turquoise rain under the right. Same puffs and slab in the
   same 96 x 34 box, flat fills, rim drawn first so the seams never show. */
const CLOUD = {
  calm: [[10, 26, 8], [24, 21, 13], [42, 15, 15], [64, 20, 14], [84, 26, 8], [52, 27, 7]],
  peak: [[12, 25, 9], [30, 20, 14], [52, 15, 15], [74, 21, 13], [88, 27, 7], [42, 28, 6]],
}
const CLOUD_TONE = {
  calm: { fill: '#ffffff', rim: C.ruling },
  peak: { fill: C.ink3, rim: C.ink2 },
}

function Cloud({ cx, base, kind, s }) {
  const t = CLOUD_TONE[kind]
  const shapes = (
    <>
      <rect x="4" y="22" width="88" height="12" rx="6"/>
      {CLOUD[kind].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r}/>)}
    </>
  )
  return (
    <g transform={`translate(${cx - 48 * s} ${base - 34 * s}) scale(${s})`}>
      <g fill={t.rim} stroke={t.rim} strokeWidth={(kind === 'calm' ? 1.4 : 1.1) / s}>{shapes}</g>
      <g fill={t.fill}>{shapes}</g>
      {kind === 'peak' && (
        <g stroke={C.beam} strokeLinecap="round" strokeWidth={2 / s}>
          <path d="M30 38l-3 9M50 40l-3 10M70 38l-3 8"/>
        </g>
      )}
    </g>
  )
}

/* Both clouds for a rainbow centred on (cx, cy) whose bands run from radius
   rIn to rOut: each cloud sits under a foot, base a little below it. */
function Weather({ cx, cy, rIn, rOut, s }) {
  const foot = (rIn + rOut) / 2
  return (
    <g>
      <Cloud cx={cx - foot} base={cy + 8 * s} kind="calm" s={s}/>
      <Cloud cx={cx + foot} base={cy + 8 * s} kind="peak" s={s}/>
    </g>
  )
}

function Dial() {
  const cx = 80, cy = 84
  return (
    <Svg>
      {RAINBOW.map((c, i) => {
        const r = 66 - i * 9
        return <path key={c} d={`M${cx - r} ${cy}a${r} ${r} 0 0 1 ${r * 2} 0`} fill="none"
          stroke={c} strokeWidth="6.5" strokeLinecap="round" opacity=".9"/>
      })}
      <Weather cx={cx} cy={cy} rIn={30} rOut={66} s={0.58}/>
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
      {/* starters to tap, then your question goes out and an answer comes */}
      {[10, 30].map((y, i) => (
        <g key={y}>
          <rect x="8" y={y} width="84" height="16" rx="6" fill={C.paper} stroke={C.rule}/>
          <path d={`M16 ${y + 8}h${56 - i * 14}`} stroke={C.ink2} strokeWidth="2.2" strokeLinecap="round" opacity=".6"/>
        </g>
      ))}
      <Ripple x={60} y={18} r={7} color={C.beam}/>
      <Finger x={62} y={21} rot={-30}/>
      <Bubble x={92} y={8} w={60} h={22} fill={C.beam} tail="right" anim={a('ht-in', 0.4)}>
        <Lines x={100} y={16} w={[42, 26]} color="#fff" op={0.9}/>
      </Bubble>
      <Bubble x={8} y={56} w={104} h={30} fill={C.card} stroke={C.rule} tail="left" anim={a('ht-in', 1.1)}>
        <Lines x={17} y={65} w={[80, 70, 44]} gap={6.5}/>
      </Bubble>
      <g {...a('ht-pulse')}>
        {[124, 133, 142].map(x => <circle key={x} cx={x} cy="76" r="2.6" fill={C.ink3}/>)}
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
  const cx = 80, cy = 90
  return (
    <Svg>
      <Person x={50} y={25} fill={C.mint}/>
      <Person x={110} y={25} fill={C.lilac}/>
      <g {...a('ht-swap')}>
        <circle cx="50" cy="25" r="17" fill="none" stroke={C.ink} strokeWidth="2.2"/>
      </g>
      {RAINBOW.map((c, i) => {
        const r = 42 - i * 6
        return <path key={c} d={`M${cx - r} ${cy}a${r} ${r} 0 0 1 ${r * 2} 0`} fill="none"
          stroke={c} strokeWidth="4.5" strokeLinecap="round" opacity=".9"/>
      })}
      <Weather cx={cx} cy={cy} rIn={18} rOut={42} s={0.36}/>
      <LampFaceG light="yellow" cx={cx} cy={cy - 7} size={17} px={22}/>
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




export const ART = {
  startBar: StartBar,
  cards: Cards,
  patch: Patch,
  fourWays: FourWays,
  howWays: HowWays,
  dial: Dial,
  todayDial: TodayDial,
  rangeCal: RangeCal,
  log: Log,
  range: Range,
  calendar: Calendar,
  childPick: ChildPick,
  toolTabs: ToolTabs,
  toolPick: ToolPick,
  levels: Levels,
  together: Together,
  opener: Opener,
  proTools: ProTools,
  chat: Chat,
  source: Source,
  help: Help,
  twoAudiences: TwoAudiences,
  dayView: DayView,
  keepDays: KeepDays,
  locked: Locked,
  table: Table,
  familyNet: FamilyNet,
  inviteBoth: InviteBoth,
  invite: Invite,
  teenChoose: TeenChoose,
  joined: Joined,
  quickTools: QuickTools,
  roster: Roster,
  headsCount: HeadsCount,
  eachGroup: EachGroup,
  filterOpen: FilterOpen,
}
