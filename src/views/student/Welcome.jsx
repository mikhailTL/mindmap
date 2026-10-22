import React from 'react'
import { cn } from '../../lib/utils'
import { firstName, useViewerName } from '../../account/viewer'

export { firstName }

export function Welcome({ className }) {
  const name = useViewerName('student')
  if (!name) return null
  return (
    <h1 className={cn('font-display text-head font-bold tracking-tight text-ink sm:text-sub', className)}>
      Welcome, {name}
    </h1>
  )
}
