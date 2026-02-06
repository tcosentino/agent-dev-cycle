#!/usr/bin/env node

import { taskGet, taskUpdate, taskList, taskCreate } from './commands/task.js'
import type { CreateTaskOptions } from './commands/task.js'
import { chatPost } from './commands/chat.js'
import { statusSet } from './commands/status.js'

function printUsage(): void {
  console.log(`
agentforge - CLI for interacting with the AgentForge hub

Usage:
  agentforge <command> [options]

Commands:
  task get <key>                    Get task details
  task list                         List all tasks
  task create "<title>" [options]   Create a new task
    --description <text>            Task description
    --type <type>                   Task type (story/task/bug/epic)
    --priority <priority>           Priority (low/medium/high/critical)
    --assignee <agent>              Assign to agent (pm/engineer/qa/lead)
    --parent <key>                  Parent task key (for subtasks)
  task update <key> [options]       Update a task
    --status <status>               Set status (todo/in-progress/done)
    --summary <text>                Set summary
    --assignee <agent>              Set assignee

  chat post "<message>"             Post a message to the project chat

  status set <status> [message]     Update agent status
    status: active, busy, away, offline

Examples:
  agentforge task create "Implement user auth" --type story --priority high
  agentforge task create "Add login form" --parent ST-1 --assignee engineer
  agentforge task get ST-12
  agentforge task update ST-12 --status done --summary "Implemented API"
  agentforge chat post "Finished the feature"
  agentforge status set busy "Working on ST-12"
`)
}

function parseArgs(args: string[]): { flags: Record<string, string>; positional: string[] } {
  const flags: Record<string, string> = {}
  const positional: string[] = []

  let i = 0
  while (i < args.length) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const value = args[i + 1]
      if (value && !value.startsWith('--')) {
        flags[key] = value
        i += 2
      } else {
        flags[key] = 'true'
        i += 1
      }
    } else {
      positional.push(arg)
      i += 1
    }
  }

  return { flags, positional }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    printUsage()
    process.exit(0)
  }

  const command = args[0]
  const subcommand = args[1]
  const { flags, positional } = parseArgs(args.slice(2))

  try {
    switch (command) {
      case 'task':
        switch (subcommand) {
          case 'get':
            if (!positional[0]) {
              console.error('Error: task key required')
              process.exit(1)
            }
            await taskGet(positional[0])
            break
          case 'list':
            await taskList()
            break
          case 'create':
            if (!positional[0]) {
              console.error('Error: task title required')
              process.exit(1)
            }
            await taskCreate({
              title: positional[0],
              description: flags.description,
              type: flags.type,
              priority: flags.priority,
              assignee: flags.assignee,
              parentKey: flags.parent,
            } as CreateTaskOptions)
            break
          case 'update':
            if (!positional[0]) {
              console.error('Error: task key required')
              process.exit(1)
            }
            await taskUpdate(positional[0], {
              status: flags.status,
              summary: flags.summary,
              assignee: flags.assignee,
            })
            break
          default:
            console.error(`Unknown task subcommand: ${subcommand}`)
            printUsage()
            process.exit(1)
        }
        break

      case 'chat':
        if (subcommand !== 'post') {
          console.error(`Unknown chat subcommand: ${subcommand}`)
          printUsage()
          process.exit(1)
        }
        if (!positional[0]) {
          console.error('Error: message required')
          process.exit(1)
        }
        await chatPost(positional[0])
        break

      case 'status':
        if (subcommand !== 'set') {
          console.error(`Unknown status subcommand: ${subcommand}`)
          printUsage()
          process.exit(1)
        }
        if (!positional[0]) {
          console.error('Error: status required (active/busy/away/offline)')
          process.exit(1)
        }
        const status = positional[0] as 'active' | 'busy' | 'away' | 'offline'
        const message = positional.slice(1).join(' ') || undefined
        await statusSet(status, message)
        break

      default:
        console.error(`Unknown command: ${command}`)
        printUsage()
        process.exit(1)
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(`Error: ${err.message}`)
    process.exit(1)
  }
}

main()
