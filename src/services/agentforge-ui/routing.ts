import type { OpenTab } from './components'
import type { ApiProject } from './api'
import { parseRepoUrl } from './api'

// Table names that can appear directly under /{owner}/{repo}/
const TABLE_PATH_NAMES = ['tasks', 'channels', 'messages', 'agentStatus', 'sessions', 'deployments', 'workloads'] as const

// --- ParsedUrl ---

export type ParsedUrl =
  | { type: 'root' }
  | { type: 'agent'; owner: string; repo: string; branch: string; agentId: string; panelTab?: string }
  | { type: 'agentSession'; owner: string; repo: string; branch: string; agentId: string; sessionId: string; panelTab?: string }
  | { type: 'file'; owner: string; repo: string; branch: string; filePath: string }
  | { type: 'table'; owner: string; repo: string; tableName: string; panelTab?: string }
  | { type: 'record'; owner: string; repo: string; tableName: string; recordKey: string; panelTab?: string }
  | { type: 'openspec'; owner: string; repo: string; branch: string; changePath: string; panelTab?: string }

// --- URL Parsing ---

export function parseUrl(pathname: string, hash: string): ParsedUrl {
  const path = pathname.startsWith('/') ? pathname.slice(1) : pathname
  const panelTab = hash.startsWith('#') ? hash.slice(1) : (hash || undefined)

  if (!path) return { type: 'root' }

  // /{owner}/{repo}/...
  const segments = path.split('/')
  if (segments.length < 2) return { type: 'root' }

  const [owner, repo, thirdSegment, ...rest] = segments

  if (!owner || !repo) return { type: 'root' }

  // /{owner}/{repo}/{tableName}[/{recordKey}]
  if (thirdSegment && (TABLE_PATH_NAMES as readonly string[]).includes(thirdSegment)) {
    const tableName = thirdSegment
    if (rest.length === 0) {
      return { type: 'table', owner, repo, tableName, panelTab }
    }
    const recordKey = rest.join('/')
    return { type: 'record', owner, repo, tableName, recordKey, panelTab }
  }

  // /{owner}/{repo}/tree/{branch}/{...filePath}
  if (thirdSegment !== 'tree') return { type: 'root' }
  const branch = rest[0]
  if (!branch) return { type: 'root' }

  const filePath = rest.slice(1).join('/')
  if (!filePath) return { type: 'root' }

  // .agentforge/agents/{id}/sessions/{sessionId}
  const sessionMatch = filePath.match(/^\.agentforge\/agents\/([^/]+)\/sessions\/([^/]+)$/)
  if (sessionMatch) {
    return {
      type: 'agentSession',
      owner,
      repo,
      branch,
      agentId: sessionMatch[1],
      sessionId: sessionMatch[2],
      panelTab,
    }
  }

  // .agentforge/agents/{id}  (exact — not deeper)
  const agentMatch = filePath.match(/^\.agentforge\/agents\/([^/]+)$/)
  if (agentMatch) {
    return { type: 'agent', owner, repo, branch, agentId: agentMatch[1], panelTab }
  }

  // openspec/changes/{changeName} (exact — the change folder)
  const openspecMatch = filePath.match(/^openspec\/changes\/([^/]+)$/)
  if (openspecMatch) {
    return { type: 'openspec', owner, repo, branch, changePath: filePath, panelTab }
  }

  // Everything else: file (service detection deferred to activation time)
  return { type: 'file', owner, repo, branch, filePath }
}

// --- URL Generation ---

export function tabToUrl(tab: OpenTab, project: ApiProject | null): { path: string; hash: string } | null {
  if (!project?.repoUrl) return null
  const parsed = parseRepoUrl(project.repoUrl)
  if (!parsed) return null
  const { owner, repo } = parsed

  switch (tab.type) {
    case 'agent': {
      const agentId = tab.agentId || tab.path
      return { path: `/${owner}/${repo}/tree/main/.agentforge/agents/${agentId}`, hash: '' }
    }
    case 'agentSession': {
      if (tab.agentId) {
        return {
          path: `/${owner}/${repo}/tree/main/.agentforge/agents/${tab.agentId}/sessions/${tab.path}`,
          hash: '',
        }
      }
      // Fallback: no agent context — can't build a clean URL
      return null
    }
    case 'file':
    case 'service':
    case 'openspec':
      return { path: `/${owner}/${repo}/tree/main/${tab.path}`, hash: '' }
    case 'table':
      return { path: `/${owner}/${repo}/${tab.path}`, hash: '' }
    case 'record': {
      // tab.path format: "tableName:recordKey"
      const colonIdx = tab.path.indexOf(':')
      if (colonIdx === -1) return null
      const tableName = tab.path.slice(0, colonIdx)
      const recordKey = tab.path.slice(colonIdx + 1)
      return { path: `/${owner}/${repo}/${tableName}/${recordKey}`, hash: '' }
    }
    default:
      return null
  }
}

// --- Project Lookup ---

export function findProjectByRepoUrl(
  projects: ApiProject[],
  owner: string,
  repo: string,
): ApiProject | null {
  for (const project of projects) {
    if (!project.repoUrl) continue
    const parsed = parseRepoUrl(project.repoUrl)
    if (parsed && parsed.owner.toLowerCase() === owner.toLowerCase() && parsed.repo.toLowerCase() === repo.toLowerCase()) {
      return project
    }
  }
  return null
}
