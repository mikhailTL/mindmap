import React from 'react'
import { cn } from '../../lib/utils'
import { firstName, useViewerName } from '../../account/viewer'

/* The owner, 17 October: "based on the user's account name, it greets them
   with a welcome ____ (name) on this page". The first word of the signed-in
   account's name in Live; in the demo, "Welcome, Student" (owner, 18
   October: no demo person's name for the reader). In Live with nobody
   signed in there is no name to use, so there is no line. */
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
