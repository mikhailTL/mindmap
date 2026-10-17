/* The owner's temporary editor (see boot.js for how it turns on).
 *
 * Plain DOM, no React: it sits on top of the live site, so it never changes
 * how the site renders for anyone who has not turned it on.
 *
 * Select mode: hover outlines an element, click selects it (the click does
 * not reach the site, so links and buttons do not fire). Double-click any
 * text to edit the words in place. The panel changes size, weight, width,
 * spacing, alignment and position, hides an element, records a reorder, and
 * takes a free note. Every change is stored per page in localStorage, shown
 * live, re-applied when you come back to a page, and "Copy prompt" turns the
 * lot into one instruction list with the exact current text of each element,
 * so the changes can be found in the source and made for real. */

const STORE = 'mindmap.editor.changes'
const FSTORE = 'mindmap.editor.features'
const FLAG = 'mindmap.editor'
const BLUE = '#0868d4'
const GREEN = '#157446'

const css = `
.mmx-root, .mmx-root * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
.mmx-box { position: fixed; pointer-events: none; z-index: 2147483000; border-radius: 4px; }
.mmx-hover { border: 2px dashed ${GREEN}; background: rgba(21,116,70,0.06); }
.mmx-sel { border: 2px solid ${BLUE}; box-shadow: 0 0 0 4px rgba(8,104,212,0.15); }
.mmx-tag { position: absolute; left: -2px; top: -22px; background: ${BLUE}; color: #fff; font-size: 11px; line-height: 20px; padding: 0 6px; border-radius: 4px 4px 4px 0; white-space: nowrap; }
.mmx-hover .mmx-tag { background: ${GREEN}; }
.mmx-bar { position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); z-index: 2147483600; display: flex; align-items: center; gap: 6px; padding: 8px; background: #0d2b1e; color: #fff; border-radius: 14px; box-shadow: 0 12px 40px rgba(0,0,0,0.35); font-size: 13px; max-width: calc(100vw - 20px); flex-wrap: wrap; justify-content: center; }
.mmx-bar .mmx-count { padding: 0 8px; opacity: 0.9; white-space: nowrap; }
.mmx-btn { appearance: none; border: 1px solid rgba(255,255,255,0.25); background: transparent; color: inherit; font-size: 13px; padding: 7px 11px; border-radius: 9px; cursor: pointer; white-space: nowrap; }
.mmx-btn:hover { background: rgba(255,255,255,0.12); }
.mmx-btn.mmx-primary { background: #3ecf9a; color: #0d2b1e; border-color: #3ecf9a; font-weight: 600; }
.mmx-btn.mmx-on { background: #fff; color: #0d2b1e; }
.mmx-panel { position: fixed; top: 76px; right: 16px; width: 292px; max-height: calc(100vh - 160px); overflow: auto; z-index: 2147483500; background: #fff; color: #0d2b1e; border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,0.25); font-size: 13px; }
.mmx-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #e3ede7; cursor: move; user-select: none; }
.mmx-head b { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mmx-sec { padding: 10px 12px; border-bottom: 1px solid #eef3f0; }
.mmx-sec:last-child { border-bottom: 0; }
.mmx-label { font-size: 11px; color: #426a58; margin-bottom: 6px; }
.mmx-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.mmx-panel .mmx-btn { border-color: #c2d7ca; color: #0d2b1e; padding: 5px 9px; }
.mmx-panel .mmx-btn:hover { background: #e3ede7; }
.mmx-panel .mmx-btn.mmx-on { background: #0d2b1e; color: #fff; }
.mmx-num { width: 64px; padding: 5px 6px; border: 1px solid #c2d7ca; border-radius: 8px; font-size: 13px; color: #0d2b1e; }
.mmx-note { width: 100%; min-height: 64px; padding: 7px 8px; border: 1px solid #c2d7ca; border-radius: 8px; font-size: 13px; resize: vertical; color: #0d2b1e; }
.mmx-snip { color: #2a5744; font-size: 12px; margin-top: 4px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.mmx-modal { position: fixed; inset: 0; z-index: 2147483700; background: rgba(13,43,30,0.45); display: grid; place-items: center; padding: 20px; }
.mmx-card { width: min(760px, 100%); max-height: 86vh; display: flex; flex-direction: column; background: #fff; color: #0d2b1e; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }
.mmx-card textarea { flex: 1; min-height: 340px; margin: 0 14px; padding: 10px; border: 1px solid #c2d7ca; border-radius: 10px; font: 12.5px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; color: #0d2b1e; }
.mmx-card .mmx-btn { border-color: #c2d7ca; color: #0d2b1e; }
.mmx-list { overflow: auto; padding: 0 14px; }
.mmx-item { padding: 9px 0; border-bottom: 1px solid #eef3f0; display: flex; gap: 10px; align-items: flex-start; }
.mmx-item div { flex: 1; font-size: 13px; }
.mmx-toast { position: fixed; left: 50%; bottom: 74px; transform: translateX(-50%); z-index: 2147483650; background: ${GREEN}; color: #fff; padding: 8px 14px; border-radius: 10px; font-size: 13px; }
[data-mmx-editing="1"] { outline: 2px solid ${BLUE} !important; outline-offset: 3px; cursor: text !important; }
`

/* ── store ───────────────────────────────────────────────────────────────── */

const loadChanges = () => { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {} } catch { return {} } }
const saveChanges = c => { try { localStorage.setItem(STORE, JSON.stringify(c)) } catch {} }
const loadFeatures = () => { try { return JSON.parse(localStorage.getItem(FSTORE) || '{}') || {} } catch { return {} } }
const saveFeatures = f => { try { localStorage.setItem(FSTORE, JSON.stringify(f)) } catch {} }

/* ── describing an element ──────────────────────────────────────────────── */

const route = () => (location.hash || '#/site').replace(/^#\/?/, '') || 'site'
const clean = s => String(s || '').replace(/\s+/g, ' ').trim()
const textOf = el => clean(el.innerText || el.textContent)
const short = (s, n = 90) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
const px = v => Math.round(parseFloat(v) || 0)

const KIND = { H1: 'main heading', H2: 'section heading', H3: 'sub-heading', H4: 'small heading', P: 'paragraph',
  BUTTON: 'button', A: 'link', IMG: 'photo', svg: 'drawing', SVG: 'drawing', LI: 'list item', UL: 'list', OL: 'list',
  SPAN: 'text', FIGURE: 'figure', SECTION: 'section', DT: 'card title', DD: 'card text', LABEL: 'label', TABLE: 'table',
  INPUT: 'field', VIDEO: 'video', DIV: 'block', MAIN: 'page body', HEADER: 'header', FOOTER: 'footer', NAV: 'menu' }
const kindOf = el => KIND[el.tagName] || KIND[el.tagName.toUpperCase()] || el.tagName.toLowerCase()

function pathOf(el) {
  const root = document.getElementById('root') || document.body
  const parts = []
  for (let n = el; n && n !== root && n.nodeType === 1; n = n.parentElement) {
    const tag = n.tagName.toLowerCase()
    let i = 1
    for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++
    parts.unshift(`${tag}:nth-of-type(${i})`)
  }
  return '#root > ' + parts.join(' > ')
}

function sectionOf(el) {
  const sec = el.closest('section, header, footer, nav, [role=dialog]')
  if (!sec) return ''
  if (sec.tagName === 'HEADER') return 'Top bar'
  if (sec.tagName === 'FOOTER') return 'Footer'
  const label = sec.getAttribute('aria-label')
  const h = sec.querySelector('h1, h2, h3')
  return clean(label || (h && textOf(h)) || '')
}

function pageName() {
  const t = clean(document.title).replace(/\s*[|,].*MindMap.*$/i, '')
  return t || route()
}

/* ── the editor ─────────────────────────────────────────────────────────── */

export function startEditor() {
  if (window.__mmxEditor) { window.__mmxEditor.show(); return }

  const changes = loadChanges()
  /* Feature requests: instructions about functionality for a page, a section
     or one element. They go into the prompt as instructions and are never
     shown on, or written into, the site's own text. */
  const features = loadFeatures()
  let featScope = 'element'
  let selectOn = true, sel = null, hoverEl = null, editing = null
  const ui = document.createElement('div')
  ui.className = 'mmx-root'
  ui.setAttribute('data-mmx', '1')
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  document.body.appendChild(ui)

  const hoverBox = mk('div', 'mmx-box mmx-hover'); hoverBox.style.display = 'none'
  const hoverTag = mk('span', 'mmx-tag'); hoverBox.appendChild(hoverTag)
  const selBox = mk('div', 'mmx-box mmx-sel'); selBox.style.display = 'none'
  const selTag = mk('span', 'mmx-tag'); selBox.appendChild(selTag)
  const bar = mk('div', 'mmx-bar')
  const panel = mk('div', 'mmx-panel'); panel.style.display = 'none'
  ui.append(hoverBox, selBox, panel, bar)

  function mk(tag, cls, text) {
    const e = document.createElement(tag)
    if (cls) e.className = cls
    if (text != null) e.textContent = text
    return e
  }
  function btn(label, on, cls = '') {
    const b = mk('button', 'mmx-btn ' + cls, label)
    b.type = 'button'
    b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); on(e) })
    return b
  }
  const inUI = n => !!(n && n.closest && n.closest('[data-mmx]'))
  const toast = msg => {
    const t = mk('div', 'mmx-toast', msg); ui.appendChild(t); setTimeout(() => t.remove(), 1800)
  }

  /* ── change records ── */
  const keyOf = el => route() + '|' + pathOf(el)

  function record(el) {
    const key = keyOf(el)
    if (!changes[key]) {
      changes[key] = {
        key, route: route(), page: pageName(), section: sectionOf(el), kind: kindOf(el),
        path: pathOf(el), original: short(el.dataset.mmxOriginal || textOf(el), 160),
        width: innerWidth, edits: {}, at: Date.now(),
      }
    }
    el.dataset.mmxKey = key
    return changes[key]
  }

  function setEdit(el, name, from, to) {
    const ch = record(el)
    const prev = ch.edits[name]
    const start = prev ? prev.from : from
    if (to === start || to == null || to === '') delete ch.edits[name]
    else ch.edits[name] = { from: start, to }
    ch.width = innerWidth
    if (!Object.keys(ch.edits).length) delete changes[ch.key]
    saveChanges(changes)
    renderBar()
  }

  /* ── applying visual edits ── */
  function applyStyle(el, ch) {
    const e = ch.edits
    if (e.fontSize) el.style.fontSize = e.fontSize.to + 'px'
    if (e.fontWeight) el.style.fontWeight = e.fontWeight.to
    if (e.width) { el.style.width = e.width.to + 'px'; el.style.maxWidth = 'none' }
    if (e.marginTop) el.style.marginTop = e.marginTop.to + 'px'
    if (e.marginBottom) el.style.marginBottom = e.marginBottom.to + 'px'
    if (e.textAlign) el.style.textAlign = e.textAlign.to
    if (e.translate) el.style.translate = `${e.translate.to.x}px ${e.translate.to.y}px`
    if (e.hidden) el.style.opacity = '0.18'
    if (e.text && document.activeElement !== el && el.childElementCount === 0 && textOf(el) !== e.text.to) {
      el.textContent = e.text.to
    }
  }

  function reapply() {
    const r = route()
    for (const ch of Object.values(changes)) {
      if (ch.route !== r) continue
      let el = null
      try { el = document.querySelector(ch.path) } catch {}
      if (!el) continue
      if (el === editing) continue
      const now = textOf(el)
      const matches = !ch.original || now === ch.original || (ch.edits.text && now === ch.edits.text.to) ||
        now.slice(0, 24) === ch.original.slice(0, 24)
      if (!matches) continue
      el.dataset.mmxKey = ch.key
      if (!el.dataset.mmxOriginal) el.dataset.mmxOriginal = ch.original
      applyStyle(el, ch)
    }
  }

  /* ── hover and selection ── */
  function place(box, tag, el, label) {
    if (!el || !el.isConnected) { box.style.display = 'none'; return }
    const r = el.getBoundingClientRect()
    Object.assign(box.style, { display: 'block', left: r.left - 2 + 'px', top: r.top - 2 + 'px', width: r.width + 4 + 'px', height: r.height + 4 + 'px' })
    tag.textContent = label
    tag.style.top = r.top < 26 ? 'auto' : '-22px'
    tag.style.bottom = r.top < 26 ? '-22px' : 'auto'
  }
  const labelFor = el => {
    const cs = getComputedStyle(el)
    return `${kindOf(el)} · ${px(cs.fontSize)}px · ${Math.round(el.getBoundingClientRect().width)} wide`
  }

  function pickable(n) {
    if (!n || n.nodeType !== 1 || inUI(n)) return null
    if (n === document.body || n === document.documentElement || n.id === 'root') return null
    if (n.closest('svg') && n.tagName.toLowerCase() !== 'svg') n = n.closest('svg')
    /* An inline piece of text (a span inside a heading, say) selects the
       whole heading or paragraph; "Parent" and the panel reach further out. */
    if (/^(SPAN|EM|STRONG|B|I|SMALL|SUP|SUB|BR)$/.test(n.tagName)) {
      const block = n.closest('h1, h2, h3, h4, h5, h6, p, li, button, a, dt, dd, label, td, th, figcaption')
      if (block && !inUI(block)) n = block
    }
    return n
  }

  function onMove(e) {
    if (!selectOn || editing) { hoverBox.style.display = 'none'; return }
    const el = pickable(e.target)
    hoverEl = el
    if (!el || el === sel) { hoverBox.style.display = 'none'; return }
    place(hoverBox, hoverTag, el, labelFor(el))
  }

  function swallow(e) {
    if (!selectOn || inUI(e.target)) return
    if (editing && editing.contains(e.target)) return
    e.preventDefault(); e.stopPropagation()
  }

  function onClick(e) {
    if (!selectOn || inUI(e.target)) return
    if (editing && editing.contains(e.target)) return
    e.preventDefault(); e.stopPropagation()
    if (editing) finishText()
    const el = pickable(e.target)
    if (el) select(el)
  }

  function onDbl(e) {
    if (!selectOn || inUI(e.target)) return
    e.preventDefault(); e.stopPropagation()
    const el = pickable(e.target)
    if (!el) return
    select(el)
    startText(el)
  }

  function select(el) {
    sel = el
    if (!el.dataset.mmxOriginal) el.dataset.mmxOriginal = textOf(el)
    hoverBox.style.display = 'none'
    renderPanel()
    tick()
  }

  function deselect() {
    if (editing) finishText()
    sel = null
    selBox.style.display = 'none'
    panel.style.display = 'none'
  }

  let raf = 0
  function tick() {
    cancelAnimationFrame(raf)
    const loop = () => {
      if (sel) place(selBox, selTag, sel, labelFor(sel))
      raf = requestAnimationFrame(loop)
    }
    loop()
  }

  /* ── text editing ── */
  function startText(el) {
    if (editing) finishText()
    editing = el
    el.dataset.mmxBefore = textOf(el)
    if (!el.dataset.mmxOriginal) el.dataset.mmxOriginal = textOf(el)
    /* plaintext-only stops the browser pasting in its own fonts and inline
       styles, so typed words keep the element's font. */
    el.setAttribute('contenteditable', 'plaintext-only')
    if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true')
    el.setAttribute('data-mmx-editing', '1')
    el.spellcheck = true
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    const s = getSelection(); s.removeAllRanges(); s.addRange(range)
    el.addEventListener('keydown', keyInText)
    el.addEventListener('blur', finishText, { once: true })
    renderPanel()
  }
  function keyInText(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishText() }
    if (e.key === 'Escape') { e.preventDefault(); finishText() }
    e.stopPropagation()
  }
  function finishText() {
    const el = editing
    if (!el) return
    editing = null
    el.removeAttribute('contenteditable')
    el.removeAttribute('data-mmx-editing')
    el.removeEventListener('keydown', keyInText)
    /* Anything the browser wrapped the new words in (font tags, inline
       font-family or colour) is unwrapped, so the site's own type shows. */
    el.querySelectorAll('font, [style]').forEach(n => {
      if (n.tagName === 'FONT') n.replaceWith(...n.childNodes)
      else { n.style.removeProperty('font-family'); n.style.removeProperty('font-size'); n.style.removeProperty('color'); n.style.removeProperty('background-color'); if (!n.getAttribute('style')) n.removeAttribute('style') }
    })
    const to = textOf(el)
    setEdit(el, 'text', el.dataset.mmxOriginal || el.dataset.mmxBefore, to)
    renderPanel()
  }

  /* ── the panel ── */
  function current(el, name) {
    const ch = changes[el.dataset.mmxKey || keyOf(el)]
    return ch && ch.edits[name] ? ch.edits[name].to : null
  }

  function stepper(label, name, read, apply, step) {
    const wrap = mk('div', 'mmx-sec')
    wrap.appendChild(mk('div', 'mmx-label', label))
    const row = mk('div', 'mmx-row')
    const input = mk('input', 'mmx-num')
    input.type = 'number'
    const val = () => { const c = current(sel, name); return c != null ? c : read() }
    input.value = val()
    const set = v => {
      v = Math.max(0, Math.round(v))
      const from = read(true)
      apply(v)
      setEdit(sel, name, from, v)
      input.value = v
    }
    row.append(btn('−', () => set(val() - step)), input, btn('+', () => set(val() + step)), btn('Reset', () => {
      const ch = changes[sel.dataset.mmxKey || keyOf(sel)]
      const orig = ch && ch.edits[name] ? ch.edits[name].from : read()
      apply(orig); setEdit(sel, name, orig, orig); input.value = orig
    }))
    input.addEventListener('change', () => set(+input.value))
    input.addEventListener('keydown', e => e.stopPropagation())
    wrap.appendChild(row)
    return wrap
  }

  /* Values read from the page as it was before any edit to this element. */
  const base = (el, name, live) => {
    const ch = changes[el.dataset.mmxKey || keyOf(el)]
    if (ch && ch.edits[name]) return ch.edits[name].from
    return live()
  }

  function renderPanel() {
    if (!sel) { panel.style.display = 'none'; return }
    const el = sel
    const cs = getComputedStyle(el)
    panel.innerHTML = ''
    panel.style.display = 'block'

    const head = mk('div', 'mmx-head')
    head.appendChild(mk('b', '', kindOf(el)[0].toUpperCase() + kindOf(el).slice(1)))
    head.append(btn('Parent ↑', () => { const p = pickable(el.parentElement); if (p) select(p) }), btn('✕', deselect))
    panel.appendChild(head)
    dragPanel(head)

    const info = mk('div', 'mmx-sec')
    const sec = sectionOf(el)
    info.appendChild(mk('div', 'mmx-label', (sec ? sec + ' · ' : '') + pageName()))
    info.appendChild(mk('div', 'mmx-snip', short(textOf(el) || '(no text)', 140)))
    panel.appendChild(info)

    const words = mk('div', 'mmx-sec')
    words.appendChild(mk('div', 'mmx-label', 'Words'))
    const wr = mk('div', 'mmx-row')
    wr.append(btn(editing === el ? 'Done editing' : 'Edit text', () => (editing === el ? finishText() : startText(el)), editing === el ? 'mmx-on' : ''))
    wr.appendChild(mk('span', 'mmx-label', 'or double-click any text'))
    words.appendChild(wr)
    panel.appendChild(words)

    panel.appendChild(stepper('Text size (px)', 'fontSize',
      live => base(el, 'fontSize', () => px(getComputedStyle(el).fontSize)),
      v => { el.style.fontSize = v + 'px' }, 2))

    const wt = mk('div', 'mmx-sec')
    wt.appendChild(mk('div', 'mmx-label', 'Weight'))
    const wtr = mk('div', 'mmx-row')
    const fromW = base(el, 'fontWeight', () => String(Math.round(+cs.fontWeight / 100) * 100))
    for (const [lab, v] of [['Regular', '400'], ['Medium', '500'], ['Semibold', '600'], ['Bold', '700']]) {
      const on = (current(el, 'fontWeight') || String(Math.round(+cs.fontWeight / 100) * 100)) === v
      wtr.appendChild(btn(lab, () => { el.style.fontWeight = v; setEdit(el, 'fontWeight', fromW, v); renderPanel() }, on ? 'mmx-on' : ''))
    }
    wt.appendChild(wtr)
    panel.appendChild(wt)

    panel.appendChild(stepper('Width (px)', 'width',
      () => base(el, 'width', () => Math.round(el.getBoundingClientRect().width)),
      v => { el.style.width = v + 'px'; el.style.maxWidth = 'none' }, 20))
    panel.appendChild(stepper('Space above (px)', 'marginTop',
      () => base(el, 'marginTop', () => px(getComputedStyle(el).marginTop)),
      v => { el.style.marginTop = v + 'px' }, 4))
    panel.appendChild(stepper('Space below (px)', 'marginBottom',
      () => base(el, 'marginBottom', () => px(getComputedStyle(el).marginBottom)),
      v => { el.style.marginBottom = v + 'px' }, 4))

    const al = mk('div', 'mmx-sec')
    al.appendChild(mk('div', 'mmx-label', 'Align text'))
    const alr = mk('div', 'mmx-row')
    const fromA = base(el, 'textAlign', () => (cs.textAlign === 'start' ? 'left' : cs.textAlign))
    for (const v of ['left', 'center', 'right']) {
      const on = (current(el, 'textAlign') || fromA) === v
      alr.appendChild(btn(v[0].toUpperCase() + v.slice(1), () => { el.style.textAlign = v; setEdit(el, 'textAlign', fromA, v); renderPanel() }, on ? 'mmx-on' : ''))
    }
    al.appendChild(alr)
    panel.appendChild(al)

    const mv = mk('div', 'mmx-sec')
    mv.appendChild(mk('div', 'mmx-label', 'Position: nudge 8 px'))
    const mvr = mk('div', 'mmx-row')
    const nudge = (dx, dy) => {
      const cur = current(el, 'translate') || { x: 0, y: 0 }
      const to = { x: cur.x + dx, y: cur.y + dy }
      el.style.translate = `${to.x}px ${to.y}px`
      const ch = record(el)
      if (to.x === 0 && to.y === 0) delete ch.edits.translate
      else ch.edits.translate = { from: { x: 0, y: 0 }, to }
      if (!Object.keys(ch.edits).length) delete changes[ch.key]
      saveChanges(changes); renderBar()
    }
    mvr.append(btn('←', () => nudge(-8, 0)), btn('↑', () => nudge(0, -8)), btn('↓', () => nudge(0, 8)), btn('→', () => nudge(8, 0)),
      btn('Reset', () => { const c = current(el, 'translate'); if (c) nudge(-c.x, -c.y) }))
    mv.appendChild(mvr)
    const ord = mk('div', 'mmx-row'); ord.style.marginTop = '8px'
    const orderNote = dir => {
      const sib = dir < 0 ? el.previousElementSibling : el.nextElementSibling
      const ch = record(el)
      const prev = ch.edits.order ? ch.edits.order.to : 0
      ch.edits.order = { from: 0, to: prev + dir, next: sib ? short(textOf(sib), 60) : '' }
      if (ch.edits.order.to === 0) delete ch.edits.order
      if (!Object.keys(ch.edits).length) delete changes[ch.key]
      saveChanges(changes); renderBar(); toast(dir < 0 ? 'Recorded: move earlier' : 'Recorded: move later')
    }
    ord.append(btn('Move earlier', () => orderNote(-1)), btn('Move later', () => orderNote(1)))
    mv.appendChild(ord)
    panel.appendChild(mv)

    const hd = mk('div', 'mmx-sec')
    const hidden = !!current(el, 'hidden')
    hd.appendChild(btn(hidden ? 'Keep this element' : 'Remove this element', () => {
      el.style.opacity = hidden ? '' : '0.18'
      setEdit(el, 'hidden', false, !hidden || null)
      renderPanel()
    }, hidden ? 'mmx-on' : ''))
    panel.appendChild(hd)

    const nt = mk('div', 'mmx-sec')
    nt.appendChild(mk('div', 'mmx-label', 'Note for this element (anything else to change)'))
    const ta = mk('textarea', 'mmx-note')
    ta.value = current(el, 'note') || ''
    ta.placeholder = 'e.g. swap this photo, make this a button, shorter line…'
    ta.addEventListener('keydown', e => e.stopPropagation())
    ta.addEventListener('input', () => setEdit(el, 'note', '', ta.value.trim()))
    nt.appendChild(ta)
    panel.appendChild(nt)

    panel.appendChild(featureBox(el))

    const un = mk('div', 'mmx-sec')
    un.appendChild(btn('Undo all changes to this element', () => undoEl(el)))
    panel.appendChild(un)
  }

  function undoEl(el) {
    const key = el.dataset.mmxKey || keyOf(el)
    const ch = changes[key]
    if (ch) {
      for (const p of ['fontSize', 'fontWeight', 'width', 'maxWidth', 'marginTop', 'marginBottom', 'textAlign', 'translate', 'opacity']) el.style[p] = ''
      if (ch.edits.text && el.childElementCount === 0) el.textContent = ch.edits.text.from
      delete changes[key]
      saveChanges(changes)
    }
    renderBar(); renderPanel()
  }

  function dragPanel(handle) {
    handle.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return
      const r = panel.getBoundingClientRect(), sx = e.clientX, sy = e.clientY
      const move = m => {
        panel.style.left = Math.max(4, r.left + m.clientX - sx) + 'px'
        panel.style.top = Math.max(4, r.top + m.clientY - sy) + 'px'
        panel.style.right = 'auto'
      }
      const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up) }
      addEventListener('pointermove', move); addEventListener('pointerup', up)
    })
  }

  /* ── feature requests ── */
  function featKey(scope, el) {
    if (scope === 'page') return route() + '|page'
    if (scope === 'section') return route() + '|section|' + sectionOf(el)
    return route() + '|el|' + pathOf(el)
  }
  function setFeature(scope, el, text) {
    const key = featKey(scope, el)
    text = String(text || '').trim()
    if (!text) delete features[key]
    else features[key] = {
      key, scope, route: route(), page: pageName(), text, at: (features[key] && features[key].at) || Date.now(),
      section: el ? sectionOf(el) : '', kind: el ? kindOf(el) : '',
      original: el ? short(el.dataset.mmxOriginal || textOf(el), 160) : '', path: el && scope === 'element' ? pathOf(el) : '',
    }
    saveFeatures(features)
    renderBar()
  }
  const featureText = (scope, el) => { const f = features[featKey(scope, el)]; return f ? f.text : '' }

  function featureBox(el) {
    const box = mk('div', 'mmx-sec')
    box.style.background = '#f1f7fd'
    box.appendChild(mk('div', 'mmx-label', 'Feature request: an instruction for the build, never added as site text'))
    const row = mk('div', 'mmx-row')
    const sec = el ? sectionOf(el) : ''
    const scopes = [['element', 'This element'], ['section', 'This section'], ['page', 'This page']]
    for (const [v, lab] of scopes) {
      if (v === 'section' && !sec) continue
      row.appendChild(btn(lab, () => { featScope = v; renderPanel() }, featScope === v ? 'mmx-on' : ''))
    }
    if (featScope === 'section' && !sec) featScope = 'element'
    box.appendChild(row)
    const where = mk('div', 'mmx-snip', featScope === 'page' ? 'Applies to the whole page: ' + pageName()
      : featScope === 'section' ? 'Applies to the section: ' + sec : 'Applies to this element only')
    box.appendChild(where)
    const ta = mk('textarea', 'mmx-note')
    ta.style.marginTop = '6px'
    ta.value = featureText(featScope, el)
    ta.placeholder = 'e.g. add a weekly chart here, remove this toggle, make this card open the Toolkit…'
    ta.addEventListener('keydown', e => e.stopPropagation())
    ta.addEventListener('input', () => setFeature(featScope, el, ta.value))
    box.appendChild(ta)
    return box
  }

  function pageNote() {
    modal('Feature request for this page: ' + pageName(), card => {
      const p = mk('p', 'mmx-snip', 'An instruction for what to add, change or remove on this page. It goes into the prompt and is never put on the site as text.')
      p.style.padding = '0 14px 8px'
      card.appendChild(p)
      const ta = mk('textarea')
      ta.style.fontFamily = 'inherit'
      ta.style.minHeight = '180px'
      ta.value = featureText('page', null)
      ta.placeholder = 'e.g. add a short FAQ at the bottom, remove the survey link, add a video of the patch…'
      ta.addEventListener('keydown', e => e.stopPropagation())
      ta.addEventListener('input', () => setFeature('page', null, ta.value))
      card.appendChild(ta)
      const pad = mk('div'); pad.style.height = '14px'; card.appendChild(pad)
      setTimeout(() => ta.focus(), 30)
    })
  }

  /* ── the bar ── */
  function renderBar() {
    const list = Object.values(changes)
    const feats = Object.values(features)
    const pages = new Set(list.map(c => c.route).concat(feats.map(f => f.route))).size
    const total = list.length + feats.length
    bar.innerHTML = ''
    bar.appendChild(mk('span', 'mmx-count', total
      ? `${list.length} edit${list.length === 1 ? '' : 's'}, ${feats.length} feature note${feats.length === 1 ? '' : 's'}, ${pages} page${pages === 1 ? '' : 's'}`
      : 'Editor: click anything to select it'))
    bar.append(
      btn(selectOn ? 'Selecting' : 'Browsing', () => { selectOn = !selectOn; if (!selectOn) deselect(); renderBar() }, selectOn ? 'mmx-on' : ''),
      btn('Page feature note', pageNote),
      btn('All changes', showList),
      btn('Copy prompt', copyPrompt, 'mmx-primary'),
      btn('Clear all', () => {
        if (!total) return
        if (!confirm('Clear every recorded change and feature note? This cannot be undone.')) return
        for (const k of Object.keys(changes)) delete changes[k]
        for (const k of Object.keys(features)) delete features[k]
        saveChanges(changes); saveFeatures(features); location.reload()
      }),
      btn('Exit', exit),
    )
  }

  /* ── the prompt ── */
  function lineFor(ch) {
    const e = ch.edits, out = []
    if (e.text) out.push(`Change the text to: "${e.text.to}"`)
    if (e.fontSize) out.push(`Text size: ${e.fontSize.from}px → ${e.fontSize.to}px`)
    if (e.fontWeight) out.push(`Weight: ${e.fontWeight.from} → ${e.fontWeight.to}`)
    if (e.width) out.push(`Width: ${e.width.from}px → ${e.width.to}px`)
    if (e.marginTop) out.push(`Space above: ${e.marginTop.from}px → ${e.marginTop.to}px`)
    if (e.marginBottom) out.push(`Space below: ${e.marginBottom.from}px → ${e.marginBottom.to}px`)
    if (e.textAlign) out.push(`Align: ${e.textAlign.from} → ${e.textAlign.to}`)
    if (e.translate) {
      const { x, y } = e.translate.to, bits = []
      if (x) bits.push(`${Math.abs(x)}px ${x > 0 ? 'right' : 'left'}`)
      if (y) bits.push(`${Math.abs(y)}px ${y > 0 ? 'down' : 'up'}`)
      out.push(`Move it ${bits.join(' and ')}`)
    }
    if (e.order) {
      const n = Math.abs(e.order.to)
      out.push(`Reorder: move it ${n} place${n === 1 ? '' : 's'} ${e.order.to < 0 ? 'earlier' : 'later'}${e.order.next ? ` (past "${e.order.next}")` : ''}`)
    }
    if (e.hidden) out.push('Remove this element')
    if (e.note) out.push(`Note: ${e.note.to}`)
    return out
  }

  function buildPrompt() {
    const list = Object.values(changes).sort((a, b) => a.route.localeCompare(b.route) || a.at - b.at)
    const feats = Object.values(features)
    if (!list.length && !feats.length) return ''
    const head = [
      'Apply these edits I made in the browser editor to the MindMap website (repo ~/Desktop/mindmap-patient-react).',
      'Each item names the page and section, then "Find" quotes the element\'s text as it is now in the site, so you can grep for it in src. Under it are the changes I made by hand.',
      'Sizes and spacing are CSS px measured at the screen width noted; map them to the nearest Tailwind tokens and keep the layout responsive at 390px too. Keep the site\'s copy rules (plain words, no dashes). If a change cannot be made exactly, make the closest change and tell me.',
      'Text changes are words only: keep each element\'s existing font, weight, colour and any highlighted word styling (for example the green word in a heading) unless a size or weight change is listed for it.',
      'Lines under "Feature requests" are my instructions about functionality to add, change or remove there. Build them; never put their words on the site as text.',
      '',
    ]
    const body = []
    const routes = [...new Set(list.map(c => c.route).concat(feats.map(f => f.route)))].sort()
    const order = { page: 0, section: 1, element: 2 }
    let n = 0
    for (const r of routes) {
      const pf = feats.filter(f => f.route === r).sort((a, b) => order[a.scope] - order[b.scope] || a.at - b.at)
      const pc = list.filter(c => c.route === r)
      body.push(`## ${(pc[0] || pf[0]).page} (#/${r})`)
      if (pf.length) {
        body.push('Feature requests (instructions, not site text):')
        for (const f of pf) {
          const where = f.scope === 'page' ? 'Whole page'
            : f.scope === 'section' ? `Section "${f.section}"`
            : `${f.kind[0].toUpperCase() + f.kind.slice(1)}${f.section ? ` in section "${f.section}"` : ''}, find "${f.original || '(no text)'}"`
          body.push(`- ${where}: ${f.text}`)
        }
        body.push('')
      }
      for (const ch of pc) {
      n++
      const where = ch.section && ch.section !== ch.original ? `Section "${ch.section}", ${ch.kind}` : ch.kind
      body.push(`${n}. ${where[0].toUpperCase() + where.slice(1)}`)
      body.push(`   Find: "${ch.original || '(no text)'}"`)
      for (const l of lineFor(ch)) body.push(`   - ${l}`)
      body.push(`   (edited at ${ch.width}px wide; element: ${ch.path})`)
      body.push('')
      }
    }
    return head.concat(body).join('\n').trim() + '\n'
  }

  function modal(title, build) {
    const m = mk('div', 'mmx-modal')
    m.setAttribute('data-mmx', '1')
    const card = mk('div', 'mmx-card')
    const top = mk('div', 'mmx-head'); top.style.cursor = 'default'
    top.appendChild(mk('b', '', title))
    const close = () => m.remove()
    top.appendChild(btn('Close', close))
    card.appendChild(top)
    build(card, close)
    m.appendChild(card)
    m.addEventListener('click', e => { if (e.target === m) close() })
    ui.appendChild(m)
  }

  async function copyPrompt() {
    if (editing) finishText()
    const text = buildPrompt()
    if (!text) { toast('No changes yet'); return }
    let ok = false
    try { await navigator.clipboard.writeText(text); ok = true } catch {}
    modal(ok ? 'Copied. Paste this into the chat' : 'Copy this into the chat', card => {
      const ta = mk('textarea')
      ta.value = text
      ta.readOnly = true
      card.appendChild(ta)
      const row = mk('div', 'mmx-row'); row.style.padding = '12px 14px'
      row.appendChild(btn('Copy again', async () => {
        try { await navigator.clipboard.writeText(text); toast('Copied') } catch { ta.select(); document.execCommand('copy'); toast('Copied') }
      }, 'mmx-primary'))
      card.appendChild(row)
      if (!ok) { setTimeout(() => { ta.focus(); ta.select() }, 30) }
    })
  }

  function showList() {
    modal('All changes', (card) => {
      const list = mk('div', 'mmx-list')
      const items = Object.values(changes).sort((a, b) => a.route.localeCompare(b.route) || a.at - b.at)
      const fs = Object.values(features).sort((a, b) => a.route.localeCompare(b.route) || a.at - b.at)
      if (!items.length && !fs.length) list.appendChild(mk('p', '', 'No changes yet.'))
      for (const f of fs) {
        const row = mk('div', 'mmx-item')
        const d = mk('div')
        d.appendChild(mk('b', '', `${f.page}: feature note for the ${f.scope === 'page' ? 'page' : f.scope === 'section' ? 'section "' + f.section + '"' : f.kind}`))
        d.appendChild(mk('div', 'mmx-snip', f.text))
        row.appendChild(d)
        row.appendChild(btn('Go', () => { location.hash = '#/' + f.route }))
        row.appendChild(btn('Remove', () => { delete features[f.key]; saveFeatures(features); row.remove(); renderBar() }))
        list.appendChild(row)
      }
      for (const ch of items) {
        const row = mk('div', 'mmx-item')
        const d = mk('div')
        d.appendChild(mk('b', '', `${ch.page}: ${ch.kind}`))
        d.appendChild(mk('div', 'mmx-snip', `"${ch.original}"`))
        d.appendChild(mk('div', 'mmx-snip', lineFor(ch).join(' · ')))
        row.appendChild(d)
        row.appendChild(btn('Go', () => { location.hash = '#/' + ch.route }))
        row.appendChild(btn('Remove', () => { delete changes[ch.key]; saveChanges(changes); row.remove(); renderBar() }))
        list.appendChild(row)
      }
      card.appendChild(list)
      const pad = mk('div'); pad.style.height = '14px'; card.appendChild(pad)
    })
  }

  function exit() {
    try { localStorage.removeItem(FLAG) } catch {}
    deselect()
    ui.style.display = 'none'
    off()
    toast('Editor off. Your changes are kept; Alt+Shift+E turns it back on.')
  }

  /* ── wiring ── */
  const onKey = e => {
    if (e.key === 'Escape' && !editing) deselect()
  }
  let mo = null, moTimer = 0
  const onRoute = () => { deselect(); setTimeout(reapply, 400); setTimeout(reapply, 1400) }

  function on() {
    document.addEventListener('mousemove', onMove, true)
    document.addEventListener('click', onClick, true)
    document.addEventListener('mousedown', swallow, true)
    document.addEventListener('dblclick', onDbl, true)
    document.addEventListener('keydown', onKey, true)
    addEventListener('hashchange', onRoute)
    mo = new MutationObserver(() => { clearTimeout(moTimer); moTimer = setTimeout(reapply, 350) })
    mo.observe(document.getElementById('root') || document.body, { childList: true, subtree: true })
  }
  function off() {
    document.removeEventListener('mousemove', onMove, true)
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('mousedown', swallow, true)
    document.removeEventListener('dblclick', onDbl, true)
    document.removeEventListener('keydown', onKey, true)
    removeEventListener('hashchange', onRoute)
    if (mo) mo.disconnect()
    cancelAnimationFrame(raf)
    hoverBox.style.display = 'none'
  }

  on()
  renderBar()
  setTimeout(reapply, 300)
  window.__mmxEditor = {
    show() { ui.style.display = ''; off(); on(); renderBar() },
    prompt: buildPrompt,
  }
}
