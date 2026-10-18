import React from 'react'
import { ActivityScreen, Sheet, Choice, Action } from '../../toolkit/shell'
import { useReduced } from '../../toolkit/useReduced'
import { Label } from './common'

/* Grounding Timer: 5-4-3-2-1 run out loud with a teen in session.
 *
 * The clinician reads the line, the teen names things, and the clinician taps
 * once for each one named. A step moves on when its count is full or its time
 * runs out. Three slow breaths close it. Nothing is recorded. */

const STEPS = [
  { n:5, sense:'see',   say:'Look around. Name five things you can see.' },
  { n:4, sense:'feel',  say:'Name four things you can feel. Your feet, the chair.' },
  { n:3, sense:'hear',  say:'Listen. Name three things you can hear.' },
  { n:2, sense:'smell', say:'Name two things you can smell, or like the smell of.' },
  { n:1, sense:'taste', say:'Name one thing you can taste, or like the taste of.' },
  { n:3, sense:'breath', say:'Three slow breaths. In through the nose, long out.' },
]
const PACES = [[20, '20 seconds'], [30, '30 seconds'], [45, '45 seconds']]

function Ring({ left, total, children }) {
  const R = 54, C = 2 * Math.PI * R
  const f = total ? left / total : 0
  return (
    <div className="relative mx-auto size-[220px] sm:size-[260px]">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden focusable="false">
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--kit-tint)" strokeWidth="9"/>
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--kit-deep)" strokeWidth="9"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - f)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}/>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function GroundingTimer({ onBack }) {
  const reduced = useReduced()
  const [pace, setPace] = React.useState(30)
  const [at, setAt] = React.useState(0)
  const [left, setLeft] = React.useState(30)
  const [named, setNamed] = React.useState(0)
  const [running, setRunning] = React.useState(false)
  const done = at >= STEPS.length
  const step = STEPS[Math.min(at, STEPS.length - 1)]

  const next = React.useCallback(() => {
    setAt(a => a + 1); setNamed(0); setLeft(pace)
  }, [pace])

  React.useEffect(() => {
    if (!running || done) return
    const t = setInterval(() => setLeft(l => l - 1), 1000)
    return () => clearInterval(t)
  }, [running, done])

  React.useEffect(() => { if (running && left <= 0) next() }, [left, running, next])
  React.useEffect(() => { if (done) setRunning(false) }, [done])

  const restart = () => { setAt(0); setNamed(0); setLeft(pace); setRunning(false) }
  const tapNamed = () => {
    const k = named + 1
    if (k >= step.n) next(); else setNamed(k)
  }

  return (
    <ActivityScreen id="pro-ground" title="Grounding Timer" onBack={onBack}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Sheet className="text-center">
          {done ? (
            <div className="py-10">
              <p className="font-display text-head font-bold text-ink">Done.</p>
              <p className="mt-2 text-sec text-ink-2">Ask how that was, in one word.</p>
              <Action className="mt-6" onClick={restart}>Run it again</Action>
            </div>
          ) : (
            <>
              <p className="kit-ink font-display text-ui font-bold">
                Step {at + 1} of {STEPS.length}
              </p>
              <p className="mx-auto mt-2 max-w-[30ch] font-display text-head font-bold leading-snug text-ink">
                “{step.say}”
              </p>
              <div className="mt-5">
                <Ring left={left} total={pace}>
                  <div>
                    <p className="font-display text-dial font-bold tabular-nums text-ink">{step.n - named}</p>
                    <p className="mt-1 text-fine font-semibold text-ink-2">
                      {step.sense === 'breath' ? 'breaths left' : 'left to name'}
                    </p>
                    <p className="mt-2 text-fine tabular-nums text-ink-3">{Math.max(0, left)} s</p>
                  </div>
                </Ring>
              </div>
              <div className="mt-3 flex justify-center gap-2" aria-hidden>
                {Array.from({ length: step.n }, (_, i) => (
                  <span key={i} className={'size-3.5 rounded-full ' + (i < named ? 'kit-fill' : 'kit-ground')}
                    style={reduced ? undefined : { transition: 'background-color .2s' }}/>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {running ? (
                  <>
                    <Action className="min-w-[11rem]" onClick={tapNamed}>
                      {step.sense === 'breath' ? 'One breath' : 'Named one'}
                    </Action>
                    <Action kind="quiet" onClick={() => setRunning(false)}>Pause</Action>
                  </>
                ) : (
                  <Action className="min-w-[11rem]" onClick={() => setRunning(true)}>
                    {at === 0 && left === pace && named === 0 ? 'Start' : 'Resume'}
                  </Action>
                )}
                <Action kind="quiet" onClick={next}>Next step</Action>
              </div>
              {(at > 0 || named > 0) && (
                <button type="button" onClick={restart}
                  className="mt-4 min-h-[48px] px-3 font-display text-ui font-semibold text-ink-2 underline
                    underline-offset-4 hoverOnly:text-ink">Start over</button>
              )}
            </>
          )}
        </Sheet>

        <Sheet>
          <Label>Time per step</Label>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {PACES.map(([s, label]) => (
              <Choice key={s} on={pace === s}
                onClick={() => { setPace(s); if (!running) setLeft(s) }}>{label}</Choice>
            ))}
          </div>
          <Label className="mt-6">How to run it</Label>
          <ol className="m-0 mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-sec text-ink-2">
            <li>Read each line aloud, slowly.</li>
            <li>Tap once for each thing they name.</li>
            <li>Allow pauses. The timer moves on by itself.</li>
            <li>Any answer counts.</li>
          </ol>
          <p className="note mt-4">Nothing here is saved.</p>
        </Sheet>
      </div>
    </ActivityScreen>
  )
}
