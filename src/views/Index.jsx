import React from 'react'
import { ArrowRight } from 'lucide-react'
import { Label } from '../ui/misc'
import { cn } from '../lib/utils'

const INDEX = [
  ['For students', [
    ['Today','Your number, and the reasons behind it','student'],
    ['Take a reading','With a patch, or six questions','check'],
    ['Who can see what','Exactly what a parent and a counselor see','privacy'],
    ['The hours ahead','Which lessons are usually hardest', null],
    ['Your history','Ninety days, and what helped', null],
    ['What helps','The measured effect of what you have tried', null],
    ['Your patch','Pairing, placement, battery', null]]],
  ['For parents', [
    ['How they are doing','This week in one sentence','parent'],
    ['Who can see what','What you can and cannot see','privacy'],
    ['Alerts','Only when something needs you', null],
    ['School and wellbeing','How grades and stress move together', null],
    ['How to help','Conversation starters and crisis lines', null]]],
  ['For school counselors', [
    ['Triage','Students ordered by how fast they are changing','pro'],
    ['One student','The full record, for consented students','pro'],
    ['Year groups','Patterns by class and by weekday','pro'],
    ['Escalation','The crisis protocol and referrals','pro'],
    ['Consent','The ledger and the access log','pro']]],
]
export function Index({ go }){
  return (
    <main className="wrap py-14 sm:py-[7vw]">
      <Label>Index</Label>
      <h1 className="mt-3.5 font-display font-bold text-sect text-ink">All features.</h1>
      <p className="mt-5 text-[clamp(1.3125rem,1.5vw,1.5rem)] leading-[1.55] text-ink-2">
        Screens marked Open are built. The rest are planned.</p>
      <div className="mt-3.5 border-t border-ink">
        {INDEX.map(([group,rows])=>(
          <section key={group} className="grid gap-4.5 border-b border-rule py-9 lg:grid-cols-[230px_1fr] lg:gap-11">
            <h2 className="lab pt-1.5 font-normal">{group}</h2>
            <div>
              {rows.map(([n,d,to])=>{
                const Row = to ? 'button' : 'div'
                return (
                  <Row key={n} onClick={to ? () => go(to) : undefined}
                    className={cn('grid w-full gap-1.5 border-b border-rule py-4 text-left last:border-b-0',
                      'sm:grid-cols-[minmax(0,15rem)_1fr_2rem] sm:items-baseline sm:gap-7',
                      to && 'min-h-[56px] cursor-pointer transition-colors hover:bg-sage/60')}>
                    <h3 className="font-display text-row font-bold text-ink">{n}</h3>
                    <p className="text-sec text-ink-2">{d}</p>
                    {to
                      ? <span className="flex items-center gap-1.5 font-mono text-label uppercase tracking-[0.12em] text-accent">
                          Open <ArrowRight aria-hidden className="size-4"/></span>
                      : <span className="font-mono text-label uppercase tracking-[0.12em] text-ink-3">Planned</span>}
                  </Row>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
