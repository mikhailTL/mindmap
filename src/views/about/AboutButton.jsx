import React from 'react'

/* The About button on the app's front page, with a slow travelling outline and
   a small gold star so it reads as something to open (owner, 18 October: "a
   cute animated box around the about ... a nice little golden star on it").
   Ambient motion, so it runs past the UI ceiling: background-position on the
   outline, opacity and transform on the ring and star. Reduced motion, the app
   setting included, gets the same drawing standing still. */

const CSS = `
.ab-btn {
  border: 2px solid transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(90deg, #157446, #1d8fb0, #f2b705, #3ecf9a, #157446) border-box;
  background-size: 100% 100%, 200% 100%;
  animation: ab-travel 6s linear infinite;
}
.ab-ring {
  box-shadow: 0 0 0 2px rgb(242 183 5 / 0.32), 0 0 16px 1px rgb(242 183 5 / 0.22);
  animation: ab-pulse 3.2s ease-in-out infinite;
}
.ab-star { filter: drop-shadow(0 0 3px rgb(242 183 5 / 0.85)) drop-shadow(0 1px 1px rgb(130 93 7 / 0.35)); }
.ab-star-body { transform-origin: 50% 50%; animation: ab-twinkle 3.6s ease-in-out infinite; }
.ab-glint { transform-origin: 50% 50%; animation: ab-glint 3.6s ease-in-out infinite; }
@keyframes ab-travel { from { background-position: 0 0, 0% 0 } to { background-position: 0 0, 200% 0 } }
@keyframes ab-pulse {
  0%, 100% { opacity: .35; transform: scale(0.97) }
  50%      { opacity: 1;   transform: scale(1.04) }
}
@keyframes ab-twinkle {
  0%, 70%, 100% { transform: scale(1) rotate(0deg) }
  80%           { transform: scale(1.18) rotate(14deg) }
  90%           { transform: scale(0.96) rotate(-4deg) }
}
@keyframes ab-glint {
  0%, 72%, 100% { opacity: 0; transform: scale(.4) }
  82%           { opacity: 1; transform: scale(1) }
}
@media (prefers-reduced-motion: reduce) {
  .ab-btn, .ab-ring, .ab-star-body, .ab-glint { animation: none !important; }
  .ab-ring { opacity: .7; }
}
[data-motion="reduce"] .ab-btn, [data-motion="reduce"] .ab-ring,
[data-motion="reduce"] .ab-star-body, [data-motion="reduce"] .ab-glint { animation: none !important; }
[data-motion="reduce"] .ab-ring { opacity: .7; }
`

/* A rounded five-point star, warm gold with a darker edge so it holds its
   shape on white. */
export function GoldStar({ className, glint = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <g className="ab-star-body">
        <path d="M12 2.6l2.75 5.75 6.3.8-4.63 4.37 1.18 6.24L12 16.7l-5.6 3.06 1.18-6.24L2.95 9.15l6.3-.8z"
          fill="#f2b705" stroke="#b07d00" strokeWidth="1.1" strokeLinejoin="round"/>
        <path d="M9.3 9.4l1.6-.25" stroke="#fff6cf" strokeWidth="1.3" strokeLinecap="round" opacity=".9"/>
      </g>
      {glint && (
        <g className="ab-glint" stroke="#fff3b0" strokeWidth="1.2" strokeLinecap="round">
          <path d="M20.6 2.2v3.2M19 3.8h3.2"/>
        </g>
      )}
    </svg>
  )
}

export function AboutButton({ onClick, style }) {
  return (
    <span style={style} className="relative mb-1 mt-3 inline-flex">
      <style>{CSS}</style>
      <span aria-hidden className="ab-ring pointer-events-none absolute -inset-1 rounded-chip"/>
      <button type="button" onClick={onClick} aria-haspopup="dialog"
        className="ab-btn relative min-h-[44px] rounded-chip px-6 font-display text-ui font-bold text-accent-ink
          shadow-card transition-transform duration-150 ease-out hoverOnly:-translate-y-px active:scale-[0.97]">
        About
      </button>
      <GoldStar glint className="ab-star pointer-events-none absolute -right-2.5 -top-2.5 size-[22px]"/>
    </span>
  )
}
