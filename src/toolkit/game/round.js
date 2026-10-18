/* Pure helpers for quick rounds: one card at a time, pick an answer, see
 * why. An item is { id, prompt, options:[{ id, text, ok, why? }], why? }.
 * Exactly one option should be `ok`; `why` on the item is shown after any
 * pick, `why` on an option only when that option is picked. */

export function rightOption(item) {
  return (item?.options || []).find(o => o.ok) || null
}

/* picks: { [itemId]: optionId } -> { right, total, clean, answered, results } */
export function gradeRound(items = [], picks = {}) {
  const results = items.map(it => {
    const pick = picks[it.id]
    const ok = pick != null && rightOption(it)?.id === pick
    return { id:it.id, pick, ok }
  })
  const right = results.filter(r => r.ok).length
  const answered = results.filter(r => r.pick != null).length
  return { right, total:items.length, answered, clean: items.length > 0 && right === items.length, results }
}

/* Short words for how a round went. Never a judgement of the person. */
export function roundLine(right, total) {
  if (!total) return ''
  if (right === total) return 'Every one right.'
  if (right >= total - 1) return 'Nearly all right. Read why for the one you missed.'
  if (right * 2 >= total) return 'More than half right. Read why for each one.'
  return 'Good practice. Read why for each one.'
}

/* A stable shuffle, so the right answer is not always first and a round
   reads the same way on a reload. */
export function mixOptions(options = [], seed = 1) {
  const a = [...options]
  let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
