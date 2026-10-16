import React from 'react'
import { PHOTOS } from '../lib/photos'
import { Frame } from '../ui/frame'
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
  CASELOAD_DEF, CASELOAD_TITLE, CONSENT_SHORT, LOCATION, NOTES, SCORE,
  SCORE_RANGE, PRO, PRO_LC, PRO_FOR,
} from '../lib/terms'

/* The three audience routes: students, parents, medical professionals.
 *
 * These are no longer leaf pages. The entry chooser in views/Entry.jsx sends
 * Student, Parent and Medical professional straight here, so for most visitors
 * one of these three is the first real page of the site, and they are held to
 * docs/design-spec.md exactly as the overview is.
 *
 * WHAT CHANGED ON 13 OCTOBER, and why. Spec 0d rules 1 to 4 landed together
 * and three of them bite on these pages:
 *
 *   - COLOUR. The six hues are retired. Each page used to own a lead hue that
 *     reached the band ground, a card's head strip, a card's left edge and the
 *     four signal tiles; two of those hues were the cream and the purple the
 *     owner named as outside the scheme. A set of cards is now told apart by
 *     its ground STEP -- paper, card, aqua, aqua-2, accent-wash, beam-wash --
 *     by its order, and by its own label, never by a colour each. The one
 *     colour left on a figure is the sensor's own, which the score dial is
 *     built from.
 *
 *   - THE CAPSULE LABEL. The audience tag in the hero was a rounded-full
 *     capsule of monospace letterspaced type in a hue, which the owner named
 *     as the clearest mark of a generated page. It is a line of type now.
 *
 *   - PHOTOGRAPHY. Four local copies of a Frame component with four copies of
 *     the dimension table have become one import from ui/frame, which reads
 *     each photograph's focal point from lib/photos, so no call site guesses
 *     at where a subject sits. Every frame holding a face is at least 176px
 *     tall at every breakpoint and no frame runs wider than the aspect its
 *     subject survives, which is what cut the faces off before.
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

/* One container ground. The ink panel went with the ink band, per spec 0c
   rule 1. */
const PANEL = 'overflow-hidden rounded-panel border border-rule bg-card'

/* A photograph as a card's whole top edge. `size` sets the height, and the
   heights are set by what the photographs survive rather than by taste:
   spec 0d rule 4 puts a 176px floor under any frame holding a face, and
   lib/photos records, per file, the widest aspect its subject survives. These
   three ladders keep every frame on these pages inside both, including in the
   768 to 1023 range where a rail card is still the full width of the page. */
const PHOTO_H = {
  rail: 'h-[184px] sm:h-[240px] md:h-[320px] lg:h-[200px]',
  tall: 'h-[208px] sm:h-[280px] md:h-[340px] lg:h-[276px]',
  band: 'h-[184px] sm:h-[240px] md:h-[320px] lg:h-[268px]',
}
function PhotoCard({ photo, alt, size = 'rail', eager = true, className }) {
  if (!PHOTOS[photo]) return null
  return (
    <div className={cn(PANEL, PHOTO_H[size], className)}>
      <Frame photo={photo} alt={alt} eager={eager}/>
    </div>
  )
}

/* The workhorse container on all three pages: a card of labelled rows. A label
   and its value, never a label over a paragraph, so a true statement costs one
   or two lines of height wherever it lands.

   `photo` makes the card's top edge a wide banner, which is the widest a frame
   runs on these pages outside the hero. */
function Facts({ rows, head, photo, photoAlt, className }) {
  return (
    <div className={cn(PANEL, className)}>
      {photo && (
        <div className={cn('border-b border-rule', PHOTO_H.band)}>
          <Frame photo={photo} alt={photoAlt} eager/>
        </div>
      )}
      {/* max-w-none: input.css caps every <p> at 62ch, which is right for a
          line of prose and wrong for a head strip that carries a ground, where
          it left the tint stopping two thirds of the way across a wide card. */}
      {head && (
        <p className="max-w-none border-b border-rule bg-aqua px-3.5 py-2 font-display
          text-fine font-bold leading-tight text-ink">
          {head}
        </p>
      )}
      {rows.map(([label, value], i) => (
        <div key={label} className={cn('px-3.5 py-2', i && 'border-t border-rule')}>
          <p className="font-display text-fine font-bold leading-tight text-ink">{label}</p>
          <p className="mt-0.5 text-meta leading-[1.35] text-ink-2">{value}</p>
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
function Chips({ head, rows, as: As = 'p', className }) {
  return (
    <div className={cn(PANEL, 'flex h-full flex-col', className)}>
      <As className="max-w-none border-b border-rule bg-aqua px-3.5 py-2 font-display text-fine
        font-bold leading-tight text-ink">{head}</As>
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
 * The short wide strip across a figure's top is gone: at a phone it was a
 * 104px band holding four faces, which spec 0d rule 4 forbids outright, and at
 * tablet width no height a strip can have keeps a group of faces inside the
 * aspect they survive. The same photographs are in the aside column, which is
 * tall and narrow and is the shape a group of people actually fits. It is
 * drawn from lg only: on a phone it would be the same wide band again, and a
 * phone has enough photographs on these pages without it. */
/* The aside photograph appears at 2xl, not lg. At 1280 a 230px photograph left
   the dial and the four signal cards about 530px of track between them, and
   the two bottom cards ran under the photograph's left edge: "Temperatu" and
   "Movement" were cut in half. The figure is the content and the photograph is
   company for it, so the photograph is the thing that waits for room. */
function Fig({ title, aside, asideAlt, children, className }) {
  const body = (
    <div className="min-w-0 p-3.5 lg:p-4">
      {children}
      <DemoNotice className="mt-3"/>
    </div>
  )
  return (
    <figure className={cn(PANEL, 'm-0 flex flex-col', className)}>
      {title && (
        <figcaption className="border-b border-rule bg-aqua px-3.5 py-2 font-display text-fine
          font-bold leading-tight text-ink">
          {title}
        </figcaption>
      )}
      {aside ? (
        <div className="grid min-w-0 flex-1 2xl:grid-cols-[minmax(0,1fr)_minmax(0,230px)]">
          {body}
          <div className="hidden border-l border-rule 2xl:block">
            <Frame photo={aside} alt={asideAlt} eager/>
          </div>
        </div>
      ) : body}
    </figure>
  )
}

/* ───────────────────────────── shared page parts ───────────────────────── */

/* The hero ground is the page's lead ground step, which is the one place a
   visitor decides within a second whether these are three pages or one. The
   frame is the largest on the page by a wide margin: 320px against a 200px
   rail card. */
function Hero({ label, title, lede, go, photo, photoAlt, facts, ground }) {
  return (
    <div className={cn('border-b border-rule', ground || 'bg-aqua')}>
      <div className="wrap grid gap-3 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,38%)]
        lg:items-end lg:gap-5 lg:py-7">
        <div className="min-w-0">
          <button onClick={() => go('site')}
            className="mb-3 flex min-h-[44px] w-fit items-center gap-2 py-2 font-display text-meta
              font-medium text-accent transition-colors duration-150 hoverOnly:text-accent-ink">
            <ArrowLeft aria-hidden className="size-4"/> Overview
          </button>
          {/* An eyebrow is a line of type, per spec 0d rule 2: the capsule
              this replaced -- rounded-full, monospace, letterspaced, bold, in
              a hue -- is the mark the owner named, in this exact slot, as
              vibe-coded slop. accent-ink measures 6.84 : 1 on the deepest of
              the four hero grounds. */}
          <p className="font-body text-ui font-semibold text-accent-ink">{label}</p>
          <h1 className="mt-2 max-w-[16ch] font-display text-major font-bold leading-[1.06]
            tracking-tight text-ink">{title}</h1>
          {lede && (
            <p className="mt-3 max-w-[42ch] text-sec font-medium leading-[1.35] text-ink">{lede}</p>
          )}
          {/* The hero's own facts sit beside the photograph from lg and under
              the title below it, so a phone gets the statement without the
              frame pushing it off the fold. */}
          <Facts className="mt-3 lg:max-w-[36rem]" rows={facts}/>
        </div>
        {photo && (
          /* md: the hero is one column from 768 to 1023, so the frame is the
             full width of the page there and needs the height to match. */
          <div className={cn(PANEL, 'h-[190px] sm:h-[240px] md:h-[320px] lg:h-[320px]')}>
            <Frame photo={photo} alt={photoAlt} eager/>
          </div>
        )}
      </div>
    </div>
  )
}

/* The closing band. It was the page's one dark band, which spec 0c rule 1
   rules out: a band's ground comes from the near-whites and bg-ink is for
   marks, buttons, bars and strokes. The button is the solid one, which is
   bg-ink, so the ink is still on the page in the one place it belongs. */
function Closer({ title, line, label, view, go, rows, ground }) {
  return (
    <Section tone="paper" tight className={ground}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-4">
        <div className="min-w-0">
          <SectionHead>{title}</SectionHead>
          {line && <SectionLede>{line}</SectionLede>}
          <Button size="sm" className="mt-3" onClick={() => go(view)}>
            {label} <ArrowRight aria-hidden/>
          </Button>
        </div>
        <Facts rows={rows} className="self-end"/>
      </div>
    </Section>
  )
}

/* The one line each page prints about its own photographs. */
const STOCK = ['The photographs', 'These are licensed stock photos of models. Nobody shown uses MindMap.']

/* ═══════════════════════════════ for students ═══════════════════════════ */

/* Read only. The interactive RainbowKey belongs on the app screen, not here.
   Four tiles, told apart by name, by order and by the sensor's own mark. The
   four hues that used to tint them are retired; one ground step per tile, in
   the rainbow's own order, does the separating now. */
const SIGNAL_GROUND = ['bg-aqua', 'bg-aqua-2', 'bg-accent-wash', 'bg-beam-wash']

function Signals({ rings }) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 lg:gap-3">
      {rings.map((r, i) => {
        const s = SENSORS[r.id]
        const Icon = s.icon
        return (
          <li key={r.id} className={cn('rounded-field border border-rule p-3',
            SIGNAL_GROUND[i] || 'bg-aqua')}>
            <span className="flex items-center gap-2">
              <Icon aria-hidden className="size-4 shrink-0" style={{ color: s.glow }}/>
              {/* text-ui until lg: "Temperature" at text-row overruns a 115px
                  tile at 390px and clips. */}
              <span className="font-display text-ui font-bold leading-tight text-ink">{s.name}</span>
            </span>
            <span className="mt-2 flex items-baseline gap-1.5">
              {/* Numeral is ink, never the signal's colour: four coloured
                  numerals down a page read as four alarms. */}
              <span className="text-num tabular-nums leading-none text-ink">{r.value}</span>
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
      <Hero go={go} label="For students" ground="bg-accent-wash" photo="student-hero"
        photoAlt="A teenager in headphones sitting in front of a sofa, holding a games controller"
        title="See your stress as a number"
        lede="MindMap gives you one Mind Score a day, so you can see how stressed you are and take the right steps."
        facts={[
          ['One number a day', `Your ${SCORE} runs from ${SCORE_RANGE}, measured against your own usual.`],
          ['Shared by default', 'Nothing is shared until you choose to share it.'],
          STOCK,
        ]}/>

      {/* -- today ---------------------------------------------------------
          The figure and what the figure means, side by side. The lede that was
          here said what the Facts card beside it says in a row of its own, so
          it is gone: "Measured against your own normal" is row one. */}
      <Section tone="card" tight>
        <SectionHead>Your {SCORE} today</SectionHead>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn>
            <Fig title="The dial and the four signals"
              aside="student-game"
              asideAlt="Three teenage boys sitting on a sofa with games controllers and headphones">
              <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:gap-6">
                <RainbowDial score={62} usual={51} rings={rings} size={320}/>
                <div className="w-full min-w-0"><Signals rings={rings}/></div>
              </div>
            </Fig>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Facts head="How to read the dial" rows={[
                ['The number', `The score runs from ${SCORE_RANGE}. A higher number means a bigger change from your usual.`],
                ['Each ring', 'Each ring shows one body signal against your own last fourteen days.'],
                ['The mark on the arc', 'The mark shows where a usual day sits for you.'],
                ['Movement', 'Movement tells the app a hard run apart from a hard day.'],
              ]}/>
            </ScrollIn>
            <ScrollIn className="min-h-0 flex-1">
              <PhotoCard photo="student-basketball" eager={false} className="h-full min-h-[184px]"
                alt="A teenager dribbling a basketball on an outdoor court, another player reaching in"/>
            </ScrollIn>
          </div>
        </div>
      </Section>

      {/* -- the week ------------------------------------------------------
          The chart and the people it is about, in one container. */}
      <Section tone="paper" className="bg-aqua-2" tight>
        <SectionHead>Your week at a glance</SectionHead>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn>
            <Fig title="The last seven days"
              aside="students-hallway"
              asideAlt="Four high school students walking along a bright corridor with folders and backpacks, talking as they go">
              <WeekChart data={DATA.week} band={DATA.weekBand}/>
            </Fig>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Facts head="How to read the chart" rows={[
                ['Days above your range', `${over} of ${days.length} days this week ran above your usual range.`],
                ['The shaded band', 'The band is your usual range, built from your last fourteen days.'],
                ['What a parent sees', 'A parent can see which days ran high. A parent never sees a raw reading.'],
                ['What anyone else sees', 'Nobody else sees anything you have not chosen to share.'],
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
      <Section tone="card" tight>
        <SectionHead>Who can see your score</SectionHead>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-4">
          <ScrollIn>
            <Facts head="How sharing works"
              photo="friends-steps"
              photoAlt="Two students sitting on concrete steps outside a building, heads together over an open notebook"
              rows={[
                ['Who opens the account', 'A guardian opens the account. You choose what is shared after that.'],
                ['Shared per person', `Sharing with a parent does not share with a ${PRO_LC}. You set each one on its own.`],
                ['Switching off', 'You can switch any sharing off at any time.'],
                ['What a parent can see at most', `A parent sees one ${SCORE} a day and which days ran high.`],
                [`What a ${PRO_LC} can see at most`, `A ${PRO_LC} sees your ${SCORE} and the direction it moved.`],
              ]}/>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Chips head="What never leaves your phone"
                rows={[NOTES, LOCATION, 'Any raw reading', 'Anything you type in the app']}/>
            </ScrollIn>
            <ScrollIn>
              <PhotoCard photo="student-bus"
                alt="Two boys laughing together on a school bus seat, one holding a phone"/>
            </ScrollIn>
          </div>
        </div>
      </Section>

      <Closer go={go} view="app-student" ground="bg-beam-wash"
        label="Open the student screen" title="Try the student screen"
        line="The demo uses sample readings."
        rows={[
          ['Four tabs', 'The screen has Today, Reading, Toolkit and Sharing.'],
          ['No account needed', 'Nothing leaves your phone.'],
          ['No patch needed', 'The demo opens on a sample day already filled in.'],
        ]}/>
    </main>
  )
}

/* ═══════════════════════════════ for parents ════════════════════════════ */

/* Consent scope for a parent. UNSEEN is not a settings page a parent has not
   found: there is no parent view of any of it, which is why it is drawn as an
   absence. Moving a row between these lists is a consent change. */
const SEEN = [`One ${SCORE} a day`, 'Which days ran high', 'When the patch stops reporting']
const UNSEEN = ['Any raw reading', NOTES, LOCATION, 'Anything in real time']

function SeenUnseen() {
  return (
    <>
      {[['Shared with you', SEEN, true], ['Never shared with you', UNSEEN, false]]
        .map(([head, rows, yes], ci) => {
          return (
            <ScrollRow key={head} index={ci} className="h-full">
              <div className={cn(PANEL, 'flex h-full flex-col')}>
                <h3 className="border-b border-rule bg-aqua px-3.5 py-2 font-display text-fine
                  font-bold leading-tight text-ink">{head}</h3>
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
      <Hero go={go} label="For parents" ground="bg-beam-wash" photo="parent-hero"
        photoAlt="A mother and her teenage child smiling at an open laptop together at home"
        title="See how your teen's week went"
        lede="MindMap shows you one Mind Score a day for your child, and which days ran high, so you know when to be around."
        facts={[
          ['One score a day', 'A day is the finest detail you see. You never see an hour or a moment.'],
          ['Never shown to you', `You never see a raw reading, ${NOTES} or ${LOCATION}.`],
          STOCK,
        ]}/>

      {/* -- the week ------------------------------------------------------
          The chart and the household it is about, in one container. */}
      <Section tone="card" tight>
        <SectionHead>Your child's week</SectionHead>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn>
            <Fig title="The last seven days"
              aside="parent-kitchen"
              asideAlt="A mother and her teenage son chopping vegetables side by side at a kitchen counter">
              <WeekChart data={DATA.week} band={DATA.weekBand}/>
            </Fig>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Facts head="How to read the chart" rows={[
                ['Days above their range', `${over} of ${days.length} days this week ran above your child's usual range.`],
                ['The shaded band', `The band is your child's usual range, built from their last fourteen days.`],
                ['What the chart leaves out', 'The chart never says what happened in the day. MindMap does not record that.'],
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
      <Section tone="paper" className="bg-aqua-2" tight>
        <SectionHead>What is shared with you</SectionHead>
        <div className="mt-3 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          <SeenUnseen/>
          <ScrollIn className="sm:col-span-2 lg:col-span-1">
            <Facts head="Who decides what is shared" rows={[
              ['No hidden view', 'There is no parent screen for the rest, and no setting that unlocks one.'],
              ['Who decides', CONSENT_SHORT],
              ['Shared per person', `What your child shares with you does not go to a ${PRO_LC}.`],
              ['Switching off', 'The student can switch sharing off at any time.'],
            ]}/>
          </ScrollIn>
        </div>
      </Section>

      {/* -- using it ------------------------------------------------------
          "Sharing is set per audience" and "Be around on the days that ran
          high" were two bands of one sentence each. They are one band, and the
          day is named while what happened in it is not, because the product
          does not have it. Do not imply otherwise here. */}
      <Section tone="card" tight>
        <SectionHead>How the score helps your child</SectionHead>
        <SectionLede>MindMap tells you which days ran hard, never why.</SectionLede>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-4">
          <ScrollIn>
            <Facts head="What the screen gives you" rows={[
                ['A reason to check in', 'A high day is a good reason to be around that evening.'],
                ['Not a diagnosis', 'MindMap is not a medical device and does not diagnose anything.'],
                ['No ranking', 'Your child is never compared with another student.'],
                ['When the patch stops reporting', 'You are told the patch stopped reporting. You are never told where it is.'],
              ]}/>
          </ScrollIn>
          <ScrollIn>
            <PhotoCard photo="parent-card" size="tall"
              alt="A mother and her teenage child sitting close together on a sofa at home, both smiling"/>
          </ScrollIn>
        </div>
      </Section>

      <Closer go={go} view="app-parent" ground="bg-accent-wash"
        label="Open the parent screen" title="Try the parent screen"
        line="The demo uses sample readings."
        rows={[
          ['Opens on the week', `You see one ${SCORE} a day.`],
          ['Never shown', 'A raw reading, a note or a location never appears. There is no screen for them.'],
          ['Crisis alerts', 'A crisis alert always reaches a guardian. Nobody can switch that off.'],
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
          <th scope="col" className="py-2.5 pl-2 text-right">Last week</th>
          <th scope="col" className="py-2.5 pl-2 text-right">This week</th>
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
            <td className="border-b border-rule py-2.5 pl-2 text-right text-meta
              tabular-nums text-ink-3">{s.weekAgo}</td>
            <td className="border-b border-rule py-2.5 pl-2 text-right text-num
              tabular-nums text-ink">{s.current}</td>
            {/* The arrow carries the direction, not a colour: warn and crit are
                reserved for out of range and critical, and a week-on-week
                change is neither. */}
            <td className={cn('border-b border-rule py-2.5 pl-2 text-right text-meta tabular-nums',
              s.velocity ? 'text-ink' : 'text-ink-3')}>
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
                Fewer than {K_ANONYMITY} students, so nothing is shown</span>
            ) : (
              <Progress value={c.mean} label={`${c.label}, average ${c.mean}`} className="h-2.5"/>
            )}
          </span>
          <span className="order-2 text-right text-meta tabular-nums text-ink sm:order-3">
            {c.suppressed ? 'hidden' : c.mean}</span>
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
      <Hero go={go} label={PRO_FOR} ground="bg-aqua-2" photo="clinic-talk"
        photoAlt="A teenager and an adult sitting and talking on a sofa by a sunlit window"
        title="See trends across your students"
        lede="You see which students moved most since last week, and how groups are trending."
        facts={[
          ['What you see', `Each student's ${SCORE} and the direction it moved.`],
          ['What you never see', `You never see a raw reading, ${NOTES} or ${LOCATION}.`],
          STOCK,
        ]}/>

      {/* -- across the caseload -------------------------------------------
          The consent qualifier appears once per page. Bars inks the peak, so
          the figure beside it names the day rather than a sentence on the band
          claiming it. The strip across the figure's top is the frame of the
          conversation the figure is meant to start. */}
      <Section tone="card" tight>
        <SectionHead>Stress across all your students</SectionHead>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn>
            <Fig title={`Average ${SCORE} by school day`}
              aside="students-hallway"
              asideAlt="Four high school students walking along a bright corridor with folders and backpacks, talking as they go">
              {/* Width cap: `Bars` splits its width evenly between five bars,
                  and at 1360px each is wider than it is tall. */}
              <Bars data={SCHOOL_WEEK} color={ACCENT} unit="school day" className="max-w-[640px]"/>
            </Fig>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Facts head="How to read the chart" rows={[
                ['Students in the chart', `${SCHOOL_N} students, all of whom chose to share with a ${PRO_LC}.`],
                ['Highest day', `${peak.full} ran highest, with an average of ${peak.mean}.`],
                ['Not a ranking', 'No single student can be picked out of this chart.'],
                ['Where the numbers come from', 'The scoring model generated these numbers. Nobody was measured.'],
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
      <Section tone="paper" className="bg-accent-wash" tight>
        <SectionHead>Why small groups show nothing</SectionHead>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn>
            <Fig title={`Average ${SCORE} by class period`}>
              <SmallGroups/>
            </Fig>
          </ScrollIn>
          <ScrollIn>
            <Facts head="How the rule works"
              photo="student-card"
              photoAlt="Five teenagers walking together through a park, talking as they go"
              rows={[
              ['The rule', `A group needs at least ${K_ANONYMITY} students. Below that, no average is computed or shown.`],
              ['Hidden here', `${suppressed} of ${COHORT_PERIOD.length} periods are under the limit.`],
              ['Why the row still shows', 'A row that vanished would reveal as much as the number.'],
              ['Cannot be turned off', 'No setting anywhere in MindMap turns this rule off.'],
            ]}/>
          </ScrollIn>
        </div>
      </Section>

      {/* -- the caseload --------------------------------------------------- */}
      <Section tone="card" tight>
        <SectionHead>{CASELOAD_TITLE}</SectionHead>
        <SectionLede>{CASELOAD_DEF}</SectionLede>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn>
            <Fig title="Last week against this week">
              <Caseload/>
            </Fig>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Facts head="Who is on the list" rows={[
                ['On the list', `${BOARD.length} students, all of whom agreed to share trends.`],
                ['Off the list', 'Students who share only a score, or only alerts, are not listed.'],
                ['Why change, not score', 'A student who has been steady at 86 for a month is not a change.'],
                ['Never a ranking', 'The list has no positions, and no student is compared with another.'],
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
      <Section tone="paper" className="bg-beam-wash" tight>
        <SectionHead>Who can open a record</SectionHead>
        <div className="mt-3 grid gap-3 lg:grid-cols-2 lg:gap-4">
          <ScrollIn className="h-full">
            <Chips as="h3" head="What you never see"
              rows={['A raw reading', NOTES, LOCATION, `A group under ${K_ANONYMITY} students`]}/>
          </ScrollIn>
          <ScrollIn className="h-full">
            <Facts className="h-full" head="How the audit log works" rows={[
              ['Every record opened', 'Every record you open is logged, with who opened it and when.'],
              ['No setting turns it off', 'Nobody can switch the log off, including us.'],
              ['Consent is per student', 'You see only what each student agreed to share.'],
              ['Crisis alerts', 'A crisis alert always reaches you. No guardian can switch that off.'],
            ]}/>
          </ScrollIn>
        </div>
      </Section>

      <Closer go={go} view="app-pro" ground="bg-card" label={`Open the ${PRO} screen`}
        title={`Try the ${PRO} console`}
        line="The demo uses sample students."
        rows={[
          ['Opens on the list', CASELOAD_TITLE + '.'],
          ['The consent tab', 'The consent tab shows what each guardian signed and when it expires.'],
          ['The audit tab', 'The audit tab lists every record opened, in order. It is never cleared.'],
        ]}/>
    </main>
  )
}
