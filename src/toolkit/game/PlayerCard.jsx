import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useReduced } from '../useReduced'
import { vars } from '../theme'
import { STUDENT_ITEMS } from '../index.jsx'
import { SKILL_TOOLS } from '../../skills/index.js'
import { useProgress, gameVars } from './parts'
import { levelFor, levelName, BADGES, badgeById, suggestNext, FINISH_POINTS, NEW_TOOL_BONUS } from './progress'
import { BadgeIcon } from './badges'
import { LevelEmblem, XPBar, LevelUpBanner, Confetti, useTotalTween, SPRING, SOFT } from './fx'

/* The header card for the top of the student Toolkit: the level emblem
 * (its own shape and colour at every level), a bar to the next level that
 * fills with a shine, a big count of points to go, the badges as shiny
 * coins (tap one to see what it was for), and today's quest: one tool to
 * try next. Points earned since the card was last on screen fill the bar in
 * front of the reader, and a level reached drops a banner and confetti.
 *
 * There are no streaks, no days missed and nobody else's numbers anywhere
 * on it. "Today's quest" is only a suggestion: it changes with what has
 * been tried, and skipping it costs nothing.
 *
 * Mounted by the Toolkit for students only, at the top of each tab. The
 * optional `tab` makes the quest prefer a tool from the tab on screen. */

const TOOLS = Object.fromEntries([
  ...STUDENT_ITEMS.map(i => [i.id, { id:i.id, title:i.title, line:i.line, family:i.family, icon:i.icon, href:'#/' + i.route }]),
  ...SKILL_TOOLS.map(t => [t.id, { id:t.id, title:t.title, line:t.line, family:t.family, icon:t.icon, href:'#/' + t.route }]),
])

/* Three of the palette's washes (sky, lilac, coral). ink and ink-2 clear
   4.5 : 1 on every stop. */
const CARD_BG = 'linear-gradient(120deg, #def0fc 0%, #f6e8ff 55%, #ffe8e0 100%)'

/* The total this card last showed, so a gain since then can play out. A
   plain number: no date is kept, so nothing here can become a streak. */
const SEEN_KEY = 'mindmap.toolkit.seen'
const readSeen = () => { try { const v = Number(localStorage.getItem(SEEN_KEY)); return Number.isFinite(v) && localStorage.getItem(SEEN_KEY) != null ? v : null } catch { return null } }
const writeSeen = v => { try { localStorage.setItem(SEEN_KEY, String(v)) } catch { /* blocked: replays next time */ } }

function Quest({ pick, reduced }) {
  const t = TOOLS[pick?.id]
  if (!t) return null
  const Icon = t.icon
  const pts = pick.fresh ? FINISH_POINTS + NEW_TOOL_BONUS : FINISH_POINTS
  return (
    <motion.a href={t.href} style={vars(t.family)}
      whileTap={reduced ? undefined : { scale:0.97 }} transition={SPRING}
      className="kit-card group relative flex min-h-[76px] items-center gap-3 overflow-hidden rounded-[18px] border border-white/80
        bg-white/90 p-3 shadow-card">
      <span aria-hidden className="kit-ground kit-ink relative grid size-12 shrink-0 place-items-center rounded-[14px]">
        <Icon/>
        <svg viewBox="0 0 20 20" className="absolute -right-1.5 -top-1.5 size-5" aria-hidden focusable="false">
          <circle cx="10" cy="10" r="9" fill="#ffffff"/>
          <circle cx="10" cy="10" r="7" fill="none" stroke="#f2702a" strokeWidth="2"/>
          <circle cx="10" cy="10" r="3" fill="#f2702a"/>
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-fine font-bold text-ink-2">Today's quest</span>
        <span className="block font-display text-ui font-bold leading-snug text-ink">
          {pick.fresh ? 'Try ' : 'Play '}{t.title}
        </span>
        <span className="block text-fine text-ink-2">
          Finish it for <b className="font-display font-bold text-ink">+{pts}</b> points
        </span>
      </span>
      <span aria-hidden className="kit-fill grid size-11 shrink-0 place-items-center rounded-full text-white shadow-card
        transition-transform duration-150 group-hover:translate-x-0.5">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round"><path d="M9 5.5l6.5 6.5L9 18.5"/></svg>
      </span>
      {!reduced && <span aria-hidden className="g-sheen absolute inset-y-0 w-1/5 opacity-60"/>}
    </motion.a>
  )
}

/* A rolling count of points to the next level. */
function ToGo({ total }) {
  const L = levelFor(total)
  const left = Math.max(0, Math.ceil(L.need - L.into))
  return (
    <p className="mt-1.5 flex items-baseline gap-1.5">
      <span className="font-display text-stat font-bold tabular-nums leading-none text-ink">{left}</span>
      <span className="text-fine font-semibold text-ink-2">points to Level {L.level + 1}, {levelName(L.level + 1)}</span>
    </p>
  )
}

export function PlayerCard({ className, tab = null }) {
  const p = useProgress()
  const reduced = useReduced()
  const [seen] = React.useState(() => readSeen())
  const from = seen == null || seen > p.total ? p.total : seen
  const [lvUp, setLvUp] = React.useState(null)
  const [boom, setBoom] = React.useState(0)
  const total = useTotalTween(from, p.total, { delay:500,
    onLevel: l => { setLvUp(l); setBoom(b => b + 1); setTimeout(() => setLvUp(null), 3600) } })
  const gaining = total < p.total
  /* Stored once the bar has caught up, so a card that is swapped out mid
     fill plays the gain again next time rather than losing it. */
  React.useEffect(() => { if (!gaining) writeSeen(p.total) }, [gaining, p.total])
  const L = levelFor(total)
  const earned = p.badges.map(badgeById).filter(Boolean)
  const [open, setOpen] = React.useState(null)       // a badge id, for its line
  const [all, setAll] = React.useState(false)
  const pick = React.useMemo(() => suggestNext(p, tab), [p, tab])
  const fresh = p.total === 0 && earned.length === 0
  const shown = open && badgeById(open)
  const has = id => p.badges.includes(id)
  const locked = BADGES.filter(b => !has(b.id)).slice(0, earned.length ? 2 : 3)

  return (
    <section aria-label="Your progress" style={{ ...gameVars(p.theme), background:CARD_BG }}
      className={cn('relative overflow-hidden rounded-[22px] border border-rule p-4 shadow-card sm:p-5', className)}>
      {/* soft light shapes behind the card's content */}
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-white/40"/>
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 size-40 rounded-full bg-white/30"/>
      <Confetti fire={boom} x={30} y={12}/>

      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-6">
        <div>
          <div className="flex items-center gap-3.5">
            <motion.div key={L.level} initial={reduced || !lvUp ? false : { scale:0.2, rotate:-90 }}
              animate={{ scale:1, rotate:0 }} transition={{ type:'spring', stiffness:300, damping:14 }}>
              <LevelEmblem level={L.level} size={88}/>
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-fine font-bold uppercase tracking-[0.1em] text-ink-2">Level {L.level}</p>
              <h2 className="font-display text-head font-bold leading-tight tracking-tight text-ink">{levelName(L.level)}</h2>
              <ToGo total={total}/>
            </div>
          </div>
          <XPBar total={total} gain={gaining ? Math.floor(total / 4) : 0} tall className="mt-3"
            label={`Level ${L.level + 1}`}/>
          <AnimatePresence>
            {gaining && (
              <motion.p key="gain" className="mt-1.5 font-display text-fine font-bold" style={{ color:'var(--g-ink)' }}
                initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                +{p.total - from} points added
              </motion.p>
            )}
          </AnimatePresence>
          <LevelUpBanner level={lvUp || L.level} show={!!lvUp} className="mt-3"/>
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
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {earned.map((b, i) => (
              <motion.button key={b.id} type="button" aria-label={b.name} aria-expanded={open === b.id}
                onClick={() => setOpen(open === b.id ? null : b.id)}
                initial={reduced ? false : { scale:0, rotate:-60 }} animate={{ scale:1, rotate:0 }}
                whileTap={reduced ? undefined : { scale:0.88 }}
                transition={{ ...SPRING, delay: reduced ? 0 : 0.15 + i * 0.06 }}
                className={cn('grid size-12 place-items-center rounded-full',
                  open === b.id && 'ring-2 ring-ink ring-offset-2 ring-offset-transparent')}>
                <BadgeIcon id={b.id} size={44} shine/>
              </motion.button>
            ))}
            {locked.map(b => (
              <button key={b.id} type="button" aria-label={`${b.name}, not earned yet`} aria-expanded={open === b.id}
                onClick={() => setOpen(open === b.id ? null : b.id)} className="grid size-12 place-items-center rounded-full">
                <BadgeIcon id={b.id} size={42} earned={false}/>
              </button>
            ))}
            <button type="button" aria-expanded={all} onClick={() => setAll(!all)}
              className="ml-0.5 min-h-[44px] rounded-[12px] px-2.5 font-display text-fine font-bold text-ink underline
                decoration-ink-3 underline-offset-4">
              {all ? 'Hide' : 'All badges'}
            </button>
          </div>
          <AnimatePresence>
            {shown && (
              <motion.p key={shown.id} role="status" className="mt-2 rounded-[12px] bg-white/90 p-2.5 text-fine text-ink"
                initial={reduced ? false : { opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                transition={SOFT}>
                <b className="font-display">{shown.name}.</b> {has(shown.id) ? 'Earned for: ' : 'Not yet. '}{shown.line}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="min-w-0">
          <Quest pick={pick} reduced={reduced}/>
        </div>
      </div>

      <AnimatePresence>
        {all && (
          <motion.ul key="all" className="relative mt-4 grid gap-2 border-t border-ink/10 pt-4 sm:grid-cols-2 lg:grid-cols-3"
            initial={reduced ? false : { opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={SOFT}>
            {BADGES.map(b => (
              <li key={b.id} className="flex items-center gap-3 rounded-[12px] bg-white/80 p-2.5">
                <BadgeIcon id={b.id} size={40} earned={has(b.id)} shine={has(b.id)}/>
                <span className="min-w-0">
                  <span className="block font-display text-fine font-bold text-ink">
                    {b.name}<span className="sr-only">{has(b.id) ? ', earned' : ', not earned yet'}</span>
                  </span>
                  <span className="block text-fine text-ink-2">{b.line}</span>
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <p className="relative mt-3 text-fine text-ink-2">Points come from finishing a tool. Only you see them.</p>
    </section>
  )
}

export default PlayerCard
