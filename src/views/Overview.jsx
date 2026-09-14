import React from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { RevealLines, ScrollIn, ScrollRow, Tally } from '../s21/motion'
import { ArrowRight, Check } from '../ui/marks'
import { ExplodedStack } from './Patch'
import { Onboarding } from '../s21/onboarding'
import { RainbowDial } from '../charts/rainbow'
import { studentRings } from '../lib/readings'
import { triage, tierOf, TIER_LABEL } from '../lib/caseload'
import { DATA } from '../lib/assets'
import { HowItWorks, WhoSeesWhat, WeekStrip } from '../charts/infographics'
import { cn } from '../lib/utils'

/* The homepage used to be a marketing page with the three app doors buried
   two screens down, under a stock photograph of students on some steps and a
   drag-to-compare pair of more stock photographs. A first visitor scrolled
   past two images of nobody in particular before reaching the only thing the
   page is for.
 *
 * It is a launcher now. Hero, then twenty seconds of animation that says what
 * MindMap is, then the three screens as the largest thing on the page. The
 * stock photography is gone entirely — every picture here is either the
 * product drawn or the product's own data.
 *
 * Vertical rhythm: 14 between sections, 20 between page regions, 10 inside a
 * section. The old file used py-[4.5vw] / py-[7vw] / my-[6vw], which on a
 * 1920 display opened 134px gaps that no content asked for and which differed
 * section to section. Viewport-relative vertical space is how a page ends up
 * with holes in it. */

const FACTS = [
  { n:1,  suffix:'Hz',  label:'One reading a second', line:'All day, from the forearm.' },
  { n:4,  suffix:'',    label:'Signals measured',     line:'Heart, sweat, temperature, movement.' },
  { n:5,  suffix:'',    label:'Smallest group a school can see', line:'Under five students returns nothing.' },
  { n:0,  suffix:'',    label:'Raw readings a parent sees', line:'One number and one sentence.' },
]

/* The three screens, in the order a person meets them: the one wearing it,
   the one it reports to, then the school. Each tile shows that screen's own
   real chart rather than a photograph of somebody looking at a phone. */
const SCREENS = [
  { id:'student', who:'Student',
    title:'Your own reading, today',
    line:'One number out of 100, the four signals behind it, and what leaves your phone.',
    cta:'Open the student screen' },
  { id:'parent',  who:'Parent',
    title:'How the week went',
    line:'One sentence a week, the days that ran high, and the things you are never shown.',
    cta:'Open the parent screen' },
  { id:'pro',     who:'School counselor',
    title:'Who to see on Monday',
    line:'Your caseload ranked by how fast a student is changing — only as far as a guardian agreed.',
    cta:'Open the counselor console' },
]

/* Each preview is the live component that screen actually uses, on that
   screen's own data. A screenshot would go stale the first time a chart
   changed, and a photograph of somebody holding a phone shows nothing at all. */
function Preview({ id }) {
  if (id === 'student') {
    /* 190 was too small: the dial draws its score, its unit and both end
       labels inside the same box, and at that size they collided. */
    return <RainbowDial score={51} usual={46} rings={studentRings()} size={268}/>
  }
  if (id === 'parent') {
    return (
      <div className="w-full max-w-[17rem]">
        <WeekStrip days={DATA.week} band={DATA.weekBand}/>
        <p className="mt-4 text-sec text-ink-2">Two days above her usual range.</p>
      </div>
    )
  }
  /* The counselor screen is a ranked list, so the preview is the ranking:
     four rows at their real scores, in the real order, in the tier colour. */
  /* `roster()` calls the reading `current`, not `score` — reading `s.score`
     gave every row undefined, which tierOf floors to 'info', so the preview
     rendered four identical "Steady" rows and four zero-width bars. */
  const rows = triage().slice(0, 4)
  return (
    <ul className="m-0 w-full max-w-[17rem] list-none space-y-3 p-0">
      {rows.map(s => {
        const tier = tierOf(s.current)
        return (
          <li key={s.id} className="grid grid-cols-[1fr_4.5rem] items-center gap-3">
            <span className="block h-2.5 w-full rounded-bar bg-rule/70">
              <span className={cn('block h-2.5 rounded-bar',
                tier === 'crisis' ? 'bg-crit' : tier === 'high' ? 'bg-warn' : 'bg-accent')}
                style={{ width: `${s.current}%` }}/>
            </span>
            <span className="font-mono text-fine tabular-nums text-ink-2">{TIER_LABEL[tier]}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function Overview({ go }) {
  React.useEffect(() => {
    if (!window.gsap || !window.ScrollTrigger) return
    /* The drawing separates and tips as the hero crosses the viewport. */
    gsap.utils.toArray('.lyr').forEach(l =>
      gsap.set(l, { z: { '0':128, '1':20, '2':-88 }[l.dataset.i] }))
    gsap.fromTo('#stack', { rotateX:50, rotateZ:-26 }, { rotateX:30, rotateZ:-14, ease:'none',
      scrollTrigger:{ trigger:'#hero', start:'top top', end:'bottom top', scrub:.6 } })
  }, [])

  return (
    <main>
      {/* "One number. One sentence." told a visitor nothing about what this is.
          The heading now names the product and the mechanism in one line. */}
      <section id="hero" className="wrap grid items-center gap-10 py-14
        lg:grid-cols-[1fr_1fr] lg:gap-16 lg:py-20">
        <div>
          <RevealLines as="h1" className="font-display font-medium text-sect text-ink"
            lines={['A patch reads your body.', <>The app says <em className="not-italic text-accent">what changed</em>.</>]}/>
          <ScrollIn as="p" className="mt-6 max-w-read text-lead leading-[1.5] text-ink-2">
            MindMap is a sticker-sized patch for the forearm and a phone app. It measures four
            signals once a second and reports one number and one plain sentence a day.
          </ScrollIn>
          <ScrollIn className="mt-10">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => go('student')}>Open the app<span aria-hidden>→</span></Button>
              <Button variant="outline" onClick={() => go('patch')}>See the hardware</Button>
            </div>
            <button onClick={() => go('check')}
              className="mt-4 min-h-[44px] font-display text-meta font-medium text-accent underline
                underline-offset-4 hover:text-accent-ink">
              Or score yourself in six questions — no patch needed
            </button>
          </ScrollIn>
        </div>
        {/* The stock photograph of a teenager looking thoughtfully off-camera
            is the image every wellbeing product opens on. This is the thing
            itself, drawn: the three layers of the patch pulled apart. */}
        <figure className="relative m-0">
          <ExplodedStack className="h-[min(52vh,440px)] w-full" caption={null}
            size="w-[min(96%,470px)]"/>
          <figcaption className="note mt-2 text-center">
            The patch, in three layers: shell, board, sensor face.
          </figcaption>
        </figure>
      </section>

      <Separator weight="ink"/>

      {/* Twenty seconds that carry the whole idea, for the visitor who will not
          read four paragraphs to find out what this is. */}
      <section className="wrap py-14">
        <h2 className="mark">What MindMap does</h2>
        <Onboarding className="mt-8"/>
      </section>

      <Separator/>

      {/* The reason this page exists, and now the largest thing on it.
          Landing a first-time visitor straight into a screen full of readings
          was the complaint: they arrived inside somebody's data with no idea
          whose it was or why. They pick a person first. */}
      <section id="screens" className="bg-mist/60">
        <div className="wrap py-20">
          <h2 className="font-display font-medium text-view leading-[1.1] text-ink">
            Three screens. Pick whose you want to see.</h2>
          <p className="mt-3 max-w-[56ch] text-lead text-ink-2">
            The same second of physiology, cut three ways. Nobody downstream sees more than the
            person wearing the patch agreed to.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {SCREENS.map((s, i) => (
              <ScrollRow key={s.id} index={i}>
                <Card interactive as="button" type="button" onClick={() => go(s.id)}
                  className="flex h-full flex-col">
                  {/* The preview is the screen's own chart, sized down. A tile
                      that shows nothing of its destination is a link with a
                      picture on it. */}
                  {/* place-content-center sizes the grid track to its content,
                      so a preview asking for w-full collapsed to the width of
                      its own labels and the bars measured zero. place-items
                      keeps the track full-width and centres the child in it. */}
                  <div className="grid min-h-[232px] place-items-center border-b border-rule
                    bg-card px-6 py-7" aria-hidden>
                    <Preview id={s.id}/>
                  </div>
                  <CardHeader className="pb-0 pt-5">
                    <span className="font-mono text-fine uppercase tracking-[0.08em] text-ink-3">
                      {String(i + 1).padStart(2, '0')} · {s.who}</span>
                    <CardTitle as="span" className="text-head">{s.title}</CardTitle>
                    <CardDescription>{s.line}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto flex items-center gap-2.5 pt-5
                    font-display text-meta font-medium text-accent">
                    {s.cta}
                    <ArrowRight className="size-[1.1rem] transition-transform duration-200
                      group-hover:translate-x-1.5"/>
                  </CardContent>
                </Card>
              </ScrollRow>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap py-14">
        <h2 className="mark">From skin to sentence</h2>
        <HowItWorks className="mt-8"/>
      </section>

      <Separator/>

      {/* Four figures the rest of the site spends paragraphs on. */}
      <section className="bg-mist">
        <div className="wrap grid gap-x-10 gap-y-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f, i) => (
            <ScrollRow key={f.label} index={i}>
              <p className="font-mono font-medium tabular-nums text-fig leading-none text-ink">
                <Tally to={f.n} suffix={f.suffix}/></p>
              <p className="mt-3 font-display text-row font-medium text-ink">{f.label}</p>
              <p className="mt-1.5 max-w-[26ch] text-sec text-ink-2">{f.line}</p>
            </ScrollRow>
          ))}
        </div>
      </section>

      <section className="wrap py-20">
        <h2 className="font-display font-medium text-view leading-[1.1] text-ink">
          Who can see what</h2>
        <WhoSeesWhat className="mt-8 max-w-[62rem]"/>
      </section>

      <Separator/>

      {/* This was a moving marquee showing one or two items at a time. These
          are the strongest sentences on the site; a marquee cannot be read. */}
      <section className="bg-mist">
        <div className="wrap py-14">
          <h2 className="mark">What MindMap will never do</h2>
          <ul className="mt-6 grid list-none gap-x-10 gap-y-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Show a parent a raw reading',
              'Report on a class of under five students',
              'Keep data longer than the student chooses',
              'Open a record without logging it',
              'Sell or share anything with anyone else',
              'Diagnose — this is not a medical device',
            ].map(t => (
              <li key={t} className="flex items-start gap-3 text-meta text-ink">
                <Check className="mt-1 size-4 shrink-0 text-accent"/>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
