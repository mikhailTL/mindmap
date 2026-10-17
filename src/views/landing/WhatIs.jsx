import React from 'react'
import { Section, SectionHead, SectionLede } from '../../ui/section'
import { ScrollRow } from '../../ui/motion'
import { ArrowRight } from '../../ui/marks'
import { PRO_PLURAL } from '../../lib/terms'
import { cn } from '../../lib/utils'
import { cardClass } from '../../ui/card'
import { AppPicture, NetworkPicture, PatchPicture, ToolkitPicture, PICTURE_CSS } from './whatis/pictures'

/* What is MindMap? The owner's own three-point description, each point beside
 * a demo picture of it. Sits between the dark problem band and the white
 * "What makes MindMap different" band, so it takes the green wash.
 *
 * The text is the owner's, with spelling, the product name and the third
 * audience's capitalisation fixed. One change of substance: he wrote that
 * MindMap AI is "trained on clinical data". It is not trained on anything of
 * ours: ai/framework.js builds a general language model's system prompt from
 * published SAMHSA, NIMH, AAP and CDC guidance and prints the sources. So the
 * line says "grounded in published clinical guidance". */

export const WHAT_IS_LEAD =
  `MindMap is an adolescent wearable patch and app system designed for teens, parents, and ${PRO_PLURAL} to address the teen mental health crisis at its root, providing 3 main features:`

/* The Toolkit sits inside feature 3, the app, as a part with its own small
   picture, so the band still shows three features. */
export const TOOLKIT_PART = {
  title: 'Toolkit',
  text: `Calming activities like breathing, grounding and body scan, plus life skills for school, friends, wellness and careers. Practice earns points that unlock new levels.`,
}

export const WHAT_IS = [
  { id: 'patch', title: 'A wearable patch', go: 'patch', cta: 'About the patch', Picture: PatchPicture,
    text: 'A wearable patch that turns detailed, numerical data into readable and friendly updates using an original Neural Network, unlike most wellness apps which use no hardware.' },
  { id: 'network', title: 'A support network', go: 'privacy', cta: 'Who sees what', Picture: NetworkPicture,
    text: `A network support system between teens, parents, and ${PRO_PLURAL} to share data, manage different teens’ stress, and address issues at their root, as opposed to common, individualized monitoring apps. Teens have the freedom of privacy controls to decide who sees what.` },
  { id: 'app', title: 'One app for all of it', go: 'toolkit', cta: 'See the Toolkit', Picture: AppPicture, part: TOOLKIT_PART,
    text: 'A ‘one-stop’ application, providing tools like MindMap AI, grounded in published clinical guidance, and Heads Up, a parental tool to identify screen-related stress as it occurs. MindMap also offers many other utilities for academic success, social dynamics, wellness, and career skills.' },
]

/* A named part of a feature: a heading, one line and its own picture. It sits
   under the feature's picture, so the three cards stay level. */
function Part({ part }) {
  return (
    <section aria-label={part.title} className="rounded-[12px] bg-mint-wash p-3.5 sm:p-4">
      <h4 className="m-0 font-display text-ui font-bold leading-tight text-ink">{part.title}</h4>
      <p className="m-0 mt-1 text-fine leading-[1.5] text-ink-2">{part.text}</p>
      <div className="mt-2.5"><ToolkitPicture/></div>
    </section>
  )
}

/* Three neighbours, three surfaces (src/ui/card.jsx): the patch is the white
   card, the network takes the turquoise wash, the app an outline on the band. */
const LOOK = [['plain'], ['tint', 'beam'], ['outline']]

function Feature({ f, n, go }) {
  const [variant, hue] = LOOK[(n - 1) % LOOK.length]
  const titleId = React.useId()
  const { Picture } = f
  return (
    <article aria-labelledby={titleId}
      className={cn(cardClass(variant, hue), `flex h-full flex-col p-2.5
        md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:gap-5
        lg:row-span-2 lg:grid-cols-1 lg:grid-rows-subgrid lg:gap-0`)}>
      <div className="flex flex-col gap-2.5 md:order-2 lg:order-none lg:h-full">
        <div className="grid flex-1"><Picture/></div>
        {f.part && <Part part={f.part}/>}
      </div>
      <div className="flex flex-1 flex-col px-2.5 pb-1.5 pt-4 md:order-1 md:py-4 lg:order-none lg:pt-4">
        <h3 id={titleId} className="m-0 flex items-center gap-2.5 font-display text-row font-bold leading-tight text-ink">
          <span aria-hidden className={cn('grid size-6 shrink-0 place-items-center rounded-full',
            'font-display text-xs font-bold text-accent-ink', variant === 'plain' ? 'bg-accent-wash' : 'bg-card')}>{n}</span>
          {f.title}
        </h3>
        <p className="m-0 mt-2.5 text-ui leading-[1.55] text-ink-2">{f.text}</p>
        <div className="mt-auto pt-3">
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
    <Section name="About" id="what-is" tone="card" className="bg-accent-wash">
      <style>{PICTURE_CSS}</style>
      <SectionHead>What is MindMap?</SectionHead>
      <SectionLede className="max-w-[70ch]">{WHAT_IS_LEAD}</SectionLede>
      {/* Under md the three cards swipe sideways, the next one peeking in,
          so the band is one card tall on a phone rather than three. Cards
          keep their own height there (items-start): stretched to the tallest,
          the patch card carried a block of empty space. */}
      <ol className="m-0 mt-6 grid list-none gap-4 p-0 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:gap-x-5 lg:gap-y-0
        max-md:-mx-[22px] max-md:flex max-md:items-start max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto
        max-md:scroll-px-[22px] max-md:px-[22px] max-md:pb-2 max-md:[scrollbar-width:none]">
        {WHAT_IS.map((f, i) => (
          <ScrollRow as="li" key={f.id} index={i}
            className="min-w-0 lg:row-span-2 lg:grid lg:grid-rows-subgrid max-md:w-[86%] max-md:shrink-0 max-md:snap-start">
            <Feature f={f} n={i + 1} go={go}/>
          </ScrollRow>
        ))}
      </ol>
    </Section>
  )
}

export default WhatIs
