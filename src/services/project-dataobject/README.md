# Project Dataobject

<<<<<<< HEAD
Manages projects in the AgentForge system.
=======
Represents external projects that can be deployed and managed by AgentForge.

## Concept

A "project" in AgentForge is an **external codebase** (typically a git repository) that contains services to be deployed. For example:
- The `todo-app` example in `examples/todo-app/` is a project
- Any git repository with services can be added as a project
>>>>>>> dbfa1fa (feat(project): Add project-dataobject for managing external projects)

## Schema

- `id` (uuid) - Unique identifier
- `userId` (uuid) - Owner of the project
<<<<<<< HEAD
- `name` (string) - Project name (1-100 chars)
- `key` (string) - Project key/code (2-10 chars, uppercase)
- `repoUrl` (string, optional) - Git repository URL
- `createdAt` (date) - Creation timestamp
- `updatedAt` (date) - Last update timestamp

## Relations

- Belongs to a `user`
- Has many `deployments`
- Has many `tasks` (if task-dataobject is present)

## Usage

Projects represent workspaces where services are deployed and managed.
=======
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
>>>>>>> dbfa1fa (feat(project): Add project-dataobject for managing external projects)
