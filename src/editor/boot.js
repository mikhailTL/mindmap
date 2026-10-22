// Loads the in-page editor when ?edit=1 is in the address (before or after the #) or Alt+Shift+E is pressed.
// ?edit=off turns it off. It is off by default.
const KEY = 'mindmap.editor'

function wanted() {
  try {
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
