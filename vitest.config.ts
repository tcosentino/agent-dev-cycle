import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@agentforge/ui-components': resolve(__dirname, 'packages/ui-components/src'),
      '@agentforge/dataobject': resolve(__dirname, 'packages/dataobject/src'),
      '@agentforge/dataobject-react': resolve(__dirname, 'packages/dataobject-react/src'),
    },
  },
})
