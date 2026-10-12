import React from 'react'
import { ScrollIn } from '../ui/motion'
import { WhoSeesWhat } from '../charts/infographics'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { SCORE, NOTES, NOTES_DEF, LOCATION } from '../lib/terms'

/* Consent scope for a parent account. A parent may be shown only what is in
   YOU_SEE; nothing in YOU_NEVER may reach a parent screen, export or share
   link. Moving an item between these lists is a consent change, not copy. */
const YOU_SEE = [
  `The ${SCORE} for each day, and for the week`,
  'Whether a day was above their usual',
  'Roughly how long they slept',
  'Whether the patch was being worn',
]
const YOU_NEVER = [
  `${NOTES}. ${NOTES_DEF}`,
  LOCATION,
  'Their second-by-second readings',
  'Anything they say. The microphone is never recorded or sent',
]

/* The tick below is knocked out of the filled accent disc, so its stroke must
   be the surface colour behind it: use the `stroke-card` token, not a literal,
   or it goes grey when the card colour changes. */
export function PrivacyBody({ go }) {
  return (
    <>
      <h2 className="max-w-[18ch] font-display font-bold text-sub leading-[1.12] tracking-tight text-ink">
        What a parent can see</h2>

      {/* Vertical scale across these views: 10 within a section, 14 between
          sections, 20 between page regions. */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ScrollIn as="section" className="h-full">
          <Card className="h-full border-t-2 border-t-accent">
            <CardHeader>
              <CardTitle as="h3">Shared with a parent</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="list-none space-y-3 p-0">
                {YOU_SEE.map(t => (
                  <li key={t} className="flex items-start gap-3 text-body text-ink">
                    <svg viewBox="0 0 20 20" aria-hidden className="mt-1.5 size-5 shrink-0 text-accent">
                      <circle cx="10" cy="10" r="8" fill="currentColor"/>
                      <path d="M6 10.5l2.6 2.6L14 8" fill="none" className="stroke-card" strokeWidth="2"
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
              <CardTitle as="h3">Never shared with a parent</CardTitle>
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
        <h3 className="mt-14 font-display text-head font-bold tracking-tight text-ink">
          Student, parent and counselor compared</h3>
        <WhoSeesWhat className="mt-6 max-w-[62rem]"/>
      </ScrollIn>
    </>
  )
}
