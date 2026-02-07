import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // SPA fallback - serve index.html for all routes
  appType: 'spa',
  resolve: {
    alias: {
      '@agentforge/ui-components': resolve(__dirname, './packages/ui-components/src')
    }
  },
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
        main: resolve(__dirname, 'src/services/agentforge-ui/index.html'),
        'component-preview': resolve(__dirname, 'src/services/demo-ui/component-preview.html'),
        mockups: resolve(__dirname, 'src/services/demo-ui/mockups.html'),
        demo: resolve(__dirname, 'src/services/demo-ui/index.html')
      }
    }
  }
})
