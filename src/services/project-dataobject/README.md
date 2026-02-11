# Project Dataobject

Manages projects in the AgentForge system.

## Schema

- `id` (uuid) - Unique identifier
- `userId` (uuid) - Owner of the project
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
