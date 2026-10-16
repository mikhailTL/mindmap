import React from 'react'
import { IPhone } from '../ui/iphone'
import { IOS, IosNotification, StatusBar } from './ios'
import { Light, NEVER_SHOWN, parentSummary } from '../signals/light.js'
import { useReduced } from '../toolkit/useReduced'
import { cn } from '../lib/utils'

/* The parent's phone, drawn as an iOS app screen: a large title, the light
 * as a real traffic light housing, one line under it, the week as seven small
 * housings, and an inset grouped list of what the parent never sees.
 *
 * Colour never carries the state alone. The lit lamp's position says it too
 * (red on top, green at the bottom, as on a street), and the word is always
 * printed beside or under it. Inside the phone the lamps use the iOS system
 * colours; nothing here is a capsule with text inside. */

const ORDER = [Light.RED, Light.YELLOW, Light.GREEN]
const LAMP = { [Light.GREEN]: IOS.green, [Light.YELLOW]: IOS.yellow, [Light.RED]: IOS.red }
const WORD = { [Light.GREEN]: 'Green', [Light.YELLOW]: 'Yellow', [Light.RED]: 'Red' }
const HOUSING = '#1c1c1e'

const known = light => (LAMP[light] ? light : Light.GREEN)

/* Word and lamp colour for a light. Kept under its old name for callers. */
export const styleFor = light => ({ word: WORD[known(light)], color: LAMP[known(light)] })

/* One lamp in a dark rounded housing: the small status indicator used
   wherever a light is named in a line of text. `size` is the housing in px. */
export function Lamp({ light, size = 18, className }) {
  const c = LAMP[known(light)]
  return (
    <span aria-hidden className={cn('inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size, borderRadius: size * 0.28, background: HOUSING }}>
      <span className="block rounded-full transition-[background-color] duration-300"
        style={{ width: size * 0.58, height: size * 0.58, background: c, boxShadow: `0 0 ${size * 0.35}px ${c}` }}/>
    </span>
  )
}

/* The lamp and its word, side by side, as plain text. */
export function LampLabel({ light, className, textClassName }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Lamp light={light}/>
      <span className={cn('font-display text-ui font-bold leading-none text-ink', textClassName)}>
        {WORD[known(light)]}
      </span>
    </span>
  )
}

/* Old name, still imported by the parent dashboard. Now the drawn lamp. */
export function LightPill({ light, className }) {
  return <LampLabel light={light} className={className}/>
}

/* The traffic light itself: three lamps stacked in a dark housing, the live
   one bright with a soft glow, the other two dim. `lamp` in px. */
export function TrafficLight({ light, lamp = 46, reduced, className }) {
  const on = known(light)
  const pad = lamp * 0.22
  return (
    <span aria-hidden className={cn('inline-flex flex-col items-center', className)}
      style={{ background: HOUSING, borderRadius: lamp * 0.5, padding: pad, gap: pad,
        boxShadow: '0 6px 18px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.06)' }}>
      {ORDER.map(l => {
        const lit = l === on
        return (
          <span key={l} className={cn('block rounded-full', !reduced && 'transition-[opacity,box-shadow] duration-500')}
            style={{ width: lamp, height: lamp, background: LAMP[l], opacity: lit ? 1 : 0.2,
              boxShadow: lit ? `0 0 ${lamp * 0.5}px ${LAMP[l]}, inset 0 -3px 6px rgba(0,0,0,0.18)` : 'inset 0 2px 6px rgba(0,0,0,0.5)' }}/>
        )
      })}
    </span>
  )
}

/* The demo week: six fixed days and today, which is the live light. */
const WEEK_FIXED = [Light.GREEN, Light.GREEN, Light.YELLOW, Light.GREEN, Light.GREEN, Light.GREEN]
const DAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_NAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Today']

export function WeekLights({ today }) {
  const week = [...WEEK_FIXED, known(today)]
  return (
    <ol aria-label={`This week: ${week.map((l, i) => `${DAY_NAME[i]} ${WORD[l].toLowerCase()}`).join(', ')}`}
      className="m-0 flex list-none justify-between p-0">
      {week.map((l, i) => (
        <li key={i} className="flex flex-col items-center gap-1.5">
          <TrafficLight light={l} lamp={9}/>
          <span aria-hidden className="text-[13px] leading-none"
            style={{ color: i === week.length - 1 ? IOS.label : IOS.secondary, fontWeight: i === week.length - 1 ? 600 : 400 }}>
            {DAY[i]}
          </span>
        </li>
      ))}
    </ol>
  )
}

const weekLine = today => {
  const week = [...WEEK_FIXED, known(today)]
  const n = l => week.filter(x => x === l).length
  const parts = [`${n(Light.GREEN)} green`, n(Light.YELLOW) && `${n(Light.YELLOW)} yellow`, n(Light.RED) && `${n(Light.RED)} red`]
  return `${parts.filter(Boolean).join(', ')} this week.`
}

const NOTIFY_MS = 10 * 1000

/* `live` is the state the teen's phone lifts every two seconds. */
export function ParentLight({ live, scale = 0.7, className }) {
  const reduced = useReduced()
  const light = known(live?.light)
  const minutes = live?.features?.minutes ?? 0
  const at = live?.state?.since ?? Date.now()
  const sum = parentSummary({ light, at, minutes, top: live?.top })

  /* The banner drops in when the light turns red, and goes after ten seconds. */
  const [notify, setNotify] = React.useState(false)
  const prev = React.useRef(light)
  React.useEffect(() => {
    const was = prev.current
    prev.current = light
    if (light !== Light.RED) { setNotify(false); return }
    if (was === Light.RED) return
    setNotify(true)
    const id = setTimeout(() => setNotify(false), NOTIFY_MS)
    return () => clearTimeout(id)
  }, [light])

  return (
    <IPhone interactive scale={scale} screenBg="#f2f2f7" label="The parent's phone" className={className}>
      <div className="relative flex min-h-0 flex-1 flex-col text-left"
        style={{ marginTop: -60, fontFamily: IOS.font, color: IOS.label }}>
        <StatusBar time="9:41"/>
        <IosNotification show={notify} title="Heads Up" body="Your teen's light turned red. Open to see when."
          reduced={reduced} className="top-[52px]"/>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
          <h2 className="m-0 px-1 text-[34px] font-bold leading-[41px] tracking-[0.01em]">Heads Up</h2>

          <div className="mt-3 flex flex-col items-center rounded-[12px] bg-white px-4 pb-3.5 pt-4 text-center">
            <TrafficLight light={light} lamp={34} reduced={reduced}/>
            <p aria-live="polite" className="m-0 mt-3 text-[22px] font-bold leading-7">{WORD[light]}</p>
            <p className="m-0 mt-1 text-[17px] leading-[22px]">{sum.line}</p>
            {sum.detail && (
              <p className="m-0 mt-1 max-w-[30ch] text-[15px] leading-5" style={{ color: IOS.secondary }}>{sum.detail}</p>
            )}
          </div>

          <h3 className="m-0 mt-4 px-1 text-[20px] font-bold leading-[25px]">This week</h3>
          <div className="mt-2 rounded-[12px] bg-white px-4 pb-3 pt-3.5">
            <WeekLights today={light}/>
            <p className="m-0 mt-3 text-[15px] leading-5" style={{ color: IOS.secondary }}>{weekLine(light)}</p>
          </div>

          <h3 className="m-0 mt-4 px-1 text-[20px] font-bold leading-[25px]">What you never see</h3>
          <ul className="m-0 mt-2 list-none overflow-hidden rounded-[12px] bg-white p-0">
            {NEVER_SHOWN.map(t => (
              <li key={t} className="flex min-h-[40px] items-center pl-4">
                <span className="flex min-h-[40px] flex-1 items-center border-b border-[rgba(60,60,67,0.18)] pr-4 text-[16px] leading-5
                  [li:last-child_&]:border-b-0">
                  {t}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </IPhone>
  )
}

export default ParentLight
