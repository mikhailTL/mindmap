import React from 'react'
import { FAMILIES } from './palette'
import { cn } from '../lib/utils'

// One drawn scene per activity, in that activity's two tones.
function Scene({ children, className }) {
  return (
    <svg viewBox="0 0 440 150" aria-hidden focusable="false"
      preserveAspectRatio="xMidYMid meet" className={cn('h-full w-full', className)}>
      {/* The scenes are composed on a 640 by 132 field; this transform places that field on the canvas. */}
      <g transform="translate(-100 15)">{children}</g>
    </svg>
  )
}

const B = ({ x, y, w, h, r = 4, cls, ...p }) =>
  <rect x={x} y={y} width={w} height={h} rx={r} className={cls} {...p}/>

export const BreathMark = () => (
  <Scene>
    <circle cx="320" cy="58" r="51" className="kit-s-art" strokeWidth="3" fill="none" opacity=".3"/>
    <circle cx="320" cy="58" r="39" className="kit-s-art" strokeWidth="3" fill="none"
      strokeDasharray="3 7" opacity=".6"/>
    <circle cx="118" cy="30" r="16" className="kit-f-art" opacity=".2"/>
    <circle cx="514" cy="42" r="22" className="kit-f-art" opacity=".16"/>
    <circle cx="516" cy="92" r="9" className="kit-f-art" opacity=".22"/>
    <g style={{ transform:'translate(320px, 58px)' }}>
      <circle className="kit-f kit-breathe-c" cx="0" cy="0" r="30"/>
    </g>
    <B x="224" y="114" w="72" h="9" r="4.5" cls="kit-f"/>
    <B x="304" y="114" w="108" h="9" r="4.5" cls="kit-f-art"/>
    <B x="104" y="116" w="96" h="5" r="2.5" cls="kit-f-art" opacity=".18"/>
    <B x="440" y="116" w="96" h="5" r="2.5" cls="kit-f-art" opacity=".18"/>
  </Scene>
)

export const MapMark = () => (
  <Scene>
    <B x="194" y="6" w="252" h="120" r="12" cls="kit-f-tint"/>
    <B x="194" y="6" w="252" h="120" r="12" cls="kit-s" strokeWidth="3" fill="none"/>
    <path d="M320 6v120M194 66h252" className="kit-s-art" strokeWidth="2" strokeDasharray="4 6"/>
    <B x="210" y="20" w="34" h="8" r="4" cls="kit-f-art" opacity=".35"/>
    <B x="396" y="104" w="34" h="8" r="4" cls="kit-f-art" opacity=".35"/>
    <circle cx="256" cy="96" r="7" className="kit-f-art" opacity=".4"/>
    <circle cx="292" cy="80" r="5.5" className="kit-f-art" opacity=".3"/>
    <circle className="kit-f kit-move" cx="386" cy="32" r="16"
      style={{ '--hov':'translate(-130px, 64px)' }}/>
    <B x="108" y="32" w="70" h="13" r="6.5" cls="kit-f-art" opacity=".22"/>
    <B x="122" y="56" w="56" h="13" r="6.5" cls="kit-f-art" opacity=".16"/>
    <B x="462" y="86" w="68" h="13" r="6.5" cls="kit-f-art" opacity=".22"/>
    <B x="462" y="110" w="48" h="13" r="6.5" cls="kit-f-art" opacity=".16"/>
  </Scene>
)

export const ReframeMark = () => (
  <Scene>
    <B x="158" y="20" w="324" h="15" r="7.5" cls="kit-f-art" opacity=".26"/>
    <B x="158" y="60" w="128" h="15" r="7.5" cls="kit-f-art" opacity=".26"/>
    <B x="386" y="60" w="96" h="15" r="7.5" cls="kit-f-art" opacity=".26"/>
    <B x="158" y="100" w="228" h="15" r="7.5" cls="kit-f-art" opacity=".26"/>
    <path d="M298 90c-2 20 22 26 38 13" className="kit-s kit-draw" strokeWidth="3.5" fill="none"
      strokeLinecap="round" pathLength="100"/>
    <B x="296" y="52" w="84" h="30" r="8" cls="kit-f kit-move"
      style={{ '--rest':'translateY(-9px) rotate(-7deg)', '--hov':'translateY(0px) rotate(0deg)' }}/>
    <B x="102" y="22" w="46" h="10" r="5" cls="kit-f-art" opacity=".14"/>
    <B x="108" y="62" w="40" h="10" r="5" cls="kit-f-art" opacity=".14"/>
    <B x="492" y="22" w="46" h="10" r="5" cls="kit-f-art" opacity=".14"/>
    <B x="498" y="102" w="40" h="10" r="5" cls="kit-f-art" opacity=".14"/>
  </Scene>
)

export const GroundMark = () => {
  const stacks = [5, 4, 3, 2, 1]
  return (
    <Scene>
      <B x="100" y="112" w="440" h="10" r="5" cls="kit-f"/>
      <g className="kit-move" style={{ '--hov':'translateY(3px)' }}>
        {stacks.map((n, s) => (
          <g key={n}>
            {Array.from({ length: n }, (_, i) => (
              <B key={i} x={156 + s * 72} y={94 - i * 19} w="30" h="13" r="6"
                cls={i === n - 1 ? 'kit-f' : 'kit-f-art'} opacity={i === n - 1 ? 1 : 0.42}/>
            ))}
          </g>
        ))}
      </g>
      <B x="104" y="94" w="30" h="13" r="6" cls="kit-f-art" opacity=".18"/>
      <B x="500" y="94" w="30" h="13" r="6" cls="kit-f-art" opacity=".18"/>
      <B x="500" y="75" w="30" h="13" r="6" cls="kit-f-art" opacity=".18"/>
    </Scene>
  )
}

export const PileMark = () => {
  const heap = [
    [150, 18, 86, -8], [196, 40, 70, 6], [142, 62, 94, -4],
    [184, 84, 76, 9], [152, 104, 64, -6], [232, 14, 52, 11],
  ]
  return (
    <Scene>
      {heap.map(([x, y, w, a], i) => (
        <B key={i} x={x} y={y} w={w} h="16" r="8" cls="kit-f-art kit-move"
          opacity=".55" style={{ '--rest':`rotate(${a}deg)`, '--hov':'rotate(0deg)' }}/>
      ))}
      <path d="M306 66h38" className="kit-s kit-draw" strokeWidth="3" strokeLinecap="round"
        pathLength="100"/>
      <path d="M336 58l9 8-9 8" className="kit-s" strokeWidth="3" fill="none"
        strokeLinecap="round" strokeLinejoin="round"/>
      {[0, 1, 2].map(i => <B key={i} x="366" y={26 + i * 26} w="62" h="16" r="8" cls="kit-f"/>)}
      {[0, 1, 2].map(i => <B key={i} x="444" y={26 + i * 26} w="62" h="16" r="8" cls="kit-f-art"
        opacity=".4"/>)}
      <B x="366" y="104" w="62" h="6" r="3" cls="kit-f" opacity=".3"/>
      <B x="444" y="104" w="62" h="6" r="3" cls="kit-f-art" opacity=".2"/>
      <B x="480" y="44" w="56" h="16" r="8" cls="kit-f-art" opacity=".14"/>
      <B x="496" y="70" w="40" h="16" r="8" cls="kit-f-art" opacity=".14"/>
    </Scene>
  )
}

export const OpenersMark = () => (
  <Scene>
    <path d="M158 16h128a8 8 0 0 1 8 8v34a8 8 0 0 1-8 8h-96l-18 16V66h-14a8 8 0 0 1-8-8V24a8 8 0 0 1 8-8z"
      className="kit-s-art" strokeWidth="2.5" fill="none"/>
    <B x="174" y="32" w="88" h="7" r="3.5" cls="kit-f-art" opacity=".4"/>
    <B x="174" y="46" w="56" h="7" r="3.5" cls="kit-f-art" opacity=".4"/>
    <path d="M310 70c22-6 28-18 46-20" className="kit-s-art" strokeWidth="2.5" fill="none"
      strokeDasharray="3 6" strokeLinecap="round"/>
    <g className="kit-move" style={{ '--hov':'scale(1.035)' }}>
      <path d="M362 46h126a10 10 0 0 1 10 10v44a10 10 0 0 1-10 10h-90l-22 18v-18h-14a10 10 0 0 1-10-10V56a10 10 0 0 1 10-10z"
        className="kit-f"/>
      <B x="382" y="66" w="94" h="8" r="4" cls="kit-f-glow"/>
      <B x="382" y="84" w="70" h="8" r="4" cls="kit-f-glow" opacity=".65"/>
    </g>
    <B x="108" y="86" w="46" h="8" r="4" cls="kit-f-art" opacity=".16"/>
    <B x="508" y="22" w="30" h="8" r="4" cls="kit-f-art" opacity=".16"/>
  </Scene>
)

export const CheckMark = () => (
  <Scene>
    <B x="148" y="34" w="92" h="14" r="7" cls="kit-f-art" opacity=".3"/>
    <B x="250" y="34" w="64" h="14" r="7" cls="kit-f-art" opacity=".3"/>
    <B x="324" y="34" w="78" h="14" r="7" cls="kit-f"/>
    <B x="412" y="34" w="88" h="14" r="7" cls="kit-f-art" opacity=".3"/>
    <B x="148" y="62" w="118" h="14" r="7" cls="kit-f-art" opacity=".3"/>
    <B x="276" y="62" w="72" h="14" r="7" cls="kit-f-art" opacity=".3"/>
    <g className="kit-move" style={{ '--hov':'scale(1.07)' }}>
      <circle cx="363" cy="41" r="31" className="kit-s" strokeWidth="3.5" fill="none"/>
      <path d="M385 63l21 21" className="kit-s" strokeWidth="3.5" strokeLinecap="round"/>
    </g>
    <B x="148" y="104" w="54" h="10" r="5" cls="kit-f-art" opacity=".18"/>
    <B x="106" y="88" w="34" h="10" r="5" cls="kit-f-art" opacity=".14"/>
    <B x="508" y="78" w="30" h="10" r="5" cls="kit-f-art" opacity=".14"/>
  </Scene>
)

export const GaugeMark = () => {
  const days = [38, 44, 36, 52, 48, 70, 66, 58, 74, 62, 46, 40, 50, 44]
  return (
    <Scene>
      <path d="M156 104a62 62 0 0 1 124 0" className="kit-s-art" strokeWidth="11" fill="none"
        strokeLinecap="round" opacity=".32"/>
      <path d="M156 104a62 62 0 0 1 36-56" className="kit-s" strokeWidth="11" fill="none"
        strokeLinecap="round"/>
      {[0, 1, 2, 3, 4].map(i => {
        const a = Math.PI * (1 - i / 4)
        return <line key={i} x1={218 + Math.cos(a) * 46} y1={104 - Math.sin(a) * 46}
          x2={218 + Math.cos(a) * 38} y2={104 - Math.sin(a) * 38}
          className="kit-s-art" strokeWidth="2.5" strokeLinecap="round"/>
      })}
      <g className="kit-move kit-move-v" style={{ '--hov':'rotate(-18deg)', transformOrigin:'218px 104px' }}>
        <path d="M218 104l30 -32" className="kit-s" strokeWidth="4" strokeLinecap="round"/>
      </g>
      <circle cx="218" cy="104" r="7" className="kit-f"/>
      <line x1="316" y1="84" x2="508" y2="84" className="kit-s-art" strokeWidth="2"
        strokeDasharray="4 5" opacity=".7"/>
      {days.map((d, i) => (
        <B key={i} x={318 + i * 14} y={110 - d} w="9" h={d} r="4.5"
          cls={d >= 62 ? 'kit-f' : 'kit-f-art'} opacity={d >= 62 ? 1 : 0.45}/>
      ))}
      <B x="316" y="114" w="192" h="5" r="2.5" cls="kit-f-art" opacity=".4"/>
      <B x="516" y="30" w="24" h="8" r="4" cls="kit-f-art" opacity=".14"/>
      <B x="106" y="30" w="24" h="8" r="4" cls="kit-f-art" opacity=".14"/>
    </Scene>
  )
}

export const RulesMark = () => (
  <Scene>
    <B x="100" y="112" w="440" h="8" r="4" cls="kit-f-art" opacity=".35"/>
    <g className="kit-move" style={{ '--hov':'translateX(7px)' }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <B key={i} x={150 + i * 44} y={100 - i * 5} w="34" h={12 + i * 5} r="6"
          cls="kit-f-art" opacity={0.3 + i * 0.1}/>
      ))}
    </g>
    <path d="M424 112V58a34 34 0 0 1 68 0v54z" className="kit-f"/>
    <B x="446" y="76" w="24" h="36" r="10" cls="kit-f-glow"/>
    <B x="106" y="96" w="30" h="12" r="6" cls="kit-f-art" opacity=".14"/>
    <B x="508" y="88" w="30" h="12" r="6" cls="kit-f-art" opacity=".14"/>
  </Scene>
)

export const HelpMark = () => (
  <Scene>
    <path d="M166 112V66l34-26 34 26v46z" className="kit-s-art" strokeWidth="3" fill="none"
      strokeLinejoin="round"/>
    <B x="186" y="86" w="28" h="26" r="4" cls="kit-f-art" opacity=".35"/>
    <path d="M258 90h86" className="kit-s kit-draw" strokeWidth="3" strokeLinecap="round"
      pathLength="100"/>
    <path d="M334 82l10 8-10 8" className="kit-s" strokeWidth="3" fill="none"
      strokeLinecap="round" strokeLinejoin="round"/>
    <g className="kit-move" style={{ '--hov':'translateY(-5px)' }}>
      <path d="M368 112V62a44 44 0 0 1 88 0v50z" className="kit-f"/>
      <B x="398" y="76" w="28" h="36" r="12" cls="kit-f-glow"/>
    </g>
    <B x="100" y="112" w="440" h="8" r="4" cls="kit-f-art" opacity=".3"/>
    <B x="106" y="36" w="34" h="12" r="6" cls="kit-f-art" opacity=".14"/>
    <B x="504" y="36" w="34" h="12" r="6" cls="kit-f-art" opacity=".14"/>
  </Scene>
)

const KEY = [
  { k:'sky',   x:26,  w:52, h:76  },
  { k:'leaf',  x:88,  w:64, h:104 },
  { k:'sand',  x:162, w:44, h:56  },
  { k:'stone', x:216, w:70, h:120 },
  { k:'dusk',  x:296, w:56, h:88  },
]

export const FiveMark = () => (
  <svg viewBox="0 0 440 150" aria-hidden focusable="false"
    preserveAspectRatio="xMidYMid meet" className="h-full w-full">
    <circle cx="382" cy="56" r="40" fill={FAMILIES.sand.tint}/>
    <circle cx="382" cy="56" r="40" fill="none" stroke={FAMILIES.sand.deep}
      strokeWidth="2" opacity=".35"/>
    {KEY.map(({ k, x, w, h }) => {
      const f = FAMILIES[k], r = w / 2, y = 126 - h
      const d = `M${x} 126V${y + r}a${r} ${r} 0 0 1 ${w} 0V126Z`
      return (
        <g key={k}>
          <path d={d} fill={f.tint}/>
          <path d={d} fill="none" stroke={f.deep} strokeWidth="3" strokeLinejoin="round"/>
        </g>
      )
    })}
    <rect x="0" y="124" width="440" height="9" rx="4.5" fill={FAMILIES.dusk.deep}/>
  </svg>
)

export function Art({ draw: Draw, className }) {
  return (
    <span className={cn('block w-full max-w-[560px] overflow-hidden rounded-panel',
      'aspect-[44/15] border border-rule bg-card', className)}>
      <Draw/>
    </span>
  )
}
