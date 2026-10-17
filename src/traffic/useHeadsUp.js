import React from 'react'
import { Light } from '../signals/light.js'
import { seededBaseline } from './baseline.js'
import { useReduced } from '../toolkit/useReduced'
import {
  startTeen, headlessView, makeClock, pickParent, known, STAGGER_MS, LOOP_MS,
} from './core'

/* Both teen engines and what the parent sees, for the page and for the panel
 * in the parent app. With `headless` the teen phones are not drawn and the
 * engines run against the stand-in view; otherwise the drawn phones register
 * their views on `views.texting` and `views.scrolling` before the loops start.
 * Starts on mount, loops forever, stops on unmount.
 *
 * The two phones take turns. `focus` is the phone whose scene is playing,
 * `phase` says where each one is (calm, stress, detected, done) and
 * `detected` lists the signals called out so far in the scene now playing. */

const VIEW_METHODS = ['key', 'send', 'typing', 'receive', 'go', 'fresh', 'showBanner', 'hideBanner', 'freeze', 'mark']
const PLAYING = new Set(['calm', 'stress', 'detected'])
const proxy = ref => Object.fromEntries(VIEW_METHODS.map(n => [n, (...a) => ref.current?.[n]?.(...a)]))

const PARENT_BANNER_MS = 7000

export function useHeadsUp({ headless = false } = {}) {
  const reduced = useReduced()
  const clock = React.useMemo(() => makeClock(), [])
  const viewT = React.useRef(null), viewS = React.useRef(null)
  const sessT = React.useRef(null), sessS = React.useRef(null)
  const [lives, setLives] = React.useState({ texting: null, scrolling: null })
  const [phase, setPhase] = React.useState({ texting: null, scrolling: null })
  const [detected, setDetected] = React.useState({ texting: [], scrolling: [] })

  React.useEffect(() => {
    const baseline = seededBaseline()
    const phones = [['texting', viewT, sessT, 0], ['scrolling', viewS, sessS, STAGGER_MS]].map(([kind, vref, sref, offset]) => {
      const view = headless ? headlessView(kind, () => sref.current) : proxy(vref)
      const p = startTeen({
        kind, baseline, clock, view, offset, period: LOOP_MS,
        onState: live => setLives(l => ({ ...l, [kind]: live })),
        onPhase: m => {
          setPhase(x => ({ ...x, [kind]: m }))
          if (m === 'calm' || m === 'done') setDetected(x => ({ ...x, [kind]: [] }))
        },
        onCallout: c => setDetected(x => (x[kind].includes(c.label) ? x : { ...x, [kind]: [...x[kind], c.label] })),
      })
      sref.current = p.session
      return p
    })
    return () => phones.forEach(p => p.stop())
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
    phase, detected,
    focus: ['texting', 'scrolling'].find(k => PLAYING.has(phase[k])) || null,
    parent: { light, at, signals, today, banner },
  }
}
