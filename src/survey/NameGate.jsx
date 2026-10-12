import React from 'react'
import { Button } from '../ui/button'
import { setVisitor } from './store'
import { cn } from '../lib/utils'

const MAX = 60

/* The consent panel, asked once. States what is collected and who reads it
 * before anything is collected, and gives declining a name equal weight to
 * giving one.
 *
 * Deliberately not a dialog role and not a focus trap: it is the first thing on
 * the page with nothing behind it to escape back to. Esc takes the Skip path,
 * the same as the button, so it cannot lose work. */
export function NameGate({ onDone }) {
  const [name, setName] = React.useState('')
  const [error, setError] = React.useState(null)
  const ref = React.useRef(null)

  React.useEffect(() => { ref.current?.focus() }, [])

  const finish = value => {
    setVisitor(value)
    onDone?.()
  }

  const submit = e => {
    e?.preventDefault()
    const clean = name.trim()
    /* The button stays enabled and explains the refusal; a disabled button
     * with no message blames the reader silently. */
    if (!clean) {
      setError('Type a name, or skip and stay anonymous.')
      ref.current?.focus()
      return
    }
    if (clean.length > MAX) {
      setError(`That is ${clean.length} characters. Sixty is the limit, and a first name is plenty.`)
      ref.current?.focus()
      return
    }
    finish(clean)
  }

  const over = name.trim().length > MAX

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-paper/95 p-5"
      onKeyDown={e => { if (e.key === 'Escape') finish('') }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-[34rem] rounded-panel border border-rule bg-card p-6 shadow-lift sm:p-8"
      >
        {/* First person singular throughout: one student, not a team. */}
        <h2 className="font-display text-sub font-bold text-ink">What should I call you?</h2>

        <p className="mt-3 text-sec text-ink-2">
          I am Mikhail. I built this for a school project, and I am the only person who
          reads the names and the answers. Nothing else about you is collected.
        </p>

        <label htmlFor="namegate-field" className="mt-5 block font-display text-ui font-medium text-ink">
          Your name
        </label>
        <input
          id="namegate-field"
          ref={ref}
          value={name}
          onChange={e => { setName(e.target.value); if (error) setError(null) }}
          autoComplete="given-name"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'namegate-error' : 'namegate-hint'}
          placeholder="First name, nickname, anything"
          className={cn(
            'mt-2 block min-h-[54px] w-full rounded-field border bg-paper px-4',
            'font-body text-sec text-ink placeholder:text-ink-3',
            'transition-[border-color,background-color] duration-150 ease-out',
            'hoverOnly:border-ink-3 focus:bg-card',
            error || over ? 'border-crit' : 'border-rule'
          )}
        />

        <div className="mt-2 flex items-baseline justify-between gap-4">
          {error
            ? <p id="namegate-error" role="alert" className="font-body text-note text-crit">{error}</p>
            : <p id="namegate-hint" className="note">Sixty characters or fewer.</p>}
          <span className={cn('text-fine tabular-nums', over ? 'text-crit' : 'text-ink-3')}>
            {name.trim().length}/{MAX}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Button type="submit">Start</Button>
          <Button type="button" variant="ghost" onClick={() => finish('')}>
            Skip and stay anonymous
          </Button>
        </div>
      </form>
    </div>
  )
}

export default NameGate
