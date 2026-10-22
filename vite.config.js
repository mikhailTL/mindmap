import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
export default defineConfig({
  plugins:[react()],
  resolve:{ alias:{ '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build:{ target:'es2019', assetsInlineLimit:0 },
  define:{ __APP_VERSION__: JSON.stringify(version) },
})
