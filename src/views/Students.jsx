import React from 'react'
import { SectionShell } from './shell'
import { StudentBody, AllDetail } from './Monitor'
import { CheckInBody } from './CheckIn'
import { PrivacyBody } from './Privacy'
import { Chevron } from '../ui/marks'
import { DayChart } from '../charts/day'
import { RainbowDial, RainbowKey, SensorDetail } from '../charts/rainbow'
import { DATA } from '../lib/assets'
import { useMode } from '../lib/mode'
import { studentRings } from '../lib/readings'
import { SENSORS } from '../lib/sensors'
import { bandOf } from '../signals/score'
import { cn } from '../lib/utils'
import { SCORE, CONSENT_SHORT } from '../lib/terms'

/* The student app's Today screen, and the shell the three student tabs sit in.
 *
 * Today's figures: the rings come off src/lib/readings.js and the normal band
 * off src/lib/assets.js. `score` is the blend the engine returns for them and
 * is not derivable here, because it is a logistic of four z-scores rather than
 * a mean of the rings. */
const TODAY = { score: 51, at: 'Thursday · 4:10 pm' }

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
               'eight', 'nine', 'ten']
const word = n => WORDS[n] ?? String(n)
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

/* Tier bar beside the band word. Colour is never the only carrier: the word is
   the state, and the dial marks the reader's own usual day on the scale. */
const TIER_BAR = { low:'bg-calm', usual:'bg-calm', up:'bg-warn', high:'bg-crit' }

/* One score and one sentence a day is the product, so the sentence is a
   first-class element on the screen rather than a caption under the dial.
   Generated from the same rings the dial draws: the band word comes from
   score.js, and the named signal is whichever sits furthest above its own
   fourteen-day normal. */
function daySentence(score, usual, rings) {
  const top = rings
    .map(r => ({ name: (SENSORS[r.id]?.name || r.name || '').toLowerCase(),
                 over: r.value - (r.band?.hi ?? 100) }))
    .sort((a, b) => b.over - a.over)[0]
  const d = score - usual
  const against = d === 0
    ? `level with a usual ${usual}`
    : `${word(Math.abs(d))} ${d > 0 ? 'above' : 'below'} a usual ${usual}`
  const tail = !top || top.over <= 0
    ? 'and no signal is above its own normal'
    : `with ${top.name} furthest above its own normal`
  return `Today is ${score}, ${against}, ${tail}.`
}

/* Consent summary in the first person: this is the student's own screen. The
   parent screen states the same scope in the third person. */
function SharedRow({ go, openTab }) {
  return (
    <button type="button" onClick={() => go('shared')}
      className="mt-12 flex min-h-[56px] w-full items-center gap-4 border-y border-rule py-4
        text-left transition-colors duration-150 hoverOnly:bg-mist/50">
      <span className="min-w-0 flex-1">
        <span className="block text-body text-ink">{CONSENT_SHORT}</span>
        <span className="block text-meta text-ink-2">See who can see what</span>
      </span>
      <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
    </button>
  )
}

/* `picked` lives here, not in RainbowKey: SensorDetail opens below both the
   dial and the key, so they share the selection. */
function TodayDemo({ go, openTab }) {
  const rings = studentRings()
  const usual = Math.round((DATA.band.lo + DATA.band.hi) / 2)
  const [picked, setPicked] = React.useState(null)
  const open = rings.find(r => r.id === picked)
  const tier = bandOf(TODAY.score)
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-row font-bold text-ink">Your {SCORE} today</h2>
        <span className="note">{TODAY.at}</span>
      </div>

      {/* The sentence, then the number. Never the other way round. */}
      <section className="mt-7">
        <p className="mx-auto max-w-[34ch] text-center font-display text-row font-medium text-ink">
          {daySentence(TODAY.score, usual, rings)}</p>
        <div className="mx-auto mt-7 flex max-w-[30rem] flex-col items-center">
          <RainbowDial score={TODAY.score} usual={usual} rings={rings} size={360}
            picked={picked} onPick={id => setPicked(p => (p === id ? null : id))}/>
          <p className="mt-3 flex items-center gap-2.5 font-display text-ui font-medium text-ink">
            <span aria-hidden
              className={cn('h-4 w-[3px] shrink-0 rounded-bar', TIER_BAR[tier.key])}/>
            {cap(tier.word)}
          </p>
        </div>
      </section>

      <h2 className="mark mt-12">Each signal, out of 100</h2>
      <RainbowKey className="mt-0" rings={rings} picked={picked} onPick={setPicked}/>
      {open && <SensorDetail ring={open} onClose={() => setPicked(null)}/>}

      <SharedRow go={go} openTab={openTab}/>

      <AllDetail>
        <h3 className="mark">Your {SCORE} through the day</h3>
        <p className="mt-1.5 mb-2 text-sec text-ink-3">The shaded band is your normal range.</p>
        <DayChart data={DATA.day} band={DATA.band}/>
        <p className="mt-6 max-w-[64ch] text-meta text-ink-2">Each band on the arch is one
          signal&rsquo;s distance from your own last two weeks. The middle number blends all four, so
          the bands do not add up to it.</p>
      </AllDetail>
    </>
  )
}

/* Real mode has no honest zero for a score, a dial or a signal, so the unpaired
   screen answers for the whole tab and draws its four channels blank rather
   than drawing the dial at 0, which is a calm day and a real measurement. */
function StudentToday({ go, openTab }) {
  const [mode] = useMode()
  if (mode === 'real') return <StudentBody go={go} openTab={openTab}/>
  return <TodayDemo go={go} openTab={openTab}/>
}

/* One screen per route, no tab strip. The strip here listed Today, Take a
   reading and Who sees what, which is what the bar at the bottom of the app
   already offers: two rows of the same three destinations, one of them cut off
   the side of a 390px screen. The bar won. */
const PANES = { today: StudentToday, check: CheckInBody, shared: PrivacyBody }

const COPY = {
  today: { sub: 'Your reading for today, what moved it, and what leaves your phone.',
           note: 'Every figure on this screen is generated. Take a reading scores your own answers for real.',
           realNote: 'No patch is paired, so today has no reading yet.' },
  check: { sub: 'Six questions, or the camera and microphone. About a minute either way.' },
  shared: { sub: 'What leaves your phone, and what never does.' },
}

export function Students({ go, tab = 'today' }) {
  const Pane = PANES[tab] || StudentToday
  const copy = COPY[tab] || {}
  return (
    <SectionShell go={go} sub={copy.sub} note={copy.note} realNote={copy.realNote}>
      <Pane go={go}/>
    </SectionShell>
  )
}
