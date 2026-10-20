import React from 'react'
import { cn } from '../../lib/utils'
import { CLOTH, HAIR, SKIN } from './specs.js'

/* The character suite, drawn. Flat vector in the explainer style: a round
 * head, dot eyes, a small smile, one soft shade per surface, head and
 * shoulders facing forward, in a 64 box on the same six washes as the other
 * avatars. Idle motion is a slow blink, a small head bob and a breath, on
 * transform only; it stops under reduced motion and while off screen. */

/* ── colour ─────────────────────────────────────────────────────────────── */

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t)
  .toString(16).padStart(2, '0')).join('')
const dark = (c, t = 0.22) => mix(c, '#1a1020', t)
const lite = (c, t = 0.3) => mix(c, '#ffffff', t)

const EYE = '#2A2030'
const MOUTH = '#6E2A27'

/* ── motion ─────────────────────────────────────────────────────────────── */

const CSS = `
.mmc .mmc-head{transform-box:view-box;transform-origin:32px 47px;animation:mmc-bob 6s ease-in-out infinite}
.mmc .mmc-body{transform-box:view-box;transform-origin:32px 66px;animation:mmc-breathe 6s ease-in-out infinite}
.mmc .mmc-eyes{transform-box:fill-box;transform-origin:center;animation:mmc-blink 5.2s linear infinite}
.mmc .mmc-sway{transform-box:view-box;transform-origin:32px 54px;animation:mmc-sway 7s ease-in-out infinite}
.mmc .mmc-beat{transform-box:fill-box;transform-origin:center;animation:mmc-beat 2.8s ease-in-out infinite}
.mmc .mmc-a{animation-delay:var(--mmc-d,0s)}
.mmc .mmc-eyes{animation-delay:calc(var(--mmc-d,0s) * 1.7)}
.mmc:not([data-play="1"]) .mmc-a{animation-play-state:paused}
@keyframes mmc-bob{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-.7px) rotate(-1.4deg)}68%{transform:translateY(.2px) rotate(1deg)}}
@keyframes mmc-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,1.035)}}
@keyframes mmc-blink{0%,92%,100%{transform:scaleY(1)}94.5%{transform:scaleY(.1)}}
@keyframes mmc-sway{0%,100%{transform:rotate(0)}50%{transform:rotate(1.6deg)}}
@keyframes mmc-beat{0%,60%,100%{transform:scale(1)}75%{transform:scale(1.08)}}
@media (prefers-reduced-motion:reduce){.mmc .mmc-a{animation:none!important}}
`

let styled = false
function useStyles() {
  React.useEffect(() => {
    if (styled || typeof document === 'undefined') return
    styled = true
    const el = document.createElement('style')
    el.setAttribute('data-mmc', '')
    el.textContent = CSS
    document.head.appendChild(el)
  }, [])
}

/* One shared observer: a picture plays only while it is on screen. */
let io = null
function usePlayWhenSeen(ref) {
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    io = io || new IntersectionObserver(entries => {
      for (const e of entries) e.target.setAttribute('data-play', e.isIntersecting ? '1' : '0')
    })
    io.observe(el)
    return () => io.unobserve(el)
  }, [ref])
}

/* A fixed offset per id, so a list of people does not blink in step. */
function offset(id) {
  let h = 7
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  return -((h % 50) / 10)
}

/* ── hair ───────────────────────────────────────────────────────────────── */

/* Behind the head. */
const BACK = {
  long: c => <path fill={c} d="M18.4 27C17.6 15.6 24.4 11.4 32 11.4S46.4 15.6 45.6 27C46 35 47 43 48.4 51C46 54.4 18 54.4 15.6 51C17 43 18 35 18.4 27Z"/>,
  shoulder: c => <path fill={c} d="M18.2 27C17.4 15.6 24.4 11.4 32 11.4S46.6 15.6 45.8 27C46 33 46.6 38.6 47.6 44C44 47.4 20 47.4 16.4 44C17.4 38.6 18 33 18.2 27Z"/>,
  bob: c => <path fill={c} d="M17.8 27C17.2 15.4 24.4 11.4 32 11.4S46.8 15.4 46.2 27L46.8 40.2C46.8 42.8 44.6 43.8 42.6 42.8L21.4 42.8C19.4 43.8 17.2 42.8 17.2 40.2Z"/>,
  ponytail: c => <><path fill={c} d="M41.6 17.4C49.4 16.6 53 25 51.4 35.4C50.4 42 46.6 46 44.4 45C46.8 38.6 46.6 30 40.4 23.6Z"/>
    <circle cx="43.2" cy="19.6" r="2" fill={dark(c, 0.35)}/></>,
  bun: c => <circle cx="32" cy="11.2" r="5.6" fill={c}/>,
  topbun: c => <circle cx="32" cy="9.6" r="6.4" fill={c}/>,
  puff: c => <><circle cx="32" cy="10.4" r="7.2" fill={c}/>
    <path d="M27.8 8.2q1.4-.9 2.7.2M33.6 6.8q1.4-.7 2.5.5M29 12.4q1.3-.7 2.4.4M34.8 11.4q1.3-.6 2.2.5" stroke={lite(c, 0.22)} strokeWidth="1" strokeLinecap="round" fill="none"/></>,
  puffs: c => <><circle cx="18.4" cy="15.6" r="6.6" fill={c}/><circle cx="45.6" cy="15.6" r="6.6" fill={c}/></>,
  braid: c => <g fill={c}>
    {[[22.6, 41], [21.8, 45.6], [21.2, 50.2], [20.8, 54.8]].map(([x, y]) => (
      <ellipse key={y} cx={x} cy={y} rx="3.4" ry="2.9"/>))}
    <path d="M20.4 57.4l-1.4 3.6h3.4z"/></g>,
  curly: c => <g fill={c}>
    {[[19.6, 31, 4.2], [18.8, 24.4, 4.6], [21.6, 17.8, 4.8], [27, 13.6, 5], [33.6, 12.6, 5], [39.8, 14.6, 4.8],
      [44, 19.6, 4.6], [45.4, 26, 4.4], [44.6, 32, 4]].map(([x, y, r]) => <circle key={x + '' + y} cx={x} cy={y} r={r}/>)}</g>,
}

/* In front of the head: the hairline, fringe and part. */
const FRONT = {
  long: c => <path fill={c} d="M19.8 29.4C18.6 18 24.6 12.6 32.4 12.6S45.6 17.4 44.3 29.4C43.2 24.6 41 21.2 37.6 19.6C33.6 23.8 26.6 25.8 19.8 29.4Z"/>,
  shoulder: c => <path fill={c} d="M19.8 29C18.8 17.8 24.6 12.6 32.4 12.6S45.4 17.6 44.3 29C43.6 24.2 41.6 21 38.4 19.8C34.6 22.6 27.4 24.2 19.8 29Z"/>,
  bob: c => <path fill={c} d="M19.8 28C18.8 17.6 24.8 12.8 32 12.8S45.2 17.6 44.2 28C43.2 24.2 41.2 22.2 38.6 21.6C34.2 22.8 29.8 22.8 25.4 21.6C22.8 22.2 20.8 24.2 19.8 28Z"/>,
  ponytail: c => <path fill={c} d="M19.9 27C19.2 17.4 25 13 32 13S44.8 17.4 44.1 27C43.4 22.4 40.6 19.8 36.5 19C33.4 18.4 30.6 18.4 27.5 19C23.4 19.8 20.6 22.4 19.9 27Z"/>,
  bun: c => <path fill={c} d="M19.9 27C19.2 17.4 25 13.2 32 13.2S44.8 17.4 44.1 27C43.2 22.2 40.2 20.4 36.4 19.6C33.4 19 30.6 19 27.6 19.6C23.8 20.4 20.8 22.2 19.9 27Z"/>,
  topbun: c => <path fill={c} d="M19.9 27C19.2 17.4 25 13 32 13S44.8 17.4 44.1 27C43.4 22.4 40.6 19.8 36.5 19C33.4 18.4 30.6 18.4 27.5 19C23.4 19.8 20.6 22.4 19.9 27Z"/>,
  puff: c => <path fill={c} d="M19.9 27.4C19 16.8 25 12.8 32 12.8S45 16.8 44.1 27.4C43.6 22.2 41 19.8 37 19.1C33.6 18.6 30.4 18.6 27 19.1C23 19.8 20.4 22.2 19.9 27.4Z"/>,
  puffs: c => <path fill={c} d="M19.9 27.4C19 16.8 25 12.8 32 12.8S45 16.8 44.1 27.4C43.6 22.2 41 19.8 37 19.1C33.6 18.6 30.4 18.6 27 19.1C23 19.8 20.4 22.2 19.9 27.4Z"/>,
  braid: c => <path fill={c} d="M19.9 28C19 17.4 24.8 12.8 32 12.8S45 17.4 44.1 28C43.4 23 41 20.2 37.4 19.4C33 20.6 26.6 22.4 21.6 26.6C21 33 21.6 38 23.4 40.6L20.2 40.6C19.6 36.6 19.6 32 19.9 28Z"/>,
  short: c => <path fill={c} d="M19.8 27.6C18.8 16.4 25 12.2 32.4 12.2S45.6 16.8 44.2 27.6C43.6 23.4 42.6 21.4 41 20.4C38.6 22.4 35 21.6 33.6 19.8C31 22 26.4 22.4 23.2 20.8C21.6 22.6 20.4 24.8 19.8 27.6Z"/>,
  mop: c => <path fill={c} d="M19.6 28C18 15.6 25 11.6 32.6 11.6S46.4 16.6 44.4 28C43.6 24.6 42.4 22.6 40.6 21.6C40 23.6 38.6 24.6 36.6 24.8C36.8 23.2 36.4 22.2 35.6 21.6C33.4 23.8 29.2 24.6 25.4 24C26.2 22.8 26.4 22 26.2 21.4C23.6 22.4 21 24.6 19.6 28Z"/>,
  side: c => <><path fill={c} d="M19.8 27C19 15.8 25 12 32.4 12S45.6 16 44.2 27C43.8 22.8 42.6 20.4 40.6 19.4C36 18 31 18.4 27.6 19.8C25.4 18.6 23.2 19 22 20.4C20.8 22.2 20.2 24.4 19.8 27Z"/>
    <path d="M27.4 13.8C27 15.8 27.2 17.8 27.8 19.4" stroke={dark(c, 0.4)} strokeWidth=".8" strokeLinecap="round" fill="none"/></>,
  buzz: c => <path fill={c} d="M20.1 25.6C20.4 16.6 25.8 13.4 32 13.4S43.6 16.6 43.9 25.6C43 21 41 19.4 38.8 18.9L25.2 18.9C23 19.4 21 21 20.1 25.6Z"/>,
  pixie: c => <path fill={c} d="M19.8 28C18.6 16.6 24.8 12.4 32.4 12.4S45.4 16.8 44.2 28C43.4 23.8 41.8 21.4 39.6 20.6C35.6 23.6 29.4 24.4 23.6 22.8C21.8 24.2 20.6 25.8 19.8 28Z"/>,
  coily: c => <><path fill={c} d="M19.2 27C17.8 14 24.2 10.4 32 10.4S46.2 14 44.8 27C44.2 22.6 43 20.4 41 19.6L23 19.6C21 20.4 19.8 22.6 19.2 27Z"/>
    <g fill={lite(c, 0.16)}>{[[24, 14.6], [28.4, 12.6], [33.6, 12.4], [38.6, 13.6], [42, 17], [26, 17.6], [31, 15.8], [36.2, 16.4], [22, 18.4]].map(([x, y]) => (
      <circle key={x} cx={x} cy={y} r=".7"/>))}</g></>,
  twists: c => <><path fill={c} d="M19.6 27C18.6 15.4 24.6 12 32 12S45.4 15.4 44.4 27C43.8 22.6 42.6 20.6 40.8 19.8L23.2 19.8C21.4 20.6 20.2 22.6 19.6 27Z"/>
    <g fill={c}>{[[22.4, 13.6, -24], [26.2, 10.6, -12], [30.4, 9.4, -4], [34.8, 9.6, 6], [38.8, 11, 14], [42.2, 14, 26]].map(([x, y, r]) => (
      <rect key={x} x={x - 1.9} y={y - 3.4} width="3.8" height="7" rx="1.9" transform={`rotate(${r} ${x} ${y})`}/>))}</g></>,
  curly: c => <g fill={c}>
    {[[20.6, 24.8, 3.6], [23.4, 20, 4], [28, 17.4, 4.2], [33.4, 17, 4.2], [38.4, 18.6, 4], [42.6, 22.4, 3.8], [44, 27.2, 3]].map(([x, y, r]) => (
      <circle key={x} cx={x} cy={y} r={r}/>))}
    <path d="M20 22C20 15 25.6 12 32 12S44 15 44 22Z"/></g>,
}

/* Locks that fall in front of the shoulders. */
const LOCKS = {
  long: c => <path fill={c} d="M19.8 27C18.4 36 18 44 16.8 52.4C18.8 54.2 22 54 23.6 52.4C22.6 45 22 37.6 22.6 31ZM44.2 27C45.6 36 46 44 47.2 52.4C45.2 54.2 42 54 40.4 52.4C41.4 45 42 37.6 41.4 31Z"/>,
  shoulder: c => <path fill={c} d="M19.8 27C18.6 34 18.4 40 17.6 46C19.4 47.8 22.4 47.6 23.8 46.2C22.8 41 22.4 36 22.8 31ZM44.2 27C45.4 34 45.6 40 46.4 46C44.6 47.8 41.6 47.6 40.2 46.2C41.2 41 41.6 36 41.2 31Z"/>,
}

/* Hair drawn in front of the shoulders rather than behind them. */
const OVER = { braid: 1 }

/* A soft light line across the crown, where the hair catches the light. */
const SHINE = { long: 1, shoulder: 1, bob: 1, ponytail: 1, bun: 1, topbun: 1, puff: 1, puffs: 1, braid: 1, short: 1, mop: 1, side: 1, pixie: 1 }

/* ── tops ───────────────────────────────────────────────────────────────── */

const TORSO = {
  t: 'M9 66C9 54 16 48.4 25.6 47L38.4 47C48 48.4 55 54 55 66Z',
  a: 'M6.6 66C6.6 53 15 47.6 25 46.4L39 46.4C49 47.6 57.4 53 57.4 66Z',
}

/* Each top draws over the torso. `s` is the skin tone, `i` an inner colour. */
const TOP = {
  tee: (c, s) => <>
    <path fill={s} d="M27 46.6C27.4 51.6 36.6 51.6 37 46.6Z"/>
    <path d="M26.6 46.8C27.4 52.4 36.6 52.4 37.4 46.8" stroke={dark(c, 0.2)} strokeWidth="1.3" fill="none" strokeLinecap="round"/></>,
  hoodie: (c, s) => <>
    <path fill={dark(c, 0.16)} d="M22.6 47.2C23.4 54.4 40.6 54.4 41.4 47.2L37.4 46.8C36.8 51 27.2 51 26.6 46.8Z"/>
    <path fill={s} d="M27 46.8C27.6 50.4 36.4 50.4 37 46.8Z"/>
    <path d="M29.4 51.6v6.6M34.6 51.6v6.6" stroke={lite(c, 0.62)} strokeWidth="1.1" strokeLinecap="round"/>
    <circle cx="29.4" cy="58.6" r=".9" fill={lite(c, 0.62)}/><circle cx="34.6" cy="58.6" r=".9" fill={lite(c, 0.62)}/></>,
  sweater: (c, s) => <>
    <path fill={s} d="M27 46.6L32 54L37 46.6Z"/>
    <path d="M26.4 46.6L32 54.8L37.6 46.6" stroke={dark(c, 0.2)} strokeWidth="1.4" fill="none" strokeLinejoin="round"/></>,
  jacket: (c, s) => <>
    <path fill={CLOTH.white} d="M26.6 46.6L28.6 66L35.4 66L37.4 46.6C35.6 50.6 28.4 50.6 26.6 46.6Z"/>
    <path fill={s} d="M27.6 46.6C28.4 49.4 35.6 49.4 36.4 46.6Z"/>
    <path fill={dark(c, 0.18)} d="M25.4 47.2L29.6 56L27.4 66L22 66L23.6 52.4L21.4 48.6Z"/>
    <path fill={dark(c, 0.18)} d="M38.6 47.2L34.4 56L36.6 66L42 66L40.4 52.4L42.6 48.6Z"/></>,
  cardigan: (c, s, i) => <>
    <path fill={i || CLOTH.cream} d="M26.6 46.4L28.4 66L35.6 66L37.4 46.4C35.6 50.4 28.4 50.4 26.6 46.4Z"/>
    <path fill={s} d="M27.4 46.4C28.2 49.4 35.8 49.4 36.6 46.4Z"/>
    <path d="M27.4 50.4L29.8 66M36.6 50.4L34.2 66" stroke={dark(c, 0.22)} strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="28.8" cy="57.4" r=".75" fill={dark(c, 0.35)}/><circle cx="29.6" cy="62" r=".75" fill={dark(c, 0.35)}/></>,
  collar: (c, s) => <>
    <path fill={s} d="M28.2 46.4L32 51.6L35.8 46.4Z"/>
    <path fill={lite(c, 0.18)} d="M26.4 45.8L32 51.6L28.6 54L25.2 48Z"/>
    <path fill={lite(c, 0.18)} d="M37.6 45.8L32 51.6L35.4 54L38.8 48Z"/>
    <path d="M32 52v14" stroke={dark(c, 0.18)} strokeWidth=".9"/>
    <circle cx="32" cy="56.4" r=".7" fill={dark(c, 0.3)}/><circle cx="32" cy="61" r=".7" fill={dark(c, 0.3)}/></>,
  blazer: (c, s, i) => {
    const shirt = i || CLOTH.white
    return <>
      <path fill={shirt} d="M26 46.4L32 61L38 46.4Z"/>
      <path fill={s} d="M28.4 46.4L32 50.6L35.6 46.4Z"/>
      <path fill={dark(shirt, 0.08)} d="M26.6 45.6L32 51L29.4 53.8L25.6 47.8Z"/>
      <path fill={dark(shirt, 0.08)} d="M37.4 45.6L32 51L34.6 53.8L38.4 47.8Z"/>
      <path fill={dark(c, 0.28)} d="M24.8 46.8L32 62.6L28.4 56.2L26 56.8L22.6 48.6Z"/>
      <path fill={dark(c, 0.28)} d="M39.2 46.8L32 62.6L35.6 56.2L38 56.8L41.4 48.6Z"/></>
  },
}

/* ── the person ─────────────────────────────────────────────────────────── */

const SCENE = {
  /* A small tree behind the right shoulder. */
  tree: () => <g className="mmc-a mmc-sway">
    <path d="M51 47.6C51.2 43 51 39.6 50.4 36.6L53.4 36.6C52.8 39.6 52.6 43 52.8 47.6Z" fill="#8A5A2E"/>
    <circle cx="47.6" cy="31.6" r="5.4" fill="#2FA97C"/><circle cx="55.6" cy="31" r="5" fill="#2FA97C"/>
    <circle cx="51.6" cy="25.4" r="6.4" fill="#3DBB8B"/>
    <circle cx="49.6" cy="23.6" r="1.6" fill="#7FD9B4"/>
  </g>,
  /* A speech bubble with a heart, over the right shoulder. */
  bubble: () => <g>
    <path d="M44.4 14.6h12a4.4 4.4 0 0 1 4.4 4.4v6.6a4.4 4.4 0 0 1-4.4 4.4h-6.6l-4 3.4v-3.4h-1.4a4.4 4.4 0 0 1-4.4-4.4V19a4.4 4.4 0 0 1 4.4-4.4z" fill="#FFFFFF"/>
    <path className="mmc-a mmc-beat" d="M50.4 27.2c-3.6-2.4-3.8-5.4-2-6.1 1-.4 1.7.2 2 .9.3-.7 1-1.3 2-.9 1.8.7 1.6 3.7-2 6.1z" fill="#E9689F"/>
  </g>,
}

function Person({ p }) {
  const [skin, shade] = SKIN[p.skin] || SKIN.s3
  const hair = HAIR[p.hc] || HAIR.brown
  const top = CLOTH[p.tc] || CLOTH.sky
  const inner = p.inner ? CLOTH[p.inner] : null
  const x = p.x || ''
  const teen = p.age === 't'
  const brow = p.hc === 'blonde' || p.hc === 'honey' || p.hc === 'ash' ? dark(hair, 0.4) : dark(hair, 0.15)
  const er = teen ? [1.65, 2.05] : [1.5, 1.9]
  return <>
    {p.scene && SCENE[p.scene]?.()}
    {!OVER[p.hair] && BACK[p.hair] && <g className="mmc-a mmc-head">{BACK[p.hair](hair)}</g>}

    <g className="mmc-a mmc-body">
      <rect x="27" y="34" width="10" height="15" rx="4" fill={skin}/>
      <path d="M27 38.4C29.6 41.8 34.4 41.8 37 38.4L37 42.4C34.4 44.8 29.6 44.8 27 42.4Z" fill={shade}/>
      <path d={TORSO[p.age]} fill={top}/>
      <path d={teen ? 'M45 48.6C51 51.2 55 56 55 66L48.6 66C48.6 58 47.4 52.4 45 48.6Z' : 'M46 48C53 50.8 57.4 55.6 57.4 66L50 66C50 58 48.6 52 46 48Z'}
        fill="#000" opacity=".08"/>
      {TOP[p.top]?.(top, skin, inner)}
      {x.includes('l') && <>
        <path d="M27.6 47.4L30.6 60M36.4 47.4L33.4 60" stroke="#1D8FB0" strokeWidth="1.1" strokeLinecap="round"/>
        <rect x="29" y="59" width="6" height="4.6" rx="1" fill="#FFFFFF" stroke="#1D8FB0" strokeWidth=".8"/>
        <path d="M30.4 61.4h3.2" stroke="#1D8FB0" strokeWidth=".8" strokeLinecap="round"/></>}
      {x.includes('n') && <>
        <path d="M28.2 47C29.4 51.4 34.6 51.4 35.8 47" stroke="#E4B04A" strokeWidth=".8" fill="none"/>
        <circle cx="32" cy="50.6" r="1" fill="#E4B04A"/></>}
    </g>

    <g className="mmc-a mmc-head">
      {OVER[p.hair] && BACK[p.hair]?.(hair)}
      {LOCKS[p.hair]?.(hair)}
      <circle cx="20.2" cy="29.6" r="2.7" fill={skin}/><circle cx="43.8" cy="29.6" r="2.7" fill={skin}/>
      <circle cx="20.4" cy="29.8" r="1.2" fill={shade}/><circle cx="43.6" cy="29.8" r="1.2" fill={shade}/>
      <path d="M20 27C20 18.6 25.4 14.6 32 14.6S44 18.6 44 27C44 35.6 38.8 41.4 32 41.4S20 35.6 20 27Z" fill={skin}/>
      <path d="M38.2 16.2C41.8 18.4 44 22.4 44 27C44 34.8 39.6 40.4 33.8 41.2C38.4 38 40.8 33.2 40.8 27.2C40.8 22.6 39.8 19 38.2 16.2Z"
        fill={shade} opacity=".45"/>
      {x.includes('e') && <><circle cx="20.4" cy="33.6" r="1" fill="#E4B04A"/><circle cx="43.6" cy="33.6" r="1" fill="#E4B04A"/></>}
      {x.includes('b') && <path fill={hair} d="M20.4 30.6C20.6 37.6 25.6 42.4 32 42.4S43.4 37.6 43.6 30.6C42.2 34.4 39.6 36.4 36.4 36.6C34.6 35.2 29.4 35.2 27.6 36.6C24.4 36.4 21.8 34.4 20.4 30.6Z"/>}

      <ellipse cx="25.6" cy="33.4" rx="2.3" ry="1.35" fill="#F0626A" opacity=".24"/>
      <ellipse cx="38.4" cy="33.4" rx="2.3" ry="1.35" fill="#F0626A" opacity=".24"/>
      {x.includes('f') && <g fill={shade}>
        <circle cx="24.6" cy="31.8" r=".45"/><circle cx="26.2" cy="32.4" r=".45"/><circle cx="25.2" cy="33.4" r=".45"/>
        <circle cx="39.4" cy="31.8" r=".45"/><circle cx="37.8" cy="32.4" r=".45"/><circle cx="38.8" cy="33.4" r=".45"/></g>}

      <g className="mmc-a mmc-eyes">
        <ellipse cx="27.4" cy="28.6" rx={er[0]} ry={er[1]} fill={EYE}/>
        <ellipse cx="36.6" cy="28.6" rx={er[0]} ry={er[1]} fill={EYE}/>
        <circle cx="28" cy="27.8" r=".6" fill="#fff"/><circle cx="37.2" cy="27.8" r=".6" fill="#fff"/>
        {x.includes('w') && <path d="M25.6 27.4l-1-.7M38.4 27.4l1-.7" stroke={EYE} strokeWidth=".8" strokeLinecap="round"/>}
      </g>
      <path d="M24.8 24.6q2.6-1.5 5.2-.3M34 24.3q2.6-1.2 5.2.3" stroke={brow} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
      <path d="M30.9 32.6q1.1.9 2.2 0" stroke={shade} strokeWidth="1.1" strokeLinecap="round" fill="none"/>
      {teen
        ? <path d="M28.8 35.2q3.2 3.8 6.4 0z" fill={MOUTH} stroke={MOUTH} strokeWidth=".6" strokeLinejoin="round"/>
        : <path d="M29.2 35.6q2.8 2.4 5.6 0" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" fill="none"/>}

      {x.includes('g') && <g stroke="#33333F" strokeWidth=".9" fill="#fff" fillOpacity=".18">
        <rect x="23.4" y="25.6" width="7.4" height="6" rx="2.6"/><rect x="33.2" y="25.6" width="7.4" height="6" rx="2.6"/>
        <path d="M30.8 28h2.4" fill="none"/></g>}

      {FRONT[p.hair]?.(hair)}
      {SHINE[p.hair] && <path d="M24.6 16.6C27.6 14.6 31.4 14 35 14.6" stroke={lite(hair, 0.3)} strokeWidth="1.3"
        strokeLinecap="round" fill="none" opacity=".55"/>}
    </g>
  </>
}

/* ── the signs ──────────────────────────────────────────────────────────── */

const EMBLEM = {
  tree: () => <>
    <ellipse cx="32" cy="54.4" rx="15" ry="3.6" fill="#18A370" opacity=".28"/>
    <path d="M29.6 54C30.2 46 30 40.6 29 36L35 36C34 40.6 33.8 46 34.4 54Z" fill="#8A5A2E"/>
    <path d="M32 43.6l-5-4.4M32.4 41.4l4.6-3.6" stroke="#8A5A2E" strokeWidth="2" strokeLinecap="round"/>
    <g className="mmc-a mmc-sway">
      <circle cx="23" cy="31" r="9" fill="#2FA97C"/><circle cx="41" cy="31" r="9" fill="#2FA97C"/>
      <circle cx="32" cy="21.6" r="11.4" fill="#3DBB8B"/><circle cx="32" cy="32.4" r="8.4" fill="#2FA97C"/>
      <circle cx="27.4" cy="17.6" r="3.2" fill="#7FD9B4" opacity=".7"/>
      <circle cx="24.4" cy="30.4" r="2" fill="#F0764E"/><circle cx="39.6" cy="27" r="2" fill="#F0764E"/>
      <circle cx="33.6" cy="34.6" r="2" fill="#F0764E"/>
    </g>
  </>,
  care: () => <>
    <path d="M18 13h28a8 8 0 0 1 8 8v14.6a8 8 0 0 1-8 8H31.4l-9.4 8v-8H18a8 8 0 0 1-8-8V21a8 8 0 0 1 8-8z" fill="#FFFFFF"/>
    <path d="M18 13h28a8 8 0 0 1 8 8v14.6a8 8 0 0 1-8 8H31.4l-9.4 8v-8H18a8 8 0 0 1-8-8V21a8 8 0 0 1 8-8z" fill="none" stroke="#2294E6" strokeWidth="2.4" strokeLinejoin="round"/>
    <path className="mmc-a mmc-beat" d="M32 39.4C23.4 33.6 22.8 26.4 27.2 25c2.4-.8 4.2.6 4.8 2.2.6-1.6 2.4-3 4.8-2.2 4.4 1.4 3.8 8.6-4.8 14.4z" fill="#E9689F"/>
  </>,
}

/* ── the picture ────────────────────────────────────────────────────────── */

const WASH = {
  coral: 'fill-coral-wash', sun: 'fill-sun-wash', mint: 'fill-mint-wash',
  sky: 'fill-sky-wash', lilac: 'fill-lilac-wash', blush: 'fill-blush-wash',
}

/** CharacterArt({ entry, className }): one character or sign from the
    catalog (kind 'char' or 'emblem'), in a circle on its wash. */
export function CharacterArt({ entry, className }) {
  useStyles()
  const ref = React.useRef(null)
  usePlayWhenSeen(ref)
  const clip = 'mc' + React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const body = entry.kind === 'emblem' ? EMBLEM[entry.key]?.() : <Person p={entry}/>
  return (
    <svg ref={ref} viewBox="0 0 64 64" aria-hidden data-play="0" className={cn('mmc block shrink-0', className)}
      style={{ '--mmc-d': offset(entry.id) + 's' }}>
      <defs><clipPath id={clip}><circle cx="32" cy="32" r="32"/></clipPath></defs>
      <circle cx="32" cy="32" r="32" className={WASH[entry.bg] || WASH.sky}/>
      <g clipPath={`url(#${clip})`}>{body}</g>
    </svg>
  )
}
