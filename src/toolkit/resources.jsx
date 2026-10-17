import React from 'react'
import { vars } from './theme'
import { cn } from '../lib/utils'

/* Free videos and podcasts, moved from the landing page into the app's
 * Toolkit. Each opens the outside site in a new tab; nothing about which one
 * was opened is kept or sent. */

export const RESOURCES = [
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

const FAMILY = ['coral', 'lilac']

const Out = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>
  </svg>
)

export function ResourceList() {
  return (
    <div className="grid gap-8">
      {RESOURCES.map((group, gi) => (
        <section key={group.title} style={vars(FAMILY[gi % FAMILY.length])}>
          <h3 className="font-display font-bold text-ink">{group.title}</h3>
          <ul className="m-0 mt-3 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map(it => (
              <li key={it.name}>
                <a href={it.href} target="_blank" rel="noopener noreferrer"
                  className={cn('kit-card group flex min-h-[80px] items-center gap-3 rounded-[18px] border border-rule',
                    'bg-card p-3.5 text-left sm:p-4')}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-meta font-bold tracking-tight text-ink">{it.name}</span>
                    <span className="mt-0.5 block text-fine text-ink-2">{it.what}</span>
                  </span>
                  <span aria-hidden className="kit-ground kit-ink grid size-9 shrink-0 place-items-center rounded-full sm:size-10">
                    <Out/>
                  </span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
