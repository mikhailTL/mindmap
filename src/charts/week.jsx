import React from 'react'
import { useWidth, scale } from './primitives'

/* Above-range days carry weight and a caret as well as the amber, so the
   distinction survives grayscale and full colour-vision deficiency. */
export function WeekChart({ data, band }){
  const [ref,W] = useWidth()
  const small = W < 560
  const H = small?190:215, L = small?34:44, R=10, T=22, B=34
  const hi = Math.max(80, Math.max(...data.map(d=>d.v))+8)
  const y = v => scale(v,0,hi,H-B,T)
  const step = (W-L-R)/data.length, bw = step*0.44
  return (
    <div ref={ref} className="mt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full overflow-visible" role="img"
        aria-label="Daily index for seven days. Monday, Wednesday and Thursday sit above the usual range.">
        <rect x={L} y={y(band.hi)} width={W-R-L} height={y(band.lo)-y(band.hi)}
          className="fill-accent opacity-[0.07]"/>
        {[25,50,75].map(v=>(
          <g key={v}>
            <line x1={L} x2={W-R} y1={y(v)} y2={y(v)} className="stroke-rule" strokeWidth="1"/>
            <text x={L-10} y={y(v)+5} textAnchor="end" className="fill-ink-3 text-[16px]">{v}</text>
          </g>
        ))}
        {data.map((d,i)=>{
          const cx=L+step*i+step/2, over=d.v>band.hi
          return (
            <g key={d.d}>
              <rect x={cx-bw/2} y={y(d.v)} width={bw} height={(H-B)-y(d.v)} rx="3"
                className={over?'fill-warn':'fill-ink-3'}/>
              <text x={cx} y={y(d.v)-9} textAnchor="middle"
                className={`font-mono text-[17px] ${over?'fill-warn font-medium':'fill-ink-2'}`}>
                {over?'▲ ':''}{d.v}
              </text>
              <text x={cx} y={H-11} textAnchor="middle" className="fill-ink-3 text-[16px]">{d.d}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
