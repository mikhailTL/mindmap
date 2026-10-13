import React from 'react'
import { cn } from '../lib/utils'

/* 1 SVG unit = 1 CSS pixel, so a declared 16px label renders at 16px on a phone. */
export function useWidth(fallback=720){
  const ref = React.useRef(null)
  const [w,setW] = React.useState(fallback)
  React.useLayoutEffect(()=>{
    const el = ref.current; if(!el) return
    const read = ()=> setW(Math.max(320, Math.round(el.clientWidth||fallback)))
    read()
    if(!window.ResizeObserver) return
    const ro = new ResizeObserver(read); ro.observe(el); return ()=>ro.disconnect()
  },[fallback])
  return [ref,w]
}
export const line = pts => pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ')
export const scale = (v,d0,d1,r0,r1)=> d1===d0 ? r0 : r0+(v-d0)/(d1-d0)*(r1-r0)

export function FigHead({ title, note }){
  return (
    <div className="mt-8 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
      <h2 className="font-display font-medium text-row text-ink">{title}</h2>
      {note && <span className="text-sec text-ink-3">{note}</span>}
    </div>
  )
}
/* Stat tile per the figure contract: label, value with unit, 12-point trend,
   then the plain sentence that says what the number means. */
export function Stat({ label, value, unit, trend, children, className }){
  return (
    <div className={cn('py-6 border-b border-rule sm:px-6 sm:border-l sm:border-b-0',
      'first:sm:pl-0 first:sm:border-l-0 lg:[&:nth-child(3n+1)]:pl-0 lg:[&:nth-child(3n+1)]:border-l-0',
      className)}>
      <div className="note">{label}</div>
      <div className="mt-2 font-medium text-stat leading-none tabular-nums text-ink">
        {value}{unit && <span className="ml-1 text-meta text-ink-3">{unit}</span>}
      </div>
      {trend && <Spark data={trend}/>}
      <p className="mt-1.5 text-meta text-ink-2">{children}</p>
    </div>
  )
}
export function Spark({ data, w=120, h=32, className }){
  const lo=Math.min(...data), hi=Math.max(...data)===lo?Math.min(...data)+1:Math.max(...data)
  const p=3, pts=data.map((v,i)=>[scale(i,0,data.length-1,p,w-p), scale(v,lo,hi,h-p,p)])
  const last=pts[pts.length-1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden className={cn('mt-2.5 block h-8 w-[120px]',className)}>
      <path d={line(pts)} fill="none" stroke="currentColor" strokeWidth="1.5"
        className="text-ink-3 opacity-75" vectorEffect="non-scaling-stroke"/>
      <circle cx={last[0]} cy={last[1]} r="3" className="fill-accent"/>
    </svg>
  )
}
