import { chromium } from 'playwright'
import fs from 'node:fs'
const EXE = process.env.HOME + '/.cache/ms-playwright/chromium-1148/chrome-linux/chrome'
const ROUTES = ['site','patch','without-patch','student','parent','pro','app','app-student',
                'app-parent','app-pro','check','privacy','tour']
const b = await chromium.launch({ executablePath: EXE, args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] })
const c = await b.newContext({ viewport:{width:1280,height:1200} })
const p = await c.newPage()
await p.addInitScript(() => { try{
  localStorage.setItem('mindmap.intro.off','1')
  localStorage.setItem('mindmap.survey', JSON.stringify({v:1,sentAt:null,queuedAt:null,
    visitor:{id:'t',name:'Tester',startedAt:'2026-01-01T00:00:00.000Z'},answers:[]}))
}catch(e){} })
const out = {}
for (const r of ROUTES) {
  await p.goto(`http://127.0.0.1:4173/#/${r}`, { waitUntil:'load' })
  await p.waitForTimeout(900)
  await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(s=>setTimeout(s,40))} })
  await p.waitForTimeout(600)
  /* Paragraph prose only, and nothing is punctuated on its way out.
     A heading is a label and a list item is often a fragment; appending a
     full stop to either invents a sentence and drives the words-per-sentence
     term of every readability formula down. What is measured here is what a
     visitor reads in continuous prose, with the sentences the writer wrote. */
  out[r] = await p.evaluate(() => {
    const main = document.querySelector('main') || document.body
    const bits = []
    main.querySelectorAll('p').forEach(el => {
      if (el.querySelector('p')) return
      const t = (el.innerText || '').replace(/[ \t\n\r]+/g, ' ').trim()
      if (/[.!?]$/.test(t) && t.split(' ').length >= 4) bits.push(t)
    })
    return bits.join(' ')
  })
  console.log(r, out[r].length)
}
fs.writeFileSync(process.env.HOME + '/pw/text.json', JSON.stringify(out, null, 1))
await b.close()
