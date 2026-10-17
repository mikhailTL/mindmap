/* The owner's temporary in-browser editor. Off for everyone by default.
 *
 * Turn on:  add ?edit=1 to the address, before or after the #, e.g.
 *           https://mindmappaitent.vercel.app/?edit=1#/site  or  …/#/site?edit=1
 *           or press Alt+Shift+E on any page.
 * Turn off: the Exit button in the editor bar, or ?edit=off.
 *
 * Nothing it does leaves the browser: edits live in this browser's storage
 * until "Copy prompt" turns them into one set of instructions. */

const KEY = 'mindmap.editor'

function wanted() {
  try {
    /* ?edit=1 may sit before the # or after it (#/site?edit=1); read both
       before the router tidies the hash away. */
    const q = new URLSearchParams(location.search)
    const h = new URLSearchParams((location.hash.split('?')[1]) || '')
    const v = q.has('edit') ? q.get('edit') : h.has('edit') ? h.get('edit') : null
    if (v !== null) {
      if (v === 'off' || v === '0' || v === 'false') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, '1')
    }
    return localStorage.getItem(KEY) === '1'
  } catch { return false }
}

const load = () => import('./editor.js').then(m => m.startEditor()).catch(() => {})

export function bootEditor() {
  if (typeof window === 'undefined') return
  if (wanted()) load()
  addEventListener('keydown', e => {
    if (e.altKey && e.shiftKey && e.code === 'KeyE') {
      e.preventDefault()
      try { localStorage.setItem(KEY, '1') } catch {}
      load()
    }
  })
}
