import { describe, it, expect } from 'vitest'
import { parseAgentsYaml } from './utils'

describe('AgentBrowser - File Loading Issue', () => {
  const mockAgentsYaml = `# Agent configurations
pm:
  model: sonnet
  maxTokens: 32000

engineer:
  model: sonnet
  maxTokens: 64000

qa:
  model: haiku
  maxTokens: 32000

lead:
  model: opus
  maxTokens: 64000
  orchestrator: true
`

  it('should parse agents.yaml when content is loaded', () => {
    const agents = parseAgentsYaml(mockAgentsYaml)
    expect(agents).toHaveLength(4)
    expect(agents[0]).toEqual({
      id: 'pm',
      displayName: 'PM',
      model: 'sonnet',
      maxTokens: 32000,
      orchestrator: undefined,
    })
  })

  it('should return empty array when agents.yaml content is empty string (current bug)', () => {
    // This reproduces the current issue:
    // fetchProjectFiles returns fileMap[path] = '' for lazy loading
    // But parseAgentsYaml receives empty string instead of actual content
    const agents = parseAgentsYaml('')
    expect(agents).toEqual([])
  })

  it('should return empty array when agents.yaml is undefined', () => {
    const agents = parseAgentsYaml(undefined as any)
    expect(agents).toEqual([])
  })

  it('demonstrates the problem: lazy-loaded files have empty string content', () => {
    // This simulates what fetchProjectFiles returns
    const lazyLoadedFiles: Record<string, string> = {
      '.agentforge/agents.yaml': '', // Empty until lazy-loaded
      '.agentforge/agents/pm.md': '',
      'src/main.ts': '',
    }

    // When we try to parse agents.yaml, we get empty array
    const yamlContent = lazyLoadedFiles['.agentforge/agents.yaml']
    const agents = parseAgentsYaml(yamlContent)

    expect(yamlContent).toBe('') // File exists but content is empty
    expect(agents).toEqual([]) // Parsing fails

    // Fix: ProjectViewer now has a useEffect that eagerly loads agents.yaml
    // when it detects the file exists but content is empty string
  })

  it('should parse all agent types correctly', () => {
    const agents = parseAgentsYaml(mockAgentsYaml)

    expect(agents).toEqual([
      { id: 'pm', displayName: 'PM', model: 'sonnet', maxTokens: 32000, orchestrator: undefined },
      { id: 'engineer', displayName: 'Engineer', model: 'sonnet', maxTokens: 64000, orchestrator: undefined },
      { id: 'qa', displayName: 'QA', model: 'haiku', maxTokens: 32000, orchestrator: undefined },
      { id: 'lead', displayName: 'Lead', model: 'opus', maxTokens: 64000, orchestrator: true },
    ])
  })
})
