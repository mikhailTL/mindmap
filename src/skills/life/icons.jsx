import React from 'react'

/* Tile icons for the Life tools, drawn on the toolkit's 24 unit grid with the
   same 1.7 stroke as src/toolkit/index.jsx. */
const I = ({ children }) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0">{children}</svg>
)

export const HomeIcon   = () => <I><path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></I>
export const MoneyIcon  = () => <I><rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/></I>
export const StressIcon = () => <I><path d="M3 12h3l2-4 3 8 2-5 1.5 1H21"/><circle cx="12" cy="12" r="9.5" opacity=".45"/></I>
export const HealthIcon = () => <I><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M12 9v7M8.5 12.5h7M9 5V3.5h6V5"/></I>
