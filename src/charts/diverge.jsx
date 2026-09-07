import React from 'react'
/* Diverging bars off a neutral centre: warm raised the score, cool lowered it.
   Real DOM text, so the labels are the size they say they are at any width. */
export function Diverge({ items }){
  return (
    <ul className="mt-3.5 list-none p-0 m-0">
      {items.map(it=>{
        const up = it.x>0.02, down = it.x<-0.02
        return (
          <li key={it.label} className="grid gap-1.5 py-3.5 border-b border-rule
            sm:grid-cols-[minmax(0,22rem)_1fr_4.5rem] sm:gap-5 sm:items-center">
            <span className="text-meta text-ink-2">{it.label}</span>
            <span className="relative h-[18px] bg-[linear-gradient(to_right,transparent_calc(50%-0.5px),theme(colors.ink.3)_calc(50%-0.5px),theme(colors.ink.3)_calc(50%+0.5px),transparent_calc(50%+0.5px))]">
              <span className={`absolute top-px h-4 rounded-sm ${up?'bg-warn':down?'bg-calm':'bg-ink-3 opacity-45'}`}
                style={{ width:`${Math.max(Math.abs(it.x),0.012)*50}%`, [it.x>=0?'left':'right']:'50%' }}/>
            </span>
            <span className={`font-mono text-sec tabular-nums sm:text-right ${up?'text-warn':down?'text-calm':'text-ink-3'}`}>
              {up?'▲':down?'▼':'–'} {it.x>0?'+':''}{it.x.toFixed(2)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
