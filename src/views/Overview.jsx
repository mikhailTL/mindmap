import React from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { IMG, POS } from '../lib/assets'
import { RevealLines, ScrollIn, ScrollRow, Tally } from '../s21/motion'
import { ArrowRight, Check } from '../ui/marks'
import { ExplodedStack } from './Patch'
import { RAINBOW } from '../lib/sensors'
import { CompareReveal } from '../s21/compare'
import { HowItWorks, WhoSeesWhat } from '../charts/infographics'
import { cn } from '../lib/utils'


const FACTS = [
  { n:1,  suffix:'Hz',  label:'Read once a second',   line:'All day, on the forearm.' },
  { n:4,  suffix:'',    label:'Signals',              line:'Heart, sweat, temperature, movement.' },
  { n:5,  suffix:'',    label:'Smallest group shown', line:'Anything smaller returns nothing.' },
  { n:0,  suffix:'',    label:'Raw readings a parent sees', line:'One number and one sentence.' },
]

const DOORS = [
  { id:'student', kicker:'For students', title:'Today, in one number.',
    line:'Your own reading, what moved it, and what never leaves your phone.',
    cta:'Open the student view' },
  { id:'parent',  kicker:'For parents',  title:'This week, in one sentence.',
    line:'How the week went, and the line the app will not cross.',
    cta:'Open the parent view' },
  { id:'pro',     kicker:'For schools',  title:'Who to see first.',
    line:'Ranked by how fast a student is changing, and only as far as a guardian agreed.',
    cta:'Open the counselor console' },
]

export function Overview({ go }){
  React.useEffect(()=>{
    if(!window.gsap || !window.ScrollTrigger) return
    const mm = gsap.matchMedia()
    // The drawing separates and tips as the section crosses the viewport.
    gsap.utils.toArray('.lyr').forEach(l =>
      gsap.set(l, { z: { '0':128, '1':20, '2':-88 }[l.dataset.i] }))
    gsap.fromTo('#stack', { rotateX:70, rotateZ:-42 }, { rotateX:50, rotateZ:-22, ease:'none',
      scrollTrigger:{ trigger:'#build', start:'top bottom', end:'bottom top', scrub:.6 }})
    gsap.utils.toArray('.par').forEach(img=>
      gsap.fromTo(img,{scale:1.1,yPercent:-3},{scale:1,yPercent:3,ease:'none',
        scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:true}}))
    gsap.utils.toArray('.mosfig').forEach((f,i)=>
      gsap.fromTo(f,{yPercent:14,rotate:i%2?2.4:-2.4,scale:.94,opacity:0},
        {yPercent:0,rotate:0,scale:1,opacity:1,duration:1,ease:'expo.out',delay:(i%4)*.06,
         scrollTrigger:{trigger:f,start:'top 94%',once:true}}))
    return ()=>mm.revert()
  },[])

  return (
    <main>
      {/* Three lines at text-page rendered as five in this column and pushed
          the three doors below the fold on a laptop — the one thing a first
          visitor is meant to do was off screen. */}
      <section className="wrap grid gap-8 py-10 sm:py-[4.5vw] lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-14">
        <div>
          <RevealLines as="h1" className="font-display font-medium text-sect text-ink"
            lines={['One number.', <>One <em className="not-italic text-accent">sentence</em>.</>]}/>
          <ScrollIn as="p" className="mt-6 max-w-read text-lead leading-[1.55] text-ink-2">
            A small patch on the forearm reads the body once a second. The app turns that into a
            sentence, and the reasons behind it if you want them.
          </ScrollIn>
          {/* Testers tapped the loudest button first and landed in a
              questionnaire about themselves. The front door now asks who you are. */}
          <ScrollIn className="mt-9">
            <p className="note">Open the app as</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <Button onClick={()=>go('student')}>A student<span aria-hidden>→</span></Button>
              <Button onClick={()=>go('parent')}>A parent<span aria-hidden>→</span></Button>
              <Button variant="outline" onClick={()=>go('pro')}>A school counselor</Button>
            </div>
            <button onClick={()=>go('check')}
              className="mt-4 min-h-[44px] font-display text-meta font-medium text-accent underline
                underline-offset-4 hover:text-accent-ink">
              Or try it on yourself — six questions, no patch needed
            </button>
          </ScrollIn>
        </div>
        {/* A stock photograph of a teenager looking thoughtfully off-camera is
            the image every wellbeing product opens on. This is the thing
            itself, drawn: the three layers of the patch pulled apart, which
            says what it is made of in one look and does not need WebGL, a
            363 KB download or a GPU to say it. */}
        <figure className="relative m-0">
          <ExplodedStack className="h-[min(56vh,460px)] w-full" caption={null} shift="-7%, 9%"/>
          <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <span className="note">Three layers: shell, board, sensor face.</span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {RAINBOW.map(s2 => (
                <span key={s2.id} className="inline-flex items-baseline gap-1.5 font-mono text-fine text-ink-3">
                  <span aria-hidden className="size-2 translate-y-[-0.1em] rounded-chip"
                    style={{ background: s2.glow }}/>{s2.name}
                </span>
              ))}
            </span>
          </figcaption>
        </figure>
      </section>

      <div className="my-12 overflow-hidden sm:my-[6vw]">
        <img src={IMG.steps} alt="Students sitting together on the steps outside school"
          width="1200" height="514" style={{ objectPosition: POS.steps }}
          className="par aspect-[21/9] w-full object-cover"/>
      </div>

      <section className="wrap pb-4 pt-2 sm:pb-8">
        <h2 className="mark">Skin, phone, sentence</h2>
        <HowItWorks className="mt-4"/>
      </section>

      <section className="wrap py-14 sm:py-[7vw]">
        <RevealLines className="max-w-[18ch] font-display font-medium text-sect text-ink"
          lines={['Nothing shows', 'on the outside.']}/>
        <ScrollIn as="p" className="mt-5 text-lead leading-[1.55] text-ink-2">
          The patch reads the difference hours before anyone thinks to ask.
        </ScrollIn>
        <figure className="m-0 mt-9">
          <CompareReveal className="aspect-[16/9] w-full" 
            labels={['A hard day', 'A good day']}
            before={<img src={IMG.quiet} alt="A teenager alone by a window on a grey afternoon"
              width="1200" height="675" style={{ objectPosition: POS.quiet }}
              className="size-full object-cover"/>}
            after={<img src={IMG.bright} alt="Two teenagers laughing outdoors in the sun"
              width="1200" height="675" style={{ objectPosition: POS.bright }}
              className="size-full object-cover"/>}/>
          <figcaption className="mt-4 max-w-[54ch] text-sec text-ink-2">
            Drag across. Nothing was said on either day.
          </figcaption>
        </figure>
      </section>

      {/* Four figures the rest of the site spends paragraphs on.
          The band's edges were a hand-rolled `border-y border-rule`; the sourced
          Separator draws the same hairline but names its rank, so a rule inside
          a band and a rule between bands can no longer drift apart by hand. */}
      <section className="bg-mist">
        <Separator/>
        <div className="wrap grid gap-x-10 gap-y-8 py-11 sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f, i) => (
            <ScrollRow key={f.label} index={i}>
              <p className="font-mono font-medium tabular-nums text-fig leading-none text-ink">
                <Tally to={f.n} suffix={f.suffix}/></p>
              <p className="mt-3 font-display text-row font-medium text-ink">{f.label}</p>
              <p className="mt-1.5 max-w-[26ch] text-sec text-ink-2">{f.line}</p>
            </ScrollRow>
          ))}
        </div>
        <Separator/>
      </section>

      {/* Three equal bordered cards in a row is the shape every landing page
          reaches for, and these three are not equal: a student opens this
          every day, a parent once a week, a counselor on a Monday morning.
          Full-bleed rows, sized by how often each one is used, numbered down
          the margin the way a chart numbers its bands. The third breaks the
          measure and runs past the grid on the right. */}
      <section id="views" className="border-y border-ink">
        <div className="wrap pb-16 pt-12 sm:pb-24 sm:pt-16">
          <div className="grid gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:items-end lg:gap-x-16">
            <RevealLines className="max-w-[16ch] font-display font-medium text-sect text-ink"
              lines={['One reading.', 'Three people.']}/>
            {/* set against the headline's baseline rather than under it, so the
                band reads as two columns of a chart rather than a stacked hero */}
            <p className="max-w-[44ch] border-l-2 border-ruling pl-6 text-lead text-ink-2 lg:pb-2">
              Nobody downstream sees more than the person wearing it agreed to.
            </p>
          </div>
        </div>
        <ol className="m-0 list-none p-0">
          {DOORS.map((d, i) => (
            <ScrollRow as="li" key={d.id} index={i}
              className={cn('border-t border-rule', i === 0 && 'border-t-2 border-t-ink')}>
              {/* Was a `.lift` button that re-declared by hand the leading accent
                  rule, the mist wash and the focus state the sourced Card already
                  ships under `interactive`. The card shell is flattened back to a
                  full-bleed row — the panel radius and the box border belong to a
                  card sitting on the sheet, not to a band running edge to edge —
                  so the row inherits the state machine and nothing else. */}
              <Card as="button" interactive onClick={() => go(d.id)}
                className={cn('group block rounded-none border-y-0 border-r-0 bg-transparent',
                  /* density varies by how often the screen is opened: daily
                     gets the room, Monday-morning gets a line */
                  i === 0 ? 'py-11 sm:py-14' : i === 1 ? 'py-9 sm:py-11' : 'py-7 sm:py-9')}>
                <div className="wrap grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-5
                  gap-y-3 lg:grid-cols-[4rem_minmax(0,32rem)_minmax(0,24rem)_auto] lg:gap-x-12">
                  <span className="font-mono text-stat font-light tabular-nums text-ink-3">
                    {String(i + 1).padStart(2, '0')}</span>
                  <CardHeader className="min-w-0 gap-1.5 p-0">
                    <span className="font-display text-tick font-medium text-ink-3">{d.kicker}</span>
                    {/* CardTitle renders a span here: the row is inside a button,
                        so a heading element would put a heading in the outline
                        that no page section actually starts. */}
                    <CardTitle as="span" className={cn('block', i === 0 ? 'text-major' : 'text-sub')}>
                      {d.title}</CardTitle>
                  </CardHeader>
                  <CardDescription className="col-span-full max-w-[42ch] lg:col-span-1">
                    {d.line}</CardDescription>
                  <CardContent className="col-span-full flex items-center gap-2.5 p-0 font-display
                    text-meta font-medium text-accent lg:col-span-1 lg:justify-self-end">
                    {d.cta}
                    <ArrowRight className="size-[1.1rem] transition-transform duration-200
                      group-hover:translate-x-1.5"/>
                  </CardContent>
                </div>
              </Card>
            </ScrollRow>
          ))}
        </ol>
      </section>

      <section className="wrap pb-14 sm:pb-20">
        <h2 className="font-display font-medium text-view leading-[1.05] tracking-tight text-ink">
          Who sees what.</h2>
        <WhoSeesWhat className="mt-8 max-w-[62rem]"/>
      </section>

      {/* This was a moving marquee showing one or two items at a time. These
          are the strongest sentences on the site; a marquee cannot be read. */}
      <section className="bg-mist">
        <Separator/>
        <div className="wrap py-10">
          <h2 className="mark">The rules</h2>
          <ul className="mt-5 grid list-none gap-x-10 gap-y-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'A parent never sees a raw reading',
              'A class under five students returns nothing',
              'The student sets how long data is kept',
              'Every time anyone opens a record, it is logged',
              'Nothing is sold or shared with anyone else',
              'Not a medical device',
            ].map(t => (
              <li key={t} className="flex items-start gap-3 text-meta text-ink">
                {/* was an inline 20-box path at stroke 2.4, the one mark on this
                    page drawn heavier than the rules around it */}
                <Check className="mt-1 size-4 text-accent"/>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
