/* The owner's temporary in-browser editor. Off for everyone by default.
 *
 * Turn on:  open the site with ?edit=1 in the address (before the #), e.g.
 *           https://mindmappaitent.vercel.app/?edit=1#/site
 *           or press Alt+Shift+E on any page.
 * Turn off: the Exit button in the editor bar, or ?edit=off.
 *
 * Nothing it does leaves the browser: edits live in this browser's storage
 * until "Copy prompt" turns them into one set of instructions. */

const KEY = 'mindmap.editor'

function wanted() {
  try {
    const q = new URLSearchParams(location.search)
    if (q.has('edit')) {
      const v = q.get('edit')
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
