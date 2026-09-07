import React from 'react'
import { cn } from '../lib/utils'

/* ──────────────────────────────────────────────────────────────
 * CREDIBILITY RAIL
 * The "logos" strip. Dims at rest so it reads as supporting
 * evidence, not decoration; resolves on hover; pauses when the
 * pointer is on it so names stay readable. Seam-free: the track
 * is duplicated once and translated exactly -50%.
 *
 * On paper "dim" is ink-3 rather than a faded white, and every
 * size step moved up to the project's floor — the original ran
 * 9–13px, which is unreadable type wearing a logo's clothes.
 * ────────────────────────────────────────────────────────────── */

function Monogram({ name }) {
  const letters = name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center rounded-xs border border-ink-3/40
        font-mono text-label tracking-[0.06em]"
    >
      {letters}
    </span>
  )
}

function Item({ item }) {
  const body = (
    <span className="flex items-center gap-3">
      {item.mark || <Monogram name={item.name} />}
      <span className="whitespace-nowrap font-display text-meta font-medium tracking-tight">{item.name}</span>
      {item.note && (
        <span className="whitespace-nowrap font-mono text-label uppercase tracking-[0.16em] text-ink-3">
          {item.note}
        </span>
      )}
    </span>
  )

  const shared = 'flex shrink-0 items-center text-ink-3 transition-colors duration-300 hover:text-ink'

  return item.href ? (
    <a href={item.href} target="_blank" rel="noreferrer" className={shared}>
      {body}
    </a>
  ) : (
    <span className={shared}>{body}</span>
  )
}

/**
 * @param label   Left-hand caption: "Built with", "Backed by", "Featured in".
 * @param items   [{ name, note?, href?, mark? }] — mark is an inline SVG node,
 *                falling back to a generated monogram.
 * @param speed   Seconds for one full pass. Higher is slower.
 */
export function CredibilityRail({
  label,
  items,
  speed = 46,
  reverse = false,
  className,
  bordered = true,
}) {
  /* Too few names to scroll — a 2-item marquee just reads as a
   * duplication bug. Fall back to the static row. */
  if (items.length < 5) {
    return (
      <div className={cn('px-6 py-5 sm:px-10', bordered && 'border-y border-rule', className)}>
        <CredibilityRow label={label} items={items} />
      </div>
    )
  }

  const track = [...items, ...items]

  return (
    <div className={cn('relative flex items-center gap-6 py-5', bordered && 'border-y border-rule', className)}>
      <style>{`
        @keyframes s21-rail-scroll {
          from { transform: translateX(0) }
          to   { transform: translateX(calc(-50% - 1.5rem)) }
        }
      `}</style>

      {label && <span className="lab z-10 shrink-0 pl-6 tracking-[0.22em] sm:pl-10">{label}</span>}

      <div
        className="group relative min-w-0 flex-1 overflow-hidden
          [mask-image:linear-gradient(to_right,transparent,black_5%,black_92%,transparent)]"
      >
        <div
          className="flex w-max items-center gap-12 will-change-transform
            group-hover:[animation-play-state:paused] motion-reduce:[animation:none]"
          style={{
            animation: `s21-rail-scroll ${speed}s linear infinite`,
            animationDirection: reverse ? 'reverse' : 'normal',
          }}
        >
          {track.map((item, i) => (
            <Item key={`${item.name}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* A static, non-scrolling variant for when there are only a few
 * names and motion would be noise. */
export function CredibilityRow({ label, items, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-10 gap-y-4', className)}>
      {label && <span className="lab tracking-[0.22em]">{label}</span>}
      {items.map((item) => (
        <Item key={item.name} item={item} />
      ))}
    </div>
  )
}

export default CredibilityRail
