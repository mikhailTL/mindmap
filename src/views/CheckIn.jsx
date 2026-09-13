import React from 'react'
import { ScrollRow } from '../s21/motion'

import { Headline, AllDetail, SampleTag } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { Scale } from '../ui/radio-scale'
import { Diverge } from '../charts/diverge'
import { ITEMS, score, sentence, connectPatch } from '../lib/engine'

/* Two ways in, numbered. A bluetooth glyph and a clipboard glyph were two
   pictures of nouns standing in for an order that a numeral states outright.
   The panel was a bare top rule on the sheet; it is the project Card now, so
   the two routes read as two objects side by side rather than as two
   paragraphs that happen to have a line above them. */
function Route({ n, title, children, foot }){
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-baseline gap-4">
        <span className="font-mono text-num font-light tabular-nums text-ink-3">{n}</span>
        <CardTitle as="h2" className="text-row">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
      {foot && <CardFooter className="mt-auto block pt-0">{foot}</CardFooter>}
    </Card>
  )
}

export function CheckInBody({ go }){
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
        <h2 className="max-w-[18ch] font-display font-medium text-head text-ink">Take a reading now.</h2>
        <SampleTag>Live — scored from your own answers</SampleTag>
      </div>
      <p className="mt-4 max-w-[48ch] text-body leading-[1.5] text-ink-2">Six questions, scored by the
        same model the patch uses. About thirty seconds.</p>

      <div className="mt-8 grid gap-3.5 lg:grid-cols-2">
        <ScrollRow index={0} className="h-full"><Route n="01" title="Answer six questions"
          foot={<p className="min-h-[3.2em] max-w-[44ch] text-meta text-ink-2">
            Your answers stay on this device — nothing is stored or sent.</p>}>
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
        <ScrollRow index={1} className="h-full"><Route n="02" title="Connect a patch"
          foot={<p aria-live="polite" className="min-h-[3.2em] max-w-[44ch] text-meta text-ink-2">{pair?.msg}</p>}>
          <p className="max-w-[38ch] text-sec text-ink-2">Pairs over Bluetooth with a MindMap patch and streams at 1 Hz.</p>
          <Button variant="outline" size="sm" className="mt-5" onClick={pairUp} disabled={busy}>
            {busy ? 'Connecting…' : 'Connect a patch'}
          </Button>
        </Route></ScrollRow>
      </div>

      {/* On a monitor the six questions and the running result sit side by side,
          so the reading appears without the answers scrolling out of view. */}
      <div className="mt-8 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] xl:gap-14 2xl:gap-20 xl:items-start">
        {/* The six sat on the sheet under a single ink rule, which read as the
            start of a section rather than as one form. One Card holds them and
            each question keeps its own hairline as a row rule inside it. */}
        <Card>
          <CardContent className="py-0">
            {ITEMS.map((it,i)=>(
              <ScrollRow key={it.id} index={i}
                className={i === ITEMS.length - 1 ? '[&_fieldset]:border-b-0' : undefined}>
                <Scale legend={`${i+1}. ${it.q}`} low={it.lo} high={it.hi}
                  value={ans[it.id]} onChange={v=>setAns(a=>({...a,[it.id]:v}))}/>
              </ScrollRow>
            ))}
          </CardContent>
        </Card>

      {/* the result region is announced, and its space is reserved so nothing jumps */}
      <Card ref={resultRef} aria-live="polite" data-anchor
        className="mt-9 min-h-[12rem] xl:mt-0 xl:sticky xl:top-[92px]">
        <CardContent>
        {!done && (
          <p className="max-w-[40ch] text-sec text-ink-3">
            Answer all six and your reading appears here, as a sentence first.
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
                  #3d52a0 is accent, #7091e6 is beam. Beam paints the band on a
                  mist track — a fill, which is the only job it has — and the
                  ring never carries the reading on its own, so neither is
                  being asked to clear a text ratio. */}
              <RainbowDial score={r.score} size={288}
                rings={[{ id:'self', name:'Your answers', color:'#3d52a0', glow:'#7091e6',
                          value:r.score, reading:'Six questions' }]}/>
              <div>
                <Headline>{s.pre}<b className={`font-medium ${s.calm ? 'text-calm' : 'text-warn'}`}>{s.word}</b>{s.tail}</Headline>
                <p className="mt-4 max-w-[40ch] text-sec text-ink-3">A patch fills four rings — heart,
                  sweat, temperature and movement.</p>
              </div>
            </div>
            <AllDetail label="See what moved the score">
              {/* The figure heading read "What moved it" directly under a
                  trigger that says the same thing, so only the scale note is
                  left. */}
              <p className="mt-2 max-w-[52ch] text-sec text-ink-3">Right of the line raised the score,
                left of it lowered it.</p>
              <Diverge items={r.contrib.map(c=>({ label:c.item.q.replace(/\?$/,''),
                x: Math.max(-1, Math.min(1, c.raw)) }))}/>
              <p className="mt-6 max-w-[64ch] text-meta text-ink-2">Each answer is measured from its
                middle option, weighted, averaged, and turned into a score out of 100. The patch does the
                same last step using heart rate, sweat, temperature and movement instead of answers, so
                both give one number on one scale.</p>
            </AllDetail>
          </>
        )}
        </CardContent>
      </Card>
      </div>
    </>
  )
}
