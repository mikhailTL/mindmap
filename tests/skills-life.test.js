import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import {
  money, moneyShort, monthlyCost, subsTotals, pauseStatus, budget, compound,
  addMonths, daysBetween, clock12, vehicleStatus, leaveBy, shoppingList,
  checkinSuggest, burnoutResult, refillStatus, visitNote, tripCard, storeKey,
} from '../src/skills/life/logic.js'
import { CATEGORY, TOOLS } from '../src/skills/life/index.js'

describe('money', () => {
  it('formats dollars with cents and commas', () => {
    expect(money(1234.5)).toBe('$1,234.50')
    expect(money(0)).toBe('$0.00')
    expect(money(-12)).toBe('-$12.00')
  })
  it('treats junk as zero', () => { expect(money(NaN)).toBe('$0.00') })
  it('has a short form for tight figures', () => {
    expect(moneyShort(380)).toBe('$380')
    expect(moneyShort(12.5)).toBe('$12.50')
    expect(moneyShort(10547.11, true)).toBe('$10,547')
  })
})

describe('subscriptions', () => {
  it('turns any billing cycle into a monthly cost', () => {
    expect(monthlyCost(12, 'monthly')).toBe(12)
    expect(monthlyCost(120, 'yearly')).toBe(10)
    expect(monthlyCost(3, 'weekly')).toBeCloseTo(13, 5)   // 3 x 52 / 12
    expect(monthlyCost('abc', 'monthly')).toBe(0)
  })
  it('totals month and year and flags the ones not used this month', () => {
    const r = subsTotals([
      { id:'a', price:10, cycle:'monthly', used:'week' },
      { id:'b', price:60, cycle:'yearly',  used:'unsure' },
      { id:'c', price:5,  cycle:'monthly', used:'not-month' },
    ])
    expect(r.monthly).toBeCloseTo(20, 5)
    expect(r.yearly).toBeCloseTo(240, 5)
    expect(r.flagged).toEqual(['b', 'c'])
    expect(r.flaggedYearly).toBeCloseTo(120, 5)
  })
})

describe('24-hour pause', () => {
  const H = 3600e3
  it('is not ready before 24 hours and says how long is left', () => {
    const s = pauseStatus(0, 18.5 * H)
    expect(s.ready).toBe(false)
    expect(s.left).toBe('5 h 30 min')
  })
  it('is ready at 24 hours', () => { expect(pauseStatus(0, 24 * H).ready).toBe(true) })
  it('says under a minute rather than 0 min', () => { expect(pauseStatus(0, 24 * H - 20e3).left).toBe('under 1 min') })
})

describe('budget', () => {
  it('works out what is left', () => {
    const r = budget([{ amount:400 }, { amount:'50' }], [{ amount:120 }, { amount:80.5 }, { amount:'' }])
    expect(r).toEqual({ income:450, spending:200.5, left:249.5, over:false })
  })
  it('flags spending more than comes in', () => {
    expect(budget([{ amount:100 }], [{ amount:150 }]).over).toBe(true)
  })
})

describe('compound interest', () => {
  it('matches the closed formula, monthly compounding, deposits at month end', () => {
    expect(compound({ start:1000, monthly:0, rate:6, years:10 }).total).toBeCloseTo(1819.40, 2)
    const r = compound({ start:0, monthly:50, rate:6, years:10 })
    expect(r.total).toBeCloseTo(8193.97, 2)
    expect(r.contributed).toBe(6000)
    expect(r.interest).toBeCloseTo(2193.97, 2)
  })
  it('handles a zero rate without dividing by zero', () => {
    const r = compound({ start:100, monthly:10, rate:0, years:2 })
    expect(r.total).toBe(340)
    expect(r.interest).toBe(0)
  })
  it('gives one row per year, the last equal to the total', () => {
    const r = compound({ start:500, monthly:25, rate:5, years:4 })
    expect(r.byYear).toHaveLength(4)
    expect(r.byYear[3].value).toBeCloseTo(r.total, 8)
    expect(r.byYear[0].contributed).toBe(800)
  })
  it('clamps silly inputs', () => {
    const r = compound({ start:-5, monthly:'x', rate:-3, years:500 })
    expect(r.byYear.length).toBe(50)
    expect(r.total).toBe(0)
  })
})

describe('dates', () => {
  it('adds months and clamps to the last day', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-10-17', 6)).toBe('2027-04-17')
  })
  it('counts whole days', () => {
    expect(daysBetween('2026-10-17', '2026-10-24')).toBe(7)
    expect(daysBetween('2026-10-17', '2026-10-10')).toBe(-7)
  })
})

describe('vehicle upkeep', () => {
  const today = '2026-10-17'
  it('is unset with nothing logged', () => {
    expect(vehicleStatus({}, { today }).state).toBe('unset')
  })
  it('is due by date', () => {
    const s = vehicleStatus({ lastDate:'2026-03-01', everyMonths:6 }, { today })
    expect(s.state).toBe('due')
    expect(s.nextDate).toBe('2026-09-01')
  })
  it('is due by miles even when the date is fine', () => {
    const s = vehicleStatus({ lastDate:'2026-09-01', everyMonths:6, lastMiles:30000, everyMiles:5000 },
      { today, miles:35200 })
    expect(s.state).toBe('due')
    expect(s.nextMiles).toBe(35000)
  })
  it('is soon within 30 days or 500 miles', () => {
    expect(vehicleStatus({ lastDate:'2026-05-01', everyMonths:6 }, { today }).state).toBe('soon')
    expect(vehicleStatus({ lastMiles:30000, everyMiles:5000 }, { today, miles:34600 }).state).toBe('soon')
  })
  it('is ok otherwise', () => {
    expect(vehicleStatus({ lastDate:'2026-10-01', everyMonths:6 }, { today }).state).toBe('ok')
  })
})

describe('transit', () => {
  it('works out when to leave', () => {
    expect(leaveBy('08:00', 35, 10)).toBe('07:15')
    expect(leaveBy('00:20', 30, 5)).toBe('23:45')
  })
  it('returns empty for a bad time', () => { expect(leaveBy('', 10, 5)).toBe('') })
  it('shows times the US way', () => {
    expect(clock12('00:05')).toBe('12:05 AM')
    expect(clock12('12:00')).toBe('12:00 PM')
    expect(clock12('23:45')).toBe('11:45 PM')
    expect(clock12('x')).toBe('')
  })
  it('writes a trip card', () => {
    const t = tripCard({ from:'Home', to:'Library', arrive:'16:00', minutes:25, buffer:10, line:'Route 6', stop:'Main St' })
    expect(t).toContain('Arrive by 4:00 PM. Leave by 3:25 PM.')
    expect(t).toContain('Route 6')
  })
})

describe('meal plan shopping list', () => {
  it('merges ingredients across the week and counts meals', () => {
    const recipes = {
      oats: { ingredients:[['Rolled oats', '1/2 cup'], ['Milk', '1/2 cup']] },
      wrap: { ingredients:[['Tortillas', '1'], ['Milk', '1 splash']] },
    }
    const list = shoppingList(['oats', 'wrap', 'oats', null, ''], recipes)
    expect(list.find(i => i.name === 'Rolled oats')).toEqual({ name:'Rolled oats', uses:['1/2 cup', '1/2 cup'] })
    expect(list.find(i => i.name === 'Milk').uses).toHaveLength(3)
    expect(list.map(i => i.name)).toEqual(['Milk', 'Rolled oats', 'Tortillas'])
  })
})

describe('stress check-in', () => {
  it('suggests exercises for the parts that are tight, no repeats', () => {
    expect(checkinSuggest(['jaw', 'shoulders'])).toEqual(['jaw', 'shoulders'])
    expect(checkinSuggest(['chest', 'breath'])).toEqual(['breathing'])
    expect(checkinSuggest([])).toEqual(['ground'])
  })
  it('scores the burnout signs in three bands, never a diagnosis', () => {
    expect(burnoutResult([0, 0, 1, 0, 0, 1, 0, 0]).level).toBe('low')
    expect(burnoutResult([1, 1, 1, 1, 1, 0, 0, 0]).level).toBe('some')
    expect(burnoutResult([2, 2, 2, 1, 1, 1, 1, 0]).level).toBe('high')
    expect(burnoutResult([0, null]).complete).toBe(false)
  })
})

describe('medicines', () => {
  it('reads the refill date', () => {
    expect(refillStatus('', '2026-10-17').state).toBe('unset')
    expect(refillStatus('2026-10-15', '2026-10-17')).toEqual({ state:'overdue', days:-2 })
    expect(refillStatus('2026-10-22', '2026-10-17')).toEqual({ state:'soon', days:5 })
    expect(refillStatus('2026-11-30', '2026-10-17').state).toBe('ok')
  })
})

describe('appointment note', () => {
  it('writes only the parts filled in', () => {
    const t = visitNote({ reason:'Knee pain', started:'2 weeks ago', worse:'', tried:'Ice', questions:['What could cause this?'] })
    expect(t).toContain('Reason: Knee pain')
    expect(t).toContain('Started: 2 weeks ago')
    expect(t).not.toContain('Worse')
    expect(t).toContain('- What could cause this?')
  })
})

describe('contract', () => {
  it('names the category and four tools with unique prefixed ids', () => {
    expect(CATEGORY).toMatchObject({ id:'life', title:'Life', sub:'Wellness' })
    expect(TOOLS.map(t => t.id)).toEqual(['life-home', 'life-money', 'life-stress', 'life-health'])
    for (const t of TOOLS) {
      expect(typeof t.title).toBe('string')
      expect(typeof t.line).toBe('string')
      expect(typeof t.family).toBe('string')
      expect(typeof t.icon).toBe('function')
      expect(typeof t.Component).toBe('function')
      expect(storeKey(t.id)).toBe('mindmap.skills.' + t.id)
    }
  })
  it('every tool renders with no storage and no dashes in its words', () => {
    for (const t of TOOLS) {
      const html = renderToString(React.createElement(t.Component, { onExit: () => {} }))
      expect(html.length).toBeGreaterThan(500)
      expect(html).not.toMatch(/[–—]/)
    }
  })
})

import { interestQuiz } from '../src/skills/life/logic.js'

describe('interest quiz', () => {
  const q = interestQuiz()
  it('has three questions, each with exactly one right answer', () => {
    expect(q).toHaveLength(3)
    for (const it of q) expect(it.options.filter(o => o.ok)).toHaveLength(1)
  })
  it('uses the monthly compounding formula for the right answers', () => {
    const right = q.map(it => it.options.find(o => o.ok).value)
    expect(right[0]).toBeCloseTo(100 * Math.pow(1 + 0.05 / 12, 120), 2)
    expect(right[1]).toBeCloseTo(25 * (Math.pow(1 + 0.05 / 12, 120) - 1) / (0.05 / 12), 2)
    expect(right[2]).toBeCloseTo(500 * Math.pow(1 + 0.24 / 12, 24), 2)
  })
  it('offers simple interest as the tempting wrong answer', () => {
    expect(q[0].options.some(o => !o.ok && Math.abs(o.value - 150) < 0.001)).toBe(true)
    expect(q[2].options.some(o => !o.ok && Math.abs(o.value - 740) < 0.001)).toBe(true)
  })
  it('states its assumptions', () => {
    for (const it of q) expect(it.why).toMatch(/monthly|added/i)
  })
})

import { AID_CHECK, FIRST_AID } from '../src/skills/life/health.jsx'

describe('first-aid check', () => {
  it('asks one question per first-aid card, each with one right answer', () => {
    expect(AID_CHECK.map(q => q.id).sort()).toEqual(Object.keys(FIRST_AID).sort())
    for (const q of AID_CHECK) expect(q.options.filter(o => o.ok)).toHaveLength(1)
  })
  it('says when to get help in every answer, with no dashes', () => {
    for (const q of AID_CHECK) {
      expect(q.why).toMatch(/emergency number|help called|doctor/i)
      expect(q.prompt + q.why + q.options.map(o => o.text).join(' ')).not.toMatch(/[–—]/)
    }
  })
  it('never teaches the unsafe moves as right', () => {
    const right = AID_CHECK.map(q => q.options.find(o => o.ok).text.toLowerCase()).join(' ')
    expect(right).not.toMatch(/ice straight|butter|tilt|wait/)
  })
})
