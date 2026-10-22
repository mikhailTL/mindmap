import React from 'react'
import { Button } from '../ui/button'
import { setVisitor } from './store'
import { cn } from '../lib/utils'

// Consent panel shown before the first answer. No name field; Escape starts the survey, so focus is not trapped.
export function NameGate({ onDone, inline = false }) {
  const ref = React.useRef(null)

  // Autofocus only as a full-page overlay; inline it would scroll past the heading being read.
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
