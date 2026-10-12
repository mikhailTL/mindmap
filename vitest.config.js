import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

/* The app's vite.config.js loads the React plugin, which these tests never
   need: everything under tests/ exercises pure modules, no JSX and no DOM. A
   separate config keeps the suite fast and keeps a change to the build config
   from changing what the tests run against. The `@` alias is mirrored because
   shadcn-installed modules import through it. */
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    reporters: ['default'],
  },
})
