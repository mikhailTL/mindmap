import React from 'react'
import { Bluetooth, ClipboardList } from 'lucide-react'
import { Back, Headline, ScoreDial, AllDetail } from './Monitor'
import { Button } from '../ui/button'
import { Scale } from '../ui/radio-scale'
import { Label } from '../ui/misc'
import { FigHead } from '../charts/primitives'
import { Diverge } from '../charts/diverge'
import { ITEMS, score, sentence, connectPatch } from '../lib/engine'

function Route({ icon:Icon, title, children, foot }){
  return (
    <div className="rounded-xs border border-rule p-6 pb-7">
      <div className="flex items-center gap-3">
        <Icon aria-hidden className="size-5 text-accent"/>
        <h2 className="font-display text-row font-bold text-ink">{title}</h2>
      </div>
      <div className="mt-2">{children}</div>
      {foot}
    </div>
  )
}

export function CheckIn({ go }){
  const [ans,setAns] = React.useState({})
  const [pair,setPair] = React.useState(null)
  const [busy,setBusy] = React.useState(false)
  const done = Object.keys(ans).length === ITEMS.length
  const r = done ? score(ans) : null
  const s = r ? sentence(r) : null
  const answered = Object.keys(ans).length

  async function pairUp(){
    setBusy(true); setPair({ ok:null, msg:'Choosing a device…' })
    setPair(await connectPatch()); setBusy(false)
  }
  return (
    <main className="wrap py-9 sm:py-14">
      <Back go={go}/>
      <Label>Live reading</Label>
      <h1 className="mt-3 max-w-[16ch] font-display font-bold text-view text-ink">Take a reading now.</h1>
      <p className="mt-5 max-w-[48ch] text-body leading-[1.5] text-ink-2">The patch and the six questions
        below are scored the same way. Answer them and you get the same number a wearer gets.</p>

      <div className="mt-8 grid gap-3.5 lg:grid-cols-2">
        <Route icon={Bluetooth} title="Connect a patch"
          foot={<p aria-live="polite" className="mt-4 min-h-[3.2em] max-w-[44ch] text-meta text-ink-2">{pair?.msg}</p>}>
          <p className="max-w-[38ch] text-sec text-ink-2">Pairs over Bluetooth with a MindMap patch and streams at 1 Hz.</p>
          <Button variant="outline" size="sm" className="mt-5" onClick={pairUp} disabled={busy}>
            {busy ? 'Connecting…' : 'Connect a patch'}
          </Button>
        </Route>
        <Route icon={ClipboardList} title="Answer six questions"
          foot={<p className="mt-4 min-h-[3.2em] max-w-[44ch] text-meta text-ink-2">
            Your answers stay in this browser. Nothing is stored or sent.</p>}>
          <p className="max-w-[38ch] text-sec text-ink-2">Works with no hardware. Takes about thirty seconds.</p>
          <p className="mt-5 flex min-h-[46px] items-center font-mono text-meta tabular-nums text-ink-3">
            {answered} of {ITEMS.length} answered
          </p>
        </Route>
      </div>

      {/* On a monitor the six questions and the running result sit side by side,
          so the reading appears without the answers scrolling out of view. */}
      <div className="mt-8 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] xl:gap-14 2xl:gap-20 xl:items-start">
        <div className="border-t border-ink">
          {ITEMS.map((it,i)=>(
            <Scale key={it.id} legend={`${i+1}. ${it.q}`} low={it.lo} high={it.hi}
              value={ans[it.id]} onChange={v=>setAns(a=>({...a,[it.id]:v}))}/>
          ))}
        </div>

      {/* the result region is announced, and its space is reserved so nothing jumps */}
      <div aria-live="polite" className="mt-9 min-h-[12rem] border-t border-ink pt-7
        xl:mt-0 xl:sticky xl:top-[92px]">
        {!done && (
          <p className="max-w-[40ch] text-sec text-ink-3">
            Answer all six and your reading appears here, as a sentence first.
          </p>
        )}
        {done && (
          <>
            <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-10">
              <ScoreDial value={r.score} band={s.calm ? 'ok' : 'high'} size={176}/>
              <Headline>{s.pre}<b className={`font-bold ${s.calm ? 'text-calm' : 'text-warn'}`}>{s.word}</b>{s.tail}</Headline>
            </div>
            <AllDetail label="See what moved the score">
              <FigHead title="What moved it" note="Right of the line raised the score, left of it lowered it."/>
              <Diverge items={r.contrib.map(c=>({ label:c.item.q.replace(/\?$/,''),
                x: Math.max(-1, Math.min(1, c.raw)) }))}/>
              <p className="mt-6 max-w-[64ch] text-meta text-ink-2">Each answer is measured from its
                middle option, weighted, averaged, and turned into a score out of 100. The patch does the
                same last step using heart rate, sweat, temperature and movement instead of answers, so
                both give one number on one scale.</p>
            </AllDetail>
          </>
        )}
      </div>
      </div>
    </main>
  )
}
