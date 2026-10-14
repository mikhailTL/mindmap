import React from 'react'
import { cn } from '../lib/utils'
import { Check, Chevron, Person } from '../ui/marks'
import { ROLE_LABEL, useAccount } from './store'
import { AVATARS, AvatarArt } from './avatars'

/* The pieces the three account screens share. Same idiom as
   src/app/controls.jsx: a row is 56 tall, carries an icon, and says its state
   in a word. Nothing here reads a score. */

export const field = cn(
  'mt-1 block min-h-[44px] w-full rounded-field border border-rule bg-card px-3',
  'font-display text-ui text-ink transition-colors duration-150 ease',
  'hoverOnly:border-ink-3 focus:border-accent focus:outline-none',
)

export const fieldError = 'border-crit'

/* The chosen picture; with none, a circle with the first letter; signed out,
   the outline person mark. */
export function Avatar({ name, avatar = null, size = 'md', className }) {
  const letter = String(name || '').trim().charAt(0).toUpperCase()
  const box = size === 'lg' ? 'size-14 text-row' : size === 'sm' ? 'size-8 text-fine' : 'size-10 text-ui'
  if (avatar) return <AvatarArt id={avatar} className={cn(box, 'rounded-chip', className)}/>
  return (
    <span aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-chip font-display font-bold', box,
        letter ? 'bg-accent text-paper' : 'border border-ink-2 text-ink-2', className)}>
      {letter || <Person className="size-[55%]"/>}
    </span>
  )
}

/* The twelve pictures as a radiogroup, 44 square each. `none` is the
   initial circle. */
export function AvatarPicker({ value, onChange, name, label = 'Your picture', className }) {
  return (
    <div role="radiogroup" aria-label={label}
      className={cn('grid grid-cols-[repeat(auto-fill,minmax(46px,1fr))] gap-2', className)}>
      {[{ id: null }, ...AVATARS].map(a => {
        const on = value === a.id
        return (
          <button key={a.id || 'none'} type="button" role="radio" aria-checked={on}
            aria-label={a.id ? a.label : 'Your initial'}
            onClick={() => onChange(a.id)}
            className={cn('relative grid aspect-square min-h-[44px] w-full place-items-center rounded-chip',
              'border-2 transition-colors duration-150',
              on ? 'border-accent' : 'border-transparent hoverOnly:border-rule')}>
            <Avatar name={name || 'A'} avatar={a.id} size="md" className="size-9"/>
            {on && (
              <span aria-hidden className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center
                rounded-chip bg-accent text-paper">
                <Check className="size-2.5"/>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* A row with an icon and a chevron: the portal's sections and the way to the
   next screen. */
export function Row({ label, hint, Mark, onClick, aside, className }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('flex min-h-[56px] w-full items-center gap-3 border-t border-rule px-4 py-3',
        'text-left transition-colors duration-150 ease first:border-t-0 hoverOnly:bg-mist/50',
        'active:bg-mist/50', className)}>
      {Mark && (
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-field
          bg-accent-wash text-accent-ink">
          <Mark size={18}/>
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-ui font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-fine text-ink-3">{hint}</span>}
      </span>
      {aside && <span className="shrink-0 font-display text-fine font-bold text-ink-3">{aside}</span>}
      <Chevron aria-hidden className="size-4 shrink-0 text-ink-3"/>
    </button>
  )
}

/* A person on a network list: initial, name, role, and a status word. */
/* `role` false drops the second line: under a heading that already names
   the role, the row is the name alone. */
export function PersonRow({ person, status, hint, comma = false, role = true, children, className }) {
  return (
    <div className={cn('flex min-h-[56px] items-center gap-3 border-t border-rule px-4 py-2.5',
      'first:border-t-0', className)}>
      <Avatar name={person.name} avatar={person.avatar} size="sm"/>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-ui font-medium text-ink">{person.name}</span>
        {(role || hint) && (
          <span className="block text-fine text-ink-3">
            {role ? (person.role ? ROLE_LABEL[person.role] : 'Removed') : ''}
            {hint ? `${role ? (comma ? ', ' : ' · ') : ''}${hint}` : ''}
          </span>
        )}
      </span>
      {status && <span className="shrink-0 font-display text-fine font-bold text-ink-2">{status}</span>}
      {children}
    </div>
  )
}

/* A 44 square icon button with its name on the element. */
export function IconButton({ label, Mark, onClick, tone = 'plain', className }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={cn('grid size-11 shrink-0 place-items-center rounded-field border',
        'transition-colors duration-150 ease',
        tone === 'accent' ? 'border-accent-ink bg-accent text-paper hoverOnly:bg-accent-ink'
        : tone === 'crit' ? 'border-rule text-ink-2 hoverOnly:border-crit hoverOnly:text-crit'
        : 'border-rule bg-card text-ink-2 hoverOnly:bg-mist hoverOnly:text-ink', className)}>
      <Mark size={18}/>
    </button>
  )
}

/* The solid and the outline action. */
export const solid = cn(
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-field bg-accent px-4',
  'font-display text-ui font-medium text-paper transition-colors duration-150 ease',
  'hoverOnly:bg-accent-ink active:bg-accent-ink',
)
export const outline = cn(
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-field border border-ink-2',
  'bg-card px-4 font-display text-ui font-medium text-ink transition-colors duration-150 ease',
  'hoverOnly:bg-mist active:bg-mist',
)

/* Empty state, one line. */
export function Empty({ children }) {
  return <p className="px-4 py-4 text-fine text-ink-3">{children}</p>
}

/* The top bar's account button. Owned here so App.jsx mounts one element.
   Signed in: a circle with the initial; signed out: the outline mark. */
export function AccountButton({ go, className }) {
  const me = useAccount()
  return (
    <button type="button" aria-label="Account" title={me ? me.name : 'Account'}
      onClick={() => go(me ? 'account' : 'signin')}
      className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-field transition-colors',
        'duration-150 hoverOnly:bg-mist', className)}>
      <Avatar name={me?.name} avatar={me?.avatar} size="sm"/>
    </button>
  )
}
