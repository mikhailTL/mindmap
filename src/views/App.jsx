import React from 'react'
import { Overview } from './Overview'
import { Hub } from './Hub'
import { Student, Parent } from './Monitor'
import { Pro } from './Pro'
import { CheckIn } from './CheckIn'
import { Index } from './Index'
import { Palette, PaletteHint } from '../ui/palette'
import { cn } from '../lib/utils'

const VIEWS = ['site','hub','student','parent','pro','check','index']
const TAB    = { site:'site', hub:'hub', student:'hub', parent:'hub', pro:'hub', check:'hub', index:'index' }
const TABS   = [['site','Overview','Overview'],['hub','Open the app','App'],['index','Everything it does','Index']]

function Header({ view, go }){
  const bar = React.useRef(null)
  React.useEffect(()=>{
    if(!window.gsap||!window.ScrollTrigger||!bar.current) return
    const t = gsap.to(bar.current,{scaleX:1,ease:'none',
      scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:.3}})
    return ()=>t.kill()
  },[])
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/90 backdrop-blur-[14px]">
      <div className="wrap flex flex-wrap items-center gap-3.5 py-3">
        <span className="font-display text-[1.4375rem] font-extrabold tracking-tight text-ink">MindMap</span>
        <PaletteHint/>
        <nav aria-label="Sections" className="ml-auto flex basis-full justify-between gap-0.5 rounded-xs
          border border-rule p-0.5 sm:basis-auto sm:justify-start">
          {TABS.map(([id,label,short])=>{
            const on = TAB[view]===id
            return (
              <button key={id} onClick={()=>go(id)} aria-current={on?'page':undefined}
                className={cn('min-h-[46px] flex-1 whitespace-nowrap rounded-[1px] px-3 font-display text-[1rem]',
                  'font-medium transition-colors duration-150 sm:flex-none sm:px-5',
                  on ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-sage')}>
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          })}
        </nav>
      </div>
      <div ref={bar} aria-hidden className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-accent"/>
    </header>
  )
}

const fromHash = () => {
  const h = location.hash.replace(/^#\/?/,'')
  return VIEWS.includes(h) ? h : 'site'
}
export function App(){
  const [view,setView] = React.useState(fromHash)
  const go = React.useCallback(v=>{
    if(location.hash !== '#/'+v) history.pushState(null,'','#/'+v)
    setView(v); window.scrollTo(0,0)
    requestAnimationFrame(()=>window.ScrollTrigger?.refresh())
  },[])
  React.useEffect(()=>{
    const onPop = ()=>{ setView(fromHash()); window.scrollTo(0,0) }
    addEventListener('hashchange',onPop); addEventListener('popstate',onPop)
    return ()=>{ removeEventListener('hashchange',onPop); removeEventListener('popstate',onPop) }
  },[])
  const V = { site:Overview, hub:Hub, student:Student, parent:Parent, pro:Pro, check:CheckIn, index:Index }[view]
  /* Editorial pages hold a reading measure; the app views use the monitor. */
  const wide = view!=='site' && view!=='index'
  React.useEffect(()=>{ document.documentElement.dataset.wide = String(wide) },[wide])
  return (
    <>
      <Header view={view} go={go}/>
      <Palette go={go}/>
      <V go={go} key={view}/>
      <footer className="border-t border-rule py-11">
        <div className="wrap">
          <p className="text-meta text-ink-3">MindMap measures physiology and reports patterns. It is not a
            medical device and does not diagnose or treat any condition. If you need urgent help, contact your
            local emergency number or a crisis line.</p>
          <p className="lab mt-3.5">MindMap · Solace Innovation</p>
        </div>
      </footer>
    </>
  )
}
