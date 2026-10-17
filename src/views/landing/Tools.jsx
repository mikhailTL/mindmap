import React from 'react'
import { STUDENT_GROUPS, PARENT_GROUPS } from '../../toolkit/index'
import { Button } from '../../ui/button'
import { Section, SectionHead, SectionLede } from '../../ui/section'
import { ArrowRight, Chevron } from '../../ui/marks'
import { ScrollRow } from '../../ui/motion'
import { cn } from '../../lib/utils'

/* The landing's Toolkit band. Every tool is read from src/toolkit/index.jsx,
 * so a tool added or renamed in the app shows up here with no second edit.
 *
 * Teens: the three app groups side by side at lg, one column at 390.
 * Parents: the two parent groups. Each parent row opens its own activity at
 * `toolkit-<id>`, inside the parent app. */

/* The free resources. Moved here from Overview.jsx unchanged. */
const RESOURCES = [
  { title: 'Free on YouTube', items: [
    { name: 'Yoga With Adriene', what: 'Yoga and stretching, all levels', href: 'https://www.youtube.com/@yogawithadriene' },
    { name: 'MadFit', what: 'Short home workouts, no equipment', href: 'https://www.youtube.com/@MadFit' },
    { name: 'Headspace', what: 'Guided meditation and breathing', href: 'https://www.youtube.com/@headspace' },
    { name: 'The Honest Guys', what: 'Guided meditations for sleep and calm', href: 'https://www.youtube.com/@TheHonestGuys' },
  ] },
  { title: 'Free podcasts', items: [
    { name: 'Meditation Minis', what: 'Ten minute guided meditations', href: 'https://podcasts.apple.com/us/podcast/meditation-minis-podcast/id963597166' },
    { name: 'Happier Meditation', what: 'Dan Harris on meditation for sceptics', href: 'https://www.meditatehappier.com/explore-happier-meditation' },
    { name: 'NAMI for teens', what: 'Where to find help, by a national nonprofit', href: 'https://www.nami.org/kids-teens-and-young-adults/' },
  ] },
]

/* One hue per group for the icon tile. Full class strings, so Tailwind finds them. */
const HUE = {
  Body:            'bg-sky-wash text-sky-ink',
  Mind:            'bg-lilac-wash text-lilac-ink',
  'Phone sensors': 'bg-beam-wash text-beam-ink',
  Talking:         'bg-mint-wash text-mint-ink',
  Reading:         'bg-sky-wash text-sky-ink',
}

const TABS = [
  { id: 'teen',   label: 'For teens',   groups: STUDENT_GROUPS },
  { id: 'parent', label: 'For parents', groups: PARENT_GROUPS },
]

function ToolRow({ item, hue, index, onOpen }) {
  const Icon = item.icon
  return (
    <ScrollRow as="li" index={index}>
      <button type="button" onClick={onOpen}
        className={cn('group flex w-full items-center gap-3 rounded-field px-2 py-2 text-left',
          'transition-colors duration-150 hoverOnly:bg-mist active:bg-mist')}>
        <span aria-hidden className={cn('grid size-10 shrink-0 place-items-center rounded-field', hue)}>
          <Icon/>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-ui font-bold tracking-tight text-ink">{item.title}</span>
          <span className="block text-fine text-ink-2">{item.line}</span>
        </span>
        <Chevron aria-hidden className={cn('size-4 shrink-0 text-ink-3 transition-[color,transform] duration-150',
          'groupHoverOnly:text-ink motion-safe:groupHoverOnly:translate-x-0.5')}/>
      </button>
    </ScrollRow>
  )
}

export function ToolsBand({ go }) {
  const [tab, setTab] = React.useState('teen')
  const active = TABS.find(t => t.id === tab)
  const open = item => {
    if (tab === 'parent') return go('toolkit-' + item.id)
    go(item.route || 'kit-student')
  }

  return (
    <Section name="Toolkit" id="tools" tone="paper">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SectionHead>Exercises for teens, guides for parents</SectionHead>
          <SectionLede>Every tool in the app, plus free videos and podcasts.</SectionLede>
        </div>
        <div role="group" aria-label="Show tools for"
          className="inline-flex w-full shrink-0 rounded-field border border-rule bg-mist p-1 sm:w-auto">
          {TABS.map(t => (
            <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}
              className={cn('min-h-[40px] flex-1 rounded-sm px-4 font-display text-ui font-semibold',
                'transition-[background-color,color,box-shadow] duration-150 sm:flex-none',
                tab === t.id ? 'bg-card text-ink shadow-card' : 'text-ink-2 hoverOnly:text-ink')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('mt-6 grid gap-x-6 gap-y-5',
        active.groups.length > 2 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2')}>
        {active.groups.map((g, gi) => (
          <div key={g.label}>
            <h3 className="border-b border-rule pb-2 font-body text-fine font-semibold text-ink-2">{g.label}</h3>
            <ul className="m-0 mt-1.5 list-none p-0">
              {g.items.map((it, i) => (
                <ToolRow key={it.id} item={it} index={gi + i} hue={HUE[g.label] || HUE.Body} onOpen={() => open(it)}/>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-x-6 gap-y-5 md:grid-cols-2">
        {RESOURCES.map((group, gi) => (
          <div key={group.title}>
            <h3 className="border-b border-rule pb-2 font-body text-fine font-semibold text-ink-2">{group.title}</h3>
            <ul className="m-0 mt-1 list-none p-0">
              {group.items.map((it, i) => (
                <ScrollRow as="li" index={gi + i} key={it.href}>
                  <a href={it.href} target="_blank" rel="noreferrer"
                    className="group flex items-center gap-2 rounded-xs py-1.5 text-ink">
                    <span className="min-w-0 flex-1 leading-snug">
                      <span className="block font-display text-ui font-semibold sm:inline groupHoverOnly:text-accent-ink groupHoverOnly:underline">{it.name}</span>
                      <span className="block text-fine text-ink-3 sm:ml-1.5 sm:inline">{it.what}</span>
                    </span>
                    <ArrowRight aria-hidden className="size-3.5 shrink-0 text-accent"/>
                  </a>
                </ScrollRow>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button variant="outline" size="sm" onClick={() => go(tab === 'parent' ? 'kit-parent' : 'kit-student')}>Open the Toolkit<span aria-hidden>→</span></Button>
      </div>
    </Section>
  )
}
