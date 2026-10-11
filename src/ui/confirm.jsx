import React from 'react'
import * as D from '@radix-ui/react-dialog'
import { Button } from './button'
import { Cross } from './marks'

/* The one action on this site that cannot be taken back, and the only dialog.
 *
 * Closing a crisis record writes a permanent row to an append-only log and
 * stops the escalation clock. A disabled button and a hopeful click was the
 * whole safeguard before this. The confirmation states what is written, who
 * can read it afterwards and what cannot be undone, in that order, and the
 * confirming button says what it does rather than "Confirm". */
export function ConfirmClose({ open, onOpenChange, subject, steps, onConfirm }) {
  const [outcome, setOutcome] = React.useState('')
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        {/* The backdrop-saturate filter was the last piece of glass left over from
            the old system; a flat ink scrim is the whole dim. */}
        <D.Overlay className="fixed inset-0 z-[90] bg-ink/35"/>
        <D.Content
          className="fixed left-1/2 top-1/2 z-[100] w-[min(46rem,calc(100vw-2.5rem))]
            -translate-x-1/2 -translate-y-1/2 rounded-panel border-t-4 border-crit bg-card p-7 sm:p-9">
          <div className="flex items-start justify-between gap-6">
            <D.Title className="max-w-[22ch] font-display text-head font-medium text-ink">
              Close the crisis record for {subject}?</D.Title>
            <D.Close className="lift -m-2 p-2 text-ink-3 hoverOnly:text-ink" aria-label="Leave it open">
              <Cross size={22}/>
            </D.Close>
          </div>

          <D.Description className="mt-4 max-w-[58ch] text-sec text-ink-2">
            All {steps} protocol steps are ticked. Closing writes one row to the audit log with your
            name and the time, and stops the escalation clock on this student.
          </D.Description>

          <ul className="mt-6 list-none border-t border-rule p-0 text-meta text-ink-2">
            <li className="flex gap-4 border-b border-rule py-3">
              <span className="w-28 shrink-0 text-tick text-ink-3">Written</span>
              <span>Outcome, your name, the timestamp.</span>
            </li>
            <li className="flex gap-4 border-b border-rule py-3">
              <span className="w-28 shrink-0 text-tick text-ink-3">Readable by</span>
              <span>You, the safeguarding lead, and the student.</span>
            </li>
            <li className="flex gap-4 border-b border-rule py-3">
              <span className="w-28 shrink-0 text-tick text-ink-3">Reversible</span>
              <span className="text-crit">No. The log cannot be edited or deleted.</span>
            </li>
          </ul>

          <label className="mt-6 block">
            <span className="font-display text-tick font-medium text-ink-2">
              Outcome, in your own words</span>
            {/* Square corners and a suppressed outline came across with the green
                system: the field takes the field radius, and killing the outline
                now leaves an ink border behind it rather than nothing. */}
            <textarea rows={3} value={outcome} onChange={e => setOutcome(e.target.value)}
              placeholder="What happened, and what comes next."
              className="mt-2 w-full resize-none rounded-field border border-rule bg-paper p-3.5 text-meta
                text-ink placeholder:text-ink-3 focus-visible:border-ink focus-visible:outline-none"/>
          </label>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <D.Close asChild><Button variant="outline" size="sm">Leave it open</Button></D.Close>
            <Button size="sm" disabled={outcome.trim().length < 12}
              className="!bg-crit hoverOnly:!bg-crit/90 disabled:!bg-crit/40"
              onClick={() => { onConfirm?.(outcome); onOpenChange(false) }}>
              Write it to the log
            </Button>
          </div>
          {outcome.trim().length < 12 && (
            <p className="mt-2.5 text-right text-fine text-ink-3">
              A sentence is the minimum. This is the row somebody reads in six months.
            </p>
          )}
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}
