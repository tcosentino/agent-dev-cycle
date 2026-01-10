# Effective Harnesses for Long-Running Agents

**Published:** November 26, 2025
**Source:** https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

## Overview

Anthropic research addresses a fundamental challenge in AI agent development: enabling Claude to maintain consistent progress across multiple context windows. As agents tackle increasingly complex tasks spanning hours or days, the limitation of discrete sessions with no memory between them becomes critical.

## The Core Problem

Long-running agents face a structural challenge: each new session begins without context from previous work. The research team compared this to "engineers working in shifts, where each new engineer arrives with no memory of what happened on the previous shift."

Even advanced models like Claude Opus 4.5 struggle without proper infrastructure. Two primary failure patterns emerged during testing:

1. **Over-ambition**: Agents attempted to complete entire projects in single sessions, running out of context mid-implementation and leaving features half-documented
2. **Premature completion**: Later agent instances would observe existing progress and declare work finished

## Proposed Solution: Two-Agent Architecture

The research introduces a dual-component approach:

**Initializer Agent** sets up the foundation with:
- `init.sh` script for environment setup
- `claude-progress.txt` for work history
- Comprehensive feature list in JSON format

**Coding Agent** handles subsequent sessions by:
- Working incrementally on single features
- Leaving clean, documented code
- Using git commits and progress updates

## Environmental Management Strategies

### Feature List System

The initializer creates a JSON-structured list expanding specifications into granular features (200+ for the claude.ai clone example). Features start marked "failing," guiding agents through systematic completion.

### Incremental Progress Model

Rather than attempting entire applications, agents tackle one feature per session. Git commits with descriptive messages enable code rollback and state recovery.

### Testing Infrastructure

Claude improved significantly when given browser automation tools (Puppeteer MCP). "Providing Claude with these kinds of testing tools dramatically improved performance" by enabling end-to-end verification.

## Session Startup Protocol

Each session follows structured initialization:
- Check working directory
- Review git logs and progress files
- Run development server
- Verify baseline functionality
- Select next incomplete feature

This prevents agents from discovering broken states mid-implementation.

## Open Questions

The research acknowledges remaining uncertainties about multi-agent architectures versus single general-purpose agents, and whether findings generalize beyond web development to scientific research or financial modeling.

**Written by:** Justin Young with contributions from team members across Anthropic's code RL and Claude Code teams.
