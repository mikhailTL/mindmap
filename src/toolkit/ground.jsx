import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import { ActivityScreen, Sheet, Step, Note, OnDevice, Choice, FIELD, riseAt } from './shell'
import { openCamera, stopStream, loadDetector, phraseFor, cameraSupported, DETECTOR_NAME } from './vision'

/* 5-4-3-2-1 Grounding, with the camera doing the first rung.
 *
 * The exercise everybody half remembers. The part it never has on paper is the
 * count, and the part it never has anywhere is help with the first rung, which
 * is the one people stall on: five things you can see, at eleven at night, in a
 * room you have been staring at for three hours.
 *
 * WHAT ACTUALLY RUNS. Point the camera at the room and a single-shot object
 * detector of the YOLO family -- SSDLite with a MobileNet V2 backbone, trained
 * on COCO's eighty everyday classes -- runs on the device's own GPU through
 * TensorFlow.js and names what it finds. Tapping a name puts it on the rung.
 * This is the real detector and the real model file; it is not a word list
 * pretending, and it is not a fetch to a server, because there is no server.
 *
 * WHERE THE FRAMES GO. Nowhere. getUserMedia hands the frames to a <video>,
 * the detector reads that element directly, and the result is five strings.
 * Nothing is captured, nothing is encoded, nothing is stored, nothing is sent.
 * The stream is stopped on leaving the screen. The line beside the camera says
 * this in one sentence, which is where it belongs.
 *
 * IF IT CANNOT RUN. A refused permission, a browser with no camera or a failed
 * model fetch all land in the same place: the rung is typed, which is how the
 * exercise has always worked. The page says which of those happened and never
 * claims a capability it did not get.
 *
 * Nothing in here asks for discomfort. Every rung is noticing what is already
 * there. */

const RUNGS = [
  { id:'see',   n:5, ask:'Five things you can see',                  eg:'a door handle, the corner of a screen' },
  { id:'hear',  n:4, ask:'Four things you can hear',                 eg:'a fan, traffic, somebody two rooms away' },
  { id:'feel',  n:3, ask:'Three things you can feel touching you',   eg:'the chair, a sleeve, the floor' },
  { id:'smell', n:2, ask:'Two things you can smell',                 eg:'or nothing, which is an answer' },
  { id:'taste', n:1, ask:'One thing you can taste',                  eg:'water counts' },
]

const empty = () => Object.fromEntries(RUNGS.map(r => [r.id, []]))

/* One rung, as five slots filling. The count beside it is plain type, so the
   shape and the figure both say how far along the reader is. */
function Rung({ rung, done, live }) {
  return (
    <div className={cn('flex items-center gap-3 border-l-2 py-1.5 pl-2.5',
      'transition-colors duration-200', live ? 'kit-edge' : 'border-l-transparent')}>
      <span className={cn('w-[5.5ch] shrink-0 font-display text-fine',
        live ? 'font-bold text-ink' : 'font-medium text-ink-2')}>{rung.id}</span>
      <span className="grid min-w-0 flex-1 grid-cols-5 gap-1.5">
        {Array.from({ length: rung.n }, (_, i) => (
          <span key={i} className={cn('h-2.5 rounded-bar',
            'transition-colors duration-200', i < done ? 'kit-fill' : 'bg-mist')}/>
        ))}
      </span>
      <span className="w-[4.5ch] shrink-0 text-right font-display text-fine font-semibold
        tabular-nums text-ink-2">{done}/{rung.n}</span>
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

  const rung = RUNGS[at]
  const list = got[rung.id]
  const full = list.length >= rung.n
  const finished = at >= RUNGS.length

  const add = v => {
    const s = String(v).trim()
    if (!s) return
    setGot(g => g[rung.id].length >= rung.n || g[rung.id].includes(s)
      ? g : { ...g, [rung.id]: [...g[rung.id], s] })
    setText('')
  }

  const closeCam = React.useCallback(() => {
    liveRef.current = false
    stopStream(streamRef.current)
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setSeen([])
  }, [])

  React.useEffect(() => () => closeCam(), [closeCam])
  /* The camera belongs to the first rung only, so moving on closes it rather
     than leaving it running behind a rung it cannot help with. */
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
    /* Roughly three passes a second rather than one per frame: the detector is
       the expensive part and a name that flickers thirty times a second is
       unreadable and pointless. */
    const loop = async () => {
      while (liveRef.current && videoRef.current) {
        try {
          const found = await model.detect(videoRef.current, 8, 0.45)
          const names = []
          for (const f of found) {
            const phrase = phraseFor(f.class)
            if (phrase && !names.includes(phrase)) names.push(phrase)
          }
          if (liveRef.current) setSeen(names.slice(0, 6))
        } catch { /* a dropped frame is not worth reporting */ }
        await new Promise(r => setTimeout(r, 320))
      }
    }
    loop()
  }

  return (
    <ActivityScreen family="stone" title="5-4-3-2-1 Grounding" minutes="3 minutes"
      lede="Five things you can see, down to one you can taste. The page holds the count and the camera can help with the first rung.">
      <Sheet>
        <div className="flex flex-col gap-0.5">
          {RUNGS.map((r, i) => (
            <Rung key={r.id} rung={r} done={got[r.id].length} live={i === at}/>
          ))}
        </div>
      </Sheet>

      {!finished && (
        <Sheet className="mt-3">
          <Step>{rung.ask}</Step>
          <p className="mt-1.5 text-fine text-ink-3">For example: {rung.eg}</p>

          <form className="mt-3 flex flex-wrap gap-2"
            onSubmit={e => { e.preventDefault(); add(text) }}>
            <label className="min-w-[12rem] flex-1">
              <span className="sr-only">{rung.ask}</span>
              <input className={FIELD} value={text} disabled={full}
                onChange={e => setText(e.target.value)}
                placeholder={full ? 'That rung is full' : 'Type one and press Add'}/>
            </label>
            <Button size="sm" type="submit" disabled={full || !text.trim()}>Add</Button>
          </form>

          {list.length > 0 && (
            <ul className="mt-3 flex list-none flex-col gap-1.5 p-0">
              {list.map((v, i) => (
                <li key={v} className="kit-rise flex items-center gap-2.5 text-sec text-ink-2"
                  style={riseAt(i)}>
                  <span aria-hidden className="kit-fill size-2 shrink-0 rounded-bar"/>
                  <span className="min-w-0 flex-1">{v}</span>
                  <button type="button" onClick={() => setGot(g => ({ ...g,
                    [rung.id]: g[rung.id].filter(x => x !== v) }))}
                    className="min-h-[44px] rounded-field px-2.5 font-display text-fine font-semibold
                      text-accent-ink hoverOnly:text-ink">Remove</button>
                </li>
              ))}
            </ul>
          )}

          {at === 0 && (
            <>
              <Step className="mt-5">Camera help, for the first rung</Step>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Choice on={cam === 'on'} onClick={askCam} className="min-w-[13rem]">
                  {cam === 'on' ? 'Turn the camera off'
                    : cam === 'asking' ? 'Asking for the camera'
                    : cam === 'loading' ? 'Starting the detector'
                    : 'Point the camera at the room'}
                </Choice>
              </div>

              {/* The element is always mounted: a <video> created at the moment
                  a stream arrives has no layout yet and iOS refuses to play
                  into it. It is 1px and invisible until there is a stream. */}
              <div className={cn('mt-3 overflow-hidden rounded-panel border-2 border-ink bg-ink',
                cam === 'on' ? 'block' : 'sr-only')}>
                <video ref={videoRef} muted playsInline
                  className="block aspect-[4/3] w-full object-cover"/>
              </div>

              {cam === 'on' && (
                <>
                  <p className="mt-3 font-display text-fine font-semibold text-ink-2">
                    {seen.length ? 'Tap one to put it on the rung' : 'Looking'}
                  </p>
                  <div className="mt-1.5 flex min-h-[3rem] flex-wrap gap-2">
                    {seen.map((s, i) => (
                      <Choice key={s} on={list.includes(s)} style={riseAt(i)}
                        className="kit-rise" onClick={() => add(s)}>{s}</Choice>
                    ))}
                  </div>
                  <OnDevice>The camera runs inside this page. Frames are measured and dropped, one
                    after another: nothing is photographed, saved, uploaded or shared, and the camera
                    stops the moment you turn it off or leave.</OnDevice>
                  <Note className="mt-1.5">The detector is {DETECTOR_NAME}, running on this device
                    through TensorFlow.js. It knows eighty everyday objects, it is often wrong, and
                    being wrong does not matter: anything you can see counts, whether or not the page
                    found it.</Note>
                </>
              )}
              {cam === 'refused' && <Note className="mt-2.5">The camera stayed off, so the rung is
                typed. That is how the exercise has always worked.</Note>}
              {cam === 'unsupported' && <Note className="mt-2.5">This browser has no camera to offer,
                so the rung is typed.</Note>}
              {cam === 'offline' && <Note className="mt-2.5">The detector could not be fetched, so
                there is nothing to recognise with and the rung is typed. It needs a connection the
                first time it runs, and nothing else here does.</Note>}
              {cam === 'off' && <Note className="mt-2.5">Optional, and the exercise is complete
                without it.</Note>}
            </>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t-2 border-ink pt-3.5">
            <Button size="sm" variant={full ? 'solid' : 'outline'}
              onClick={() => setAt(a => a + 1)}>
              {at === RUNGS.length - 1 ? 'Finish' : full ? 'Next rung' : 'Skip this rung'}
            </Button>
            {at > 0 && <Button size="sm" variant="outline"
              onClick={() => setAt(a => a - 1)}>Back a rung</Button>}
          </div>
        </Sheet>
      )}

      {finished && (
        <Sheet className="mt-3">
          <Step>Where you got to</Step>
          <dl className="mt-2.5 grid gap-3 sm:grid-cols-2">
            {RUNGS.map(r => (
              <div key={r.id}>
                <dt className="font-display text-fine font-bold text-ink">{r.ask}</dt>
                <dd className="mt-1 text-sec text-ink-2">
                  {got[r.id].length ? got[r.id].join(', ') : 'Skipped, which is allowed.'}
                </dd>
              </div>
            ))}
          </dl>
          <Note className="mt-3.5">None of this was saved. Closing the screen clears it.</Note>
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <Button size="sm" variant="outline"
              onClick={() => { setGot(empty()); setAt(0) }}>Start again</Button>
          </div>
        </Sheet>
      )}
    </ActivityScreen>
  )
}
