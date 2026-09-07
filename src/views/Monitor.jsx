import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Disclosure } from '../ui/collapsible'
import { Label } from '../ui/misc'
import { FigHead, Stat } from '../charts/primitives'
import { DayChart } from '../charts/day'
import { WeekChart } from '../charts/week'
import { DATA } from '../lib/assets'

export function Back({ go }){
  return (
    <button onClick={()=>go('hub')}
      className="mb-6 flex w-fit min-h-[44px] items-center gap-2 py-2 font-display text-[1.0625rem]
        font-medium text-accent transition-colors duration-150 hover:text-accent-ink">
      <ArrowLeft aria-hidden className="size-4"/> All views
    </button>
  )
}
export function Who({ name, meta }){
  return <div className="flex flex-wrap items-baseline gap-3.5">
    <h1 className="font-display text-row font-bold text-ink">{name}</h1>
    <Label>{meta}</Label>
  </div>
}
/* The sentence is the interface. The number is a detail of it. */
export function Verdict({ pre, word, calm, tail }){
  return (
    <p className="mt-6 max-w-[22ch] font-display font-bold text-view text-ink">
      {pre}<b className={`font-bold ${calm?'text-calm':'text-warn'}`}>{word}</b>{tail}
    </p>
  )
}
export function Because({ children }){
  return <p className="mt-5 max-w-[48ch] text-body leading-[1.5] text-ink-2">{children}</p>
}
export function NextUp({ children }){
  return <div className="mt-7 border-l-2 border-accent py-1 pl-5"><p className="text-sec text-ink-2">{children}</p></div>
}
const GRID = 'grid border-t border-rule sm:grid-cols-2 lg:grid-cols-3'
/* On a monitor the sentence and the evidence sit side by side instead of
   stacking into a scroll. Below that the order is sentence, then evidence. */
const SPLIT = 'xl:grid xl:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] xl:gap-14 2xl:gap-20 xl:items-start'
const STICKY = 'xl:sticky xl:top-[92px]'

export function Student({ go }){
  return (
    <main className="wrap py-9 sm:py-14">
      <Back go={go}/>
      <div className={SPLIT}>
        <div className={STICKY}>
          <Who name="Today" meta="Thursday · 4:10 pm"/>
          <Verdict pre="Today is running " word="a little high" tail=" for you, and it started in third period."/>
          <Because>Your pulse has been about six beats above your own resting median since 11 am, and it
            has not come back down between classes.</Because>
          <NextUp>Chemistry is your hardest period four weeks running. A two-minute breathing prompt is
            set for before it tomorrow.</NextUp>
          <div className="mt-8 hidden xl:block">
            <FigHead title="Your score" note="Against your own scale, not a population."/>
            <div className="mt-1.5 font-display font-bold text-fig text-ink">51
              <span className="ml-1.5 text-row font-normal tracking-normal text-ink-3">/100</span></div>
          </div>
        </div>
        <div className="mt-9 xl:mt-0">
      <Disclosure label="More details" openOnWide className="xl:border-t-0">
        <div className="xl:hidden">
          <FigHead title="Your score" note="Against your own scale, not a population."/>
          <div className="mt-1.5 font-display font-bold text-fig text-ink">51
            <span className="ml-1.5 text-row font-normal tracking-normal text-ink-3">/100</span></div>
        </div>
        <FigHead title="Across today" note="The shaded band is your own usual range. Hover the line."/>
        <DayChart data={DATA.day} band={DATA.band}/>
        <FigHead title="Each sensor, the last hour"/>
        <div className={GRID}>
          <Stat label="Heart rate" value="70" unit="bpm" trend={DATA.spark.hr}>Resting median 64. Up 6.</Stat>
          <Stat label="HRV (RMSSD)" value="60" unit="ms" trend={DATA.spark.hrv}>Down 1% against your fourteen-day baseline.</Stat>
          <Stat label="Skin conductance" value="3.00" unit="µS" trend={DATA.spark.eda}>Four responses in the last ten minutes.</Stat>
          <Stat label="Skin temperature" value="33.5" unit="°C" trend={DATA.spark.temp}>Flat. No fever signal.</Stat>
          <Stat label="Movement" value="0.01" unit="g" trend={DATA.spark.mot}>Sitting still, so the reading is not exercise.</Stat>
        </div>
        <p className="mt-6 text-meta text-ink-2">Scored on 60-second windows, stepped every 30 seconds,
          against your own fourteen-day median.</p>
      </Disclosure>
        </div>
      </div>
    </main>
  )
}

export function Parent({ go }){
  return (
    <main className="wrap py-9 sm:py-14">
      <Back go={go}/>
      <div className={SPLIT}>
        <div className={STICKY}>
          <Who name="Maya" meta="Grade 11 · shared since March"/>
          <Verdict pre="Maya has had " word="a harder week than usual" tail=", mostly on school mornings."/>
          <Because>Three of the last five school days ran above her normal range before lunch. Weekends
            were normal. She has not flagged anything herself.</Because>
          <NextUp>Worth asking about Thursday morning. You are not told what she wrote or where she was,
            only that the week ran high.</NextUp>
        </div>
        <div className="mt-9 xl:mt-0">
      <Disclosure label="More details" openOnWide className="xl:border-t-0">
        <FigHead title="The last seven days" note="The shaded band is her usual range."/>
        <WeekChart data={DATA.week} band={DATA.weekBand}/>
        <div className={GRID}>
          <Stat label="Days above range" value="3" unit="of 5">Monday, Wednesday, Thursday. All before 12 pm.</Stat>
          <Stat label="Week average" value="58" unit="/100">Her twelve-week average is 47.</Stat>
          <Stat label="Weekend" value="44" unit="/100">Inside her normal range both days.</Stat>
          <Stat label="Sleep window" value="5.4" unit="h">Estimated from movement. Her usual is 7.9.</Stat>
          <Stat label="Patch worn" value="94" unit="%">Off the skin for 41 minutes on Tuesday.</Stat>
          <Stat label="Check-ins" value="6" unit="of 7">She skipped Saturday.</Stat>
        </div>
        <p className="mt-6 text-meta text-ink-2">Maya sees this page. Her raw readings, her notes and
          her locations stay on her account.</p>
      </Disclosure>
        </div>
      </div>
    </main>
  )
}
