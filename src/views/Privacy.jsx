import React from 'react'
import { ScrollIn } from '../s21/motion'
import { WhoSeesWhat } from '../charts/infographics'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'

/* Three of the site's own pages promised this screen and none of them opened
   it. It is the question every tester went looking for first. */

const YOU_SEE = [
  'One number for each day, and for the week',
  'Whether a day was above their usual',
  'Roughly how long they slept',
  'Whether the patch was being worn',
]
const YOU_NEVER = [
  'Anything they write in the app',
  'Where they were',
  'Their second-by-second readings',
  'Anything they say — the microphone is never recorded or sent',
]

/* The tick is knocked out of the accent disc, so it has to be the surface
   colour behind it. It was #f8f6fc, the paper of the palette this one
   replaced, and it went grey against the card. */
const KNOCKOUT = '#f8f6fc'

export function PrivacyBody({ go }) {
  return (
    <>
      <h2 className="max-w-[18ch] font-display font-medium text-head text-ink">
        What a parent can see.</h2>

      {/* Two ruled columns became two Cards when the sourced component landed:
          the pair already had a border, a heading and a body, which is a card
          drawn by hand. The top rule is the only thing that survives the swap,
          because it is what tells the two columns apart at a glance. */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ScrollIn as="section" className="h-full">
          <Card className="h-full border-t-2 border-t-accent">
            <CardHeader>
              {/* Was "What a parent sees", one word off the h2 directly above. */}
              <CardTitle as="h3" className="text-row">Shared with a parent</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="list-none space-y-3 p-0">
                {YOU_SEE.map(t => (
                  <li key={t} className="flex items-start gap-3 text-body text-ink">
                    <svg viewBox="0 0 20 20" aria-hidden className="mt-1.5 size-5 shrink-0 text-accent">
                      <circle cx="10" cy="10" r="8" fill="currentColor"/>
                      <path d="M6 10.5l2.6 2.6L14 8" fill="none" stroke={KNOCKOUT} strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </ScrollIn>

        <ScrollIn as="section" delay={0.08} className="h-full">
          <Card className="h-full border-t-2 border-t-ink">
            <CardHeader>
              <CardTitle as="h3" className="text-row">Never shared with a parent</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="list-none space-y-3 p-0">
                {YOU_NEVER.map(t => (
                  <li key={t} className="flex items-start gap-3 text-body text-ink-2">
                    <svg viewBox="0 0 20 20" aria-hidden className="mt-1.5 size-5 shrink-0 text-ink-3">
                      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".5"/>
                      <path d="M6.5 13.5l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    {t}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </ScrollIn>
      </div>

      <ScrollIn>
        <h3 className="mt-14 font-display text-sub font-medium tracking-tight text-ink">
          Everyone, side by side</h3>
        <WhoSeesWhat className="mt-6 max-w-[62rem]"/>
      </ScrollIn>
    </>
  )
}
