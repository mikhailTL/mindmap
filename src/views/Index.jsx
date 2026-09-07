import React from 'react'
import { Label } from '../ui/misc'

const INDEX = [
  ['For students', [
    ['Today','Live score · what is driving it · your vitals'],
    ['The hours ahead','Forecast · hard periods · breathing prompts'],
    ['Your history','90 days · worst periods'],
    ['School','By class · upcoming load'],
    ['What helps','Measured effect of each thing you have tried'],
    ['Who can see what','Sharing · exactly what a parent sees'],
    ['Your patch','Pairing · placement · battery']]],
  ['For parents', [
    ['How they are doing','Family overview · one child'],
    ['Alerts','Only when something needs you'],
    ['School and wellbeing','How grades and stress move together'],
    ['How to help','Conversation starters · crisis lines']]],
  ['For professionals', [
    ['Triage','Ordered by how fast a student is changing'],
    ['One student','The full picture, for consented students'],
    ['Year groups','Cohort patterns · groups under five suppressed'],
    ['Referrals and consent','Escalations · the consent trail']]],
]
export function Index(){
  return (
    <main className="wrap py-14 sm:py-[7vw]">
      <Label>Index</Label>
      <h1 className="mt-3.5 font-display font-bold text-sect text-ink">Everything it does.</h1>
      <p className="mt-5 text-[clamp(1.3125rem,1.5vw,1.5rem)] leading-[1.55] text-ink-2">
        Every screen in the product, listed.</p>
      <div className="mt-3.5 border-t border-ink">
        {INDEX.map(([group,rows])=>(
          <section key={group} className="grid gap-4.5 border-b border-rule py-9 lg:grid-cols-[230px_1fr] lg:gap-11">
            <h2 className="lab pt-1.5 font-normal">{group}</h2>
            <div>
              {rows.map(([n,s])=>(
                <div key={n} className="grid gap-1.5 border-b border-rule py-4 last:border-b-0 last:pb-0
                  sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-baseline sm:gap-7">
                  <h3 className="font-display text-row font-bold text-ink">{n}</h3>
                  <p className="text-sec text-ink-2">{s}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
