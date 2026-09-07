import React from 'react'
import * as S from '@radix-ui/react-separator'
import { cn } from '../lib/utils'
export function Separator({ className, ...p }){
  return <S.Root className={cn('bg-rule data-[orientation=horizontal]:h-px data-[orientation=vertical]:w-px',className)} {...p}/>
}
export function Label({ className, children }){
  return <span className={cn('lab',className)}>{children}</span>
}
/* Out-of-range is never colour alone: weight and a glyph carry it into grayscale. */
export function Flag({ level, children }){
  const map = { over:'text-warn font-medium', under:'text-calm font-medium', flat:'text-ink-2' }
  return <span className={cn('font-mono tabular-nums',map[level])}>{children}</span>
}
