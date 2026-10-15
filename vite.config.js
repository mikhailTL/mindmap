import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
/* The version the About screen shows, read from package.json at build time. */
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
/* The shadcn registry writes `@/lib/utils` into every component it installs.
   Rewriting each import by hand would mean re-doing it on every future add. */
export default defineConfig({
  plugins:[react()],
  resolve:{ alias:{ '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build:{ target:'es2019', assetsInlineLimit:0 },
  define:{ __APP_VERSION__: JSON.stringify(version) },
})
