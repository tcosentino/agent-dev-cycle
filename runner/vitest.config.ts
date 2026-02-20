import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    pool: 'forks',
    testTimeout: 15000,
    // Integration tests need longer timeout
    slowTestThreshold: 60000,
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
})
