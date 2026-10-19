import React from 'react'
import { ScrollRow } from '../ui/motion'

import { Headline, AllDetail, SeeDetails, Why } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { ArrowRight } from '../ui/marks'
import { Progress } from '../ui/progress'
import { Scale } from '../ui/radio-scale'
import { PatchNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { Diverge } from '../charts/diverge'
import { ITEMS, score, sentence, connectPatch } from '../lib/engine'
import { PhoneCheck } from './PhoneCheck'
import { MentalMirror } from './MentalMirror'
import { FACE_SECONDS } from '../signals/face'
import { BackBar, Stage, StageStyles } from './reading/stage'
import { ArtStyles, MirrorArt, PatchArt, SensorsArt, SurveyArt } from './reading/art'
import { takeReadingIntent } from './reading/intent'
import { SeeTrends } from './student/charts'
import { addReading, updateReading } from '../lib/readingLog'
import { SCORE, SCORE_RANGE } from '../lib/terms'
import { cn } from '../lib/utils'

/* Take a reading, in three local states on one screen: choose, sensors,
   survey. Entering a reading replaces the chooser. The step guide and its
   drawings belong to PhoneCheck, so they never sit on the chooser. */

const PANEL = 'rounded-panel border border-rule/60 bg-card'

/* One line per screen and its figures. Every figure is measured elsewhere:
   PPG_SECONDS plus VOICE_SECONDS is 45; ITEMS (lib/engine.js) holds the survey. */
const SCREENS = {
  sensors: {
    title: 'Camera and microphone',
    lede: `The phone measures your ${SCORE} instead of asking.`,
    facts: [['45', 'seconds of capture'], [SCORE_RANGE, SCORE], ['0', 'frames or audio kept']],
  },
  survey: {
    title: 'Survey',
    lede: 'Your answers become one number.',
    facts: [[String(ITEMS.length), 'scales to fill in'], [SCORE_RANGE, SCORE],
      ['1', 'score saved to your account']],
  },
  mirror: {
    title: 'Mental Mirror',
    lede: "Google's MediaPipe Face Landmarker maps 478 points on your face. Your pulse is read from skin colour.",
    facts: [[String(FACE_SECONDS), 'seconds of capture'], [SCORE_RANGE, SCORE], ['0', 'frames kept']],
  },
}

/* The four ways in, numbered 1 to 4. The owner, 19 October: the white cards
   with an icon tile, a badge and a button read as "the flat ai design", so
   each way is an isometric object on the page ground with its words beside
   it, and the number is set as type. */
const WAYS = [
  { id:'survey', title:'Survey', Art:SurveyArt, tag:'Start here',
    line:'Only needs this phone. Take it as often as you like.',
    fact:['60', 'seconds'],
    cta:'Answer',
    spec:[
      ['Takes', 'About a minute'],
      ['Reads', 'Tension, worry, mood, sleep, energy, focus, body and support'],
      ['Needs', 'Only this phone'],
    ],
    foot:'Your answers become one score. The score syncs to your account.' },
  { id:'mirror', title:'Mental Mirror', Art:MirrorArt,
    line:"Google's MediaPipe Face Landmarker maps 478 points on your face.",
    fact:[String(FACE_SECONDS), 'seconds'],
    cta:'Open the Mirror',
    spec:[
      ['Takes', `${FACE_SECONDS} seconds`],
      ['Reads', 'Blinks, brow, lips, eyes, small movements, and pulse from skin colour'],
      ['Needs', 'A front camera and good light'],
    ],
    foot:'Frames become numbers, then get deleted. Students only. The score syncs to your account.' },
  { id:'sensors', title:'Camera and microphone', Art:SensorsArt,
    line:'Put a fingertip on the lens, then speak.',
    fact:['45', 'seconds'],
    cta:'Start',
    spec:[
      ['Takes', '45 seconds'],
      ['Reads', 'Heart rate, beat variation, pitch and steadiness'],
      ['Needs', 'A camera and a microphone'],
    ],
    foot:'Frames and audio become numbers, then get deleted. The score syncs to your account.' },
  { id:'patch', title:'Connect a patch', Art:PatchArt,
    line:'The patch reads pulse, sweat, temperature and movement.',
    cta:'Connect',
    spec:[
      ['Takes', 'One pairing, then no setup'],
      ['Reads', 'Four signals, once a second'],
      ['Needs', 'A MindMap patch over Bluetooth'],
    ] },
]

/* Figures in a row: each a number over a short label, spaced, no rules. */
function Figures({ items, className }) {
  return (
    <span className={cn('flex flex-wrap gap-x-6 gap-y-2', className)}>
      {items.map(([value, label]) => (
        <span key={label} className="flex min-w-0 flex-col">
          <span className="font-display text-head font-bold tabular-nums leading-none text-accent-ink">
            {value}
          </span>
          <span className="mt-1 text-fine leading-tight text-ink-2">{label}</span>
        </span>
      ))}
    </span>
  )
}

function Spec({ rows }) {
  return (
    <dl className="m-0 mt-2.5 space-y-1.5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline gap-3">
          <dt className="w-[3.6rem] shrink-0 text-fine text-ink-3">{k}</dt>
          <dd className="m-0 min-w-0 flex-1 text-fine leading-[1.45] text-ink-2">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/* The number, set as type: light, large, beside the title. The list it sits
   in gives a screen reader the count, so it is hidden from the name. */
function Numeral({ n, className }) {
  return (
    <span aria-hidden className={cn('font-display font-light tabular-nums leading-none text-ink-3', className)}>
      {n}
    </span>
  )
}

/* A way in: the object, then its number, title, time, line and action. The
   action is the real button and its ::after covers the whole row, so the row
   is the tap target and the focus ring goes round all of it. The row lifts
   the object on hover (art.jsx). */
const Way = React.forwardRef(function Way({ n, way, onOpen, busy, label, children, after }, ref) {
  const { Art } = way
  const t = `way-${way.id}`
  return (
    <div className="group relative -mx-2 flex h-full items-start gap-3 rounded-panel p-2
      transition-colors duration-200 hoverOnly:bg-card/45 sm:items-center sm:gap-5 xl:flex-col
      xl:items-stretch xl:gap-1">
      <span className="mt-1 block w-[8.5rem] shrink-0 sm:mt-0 sm:w-[11rem] xl:w-full">
        <Art/>
      </span>
      <div className="flex min-w-0 flex-1 flex-col self-stretch sm:self-center xl:self-stretch xl:px-1 xl:pb-1">
        <h3 id={`${t}-t`} className="flex items-baseline gap-2.5 font-display !text-row font-bold
          !leading-tight text-ink sm:!text-head">
          <Numeral n={n} className="text-[1.75rem] sm:text-[2rem]"/>
          <span className="min-w-0">{way.title}</span>
        </h3>
        {(way.fact || way.tag) && (
          <p className="mt-1 flex flex-wrap gap-x-3 text-fine text-ink-2">
            {way.fact && <span className="tabular-nums">{`${way.fact[0]} ${way.fact[1]}`}</span>}
            {way.tag && <span className="font-display font-bold text-accent-ink">{way.tag}</span>}
          </p>
        )}
        <p className="mt-1.5 max-w-[38ch] text-meta leading-[1.45] text-ink-2">{way.line}</p>
        {children}
        <button ref={ref} type="button" onClick={onOpen} disabled={busy}
          aria-labelledby={`${t}-t ${t}-a`}
          className="mt-2 inline-flex min-h-[44px] items-center self-start xl:mt-auto xl:pt-2 gap-1.5 font-display text-ui font-bold
            text-accent-ink underline-offset-4 after:absolute after:inset-0 after:rounded-panel
            after:content-[''] focus-visible:!outline-none focus-visible:after:outline
            focus-visible:after:outline-2 focus-visible:after:outline-offset-2
            focus-visible:after:outline-accent groupHoverOnly:underline disabled:cursor-progress">
          <span id={`${t}-a`}>{label || way.cta}</span>
          <ArrowRight aria-hidden className="size-[1.05rem] transition-transform duration-200
            motion-safe:groupHoverOnly:translate-x-1"/>
        </button>
        {after}
      </div>
    </div>
  )
})

/* The three facts per way, behind one disclosure under the list: columns
   with a hairline on top and the same numbers, no boxes or icons. */
function Compare() {
  return (
    <SeeDetails label="Compare the four ways" className="mt-4 lg:mt-5">
      <div className="grid gap-x-8 gap-y-6 pt-1 sm:grid-cols-2 xl:grid-cols-4">
        {WAYS.map((way, i) => (
          <section key={way.id} className="border-t border-ink/15 pt-3">
            <h3 className="flex items-baseline gap-2 font-display !text-meta font-bold text-ink">
              <Numeral n={i + 1} className="text-[1.375rem]"/>
              {way.title}
            </h3>
            <Spec rows={way.spec}/>
            {way.foot && (
              <p className="mt-2.5 max-w-[44ch] text-fine leading-[1.4] text-ink-3">{way.foot}</p>
            )}
          </section>
        ))}
      </div>
    </SeeDetails>
  )
}

/* The top of a reading. Module level: an inner component would remount the
   back button out from under a keyboard. */
const ReadingHead = React.forwardRef(function ReadingHead({ id, onBack }, ref) {
  const s = SCREENS[id]
  return (
    <>
      <BackBar onBack={onBack}>Back</BackBar>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 ref={ref} tabIndex={-1} className="max-w-[26ch] font-display font-bold text-ink">
          {s.title}
        </h2>
        <Why label="What this reading measures">
          <p>{s.lede}</p>
          <Figures items={s.facts} className="mt-2"/>
        </Why>
      </div>
    </>
  )
})

export function CheckInBody({ go }){
  const [mode] = useMode()
  const resultRef = React.useRef(null)
  const [ans,setAns] = React.useState({})
  const [pair,setPair] = React.useState(null)
  const [busy,setBusy] = React.useState(false)
  const done = Object.keys(ans).length === ITEMS.length
  const r = done ? score(ans) : null
  const s = r ? sentence(r) : null
  const answered = Object.keys(ans).length

  const [screen, setScreen] = React.useState('choose')
  const [dir, setDir] = React.useState(null)
  const [said, setSaid] = React.useState('')
  const cards = React.useRef({})
  const head = React.useRef(null)
  const from = React.useRef(null)
  const firstPaint = React.useRef(true)
  /* True while this screen owns the history entry it pushed on entering a
     reading, so leaving consumes that entry. */
  const pushed = React.useRef(false)
  /* The survey's log entry: added once when the last answer lands, then kept
     in step if an answer changes. Each new start of the survey is a new
     reading: the answers clear and a new entry is made. */
  const logged = React.useRef(null)

  /* A fresh survey: no answers, and the next result is a new reading. */
  const restart = React.useCallback(() => { setAns({}); logged.current = null }, [])

  const open = React.useCallback(id => {
    if (id === 'survey') restart()
    from.current = id
    setDir('fwd'); setScreen(id)
    setSaid(`${SCREENS[id].title}, showing now`)
    /* The pushed entry makes browser back mean "out of this reading". */
    try {
      history.pushState({ reading: id }, '', location.hash || '#/check')
      pushed.current = true
    } catch { pushed.current = false }
  }, [restart])

  const leave = React.useCallback(() => {
    setDir('back'); setScreen('choose')
    setSaid('Four ways to take a reading, showing now')
    if (pushed.current) { pushed.current = false; history.back() }
  }, [])

  /* Escape and browser back both land on the chooser. Neither is listened
     for from the chooser itself. */
  React.useEffect(() => {
    if (screen === 'choose') return
    const onKey = e => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (e.target?.closest?.('[role="dialog"]')) return
      e.preventDefault(); leave()
    }
    const onPop = () => { pushed.current = false; setDir('back'); setScreen('choose') }
    document.addEventListener('keydown', onKey)
    addEventListener('popstate', onPop)
    return () => {
      document.removeEventListener('keydown', onKey)
      removeEventListener('popstate', onPop)
    }
  }, [screen, leave])

  /* A screen change starts at the top and focuses the new screen. Returning
     focuses the card that opened the reading, two frames after App's own
     popstate handler focuses #main. */
  React.useEffect(() => {
    if (firstPaint.current) { firstPaint.current = false; return }
    window.scrollTo(0, 0)
    if (screen !== 'choose') { head.current?.focus({ preventScroll:true }); return }
    const id = from.current
    from.current = null
    if (!id) return
    let b = 0
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => cards.current[id]?.focus({ preventScroll:true }))
    })
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b) }
  }, [screen])

  /* A link that has to land on a reading rather than on the chooser. */
  React.useEffect(() => {
    const want = takeReadingIntent()
    if (want === 'sensors' || want === 'survey' || want === 'mirror') open(want)
  }, [open])

  React.useEffect(() => {
    if (!done || !r) return
    if (!logged.current) {
      const e = addReading({ at: Date.now(), score: r.score, source: 'survey' })
      logged.current = e ? e.id : 'unsaved'
    } else if (logged.current !== 'unsaved') {
      updateReading(logged.current, { score: r.score })
    }
  }, [done, r?.score])

  // Answering the last item scrolls to the result; 260ms lets the card mount
  // and the layout settle before scrollIntoView measures.
  React.useEffect(() => {
    if (screen !== 'survey' || !done || !resultRef.current) return
    const t = setTimeout(() => resultRef.current?.scrollIntoView({ block:'start' }), 260)
    return () => clearTimeout(t)
  }, [done, screen])

  async function pairUp(){
    setBusy(true); setPair({ ok:null, msg:'Choosing a patch…' })
    setPair(await connectPatch()); setBusy(false)
  }

  const [survey, mirror, sensors, patch] = WAYS

  return (
    <>
      <StageStyles/>
      <ArtStyles/>
      <p aria-live="polite" className="sr-only text-sec">{said}</p>

      {screen === 'choose' && (
        <Stage dir={dir}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2 className="font-display font-bold text-ink">Take a reading</h2>
            <PatchNotice inline/>
          </div>

          {/* An ordered list: the owner, 18 October, could not tell there were
              four ways, so they are numbered 1 to 4. */}
          <ol className="m-0 mt-4 grid list-none gap-3 p-0 sm:gap-4 lg:mt-5 lg:grid-cols-2 lg:gap-x-8
            xl:grid-cols-4 xl:gap-x-5">
            <ScrollRow as="li" index={0} className="h-full">
              <Way n={1} ref={el => { cards.current.survey = el }} way={survey}
                onOpen={() => open('survey')}>
                <span className="mt-2.5 flex max-w-[22rem] items-center gap-3">
                  {/* aria-hidden: the figure beside it says the same. */}
                  <span aria-hidden className="block flex-1">
                    <Progress value={answered} max={ITEMS.length}/>
                  </span>
                  <span className="shrink-0 text-fine tabular-nums text-ink-2">
                    {`${answered} of ${ITEMS.length} answered`}
                  </span>
                </span>
              </Way>
            </ScrollRow>
            <ScrollRow as="li" index={1} className="h-full">
              <Way n={2} ref={el => { cards.current.mirror = el }} way={mirror}
                onOpen={() => open('mirror')}/>
            </ScrollRow>
            <ScrollRow as="li" index={2} className="h-full">
              <Way n={3} ref={el => { cards.current.sensors = el }} way={sensors}
                onOpen={() => open('sensors')}/>
            </ScrollRow>
            {/* Pairing is a device handshake, not a reading: the row's
                action pairs, and the line under it reports how that went. */}
            <ScrollRow as="li" index={3} className="h-full">
              <Way n={4} way={patch} onOpen={pairUp} busy={busy}
                label={busy ? 'Connecting…' : patch.cta}
                after={
                  <p aria-live="polite" className="max-w-[44ch] text-fine leading-[1.4] text-ink-2">
                    {pair?.msg || (mode === 'real' ? 'No patch is paired.' : 'The demo patch is paired.')}
                  </p>
                }/>
            </ScrollRow>
          </ol>
          <Compare/>
          {/* The owner, 17 October: no log or trends on this tab. They are
              on the Trends tab, and this link goes there. */}
          <SeeTrends go={go} className="mt-5 lg:mt-6"/>
        </Stage>
      )}

      {screen === 'sensors' && (
        <Stage dir={dir}>
          <ReadingHead id="sensors" ref={head} onBack={leave}/>
          <div className="mt-3 lg:mt-4"><PhoneCheck go={go}/></div>
        </Stage>
      )}

      {screen === 'mirror' && (
        <Stage dir={dir}>
          <ReadingHead id="mirror" ref={head} onBack={leave}/>
          <div className="mt-3 lg:mt-4"><MentalMirror go={go}/></div>
        </Stage>
      )}

      {screen === 'survey' && (
        <Stage dir={dir}>
          <ReadingHead id="survey" ref={head} onBack={leave}/>
          <div className="mt-3 lg:mt-4 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]
            xl:items-start xl:gap-4">
            {/* The panel supplies the gutter; pt-4 because a legend sits on the
                fieldset's top edge, so the first question needs the air. */}
            <div className={cn(PANEL, 'px-5 pt-4 lg:px-6 [&_fieldset]:border-rule/50 [&_fieldset]:py-5')}>
              {ITEMS.map((it,i)=>(
                <ScrollRow key={it.id} index={i}
                  className={i === ITEMS.length - 1 ? '[&_fieldset]:border-b-0' : undefined}>
                  <Scale legend={it.q} low={it.lo} high={it.hi}
                    value={ans[it.id]} onChange={v=>setAns(a=>({...a,[it.id]:v}))}/>
                </ScrollRow>
              ))}
            </div>

            {/* min-h reserves the result's space. xl:top-[65px] is the app
                shell's 48px bar + 1px hairline + 16px air. */}
            <section ref={resultRef} aria-live="polite" data-anchor
              className={cn(PANEL, 'mt-3 min-h-[10rem] p-4 lg:p-5 xl:mt-0 xl:sticky xl:top-[65px]')}>
              {!done && (
                <p className="max-w-[40ch] text-meta text-ink-3">
                  Your {SCORE} appears here when every question is answered.
                </p>
              )}
              {done && (
                <>
                  <div className="flex flex-col items-start gap-4">
                    {/* RainbowDial takes raw hex: #157446 is accent, #1d8fb0 is beam. */}
                    <RainbowDial score={r.score} size={268}
                      rings={[{ id:'self', name:'Your answers', color:'#157446', glow:'#1d8fb0',
                                value:r.score, reading:'Survey' }]}/>
                    <div className="w-full">
                      <Headline>{s.pre}<b className={`font-bold ${s.calm ? 'text-calm' : 'text-warn'}`}>{s.word}</b>{s.tail}</Headline>
                      <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-meta">
                        <dt className="text-ink-3">{SCORE}</dt>
                        <dd className="m-0 font-mono tabular-nums text-ink">{r.score} out of 100</dd>
                        <dt className="text-ink-3">Read from</dt>
                        <dd className="m-0 text-ink">{ITEMS.length} answers</dd>
                        <dt className="text-ink-3">The other rings</dt>
                        <dd className="m-0 text-ink">A patch fills heart, sweat, temperature and movement</dd>
                      </dl>
                      <p className="mt-3 flex flex-wrap items-center gap-x-3 text-meta text-ink-2">
                        Added to your {SCORE} Log.
                        <SeeTrends go={go}/>
                        <button type="button"
                          onClick={() => { restart(); requestAnimationFrame(() => head.current?.focus({ preventScroll:false })) }}
                          className="inline-flex min-h-[44px] items-center font-display font-bold text-ink-2
                            underline-offset-4 hoverOnly:text-ink hoverOnly:underline">
                          Answer again
                        </button>
                      </p>
                    </div>
                  </div>
                  <AllDetail label={`See what moved your ${SCORE}`}>
                    <p className="mt-2 max-w-[52ch] text-meta text-ink-3">
                      Right bars raised your {SCORE}, left bars lowered it.</p>
                    <Diverge items={r.contrib.map(c=>({ label:c.item.q.replace(/\?$/,''),
                      x: Math.max(-1, Math.min(1, c.raw)) }))}/>
                    <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-fine">
                      <dt className="text-ink-3">Each answer</dt>
                      <dd className="m-0 text-ink-2">Measured from its middle option, then weighted</dd>
                      <dt className="text-ink-3">All of them together</dt>
                      <dd className="m-0 text-ink-2">Averaged into one number out of 100</dd>
                      <dt className="text-ink-3">With a patch</dt>
                      <dd className="m-0 text-ink-2">The same last step, from four signals</dd>
                    </dl>
                  </AllDetail>
                </>
              )}
            </section>
          </div>
        </Stage>
      )}
    </>
  )
}
