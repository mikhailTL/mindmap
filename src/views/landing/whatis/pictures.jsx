import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { PatchFront } from '../../../charts/patch-front'
import { STUDENT_RINGS } from '../../../lib/readings'
import { SENSORS, SENSOR_ORDER } from '../../../lib/sensors'
import { SHARING } from '../../../app/store'
import { TABS } from '../../../toolkit/game/catalog'
import { Check, Never } from '../../../ui/marks'
import { NOTES, LOCATION, PRO, PRO_WRAP, SCORE } from '../../../lib/terms'
import { cn } from '../../../lib/utils'

/* The demo pictures for the What is MindMap? band. This band is the overview
 * of the three features; "What makes MindMap different" right below is the
 * deep dive and owns the neural network diagram, the Elena, Maya and Dr. Shah
 * trio, the MindMap AI chat, the Heads Up notification and the Toolkit level
 * badge. So nothing here repeats those. Each picture shows its feature as a
 * whole instead:
 *
 *   patch    the four raw readings (lib/readings.js) on the left of a turn,
 *            one plain sentence on the right: numbers in, words out
 *   network  the who-sees-what grid, read straight from the SHARING table in
 *            app/store.js, so the picture cannot promise what consent does not
 *   app      the same app for a teen, a parent and a PRO: each role's home
 *            tiles, as the homes in views/student/Home.jsx,
 *            views/family/Home.jsx and views/Pro.jsx name them
 *   toolkit  calming activities plus the life skill tabs, by the Toolkit's
 *            own tab list (toolkit/game/catalog.js)
 *
 * Every picture is one role="img" with a label that says what it shows; the
 * drawing inside is hidden from screen readers. Motion: a slow dash on the
 * one connecting line and the app picture stepping through its three roles.
 * Reduced motion stops both and leaves the teen's home showing. */

export const PICTURE_CSS = `
@keyframes mm-whatis-flow { to { stroke-dashoffset: -20 } }
.mm-whatis-flow { animation: mm-whatis-flow 1.6s linear infinite }
@keyframes mm-whatis-in { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .mm-whatis-flow { animation: none } }
`

function Picture({ label, wash, children, className }) {
  return (
    <div role="img" aria-label={label}
      className={cn('relative flex h-full flex-col rounded-[12px] p-3.5 sm:p-4', wash, className)}>
      <span aria-hidden className="absolute right-3.5 top-2.5 text-fine text-ink-2">Demo</span>
      <div aria-hidden className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}

const Panel = ({ className, children }) => (
  <div className={cn('rounded-[10px] border border-rule bg-card', className)}>{children}</div>
)

/* ── 1. the patch: numbers in, one sentence out ──────────────────────────── */

const READINGS = SENSOR_ORDER.map(id => {
  const r = STUDENT_RINGS.find(x => x.id === id) || {}
  return { ...SENSORS[id], big: r.big, series: Array.isArray(r.series) ? r.series : null }
})

/* A thin trace of the last hour, when the demo data carries one. */
function Spark({ series, color }) {
  if (!series || series.length < 3) return null
  const pts = series.slice(-40)
  const lo = Math.min(...pts), hi = Math.max(...pts), span = hi - lo || 1
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${((i / (pts.length - 1)) * 60).toFixed(1)} ${(13 - ((v - lo) / span) * 11).toFixed(1)}`).join('')
  return (
    <svg viewBox="0 0 60 14" preserveAspectRatio="none" className="mt-1 block min-h-3.5 w-full flex-1">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
        vectorEffect="non-scaling-stroke"/>
    </svg>
  )
}

export function PatchPicture() {
  return (
    <Picture wash="bg-beam-wash"
      label={`Demo: the MindMap patch with four readings, heart 70 bpm, sweat 3.00 µS, temperature 33.5 °C and movement 0.01 g. The neural network turns them into one plain update: a ${SCORE} of 38, today is running easy, lower than your usual 46.`}>
      <div className="mt-5 flex items-center gap-3">
        <PatchFront className="w-[56px] shrink-0 sm:w-[64px]"/>
        <p className="m-0 min-w-0 font-display text-ui font-bold leading-tight text-ink">
          What the patch reads
          <span className="mt-0.5 block font-body text-fine font-normal text-ink-2">The last hour, from the arm</span>
        </p>
      </div>
      {/* Two by two, so the longest name keeps its full width at 390. When
          the band's row is taller than this picture (lg, beside the app and
          its Toolkit), the extra height goes to the traces, not to blank. */}
      <ul className="m-0 mt-2.5 grid flex-1 list-none auto-rows-fr grid-cols-2 gap-1.5 p-0">
        {READINGS.map(r => (
          <li key={r.id} className="flex min-w-0 flex-col rounded-[8px] border-l-[3px] bg-card px-2 py-1.5"
            style={{ borderLeftColor: r.glow }}>
            <p className="m-0 text-fine leading-tight text-ink-2">{r.name}</p>
            <p className="m-0 mt-0.5 font-mono text-ui leading-tight tabular-nums text-ink">
              {r.big}<span className="text-fine text-ink-2"> {r.unit}</span></p>
            <Spark series={r.series} color={r.glow}/>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-center gap-2.5 py-1.5">
        <svg width="14" height="30" viewBox="0 0 14 30" className="text-ink-3" aria-hidden>
          <path d="M7 1v22" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6"
            strokeLinecap="round" className="mm-whatis-flow"/>
          <path d="M2.5 20.5 7 26l4.5-5.5" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-fine font-semibold text-ink-2">Neural Network</span>
      </div>

      {/* The output is words first: a sentence a teen reads in a second, the
          number beside it as a small figure. */}
      <Panel className="px-3.5 py-3">
        <p className="m-0 text-fine text-ink-2">What you see</p>
        <p className="m-0 mt-1 font-display text-row font-bold leading-tight text-ink">Today is running easy.</p>
        <div className="mt-2.5 flex items-center gap-2.5 border-t border-rule pt-2.5">
          <span className="grid h-10 min-w-10 place-items-center rounded-[8px] bg-accent-wash px-2
            font-display text-row font-bold tabular-nums text-accent-ink">38</span>
          <span className="min-w-0 text-fine leading-snug text-ink-2">
            <span className="block font-semibold text-ink">{SCORE}</span>Lower than your usual 46.</span>
        </div>
      </Panel>
    </Picture>
  )
}

/* ── 2. the network: who sees what, set by the teen ──────────────────────── */

const has = (audience, key) => SHARING[audience].fields.some(f => f.key === key)
/* Each row's one-line gloss is the first sentence of the SHARING table's own
   hint for it, so the picture and the privacy screen say the same thing. */
const first = t => (t || '').split('. ')[0].replace(/\.$/, '') + '.'
const hint = (audience, key, list = 'fields') =>
  first(SHARING[audience][list].find(f => (f.key || f.label) === key)?.hint)
/* Rows that read the same in both columns' own words. Raw readings is the
   one split: a parent never sees them, a PRO can while the teen allows it. */
const GRID = [
  { name: SCORE, parent: has('parent', 'score'), pro: has('pro', 'score'), hint: hint('parent', 'score') },
  { name: 'Days slow to settle', parent: has('parent', 'settle'), pro: has('pro', 'settle'), hint: hint('parent', 'settle') },
  { name: 'Raw readings', parent: has('parent', 'raw'), pro: has('pro', 'raw'), hint: hint('pro', 'raw') },
  { name: NOTES, parent: false, pro: false, hint: hint('parent', NOTES, 'never') },
  { name: LOCATION, parent: false, pro: false, hint: hint('parent', LOCATION, 'never') },
]

function Cell({ on }) {
  return (
    <span className="grid place-items-center">
      {on
        ? <Check size={18} className="text-accent"/>
        : <Never size={18} className="text-ink-3"/>}
    </span>
  )
}

export function NetworkPicture() {
  const yes = a => GRID.filter(r => r[a]).map(r => r.name.toLowerCase()).join(', ')
  return (
    <Picture wash="bg-sky-wash"
      label={`Demo: who sees what, set by the teen. A parent can see ${yes('parent')}. Never ${NOTES}, ${LOCATION} or raw readings. A ${PRO} can see ${yes('pro')}, and never ${NOTES} or ${LOCATION}. A school or clinic sees only the teens who said yes, and the teen can switch any of it off.`}>
      <div className="mt-5 flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-card text-sky-ink">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>
          </svg>
        </span>
        <p className="m-0 min-w-0 font-display text-ui font-bold leading-tight text-ink">
          Who sees what
          <span className="mt-0.5 block font-body text-fine font-normal text-ink-2">The teen sets every row</span>
        </p>
      </div>

      <Panel className="mt-3 flex flex-1 flex-col overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_6rem] items-end border-b border-rule bg-paper
          px-2.5 py-2 text-fine font-semibold leading-tight text-ink-2">
          <span>Shared</span>
          <span className="text-center">Parent</span>
          <span className="text-center">{PRO_WRAP}</span>
        </div>
        <ul className="m-0 flex flex-1 list-none flex-col p-0">
          {GRID.map((r, i) => (
            <li key={r.name} className={cn('grid flex-1 grid-cols-[minmax(0,1fr)_3.5rem_6rem] items-center px-2.5 py-2',
              i && 'border-t border-rule')}>
              <span className="min-w-0">
                <span className="block text-fine font-semibold leading-tight text-ink">{r.name}</span>
                {/* Only where the band's row gives it room: at 390 the gloss
                    squeezed the label column to two words a line. */}
                <span className="mt-0.5 hidden text-fine leading-tight text-ink-2 lg:block">{r.hint}</span>
              </span>
              <Cell on={r.parent}/>
              <Cell on={r.pro}/>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mt-3 flex items-center gap-2.5">
        <span className="flex shrink-0 -space-x-1.5">
          {['bg-coral', 'bg-sun', 'bg-mint', 'bg-lilac'].map(c => (
            <span key={c} className={cn('size-5 rounded-full border-2 border-sky-wash', c)}/>
          ))}
        </span>
        <p className="m-0 min-w-0 text-fine leading-snug text-ink-2">
          A school or clinic sees only the teens who said yes.</p>
      </div>
    </Picture>
  )
}

/* ── 3. one app: the same app, a home for each role ──────────────────────── */

const G = ({ children, size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)
const GLYPH = {
  trends:  <G><path d="M4 18l5-6 4 3 7-8"/><path d="M15 7h5v5"/></G>,
  toolkit: <G><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/></G>,
  ai:      <G><path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/></G>,
  network: <G><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 11l7.4-3.8M8.3 13l7.4 3.8"/></G>,
  privacy: <G><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></G>,
  family:  <G><circle cx="8" cy="8" r="2.6"/><circle cx="16.5" cy="9.5" r="2"/><path d="M3.5 19a4.5 4.5 0 0 1 9 0M13 19a3.5 3.5 0 0 1 7 0"/></G>,
  reading: <G><path d="M2 13h4l2.2-7 3 14 2.4-7H22"/></G>,
}
const HUE = {
  sky:   'bg-sky-wash text-sky-ink',
  sun:   'bg-sun-wash text-sun-ink',
  lilac: 'bg-lilac-wash text-lilac-ink',
  coral: 'bg-coral-wash text-coral-ink',
  mint:  'bg-mint-wash text-mint-ink',
}
/* Each role's home, in the app's own order and words: the teen's dark lead
   card sits above the tiles, the parent's network box and the PRO's "who
   shares with you" band below them. */
const ROLES = [
  { id: 'teen', name: 'Teen', lead: 'Take a reading', glyph: 'reading', top: true, tiles: [
    ['Trends', 'trends', 'sky'], ['Toolkit', 'toolkit', 'sun'],
    ['Ask MindMap AI', 'ai', 'lilac'], ['Your network', 'network', 'coral']] },
  { id: 'parent', name: 'Parent', lead: 'Add a teen', glyph: 'family', tiles: [
    ['Trends', 'trends', 'sky'], ['Toolkit', 'toolkit', 'sun'],
    ['Ask MindMap AI', 'ai', 'lilac'], ['Privacy and sharing', 'privacy', 'mint']] },
  { id: 'pro', name: PRO, lead: 'Who shares with you', glyph: 'network', tiles: [
    ['Trends', 'trends', 'sky'], ['Connect with families', 'family', 'mint'],
    ['Ask MindMap AI', 'ai', 'lilac'], ['Toolkit', 'toolkit', 'sun']] },
]

export function AppPicture() {
  const reduced = useReducedMotion()
  const [at, setAt] = React.useState(0)
  React.useEffect(() => {
    if (reduced) { setAt(0); return }
    const t = setInterval(() => setAt(i => (i + 1) % ROLES.length), 3200)
    return () => clearInterval(t)
  }, [reduced])
  const role = ROLES[at]
  return (
    <Picture wash="bg-lilac-wash"
      label={`Demo: one app with a home for each role. ${ROLES.map(r => `${r.name}: ${[r.lead, ...r.tiles.map(t => t[0])].join(', ')}`).join('. ')}.`}>
      <div className="mt-5 flex flex-1 flex-col">
        {/* Role names as a ruled tab row, the current one underlined. */}
        <div className="flex flex-wrap gap-x-3.5 border-b border-lilac/30">
          {ROLES.map((r, i) => (
            <span key={r.id} className={cn('-mb-px border-b-2 pb-1.5 text-fine font-semibold leading-tight',
              i === at ? 'border-lilac-ink text-ink' : 'border-transparent text-ink-2')}>{r.name}</span>
          ))}
        </div>
        <Panel className="mt-3 flex flex-1 flex-col gap-2 p-2.5">
          {role.top && <Lead key={role.id} role={role}/>}
          <ul className="m-0 grid flex-1 list-none grid-cols-2 gap-2 p-0">
            {role.tiles.map(([name, g, hue], i) => (
              <li key={role.id + name}
                className={cn('flex min-h-[4.5rem] flex-col justify-between rounded-[8px] p-2',
                  'motion-safe:animate-[mm-whatis-in_.35s_ease-out_both]', HUE[hue])}
                style={{ animationDelay: `${i * 50}ms` }}>
                {GLYPH[g]}
                <span className="mt-2 font-display text-fine font-bold leading-tight text-ink">{name}</span>
              </li>
            ))}
          </ul>
          {!role.top && <Lead key={role.id} role={role}/>}
        </Panel>
      </div>
    </Picture>
  )
}

function Lead({ role }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[8px] bg-ink px-3 py-2.5 text-paper
      motion-safe:animate-[mm-whatis-in_.35s_ease-out]">
      <span className="text-accent-lit">{GLYPH[role.glyph]}</span>
      <span className="min-w-0 font-display text-ui font-bold leading-tight">{role.lead}</span>
    </div>
  )
}

/* ── the Toolkit, a part of feature 3 with its own small picture ─────────── */

/* Three of the calming activities, drawn with the same strokes the Toolkit's
   own index uses (toolkit/index.jsx), so the marks match the app. */
const CALM = [
  { id: 'breathing', name: 'Breathing', tone: 'text-sky-ink',
    mark: <G size={22}><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/></G> },
  { id: 'ground', name: 'Grounding', tone: 'text-sun-ink',
    mark: <G size={22}><circle cx="12" cy="12" r="3.5"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21"/></G> },
  { id: 'scan', name: 'Body scan', tone: 'text-mint-ink',
    mark: <G size={22}><circle cx="12" cy="5" r="2.5"/><path d="M8 10h8l-1 6h-6zM10 16v5M14 16v5"/></G> },
]

/* The life skill tabs, by the Toolkit's own tab list, with the owner's words
   for what each one is for. */
const SKILL_WORDS = { school: 'Academic success', outside: 'Social dynamics', life: 'Wellness', career: 'Career skills' }
const SKILL_RULE = { school: 'border-l-sky', outside: 'border-l-coral', life: 'border-l-mint', career: 'border-l-lilac' }
const SKILLS = TABS.filter(t => SKILL_WORDS[t.id]).map(t => ({ ...t, line: SKILL_WORDS[t.id] }))

export function ToolkitPicture() {
  return (
    <div role="img"
      aria-label={`Toolkit demo: three calming activities, breathing, grounding and body scan, and four life skill tabs: ${SKILLS.map(s => `${s.name}, ${s.line.toLowerCase()}`).join('; ')}.`}
      className="rounded-[10px] border border-rule bg-card p-2.5">
      <div aria-hidden>
        <ul className="m-0 grid list-none grid-cols-3 gap-1.5 p-0">
          {CALM.map(c => (
            <li key={c.id} className="flex flex-col items-center gap-1 rounded-[8px] bg-paper px-1 py-2">
              <span className={c.tone}>{c.mark}</span>
              <span className="text-center text-fine font-semibold leading-tight text-ink">{c.name}</span>
            </li>
          ))}
        </ul>
        <ul className="m-0 mt-2 grid list-none grid-cols-2 gap-x-2 gap-y-1.5 p-0">
          {SKILLS.map(s => (
            <li key={s.id} className={cn('min-w-0 border-l-[3px] py-0.5 pl-2', SKILL_RULE[s.id])}>
              <p className="m-0 font-display text-fine font-bold leading-tight text-ink">{s.name}</p>
              <p className="m-0 text-fine leading-tight text-ink-2">{s.line}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
