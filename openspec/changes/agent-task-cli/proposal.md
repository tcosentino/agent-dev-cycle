# Agent Task Management CLI

## Problem

Agents need the ability to view, create, comment on, edit, and manage tasks within their execution environment. Currently, agents can only read project documentation and write code but cannot interact with the task management system.

## Solution

Provide agents with a CLI tool (`agentforge`) that enables full CRUD operations on tasks and comments. The CLI is pre-installed in the Docker container and accessible during agent execution.

## Key Features

1. **Task Operations**
   - List tasks with filtering (by status, assignee)
   - Get task details by key (e.g., `AF-12`)
   - Create new tasks with title, description, type, priority, assignee
   - Update task fields (status, assignee, title, description, etc.)
   - Delete tasks

2. **Comment Operations**
   - List comments on a task
   - Add comments (with agent role as author)
   - Delete comments

3. **Agent Attribution**
   - Comments created by agents include `authorName` field set to agent role (pm, engineer, qa, lead)
   - Agents don't have user UUIDs, so `userId` is optional on comments

4. **Results Tab Visibility**
   - Agent task operations appear in session Results tab
   - Transcript parser extracts `agentforge task` commands and displays them as "AgentForge Actions"

## Benefits

- Agents can manage their own task backlog
- Cross-agent task handoffs become possible
- Agent actions are traceable in session results
- Consistent API access via CLI instead of direct REST calls
