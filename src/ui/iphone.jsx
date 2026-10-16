import React from 'react'
import { cn } from '../lib/utils'

/* Geometry is the real device's, in points, so `scale` is a true multiplier:
   at 1 the drawing is the size of the phone. */
const MODELS = {
  '15-pro': { w:393, h:852, r:55, island:true,  bezel:10 },
  '15':     { w:393, h:852, r:55, island:true,  bezel:11 },
  '14-pro': { w:393, h:852, r:55, island:true,  bezel:10 },
  '14':     { w:390, h:844, r:47, island:false, bezel:12 },
  'x':      { w:375, h:812, r:44, island:false, bezel:12 },
  'plain':  { w:390, h:844, r:40, island:false, bezel:10 },
}

const SHELL = {
  graphite: { frame:'#1f5560', edge:'#0b2b33' },
  natural:  { frame:'#8eb0b6', edge:'#3c6a74' },
  silver:   { frame:'#bed6da', edge:'#8eb0b6' },
  ink:      { frame:'#0b2b33', edge:'#000000' },
}

export function IPhone({
  model = '15-pro',
  color = 'graphite',
  scale = 0.62,
  radius,
  screenBg = '#ffffff',
  showHomeIndicator = true,
  label = 'The MindMap app',
  /* true when the screen holds live controls: a group, not an image,
     so screen readers reach the buttons and live regions inside */
  interactive = false,
  className,
  children,
}) {
  const m = MODELS[model] || MODELS['15-pro']
  const shell = SHELL[color] || SHELL.graphite
  const bezel = m.bezel
  const r = radius ?? m.r
  const W = m.w + bezel * 2
  const H = m.h + bezel * 2
  return (
    <div
      role={interactive ? 'group' : 'img'}
      aria-label={label}
      className={cn('relative shrink-0 select-none', className)}
      style={{
        width: W * scale,
        height: H * scale,
        /* Children lay out at device points; one transform scales the lot. */
        ['--mm-scale']: scale,
      }}>
      <div
        style={{
          width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left',
          background: shell.frame, borderRadius: r + bezel,
          padding: bezel, boxSizing: 'border-box',
          boxShadow: `inset 0 0 0 2px ${shell.edge}, 8px 8px 0 0 rgb(13 43 30 / 0.12)`,
        }}>
        <span aria-hidden style={{ position:'absolute', left:-2, top: bezel + 118, width:3, height:32,
          background: shell.edge, borderRadius:'3px 0 0 3px' }}/>
        <span aria-hidden style={{ position:'absolute', left:-3, top: bezel + 176, width:4, height:62,
          background: shell.edge, borderRadius:'3px 0 0 3px' }}/>
        <span aria-hidden style={{ position:'absolute', left:-3, top: bezel + 252, width:4, height:62,
          background: shell.edge, borderRadius:'3px 0 0 3px' }}/>
        <span aria-hidden style={{ position:'absolute', right:-3, top: bezel + 208, width:4, height:96,
          background: shell.edge, borderRadius:'0 3px 3px 0' }}/>

        <div style={{
          position:'relative', width:m.w, height:m.h, borderRadius:r, overflow:'hidden',
          background:screenBg, display:'flex', flexDirection:'column',
        }}>
          {m.island ? (
            <span aria-hidden style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)',
              width:126, height:36, borderRadius:20, background:'#000', zIndex:3 }}/>
          ) : (
            <span aria-hidden style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
              width:210, height:30, borderRadius:'0 0 18px 18px', background:'#000', zIndex:3 }}/>
          )}
          {/* safe areas: content must not land under the cutout or the bar */}
          <div style={{ flex:1, minHeight:0, paddingTop: m.island ? 60 : 44,
            paddingBottom: showHomeIndicator ? 30 : 12, display:'flex', flexDirection:'column' }}>
            {children}
          </div>
          {showHomeIndicator && (
            <span aria-hidden style={{ position:'absolute', bottom:9, left:'50%', transform:'translateX(-50%)',
              width:140, height:5, borderRadius:3, background:'#0b2b33', opacity:0.28 }}/>
          )}
        </div>
      </div>
    </div>
  )
}
