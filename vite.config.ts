import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // SPA fallback - serve index.html for all routes
  appType: 'spa',
  server: {
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
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'component-preview': resolve(__dirname, 'component-preview.html'),
        mockups: resolve(__dirname, 'mockups.html'),
        'project-viewer': resolve(__dirname, 'project-viewer.html')
      }
    }
  }
})
