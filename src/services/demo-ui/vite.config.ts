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
    port: 5174,
  },
  build: {
    outDir: resolve(__dirname, '../../../dist/demo-ui'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mockups: resolve(__dirname, 'mockups.html'),
        componentPreview: resolve(__dirname, 'component-preview.html')
      }
    }
  }
})
