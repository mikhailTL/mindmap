import React from 'react'
import { cn } from '../../lib/utils'
import { useReduced } from '../useReduced'
import { vars } from '../theme'
import { STUDENT_ITEMS } from '../index.jsx'
import { SKILL_TOOLS } from '../../skills/index.js'
import { useProgress, gameVars } from './parts'
import { levelFor, levelName, BADGES, badgeById, suggestNext, FINISH_POINTS, NEW_TOOL_BONUS } from './progress'
import { BadgeIcon } from './badges'

/* The header card for the top of the student Toolkit: level and its name,
 * a bar to the next level, the badges earned (tap one to see what it was
 * for), and one tool to try next. Everything is read from this device's
 * progress store. There are no streaks, no days and nobody else's numbers
 * anywhere on it: a teen only ever sees their own collection grow.
 *
 * Mounted by the Toolkit for students only, at the top of each tab. The
 * optional `tab` ('exercise' | 'school' | 'outside' | 'life' | 'career')
 * makes "Try next" prefer a tool from the tab on screen. */

const TOOLS = Object.fromEntries([
  ...STUDENT_ITEMS.map(i => [i.id, { id:i.id, title:i.title, line:i.line, family:i.family, icon:i.icon, href:'#/' + i.route }]),
  ...SKILL_TOOLS.map(t => [t.id, { id:t.id, title:t.title, line:t.line, family:t.family, icon:t.icon, href:'#/' + t.route }]),
])

/* Three of the palette's washes (sky, lilac, coral). ink and ink-2 clear
   4.5 : 1 on every stop. */
const CARD_BG = 'linear-gradient(120deg, #def0fc 0%, #f6e8ff 55%, #ffe8e0 100%)'

function LevelBadge({ level, pct, reduced }) {
  const R = 30, C = 2 * Math.PI * R
  return (
    <div className="relative grid size-[76px] shrink-0 place-items-center">
      <svg viewBox="0 0 76 76" aria-hidden focusable="false" className="absolute inset-0 size-full">
        <circle cx="38" cy="38" r={R} fill="none" stroke="#ffffff" strokeWidth="7"/>
        <circle cx="38" cy="38" r={R} fill="none" strokeWidth="7" strokeLinecap="round"
          transform="rotate(-90 38 38)" strokeDasharray={C}
          style={{ stroke:'var(--g-main)', strokeDashoffset: C * (1 - Math.max(0.02, pct)),
                   transition: reduced ? 'none' : 'stroke-dashoffset .7s cubic-bezier(0.23,1,0.32,1)' }}/>
      </svg>
      <span className="grid size-[50px] place-items-center rounded-full font-display text-num font-bold tabular-nums text-white"
        style={{ background:'var(--g-ink)' }}>{level}</span>
    </div>
  )
}

function TryNext({ pick }) {
  const t = TOOLS[pick?.id]
  if (!t) return null
  const Icon = t.icon
  return (
    <a href={t.href} style={vars(t.family)}
      className="kit-card group flex min-h-[72px] items-center gap-3 rounded-[16px] border border-rule bg-card p-3 shadow-card
        transition-transform duration-150 motion-safe:active:scale-[0.98]">
      <span aria-hidden className="kit-ground kit-ink grid size-12 shrink-0 place-items-center rounded-[14px]"><Icon/></span>
      <span className="min-w-0 flex-1">
        <span className="block text-fine font-semibold text-ink-2">{pick.fresh ? 'Try next' : 'Go again'}</span>
        <span className="block font-display text-ui font-bold text-ink">{t.title}</span>
        <span className="block truncate text-fine text-ink-2">{t.line}</span>
      </span>
      <span aria-hidden className="kit-fill grid size-10 shrink-0 place-items-center rounded-full text-white">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round"><path d="M9 5.5l6.5 6.5L9 18.5"/></svg>
      </span>
    </a>
  )
}

export function PlayerCard({ className, tab = null }) {
  const p = useProgress()
  const reduced = useReduced()
  const L = levelFor(p.total)
  const earned = p.badges.map(badgeById).filter(Boolean)
  const [open, setOpen] = React.useState(null)       // a badge id, for its line
  const [all, setAll] = React.useState(false)
  const pick = React.useMemo(() => suggestNext(p, tab), [p, tab])
  const fresh = p.total === 0 && earned.length === 0
  const shown = open && badgeById(open)
  const has = id => p.badges.includes(id)

  return (
    <section aria-label="Your progress" style={{ ...gameVars(p.theme), background:CARD_BG }}
      className={cn('rounded-[20px] border border-rule p-4 shadow-card sm:p-5', className)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-6">
        <div className="flex items-center gap-3.5">
          <LevelBadge level={L.level} pct={L.pct} reduced={reduced}/>
          <div className="min-w-0 flex-1">
            <p className="text-fine font-semibold text-ink-2">Level {L.level}</p>
            <h2 className="font-display text-row font-bold tracking-tight text-ink">{levelName(L.level)}</h2>
            <div className="mt-1.5 h-3 overflow-hidden rounded-bar bg-card" role="progressbar"
              aria-label={`Level ${L.level + 1}`} aria-valuemin={0} aria-valuemax={L.need} aria-valuenow={L.into}>
              <div className="h-full rounded-bar" style={{ width: Math.max(2, Math.round(L.pct * 100)) + '%',
                background:'var(--g-main)', transition: reduced ? 'none' : 'width .7s cubic-bezier(0.23,1,0.32,1)' }}/>
            </div>
            <p className="mt-1 text-fine text-ink-2 tabular-nums">
              {L.need - L.into} points to {levelName(L.level + 1)}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          {fresh ? (
            <>
              <p className="font-display text-ui font-bold text-ink">Your collection starts here</p>
              <p className="mt-0.5 text-fine text-ink-2">
                Finish any tool for {FINISH_POINTS + NEW_TOOL_BONUS} points and your first badge. No streaks, no pressure.
              </p>
            </>
          ) : (
            <p className="font-display text-ui font-bold text-ink">
              Badges <span className="font-semibold text-ink-2">{earned.length} of {BADGES.length}</span>
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {earned.map(b => (
              <button key={b.id} type="button" aria-label={b.name} aria-expanded={open === b.id}
                onClick={() => setOpen(open === b.id ? null : b.id)}
                className={cn('grid size-11 place-items-center rounded-full transition-transform duration-150',
                  'motion-safe:active:scale-90', open === b.id && 'ring-2 ring-ink ring-offset-2 ring-offset-transparent')}>
                <BadgeIcon id={b.id} size={38}/>
              </button>
            ))}
            {earned.length === 0 && [BADGES[0], BADGES[5], BADGES[7]].map(b => (
              <button key={b.id} type="button" aria-label={`${b.name}, not earned yet`} aria-expanded={open === b.id}
                onClick={() => setOpen(open === b.id ? null : b.id)} className="grid size-11 place-items-center rounded-full">
                <BadgeIcon id={b.id} size={38} earned={false}/>
              </button>
            ))}
            <button type="button" aria-expanded={all} onClick={() => setAll(!all)}
              className="ml-0.5 min-h-[44px] rounded-[12px] px-2.5 font-display text-fine font-bold text-ink underline
                decoration-ink-3 underline-offset-4">
              {all ? 'Hide' : 'All badges'}
            </button>
          </div>
          {shown && (
            <p role="status" className={cn('mt-2 rounded-[12px] bg-card p-2.5 text-fine text-ink', !reduced && 'g-in')}>
              <b className="font-display">{shown.name}.</b> {has(shown.id) ? 'Earned for: ' : 'Not yet. '}{shown.line}
            </p>
          )}
        </div>

        <div className="min-w-0">
          <TryNext pick={pick}/>
        </div>
      </div>

      {all && (
        <ul className={cn('mt-4 grid gap-2 border-t border-ink/10 pt-4 sm:grid-cols-2 lg:grid-cols-3', !reduced && 'g-in')}>
          {BADGES.map(b => (
            <li key={b.id} className="flex items-center gap-3 rounded-[12px] bg-card/80 p-2.5">
              <BadgeIcon id={b.id} size={36} earned={has(b.id)}/>
              <span className="min-w-0">
                <span className="block font-display text-fine font-bold text-ink">
                  {b.name}<span className="sr-only">{has(b.id) ? ', earned' : ', not earned yet'}</span>
                </span>
                <span className="block text-fine text-ink-2">{b.line}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-fine text-ink-2">Points come from finishing a tool. Only you see them, on this device.</p>
    </section>
  )
}

export default PlayerCard
