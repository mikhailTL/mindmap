import React from 'react'
import { cn } from '../lib/utils'
import { AVATAR_IDS } from './store'
import { CATALOG, PAIRS, avatarEntry, isPhotoAvatar } from './avatar-catalog'
import { CharacterArt } from './characters/Character'

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

/* Class names spelled out whole, so Tailwind finds them. */
const F  = { coral: 'fill-coral', sun: 'fill-sun', mint: 'fill-mint', sky: 'fill-sky', lilac: 'fill-lilac', blush: 'fill-blush' }
const FW = { coral: 'fill-coral-wash', sun: 'fill-sun-wash', mint: 'fill-mint-wash', sky: 'fill-sky-wash', lilac: 'fill-lilac-wash', blush: 'fill-blush-wash' }
const FI = { coral: 'fill-coral-ink', sun: 'fill-sun-ink', mint: 'fill-mint-ink', sky: 'fill-sky-ink', lilac: 'fill-lilac-ink', blush: 'fill-blush-ink' }
const S  = { coral: 'stroke-coral', sun: 'stroke-sun', mint: 'stroke-mint', sky: 'stroke-sky', lilac: 'stroke-lilac', blush: 'stroke-blush' }
const SI = { coral: 'stroke-coral-ink', sun: 'stroke-sun-ink', mint: 'stroke-mint-ink', sky: 'stroke-sky-ink', lilac: 'stroke-lilac-ink', blush: 'stroke-blush-ink' }

const poly = (n, r, rot = -90, cx = 32, cy = 32) => Array.from({ length: n }, (_, i) => {
  const a = (rot + (360 / n) * i) * Math.PI / 180
  return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
}).join(' ')
const star = (n, ro, ri) => Array.from({ length: n * 2 }, (_, i) => {
  const a = (-90 + (180 / n) * i) * Math.PI / 180, r = i % 2 ? ri : ro
  return `${(32 + r * Math.cos(a)).toFixed(2)},${(32 + r * Math.sin(a)).toFixed(2)}`
}).join(' ')

const line = { strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }

const SYM = {
  circle:   h => <><circle cx="32" cy="32" r="18" className={F[h]}/><circle cx="32" cy="32" r="7" className={FW[h]}/></>,
  square:   h => <><rect x="15" y="15" width="34" height="34" rx="7" className={F[h]}/><rect x="26" y="26" width="12" height="12" rx="3" className={FW[h]}/></>,
  triangle: h => <path d="M32 13L52 48H12Z" strokeLinejoin="round" strokeWidth="5" className={cn(F[h], S[h])}/>,
  diamond:  h => <><path d="M32 10L54 32 32 54 10 32Z" strokeLinejoin="round" strokeWidth="3" className={cn(F[h], S[h])}/><path d="M32 22L42 32 32 42 22 32Z" className={FW[h]}/></>,
  hexagon:  h => <polygon points={poly(6, 21, -90)} strokeLinejoin="round" strokeWidth="3" className={cn(F[h], S[h])}/>,
  star:     h => <polygon points={star(5, 22, 9.5)} strokeLinejoin="round" strokeWidth="3" className={cn(F[h], S[h])}/>,
  sparkle:  h => <><path d="M32 9Q35 29 55 32 35 35 32 55 29 35 9 32 29 29 32 9Z" className={F[h]}/><path d="M48 12q1 5 5 5-4 1-5 5-1-4-5-5 4 0 5-5z" className={FI[h]}/></>,
  heart:    h => <path d="M32 50C12 37 11 19 23 17c5-1 9 3 9 7 0-4 4-8 9-7 12 2 11 20-9 33Z" className={F[h]}/>,
  moon:     h => <path d="M38 12a20 20 0 1 0 14 32A16 16 0 1 1 38 12Z" className={F[h]}/>,
  sun:      h => <><circle cx="32" cy="32" r="10" className={F[h]}/>
    <path d="M32 9v7M32 48v7M9 32h7M48 32h7M15.7 15.7l5 5M43.3 43.3l5 5M15.7 48.3l5-5M43.3 20.7l5-5" strokeWidth="4" className={S[h]} {...line}/></>,
  cloud:    h => <path d="M20 46a10 10 0 0 1-1-20 13 13 0 0 1 25-4 10 10 0 0 1 2 24Z" className={F[h]}/>,
  bolt:     h => <path d="M36 9L17 36h13l-3 19 20-28H34Z" strokeLinejoin="round" strokeWidth="2" className={cn(F[h], S[h])}/>,
  leaf:     h => <><path d="M14 50C14 26 28 14 51 13 51 37 38 50 14 50Z" className={F[h]}/><path d="M17 47L42 22" strokeWidth="2.6" className={SI[h]} {...line}/></>,
  drop:     h => <><path d="M32 9C32 9 49 29 49 39a17 17 0 0 1-34 0C15 29 32 9 32 9Z" className={F[h]}/><path d="M24 40a8 8 0 0 0 6 7" strokeWidth="3" className="stroke-paper" {...line}/></>,
  wave:     h => <><path d="M8 28q6-8 12 0t12 0 12 0 12 0" strokeWidth="5" className={S[h]} {...line}/><path d="M8 40q6-8 12 0t12 0 12 0 12 0" strokeWidth="5" className={SI[h]} {...line}/></>,
  mountain: h => <><path d="M6 52L26 20l9 14 7-9 16 27Z" className={F[h]}/><path d="M26 20l-6 10 6-3 4 3Z" className="fill-paper"/></>,
  spiral:   h => <path d="M32 32a3 3 0 0 1 6 0 6 6 0 0 1-12 0 9 9 0 0 1 18 0 12 12 0 0 1-24 0 15 15 0 0 1 30 0" strokeWidth="4" className={S[h]} {...line}/>,
  infinity: h => <path d="M32 32c-6-10-18-10-18 0s12 10 18 0 18-10 18 0-12 10-18 0Z" strokeWidth="5.5" className={S[h]} {...line}/>,
  plus:     h => <path d="M32 14v36M14 32h36" strokeWidth="11" className={S[h]} {...line}/>,
  target:   h => <><circle cx="32" cy="32" r="20" className={F[h]}/><circle cx="32" cy="32" r="13" className={FW[h]}/><circle cx="32" cy="32" r="6" className={FI[h]}/></>,
  arrow:    h => <path d="M32 11L52 33H40V53H24V33H12Z" strokeLinejoin="round" strokeWidth="3" className={cn(F[h], S[h])}/>,
  note:     h => <><circle cx="24" cy="45" r="7.5" className={F[h]}/><rect x="28.5" y="13" width="4.5" height="33" rx="2" className={F[h]}/>
    <path d="M33 13c8 2 13 7 11 15-2-4-6-6-11-7Z" className={FI[h]}/></>,
  flower:   h => <>{[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="32" cy="18" rx="7.5" ry="11" transform={`rotate(${a} 32 32)`} className={F[h]}/>)}
    <circle cx="32" cy="32" r="7" className="fill-sun-wash"/><circle cx="32" cy="32" r="3.5" className="fill-sun-ink"/></>,
  snowflake: h => <g strokeWidth="3.6" className={S[h]} {...line}>
    {[0, 60, 120].map(a => <path key={a} d="M32 11v42M27 15l5 5 5-5M27 49l5-5 5 5" transform={`rotate(${a} 32 32)`}/>)}</g>,
  planet:   h => <><circle cx="32" cy="32" r="13" className={F[h]}/>
    <ellipse cx="32" cy="32" rx="24" ry="7" transform="rotate(-20 32 32)" strokeWidth="3.5" className={SI[h]} {...line}/></>,
  peace:    h => <g strokeWidth="4.5" className={S[h]} {...line}><circle cx="32" cy="32" r="18"/><path d="M32 14v36M32 32L19.5 44.5M32 32l12.5 12.5"/></g>,
  anchor:   h => <g strokeWidth="4" className={SI[h]} {...line}><circle cx="32" cy="15" r="4.5"/><path d="M32 19.5V52M23 27h18M14 36q2 16 18 16t18-16"/></g>,
  atom:     h => <><g strokeWidth="3" className={S[h]} {...line}>
    {[0, 60, 120].map(a => <ellipse key={a} cx="32" cy="32" rx="21" ry="8" transform={`rotate(${a} 32 32)`}/>)}</g>
    <circle cx="32" cy="32" r="4.5" className={FI[h]}/></>,
  asterisk: h => <g strokeWidth="7" className={S[h]} {...line}>{[0, 60, 120].map(a => <path key={a} d="M32 14v36" transform={`rotate(${a} 32 32)`}/>)}</g>,
  bars:     h => <>{[[14, 30], [24, 16], [34, 24], [44, 36]].map(([x, y], i) => (
    <rect key={x} x={x} y={y} width="7" height={50 - y} rx="3.5" className={i % 2 ? FI[h] : F[h]}/>))}</>,
}

const Dot = ({ x, y, r = 2.6 }) => <circle cx={x} cy={y} r={r} className="fill-ink"/>
const ink = { strokeWidth: 2.6, className: 'stroke-ink', ...line }
const Head = ({ h }) => <circle cx="32" cy="32" r="23" className={F[h]}/>

const FACE = {
  smile:   h => <><Head h={h}/><Dot x={24} y={28}/><Dot x={40} y={28}/><path d="M23 37q9 9 18 0" {...ink}/></>,
  grin:    h => <><Head h={h}/><Dot x={24} y={27}/><Dot x={40} y={27}/>
    <path d="M20 35h24a12 12 0 0 1-24 0Z" className="fill-ink"/><path d="M22.5 36h19v3h-19z" className="fill-paper"/></>,
  cool:    h => <><Head h={h}/><path d="M15 25h34" {...ink}/>
    <rect x="17" y="24" width="13" height="9" rx="3.5" className="fill-ink"/><rect x="34" y="24" width="13" height="9" rx="3.5" className="fill-ink"/>
    <path d="M25 41q7 5 14 0" {...ink}/></>,
  wink:    h => <><Head h={h}/><Dot x={24} y={28}/><path d="M36 28q4-3 8 0" {...ink}/><path d="M23 37q9 9 18 0" {...ink}/></>,
  starry:  h => <><Head h={h}/>
    <polygon points="24,22 25.8,26 30,26.3 26.8,29 27.8,33 24,30.8 20.2,33 21.2,29 18,26.3 22.2,26" className="fill-ink"/>
    <polygon points="40,22 41.8,26 46,26.3 42.8,29 43.8,33 40,30.8 36.2,33 37.2,29 34,26.3 38.2,26" className="fill-ink"/>
    <path d="M23 38h18a9 9 0 0 1-18 0Z" className="fill-ink"/></>,
  calm:    h => <><Head h={h}/><path d="M20 29q4 4 8 0M36 29q4 4 8 0" {...ink}/><path d="M26 39q6 4 12 0" {...ink}/></>,
  tongue:  h => <><Head h={h}/><Dot x={24} y={27}/><Dot x={40} y={27}/><path d="M22 36q10 7 20 0" {...ink}/>
    <path d="M29 39.5h8v4a4 4 0 0 1-8 0Z" className="fill-blush"/></>,
  glasses: h => <><Head h={h}/><circle cx="24" cy="28" r="6.5" strokeWidth="2.4" className="stroke-ink" fill="none"/>
    <circle cx="40" cy="28" r="6.5" strokeWidth="2.4" className="stroke-ink" fill="none"/><path d="M30.5 28h3" {...ink}/>
    <Dot x={24} y={28} r={2}/><Dot x={40} y={28} r={2}/><path d="M26 40q6 4 12 0" {...ink}/></>,
  robot:   h => <><path d="M32 10v6" {...ink}/><circle cx="32" cy="9" r="3" className={FI[h]}/>
    <rect x="13" y="16" width="38" height="34" rx="9" className={F[h]}/>
    <rect x="19" y="24" width="10" height="9" rx="2.5" className="fill-paper"/><rect x="35" y="24" width="10" height="9" rx="2.5" className="fill-paper"/>
    <Dot x={24} y={28.5} r={2.2}/><Dot x={40} y={28.5} r={2.2}/>
    <path d="M23 41h18M27 38v6M32 38v6M37 38v6" strokeWidth="2" className="stroke-ink" {...line}/></>,
  alien:   h => <><path d="M32 9c14 0 21 10 21 21 0 14-12 25-21 25S11 44 11 30C11 19 18 9 32 9Z" className={F[h]}/>
    <ellipse cx="23" cy="31" rx="7" ry="4.5" transform="rotate(30 23 31)" className="fill-ink"/>
    <ellipse cx="41" cy="31" rx="7" ry="4.5" transform="rotate(-30 41 31)" className="fill-ink"/>
    <path d="M29 45q3 2 6 0" {...ink}/></>,
  ghost:   h => <><path d="M14 54V30a18 18 0 0 1 36 0v24l-6-5-6 5-6-5-6 5-6-5Z" className="fill-paper"/>
    <ellipse cx="25" cy="30" rx="3" ry="4" className="fill-ink"/><ellipse cx="39" cy="30" rx="3" ry="4" className="fill-ink"/>
    <ellipse cx="32" cy="40" rx="3" ry="2.6" className={FI[h]}/></>,
  neutral: h => <><Head h={h}/><Dot x={24} y={28}/><Dot x={40} y={28}/><path d="M25 40h14" {...ink}/></>,
}

// A seed derived from the id, so a generated pattern is identical on every device.
function seeded(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) }
  return () => {
    h += 0x6D2B79F5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PAT = {
  stripes: (a, b) => <g transform="rotate(45 32 32)">{Array.from({ length: 12 }, (_, i) => (
    <rect key={i} x={-20 + i * 9} y="-20" width="4.5" height="104" className={i % 2 ? F[b] : F[a]}/>))}</g>,
  dots: (a, b) => <>{Array.from({ length: 36 }, (_, i) => {
    const r = Math.floor(i / 6), c = i % 6
    return <circle key={i} cx={4 + c * 11 + (r % 2 ? 5.5 : 0)} cy={5 + r * 11} r="3.6" className={(r + c) % 2 ? F[b] : F[a]}/>
  })}</>,
  checks: (a, b) => <>{Array.from({ length: 64 }, (_, i) => {
    const r = Math.floor(i / 8), c = i % 8
    if ((r + c) % 2) return null
    return <rect key={i} x={c * 8} y={r * 8} width="8" height="8" className={r % 3 === 0 ? F[b] : F[a]}/>
  })}</>,
  waves: (a, b) => <g strokeWidth="4" {...line}>{Array.from({ length: 7 }, (_, i) => (
    <path key={i} d={`M-4 ${6 + i * 9}q6-6 12 0t12 0 12 0 12 0 12 0 12 0`} className={i % 2 ? S[b] : S[a]}/>))}</g>,
  rings: (a, b) => <>{[30, 24, 18, 12, 6].map((r, i) => (
    <circle key={r} cx="32" cy="32" r={r} className={i % 2 ? FW[a] : (i % 4 ? F[b] : F[a])}/>))}</>,
  sunburst: (a, b) => <>{Array.from({ length: 12 }, (_, i) => (
    <path key={i} d="M32 32L32 -14 47 -12Z" transform={`rotate(${i * 30} 32 32)`} className={i % 2 ? F[b] : F[a]}/>))}
    <circle cx="32" cy="32" r="7" className="fill-paper"/></>,
  zigzag: (a, b) => <g strokeWidth="4" {...line}>{Array.from({ length: 7 }, (_, i) => (
    <path key={i} d={`M-4 ${8 + i * 9}l6-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5`} className={i % 2 ? SI[b] : S[a]}/>))}</g>,
  confetti: (a, b, id) => {
    const rnd = seeded(id)
    return <>{Array.from({ length: 22 }, (_, i) => {
      const x = rnd() * 64, y = rnd() * 64, rot = Math.round(rnd() * 180), k = rnd()
      const cls = [F[a], F[b], FI[a], FI[b]][i % 4]
      return k < 0.5
        ? <circle key={i} cx={x} cy={y} r={2 + rnd() * 2.5} className={cls}/>
        : <rect key={i} x={x - 4} y={y - 1.6} width="8" height="3.2" rx="1.6" transform={`rotate(${rot} ${x} ${y})`} className={cls}/>
    })}</>
  },
  blocks: (a, b, id) => {
    const rnd = seeded(id)
    const pick = [F[a], F[b], FI[a], FW[b], FW[a]]
    return <>{Array.from({ length: 16 }, (_, i) => (
      <rect key={i} x={(i % 4) * 16} y={Math.floor(i / 4) * 16} width="16" height="16"
        className={pick[Math.floor(rnd() * pick.length)]}/>))}</>
  },
}

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'

function draw(c) {
  if (c.kind === 'animal') return { ground: WASH[c.id], body: DRAW[c.id]?.() }
  if (c.kind === 'sym') return { ground: FW[c.hue], body: SYM[c.key]?.(c.hue) }
  if (c.kind === 'face') return { ground: FW[c.hue], body: FACE[c.key]?.(c.hue) }
  if (c.kind === 'emo') return {
    ground: FW[c.hue],
    body: <text x="32" y="35" textAnchor="middle" dominantBaseline="central" fontSize="34"
      style={{ fontFamily: EMOJI_FONT }}>{c.char}</text>,
  }
  const [a, b] = PAIRS[c.pair]
  return { ground: FW[a], body: PAT[c.key]?.(a, b, c.id) }
}

export const AVATARS = CATALOG.filter(c => c.group).map(c => ({ id: c.id, label: c.label, group: c.group }))

export function AvatarArt({ id, className }) {
  const clip = 'av' + React.useId().replace(/[^a-zA-Z0-9]/g, '')
  if (isPhotoAvatar(id)) {
    return <img src={id} alt="" aria-hidden width="160" height="160" loading="lazy" decoding="async"
      className={cn('block shrink-0 rounded-full bg-mist object-cover', className)}/>
  }
  const c = avatarEntry(id)
  if (!c) return null
  if (c.kind === 'char' || c.kind === 'emblem') return <CharacterArt entry={c} className={className}/>
  const { ground, body } = draw(c)
  if (!body) return null
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn('block shrink-0', className)}>
      <defs><clipPath id={clip}><circle cx="32" cy="32" r="32"/></clipPath></defs>
      <circle cx="32" cy="32" r="32" className={ground}/>
      <g clipPath={`url(#${clip})`}>{body}</g>
    </svg>
  )
}

export const ANIMAL_AVATARS = AVATAR_IDS.map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }))
