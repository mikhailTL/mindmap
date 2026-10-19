import React from 'react'
import { RainbowDial } from '../charts/rainbow'
import { studentRings } from '../lib/readings'
import { cn } from '../lib/utils'

/* Three beats on a loop, built from the site's own components and demo data so
   it cannot drift out of date. Under reduced motion the loop does not run and
   it holds on the score. */
const BEATS = ['reading', 'score', 'week']
const HOLD = 4200

const WEEK = [34, 31, 68, 74, 41, 29, 26]

function useBeat() {
  const still = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [i, setI] = React.useState(still ? 1 : 0)
  React.useEffect(() => {
    if (still) return
    const t = setInterval(() => setI(v => (v + 1) % BEATS.length), HOLD)
    return () => clearInterval(t)
  }, [still])
  return [BEATS[i], i]
}

function Reading() {
  return (
    <div style={{ padding:'0 26px' }}>
      <p style={{ margin:0, fontFamily:'Quicksand,sans-serif', fontWeight:700, fontSize:27,
        letterSpacing:'-0.02em', color:'#0d2b1e' }}>Hold still.</p>
      <p style={{ margin:'6px 0 0', fontFamily:'Chivo,sans-serif', fontSize:16, color:'#2a5744' }}>
        Fingertip over the camera. Twenty eight seconds left.</p>
      {/* A light plate with a fine grid, like the app (owner, 19 October:
          "stop making things dark"). Text on #eef8f3: ink 13.9, ink-2 7.5,
          accent-ink 7.9. */}
      <div style={{ marginTop:22, borderRadius:14, padding:'20px 18px',
        background:'linear-gradient(rgba(21,116,70,.06) 1px, transparent 1px) 0 0 / 100% 16px, linear-gradient(180deg,#f8fcfa,#eef8f3)',
        boxShadow:'inset 0 0 0 1px rgba(21,116,70,.18), 0 10px 24px -18px rgba(13,43,30,.4)' }}>
        <svg viewBox="0 0 300 96" style={{ width:'100%', display:'block' }} aria-hidden>
          <path d="M0 62 L26 62 L34 26 L42 84 L50 62 L86 62 L112 62 L120 26 L128 84 L136 62 L172 62
                   L198 62 L206 26 L214 84 L222 62 L258 62 L284 62 L292 40"
            fill="none" stroke="#157446" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"
            className="mm-trace"/>
        </svg>
        <div style={{ marginTop:14, display:'flex', alignItems:'baseline', gap:8 }}>
          <span style={{ fontFamily:'Chivo Mono,monospace', fontSize:30, color:'#0d2b1e' }}>72</span>
          <span style={{ fontFamily:'Chivo,sans-serif', fontSize:14, color:'#2a5744' }}>bpm</span>
          <span style={{ marginLeft:'auto', fontFamily:'Chivo,sans-serif', fontSize:14, color:'#0f5836' }}>
            Signal good</span>
        </div>
      </div>
    </div>
  )
}

function Score() {
  return (
    <div style={{ padding:'0 22px', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <RainbowDial score={38} usual={46} rings={studentRings()} size={300}/>
      <p style={{ margin:'14px 0 0', textAlign:'center', fontFamily:'Quicksand,sans-serif',
        fontWeight:700, fontSize:24, lineHeight:1.2, letterSpacing:'-0.02em', color:'#0d2b1e' }}>
        Today is running easy.</p>
      <p style={{ margin:'8px 0 0', textAlign:'center', fontFamily:'Chivo,sans-serif',
        fontSize:15, color:'#2a5744' }}>Lower than your usual 46.</p>
    </div>
  )
}

function Week() {
  const hi = Math.max(...WEEK)
  return (
    <div style={{ padding:'0 26px' }}>
      <p style={{ margin:0, fontFamily:'Quicksand,sans-serif', fontWeight:700, fontSize:27,
        letterSpacing:'-0.02em', color:'#0d2b1e' }}>Your week.</p>
      <p style={{ margin:'6px 0 0', fontFamily:'Chivo,sans-serif', fontSize:16, color:'#2a5744' }}>
        Two harder days, both after Wednesday.</p>
      <div style={{ marginTop:26, display:'flex', alignItems:'flex-end', gap:9, height:150 }}>
        {WEEK.map((v, i) => (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'flex-end', gap:8 }}>
            <span style={{ fontFamily:'Chivo Mono,monospace', fontSize:13,
              color: v === hi ? '#0d2b1e' : '#426a58' }}>{v}</span>
            <span style={{ width:'100%', height:(v / 100) * 106, borderRadius:'5px 5px 0 0',
              background: v > 60 ? '#1d8fb0' : '#157446' }}/>
            <span style={{ fontFamily:'Chivo,sans-serif', fontSize:12, color:'#426a58' }}>
              {'MTWTFSS'[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PANE = { reading:Reading, score:Score, week:Week }
const TAB = ['Today', 'Week', 'Signals', 'You']

export function PhoneApp() {
  const [beat, i] = useBeat()
  const Pane = PANE[beat]
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f7faf8' }}>
      <div style={{ padding:'0 26px 16px', display:'flex', alignItems:'center', gap:9 }}>
        <svg width="30" height="21" viewBox="0 0 40 28" aria-hidden>
          <rect x="2" y="4" width="36" height="20" rx="10" fill="none" stroke="#0d2b1e" strokeWidth="2.6"/>
          <path d="M10.5 18.2 15 10.2 20 15.8 25.4 11 29.5 17.6" fill="none" stroke="#157446"
            strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="29.5" cy="17.6" r="2.4" fill="#157446"/>
        </svg>
        <span style={{ fontFamily:'Quicksand,sans-serif', fontWeight:700, fontSize:20,
          letterSpacing:'-0.015em', color:'#0d2b1e' }}>MindMap</span>
        <span style={{ marginLeft:'auto', fontFamily:'Chivo,sans-serif', fontSize:14, color:'#426a58' }}>
          Thursday</span>
      </div>
      {/* keyed, so React tears the pane down and the charts recount */}
      <div key={beat} className="mm-pane" style={{ flex:1, minHeight:0, display:'flex',
        flexDirection:'column', justifyContent:'center' }}>
        <Pane/>
      </div>
      <div style={{ display:'flex', borderTop:'1px solid #c2d7ca', background:'#ffffff' }}>
        {TAB.map((t, n) => (
          <span key={t} style={{ flex:1, textAlign:'center', padding:'13px 0',
            fontFamily:'Quicksand,sans-serif', fontWeight:700, fontSize:14,
            color: n === (i === 2 ? 1 : 0) ? '#157446' : '#426a58' }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

export function PhoneBeats({ className }) {
  return <span className={cn('sr-only', className)}/>
}
