import React from 'react'
import { cn } from '../../lib/utils'
import { SENSORS, SENSOR_ORDER } from '../../lib/sensors'
import { TONES, SIGNAL_LIT } from './tones'
import {
  Sky, Ridges, Arm, Travel, Ripples, PatchMark, SceneSvg, useSceneWatch, useUid, contourPath,
} from './kit'

/* The site's illustrated scenes, one per place they are used. Each is
 * decorative: the words beside or under it carry the meaning. Settled facts
 * only: the patch sits on the upper arm, sends four signals once a second to
 * the phone over Bluetooth Low Energy, and nothing else is drawn as a fact. */

const LIT = '#3ecf9a'
const BEAM_LIT = '#7fdcf0'

/* ── the patch and the phone (About the patch) ─────────────────────────── */

/* Upper arm and patch on the left, pulses travelling to a phone on the right,
   the four signals named underneath as small lit chips. Replaces the flat
   outline diagram (owner, 18 October: too plain next to the Toolkit). */
export function PatchLinkScene({ className }) {
  const ref = React.useRef(null)
  const u = useUid()
  useSceneWatch(ref)
  const t = TONES.dusk
  const P = [74, 84]
  return (
    <figure ref={ref} id="patch-link" className={cn('sc m-0 overflow-hidden rounded-[22px]', className)}
      style={{ backgroundColor: t.sky[0], boxShadow: `0 1px 2px rgb(11 43 51 / 0.08), 0 22px 44px -26px ${t.glow}` }}>
      <SceneSvg w={360} h={168} fit="xMidYMid meet" className="block h-auto w-full">
        <Sky u={u} tone="dusk" w={360} h={168} light={[0.2, 0.5]} rings={7}/>
        <Ridges tone="dusk" y={146} w={360} gap={9} amp={4}/>
        {/* the upper arm under a sleeve, running off the top and bottom */}
        <Arm u={u} cx={P[0]} cy={P[1] - 6} rot={-9} len={320} w={82} hem={40}>
          <PatchMark cx={P[0]} cy={P[1]} a={16} b={24} d="4s"/>
        </Arm>
        {/* the radio: three arcs lighting outward in turn */}
        <g fill="none" stroke={BEAM_LIT} strokeWidth="2" strokeLinecap="round">
          {[[9, 14], [15, 23], [21, 32]].map(([rx, ry], i) => (
            <path key={rx} className="sc-a sc-glow" style={{ '--d': '2s', '--w': `${i * 0.25}s` }}
              d={`M${P[0] + 22} ${P[1] - ry}A${rx} ${ry} 0 0 1 ${P[0] + 22} ${P[1] + ry}`}/>
          ))}
        </g>
        <path d={`M${P[0] + 46} ${P[1]}H258`} stroke={t.line} strokeOpacity=".28" strokeWidth="1.2"
          strokeDasharray="2 6" strokeLinecap="round"/>
        <Travel from={[P[0] + 44, P[1]]} to={[268, 78]} lift={-22} d="4s"/>
        <Travel from={[P[0] + 44, P[1]]} to={[268, 78]} lift={-22} d="4s" w="-2s"/>
        {/* the phone, its ring lighting as a pulse lands */}
        <rect x="262" y="26" width="66" height="116" rx="14" fill="#04130c" stroke="#ffffff" strokeOpacity=".22"/>
        <rect x="268" y="33" width="54" height="102" rx="9" fill="#0f3a2b"/>
        <rect x="287" y="37" width="16" height="4" rx="2" fill="#04130c"/>
        <circle className="sc-a sc-glow" style={{ '--d': '2s', '--w': '0.6s' }} cx="295" cy="78" r="21"
          fill={LIT} fillOpacity=".28"/>
        <circle cx="295" cy="78" r="15" fill="none" stroke="#ffffff" strokeOpacity=".14" strokeWidth="4"/>
        <circle cx="295" cy="78" r="15" fill="none" stroke={LIT} strokeWidth="4" strokeLinecap="round"
          strokeDasharray="58 100" transform="rotate(135 295 78)"/>
        <rect x="278" y="106" width="34" height="3.5" rx="1.75" fill="#ffffff" opacity=".2"/>
        <rect x="278" y="114" width="22" height="3.5" rx="1.75" fill="#ffffff" opacity=".2"/>
      </SceneSvg>
      <figcaption className="px-4 pb-4 pt-1">
        <span className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2 whitespace-nowrap
          text-fine font-semibold sm:text-tick"
          style={{ color: t.sub }}>
          <span>Upper arm</span>
          <span className="text-center">Bluetooth Low Energy</span>
          <span className="text-right">Phone</span>
        </span>
        <span className="mt-3 flex flex-wrap gap-2">
          {SENSOR_ORDER.map((id, i) => (
            <span key={id} className="inline-flex items-center gap-2 rounded-chip border border-white/15
              bg-white/[0.07] px-2.5 py-1 text-fine" style={{ color: t.sub }}>
              <span aria-hidden className="sc-a sc-chip size-2 rounded-chip"
                style={{ backgroundColor: SIGNAL_LIT[id], boxShadow: `0 0 8px ${SIGNAL_LIT[id]}`,
                  '--d': '4.8s', '--w': `${-i * 1.2}s` }}/>
              {SENSORS[id].name}
            </span>
          ))}
        </span>
      </figcaption>
    </figure>
  )
}

/* ── pairing: two objects, one link, nothing between them ──────────────── */

const PAIR_ALT =
  'The patch on the left and a phone on the right, with pulses of Bluetooth Low Energy travelling '
  + 'from the patch to the phone. Below them a cable is drawn and struck through, because no cable '
  + 'runs between the two.'

export function PairScene({ className }) {
  const ref = React.useRef(null)
  const u = useUid()
  useSceneWatch(ref)
  const t = TONES.lagoon
  const P = [108, 104]
  return (
    <figure ref={ref} className={cn('sc m-0 overflow-hidden rounded-[22px]', className)}
      style={{ backgroundColor: t.sky[0], boxShadow: `0 1px 2px rgb(11 43 51 / 0.08), 0 22px 44px -26px ${t.glow}` }}>
      <svg viewBox="0 0 460 220" role="img" aria-label={PAIR_ALT} className="block h-auto w-full">
        <Sky u={u} tone="lagoon" w={460} h={220} light={[0.5, 0.42]} rings={8} ringGap={20}/>
        <Ridges tone="lagoon" y={186} w={460} gap={10} amp={5}/>
        <PatchMark cx={P[0]} cy={P[1]} a={30} b={45} d="4s"/>
        <Ripples x={P[0]} y={P[1]} r={30} n={2} d="4s" color={BEAM_LIT} width={1.6}/>
        <Travel from={[P[0] + 40, P[1]]} to={[330, 96]} lift={-30} d="4s" color={BEAM_LIT} r={3.2}/>
        <Travel from={[P[0] + 40, P[1]]} to={[330, 96]} lift={-30} d="4s" w="-2s" color={BEAM_LIT} r={3.2}/>
        {/* the phone, a check lit on its screen */}
        <rect x="320" y="20" width="104" height="168" rx="20" fill="#051a21" stroke="#ffffff" strokeOpacity=".24"/>
        <rect x="329" y="29" width="86" height="150" rx="13" fill="#0e3e4c"/>
        <rect x="358" y="35" width="28" height="7" rx="3.5" fill="#051a21"/>
        <circle className="sc-a sc-glow" style={{ '--d': '2s', '--w': '0.6s' }} cx="372" cy="96" r="32"
          fill={LIT} fillOpacity=".22"/>
        <circle cx="372" cy="96" r="21" fill="#0b3127" stroke={LIT} strokeWidth="2.4"/>
        <path d="M363 96l6 7 12-14" fill="none" stroke={LIT} strokeWidth="3" strokeLinecap="round"
          strokeLinejoin="round"/>
        <rect x="343" y="140" width="58" height="5" rx="2.5" fill="#ffffff" opacity=".18"/>
        <rect x="343" y="152" width="38" height="5" rx="2.5" fill="#ffffff" opacity=".18"/>
        {/* the cable that is not there */}
        <g opacity=".55">
          <path d="M178 176Q240 204 296 172" fill="none" stroke="#c9f1fb" strokeOpacity=".5" strokeWidth="3"
            strokeLinecap="round"/>
          <rect x="170" y="168" width="11" height="15" rx="3" fill="#0e3e4c" stroke="#c9f1fb" strokeOpacity=".6"/>
          <rect x="293" y="164" width="11" height="15" rx="3" fill="#0e3e4c" stroke="#c9f1fb" strokeOpacity=".6"/>
        </g>
        <line x1="222" y1="168" x2="254" y2="206" stroke="#ff9a8a" strokeWidth="2.8" strokeLinecap="round"/>
      </svg>
      <figcaption aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2
        whitespace-nowrap px-4 pb-3.5 pt-1 text-fine font-semibold sm:text-tick" style={{ color: t.sub }}>
        <span>The patch</span>
        <span className="text-center">Bluetooth Low Energy</span>
        <span className="text-right">Your phone</span>
      </figcaption>
    </figure>
  )
}

/* ── the three ways without the patch (band art, 240 x 110) ─────────────── */

/* Mental Mirror: a face on a screen, landmark points lighting and a scan
   line passing down it. */
const FACE_PTS = (() => {
  const pts = []
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    pts.push([150 + 22 * Math.cos(a), 58 + 30 * Math.sin(a)])
  }
  return pts.concat([[141, 50], [159, 50], [137, 50], [145, 50], [155, 50], [163, 50],
    [150, 60], [150, 66], [142, 74], [150, 77], [158, 74]])
})()

export const mirrorArt = u => (
  <>
    <defs><clipPath id={u + 'scr'}><rect x="112" y="8" width="76" height="100" rx="12"/></clipPath></defs>
    <Ridges tone="dusk" y={96} w={240} gap={7} amp={3}/>
    <rect x="108" y="4" width="84" height="110" rx="15" fill="#04130c" stroke="#ffffff" strokeOpacity=".2"/>
    <rect x="112" y="8" width="76" height="100" rx="12" fill="#0f3a2b"/>
    <ellipse cx="150" cy="58" rx="22" ry="30" fill="none" stroke={LIT} strokeOpacity=".7" strokeWidth="1.4"/>
    <path d="M150 28v60M128 58h44M141 50l9 10 9-10M142 74q8 5 16 0" fill="none" stroke={BEAM_LIT}
      strokeOpacity=".45" strokeWidth=".8"/>
    {FACE_PTS.map(([x, y], i) => (
      <circle key={i} className="sc-a sc-twinkle" style={{ '--d': '3.2s', '--w': `${-i * 0.19}s` }}
        cx={x.toFixed(1)} cy={y.toFixed(1)} r="1.4" fill={LIT}/>
    ))}
    <g clipPath={`url(#${u}scr)`}>
      <g className="sc-a sc-scan" style={{ '--d': '5s', '--ty': '74px' }}>
        <rect x="112" y="18" width="76" height="8" fill={LIT} opacity=".16"/>
        <rect x="112" y="21" width="76" height="1.6" fill="#d8fff0"/>
      </g>
    </g>
  </>
)

/* Camera pulse check: a fingertip over the camera, lit with each beat, and
   the pulse it reads rolling past. */
const wave = (x0, y, n) => {
  let d = `M${x0} ${y}`
  for (let i = 0; i < n; i++) d += 'h10l3 -9l4 18l3 -12l2 3h8'
  return d
}
export const pulseArt = u => (
  <>
    <defs><clipPath id={u + 'wv'}><rect x="170" y="20" width="72" height="70"/></clipPath></defs>
    <Ridges tone="lagoon" y={98} w={240} gap={7} amp={3}/>
    <rect x="86" y="6" width="70" height="116" rx="15" fill="#051a21" stroke="#ffffff" strokeOpacity=".22"/>
    <rect x="96" y="16" width="34" height="34" rx="10" fill="#0e3e4c" stroke="#ffffff" strokeOpacity=".2"/>
    <circle cx="106" cy="26" r="5" fill="#04161c" stroke="#ffffff" strokeOpacity=".3"/>
    <circle cx="120" cy="40" r="5" fill="#04161c" stroke="#ffffff" strokeOpacity=".3"/>
    <g className="sc-a sc-beat" style={{ '--d': '1.6s' }}>
      <circle cx="113" cy="33" r="20" fill="#ff8a7a" opacity=".22"/>
      <ellipse cx="113" cy="33" rx="15" ry="13" fill="#ffb3a6" opacity=".9"/>
    </g>
    <g clipPath={`url(#${u}wv)`}>
      <g className="sc-a sc-roll" style={{ '--d': '1.6s', '--tx': '-30px' }}>
        <path d={wave(170, 56, 5)} fill="none" stroke="#ff9a8a" strokeWidth="2" strokeLinecap="round"
          strokeLinejoin="round"/>
      </g>
    </g>
  </>
)

/* Survey: three cards floating out of step, one answer lighting on the top
   card. */
export const surveyArt = () => (
  <>
    <Ridges tone="tide" y={98} w={240} gap={7} amp={3}/>
    {[0, 1, 2].map(i => (
      <g key={i} className="sc-a sc-bob" style={{ '--d': '6s', '--w': `${-i * 2}s` }}>
        <rect x={96 + i * 12} y={16 + i * 16} width="92" height="44" rx="9"
          fill={i === 2 ? '#f4faf8' : '#ffffff'} opacity={i === 2 ? 1 : 0.22 + i * 0.2}/>
        {i === 2 && (
          <>
            <rect x="132" y="58" width="44" height="4" rx="2" fill="#2a5744" opacity=".5"/>
            <rect x="132" y="68" width="30" height="4" rx="2" fill="#2a5744" opacity=".35"/>
            <circle cx="186" cy="64" r="9" fill="none" stroke="#93b2a1" strokeWidth="1.4"/>
            <g className="sc-a sc-arrive" style={{ '--d': '6s' }}>
              <circle cx="186" cy="64" r="9" fill="#157446"/>
              <path d="M181.5 64l3 3.4 5.5-6.4" fill="none" stroke="#ffffff" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </g>
          </>
        )}
      </g>
    ))}
  </>
)

/* ── the two ways in (Overview), header bands 360 x 120 ────────────────── */

/* With the patch: the arm and patch, pulses rising to a score ring. */
export const patchWayArt = u => (
  <>
    <Ridges tone="dusk" y={104} w={360} gap={8} amp={4}/>
    <Arm u={u} cx={104} cy={54} rot={-9} len={240} w={68} hem={32}>
      <PatchMark cx={104} cy={60} a={13} b={19.5} d="4.4s"/>
    </Arm>
    <Travel from={[124, 54]} to={[262, 52]} lift={-18} d="4.4s"/>
    <Travel from={[124, 54]} to={[262, 52]} lift={-18} d="4.4s" w="-2.2s"/>
    <g className="sc-a sc-bob" style={{ '--d': '7s' }}>
      <circle cx="276" cy="54" r="30" fill={LIT} opacity=".14"/>
      <circle cx="276" cy="54" r="20" fill="#0b2e21" stroke="#ffffff" strokeOpacity=".14" strokeWidth="5"/>
      <circle cx="276" cy="54" r="20" fill="none" stroke={LIT} strokeWidth="5" strokeLinecap="round"
        strokeDasharray="70 126" transform="rotate(135 276 54)"/>
    </g>
  </>
)

/* Without the patch: a phone with the three ways floating round it. */
export const phoneWayArt = () => (
  <>
    <Ridges tone="lagoon" y={104} w={360} gap={8} amp={4}/>
    <rect x="152" y="14" width="64" height="124" rx="13" fill="#051a21" stroke="#ffffff" strokeOpacity=".24"/>
    <rect x="158" y="20" width="52" height="112" rx="9" fill="#0e3e4c"/>
    <rect x="176" y="24" width="16" height="4" rx="2" fill="#051a21"/>
    <circle className="sc-a sc-glow" style={{ '--d': '4s' }} cx="184" cy="66" r="18" fill={LIT} fillOpacity=".22"/>
    <circle cx="184" cy="66" r="12" fill="none" stroke={LIT} strokeWidth="3.4" strokeLinecap="round"
      strokeDasharray="46 100" transform="rotate(135 184 66)"/>
    {/* the Mirror, the pulse check, the Survey */}
    <g className="sc-a sc-bob" style={{ '--d': '6s' }}>
      <circle cx="104" cy="44" r="20" fill="#ffffff" opacity=".1"/>
      <ellipse cx="104" cy="44" rx="9" ry="12" fill="none" stroke={LIT} strokeWidth="1.6"/>
      {[[100, 41], [108, 41], [104, 47], [101, 51], [107, 51]].map(([x, y]) => (
        <circle key={x + ' ' + y} cx={x} cy={y} r="1.2" fill={LIT}/>
      ))}
    </g>
    <g className="sc-a sc-bob" style={{ '--d': '6s', '--w': '-2s' }}>
      <circle cx="262" cy="40" r="20" fill="#ffffff" opacity=".1"/>
      <path d="M248 41h6l3 -6l4 12l3 -8l2 2h8" fill="none" stroke="#ff9a8a" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <g className="sc-a sc-bob" style={{ '--d': '6s', '--w': '-4s' }}>
      <circle cx="270" cy="92" r="18" fill="#ffffff" opacity=".1"/>
      <rect x="260" y="84" width="20" height="16" rx="3" fill="none" stroke="#d3edf5" strokeWidth="1.5"/>
      <path d="M264 89h8M264 95h5" stroke="#d3edf5" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="280" cy="98" r="5" fill="#157446" stroke="#3ecf9a" strokeWidth="1"/>
    </g>
  </>
)

/* ── audience heroes: the lit ground behind the photograph ─────────────── */

/* Contours, a light source and ridges, drawn right of the words: on a phone
   it sits behind the photograph at the bottom, from lg it fills the right
   side. The words never sit on it; they sit on the CSS gradient under it,
   whose stops are measured in tones.js. */
export function HeroScene({ tone = 'dusk', className }) {
  const ref = React.useRef(null)
  const u = useUid()
  useSceneWatch(ref)
  const t = TONES[tone]
  const dark = tone !== 'dawn'
  return (
    <div ref={ref} aria-hidden="true" className={cn('sc pointer-events-none absolute',
      '[mask-image:linear-gradient(to_bottom,transparent,black_35%)]',
      'lg:[mask-image:linear-gradient(to_right,transparent,black_40%)]', className)}>
      <svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMax slice" focusable="false"
        className="absolute inset-0 block h-full w-full">
        <defs>
          <radialGradient id={u + 'g'}>
            <stop offset="0" stopColor={t.glow} stopOpacity={dark ? 0.5 : 0.95}/>
            <stop offset=".5" stopColor={t.glow} stopOpacity={dark ? 0.14 : 0.5}/>
            <stop offset="1" stopColor={t.glow} stopOpacity="0"/>
          </radialGradient>
        </defs>
        <g>
          <circle className="sc-a sc-breathe" style={{ '--d': '10s' }} cx="430" cy="150" r="220" fill={`url(#${u}g)`}/>
          <g className="sc-a sc-drift" style={{ '--d': '26s' }} fill="none" stroke={t.line}
            strokeOpacity={dark ? 0.13 : 0.2} strokeWidth="1">
            {Array.from({ length: 10 }, (_, i) => (
              <path key={i} d={contourPath(430, 150, 26 + i * 24, { amp: 3 + i, phase: i * 0.8, squash: 0.6 })}/>
            ))}
          </g>
          {[[300, 60], [520, 40], [600, 120], [380, 90], [560, 200], [250, 140]].map(([x, y], i) => (
            <circle key={i} className="sc-a sc-twinkle" style={{ '--d': `${5 + i}s`, '--w': `${-i}s` }}
              cx={x} cy={y} r={1.2} fill={dark ? '#ffffff' : t.line}/>
          ))}
          <Ridges tone={tone} y={318} w={640} gap={14} amp={8}/>
        </g>
      </svg>
    </div>
  )
}

/* The ground under the hero's words, as a CSS gradient: down on a phone,
   across from lg. */
export const heroGround = tone => {
  const s = TONES[tone].sky
  return { '--hg-v': `linear-gradient(180deg, ${s[0]} 0%, ${s[0]} 45%, ${s[1]} 100%)`,
    '--hg-h': `linear-gradient(100deg, ${s[0]} 0%, ${s[0]} 40%, ${s[1]} 75%, ${s[2]} 100%)` }
}
