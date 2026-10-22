import React from 'react'
import { cn } from '../../lib/utils'
import { BADGES } from './progress'

// Coin colours are theme `deep` tones, so the white line drawing clears 4.5:1.
const COLOUR = {
  first:'#0f5836', plan:'#0967ab', script:'#b23009', clean:'#825d07', firstaid:'#a8321f',
  five:'#6f09b2', ten:'#b2095e', 'all-tabs':'#11677f', 'calm-kit':'#067049',
  'set-school':'#0967ab', 'set-outside':'#b2095e', 'set-life':'#067049', 'set-career':'#825d07',
  'whole-kit':'#6f09b2',
}

const ART = {
  first:    <><path d="M8 20V5"/><path d="M8 5.5h9l-2 3 2 3H8"/></>,
  plan:     <><rect x="4.5" y="6" width="15" height="13" rx="2"/><path d="M4.5 10h15M9 4v3.5M15 4v3.5M9 14.5l2 2 4-4"/></>,
  script:   <><path d="M4.5 6h15v9h-8l-4 3.5V15h-3z"/><path d="M8 9.5h8M8 12h5"/></>,
  clean:    <path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>,
  firstaid: <><rect x="4.5" y="4.5" width="15" height="15" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/></>,
  five:     <><circle cx="12" cy="6.5" r="1.6"/><circle cx="6.5" cy="10.5" r="1.6"/><circle cx="17.5" cy="10.5" r="1.6"/><circle cx="8.5" cy="17" r="1.6"/><circle cx="15.5" cy="17" r="1.6"/></>,
  ten:      <><path d="M7.5 7.5l2-1.5V18"/><ellipse cx="15" cy="12" rx="3" ry="6"/></>,
  'all-tabs': <><circle cx="12" cy="12" r="7.5"/><path d="M12 4.5V12l6.5 3.8M12 12l-6.5 3.8"/></>,
  'calm-kit': <><path d="M4 13c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 6-3"/><path d="M4 17.5c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 6-3"/></>,
  'set-school':  <><path d="M3.5 9.5L12 5l8.5 4.5L12 14z"/><path d="M7 11.5v4c1.5 1.5 3 2 5 2s3.5-.5 5-2v-4"/></>,
  'set-outside': <><circle cx="9" cy="9" r="3"/><circle cx="16" cy="10" r="2.4"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M13.5 19a4 4 0 0 1 7 0"/></>,
  'set-life':    <><path d="M4.5 11.5L12 5l7.5 6.5"/><path d="M6.5 10v9h11v-9"/><path d="M10 19v-4.5h4V19"/></>,
  'set-career':  <><rect x="4" y="8" width="16" height="11" rx="2"/><path d="M9 8V6h6v2M4 12.5h16"/></>,
  'whole-kit':   <><path d="M4.5 17.5L3.5 8l5 3.5L12 5l3.5 6.5 5-3.5-1 9.5z"/><path d="M4.5 17.5h15"/></>,
}

export function BadgeIcon({ id, earned = true, size = 40, className, shine = false }) {
  const c = COLOUR[id] || '#0f5836'
  return (
    <span aria-hidden className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-full', className)}
      style={{ width:size, height:size,
               background: earned
                 ? `radial-gradient(circle at 32% 26%, color-mix(in srgb, ${c} 45%, #ffffff) 0%, ${c} 46%, color-mix(in srgb, ${c} 78%, #000000) 100%)`
                 : 'repeating-linear-gradient(135deg, #f4f8f6 0 5px, #ffffff 5px 10px)',
               border: earned ? 'none' : '2px dashed #9fbcae',
               boxShadow: earned
                 ? `inset 0 0 0 ${Math.max(2, size * 0.07)}px color-mix(in srgb, ${c} 55%, #ffffff), inset 0 -${size * 0.08}px ${size * 0.14}px rgba(0,0,0,.22), 0 ${size * 0.06}px ${size * 0.16}px color-mix(in srgb, ${c} 45%, transparent)`
                 : 'none',
               color: earned ? '#ffffff' : '#426a58' }}>
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none" stroke="currentColor"
        strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" focusable="false"
        className="relative">{ART[id]}</svg>
      {earned && shine && <span className="g-glint"/>}
    </span>
  )
}

export const badgeColour = id => COLOUR[id] || '#0f5836'
export { BADGES }
