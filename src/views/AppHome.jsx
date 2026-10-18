import React from 'react'
import { cn } from '../lib/utils'
import { LogoMark } from '../ui/logo'
import { Cross } from '../ui/marks'
import { useAccount, signOut } from '../account/store'
import { solid, outline } from '../account/ui'
import { captureHarness } from './Intro'
import { getAppearance } from '../account/appearance'
import { IntroOverlay, END, T, prog } from './apphome/intro'
import { AuthPanel } from './apphome/AuthPanel'
import { setMode, setGuest } from '../lib/mode'
import { PRO } from '../lib/terms'

/* The owner fills this in. Plain text; a blank line starts a new paragraph. */
export const ABOUT_TEXT = `Inspiration and function of MindMap. Text coming soon.`

/* Owner, 18 October: "a wellness app for teenagers" in place of the old motto. */
const MOTTO = 'A wellness app for teenagers'
/* The app's front page: the mark, the motto, About, and the way in. Plays its
   opening every time the page is opened or refreshed, signed in or out (the
   owner, 17 October), with Skip under it; reduced motion and the screenshot
   harness get the last frame. */
/* `#/app-home?demo` is where the site's "View the demo" lands: the opening
   always plays (motion settings allowing), and the way in is a choice of
   the three screens on demo data instead of the sign in form. */
const isDemo = () => typeof location !== 'undefined' && /[?&]demo\b/.test(location.hash)

const DEMO = [
  { id:'app-student', label:'Student' },
  { id:'app-parent',  label:'Parent' },
  { id:'app-pro',     label:PRO },
]

function DemoPanel({ go, onSignIn }) {
  return (
    <div className="w-full rounded-panel border border-rule bg-card p-4 text-left shadow-card sm:p-5">
      <h2 className="m-0 font-display text-row font-bold text-ink">Demo Mode</h2>
      <p className="m-0 mt-1 text-fine text-ink-2">No account needed. Pick a view:</p>
      <div className="mt-3.5 grid gap-2.5">
        {DEMO.map((d, i) => (
          <button key={d.id} type="button" onClick={() => { setMode('demo'); setGuest(true); go(d.id) }}
            className={cn(i === 0 ? solid : outline, 'w-full')}>{d.label}</button>
        ))}
      </div>
      <button type="button" onClick={onSignIn}
        className="mt-3 min-h-[44px] w-full font-display text-fine font-medium text-ink-2 underline
          decoration-rule underline-offset-4 hoverOnly:text-ink">
        Sign in or create an account instead
      </button>
    </div>
  )
}

function shouldPlay() {
  if (captureHarness()) return false
  try { if (getAppearance().motion === 'reduce') return false } catch {}
  try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false } catch {}
  return true
}

function useClock(play) {
  const [t, setT] = React.useState(play ? 0 : END)
  const raf = React.useRef(0)
  React.useEffect(() => {
    if (!play) return
    const start = performance.now()
    const tick = now => {
      const e = now - start
      setT(e >= END ? END : e)
      if (e < END) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [play])
  const skip = React.useCallback(() => { cancelAnimationFrame(raf.current); setT(END) }, [])
  return [t, skip]
}

function AboutDialog({ open, onClose }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal?.()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="apphome-about-title"
      onClick={e => { if (e.target === ref.current) onClose() }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-panel border border-rule bg-card p-0
        text-left text-ink shadow-lift backdrop:bg-ink/45">
      <div className="flex items-center gap-3 border-b border-rule py-2 pl-5 pr-2">
        <h2 id="apphome-about-title" className="m-0 font-display text-row font-bold text-ink">About MindMap</h2>
        <button type="button" onClick={onClose} aria-label="Close"
          className="ml-auto grid size-11 place-items-center rounded-field text-ink-2 hoverOnly:bg-mist hoverOnly:text-ink">
          <Cross className="size-4"/>
        </button>
      </div>
      <div className="px-5 py-5">
        {ABOUT_TEXT.split(/\n\s*\n/).map((p, i) => (
          <p key={i} className="m-0 mt-3 max-w-[56ch] text-sec text-ink-2 first:mt-0">{p.trim()}</p>
        ))}
      </div>
    </dialog>
  )
}

export function AppHome({ go }) {
  const me = useAccount()
  const [play] = React.useState(shouldPlay)
  const [t, skip] = useClock(play)
  const done = t >= END
  const [about, setAbout] = React.useState(false)
  const [demo, setDemo] = React.useState(isDemo)

  /* Where the real mark sits, so the trace lands on it exactly. */
  const markRef = React.useRef(null)
  const [box, setBox] = React.useState(null)
  const [size, setSize] = React.useState({ w: 0, h: 0 })
  React.useLayoutEffect(() => {
    if (done) return
    const measure = () => {
      const r = markRef.current?.getBoundingClientRect()
      if (r) setBox({ left: r.left, top: r.top, width: r.width })
      setSize({ w: window.innerWidth, h: window.innerHeight })
    }
    measure()
    window.scrollTo(0, 0)
    const was = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    addEventListener('resize', measure)
    const onKey = e => { if (e.key === 'Escape') skip() }
    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('resize', measure)
      removeEventListener('keydown', onKey)
      document.body.style.overflow = was
    }
  }, [done, skip])

  /* Each block after the mark rises in on its own beat. */
  const rise = i => {
    if (done) return undefined
    const k = prog(t, T.reveal + i * 110, T.reveal + i * 110 + 450)
    return { opacity: k, transform: `translateY(${(1 - k) * 10}px)` }
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center overflow-hidden
      bg-[radial-gradient(ellipse_at_50%_0%,theme(colors.aqua.DEFAULT),theme(colors.paper)_62%)] px-4">
      <div className="my-auto flex w-full max-w-[24rem] flex-col items-center py-10 text-center sm:py-14">
        {/* Hidden until the trace lands on it; the overlay draws it till then. */}
        <span ref={markRef} className={cn('block w-[92px] [--logo-peak:theme(colors.beam.DEFAULT)] sm:w-[112px]',
          !done && 'opacity-0')}>
          <LogoMark className="block h-auto w-full text-accent"/>
        </span>
        <h1 style={rise(0)}
          className="m-0 mt-3 font-display text-stat font-bold tracking-[-0.02em] text-ink">
          Mind<span className="text-accent">Map</span>
        </h1>
        <p style={rise(1)} className="m-0 mt-2 font-body text-meta text-ink-2">{MOTTO}</p>
        <button type="button" style={rise(2)} onClick={() => setAbout(true)}
          className="mt-3 min-h-[44px] px-3 font-display text-ui font-bold text-accent-ink underline
            decoration-accent/50 decoration-2 underline-offset-[5px] hoverOnly:decoration-accent">
          About
        </button>

        <div style={rise(3)} className="mt-4 w-full">
          {demo ? (
            <DemoPanel go={go} onSignIn={() => { setDemo(false); history.replaceState(null, '', '#/app-home') }}/>
          ) : me ? (
            <div className="w-full rounded-panel border border-rule bg-card p-4 shadow-card sm:p-5">
              <p className="m-0 font-display text-ui font-medium text-ink-2">
                Signed in as <span className="font-bold text-ink">{me.name}</span>
              </p>
              <div className="mt-3.5 grid gap-2.5">
                <button type="button" onClick={() => go('app')} className={cn(solid, 'w-full')}>Continue</button>
                <button type="button" onClick={() => signOut()} className={cn(outline, 'w-full')}>Sign out</button>
              </div>
            </div>
          ) : (
            <>
              {/* Demo Mode, first (owner, 18 October): the demo and nothing
                  else. Live screens still ask for an account, so it cannot
                  reach real data. Stored as the guest flag (lib/mode.js). */}
              <button type="button"
                onClick={() => { setMode('demo'); setGuest(true); setDemo(true); history.replaceState(null, '', '#/app-home?demo') }}
                className="mb-3 flex min-h-[52px] w-full items-center justify-between gap-3 rounded-panel border-[1.5px]
                  border-dashed border-accent/60 bg-accent-wash/60 px-4 text-left transition-colors duration-150
                  hoverOnly:border-accent hoverOnly:bg-accent-wash">
                <span>
                  <span className="block font-display text-ui font-bold text-ink">Demo Mode</span>
                  <span className="block text-fine text-ink-2">View the demo only. No account.</span>
                </span>
                <span aria-hidden className="font-display text-ui font-bold text-accent-ink">→</span>
              </button>
              <AuthPanel go={go}/>
            </>
          )}
        </div>

        <div style={rise(4)} className="mt-6 flex flex-col items-center gap-1">
          <button type="button" onClick={() => go('site')}
            className="min-h-[44px] px-3 font-display text-fine font-medium text-ink-2 underline
              decoration-rule underline-offset-4 hoverOnly:text-ink">
            Visit the MindMap website
          </button>
          <p className="m-0 text-fine text-ink-3">MindMap is not a medical device and gives no diagnosis.</p>
        </div>
      </div>

      {!done && <IntroOverlay t={t} box={box} size={size} onSkip={skip}/>}
      <AboutDialog open={about} onClose={() => setAbout(false)}/>
    </main>
  )
}
