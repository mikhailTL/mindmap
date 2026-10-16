import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import { ActivityScreen, OnDevice, Choice, FIELD, Video } from './shell'
import { openCamera, stopStream, loadDetector, phraseFor, cameraSupported } from './vision'
import { DidItWork } from './after'

/* 5-4-3-2-1 Grounding. The camera view is the screen.
 *
 * WHAT RUNS. On the first rung a single-shot object detector (SSDLite
 * MobileNet V2, COCO, through TensorFlow.js from a CDN, see vision.js) reads
 * the <video> element about three times a second. Every class it finds
 * becomes a chip; tapping a chip puts it on the rung and the strip counts
 * down. The later rungs offer tappable suggestions and a typed field, because
 * a camera cannot hear, feel, smell or taste.
 *
 * WHERE THE FRAMES GO. Nowhere. The detector reads the element directly; no
 * frame is captured, encoded, stored or sent, and the stream stops when the
 * rung moves on or the screen closes.
 *
 * IF IT CANNOT RUN. Refused, unsupported or offline all land on the typed
 * field, which is how the exercise has always worked. */

const RUNGS = [
  { id:'see',   n:5, name:'See',   ask:'Tap five things you see',
    chips:[] },
  { id:'hear',  n:4, name:'Hear',  ask:'Tap four sounds',
    chips:['a fan', 'traffic', 'voices', 'music', 'my breathing', 'a clock', 'birds', 'a screen hum'] },
  { id:'feel',  n:3, name:'Feel',  ask:'Tap three things touching you',
    chips:['the chair', 'the floor', 'a sleeve', 'my phone', 'the air', 'my hair', 'a desk', 'socks'] },
  { id:'smell', n:2, name:'Smell', ask:'Tap two smells',
    chips:['nothing', 'food', 'soap', 'fresh air', 'coffee', 'laundry', 'rain', 'paper'] },
  { id:'taste', n:1, name:'Taste', ask:'Tap one taste',
    chips:['water', 'nothing', 'toothpaste', 'gum', 'the last meal', 'tea'] },
]

const empty = () => Object.fromEntries(RUNGS.map(r => [r.id, []]))

/* The strip: five cells, each the sense and how many are still to find. The
   live cell is filled; a finished cell shows a check mark. */
function Strip({ got, at }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {RUNGS.map((r, i) => {
        const left = r.n - got[r.id].length
        const live = i === at
        return (
          <div key={r.id} className={cn('rounded-field border-2 border-ink px-1 py-2 text-center',
            'transition-colors duration-200',
            live ? 'bg-ink text-paper' : left === 0 ? 'bg-accent-wash text-ink' : 'bg-card text-ink')}>
            <p className="font-display text-fine font-semibold sm:text-ui">{r.name}</p>
            <p className="font-display text-stat font-bold tabular-nums">{left}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function Grounding() {
  const [at, setAt] = React.useState(0)
  const [got, setGot] = React.useState(empty)
  const [text, setText] = React.useState('')
  const [cam, setCam] = React.useState('off')     // off | asking | loading | on | refused | unsupported | offline
  const [seen, setSeen] = React.useState([])
  const videoRef = React.useRef(null)
  const streamRef = React.useRef(null)
  const liveRef = React.useRef(false)

  const finished = at >= RUNGS.length
  const rung = RUNGS[Math.min(at, RUNGS.length - 1)]
  const list = got[rung.id]
  const full = list.length >= rung.n

  const add = v => {
    const s = String(v).trim()
    if (!s) return
    setGot(g => g[rung.id].length >= rung.n || g[rung.id].includes(s)
      ? g : { ...g, [rung.id]: [...g[rung.id], s] })
    setText('')
  }
  const drop = v => setGot(g => ({ ...g, [rung.id]: g[rung.id].filter(x => x !== v) }))
  const toggle = v => list.includes(v) ? drop(v) : add(v)

  const closeCam = React.useCallback(() => {
    liveRef.current = false
    stopStream(streamRef.current)
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setSeen([])
  }, [])

  React.useEffect(() => () => closeCam(), [closeCam])
  React.useEffect(() => { if (at !== 0 && streamRef.current) { closeCam(); setCam('off') } }, [at, closeCam])

  const askCam = async () => {
    if (cam === 'on') { closeCam(); setCam('off'); return }
    if (!cameraSupported()) { setCam('unsupported'); return }
    setCam('asking')
    let stream
    try { stream = await openCamera() }
    catch { setCam('refused'); return }
    streamRef.current = stream
    setCam('loading')
    let model
    try { model = await loadDetector() }
    catch { closeCam(); setCam('offline'); return }
    const v = videoRef.current
    if (!v) { closeCam(); setCam('off'); return }
    v.srcObject = stream
    try { await v.play() } catch { /* a blocked autoplay still renders frames */ }
    setCam('on')
    liveRef.current = true
    const loop = async () => {
      while (liveRef.current && videoRef.current) {
        try {
          const found = await model.detect(videoRef.current, 8, 0.45)
          const names = []
          for (const f of found) {
            const phrase = phraseFor(f.class)
            if (phrase && !names.includes(phrase)) names.push(phrase)
          }
          if (liveRef.current) setSeen(names.slice(0, 8))
        } catch { /* a dropped frame is not worth reporting */ }
        await new Promise(r => setTimeout(r, 320))
      }
    }
    loop()
  }

  /* Chips the reader can tap: on the first rung, what the detector found plus
     anything already on the rung; on the rest, the written suggestions. */
  const chips = at === 0
    ? [...new Set([...list, ...seen])]
    : [...new Set([...list, ...rung.chips])]

  const camLabel = cam === 'asking' ? 'Asking' : cam === 'loading' ? 'Loading detector' : 'Start camera'

  return (
    <ActivityScreen family="stone" title="5-4-3-2-1 Grounding">
      <Strip got={got} at={finished ? -1 : at}/>

      {!finished && at === 0 && (
        <div className="mt-3">
          {cam !== 'on' && (
            <div className="mx-auto grid w-full max-w-[64rem] place-items-center gap-3 rounded-panel
              border-2 border-ink bg-ink px-4 py-10 sm:py-14">
              <Button size="md" onClick={askCam} disabled={cam === 'asking' || cam === 'loading'}
                className="bg-accent text-paper hoverOnly:bg-accent-ink">{camLabel}</Button>
              <p className="text-center text-fine text-paper">
                {cam === 'refused' ? 'Camera off. Type instead.'
                  : cam === 'unsupported' ? 'No camera here. Type instead.'
                  : cam === 'offline' ? 'Detector offline. Type instead.'
                  : 'Frames stay on this device.'}
              </p>
            </div>
          )}
          <Video ref={videoRef} on={cam === 'on'}>
            <p className="absolute left-3 top-3 rounded-field bg-ink/80 px-2 py-1 text-fine text-paper">
              {seen.length ? rung.ask : 'Looking'}
            </p>
          </Video>
          {cam === 'on' && <OnDevice className="mt-2">Frames stay on this device.</OnDevice>}
        </div>
      )}

      {!finished && (
        <div className="mt-3">
          {at > 0 && <p className="font-display text-ui font-semibold text-ink">{rung.ask}</p>}
          <div className="mt-2 flex min-h-[3rem] flex-wrap gap-2">
            {chips.map(c => (
              <Choice key={c} on={list.includes(c)} disabled={full && !list.includes(c)}
                onClick={() => toggle(c)}>{c}</Choice>
            ))}
          </div>

          <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); add(text) }}>
            <label className="min-w-0 flex-1">
              <span className="sr-only">{rung.ask}</span>
              <input className={FIELD} value={text} disabled={full}
                onChange={e => setText(e.target.value)}
                placeholder={full ? 'Rung full' : 'Or type one'}/>
            </label>
            <Button size="sm" type="submit" disabled={full || !text.trim()}>Add</Button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2.5">
            <Button size="sm" variant={full ? 'solid' : 'outline'} onClick={() => setAt(a => a + 1)}>
              {at === RUNGS.length - 1 ? 'Finish' : full ? 'Next' : 'Skip'}
            </Button>
            {at > 0 && <Button size="sm" variant="outline" onClick={() => setAt(a => a - 1)}>Back</Button>}
          </div>
        </div>
      )}

      {finished && (
        <div className="mt-3">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RUNGS.map(r => (
              <div key={r.id} className="rounded-panel border-2 border-ink bg-card p-3">
                <dt className="font-display text-ui font-bold text-ink">{r.name}</dt>
                <dd className="mt-1 text-sec text-ink-2">{got[r.id].length ? got[r.id].join(', ') : 'Skipped'}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => { setGot(empty()); setAt(0) }}>Start again</Button>
            <span className="text-fine text-ink-3">Nothing was saved.</span>
          </div>
        </div>
      )}
      {!finished && at === 0 && !list.length && <DidItWork tool="ground" phase="before" className="mt-3"/>}
      {finished && <DidItWork tool="ground" phase="after" className="mt-3"/>}
    </ActivityScreen>
  )
}
