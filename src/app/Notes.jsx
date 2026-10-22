import React from 'react'
import { cn } from '../lib/utils'
import { NOTES, PRO_LC } from '../lib/terms'
import { GetHelp } from './Help'
import { TypingWeek } from '../toolkit/typing-line'

export function NotesJournal({ className }) {
  return (
    <div className={cn('wrap', className)}>
      <div className="mx-auto w-full max-w-[42rem]">
        <h2 className="font-display font-bold text-ink">{NOTES} has moved</h2>
        <section className="mt-3 rounded-panel border border-rule bg-card p-4">
          <p className="max-w-[58ch] text-meta text-ink-2">
            The journal is gone. You can now write to MindMap AI instead.
          </p>
          <p className="mt-2 max-w-[58ch] text-fine text-ink-3">
            A note never left your phone. Messages to MindMap AI go to MindMap&rsquo;s own server.
          </p>
          <p className="mt-2 max-w-[58ch] text-fine text-ink-3">
            Old notes stayed in this browser. No parent or {PRO_LC} ever saw them.
          </p>
          <a href="#/ai"
            className="mt-3.5 inline-flex min-h-[44px] items-center gap-2 rounded-field border
              border-accent-ink bg-accent px-4 font-display text-ui font-medium text-paper
              transition-colors duration-150 ease hoverOnly:bg-accent-ink">
            Open MindMap AI
          </a>
        </section>
        <section className="mt-3 rounded-panel border border-rule bg-aqua p-4">
          <h3 className="font-display font-bold text-ink">Talk to a person</h3>
          <p className="mt-1 max-w-[52ch] text-fine text-ink-2">
            Writing is not the same as telling somebody. The help lines need no reading,
            patch or account.
          </p>
          <GetHelp className="mt-2.5"/>
        </section>
        <TypingWeek className="mt-3"/>
      </div>
    </div>
  )
}
