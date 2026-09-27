import React from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { ScrollIn, ScrollRow } from '../s21/motion'
import { ArrowRight, Check } from '../ui/marks'
import { IPhone } from '../ui/iphone'
import { PhoneApp } from '../ui/phone-app'
import { RainbowDial } from '../charts/rainbow'
import { ProblemStats, TreatmentGap, WhyItWorks, SOURCES } from '../charts/problem'
import { studentRings } from '../lib/readings'
import { triage, tierOf, TIER_LABEL } from '../lib/caseload'
import { DATA } from '../lib/assets'
import { HowItWorks, WhoSeesWhat, WeekStrip } from '../charts/infographics'
import { cn } from '../lib/utils'

/* The homepage, in the order the argument actually runs.
 *
 * It used to open with the product and put the reason for it on the fourth
 * band, behind a heading called "Why it matters" and a row of facts about the
 * device: four signals, forty five seconds, fourteen days. A visitor was being
 * told how the thing works before being told why anyone built it, and the one
 * figure on the page that was about a teenager was a placeholder.
 *
 * The order is now: what this is, what the problem is, why this helps, the
 * three ways to start, how a reading works, who sees what, and what it will
 * never do. Each band answers the question the band above it raises, which is
 * the only ordering rule this page needs.
 *
 * Grounds and rhythm are not decided here: every band is a <Section>, which
 * owns its ground, its heading size and its padding. The dark band appears
 * exactly once, on the statistics, because that is the part of the page that
 * has to stop somebody scrolling.
 */

/* The three ways in, in the order a visitor can answer them: the one that
   needs hardware, the one that needs nothing, and the one for somebody who is
   only looking. The middle one carries the accent rule because it is the only
   one a stranger can use in the next minute. */
const DOORS = [
  { id:'patch', go:'patch', title:'Wear the patch', note:'Needs a paired patch',
    line:'A sticker on your forearm reads four signals once a second, all day.',
    art:(
      <svg viewBox="0 0 220 120" className="h-[70px] w-auto" aria-hidden focusable="false">
        <rect x="7" y="23" width="206" height="74" rx="37" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="56" y="33" width="108" height="54" rx="22" className="fill-mist stroke-ink" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="14" fill="none" className="stroke-ink-3" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="4.5" className="fill-accent"/>
      </svg>) },
  { id:'phone', go:'without-patch', title:'Use your phone', note:'Works right now', lead:true,
    line:'Fingertip on the camera, one spoken sentence. Forty five seconds, no hardware.',
    art:(
      <svg viewBox="0 0 220 120" className="h-[70px] w-auto" aria-hidden focusable="false">
        <rect x="74" y="3" width="72" height="114" rx="12" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="86" y="19" width="48" height="48" rx="8" className="fill-ink"/>
        <circle cx="102" cy="39" r="8" className="fill-accent"/>
        <circle cx="122" cy="39" r="5" className="fill-beam"/>
        <path d="M84 91 q10 -16 20 0 t20 0 t12 -6" fill="none" stroke="#a8321f"
          strokeWidth="2.4" strokeLinecap="round"/>
      </svg>) },
  { id:'demo', go:'app', title:'Try the demo', note:'Start here if you are reviewing',
    line:'Every screen filled with generated data, marked as generated. Nothing to set up.',
    art:(
      <svg viewBox="0 0 220 120" className="h-[70px] w-auto" aria-hidden focusable="false">
        <rect x="18" y="13" width="184" height="94" rx="10" fill="none" className="stroke-ruling"
          strokeWidth="2" strokeDasharray="7 6"/>
        <path d="M42 83 L74 57 L104 69 L136 35 L178 47" fill="none" className="stroke-accent"
          strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="178" cy="47" r="5.5" className="fill-beam"/>
      </svg>) },
]

/* The three people, in the order they meet the product: the one wearing it,
   the one it reports to, then the school. Each tile shows that screen's own
   live chart rather than a photograph of somebody holding a phone. */
const SCREENS = [
  { id:'student', who:'Student',
    title:'Your score today, and what moved it',
    line:'You see the score, the four signals behind it, and every reading ever taken.',
    cta:'What a student gets' },
  { id:'parent',  who:'Parent',
    title:'One sentence a week, and which days ran high',
    line:'You see the shape of the week. Never a raw reading, never a note, never a location.',
    cta:'What a parent gets' },
  { id:'pro',     who:'School counselor',
    title:'A caseload ranked by who is changing fastest',
    line:'You see a score and a rank, for the students whose guardian agreed to share trends.',
    cta:'What a school gets' },
]

/* Each preview is the live component that screen actually uses, on that
   screen's own data. A screenshot would go stale the first time a chart
   changed, and a photograph of somebody holding a phone shows nothing at all. */
function Preview({ id }) {
  if (id === 'student') {
    return <RainbowDial score={51} usual={46} rings={studentRings()} size={268}/>
  }
  if (id === 'parent') {
    return (
      <div className="w-full max-w-[17rem]">
        <WeekStrip days={DATA.week} band={DATA.weekBand}/>
        <p className="mt-4 text-sec text-ink-2">Two days above her usual range.</p>
      </div>
    )
  }
  /* `roster()` calls the reading `current`, not `score`. Reading `s.score` gave
     every row undefined, which tierOf floors to 'info', so this preview once
     rendered four identical rows and four zero-width bars. */
  const rows = triage().slice(0, 4)
  return (
    <ul className="m-0 w-full max-w-[17rem] list-none space-y-3 p-0">
      {rows.map(s => {
        const tier = tierOf(s.current)
        return (
          <li key={s.id} className="grid grid-cols-[1fr_4.5rem] items-center gap-3">
            <span className="block h-2.5 w-full rounded-bar bg-rule/70">
              <span className={cn('block h-2.5 rounded-bar',
                tier === 'crisis' ? 'bg-crit' : tier === 'high' ? 'bg-warn' : 'bg-accent')}
                style={{ width: `${s.current}%` }}/>
            </span>
            <span className="font-mono text-fine tabular-nums text-ink-2">{TIER_LABEL[tier]}</span>
          </li>
        )
      })}
    </ul>
  )
}

const NEVER = [
  'Show a parent a raw reading',
  'Report on a group of under five students',
  'Keep data longer than the student chooses',
  'Open a record without logging it',
  'Sell or share anything with anyone',
  'Diagnose anything. This is not a medical device',
]

export function Overview({ go }) {
  return (
    <main>
      {/* ── the hero ──────────────────────────────────────────────────────
          Three things were wrong with this and all three were the same kind
          of wrong. The product name sat above the headline in mono at caption
          size, so the one line that says what MindMap is was the smallest
          thing on the screen. The headline was forced into two lines by a
          component, and at the display step's 1.02 leading the descenders of
          "Making your stress" were landing in the cap height of "readable".
          And under it sat a forty word paragraph doing the job of six words.

          It is a two column band now, so the right side holds the app running
          instead of holding nothing. */}
      <section id="hero" className="border-t border-rule bg-paper">
        <div className="wrap grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:py-20">
          <div>
            {/* The name, at a size that matches its job. accent on paper is
                5.52 : 1, so it can be a word and not only a colour. */}
            <ScrollIn as="p" className="font-display text-row font-bold tracking-tight text-accent">
              MindMap, a wellness app for teenagers
            </ScrollIn>
            {/* One element, one leading, balanced wrapping. The break now
                falls wherever the column is, instead of being hard coded into
                a place that only worked at one width. */}
            <h1 className="mt-3 max-w-[15ch] font-display text-view font-bold leading-[1.1]
              tracking-tight text-ink [text-wrap:balance]">
              Making your stress <span className="text-accent">readable</span>.
            </h1>
            <ScrollIn as="p" className="mt-5 text-lead font-medium leading-[1.4] text-ink-2">
              One score. One sentence. Every day.
            </ScrollIn>
            <ScrollIn as="p" className="mt-3 max-w-read text-sec text-ink-2">
              Read from a patch on your forearm, or from the phone already in your pocket.
            </ScrollIn>
            <ScrollIn className="mt-8">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => go('app')}>Open the app<span aria-hidden>→</span></Button>
                <Button variant="outline" onClick={() => go('without-patch')}>Take a reading now</Button>
              </div>
            </ScrollIn>
          </div>
          {/* The app itself, looping through a reading, a score and a week.
              A still would be dead the first time a chart changed; this is the
              site's own components on the site's own data, so it cannot drift
              out of date with the product it is advertising. */}
          <div className="justify-self-center lg:justify-self-end">
            <IPhone model="15-pro" scale={0.52} screenBg="#f7faf8"
              label="The MindMap app, cycling through a reading, the score it returns and the week it lands in"
              className="lg:hidden">
              <PhoneApp/>
            </IPhone>
            <IPhone model="15-pro" scale={0.68} screenBg="#f7faf8"
              label="The MindMap app, cycling through a reading, the score it returns and the week it lands in"
              className="hidden lg:block">
              <PhoneApp/>
            </IPhone>
          </div>
        </div>
      </section>

      {/* ── the problem, on the one dark band ────────────────────────────
          Straight under the hero, because a reader who does not believe there
          is a problem has no reason to care how the product works. Every
          figure here is external and sourced. The band this replaces carried
          three facts about the device and one placeholder reading
          "[cited stat]", which was honest and useless. */}
      <Section name="The problem" tone="ink">
        <SectionHead tone="ink" className="max-w-[20ch]">
          Most teenagers who are struggling are not being reached.
        </SectionHead>
        <ProblemStats className="mt-10"/>
      </Section>

      {/* ── why this helps ──────────────────────────────────────────────── */}
      <Section name="Why MindMap helps" tone="paper">
        <SectionHead className="max-w-[26ch]">
          The body changes before anyone finds the words for it.
        </SectionHead>
        <div className="mt-10 grid gap-x-14 gap-y-12 lg:grid-cols-2">
          <TreatmentGap/>
          <WhyItWorks/>
        </div>
        <p className="mt-10 text-fine text-ink-3">
          Sources:{' '}
          {SOURCES.map((s, i) => (
            <React.Fragment key={s.href}>
              {i > 0 && ' · '}
              <a href={s.href} target="_blank" rel="noreferrer"
                className="border-b border-accent/40 text-accent hover:border-accent">{s.label}</a>
            </React.Fragment>
          ))}
        </p>
      </Section>

      {/* ── the three doors ─────────────────────────────────────────────── */}
      <Section name="Getting started" tone="card">
        <SectionHead>3 Ways to Use MindMap</SectionHead>
        <SectionLede>
          All three open the same app and ask who you are next: student, parent, or school
          counselor.
        </SectionLede>
        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {DOORS.map((d, i) => (
            <ScrollRow key={d.id} index={i} className="h-full">
              <Card interactive as="button" type="button" onClick={() => go(d.go)}
                className={cn('flex h-full flex-col p-6 text-left', d.lead && 'border-l-[3px] border-l-accent')}>
                <div className="grid h-[76px] place-items-start" aria-hidden>{d.art}</div>
                <h3 className="mt-5 font-display text-head font-bold text-ink">{d.title}</h3>
                <p className="mt-2 text-sec leading-[1.55] text-ink-2">{d.line}</p>
                <span className="mt-auto pt-4 font-display text-tick font-bold text-accent">{d.note} →</span>
              </Card>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* ── how a reading works ─────────────────────────────────────────── */}
      <Section name="How it works" tone="paper" tight>
        <SectionHead>A day in, one score and one sentence out.</SectionHead>
        <HowItWorks className="mt-9"/>
      </Section>

      {/* ── the three audiences ─────────────────────────────────────────── */}
      <Section name="Who it is for" tone="card" id="screens">
        <SectionHead>3 Perspectives</SectionHead>
        <SectionLede>
          A student, a parent and a counselor read the same day of measurements and see three
          different screens. The student sees all of it. The other two see only what the student
          agreed to share.
        </SectionLede>
        <div className="mt-9 grid gap-6 lg:grid-cols-3">
          {SCREENS.map((s2, i) => (
            <ScrollRow key={s2.id} index={i}>
              <Card interactive as="button" type="button" onClick={() => go(s2.id)}
                className="flex h-full flex-col">
                {/* place-content-center sizes the grid track to its content, so
                    a preview asking for w-full collapsed to the width of its
                    own labels and the bars measured zero. place-items keeps the
                    track full width and centres the child in it. */}
                <div className="grid min-h-[232px] place-items-center border-b border-rule
                  bg-mist/50 px-6 py-7" aria-hidden>
                  <Preview id={s2.id}/>
                </div>
                <CardHeader className="pb-0 pt-5">
                  <span className="font-display text-tick font-bold text-accent">{s2.who}</span>
                  <CardTitle as="span" className="text-head">{s2.title}</CardTitle>
                  <CardDescription>{s2.line}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex items-center gap-2.5 pt-5
                  font-display text-meta font-bold text-accent">
                  {s2.cta}
                  <ArrowRight className="size-[1.1rem] transition-transform duration-200
                    group-hover:translate-x-1.5"/>
                </CardContent>
              </Card>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* ── privacy ─────────────────────────────────────────────────────── */}
      <Section name="Privacy" tone="paper">
        <SectionHead>Student Privacy</SectionHead>
        <SectionLede>
          The student decides what leaves the phone. Parents and counselors see a score and a
          sentence, and only where consent has been given. The readings behind them stay on the
          device.
        </SectionLede>
        <WhoSeesWhat className="mt-9 max-w-[62rem]"/>
      </Section>

      {/* ── the limits ──────────────────────────────────────────────────── */}
      {/* This was a moving marquee showing one or two items at a time. These
          are the strongest sentences on the site and a marquee cannot be
          read. */}
      <Section name="Limits" tone="mist" tight>
        <SectionHead>What MindMap Will Never Do</SectionHead>
        <ul className="mt-7 grid list-none gap-x-10 gap-y-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {NEVER.map(t => (
            <li key={t} className="flex items-start gap-3 text-meta text-ink">
              <Check className="mt-1 size-4 shrink-0 text-accent"/>
              {t}
            </li>
          ))}
        </ul>
      </Section>

    </main>
  )
}
