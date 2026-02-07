import type { FileNode, FileCategory } from '../types'

// Folders that belong to the agent workspace (not project code)
const AGENT_WORKSPACE_FOLDERS = ['.agentforge', 'prompts', 'memory', 'sessions', 'state']

export function categorizeFile(path: string): FileCategory {
  // Handle paths with agent-workspace prefix (virtual grouping)
  const normalizedPath = path.replace(/^agent-workspace\//, '')

  // New structure: files inside .agentforge/
  if (normalizedPath.startsWith('.agentforge/prompts/')) return 'prompt'
  if (normalizedPath.startsWith('.agentforge/memory/')) return 'memory'
  if (normalizedPath.startsWith('.agentforge/sessions/')) return 'session'
  if (normalizedPath.startsWith('.agentforge/state/')) return 'state'
  if (normalizedPath.startsWith('.agentforge/')) return 'config'

  // Old structure: files at root level (backwards compatibility)
  if (normalizedPath === 'PROJECT.md' || normalizedPath === 'ARCHITECTURE.md') return 'briefing'
  if (normalizedPath.startsWith('prompts/')) return 'prompt'
  if (normalizedPath.startsWith('memory/')) return 'memory'
  if (normalizedPath.startsWith('sessions/')) return 'session'
  if (normalizedPath.startsWith('state/')) return 'state'
  if (normalizedPath.startsWith('src/')) return 'source'
  return 'other'
}

function isAgentWorkspacePath(path: string): boolean {
  const firstPart = path.split('/')[0]
  return AGENT_WORKSPACE_FOLDERS.includes(firstPart)
}

export function buildFileTree(files: Record<string, string>): FileNode[] {
  const root: FileNode[] = []

  // Track which folders contain service.json (to mark as services)
  const serviceFolders = new Set<string>()
  for (const filePath of Object.keys(files)) {
    if (filePath.endsWith('/service.json') || filePath === 'service.json') {
      // Get parent folder path
      const parentPath = filePath.replace(/\/?service\.json$/, '')
      if (parentPath) {
        serviceFolders.add(parentPath)
      }
    }
  }

  // Create agent-workspace virtual folder
  const agentWorkspace: FileNode = {
    name: 'agent-workspace',
    path: 'agent-workspace',
    type: 'folder',
    category: 'config',
    children: [],
  }

  for (const filePath of Object.keys(files).sort()) {
    // Determine if this file belongs in agent workspace
    const belongsToAgentWorkspace = isAgentWorkspacePath(filePath)

    // Choose the target root and adjust path for agent workspace files
    let targetRoot = root
    let adjustedPath = filePath

    if (belongsToAgentWorkspace) {
      targetRoot = agentWorkspace.children!
      // Keep the original path for the actual file reference
    }

    const parts = adjustedPath.split('/')
    let current = targetRoot
    let builtPath = belongsToAgentWorkspace ? 'agent-workspace' : ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      builtPath = builtPath ? `${builtPath}/${part}` : part
      const isFile = i === parts.length - 1

      // Check if this folder path is a service folder (use the original path, not builtPath)
      const originalFolderPath = parts.slice(0, i + 1).join('/')
      const isServiceFolder = !isFile && serviceFolders.has(originalFolderPath)

      let existing = current.find(n => n.name === part)
      if (!existing) {
        existing = {
          name: part,
          path: filePath, // Use original path for files so they can be opened
          type: isFile ? 'file' : 'folder',
          category: categorizeFile(filePath),
          ...(isFile
            ? { extension: part.includes('.') ? part.split('.').pop() : undefined }
            : { children: [] }),
          ...(isServiceFolder ? { isService: true } : {}),
        }
        // For folders, use the built path
        if (!isFile) {
          existing.path = builtPath
        }
        current.push(existing)
      } else if (isServiceFolder && !existing.isService) {
        // Mark existing folder as service if we discovered it later
        existing.isService = true
      }
      if (!isFile && existing.children) {
        current = existing.children
      }
    }
  }

  // Add agent-workspace folder to root if it has children
  if (agentWorkspace.children && agentWorkspace.children.length > 0) {
    root.push(agentWorkspace)
  }

  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      // agent-workspace always goes last
      if (a.name === 'agent-workspace') return 1
      if (b.name === 'agent-workspace') return -1
      // folders before files
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach(n => {
      if (n.children) sortNodes(n.children)
    })
  }
  sortNodes(root)
  return root
}

export function getDefaultExpanded(tree: FileNode[]): Set<string> {
  // Expand top-level folders except agent-workspace (keeps it collapsed by default)
  return new Set(
    tree
      .filter(n => n.type === 'folder' && n.name !== 'agent-workspace')
      .map(n => n.path)
  )
}

// Files/folders to hide in "simple" mode (developer/config files)
const SIMPLE_MODE_HIDDEN = new Set([
  'lib',
  'node_modules',
  'dist',
  'build',
  '.git',
  'tsconfig.json',
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.env',
  '.env.local',
  '.gitignore',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.json',
  '.prettierrc',
  '.prettierrc.js',
  '.prettierrc.json',
  'prettier.config.js',
  'eslint.config.js',
  'jest.config.js',
  'jest.config.ts',
  'vitest.config.ts',
  'vite.config.ts',
  'webpack.config.js',
  'rollup.config.js',
  'babel.config.js',
  '.babelrc',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.dockerignore',
  'Makefile',
  'LICENSE',
  'CHANGELOG.md',
  '.editorconfig',
  '.nvmrc',
  '.node-version',
])

export function filterTreeForSimpleMode(tree: FileNode[]): FileNode[] {
  return tree
    .filter(node => !SIMPLE_MODE_HIDDEN.has(node.name))
    .map(node => {
      if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: filterTreeForSimpleMode(node.children),
        }
      }
      return node
    })
    // Remove empty folders after filtering (except services)
    .filter(node => {
      if (node.type === 'folder' && node.children && !node.isService) {
        return node.children.length > 0
      }
      return true
    })
}
