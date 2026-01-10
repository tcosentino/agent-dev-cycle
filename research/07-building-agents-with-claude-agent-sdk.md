# Building Agents with the Claude Agent SDK

**Published:** September 29, 2025
**Source:** https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk

## Overview

The Claude Agent SDK is a collection of tools that helps developers construct powerful agents on top of Claude Code. This article provides guidance on getting started and shares best practices from Anthropic's team deployments.

## Key Background

Last year, Anthropic shared lessons in building effective agents with customers. Since then, Claude Code was released as an agentic coding solution originally designed to support developer productivity at Anthropic.

Over recent months, Claude Code evolved beyond a coding tool. Anthropic teams have used it for deep research, video creation, and note-taking. Consequently, the Claude Code SDK has been renamed to the Claude Agent SDK to reflect its broader vision.

## Core Design Principle: Giving Claude a Computer

The fundamental design principle is that "Claude needs the same tools that programmers use every day." This includes finding files, writing and editing code, linting, running, and debugging iteratively.

By providing Claude access to a computer via the terminal, the system can handle non-coding tasks effectively. Claude can read CSV files, search the web, build visualizations, and interpret metrics—enabling general-purpose agents with computer access.

## Types of Agents You Can Build

Developers can create:

- **Finance agents** that understand portfolios and evaluate investments through APIs and code
- **Personal assistant agents** for travel booking and calendar management
- **Customer support agents** handling high-ambiguity requests and user data
- **Deep research agents** conducting comprehensive research across document collections

## The Agent Loop

Agents typically operate in a feedback cycle:

**Gather Context → Take Action → Verify Work → Repeat**

### Gathering Context

**Agentic Search & File System:** The file system represents retrievable information. Claude uses bash scripts like `grep` and `tail` to selectively load large files, making folder structure a form of context engineering.

**Semantic Search:** Faster than agentic search but less accurate and harder to maintain. Start with agentic search; add semantic search only if speed becomes critical.

**Subagents:** Enable parallelization and context management. Multiple subagents work simultaneously on different tasks, returning only relevant information rather than full context.

**Compaction:** The SDK automatically summarizes previous messages when approaching context limits, preventing agents from running out of space.

### Taking Action

**Tools:** The primary execution building blocks. Tools should represent the main actions you want agents to take.

**Bash & Scripts:** Flexible general-purpose tool for computer-based work, such as downloading PDFs and converting them to searchable text.

**Code Generation:** Agents excel at generating precise, reusable code for complex operations. For example, Python scripts create Excel spreadsheets and PowerPoint presentations with consistent formatting.

**MCPs (Model Context Protocol):** Provides standardized integrations to external services like Slack, GitHub, Google Drive, and Asana without custom integration code or OAuth management.

### Verifying Work

Agents must evaluate their own output through:

**Defining Rules:** Clearly specify output rules and report which rules fail and why. Code linting provides excellent rules-based feedback.

**Visual Feedback:** For visual tasks, provide screenshots or renders for verification. Consider layout, styling, content hierarchy, and responsiveness.

**LLM as Judge:** Have another language model evaluate output based on fuzzy rules, though this is less robust and has latency tradeoffs.

## Testing and Improving Agents

After cycling through the agent loop, test thoroughly by examining failures carefully. Key evaluation questions:

- Does the agent have sufficient information to understand tasks?
- Can formal rules identify and fix repeated failures?
- Do available tools enable different problem-solving approaches?
- Does performance vary as features are added?

Build representative test sets for programmatic evaluations based on actual usage.

## Getting Started

Developers can begin using the Claude Agent SDK today. The SDK enables building reliable, deployable agents through the agent loop framework: gathering context, taking action, and verifying work.

For existing SDK users, migration to the latest version is recommended via official documentation.

## Acknowledgments

Written by Thariq Shihipar with notes and editing from Molly Vorwerck, Suzanne Wang, Alex Isken, Cat Wu, Keir Bradwell, Alexander Bricken, and Ashwin Bhat.
