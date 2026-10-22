import React from 'react'
import { useWidth, line, scale } from './primitives'

// One series; the usual range is a shaded band rather than a second line or a second y-scale.
export function DayChart({ data, band }){
  const [ref,W] = useWidth()
  const [hit,setHit] = React.useState(null)
  const small = W < 560
  const H = small?190:230, L = small?34:44, R=14, T=14, B=30
  const vals = data.map(d=>d.v)
  const lo = Math.min(28, Math.min(...vals)-4), hi = Math.max(80, Math.max(...vals)+4)
  const x = i => scale(i,0,data.length-1,L,W-R)
  const y = v => scale(v,lo,hi,H-B,T)
  const pts = data.map((d,i)=>[x(i),y(d.v)])
  const first = data.findIndex((d,i)=> i>20 && d.v>band.hi)
  const every = small?3:2

  function move(e){
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(scale((e.clientX-r.left)/r.width*W, L, W-R, 0, data.length-1))
    setHit(i>=0 && i<data.length ? i : null)
  }
  return (
    <div ref={ref} className="relative mt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full overflow-visible" role="img"
        onPointerMove={move} onPointerLeave={()=>setHit(null)}
        aria-label="Stress index from 7am to 4pm. It rises after 11am and stays above the usual range.">
        <rect x={L} y={y(band.hi)} width={W-R-L} height={y(band.lo)-y(band.hi)}
          className="fill-accent opacity-[0.07]"/>
        {[30,45,60,75].map(v=>(
          <g key={v}>
            <line x1={L} x2={W-R} y1={y(v)} y2={y(v)} className="stroke-rule" strokeWidth="1"/>
            <text x={L-10} y={y(v)+5} textAnchor="end" className="fill-ink-3 text-[16px]">{v}</text>
          </g>
        ))}
        {data.map((d,i)=> d.t.slice(3)==='00' && +d.t.slice(0,2)%every===1 ? (
          <text key={d.t} x={x(i)} y={H-9} textAnchor="middle" className="fill-ink-3 text-[16px]">{d.t}</text>
        ):null)}
        <path d={line(pts)} fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
          className="stroke-ink-3" vectorEffect="non-scaling-stroke"/>
        {first>0 && <path d={line(pts.slice(first))} fill="none" strokeWidth="2.5" strokeLinejoin="round"
          strokeLinecap="round" className="stroke-warn" vectorEffect="non-scaling-stroke"/>}
        {hit!=null && <>
          <line x1={x(hit)} x2={x(hit)} y1={T} y2={H-B} className="stroke-ink" strokeWidth="1"/>
          <circle cx={x(hit)} cy={y(data[hit].v)} r="5" className="fill-warn stroke-paper" strokeWidth="2"/>
        </>}
      </svg>
      {hit!=null && (
        <div className="pointer-events-none absolute -top-1 -translate-x-1/2 rounded-xs bg-ink px-2.5 py-1 text-[15px] text-paper whitespace-nowrap"
          style={{left:`${x(hit)/W*100}%`}}>{data[hit].t} · {Math.round(data[hit].v)}</div>
      )}
    </div>
  )
}
