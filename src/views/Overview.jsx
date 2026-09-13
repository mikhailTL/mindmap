import React from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/misc'
import { LAYERS } from './Patch'
import { IMG, MOSAIC, POS } from '../lib/assets'
import { Reveal, RevealRow, RevealLines, Parallax, RuleDraw } from '../s21/motion'
import { CompareReveal } from '../s21/compare'
import { CoverflowCarousel } from '../s21/carousels'
import { CredibilityRail } from '../s21/rail'
import { HowItWorks, WhoSeesWhat } from '../charts/infographics'
import { ShaderBackground } from '../s21/texture'
import { PatchCAD } from '../charts/cad'
import { cn } from '../lib/utils'

const CAD_SRC = (globalThis.__CAD || '/MindMap-Patch-colored.glb')

export function Overview({ go }){
  const [exploded, setExploded] = React.useState(false)
  const [picked, setPicked] = React.useState(null)
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
          <RevealLines as="h1" className="font-display font-extrabold text-sect text-ink"
            lines={['One number.', <>One <em className="not-italic text-accent">sentence</em>.</>]}/>
          <Reveal as="p" className="mt-6 max-w-read text-lead leading-[1.55] text-ink-2">
            A small patch on the forearm reads the body once a second. The app turns that into a plain
            sentence — and the reasons behind it, if you want them.
          </Reveal>
          {/* Testers tapped the loudest button first and landed in a
              questionnaire about themselves. The front door now asks who you are. */}
          <Reveal className="mt-9">
            <p className="lab">Open the app as</p>
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
          </Reveal>
        </div>
        <figure className="m-0 overflow-hidden">
          <img src={IMG.hero} alt="A student outside her school in the late afternoon"
            width="1200" height="1500" fetchPriority="high" decoding="async"
            style={{ objectPosition: POS.hero }} className="aspect-[4/5] max-h-[min(70vh,560px)] w-full object-cover"/>
          <figcaption className="lab mt-3">Worn daily · changed weekly</figcaption>
        </figure>
      </section>

      <div className="my-12 overflow-hidden sm:my-[6vw]">
        <img src={IMG.steps} alt="Students sitting together on the steps outside school"
          width="1200" height="514" style={{ objectPosition: POS.steps }}
          className="par aspect-[21/9] w-full object-cover"/>
      </div>

      <section className="wrap pb-4 pt-2 sm:pb-8">
        <h2 className="lab font-normal">How it works</h2>
        <HowItWorks className="mt-4"/>
      </section>

      <div className="border-y border-rule">
        <div className="wrap grid sm:grid-cols-4">
          {[['Every second','Heart, sweat, temperature and movement, all day.'],
            ['Their own normal','Compared with their own last two weeks only.'],
            ['Under five, nothing','A class smaller than five students returns no number at all.'],
            ['Exercise filtered out','Above 0.35 g of movement the score is held back.']
          ].map(([n,t],i)=>(
            <div key={n} className={`border-b border-rule py-8 last:border-b-0 sm:border-b-0 sm:border-l
              sm:px-6 sm:py-9 ${i===0?'sm:border-l-0 sm:pl-0':''}`}>
              <div className="font-display font-bold text-sub leading-tight tracking-tight text-ink">{n}</div>
              <p className="mt-2.5 text-sec text-ink-2">{t}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="wrap py-14 sm:py-[7vw]">
        <RevealLines className="max-w-[18ch] font-display font-bold text-sect text-ink"
          lines={['Nothing shows', 'on the outside.']}/>
        <Reveal as="p" className="mt-5 text-lead leading-[1.55] text-ink-2">
          The patch reads the difference hours before anyone thinks to ask.
        </Reveal>
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
        <div className="mt-4 grid auto-rows-[180px] grid-cols-1 gap-2.5 sm:auto-rows-[200px] sm:grid-cols-3">
          {MOSAIC.slice(0, 3).map(m=>(
            <figure key={m.k} className="mosfig m-0 overflow-hidden">
              <img src={m.src} alt={m.alt} loading="lazy" decoding="async" width="1200" height="800"
                style={{ objectPosition: m.pos }}
                className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-105"/>
            </figure>
          ))}
        </div>
      </section>

      <section id="views" className="wrap py-14 sm:py-[7vw]">
        <Label>The app</Label>
        <h2 className="mt-3 font-display font-bold text-view leading-[1.05] tracking-tight text-ink">
          One reading, three views.
        </h2>
        <CoverflowCarousel className="mt-9" showCaption showNavigation label="The three views"
          cardWidth="clamp(260px, 34vw, 520px)"
          slides={[
            { src: IMG.appStudent, alt:'The student view', caption:'Student — one number for the day, and the reasons behind it.' },
            { src: IMG.appParent,  alt:'The parent view',  caption:'Parent — one sentence a week, once their child approves the link.' },
            { src: IMG.appPro,     alt:'The school counselor view', caption:'School counselor — students ordered by how fast they are changing.' },
          ]}/>
      </section>

      <section className="wrap pb-14 sm:pb-20">
        <h2 className="font-display font-bold text-view leading-[1.05] tracking-tight text-ink">
          Who sees what.</h2>
        <WhoSeesWhat className="mt-8 max-w-[62rem]"/>
      </section>

      {/* This was a moving marquee showing one or two items at a time. These
          are the strongest sentences on the site; a marquee cannot be read. */}
      <section className="border-t border-rule bg-sage">
        <div className="wrap py-10">
          <h2 className="lab font-normal">The rules</h2>
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
                <svg viewBox="0 0 20 20" aria-hidden className="mt-1 size-4 shrink-0 text-accent">
                  <path d="M4 10.5l4 4L16 6" fill="none" stroke="currentColor" strokeWidth="2.4"
                    strokeLinecap="round" strokeLinejoin="round"/></svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
