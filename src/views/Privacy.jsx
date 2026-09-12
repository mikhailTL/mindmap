import React from 'react'
import { Back } from './Monitor'
import { Label } from '../ui/misc'
import { WhoSeesWhat } from '../charts/infographics'

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

export function Privacy({ go }) {
  return (
    <main className="wrap py-9 sm:py-14">
      <Back go={go} to="hub"/>
      <Label>Who can see what</Label>
      <h1 className="mt-3 max-w-[16ch] font-display font-bold text-view text-ink">
        A parent sees a number, not a diary.</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <section className="border-t-2 border-accent pt-5">
          <h2 className="font-display text-row font-bold text-ink">What a parent sees</h2>
          <ul className="mt-4 list-none space-y-3 p-0">
            {YOU_SEE.map(t => (
              <li key={t} className="flex items-start gap-3 text-body text-ink">
                <svg viewBox="0 0 20 20" aria-hidden className="mt-1.5 size-5 shrink-0 text-accent">
                  <circle cx="10" cy="10" r="8" fill="currentColor"/>
                  <path d="M6 10.5l2.6 2.6L14 8" fill="none" stroke="#fcfcfb" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/></svg>
                {t}
              </li>
            ))}
          </ul>
        </section>
        <section className="border-t-2 border-rule pt-5">
          <h2 className="font-display text-row font-bold text-ink">What a parent never sees</h2>
          <ul className="mt-4 list-none space-y-3 p-0">
            {YOU_NEVER.map(t => (
              <li key={t} className="flex items-start gap-3 text-body text-ink-2">
                <svg viewBox="0 0 20 20" aria-hidden className="mt-1.5 size-5 shrink-0 text-ink-3">
                  <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".5"/>
                  <path d="M6.5 13.5l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {t}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <h2 className="mt-14 font-display text-[clamp(1.625rem,2.6vw,2.125rem)] font-bold tracking-tight text-ink">
        Everyone, side by side</h2>
      <WhoSeesWhat className="mt-6 max-w-[62rem]"/>

      <div className="mt-12 border-l-2 border-accent py-1 pl-5">
        <p className="max-w-[54ch] text-sec text-ink-2">A student can stop sharing at any time, and does not
          have to say why. The only thing they cannot switch off is a crisis alert, and they are told that
          before they start.</p>
      </div>
    </main>
  )
}
