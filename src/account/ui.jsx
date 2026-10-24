import React from 'react'
import { cn } from '../lib/utils'
import { Check, Chevron, Person } from '../ui/marks'
import { ROLE_LABEL, useAccount } from './store'
import { AVATARS, AvatarArt } from './avatars'
import { GROUPS, PHOTO_MAX, ROLE_PICKS, avatarEntry, avatarWords, initialsOf, isPhotoAvatar } from './avatar-catalog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import './appearance'

export const field = cn(
  'mt-1 block min-h-[44px] w-full rounded-field border border-rule bg-card px-3',
  'font-display text-ui text-ink transition-colors duration-150 ease',
  'hoverOnly:border-ink-3 focus:border-accent focus:outline-none',
)

export const fieldError = 'border-crit'

export function Avatar({ name, avatar = null, size = 'md', className }) {
  const letter = initialsOf(name)
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

const M = ({ children, size = 20, className }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={cn('shrink-0', className)}>{children}</svg>
)
export const ShuffleMark = p => <M {...p}><path d="M3.5 7h3.5c5 0 5 10 10 10h3.5M17.5 14l3 3-3 3M3.5 17h3.5c1.6 0 2.7-1 3.6-2.4M13.4 9.4C14.3 8 15.4 7 17 7h3.5M17.5 4l3 3-3 3"/></M>
export const SearchMark  = p => <M {...p}><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></M>
export const TextMark    = p => <M {...p}><path d="M3.5 18.5l4.5-12 4.5 12M5.2 14h5.6M14 18.5l3.2-8 3.3 8M15.1 15.8h4.3"/></M>
export const ShieldMark  = p => <M {...p}><path d="M12 3.5l7 2.5v5.5c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6z"/><path d="M9 12l2.2 2.2L15.5 10"/></M>
export const HelpMark    = p => <M {...p}><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2-2.4 3.6M12 16.8h.01"/></M>
export const CameraMark  = p => <M {...p}><path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3v10H4z"/><circle cx="12" cy="13" r="3.4"/></M>
export const LinkMark    = p => <M {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/></M>

const PICK_GROUPS = GROUPS.map(g => ({ ...g, items: AVATARS.filter(a => a.group === g.id) }))
const groupOf = id => avatarEntry(id)?.group || PICK_GROUPS[0].id

// A radiogroup with a roving tab stop: arrows move in two directions, Home and End jump, a press chooses.
function PictureGrid({ items, value, onChange, name, label }) {
  const refs = React.useRef([])
  const gridRef = React.useRef(null)
  const at = Math.max(0, items.findIndex(a => a.id === value))
  const [focus, setFocus] = React.useState(at)
  React.useEffect(() => { setFocus(at) }, [at, items])
  function cols() {
    try { return getComputedStyle(gridRef.current).gridTemplateColumns.split(' ').length || 1 } catch { return 1 }
  }
  function onKey(e) {
    const last = items.length - 1
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols(), ArrowUp: -cols() }[e.key]
    let to = null
    if (step) to = Math.min(last, Math.max(0, focus + step))
    else if (e.key === 'Home') to = 0
    else if (e.key === 'End') to = last
    if (to == null) return
    e.preventDefault()
    setFocus(to)
    refs.current[to]?.focus()
  }
  if (!items.length) return <p className="py-3 text-fine text-ink-3">No picture matches that word.</p>
  return (
    <div ref={gridRef} role="radiogroup" aria-label={label} onKeyDown={onKey}
      className="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-1.5">
      {items.map((a, i) => {
        const on = value === a.id
        return (
          <button key={a.id || 'none'} type="button" role="radio" aria-checked={on}
            aria-label={a.id ? a.label : 'Your initials'} title={a.id ? a.label : 'Your initials'}
            ref={el => { refs.current[i] = el }}
            tabIndex={i === focus ? 0 : -1}
            onFocus={() => setFocus(i)}
            onClick={() => onChange(a.id)}
            className={cn('relative grid aspect-square min-h-[48px] w-full place-items-center rounded-chip',
              'border-2 transition-colors duration-150',
              on ? 'border-accent bg-accent-wash' : 'border-transparent hoverOnly:border-rule')}>
            <Avatar name={name || 'A'} avatar={a.id} size="md" className="size-11"/>
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

export const usesPhoto = role => role !== 'student'

// Two components rather than one with a branch, so a role change does not reorder hooks.
export function AvatarPicker({ role = 'student', ...props }) {
  return usesPhoto(role) ? <PhotoPicker role={role} {...props}/> : <DrawingPicker {...props}/>
}

function DrawingPicker({ value, onChange, name, label = 'Your picture', className, actions = null }) {
  const [tab, setTab] = React.useState(() => groupOf(value))
  const [q, setQ] = React.useState('')
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const chosen = value ? avatarEntry(value) : null
  const term = q.trim().toLowerCase()
  const found = term ? AVATARS.filter(a => avatarWords(avatarEntry(a.id)).includes(term)) : null
  function random() {
    const pool = AVATARS.filter(a => a.id !== value)
    const next = pool[Math.floor(Math.random() * pool.length)]
    setQ(''); setTab(next.group); onChange(next.id)
  }
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={name || 'A'} avatar={value} size="lg" className="size-16"/>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-ui font-bold text-ink" aria-live="polite">
            {chosen ? chosen.label : 'Your initials'}
          </p>
          <p className="text-fine text-ink-3">
            {chosen ? GROUPS.find(g => g.id === chosen.group)?.label : 'No picture chosen'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={random} className={outline}>
            <ShuffleMark size={18}/>Random
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className={cn(outline, 'px-3')}>
              Use initials
            </button>
          )}
          {actions}
        </div>
      </div>
      <label htmlFor={uid + 'q'} className="mt-3 block font-display text-fine font-medium text-ink-2">
        Search {AVATARS.length} pictures
      </label>
      <div className="relative">
        <SearchMark size={18} className="pointer-events-none absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-ink-3"/>
        <input id={uid + 'q'} type="search" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Star, cat, pizza, stripes" autoComplete="off" spellCheck={false}
          className={cn(field, 'pl-9')}/>
      </div>

      {found ? (
        <div className="mt-3">
          <p className="mb-2 text-fine text-ink-3" role="status">
            {found.length === 1 ? '1 match' : `${found.length} matches`}
          </p>
          <PictureGrid items={found} value={value} onChange={onChange} name={name} label={label}/>
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList scroll aria-label="Picture groups" className="gap-x-5 border-rule">
            {PICK_GROUPS.map(g => (
              <TabsTrigger key={g.id} value={g.id} className="min-h-[44px] text-ui">
                {g.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {PICK_GROUPS.map(g => (
            <TabsContent key={g.id} value={g.id} className="mt-3">
              <PictureGrid items={g.items} value={value} onChange={onChange} name={name}
                label={`${label}: ${g.label}`}/>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

export function AvatarChooser({ value, onChange, name, role = 'student', open: startOpen = false, className }) {
  const [open, setOpen] = React.useState(startOpen)
  const panel = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const chosen = value ? avatarEntry(value) : null
  const btn = React.useRef(null)
  const moved = React.useRef(false)
  React.useEffect(() => { if (moved.current) btn.current?.focus() }, [open])
  const toggle = (
    <button ref={btn} type="button" aria-expanded={open} aria-controls={panel}
      onClick={() => { moved.current = true; setOpen(o => !o) }}
      className={outline}>
      {open ? 'Done' : usesPhoto(role) ? 'Photo or initials' : 'Choose a picture'}
      <Chevron aria-hidden className={cn('size-4 transition-transform duration-150', open ? '-rotate-90' : 'rotate-90')}/>
    </button>
  )
  return (
    <div id={panel} className={className}>
      {open ? (
        <AvatarPicker role={role} value={value} onChange={onChange} name={name} actions={toggle}/>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name={name || 'A'} avatar={value} size="lg"/>
          <span className="min-w-0 flex-1 font-display text-ui font-medium leading-tight text-ink-2">
            {isPhotoAvatar(value) ? 'Your photo' : chosen ? chosen.label : 'Your initials'}
          </span>
          {toggle}
        </div>
      )}
    </div>
  )
}

// A 160px square JPEG data URL, cropped from the centre and slightly above it, where a face usually is.
async function photoFromFile(file) {
  if (!file || !/^image\//.test(file.type)) throw new Error('type')
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const w = img.naturalWidth, h = img.naturalHeight, side = Math.min(w, h)
    const c = document.createElement('canvas')
    c.width = c.height = 160
    c.getContext('2d').drawImage(img, (w - side) / 2, (h - side) * 0.3, side, side, 0, 0, 160, 160)
    for (const q of [0.85, 0.7, 0.5]) {
      const d = c.toDataURL('image/jpeg', q)
      if (d.length <= PHOTO_MAX && isPhotoAvatar(d)) return d
    }
    throw new Error('size')
  } finally {
    URL.revokeObjectURL(url)
  }
}

const PHOTO_HINT = {
  pro: 'A clear, professional photo. Your initials show until you add one.',
}

const PICKS = Object.fromEntries(Object.entries(ROLE_PICKS).map(([role, ids]) =>
  [role, ids.map(id => ({ id, label: avatarEntry(id)?.label || id }))]))

function PhotoPicker({ role, value, onChange, name, className, actions = null }) {
  const uid = 'ph' + React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const [err, setErr] = React.useState(null)
  const photo = isPhotoAvatar(value)
  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try { onChange(await photoFromFile(file)); setErr(null) }
    catch { setErr('That file did not work. Try a JPEG or PNG photo.') }
  }
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={name || 'A'} avatar={value} size="lg" className="size-16"/>
        <div className="min-w-0 flex-1">
          <p className="font-display text-ui font-bold text-ink" aria-live="polite">
            {photo ? 'Your photo' : value ? 'Your picture' : 'Your initials'}
          </p>
          {!value && PHOTO_HINT[role] && <p className="text-fine text-ink-3">{PHOTO_HINT[role]}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input id={uid} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick}
          aria-describedby={err ? uid + 'e' : undefined} className="peer sr-only"/>
        <label htmlFor={uid} className={cn(solid, 'cursor-pointer peer-focus-visible:outline',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent')}>
          <CameraMark size={18}/>{photo ? 'Change photo' : role === 'pro' ? 'Upload a professional photo' : 'Upload a photo'}
        </label>
        {value && (
          <button type="button" onClick={() => { onChange(null); setErr(null) }} className={outline}>Use initials</button>
        )}
        {actions}
      </div>
      {err && <p id={uid + 'e'} role="alert" className="mt-2 font-display text-fine font-medium text-crit">{err}</p>}
      {PICKS[role] && (
        <div className="mt-3 max-w-[8rem]">
          <PictureGrid items={PICKS[role]} value={value} onChange={v => { onChange(v); setErr(null) }}
            name={name} label="Or pick a picture"/>
        </div>
      )}
    </div>
  )
}

export function Row({ label, hint, onClick, aside, className }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('flex min-h-[56px] w-full items-center gap-3 border-t border-rule px-4 py-3',
        'text-left transition-colors duration-150 ease first:border-t-0 hoverOnly:bg-mist/50',
        'active:bg-mist/50', className)}>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-ui font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-fine text-ink-3">{hint}</span>}
      </span>
      {aside && <span className="shrink-0 font-display text-fine font-bold text-ink-3">{aside}</span>}
      <Chevron aria-hidden className="size-4 shrink-0 text-ink-3"/>
    </button>
  )
}

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

export { AccountMenu } from './menu/AccountMenu'

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
