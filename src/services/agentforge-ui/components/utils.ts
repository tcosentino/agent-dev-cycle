import type { FileNode, FileCategory } from '../types'

export function categorizeFile(path: string): FileCategory {
  // New structure: files inside .agentforge/
  if (path.startsWith('.agentforge/agents/')) return 'prompt'
  if (path.startsWith('.agentforge/prompts/')) return 'prompt'
  if (path.startsWith('.agentforge/memory/')) return 'memory'
  if (path.startsWith('.agentforge/sessions/')) return 'session'
  if (path.startsWith('.agentforge/state/')) return 'state'
  if (path.startsWith('.agentforge/')) return 'config'

  // Old structure: files at root level (backwards compatibility)
  if (path === 'PROJECT.md' || path === 'ARCHITECTURE.md') return 'briefing'
  if (path.startsWith('prompts/')) return 'prompt'
  if (path.startsWith('memory/')) return 'memory'
  if (path.startsWith('sessions/')) return 'session'
  if (path.startsWith('state/')) return 'state'
  if (path.startsWith('src/')) return 'source'
  return 'other'
}

export function buildFileTree(files: Record<string, string>): FileNode[] {
  const root: FileNode[] = []

  // Track which folders contain service.json (to mark as services)
  const serviceFolders = new Set<string>()
  // Track which folders are openspec changes (contain proposal.md or .openspec.yaml)
  const openspecFolders = new Set<string>()

  for (const filePath of Object.keys(files)) {
    if (filePath.endsWith('/service.json') || filePath === 'service.json') {
      // Get parent folder path
      const parentPath = filePath.replace(/\/?service\.json$/, '')
      if (parentPath) {
        serviceFolders.add(parentPath)
      }
    }
    // Detect openspec change folders (folders inside openspec/changes/ that have proposal.md or .openspec.yaml)
    if (filePath.match(/^openspec\/changes\/[^/]+\/(proposal\.md|\.openspec\.yaml)$/)) {
      const parts = filePath.split('/')
      // Get the change folder path (e.g., "openspec/changes/my-feature")
      const changePath = parts.slice(0, 3).join('/')
      openspecFolders.add(changePath)
    }
  }

  for (const filePath of Object.keys(files).sort()) {
    const parts = filePath.split('/')
    let current = root
    let builtPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      builtPath = builtPath ? `${builtPath}/${part}` : part
      const isFile = i === parts.length - 1

      // Check if this folder path is a service folder or openspec change folder
      const isServiceFolder = !isFile && serviceFolders.has(builtPath)
      const isOpenSpecFolder = !isFile && openspecFolders.has(builtPath)

      let existing = current.find(n => n.name === part)
      if (!existing) {
        existing = {
          name: part,
          path: isFile ? filePath : builtPath,
          type: isFile ? 'file' : 'folder',
          category: categorizeFile(filePath),
          ...(isFile
            ? { extension: part.includes('.') ? part.split('.').pop() : undefined }
            : { children: [] }),
          ...(isServiceFolder ? { isService: true } : {}),
          ...(isOpenSpecFolder ? { isOpenSpec: true } : {}),
        }
        current.push(existing)
      } else if (isServiceFolder && !existing.isService) {
        // Mark existing folder as service if we discovered it later
        existing.isService = true
      } else if (isOpenSpecFolder && !existing.isOpenSpec) {
        // Mark existing folder as openspec if we discovered it later
        existing.isOpenSpec = true
      }
      if (!isFile && existing.children) {
        current = existing.children
      }
    }
  }

  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      // .agentforge goes last
      if (a.name === '.agentforge') return 1
      if (b.name === '.agentforge') return -1
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
  // Expand top-level folders except .agentforge (keeps it collapsed by default)
  return new Set(
    tree
      .filter(n => n.type === 'folder' && n.name !== '.agentforge')
      .map(n => n.path)
  )
}

// Files/folders to hide in "simple" mode (developer/config files)
const SIMPLE_MODE_HIDDEN = new Set([
  '.agentforge',
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
