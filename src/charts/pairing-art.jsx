import React from 'react'
import { IPhone } from '../ui/iphone'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { ITEMS } from '../lib/engine'
import { cn } from '../lib/utils'

/* Figures for the pairing page: the patch talking to a phone with nothing
 * between them, the screens of the real connect flow, and where the enclosure
 * sits on the arm.
 *
 * Only settled facts are drawn. The footprint is 54 mm by 36 mm, charging runs
 * through a slot in the side of the shell, and the four channels are sampled
 * once a second. Battery, adhesive, electrode build, part numbers, ingress
 * rating, weight, range and cost are all open, so nothing here shows any of
 * them, and no figure may read as a photograph: no unit has been built.
 *
 * Drawing idiom follows charts/patchstack.jsx and charts/rainbow.jsx: flat
 * opaque strokes, one fill per shape, no gradient, no blur, no partial-opacity
 * decoration. Token values are inlined as hex because an SVG attribute cannot
 * take a Tailwind class, and the phone screens are inline styles for the same
 * reason: they lay out in device points inside ui/iphone. */

const INK = '#0b2b33'      /* ink */
const INK2 = '#1f5560'     /* ink-2 */
const INK3 = '#3c6a74'     /* ink-3 */
const RULE = '#bed6da'
const RULING = '#8eb0b6'
const PAPER = '#f5fafa'
const CARD = '#ffffff'
const MIST = '#dfecee'
const WASH = '#d6eeeb'     /* accent.wash */
const BEAM = '#1d8fb0'     /* beam: 3.20 on paper, so a graphic and never a word */
const ACCENT = '#0a6e68'
const PRESSED = '#07544f'  /* accent.ink, the solid button's active ground */
const LIT = '#3fd6c4'      /* accent.lit, the only green that works on ink */

/* The settled footprint. Every plate and every dimension in this file is
   scaled off these two numbers, so a drawing cannot drift from the stated
   size. The long axis is the 54, and it lies ALONG the arm. */
const MM_LONG = 54
const MM_CROSS = 36

const f = n => Number(n.toFixed(2))

/* The same superellipse charts/patchstack.jsx draws the patch with, which that
   file does not export. `a` is the half-extent across the arm and `b` the
   half-extent along it, so a vertical drawing passes the cross dimension
   first. k is handle length as a fraction of the radius; 0.66 keeps the sides
   straighter than a true ellipse without reading as a stadium. */
function oval(cx, cy, a, b, k = 0.66) {
  const hx = a * k, hy = b * k
  return `M${f(cx)} ${f(cy - b)}`
    + `C${f(cx + hx)} ${f(cy - b)} ${f(cx + a)} ${f(cy - hy)} ${f(cx + a)} ${f(cy)}`
    + `C${f(cx + a)} ${f(cy + hy)} ${f(cx + hx)} ${f(cy + b)} ${f(cx)} ${f(cy + b)}`
    + `C${f(cx - hx)} ${f(cy + b)} ${f(cx - a)} ${f(cy + hy)} ${f(cx - a)} ${f(cy)}`
    + `C${f(cx - a)} ${f(cy - hy)} ${f(cx - hx)} ${f(cy - b)} ${f(cx)} ${f(cy - b)}Z`
}

/* A port that does not break the outline is a sticker, so the slot straddles
   the silhouette on the left wall, the way patchstack.jsx draws it. */
function Slot({ cx, cy, a, b }) {
  return (
    <>
      <rect x={f(cx - a - a * 0.085)} y={f(cy - b * 0.11)} width={f(a * 0.17)} height={f(b * 0.22)}
        rx={f(a * 0.07)} fill={MIST} stroke={INK} strokeWidth="1.3"/>
      <rect x={f(cx - a - a * 0.03)} y={f(cy - b * 0.04)} width={f(a * 0.06)} height={f(b * 0.08)}
        rx="1.5" fill={RULING}/>
    </>
  )
}

/* Three open arcs leaving the right wall. Elliptical, not circular, so they
   are foreshortened by the same amount as the plate they come off. */
function Advert({ x, cy, rings, width = 2 }) {
  return (
    <g fill="none" stroke={BEAM} strokeWidth={width} strokeLinecap="round">
      {rings.map(([rx, ry]) => (
        <path key={rx} d={`M${f(x)} ${f(cy - ry)} A${f(rx)} ${f(ry)} 0 0 1 ${f(x)} ${f(cy + ry)}`}/>
      ))}
    </g>
  )
}

/* The patch in plan, long axis vertical, with its side wall under it. */
function Plate({ cx, cy, a, b, wall }) {
  return (
    <>
      <path d={oval(cx, cy + wall, a, b)} fill={MIST} stroke={RULING} strokeWidth="1.3"/>
      <path d={oval(cx, cy, a, b)} fill={CARD} stroke={RULING} strokeWidth="1.6"/>
      <path d={oval(cx, cy, a * 0.84, b * 0.86)} fill="none" stroke={RULE} strokeWidth="1"/>
    </>
  )
}

/* Arrowheads and witness lines, mono label outside. Two orientations, because
   the arm figure has to carry both dimensions and neither is foreshortened on
   that view. */
function DimV({ x, y1, y2, from, size }) {
  const t = size * 0.34
  return (
    <g fill="none" stroke={INK3} strokeWidth="1">
      <line x1={f(from)} y1={f(y1)} x2={f(x + size * 0.5)} y2={f(y1)}/>
      <line x1={f(from)} y1={f(y2)} x2={f(x + size * 0.5)} y2={f(y2)}/>
      <line x1={f(x)} y1={f(y1)} x2={f(x)} y2={f(y2)}/>
      <path d={`M${f(x)} ${f(y1)}l${f(-t)} ${f(size * 0.6)}M${f(x)} ${f(y1)}l${f(t)} ${f(size * 0.6)}`}/>
      <path d={`M${f(x)} ${f(y2)}l${f(-t)} ${f(-size * 0.6)}M${f(x)} ${f(y2)}l${f(t)} ${f(-size * 0.6)}`}/>
    </g>
  )
}
function DimH({ y, x1, x2, from, size }) {
  const t = size * 0.34
  return (
    <g fill="none" stroke={INK3} strokeWidth="1">
      <line x1={f(x1)} y1={f(from)} x2={f(x1)} y2={f(y + size * 0.5)}/>
      <line x1={f(x2)} y1={f(from)} x2={f(x2)} y2={f(y + size * 0.5)}/>
      <line x1={f(x1)} y1={f(y)} x2={f(x2)} y2={f(y)}/>
      <path d={`M${f(x1)} ${f(y)}l${f(size * 0.6)} ${f(-t)}M${f(x1)} ${f(y)}l${f(size * 0.6)} ${f(t)}`}/>
      <path d={`M${f(x2)} ${f(y)}l${f(-size * 0.6)} ${f(-t)}M${f(x2)} ${f(y)}l${f(-size * 0.6)} ${f(t)}`}/>
    </g>
  )
}

/* ---- the hero: two objects, one link, nothing between them -------------- */

const LINK_ALT =
  'A drawing of the patch on the left and a phone on the right, with three arcs of Bluetooth Low '
  + 'Energy leaving the side of the patch and reaching the phone. In the gap between them a cable '
  + 'is drawn and struck through, because no cable runs between the two.'

export function WirelessLink({ className }) {
  const cx = 80, cy = 108, a = 32, b = 48
  return (
    <svg viewBox="0 0 460 240" role="img" aria-label={LINK_ALT}
      className={cn('block h-auto w-full', className)} style={{ maxWidth: 520 }}>
      <Plate cx={cx} cy={cy} a={a} b={b} wall={7}/>
      <Slot cx={cx} cy={cy} a={a} b={b}/>
      <circle cx={cx} cy={cy} r="5" fill={ACCENT}/>
      <Advert x={cx + a} cy={cy} rings={[[16, 30], [26, 48], [36, 66]]}/>

      {/* The phone is a drawing here rather than the ui/iphone mockup: at this
          size the mockup's bezel detail is mush, and the figure is about the
          gap between the two objects, not about the device. */}
      <rect x="316" y="28" width="108" height="168" rx="20" fill={CARD} stroke={INK} strokeWidth="1.8"/>
      <rect x="325" y="37" width="90" height="150" rx="13" fill={PAPER} stroke={RULE} strokeWidth="1"/>
      <rect x="354" y="44" width="32" height="8" rx="4" fill={INK}/>
      <g stroke={RULE} strokeWidth="5" strokeLinecap="round">
        <line x1="337" y1="150" x2="403" y2="150"/>
        <line x1="337" y1="166" x2="383" y2="166"/>
      </g>
      <circle cx="370" cy="104" r="22" fill={WASH} stroke={ACCENT} strokeWidth="2"/>
      <path d="M361 104l6 7 12-14" fill="none" stroke={ACCENT} strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round"/>

      {/* The cable is the only shape in this file that exists to be denied. It
          stops short of the phone on purpose: a cable drawn into the frame
          would overlap the screen and read as part of the device. */}
      <path d="M178 150Q238 186 298 148" fill="none" stroke={RULING} strokeWidth="3.4"
        strokeLinecap="round"/>
      <rect x="170" y="142" width="12" height="16" rx="3" fill={MIST} stroke={RULING} strokeWidth="1.4"/>
      <rect x="296" y="140" width="12" height="16" rx="3" fill={MIST} stroke={RULING} strokeWidth="1.4"/>
      <line x1="218" y1="142" x2="258" y2="192" stroke={INK} strokeWidth="2.8" strokeLinecap="round"/>

      <g className="font-mono" fontSize="12.5" fill={INK3}>
        <text x="232" y="62" textAnchor="middle">Bluetooth Low Energy</text>
        <text x="232" y="212" textAnchor="middle">no cable, no computer</text>
      </g>
      <g className="font-display" fontSize="15" fontWeight="700" fill={INK}>
        <text x={cx} y="196" textAnchor="middle">The patch</text>
        <text x="370" y="226" textAnchor="middle">Your phone</text>
      </g>
    </svg>
  )
}

/* ---- where it goes ------------------------------------------------------ */

const ARM_ALT =
  `The outer face of the upper arm seen straight on, shoulder at the top and elbow at the bottom, `
  + `with the patch centred on it. The oval's long axis of ${MM_LONG} mm runs along the arm, `
  + `parallel to it, and its ${MM_CROSS} mm width runs across the arm.`

export function ArmPlacement({ className }) {
  const u = 2.3
  const a = (MM_CROSS * u) / 2
  const b = (MM_LONG * u) / 2
  const cx = 148, cy = 140
  const size = 12
  const dimX = cx + a + 62
  const dimY = cy + b + 38
  return (
    <svg viewBox="0 0 360 300" role="img" aria-label={ARM_ALT}
      className={cn('block h-auto w-full', className)} style={{ maxWidth: 360 }}>
      {/* The limb is the one shape here that is drawn rather than calculated:
          an arm has no arithmetic. It only has to be wider than the plate and
          to taper the way an upper arm does. */}
      <path d="M86 -8C76 68 76 168 86 306L214 306C224 168 224 68 214 -8Z"
        fill={MIST} stroke={RULING} strokeWidth="1.4"/>
      <ellipse cx={cx} cy={cy} rx={f(a)} ry={f(b)} fill={CARD} stroke={INK} strokeWidth="1.6"/>
      <ellipse cx={cx} cy={cy} rx={f(a * 0.74)} ry={f(b * 0.82)} fill="none"
        stroke={RULE} strokeWidth="1" strokeDasharray="5 5"/>
      <circle cx={cx} cy={cy} r="5" fill={ACCENT}/>
      {/* Centre line last, over the part: it is the arm's own axis and the
          oval's long axis at once, which is the whole point of this view. */}
      <line x1={cx} y1="4" x2={cx} y2="296" stroke={RULING} strokeWidth="1" strokeDasharray="7 5"/>

      <DimV x={dimX} y1={f(cy - b)} y2={f(cy + b)} from={f(cx + a)} size={size}/>
      <DimH y={dimY} x1={f(cx - a)} x2={f(cx + a)} from={f(cy + b)} size={size}/>
      <g className="font-mono" fontSize={size} fill={INK3}>
        <text x={f(dimX + 10)} y={f(cy - 1)}>{MM_LONG} mm</text>
        <text x={f(dimX + 10)} y={f(cy + size + 2)} fontSize={f(size * 0.84)}>along the arm</text>
        <text x={cx} y={f(dimY + size * 1.5)} textAnchor="middle">{MM_CROSS} mm across</text>
        <text x={cx} y="26" textAnchor="middle">shoulder</text>
        <text x={cx} y="288" textAnchor="middle">elbow</text>
      </g>
    </svg>
  )
}

/* ---- step one: the patch on its own ------------------------------------- */

const WAKE_ALT =
  'A drawing of the patch in plan, long axis vertical, with the charging slot called out on its '
  + 'side wall and three arcs of Bluetooth Low Energy leaving its other side.'

function PatchWake({ height }) {
  const cx = 92, cy = 150, a = 36, b = 54
  return (
    <svg viewBox="0 0 240 366" role="img" aria-label={WAKE_ALT}
      className="block w-auto" style={{ height }}>
      <Plate cx={cx} cy={cy} a={a} b={b} wall={8}/>
      <Slot cx={cx} cy={cy} a={a} b={b}/>
      <circle cx={cx} cy={cy} r="5.5" fill={ACCENT}/>
      <Advert x={cx + a} cy={cy} rings={[[13, 28], [21, 44], [29, 60]]} width={2.2}/>
      <polyline points={`${cx - a - 6},${cy} 30,${cy} 30,246`} fill="none" stroke={RULING}
        strokeWidth="1"/>
      <circle cx="30" cy="246" r="2.6" fill={RULING}/>
      <g className="font-mono" fontSize="12.5" fill={INK3}>
        <text x="18" y="268">charging slot</text>
        <text x="132" y="76">sending a</text>
        <text x="132" y="94">Bluetooth signal</text>
      </g>
    </svg>
  )
}

/* ---- the screens -------------------------------------------------------- */
/* Inline styles and device points, the way ui/phone-app.jsx does it: the
   children of ui/iphone lay out at the device's own size and one transform
   scales the lot, so a rem or a Tailwind class would not scale with it.
   Screen type is set large for that reason. Every value below was taken from
   the palette and every pair clears 4.5:1 on its own ground. */

const DISPLAY = 'Quicksand,sans-serif'
const BODY = 'Chivo,sans-serif'
const MONO = '"Chivo Mono",monospace'

function Pad({ children }) {
  return (
    <div style={{ padding:'0 26px', display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
      {children}
    </div>
  )
}

const H1 = { margin:0, fontFamily:DISPLAY, fontWeight:700, fontSize:33, lineHeight:1.1,
  letterSpacing:'-0.02em', color:INK }

/* `tap` is step three rather than a second screen: the screen does not change
   when a finger lands on it, only the button's own ground does. */
function AppHome({ tap = false }) {
  return (
    <Pad>
      <p style={{ margin:0, fontFamily:MONO, fontSize:17, color:INK3 }}>MindMap</p>
      <p style={{ ...H1, marginTop:16 }}>Pair your patch.</p>
      <p style={{ margin:'10px 0 0', fontFamily:BODY, fontSize:19, lineHeight:1.4, color:INK2 }}>
        The patch connects over Bluetooth. Nothing to install.
      </p>
      {/* The screen used to be a title, a line and then a button pushed to the
          bottom by marginTop:auto, which left the middle of a 852-point phone
          empty. It is an app screen, so it shows the app's real resting state:
          the four channels named, and no reading against any of them, because
          nothing is connected yet. It is also the honest contrast with the
          streaming screen, which is the same four rows carrying units. */}
      <div style={{ marginTop:20, borderRadius:14, border:`1px solid ${RULE}`, background:CARD,
        padding:'15px 14px' }}>
        <p style={{ margin:0, fontFamily:MONO, fontSize:16, color:INK3 }}>No patch connected</p>
        {SENSOR_ORDER.map((id, i) => {
          const s = SENSORS[id]
          return (
            <div key={id} style={{ display:'flex', alignItems:'center', gap:12,
              marginTop: i ? 13 : 14 }}>
              {/* Colour identifies the channel and never carries it alone. */}
              <span aria-hidden style={{ width:4, height:18, borderRadius:999, background:s.glow }}/>
              <span style={{ fontFamily:BODY, fontSize:18, color:INK2 }}>{s.name}</span>
              <span style={{ marginLeft:'auto', fontFamily:MONO, fontSize:15, color:INK3 }}>
                waiting
              </span>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop:'auto', position:'relative' }}>
        <div style={{ borderRadius:14, background: tap ? PRESSED : INK, padding:'18px 14px',
          textAlign:'center', fontFamily:DISPLAY, fontWeight:500, fontSize:21, color:PAPER }}>
          Connect to the patch
        </div>
        <p style={{ margin:'14px 0 0', textAlign:'center', fontFamily:DISPLAY, fontWeight:500,
          fontSize:19, color:ACCENT }}>
          Answer {ITEMS.length} questions instead
        </p>
        {tap && (
          <span aria-hidden style={{ position:'absolute', left:'50%', top:9, width:56, height:56,
            marginLeft:-28, borderRadius:999, border:`4px solid ${LIT}` }}/>
        )}
      </div>
    </Pad>
  )
}

/* The browser's own sheet, not ours: the app cannot style it, cannot read it
   and cannot pick for you. One row, because the request is filtered to the one
   service the patch advertises and nothing else can be listed. */
function Chooser({ picked = false }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
      <div style={{ padding:'0 26px' }}>
        <div style={{ height:15, width:112, borderRadius:8, background:RULE }}/>
        <div style={{ marginTop:16, height:30, width:216, borderRadius:8, background:RULING }}/>
        <div style={{ marginTop:12, height:15, width:188, borderRadius:8, background:RULE }}/>
      </div>
      <div style={{ marginTop:'auto', background:CARD, borderTop:`1px solid ${RULE}`,
        borderRadius:'18px 18px 0 0', padding:'20px 18px 24px' }}>
        <p style={{ margin:0, fontFamily:DISPLAY, fontWeight:700, fontSize:22, lineHeight:1.2,
          color:INK }}>
          This site wants to pair
        </p>
        <p style={{ margin:'8px 0 0', fontFamily:BODY, fontSize:18, color:INK3 }}>Choose a device</p>
        <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:12,
          borderLeft:`4px solid ${picked ? ACCENT : RULE}`, background: picked ? WASH : PAPER,
          borderRadius:'0 10px 10px 0', padding:14 }}>
          <span aria-hidden style={{ width:12, height:12, borderRadius:999,
            background: picked ? ACCENT : RULING }}/>
          <span style={{ fontFamily:BODY, fontSize:19, color: picked ? INK : INK2 }}>
            MindMap patch
          </span>
        </div>
        <p style={{ margin:'12px 0 0', fontFamily:MONO, fontSize:15, color:INK3 }}>
          only the patch is listed
        </p>
        <div style={{ marginTop:18, display:'flex', gap:12 }}>
          <div style={{ flex:1, borderRadius:12, border:`1px solid ${INK}`, padding:'13px 0',
            textAlign:'center', fontFamily:DISPLAY, fontWeight:500, fontSize:19, color:INK }}>
            Cancel
          </div>
          <div style={{ flex:1, borderRadius:12, background: picked ? INK : MIST, padding:'14px 0',
            textAlign:'center', fontFamily:DISPLAY, fontWeight:500, fontSize:19,
            color: picked ? PAPER : INK3 }}>
            Pair
          </div>
        </div>
      </div>
    </div>
  )
}

/* The two lines here are the ones lib/engine.js returns on a successful
   connect. Do not add a battery figure, a range or a pairing time to this
   screen: none of the three is settled. */
function Streaming() {
  return (
    <Pad>
      <p style={H1}>Connected to the patch.</p>
      <p style={{ margin:'10px 0 0', fontFamily:MONO, fontSize:18, color:ACCENT }}>
        Readings arrive once a second.
      </p>
      <div style={{ marginTop:22, borderRadius:14, background:INK, padding:'18px 16px' }}>
        {SENSOR_ORDER.map((id, i) => {
          const s = SENSORS[id]
          return (
            <div key={id} style={{ display:'flex', alignItems:'center', gap:12,
              marginTop: i ? 15 : 0 }}>
              {/* Colour identifies the channel and never carries it alone: the
                  name is beside it in paper. */}
              <span aria-hidden style={{ width:4, height:20, borderRadius:999, background:s.glow }}/>
              <span style={{ fontFamily:BODY, fontSize:19, color:PAPER }}>{s.name}</span>
              <span style={{ marginLeft:'auto', fontFamily:MONO, fontSize:16, color:MIST }}>
                {s.unit}
              </span>
            </div>
          )
        })}
      </div>
      <p style={{ margin:'16px 0 0', fontFamily:BODY, fontSize:18, lineHeight:1.4, color:INK2 }}>
        The patch sends four signals once a second, all day.
      </p>
    </Pad>
  )
}

/* ---- one figure per step ------------------------------------------------ */
/* 0.42 puts a 393-point screen at 165px, which is the widest phone a 390px
   column holds beside the card's own padding. The label is the figure's text
   alternative: ui/iphone puts role="img" on the frame, so nothing inside the
   screen is announced. */
const SCALE = 0.42
const PHONE_H = Math.round((852 + 20) * SCALE)

const SCREENS = {
  open: {
    bg: PAPER,
    label: 'The MindMap app open in a browser, listing the four signals with no reading against any of them, above one button reading Connect to the patch.',
    node: <AppHome/>,
  },
  tap: {
    bg: PAPER,
    label: 'The same screen with the Connect to the patch button pressed and a tap mark on it.',
    node: <AppHome tap/>,
  },
  chooser: {
    bg: MIST,
    label: 'The browser’s own Bluetooth sheet over the app, listing the MindMap patch, with '
      + 'Cancel and Pair below it and nothing selected yet.',
    node: <Chooser/>,
  },
  pick: {
    bg: MIST,
    label: 'The same sheet with the MindMap patch row chosen and the Pair button now solid.',
    node: <Chooser picked/>,
  },
  stream: {
    bg: PAPER,
    label: 'The app reading Connected to the patch, readings arrive once a second, above the four '
      + 'signals: heart, sweat, temperature and movement.',
    node: <Streaming/>,
  },
}

/* `scale` is the phone's own scale factor, not a CSS transform: the frame in
   ui/iphone lays out at it, so the drawing stays crisp and the wake figure is
   matched to the same height. 0.42 is the six-across page size that was; the
   console on views/Pairing asks for 0.4, which is the largest that still clears
   a 390px column once the card's own padding is taken off. */
export function StepArt({ kind, scale = SCALE }) {
  if (kind === 'wake') return <PatchWake height={Math.round((852 + 20) * scale)}/>
  const s = SCREENS[kind]
  if (!s) return null
  return (
    <IPhone scale={scale} screenBg={s.bg} label={s.label}>
      {s.node}
    </IPhone>
  )
}
