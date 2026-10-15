import React from 'react'
import { cn } from '../lib/utils'
import { AVATAR_IDS } from './store'

/* Twelve animal characters, drawn here. Flat, rounded, two or three colours
   on one of the six hue washes from tailwind.config.js, in a 64 box that
   still reads at 32px: big head, dot eyes, a small smile. Nothing here is a
   photograph, a face, or anybody's character. The hues are graphics only;
   no word is ever set in them. */

/* Shared pieces. Eyes are two dots; the smile is one short arc. */
const Eyes = ({ y = 30, dx = 7, r = 2.2 }) => (
  <><circle cx={32 - dx} cy={y} r={r} className="fill-ink"/><circle cx={32 + dx} cy={y} r={r} className="fill-ink"/></>
)
const Smile = ({ y = 40, w = 5 }) => (
  <path d={`M${32 - w} ${y}q${w} ${w * 0.8} ${w * 2} 0`} className="stroke-ink" strokeWidth="2" strokeLinecap="round" fill="none"/>
)

const DRAW = {
  fox: () => <>
    <path d="M14 14l8 12h-10zM50 14l-8 12h10z" className="fill-coral-ink"/>
    <path d="M16 18l6 9h-7zM48 18l-6 9h7z" className="fill-coral"/>
    <ellipse cx="32" cy="36" rx="19" ry="16" className="fill-coral"/>
    <path d="M18 40q14 14 28 0v-6q-14 10-28 0z" className="fill-paper"/>
    <Eyes y={33} dx={8}/>
    <ellipse cx="32" cy="43" rx="2.6" ry="2" className="fill-ink"/>
  </>,
  owl: () => <>
    <path d="M16 18l4-8 6 8zM48 18l-4-8-6 8z" className="fill-sun-ink"/>
    <ellipse cx="32" cy="36" rx="19" ry="18" className="fill-sun-ink"/>
    <ellipse cx="32" cy="42" rx="11" ry="9" className="fill-sun"/>
    <circle cx="24" cy="30" r="7" className="fill-paper"/><circle cx="40" cy="30" r="7" className="fill-paper"/>
    <Eyes y={30} dx={8} r={2.8}/>
    <path d="M32 35l-3.5 4h7z" className="fill-coral"/>
  </>,
  panda: () => <>
    <circle cx="17" cy="19" r="7" className="fill-ink"/><circle cx="47" cy="19" r="7" className="fill-ink"/>
    <ellipse cx="32" cy="36" rx="20" ry="17" className="fill-paper"/>
    <ellipse cx="23" cy="32" rx="6" ry="7" transform="rotate(-18 23 32)" className="fill-ink"/>
    <ellipse cx="41" cy="32" rx="6" ry="7" transform="rotate(18 41 32)" className="fill-ink"/>
    <circle cx="24" cy="32" r="2.2" className="fill-paper"/><circle cx="40" cy="32" r="2.2" className="fill-paper"/>
    <ellipse cx="32" cy="42" rx="3" ry="2.2" className="fill-ink"/>
    <Smile y={45} w={3.5}/>
  </>,
  frog: () => <>
    <circle cx="20" cy="22" r="8" className="fill-mint"/><circle cx="44" cy="22" r="8" className="fill-mint"/>
    <ellipse cx="32" cy="38" rx="21" ry="15" className="fill-mint"/>
    <circle cx="20" cy="22" r="4.5" className="fill-paper"/><circle cx="44" cy="22" r="4.5" className="fill-paper"/>
    <Eyes y={22} dx={12} r={2.2}/>
    <path d="M22 40q10 9 20 0" className="stroke-mint-ink" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
    <circle cx="27" cy="34" r="1.3" className="fill-mint-ink"/><circle cx="37" cy="34" r="1.3" className="fill-mint-ink"/>
  </>,
  cat: () => <>
    <path d="M13 32V13l12 9zM51 32V13l-12 9z" className="fill-lilac"/>
    <path d="M16 27v-9l6 5zM48 27v-9l-6 5z" className="fill-blush-wash"/>
    <ellipse cx="32" cy="37" rx="20" ry="16" className="fill-lilac"/>
    <Eyes y={34} dx={8}/>
    <path d="M32 40l-2.5 2.5h5z" className="fill-blush"/>
    <path d="M14 38h9M14 43h9M41 38h9M41 43h9" className="stroke-lilac-ink" strokeWidth="1.6" strokeLinecap="round"/>
    <Smile y={44} w={3.5}/>
  </>,
  bear: () => <>
    <circle cx="16" cy="20" r="7.5" className="fill-sun-ink"/><circle cx="48" cy="20" r="7.5" className="fill-sun-ink"/>
    <circle cx="16" cy="20" r="3.5" className="fill-sun"/><circle cx="48" cy="20" r="3.5" className="fill-sun"/>
    <circle cx="32" cy="36" r="19" className="fill-sun-ink"/>
    <ellipse cx="32" cy="43" rx="9" ry="7" className="fill-sun"/>
    <Eyes y={32} dx={8}/>
    <ellipse cx="32" cy="41" rx="3" ry="2.2" className="fill-ink"/>
  </>,
  koala: () => <>
    <circle cx="14" cy="28" r="10" className="fill-ruling"/><circle cx="50" cy="28" r="10" className="fill-ruling"/>
    <circle cx="14" cy="28" r="5" className="fill-blush-wash"/><circle cx="50" cy="28" r="5" className="fill-blush-wash"/>
    <ellipse cx="32" cy="36" rx="19" ry="17" className="fill-ruling"/>
    <Eyes y={31} dx={8}/>
    <ellipse cx="32" cy="41" rx="5" ry="6.5" className="fill-ink"/>
  </>,
  penguin: () => <>
    <ellipse cx="32" cy="36" rx="18" ry="21" className="fill-ink"/>
    <ellipse cx="32" cy="40" rx="11" ry="14" className="fill-paper"/>
    <circle cx="25" cy="28" r="4.5" className="fill-paper"/><circle cx="39" cy="28" r="4.5" className="fill-paper"/>
    <Eyes y={28} dx={7} r={2}/>
    <path d="M32 32l-4 4h8z" className="fill-sun"/>
    <path d="M22 56l4-5h12l4 5z" className="fill-sun"/>
  </>,
  bunny: () => <>
    <ellipse cx="24" cy="16" rx="6" ry="13" className="fill-paper"/><ellipse cx="40" cy="16" rx="6" ry="13" className="fill-paper"/>
    <ellipse cx="24" cy="16" rx="2.8" ry="9" className="fill-blush-wash"/><ellipse cx="40" cy="16" rx="2.8" ry="9" className="fill-blush-wash"/>
    <circle cx="32" cy="38" r="18" className="fill-paper"/>
    <Eyes y={36} dx={8}/>
    <ellipse cx="32" cy="42" rx="2.5" ry="1.8" className="fill-blush"/>
    <Smile y={45} w={3}/>
  </>,
  whale: () => <>
    <path d="M10 38q0-16 22-16t22 12v6q0 6-6 6H16q-6 0-6-8z" className="fill-sky"/>
    <path d="M46 34q6-10 12-8-2 6-8 10z" className="fill-sky"/>
    <path d="M14 42q18 8 36 0v2q0 2-2 2H16q-2 0-2-2z" className="fill-paper"/>
    <circle cx="22" cy="34" r="2.2" className="fill-ink"/>
    <path d="M30 20q2-6 0-9M34 20q-2-6 0-9" className="stroke-sky-ink" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M16 40q4 3 8 0" className="stroke-ink" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
  </>,
  hedgehog: () => <>
    <path d="M12 42q0-24 24-26l5-6 2 7 7-3-3 7q6 4 6 14v7H12z" className="fill-sun-ink"/>
    <ellipse cx="30" cy="42" rx="15" ry="11" className="fill-sun-wash"/>
    <Eyes y={40} dx={6}/>
    <circle cx="17" cy="45" r="3" className="fill-ink"/>
    <Smile y={46} w={3}/>
  </>,
  sloth: () => <>
    <ellipse cx="32" cy="36" rx="20" ry="17" className="fill-sun"/>
    <ellipse cx="32" cy="38" rx="13" ry="11" className="fill-sun-wash"/>
    <ellipse cx="24" cy="34" rx="5" ry="3.5" transform="rotate(-20 24 34)" className="fill-sun-ink"/>
    <ellipse cx="40" cy="34" rx="5" ry="3.5" transform="rotate(20 40 34)" className="fill-sun-ink"/>
    <Eyes y={34} dx={8} r={1.8}/>
    <ellipse cx="32" cy="41" rx="2.5" ry="1.8" className="fill-ink"/>
    <Smile y={44} w={4}/>
  </>,
}

const WASH = {
  fox: 'fill-coral-wash', hedgehog: 'fill-coral-wash',
  owl: 'fill-sun-wash', bear: 'fill-sun-wash',
  frog: 'fill-mint-wash', sloth: 'fill-mint-wash',
  penguin: 'fill-sky-wash', whale: 'fill-sky-wash',
  cat: 'fill-lilac-wash', koala: 'fill-lilac-wash',
  bunny: 'fill-blush-wash', panda: 'fill-blush-wash',
}

export const AVATARS = AVATAR_IDS.map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }))

/* One picture. Decorative: the name beside it carries the meaning. */
export function AvatarArt({ id, className }) {
  const draw = DRAW[id]
  if (!draw) return null
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn('block shrink-0', className)}>
      <defs><clipPath id={`av-${id}`}><circle cx="32" cy="32" r="32"/></clipPath></defs>
      <circle cx="32" cy="32" r="32" className={WASH[id]}/>
      <g clipPath={`url(#av-${id})`}>{draw()}</g>
    </svg>
  )
}
