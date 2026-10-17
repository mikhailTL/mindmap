import React from 'react'
import { useAccount } from '../../account/store'
import { useMode } from '../../lib/mode'
import { cn } from '../../lib/utils'
import { DEMO_FIRST } from './demoTeen'

/* The owner, 17 October: "based on the user's account name, it greets them
   with a welcome ____ (name) on this page". The first word of the signed-in
   account's name; in the demo with nobody signed in, the demo teen's. In real
   mode with nobody signed in there is no name to use, so there is no line. */
export function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || ''
}

export function Welcome({ className }) {
  const me = useAccount()
  const [mode] = useMode()
  const name = firstName(me?.name) || (mode === 'real' ? '' : DEMO_FIRST)
  if (!name) return null
  return (
    <h1 className={cn('font-display text-head font-bold tracking-tight text-ink sm:text-sub', className)}>
      Welcome, {name}
    </h1>
  )
}
