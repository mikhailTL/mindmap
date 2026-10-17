import React from 'react'
import { Button } from '../ui/button'
import { setVisitor } from './store'
import { cn } from '../lib/utils'

/* The consent panel, shown once, before a single answer is taken. It states
 * what is stored and what is not, and then starts the survey.
 *
 * ─── Why there is no name field here any more ───────────────────────────────
 * There was one until 13 October. It is gone, and the component keeps its old
 * export name only so that src/views/App.jsx, which this worker does not own,
 * keeps rendering the panel at the right moment. Teenagers answer this survey.
 * A first name next to an age band and a school-level band is identifying in a
 * way that none of the three is on its own, and the survey has no use for it:
 * nothing on the responses page needed a name that an opaque id does not do
 * better. store.js enforces the same thing from the other side, so passing a
 * name to setVisitor now stores nothing whatever the caller intends.
 *
 * Deliberately not a dialog role and not a focus trap. Escape starts the
 * survey, the same as the button, so the panel cannot trap a reader. */
export function NameGate({ onDone, inline = false }) {
  const ref = React.useRef(null)

  /* Autofocus only when this covers the page. Inline, stealing focus would
     scroll a reader past the heading they were reading. */
  React.useEffect(() => { if (!inline) ref.current?.focus() }, [inline])

  const start = () => {
    setVisitor()
    onDone?.()
  }

  return (
    <div
      className={cn(inline
        ? 'w-full'
        : 'fixed inset-0 z-[70] flex items-center justify-center bg-paper/95 p-5')}
      onKeyDown={e => { if (e.key === 'Escape') start() }}
    >
      <div
        className={cn('w-full rounded-panel border border-rule bg-card p-6 sm:p-8',
          inline ? 'max-w-[42rem]' : 'max-w-[34rem] shadow-lift')}
      >
        {/* First person singular throughout: one student, not a team. */}
        <h2 className="font-display text-sub font-bold text-ink">Anonymous Feedback</h2>

        <p className="mt-3 max-w-[56ch] text-sec text-ink-2">
          I am Mikhail. I built this for a school project and I am the only person who
          reads the answers. This survey is anonymous: there is nothing in it that
          identifies you, and I have no way to work out who sent an answer.
        </p>

        <div className="mt-5 border-t border-rule pt-4">
          <p className="font-display text-ui font-semibold text-ink">What is stored</p>
          <ul className="mt-2 flex max-w-[56ch] list-disc flex-col gap-1 pl-5 text-sec text-ink-2">
            <li>Your answers to the questions.</li>
            <li>An age group, a role and a school level, as bands.</li>
            <li>The date and time, and a random code for this browser.</li>
          </ul>
        </div>

        <div className="mt-4 border-t border-rule pt-4">
          <p className="font-display text-ui font-semibold text-ink">What is never asked</p>
          <ul className="mt-2 flex max-w-[56ch] list-disc flex-col gap-1 pl-5 text-sec text-ink-2">
            <li>Your name, your email or your phone number.</li>
            <li>Your school, your town or your date of birth.</li>
            <li>Your exact age. The age question is a band, and the youngest band
              covers everyone 19 and under, so answering it says nothing about
              whether you are over or under 18.</li>
          </ul>
        </div>

        <p className="note mt-4 max-w-[56ch]">
          One question takes a written answer. Keep it to the app: a few words about
          what would put you off is all it wants, and please leave yourself and
          anyone else out of it.
        </p>

        <div className="mt-6">
          <Button ref={ref} type="button" onClick={start}>Start the survey</Button>
        </div>
      </div>
    </div>
  )
}

export default NameGate
