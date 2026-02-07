import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  appType: 'spa',
  root: __dirname,
  resolve: {
    alias: {
      '@agentforge/ui-components': resolve(__dirname, '../../../packages/ui-components/src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, '../../../dist/agentforge-ui'),
    emptyOutDir: true,
  }
})
