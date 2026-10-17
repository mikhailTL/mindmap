import React from 'react'
import { PatchFront } from '../../../charts/patch-front'
import { SENSORS, SENSOR_ORDER } from '../../../lib/sensors'
import { cn } from '../../../lib/utils'
import { Card, Demo, DemoTag, Flow, Stage, Trace, useSteps, useWidth } from './kit'

/* The patch: what each of its four channels is designed to read, and the
 * movement check that keeps a hard run from counting as a hard day. Every
 * line is the sensor's own copy in lib/sensors.js; the 0.35 g limit is the
 * one signals/motion.js uses. */

const WAVE = { heart: 'pulse', sweat: 'sweat', temp: 'temp', move: 'move' }
const HOLDS = [2800, 3400, 2600]

export default function PatchDemo() {
  const [ref, w] = useWidth()
  const wide = w >= 640
  const { step } = useSteps(ref, HOLDS)
  const moving = step === 1

  const label = `The patch design and its four channels, with demo data. Heart: ${SENSORS.heart.short}
    Sweat: ${SENSORS.sweat.short} Temperature: ${SENSORS.temp.short} Movement: ${SENSORS.move.short}
    A movement check sits before the score: above 0.35 g, as on a run, the score is held back rather than
    counted as stress. Sitting still, the readings go on to the Mind Score network.`

  return (
    <Demo innerRef={ref} label={label}>
      <div className={cn('flex', wide ? 'flex-row items-stretch gap-1' : 'flex-col')}>
        <Stage n="1" title="The patch" className={wide ? 'w-[132px]' : ''}>
          <div className={cn('flex', wide ? 'flex-col items-center' : 'items-center gap-4')}>
            <PatchFront size={wide ? 112 : 92} label="The MindMap patch design, front view"/>
            <p className={cn('m-0 text-fine leading-snug text-ink-2', wide ? 'mt-2 text-center' : '')}>
              Designed to read four signals from the skin.
            </p>
          </div>
        </Stage>

        <Flow wide={wide}/>

        <Stage n="2" title="Four channels" className="flex-1">
          <Card className="flex flex-col divide-y divide-rule p-0">
            {SENSOR_ORDER.map(id => {
              const s = SENSORS[id]
              const Icon = s.icon
              const hot = moving && (id === 'move' || id === 'heart')
              return (
                <div key={id} className="flex items-start gap-2.5 px-3 py-2">
                  <span aria-hidden className="mt-0.5 shrink-0" style={{ color: s.glow }}><Icon size={20}/></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-fine font-bold text-ink">{s.name}</span>
                      <Trace kind={WAVE[id]} color={s.glow} w={wide ? 96 : 84} h={hot ? 22 : 16} fast={hot}/>
                    </span>
                    <span className="block text-fine leading-snug text-ink-2">{s.short}</span>
                  </span>
                </div>
              )
            })}
          </Card>
        </Stage>

        <Flow wide={wide}/>

        <Stage n="3" title="Movement check" className={wide ? 'w-[190px]' : ''}>
          <Card className={cn('mm-dd-fade flex flex-col gap-2', moving ? 'border-sun bg-sun-wash' : '')}>
            <p className="m-0 flex items-baseline justify-between gap-2">
              <span className="text-fine text-ink-2">Movement now</span>
              <span className="font-display text-ui font-bold tabular-nums text-ink">{moving ? '0.52' : '0.01'} g</span>
            </p>
            {/* the limit, drawn as a scale */}
            <div aria-hidden className="relative h-2.5 rounded-bar bg-mist">
              <span className="absolute inset-y-0 left-0 rounded-bar bg-[#1560e0] transition-[width] duration-700 ease-out"
                style={{ width: moving ? '74%' : '3%' }}/>
              <span className="absolute -inset-y-1 w-[2px] bg-ink" style={{ left: '50%' }}/>
            </div>
            <p className="m-0 text-[13px] leading-tight text-ink-2">Line at 0.35 g</p>
            <p className="m-0 font-display text-ui font-bold leading-snug text-ink">
              {moving ? 'Held back. A run is not stress.' : 'Counted. On to the Mind Score.'}
            </p>
          </Card>
          <p className="m-0 mt-2 text-fine leading-snug text-ink-2">
            {moving ? 'Above 0.35 g the score waits.' : 'Sitting still, every channel counts.'}
          </p>
        </Stage>
      </div>
      <DemoTag className="mt-3"/>
    </Demo>
  )
}
