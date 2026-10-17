import React from 'react'
import { Light } from '../signals/light.js'
import { seededBaseline } from './baseline.js'
import { useReduced } from '../toolkit/useReduced'
import {
  startTeen, headlessView, makeClock, pickParent, known, STAGGER_MS, LOOP_MS, PAUSE_MS,
} from './core'

/* Both teen engines and what the parent sees, for the page and for the panel
 * in the parent app. With `headless` the teen phones are not drawn and the
 * engines run against the stand-in view; otherwise the drawn phones register
 * their views on `views.texting` and `views.scrolling` before the loops start.
 * Starts on mount, loops forever, stops on unmount. */

const VIEW_METHODS = [
  'key', 'send', 'typing', 'receive', 'go', 'fresh', 'showBanner', 'hideBanner', 'pressAction',
  'openSheet', 'pick', 'startActivity', 'reaction', 'walk', 'endCard', 'showBack', 'pressBack',
  'closeSheet', 'freeze', 'mark',
]
const proxy = ref => Object.fromEntries(VIEW_METHODS.map(n => [n, (...a) => ref.current?.[n]?.(...a)]))

const PARENT_BANNER_MS = 7000
const LABEL_LINGER_MS = 500

export function useHeadsUp({ headless = false } = {}) {
  const reduced = useReduced()
  const clock = React.useMemo(() => makeClock(), [])
  const viewT = React.useRef(null), viewS = React.useRef(null)
  const sessT = React.useRef(null), sessS = React.useRef(null)
  const [lives, setLives] = React.useState({ texting: null, scrolling: null })
  const [callouts, setCallouts] = React.useState({ texting: null, scrolling: null })

  React.useEffect(() => {
    const baseline = seededBaseline()
    const timers = new Set()
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn() }, ms); timers.add(id) }
    const phones = [['texting', viewT, sessT, 0], ['scrolling', viewS, sessS, STAGGER_MS]].map(([kind, vref, sref, offset]) => {
      const view = headless ? headlessView(kind, () => sref.current) : proxy(vref)
      const p = startTeen({
        kind, baseline, clock, view, offset, period: LOOP_MS,
        onState: live => setLives(l => ({ ...l, [kind]: live })),
        onCallout: c => {
          const id = `${c.key}-${Date.now()}`
          setCallouts(x => ({ ...x, [kind]: { ...c, id } }))
          later(() => setCallouts(x => (x[kind]?.id === id ? { ...x, [kind]: null } : x)), PAUSE_MS + LABEL_LINGER_MS)
        },
      })
      sref.current = p.session
      return p
    })
    return () => { phones.forEach(p => p.stop()); timers.forEach(clearTimeout) }
  }, [headless, clock])

  /* the parent: the higher of the two lights, and that phone's signals */
  const pick = pickParent(lives.texting, lives.scrolling)
  const light = known(pick?.light)
  const today = Math.max(lives.texting?.index ?? 0, lives.scrolling?.index ?? 0)
  const at = light === Light.RED ? (pick?.state?.since ?? clock.now()) : null
  const signals = light === Light.GREEN ? [] : (pick?.signals || [])

  const [banner, setBanner] = React.useState(false)
  const prev = React.useRef(light)
  React.useEffect(() => {
    const was = prev.current
    prev.current = light
    if (light !== Light.RED) { setBanner(false); return }
    if (was === Light.RED) return
    setBanner(true)
    const id = setTimeout(() => setBanner(false), PARENT_BANNER_MS)
    return () => clearTimeout(id)
  }, [light])

  return {
    reduced, clock,
    views: { texting: viewT, scrolling: viewS },
    sessions: { texting: sessT, scrolling: sessS },
    teen: { texting: known(lives.texting?.light), scrolling: known(lives.scrolling?.light) },
    callouts,
    parent: { light, at, signals, today, banner },
  }
}
