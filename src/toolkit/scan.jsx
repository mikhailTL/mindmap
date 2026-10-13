import React from 'react'
import { Button } from '../ui/button'
import { ActivityScreen, Sheet, Step, Note, Choice, Meter } from './shell'
import { createPacer, audioSupported } from './audio'
import { useReduced } from './useReduced'

/* Body Scan.
 *
 * Attention moving down the body, one part at a time, holding the clock so the
 * reader does not have to. Eight parts, twenty-five seconds each, which is
 * three minutes and twenty seconds end to end and can be halved.
 *
 * WHAT ACTUALLY RUNS. One requestAnimationFrame clock, so the figure, the bar
 * and the drawing agree, and a low sine cue built in the page by
 * src/toolkit/audio.js at each change of part. No audio file, no fetch, no
 * recording, nothing sent.
 *
 * SAFETY. Noticing, never forcing. No instruction here tenses, squeezes, holds
 * or chills anything: the whole script is "bring your attention here, notice
 * what is there, leave it as it is". A part that hurts is one to move past, and
 * the screen says so. Nothing is counted past this screen. */

const PARTS = [
  { id:'feet',  name:'Feet and ankles',  say:'Notice where your feet meet the floor, or the bed. Weight, temperature, the inside of your socks.' },
  { id:'legs',  name:'Legs',             say:'Follow the attention up through your calves and thighs. Whatever is there is fine, including nothing in particular.' },
  { id:'hips',  name:'Hips and lower back', say:'The part holding you up. See whether it is doing more work than it needs to, and leave it as it is.' },
  { id:'belly', name:'Stomach',          say:'The rise and fall of your breathing, from the inside. Do not change the breath, only watch it.' },
  { id:'chest', name:'Chest',            say:'Wide or narrow, fast or slow. Name it to yourself in one word and move on.' },
  { id:'hands', name:'Hands and arms',   say:'Fingers, palms, forearms, shoulders. Notice anything your hands are gripping and let them be heavy.' },
  { id:'neck',  name:'Neck and jaw',     say:'Where the day usually ends up. Let your teeth come apart and your tongue sit flat.' },
  { id:'face',  name:'Face and eyes',    say:'Forehead, eyebrows, the small muscles around your eyes. Then the whole body at once, for the last few seconds.' },
]

const PACES = {
  full:  { id:'full',  label:'Full, 25 seconds a part', secs:25 },
  short: { id:'short', label:'Short, 12 seconds a part', secs:12 },
}

/* A figure, drawn in flat blocks, with the live part filled. Not an anatomical
   diagram and not a mascot: eight rounded blocks in the order of the script,
   so the drawing is the progress indicator as well as the picture. */
function Figure({ at }) {
  const rows = [
    { id:'face',  x:38, y:4,   w:24, h:16, r:8 },
    { id:'neck',  x:44, y:22,  w:12, h:8,  r:4 },
    { id:'chest', x:28, y:32,  w:44, h:20, r:7 },
    { id:'hands', x:10, y:34,  w:14, h:40, r:7 },
    { id:'belly', x:31, y:54,  w:38, h:16, r:6 },
    { id:'hips',  x:30, y:72,  w:40, h:14, r:6 },
    { id:'legs',  x:33, y:88,  w:34, h:34, r:8 },
    { id:'feet',  x:34, y:124, w:32, h:12, r:6 },
  ]
  return (
    <svg viewBox="0 0 100 142" aria-hidden focusable="false"
      className="mx-auto block h-[14rem] w-auto sm:h-[17rem]">
      {/* The second arm, mirrored, so the drawing is not lopsided. It shares
          the hands step and carries no separate state. */}
      <rect x={76} y={34} width={14} height={40} rx={7}
        className={at === 'hands' ? 'kit-f' : 'kit-f-art'}
        opacity={at === 'hands' ? 1 : 0.28}/>
      {rows.map(r => (
        <rect key={r.id} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.r}
          className={at === r.id ? 'kit-f' : 'kit-f-art'}
          opacity={at === r.id ? 1 : 0.28}
          style={{ transition:'opacity .35s var(--ease-out)' }}/>
      ))}
    </svg>
  )
}

export default function BodyScan() {
  const reduced = useReduced()
  const [pace, setPace] = React.useState('full')
  const [running, setRunning] = React.useState(false)
  const [sound, setSound] = React.useState(false)
  const [i, setI] = React.useState(0)
  const [left, setLeft] = React.useState(PACES.full.secs)
  const [t, setT] = React.useState(0)

  const secs = PACES[pace].secs
  const total = secs * PARTS.length
  const pacer = React.useRef(null)
  const started = React.useRef(0)
  const lastI = React.useRef(0)
  const soundOn = React.useRef(false)
  soundOn.current = sound

  React.useEffect(() => { setI(0); setLeft(secs); setT(0); setRunning(false) }, [pace, secs])

  React.useEffect(() => {
    if (!running) return
    let id = 0
    started.current = performance.now() - i * secs * 1000 - (secs - left) * 1000
    const tick = now => {
      const el = (now - started.current) / 1000
      if (el >= total) { setRunning(false); setI(PARTS.length - 1); setLeft(0); setT(1); return }
      const idx = Math.min(PARTS.length - 1, Math.floor(el / secs))
      setI(idx)
      setLeft(Math.max(0, Math.ceil(secs - (el - idx * secs))))
      setT(el / total)
      if (idx !== lastI.current) {
        lastI.current = idx
        if (soundOn.current) {
          pacer.current ||= createPacer()
          pacer.current.cue(247 - idx * 6, 0.5)
        }
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [running, pace, secs, total])

  React.useEffect(() => () => { pacer.current?.close(); pacer.current = null }, [])

  const part = PARTS[i]
  const finished = t >= 1

  return (
    <ActivityScreen family="pool" title="Body Scan" minutes="3 to 4 minutes"
      lede="Attention down the body, one part at a time. The page keeps the clock so you only have to notice.">
      <Sheet>
        <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-6">
          <Figure at={running || t > 0 ? part.id : null}/>
          <div className="min-w-0">
            <p className="font-display text-row font-bold tracking-tight text-ink">
              {finished ? 'Whole body' : part.name}
            </p>
            <p className="mt-2 max-w-[42ch] text-sec text-ink-2 [text-wrap:pretty]">
              {finished
                ? 'That is the whole scan. Sit with the last few breaths for as long as you want to.'
                : part.say}
            </p>
            <p className="mt-3 font-display text-stat font-bold tabular-nums text-ink">
              {finished ? '0' : left}
              {/* The space is inside the span rather than between the two,
                  because JSX drops whitespace between elements and a screen
                  reader then says "twenty-five seconds" as one word. */}
              <span className="ml-1.5 align-baseline font-display text-fine font-semibold text-ink-2">
                {' '}seconds on this part
              </span>
            </p>
            <Meter className="mt-3.5" value={t} label="Through the scan"
              right={`${i + 1} of ${PARTS.length}`}/>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Button size="sm" onClick={() => {
                if (finished) { setI(0); setLeft(secs); setT(0); lastI.current = 0; setRunning(true) }
                else setRunning(r => !r)
              }} className="min-w-[8.5rem]">
                {finished ? 'Start again' : running ? 'Pause' : t > 0 ? 'Carry on' : 'Start'}
              </Button>
              {!running && t > 0 && !finished && (
                <Button size="sm" variant="outline"
                  onClick={() => { setI(0); setLeft(secs); setT(0); lastI.current = 0 }}>
                  Back to the start
                </Button>
              )}
            </div>
          </div>
        </div>
      </Sheet>

      <Sheet className="mt-3">
        <Step>Pace and sound</Step>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {Object.values(PACES).map(o => (
            <Choice key={o.id} on={pace === o.id} onClick={() => setPace(o.id)}>{o.label}</Choice>
          ))}
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Choice on={sound} disabled={!audioSupported()} onClick={() => setSound(s => !s)}>
            {sound ? 'Sound cues on' : 'Sound cues off'}
          </Choice>
        </div>
        <Note className="mt-2.5">The cue is a low sine tone built in this page, one step lower at
          each part, so the pitch falls as the attention does. There is no audio file.</Note>
        <Note className="mt-2.5">Every step is noticing, never forcing: nothing here asks you to
          tense, squeeze or hold anything. If a part hurts, move past it.</Note>
        {reduced && <Note className="mt-2.5">Your device asks for reduced motion, so the drawing
          changes part without sliding and the seconds carry the pace.</Note>}
      </Sheet>
    </ActivityScreen>
  )
}
