import React from 'react'
import { Light } from '../signals/light.js'
import { seededBaseline } from './baseline.js'
import { useReduced } from '../toolkit/useReduced'
import { startTeen, headlessView, makeClock, pickParent, known } from './core'

/* Both teen engines and what the parent sees, for the page and for the panel
 * in the parent app. With `headless` the teen phones are not drawn and the
 * engines run against the stand-in view; otherwise the drawn phones register
 * their views on `views.texting` and `views.scrolling` before the loops start.
 * Starts on mount, loops forever, stops on unmount.
 *
 * The two phones take turns, strictly: a phone's turn starts only once the
 * other's scene is done, never on a clock, so a slow frame can never make the
 * two run at once. Owner, 18 Oct: the reel pauses while the texting plays,
 * and the other way round. `focus` is the phone whose scene is playing,
 * `phase` says where each one is (calm, stress, detected, done) and
 * `detected` lists the signals called out so far in the scene now playing.
 *
 * `beat` is the moment the page stops for: a signal's callout while its phone
 * pauses, or the parent's light while it is red. Null otherwise. */

const VIEW_METHODS = ['key', 'send', 'typing', 'receive', 'go', 'fresh', 'showBanner', 'hideBanner', 'freeze', 'mark']
const PLAYING = new Set(['calm', 'stress', 'detected'])
const proxy = ref => Object.fromEntries(VIEW_METHODS.map(n => [n, (...a) => ref.current?.[n]?.(...a)]))

const PARENT_BANNER_MS = 7000
/* the short gap between one phone's scene and the other's */
const GAP_MS = 1500
const SEED = { texting: 7, scrolling: 11 }

export function useHeadsUp({ headless = false } = {}) {
  const reduced = useReduced()
  const clock = React.useMemo(() => makeClock(), [])
  const viewT = React.useRef(null), viewS = React.useRef(null)
  const sessT = React.useRef(null), sessS = React.useRef(null)
  const [lives, setLives] = React.useState({ texting: null, scrolling: null })
  const [phase, setPhase] = React.useState({ texting: null, scrolling: null })
  const [detected, setDetected] = React.useState({ texting: [], scrolling: [] })
  const [cue, setCue] = React.useState(null)
  const cueTimer = React.useRef(0)

  React.useEffect(() => {
    const baseline = seededBaseline()
    const refs = { texting: [viewT, sessT], scrolling: [viewS, sessS] }
    let now = null, timer = 0, turn = 0, gone = false
    /* one scene on one phone; its own loop never comes round, the next turn
       is started from here when the scene is done */
    const play = kind => {
      const [vref, sref] = refs[kind]
      const view = headless ? headlessView(kind, () => sref.current) : proxy(vref)
      const p = startTeen({
        kind, baseline, clock, view, offset: 0, period: 1e9, seed: SEED[kind] + Math.floor(turn / 2),
        onState: live => setLives(l => ({ ...l, [kind]: live })),
        onPhase: m => {
          setPhase(x => ({ ...x, [kind]: m }))
          if (m === 'calm' || m === 'done') setDetected(x => ({ ...x, [kind]: [] }))
          if (m === 'done') { clearTimeout(timer); timer = setTimeout(next, GAP_MS) }
        },
        onCallout: c => {
          setDetected(x => (x[kind].includes(c.label) ? x : { ...x, [kind]: [...x[kind], c.label] }))
          /* the beat lasts as long as the phone's own pause */
          setCue({ kind, id: `${kind}-${c.key}-${c.until}` })
          clearTimeout(cueTimer.current)
          cueTimer.current = setTimeout(() => setCue(null), Math.max(0, c.until - Date.now()))
        },
      })
      sref.current = p.session
      now = p
    }
    const next = () => {
      if (gone) return
      now?.stop()
      turn++
      play(turn % 2 ? 'scrolling' : 'texting')
    }
    play('texting')
    return () => { gone = true; clearTimeout(timer); now?.stop(); clearTimeout(cueTimer.current); setCue(null) }
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

  const focus = ['texting', 'scrolling'].find(k => PLAYING.has(phase[k])) || null
  const beat = light === Light.RED ? { kind: 'parent', phone: focus, id: 'red' } : cue

  return {
    reduced, clock,
    views: { texting: viewT, scrolling: viewS },
    sessions: { texting: sessT, scrolling: sessS },
    teen: { texting: known(lives.texting?.light), scrolling: known(lives.scrolling?.light) },
    phase, detected,
    focus, beat,
    parent: { light, at, signals, today, banner },
  }
}
