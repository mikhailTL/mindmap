import React from 'react'
import { SignalTrace } from './infographics'
import { cn } from '../lib/utils'

/* The rear camera, taken apart, because the sentence never worked.
 *
 * "A fingertip over the rear camera turns the phone into the same kind of
 * sensor the patch carries" was the whole explanation, and it asked a reader
 * to picture a thing they have never seen. The review's note was blunt: the
 * page needs a picture, an exploded one, the way the patch page has one. So
 * the stack is drawn instead of described, and photoplethysmography is
 * something a judge can read off the drawing without being told the word.
 *
 * Isometric, so the plates read as solid. A plan square of side S projects to
 * a rhombus of half-width S·cos30 and half-height S·sin30, which is why every
 * plate here is W across and W·0.577 tall, and why a circle on one becomes an
 * ellipse at the same ratio. Getting that ratio wrong is what makes a drawing
 * look like clip art rather than a section view.
 */

/* Palette by hand, not by class: these are SVG paint attributes and Tailwind
   tokens do not reach them. Values are tailwind.config.js, unchanged. */
const INK = '#0d2b1e', INK2 = '#2a5744', INK3 = '#47705e'
const RULE = '#c2d7ca', RULING = '#93b2a1', MIST = '#e3ede7'
const CARD = '#ffffff', ACCENT = '#157446', WASH = '#dcefe4'
const BEAM = '#0e9c9c', BEAMWASH = '#d9f0ef'
const BLOOD = '#e11919'                 // the heart signal's own colour, sitewide

const W = 56, H = 32, T = 7             // plate half-width, half-height, thickness
const CX = 250                          // the stack's centre line
const ISO = 0.5774                      // sin30 / cos30: the one ratio the drawing obeys

/* Top face, plus the two side faces that give a plate its thickness. Drawn
   sides-first so the top's own edges close the shape. */
function Plate({ cx = CX, cy, top, side, w = W, h = H, t = T, children }) {
  return (
    <g>
      <path d={`M${cx - w},${cy} L${cx},${cy + h} L${cx},${cy + h + t} L${cx - w},${cy + t} Z`}
        fill={side} stroke={INK} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d={`M${cx},${cy + h} L${cx + w},${cy} L${cx + w},${cy + t} L${cx},${cy + h + t} Z`}
        fill={side} stroke={INK} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d={`M${cx},${cy - h} L${cx + w},${cy} L${cx},${cy + h} L${cx - w},${cy} Z`}
        fill={top} stroke={INK} strokeWidth="1.5" strokeLinejoin="round"/>
      {children}
    </g>
  )
}

/* A plan circle on a plate. rx = 1.2247·R, ry = 0.7071·R, so an inscribed
   circle lands at 0.707 of the plate's half-width. */
function Hole({ cy, r, ...p }) {
  return <ellipse cx={CX} cy={cy} rx={r} ry={r * ISO} {...p}/>
}

/* The grid on the sensor's face, drawn along the two plate edges rather than
   square to the page: a square grid on an isometric face is the giveaway
   that the projection was faked. */
function SensorGrid({ cy, n = 6 }) {
  const lines = []
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const L = [CX - W, cy], TOP = [CX, cy - H], R = [CX + W, cy], B = [CX, cy + H]
  for (let i = 1; i < n; i++) {
    const t = i / n
    const a = lerp(L, TOP, t), b = lerp(B, R, t)
    const c = lerp(L, B, t), d = lerp(TOP, R, t)
    lines.push(<line key={`a${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}/>)
    lines.push(<line key={`b${i}`} x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]}/>)
  }
  return <g stroke={RULING} strokeWidth="0.9" opacity="0.7">{lines}</g>
}

function Badge({ x, y, n }) {
  return (
    <g>
      <circle cx={x} cy={y} r="13" fill={CARD} stroke={INK} strokeWidth="1.5"/>
      <text x={x} y={y + 5.5} textAnchor="middle" fill={INK}
        fontFamily="Chivo Mono, monospace" fontSize="15">{n}</text>
    </g>
  )
}

/* Every part, once, so the drawing and the list under it can never disagree. */
export const CAMERA_PARTS = [
  { n:1, t:'LED flash',       s:'Shines into your finger.' },
  { n:2, t:'Your fingertip',  s:'Blood passes through it.' },
  { n:3, t:'Cover glass',     s:'The window you touch.' },
  { n:4, t:'Lens',            s:'Focuses the light.' },
  { n:5, t:'Infrared filter', s:'Blocks light you cannot see.' },
  { n:6, t:'Image sensor',    s:'Turns the light into a number.' },
]

const ROWS = { 2:100, 3:200, 4:300, 5:400, 6:500 }   // label rows, by part number

/* The fingertip, once, because the shape and the clip that masks the vessels
   to it have to be the same path or the blood runs outside the skin. It is cut
   off above the frame on purpose: a finger that starts at the top edge has
   somewhere to come from. */
const FINGER = 'M202,100 C198,62 206,28 224,-14 L302,-14 C309,30 306,70 300,100 Z'
const FLASH = { cx:96, cy:200, w:36, h:21, t:6 }

/* The stack itself, in its own coordinates, so the wide drawing and the narrow
   one are the same picture and not two that drift apart. */
function Stack({ p }) {
  return (
    <g>
      {/* the exploded-view guide: where the left corners would meet if the
          layers were closed up. Convention, and it is what says "one part". */}
      <line x1={CX - W} y1={190} x2={CX - W} y2={508} stroke={RULING}
        strokeWidth="1" strokeDasharray="2 5"/>

      {/* 1 · the flash, and the light leaving it */}
      <Plate {...FLASH} top={WASH} side={MIST}/>
      <Hole cy={FLASH.cy} r={13} fill={ACCENT} opacity="0.9"/>
      <path d={`M${FLASH.cx},${FLASH.cy - FLASH.h - 4} C 100,134 128,76 192,48`}
        fill="none" stroke={BEAMWASH} strokeWidth="11" strokeLinecap="round"/>
      <path d={`M${FLASH.cx},${FLASH.cy - FLASH.h - 4} C 100,136 132,82 188,60`}
        fill="none" stroke={BEAM} strokeWidth="2.6" strokeLinecap="round"
        markerEnd={`url(#${p}-tip)`} className={`${p}-ray`}/>

      {/* 2 · the finger. The contact ellipse is drawn over the body on purpose:
          the patch of skin actually touching the glass is the thing a reader
          has to locate, and an outline finds it faster than a caption. */}
      <path d={FINGER} fill={MIST} stroke={INK} strokeWidth="1.5" strokeLinejoin="round"/>
      <g clipPath={`url(#${p}-finger)`}>
        <path d="M226,-10 C232,24 238,58 236,98" fill="none" stroke={BLOOD}
          strokeWidth="2.2" strokeLinecap="round" opacity="0.5" className={`${p}-vein`}/>
        <path d="M278,-10 C273,22 279,60 283,98" fill="none" stroke={BLOOD}
          strokeWidth="1.8" strokeLinecap="round" opacity="0.5" className={`${p}-vein`}/>
        {/* the light, inside the tissue, crossing both vessels */}
        <path d="M198,50 C222,58 248,64 268,70" fill="none" stroke={BEAMWASH} strokeWidth="9" strokeLinecap="round"/>
        <path d="M198,50 C222,58 248,64 268,70" fill="none" stroke={BEAM}
          strokeWidth="2.4" strokeLinecap="round" className={`${p}-ray`}/>
      </g>
      <ellipse cx={CX} cy="100" rx="50" ry="28" fill={WASH} stroke={INK} strokeWidth="1.5"/>

      {/* the light that made it back out, heading for the glass */}
      <path d="M266,122 L254,164" fill="none" stroke={BEAMWASH} strokeWidth="10" strokeLinecap="round"/>
      <path d="M266,122 L254,164" fill="none" stroke={BEAM} strokeWidth="2.6" strokeLinecap="round"
        markerEnd={`url(#${p}-tip)`} className={`${p}-ray`}/>

      {/* 3 · cover glass */}
      <Plate cy={200} top={BEAMWASH} side={RULE}/>
      <Hole cy={200} r={38} fill="none" stroke={RULING} strokeWidth="1.1"/>

      {/* 4 · lens barrel, as the concentric elements it is */}
      <Plate cy={300} top={MIST} side={RULE}/>
      <Hole cy={300} r={40} fill={CARD} stroke={INK2} strokeWidth="1.2"/>
      <Hole cy={300} r={29} fill={WASH} stroke={INK2} strokeWidth="1.1"/>
      <Hole cy={300} r={17} fill={CARD} stroke={INK2} strokeWidth="1.1"/>

      {/* 5 · infrared filter */}
      <Plate cy={400} top={WASH} side={RULE}/>
      <Hole cy={400} r={38} fill="none" stroke={ACCENT} strokeWidth="1.2" strokeDasharray="4 4"/>

      {/* 6 · image sensor */}
      <Plate cy={500} top={INK} side={INK2}/>
      <SensorGrid cy={500}/>

      {/* the ray, in the gaps between the plates, because that is the only
          place it can be seen once the layers are solid */}
      <g stroke={BEAM} strokeWidth="2.4" strokeLinecap="round" className={`${p}-ray`}>
        <line x1={CX} y1="239" x2={CX} y2="264"/>
        <line x1={CX} y1="339" x2={CX} y2="364"/>
        <line x1={CX} y1="439" x2={CX} y2="464" markerEnd={`url(#${p}-tip)`}/>
      </g>

      <Badge x={FLASH.cx - FLASH.w} y={FLASH.cy} n={1}/>
      {[2, 3, 4, 5, 6].map(n => <Badge key={n} x={CX + W + 8} y={ROWS[n]} n={n}/>)}
    </g>
  )
}

function Defs({ p }) {
  return (
    <defs>
      <marker id={`${p}-tip`} viewBox="0 0 10 10" refX="8" refY="5"
        markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 1 L9 5 L0 9 Z" fill={BEAM}/>
      </marker>
      <clipPath id={`${p}-finger`}>
        <path d={FINGER}/>
      </clipPath>
    </defs>
  )
}

/* Media query as state, because two things on this page need the real answer
   and not a guess: which version of this drawing to mount, and how big a phone
   mockup can be before it runs off a 390px screen. A CSS-only answer would
   have meant shipping both drawings and hiding one, which is a second copy of
   a 200-line SVG in every payload. */
export function useNarrow(q = '(max-width: 767px)') {
  const [v, setV] = React.useState(
    () => typeof matchMedia === 'function' ? matchMedia(q).matches : false)
  React.useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const m = matchMedia(q)
    const on = () => setV(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [q])
  return v
}

export function CameraModule({ className }) {
  const raw = React.useId()
  const p = `mmc${raw.replace(/[^a-zA-Z0-9]/g, '')}`   // useId returns colons; CSS will not take them
  const narrow = useNarrow()
  return (
    <figure className={cn('m-0', className)}>
      <svg
        viewBox={narrow ? '0 0 344 556' : '0 0 700 556'}
        className="block w-full"
        role="img"
        aria-label="An exploded view of a phone's rear camera. Light from the LED flash
          passes through a fingertip, then down through the cover glass, the lens, the
          infrared filter and onto the image sensor.">
        {/* The animation lives in the drawing rather than in input.css because
            the class names are namespaced per instance; two of these on one
            page must not share a keyframe name. */}
        <style>{`
          @keyframes ${p}-flow { to { stroke-dashoffset: -34 } }
          @keyframes ${p}-beat { 0%,100% { opacity:.34 } 42% { opacity:.95 } }
          .${p}-ray  { stroke-dasharray: 9 8; animation: ${p}-flow 1.15s linear infinite; }
          .${p}-vein { animation: ${p}-beat 1.15s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .${p}-ray { stroke-dasharray: none; animation: none }
            .${p}-vein { animation: none; opacity: .7 }
          }
        `}</style>
        <Defs p={p}/>
        <g transform="translate(0,8)"><Stack p={p}/></g>

        {!narrow && (
          <g transform="translate(0,8)">
            {CAMERA_PARTS.filter(x => x.n > 1).map(x => (
              <g key={x.n}>
                <line x1={CX + W + 24} y1={ROWS[x.n]} x2="404" y2={ROWS[x.n]}
                  stroke={RULING} strokeWidth="1.2"/>
                <text x="416" y={ROWS[x.n] - 2} fill={INK}
                  fontFamily="Quicksand, sans-serif" fontWeight="700" fontSize="21">{x.t}</text>
                <text x="416" y={ROWS[x.n] + 20} fill={INK2}
                  fontFamily="Chivo, sans-serif" fontSize="16">{x.s}</text>
              </g>
            ))}
            <text x={FLASH.cx} y="256" textAnchor="middle" fill={INK}
              fontFamily="Quicksand, sans-serif" fontWeight="700" fontSize="21">LED flash</text>
            <text x={FLASH.cx} y="277" textAnchor="middle" fill={INK2}
              fontFamily="Chivo, sans-serif" fontSize="15">Shines into your finger.</text>
          </g>
        )}
      </svg>

      {/* The list is the narrow screen's labels. At 390px a 16px label inside a
          760-unit viewBox renders at eight pixels, which is a label nobody can
          read, so the numbers stay on the drawing and the words come out. */}
      {narrow && (
        <ol className="mt-6 m-0 grid list-none grid-cols-1 gap-x-5 gap-y-3 p-0 sm:grid-cols-2">
          {CAMERA_PARTS.map(x => (
            <li key={x.n} className="grid grid-cols-[1.6rem_1fr] items-baseline gap-x-2">
              <span className="font-mono text-fine tabular-nums text-ink-3">{x.n}</span>
              <span>
                <b className="font-display text-ui font-bold text-ink">{x.t}</b>
                <span className="block text-fine text-ink-2">{x.s}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <figcaption className="mt-7 flex flex-col gap-4 border-t border-rule pt-5
        sm:flex-row sm:items-center sm:gap-7">
        <p className="m-0 max-w-[46ch] text-sec leading-[1.5] text-ink-2">
          Blood absorbs light. Each beat lets less through, so the sensor darkens
          once per beat. Those dips are your pulse.
        </p>
        <svg viewBox="0 0 220 44" aria-hidden className="h-11 w-full shrink-0 sm:w-[220px]">
          <path d="M0 14 L22 14 L30 30 L38 14 L60 14 L82 14 L90 30 L98 14 L120 14
                   L142 14 L150 30 L158 14 L180 14 L202 14 L210 30 L218 14"
            fill="none" stroke={BEAM} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="0" y="42" fill={INK3} fontFamily="Chivo, sans-serif" fontSize="11">one dip, one beat</text>
        </svg>
      </figcaption>
    </figure>
  )
}

/* ── What the phone gets, and what it does not ─────────────────────────────
 * This replaces a sentence. "No skin temperature, no sweat" was printed under
 * one of the two route cards and the review called it out by name: a reader
 * comparing two things should be looking at the comparison, not parsing a
 * clause. Four signals, two lit and two not, is the same fact in one glance.
 */
const COVERAGE = [
  { id:'heart', name:'Heart rate',  on:true,  note:'From the camera.' },
  { id:'move',  name:'Movement',    on:true,  note:'From the phone.' },
  { id:'sweat', name:'Sweat',       on:false, note:'Patch only.' },
  { id:'temp',  name:'Skin temperature', on:false, note:'Patch only.' },
]

export function SignalCoverage({ className }) {
  return (
    <ul className={cn('m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-4 lg:gap-4', className)}>
      {COVERAGE.map(s => (
        <li key={s.id}
          className={cn('rounded-panel border p-4',
            s.on ? 'border-rule bg-card' : 'border-dashed border-ruling bg-transparent')}>
          <div className={cn(!s.on && 'opacity-45')}>
            <SignalTrace kind={s.id}/>
          </div>
          <p className={cn('mt-2 font-display text-ui font-bold',
            s.on ? 'text-ink' : 'text-ink-3')}>{s.name}</p>
          <p className={cn('mt-0.5 text-fine', s.on ? 'text-accent' : 'text-ink-3')}>{s.note}</p>
        </li>
      ))}
    </ul>
  )
}

/* ── Screens for the four-step guide ──────────────────────────────────────
 * These are drawn at real device points and scaled by the phone frame around
 * them, the same contract PhoneApp works to. A screenshot would have been
 * faster and would be wrong the first time the app changed.
 */
const F_TITLE = { margin:0, fontFamily:'Quicksand, sans-serif', fontWeight:700,
  fontSize:30, letterSpacing:'-0.02em', color:INK }
const F_SUB = { margin:'8px 0 0', fontFamily:'Chivo, sans-serif', fontSize:17, color:INK2 }

function Pad() {
  return (
    <div style={{ padding:'0 28px' }}>
      <p style={F_TITLE}>Cover the camera.</p>
      <p style={F_SUB}>Rear lens and flash, one finger.</p>
      <svg viewBox="0 0 240 190" style={{ marginTop:26, width:'100%', display:'block' }} aria-hidden>
        <rect x="52" y="14" width="136" height="162" rx="30" fill={MIST} stroke={INK} strokeWidth="2.4"/>
        <rect x="70" y="32" width="86" height="86" rx="24" fill={CARD} stroke={INK2} strokeWidth="2"/>
        <circle cx="94" cy="56" r="15" fill="none" stroke={INK2} strokeWidth="2"/>
        <circle cx="132" cy="94" r="15" fill="none" stroke={INK2} strokeWidth="2"/>
        <circle cx="94" cy="94" r="9" fill={ACCENT}/>
        <circle cx="132" cy="56" r="7" fill={WASH} stroke={INK2} strokeWidth="1.6"/>
        <ellipse cx="116" cy="76" rx="54" ry="44" fill={WASH} stroke={INK} strokeWidth="2.6" opacity="0.92"/>
        <path d="M62,150 C62,120 76,100 106,92 L184,92 C176,124 160,146 138,158 Z"
          fill={MIST} stroke={INK} strokeWidth="2.4" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

function Still() {
  return (
    <div style={{ padding:'0 28px' }}>
      <p style={F_TITLE}>Hold still.</p>
      <p style={F_SUB}>Thirty seconds. Rest your hand.</p>
      <div style={{ marginTop:24, borderRadius:16, background:INK, padding:'22px 18px' }}>
        <svg viewBox="0 0 300 92" style={{ width:'100%', display:'block' }} aria-hidden>
          <path d="M0 58 L28 58 L36 22 L44 80 L52 58 L90 58 L118 58 L126 22 L134 80 L142 58
                   L180 58 L208 58 L216 22 L224 80 L232 58 L268 58 L296 58"
            fill="none" stroke="#3ecf9a" strokeWidth="3.4" strokeLinecap="round"
            strokeLinejoin="round" className="mm-trace"/>
        </svg>
        <p style={{ margin:'14px 0 0', fontFamily:'Chivo Mono, monospace', fontSize:17, color:'#c2d7ca' }}>
          72 bpm · signal good</p>
      </div>
    </div>
  )
}

function Say() {
  return (
    <div style={{ padding:'0 28px' }}>
      <p style={F_TITLE}>Say one sentence.</p>
      <p style={F_SUB}>Anything. The words are not kept.</p>
      <div style={{ marginTop:28, display:'flex', alignItems:'flex-end', gap:5, height:120 }}>
        {[22, 48, 74, 96, 64, 108, 82, 54, 90, 116, 70, 44, 86, 58, 30, 66].map((v, i) => (
          <span key={i} style={{ flex:1, height:v, borderRadius:3,
            background: i % 3 === 0 ? BEAM : ACCENT, opacity: 0.55 + (v / 240) }}/>
        ))}
      </div>
      <p style={{ margin:'16px 0 0', fontFamily:'Chivo Mono, monospace', fontSize:16, color:INK3 }}>
        15s · listening</p>
    </div>
  )
}

function Got() {
  return (
    <div style={{ padding:'0 28px' }}>
      <p style={F_TITLE}>Your score.</p>
      <p style={F_SUB}>With how sure it is.</p>
      <div style={{ marginTop:26, borderRadius:16, background:CARD, border:`1px solid ${RULE}`,
        padding:'24px 20px' }}>
        <p style={{ margin:0, fontFamily:'Chivo Mono, monospace', fontSize:64, lineHeight:1, color:INK }}>38</p>
        <p style={{ margin:'6px 0 0', fontFamily:'Chivo, sans-serif', fontSize:16, color:INK3 }}>
          out of 100</p>
        <div style={{ marginTop:22, height:12, borderRadius:999, background:MIST, position:'relative' }}>
          <span style={{ position:'absolute', left:'22%', width:'26%', top:0, bottom:0,
            borderRadius:999, background:ACCENT }}/>
        </div>
        <p style={{ margin:'10px 0 0', fontFamily:'Chivo, sans-serif', fontSize:16, color:INK2 }}>
          Somewhere in the green band.</p>
      </div>
    </div>
  )
}

const SCREENS = { pad:Pad, still:Still, say:Say, got:Got }

export function StepScreen({ kind }) {
  const S = SCREENS[kind] || Pad
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%',
      justifyContent:'center', background:'#f7faf8' }}>
      <S/>
    </div>
  )
}
