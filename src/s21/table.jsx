import React from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '../lib/utils'

/* Table primitives from the s21 kit — a real header/row/cell system so pages
   stop hand-rolling grid classes. Retokenised to the light clinical palette. */

export function Table({ children, className }) {
  return <div className={cn('w-full overflow-x-auto', className)}>
    <table className="w-full border-collapse text-left">{children}</table></div>
}
export const THead = ({ children }) => <thead className="border-b border-ink">{children}</thead>
export const TBody = ({ children }) => <tbody>{children}</tbody>

export function TR({ children, className, interactive, ...p }) {
  return <tr className={cn('border-b border-rule', interactive &&
    'group cursor-pointer transition-colors duration-100 [@media(hover:hover)]:hover:bg-sage/60',
    className)} {...p}>{children}</tr>
}
export function TH({ children, className, sortable, onSort, active, dir, align = 'left' }) {
  return (
    <th scope="col" className={cn('whitespace-nowrap bg-paper py-3 pr-4 font-mono text-label',
      'font-normal uppercase tracking-[0.12em] text-ink-3',
      align === 'right' && 'text-right', className)}>
      {sortable ? (
        <button type="button" onClick={onSort}
          className={cn('inline-flex min-h-[44px] items-center gap-1.5 transition-colors hover:text-ink',
            active && 'text-ink')}>
          {children}<ChevronsUpDown aria-hidden size={12}/>
          <span className="sr-only">{active ? `sorted ${dir === 'asc' ? 'ascending' : 'descending'}` : 'sort'}</span>
        </button>
      ) : children}
    </th>
  )
}
export function TD({ children, className, num, align = 'left', ...p }) {
  return <td className={cn('border-b border-rule py-3.5 pr-4 align-middle text-meta',
    num && 'font-mono tabular-nums', align === 'right' && 'text-right', className)} {...p}>{children}</td>
}
