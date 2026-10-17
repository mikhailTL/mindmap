/* Copies MediaPipe's vision runtime out of node_modules into public/, so the
   Mental Mirror loads it from this origin rather than a CDN (school wifi often
   blocks those). Runs before dev and build; public/mediapipe is git-ignored. */
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const src = join(root, 'node_modules/@mediapipe/tasks-vision/wasm')
const dst = join(root, 'public/mediapipe/wasm')
if (!existsSync(src)) { console.error('mediapipe-wasm: @mediapipe/tasks-vision is not installed'); process.exit(1) }
mkdirSync(dst, { recursive: true })
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) {
  cpSync(join(src, f), join(dst, f))
}
console.log('mediapipe-wasm: runtime copied to public/mediapipe/wasm')
