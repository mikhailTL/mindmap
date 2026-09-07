import React from 'react'
import { cn } from '../lib/utils'
/* shadcn Card, flattened: this product's surfaces are hairline regions, not
   floating panels, so the drop shadow only appears on the interactive variant. */
export function Card({ className, interactive=false, as:As='div', ...p }){
  return <As className={cn(
    'bg-paper border border-rule rounded-xs overflow-hidden text-left w-full',
    interactive && 'cursor-pointer transition-[border-color,transform,box-shadow] duration-200 ease-out ' +
      'hover:border-ink hover:-translate-y-0.5 hover:shadow-raise active:translate-y-0 active:shadow-none',
    className)} {...p} />
}
export function CardBody({ className, ...p }){ return <div className={cn('p-6 pb-7',className)} {...p}/> }
