import React from 'react'
import { ActivityScreen, Sheet, Choice } from '../../toolkit/shell'
import { LampFace } from '../../traffic/Face'
import { Crisis, Label } from './common'

// Next Step Guide: a fixed table of three lights by three trends. A yes on the safety question overrides every cell.
const LIGHTS = [['green', 'Green'], ['yellow', 'Yellow'], ['red', 'Red']]
const TRENDS = [['settling', 'Settling'], ['same', 'About the same'], ['rising', 'Rising'], ['few', 'Too few days']]
const SAFETY = [['no', 'No'], ['unasked', 'Not asked yet'], ['yes', 'Yes, or unsure']]

const TABLE = {
  green: {
    settling: { step:'Routine check-in at the next session.', ask:'What helped this week?' },
    same:     { step:'Routine check-in at the next session.', ask:'Anything coming up this week?' },
    rising:   { step:'Check in at the next session.',         ask:'What changed recently?' },
  },
  yellow: {
    settling: { step:'Check in this week.',                ask:'What has started to help?' },
    same:     { step:'Check in within a few days.',        ask:'How are sleep and school load?' },
    rising:   { step:'See them this week.',                ask:'What is adding pressure right now?' },
  },
  red: {
    settling: { step:'Contact them today or tomorrow.',    ask:'Ask directly how safe they feel.' },
    same:     { step:'Contact them today.',                ask:'Ask directly about safety.' },
    rising:   { step:'Contact them today. Involve your team.', ask:'Ask directly about safety.' },
  },
}

const DIRECT = 'Sometimes when people feel this low, they think about ending their life. Has that happened for you?'

export function NextStepGuide({ onBack }) {
  const [light, setLight] = React.useState(null)
  const [trend, setTrend] = React.useState(null)
  const [safe, setSafe] = React.useState(null)

  const danger = safe === 'yes'
  const row = light && trend ? TABLE[light][trend === 'few' ? 'same' : trend] : null
  const askSafety = !danger && (light === 'red' || safe === 'unasked')

  // On a phone the answer sits below the questions, so it is scrolled into view when it appears.
  const out = React.useRef(null)
  const ready = danger || !!row
  React.useEffect(() => {
    if (!ready || !out.current || window.innerWidth >= 1024) return
    out.current.scrollIntoView({ block:'start', behavior:'smooth' })
  }, [ready, danger])

  return (
    <ActivityScreen id="pro-triage" title="Next Step Guide" onBack={onBack}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Sheet>
          <Label>Light today</Label>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {LIGHTS.map(([id, label]) => (
              <Choice key={id} on={light === id} onClick={() => setLight(id)}>
                <LampFace light={id} size={22}/>{label}
              </Choice>
            ))}
          </div>

          <Label className="mt-6">Trend over two weeks</Label>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {TRENDS.map(([id, label]) => (
              <Choice key={id} on={trend === id} onClick={() => setTrend(id)}>{label}</Choice>
            ))}
          </div>

          <Label className="mt-6">Has the teen said anything about not being safe?</Label>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {SAFETY.map(([id, label]) => (
              <Choice key={id} on={safe === id} onClick={() => setSafe(id)}>{label}</Choice>
            ))}
          </div>
        </Sheet>

        <div ref={out} aria-live="polite" className="flex scroll-mt-20 flex-col gap-4">
          {danger ? (
            <Crisis strong/>
          ) : row ? (
            <Sheet>
              <p className="kit-ink font-display text-ui font-bold">Next step</p>
              <p className="mt-1 font-display text-head font-bold tracking-tight text-ink">{row.step}</p>
              <p className="mt-4 kit-ink font-display text-ui font-bold">Ask</p>
              <p className="mt-1 text-body text-ink">{row.ask}</p>
              {trend === 'few' && (
                <p className="mt-4 text-sec text-ink-2">Too few days for a trend. Go by the light and what you know.</p>
              )}
              {askSafety && (
                <div className="kit-ground mt-5 rounded-[14px] p-4">
                  <p className="font-display text-ui font-bold text-ink">Ask about safety directly</p>
                  <p className="mt-1.5 text-sec text-ink">“{DIRECT}”</p>
                  <p className="mt-2 text-fine text-ink-2">Then use your service's risk assessment.</p>
                </div>
              )}
            </Sheet>
          ) : (
            <Sheet>
              <p className="text-sec text-ink-2">
                {light || trend ? 'Pick one more.' : 'Pick today\'s light and the trend.'}
              </p>
            </Sheet>
          )}
          {!danger && <Crisis/>}
        </div>
      </div>
      <p className="note mt-4 max-w-[64ch]">This guide does not diagnose. The light shows a pattern in readings.
        Use your clinical judgement and your service's protocol.</p>
    </ActivityScreen>
  )
}
