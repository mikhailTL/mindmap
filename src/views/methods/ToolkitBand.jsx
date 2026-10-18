import React from 'react'
import { Section, SectionHead } from '../../ui/section'
import { Button } from '../../ui/button'
import { ArrowRight } from '../../ui/marks'
import { Nameplate } from '../../toolkit/nameplates/Nameplate.jsx'
import { STUDENT_ITEMS } from '../../toolkit/index.jsx'
import { SKILL_BY_ID } from '../../skills/index.js'
import { ScrollIn } from '../../ui/motion'

/* The Toolkit tab of How it works: the nameplates and one line.
 *
 * 18 October, the owner: "remove this wordslop from toolkit on how it works
 * ur overcomplicating stuff again". The phone-sensor rows, the who-gets-what
 * list, the steps and the levels are gone. The activities appear as their own
 * nameplates (toolkit/index.jsx, skills/index.js); no counts, because the
 * Toolkit grows. */

const ITEM = Object.fromEntries(STUDENT_ITEMS.map(i => [i.id, i]))
const PLATES = [ITEM.breathing, ITEM.sigh, ITEM.walk, SKILL_BY_ID['school-cram']].filter(Boolean)

export function ToolkitBand({ go }) {
  return (
    <Section tone="card" className="bg-mint-wash">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-x-10">
        <ScrollIn className="min-w-0">
          <SectionHead className="mt-0 max-w-[24ch]">Calming activities and life skills</SectionHead>
          <p className="mt-2 max-w-[48ch] text-sec leading-[1.5] text-ink-2">
            Pick one in the Toolkit and follow the screen.
          </p>
          <Button className="mt-5" onClick={() => go('toolkit')}>
            Open the Toolkit<ArrowRight aria-hidden/>
          </Button>
        </ScrollIn>

        {/* Real nameplates: each one opens its activity. */}
        <figure className="m-0 grid min-w-0 gap-2.5">
          {PLATES.map((it, i) => <Nameplate key={it.id} item={it} index={i}/>)}
        </figure>
      </div>
    </Section>
  )
}

export default ToolkitBand
