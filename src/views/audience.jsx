import React from 'react'
import { PHOTOS } from '../lib/photos'
import { Button } from '../ui/button'
import { ArrowLeft, ArrowRight, Check, Never } from '../ui/marks'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { DemoNotice } from '../ui/notice'
import { Progress } from '../ui/progress'
import { WeekChart } from '../charts/week'
import { Bars, RainbowDial } from '../charts/rainbow'
import { Spark } from '../charts/primitives'
import { studentRings } from '../lib/readings'
import { SENSORS } from '../lib/sensors'
import { DATA } from '../lib/assets'
import { CHART_DATA } from '../lib/chartdata'
import { COHORT_PERIOD, COHORT_WEEKDAY, K_ANONYMITY, SCHOOL_N, TIER_LABEL, roster }
  from '../lib/caseload'
import { ScrollIn, ScrollRow } from '../ui/motion'
import { cn } from '../lib/utils'
import {
  CASELOAD_DEF, CASELOAD_TITLE, CONSENT_OFF, CONSENT_SHORT, LOCATION, NOTES, SCORE,
  SCORE_RANGE, PRO_LC, PRO_FOR,
} from '../lib/terms'

/* The three audience routes: students, parents, medical professionals.
 *
 * These are no longer leaf pages. The entry chooser in views/Entry.jsx sends
 * Student, Parent and Medical professional straight here, so for most visitors
 * one of these three is the first real page of the site, and they are held to
 * docs/design-spec.md exactly as the overview is.
 *
 * WHAT CHANGED IN THIS PASS, and why. The owner, on the twelve reference
 * screens: "too plain and devoid of images and stock photos, it is all
 * monotonous in color and not nice", and separately that the site is missing
 * "the blend of both infographic and diagram design with realism, stock
 * images, and realistic stuff". Spec section 0b is the rule that follows from
 * it. Two things changed and nothing else:
 *
 *   - COLOUR. All three pages were the same ladder of near-white teals, so
 *     they read as three printings of one document. Each page now owns a lead
 *     hue from the six measured in tailwind.config.js and two supporting ones,
 *     and no two neighbouring bands share a ground:
 *       students  sky    -> card -> sun   -> mint  -> ink
 *       parents   lilac  -> card -> blush -> sun   -> ink
 *       pros      mint   -> paper -> sky  -> card  -> lilac -> ink
 *     The hue reaches the band ground, the head strip of a card, a card's left
 *     edge and the four signal tiles, and it never reaches body text, which
 *     stays ink and ink-2 throughout. Every pairing used here was measured:
 *     each hue's `ink` clears 4.5 : 1 on paper, card, mist and all six washes,
 *     and every hue `DEFAULT` used as a 3px edge clears 3 : 1 on card. A hue
 *     `DEFAULT` is never a fill on a wash, where it lands near 2.7 : 1.
 *
 *   - PHOTOGRAPHY, at four scales rather than one. Each page carried three
 *     frames, all at card width, in the same rail slot, which is the uniform
 *     strip spec 5 rejects. There are now six on the student page, five on the
 *     parent page and four on the medical professional page, at a hero frame,
 *     a full-height column inside a figure, a wide banner across a card's top
 *     edge, and a rail card. On every page one figure and one photograph are
 *     now a single container: the chart about students has the picture of
 *     students inside its own border, which is the blend the owner asked for.
 *
 * Nothing factual changed. The approved statistics, the consent model and the
 * wording from lib/terms.js are untouched: a parent sees nothing finer than a
 * day, never Notes, never Location, never a raw reading; a medical
 * professional gets a score and a direction, nothing under the k-anonymity
 * floor, and every record opened is logged with no setting that turns the log
 * off; crisis alerts are the one thing no guardian can consent away.
 *
 * Every frame is a licensed stock photograph of models. Nobody in one uses
 * MindMap, nobody is wearing the patch, and no alt text may say otherwise. */

/* Containers, per spec 2. Two grounds, because the ink band needs its own. */
const PANEL = 'overflow-hidden rounded-panel border border-rule bg-card'
const PANEL_INK = 'overflow-hidden rounded-panel border border-ink-2 bg-ink-2/40'

/* The six measured hues, as the three jobs the config gives them: a ground, a
   word, and an edge. Written out rather than built from a template string,
   because Tailwind scans source text and a composed class name never reaches
   the stylesheet. Ratios, from tools/brand:
     ink on paper / on its own wash
       coral 6.01 : 5.38   lilac 8.46 : 7.59   sun   5.67 : 5.08
       mint  5.83 : 5.17   sky   5.63 : 5.08   blush 6.44 : 5.73
     DEFAULT on card, which is the only ground an edge of it is drawn against
       coral 3.46  lilac 5.21  sun 3.26  mint 3.22  sky 3.26  blush 3.89 */
const HUE = {
  coral: { wash: 'bg-coral-wash', ink: 'text-coral-ink', edge: 'border-l-coral' },
  lilac: { wash: 'bg-lilac-wash', ink: 'text-lilac-ink', edge: 'border-l-lilac' },
  sun:   { wash: 'bg-sun-wash',   ink: 'text-sun-ink',   edge: 'border-l-sun' },
  mint:  { wash: 'bg-mint-wash',  ink: 'text-mint-ink',  edge: 'border-l-mint' },
  sky:   { wash: 'bg-sky-wash',   ink: 'text-sky-ink',   edge: 'border-l-sky' },
  blush: { wash: 'bg-blush-wash', ink: 'text-blush-ink', edge: 'border-l-blush' },
}

/* One hue per signal, in the rainbow's own order, so the four tiles read as
   four different things rather than one tint repeated. The icon keeps the
   sensor's own glow and the numeral stays ink: colour is never the only thing
   naming a signal, because the signal's name is printed beside it. */
const SIGNAL_HUE = { heart: 'coral', sweat: 'sun', temp: 'mint', move: 'sky' }

/* Intrinsic size per key, so the browser holds the box before the file lands.
   Same numbers charts/people.jsx keeps for the frames it owns. */
const DIMS = {
  'clinic-talk':        [1600, 1066],
  'friends-steps':      [1418, 1125],
  'parent-card':        [1200, 423],
  'parent-hero':        [1344, 752],
  'parent-kitchen':     [1067, 1600],
  'parent-laptop':      [1600, 1066],
  'pro-hero':           [1344, 752],
  'school-card':        [1200, 423],
  'student-bus':        [1600, 1067],
  'student-basketball': [1600, 1066],
  'student-card':       [1200, 423],
  'student-controller': [1600, 1067],
  'student-game':       [1600, 1066],
  'student-hero':       [1344, 752],
  'student-homework':   [1592, 1194],
  'students-hallway':   [1600, 1068],
}

/* max-w-none is load-bearing: Tailwind's preflight sets img { max-width: 100% }
   and that undoes a frame set to fill a box wider than its own file. */
function Frame({ photo, alt, className, op, eager = false }) {
  const src = PHOTOS[photo]
  if (!src || !alt) return null
  const [w, h] = DIMS[photo] || [1600, 1066]
  return (
    <img src={src} alt={alt} width={w} height={h}
      loading={eager ? 'eager' : 'lazy'} decoding="async"
      className={cn('block h-full w-full max-w-none object-cover', op, className)}/>
  )
}

/* A photograph as a card's whole top edge. `size` is the only thing that
   varies, and it varies on purpose: no page here draws two frames at the same
   height, which is the uniform grid of thumbnails spec 5 rejects. Every frame
   on these pages is eager, since no page carries more than six. */
const PHOTO_H = {
  rail: 'h-[140px] lg:h-[172px]',
  tall: 'h-[168px] lg:h-[214px]',
  band: 'h-[132px] lg:h-[168px]',
}
function PhotoCard({ photo, alt, size = 'rail', op, eager = true, className }) {
  if (!PHOTOS[photo]) return null
  return (
    <div className={cn(PANEL, PHOTO_H[size], className)}>
      <Frame photo={photo} alt={alt} op={op} eager={eager}/>
    </div>
  )
}

/* The workhorse container on all three pages: a card of labelled rows. A label
   and its value, never a label over a paragraph, so a true statement costs one
   or two lines of height wherever it lands.

   `hue` colours the head strip and a 3px left edge; `photo` makes the card's
   top edge a wide banner, which is the widest a frame runs on these pages
   outside the hero. */
function Facts({ rows, head, hue, photo, photoAlt, photoOp, className, tone = 'card' }) {
  const ink = tone === 'ink'
  const h = !ink && HUE[hue]
  return (
    <div className={cn(ink ? PANEL_INK : PANEL, h && ['border-l-[3px]', h.edge], className)}>
      {photo && (
        <div className={cn('border-b border-rule', PHOTO_H.band)}>
          <Frame photo={photo} alt={photoAlt} op={photoOp} eager/>
        </div>
      )}
      {/* max-w-none: input.css caps every <p> at 62ch, which is right for a
          line of prose and wrong for a head strip that carries a ground, where
          it left the tint stopping two thirds of the way across a wide card. */}
      {head && (
        <p className={cn('max-w-none border-b px-3.5 py-2 font-display text-fine font-bold leading-tight',
          ink ? 'border-ink-2 text-paper'
              : h ? ['border-rule', h.wash, h.ink] : 'border-rule text-ink')}>
          {head}
        </p>
      )}
      {rows.map(([label, value], i) => (
        <div key={label} className={cn('px-3.5 py-2',
          i && (ink ? 'border-t border-ink-2' : 'border-t border-rule'))}>
          <p className={cn('font-display text-fine font-bold leading-tight',
            ink ? 'text-paper' : 'text-ink')}>{label}</p>
          <p className={cn('mt-0.5 text-meta leading-[1.35]', ink ? 'text-mist' : 'text-ink-2')}>
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}

/* A card of chips: one per thing the audience is never given. The head band
   matches Facts above it, because these two are always shown as a pair and a
   heading set two different ways in one row is the thing a reader notices
   before they notice what either card says. `as` keeps the two lists on the
   parent page in the document outline, where they are real headings. */
function Chips({ head, rows, hue, as: As = 'p', className }) {
  const h = HUE[hue]
  return (
    <div className={cn(PANEL, 'flex h-full flex-col', h && ['border-l-[3px]', h.edge], className)}>
      <As className={cn('max-w-none border-b border-rule px-3.5 py-2 font-display text-fine',
        'font-bold leading-tight', h ? [h.wash, h.ink] : 'text-ink')}>{head}</As>
      {/* A card holding a row of chips: one level of nesting, which spec 2
          allows. The mark is each chip's marker, so the list has none. */}
      <ul className="m-0 grid list-none gap-1.5 p-3.5">
        {rows.map(t => (
          <li key={t} className="flex items-start gap-2 rounded-field border border-rule
            px-2.5 py-1.5 text-meta leading-[1.3] text-ink-2">
            <Never aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-3"/>{t}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* DemoNotice is attached here, not at each call site, so a figure cannot lose
   its "this is generated" line in an edit. Only the chart changes; the caveat
   stays. `title` is a figcaption, not a heading, so it never enters the
   document outline beside the band's own h2.
 *
 * `aside` is the thing the references have and this site did not: the
 * photograph of the people a chart is about, inside the chart's own border,
 * as one container rather than as a second card in a rail. It is a full height
 * column beside the figure at lg and a wide band under it below that, so the
 * same frame is read at two quite different shapes.
 *
 * `photo` is the other scale: a short wide strip across the figure's top. */
function Fig({ title, hue, photo, photoAlt, photoOp, photoClass, aside, asideAlt,
  children, className }) {
  const h = HUE[hue]
  const body = (
    <div className="min-w-0 p-3.5 lg:p-4">
      {children}
      <DemoNotice className="mt-3"/>
    </div>
  )
  return (
    <figure className={cn(PANEL, 'm-0 flex flex-col', h && ['border-l-[3px]', h.edge], className)}>
      {photo && (
        <div className={cn('shrink-0 border-b border-rule', photoClass || 'h-[104px] lg:h-[124px]')}>
          <Frame photo={photo} alt={photoAlt} op={photoOp} eager/>
        </div>
      )}
      {title && (
        <figcaption className={cn('border-b px-3.5 py-2 font-display text-fine font-bold leading-tight',
          h ? ['border-rule', h.wash, h.ink] : 'border-rule text-ink')}>
          {title}
        </figcaption>
      )}
      {aside ? (
        <div className="grid min-w-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,230px)]">
          {body}
          <div className="h-[152px] border-t border-rule lg:h-auto lg:border-l lg:border-t-0">
            <Frame photo={aside} alt={asideAlt} eager/>
          </div>
        </div>
      ) : body}
    </figure>
  )
}

/* ───────────────────────────── shared page parts ───────────────────────── */

/* The hero ground is the page's lead hue, which is the one place a visitor
   decides within a second whether these are three pages or one. The frame is
   the largest on the page by a wide margin: 320px against a 172px rail card. */
function Hero({ label, title, lede, go, photo, photoAlt, facts, hue }) {
  const h = HUE[hue]
  return (
    <div className={cn('border-b border-rule', h ? h.wash : 'bg-mist')}>
      <div className="wrap grid gap-3 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,38%)]
        lg:items-end lg:gap-5 lg:py-7">
        <div className="min-w-0">
          <button onClick={() => go('site')}
            className="mb-3 flex min-h-[44px] w-fit items-center gap-2 py-2 font-display text-meta
              font-medium text-accent transition-colors duration-150 hoverOnly:text-accent-ink">
            <ArrowLeft aria-hidden className="size-4"/> Overview
          </button>
          {/* The label is a chip on a white ground rather than a word on the
              band: the hue inks are measured on card at 5.6 and up, and the
              chip is what carries the page's colour at the top of the page. */}
          <p className={cn('inline-flex rounded-chip border border-rule bg-card px-2.5 py-1',
            'font-mono text-ui font-bold tracking-[0.005em]', h ? h.ink : 'text-accent')}>{label}</p>
          <h1 className="mt-2 max-w-[16ch] font-display text-major font-bold leading-[1.06]
            tracking-tight text-ink">{title}</h1>
          <p className="mt-3 max-w-[42ch] text-sec font-medium leading-[1.35] text-ink">{lede}</p>
          {/* The hero's own facts sit beside the photograph from lg and under
              the title below it, so a phone gets the statement without the
              frame pushing it off the fold. */}
          <Facts hue={hue} className="mt-3 lg:max-w-[36rem]" rows={facts}/>
        </div>
        {photo && (
          <div className={cn(PANEL, 'h-[190px] sm:h-[240px] lg:h-[320px]')}>
            <Frame photo={photo} alt={photoAlt} eager/>
          </div>
        )}
      </div>
    </div>
  )
}

/* The ink band is the site's single separation device: one per page. Two
   columns from lg, with what the screen actually opens stated beside the
   button rather than left to the button's own four words. */
function Closer({ title, line, label, view, go, rows }) {
  return (
    <Section name="Open the app" tone="ink" tight>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-4">
        <div className="min-w-0">
          <SectionHead tone="ink">{title}</SectionHead>
          <SectionLede tone="ink">{line}</SectionLede>
          {/* The solid variant disappears on the ink band; accent-lit carries
              ink text at 7.67:1. */}
          <Button size="sm" className="mt-3 bg-accent-lit text-ink hoverOnly:bg-paper"
            onClick={() => go(view)}>
            {label} <ArrowRight aria-hidden/>
          </Button>
        </div>
        <Facts tone="ink" rows={rows} className="self-end"/>
      </div>
    </Section>
  )
}

/* The one line each page prints about its own photographs. */
const STOCK = ['The photographs', 'Licensed stock frames of models. Nobody shown uses MindMap.']

/* ═══════════════════════════════ for students ═══════════════════════════ */

/* Read only. The interactive RainbowKey belongs on the app screen, not here.
   Four tiles, four hues, per SIGNAL_HUE above. */
function Signals({ rings }) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 lg:gap-3">
      {rings.map(r => {
        const s = SENSORS[r.id]
        const Icon = s.icon
        const h = HUE[SIGNAL_HUE[r.id]]
        return (
          <li key={r.id} className={cn('rounded-field border border-rule p-3', h && h.wash)}>
            <span className="flex items-center gap-2">
              <Icon aria-hidden className="size-4 shrink-0" style={{ color: s.glow }}/>
              {/* text-ui until lg: "Temperature" at text-row overruns a 115px
                  tile at 390px and clips. */}
              <span className="font-display text-ui font-bold leading-tight text-ink">{s.name}</span>
            </span>
            <span className="mt-2 flex items-baseline gap-1.5">
              {/* Numeral is ink, never the signal's colour: four coloured
                  numerals down a page read as four alarms. */}
              <span className="font-mono text-num tabular-nums leading-none text-ink">{r.value}</span>
              <span className="text-fine text-ink-3">of 100</span>
            </span>
            <Progress value={r.value} tone={s.glow} label={`${s.name}, ${r.value} out of 100`}
              className="mt-2 h-1.5"/>
          </li>
        )
      })}
    </ul>
  )
}

export function ForStudents({ go }) {
  const rings = React.useMemo(() => studentRings(), [])
  const band = DATA.weekBand || { hi: 1 }
  const days = DATA.week || []
  const over = days.filter(d => d.v > band.hi).length

  return (
    <main>
      <Hero go={go} label="For students" hue="sky" photo="student-hero"
        photoAlt="A teenager in headphones and a lilac T shirt sitting in front of a sofa, holding a games controller"
        title={`Your ${SCORE}, every day.`}
        lede="You decide what leaves your phone."
        facts={[
          ['One number a day', `${SCORE_RANGE}, measured against your own normal.`],
          ['Shared by default', `Nothing. ${CONSENT_SHORT}`],
          STOCK,
        ]}/>

      {/* -- today ---------------------------------------------------------
          The figure and what the figure means, side by side. The dial used to
          take a band of its own with the four signals beside it and nothing
          else, which was 320px of band for one number. The wide strip across
          the figure's top is the shortest frame on the page, at 104px. */}
      <Section name="Today" tone="card" tight>
        <SectionHead>Your {SCORE} today</SectionHead>
        <SectionLede>Measured against your own normal, never against anyone else.</SectionLede>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn>
            <Fig hue="sky" title={`Today's ${SCORE}, and the four signals under it`}
              photo="student-game" photoOp="object-[50%_34%]"
              photoAlt="Three teenage boys sitting on a sofa with games controllers and headphones">
              <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:gap-6">
                <RainbowDial score={62} usual={51} rings={rings} size={320}/>
                <div className="w-full min-w-0"><Signals rings={rings}/></div>
              </div>
            </Fig>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Facts hue="sky" head="Reading the dial" rows={[
                ['The number', `${SCORE_RANGE}. Higher means further from your own normal.`],
                ['Each ring', 'One signal against your own fourteen day baseline.'],
                ['The mark on the arc', 'What a usual day looks like for you.'],
                ['Movement', 'A control. A hard run is not scored as a hard day.'],
              ]}/>
            </ScrollIn>
            <ScrollIn className="min-h-0 flex-1">
              <PhotoCard photo="student-basketball" eager={false} className="h-full min-h-[150px]"
                alt="A teenager dribbling a basketball on an outdoor court, another player reaching in"/>
            </ScrollIn>
          </div>
        </div>
      </Section>

      {/* -- the week ------------------------------------------------------
          The chart and the people it is about, in one container. */}
      <Section name="Your week" tone="card" className="bg-sun-wash" tight>
        <SectionHead>Which days ran hard</SectionHead>
        <SectionLede>Seven days against your own range, not against a target.</SectionLede>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn>
            <Fig hue="sun" title="Seven days, against your own usual range"
              aside="students-hallway"
              asideAlt="Four high school students walking along a bright corridor with folders and backpacks, talking as they go">
              <WeekChart data={DATA.week} band={DATA.weekBand}/>
            </Fig>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Facts hue="sun" head="What the chart says" rows={[
                ['Above your range', `${over} of ${days.length} days this week.`],
                ['The shaded band', 'Your own usual range, built from your last fourteen days.'],
                ['What a parent sees', 'Which days ran high. Never the reading behind them.'],
                ['What anyone else sees', 'Nothing you have not shared.'],
              ]}/>
            </ScrollIn>
            <ScrollIn>
              <PhotoCard photo="student-homework" size="tall"
                alt="A teenager in headphones leaning over an open notebook at a desk, a laptop and a pencil case beside them"/>
            </ScrollIn>
          </div>
        </div>
      </Section>

      {/* -- your call -----------------------------------------------------
          "You see all of it, first" and "Nothing leaves your phone unless you
          say so" were two bands carrying one sentence each. They are one band
          with four statements and the list of what never leaves at all. */}
      <Section name="Your call" tone="card" className="bg-mint-wash" tight>
        <SectionHead>Nothing leaves your phone unless you say so</SectionHead>
        <SectionLede>You see all of it first, and you can switch any of it off.</SectionLede>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-4">
          <ScrollIn>
            <Facts hue="mint" head="How sharing works"
              photo="friends-steps" photoOp="object-[50%_30%]"
              photoAlt="Two students sitting on concrete steps outside a building, heads together over an open notebook"
              rows={[
                ['Who opens the account', 'A guardian. You choose what is shared after that.'],
                ['Set per audience', `Sharing a week with a parent shares nothing with a ${PRO_LC}.`],
                ['Switching off', CONSENT_OFF],
                ['What a parent can see at most', `A ${SCORE} a day, and which days ran high.`],
                [`What a ${PRO_LC} can see at most`, `A ${SCORE}, and the direction it moved.`],
              ]}/>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Chips hue="mint" head="Never leaves your phone"
                rows={[NOTES, LOCATION, 'Any single reading', 'Anything you type anywhere here']}/>
            </ScrollIn>
            <ScrollIn>
              <PhotoCard photo="student-bus"
                alt="Two boys laughing together on a school bus seat, one holding a phone"/>
            </ScrollIn>
          </div>
        </div>
      </Section>

      <Closer go={go} view="app-student" label="Open the student screen" title="The student screen"
        line={`Your ${SCORE}, the check-in and the toolkit. Sample readings only.`}
        rows={[
          ['Four tabs', 'Today, Reading, Toolkit, Sharing.'],
          ['No account', 'Nothing is sent anywhere and nothing is kept off the device.'],
          ['No patch needed', 'The demo opens on a worked day already filled in.'],
        ]}/>
    </main>
  )
}

/* ═══════════════════════════════ for parents ════════════════════════════ */

/* Consent scope for a parent. UNSEEN is not a settings page a parent has not
   found: there is no parent view of any of it, which is why it is drawn as an
   absence. Moving a row between these lists is a consent change. */
const SEEN = [`The daily ${SCORE}`, 'Which days ran high', 'A patch gone quiet']
const UNSEEN = ['Any single reading', NOTES, LOCATION, 'Anything in real time']

function SeenUnseen() {
  return (
    <>
      {[['You see', SEEN, true, 'mint'], ['You never see', UNSEEN, false, 'blush']]
        .map(([head, rows, yes, hue], ci) => {
          const h = HUE[hue]
          return (
            <ScrollRow key={head} index={ci} className="h-full">
              <div className={cn(PANEL, 'flex h-full flex-col border-l-[3px]', h.edge)}>
                <h3 className={cn('border-b border-rule px-3.5 py-2 font-display text-fine',
                  'font-bold leading-tight', h.wash, h.ink)}>{head}</h3>
                {/* The tick or the bar is each row's marker, so the list has
                    none of its own. */}
                <ul className="m-0 grid list-none gap-1.5 p-3.5">
                  {rows.map(r => (
                    <li key={r} className="flex items-start gap-2 rounded-field border border-rule
                      px-2.5 py-1.5 text-meta leading-[1.3] text-ink-2">
                      {yes ? <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent"/>
                           : <Never aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-3"/>}
                      <span className="min-w-0">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollRow>
          )
        })}
    </>
  )
}

export function ForParents({ go }) {
  const band = DATA.weekBand || { hi: 1 }
  const days = DATA.week || []
  const over = days.filter(d => d.v > band.hi).length

  return (
    <main>
      <Hero go={go} label="For parents" hue="lilac" photo="parent-hero"
        photoAlt="A mother and her teenage child smiling at an open laptop together at home"
        title="What you see about your child."
        lede="A week, and one sentence about it."
        facts={[
          ['The finest you are shown', 'A day. Never an hour, never a moment.'],
          ['Never shown to you', `A raw reading, ${NOTES}, or ${LOCATION}.`],
          STOCK,
        ]}/>

      {/* -- the week ------------------------------------------------------
          The chart and the household it is about, in one container. */}
      <Section name="The week" tone="card" tight>
        <SectionHead>Your child&rsquo;s week, against their own normal</SectionHead>
        <SectionLede>One value a day, and the range it is measured against.</SectionLede>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn>
            <Fig hue="lilac" title="Monday, Wednesday and Thursday ran high"
              aside="parent-kitchen"
              asideAlt="A mother and her teenage son chopping vegetables side by side at a kitchen counter">
              <WeekChart data={DATA.week} band={DATA.weekBand}/>
            </Fig>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Facts hue="lilac" head="What the chart says" rows={[
                ['Above their own range', `${over} of ${days.length} days this week.`],
                ['The shaded band', `Your child's own usual range, from their last fourteen days.`],
                ['One value a day', 'The finest this screen will ever go.'],
                ['What it does not tell you', 'What happened in the day. The product does not have it.'],
              ]}/>
            </ScrollIn>
            <ScrollIn>
              <PhotoCard photo="student-controller" size="tall"
                alt="A teenager in headphones and a red T shirt sitting in an armchair with a games controller"/>
            </ScrollIn>
          </div>
        </div>
      </Section>

      {/* -- what you see --------------------------------------------------
          Three columns from lg: the two lists, and the consent rules that
          decide which list a row is in. */}
      <Section name="What you see" tone="card" className="bg-blush-wash" tight>
        <SectionHead>What you see, and what you never see</SectionHead>
        <SectionLede>The right column is not a setting you have not found.</SectionLede>
        <div className="mt-3 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          <SeenUnseen/>
          <ScrollIn className="sm:col-span-2 lg:col-span-1">
            <Facts hue="blush" head="Why the right column is empty" rows={[
              ['It is not withheld from you', 'There is no parent view of any of it to open.'],
              ['Who decides', CONSENT_SHORT],
              ['Set per audience', `Granting a week to you grants nothing to a ${PRO_LC}.`],
              ['It can be revoked', CONSENT_OFF],
            ]}/>
          </ScrollIn>
          {/* The widest frame on this page, across the whole band, which is
              the scale change spec 5 asks for against the rail cards above. */}
          <ScrollIn className="sm:col-span-2 lg:col-span-3">
            <PhotoCard photo="student-bus" size="band" op="object-[50%_32%]"
              alt="Two boys laughing together on a school bus seat, one holding a phone"/>
          </ScrollIn>
        </div>
      </Section>

      {/* -- using it ------------------------------------------------------
          "Sharing is set per audience" and "Be around on the days that ran
          high" were two bands of one sentence each. They are one band, and the
          day is named while what happened in it is not, because the product
          does not have it. Do not imply otherwise here. */}
      <Section name="Using it" tone="card" className="bg-sun-wash" tight>
        <SectionHead>Be around on the days that ran high</SectionHead>
        <SectionLede>You know the day ran hard. Not what happened in it.</SectionLede>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-4">
          <ScrollIn>
            <Facts hue="sun" head="What this screen is for" rows={[
                ['A prompt, not a report', 'A reason to be around on a Thursday evening.'],
                ['Not a diagnosis', 'MindMap is not a medical device and screens for nothing.'],
                ['No ranking', 'Your child is never compared with another student.'],
                ['A patch gone quiet', 'You are told it stopped reporting. Not where it is.'],
              ]}/>
          </ScrollIn>
          <ScrollIn>
            <PhotoCard photo="parent-card" size="tall"
              alt="A mother and her teenage child sitting close together on a sofa at home, both smiling"/>
          </ScrollIn>
        </div>
      </Section>

      <Closer go={go} view="app-parent" label="Open the parent screen" title="The parent screen"
        line="The week, and what is shared. Sample readings only."
        rows={[
          ['What it opens on', `The week, one ${SCORE} a day.`],
          ['What it will not open', 'A reading, a note, or a location. There is no view of them.'],
          ['Crisis alerts', 'The one thing no guardian can consent away.'],
        ]}/>
    </main>
  )
}

/* ═══════════════════════════ for medical professionals ══════════════════ */

/* `Bars` takes a paint, not a class, so accent is passed by value. #0a6e68 is
   what the token resolves to; keep them in step. */
const ACCENT = '#0a6e68'
const SCHOOL_WEEK = COHORT_WEEKDAY.map(d => ({ label: d.label, v: d.mean }))

/* Ordered on the week's movement, not on today's score: a student who has
   always run high is rarely the one being missed. CASELOAD_DEF states the
   ordering above the table, so keep the two in agreement.

   A real <table>, for the column headers, row scope and numeric alignment. */
const BOARD = roster().filter(s => s.showTrend).sort((a, b) => b.velocity - a.velocity)
const SERIES = name => CHART_DATA.pro?.[name.replace(/\D/g, '')]

function Caseload() {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">{CASELOAD_TITLE}</caption>
      <thead>
        <tr className="border-b border-ink font-display text-fine font-bold text-ink-2">
          <th scope="col" className="py-2.5 pr-3">Student</th>
          {/* The seven weekly points the order is built on; hidden below sm,
              where the three figures carry the row. */}
          <th scope="col" className="hidden py-2.5 pr-3 sm:table-cell">Seven weeks</th>
          <th scope="col" className="py-2.5 pl-2 text-right">Was</th>
          <th scope="col" className="py-2.5 pl-2 text-right">Now</th>
          <th scope="col" className="py-2.5 pl-2 text-right">Change</th>
        </tr>
      </thead>
      <tbody>
        {BOARD.map(s => (
          <tr key={s.id}>
            <th scope="row" className="border-b border-rule py-2.5 pr-3 text-left font-normal">
              <span className="block text-meta text-ink">{s.name}</span>
              <span className="block font-display text-fine font-bold text-ink-3">
                Grade {s.grade}. {TIER_LABEL[s.tier]}</span>
            </th>
            <td className="hidden border-b border-rule py-2.5 pr-3 sm:table-cell">
              {/* Not every student has a weekly series in the fixtures. A blank
                  cell in a table of figures reads as a bug, so draw the
                  absence as a flat rule. */}
              {SERIES(s.name)
                ? <Spark data={SERIES(s.name)}/>
                : <span aria-hidden className="block h-px w-16 bg-ruling"/>}
            </td>
            <td className="border-b border-rule py-2.5 pl-2 text-right font-mono text-meta
              tabular-nums text-ink-3">{s.weekAgo}</td>
            <td className="border-b border-rule py-2.5 pl-2 text-right font-mono text-num
              tabular-nums text-ink">{s.current}</td>
            <td className={cn('border-b border-rule py-2.5 pl-2 text-right font-mono text-meta tabular-nums',
              s.velocity > 0 ? 'text-warn' : s.velocity < 0 ? 'text-calm' : 'text-ink-3')}>
              {s.velocity > 0 ? '▲ +' : s.velocity < 0 ? '▼ ' : ''}{s.velocity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* k-anonymity floor: a period under K_ANONYMITY renders as a withheld row in
   line with the ones that cleared. Never print a mean for a suppressed row. */
function SmallGroups() {
  return (
    <ul className="m-0 list-none p-0">
      {COHORT_PERIOD.map(c => (
        <li key={c.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2
          border-t border-rule py-2.5 sm:grid-cols-[minmax(0,14rem)_minmax(5rem,1fr)_4.5rem]">
          <span className="order-1 min-w-0">
            <span className="block font-display text-meta font-bold text-ink">{c.label}</span>
            <span className="block text-fine text-ink-3">{c.n} students</span>
          </span>
          {/* The bar is ordered last on a phone and given the full row: in an
              auto-width column it collapses to a few pixels. */}
          <span className="order-3 col-span-2 sm:order-2 sm:col-span-1">
            {c.suppressed ? (
              <span className="block font-display text-fine text-ink-3">
                Under {K_ANONYMITY}, so nothing is reported</span>
            ) : (
              <Progress value={c.mean} label={`${c.label}, mean ${c.mean}`} className="h-2.5"/>
            )}
          </span>
          <span className="order-2 text-right font-mono text-meta tabular-nums text-ink sm:order-3">
            {c.suppressed ? 'withheld' : c.mean}</span>
        </li>
      ))}
    </ul>
  )
}

export function ForSchools({ go }) {
  const suppressed = COHORT_PERIOD.filter(c => c.suppressed).length
  const peak = COHORT_WEEKDAY.reduce((a, b) => (b.mean > a.mean ? b : a))

  return (
    <main>
      <Hero go={go} label={PRO_FOR} hue="mint" photo="clinic-talk"
        photoAlt="A teenager and an adult sitting and talking on a sofa by a sunlit window"
        title={`What a ${PRO_LC} sees.`}
        lede="Caseload-wide patterns, and a floor under small groups."
        facts={[
          ['What you are given', `A ${SCORE}, and the direction it moved.`],
          ['Never given', `A single reading, ${NOTES}, or ${LOCATION}.`],
          STOCK,
        ]}/>

      {/* -- across the caseload -------------------------------------------
          The consent qualifier appears once per page. Bars inks the peak, so
          the figure beside it names the day rather than a sentence on the band
          claiming it. The strip across the figure's top is the frame of the
          conversation the figure is meant to start. */}
      <Section name="Across the caseload" tone="paper" tight>
        <SectionHead>How the week runs</SectionHead>
        <SectionLede>Mean {SCORE}, across everyone sharing with you.</SectionLede>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn>
            <Fig hue="mint" title={`The school week, by mean ${SCORE}`}
              photo="students-hallway" photoOp="object-[50%_30%]"
              photoAlt="Four high school students walking along a bright corridor with folders and backpacks, talking as they go">
              {/* Width cap: `Bars` splits its width evenly between five bars,
                  and at 1360px each is wider than it is tall. */}
              <Bars data={SCHOOL_WEEK} color={ACCENT} unit="school day" className="max-w-[640px]"/>
            </Fig>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Facts hue="mint" head="What the figure says" rows={[
                ['Students in the figure', `${SCHOOL_N}, all of them sharing with a ${PRO_LC}.`],
                ['Highest day', `${peak.full}, at a mean of ${peak.mean}.`],
                ['What it is not', 'A ranking. No student can be read off this figure.'],
                ['Where it comes from', 'Generated by the scoring model. Nobody was measured.'],
              ]}/>
            </ScrollIn>
            <ScrollIn>
              <PhotoCard photo="school-card"
                alt="A woman and a teenage boy talking in a room lined with shelves"/>
            </ScrollIn>
          </div>
        </div>
      </Section>

      {/* -- by class period ----------------------------------------------- */}
      <Section name="By class period" tone="card" className="bg-sky-wash" tight>
        <SectionHead>The floor under small groups</SectionHead>
        <SectionLede>Nothing is reported for a group under {K_ANONYMITY} students.</SectionLede>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn>
            <Fig hue="sky" title={`Mean ${SCORE} by class period, with the floor applied`}>
              <SmallGroups/>
            </Fig>
          </ScrollIn>
          <ScrollIn>
            <Facts hue="sky" head="How the floor works"
              photo="student-card"
              photoAlt="Five teenagers walking together through a park, talking as they go"
              rows={[
              ['The floor', `${K_ANONYMITY} students. Below it, no mean is computed or shown.`],
              ['Withheld here', `${suppressed} of ${COHORT_PERIOD.length} periods.`],
              ['Why a row stays', 'A missing row would say as much as the mean would.'],
              ['It cannot be turned off', 'There is no setting for it anywhere in the product.'],
            ]}/>
          </ScrollIn>
        </div>
      </Section>

      {/* -- the caseload --------------------------------------------------- */}
      <Section name="The caseload" tone="card" tight>
        <SectionHead>{CASELOAD_TITLE}</SectionHead>
        <SectionLede>{CASELOAD_DEF}</SectionLede>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn>
            <Fig hue="lilac" title="Was, now, and the change since last week">
              <Caseload/>
            </Fig>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Facts hue="lilac" head="Who is on it" rows={[
                ['On this list', `${BOARD.length} students, all consented to trends.`],
                ['Off this list', 'Students consented to a score without trends, or to alerts only.'],
                ['Why movement, not score', 'A student steady at 86 for a month is not the change.'],
                ['Never a rank', 'No position numerals, and no student is compared with another.'],
              ]}/>
            </ScrollIn>
            <ScrollIn>
              <PhotoCard photo="friends-steps" size="tall"
                alt="Two students sitting on concrete steps outside a building, heads together over an open notebook"/>
            </ScrollIn>
          </div>
        </div>
      </Section>

      {/* -- access ---------------------------------------------------------
          Consent scope for a medical professional; all three claims are
          product-critical. A score and its direction only, never a reading,
          notes or location, and every record opened is logged with no setting
          to turn it off. The full who-sees-what matrix is on the overview and
          privacy pages. */}
      <Section name="Access" tone="card" className="bg-lilac-wash" tight>
        <SectionHead>What a {PRO_LC} gets</SectionHead>
        <SectionLede>A {SCORE}, and the direction it moved.</SectionLede>
        <div className="mt-3 grid gap-3 lg:grid-cols-2 lg:gap-4">
          <ScrollIn className="h-full">
            <Chips hue="coral" as="h3" head={`Never given to a ${PRO_LC}`}
              rows={['A single reading', NOTES, LOCATION, `A group under ${K_ANONYMITY} students`]}/>
          </ScrollIn>
          <ScrollIn className="h-full">
            <Facts hue="mint" className="h-full" head="The log" rows={[
              ['Every record opened', 'Written to the audit log, with who and when.'],
              ['No setting turns it off', 'Not for a guardian, not for you, not for us.'],
              ['Consent is per student', `Only what that student agreed to share with a ${PRO_LC}.`],
              ['Crisis alerts', 'Reach you in every case. No guardian can consent that away.'],
            ]}/>
          </ScrollIn>
        </div>
      </Section>

      <Closer go={go} view="app-pro" label="Open the console"
        title={`The ${PRO_LC} console`}
        line="The check-in list and the audit log. Sample students only."
        rows={[
          ['What it opens on', CASELOAD_TITLE + '.'],
          ['The consent tab', 'What each guardian signed, and when it expires.'],
          ['The audit tab', 'Every record opened, in order, with no way to clear it.'],
        ]}/>
    </main>
  )
}
