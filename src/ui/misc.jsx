import React from 'react'
import { cn } from '../lib/utils'
/* Separator moved to ui/separator.jsx when the shadcn one was installed —
   two components drawing the same hairline is exactly the duplication this
   pass is removing. */
export function Label({ className, children }){
  return <span className={cn('note',className)}>{children}</span>
}
/* Out-of-range is never colour alone: weight and a glyph carry it into grayscale. */
export function Flag({ level, children }){
  const map = { over:'text-warn font-medium', under:'text-calm font-medium', flat:'text-ink-2' }
  return <span className={cn('font-mono tabular-nums',map[level])}>{children}</span>
}
