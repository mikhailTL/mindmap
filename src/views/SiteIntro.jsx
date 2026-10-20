import React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'
import { LogoMark } from '../ui/logo'
import { PatchFront } from '../charts/patch-front'
import { RainbowDial } from '../charts/rainbow'
import { studentRings } from '../lib/readings'
import { AvatarArt } from '../account/avatars'
import { PRO_WRAP } from '../lib/terms'

/* The site's onboarding. Three short beats, then the name. The owner: "it
 * needs to start with the rainbow and reduce text as much as possible". So
 * the Mind Score rainbow opens, then where the reading comes from, then who
 * sees it; one short line each and nothing under it. No questions and no sign in here:
 * roles and accounts are asked only when the visitor opens the app. Plays on
 * every load of the landing page and every time the visitor comes back to
 * it (App.jsx decides when); Skip sits under the stage the whole time, and
 * Escape is Skip. Reduced motion keeps the beats and drops the movement. */

const BEAT_MS = 2600
const BEATS = [
  { id: 'score',   line: 'Your stress, as one score.' },
  { id: 'patch',   line: 'Read by a patch or your phone.' },
  { id: 'network', line: 'Shared only with who you choose.' },
]
const FINAL = BEATS.length
const NAME_MS = 1800

/* ── the three pictures ─────────────────────────────────────────────────── */

function PatchPicture({ still }) {
  return (
    <div className="flex items-center justify-center gap-6 sm:gap-10">
      <div className="relative grid place-items-center">
        {!still && [0, 1].map(i => (
          <motion.span key={i} aria-hidden className="absolute rounded-full border-2 border-beam/50"
            style={{ width: 130, height: 130 }}
            initial={{ scale: 0.7, opacity: 0.7 }} animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.8, delay: i * 0.9, repeat: Infinity, ease: 'easeOut' }}/>
        ))}
        <PatchFront size={108} label="The MindMap patch"/>
      </div>
      <span className="font-display text-row font-bold text-ink-3">or</span>
      <motion.svg viewBox="0 0 70 120" aria-label="A phone" role="img" className="h-[120px] w-auto"
        initial={still ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
        <rect x="3" y="3" width="64" height="114" rx="12" className="fill-card stroke-ink" strokeWidth="2.5"/>
        <circle cx="35" cy="16" r="4" className="fill-ink"/>
        <path d="M12 66h12l5-12 7 24 6-16 4 4h12" fill="none" stroke="#e11919" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round"/>
      </motion.svg>
    </div>
  )
}

const RINGS = studentRings()

function ScorePicture({ still }) {
  const [score, setScore] = React.useState(still ? 38 : 50)
  React.useEffect(() => {
    if (still) return
    const id = setTimeout(() => setScore(38), 300)
    return () => clearTimeout(id)
  }, [still])
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <RainbowDial score={score} usual={46} rings={RINGS} size={300}/>
    </div>
  )
}

const PEOPLE = [
  { name: 'Elena', role: 'Parent', avatar: 'char-elena' },
  { name: 'Maya',  role: 'Teen',   avatar: 'char-maya', centre: true },
  { name: 'Dr. Shah', role: PRO_WRAP, avatar: 'char-shah' },
]

function NetworkPicture({ still }) {
  return (
    <div className="relative mx-auto flex w-full max-w-[340px] items-start justify-between">
      <svg aria-hidden viewBox="0 0 340 60" className="pointer-events-none absolute inset-x-0 top-[22px] h-[60px] w-full">
        {[[70, 150], [190, 270]].map(([a, b], i) => (
          <motion.path key={i} d={`M${a} 10 L${b} 10`} stroke="#157446" strokeWidth="3" strokeLinecap="round" fill="none"
            initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ delay: 0.3 + i * 0.35, duration: 0.5 }}/>
        ))}
      </svg>
      {PEOPLE.map((p, i) => (
        <motion.div key={p.name} className="relative flex w-[100px] flex-col items-center text-center"
          initial={still ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: p.centre ? 0 : 0.5 + i * 0.15, duration: 0.35 }}>
          <span className={cn('grid place-items-center rounded-full bg-card shadow-card',
            p.centre ? 'size-[64px] ring-2 ring-accent' : 'size-[52px]')}>
            <AvatarArt id={p.avatar} className={p.centre ? 'size-14' : 'size-11'}/>
          </span>
          <span className="mt-2 font-display text-ui font-bold leading-tight text-ink">{p.role}</span>
        </motion.div>
      ))}
    </div>
  )
}

const PICTURE = { patch: PatchPicture, score: ScorePicture, network: NetworkPicture }

/* ── the overlay ────────────────────────────────────────────────────────── */

/** SiteIntro({ onDone }): onDone runs on Skip, Escape, or the end. */
export function SiteIntro({ onDone }) {
  const reduced = useReducedMotion()
  const [beat, setBeat] = React.useState(0)
  const skipRef = React.useRef(null)
  const headId = React.useId()

  /* The beats advance on their own; the name holds a moment, then the
     site is there. */
  React.useEffect(() => {
    const id = beat >= FINAL ? setTimeout(onDone, NAME_MS) : setTimeout(() => setBeat(b => b + 1), BEAT_MS)
    return () => clearTimeout(id)
  }, [beat, onDone])

  /* Modal: page scroll locked, Escape is Skip, focus starts on Skip. */
  React.useEffect(() => {
    const was = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    skipRef.current?.focus({ preventScroll: true })
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); onDone() } }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = was }
  }, [onDone])

  const final = beat >= FINAL
  const B = BEATS[Math.min(beat, FINAL - 1)]
  const Picture = PICTURE[B.id]
  const fade = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={headId}
      className="fixed inset-0 z-[400] flex flex-col overflow-y-auto overscroll-contain
        bg-[radial-gradient(ellipse_at_50%_0%,theme(colors.aqua.DEFAULT),theme(colors.paper)_62%)]">
      <div className="mx-auto flex w-full max-w-[34rem] flex-1 flex-col items-center justify-center px-5 py-8 text-center">
        <AnimatePresence mode="wait" initial={false}>
          {!final ? (
            <motion.div key={B.id} {...fade} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex w-full flex-col items-center">
              <div className="flex min-h-[210px] w-full items-center justify-center sm:min-h-[230px]">
                <Picture still={reduced}/>
              </div>
              <h2 id={headId} aria-live="polite"
                className="m-0 mt-6 max-w-[22ch] font-display text-[1.6rem] font-bold leading-[1.15] tracking-tight text-ink sm:text-[2rem]">
                {B.line}
              </h2>
            </motion.div>
          ) : (
            <motion.div key="final" {...fade} transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              className="flex w-full flex-col items-center">
              <LogoMark className="block h-auto w-[84px] text-accent [--logo-peak:theme(colors.beam.DEFAULT)]"/>
              <p className="m-0 mt-3 font-display text-[2.4rem] font-bold leading-none tracking-[-0.02em] text-ink">
                Mind<span className="text-accent">Map</span>
              </p>
              <h2 id={headId} className="m-0 mt-2 font-display text-row font-semibold text-ink-2">Making your stress readable.</h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Where the visitor is, and the way out, under the stage. */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div aria-hidden className="flex gap-2">
            {[...BEATS, { id: 'end' }].map((b, i) => (
              <span key={b.id} className={cn('h-1.5 rounded-full transition-all duration-300',
                i === beat ? 'w-6 bg-accent' : i < beat ? 'w-1.5 bg-accent/60' : 'w-1.5 bg-ink/15')}/>
            ))}
          </div>
          <button ref={skipRef} type="button" onClick={onDone}
            className="min-h-[44px] rounded-field px-5 font-display text-ui font-semibold text-ink-2 underline
              decoration-rule underline-offset-4 transition-colors duration-150 hoverOnly:text-ink">
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
