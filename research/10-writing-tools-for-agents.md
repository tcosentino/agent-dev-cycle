# Writing Effective Tools for Agents - With Agents

**Published:** September 11, 2025
**Source:** https://www.anthropic.com/engineering/writing-tools-for-agents

## Overview

Agents are only as effective as the tools we give them. This article shares how to write high-quality tools and evaluations, and how you can boost performance by using Claude to optimize its tools for itself.

## Introduction

The Model Context Protocol (MCP) can empower LLM agents with potentially hundreds of tools to solve real-world tasks. However, maximizing tool effectiveness requires a systematic approach.

The post describes techniques for improving performance in agentic AI systems through:

- Building and testing tool prototypes
- Creating and running comprehensive evaluations with agents
- Collaborating with agents like Claude Code to automatically increase tool performance

## Key Principles for Effective Tools

**Choosing the Right Tools**

More tools don't always improve outcomes. Rather than wrapping every API endpoint, design thoughtful tools targeting high-impact workflows. Tools should consolidate functionality, handling multiple operations under the hood while reducing the context agents consume.

**Namespacing**

Group related tools under common prefixes to delineate boundaries. For example, organize by service (`asana_search`, `jira_search`) and resource (`asana_projects_search`, `asana_users_search`).

**Meaningful Context**

Return only high-signal information to agents. Prioritize contextual relevance over flexibility. Replace cryptic identifiers with semantic language, as agents handle natural language names more successfully.

**Token Efficiency**

Implement pagination, filtering, and truncation with sensible defaults. Provide helpful, actionable error messages that steer agents toward token-efficient strategies rather than opaque error codes.

**Tool Descriptions**

Prompt-engineer descriptions thoroughly. Think of how you'd explain tools to a new team member. Make implicit context explicit, avoid ambiguity, and clearly describe expected inputs and outputs.

## Building and Testing Tools

Start with quick prototypes using Claude Code. Test locally by wrapping tools in local MCP servers or Desktop extensions. Gather user feedback to understand expected use cases.

## Running Evaluations

Generate realistic evaluation tasks based on actual workflows. Each task should be paired with verifiable outcomes. Run evaluations programmatically using simple agentic loops, and instruct agents to output reasoning before tool calls to trigger chain-of-thought behaviors.

Collect metrics beyond accuracy: total runtime, tool call counts, token consumption, and error rates. These reveal common workflows and consolidation opportunities.

## Collaborating with Agents

Let Claude analyze evaluation transcripts and improve tools automatically. Most advice in the article came from repeatedly optimizing internal tools with Claude Code, relying on held-out test sets to prevent overfitting.

## Looking Ahead

Effective tools are intentionally defined, use agent context judiciously, combine in diverse workflows, and enable agents to solve real-world tasks intuitively. As LLMs and the MCP protocol evolve, systematic evaluation-driven approaches ensure tools develop alongside agent capabilities.
