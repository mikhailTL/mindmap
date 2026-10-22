import React from 'react'
import { IPhone } from '../ui/iphone'
import { Light, parentSummary } from '../signals/light.js'
import { TrafficLight } from './Parent'
import { LampFace, LampFaceG } from './Face'
import { IosNotification, IOS, MM, StatusBar } from './ios'
import { KEY_OF, WEEK_PAST, USUAL_BAND, lightOfIndex, known } from './core'
import { cn } from '../lib/utils'

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_NAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Today']
const BAR = { [Light.GREEN]: '#34c759', [Light.YELLOW]: '#ffcc00', [Light.RED]: '#ff3b30' }

// `k` is a feature key from FEATURES in signals/light.js.
export function SignalIcon({ k, size = 20 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  switch (k) {
    case 'medianGap': return <svg {...p}><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7.5 14h9"/></svg>
    case 'deletions': return <svg {...p}><path d="M8 5h11.5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5.5-7Z"/><path d="m11.5 9.5 5 5m0-5-5 5"/></svg>
    case 'pxPerSec': return <svg {...p}><path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5"/></svg>
    case 'reversals': return <svg {...p}><path d="M8 20V4M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4"/></svg>
    case 'minutes': return <svg {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>
    case 'motion': return <svg {...p}><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M4 8v8M20 8v8"/></svg>
    default: return <svg {...p}><circle cx="12" cy="12" r="4"/></svg>
  }
}

export function SignalList({ signals, ios = true }) {
  if (!signals?.length) return null
  return (
    <div className="w-full text-left">
      <p className={cn('m-0 text-[15px] font-semibold', ios ? '' : 'font-display text-ui font-bold text-ink')}
        style={ios ? { color: IOS.secondary } : undefined}>Signals</p>
      <ul className="m-0 mt-1.5 list-none p-0">
        {signals.map(label => (
          <li key={label} className="flex min-h-[36px] items-center gap-2.5 border-t py-1.5" style={{ borderColor: 'rgba(60,60,67,0.16)' }}>
            <span className="grid size-[28px] shrink-0 place-items-center rounded-[7px]" style={{ background: '#dcefe4', color: MM.accentInk }}>
              <SignalIcon k={KEY_OF[label]} size={18}/>
            </span>
            <span className={cn('text-[16px] font-semibold leading-5', !ios && 'font-body text-ink')}
              style={ios ? { color: IOS.label } : undefined}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Monday to today: one lamp and one bar per day of the daily peak index (0 to 100),
// with the usual band shaded.
export function WeekGraph({ today = 0, width = 345, height = 158, ios = true }) {
  const vals = [...WEEK_PAST, Math.max(0, Math.min(100, Math.round(today)))]
  const lampRow = 26, H = height, top = lampRow + 18, bottom = 22, left = 34, right = 4
  const plotH = H - top - bottom
  const slot = (width - left - right) / 7
  const bw = Math.min(26, slot * 0.56)
  const y = v => top + plotH * (1 - v / 100)
  const ink = ios ? IOS.label : MM.ink
  const sub = ios ? IOS.secondary : MM.ink3
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${H}`} className="block" role="img"
      aria-label={`This week, daily peak stress index: ${vals.map((v, i) => `${DAY_NAME[i]} ${v}, ${lightOfIndex(v)}`).join('; ')}. Usual is ${USUAL_BAND[0]} to ${USUAL_BAND[1]}.`}>
      <rect x={left} y={y(USUAL_BAND[1])} width={width - left - right} height={y(USUAL_BAND[0]) - y(USUAL_BAND[1])} fill="#dcefe4"/>
      <text x={0} y={(y(USUAL_BAND[1]) + y(USUAL_BAND[0])) / 2 + 4} textAnchor="start" fontSize="10.5" fill={MM.accentInk} fontWeight="600">Usual</text>
      <line x1={left} x2={width - right} y1={y(0)} y2={y(0)} stroke="rgba(60,60,67,0.3)"/>
      {vals.map((v, i) => {
        const cx = left + slot * i + slot / 2
        const h = Math.max(2, y(0) - y(v))
        const l = lightOfIndex(v)
        return (
          <g key={i}>
            <rect x={cx - 11} y={1} width={22} height={22} rx={6} fill="#1c1c1e"/>
            <LampFaceG light={l} cx={cx} cy={12} size={16} px={16}/>
            <rect x={cx - bw / 2} y={y(0) - h} width={bw} height={h} rx="3" fill={BAR[l]}/>
            <text x={cx} y={y(0) - h - 4} textAnchor="middle" fontSize="11.5" fontWeight="700" fill={ink} style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</text>
            <text x={cx} y={H - 6} textAnchor="middle" fontSize="12" fontWeight={i === 6 ? 700 : 400} fill={i === 6 ? ink : sub}>{DAYS[i]}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* The light card: housing, headline, time, signals. */
export function LightCard({ light, at, signals, reduced, ios = true, lamp = 30 }) {
  const sum = parentSummary({ light: known(light), at, signals: signals || [] })
  return (
    <div className="flex w-full items-start gap-4">
      <TrafficLight light={sum.light} lamp={lamp} reduced={reduced} className="shrink-0"/>
      <div className="min-w-0 flex-1 text-left">
        <p aria-live="polite" className={cn('m-0 font-bold', ios ? 'text-[20px] leading-[25px]' : 'font-display text-row text-ink')}>
          {sum.headline}
        </p>
        {sum.time && (
          <p className={cn('m-0 mt-1', ios ? 'text-[15px] leading-5' : 'font-body text-ui text-ink-2')}
            style={ios ? { color: IOS.secondary } : undefined}>{sum.time}</p>
        )}
        <div className="mt-3"><SignalList signals={sum.signals} ios={ios}/></div>
      </div>
    </div>
  )
}

export function ParentPhone({ light, at, signals, today, scale, reduced, banner }) {
  return (
    <IPhone interactive={false} scale={scale} screenBg="#f2f2f7" label="The parent's phone" showHomeIndicator={false}>
      <div className="absolute inset-0 overflow-hidden" style={{ fontFamily: IOS.font, color: IOS.label }}>
        <StatusBar/>
        <IosNotification show={!!banner} tone="crit" reduced={reduced}
          lead={<LampFace light="red" size={16}/>}
          body="Your teen's light turned red. Open to see the signals."/>
        {/* 44 px clears the status bar and leaves room for the red banner above the headline. */}
        <div className="px-4 pt-[44px]">
          <h2 className="m-0 px-1 text-[34px] font-bold leading-[41px] tracking-[0.01em]" style={{ fontFamily: IOS.font }}>Heads Up</h2>
          <div className="mt-3 rounded-[12px] bg-white px-4 pb-3 pt-4" style={{ minHeight: 238 }}>
            <LightCard light={light} at={at} signals={signals} reduced={reduced}/>
          </div>
          <h3 className="m-0 mt-5 px-1 text-[20px] font-bold leading-[25px]" style={{ fontFamily: IOS.font }}>Trends</h3>
          <div className="mt-2 rounded-[12px] bg-white px-3 pb-2 pt-3">
            <WeekGraph today={today} height={232}/>
          </div>
        </div>
        <span aria-hidden className="pointer-events-none absolute bottom-2 left-1/2 h-[5px] w-[140px] -translate-x-1/2 rounded-full bg-black/30"/>
      </div>
    </IPhone>
  )
}
