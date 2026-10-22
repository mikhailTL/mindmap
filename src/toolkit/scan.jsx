import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import { ActivityScreen, Choice } from './shell'
import { DidItWork } from './after'
import { useGame, GameBar, Pops, LevelMeter, EndCard, FillRing, SPRING, SOFT, useSvgId } from './game'

const REGIONS = [
  { id:'feet',      name:'Feet',      say:'Notice your feet on the floor. Let them rest.',   tip:'Press your feet softly into the floor next time. It helps you feel settled.' },
  { id:'legs',      name:'Legs',      say:'Notice your legs. Let them feel heavy.',           tip:'Next time, let your legs feel heavy on the chair for a few breaths.' },
  { id:'belly',     name:'Belly',     say:'Notice your belly. Let it rise as you breathe in.', tip:'Next time, put a hand on your belly and let it rise and fall.' },
  { id:'chest',     name:'Chest',     say:'Notice your chest. Feel it rise and fall.',        tip:'Next time, try a slow breath out, longer than the breath in.' },
  { id:'hands',     name:'Hands',     say:'Notice your hands. Let your fingers open.',        tip:'Next time, open your hands and rest them on your legs.' },
  { id:'shoulders', name:'Shoulders', say:'Notice your shoulders. Breathe out and let them drop.', tip:'Next time, start with your shoulders. A long breath out helps them drop.' },
  { id:'face',      name:'Face',      say:'Notice your face. Soften your jaw and eyes.',      tip:'Next time, let your teeth part a little. It softens the jaw.' },
]
const PACES = [
  { id:'quick',  name:'Quick',  secs:10 },
  { id:'steady', name:'Steady', secs:15 },
  { id:'slow',   name:'Slow',   secs:25 },
]
const NEXT_PAUSE = 1100

// Front view outline, one path drawn clockwise from the top of the head.
const BODY = [
  'M60 4', 'C72 4 78 12 78 22', 'C78 30 72 38 66 40', 'L66 48',
  'C82 50 94 54 98 66', 'C101 82 104 100 106 118', 'C107 126 104 132 100 132',
  'C96 132 93 127 93 120', 'C92 104 90 86 88 70', 'C88 90 86 110 87 128',
  'C88 150 86 180 84 212', 'C84 222 86 230 82 232', 'L66 232', 'C64 228 64 220 64 212',
  'C64 190 62 160 60 136', 'C58 160 56 190 56 212', 'C56 220 56 228 54 232', 'L38 232',
  'C34 230 36 222 36 212', 'C34 180 32 150 33 128', 'C34 110 32 90 32 70',
  'C30 86 28 104 27 120', 'C27 127 24 132 20 132', 'C16 132 13 126 14 118',
  'C16 100 19 82 22 66', 'C26 54 38 50 54 48', 'L54 40', 'C48 38 42 30 42 22',
  'C42 12 48 4 60 4', 'Z',
].join(' ')

const SHAPES = {
  feet:      [[0, 208, 120, 30]],
  legs:      [[0, 132, 120, 76]],
  belly:     [[34, 100, 52, 32]],
  chest:     [[34, 66, 52, 34]],
  hands:     [[0, 64, 34, 72], [86, 64, 34, 72]],
  shoulders: [[0, 40, 120, 26]],
  face:      [[0, 0, 120, 40]],
}
// Marker position per part, in figure units.
const MARK = { feet:[60, 222], legs:[60, 170], belly:[60, 116], chest:[60, 83], hands:[20, 120], shoulders:[60, 52], face:[60, 22] }

function Figure({ cur = null, done = [], tense = null, className, reduced }) {
  const id = useSvgId('scan')
  const parts = Object.entries(SHAPES)
  return (
    <svg viewBox="-6 -6 132 252" aria-hidden focusable="false" className={cn('block select-none overflow-visible', className)}>
      <defs>
        <clipPath id={id + 'c'}><path d={BODY}/></clipPath>
        <linearGradient id={id + 'b'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3faf6"/><stop offset="1" stopColor="#dcefe6"/>
        </linearGradient>
        <linearGradient id={id + 'on'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor:'var(--g-main)' }}/><stop offset="1" style={{ stopColor:'var(--g-ink)' }}/>
        </linearGradient>
        <radialGradient id={id + 'g'}>
          <stop offset="0" style={{ stopColor:'var(--g-main)' }} stopOpacity="0.55"/>
          <stop offset="1" style={{ stopColor:'var(--g-main)' }} stopOpacity="0"/>
        </radialGradient>
      </defs>
      {cur && (
        <circle cx={MARK[cur][0]} cy={MARK[cur][1]} r={cur === 'legs' ? 58 : 44} fill={`url(#${id}g)`}
          className={reduced ? undefined : 'g-breathe'}/>
      )}
      <path d={BODY} fill={`url(#${id}b)`}/>
      <g clipPath={`url(#${id}c)`}>
        {parts.map(([pid, rects]) => rects.map(([x, y, w, h], k) => {
          const isCur = pid === cur
          const isDone = done.includes(pid)
          if (!isCur && !isDone && pid !== tense) return null
          return (
            <g key={pid + k}>
              {isDone && !isCur && <rect x={x} y={y} width={w} height={h} style={{ fill:'var(--g-main)', opacity:0.32 }}/>}
              {pid === tense && <rect x={x} y={y} width={w} height={h} fill="#f2702a" opacity="0.55"/>}
              {isCur && <rect x={x} y={y} width={w} height={h} fill={`url(#${id}on)`}/>}
              {isCur && !reduced && <rect x={x} y={y} width={w} height={h} fill="#ffffff" className="g-throb"/>}
            </g>
          )
        }))}
        {[40, 66, 100, 132, 208].map(y => (
          <path key={y} d={`M0 ${y}H120`} stroke="#ffffff" strokeWidth="1.6" strokeDasharray="3 4" opacity="0.9"/>
        ))}
      </g>
      <path d={BODY} fill="none" stroke="#0d2b1e" strokeWidth="2.4" strokeLinejoin="round"/>
      {cur && (
        <g transform={`translate(${MARK[cur][0]} ${MARK[cur][1]})`}>
          <circle r="7.5" fill="#ffffff" stroke="#0d2b1e" strokeWidth="2.2"/>
          <circle r="3.2" style={{ fill:'var(--g-ink)' }}/>
        </g>
      )}
      {done.filter(d => d !== cur).map(d => (
        <g key={d} transform={`translate(${MARK[d][0]} ${MARK[d][1]})`}>
          <circle r="6.5" style={{ fill:'var(--g-ink)' }} stroke="#ffffff" strokeWidth="1.6"/>
          <path d="M-3 0l2 2.2L3.2-2.4" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      ))}
    </svg>
  )
}

function Steps({ i, done }) {
  return (
    <ol className="flex gap-1" aria-label="Parts of the body">
      {REGIONS.map((r, k) => {
        const on = k === i, got = done.includes(r.id)
        return (
          <li key={r.id} className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_#d6e3db]">
            <motion.span className="absolute inset-0 origin-left rounded-full"
              style={{ background: got ? 'var(--g-ink)' : 'var(--g-main)' }}
              initial={false} animate={{ scaleX: got || on ? 1 : 0, opacity: got ? 1 : on ? 0.55 : 0 }} transition={SOFT}/>
            <span className="sr-only">{r.name}{got ? ', done' : on ? ', now' : ''}</span>
          </li>
        )
      })}
    </ol>
  )
}

const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

export default function BodyScan() {
  const g = useGame('scan')
  const [stage, setStage] = React.useState('idle')     // idle | play | check | done
  const [pace, setPace] = React.useState('steady')
  const [i, setI] = React.useState(0)
  const [t, setT] = React.useState(0)                   // seconds into this part
  const [paused, setPaused] = React.useState(false)
  const [between, setBetween] = React.useState(false)   // a part just finished
  const [done, setDone] = React.useState([])
  const [full, setFull] = React.useState(0)              // parts held for the whole ring
  const [tense, setTense] = React.useState(null)
  const [secs, setSecs] = React.useState(0)
  const tRef = React.useRef(0)
  const total = React.useRef(0)
  const box = React.useRef(null)
  const timer = React.useRef(0)
  React.useEffect(() => () => clearTimeout(timer.current), [])

  const P = PACES.find(p => p.id === pace) || PACES[1]
  const region = REGIONS[Math.min(i, REGIONS.length - 1)]
  const last = i >= REGIONS.length - 1

  const popAt = () => {
    const [x, y] = MARK[region.id]
    const b = box.current?.getBoundingClientRect(), sv = box.current?.querySelector('svg')?.getBoundingClientRect()
    return b && sv ? { x:(sv.left - b.left + (x + 6) / 132 * sv.width) / b.width * 100,
                       y:(sv.top - b.top + (y + 6) / 252 * sv.height) / b.height * 100 - 4 } : {}
  }

  const go = React.useCallback(k => {
    clearTimeout(timer.current)
    if (k >= REGIONS.length) { setStage('check'); return }
    setI(k); tRef.current = 0; setT(0); setBetween(false); g.cue('turn')
  }, [g.cue]) // eslint-disable-line react-hooks/exhaustive-deps

  // `whole` is true when the ring filled (10 points) and false for Next region (5 points).
  const complete = React.useCallback(whole => {
    if (between) return
    setDone(d => d.includes(region.id) ? d : [...d, region.id])
    if (whole) { setFull(n => n + 1); g.add(10, { ...popAt(), sound:'good', label:`${region.name}` }) }
    else g.add(5, popAt())
    if (last) { setBetween(true); return }
    if (whole) { setBetween(true); timer.current = setTimeout(() => go(i + 1), NEXT_PAUSE) }
    else go(i + 1)
  }, [between, region, last, i, go, g.add]) // eslint-disable-line react-hooks/exhaustive-deps
  const completeRef = React.useRef(complete); completeRef.current = complete

  React.useEffect(() => {
    if (stage !== 'play' || paused || between) return
    let id = 0, prev = performance.now()
    const tick = now => {
      const dt = Math.min(0.1, (now - prev) / 1000); prev = now
      tRef.current += dt; total.current += dt
      setT(g.reduced ? Math.floor(tRef.current) : tRef.current)
      if (tRef.current >= P.secs) { setT(P.secs); completeRef.current(true); return }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [stage, paused, between, i, P.secs, g.reduced])

  const start = () => {
    clearTimeout(timer.current)
    g.reset(); setI(0); tRef.current = 0; total.current = 0; setT(0); setDone([]); setFull(0)
    setTense(null); setPaused(false); setBetween(false); setStage('play'); g.cue('turn')
  }
  const next = () => {
    if (between) { if (last) { setStage('check') } else go(i + 1); return }
    complete(false)
    if (last) setStage('check')
  }
  const endEarly = () => { clearTimeout(timer.current); setSecs(total.current); setStage('done'); g.finish({ complete:false }) }
  const answer = id => {
    setTense(id); setSecs(total.current)
    setStage('done')
    g.finish({ complete:true })
  }

  const left = Math.max(0, Math.ceil(P.secs - t))
  const stars = full >= REGIONS.length ? 3 : full >= 4 ? 2 : 1
  const tenseRegion = REGIONS.find(r => r.id === tense)

  return (
    <ActivityScreen family="pool" title="Body Scan">
      <div style={g.vars} className="mx-auto w-full max-w-[56rem]">

        {stage === 'idle' && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:items-center">
            <div className="relative rounded-[22px] border border-rule p-4 shadow-card"
              style={{ background:'radial-gradient(120% 80% at 50% 10%, #ffffff 0%, var(--g-wash) 100%)' }}>
              <Figure cur="feet" className="mx-auto h-[300px] w-auto lg:h-[420px]" reduced={g.reduced}/>
              <p className="absolute left-4 top-4 font-display text-fine font-bold text-ink-2">Starts here</p>
            </div>
            <div>
              <p className="font-display text-row font-bold tracking-tight text-ink">Relax seven body parts, feet to face</p>
              <ol className="mt-3 space-y-2.5">
                {['The glowing part is the one to notice.',
                  'Read the line and breathe slowly while the ring fills.',
                  'The scan moves on by itself. Tap Next region to go sooner.'].map((s, k) => (
                  <li key={k} className="flex items-start gap-3">
                    <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full font-display text-fine font-bold text-white"
                      style={{ background:'var(--g-ink)' }}>{k + 1}</span>
                    <span className="pt-0.5 text-sec text-ink">{s}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 font-display text-ui font-bold text-ink">Time for each part</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {PACES.map(o => (
                  <Choice key={o.id} on={pace === o.id} onClick={() => setPace(o.id)}
                    className="flex-col justify-center gap-0 px-2 py-1.5 text-center">
                    <span className="block">{o.name}</span>
                    <span className="block text-fine font-normal">{o.secs} seconds</span>
                  </Choice>
                ))}
              </div>
              <Button className="mt-4 w-full" onClick={start}>Start the scan</Button>
              <p className="mt-2 text-fine text-ink-2">Skip any part you like. You only notice each part. No need to tense anything.</p>
              <LevelMeter className="mt-5"/>
              <DidItWork tool="scan" phase="before" className="mt-4"/>
            </div>
          </div>
        )}

        {stage === 'play' && (
          <>
            <GameBar game={g} className="mb-2">
              <span className="font-display text-ui font-semibold tabular-nums text-ink-2">
                Part {i + 1} of {REGIONS.length}
              </span>
            </GameBar>
            <Steps i={i} done={done}/>
            <div ref={box} className="relative mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3
              rounded-[22px] border border-rule p-3 shadow-card sm:gap-6 sm:p-5"
              style={{ background:'radial-gradient(120% 80% at 30% 10%, #ffffff 0%, var(--g-wash) 100%)' }}>
              <Figure cur={region.id} done={done} reduced={g.reduced}
                className="mx-auto h-[290px] w-auto sm:h-[380px] lg:h-[440px]"/>
              <div className="text-center">
                <FillRing value={t / P.secs} ring={g.ring} still={g.reduced} className="mx-auto w-full max-w-[11rem]">
                  <AnimatePresence mode="wait" initial={false}>
                    {between ? (
                      <motion.svg key="tick" viewBox="0 0 24 24" className="mx-auto size-14" aria-hidden
                        initial={g.reduced ? false : { scale:0, rotate:-45 }} animate={{ scale:1, rotate:0 }} transition={SPRING}>
                        <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" strokeWidth="3.2" strokeLinecap="round"
                          strokeLinejoin="round" style={{ stroke:'var(--g-ink)' }}/>
                      </motion.svg>
                    ) : (
                      <motion.p key="secs" className="font-display text-dial font-bold tabular-nums text-ink"
                        initial={g.reduced ? false : { opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}>
                        {left}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <p className="font-display text-fine font-semibold text-ink-2">{between ? 'done' : paused ? 'paused' : 'seconds'}</p>
                </FillRing>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p key={region.id} className="mt-3 font-display text-head font-bold tracking-tight text-ink"
                    initial={g.reduced ? false : { opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                    exit={g.reduced ? undefined : { opacity:0, y:-10 }} transition={{ duration:0.22 }}>
                    {region.name}
                  </motion.p>
                </AnimatePresence>
              </div>
              <Pops game={g}/>
            </div>

            <div className="mt-3 rounded-[18px] p-4" style={{ background:'var(--g-wash)' }}>
              <p className="font-display text-fine font-bold uppercase tracking-[0.1em]" style={{ color:'var(--g-ink)' }}>
                {between ? (last ? 'Last part done' : 'Moving on') : 'Do this now'}
              </p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p key={region.id + between} aria-live="polite" className="mt-1 font-display text-row font-bold leading-snug text-ink"
                  initial={g.reduced ? false : { opacity:0, x:14 }} animate={{ opacity:1, x:0 }}
                  exit={g.reduced ? undefined : { opacity:0, x:-14 }} transition={{ duration:0.22 }}>
                  {between ? (last ? 'Tap Finish.' : `Next: ${REGIONS[i + 1].name.toLowerCase()}.`) : region.say}
                </motion.p>
              </AnimatePresence>
            </div>

            <motion.div className="mt-3" animate={between && last && !g.reduced ? { scale:[1, 1.04, 1] } : { scale:1 }}
              transition={between && last ? { duration:1.2, repeat:Infinity } : { duration:0.2 }}>
              <Button className="w-full" onClick={next}>
                {last ? 'Finish' : 'Next region'}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden><path d="M9 5.5l6.5 6.5L9 18.5"/></svg>
              </Button>
            </motion.div>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <Button variant="outline" size="sm" disabled={between} onClick={() => setPaused(v => !v)}>
                {paused ? 'Resume' : 'Pause'}
              </Button>
              <Button variant="outline" size="sm" onClick={endEarly}>End scan</Button>
            </div>
          </>
        )}

        {stage === 'check' && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:items-center">
            <div className="rounded-[22px] border border-rule p-4 shadow-card"
              style={{ background:'radial-gradient(120% 80% at 50% 10%, #ffffff 0%, var(--g-wash) 100%)' }}>
              <Figure done={done} tense={tense} className="mx-auto h-[220px] w-auto lg:h-[380px]" reduced={g.reduced}/>
            </div>
            <div>
              <p className="font-display text-fine font-bold uppercase tracking-[0.1em]" style={{ color:'var(--g-ink)' }}>Quick check in</p>
              <h3 className="mt-1 font-display text-head font-bold tracking-tight text-ink">Which part felt most tense?</h3>
              <p className="mt-1 text-sec text-ink-2">Tap one. It only shows on your results.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {REGIONS.map((r, k) => (
                  <motion.div key={r.id} initial={g.reduced ? false : { opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                    transition={{ ...SOFT, delay:k * 0.04 }}>
                    <Choice className="w-full justify-center" onClick={() => answer(r.id)}>{r.name}</Choice>
                  </motion.div>
                ))}
                <Choice className="w-full justify-center" onClick={() => answer('none')}>None of them</Choice>
              </div>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <EndCard game={g} stars={g.result?.complete === false ? 0 : stars}
            title={full >= REGIONS.length ? 'Whole body scanned' : g.result?.complete === false ? 'Scan paused here' : 'Scan done'}
            stats={[['Parts done', `${done.length} of ${REGIONS.length}`],
                    ['Full rings', `${full} of ${REGIONS.length}`],
                    ['Most tense', tenseRegion ? tenseRegion.name : tense === 'none' ? 'None' : 'Not said'],
                    ['Time', mmss(secs)]]}
            onAgain={start}>
            {tenseRegion && (
              <div className="flex items-center gap-3 rounded-[16px] border border-rule p-3" style={{ background:'#fff4ec' }}>
                <Figure tense={tenseRegion.id} className="h-24 w-auto shrink-0" reduced={g.reduced}/>
                <p className="text-sec text-ink"><b className="font-display">{tenseRegion.name}.</b> {tenseRegion.tip}</p>
              </div>
            )}
            <DidItWork tool="scan" phase="after" className="mt-3"/>
          </EndCard>
        )}
      </div>
    </ActivityScreen>
  )
}
