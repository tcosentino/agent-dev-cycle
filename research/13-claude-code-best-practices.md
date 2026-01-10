# Claude Code: Best Practices for Agentic Coding

**Published:** April 18, 2025
**Source:** https://www.anthropic.com/engineering/claude-code-best-practices

## Overview

Claude Code is a command line tool for agentic coding that Anthropic recently released. This resource outlines proven patterns for using Claude Code across various codebases, languages, and environments.

## 1. Customize Your Setup

### Create CLAUDE.md Files

Special `CLAUDE.md` files automatically load into context when starting conversations. Use them to document:

- Common bash commands
- Core files and utility functions
- Code style guidelines
- Testing instructions
- Repository practices
- Developer environment setup
- Project-specific behaviors

You can place these files in your repository root, parent directories, child directories, or home folder (`~/.claude/CLAUDE.md`).

### Tune Your Documentation

Treat `CLAUDE.md` files like frequently-used prompts—iterate and refine them. Use the `#` key to have Claude automatically incorporate instructions into your documentation. Anthropic occasionally runs these through prompt improvers to enhance model adherence.

### Curate Allowed Tools

Claude Code conservatively requests permission for system-modifying actions. Manage permissions through:

- "Always allow" prompts during sessions
- `/permissions` command
- Manual edits to `.claude/settings.json`
- `--allowedTools` CLI flag

### Install GitHub CLI

Claude can use the `gh` CLI for GitHub interactions like creating issues and pull requests.

## 2. Give Claude More Tools

### Use Bash Tools

Claude inherits your bash environment. Document custom tools in `CLAUDE.md` and tell Claude to run `--help` for documentation.

### Use MCP

Claude Code functions as both MCP server and client. Configure MCP servers in project config, global config, or checked-in `.mcp.json` files.

### Use Custom Slash Commands

Store prompt templates in `.claude/commands` folder as Markdown files. Use `$ARGUMENTS` for parameters. Place personal commands in `~/.claude/commands`.

## 3. Common Workflows

### Explore, Plan, Code, Commit

1. Have Claude read relevant files without writing code
2. Ask Claude to create a plan (use "think," "think hard," or "ultrathink" for extended thinking)
3. Have Claude implement the solution
4. Ask Claude to commit and create pull requests

### Test-Driven Development

1. Request tests based on expected inputs/outputs
2. Verify tests fail
3. Commit tests
4. Have Claude write code to pass tests
5. Commit the code

### Visual Development

1. Provide screenshot capabilities (Puppeteer, simulators, or manual screenshots)
2. Give Claude design mocks
3. Have Claude implement designs and iterate
4. Commit results

### Safe YOLO Mode

Use `claude --dangerously-skip-permissions` to skip permission checks. Run this only in containers without internet access for safety.

### Codebase Q&A

Ask Claude questions about codebases like you would a team member. Claude can search code to answer questions about functionality, patterns, and design decisions.

### Git Interactions

Claude can handle searching git history, writing commit messages, and managing complex git operations.

### GitHub Interactions

Claude can create pull requests, fix code review comments, resolve build failures, and triage issues.

### Jupyter Notebooks

Claude can read, write, and improve Jupyter notebooks with proper image interpretation.

## 4. Optimize Your Workflow

### Be Specific in Instructions

Detailed directions improve first-attempt success and reduce course corrections.

### Give Claude Images

Provide screenshots, diagrams, or file paths. This particularly helps with design-driven development and visual analysis.

### Mention Files Explicitly

Use tab-completion to reference specific files and folders for Claude to work with.

### Provide URLs

Paste URLs for Claude to fetch. Use `/permissions` to allowlist domains and avoid repeated prompts.

### Course Correct Early

- Ask Claude to plan before coding
- Press Escape to interrupt at any phase
- Double-tap Escape to jump back and try different approaches
- Request undos when needed

### Use /clear Between Tasks

Reset context windows during long sessions to maintain performance.

### Use Checklists for Complex Tasks

Have Claude create Markdown checklists for migrations or large fixes, checking off items as they complete.

### Pass Data Multiple Ways

- Copy and paste directly
- Pipe data into Claude Code (e.g., `cat foo.txt | claude`)
- Tell Claude to pull data via bash or tools
- Ask Claude to read files or fetch URLs

## 5. Automate with Headless Mode

Use `-p` flag with prompts for non-interactive contexts like CI, hooks, and scripts. Use `--output-format stream-json` for structured output.

### Issue Triage

Automate GitHub event-triggered actions to label and categorize issues.

### Code Review

Claude provides subjective reviews beyond traditional linting, catching typos, stale comments, and misleading names.

## 6. Multi-Claude Workflows

### Separate Writers and Reviewers

Have one Claude write code while another reviews it, then have a third Claude integrate feedback.

### Multiple Repository Checkouts

Create 3-4 separate checkouts in different folders and run parallel Claude sessions on different tasks.

### Git Worktrees

Use `git worktree` for lighter-weight parallel work on independent tasks.

### Headless Mode with Custom Harness

**Fanning out:** Generate task lists and loop through programmatically calling Claude for each task.

**Pipelining:** Call `claude -p "<prompt>" --json | your_command` to integrate into existing pipelines.

Use `--verbose` for debugging and disable it in production.

---

## Acknowledgments

Written by Boris Cherny, drawing on best practices from the broader Claude Code community. Special thanks to Daisy Hollman, Ashwin Bhat, Cat Wu, Sid Bidasaria, Cal Rueb, Nodir Turakulov, Barry Zhang, Drew Hodun, and other Anthropic engineers who contributed insights.
