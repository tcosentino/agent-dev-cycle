#!/bin/bash

# Setup script for creating GitHub repos from example projects
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated
# - Git configured with your credentials
#
# Usage:
#   ./scripts/setup-example-repos.sh [github-org-or-user]
#
# Example:
#   ./scripts/setup-example-repos.sh myusername
#   ./scripts/setup-example-repos.sh my-org

set -e

GITHUB_OWNER="${1:-}"

if [ -z "$GITHUB_OWNER" ]; then
  echo "Usage: $0 <github-org-or-user>"
  echo "Example: $0 myusername"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
EXAMPLES_DIR="$(dirname "$PROJECT_ROOT")/example-projects"

echo "Setting up example projects as GitHub repos..."
echo "GitHub owner: $GITHUB_OWNER"
echo "Examples dir: $EXAMPLES_DIR"
echo ""

for project_dir in "$EXAMPLES_DIR"/*/; do
  project_name=$(basename "$project_dir")
  repo_name="agentforge-example-${project_name}"

  echo "=== Setting up $project_name ==="

  cd "$project_dir"

  # Initialize git if not already
  if [ ! -d ".git" ]; then
    echo "Initializing git repo..."
    git init
    git add -A
    git commit -m "Initial commit: $project_name example project"
  fi

  # Check if repo exists on GitHub
  if gh repo view "$GITHUB_OWNER/$repo_name" &>/dev/null; then
    echo "Repo $GITHUB_OWNER/$repo_name already exists"
  else
    echo "Creating GitHub repo: $GITHUB_OWNER/$repo_name"
    gh repo create "$GITHUB_OWNER/$repo_name" --private --source=. --push
  fi

  # Set up remote if not already
  if ! git remote get-url origin &>/dev/null; then
    git remote add origin "https://github.com/$GITHUB_OWNER/$repo_name.git"
  fi

  # Push latest
  echo "Pushing to GitHub..."
  git push -u origin main 2>/dev/null || git push -u origin master

  echo "Done: https://github.com/$GITHUB_OWNER/$repo_name"
  echo ""
done

echo "=== All repos created ==="
echo ""
echo "Update your example-session.json with one of these URLs:"
for project_dir in "$EXAMPLES_DIR"/*/; do
  project_name=$(basename "$project_dir")
  repo_name="agentforge-example-${project_name}"
  echo "  https://github.com/$GITHUB_OWNER/$repo_name.git"
done
