import React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/utils'

import { useMode } from '../../lib/mode'
import { ROLE_LABEL, SETTINGS, signOut, useAccount } from '../store'
import { Avatar } from '../ui'
import { VIEWER } from '../viewer'

// Menu button pattern: arrows walk the items, Home and End jump, Escape and Tab close.
// The list is portalled to <body> so it sits above the z-40 top and tab bars.
export const MENU_PRIVACY = { student: 'shared', parent: 'privacy', pro: 'app-pro-privacy', other: 'privacy' }

function goToAnchor(go, view, anchor, reduce) {
  go(view)
  let tries = 0
  const look = () => {
    const el = document.getElementById(anchor)
    if (el) {
      el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
      return
    }
    if (tries++ < 30) setTimeout(look, 50)
  }
  setTimeout(look, 60)
}

function itemsFor(me, go, reduce, toSite) {
  const site = { id: 'site', label: 'Return to site',
    run: toSite || (() => go('site')) }
  if (!me) {
    return [
      { id: 'signin', label: 'Sign in or create an account', run: () => go('app-home') },
      { id: 'help', label: 'Get help', run: () => go('help') },
      site,
    ]
  }
  return [
    { id: 'profile', label: 'Profile', run: () => go('account') },
    { id: 'network', label: 'Network', run: () => go('network') },
    { id: 'privacy', label: 'Privacy and sharing',
      run: () => go(MENU_PRIVACY[me.role] || 'privacy') },
    { id: 'passcode', label: 'Password and sign-in', run: () => go('account/passcode') },
    { id: 'appearance', label: 'Appearance',
      run: () => goToAnchor(go, 'account', 'set-appearance', reduce) },
    { id: 'notify', label: 'Reminders', run: () => go('app-notify'), only: 'student' },
    { id: 'data', label: 'Your data', run: () => go('account/data') },
    { id: 'help', label: 'Get help', run: () => go('help') },
    site,
  ].filter(i => !i.only || i.only === me.role)
}

// Under the button, right edges aligned, kept 8px inside the window.
function place(btn) {
  if (!btn) return null
  const r = btn.getBoundingClientRect()
  const vw = window.innerWidth
  const width = Math.min(288, vw - 16)
  const right = Math.max(8, vw - r.right)
  return { top: r.bottom + 6, right, width, maxHeight: Math.max(200, window.innerHeight - r.bottom - 20) }
}

export function AccountMenu({ go, app, toSite, className }) {
  const me = useAccount()
  const [mode] = useMode()
  const reduce = useReducedMotion()
  const [open, setOpen] = React.useState(false)
  const [pos, setPos] = React.useState(null)
  const btn = React.useRef(null)
  const list = React.useRef(null)
  const refs = React.useRef([])
  const startAt = React.useRef(0)
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')

  const items = itemsFor(me, go, reduce, toSite)
  const all = me
    ? [...items, { id: 'signout', label: 'Sign out', run: () => { signOut(); go('app-home') } }]
    : items

  const close = React.useCallback((refocus = true) => {
    setOpen(false)
    if (refocus) requestAnimationFrame(() => btn.current?.focus())
  }, [])

  function openAt(index) {
    startAt.current = index
    setPos(place(btn.current))
    setOpen(true)
  }

  React.useEffect(() => {
    if (!open) return
    const i = startAt.current < 0 ? all.length - 1 : startAt.current
    const t = requestAnimationFrame(() => refs.current[i]?.focus())
    return () => cancelAnimationFrame(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const down = e => {
      if (list.current?.contains(e.target) || btn.current?.contains(e.target)) return
      close(false)
    }
    const move = () => setPos(place(btn.current))
    document.addEventListener('pointerdown', down)
    window.addEventListener('resize', move)
    window.addEventListener('scroll', move, { passive: true })
    return () => {
      document.removeEventListener('pointerdown', down)
      window.removeEventListener('resize', move)
      window.removeEventListener('scroll', move)
    }
  }, [open, close])

  React.useEffect(() => { setOpen(false) }, [me?.id])

  function onButtonKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); openAt(0) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); openAt(-1) }
  }

  function onListKey(e) {
    const n = all.length
    const at = refs.current.findIndex(el => el === document.activeElement)
    let to = null
    if (e.key === 'ArrowDown') to = at < 0 ? 0 : (at + 1) % n
    else if (e.key === 'ArrowUp') to = at < 0 ? n - 1 : (at - 1 + n) % n
    else if (e.key === 'Home') to = 0
    else if (e.key === 'End') to = n - 1
    else if (e.key === 'Escape') { e.preventDefault(); close(true); return }
    else if (e.key === 'Tab') { e.preventDefault(); close(true); return }
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      /* Type-ahead: the next item starting with that letter. */
      const k = e.key.toLowerCase()
      for (let s = 1; s <= n; s++) {
        const j = (Math.max(at, 0) + s) % n
        if (all[j].label.toLowerCase().startsWith(k)) { to = j; break }
      }
    }
    if (to == null) return
    e.preventDefault()
    refs.current[to]?.focus()
  }

  function choose(item) {
    setOpen(false)
    item.run()
  }

  const setting = me?.role === 'pro' ? SETTINGS.find(s => s.value === me.setting)?.label : null
  const viewer = !me && mode === 'demo' ? VIEWER[app] : null
  const btnId = uid + 'b', menuId = uid + 'm'

  const popup = (
    <AnimatePresence>
      {open && pos && (
        <motion.div ref={list} key="menu"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -2 }}
          transition={{ duration: reduce ? 0.1 : 0.16, ease: [0.23, 1, 0.32, 1] }}
          style={{ top: pos.top, right: pos.right, width: pos.width, maxHeight: pos.maxHeight, transformOrigin: 'top right' }}
          onKeyDown={onListKey}
          className="fixed z-[70] overflow-y-auto overscroll-contain rounded-panel border border-ink-3 bg-card
            shadow-raise">
          {me ? (
            <div className="flex items-center gap-3 border-b border-rule bg-paper px-3.5 py-3">
              <Avatar name={me.name} avatar={me.avatar} size="lg" className="size-12"/>
              <div className="min-w-0">
                <p className="truncate font-display text-row font-bold leading-tight text-ink">{me.name}</p>
                <p className="text-fine leading-snug text-ink-3">
                  {ROLE_LABEL[me.role]}{setting ? `, ${setting}` : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-b border-rule bg-paper px-3.5 py-3">
              <Avatar name={viewer?.name} avatar={viewer?.avatar} size="lg" className="size-12"/>
              <div className="min-w-0">
                <p className="font-display text-ui font-bold leading-tight text-ink">{viewer ? viewer.name : 'Not signed in'}</p>
                <p className="text-fine text-ink-3">{viewer ? 'Demo, not signed in' : mode === 'demo' ? 'Looking at the demo' : 'Live mode'}</p>
              </div>
            </div>
          )}
          <ul id={menuId} role="menu" aria-labelledby={btnId} className="m-0 list-none p-1.5">
            {all.map((item, i) => {
              const last = item.id === 'signout'
              return (
                <React.Fragment key={item.id}>
                  {last && <li role="separator" className="mx-2 my-1.5 h-px bg-rule"/>}
                  <li role="none">
                    <button type="button" role="menuitem" tabIndex={-1}
                      ref={el => { refs.current[i] = el }}
                      onClick={() => choose(item)}
                      className={cn('flex min-h-[44px] w-full items-center gap-3 rounded-field px-2 py-1.5',
                        'text-left font-display text-ui font-medium text-ink outline-none',
                        'transition-colors duration-100 hoverOnly:bg-mist/70 focus-visible:bg-mist',
                        'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset active:bg-mist')}>
                      <span className="min-w-0 flex-1">{item.label}</span>
                    </button>
                  </li>
                </React.Fragment>
              )
            })}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <button ref={btn} id={btnId} type="button"
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        aria-label={me ? `Account menu, ${me.name}` : 'Account menu'}
        onClick={() => (open ? close(false) : openAt(0))}
        onKeyDown={onButtonKey}
        className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-field transition-colors',
          'duration-150 hoverOnly:bg-mist', open && 'bg-mist', className)}>
        <Avatar name={me?.name || viewer?.name} avatar={me ? me.avatar : viewer?.avatar} size="sm"/>
      </button>
      {typeof document !== 'undefined' && createPortal(popup, document.body)}
    </>
  )
}
