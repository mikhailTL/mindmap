import React from 'react'
import { cn } from '../lib/utils'
import { AVATAR_IDS } from './store'

/* Twelve premade pictures, drawn here. No photograph, no face, nothing
   licensed: an abstract mark on one of the six hue washes from
   tailwind.config.js. The hues are graphics only; no word is ever set in
   them. Two marks per hue, so a family of three can sit on three hues. */

const HUE = {
  coral: { wash: 'fill-coral-wash', ink: 'fill-coral',  line: 'stroke-coral' },
  lilac: { wash: 'fill-lilac-wash', ink: 'fill-lilac',  line: 'stroke-lilac' },
  sun:   { wash: 'fill-sun-wash',   ink: 'fill-sun',    line: 'stroke-sun' },
  mint:  { wash: 'fill-mint-wash',  ink: 'fill-mint',   line: 'stroke-mint' },
  sky:   { wash: 'fill-sky-wash',   ink: 'fill-sky',    line: 'stroke-sky' },
  blush: { wash: 'fill-blush-wash', ink: 'fill-blush',  line: 'stroke-blush' },
}

/* Each mark is drawn in a 48 box; `ink` fills, `line` strokes at 2.4. */
const MARK = {
  'coral-sun':    (ink, line) => <>
    <circle cx="24" cy="24" r="7" className={ink}/>
    <g className={line} strokeWidth="2.4" strokeLinecap="round" fill="none">
      <path d="M24 9v4M24 35v4M9 24h4M35 24h4M13.4 13.4l2.8 2.8M31.8 31.8l2.8 2.8M13.4 34.6l2.8-2.8M31.8 16.2l2.8-2.8"/>
    </g></>,
  'coral-bolt':   ink => <path d="M27 9L14 27h9l-2 12 13-18h-9z" className={ink}/>,
  'lilac-moon':   ink => <path d="M29 10a14 14 0 1 0 9 23.5A11.5 11.5 0 0 1 29 10z" className={ink}/>,
  'lilac-spiral': (ink, line) => <path d="M24 24c0-3 3-4 5-2s2 6-1 8-8 2-11-2-3-11 2-14 14-4 18 2 4 16-3 20" className={line} strokeWidth="2.6" strokeLinecap="round" fill="none"/>,
  'sun-star':     ink => <path d="M24 8l4.5 10.2L39.5 19l-8.3 7.6 2.3 11L24 32l-9.5 5.6 2.3-11L8.5 19l11-0.8z" className={ink}/>,
  'sun-hill':     ink => <><path d="M6 36c6-14 12-18 18-18s12 4 18 18z" className={ink}/><circle cx="34" cy="13" r="4" className={ink}/></>,
  'mint-leaf':    (ink, line) => <><path d="M38 10C22 10 11 20 10 38c18-1 28-12 28-28z" className={ink}/><path d="M12 36L34 14" className="stroke-mint-wash" strokeWidth="2.4" strokeLinecap="round" fill="none"/></>,
  'mint-sprout':  (ink, line) => <><path d="M24 40V22" className={line} strokeWidth="2.6" strokeLinecap="round" fill="none"/><path d="M24 24c0-8 5-13 13-13 0 8-5 13-13 13zM24 30c0-7-4-11-11-11 0 7 4 11 11 11z" className={ink}/></>,
  'sky-wave':     (ink, line) => <g className={line} strokeWidth="2.6" strokeLinecap="round" fill="none"><path d="M8 19c4 0 4-4 8-4s4 4 8 4 4-4 8-4 4 4 8 4"/><path d="M8 29c4 0 4-4 8-4s4 4 8 4 4-4 8-4 4 4 8 4"/></g>,
  'sky-cloud':    ink => <path d="M15 34a7 7 0 0 1-1-13.9A10 10 0 0 1 33 18a7.5 7.5 0 0 1 1 15z" className={ink}/>,
  'blush-heart':  ink => <path d="M24 38s-13-8-13-18a7 7 0 0 1 13-3.5A7 7 0 0 1 37 20c0 10-13 18-13 18z" className={ink}/>,
  'blush-bloom':  ink => <><circle cx="24" cy="24" r="4.5" className={ink}/><g className={ink}><circle cx="24" cy="12.5" r="5"/><circle cx="34" cy="18" r="5"/><circle cx="34" cy="30" r="5"/><circle cx="24" cy="35.5" r="5"/><circle cx="14" cy="30" r="5"/><circle cx="14" cy="18" r="5"/></g></>,
}

export const AVATARS = AVATAR_IDS.map(id => ({ id, hue: id.split('-')[0], label: id.replace('-', ' ') }))

/* One picture. Decorative: the name beside it carries the meaning. */
export function AvatarArt({ id, className }) {
  const hue = HUE[id?.split('-')[0]]
  const draw = MARK[id]
  if (!hue || !draw) return null
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn('block shrink-0', className)}>
      <circle cx="24" cy="24" r="24" className={hue.wash}/>
      {draw(hue.ink, hue.line)}
    </svg>
  )
}
