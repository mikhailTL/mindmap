import React from 'react'
import { Section, SectionHead, SectionLede } from '../../ui/section'
import { ScrollRow } from '../../ui/motion'
import { ArrowRight } from '../../ui/marks'
import { PRO_PLURAL } from '../../lib/terms'
import { cn } from '../../lib/utils'
import { cardClass } from '../../ui/card'
import { useSceneWatch } from '../../ui/scenes/kit'
import { AppPicture, NetworkPicture, PatchPicture, PICTURE_CSS } from './whatis/pictures'

/* What is MindMap? The owner's own three-point description, each point under
 * one isometric drawing (whatis/pictures.jsx). Owner, 18 October: the demo
 * pictures were too complex, so each card is now number, title, text, link.
 * Sits between the dark problem band and the white "What makes MindMap
 * different" band, so it takes the green wash.
 *
 * The text is the owner's, with spelling, the product name and the third
 * audience's capitalisation fixed. One change of substance: he wrote that
 * MindMap AI is "trained on clinical data". It is not trained on anything of
 * ours: ai/framework.js builds a general language model's system prompt from
 * published SAMHSA, NIMH, AAP and CDC guidance and prints the sources. So the
 * line says "grounded in published clinical guidance". */

export const WHAT_IS_LEAD =
  `MindMap is an adolescent wearable patch and app system designed for teens, parents, and ${PRO_PLURAL} to address the teen mental health crisis at its root by measuring stress and quantifying wellness using innovative features. MindMap provides 3 main features:`

export const WHAT_IS = [
  { id: 'patch', title: 'A wearable patch', go: 'patch', cta: 'About the patch', Picture: PatchPicture,
    text: 'A wearable patch that turns detailed, numerical data into readable and friendly updates using an original Neural Network, unlike most wellness apps, which use no hardware.',
    /* Owner, 18 October: readings do not need the patch. */
    more: 'Users can also take readings without the patch, through in-app features like the machine learning Mental Mirror, a camera pulse check, and the Survey.' },
  { id: 'network', title: 'A support network', go: 'privacy', cta: 'Who sees what', Picture: NetworkPicture,
    text: `A network support system between teens, parents, and ${PRO_PLURAL} to share data, manage different teens’ stress, and address issues at their root, as opposed to common, individualized monitoring apps. Teens have the freedom of privacy controls to decide who sees what.` },
  { id: 'app', title: 'One app for all of it', go: 'toolkit', cta: 'See the Toolkit', Picture: AppPicture,
    text: 'A ‘one-stop’ application, providing tools like MindMap AI, grounded in published clinical guidance, and Heads Up, a parental tool to identify screen-related stress as it occurs. MindMap also offers many other utilities for academic success, social dynamics, wellness, and career skills.' },
]

/* Three neighbours, three surfaces (src/ui/card.jsx): the patch is the white
   card, the network takes the turquoise wash, the app white too (owner, 20
   October: the outline card was the band's own colour). */
const LOOK = [['plain'], ['tint', 'beam'], ['plain']]

/* A step under body size on a phone, so the patch card, the longest, stays
   about one screen tall. */
const TEXT = 'm-0 mt-2 text-[0.9375rem] leading-[1.5] text-ink-2 md:text-ui md:leading-[1.55]'

function Feature({ f, n, go }) {
  const [variant, hue] = LOOK[(n - 1) % LOOK.length]
  const titleId = React.useId()
  const { Picture } = f
  /* Pauses the drawing's loops while it is off screen. */
  const pic = React.useRef(null)
  useSceneWatch(pic)
  return (
    <article aria-labelledby={titleId}
      className={cn(cardClass(variant, hue), `flex h-full flex-col p-2
        md:grid md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:items-start md:gap-4 lg:flex lg:items-stretch lg:gap-0`)}>
      <div ref={pic} className="overflow-hidden rounded-[10px]"><Picture/></div>
      <div className="flex flex-1 flex-col px-2.5 pb-1 pt-3.5 md:self-stretch md:pt-2 lg:pt-3.5">
        <h3 id={titleId} className="m-0 flex items-center gap-2.5 font-display text-row font-bold leading-tight text-ink">
          <span aria-hidden className={cn('grid size-6 shrink-0 place-items-center rounded-full',
            'font-display text-xs font-bold text-accent-ink', variant === 'plain' ? 'bg-accent-wash' : 'bg-card')}>{n}</span>
          {f.title}
        </h3>
        <p className={TEXT}>{f.text}</p>
        {f.more && <p className={TEXT}>{f.more}</p>}
        <div className="mt-auto pt-2">
          <button type="button" onClick={() => go?.(f.go)}
            className={cn('group -ml-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-field px-1',
              'font-display text-ui font-bold text-accent-ink')}>
            {f.cta}
            <ArrowRight aria-hidden size={18} className="transition-transform duration-200 ease-out
              motion-safe:groupHoverOnly:translate-x-1"/>
          </button>
        </div>
      </div>
    </article>
  )
}

export function WhatIs({ go }) {
  return (
    <Section name="What is MindMap?" id="what-is" tone="card" className="bg-accent-wash">
      <style>{PICTURE_CSS}</style>
      <SectionHead>What is MindMap?</SectionHead>
      <SectionLede className="max-w-[70ch]">{WHAT_IS_LEAD}</SectionLede>
      {/* Under md the three cards swipe sideways, the next one peeking in,
          so the band is one card tall on a phone rather than three. */}
      <ol className="m-0 mt-6 grid list-none gap-4 p-0 lg:grid-cols-3 lg:gap-5
        max-md:-mx-[22px] max-md:flex max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto
        max-md:scroll-px-[22px] max-md:px-[22px] max-md:pb-2 max-md:[scrollbar-width:none]">
        {WHAT_IS.map((f, i) => (
          <ScrollRow as="li" key={f.id} index={i}
            className="min-w-0 max-md:w-[92%] max-md:shrink-0 max-md:snap-start">
            <Feature f={f} n={i + 1} go={go}/>
          </ScrollRow>
        ))}
      </ol>
    </Section>
  )
}

export default WhatIs
