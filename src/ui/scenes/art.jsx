import React from 'react'
import { cn } from '../../lib/utils'
import { TONES, MICRO, glowShadow } from './tones'
import {
  Sky, Ridges, Arm, Travel, Ripples, PatchMark, SceneSvg, useSceneWatch, useUid, contourPath,
} from './kit'

/* The site's illustrated scenes, one per place they are used. Each is
 * decorative: the words beside or under it carry the meaning. Settled facts
 * only: the patch sits on the upper arm, sends four signals once a second to
 * the phone over Bluetooth Low Energy, and nothing else is drawn as a fact.
 * Daylight since 19 October (owner: "too many black gradient backgrounds"):
 * deep green ink on pale grounds, the light and the pulses in mint and
 * turquoise. */

const INK = '#0d2b1e'
const ACCENT = '#157446'
const LIT = '#3ecf9a'
const TURQ = '#1d8fb0'
const RULE = '#c2d7ca'
const CORAL = '#e5482a'

/* Fine corner marks inside a scene's frame, like a viewfinder. */
function Ticks({ w, h, i = 8, n = 7 }) {
  return (
    <path d={`M${i} ${i + n}V${i}H${i + n}M${w - i - n} ${i}H${w - i}V${i + n}`
      + `M${w - i} ${h - i - n}V${h - i}H${w - i - n}M${i + n} ${h - i}H${i}V${h - i - n}`}
      fill="none" stroke={INK} strokeOpacity=".28" strokeWidth="1"/>
  )
}

/* A phone face on, in daylight: a white body with a fine ink edge, a soft
   shadow in turquoise, a paper screen. */
function Phone({ x, y, w, h, r = 14, bezel = 6 }) {
  return (
    <g>
      <rect x={x + 2} y={y + 6} width={w} height={h} rx={r} fill={TURQ} opacity=".14"/>
      <rect x={x} y={y} width={w} height={h} rx={r} fill="#ffffff" stroke={INK} strokeOpacity=".32"/>
      <rect x={x + bezel} y={y + bezel + 1} width={w - bezel * 2} height={h - bezel * 2 - 2} rx={r - 5}
        fill="#f7faf8" stroke={RULE} strokeWidth=".8"/>
      <rect x={x + w / 2 - 8} y={y + bezel + 4} width="16" height="4" rx="2" fill={INK} opacity=".85"/>
    </g>
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
  const t = TONES.sky
  const P = [108, 104]
  return (
    <figure ref={ref} className={cn('sc m-0 overflow-hidden rounded-[22px] border border-rule bg-card', className)}
      style={{ boxShadow: glowShadow('sky') }}>
      <svg viewBox="0 0 460 220" role="img" aria-label={PAIR_ALT} className="block h-auto w-full">
        <Sky u={u} tone="sky" w={460} h={220} light={[0.5, 0.42]} rings={8} ringGap={20} grid={14}/>
        <Ridges tone="sky" y={186} w={460} gap={10} amp={5}/>
        <PatchMark cx={P[0]} cy={P[1]} a={30} b={45} d="4s"/>
        <Ripples x={P[0]} y={P[1]} r={30} n={2} d="4s" color={TURQ} width={1.4}/>
        <Travel from={[P[0] + 40, P[1]]} to={[330, 96]} lift={-30} d="4s" color={TURQ} r={3.2}/>
        <Travel from={[P[0] + 40, P[1]]} to={[330, 96]} lift={-30} d="4s" w="-2s" color={TURQ} r={3.2}/>
        {/* the phone, a check lit on its screen */}
        <Phone x={320} y={20} w={104} h={168} r={20} bezel={8}/>
        <circle className="sc-a sc-glow" style={{ '--d': '2s', '--w': '0.6s' }} cx="372" cy="96" r="33"
          fill={LIT} fillOpacity=".28"/>
        <circle cx="372" cy="96" r="21" fill="#dcefe4" stroke={ACCENT} strokeWidth="2.4"/>
        <path d="M363 96l6 7 12-14" fill="none" stroke={ACCENT} strokeWidth="3" strokeLinecap="round"
          strokeLinejoin="round"/>
        <rect x="343" y="140" width="58" height="5" rx="2.5" fill={RULE}/>
        <rect x="343" y="152" width="38" height="5" rx="2.5" fill={RULE}/>
        {/* the cable that is not there */}
        <g opacity=".7">
          <path d="M178 176Q240 204 296 172" fill="none" stroke="#7fa6b4" strokeWidth="3" strokeLinecap="round"/>
          <rect x="170" y="168" width="11" height="15" rx="3" fill="#ffffff" stroke="#7fa6b4"/>
          <rect x="293" y="164" width="11" height="15" rx="3" fill="#ffffff" stroke="#7fa6b4"/>
        </g>
        <line x1="222" y1="168" x2="254" y2="206" stroke={CORAL} strokeWidth="2.8" strokeLinecap="round"/>
        <Ticks w={460} h={220} i={10} n={9}/>
      </svg>
      <figcaption aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2
        whitespace-nowrap border-t border-rule px-4 pb-3.5 pt-2.5 text-[0.6875rem] font-medium
        sm:text-fine" style={{ color: t.sub, fontFamily: MICRO }}>
        <span>The patch</span>
        <span className="text-center">Bluetooth Low Energy</span>
        <span className="text-right">Your phone</span>
      </figcaption>
    </figure>
  )
}

/* ── the three ways without the patch (band art, 240 x 110) ─────────────── */

/* Mental Mirror: a face on a screen, landmark points lighting and a scan
   line passing down it. A white phone with a pale screen and the mesh in
   deep green and turquoise, like the Mirror demo on How it works (owner,
   19 October: "stop making things dark"). */
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
    <Ridges tone="mint" y={96} w={240} gap={7} amp={3}/>
    <ellipse cx="150" cy="60" rx="58" ry="48" fill={LIT} opacity=".16"/>
    <rect x="110" y="9" width="84" height="110" rx="15" fill={TURQ} opacity=".16"/>
    <rect x="108" y="4" width="84" height="110" rx="15" fill="#ffffff" stroke={INK} strokeOpacity=".32"/>
    <rect x="112" y="8" width="76" height="100" rx="12" fill="#eef8f3" stroke={ACCENT} strokeOpacity=".16"/>
    <g clipPath={`url(#${u}scr)`} stroke={ACCENT} strokeOpacity=".07" strokeWidth=".6">
      {[20, 32, 44, 56, 68, 80, 92, 104].map(y => <path key={y} d={`M112 ${y}h76`}/>)}
      {[124, 137, 150, 163, 176].map(x => <path key={x} d={`M${x} 8v100`}/>)}
    </g>
    <ellipse cx="150" cy="58" rx="22" ry="30" fill="none" stroke={ACCENT} strokeOpacity=".75" strokeWidth="1.4"/>
    <path d="M150 28v60M128 58h44M141 50l9 10 9-10M142 74q8 5 16 0" fill="none" stroke={TURQ}
      strokeOpacity=".55" strokeWidth=".8"/>
    {FACE_PTS.map(([x, y], i) => (
      <circle key={i} className="sc-a sc-twinkle" style={{ '--d': '3.2s', '--w': `${-i * 0.19}s` }}
        cx={x.toFixed(1)} cy={y.toFixed(1)} r="1.4" fill="#14895f"/>
    ))}
    <g clipPath={`url(#${u}scr)`}>
      <g className="sc-a sc-scan" style={{ '--d': '5s', '--ty': '74px' }}>
        <rect x="112" y="18" width="76" height="8" fill={TURQ} opacity=".12"/>
        <rect x="112" y="21" width="76" height="1.6" fill={TURQ} opacity=".7"/>
      </g>
    </g>
  </>
)

/* Camera pulse check: the back of a phone, a fingertip over the camera lit
   with each beat, and the pulse it reads rolling past. */
const wave = (x0, y, n) => {
  let d = `M${x0} ${y}`
  for (let i = 0; i < n; i++) d += 'h10l3 -9l4 18l3 -12l2 3h8'
  return d
}
export const pulseArt = u => (
  <>
    <defs><clipPath id={u + 'wv'}><rect x="170" y="20" width="72" height="70"/></clipPath></defs>
    <Ridges tone="sky" y={98} w={240} gap={7} amp={3}/>
    <rect x="88" y="12" width="70" height="116" rx="15" fill={TURQ} opacity=".14"/>
    <rect x="86" y="6" width="70" height="116" rx="15" fill="#ffffff" stroke={INK} strokeOpacity=".32"/>
    <rect x="96" y="16" width="34" height="34" rx="10" fill="#eef5f2" stroke={INK} strokeOpacity=".22"/>
    <circle cx="106" cy="26" r="5" fill={INK} stroke="#ffffff" strokeOpacity=".5"/>
    <circle cx="120" cy="40" r="5" fill={INK} stroke="#ffffff" strokeOpacity=".5"/>
    <g className="sc-a sc-beat" style={{ '--d': '1.6s' }}>
      <circle cx="113" cy="33" r="21" fill="#ff8a7a" opacity=".24"/>
      <ellipse cx="113" cy="33" rx="15" ry="13" fill="#ffb3a6" opacity=".95"/>
    </g>
    <path d="M170 56H242" stroke={CORAL} strokeOpacity=".18" strokeWidth="1"/>
    <g clipPath={`url(#${u}wv)`}>
      <g className="sc-a sc-roll" style={{ '--d': '1.6s', '--tx': '-30px' }}>
        <path d={wave(170, 56, 5)} fill="none" stroke={CORAL} strokeWidth="2" strokeLinecap="round"
          strokeLinejoin="round"/>
      </g>
    </g>
  </>
)

/* Survey: three cards floating out of step, one answer lighting on the top
   card. */
export const surveyArt = () => (
  <>
    <Ridges tone="paper" y={98} w={240} gap={7} amp={3}/>
    {[0, 1, 2].map(i => (
      <g key={i} className="sc-a sc-bob" style={{ '--d': '6s', '--w': `${-i * 2}s` }}>
        <rect x={98 + i * 12} y={21 + i * 16} width="92" height="44" rx="9" fill={ACCENT} opacity=".1"/>
        <rect x={96 + i * 12} y={16 + i * 16} width="92" height="44" rx="9" fill="#ffffff"
          stroke={INK} strokeOpacity={i === 2 ? 0.3 : 0.14} opacity={i === 2 ? 1 : 0.55 + i * 0.2}/>
        {i === 2 && (
          <>
            <rect x="132" y="58" width="44" height="4" rx="2" fill="#2a5744" opacity=".5"/>
            <rect x="132" y="68" width="30" height="4" rx="2" fill="#2a5744" opacity=".35"/>
            <circle cx="186" cy="64" r="9" fill="none" stroke="#93b2a1" strokeWidth="1.4"/>
            <g className="sc-a sc-arrive" style={{ '--d': '6s' }}>
              <circle cx="186" cy="64" r="13" fill={LIT} opacity=".3"/>
              <circle cx="186" cy="64" r="9" fill={ACCENT}/>
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
    <Ridges tone="mint" y={104} w={360} gap={8} amp={4}/>
    <Arm u={u} cx={104} cy={54} rot={-9} len={240} w={68} hem={32}>
      <PatchMark cx={104} cy={60} a={13} b={19.5} d="4.4s"/>
    </Arm>
    <Travel from={[124, 54]} to={[262, 52]} lift={-18} d="4.4s" color={TURQ}/>
    <Travel from={[124, 54]} to={[262, 52]} lift={-18} d="4.4s" w="-2.2s" color={TURQ}/>
    <g className="sc-a sc-bob" style={{ '--d': '7s' }}>
      <circle cx="276" cy="54" r="31" fill={LIT} opacity=".2"/>
      <circle cx="277" cy="58" r="22" fill={TURQ} opacity=".14"/>
      <circle cx="276" cy="54" r="20" fill="#ffffff" stroke="#dcefe4" strokeWidth="5"/>
      <circle cx="276" cy="54" r="20" fill="none" stroke={ACCENT} strokeWidth="5" strokeLinecap="round"
        strokeDasharray="70 126" transform="rotate(135 276 54)"/>
    </g>
  </>
)

/* Without the patch: a phone with the three ways floating round it. */
const Bubble = ({ x, y, r }) => (
  <>
    <circle cx={x + 1} cy={y + 3} r={r} fill={TURQ} opacity=".12"/>
    <circle cx={x} cy={y} r={r} fill="#ffffff" stroke={RULE}/>
  </>
)
export const phoneWayArt = () => (
  <>
    <Ridges tone="sky" y={104} w={360} gap={8} amp={4}/>
    <Phone x={152} y={14} w={64} h={124} r={13}/>
    <circle className="sc-a sc-glow" style={{ '--d': '4s' }} cx="184" cy="66" r="19" fill={LIT} fillOpacity=".28"/>
    <circle cx="184" cy="66" r="12" fill="#ffffff" stroke="#dcefe4" strokeWidth="3.4"/>
    <circle cx="184" cy="66" r="12" fill="none" stroke={ACCENT} strokeWidth="3.4" strokeLinecap="round"
      strokeDasharray="46 100" transform="rotate(135 184 66)"/>
    {/* the Mirror, the pulse check, the Survey */}
    <g className="sc-a sc-bob" style={{ '--d': '6s' }}>
      <Bubble x={104} y={44} r={20}/>
      <ellipse cx="104" cy="44" rx="9" ry="12" fill="none" stroke={ACCENT} strokeWidth="1.6"/>
      {[[100, 41], [108, 41], [104, 47], [101, 51], [107, 51]].map(([x, y]) => (
        <circle key={x + ' ' + y} cx={x} cy={y} r="1.2" fill={ACCENT}/>
      ))}
    </g>
    <g className="sc-a sc-bob" style={{ '--d': '6s', '--w': '-2s' }}>
      <Bubble x={262} y={40} r={20}/>
      <path d="M248 41h6l3 -6l4 12l3 -8l2 2h8" fill="none" stroke={CORAL} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <g className="sc-a sc-bob" style={{ '--d': '6s', '--w': '-4s' }}>
      <Bubble x={270} y={92} r={18}/>
      <rect x="260" y="84" width="20" height="16" rx="3" fill="none" stroke="#2a5744" strokeWidth="1.5"/>
      <path d="M264 89h8M264 95h5" stroke="#2a5744" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="280" cy="98" r="5" fill={ACCENT} stroke="#ffffff" strokeWidth="1.2"/>
    </g>
  </>
)

/* ── audience heroes: the lit ground behind the photograph ─────────────── */

/* A fine grid, contours, a light source and ridges, drawn right of the words:
   on a phone it sits behind the photograph at the bottom, from lg it fills
   the right side. The words sit on the CSS gradient under it, whose stops are
   measured in tones.js. */
export function HeroScene({ tone = 'mint', className }) {
  const ref = React.useRef(null)
  const u = useUid()
  useSceneWatch(ref)
  const t = TONES[tone]
  return (
    <div ref={ref} aria-hidden="true" className={cn('sc pointer-events-none absolute',
      '[mask-image:linear-gradient(to_bottom,transparent,black_35%)]',
      'lg:[mask-image:linear-gradient(to_right,transparent,black_40%)]', className)}>
      <svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMax slice" focusable="false"
        className="absolute inset-0 block h-full w-full">
        <defs>
          <radialGradient id={u + 'g'}>
            <stop offset="0" stopColor="#ffffff" stopOpacity=".95"/>
            <stop offset=".2" stopColor={t.glow} stopOpacity=".4"/>
            <stop offset=".6" stopColor={t.glow} stopOpacity=".1"/>
            <stop offset="1" stopColor={t.glow} stopOpacity="0"/>
          </radialGradient>
          <pattern id={u + 'grid'} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0V16" fill="none" stroke={t.grid} strokeOpacity=".08" strokeWidth=".7"/>
          </pattern>
        </defs>
        <g>
          <rect width="640" height="360" fill={`url(#${u}grid)`}/>
          <circle className="sc-a sc-breathe" style={{ '--d': '10s' }} cx="430" cy="150" r="220" fill={`url(#${u}g)`}/>
          <g className="sc-a sc-drift" style={{ '--d': '26s' }} fill="none" stroke={t.line}
            strokeOpacity=".6" strokeWidth="1">
            {Array.from({ length: 10 }, (_, i) => (
              <path key={i} d={contourPath(430, 150, 26 + i * 24, { amp: 3 + i, phase: i * 0.8, squash: 0.6 })}/>
            ))}
          </g>
          {[[300, 60], [520, 40], [600, 120], [380, 90], [560, 200], [250, 140]].map(([x, y], i) => (
            <circle key={i} className="sc-a sc-twinkle" style={{ '--d': `${5 + i}s`, '--w': `${-i}s` }}
              cx={x} cy={y} r={1.4} fill={t.grid} fillOpacity=".55"/>
          ))}
          <Ridges tone={tone} y={318} w={640} gap={14} amp={8}/>
        </g>
      </svg>
    </div>
  )
}

/* The ground under the hero's words, as a CSS gradient: down on a phone,
   across from lg. It starts on the tone's tint, not white, so the student
   (mint) and parent (sky) heroes read apart at a glance. */
export const heroGround = tone => {
  const s = TONES[tone].sky
  return { backgroundColor: s[1],
    '--hg-v': `linear-gradient(180deg, ${s[1]} 0%, ${s[1]} 45%, ${s[2]} 100%)`,
    '--hg-h': `linear-gradient(100deg, ${s[1]} 0%, ${s[1]} 40%, ${s[2]} 100%)` }
}
