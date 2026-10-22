import React from 'react'
import { IPhone } from '../ui/iphone'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { ITEMS } from '../lib/engine'
import { cn } from '../lib/utils'

const INK = '#0d2b1e'      /* ink */
const INK2 = '#2a5744'     /* ink-2 */
const INK3 = '#426a58'     /* ink-3 */
const RULE = '#c2d7ca'
const RULING = '#93b2a1'
const PAPER = '#f7faf8'
const CARD = '#ffffff'
const MIST = '#e3ede7'
const WASH = '#dcefe4'     /* accent.wash */
const BEAM = '#1d8fb0'  /* beam: 3.20 on paper, so graphics only */
const ACCENT = '#157446'
const PRESSED = '#0f5836'  /* accent.ink, the solid button's active ground */
const LIT = '#3ecf9a'      /* accent.lit, the only green that works on ink */

// The 54 x 36 mm footprint; every plate and dimension in this file is scaled from these.
const MM_LONG = 54
const MM_CROSS = 36

const f = n => Number(n.toFixed(2))

// Superellipse with half-extents a and b; k is handle length over radius, straighter-sided than an ellipse.
function oval(cx, cy, a, b, k = 0.66) {
  const hx = a * k, hy = b * k
  return `M${f(cx)} ${f(cy - b)}`
    + `C${f(cx + hx)} ${f(cy - b)} ${f(cx + a)} ${f(cy - hy)} ${f(cx + a)} ${f(cy)}`
    + `C${f(cx + a)} ${f(cy + hy)} ${f(cx + hx)} ${f(cy + b)} ${f(cx)} ${f(cy + b)}`
    + `C${f(cx - hx)} ${f(cy + b)} ${f(cx - a)} ${f(cy + hy)} ${f(cx - a)} ${f(cy)}`
    + `C${f(cx - a)} ${f(cy - hy)} ${f(cx - hx)} ${f(cy - b)} ${f(cx)} ${f(cy - b)}Z`
}

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

function Advert({ x, cy, rings, width = 2 }) {
  return (
    <g fill="none" stroke={BEAM} strokeWidth={width} strokeLinecap="round">
      {rings.map(([rx, ry]) => (
        <path key={rx} d={`M${f(x)} ${f(cy - ry)} A${f(rx)} ${f(ry)} 0 0 1 ${f(x)} ${f(cy + ry)}`}/>
      ))}
    </g>
  )
}

function Plate({ cx, cy, a, b, wall }) {
  return (
    <>
      <path d={oval(cx, cy + wall, a, b)} fill={MIST} stroke={RULING} strokeWidth="1.3"/>
      <path d={oval(cx, cy, a, b)} fill={CARD} stroke={RULING} strokeWidth="1.6"/>
      <path d={oval(cx, cy, a * 0.84, b * 0.86)} fill="none" stroke={RULE} strokeWidth="1"/>
    </>
  )
}

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

      <path d="M178 150Q238 186 298 148" fill="none" stroke={RULING} strokeWidth="3.4"
        strokeLinecap="round"/>
      <rect x="170" y="142" width="12" height="16" rx="3" fill={MIST} stroke={RULING} strokeWidth="1.4"/>
      <rect x="296" y="140" width="12" height="16" rx="3" fill={MIST} stroke={RULING} strokeWidth="1.4"/>
      <line x1="218" y1="142" x2="258" y2="192" stroke={INK} strokeWidth="2.8" strokeLinecap="round"/>

      <g className="font-body" fontSize="15" fill={INK3}>
        <text x="232" y="62" textAnchor="middle">Bluetooth Low Energy</text>
        <text x="232" y="212" textAnchor="middle">no cable, no computer</text>
      </g>
      <g className="font-display" fontSize="17" fontWeight="700" fill={INK}>
        <text x={cx} y="196" textAnchor="middle">The patch</text>
        <text x="370" y="226" textAnchor="middle">Your phone</text>
      </g>
    </svg>
  )
}

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
      <path d="M86 -8C76 68 76 168 86 306L214 306C224 168 224 68 214 -8Z"
        fill={MIST} stroke={RULING} strokeWidth="1.4"/>
      <ellipse cx={cx} cy={cy} rx={f(a)} ry={f(b)} fill={CARD} stroke={INK} strokeWidth="1.6"/>
      <ellipse cx={cx} cy={cy} rx={f(a * 0.74)} ry={f(b * 0.82)} fill="none"
        stroke={RULE} strokeWidth="1" strokeDasharray="5 5"/>
      <circle cx={cx} cy={cy} r="5" fill={ACCENT}/>
      <line x1={cx} y1="4" x2={cx} y2="296" stroke={RULING} strokeWidth="1" strokeDasharray="7 5"/>

      <DimV x={dimX} y1={f(cy - b)} y2={f(cy + b)} from={f(cx + a)} size={size}/>
      <DimH y={dimY} x1={f(cx - a)} x2={f(cx + a)} from={f(cy + b)} size={size}/>
      <g className="font-body" fontSize={size} fill={INK3}>
        <text x={f(dimX + 10)} y={f(cy - 1)}>{MM_LONG} mm</text>
        <text x={f(dimX + 10)} y={f(cy + size + 2)} fontSize={f(size * 0.84)}>along the arm</text>
        <text x={cx} y={f(dimY + size * 1.5)} textAnchor="middle">{MM_CROSS} mm across</text>
        <text x={cx} y="26" textAnchor="middle">shoulder</text>
        <text x={cx} y="288" textAnchor="middle">elbow</text>
      </g>
    </svg>
  )
}

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
      <g className="font-body" fontSize="12.5" fill={INK3}>
        <text x="18" y="268">charging slot</text>
        <text x="132" y="54">sending a</text>
        <text x="132" y="72">Bluetooth signal</text>
      </g>
    </svg>
  )
}

// Phone screens use inline styles in device points, because ui/iphone scales its children with one transform.
const DISPLAY = 'Quicksand,sans-serif'
const BODY = 'Chivo,sans-serif'

function Pad({ children }) {
  return (
    <div style={{ padding:'0 26px', display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
      {children}
    </div>
  )
}

const H1 = { margin:0, fontFamily:DISPLAY, fontWeight:700, fontSize:33, lineHeight:1.1,
  letterSpacing:'-0.02em', color:INK }

function AppHome({ tap = false }) {
  return (
    <Pad>
      <p style={{ margin:0, fontFamily:BODY, fontSize:17, color:INK3 }}>MindMap</p>
      <p style={{ ...H1, marginTop:16 }}>Pair your patch.</p>
      <p style={{ margin:'10px 0 0', fontFamily:BODY, fontSize:19, lineHeight:1.4, color:INK2 }}>
        The patch connects over Bluetooth. Nothing to install.
      </p>
      <div style={{ marginTop:20, borderRadius:14, border:`1px solid ${RULE}`, background:CARD,
        padding:'15px 14px' }}>
        <p style={{ margin:0, fontFamily:BODY, fontSize:16, color:INK3 }}>No patch connected</p>
        {SENSOR_ORDER.map((id, i) => {
          const s = SENSORS[id]
          return (
            <div key={id} style={{ display:'flex', alignItems:'center', gap:12,
              marginTop: i ? 13 : 14 }}>
              <span aria-hidden style={{ width:4, height:18, borderRadius:999, background:s.glow }}/>
              <span style={{ fontFamily:BODY, fontSize:18, color:INK2 }}>{s.name}</span>
              <span style={{ marginLeft:'auto', fontFamily:BODY, fontSize:15, color:INK3 }}>
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
        <p style={{ margin:'12px 0 0', fontFamily:BODY, fontSize:15, color:INK3 }}>
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

function Streaming() {
  return (
    <Pad>
      <p style={H1}>Connected to the patch.</p>
      <p style={{ margin:'10px 0 0', fontFamily:BODY, fontSize:18, color:ACCENT }}>
        Readings arrive once a second.
      </p>
      <div style={{ marginTop:22, borderRadius:14, background:INK, padding:'18px 16px' }}>
        {SENSOR_ORDER.map((id, i) => {
          const s = SENSORS[id]
          return (
            <div key={id} style={{ display:'flex', alignItems:'center', gap:12,
              marginTop: i ? 15 : 0 }}>
              <span aria-hidden style={{ width:4, height:20, borderRadius:999, background:s.glow }}/>
              <span style={{ fontFamily:BODY, fontSize:19, color:PAPER }}>{s.name}</span>
              <span style={{ marginLeft:'auto', fontFamily:BODY, fontSize:16, color:MIST }}>
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

// 0.42 renders a 393-point screen at 165px, which fits a 390px column with the card's padding.
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
