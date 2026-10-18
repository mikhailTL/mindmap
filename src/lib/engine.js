/* Self-report scoring. Same last step as the patch engine — weighted terms
   through a logistic — so both routes land on one scale. */
export const ITEMS = [
  { id:'tension', w:1.0, q:'How tense does your body feel right now?',
    lo:'Loose',       hi:'Very tight',   up:'how tense your body feels',       dn:'how loose your body feels' },
  { id:'edge',    w:1.1, q:'How on edge do you feel?',
    lo:'Settled',     hi:'Very on edge', up:'how on edge you feel',            dn:'how settled you feel' },
  { id:'sleep',   w:0.9, q:'How was last night compared with your usual?',
    lo:'Better',      hi:'Much worse',   up:'last night’s sleep',              dn:'last night’s sleep' },
  { id:'energy',  w:0.8, q:'How is your energy right now?',
    lo:'Full',        hi:'Empty',        up:'how low your energy is',          dn:'how much energy you have' },
  { id:'focus',   w:0.8, q:'How hard is it to hold your focus?',
    lo:'Easy',        hi:'Very hard',    up:'how hard focusing is',            dn:'how easily you are focusing' },
  { id:'demand',  w:1.0, q:'How much has today asked of you so far?',
    lo:'Very little', hi:'A great deal', up:'how much today has asked of you', dn:'how light today has been' },
  { id:'worry',   w:1.0, q:'How much are worries running through your head?',
    lo:'Quiet',       hi:'Nonstop',      up:'how much you are worrying',       dn:'how quiet your head is' },
  { id:'snap',    w:0.8, q:'How easily could small things annoy you right now?',
    lo:'Not at all',  hi:'Very easily',  up:'how easily things annoy you',     dn:'how patient you feel' },
  { id:'body',    w:0.7, q:'Any headache, stomach ache or racing heart right now?',
    lo:'None',        hi:'A lot',        up:'how your body feels',             dn:'how calm your body feels' },
  { id:'support', w:0.7, q:'How alone do you feel with what is going on?',
    lo:'Well backed', hi:'Very alone',   up:'how alone you feel',              dn:'how supported you feel' },
]
const SUMW = ITEMS.reduce((a,b)=>a+b.w,0)
const K = 2.4

export function score(ans){
  const contrib = ITEMS.map(it=>({ item:it, raw: it.w*((ans[it.id]-2)/2) }))
  const S = contrib.reduce((a,c)=>a+c.raw,0) / SUMW
  return { S, score: Math.round(100/(1+Math.exp(-K*S))), contrib }
}
export function band(n){
  if(n<35) return { key:'low',   word:'easier than usual' }
  if(n<58) return { key:'usual', word:'in your usual range' }
  if(n<73) return { key:'up',    word:'a little high' }
  return          { key:'high',  word:'high' }
}
/* One sentence, then the number. Never the other way round. */
export function sentence(r){
  const b = band(r.score)
  const top = [...r.contrib].sort((a,c)=>Math.abs(c.raw)-Math.abs(a.raw))[0]
  const calm = b.key==='usual' || b.key==='low'
  const verb = b.key==='usual' ? 'sitting' : 'running'
  const lead = { pre:`Right now you are ${verb} `, word:b.word, calm }
  const tail = Math.abs(top.raw)<0.25
    ? '. Nothing you answered stands out on its own.'
    : `. The biggest single part of that is ${top.raw>0?top.item.up:top.item.dn}.`
  return { ...lead, tail }
}

/* Nordic UART — the service the MindMap firmware advertises. */
const UART = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
export async function connectPatch(){
  if(!navigator.bluetooth) return { ok:false, msg:
    'This browser cannot open a Bluetooth connection from inside an embedded page. Open the site directly in Chrome on a computer, or use the survey below.' }
  try{
    const d = await navigator.bluetooth.requestDevice({ filters:[{ services:[UART] }] })
    await d.gatt.connect()
    return { ok:true, msg:`Connected to ${d.name||'the patch'}. Streaming at 1 Hz.` }
  }catch(e){
    return { ok:false, msg: e?.name==='NotFoundError'
      ? 'No patch was selected. The survey below works without one.'
      : `Could not connect: ${e?.message||'unknown'}. The survey below works without a patch.` }
  }
}
