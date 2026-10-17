import React from 'react'
import { LogoMark } from '../ui/logo'
import { cn } from '../lib/utils'

/* iOS conventions, drawn once for every phone on the Heads Up page. These are
 * the system's own shapes and colours, never a company's logo or wordmark. */

export const IOS = {
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif',
  blue: '#0868d4', grey: '#e9e9eb', label: '#000000', secondary: 'rgba(60,60,67,0.78)',
  green: '#34c759', yellow: '#ffcc00', red: '#ff3b30',
}

/* MindMap's own colours for its notification. */
export const MM = {
  paper: '#f7faf8', rule: '#c2d7ca', ink: '#0d2b1e', ink2: '#2a5744', ink3: '#426a58',
  accent: '#157446', accentInk: '#0f5836', lit: '#3ecf9a', crit: '#a8321f',
  display: 'Quicksand, -apple-system, system-ui, sans-serif',
  body: 'Chivo, -apple-system, system-ui, sans-serif',
}

/* The MindMap app icon: the mark in white on the brand green, 7 px corners
   at 30 px. */
export function AppIcon({ size = 30, className }) {
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center text-white', className)}
      style={{ width: size, height: size, borderRadius: size * (7 / 30), background: MM.accent, ['--logo-peak']: MM.lit }}>
      <LogoMark className="w-[74%]"/>
    </span>
  )
}

/* MindMap's notification. A solid paper card, a 1 px rule, 18 px corners, a
 * soft shadow and a 4 px strip down the left edge: accent green, or red on
 * the parent's red alert. The icon, then "Mind" and "Map" in the brand's two
 * inks with the time on the right, the body under, and optional actions under
 * a rule. `show` slides it down once; under reduced motion it fades.
 *
 * Where it sits: on a phone with a Dynamic Island the banner hangs just under
 * the island. The island (src/ui/iphone.jsx) is 36 pt tall at 12 pt from the
 * top of the screen, so its bottom edge is at 48 and the banner's top edge
 * goes 8 under it, in screen points. */
export const ISLAND_BOTTOM = 12 + 36
export const BANNER_TOP = ISLAND_BOTTOM + 8

export function IosNotification({
  show, body, time = 'now', reduced, tone = 'accent', lead, actions, pressed,
  className, top = BANNER_TOP, onAction,
}) {
  const strip = tone === 'crit' ? MM.crit : MM.accent
  return (
    <div role="status" aria-live="polite"
      className={cn('pointer-events-none absolute inset-x-2 z-30', className)} style={{ top }}>
      <div aria-hidden={!show}
        className={cn('relative overflow-hidden',
          reduced ? 'transition-opacity duration-300' : 'transition-[transform,opacity] duration-[360ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
          show ? 'translate-y-0 opacity-100' : (reduced ? 'opacity-0' : '-translate-y-[125%] opacity-0'))}
        style={{ background: MM.paper, border: `1px solid ${MM.rule}`, borderRadius: 18,
          boxShadow: '0 8px 24px rgba(13,43,30,0.18)', fontFamily: MM.body, color: MM.ink }}>
        <span aria-hidden className="absolute inset-y-0 left-0 w-[4px]" style={{ background: strip }}/>
        <div className="flex gap-2.5 py-2.5 pl-[15px] pr-3">
          <AppIcon size={30} className="mt-0.5"/>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="m-0 text-[15px] font-bold leading-5" style={{ fontFamily: MM.display, color: MM.ink }}>
                Mind<span style={{ color: MM.accent }}>Map</span>
              </p>
              <span className="shrink-0 text-[12px] leading-5" style={{ color: MM.ink3 }}>{time}</span>
            </div>
            {body && (
              <p className="m-0 mt-0.5 flex items-start gap-1.5 text-[15px] leading-5" style={{ color: MM.ink }}>
                {lead && <span className="mt-[2px] shrink-0">{lead}</span>}
                <span>{body}</span>
              </p>
            )}
          </div>
        </div>
        {actions?.length > 0 && (
          <div className="flex items-center gap-2 px-3 pb-2.5 pt-2.5" style={{ borderTop: `1px solid ${MM.rule}` }}>
            {actions.map((a, i) => {
              const down = pressed === i
              return a.primary ? (
                <button key={a.label} type="button" tabIndex={-1} onClick={() => onAction?.(i)}
                  className="pointer-events-auto h-[36px] flex-1 rounded-[8px] px-3 text-[15px] font-semibold text-white outline-none"
                  style={{ background: down ? MM.accentInk : MM.accent, fontFamily: MM.body,
                    transform: down && !reduced ? 'scale(0.97)' : 'none', transition: 'background-color 120ms, transform 120ms' }}>
                  {a.label}
                </button>
              ) : (
                <button key={a.label} type="button" tabIndex={-1} onClick={() => onAction?.(i)}
                  className="pointer-events-auto h-[36px] px-3 text-[15px] font-semibold outline-none"
                  style={{ color: MM.ink2, fontFamily: MM.body, background: 'transparent' }}>
                  {a.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* The status bar: time on the left, signal, wifi and battery on the right,
 * drawn in the current text colour so it works on light and dark screens. */
export function StatusBar({ time = '9:41', dark = false, className }) {
  const c = dark ? '#fff' : '#000'
  return (
    <div aria-hidden className={cn('flex h-[47px] items-end justify-between px-7 pb-2.5', className)}
      style={{ fontFamily: IOS.font, color: c }}>
      <span className="text-[16px] font-semibold tracking-[-0.01em]">{time}</span>
      <span className="flex items-center gap-1.5">
        <svg width="18" height="11" viewBox="0 0 18 11" fill={c}><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="6" rx="1"/><rect x="10" y="2.5" width="3" height="8.5" rx="1"/><rect x="15" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill={c}><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.1-1.2A10.2 10.2 0 0 0 8 .6 10.2 10.2 0 0 0 .9 3.4L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.3c1.4 0 2.6.5 3.6 1.4l1.1-1.2A6.8 6.8 0 0 0 8 3.9a6.8 6.8 0 0 0-4.7 1.8l1.1 1.2c1-.9 2.2-1.4 3.6-1.4Zm0 3.2c-.6 0-1.1.2-1.5.6L8 10.9l1.5-1.6c-.4-.4-.9-.6-1.5-.6Z"/></svg>
        <svg width="27" height="12" viewBox="0 0 27 12"><rect x="0.5" y="0.5" width="23" height="11" rx="3.5" fill="none" stroke={c} strokeOpacity="0.4"/><rect x="2" y="2" width="18" height="8" rx="2" fill={c}/><rect x="24.5" y="4" width="1.6" height="4" rx="0.8" fill={c} fillOpacity="0.4"/></svg>
      </span>
    </div>
  )
}
