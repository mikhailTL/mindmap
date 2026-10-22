import React from 'react'

function Book({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 6.5C10.2 5.2 7.6 4.6 4 4.8v12.6c3.6-.2 6.2.4 8 1.7 1.8-1.3 4.4-1.9 8-1.7V4.8c-3.6-.2-6.2.4-8 1.7Z"/>
      <path d="M12 6.5v12.6"/>
    </svg>
  )
}

export function AboutButton({ onClick, style }) {
  return (
    <span style={style} className="mb-1 mt-4 inline-flex">
      <button type="button" onClick={onClick} aria-haspopup="dialog"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-chip border border-accent/45 bg-card/80 pl-4 pr-5
          font-display text-ui font-bold text-ink shadow-card transition-colors duration-150 ease-out
          hoverOnly:border-accent hoverOnly:bg-accent-wash active:bg-accent-wash"><Book className="size-[18px] shrink-0 text-accent"/>About</button>
    </span>
  )
}
