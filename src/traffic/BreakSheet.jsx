import React from 'react'
import { MM, StatusBar } from './ios'
import { cn } from '../lib/utils'

/* "Take 2 minutes": what "Take a break" opens. Three things a teen might
 * actually pick, then the one this phone picks, run on screen. Drawn in
 * MindMap's own type and colours, inside the phone, in device points.
 *
 * `state` is set by the script through the phone's handle:
 *   { open, picked, activity, trial, phase, ms, results, steps, secs,
 *     end, back, backDown } */

export const OPTIONS = [
  { key: 'react', title: 'Reaction Test', sub: '60-second tap game', Icon: TapIcon },
  { key: 'walk', title: 'Short Walk', sub: '3 minutes, steps counted', Icon: WalkIcon },
  { key: 'exhale', title: 'Long Exhale', sub: 'The mic measures your exhale', Icon: MicIcon },
]

function TapIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>
    </svg>
  )
}
function WalkIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="13" cy="4.2" r="1.8"/><path d="M10.5 21l2-6 2.5 2.5V21M8 12.5l2.5-4.5 4 1.5 2 3M12.5 15l-1-5"/>
    </svg>
  )
}
function MicIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>
    </svg>
  )
}

const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function Reaction({ state, reduced }) {
  const { trial = 0, phase = 'wait', ms, results = [] } = state
  const R = 92, C = 2 * Math.PI * R
  const filling = phase === 'wait'
  return (
    <div className="flex flex-1 flex-col items-center px-6 pt-6">
      <p className="m-0 text-[15px]" style={{ color: MM.ink3, fontFamily: MM.body }}>Tap when the ring is full</p>
      <div className="relative mt-6 grid size-[220px] place-items-center">
        <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden className="absolute inset-0 -rotate-90">
          <circle cx="110" cy="110" r={R} fill="none" stroke={MM.rule} strokeWidth="14"/>
          <circle key={`${trial}-${phase}`} cx="110" cy="110" r={R} fill="none" stroke={MM.accent} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={C}
            style={reduced
              ? { strokeDashoffset: filling ? C * 0.5 : 0, transition: 'none' }
              : { strokeDashoffset: filling ? C : 0, animation: filling ? 'hu-ring 1.2s cubic-bezier(0.23,1,0.32,1) forwards' : 'none' }}/>
        </svg>
        {phase === 'tap' && !reduced && (
          <span aria-hidden className="absolute size-[120px] rounded-full" style={{ background: 'rgba(21,116,70,0.18)', animation: 'hu-tap 600ms ease-out forwards' }}/>
        )}
        <span className="relative text-[44px] font-bold tabular-nums leading-none" style={{ fontFamily: MM.display, color: MM.ink }}>
          {phase === 'tap' && ms ? `${ms} ms` : ''}
        </span>
      </div>
      <ol className="m-0 mt-8 flex list-none gap-3 p-0">
        {[0, 1, 2].map(i => (
          <li key={i} className="grid h-[44px] w-[92px] place-items-center rounded-[8px] text-[17px] font-semibold tabular-nums"
            style={{ border: `1px solid ${MM.rule}`, background: '#fff', color: results[i] ? MM.ink : MM.ink3, fontFamily: MM.body }}>
            {results[i] ? `${results[i]} ms` : `Try ${i + 1}`}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Walk({ state }) {
  const { steps = 0, secs = 0 } = state
  return (
    <div className="flex flex-1 flex-col items-center px-6 pt-10">
      <p className="m-0 text-[15px]" style={{ color: MM.ink3, fontFamily: MM.body }}>Steps</p>
      <p className="m-0 mt-2 text-[96px] font-bold tabular-nums leading-none" style={{ fontFamily: MM.display, color: MM.ink }}>{steps}</p>
      <div className="mt-10 h-[10px] w-full overflow-hidden rounded-[5px]" style={{ background: MM.rule }}>
        <div className="h-full" style={{ width: `${Math.min(100, (secs / 120) * 100)}%`, background: MM.accent }}/>
      </div>
      <p className="m-0 mt-3 text-[22px] font-semibold tabular-nums" style={{ color: MM.ink2, fontFamily: MM.body }}>{fmt(secs)} of 2:00</p>
    </div>
  )
}

export default function BreakSheet({ state, reduced }) {
  if (!state?.open) return null
  const { picked, activity, end, back, backDown } = state
  const title = activity === 'react' ? 'Reaction Test' : activity === 'walk' ? 'Short Walk' : 'Take 2 minutes'
  return (
    <div className="absolute inset-0 z-40 flex flex-col" style={{ background: MM.paper, fontFamily: MM.body, color: MM.ink,
      animation: reduced ? 'hu-fade 240ms ease-out' : 'hu-sheet 360ms cubic-bezier(0.23,1,0.32,1)' }}>
      <style>{`@keyframes hu-sheet{from{transform:translateY(100%)}to{transform:none}}
@keyframes hu-fade{from{opacity:0}to{opacity:1}}
@keyframes hu-ring{to{stroke-dashoffset:0}}
@keyframes hu-tap{from{transform:scale(.6);opacity:1}to{transform:scale(1.5);opacity:0}}`}</style>
      <StatusBar/>
      <div className="px-6 pt-5">
        <p className="m-0 text-[15px] font-bold" style={{ fontFamily: MM.display, color: MM.accent }}>
          <span style={{ color: MM.ink }}>Mind</span>Map
        </p>
        <h3 className="m-0 mt-1 text-[32px] font-bold leading-[38px]" style={{ fontFamily: MM.display, color: MM.ink }}>{title}</h3>
      </div>

      {!activity && (
        <ul className="m-0 mt-6 list-none px-4 py-0">
          {OPTIONS.map(o => {
            const on = picked === o.key
            return (
              <li key={o.key} className="mb-3 flex items-center gap-3.5 rounded-[14px] px-4 py-4 transition-colors duration-200"
                style={{ background: on ? '#dcefe4' : '#fff', border: `1px solid ${on ? MM.accent : MM.rule}` }}>
                <span className="grid size-[46px] shrink-0 place-items-center rounded-[12px]"
                  style={{ background: on ? MM.accent : '#dcefe4', color: on ? '#fff' : MM.accent }}><o.Icon/></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[19px] font-bold leading-6" style={{ fontFamily: MM.display }}>{o.title}</span>
                  <span className="block text-[15px] leading-5" style={{ color: MM.ink3 }}>{o.sub}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {activity === 'react' && !end && <Reaction state={state} reduced={reduced}/>}
      {activity === 'walk' && !end && <Walk state={state}/>}

      {end && (
        <div className="flex flex-1 flex-col justify-center px-7 pb-24">
          <p className="m-0 text-[30px] font-bold leading-[38px]" style={{ fontFamily: MM.display, color: MM.ink }}>{end}</p>
        </div>
      )}

      {back && (
        <div className="absolute inset-x-6 bottom-12">
          <span className={cn('grid h-[52px] place-items-center rounded-[8px] text-[17px] font-semibold text-white')}
            style={{ background: backDown ? MM.accentInk : MM.accent, transform: backDown && !reduced ? 'scale(0.97)' : 'none',
              transition: 'background-color 120ms, transform 120ms' }}>
            {back}
          </span>
        </div>
      )}
    </div>
  )
}
