import React from 'react'
import { Section, SectionHead, SectionLede } from '../../ui/section'
import { ScrollRow } from '../../ui/motion'
import { ArrowRight } from '../../ui/marks'
import { Frame } from '../../ui/frame'
import { PRO_PLURAL } from '../../lib/terms'
import { cn } from '../../lib/utils'
import { cardClass } from '../../ui/card'

export const WHAT_IS_LEAD =
  `MindMap is an adolescent wearable patch and app system designed for teens, parents, and ${PRO_PLURAL} to address the teen mental health crisis at its root by measuring stress and quantifying wellness using innovative features. MindMap provides 3 main features:`

export const WHAT_IS = [
  { id: 'patch', title: 'A wearable patch', go: 'patch', cta: 'About the patch',
    photo: 'photos-hall-duo', hue: 'sky',
    alt: 'Two teenage girls, models, talking in a school corridor, with the white MindMap patch shown on the upper arm of one of them',
    text: 'A wearable patch that measures stress by turning detailed, numerical body signals into a readable and friendly Mind Score using an original Neural Network, unlike most wellness apps, which use no hardware.',
    mark: 'Mind Score',
    more: 'Users can also measure the Mind Score using readings without the patch, through in-app features like the machine learning Mental Mirror, a camera pulse check, and the Survey.',
    extra: 'The Heads Up score is created based on screen stress.' },
  { id: 'network', title: 'A support network', go: 'privacy', cta: 'Who sees what',
    photo: 'ovw-pro-patch', hue: 'lilac',
    alt: 'A teenage model with the MindMap patch shown on his upper arm, talking with a counselor model who holds a clipboard',
    text: `A network support system between teens, parents, and ${PRO_PLURAL} to share data, manage different teens’ stress, and address issues at their root, as opposed to common, individualized monitoring apps. Teens have the freedom of privacy controls to decide who sees what.` },
  { id: 'app', title: 'One app for all of it', go: 'toolkit', cta: 'See the Toolkit',
    photo: 'ovw-app-bus', hue: 'sun',
    alt: 'Two teenage models laughing on a school bus, one holding a phone, beside a phone showing the MindMap teen Home screen',
    text: 'A ‘one-stop’ application, providing tools like MindMap AI, grounded in published clinical guidance, and Heads Up, a parental tool to identify screen-related stress as it occurs. MindMap also offers many other utilities for academic success, social dynamics, wellness, and career skills.' },
]

// Each number takes its hue's own ink, which clears 4.5:1 on that wash.
const NUM = { sky: 'text-sky-ink', lilac: 'text-lilac-ink', sun: 'text-sun-ink' }

// A step under body size on a phone, so the longest card stays about one screen tall.
const TEXT = 'm-0 mt-2 text-[0.9375rem] leading-[1.5] text-ink-2 md:text-ui md:leading-[1.55]'

// Sets the first occurrence of `mark` in bold accent ink.
function Marked({ text, mark }) {
  const i = mark ? text.indexOf(mark) : -1
  if (i < 0) return text
  return <>{text.slice(0, i)}<strong className="font-bold text-accent-ink">{mark}</strong>{text.slice(i + mark.length)}</>
}

function Feature({ f, n, go }) {
  const titleId = React.useId()
  return (
    <article aria-labelledby={titleId}
      className={cn(cardClass('tint', f.hue), `flex h-full flex-col p-2
        md:grid md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:items-start md:gap-4 lg:flex lg:items-stretch lg:gap-0`)}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[10px]">
        <Frame photo={f.photo} alt={f.alt} className="absolute inset-0"/>
      </div>
      <div className="flex flex-1 flex-col px-2.5 pb-1 pt-3.5 md:self-stretch md:pt-2 lg:pt-3.5">
        <h3 id={titleId} className="m-0 flex items-center gap-2.5 font-display text-row font-bold leading-tight text-ink">
          <span aria-hidden className={cn('grid size-6 shrink-0 place-items-center rounded-full bg-card',
            'font-display text-xs font-bold', NUM[f.hue])}>{n}</span>
          {f.title}
        </h3>
        <p className={TEXT}><Marked text={f.text} mark={f.mark}/></p>
        {f.more && <p className={TEXT}>{f.more}</p>}
        {f.extra && <p className={TEXT}>{f.extra}</p>}
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
    <Section id="what-is" tone="card">
      <SectionHead className="mt-0">What is MindMap?</SectionHead>
      <SectionLede className="max-w-[70ch]">{WHAT_IS_LEAD}</SectionLede>
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
