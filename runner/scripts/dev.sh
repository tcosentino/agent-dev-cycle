#!/bin/bash

# Local development runner script
# Uses your existing Claude subscription auth and git credentials
#
# Usage:
#   ./scripts/dev.sh [session-config.json]
#
# Examples:
#   ./scripts/dev.sh                      # Uses session.local.json
#   ./scripts/dev.sh my-session.json      # Uses custom config
#
# Options:
#   --docker       Run in Docker (sandboxed, uses subscription via ~/.claude/.credentials.json)
#   --build        Force rebuild the Docker image (only with --docker)
#   --login        Run Docker container interactively to login to Claude

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUNNER_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="session.local.json"
USE_DOCKER=false
FORCE_BUILD=false
DO_LOGIN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --docker)
      USE_DOCKER=true
      shift
      ;;
    --build)
      FORCE_BUILD=true
      shift
      ;;
    --login)
      DO_LOGIN=true
      USE_DOCKER=true
      shift
      ;;
    *)
      CONFIG_FILE="$1"
      shift
      ;;
  esac
done

echo "=== AgentForge Runner (Dev) ==="
echo ""

# Check for Claude directory
if [ ! -d "$HOME/.claude" ]; then
  mkdir -p "$HOME/.claude"
fi

# Check for Claude credentials (needed for Docker mode)
if [ "$USE_DOCKER" = true ] && [ ! -f "$HOME/.claude/.credentials.json" ]; then
  echo "No Claude credentials found for Docker mode."
  echo "Run './scripts/dev.sh --login' to authenticate first."
  echo ""
  exit 1
fi

# Check config file exists
if [ ! -f "$RUNNER_DIR/$CONFIG_FILE" ]; then
  echo "Error: Config file not found: $CONFIG_FILE"
  echo ""
  echo "Create session.local.json with your repo URL:"
  echo '  {
    "runId": "run-001",
    "projectId": "shoe-inventory",
    "agent": "engineer",
    "phase": "building",
    "repoUrl": "https://github.com/YOUR_USERNAME/agentforge-example-shoe-inventory.git",
    "branch": "main",
    "taskPrompt": "Your task here",
    "assignedTasks": []
  }'
  exit 1
fi

echo "Config: $CONFIG_FILE"

if [ "$USE_DOCKER" = true ]; then
  echo "Mode: Docker (sandboxed)"
  echo ""

  # Build image if needed
  IMAGE_NAME="agentforge-runner:dev"

  if [ "$FORCE_BUILD" = true ] || ! docker image inspect "$IMAGE_NAME" &>/dev/null; then
    echo "Building Docker image..."
    docker build -t "$IMAGE_NAME" "$RUNNER_DIR"
    echo ""
  fi

  # Determine git auth - prefer gh token for HTTPS (works better in Docker than SSH keys)
  GIT_MOUNTS=""
  GIT_ENV=""

  # Try to get a GitHub token from gh CLI
  if command -v gh &>/dev/null && gh auth status &>/dev/null; then
    GH_TOKEN=$(gh auth token 2>/dev/null)
    if [ -n "$GH_TOKEN" ]; then
      echo "Using GitHub token from gh CLI"
      GIT_ENV="-e GIT_TOKEN=$GH_TOKEN"
    fi
  fi

  if [ -d "$HOME/.config/gh" ]; then
    GIT_MOUNTS="$GIT_MOUNTS -v $HOME/.config/gh:/home/agent/.config/gh:ro"
  fi
  if [ -f "$HOME/.gitconfig" ]; then
    GIT_MOUNTS="$GIT_MOUNTS -v $HOME/.gitconfig:/home/agent/.gitconfig:ro"
  fi

  # Handle login mode
  if [ "$DO_LOGIN" = true ]; then
    echo "Starting interactive login..."
    echo "Run 'claude login' inside the container, then exit when done."
    echo ""
    docker run --rm -it \
      --entrypoint="" \
      -v "$HOME/.claude:/home/agent/.claude" \
      "$IMAGE_NAME" \
      bash -c "claude login && echo '' && echo 'Login successful! You can now run with --docker'"
    exit 0
  fi

  echo "Running in Docker container..."
  echo ""

  # Run the container (use -it only if we have a TTY)
  DOCKER_FLAGS="--rm"
  if [ -t 0 ]; then
    DOCKER_FLAGS="$DOCKER_FLAGS -it"
  fi

  # Note: mounting to /home/agent since container runs as non-root user "agent"
  # Claude Code needs read-write access to ~/.claude for session state
  docker run $DOCKER_FLAGS \
    -v "$HOME/.claude:/home/agent/.claude" \
    $GIT_MOUNTS \
    $GIT_ENV \
    -v "$RUNNER_DIR/$CONFIG_FILE:/run/session.json:ro" \
    -e SESSION_CONFIG_PATH=/run/session.json \
    "$IMAGE_NAME"

else
  echo "Mode: Local (no sandbox)"
  echo ""

  # Local workspace directory
  WORKSPACE_DIR="$RUNNER_DIR/.workspace"

  # Clean up previous workspace
  if [ -d "$WORKSPACE_DIR" ]; then
    echo "Cleaning previous workspace..."
    rm -rf "$WORKSPACE_DIR"
  fi
  mkdir -p "$WORKSPACE_DIR"

  echo "Workspace: $WORKSPACE_DIR"
  echo ""

  # Run the runner with local paths
  cd "$RUNNER_DIR"
  WORKSPACE_PATH="$WORKSPACE_DIR" \
  SESSION_CONFIG_PATH="$RUNNER_DIR/$CONFIG_FILE" \
  CONTEXT_PATH="/tmp/agent-context-$(date +%s).md" \
  npx tsx src/index.ts
fi
