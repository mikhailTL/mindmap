import React from 'react'
import { ArrowRight } from '../../ui/marks'
import { Nameplate } from '../../toolkit/nameplates/Nameplate.jsx'
import { STUDENT_ITEMS } from '../../toolkit/index.jsx'
import { SKILL_BY_ID } from '../../skills/index.js'
import { ScrollIn } from '../../ui/motion'
import { TechBand, TechTitle, TechButton } from '../../ui/tech'
import { Frame } from '../../ui/frame'

/* The Toolkit tab of How it works: the nameplates and a short explanation.
 *
 * 18 October, the owner: "remove this wordslop from toolkit on how it works
 * ur overcomplicating stuff again". The phone-sensor rows, the who-gets-what
 * list, the steps and the levels are gone. The activities appear as their own
 * nameplates (toolkit/index.jsx, skills/index.js); no counts, because the
 * Toolkit grows.
 *
 * 19 October (later): "stop making things dark, site should be more peaceful
 * and light". The band sits on the light tech ground like the other tabs, the
 * button is the accent rather than ink, and the four plates are ones whose
 * banners are light (toolkit/nameplates/palettes.js).
 *
 * 20 October, the owner: pair the drawings with stock. The plates sit under
 * one licensed stock frame (models, not users). */

const ITEM = Object.fromEntries(STUDENT_ITEMS.map(i => [i.id, i]))
const PLATES = [ITEM.ground, ITEM.walk, SKILL_BY_ID['life-money'], SKILL_BY_ID['school-sources']].filter(Boolean)

export function ToolkitBand({ go }) {
  return (
    <TechBand>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-x-10">
        <ScrollIn className="min-w-0">
          <TechTitle className="max-w-[24ch] text-sub leading-[1.12]">Calming activities and life skills</TechTitle>
          <p className="mt-2.5 max-w-[48ch] text-sec leading-[1.5] text-[#2a5744]">
            Pick one in the Toolkit and follow the screen.
          </p>
          <p className="mt-3 max-w-[48ch] text-sec leading-[1.5] text-[#2a5744]">
            Short calming activities, plus life skills for school, social life and careers.
          </p>
          <TechButton className="mt-5" onClick={() => go('toolkit')}>
            Open the Toolkit<ArrowRight aria-hidden/>
          </TechButton>
        </ScrollIn>

        {/* A stock frame, then the real nameplates: each one opens its activity. */}
        <figure className="m-0 mx-auto w-full min-w-0 max-w-[26rem]">
          <div className="overflow-hidden rounded-[16px] bg-mist" style={{ aspectRatio: '16 / 10' }}>
            <Frame photo="friends-steps"
              alt="A stock photograph of two teenagers sitting on steps outside, reading a notebook together."/>
          </div>
          <div className="relative mx-3 -mt-6 grid gap-2.5 rounded-[14px] border border-rule/70 bg-white p-3
            shadow-[0_1px_2px_rgba(13,43,30,.05),0_10px_24px_-18px_rgba(13,43,30,.25)]">
            {PLATES.map((it, i) => <Nameplate key={it.id} item={it} index={i}/>)}
          </div>
        </figure>
      </div>
    </TechBand>
  )
}

export default ToolkitBand
