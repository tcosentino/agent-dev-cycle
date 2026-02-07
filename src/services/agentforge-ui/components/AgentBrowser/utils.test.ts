import { describe, it, expect } from 'vitest'
import { parseAgentConfigs, parseAgentsYaml } from './utils'

describe('parseAgentConfigs', () => {
  it('should parse agent configs from folder structure', () => {
    const files = {
      '.agentforge/agents/pm/config.json': JSON.stringify({
        id: 'pm',
        displayName: 'Product Manager',
        model: 'sonnet',
        maxTokens: 32000
      }),
      '.agentforge/agents/engineer/config.json': JSON.stringify({
        id: 'engineer',
        displayName: 'Engineer',
        model: 'sonnet',
        maxTokens: 64000
      }),
      '.agentforge/agents/qa/config.json': JSON.stringify({
        id: 'qa',
        displayName: 'QA Engineer',
        model: 'haiku',
        maxTokens: 32000
      }),
      '.agentforge/agents/lead/config.json': JSON.stringify({
        id: 'lead',
        displayName: 'Tech Lead',
        model: 'opus',
        maxTokens: 64000,
        orchestrator: true
      })
    }

    const agents = parseAgentConfigs(files)

    expect(agents).toHaveLength(4)
    expect(agents[0]).toEqual({
      id: 'pm',
      displayName: 'Product Manager',
      model: 'sonnet',
      maxTokens: 32000,
      orchestrator: undefined
    })
    expect(agents.find(a => a.id === 'lead')).toEqual({
      id: 'lead',
      displayName: 'Tech Lead',
      model: 'opus',
      maxTokens: 64000,
      orchestrator: true
    })
  })

  it('should handle invalid JSON gracefully', () => {
    const files = {
      '.agentforge/agents/pm/config.json': 'invalid json',
      '.agentforge/agents/engineer/config.json': JSON.stringify({
        id: 'engineer',
        displayName: 'Engineer',
        model: 'sonnet',
        maxTokens: 64000
      })
    }

    const agents = parseAgentConfigs(files)

    // Should only parse the valid one
    expect(agents).toHaveLength(1)
    expect(agents[0].id).toBe('engineer')
  })

  it('should return empty array if no configs found', () => {
    const files = {
      '.agentforge/agents/pm/prompt.md': '# PM',
      'other/file.txt': 'content'
    }

    const agents = parseAgentConfigs(files)
    expect(agents).toEqual([])
  })
})

describe('parseAgentsYaml (legacy)', () => {
  it('should parse legacy agents.yaml format', () => {
    const yaml = `
pm:
  model: sonnet
  maxTokens: 32000

engineer:
  model: sonnet
  maxTokens: 64000
`

    const agents = parseAgentsYaml(yaml)

    expect(agents).toHaveLength(2)
    expect(agents[0]).toMatchObject({
      id: 'pm',
      displayName: 'PM',
      model: 'sonnet',
      maxTokens: 32000
    })
  })
})
