import React from 'react'
import { RainbowDial } from '../../charts/rainbow'
import { studentRings } from '../../lib/readings'
import { AvatarArt } from '../../account/avatars'
import { cn } from '../../lib/utils'

// Fixed full bands with every number hidden, so the picture cannot be read as anyone's score.
const ART_FILL = [88, 74, 60, 46]
export function RainbowArt({ size = 240, className }) {
  const rings = React.useMemo(() => studentRings().map((r, i) => ({ ...r, value: ART_FILL[i] ?? r.value })), [])
  return (
    <div aria-hidden className={cn('pointer-events-none [&_.text-dial]:invisible [&_.text-tick]:invisible',
      '[&_svg_text]:hidden', className)}>
      <RainbowDial score={0} rings={rings} size={size}/>
    </div>
  )
}

export function LinkArt({ className }) {
  return (
    <span aria-hidden className={cn('relative block aspect-[168/76] w-[168px]', className)}>
      <svg viewBox="0 0 168 76" className="absolute inset-0 size-full" fill="none">
        <path d="M30 40 C 56 8, 92 8, 84 38 S 120 70, 138 40" stroke="#067049" strokeWidth="2.5"
          strokeDasharray="5 6" strokeLinecap="round"/>
      </svg>
      <span className="absolute left-0 top-[18%] aspect-square w-[31%] rounded-full ring-2 ring-white">
        <AvatarArt id="char-elena" className="size-full"/></span>
      <span className="absolute left-[34.5%] top-[13%] aspect-square w-[33.3%] rounded-full ring-2 ring-white">
        <AvatarArt id="char-maya" className="size-full"/></span>
      <span className="absolute left-[69%] top-[18%] aspect-square w-[31%] rounded-full ring-2 ring-white">
        <AvatarArt id="char-shah" className="size-full"/></span>
    </span>
  )
}

export function ToolArt({ className }) {
  return (
    <svg aria-hidden viewBox="0 0 120 92" className={cn('block h-[92px] w-[120px] overflow-visible', className)}
      fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g transform="rotate(-8 34 46)">
        <rect x="6" y="18" width="52" height="62" rx="9" fill="#ffffff" stroke="#b5871b" strokeWidth="2.4"/>
        <path d="M16 34h24a5 5 0 0 1 5 5v6a5 5 0 0 1-5 5h-14l-6 5v-5h-4a5 5 0 0 1-5-5v-6a5 5 0 0 1 5-5z"
          fill="#f0cf7a"/>
        <path d="M16 64h32M16 71h20" stroke="#b5871b" strokeWidth="2.4"/>
      </g>
      <g transform="rotate(5 86 44)">
        <rect x="60" y="10" width="52" height="62" rx="9" fill="#def0fc" stroke="#2294e6" strokeWidth="2.4"/>
        <circle cx="86" cy="38" r="15" fill="#ffffff" stroke="#2294e6" strokeWidth="2.4"/>
        <path d="M86 29v9l6 4" stroke="#2294e6" strokeWidth="2.6"/>
        <path d="M72 62h28" stroke="#2294e6" strokeWidth="2.4"/>
      </g>
      <g transform="rotate(-3 62 70)">
        <rect x="36" y="50" width="52" height="38" rx="8" fill="#fce6f1" stroke="#f2248b" strokeWidth="2.4"/>
        <path d="M46 62h22M46 70h32M46 78h14" stroke="#f2248b" strokeWidth="2.4"/>
      </g>
    </svg>
  )
}
