# Project Dataobject

Represents external projects that can be deployed and managed by AgentForge.

## Concept

A "project" in AgentForge is an **external codebase** (typically a git repository) that contains services to be deployed. For example:
- The `todo-app` example in `examples/todo-app/` is a project
- Any git repository with services can be added as a project

## Schema

- `id` (uuid) - Unique identifier
- `userId` (uuid) - Owner of the project
- `name` (string) - Project name (e.g., "Todo App")
- `key` (string) - Project key/code (e.g., "TODO")
- `repoUrl` (string, optional) - Git repository URL to clone
- `createdAt` (date) - When project was added to AgentForge
- `updatedAt` (date) - Last update timestamp

## Workflow

1. User adds a project by providing a git repo URL
2. AgentForge clones the repo (or uses a local path for development)
3. User can discover services within the project
4. User can deploy services as workloads
5. Workloads run in isolated containers/processes

## For Development

For local development (like the examples/ folder), projects can be added without a repoUrl and AgentForge will use the local filesystem path.
