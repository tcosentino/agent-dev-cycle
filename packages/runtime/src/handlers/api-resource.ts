import type { ModuleTypeHandler, ValidationResult } from '../module-types'
import type { ModuleDefinition, DeploymentArtifacts, TestDefinition } from '../types'

interface ApiResourceConfig {
  // Resource names this module exposes (e.g., ['brands', 'products'])
  resources: string[]

  // Base path for the API (default: '/')
  basePath?: string
}

export const apiResourceHandler: ModuleTypeHandler = {
  type: 'api-resource',

  async validate(module: ModuleDefinition): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    const config = module.config as ApiResourceConfig

    if (!config.resources || config.resources.length === 0) {
      errors.push('api-resource module must define at least one resource')
    }

    if (!module.sourceDir) {
      errors.push('sourceDir is required')
    }

    if (!module.runtime.port) {
      warnings.push('No port specified, defaulting to 3000')
    }

    if (!module.runtime.healthcheck) {
      warnings.push('No healthcheck configured, defaulting to /health')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },

  generateDockerfile(module: ModuleDefinition): string {
    // Generate a standard Dockerfile for API resource modules
    return `# Auto-generated Dockerfile for api-resource module
FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Build if needed
RUN npm run build --if-present

EXPOSE ${module.runtime.port || 3000}

ENV NODE_ENV=production
ENV PORT=${module.runtime.port || 3000}

CMD ["npm", "start"]
`
  },

  getTests(module: ModuleDefinition, artifacts: DeploymentArtifacts): TestDefinition[] {
    const config = module.config as ApiResourceConfig
    const baseUrl = artifacts.url || `http://localhost:${artifacts.port || module.runtime.port || 3000}`
    const basePath = config.basePath || ''

    const tests: TestDefinition[] = []

    // Health check test
    tests.push({
      name: 'Health check',
      type: 'http',
      config: {
        method: 'GET',
        path: `${baseUrl}/health`,
        expect: {
          status: 200,
        },
      },
    })

    // For each resource, test basic CRUD operations
    for (const resource of config.resources) {
      const resourcePath = `${baseUrl}${basePath}/${resource}s`

      // Test: List resources (GET /resources)
      tests.push({
        name: `List ${resource}s`,
        type: 'http',
        config: {
          method: 'GET',
          path: resourcePath,
          expect: {
            status: 200,
          },
        },
      })

      // Test: Create resource (POST /resources)
      // Note: This is a smoke test - real validation would need actual test data
      tests.push({
        name: `Create ${resource} returns proper format`,
        type: 'http',
        config: {
          method: 'POST',
          path: resourcePath,
          headers: { 'Content-Type': 'application/json' },
          body: {}, // Empty body should fail validation - that's expected
          expect: {
            status: 400, // Validation error expected
          },
        },
      })
    }

    return tests
  },
}
