import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'

/* Text effects from the s21 kit on the light ground.
 *
 * Both were built for a near-black page where thin white type could carry an
 * effect on its own. On paper the effect has to come from structure — shear,
 * timing, weight — because a light-on-dark trick has no equivalent here. */

/* Local keyframes. The kit's originals lived in a global stylesheet we do not
 * own, so each component ships the frames it needs. */
const KEYFRAMES = `
@keyframes s21-fade-in { from { opacity:0; filter:blur(4px) } to { opacity:1; filter:blur(0) } }
@keyframes s21-pop-in  { from { opacity:0; transform:scale(0.82) } to { opacity:1; transform:scale(1) } }
@keyframes s21-fade-up { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
@media (prefers-reduced-motion: reduce) {
  [data-s21-anim] { animation: none !important; opacity: 1 !important; filter: none !important; }
}
`

/* ───────────────────────────── LAYERED TEXT ──────────────────────────── */

/** Sheared word stack. Hovering slides every line up by one row so the top
 *  word leaves and the bottom word takes its place.
 *
 *  The source drove this with a GSAP timeline. Here it is a CSS transition
 *  with a per-line delay: same stagger, one fewer dependency, and it inherits
 *  the project's global prefers-reduced-motion clamp for free. */
export function LayeredText({
  lines = [
    { top: ' ', bottom: 'INFINITE' },
    { top: 'INFINITE', bottom: 'PROGRESS' },
    { top: 'PROGRESS', bottom: 'INNOVATION' },
    { top: 'INNOVATION', bottom: 'FUTURE' },
    { top: 'FUTURE', bottom: 'DREAMS' },
    { top: 'DREAMS', bottom: 'ACHIEVEMENT' },
    { top: 'ACHIEVEMENT', bottom: ' ' },
  ],
  fontSize = '72px',
  fontSizeMd = '36px',
  lineHeight = 60,
  lineHeightMd = 35,
  className = '',
}) {
  const [compact, setCompact] = React.useState(false)
  const [lifted, setLifted] = React.useState(false)
  const reduced = useReducedMotion()

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const calculateTranslateX = (index) => {
    const centerIndex = Math.floor(lines.length / 2)
    return { desktop: (index - centerIndex) * 35, mobile: (index - centerIndex) * 20 }
  }

  const rowHeight = compact ? lineHeightMd : lineHeight
  /* The lift is exactly one row. The original hard-coded -60/-35 against a
   * different breakpoint than the one sizing the rows, which desynced the
   * two words mid-transition on tablets. */
  const lift = lifted && !reduced ? -rowHeight : 0

  return (
    <div
      onMouseEnter={() => setLifted(true)}
      onMouseLeave={() => setLifted(false)}
      onFocus={() => setLifted(true)}
      onBlur={() => setLifted(false)}
      tabIndex={0}
      className={cn(
        'mx-auto py-24 font-display font-black tracking-[-2px] uppercase text-ink antialiased cursor-pointer',
        className,
      )}
      style={{ fontSize: compact ? fontSizeMd : fontSize }}
    >
      <ul className="list-none p-0 m-0 flex flex-col items-center">
        {lines.map((line, index) => {
          const translateX = calculateTranslateX(index)
          return (
            <li
              key={index}
              className="overflow-hidden relative"
              style={{
                height: `${rowHeight}px`,
                transform: `translateX(${compact ? translateX.mobile : translateX.desktop}px) skew(${
                  index % 2 === 0 ? '60deg, -30deg' : '0deg, -30deg'
                }) scaleY(${index % 2 === 0 ? '0.66667' : '1.33333'})`,
              }}
            >
              {[line.top, line.bottom].map((text, k) => (
                <p
                  key={k}
                  className="px-[15px] align-top whitespace-nowrap m-0 will-change-transform"
                  style={{
                    height: `${rowHeight}px`,
                    lineHeight: `${rowHeight - 5}px`,
                    transform: `translateY(${lift}px)`,
                    transition: reduced ? 'none' : 'transform 800ms cubic-bezier(0.16,1,0.3,1)',
                    transitionDelay: reduced ? '0ms' : `${index * 80}ms`,
                  }}
                >
                  {text}
                </p>
              ))}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ──────────────────────────── STREAMING TEXT ─────────────────────────── */
/* Words resolve out of blur, an inline citation appears in context, then the
 * actions and follow-ups become usable. */

const WORD_MS = 80
const HOLD_MS = 3400

const TOKENS = [
  ...'This is a rendering demo — words resolve out of blur one at a time, a citation drops in mid-sentence, and the controls settle last.'
    .split(' ')
    .map((text) => ({ text })),
  { text: '', cite: true },
  ...'Nothing here is a real answer; it exists to show the states.'
    .split(' ')
    .map((text) => ({ text })),
]

const FOLLOW_UPS = ['Show the blur-in timing', 'Replay from the first token']

/* The kit's source marks were three unrelated brand colours. Re-cut on the
 * clinical palette so a demo chip can never be mistaken for a status colour:
 * accent, ink, and warn — never crit, which is reserved. */
const SOURCE_IMAGES = {
  scoop:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%230f6b62'/%3E%3Cpath d='M20 36c0 7 5.4 12 12 12s12-5 12-12H20Z' fill='%23fcfcfb'/%3E%3Ccircle cx='32' cy='25' r='11' fill='%23e8f1ef'/%3E%3C/svg%3E",
  trends:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%230d2b27'/%3E%3Cpath d='M15 43 27 31l8 7 14-18' fill='none' stroke='%23fcfcfb' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  market:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%239a4a18'/%3E%3Cpath d='M17 45V25h8v20h-8Zm11 0V16h8v29h-8Zm11 0V30h8v15h-8Z' fill='%23fcfcfb'/%3E%3C/svg%3E",
}

const SOURCES = [
  { name: 'Example source', domain: 'example.com', href: '#', image: SOURCE_IMAGES.scoop },
  { name: 'Example source', domain: 'example.org', href: '#', image: SOURCE_IMAGES.trends },
  { name: 'Example source', domain: 'example.net', href: '#', image: SOURCE_IMAGES.market },
]

function sourceImage(source) {
  return source.image
}

function SourceChip() {
  const source = SOURCES[0]
  return (
    <a
      href={source.href}
      data-s21-anim
      className="mr-1.5 inline-flex translate-y-[-1px] items-center gap-1.5 rounded-xs border border-rule
        bg-sage py-0.5 pl-1 pr-2 align-middle font-mono text-label text-ink-2
        transition-colors duration-150 hover:bg-accent-wash hover:text-ink"
      style={{ animation: 's21-pop-in 250ms cubic-bezier(0.23,1,0.32,1) both' }}
    >
      <img src={sourceImage(source)} alt="" className="size-4 rounded-xs" />
      <span>{source.domain}</span>
    </a>
  )
}

const ACTION_ICONS = [
  <g key="copy">
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </g>,
  <path key="retry" d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />,
  <path
    key="up"
    d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z"
  />,
  <path
    key="down"
    d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88z"
  />,
]

export function StreamingText({ className }) {
  const reduced = useReducedMotion()
  const [count, setCount] = React.useState(0)
  const [sourcesOpen, setSourcesOpen] = React.useState(false)
  const done = reduced || count >= TOKENS.length

  React.useEffect(() => {
    /* Reduced motion gets the finished state, not a fast one — a looping
     * teletype is exactly the thing the setting is asking us to stop. */
    if (reduced) { setCount(TOKENS.length); return }
    const t = setTimeout(
      () => setCount((c) => (c >= TOKENS.length ? 0 : c + 1)),
      count >= TOKENS.length ? HOLD_MS : WORD_MS,
    )
    return () => clearTimeout(t)
  }, [count, reduced])

  const shown = reduced ? TOKENS.length : count

  return (
    <div className={cn('min-h-[16rem] w-full max-w-read', className)}>
      <style>{KEYFRAMES}</style>

      <p className="text-sec text-ink">
        {TOKENS.slice(0, shown).map((token, i) =>
          token.cite ? (
            <SourceChip key={i} />
          ) : (
            <span key={i} data-s21-anim className="inline" style={{ animation: 's21-fade-in 250ms ease-out both' }}>
              {token.text}{' '}
            </span>
          ),
        )}
        {!done && (
          <span
            aria-hidden
            className="ml-0.5 inline-block h-[1.05em] w-0.5 translate-y-[0.15em] rounded-full bg-accent"
          />
        )}
      </p>

      <div
        className="mt-3 flex items-center gap-0.5 transition-opacity duration-300"
        style={{ opacity: done ? 1 : 0, pointerEvents: done ? 'auto' : 'none' }}
      >
        {ACTION_ICONS.map((icon, i) => (
          <button
            key={i}
            type="button"
            aria-label="Action"
            className="flex size-11 items-center justify-center rounded text-ink-3
              transition-colors duration-100 hover:bg-sage hover:text-ink"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {icon}
            </svg>
          </button>
        ))}
        <button
          type="button"
          aria-expanded={sourcesOpen}
          onClick={() => setSourcesOpen((c) => !c)}
          className="ml-1.5 flex min-h-[44px] items-center gap-2 rounded px-2 py-1 text-left
            transition-colors duration-150 hover:bg-sage"
        >
          <span className="flex -space-x-1.5">
            {SOURCES.map((source) => (
              <img
                key={source.domain}
                src={sourceImage(source)}
                alt=""
                className="size-5 rounded-full bg-paper ring-[1.5px] ring-paper"
              />
            ))}
          </span>
          <span className="font-mono text-label text-ink-2">10 sources</span>
        </button>
      </div>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: done && sourcesOpen ? '1fr' : '0fr',
          opacity: done && sourcesOpen ? 1 : 0,
          transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        <div className="overflow-hidden">
          <div className="mt-2 flex flex-col rounded border border-rule bg-sage/50 p-1">
            {SOURCES.map((source) => (
              <a
                key={source.domain}
                href={source.href}
                className="flex min-h-[44px] items-center gap-2.5 rounded px-2 py-1.5 text-meta text-ink-2
                  transition-colors duration-150 hover:bg-paper hover:text-ink"
              >
                <img src={sourceImage(source)} alt="" className="size-5 rounded-xs" />
                <span className="underline-offset-4 hover:underline">{source.name}</span>
                <span className="ml-auto font-mono text-label text-ink-3">{source.domain}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div
        className="mt-4 transition-opacity duration-300"
        style={{ opacity: done ? 1 : 0, pointerEvents: done ? 'auto' : 'none' }}
      >
        <p className="lab">Follow-ups</p>
        <div className="mt-1 flex flex-col">
          {FOLLOW_UPS.map((text, i) => (
            <button
              key={text}
              type="button"
              data-s21-anim
              className="-mx-2 flex min-h-[44px] items-center gap-2.5 border-b border-rule
                px-2 py-2 text-left text-meta text-ink transition-colors
                duration-100 hover:bg-sage/60"
              style={
                done
                  ? { animation: `s21-fade-up 350ms cubic-bezier(0.23,1,0.32,1) ${i * 90}ms both` }
                  : { opacity: 0 }
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-ink-3"
              >
                <path d="M9 10l-5 5 5 5" />
                <path d="M20 4v7a4 4 0 0 1-4 4H4" />
              </svg>
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StreamingText
