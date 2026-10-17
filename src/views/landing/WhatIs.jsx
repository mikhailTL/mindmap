import React from 'react'
import { Section, SectionHead, SectionLede } from '../../ui/section'
import { ScrollRow } from '../../ui/motion'
import { ArrowRight } from '../../ui/marks'
import { PRO_PLURAL } from '../../lib/terms'
import { cn } from '../../lib/utils'
import { AppPicture, NetworkPicture, PatchPicture, PICTURE_CSS } from './whatis/pictures'

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
  `MindMap is an adolescent wellness app and wearable patch designed for teens, parents, and ${PRO_PLURAL}/schools, providing 3 main features:`

export const WHAT_IS = [
  { id: 'patch', title: 'A wearable patch', go: 'patch', cta: 'About the patch', Picture: PatchPicture,
    text: 'A wearable patch that turns detailed, numerical data into readable and friendly updates using an original Neural Network, unlike most wellness apps which use no hardware.' },
  { id: 'network', title: 'A support network', go: 'privacy', cta: 'Who sees what', Picture: NetworkPicture,
    text: `A network support system between teens, parents, and ${PRO_PLURAL}/schools to share data, manage different teens’ stress, and address issues at their root, as opposed to common, individualized monitoring apps. Teens have the freedom of privacy controls to decide who sees what.` },
  { id: 'app', title: 'One app for all of it', go: 'toolkit', cta: 'See the Toolkit', Picture: AppPicture,
    text: 'A ‘one-stop’ application, providing tools like MindMap AI, grounded in published clinical guidance, and Heads Up, a parental tool to identify screen-related stress as it occurs. MindMap also offers many other utilities for academic success, social dynamics, wellness, and career skills.' },
]

function Feature({ f, n, go }) {
  const titleId = React.useId()
  const { Picture } = f
  return (
    <article aria-labelledby={titleId}
      className="flex h-full flex-col rounded-panel border border-rule bg-card p-2.5 shadow-card
        md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:gap-5
        lg:row-span-2 lg:grid-cols-1 lg:grid-rows-subgrid lg:gap-0">
      <div className="md:order-2 lg:order-none lg:h-full">
        <Picture/>
      </div>
      <div className="flex flex-1 flex-col px-2.5 pb-1.5 pt-4 md:order-1 md:py-4 lg:order-none lg:pt-4">
        <h3 id={titleId} className="m-0 flex items-center gap-2.5 font-display text-row font-bold leading-tight text-ink">
          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-wash
            font-display text-xs font-bold text-accent-ink">{n}</span>
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
          so the band is one card tall on a phone rather than three. */}
      <ol className="m-0 mt-6 grid list-none gap-4 p-0 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:gap-x-5 lg:gap-y-0
        max-md:-mx-[22px] max-md:flex max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto
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
