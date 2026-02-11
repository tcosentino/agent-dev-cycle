import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { ImageBuilder } from '../docker/image'
import type { ExpressServiceConfig } from './types'

export class ExpressServiceBuilder {
  constructor(private readonly imageBuilder: ImageBuilder) {}

  async buildContainer(servicePath: string, config: ExpressServiceConfig): Promise<string> {
    // Create package.json if needed
    await this.ensurePackageJson(servicePath)

    // Create mock dataobject module
    await this.createMockDataobjectModule(servicePath)

    // Generate server.js
    const serverJs = this.generateServerScript(config)
    await writeFile(join(servicePath, 'server.js'), serverJs, 'utf-8')

    // Generate Dockerfile
    const dockerfile = this.generateDockerfile(config)
    await writeFile(join(servicePath, 'Dockerfile'), dockerfile, 'utf-8')

    // Build the image
    const imageName = `workload-${config.workloadId}`
    const imageId = await this.imageBuilder.buildFromDockerfile(servicePath, {
      tag: imageName,
    })

    return imageId
  }

  generateServerScript(config: ExpressServiceConfig): string {
    const isTypeScript = config.entryFile.endsWith('.ts')

    const loadModule = isTypeScript
      ? `const { register } = require('tsx/cjs/api');
register();
const resourceModule = require(path.join(__dirname, '${config.entryFile}'));`
      : `const resourceModule = require(path.join(__dirname, '${config.entryFile}'));`

    return `const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Load the dataobject resource
${loadModule}

// Extract the resource definition
const resource = resourceModule.default || resourceModule.projectResource || resourceModule;

if (!resource) {
  console.error('Could not find resource export in service');
  process.exit(1);
}

console.log('Starting server for resource:', resource.name || 'unknown');

// Basic CRUD endpoints for the dataobject
app.get('/api/${config.workloadId}', async (req, res) => {
  try {
    const items = await resource.list(req.query);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/${config.workloadId}/:id', async (req, res) => {
  try {
    const item = await resource.get(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/${config.workloadId}', async (req, res) => {
  try {
    const item = await resource.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/${config.workloadId}/:id', async (req, res) => {
  try {
    const item = await resource.update(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/${config.workloadId}/:id', async (req, res) => {
  try {
    await resource.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || ${config.port};
app.listen(port, '0.0.0.0', () => {
  console.log(\`Server listening on port \${port}\`);
});
`
  }

  generateDockerfile(config: ExpressServiceConfig): string {
    return `FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \\
    elif [ -f package-lock.json ]; then npm ci; \\
    else npm install; fi

# Copy service files
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
`
  }

  async ensurePackageJson(servicePath: string): Promise<void> {
    const packageJsonPath = join(servicePath, 'package.json')
    if (!existsSync(packageJsonPath)) {
      const packageJson = {
        name: 'dataobject-runtime',
        version: '1.0.0',
        private: true,
        dependencies: {
          express: '^4.18.2',
          tsx: '^4.7.0',
          zod: '^3.22.4',
        },
      }
      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8')
    }
  }

  async createMockDataobjectModule(servicePath: string): Promise<void> {
    const nodeModulesPath = join(servicePath, 'node_modules')
    const agentforgeModulePath = join(nodeModulesPath, '@agentforge')
    const dataobjectModulePath = join(agentforgeModulePath, 'dataobject')

    if (!existsSync(dataobjectModulePath)) {
      await mkdir(dataobjectModulePath, { recursive: true })

      const mockDataobject = `const { z } = require('zod');

function defineResource(config) {
  return {
    name: config.name,
    schema: config.schema,
    list: async (query) => [],
    get: async (id) => null,
    create: async (data) => ({ id: 'mock-id', ...data }),
    update: async (id, data) => ({ id, ...data }),
    delete: async (id) => {},
  };
}

module.exports = {
  defineResource,
  z,
};
`

      const mockPackageJson = {
        name: '@agentforge/dataobject',
        version: '0.0.1',
        main: 'index.js',
      }

      await writeFile(join(dataobjectModulePath, 'index.js'), mockDataobject, 'utf-8')
      await writeFile(
        join(dataobjectModulePath, 'package.json'),
        JSON.stringify(mockPackageJson),
        'utf-8'
      )
    }
  }
}
