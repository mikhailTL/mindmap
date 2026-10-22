import React from 'react'
import { Button } from '../ui/button'
import { Check } from '../ui/marks'
import { cn } from '../lib/utils'
import { ActivityScreen } from './shell'
import { DidItWork } from './after'
import { motion } from 'framer-motion'
import { useGame, GameBar, Pops, LevelMeter, EndCard, Burst, SPRING } from './game'

const SENSES = [
  { id:'see', n:5, name:'See', ask:'things you can see', deck:[
    'Something blue', 'Something round', 'A light', 'Something soft', 'A plant or tree',
    'Your own hand', 'Something with words', 'Something shiny', 'Something green',
    'A shadow', 'Something square', 'Something tiny', 'A number', 'Something striped'] },
  { id:'hear', n:4, name:'Hear', ask:'sounds you can hear', deck:[
    'A far sound', 'A near sound', 'Your own breath', 'A hum or buzz', 'A voice',
    'A tap or click', 'Wind or air', 'A car or bus', 'Music', 'A bird', 'Footsteps'] },
  { id:'feel', n:3, name:'Feel', ask:'things you can feel', deck:[
    'Feet on the floor', 'Your back on the seat', 'Something smooth', 'Something soft',
    'Air on your skin', 'Your hands resting', 'Sleeves on your arms', 'Something cool',
    'Something warm', 'Your phone in your hand'] },
  { id:'smell', n:2, name:'Smell', ask:'things you can smell', deck:[
    'The air around you', 'Your sleeve', 'Your hands', 'Something nearby', 'Food',
    'Soap', 'Outside air', 'Nothing at all', 'Paper or a book'] },
  { id:'taste', n:1, name:'Taste', ask:'thing you can taste', deck:[
    'Water', 'Nothing at all', 'Your last snack', 'Toothpaste', 'Gum or a mint', 'A drink nearby'] },
]
const ALL = SENSES.reduce((a, s) => a + s.n, 0)
const NUM = ['', 'one', 'two', 'three', 'four', 'five']

const shuffle = list => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
const deal = (sense, keep = []) => {
  const rest = shuffle(sense.deck.filter(c => !keep.includes(c)))
  return [...keep, ...rest].slice(0, Math.max(keep.length, Math.min(8, sense.deck.length)))
}
const fresh = () => Object.fromEntries(SENSES.map(s => [s.id, []]))

/* The collection: a row per sense, a slot per thing to find. */
function Collection({ got, at }) {
  return (
    <div className="grid gap-1.5" aria-label="Collection">
      {SENSES.map((s, r) => (
        <div key={s.id} className="flex items-center gap-2">
          <span className={cn('w-12 shrink-0 font-display text-fine font-bold',
            r === at ? 'text-ink' : 'text-ink-2')}>{s.name}</span>
          <div className="grid flex-1 grid-cols-5 gap-1.5">
            {Array.from({ length: s.n }, (_, k) => {
              const item = got[s.id][k]
              return (
                <span key={k} title={item || ''}
                  className={cn('relative grid h-9 place-items-center rounded-[10px] border transition-colors duration-200',
                    item ? 'border-transparent' : r === at ? 'border-ink bg-white' : 'border-rule bg-white/70')}
                  style={item ? { background:'linear-gradient(135deg, var(--g-main), var(--g-ink))' } : undefined}>
                  {item ? (
                    <motion.span initial={{ scale:0, rotate:-90 }} animate={{ scale:1, rotate:0 }} transition={SPRING}>
                      <Check aria-hidden className="size-4 text-paper"/>
                    </motion.span>
                  ) : null}
                  <span className="sr-only">{item ? `${s.name}: ${item}` : `${s.name}: empty`}</span>
                </span>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Grounding() {
  const g = useGame('ground')
  const [stage, setStage] = React.useState('idle')     // idle | hunt | done
  const [at, setAt] = React.useState(0)
  const [got, setGot] = React.useState(fresh)
  const [hand, setHand] = React.useState(() => deal(SENSES[0]))
  const [shuffles, setShuffles] = React.useState(0)
  const [cleared, setCleared] = React.useState(false)
  const t0 = React.useRef(0)
  const [secs, setSecs] = React.useState(0)

  const sense = SENSES[Math.min(at, SENSES.length - 1)]
  const mine = got[sense.id]
  const found = Object.values(got).reduce((a, l) => a + l.length, 0)

  const start = () => {
    g.reset(); setGot(fresh()); setAt(0); setHand(deal(SENSES[0])); setShuffles(0)
    setCleared(false); t0.current = Date.now(); setStage('hunt')
  }

  const collect = (card, el) => {
    if (cleared || mine.includes(card) || mine.length >= sense.n) return
    const box = el?.closest('[data-hunt]')?.getBoundingClientRect()
    const r = el?.getBoundingClientRect()
    const pos = box && r ? { x: (r.left + r.width / 2 - box.left) / box.width * 100,
                             y: (r.top - box.top) / box.height * 100 } : {}
    const next = [...mine, card]
    setGot(s => ({ ...s, [sense.id]: next }))
    g.add(10, pos)
    if (next.length >= sense.n) {
      setCleared(true)
      setTimeout(() => g.add(15, { x:50, y:8, label:`${sense.name} done`, sound:'good' }), 260)
      setTimeout(() => {
        setCleared(false)
        if (at + 1 >= SENSES.length) {
          g.add(25, { x:50, y:20, label:'full set', sound:'good' })
          setSecs(Math.round((Date.now() - t0.current) / 1000))
          setTimeout(() => { setStage('done'); g.finish({ complete:true }) }, 500)
        } else {
          setAt(at + 1); setHand(deal(SENSES[at + 1]))
        }
      }, 1100)
    }
  }

  const reshuffle = () => { setHand(deal(sense, mine)); setShuffles(n => n + 1) }
  const end = () => { setSecs(Math.round((Date.now() - t0.current) / 1000)); setStage('done'); g.finish({ complete:false }) }

  const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  const sensesDone = SENSES.filter(s => got[s.id].length >= s.n).length

  return (
    <ActivityScreen family="stone" title="5-4-3-2-1 Grounding">
      <div style={g.vars} className="mx-auto w-full max-w-[56rem]">
        {stage !== 'done' && <GameBar game={g} className="mb-3"/>}
        {stage !== 'done' && <Collection got={got} at={stage === 'hunt' ? at : -1}/>}

        {stage === 'idle' && (
          <div className="mt-4">
            <p className="font-display text-row font-bold text-ink">How it works</p>
            <p className="mt-1 text-sec text-ink-2">Find 5 things you see, 4 you hear, 3 you feel, 2 you smell and 1 you taste. Tap each card when you find it.</p>
            <Button className="mt-4 w-full sm:w-auto sm:min-w-[12rem]" onClick={start}>Start</Button>
            <LevelMeter className="mt-5 max-w-[34rem]"/>
            <DidItWork tool="ground" phase="before" className="mt-4"/>
          </div>
        )}

        {stage === 'hunt' && (
          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 key={sense.id} className={cn('font-display text-row font-bold tracking-tight text-ink',
                !g.reduced && 'g-in')}>
                Find {NUM[sense.n]} {sense.ask}
              </h3>
              <span className="font-display text-ui font-bold tabular-nums text-ink-2">
                {mine.length} of {sense.n}
              </span>
            </div>
            <p className="mt-0.5 text-sec text-ink-2">Find it around you, then tap its card.</p>
            <div data-hunt className="relative mt-3">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {hand.map((c, k) => {
                  const on = mine.includes(c)
                  return (
                    <motion.button key={sense.id + c} type="button" aria-pressed={on}
                      onClick={e => collect(c, e.currentTarget)}
                      disabled={!on && (cleared || mine.length >= sense.n)}
                      initial={g.reduced ? false : { opacity:0, y:14, scale:0.92 }}
                      animate={{ opacity:1, y:0, scale: on && !g.reduced ? [1, 1.07, 1] : 1 }}
                      whileTap={g.reduced ? undefined : { scale:0.94 }}
                      transition={{ ...SPRING, delay: on ? 0 : k * 0.035 }}
                      style={on ? { background:'linear-gradient(135deg, var(--g-wash), #ffffff)' } : undefined}
                      className={cn('relative flex min-h-[76px] items-center gap-2.5 rounded-[16px] border p-3 text-left',
                        'font-display text-ui shadow-card disabled:opacity-50',
                        on ? 'border-ink font-bold text-ink' : 'border-rule bg-white font-semibold text-ink')}>
                      <span aria-hidden className="relative grid size-8 shrink-0 place-items-center rounded-full border-[1.5px]"
                        style={on ? { background:'linear-gradient(135deg, var(--g-main), var(--g-ink))', borderColor:'transparent' }
                          : { borderColor:'#9fbcae' }}>
                        {on && <motion.span initial={g.reduced ? false : { scale:0 }} animate={{ scale:1 }} transition={SPRING}>
                          <Check className="size-4 text-paper"/></motion.span>}
                        {on && <Burst fire={1} count={8} spread={30} size={5}/>}
                      </span>
                      <span className="min-w-0">{c}</span>
                    </motion.button>
                  )
                })}
              </div>
              <Pops game={g}/>
            </div>
            <p className="mt-3 min-h-[1.5rem] text-fine font-semibold" aria-live="polite"
              style={{ color:'var(--g-ink)' }}>
              {cleared ? (at + 1 >= SENSES.length ? 'Full set found.' : `${sense.name} done. Next: ${SENSES[at + 1].name}.`) : ''}
            </p>
            <div className="mt-1 flex flex-wrap gap-2.5">
              <Button size="sm" variant="outline" onClick={reshuffle} disabled={cleared}>New cards</Button>
              <Button size="sm" variant="outline" onClick={end}>End hunt</Button>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <EndCard game={g} title={found >= ALL ? 'Full set found' : 'Hunt done'}
            stars={found >= ALL ? 3 : found >= 10 ? 2 : 1}
            stats={[['Found', `${found} of ${ALL}`], ['Senses', `${sensesDone} of 5`],
                    ['Time', time], ['New cards used', String(shuffles)]]}
            onAgain={start}>
            <Collection got={got} at={-1}/>
            <DidItWork tool="ground" phase="after" className="mt-3"/>
          </EndCard>
        )}
      </div>
    </ActivityScreen>
  )
}
