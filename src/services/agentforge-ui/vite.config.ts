import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
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
        bypass(req) {
          // Don't proxy TypeScript/JavaScript files - let Vite handle them
          if (req.url?.endsWith('.ts') || req.url?.endsWith('.tsx') ||
              req.url?.endsWith('.js') || req.url?.endsWith('.jsx')) {
            return req.url
          }
        }
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
