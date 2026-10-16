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

/* The MindMap app icon: the mark in white on the brand green squircle. */
export function AppIcon({ size = 38, className }) {
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center bg-accent text-white', className)}
      style={{ width: size, height: size, borderRadius: size * 0.2237 }}>
      <LogoMark className="w-[70%]" />
    </span>
  )
}

/* A banner notification as iOS draws it: frosted, 22 px corners, the app icon
 * on the left, the title in semibold with the time beside it, the body under.
 * `show` slides it down from the top with transform and opacity only; under
 * reduced motion it fades. Children render under the body (action buttons).
 *
 * Where it sits: on a phone with a Dynamic Island the banner hangs just under
 * the island and never covers the status bar. The island (src/ui/iphone.jsx)
 * is 36 pt tall at 12 pt from the top of the screen, so its bottom edge is at
 * 48 and the banner's top edge goes 8 under it. Measured in screen points,
 * so the parent must be positioned against the screen's top. `top` is a
 * style, not a class, so it wins over any top class a caller still passes;
 * a caller that needs another place passes the `top` prop. */
export const ISLAND_BOTTOM = 12 + 36
export const BANNER_TOP = ISLAND_BOTTOM + 8

export function IosNotification({ show, title = 'MindMap', body, time = 'now', reduced, onClick, children, className, top = BANNER_TOP }) {
  return (
    <div role="status" aria-live="polite"
      className={cn('pointer-events-none absolute inset-x-2 z-30', className)} style={{ top }}>
      <div onClick={onClick}
        className={cn('pointer-events-auto flex gap-2.5 rounded-[22px] px-3 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.18)]',
          'transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          show ? 'translate-y-0 opacity-100' : (reduced ? 'opacity-0' : '-translate-y-[130%] opacity-0'))}
        style={{ fontFamily: IOS.font, background: 'rgba(246,246,248,0.84)',
          backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)' }}
        aria-hidden={!show}>
        <AppIcon size={38} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="m-0 truncate text-[15px] font-semibold leading-5" style={{ color: IOS.label }}>{title}</p>
            <span className="shrink-0 text-[13px] leading-5" style={{ color: IOS.secondary }}>{time}</span>
          </div>
          {body && <p className="m-0 text-[15px] leading-5" style={{ color: IOS.label }}>{body}</p>}
          {children}
        </div>
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
