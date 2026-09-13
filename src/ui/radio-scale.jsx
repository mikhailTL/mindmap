import React from 'react'
import * as R from '@radix-ui/react-radio-group'
import { cn } from '../lib/utils'

/* Radix RadioGroup gives the 0-4 scale roving-tabindex keyboard behaviour that
   a row of bare inputs does not: arrow keys move within the scale, Tab leaves it. */
export function Scale({ name, legend, low, high, value, onChange }){
  return (
    <fieldset className="py-6 border-b border-rule">
      <legend className="font-display font-medium text-row text-ink p-0">{legend}</legend>
      <R.Root value={value==null?undefined:String(value)}
        onValueChange={v=>onChange(Number(v))}
        aria-label={legend}
        className="mt-4 grid grid-cols-5 gap-1.5">
        {[0,1,2,3,4].map(v=>(
          <R.Item key={v} value={String(v)}
            aria-label={`${v} — ${v===0?low:v===4?high:'between'}`}
            className={cn(
              /* rounded-xs was the old green system's one-size radius; in this
                 system a tappable field is rounded-field. */
              'min-h-[56px] rounded-field border border-rule bg-paper font-mono text-meta text-ink-2',
              'transition-[background-color,color,border-color] duration-150 ease-out',
              'hover:border-ink-3 hover:bg-mist/50',
              'data-[state=checked]:bg-ink data-[state=checked]:text-paper data-[state=checked]:border-ink')}>
            {v}
          </R.Item>
        ))}
      </R.Root>
      <div className="mt-2 flex justify-between text-sec text-ink-3">
        <span>{low}</span><span>{high}</span>
      </div>
    </fieldset>
  )
}
