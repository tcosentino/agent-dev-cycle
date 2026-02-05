import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // SPA fallback - serve index.html for all routes
  appType: 'spa',
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
