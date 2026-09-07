import React from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/misc'
import { LAYERS } from './Patch'
import { IMG, MOSAIC, POS } from '../lib/assets'
import { Reveal, RevealRow, RevealLines, Parallax, RuleDraw } from '../s21/motion'
import { CompareReveal } from '../s21/compare'
import { CoverflowCarousel } from '../s21/carousels'
import { CredibilityRail } from '../s21/rail'
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
      <section className="wrap grid gap-8 py-12 sm:py-[7vw] lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:gap-14">
        <div>
          <RevealLines as="h1" className="font-display font-extrabold text-page text-ink"
            lines={['See how', 'your child', <>is <em className="not-italic text-accent">really</em> doing.</>]}/>
          <Reveal as="p" className="mt-6 max-w-read text-[clamp(1.3125rem,1.6vw,1.5625rem)] leading-[1.55] text-ink-2">
            A small patch on the forearm reads the body once a second. The app turns that into one
            plain sentence, and the numbers behind it if you want them.
          </Reveal>
          <Reveal className="mt-9 flex flex-wrap gap-2.5">
            <Button onClick={()=>go('check')}>Take a reading now<span aria-hidden>→</span></Button>
            <Button variant="outline" onClick={()=>go('patch')}>See the patch</Button>
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

      <div className="border-y border-rule">
        <div className="wrap grid sm:grid-cols-4">
          {[['1 Hz','Pulse, sweat, skin temperature and movement, read every second.'],
            ['50 Hz','Movement is sampled fifty times a second. The bench measured 50.09 Hz.'],
            ['n < 5','A group smaller than five students returns nothing to a counselor.'],
            ['154 → 55','At 154 bpm on a running track the index reads 55. Exercise is not distress.']
          ].map(([n,t],i)=>(
            <div key={n} className={`border-b border-rule py-8 last:border-b-0 sm:border-b-0 sm:border-l
              sm:px-6 sm:py-9 ${i===0?'sm:border-l-0 sm:pl-0':''}`}>
              <div className="font-mono font-medium tabular-nums text-[clamp(1.9rem,3vw,2.5rem)] tracking-tight text-ink">{n}</div>
              <p className="mt-2.5 text-sec text-ink-2">{t}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="wrap py-14 sm:py-[7vw]">
        <RevealLines className="max-w-[18ch] font-display font-bold text-sect text-ink"
          lines={['Most of it happens', 'where nobody', 'can see it.']}/>
        <Reveal as="p" className="mt-5 text-[clamp(1.3125rem,1.5vw,1.5rem)] leading-[1.55] text-ink-2">
          From the outside there is nothing to see. The patch reads the difference, hours before
          anyone thinks to ask.
        </Reveal>
        <figure className="m-0 mt-11">
          <CompareReveal className="aspect-[16/9] w-full" 
            labels={['A hard day', 'A good day']}
            before={<img src={IMG.quiet} alt="A teenager alone by a window on a grey afternoon"
              width="1200" height="675" style={{ objectPosition: POS.quiet }}
              className="size-full object-cover"/>}
            after={<img src={IMG.bright} alt="Two teenagers laughing outdoors in the sun"
              width="1200" height="675" style={{ objectPosition: POS.bright }}
              className="size-full object-cover"/>}/>
          <figcaption className="mt-4 max-w-[62ch] text-sec text-ink-2">
            Nothing was said on either day. The readings had been rising since third period on one of them.
          </figcaption>
        </figure>
        <div className="mt-11 grid auto-rows-[220px] grid-cols-1 gap-2.5 sm:auto-rows-[260px] sm:grid-cols-3">
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
        <h2 className="mt-3 font-display font-bold text-[clamp(2rem,3.6vw,3.125rem)] leading-[1.05] tracking-tight text-ink">
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

      <CredibilityRail className="border-y border-rule py-8" label="Built to"
        items={[
          { name:'FERPA' }, { name:'COPPA' },
          { name:'Groups under five suppressed' },
          { name:'Raw readings never shown to parents' },
          { name:'Retention set by the student' },
          { name:'Every access logged' },
          { name:'Not a medical device' },
        ]}/>
    </main>
  )
}
