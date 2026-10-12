import React from 'react'
import { ScrollRow } from '../ui/motion'

import { Headline, AllDetail } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { Scale } from '../ui/radio-scale'
import { DemoNotice, RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { Diverge } from '../charts/diverge'
import { ITEMS, score, sentence, connectPatch } from '../lib/engine'
import { PhoneCheck } from './PhoneCheck'

/* One route per card. The counters that used to head these ran 01, 03, 02 down
   the row and nobody noticed, which is the argument against them: a numeral
   that is wrong still looks like an order. The panel was a bare top rule on
   the sheet; it is the project Card now, so the three routes read as three
   objects side by side rather than as three paragraphs under a line. */
function Route({ title, children, foot }){
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle as="h2" className="text-row">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
      {foot && <CardFooter className="mt-auto block pt-0">{foot}</CardFooter>}
    </Card>
  )
}

export function CheckInBody({ go }){
  const [mode] = useMode()
  const resultRef = React.useRef(null)
  const [ans,setAns] = React.useState({})
  const [pair,setPair] = React.useState(null)
  const [busy,setBusy] = React.useState(false)
  const done = Object.keys(ans).length === ITEMS.length
  const r = done ? score(ans) : null
  const s = r ? sentence(r) : null
  const answered = Object.keys(ans).length
  // The score appeared 2300px down with no confirmation; testers found it by
  // scrolling on spec. Completing the last question now takes you to it.
  React.useEffect(() => {
    if (!done || !resultRef.current) return
    const t = setTimeout(() => resultRef.current?.scrollIntoView({ block:'start' }), 260)
    return () => clearTimeout(t)
  }, [done])

  async function pairUp(){
    setBusy(true); setPair({ ok:null, msg:'Choosing a device…' })
    setPair(await connectPatch()); setBusy(false)
  }
  return (
    <>
      <div className="flex flex-wrap items-baseline gap-4">
        <h2 className="max-w-[18ch] font-display font-bold text-head text-ink">Take a reading now</h2>
        {/* This screen is the exception in both modes — it scores whoever is
            reading it, from their own answers, with or without hardware — so
            the annotation states what is true of the screens around it rather
            than of this one. Neither stamp can be dropped: in demo the
            surrounding figures are invented, and in real there is no patch. */}
        {mode === 'real'
          ? <RealNotice inline>No patch is paired, and these six questions do not need one.</RealNotice>
          : <DemoNotice inline>Every other screen is generated. These six are not.</DemoNotice>}
      </div>
      <p className="mt-4 max-w-[52ch] text-body leading-[1.5] text-ink-2">Three ways in, one Mind Score.
        The phone's own camera and microphone, a paired patch, or six questions.</p>

      {/* mt was 8. Three fixed steps across these views — 10 inside a section,
          14 between sections, 20 between page regions. */}
      <div className="mt-10 grid gap-3.5 lg:grid-cols-3">
        <ScrollRow index={0} className="h-full"><Route title="Use the phone's sensors"
          foot={<p className="min-h-[3.2em] max-w-[44ch] text-meta text-ink-2">
            Frames and audio are turned into numbers here and dropped. Neither is stored or sent.</p>}>
          <p className="max-w-[38ch] text-sec text-ink-2">Forty-five seconds. An index fingertip over
            the rear lens and flash gives heart rate and beat-to-beat variation. One spoken sentence
            gives pitch and steadiness.</p>
        </Route></ScrollRow>
        <ScrollRow index={1} className="h-full"><Route title="Answer six questions"
          foot={<p className="min-h-[3.2em] max-w-[44ch] text-meta text-ink-2">
            Your answers stay on this device. Nothing is stored or sent.</p>}>
          <p className="max-w-[38ch] text-sec text-ink-2">No patch needed.</p>
          {/* The count was the only sign the six were finite, and it only moved
              once a question was answered. The bar states the remainder up
              front, before anything has been touched. */}
          <div className="mt-5 min-h-[46px]">
            <p className="font-mono text-meta tabular-nums text-ink-3">{answered} of {ITEMS.length} answered</p>
            <Progress className="mt-3 max-w-[22rem]" value={answered} max={ITEMS.length}
              label={`${answered} of ${ITEMS.length} questions answered`}/>
          </div>
        </Route></ScrollRow>
        <ScrollRow index={2} className="h-full"><Route title="Connect a patch"
          foot={<p aria-live="polite" className="min-h-[3.2em] max-w-[44ch] text-meta text-ink-2">{pair?.msg}</p>}>
          <p className="max-w-[38ch] text-sec text-ink-2">Pairs over Bluetooth with a MindMap patch and streams at 1 Hz.
            {mode === 'real' && ' Nothing is paired to this account, so the dashboard has no reading to show yet.'}</p>
          <Button variant="outline" size="sm" className="mt-5" onClick={pairUp} disabled={busy}>
            {busy ? 'Connecting…' : 'Connect a patch'}
          </Button>
        </Route></ScrollRow>
      </div>

      {/* The measured route first, because it is the one that produces a
          reading rather than a self-assessment. The six questions keep their
          place underneath, unchanged: they are the fallback when a camera is
          refused, and they are the only route that works with no hands free. */}
      <section className="mt-14">
        <h3 className="mark">Use your phone's camera and microphone</h3>
        <p className="mt-2 max-w-[56ch] text-sec text-ink-2">
          No patch, no questions. The same Mind Score, worked out from measurements instead of answers.
        </p>
        <div className="mt-6"><PhoneCheck/></div>
      </section>

      {/* On a monitor the six questions and the running result sit side by side,
          so the reading appears without the answers scrolling out of view. */}
      {/* mt was 8 as well, which made the break between "how to take a reading"
          and the reading itself the same size as the gap inside it. This is a
          section break. */}
      <h3 className="mt-20 mark">Or answer six questions</h3>
      <div className="mt-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] xl:gap-14 2xl:gap-20 xl:items-start">
        {/* The six sat on the sheet under a single ink rule, which read as the
            start of a section rather than as one form. One Card holds them and
            each question keeps its own hairline as a row rule inside it. */}
        <Card>
          <CardContent className="py-0">
            {ITEMS.map((it,i)=>(
              <ScrollRow key={it.id} index={i}
                className={i === ITEMS.length - 1 ? '[&_fieldset]:border-b-0' : undefined}>
                <Scale legend={it.q} low={it.lo} high={it.hi}
                  value={ans[it.id]} onChange={v=>setAns(a=>({...a,[it.id]:v}))}/>
              </ScrollRow>
            ))}
          </CardContent>
        </Card>

      {/* the result region is announced, and its space is reserved so nothing jumps */}
      {/* 92px was measured against a 56px site header with a 2px rule under
          it. This screen only ever renders inside the app shell, whose own
          bar is 48px with a hairline, so 92 left a 43px hole under the chrome.
          49px of chrome plus 16px of air. */}
      <Card ref={resultRef} aria-live="polite" data-anchor
        className="mt-10 min-h-[12rem] xl:mt-0 xl:sticky xl:top-[65px]">
        <CardContent>
        {!done && (
          <p className="max-w-[40ch] text-sec text-ink-3">
            Answer all six and your Mind Score appears here, as a sentence first.
          </p>
        )}
        {done && (
          <>
            {/* One ring, because six answers are one signal. A patch fills
                four — the dashboards show what that looks like. */}
            {/* this column is 34rem wide, so the arch and the sentence stack;
                side by side left the sentence breaking every two words */}
            <div className="flex flex-col items-start gap-7">
              {/* Both hexes are palette tokens, checked against the rebuild:
                  #0a6e68 is accent, #1d8fb0 is beam. Beam paints the band on a
                  mist track — a fill, which is the only job it has — and the
                  ring never carries the reading on its own, so neither is
                  being asked to clear a text ratio. */}
              <RainbowDial score={r.score} size={288}
                rings={[{ id:'self', name:'Your answers', color:'#0a6e68', glow:'#1d8fb0',
                          value:r.score, reading:'Six questions' }]}/>
              <div>
                <Headline>{s.pre}<b className={`font-bold ${s.calm ? 'text-calm' : 'text-warn'}`}>{s.word}</b>{s.tail}</Headline>
                <p className="mt-4 max-w-[40ch] text-sec text-ink-3">A patch fills four rings: heart,
                  sweat, temperature and movement.</p>
              </div>
            </div>
            <AllDetail label="See what moved your Mind Score">
              {/* The figure heading read "What moved it" directly under a
                  trigger that says the same thing, so only the scale note is
                  left. */}
              <p className="mt-2 max-w-[52ch] text-sec text-ink-3">Right of the line raised the Mind
                Score, left of it lowered it.</p>
              <Diverge items={r.contrib.map(c=>({ label:c.item.q.replace(/\?$/,''),
                x: Math.max(-1, Math.min(1, c.raw)) }))}/>
              <p className="mt-6 max-w-[64ch] text-meta text-ink-2">Each answer is measured from its
                middle option, weighted, averaged, and turned into a Mind Score out of 100. The patch
                does the same last step using heart rate, sweat, temperature and movement instead of
                answers, so both give one number on one scale.</p>
            </AllDetail>
          </>
        )}
        </CardContent>
      </Card>
      </div>
    </>
  )
}
