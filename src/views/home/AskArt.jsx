import React from 'react'
import { cn } from '../../lib/utils'

// A question and the start of an answer, in the words each audience would use.
const LINES = {
  student: ['Why do tests stress me out so much?', 'Your body is getting ready to work. Want a 2-minute way to settle it?'],
  parent:  ['How do I ask about a rough day?', 'Start with what you noticed, then listen more than you talk.'],
  pro:     ['Who should I check in with first?', 'Start with the teens whose scores moved most this week.'],
}

export function AskArt({ who = 'student', className }) {
  const [q, a] = LINES[who] || LINES.student
  return (
    <span aria-hidden className={cn('flex w-full max-w-[232px] flex-col gap-1.5 text-left', className)}>
      <span className="max-w-[86%] self-end rounded-[12px] rounded-br-[4px] bg-white px-2.5 py-1.5 font-display
        text-[11.5px] font-semibold leading-[1.3] text-ink shadow-[0_4px_10px_-8px_rgba(13,43,30,.5)]">{q}</span>
      <span className="max-w-[92%] self-start rounded-[12px] rounded-bl-[4px] bg-accent px-2.5 py-1.5
        text-[11.5px] leading-[1.3] text-paper">{a}</span>
    </span>
  )
}
