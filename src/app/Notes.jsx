import React from 'react'
import { cn } from '../lib/utils'
import { NOTES, PRO_LC } from '../lib/terms'
import { GetHelp } from './Help'
import { TypingWeek } from '../toolkit/typing-line'

/* Notes, retired.
 *
 * The journal that used to live here is gone. Spec 0d section 8: MindMap AI
 * replaces Notes on all three audiences, and MindMap AI is a real language
 * model behind api/mindmap-ai.js, so the student's one writing surface is now
 * a conversation rather than a stored list.
 *
 * This file is kept, and keeps its export, for one reason: src/app/index.js
 * and src/views/App.jsx both name `NotesJournal`, and neither is this worker's
 * file to edit. What it renders is the honest consequence of the decision
 * rather than a journal, and it says what happened to anything already
 * written, because a reader who typed into the old screen deserves to know
 * where it went.
 *
 * To finish the retirement, three lines come out, none of them here:
 *   src/app/index.js        the NotesJournal export
 *   src/views/App.jsx       `notes: () => <NotesJournal/>` in the route table,
 *                           the id in VIEWS, APP_VIEWS, APP_OF, APP_TAB,
 *                           TITLE and APP_TITLE, and the import on line 10
 * and this file goes with them. Until then the route resolves and explains
 * itself instead of rendering a feature the product no longer has.
 *
 * Nothing written in the old journal was ever sent anywhere: it lived in this
 * browser's own storage and there was no endpoint for it. The slot in
 * ./store.js is untouched by this file, so nothing has been deleted either.
 */

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
