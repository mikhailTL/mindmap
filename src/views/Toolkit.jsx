import React from 'react'

/* Teen Toolkit. Filled in by the toolkit pass; this file owns the route so the
   shell, the tab bar and the build do not wait on it.

   `who` is 'student' or 'parent'. The two share this shell and nothing else:
   a student is regulating themselves and a parent is helping somebody else,
   which are different activities, not one activity with different copy. */
export default function Toolkit({ who = 'student' }) {
  return (
    <div className="wrap">
      <h1 className="font-display font-bold tracking-tight text-ink">Toolkit</h1>
      <p className="mt-3 max-w-[52ch] text-body text-ink-2">
        {who === 'parent'
          ? 'Ways to help, when the week has run high.'
          : 'Things to try, right now.'}
      </p>
    </div>
  )
}
