import React from 'react'
import { ArrowRight } from 'lucide-react'
import { Card, CardBody } from '../ui/card'
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
  ['School','Readings by class, against the timetable.'],
  ['What helps','The measured effect of each thing you have tried.'],
  ['Who can see what','Sharing, and the exact page a parent sees.'],
  ['Your patch','Pairing, placement, battery.'],
]

export function Hub({ go }){
  return (
    <main className="wrap py-10 sm:py-[5vw]">
      <Label>Open the app</Label>
      <h1 className="mt-3.5 font-display font-bold text-[clamp(2.125rem,4vw,3.5rem)] leading-[1.05] tracking-tight text-ink">
        Who is this for?
      </h1>
      <p className="mt-5 max-w-read text-[clamp(1.3125rem,1.5vw,1.5rem)] leading-[1.55] text-ink-2">
        Pick the person using the app. Each view opens on one sentence.
      </p>
      <div className="mt-8 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {PEOPLE.map(t=>(
          <Card key={t.h} as="button" interactive onClick={()=>go(t.to)}>
            <img src={t.img} alt={t.alt} loading="lazy" width="1200" height="720"
              style={{ objectPosition: t.pos }} className="aspect-[5/3] w-full object-cover"/>
            <CardBody>
              <h2 className="font-display text-head font-bold leading-tight tracking-tight text-ink">{t.h}</h2>
              <p className="mt-2 max-w-[34ch] text-sec text-ink-2">{t.p}</p>
              <span className="mt-4 inline-flex items-center gap-2 font-display text-ui font-medium text-accent">
                Open <ArrowRight aria-hidden className="size-4"/>
              </span>
            </CardBody>
          </Card>
        ))}
      </div>
      <h2 className="mt-12 font-display text-[clamp(1.625rem,2.6vw,2.125rem)] font-bold tracking-tight text-ink sm:mt-[5vw]">
        Everything else
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MORE.map(([h,p,to])=>(
          <Card key={h} as={to ? 'button' : 'div'} interactive={!!to}
            onClick={to ? () => go(to) : undefined}>
            <CardBody className="p-6">
              <h3 className="font-display text-row font-bold tracking-tight text-ink">{h}</h3>
              <p className="mt-1.5 text-meta text-ink-2">{p}</p>
              <span className={to
                ? 'mt-3 inline-flex items-center gap-1.5 font-mono text-label uppercase tracking-[0.12em] text-accent'
                : 'mt-3 inline-block font-mono text-label uppercase tracking-[0.12em] text-ink-3'}>
                {to ? <>Open <ArrowRight aria-hidden className="size-3.5"/></> : 'Planned'}</span>
            </CardBody>
          </Card>
        ))}
      </div>
    </main>
  )
}
