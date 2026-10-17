import React from 'react'
import { Sky, Sparks, Face, Loop, wave, cloud, heart } from './kit.jsx'

/* One illustrated scene per toolkit activity, keyed by tool id. Each is a
 * flat, soft, outline free drawing in three depth layers (np-far, np-mid,
 * np-near) with exactly one gentle loop that shows what the activity does.
 * `u` is a per card prefix for gradient and clip ids. */

const grass = (from, to, base, tall, step = 8) => {
  let d = ''
  for (let x = from, i = 0; x < to; x += step, i++) {
    const h = tall - ((i * 7) % 9)
    d += `M${x} ${base}L${x + step / 2} ${base - h}L${x + step} ${base}Z`
  }
  return d
}

const Q = ({ x, y, s = 1, fill = '#ffffff', o = 0.85 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M-4 -5a4.5 4.5 0 1 1 6.5 4c-1.6 .9 -2.4 1.8 -2.4 3.6" fill="none" stroke={fill}
      strokeWidth="2.4" strokeLinecap="round"/>
    <circle cx=".1" cy="6.6" r="1.5" fill={fill}/>
  </g>
)

export const SCENES = {
  /* ── student exercises ─────────────────────────────────────────────── */

  /* Box Breathing: a light travels round a square of moonlight, four even
     sides of four seconds, over a night sea. */
  breathing: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#173a6b'], [0.6, '#24508f'], [1, '#3a6fb0']]}/>
      <Sparks fill="#fff3c4" at={[[150, 20, 3], [176, 10, 2], [268, 58, 2.4], [292, 14, 2.2]]}/>
      <g className="np-far">
        <circle cx="268" cy="26" r="20" fill="#fff3c4" opacity=".14"/>
        <circle cx="268" cy="26" r="10" fill="#fff3c4"/>
        <circle cx="265" cy="23" r="2.2" fill="#f0dfa0"/><circle cx="271" cy="29" r="1.6" fill="#f0dfa0"/>
      </g>
      <g className="np-mid">
        <rect x="190" y="24" width="52" height="52" rx="8" fill="#ffffff" fillOpacity=".08"
          stroke="#ffe9a8" strokeOpacity=".6" strokeWidth="2.5"/>
        <Loop at={[190, 24]} anim="box" d="16s">
          <circle r="11" fill="#ffe9a8" opacity=".3"/>
          <circle r="5" fill="#fff6d6"/>
        </Loop>
        <path d={wave(88, 2.5)} fill="#1d4a86"/>
        <rect x="196" y="94" width="40" height="2.4" rx="1.2" fill="#ffe9a8" opacity=".4"/>
        <rect x="204" y="100" width="24" height="2" rx="1" fill="#ffe9a8" opacity=".3"/>
      </g>
      <g className="np-near"><path d={wave(106, 2)} fill="#122f5c"/></g>
    </>
  ),

  /* 5-4-3-2-1 Grounding: five things for five senses float in warm light. */
  ground: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#ffd56b'], [0.6, '#ffc54f'], [1, '#ffb03a']]}/>
      <g className="np-far">
        <circle cx="232" cy="62" r="50" fill="#ffe8a3" opacity=".55"/>
        <circle cx="232" cy="62" r="30" fill="#fff0bf" opacity=".6"/>
        <path d="M100 100C150 86 200 88 240 96S290 90 330 88V160H100Z" fill="#ffbb45"/>
      </g>
      <Sparks at={[[176, 18, 3], [300, 70, 2.6], [212, 100, 2]]}/>
      <g className="np-mid">
        <Loop at={[158, 46]} anim="bob" d="4.5s">
          <path d="M-13 0Q0 -11 13 0Q0 11 -13 0Z" fill="#fffaf0"/>
          <circle r="4.6" fill="#3d2400"/><circle cx="1.5" cy="-1.5" r="1.3" fill="#ffffff"/>
        </Loop>
        <Loop at={[192, 76]} anim="bob" d="4.5s" w="-.9s">
          <path d="M-1 6V-10l11 -3v14" fill="none" stroke="#7a3fb0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <ellipse cx="-4.5" cy="6" rx="4" ry="3" fill="#7a3fb0"/><ellipse cx="6.5" cy="1" rx="4" ry="3" fill="#7a3fb0"/>
        </Loop>
        <Loop at={[224, 36]} anim="bob" d="4.5s" w="-1.8s">
          <path d="M-12 6C-10 -8 4 -12 13 -8C10 6 -2 10 -12 6Z" fill="#4fb36a"/>
          <path d="M-10 5C-2 0 5 -4 11 -7" stroke="#2f8a4a" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
        </Loop>
        <Loop at={[256, 78]} anim="bob" d="4.5s" w="-2.7s">
          {[0, 72, 144, 216, 288].map(a => (
            <circle key={a} cx={6.5 * Math.cos(a * Math.PI / 180)} cy={6.5 * Math.sin(a * Math.PI / 180)} r="5.2" fill="#ff7aa8"/>
          ))}
          <circle r="4" fill="#fff0bf"/>
        </Loop>
        <Loop at={[284, 42]} anim="bob" d="4.5s" w="-3.6s">
          <path d="M-9 -4C-9 6 -3 12 0 12C3 12 9 6 9 -4C6 -7 -6 -7 -9 -4Z" fill="#e8473f"/>
          {[[-4, 0], [3, -1], [0, 5], [-3, 7], [4, 5]].map(([x, y]) => <circle key={x + ' ' + y} cx={x} cy={y} r=".9" fill="#ffd56b"/>)}
          <path d="M-6 -6L-2 -4L0 -9L2 -4L6 -6L3 -2H-3Z" fill="#3f9a4a"/>
        </Loop>
      </g>
      <g className="np-near"><path d="M-160 106C60 96 140 98 200 104S280 98 330 100V160H-160Z" fill="#ffa62e"/></g>
    </>
  ),

  /* Thought Reframe: inside a thought bubble the rain cloud turns into sun
     and a rainbow, and back. */
  reframe: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#4d2380'], [0.55, '#7a3fb0'], [1, '#c46bc4']]}/>
      <Sparks at={[[160, 16, 3], [290, 22, 2.6], [282, 92, 2.2]]}/>
      <g className="np-far"><path d="M-160 104C40 96 120 92 190 100S270 92 330 94V160H-160Z" fill="#3b1a66"/></g>
      <g className="np-mid">
        <g fill="#fbf5ff">
          <ellipse cx="228" cy="56" rx="46" ry="25"/>
          <circle cx="202" cy="42" r="18"/><circle cx="230" cy="34" r="22"/><circle cx="256" cy="44" r="17"/>
          <circle cx="180" cy="84" r="6.5"/><circle cx="166" cy="98" r="4"/>
        </g>
        <Loop anim="swap-b" d="9s" w="-4.5s" opacity="0">
          <path d={cloud(208, 56, 0.9)} fill="#9a93b8"/>
          <g stroke="#6fa0e0" strokeWidth="2.2" strokeLinecap="round">
            <path d="M216 62l-2 6M228 62l-2 6M240 62l-2 6"/>
          </g>
        </Loop>
        <Loop anim="swap-a" d="9s" w="-4.5s">
          {[['#ff8a65', 20], ['#ffd15c', 15.5], ['#7ee0a6', 11]].map(([c, r]) => (
            <path key={c} d={`M${226 - r} 66A${r} ${r} 0 0 1 ${226 + r} 66`} fill="none" stroke={c} strokeWidth="4.2"/>
          ))}
          <circle cx="248" cy="38" r="8" fill="#ffc845"/>
        </Loop>
      </g>
    </>
  ),

  /* Body Scan: a soft line of light passes down a calm, resting figure. */
  scan: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#0b5a44'], [0.6, '#138a66'], [1, '#4cc59a']]}/>
      <Sparks at={[[170, 22, 2.8], [288, 30, 2.6], [282, 84, 2]]}/>
      <g className="np-far"><circle cx="225" cy="62" r="48" fill="#7fe0b8" opacity=".22"/></g>
      <g className="np-mid">
        <rect x="202" y="28" width="46" height="76" rx="23" fill="#ffb36b"/>
        <rect x="212" y="60" width="26" height="36" rx="13" fill="#ffc78f"/>
        <Face x={225} y={46} ink="#6b3410"/>
        <Loop anim="scan" d="7s">
          <rect x="186" y="25" width="78" height="10" rx="5" fill="#d6fff0" opacity=".35"/>
          <rect x="188" y="29" width="74" height="2.4" rx="1.2" fill="#ffffff"/>
        </Loop>
      </g>
      <g className="np-near">
        <path d="M-160 106C60 100 160 98 225 102S300 100 330 100V160H-160Z" fill="#0a4535"/>
        <path d="M184 104C180 94 184 88 192 86C194 94 190 100 184 104Z" fill="#4cc59a"/>
        <path d="M268 104C272 94 270 88 262 86C258 94 262 100 268 104Z" fill="#4cc59a"/>
      </g>
    </>
  ),

  /* Movement Break: a happy blob bounces over warm hills. */
  move: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#a8361a'], [0.55, '#e0583a'], [1, '#ff9466']]}/>
      <g className="np-far">
        <circle cx="266" cy="32" r="22" fill="#ffd15c" opacity=".3"/>
        <circle cx="266" cy="32" r="13" fill="#ffd15c"/>
        <path d="M60 102C120 72 170 74 210 90S280 72 330 80V160H60Z" fill="#c7462a"/>
      </g>
      <Sparks fill="#ffe2d6" at={[[160, 26, 2.8], [196, 14, 2.2], [292, 64, 2.4]]}/>
      <g className="np-mid">
        <Loop at={[222, 104]} anim="shadow" d="1.9s"><ellipse rx="16" ry="3.6" fill="#5a1a08"/></Loop>
        <Loop at={[222, 104]} anim="hop" d="1.9s" origin="50% 100%">
          <circle cy="-17" r="16" fill="#ffd15c"/>
          <circle cx="-6" cy="-25" r="4.5" fill="#fff3c4" opacity=".8"/>
          <Face x={0} y={-18} s={0.85} ink="#7a3a08"/>
        </Loop>
        <g fill="#ffe2d6" opacity=".75">
          <rect x="180" y="58" width="9" height="2.6" rx="1.3"/><rect x="176" y="66" width="12" height="2.6" rx="1.3"/>
        </g>
      </g>
      <g className="np-near"><path d="M-160 104C80 100 180 100 330 104V160H-160Z" fill="#8f2b13"/></g>
    </>
  ),

  /* Long Exhale: a balloon slowly breathes out over a sunset sea. */
  sigh: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#6b2c55'], [0.5, '#d9566a'], [1, '#ffb067']]}/>
      <Sparks fill="#ffe0ec" at={[[160, 20, 2.6], [292, 18, 2.2], [178, 54, 2]]}/>
      <g className="np-far">
        <circle cx="258" cy="86" r="36" fill="#ffd27a" opacity=".3"/>
        <circle cx="258" cy="86" r="22" fill="#ffd27a"/>
      </g>
      <g className="np-mid">
        <path d={wave(86, 1.5)} fill="#c2475e"/>
        <rect x="236" y="93" width="44" height="2.2" rx="1.1" fill="#ffb59a" opacity=".8"/>
        <rect x="246" y="99" width="26" height="2" rx="1" fill="#ffb59a" opacity=".6"/>
        <path d="M206 70q-4 6 1 10t-1 6" fill="none" stroke="#fff0e6" strokeWidth="1.4" strokeLinecap="round" opacity=".85"/>
        <Loop anim="deflate" d="11s" origin="50% 100%">
          <path d="M206 68C191 63 186 47 186 40C186 28 194 20 206 20C218 20 226 28 226 40C226 47 221 63 206 68Z" fill="#6fd6c9"/>
          <ellipse cx="198" cy="32" rx="4" ry="6.5" fill="#ffffff" opacity=".55"/>
          <path d="M203 67.5h6l-3 3.5z" fill="#4fb8ab"/>
        </Loop>
      </g>
      <g className="np-near"><path d={wave(104, 2)} fill="#9e3450"/></g>
    </>
  ),

  /* Breath Counter: a little boat rides the rolling waves. */
  chest: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#8c1550'], [0.55, '#d63f86'], [1, '#ff9cc6']]}/>
      <g className="np-far">
        <path d={cloud(236, 34, 0.9)} fill="#ffc2dc" opacity=".65"/>
        <path d={cloud(166, 24, 0.55)} fill="#ffc2dc" opacity=".45"/>
      </g>
      <Sparks fill="#ffe0ee" at={[[200, 14, 2.4], [292, 50, 2.4]]}/>
      <g className="np-mid">
        <Loop anim="drift" d="7s"><path d={wave(84, 4)} fill="#b8286c"/></Loop>
        <Loop at={[226, 80]} anim="rock" d="5.5s">
          <path d="M-18 0H18L12 9H-12Z" fill="#fff4e6"/>
          <rect x="-1" y="-25" width="2" height="25" fill="#fff4e6"/>
          <path d="M1 -24L16 -3H1Z" fill="#ffd36b"/>
          <path d="M-1 -18L-12 -3H-1Z" fill="#ffe9b0"/>
        </Loop>
      </g>
      <g className="np-near"><Loop anim="drift" d="5s"><path d={wave(94, 3)} fill="#7a0f43"/></Loop></g>
    </>
  ),

  /* Hold Still: a marble rests on a lily pad; ripples spread on a still pond. */
  steady: ({ u }) => (
    <>
      <defs>
        <radialGradient id={u + 'm'} cx=".35" cy=".3" r=".75">
          <stop offset="0" stopColor="#ffffff"/><stop offset=".45" stopColor="#bfe9ff"/><stop offset="1" stopColor="#4aa8e0"/>
        </radialGradient>
      </defs>
      <Sky u={u} stops={[[0, '#134d36'], [0.6, '#1f7a52'], [1, '#5bbf86']]}/>
      <Sparks fill="#e8ffd0" at={[[176, 22, 2.6], [292, 26, 2.2], [210, 12, 2]]}/>
      <g className="np-far" fill="#175c3e">
        <circle cx="168" cy="76" r="18"/><circle cx="290" cy="62" r="24"/><circle cx="262" cy="76" r="14"/>
      </g>
      <g className="np-mid">
        <ellipse cx="228" cy="98" rx="84" ry="20" fill="#1b6f6a"/>
        <ellipse cx="228" cy="96" rx="72" ry="15" fill="#22827b"/>
        <Loop at={[228, 92]} anim="ripple" d="4.6s">
          <ellipse rx="36" ry="8.5" fill="none" stroke="#bff0e6" strokeWidth="1.6"/>
        </Loop>
        <Loop at={[228, 92]} anim="ripple" d="4.6s" w="-2.3s">
          <ellipse rx="36" ry="8.5" fill="none" stroke="#bff0e6" strokeWidth="1.6"/>
        </Loop>
        <ellipse cx="228" cy="92" rx="25" ry="6.5" fill="#7ed37a"/>
        <path d="M228 92L242 86.5L250 90Z" fill="#22827b"/>
        <ellipse cx="228" cy="91" rx="8" ry="2" fill="#3f9a4a" opacity=".6"/>
        <circle cx="228" cy="82" r="9" fill={`url(#${u}m)`}/>
      </g>
      <g className="np-near" fill="none" stroke="#0f3d2a" strokeWidth="3" strokeLinecap="round">
        <path d="M150 112q2-20 -4-34M157 112q0-16 6-26M300 112q-2-18 4-30M293 112q0-12 -5-20"/>
      </g>
    </>
  ),

  /* Reaction Test: a firefly wanders a night meadow and blinks. */
  alert: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#1b1745'], [0.6, '#2a2470'], [1, '#3c3a9a']]}/>
      <Sparks fill="#dcd7ff" at={[[150, 16, 2.4], [186, 30, 1.8], [244, 12, 2.2], [296, 44, 2]]}/>
      <g className="np-far">
        <circle cx="270" cy="26" r="10" fill="#fff3c4"/>
        <circle cx="275" cy="22" r="9" fill="#36338c"/>
        <path d="M60 100C130 84 190 86 240 94S300 84 330 86V160H60Z" fill="#221d5a"/>
      </g>
      <g className="np-mid">
        <g transform="translate(262 80)"><circle r="7" fill="#e8ff7a" opacity=".25"/><circle r="1.8" fill="#f4ffb0"/></g>
        <Loop at={[214, 54]} anim="firefly" d="7s">
          <Loop anim="blink" d="3.2s"><circle r="17" fill="#e8ff7a" opacity=".45"/></Loop>
          <Loop anim="blink" d="3.2s"><circle r="5" fill="#f4ffb0"/></Loop>
          <ellipse cx="-5" cy="-2" rx="5" ry="3.2" fill="#4a4370"/>
          <ellipse cx="-5" cy="-6.5" rx="4" ry="2.4" fill="#ffffff" opacity=".55"/>
          <circle cx="-10.5" cy="-2.6" r="2.2" fill="#4a4370"/>
        </Loop>
      </g>
      <g className="np-near">
        <rect x="-160" y="108" width="500" height="60" fill="#120f33"/>
        <path d={grass(110, 330, 110, 20)} fill="#120f33"/>
      </g>
    </>
  ),

  /* Breathing by Sound: rings of sound ripple out across a still lake. */
  pocket: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#262b80'], [0.6, '#4652c0'], [1, '#8a96f0']]}/>
      <Sparks fill="#dfe3ff" at={[[160, 18, 2.6], [292, 22, 2.4], [262, 10, 1.8]]}/>
      <g className="np-far"><path d="M110 78L150 50L178 70L214 38L252 72L280 54L330 78Z" fill="#3a43a0"/></g>
      <g className="np-mid">
        <rect x="-160" y="76" width="500" height="80" fill="#2f3aa8"/>
        <rect x="-160" y="76" width="500" height="2.6" fill="#8a96f0" opacity=".5"/>
        {['0s', '-1.5s', '-3s'].map(w => (
          <Loop key={w} at={[200, 92]} anim="ripple" d="4.5s" w={w}>
            <ellipse rx="50" ry="10" fill="none" stroke="#c9d2ff" strokeWidth="1.6"/>
          </Loop>
        ))}
        <ellipse cx="200" cy="93" rx="11" ry="3.2" fill="#7be0b5"/>
        <path d="M200 92c-6 0-9-6-7-10 3 1 5 4 7 7 2-3 4-6 7-7 2 4-1 10-7 10z" fill="#ff9fc6"/>
        <g fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity=".85">
          <path d="M214 50a10 10 0 0 1 0 14M220 45a17 17 0 0 1 0 24M226 40a24 24 0 0 1 0 34"/>
        </g>
        <path d="M196 64V46l9-2.5v14" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <ellipse cx="193" cy="64" rx="3.6" ry="2.7" fill="#ffffff"/><ellipse cx="202" cy="57.5" rx="3.6" ry="2.7" fill="#ffffff"/>
      </g>
    </>
  ),

  /* Short Walk: footprints appear one by one along a path over the hills. */
  walk: ({ u }) => {
    const steps = [[166, 114, -40], [178, 109, -35], [192, 106, -50], [205, 100, -45], [218, 94, -55], [232, 88, -50], [246, 82, -60]]
    return (
      <>
        <Sky u={u} stops={[[0, '#d4efff'], [0.6, '#c4e8ff'], [1, '#ffe9b8']]}/>
        <g className="np-far">
          <circle cx="276" cy="26" r="22" fill="#ffe9a6" opacity=".6"/>
          <circle cx="276" cy="26" r="13" fill="#ffd86b"/>
          <path d="M80 86C140 60 200 62 250 74S300 62 330 64V160H80Z" fill="#a8dd8a"/>
        </g>
        <g className="np-mid">
          <path d="M-160 98C60 90 160 82 230 90S300 86 330 88V160H-160Z" fill="#6cc46a"/>
          <path d="M150 124C175 110 200 108 212 98S240 82 262 74L270 77C252 86 238 96 226 104S196 118 184 126Z" fill="#f6e7c1"/>
          <rect x="188.5" y="66" width="3" height="16" fill="#8a5a2a"/><circle cx="190" cy="64" r="10" fill="#3f9a4a"/>
          <rect x="288.5" y="60" width="2.6" height="12" fill="#8a5a2a"/><circle cx="290" cy="58" r="7.5" fill="#3f9a4a"/>
          {steps.map(([x, y, r], i) => (
            <g key={i} transform={`translate(${x + (i % 2 ? 2.5 : -2.5)} ${y + (i % 2 ? 1.5 : -1.5)}) rotate(${r + 90})`}>
              <Loop anim="step" d="5.2s" w={`${i * 0.45}s`}>
                <ellipse rx="3.6" ry="2.2" fill="#a0743a"/>
              </Loop>
            </g>
          ))}
        </g>
      </>
    )
  },

  /* ── parent tools ──────────────────────────────────────────────────── */

  /* Conversation Openers: two speech bubbles take turns. */
  openers: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#b0391c'], [0.55, '#e5603d'], [1, '#ff9b6e']]}/>
      <g className="np-far"><circle cx="256" cy="30" r="34" fill="#ffb08a" opacity=".3"/></g>
      <Sparks fill="#ffe4da" at={[[160, 20, 2.6], [294, 70, 2.4]]}/>
      <g className="np-mid">
        <Loop at={[208, 46]} anim="bob" d="5s">
          <path d="M-30 -18H30A10 10 0 0 1 40 -8V10A10 10 0 0 1 30 20H-10L-22 30V20H-30A10 10 0 0 1 -40 10V-8A10 10 0 0 1 -30 -18Z" fill="#fff4ea"/>
          <rect x="-28" y="-7" width="46" height="4.4" rx="2.2" fill="#ffc9b0"/>
          <rect x="-28" y="3" width="30" height="4.4" rx="2.2" fill="#ffc9b0"/>
        </Loop>
        <Loop at={[262, 80]} anim="bob" d="5s" w="-2.5s">
          <path d="M-22 -14H22A9 9 0 0 1 31 -5V7A9 9 0 0 1 22 16H14V25L4 16H-22A9 9 0 0 1 -31 7V-5A9 9 0 0 1 -22 -14Z" fill="#ffd36b"/>
          {[-10, 0, 10].map(x => <circle key={x} cx={x} cy="1" r="3" fill="#b0391c"/>)}
        </Loop>
        <g transform="translate(250 22)"><path d={heart(6)} fill="#ffffff" opacity=".9"/></g>
      </g>
      <g className="np-near"><path d="M-160 110C80 106 200 104 330 108V160H-160Z" fill="#8f2a12"/></g>
    </>
  ),

  /* Opening Line Check: a note gets a friendly tick. */
  phrasing: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#5a2a8c'], [0.55, '#8a4fc0'], [1, '#c693e8']]}/>
      <g className="np-far"><circle cx="236" cy="58" r="48" fill="#d9b3ff" opacity=".22"/></g>
      <Sparks fill="#efe2ff" at={[[168, 18, 2.6], [292, 20, 2.4], [290, 104, 2]]}/>
      <g className="np-mid">
        <g transform="translate(222 58) rotate(-6)">
          <rect x="-34" y="-38" width="68" height="76" rx="9" fill="#fffaf2"/>
          <g fill="#d9c6f0">
            <rect x="-24" y="-24" width="48" height="4.4" rx="2.2"/><rect x="-24" y="-12" width="40" height="4.4" rx="2.2"/>
            <rect x="-24" y="0" width="46" height="4.4" rx="2.2"/><rect x="-24" y="12" width="28" height="4.4" rx="2.2"/>
          </g>
        </g>
        <g transform="translate(178 86) rotate(-40)">
          <rect x="-3.5" y="-22" width="7" height="30" rx="2" fill="#ffd15c"/>
          <path d="M-3.5 8L0 15L3.5 8Z" fill="#f4c99a"/>
          <rect x="-3.5" y="-27" width="7" height="6" rx="1.8" fill="#ff8fb3"/>
        </g>
        <Loop at={[258, 88]} anim="pop" d="4.2s">
          <circle r="13" fill="#3ecf9a"/>
          <path d="M-6 0L-2 4.5L6.5 -4.5" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </Loop>
      </g>
      <g className="np-near"><path d="M-160 112C80 108 200 106 330 110V160H-160Z" fill="#45206e"/></g>
    </>
  ),

  /* Reading the Mind Score: a rainbow dial with a gently swaying needle. */
  score: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#0d5590'], [0.55, '#2a86c8'], [1, '#7cc4f0']]}/>
      <g className="np-far">
        <path d={cloud(150, 34, 0.7)} fill="#ffffff" opacity=".45"/>
        <path d={cloud(262, 26, 0.6)} fill="#ffffff" opacity=".55"/>
      </g>
      <g className="np-mid">
        {[['#ff8a65', 58], ['#ffd15c', 48], ['#7ee0a6', 38], ['#8fd0ff', 28]].map(([c, r]) => (
          <path key={c} d={`M${226 - r} 100A${r} ${r} 0 0 1 ${226 + r} 100`} fill="none" stroke={c} strokeWidth="9"/>
        ))}
        <g transform="translate(226 100)">
          <Loop anim="needle" d="7s" origin="50% 100%"><path d="M-2.6 0L0 -42L2.6 0Z" fill="#ffffff"/></Loop>
          <circle r="5.5" fill="#ffffff"/><circle r="2.2" fill="#0d5590"/>
        </g>
      </g>
      <g className="np-near">
        <path d={cloud(146, 110, 0.95)} fill="#ffffff"/>
        <path d={cloud(268, 110, 0.85)} fill="#ffffff"/>
      </g>
    </>
  ),

  /* Conversation Ground Rules: six stones balanced in a calm stack. */
  rules: ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#ffe6a8'], [0.6, '#ffd98a'], [1, '#ffc76a']]}/>
      <g className="np-far">
        <circle cx="272" cy="30" r="14" fill="#fff3cf"/>
        <rect x="-160" y="80" width="500" height="14" fill="#9fd8de"/>
        <path d="M180 34q4-4 8 0q4-4 8 0" fill="none" stroke="#7a5a20" strokeWidth="1.6" strokeLinecap="round"/>
      </g>
      <Sparks fill="#ffffff" at={[[160, 22, 2.6], [298, 62, 2.2]]}/>
      <g className="np-mid">
        <path d="M-160 92C60 88 180 86 230 92S300 90 330 88V160H-160Z" fill="#f2b75a"/>
        <ellipse cx="226" cy="90" rx="22" ry="8" fill="#b07a5a"/>
        <ellipse cx="227" cy="78" rx="17" ry="6.5" fill="#6f9f96"/>
        <ellipse cx="225" cy="67" rx="14" ry="6" fill="#d9a46a"/>
        <ellipse cx="226" cy="57" rx="11" ry="5" fill="#8f7ab0"/>
        <Loop anim="wobble" d="5s" origin="50% 100%">
          <ellipse cx="226" cy="48" rx="9" ry="4.5" fill="#e08a6a"/>
          <ellipse cx="226" cy="40" rx="6.5" ry="4" fill="#5f8fb8"/>
        </Loop>
      </g>
      <g className="np-near"><path d="M140 124C180 106 260 100 330 104V160H140Z" fill="#e9a443"/></g>
    </>
  ),

  /* When to Get Help: a lighthouse beam sweeps over an evening sea. */
  reach: ({ u }) => (
    <>
      <defs>
        <linearGradient id={u + 'b'} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fff3b0" stopOpacity=".8"/><stop offset="1" stopColor="#fff3b0" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <Sky u={u} stops={[[0, '#0d4a52'], [0.55, '#16707a'], [1, '#4fb3b0']]}/>
      <Sparks fill="#d3f2f2" at={[[160, 16, 2.4], [292, 18, 2.2], [282, 52, 1.8]]}/>
      <g className="np-mid">
        <path d={wave(92, 2)} fill="#0a3a40"/>
        <g transform="translate(240 31)">
          <Loop anim="sweep" d="8s" origin="100% 50%"><path d="M0 0L-130 -20L-130 20Z" fill={`url(#${u}b)`}/></Loop>
        </g>
        <path d="M206 98C212 86 226 80 240 82S262 86 272 98Z" fill="#183034"/>
        <path d="M231 86L234 40H246L249 86Z" fill="#fdf7ee"/>
        <path d="M232.3 70L232.9 60H247.1L247.7 70Z" fill="#e25d4a"/>
        <path d="M233.4 52L233.8 45H246.2L246.6 52Z" fill="#e25d4a"/>
        <rect x="229" y="37" width="22" height="3.4" rx="1.2" fill="#183034"/>
        <rect x="234" y="25" width="12" height="12" rx="2" fill="#ffe48a"/>
        <path d="M231 26L240 17L249 26Z" fill="#e25d4a"/>
      </g>
      <g className="np-near"><path d={wave(106, 2)} fill="#082e33"/></g>
    </>
  ),

  /* ── medical professional tools ────────────────────────────────────── */

  /* Session Openers: a door stands open and warm light spills out. */
  'pro-opener': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#1a3f73'], [0.55, '#2c5d9e'], [1, '#5d8fd0']]}/>
      <Sparks fill="#dce8ff" at={[[160, 18, 2.6], [290, 22, 2.4], [272, 64, 2]]}/>
      <g className="np-far"><circle cx="228" cy="62" r="44" fill="#ffd98a" opacity=".16"/></g>
      <g className="np-mid">
        <path d="M-160 100C60 96 170 90 230 94S300 96 330 96V160H-160Z" fill="#15335e"/>
        <Loop anim="glow" d="5s"><path d="M206 98L250 98L290 118L168 118Z" fill="#ffd98a" opacity=".6"/></Loop>
        <path d="M206 98V44A22 22 0 0 1 250 44V98Z" fill="#ffe9b0"/>
        <path d="M206 98V44A22 22 0 0 1 250 44V98" fill="none" stroke="#0f2a4f" strokeWidth="3"/>
        <path d="M206 44L190 36V106L206 98Z" fill="#c96f3f"/>
        <circle cx="195" cy="72" r="2" fill="#ffd15c"/>
      </g>
    </>
  ),

  /* Next Step Guide: a signpost on a sunny hill, the top sign turning. */
  'pro-triage': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#ffdf8f'], [0.6, '#ffcf6a'], [1, '#ffb85a']]}/>
      <g className="np-far">
        <path d={cloud(254, 28, 0.6)} fill="#ffffff" opacity=".8"/>
        <path d={cloud(170, 20, 0.45)} fill="#ffffff" opacity=".6"/>
        <path d="M100 96C150 80 210 82 250 90S300 82 330 82V160H100Z" fill="#f5a84a"/>
      </g>
      <g className="np-mid">
        <rect x="226" y="30" width="6" height="74" rx="2" fill="#7a4a1f"/>
        <path d="M226 52H192L184 60L192 68H226Z" fill="#7ed39a"/>
        <path d="M232 74H262L269 81L262 88H232Z" fill="#ff8a65"/>
        <Loop at={[229, 40]} anim="sway" d="6s" origin="0% 50%">
          <path d="M0 -8H40L48 0L40 8H0Z" fill="#5bb3e6"/>
        </Loop>
      </g>
      <g className="np-near">
        <path d="M-160 104C80 100 180 96 230 100S300 102 330 100V160H-160Z" fill="#e08a2e"/>
        <circle cx="198" cy="104" r="2.6" fill="#ffffff"/><circle cx="270" cy="106" r="2.4" fill="#ff7aa8"/>
      </g>
    </>
  ),

  /* Grounding Timer: sand runs through an hourglass. */
  'pro-ground': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#2d5a1e'], [0.6, '#4a8a2e'], [1, '#8cc65a']]}/>
      <Sparks fill="#e2f5d6" at={[[170, 20, 2.6], [290, 24, 2.4], [280, 86, 2]]}/>
      <g className="np-far"><circle cx="226" cy="60" r="46" fill="#a6dd7a" opacity=".22"/></g>
      <g className="np-mid">
        <path d="M216 34H236C235 44 230 51 226 56C222 51 217 44 216 34Z" fill="#ffd36b" className="np-a np-sandtop"
          style={{ '--d':'8s', transformOrigin:'50% 100%' }}/>
        <rect x="225.2" y="57" width="1.6" height="32" fill="#ffd36b" className="np-a np-stream" style={{ '--d':'8s' }}/>
        <path d="M214 92H238C236 83 230 78 226 77C222 78 216 83 214 92Z" fill="#ffd36b" className="np-a np-sandbot"
          style={{ '--d':'8s', transformOrigin:'50% 100%' }}/>
        <path d="M212 26H240C240 44 230 54 228 60C230 66 240 76 240 94H212C212 76 222 66 224 60C222 54 212 44 212 26Z"
          fill="#f2fff0" fillOpacity=".3" stroke="#ffffff" strokeOpacity=".75" strokeWidth="1.6"/>
        <rect x="207" y="24" width="3.2" height="72" fill="#a86f38"/><rect x="241.8" y="24" width="3.2" height="72" fill="#a86f38"/>
        <rect x="204" y="19" width="44" height="6" rx="3" fill="#c98a4a"/><rect x="204" y="94" width="44" height="6" rx="3" fill="#c98a4a"/>
      </g>
      <g className="np-near"><path d="M-160 104C80 100 180 100 330 104V160H-160Z" fill="#234a17"/></g>
    </>
  ),

  /* Talking With Parents: three friendly shapes share a hill under the moon. */
  'pro-parents': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#3f2272'], [0.6, '#6a3ea8'], [1, '#a476d6']]}/>
      <Sparks fill="#e9ddff" at={[[160, 18, 2.6], [200, 10, 2], [292, 52, 2.2]]}/>
      <g className="np-far">
        <circle cx="274" cy="24" r="18" fill="#fff0c2" opacity=".2"/>
        <circle cx="274" cy="24" r="10" fill="#fff0c2"/>
      </g>
      <g className="np-mid">
        <rect x="188" y="48" width="34" height="48" rx="17" fill="#ff9f6b"/>
        <Face x={205} y={64} s={0.8} ink="#7a2e08"/>
        <rect x="236" y="54" width="30" height="42" rx="15" fill="#6fd6c9"/>
        <Face x={251} y={68} s={0.75} ink="#0d4a44" cheek="#ff9fc6"/>
        <g transform="translate(228 54)"><path d={heart(4.5)} fill="#ffb3cf"/></g>
        <Loop at={[229, 92]} anim="bob" d="3.6s">
          <rect x="-10" y="-22" width="20" height="24" rx="10" fill="#ffd15c"/>
          <Face x={0} y={-12} s={0.5} ink="#7a4a08"/>
        </Loop>
      </g>
      <g className="np-near"><path d="M-160 102C60 98 170 92 230 94S300 96 330 98V160H-160Z" fill="#2e1757"/></g>
    </>
  ),

  /* Referral Note: a paper plane glides over soft clouds. */
  'pro-referral': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#cde9ff'], [0.6, '#b5ddff'], [1, '#9ccfff']]}/>
      <g className="np-far"><path d={cloud(262, 40, 0.6)} fill="#ffffff" opacity=".8"/></g>
      <Sparks fill="#ffffff" at={[[176, 24, 2.6], [296, 76, 2.2]]}/>
      <g className="np-mid">
        <path d="M150 74C176 52 202 84 226 62" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeDasharray="3 6" strokeLinecap="round"/>
        <Loop at={[244, 54]} anim="plane" d="7s">
          <path d="M-18 4L22 -12L0 6Z" fill="#ffffff"/>
          <path d="M0 6L22 -12L4 14Z" fill="#d6e4f5"/>
          <path d="M0 6L4 14L-1 11Z" fill="#a9c0e0"/>
        </Loop>
      </g>
      <g className="np-near">
        <path d={cloud(140, 120, 1.2)} fill="#ffffff"/>
        <path d={cloud(226, 124, 1.5)} fill="#ffffff"/>
        <path d={cloud(284, 120, 0.9)} fill="#f2f9ff"/>
      </g>
    </>
  ),

  /* ── life skills: school ───────────────────────────────────────────── */

  /* Time-Block Planner: soft blocks stack up; the newest drops into place. */
  'school-cram': ({ u }) => {
    const B = ({ x, y, w, c }) => (
      <g><rect x={x} y={y} width={w} height="16" rx="5" fill={c}/>
        <rect x={x + 4} y={y + 3} width={w * 0.4} height="3" rx="1.5" fill="#ffffff" opacity=".55"/></g>
    )
    return (
      <>
        <Sky u={u} stops={[[0, '#0e4f8a'], [0.55, '#2a7cc4'], [1, '#6fb6ee']]}/>
        <Sparks fill="#dcecff" at={[[164, 20, 2.6], [292, 26, 2.4], [286, 70, 2]]}/>
        <g className="np-far">
          <rect x="182" y="14" width="90" height="86" rx="12" fill="#ffffff" opacity=".12"/>
          <rect x="182" y="14" width="90" height="12" rx="6" fill="#ffffff" opacity=".16"/>
        </g>
        <g className="np-mid">
          <B x={186} y={80} w={40} c="#ffd15c"/><B x={228} y={80} w={40} c="#ff8a65"/>
          <B x={192} y={62} w={30} c="#7ee0a6"/><B x={224} y={62} w={38} c="#c39bff"/>
          <Loop anim="dropin" d="5.5s"><B x={204} y={44} w={44} c="#8fd0ff"/></Loop>
          <rect x="178" y="96" width="98" height="5" rx="2.5" fill="#0a3a66"/>
        </g>
      </>
    )
  },

  /* Source Checker: a magnifying glass slides across an open book. */
  'school-sources': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#e7dcff'], [0.6, '#d6c4ff'], [1, '#c3a8ff']]}/>
      <g className="np-far">
        <circle cx="270" cy="30" r="20" fill="#f3edff" opacity=".7"/>
        <circle cx="180" cy="26" r="12" fill="#f3edff" opacity=".5"/>
      </g>
      <Sparks fill="#ffffff" at={[[166, 50, 2.6], [292, 70, 2.4]]}/>
      <g className="np-mid">
        <rect x="-160" y="98" width="500" height="60" fill="#b394ec"/>
        <path d="M182 92C200 88 214 90 226 96C238 90 252 88 270 92V97H182Z" fill="#6a3fb0"/>
        <path d="M226 92C214 86 200 86 186 90V56C200 52 214 52 226 58Z" fill="#ffffff"/>
        <path d="M226 92C238 86 252 86 266 90V56C252 52 238 52 226 58Z" fill="#fbf8ff"/>
        <g fill="#d9ccf5">
          <rect x="194" y="62" width="24" height="3" rx="1.5"/><rect x="194" y="70" width="20" height="3" rx="1.5"/><rect x="194" y="78" width="24" height="3" rx="1.5"/>
          <rect x="234" y="62" width="24" height="3" rx="1.5"/><rect x="234" y="70" width="18" height="3" rx="1.5"/><rect x="234" y="78" width="22" height="3" rx="1.5"/>
        </g>
        <Loop at={[254, 62]} anim="slide" d="7s">
          <circle r="14" fill="#ffffff" fillOpacity=".45" stroke="#4a2580" strokeWidth="3.6"/>
          <path d="M10.5 10.5L20 20" stroke="#ff8a65" strokeWidth="5.5" strokeLinecap="round"/>
          <path d="M-7 -5a8 8 0 0 1 7 -4" stroke="#ffffff" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </Loop>
      </g>
    </>
  ),

  /* Good Enough Meter: a glass fills up to the line, and that is enough. */
  'school-good-enough': ({ u }) => {
    const glass = 'M204 30H248L242 96H210Z'
    return (
      <>
        <defs><clipPath id={u + 'g'}><path d={glass}/></clipPath></defs>
        <Sky u={u} stops={[[0, '#ffc9a8'], [0.6, '#ffb48a'], [1, '#ff9e72']]}/>
        <g className="np-far"><circle cx="226" cy="58" r="46" fill="#ffe1cc" opacity=".45"/></g>
        <Sparks fill="#ffffff" at={[[170, 24, 2.6], [290, 30, 2.4], [286, 84, 2]]}/>
        <g className="np-mid">
          <path d={glass} fill="#ffffff" fillOpacity=".5"/>
          <g clipPath={`url(#${u}g)`}>
            <Loop anim="fill" d="8s" origin="50% 100%"><rect x="198" y="50" width="56" height="48" fill="#5bc0f0"/></Loop>
          </g>
          <path d={glass} fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinejoin="round"/>
          <path d="M198 47H256" stroke="#7a2a0c" strokeWidth="2" strokeDasharray="4 4"/>
          <path d="M265 47l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7z" fill="#fff3cf" transform="translate(0 -6)"/>
        </g>
        <g className="np-near"><rect x="-160" y="98" width="500" height="60" fill="#e87a4e"/></g>
      </>
    )
  },

  /* Active Recall: questions float round a bulb that glows on and off. */
  'school-active': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#0f5a4a'], [0.6, '#1d8a6e'], [1, '#5cc9a2']]}/>
      <Sparks fill="#fff6c9" at={[[170, 20, 2.6], [292, 30, 2.4]]}/>
      <g className="np-far">
        <Q x={190} y={40}/><Q x={276} y={74} s={0.8}/><Q x={198} y={84} s={0.7} o={0.6}/>
      </g>
      <g className="np-mid">
        <Loop anim="glow" d="4s"><circle cx="234" cy="50" r="32" fill="#fff2a0" opacity=".5"/></Loop>
        <circle cx="234" cy="48" r="17" fill="#fff6c9"/>
        <path d="M226 60H242L240 72H228Z" fill="#fff6c9"/>
        <rect x="227" y="72" width="14" height="4" rx="2" fill="#c9d6d0"/>
        <rect x="228" y="77" width="12" height="4" rx="2" fill="#a9bab3"/>
        <path d="M229 50q2.5-5 5 0t5 0" stroke="#f2a93b" strokeWidth="1.7" fill="none" strokeLinecap="round"/>
      </g>
      <g className="np-near"><path d="M-160 104C80 98 180 96 330 102V160H-160Z" fill="#0b4a3c"/></g>
    </>
  ),

  /* ── life skills: outside ──────────────────────────────────────────── */

  /* Feed Check: posts scroll past on a phone beside a small clock. */
  'outside-feed': ({ u }) => {
    const C = ['#ffd15c', '#ff8a65', '#7ee0a6']
    return (
      <>
        <defs><clipPath id={u + 'p'}><rect x="209" y="20" width="42" height="80" rx="5"/></clipPath></defs>
        <Sky u={u} stops={[[0, '#1f2f6b'], [0.6, '#34509e'], [1, '#6f8fd8']]}/>
        <Sparks fill="#dde5ff" at={[[166, 20, 2.6], [292, 18, 2.2], [178, 90, 2]]}/>
        <g className="np-mid">
          <rect x="204" y="12" width="52" height="96" rx="11" fill="#0e1838"/>
          <rect x="209" y="20" width="42" height="80" rx="5" fill="#f4f7ff"/>
          <g clipPath={`url(#${u}p)`}>
            <Loop anim="scroll" d="9s">
              {Array.from({ length:7 }, (_, i) => (
                <g key={i} transform={`translate(212 ${23 + i * 26})`}>
                  <rect width="36" height="22" rx="4" fill={C[i % 3]}/>
                  <circle cx="7" cy="7" r="3.4" fill="#ffffff" opacity=".8"/>
                  <rect x="13" y="5" width="18" height="3" rx="1.5" fill="#ffffff" opacity=".8"/>
                  <rect x="5" y="14" width="24" height="3" rx="1.5" fill="#ffffff" opacity=".6"/>
                </g>
              ))}
            </Loop>
          </g>
          <rect x="223" y="15" width="14" height="2.6" rx="1.3" fill="#2a3a6e"/>
        </g>
        <g className="np-near">
          <circle cx="278" cy="44" r="13" fill="#fff3cf"/>
          <path d="M278 36.5V44L283 47" fill="none" stroke="#1f2f6b" strokeWidth="2.2" strokeLinecap="round"/>
        </g>
      </>
    )
  },

  /* Say It Calmly: steam curls up from a warm cup of tea. */
  'outside-conflict': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#f4ddff'], [0.6, '#ecd0ff'], [1, '#e0bcff']]}/>
      <g className="np-far"><circle cx="230" cy="60" r="46" fill="#ffffff" opacity=".3"/></g>
      <Sparks fill="#ffffff" at={[[170, 24, 2.6], [292, 28, 2.4]]}/>
      <g className="np-mid">
        {[214, 228, 242].map((x, i) => (
          <g key={x} transform={`translate(${x} 56)`}>
            <Loop anim="rise" d="4.2s" w={`-${i * 1.4}s`}>
              <path d="M0 0c-4 -6 4 -10 0 -16s4 -10 0 -14" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/>
            </Loop>
          </g>
        ))}
        <ellipse cx="228" cy="97" rx="32" ry="5" fill="#ffffff"/>
        <path d="M206 62H250V78C250 90 240 96 228 96C216 96 206 90 206 78Z" fill="#ffffff"/>
        <rect x="206" y="70" width="44" height="6" fill="#c26bff"/>
        <ellipse cx="228" cy="62" rx="22" ry="4" fill="#c98a5a"/>
        <path d="M250 67c10 0 10 14 0 14" stroke="#ffffff" strokeWidth="4" fill="none"/>
      </g>
      <g className="np-near"><rect x="-160" y="100" width="500" height="60" fill="#c9a0f0"/></g>
    </>
  ),

  /* Saying No: a little wall of pebbles, and the wave stops at it. */
  'outside-no': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#7a1f5c'], [0.55, '#b8407f'], [1, '#ff8fb3']]}/>
      <Sparks fill="#ffdcf0" at={[[164, 20, 2.6], [212, 12, 2], [290, 24, 2.2]]}/>
      <g className="np-far">
        <circle cx="276" cy="58" r="22" fill="#ffd6a0" opacity=".35"/>
        <circle cx="276" cy="58" r="13" fill="#ffd6a0"/>
      </g>
      <g className="np-mid">
        <path d="M-160 96C60 92 170 88 240 92S300 100 330 104V160H-160Z" fill="#ffd9a0"/>
        <Loop anim="lap" d="6s">
          <path d="M272 74C290 70 310 72 340 70V130H256C262 112 258 94 272 74Z" fill="#4fb3d9"/>
          <path d="M272 74C258 94 262 112 256 130" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
        </Loop>
        <g fill="#f6c27a">
          <rect x="184" y="70" width="14" height="28"/><rect x="214" y="70" width="14" height="28"/>
          <rect x="190" y="78" width="32" height="20"/>
          <rect x="184" y="66" width="4" height="5"/><rect x="189" y="66" width="4" height="5"/><rect x="194" y="66" width="4" height="5"/>
          <rect x="214" y="66" width="4" height="5"/><rect x="219" y="66" width="4" height="5"/><rect x="224" y="66" width="4" height="5"/>
        </g>
        <path d="M202 98v-8a4 4 0 0 1 8 0v8z" fill="#c98a3a"/>
        <path d="M221 66V54" stroke="#8a5a2a" strokeWidth="1.6"/>
        <path d="M221 54l10 3-10 3z" fill="#ffe066"/>
        <g fill="#b8806a"><circle cx="238" cy="96" r="3.6"/><circle cx="245" cy="97" r="3.4"/><circle cx="241.5" cy="90.5" r="3.2"/></g>
      </g>
    </>
  ),

  /* ── life skills: life ─────────────────────────────────────────────── */

  /* Home Basics: a little house, smoke curling from the chimney. */
  'life-home': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#ffd8c2'], [0.6, '#ffc6a6'], [1, '#ffb08a']]}/>
      <g className="np-far">
        <circle cx="278" cy="24" r="12" fill="#fff0c2"/>
        <path d="M100 94C150 78 200 80 240 88S300 80 330 80V160H100Z" fill="#f5a07a"/>
      </g>
      <Sparks fill="#ffffff" at={[[166, 24, 2.6], [298, 54, 2.2]]}/>
      <g className="np-mid">
        {[0, 1, 2].map(i => (
          <Loop key={i} anim="rise" d="4.5s" w={`-${i * 1.5}s`}>
            <circle cx="239.5" cy="32" r={4 + i} fill="#ffffff" opacity=".85"/>
          </Loop>
        ))}
        <rect x="236" y="40" width="7" height="16" fill="#b8432a"/>
        <rect x="200" y="60" width="46" height="38" fill="#fff4e6"/>
        <path d="M194 62L223 38L252 62Z" fill="#d9573a"/>
        <rect x="216" y="76" width="12" height="22" rx="2" fill="#7a3b1f"/>
        <rect x="204" y="68" width="9" height="9" rx="1.5" fill="#ffd15c"/>
        <rect x="233" y="68" width="9" height="9" rx="1.5" fill="#ffd15c"/>
        <rect x="174.5" y="82" width="3" height="16" fill="#8a5a2a"/><circle cx="176" cy="78" r="10" fill="#5fae5a"/>
      </g>
      <g className="np-near"><path d="M-160 100C80 96 180 94 330 98V160H-160Z" fill="#e0805a"/></g>
    </>
  ),

  /* Money Check: a coin drops into a smiling piggy bank. */
  'life-money': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#c9f2dd'], [0.6, '#b4ecd0'], [1, '#98e0bd']]}/>
      <g className="np-far"><circle cx="232" cy="60" r="44" fill="#ffffff" opacity=".35"/></g>
      <Sparks fill="#ffffff" at={[[170, 22, 2.6], [292, 26, 2.4], [196, 44, 2]]}/>
      <g className="np-mid">
        <path d="M-160 102C80 100 200 98 330 102V160H-160Z" fill="#7fd3aa"/>
        <ellipse cx="228" cy="100" rx="32" ry="4" fill="#5fb98e" opacity=".7"/>
        <Loop at={[229, 44]} anim="coin" d="3.4s">
          <circle r="7" fill="#ffcf4a"/><circle r="4.4" fill="none" stroke="#e0a400" strokeWidth="1.4"/>
        </Loop>
        <rect x="210" y="86" width="7" height="12" rx="2" fill="#f285ab"/><rect x="238" y="86" width="7" height="12" rx="2" fill="#f285ab"/>
        <ellipse cx="228" cy="76" rx="28" ry="20" fill="#ff9fc0"/>
        <path d="M212 60L219 50L224 61Z" fill="#f285ab"/>
        <ellipse cx="254" cy="78" rx="7" ry="6" fill="#ffb8d0"/>
        <circle cx="252" cy="78" r="1.2" fill="#c2557f"/><circle cx="256" cy="78" r="1.2" fill="#c2557f"/>
        <circle cx="244" cy="70" r="2" fill="#4a1a30"/>
        <path d="M200 74c-6-2-6-8-1-8" stroke="#f285ab" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
        <rect x="222" y="56.5" width="14" height="3" rx="1.5" fill="#c2557f"/>
        <g fill="#ffcf4a" stroke="#e0a400" strokeWidth="1">
          <ellipse cx="282" cy="98" rx="8" ry="2.6"/><ellipse cx="282" cy="94" rx="8" ry="2.6"/><ellipse cx="282" cy="90" rx="8" ry="2.6"/>
        </g>
      </g>
    </>
  ),

  /* Overwhelm Reset: the clouds part and the sun comes through. */
  'life-stress': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#2b4f7a'], [0.6, '#4a78a8'], [1, '#8fbce0']]}/>
      <Sparks fill="#dbe9fb" at={[[166, 20, 2.6], [292, 20, 2.2]]}/>
      <g className="np-far">
        <circle cx="232" cy="56" r="34" fill="#ffe9a0" opacity=".3"/>
        <g stroke="#ffe08a" strokeWidth="3" strokeLinecap="round" opacity=".8">
          {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
            const r = Math.PI * a / 180
            return <line key={a} x1={232 + 26 * Math.cos(r)} y1={56 + 26 * Math.sin(r)} x2={232 + 32 * Math.cos(r)} y2={56 + 32 * Math.sin(r)}/>
          })}
        </g>
        <circle cx="232" cy="56" r="20" fill="#ffd15c"/>
      </g>
      <g className="np-mid">
        <Loop anim="part-l" d="8s"><path d={cloud(180, 80, 1.3)} fill="#e8f1fb"/></Loop>
        <Loop anim="part-r" d="8s"><path d={cloud(224, 84, 1.35)} fill="#d6e6f7"/></Loop>
      </g>
      <g className="np-near"><path d="M-160 106C80 102 200 100 330 104V160H-160Z" fill="#224066"/></g>
    </>
  ),

  /* Own Your Health: a soft heart with a calm, slow beat. */
  'life-health': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#a8344d'], [0.55, '#e05a6e'], [1, '#ff9a8a']]}/>
      <Sparks fill="#ffe1e7" at={[[170, 22, 2.6], [290, 24, 2.4], [284, 88, 2]]}/>
      <g className="np-far"><circle cx="230" cy="58" r="44" fill="#ffb3b3" opacity=".22"/></g>
      <g className="np-mid">
        <Loop at={[230, 58]} anim="beat" d="3.2s">
          <path d={heart(26)} fill="#fff0f2"/>
          <rect x="-3.5" y="-9" width="7" height="20" rx="2.5" fill="#e05a6e"/>
          <rect x="-10" y="-2.5" width="20" height="7" rx="2.5" fill="#e05a6e"/>
        </Loop>
      </g>
      <g className="np-near">
        <path d="M-160 106C80 102 200 100 330 104V160H-160Z" fill="#8a2a40"/>
        <path d="M188 104C184 94 188 88 196 86C198 94 194 100 188 104Z" fill="#7ee0a6"/>
        <path d="M272 104C276 94 274 88 266 86C262 94 266 100 272 104Z" fill="#7ee0a6"/>
      </g>
    </>
  ),

  /* ── life skills: career ───────────────────────────────────────────── */

  /* Try a Career: a hot air balloon drifts past a mountain with a flag. */
  'career-explore': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#fff0b8'], [0.6, '#ffe08a'], [1, '#ffc96a']]}/>
      <g className="np-far">
        <path d={cloud(160, 30, 0.55)} fill="#ffffff" opacity=".8"/>
        <path d="M150 100L200 52L230 80L264 36L304 92L330 100Z" fill="#7ec4a0"/>
        <path d="M264 36L255 48L261 46L265 50L271 46Z" fill="#ffffff"/>
        <path d="M264 36V24" stroke="#5a4200" strokeWidth="1.6"/>
        <path d="M264 24l9 3-9 3z" fill="#ff6b6b"/>
      </g>
      <Sparks fill="#ffffff" at={[[180, 60, 2.4], [296, 20, 2.4]]}/>
      <g className="np-mid">
        <Loop at={[206, 42]} anim="float" d="6s">
          <path d="M0 -22C12 -22 18 -12 18 -4C18 8 6 14 4 18H-4C-6 14 -18 8 -18 -4C-18 -12 -12 -22 0 -22Z" fill="#ff8a65"/>
          <path d="M0 -22C5 -22 7 -12 7 -4C7 8 3 14 2 18H-2C-3 14 -7 8 -7 -4C-7 -12 -5 -22 0 -22Z" fill="#ffd15c"/>
          <path d="M-4 18V25M4 18V25" stroke="#7a4a1f" strokeWidth="1.2"/>
          <rect x="-5.5" y="24" width="11" height="7" rx="1.6" fill="#a8703a"/>
        </Loop>
      </g>
      <g className="np-near"><path d="M-160 104C80 100 200 96 330 102V160H-160Z" fill="#4fa07a"/></g>
    </>
  ),

  /* Professional Email: a letter slides into the mailbox and the flag lifts. */
  'career-email': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#0f4c75'], [0.6, '#2a78a8'], [1, '#6fb6dc']]}/>
      <Sparks fill="#d8ecfb" at={[[166, 20, 2.6], [290, 22, 2.4]]}/>
      <g className="np-far">
        <path d="M182 30q4-4 8 0q4-4 8 0M270 52q3-3 6 0q3-3 6 0" fill="none" stroke="#d8ecfb" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
      <g className="np-mid">
        <rect x="235" y="68" width="6" height="34" fill="#8a5a2a"/>
        <path d="M214 70V56C214 50 218 46 224 46H250C256 46 260 50 260 56V70Z" fill="#ff8a65"/>
        <path d="M214 70V56C214 50 218 46 224 46V70Z" fill="#e5603d"/>
        <rect x="216" y="56" width="6" height="2.4" rx="1.2" fill="#8f2a12"/>
        <Loop at={[260, 64]} anim="flag" d="6s" origin="0% 100%">
          <rect x="0" y="-16" width="3" height="16" fill="#ffd15c"/>
          <rect x="0" y="-16" width="10" height="6" rx="1" fill="#ffd15c"/>
        </Loop>
        <Loop at={[198, 57]} anim="mail" d="6s">
          <rect x="-12" y="-8" width="24" height="16" rx="2" fill="#ffffff"/>
          <path d="M-12 -7L0 2L12 -7" fill="none" stroke="#9cc7e6" strokeWidth="1.6"/>
        </Loop>
      </g>
      <g className="np-near"><path d="M-160 102C80 98 200 98 330 102V160H-160Z" fill="#0c3d5e"/></g>
    </>
  ),

  /* Feedback Notes: a sprout in a pot leans toward the light. */
  'career-feedback': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#1f5e2e'], [0.6, '#3a8a46'], [1, '#86c96a']]}/>
      <g className="np-far">
        <circle cx="266" cy="28" r="22" fill="#fff3b0" opacity=".35"/>
        <circle cx="266" cy="28" r="10" fill="#fff3b0"/>
      </g>
      <Sparks fill="#dcf4d6" at={[[170, 22, 2.6], [200, 44, 2]]}/>
      <g className="np-mid">
        <Loop at={[222, 76]} anim="sway" d="6s" origin="50% 100%">
          <path d="M0 0C0 -10 -1 -20 0 -32" stroke="#9be36a" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M0 -16C-8 -18 -16 -14 -18 -6C-10 -4 -3 -8 0 -16Z" fill="#9be36a"/>
          <path d="M0 -26C8 -30 16 -26 18 -18C10 -16 3 -20 0 -26Z" fill="#7fd35a"/>
          <circle cx="0" cy="-33" r="3.6" fill="#ffd15c"/>
        </Loop>
        <path d="M206 78H238L234 100H210Z" fill="#e07a52"/>
        <rect x="203" y="74" width="38" height="7" rx="3" fill="#c9603d"/>
        <g transform="translate(266 80) rotate(8)">
          <rect x="-14" y="-16" width="28" height="30" rx="3" fill="#fffaf0"/>
          <rect x="-9" y="-7" width="18" height="2.6" rx="1.3" fill="#c9d9c2"/>
          <rect x="-9" y="-1" width="14" height="2.6" rx="1.3" fill="#c9d9c2"/>
          <rect x="-9" y="5" width="16" height="2.6" rx="1.3" fill="#c9d9c2"/>
          <circle cx="0" cy="-14" r="2.6" fill="#ff8a65"/>
        </g>
      </g>
      <g className="np-near"><rect x="-160" y="100" width="500" height="60" fill="#174a24"/></g>
    </>
  ),

  /* You Belong Here: the last puzzle piece slides into its place. */
  'career-belong': ({ u }) => (
    <>
      <Sky u={u} stops={[[0, '#8a2c6b'], [0.55, '#c24f93'], [1, '#f08fc0']]}/>
      <Sparks fill="#ffe0f3" at={[[166, 20, 2.6], [292, 24, 2.4], [284, 98, 2]]}/>
      <g className="np-mid">
        <rect x="194" y="26" width="70" height="70" rx="10" fill="#6e2156" opacity=".45"/>
        <rect x="198" y="30" width="30" height="30" rx="6" fill="#ffd15c"/><circle cx="229" cy="45" r="5" fill="#ffd15c"/>
        <rect x="230" y="30" width="30" height="30" rx="6" fill="#7ee0a6"/><circle cx="245" cy="61" r="5" fill="#7ee0a6"/>
        <rect x="198" y="62" width="30" height="30" rx="6" fill="#8fd0ff"/><circle cx="229" cy="77" r="5" fill="#8fd0ff"/>
        <rect x="230" y="62" width="30" height="30" rx="6" fill="none" stroke="#ffffff" strokeOpacity=".6" strokeWidth="1.6" strokeDasharray="3 3"/>
        <Loop at={[230, 62]} anim="piece" d="7s"><rect width="30" height="30" rx="6" fill="#ff8a65"/></Loop>
        <Loop at={[245, 77]} anim="burst" d="7s" opacity="0">
          <circle r="22" fill="none" stroke="#ffffff" strokeWidth="2"/>
        </Loop>
      </g>
      <g className="np-near"><path d="M-160 108C80 104 200 102 330 106V160H-160Z" fill="#6e2156"/></g>
    </>
  ),
}

/* A tool added later without its own drawing: calm hills and a sun in its
   palette, so it still sits well in the column. */
export function FallbackScene({ u, fade }) {
  return (
    <>
      <Sky u={u} stops={[[0, fade], [1, fade]]}/>
      <g className="np-far"><circle cx="240" cy="44" r="30" fill="#ffffff" opacity=".18"/></g>
      <g className="np-mid">
        <Loop at={[240, 44]} anim="glow" d="5s"><circle r="14" fill="#ffffff" opacity=".6"/></Loop>
        <path d="M-160 98C60 92 180 86 240 92S300 96 330 96V160H-160Z" fill="#000000" opacity=".18"/>
      </g>
      <g className="np-near"><path d="M-160 108C80 104 200 102 330 106V160H-160Z" fill="#000000" opacity=".28"/></g>
    </>
  )
}
