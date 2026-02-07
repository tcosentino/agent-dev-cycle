import { test, expect } from '@playwright/test'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const AGENTFORGE_DIR = '.agentforge'
const AGENTS_DIR = join(AGENTFORGE_DIR, 'agents')

test.describe('AgentForge Directory Structure', () => {
  test('.agentforge directory should exist', () => {
    expect(existsSync(AGENTFORGE_DIR)).toBe(true)
  })

  test('.agentforge/agents directory should exist', () => {
    expect(existsSync(AGENTS_DIR)).toBe(true)
  })

  test('each agent folder should have required files', () => {
    if (!existsSync(AGENTS_DIR)) {
      test.skip()
      return
    }

    const agentDirs = readdirSync(AGENTS_DIR).filter(name => {
      const path = join(AGENTS_DIR, name)
      return statSync(path).isDirectory()
    })

    expect(agentDirs.length).toBeGreaterThan(0)

    for (const agentDir of agentDirs) {
      const agentPath = join(AGENTS_DIR, agentDir)

      // Check for config.json
      const configPath = join(agentPath, 'config.json')
      expect(
        existsSync(configPath),
        `${agentDir}/config.json should exist`
      ).toBe(true)

      // Check for prompt.md
      const promptPath = join(agentPath, 'prompt.md')
      expect(
        existsSync(promptPath),
        `${agentDir}/prompt.md should exist`
      ).toBe(true)

      // Check for sessions directory
      const sessionsPath = join(agentPath, 'sessions')
      expect(
        existsSync(sessionsPath),
        `${agentDir}/sessions directory should exist`
      ).toBe(true)
    }
  })

  test('agent config.json files should be valid JSON', () => {
    if (!existsSync(AGENTS_DIR)) {
      test.skip()
      return
    }

    const agentDirs = readdirSync(AGENTS_DIR).filter(name => {
      const path = join(AGENTS_DIR, name)
      return statSync(path).isDirectory()
    })

    for (const agentDir of agentDirs) {
      const configPath = join(AGENTS_DIR, agentDir, 'config.json')
      if (!existsSync(configPath)) continue

      const content = readFileSync(configPath, 'utf-8')
      let config: any

      expect(() => {
        config = JSON.parse(content)
      }, `${agentDir}/config.json should be valid JSON`).not.toThrow()

      // Validate required fields
      expect(config.id, `${agentDir}/config.json should have id field`).toBeDefined()
      expect(config.model, `${agentDir}/config.json should have model field`).toBeDefined()
      expect(config.maxTokens, `${agentDir}/config.json should have maxTokens field`).toBeDefined()

      // Validate types
      expect(typeof config.id).toBe('string')
      expect(typeof config.model).toBe('string')
      expect(typeof config.maxTokens).toBe('number')

      // Validate model value
      expect(['opus', 'sonnet', 'haiku']).toContain(config.model)

      // Validate maxTokens is positive
      expect(config.maxTokens).toBeGreaterThan(0)

      // If displayName exists, it should be a string
      if (config.displayName !== undefined) {
        expect(typeof config.displayName).toBe('string')
      }

      // If orchestrator exists, it should be a boolean
      if (config.orchestrator !== undefined) {
        expect(typeof config.orchestrator).toBe('boolean')
      }
    }
  })

  test('agent prompt.md files should not be empty', () => {
    if (!existsSync(AGENTS_DIR)) {
      test.skip()
      return
    }

    const agentDirs = readdirSync(AGENTS_DIR).filter(name => {
      const path = join(AGENTS_DIR, name)
      return statSync(path).isDirectory()
    })

    for (const agentDir of agentDirs) {
      const promptPath = join(AGENTS_DIR, agentDir, 'prompt.md')
      if (!existsSync(promptPath)) continue

      const content = readFileSync(promptPath, 'utf-8')
      expect(
        content.trim().length,
        `${agentDir}/prompt.md should not be empty`
      ).toBeGreaterThan(0)
    }
  })

  test('agent config.json id should match directory name', () => {
    if (!existsSync(AGENTS_DIR)) {
      test.skip()
      return
    }

    const agentDirs = readdirSync(AGENTS_DIR).filter(name => {
      const path = join(AGENTS_DIR, name)
      return statSync(path).isDirectory()
    })

    for (const agentDir of agentDirs) {
      const configPath = join(AGENTS_DIR, agentDir, 'config.json')
      if (!existsSync(configPath)) continue

      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content)

      expect(
        config.id,
        `${agentDir}/config.json id should match directory name`
      ).toBe(agentDir)
    }
  })

  test('session directories should have valid structure', () => {
    if (!existsSync(AGENTS_DIR)) {
      test.skip()
      return
    }

    const agentDirs = readdirSync(AGENTS_DIR).filter(name => {
      const path = join(AGENTS_DIR, name)
      return statSync(path).isDirectory()
    })

    for (const agentDir of agentDirs) {
      const sessionsPath = join(AGENTS_DIR, agentDir, 'sessions')
      if (!existsSync(sessionsPath)) continue

      const sessionDirs = readdirSync(sessionsPath).filter(name => {
        const path = join(sessionsPath, name)
        return statSync(path).isDirectory()
      })

      for (const sessionDir of sessionDirs) {
        const sessionPath = join(sessionsPath, sessionDir)

        // Session name should start with agent id
        expect(
          sessionDir.startsWith(agentDir),
          `Session ${sessionDir} should start with agent id ${agentDir}`
        ).toBe(true)

        // Check for transcript.jsonl or notepad.md (at least one should exist)
        const transcriptPath = join(sessionPath, 'transcript.jsonl')
        const notepadPath = join(sessionPath, 'notepad.md')

        const hasTranscript = existsSync(transcriptPath)
        const hasNotepad = existsSync(notepadPath)

        expect(
          hasTranscript || hasNotepad,
          `Session ${sessionDir} should have transcript.jsonl or notepad.md`
        ).toBe(true)
      }
    }
  })

  test('no duplicate agent ids across configs', () => {
    if (!existsSync(AGENTS_DIR)) {
      test.skip()
      return
    }

    const agentDirs = readdirSync(AGENTS_DIR).filter(name => {
      const path = join(AGENTS_DIR, name)
      return statSync(path).isDirectory()
    })

    const ids = new Set<string>()
    const duplicates: string[] = []

    for (const agentDir of agentDirs) {
      const configPath = join(AGENTS_DIR, agentDir, 'config.json')
      if (!existsSync(configPath)) continue

      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content)

      if (ids.has(config.id)) {
        duplicates.push(config.id)
      }
      ids.add(config.id)
    }

    expect(
      duplicates,
      `Found duplicate agent ids: ${duplicates.join(', ')}`
    ).toHaveLength(0)
  })

  test('README.md should exist in agents directory', () => {
    const readmePath = join(AGENTS_DIR, 'README.md')
    expect(
      existsSync(readmePath),
      '.agentforge/agents/README.md should exist to document the structure'
    ).toBe(true)

    if (existsSync(readmePath)) {
      const content = readFileSync(readmePath, 'utf-8')
      expect(content.trim().length).toBeGreaterThan(0)
    }
  })
})

test.describe('Legacy AgentForge Structure Support', () => {
  test('should support legacy agents.yaml if present', () => {
    const yamlPath = join(AGENTFORGE_DIR, 'agents.yaml')

    if (!existsSync(yamlPath)) {
      test.skip()
      return
    }

    const content = readFileSync(yamlPath, 'utf-8')
    expect(content.trim().length).toBeGreaterThan(0)

    // Basic YAML validation (should have agent configs)
    expect(content).toMatch(/\w+:\s*\n\s+(model|maxTokens):/m)
  })
})
