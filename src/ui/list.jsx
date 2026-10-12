import React from 'react'
import { cn } from '../lib/utils'

/* The site's one list.
 *
 * Lists were rendering three different ways: a flex row with a drawn dot, a
 * row with a bottom rule, and a bare block with no marker at all. Same kind of
 * content, three shapes, which is what a reader notices before they notice
 * anything the list says.
 *
 * Everything that is a list of things uses this. Tables, navigation, and
 * key/value rows are not lists of things and keep their own shapes.
 *
 * The bullet is drawn rather than left to `list-disc` so its size, colour and
 * optical alignment against the first line of text are fixed values rather
 * than whatever the browser's default marker does at a given font size. It
 * sits on the first line's optical centre, not its box centre, which is the
 * 0.52em offset. */
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
