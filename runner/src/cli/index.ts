#!/usr/bin/env node

import {
  taskGet,
  taskUpdate,
  taskList,
  taskCreate,
  taskDelete,
  taskCommentList,
  taskCommentAdd,
  taskCommentDelete,
} from './commands/task.js'
import type { CreateTaskOptions } from './commands/task.js'
import { chatPost } from './commands/chat.js'
import { statusSet } from './commands/status.js'

function printUsage(): void {
  console.log(`
agentforge - CLI for interacting with the AgentForge hub

Usage:
  agentforge <command> [options]

Commands:
  task list                         List all project tasks
    --status <status>               Filter by status (todo/in-progress/review/done/blocked)
    --assignee <agent>              Filter by assignee
  task get <key>                    Get task details
  task create "<title>" [options]   Create a new task
    --description <text>            Task description
    --type <type>                   Task type (epic/api/backend/frontend/testing/documentation/devops)
    --priority <priority>           Priority (critical/high/medium/low)
    --assignee <agent>              Assign to agent (pm/engineer/qa/lead)
  task update <key> [options]       Update a task
    --status <status>               Set status (todo/in-progress/review/done/blocked)
    --title <text>                  Update title
    --description <text>            Update description
    --priority <priority>           Update priority
    --type <type>                   Update type
    --assignee <agent>              Set assignee
  task delete <key>                 Delete a task

  task comment list <key>           List comments on a task
  task comment add <key> "<text>"   Add a comment to a task
  task comment delete <id>          Delete a comment by ID

  chat post "<message>"             Post a message to the project chat

  status set <status> [message]     Update agent status
    status: active, busy, away, offline

Examples:
  agentforge task list
  agentforge task list --status todo --assignee engineer
  agentforge task create "Implement user auth" --type backend --priority high
  agentforge task get AF-12
  agentforge task update AF-12 --status in-progress
  agentforge task update AF-12 --status done
  agentforge task delete AF-12
  agentforge task comment list AF-12
  agentforge task comment add AF-12 "Started implementation, blocked on API spec"
  agentforge task comment delete <comment-id>
  agentforge chat post "Finished the feature"
  agentforge status set busy "Working on AF-12"
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
          case 'list':
            await taskList({ status: flags.status, assignee: flags.assignee })
            break

          case 'get':
            if (!positional[0]) {
              console.error('Error: task key required')
              process.exit(1)
            }
            await taskGet(positional[0])
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
            } as CreateTaskOptions)
            break

          case 'update':
            if (!positional[0]) {
              console.error('Error: task key required')
              process.exit(1)
            }
            await taskUpdate(positional[0], {
              status: flags.status,
              title: flags.title,
              description: flags.description,
              priority: flags.priority,
              type: flags.type,
              assignee: flags.assignee,
            })
            break

          case 'delete':
            if (!positional[0]) {
              console.error('Error: task key required')
              process.exit(1)
            }
            await taskDelete(positional[0])
            break

          case 'comment': {
            const commentSubcommand = positional[0]
            switch (commentSubcommand) {
              case 'list':
                if (!positional[1]) {
                  console.error('Error: task key required')
                  process.exit(1)
                }
                await taskCommentList(positional[1])
                break

              case 'add':
                if (!positional[1]) {
                  console.error('Error: task key required')
                  process.exit(1)
                }
                if (!positional[2]) {
                  console.error('Error: comment text required')
                  process.exit(1)
                }
                await taskCommentAdd(positional[1], positional[2])
                break

              case 'delete':
                if (!positional[1]) {
                  console.error('Error: comment ID required')
                  process.exit(1)
                }
                await taskCommentDelete(positional[1])
                break

              default:
                console.error(`Unknown task comment subcommand: ${commentSubcommand}`)
                printUsage()
                process.exit(1)
            }
            break
          }

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
