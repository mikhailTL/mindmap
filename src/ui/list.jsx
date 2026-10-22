import React from 'react'
import { cn } from '../lib/utils'

// The bullet is drawn, and 0.52em puts it on the optical centre of the first line.
export function List({ className, children, ...rest }) {
  return (
    <ul className={cn('m-0 flex list-none flex-col gap-2 p-0', className)} {...rest}>
      {children}
    </ul>
  )
}

export function Item({ className, marker = 'bullet', children, ...rest }) {
  return (
    <li className={cn('flex items-start gap-2.5', className)} {...rest}>
      {marker !== 'none' && (
        <span aria-hidden
          className="mt-[0.52em] block size-[5px] shrink-0 rounded-chip bg-ink-3"/>
      )}
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  )
}
