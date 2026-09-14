import React from 'react'
import { ScrollRow } from '../s21/motion'
import { ArrowRight } from '../ui/marks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/misc'
import { IMG, POS } from '../lib/assets'

const PEOPLE = [
  { to:'check',   img:IMG.phone, pos:POS.phone,  alt:'Hands holding a phone', h:'Take a reading',
    p:'Score yourself now, with a patch or with six questions.' },
  { to:'student', img:IMG.teen, pos:POS.teen,   alt:'A teenager on the walk home from school', h:'Student',
    p:'Your own reading, why it moved, and what tends to help.' },
  { to:'parent',  img:IMG.family, pos:POS.family, alt:'A parent and teenager at the kitchen table', h:'Parent',
    p:'How your child is doing this week, in one sentence.' },
  { to:'pro',     img:IMG.pro, pos:POS.pro,    alt:'A school counselor at their desk', h:'School counselor',
    p:'Students ordered by how fast they are changing, with the consent record.' },
]
const MORE = [
  ['The hours ahead','Which periods usually run hard, and a prompt before them.'],
  ['Your history','Ninety days. The worst stretches, and what ended them.'],
  ['Readings by class','Every class you take, laid against the timetable.'],
  ['What helps','The measured effect of each thing you have tried.'],
  ['Who can see what','Sharing, and the exact page a parent sees.'],
  ['Your patch','Pairing, placement, battery.'],
]

export function Hub({ go }){
  return (
    /* Was py-10 sm:py-[5vw]: on a 2560px display that resolved to 128px of
       padding for no reason anyone could name. Fixed steps now — 10 inside a
       section, 14 between sections, 20 between page regions. */
    <main className="wrap py-14">
      <Label>Open the app</Label>
      {/* Was "Who is this for?" — a question the page answers below rather than
          a label for what is below. */}
      <h1 className="mt-3.5 font-display font-medium text-view leading-[1.05] tracking-tight text-ink">
        Four views, one per person
      </h1>
      <p className="mt-5 max-w-read text-lead leading-[1.55] text-ink-2">
        Each one opens on a single sentence about the person it is for.
      </p>
      <div className="mt-10 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {PEOPLE.map((t,i)=>(
          <ScrollRow key={t.h} index={i} className="h-full">
          <Card as="button" interactive onClick={()=>go(t.to)}>
            <img src={t.img} alt={t.alt} loading="lazy" width="1200" height="720"
              style={{ objectPosition: t.pos }} className="aspect-[5/3] w-full object-cover"/>
            {/* heading and blurb were a raw h2 and p re-typing the Card's own
                type ramp inside CardContent; CardHeader/CardTitle carry it now,
                and CardTitle's `as` keeps the h2 so the page outline is unchanged */}
            <CardHeader>
              <CardTitle as="h2" className="leading-tight tracking-tight">{t.h}</CardTitle>
              <CardDescription className="max-w-[34ch]">{t.p}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <span className="inline-flex items-center gap-2 font-display text-ui font-medium text-accent">
                Open <ArrowRight aria-hidden className="size-4"/>
              </span>
            </CardContent>
          </Card>
          </ScrollRow>
        ))}
      </div>
      {/* "Everything else" said nothing about the six cards under it, all of
          which are marked not built. The heading says that now, so the reader
          knows before reading six cards. mt was 12 / [5vw]; this is the break
          between the two regions of the page, so it is the largest step. */}
      <h2 className="mt-20 font-display text-sub font-medium tracking-tight text-ink">
        Planned screens, not built yet
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MORE.map(([h,p,to],i)=>(
          <ScrollRow key={h} index={i} className="h-full">
          <Card as={to ? 'button' : 'div'} interactive={!!to}
            onClick={to ? () => go(to) : undefined}>
            <CardHeader>
              <CardTitle as="h3" className="text-row tracking-tight">{h}</CardTitle>
              <CardDescription className="text-meta">{p}</CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              {/* built and not-built separate by indent and rule, not by a
                  badge chip in the corner */}
              <span className={to
                ? 'inline-flex items-center gap-1.5 font-mono text-tick text-accent'
                : 'inline-block border-t border-rule pt-2 font-mono text-tick italic text-ink-3'}>
                {to ? <>Open <ArrowRight aria-hidden className="size-3.5"/></> : '— not built'}</span>
            </CardContent>
          </Card>
          </ScrollRow>
        ))}
      </div>
    </main>
  )
}
