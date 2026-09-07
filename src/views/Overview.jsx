import React from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/misc'
import { LAYERS } from './Patch'
import { IMG, MOSAIC } from '../lib/assets'

function Reveal({ as:As='div', children, className, ...p }){
  const ref = React.useRef(null)
  React.useEffect(()=>{
    const el=ref.current; if(!el||!window.gsap) return
    gsap.fromTo(el,{opacity:0,y:22},{opacity:1,y:0,duration:.9,ease:'expo.out',
      scrollTrigger:{trigger:el,start:'top 92%',once:true}})
  },[])
  return <As ref={ref} className={className} {...p}>{children}</As>
}
/* Lines rise out of their own mask. If the engine never loads they are simply visible. */
function Lines({ lines, className, as:As='h2' }){
  const ref = React.useRef(null)
  React.useEffect(()=>{
    const el=ref.current; if(!el||!window.gsap) return
    const spans=el.querySelectorAll('.ln>span')
    gsap.set(spans,{yPercent:105})
    gsap.to(spans,{yPercent:0,duration:1.15,ease:'expo.out',stagger:.08,
      scrollTrigger:{trigger:el,start:'top 88%',once:true}})
  },[])
  return <As ref={ref} className={className}>
    {lines.map((l,i)=><span key={i} className="ln block overflow-hidden"><span className="block">{l}</span></span>)}
  </As>
}

export function Overview({ go }){
  const stage = React.useRef(null)
  React.useEffect(()=>{
    if(!window.gsap || !window.ScrollTrigger) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 900px)', ()=>{
      const tl = gsap.timeline({ scrollTrigger:{ trigger:'#build', start:'top top',
        end:'+=170%', scrub:.6, pin:'#bstick', pinSpacing:true }})
      tl.fromTo('#stack',{rotateX:70,rotateZ:-42,scale:.86},{rotateX:48,rotateZ:-22,scale:1,ease:'none'},0)
      gsap.utils.toArray('.lyr').forEach(l=>
        tl.fromTo(l,{z:0},{z:{'0':150,'1':24,'2':-104}[l.dataset.i],ease:'none'},0))
      const rows=gsap.utils.toArray('.lgd')
      ;[[0,.10],[1,.42],[2,.74]].forEach(([n,at])=>
        tl.call(()=>rows.forEach((r,j)=>r.dataset.on=String(j===n)),null,at))
      return ()=>rows.forEach(r=>r.dataset.on='true')
    })
    mm.add('(max-width: 899px)', ()=>{
      gsap.utils.toArray('.lyr').forEach(l=>gsap.set(l,{z:{'0':112,'1':18,'2':-78}[l.dataset.i]}))
      gsap.fromTo('#stack',{rotateX:70,rotateZ:-40},{rotateX:52,rotateZ:-24,ease:'none',
        scrollTrigger:{trigger:'#build',start:'top bottom',end:'bottom top',scrub:.6}})
    })
    mm.add('(min-width: 900px)', ()=>{
      const rail=document.getElementById('rail'), sec=document.getElementById('views')
      sec.dataset.pinned='true'
      const pad=parseFloat(getComputedStyle(sec).paddingLeft)||44
      const travel=()=>Math.max(0, rail.scrollWidth-(sec.clientWidth-pad*2))
      const t=gsap.to(rail,{x:()=>-travel(),ease:'none',scrollTrigger:{trigger:sec,start:'top top',
        end:()=>'+='+travel(),scrub:.5,pin:true,invalidateOnRefresh:true}})
      return ()=>{ sec.dataset.pinned='false'; gsap.set(rail,{x:0}); t.kill() }
    })
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
          <Lines as="h1" className="font-display font-extrabold text-page text-ink"
            lines={['Know why the','hard days',<>are <em className="not-italic text-accent">hard</em>.</>]}/>
          <Reveal as="p" className="mt-6 max-w-read text-[clamp(1.3125rem,1.6vw,1.5625rem)] leading-[1.55] text-ink-2">
            A patch on the forearm reads the body once a second. The app turns that into one
            sentence a parent can act on.
          </Reveal>
          <Reveal className="mt-9 flex flex-wrap gap-2.5">
            <Button onClick={()=>go('check')}>Take a reading now<span aria-hidden>→</span></Button>
            <Button variant="outline" onClick={()=>go('hub')}>See the app</Button>
          </Reveal>
        </div>
        <figure className="m-0 overflow-hidden">
          <img src={IMG.hero} alt="A student outside her school in the late afternoon"
            width="1200" height="1500" fetchPriority="high" decoding="async"
            className="aspect-[4/5] w-full object-cover"/>
          <figcaption className="lab mt-3">Worn daily · changed weekly</figcaption>
        </figure>
      </section>

      <div className="my-12 overflow-hidden sm:my-[6vw]">
        <img src={IMG.steps} alt="Students sitting together on the steps outside school"
          width="1200" height="514" className="par aspect-[21/9] w-full object-cover"/>
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
        <Lines className="max-w-[18ch] font-display font-bold text-sect text-ink"
          lines={['Most of it happens','where nobody','can see it.']}/>
        <Reveal as="p" className="mt-5 text-[clamp(1.3125rem,1.5vw,1.5rem)] leading-[1.55] text-ink-2">
          A quiet week and a hard week look the same from the outside. The readings separate them.
        </Reveal>
        <div className="mt-11 grid gap-7 lg:grid-cols-2 lg:gap-11">
          {[[IMG.quiet,'A teenager alone by a window on a grey afternoon',
             'Nothing was said and nothing looked wrong. The readings had been climbing since third period.'],
            [IMG.bright,'Two teenagers laughing outdoors in the sun',
             'A breathing prompt before the class that always ran hot, and a conversation that started from a fact.']
          ].map(([src,alt,cap])=>(
            <figure key={alt} className="m-0 overflow-hidden">
              <img src={src} alt={alt} width="1200" height="900" className="par aspect-[4/3] w-full object-cover"/>
              <figcaption className="mt-3.5 text-sec text-ink-2">{cap}</figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-11 grid auto-rows-[150px] grid-flow-dense grid-cols-2 gap-2
          sm:auto-rows-[180px] sm:grid-cols-3 sm:gap-2.5 xl:auto-rows-[200px] xl:grid-cols-4">
          {MOSAIC.map(m=>(
            <figure key={m.k} className={`mosfig m-0 overflow-hidden ${m.c||''}`}>
              <img src={m.src} alt={m.alt} loading="lazy" decoding="async" width="1200" height="800"
                className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-105"/>
            </figure>
          ))}
        </div>
      </section>

      <section id="build" className="border-y border-rule bg-sage">
        <div id="bstick" className="flex min-h-screen flex-col justify-center py-10 sm:py-16">
          <div className="wrap pb-2">
            <Label>The patch</Label>
            <Lines className="mt-3 max-w-[16ch] font-display font-bold text-[clamp(2rem,3.6vw,3.125rem)] leading-[1.05] tracking-tight text-ink"
              lines={['Three layers,','the size of a plaster.']}/>
          </div>
          <div className="wrap grid gap-8 py-7 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:gap-14">
            <div className="relative h-[min(52vh,470px)] overflow-x-clip [perspective:1500px]">
              <div id="stack" className="absolute inset-0 [transform-style:preserve-3d]"
                style={{transform:'rotateX(58deg) rotateZ(-32deg)'}}>
                {[...LAYERS].reverse().map(l=>(
                  <figure key={l.i} data-i={l.i}
                    className="lyr absolute left-1/2 top-1/2 m-0 aspect-square w-[min(78%,420px)]
                      -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]
                      [&_svg]:h-auto [&_svg]:w-full [&_svg]:overflow-visible
                      [&_svg]:drop-shadow-[0_26px_34px_rgba(13,43,39,0.16)]">
                    {l.art}
                  </figure>
                ))}
              </div>
            </div>
            <ol className="m-0 list-none p-0">
              {LAYERS.map(l=>(
                <li key={l.i} data-on="true"
                  className="lgd group relative grid grid-cols-[36px_1fr] items-start gap-4 border-t border-rule
                    py-4.5 last:border-b transition-opacity duration-[450ms]
                    lg:data-[on=false]:opacity-55">
                  <span aria-hidden className="absolute -left-4 top-4 bottom-4 hidden w-0.5 origin-top scale-y-0
                    bg-accent transition-transform duration-[450ms] data-[on=true]:scale-y-100 lg:block"
                    data-on="true"/>
                  <span className="pt-1.5 font-mono text-label text-ink-3">0{l.i+1}</span>
                  <div>
                    <h3 className="font-display text-row font-bold text-ink">{l.title}</h3>
                    <p className="mt-1.5 text-sec text-ink-2">{l.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="views" className="wrap py-14 data-[pinned=true]:flex data-[pinned=true]:min-h-screen
        data-[pinned=true]:flex-col data-[pinned=true]:justify-center data-[pinned=true]:overflow-hidden sm:py-[7vw]">
        <Label>The application</Label>
        <h2 className="mt-3 font-display font-bold text-[clamp(2rem,3.6vw,3.125rem)] leading-[1.05] tracking-tight text-ink">
          Three views of the same reading.
        </h2>
        <div id="rail" className="mt-9 grid gap-5 lg:grid-flow-col lg:auto-cols-[min(46vw,540px)] lg:gap-8">
          {[[IMG.appStudent,'The student view','Student','Where the day stands, and what pushed it there.'],
            [IMG.appParent,'The parent view','Parent','One sentence a day, once their child approves the link.'],
            [IMG.appPro,'The professional view','Professional','Year groups ordered by rate of change. Small groups stay hidden.']
          ].map(([src,alt,h,p])=>(
            <figure key={h} className="m-0 bg-paper shadow-lift">
              <img src={src} alt={alt} width="1280" height="844" className="aspect-[16/10] w-full object-cover object-top"/>
              <figcaption className="px-6 py-5">
                <h3 className="font-display text-row font-bold text-ink">{h}</h3>
                <p className="mt-1 text-sec text-ink-2">{p}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  )
}
