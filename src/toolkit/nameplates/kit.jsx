import React from 'react'

/* Drawing pieces shared by the nameplate scenes. Every scene is drawn in a
 * 300 x 120 box pinned to the card's right edge; the sky and the ground run
 * on past its left edge (the svg does not clip), so a wide card never shows
 * a seam. What carries the idea sits between x 140 and x 295, clear of the
 * title on the left. */

/* A soft four point sparkle. */
export const spark = (x, y, s) => {
  const k = s * 0.2
  return `M${x} ${y - s}Q${x + k} ${y - k} ${x + s} ${y}Q${x + k} ${y + k} ${x} ${y + s}` +
         `Q${x - k} ${y + k} ${x - s} ${y}Q${x - k} ${y - k} ${x} ${y - s}Z`
}

/* A rolling wave band, `p` wide per crest, filled down to the bottom. With
   p = 40 it loops seamlessly under the np-drift animation. */
export const wave = (y, a, p = 40, from = -160, to = 400) => {
  let d = `M${from} ${y}`
  for (let x = from; x < to; x += p) d += `q${p / 4} ${-a} ${p / 2} 0t${p / 2} 0`
  return d + `V160H${from}Z`
}

/* A flat bottomed cloud, `s` scaled, its bottom left corner at (x, y). */
export const cloud = (x, y, s = 1) =>
  `M${x} ${y}h${44 * s}a${9 * s} ${9 * s} 0 0 0 ${-6 * s} ${-14 * s}` +
  `a${12 * s} ${12 * s} 0 0 0 ${-20 * s} ${-6 * s}a${10 * s} ${10 * s} 0 0 0 ${-18 * s} ${8 * s}` +
  `a${7 * s} ${7 * s} 0 0 0 0 ${12 * s}z`

/* A heart centred on (0, 0), about 2r wide. */
export const heart = r =>
  `M0 ${r * 0.9}C${-r * 1.1} ${r * 0.25} ${-r * 1.25} ${-r * 0.45} ${-r * 0.8} ${-r * 0.75}` +
  `C${-r * 0.45} ${-r} ${-r * 0.1} ${-r * 0.85} 0 ${-r * 0.5}` +
  `C${r * 0.1} ${-r * 0.85} ${r * 0.45} ${-r} ${r * 0.8} ${-r * 0.75}` +
  `C${r * 1.25} ${-r * 0.45} ${r * 1.1} ${r * 0.25} 0 ${r * 0.9}Z`

/* The sky: starts on the banner's `fade` colour at the left, so the title
   sits in open sky, and warms or lightens toward the right. */
export function Sky({ u, stops }) {
  return (
    <>
      <defs>
        <linearGradient id={u + 'sky'} gradientUnits="userSpaceOnUse" x1="90" y1="0" x2="300" y2="0">
          {stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c}/>)}
        </linearGradient>
      </defs>
      <rect x="-700" y="-40" width="1040" height="200" fill={`url(#${u}sky)`}/>
    </>
  )
}

/* Sparkles in the far layer. They brighten under a pointer. */
export function Sparks({ at, fill = '#ffffff' }) {
  return (
    <g className="np-far">
      {at.map(([x, y, s], i) => <path key={i} className="np-spark" d={spark(x, y, s)} fill={fill}/>)}
    </g>
  )
}

/* A calm Headspace style face: closed eyes, a small smile, pink cheeks. */
export function Face({ x, y, s = 1, ink = '#5a2a10', cheek = '#ff8f6b' }) {
  const p = n => n * s
  return (
    <g>
      <path d={`M${x - p(8)} ${y}q${p(2.5)} ${p(2.5)} ${p(5)} 0M${x + p(3)} ${y}q${p(2.5)} ${p(2.5)} ${p(5)} 0` +
               `M${x - p(3)} ${y + p(6)}q${p(3)} ${p(3)} ${p(6)} 0`}
        fill="none" stroke={ink} strokeWidth={1.7 * s} strokeLinecap="round"/>
      <circle cx={x - p(10)} cy={y + p(4)} r={p(2.6)} fill={cheek} opacity=".55"/>
      <circle cx={x + p(10)} cy={y + p(4)} r={p(2.6)} fill={cheek} opacity=".55"/>
    </g>
  )
}

/* A looping element. `d` is the loop length, `w` its start offset. The
   wrapper carries the position so the loop's transform never overwrites it. */
export function Loop({ at, anim, d = '6s', w, origin, children, className = '', ...rest }) {
  const style = { '--d':d }
  if (w) style['--w'] = w
  if (origin) style.transformOrigin = origin
  const inner = <g className={`np-a np-${anim} ${className}`} style={style} {...rest}>{children}</g>
  return at ? <g transform={`translate(${at[0]} ${at[1]})`}>{inner}</g> : inner
}
