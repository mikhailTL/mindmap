import React from 'react'
import { Back } from './Monitor'
import { Label } from '../ui/misc'
import { Spark } from '../charts/primitives'
import { DATA } from '../lib/assets'

/* Clinical vernacular: dense grid, tabular numerals, units rendered, and
   direction carried by a glyph and weight as well as by colour. */
const ROWS = [
  { id:'3907', g:'G12', idx:86, d:  1, z:'+2.9', w:'1,412', a:'97%', c:'Full · Mar 4' },
  { id:'8241', g:'G11', idx:74, d: 11, z:'+2.1', w:'1,388', a:'94%', c:'Full · Mar 11' },
  { id:'5512', g:'G10', idx:58, d: 16, z:'+1.6', w:'1,401', a:'99%', c:'Summary · Jan 22' },
  { id:'1184', g:'G10', idx:81, d: -6, z:'+2.4', w:'1,370', a:'91%', c:'Full · Feb 2' },
  { id:'7736', g:'G12', idx:63, d:  4, z:'+1.8', w:'1,395', a:'96%', c:'Full · Apr 9' },
  { id:'6053', g:'G11', idx:71, d: -3, z:'+2.0', w:'1,410', a:'98%', c:'Full · Feb 18' },
]
/* A scanning posture on a large screen: the header stays put under the app bar,
   and the row under the pointer lifts. Hover is guarded — it means nothing on touch. */
const TH = 'whitespace-nowrap border-b border-rule bg-paper pb-3.5 pr-4 text-left font-mono ' +
  'text-label font-normal uppercase text-ink-3 xl:sticky xl:top-[76px] xl:z-10 xl:pt-3.5'
const TD = 'border-b border-rule py-3.5 pr-4 align-middle'
const TR = 'transition-colors duration-100 [@media(hover:hover)]:hover:bg-sage/60'

export function Pro({ go }){
  return (
    <main className="wrap py-9 sm:py-14">
      <Back go={go}/>
      <div className="grid gap-2 border-b border-ink pb-5">
        <Label>Triage · 8 consented · 0 suppressed</Label>
        <h1 className="font-display font-bold text-[clamp(1.875rem,3.4vw,2.75rem)] leading-[1.05] tracking-tight text-ink">
          Caseload by seven-day velocity
        </h1>
      </div>
      <p className="max-w-[70ch] py-4 text-sec text-ink-2">Ordered by change in the seven-day mean index,
        not by absolute score. A student sitting high and flat is already known; a student climbing fast is not.</p>
      <div className="-mx-[22px] overflow-x-auto px-[22px] sm:mx-0 sm:px-0">
        <table className="w-full border-collapse text-meta">
          <caption className="sr-only">Consented students ordered by seven-day change in mean stress index</caption>
          <thead><tr>
            {['Student','Grade','Trend','Index','Δ7d','z','Windows','Adherence','Consent'].map(h=>
              <th key={h} scope="col" className={TH}>{h}</th>)}
          </tr></thead>
          <tbody>
            {ROWS.map(r=>(
              <tr key={r.id} className={TR} tabIndex={0}>
                <th scope="row" className={`${TD} font-normal font-mono tabular-nums text-ink`}>{r.id}</th>
                <td className={`${TD} font-mono tabular-nums`}>{r.g}</td>
                <td className={TD}><Spark data={DATA.pro[r.id]} className="!mt-0 h-6 w-[78px]"/></td>
                <td className={`${TD} font-mono tabular-nums`}>
                  <b className="text-[1.3125rem] font-medium">{r.idx}</b></td>
                <td className={`${TD} whitespace-nowrap font-mono font-medium tabular-nums
                  ${r.d>0?'text-warn':'text-calm'}`}>{r.d>0?'▲':'▼'} {r.d>0?'+':'−'}{Math.abs(r.d)}</td>
                <td className={`${TD} font-mono tabular-nums`}>{r.z}</td>
                <td className={`${TD} font-mono tabular-nums`}>{r.w}</td>
                <td className={`${TD} font-mono tabular-nums`}>{r.a}</td>
                <td className={`${TD} whitespace-nowrap`}>{r.c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-9 grid border-t border-rule lg:grid-cols-3 2xl:gap-4">
        {[['Scoring','60-second windows at 30-second hop. Robust z against a per-student 14-day median and MAD, mapped through a logistic. No population norms.'],
          ['Confounds','Motion above 0.35 g damps the score; a sustained temperature rise with a flat HRV response is held back as probable illness.'],
          ['Suppression','Cohorts under five return nothing. Suppression is applied in the database, so no interface option can lift it.']
        ].map(([h,p],i)=>(
          <div key={h} className={`border-b border-rule py-5 lg:border-b-0 lg:border-l lg:px-6
            ${i===0?'lg:border-l-0 lg:pl-0':''}`}>
            <h2 className="lab font-normal">{h}</h2>
            <p className="mt-2 text-meta text-ink-2">{p}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 max-w-[70ch] text-meta text-ink-2">Summary-consent students appear here as a band,
        never a value. Opening a record writes to the access log the student can read.</p>
    </main>
  )
}
