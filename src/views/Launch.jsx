import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Logo } from '../ui/logo'
import { ArrowRight } from '../ui/marks'
import { Frame } from '../ui/frame'
import { PRO } from '../lib/terms'

/* The app's front door: three doors, one photograph each.
 *
 * The doors used to carry a live preview of each dashboard, which in real
 * mode is an empty phone, and under it a paragraph. The owner: "it needs to be
 * real icons for each or images, bc it looks plain, needs to be visual
 * regardless of if its real or demo ... No paragraph under the card, just
 * have student parent or med professional, and the one line under it." */

const ROLES = [
  { id:'app-student', who:'Student', title:'Your score each day', cta:'Open the student screen',
    photo:'student-card',
    alt:'Five teenagers walking together through a park, talking as they go' },
  { id:'app-parent', who:'Parent', title:'One sentence a week', cta:'Open the parent screen',
    photo:'parent-card',
    alt:'A mother and her teenage child sitting close together on a sofa at home, both smiling' },
  { id:'app-pro', who:PRO, title:'Students to check on', cta:'Open the console',
    photo:'school-card',
    alt:'A medical professional and a student talking on a sofa' },
]

function Door({ role, go }) {
  return (
    <Card interactive as="button" type="button" aria-label={`${role.cta}: ${role.title}`}
      onClick={() => go(role.id)} className="flex h-full flex-col overflow-hidden">
      <span aria-hidden className="relative block h-[150px] w-full overflow-hidden border-b border-rule sm:h-[170px] lg:h-[190px]">
        <Frame photo={role.photo} alt={role.alt} className="absolute inset-0"/>
      </span>
      <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
        {/* A span, not a heading: a button's content model is phrasing. */}
        <span className="block font-display text-row font-bold leading-[1.2] tracking-[-0.014em] text-ink">
          {role.who}
        </span>
        <span className="block text-sec text-ink-2">{role.title}</span>
        <span className="mt-auto inline-flex items-center gap-2 pt-2 font-display text-ui
          font-medium text-accent">
          {role.cta}<ArrowRight aria-hidden className="size-4 shrink-0"/>
        </span>
      </CardContent>
    </Card>
  )
}

export function Launch({ go }) {
  return (
    /* No vertical padding: `.wrap` takes it from the app shell. */
    <main className="wrap">
      {/* lg:hidden: past lg the app rail carries the wordmark instead. */}
      <Logo className="text-ui text-ink lg:hidden" title="MindMap"/>
      {/* An h2: the app's top bar already carries this screen's h1. */}
      <h2 className="mt-3 font-display font-bold text-ink lg:mt-0">
        Who is opening the app?
      </h2>
      <div className="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-3 lg:gap-4">
        {ROLES.map(role => <Door key={role.id} role={role} go={go}/>)}
      </div>
    </main>
  )
}
