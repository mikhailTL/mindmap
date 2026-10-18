/* Copies MediaPipe's vision runtime out of node_modules into public/, so the
   Mental Mirror loads it from this origin rather than a CDN (school wifi often
   blocks those). Runs before dev and build; public/mediapipe is git-ignored.
   The package ships its files read-only, so a second run used to fail with
   EACCES trying to overwrite them: an up-to-date copy is now left alone, and
   copies are made writable. */
import { chmodSync, copyFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const src = join(root, 'node_modules/@mediapipe/tasks-vision/wasm')
const dst = join(root, 'public/mediapipe/wasm')
if (!existsSync(src)) { console.error('mediapipe-wasm: @mediapipe/tasks-vision is not installed'); process.exit(1) }
mkdirSync(dst, { recursive: true })
let copied = 0
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) {
  const from = join(src, f), to = join(dst, f)
  let same = false
  try { same = statSync(to).size === statSync(from).size } catch {}
  if (same) continue
  try {
    if (existsSync(to)) { try { chmodSync(to, 0o644) } catch {} }
    copyFileSync(from, to)
  } catch {
    /* A copy left unreadable (wrong owner or mode) cannot be overwritten in
       place; replace it instead. */
    try { unlinkSync(to); copyFileSync(from, to) } catch (e) {
      console.error(`mediapipe-wasm: cannot replace ${to} (${e.code}). Run: sudo rm -rf public/mediapipe && npm run build`)
      process.exit(1)
    }
  }
  try { chmodSync(to, 0o644) } catch {}
  copied++
}
console.log(`mediapipe-wasm: runtime ${copied ? 'copied to' : 'already in'} public/mediapipe/wasm`)
