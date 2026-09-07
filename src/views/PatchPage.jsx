import React from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/misc'
import { LAYERS } from './Patch'
import { PatchCAD } from '../charts/cad'
import { RevealLines, Reveal, RevealRow } from '../s21/motion'
import { DotPattern } from '../s21/texture'
import { cn } from '../lib/utils'

const CAD_SRC = (globalThis.__CAD || '/MindMap-Patch-colored.glb')

/* What the patch measures, named the way a parent would say it. */
const SENSORS = [
  ['Heart',       'Counts your heartbeat and the small gaps between beats.'],
  ['Sweat',       'Measures sweat far too small to feel, which rises when you are tense.'],
  ['Temperature', 'Reads skin temperature, which drifts as your body settles or braces.'],
  ['Movement',    'Tells sitting still apart from running, so exercise is not read as stress.'],
]

export function PatchPage() {
  const [exploded, setExploded] = React.useState(false)
  const [picked, setPicked] = React.useState(null)

  /* The drawing separates along its own axis and tips as the section scrolls.
     Without this the three sheets sit flat on top of one another. */
  React.useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const layers = Array.from(document.querySelectorAll('.lyr'))
    const Z = { '0': 128, '1': 20, '2': -88 }
    if (reduce || !window.gsap) {
      layers.forEach(l => { l.style.transform = `translateZ(${Z[l.dataset.i]}px)` })
      return
    }
    layers.forEach(l => gsap.set(l, { z: Z[l.dataset.i] }))
    if (!window.ScrollTrigger) return
    const t = gsap.fromTo('#stack', { rotateX: 66, rotateZ: -40 },
      { rotateX: 50, rotateZ: -22, ease: 'none',
        scrollTrigger: { trigger: '#stack', start: 'top bottom', end: 'bottom top', scrub: .6 } })
    return () => { t.scrollTrigger?.kill(); t.kill() }
  }, [])
  return (
    <main>
      <section className="relative overflow-hidden border-b border-rule bg-sage">
        <DotPattern className="absolute inset-0 opacity-70"/>
        <div className="wrap relative py-12 sm:py-16">
          <Label>The patch</Label>
          <RevealLines as="h1"
            className="mt-3 max-w-[14ch] font-display font-bold text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.05] tracking-tight text-ink"
            lines={['A sticker on', 'the forearm.']}/>
          <Reveal className="mt-5">
            <p className="max-w-[52ch] text-[clamp(1.3125rem,1.6vw,1.5rem)] leading-[1.5] text-ink-2">
              It reads four things from the skin, once a second, and sends them to the phone.
              It is about the size of a plaster and is changed once a week.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="relative h-[min(46vh,420px)] overflow-x-clip [perspective:1500px]">
              <div id="stack" className="absolute inset-0 [transform-style:preserve-3d]"
                style={{ transform: 'rotateX(58deg) rotateZ(-32deg)' }}>
                {[...LAYERS].reverse().map(l => (
                  <figure key={l.i} data-i={l.i}
                    className="lyr absolute left-1/2 top-1/2 m-0 aspect-square w-[min(84%,400px)]
                      -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]
                      [&_svg]:h-auto [&_svg]:w-full [&_svg]:overflow-visible
                      [&_svg]:drop-shadow-[0_26px_34px_rgba(13,43,39,0.16)]">
                    {l.art}
                  </figure>
                ))}
              </div>
              <span className="lab absolute inset-x-0 bottom-0 text-center">Drawing</span>
            </div>

            <div className="relative h-[min(46vh,420px)] rounded-xs border border-rule bg-paper">
              <PatchCAD src={CAD_SRC} exploded={exploded} selected={picked} onSelect={setPicked}/>
              <span className="lab pointer-events-none absolute inset-x-0 bottom-3 text-center">
                The real model · drag to turn</span>
              <div className="absolute right-3 top-3">
                <Button variant={exploded ? 'solid' : 'outline'} size="sm"
                  aria-pressed={exploded} onClick={() => setExploded(v => !v)}>
                  {exploded ? 'Put back together' : 'Take apart'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap py-12 sm:py-16">
        <h2 className="lab font-normal">What the patch measures</h2>
        <dl className="mt-3 grid border-t border-rule sm:grid-cols-2 lg:grid-cols-4">
          {SENSORS.map(([k, v], i) => (
            <RevealRow key={k} index={i}
              className={cn('border-b border-rule py-6 lg:border-b-0 lg:border-l lg:px-7',
                i === 0 && 'lg:border-l-0 lg:pl-0')}>
              <dt className="font-display text-row font-bold text-ink">{k}</dt>
              <dd className="mt-2 max-w-[34ch] text-sec text-ink-2">{v}</dd>
            </RevealRow>
          ))}
        </dl>
      </section>

      <section className="wrap pb-14 sm:pb-20">
        <h2 className="lab font-normal">Three layers</h2>
        <ol className="mt-3 grid list-none gap-x-10 p-0 lg:grid-cols-3">
          {LAYERS.map(l => {
            const on = picked === l.part
            return (
              <li key={l.i}>
                <button onClick={() => setPicked(on ? null : l.part)} aria-pressed={on}
                  className={cn('grid w-full grid-cols-[36px_1fr] items-start gap-4 border-t-2 py-5',
                    'text-left transition-colors duration-200',
                    on ? 'border-accent' : 'border-rule hover:border-ink-3')}>
                  <span className="pt-1.5 font-mono text-label text-ink-3">0{l.i + 1}</span>
                  <div>
                    <h3 className="font-display text-row font-bold text-ink">{l.title}</h3>
                    <p className="mt-1.5 text-sec text-ink-2">{l.body}</p>
                    <span className="mt-2 block font-mono text-label uppercase tracking-[0.12em] text-accent">
                      {on ? 'Showing only this' : 'Show only this'}</span>
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      </section>
    </main>
  )
}
