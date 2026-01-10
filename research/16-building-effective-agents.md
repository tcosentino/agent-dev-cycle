# Building Effective Agents

**Published:** December 19, 2024
**Source:** https://www.anthropic.com/engineering/building-effective-agents

## Overview

Anthropic shares insights from working with dozens of teams developing LLM agents. The key finding: "the most successful implementations use simple, composable patterns rather than complex frameworks."

## What Are Agents?

Anthropic distinguishes between two approaches:

- **Workflows**: Systems where LLMs and tools operate through predefined code paths
- **Agents**: Systems where LLMs dynamically direct their own processes and tool usage

## When to Use Agents

Not every application needs agents. The recommendation is to find the simplest solution first, adding complexity only when necessary. Agents trade latency and cost for better task performance—a tradeoff worth considering carefully.

## Common Patterns

### Building Block: Augmented LLM
The foundation combines LLMs with retrieval, tools, and memory capabilities.

### Workflows

**Prompt Chaining**: Decomposes tasks into sequential steps where each LLM call processes previous output.

**Routing**: Classifies inputs and directs them to specialized handlers, enabling separation of concerns.

**Parallelization**: Runs LLM calls simultaneously through sectioning (independent subtasks) or voting (multiple attempts).

**Orchestrator-Workers**: A central LLM dynamically breaks down tasks and delegates to worker LLMs.

**Evaluator-Optimizer**: One LLM generates responses while another provides iterative feedback.

### Agents

True agents operate autonomously in loops using tool feedback. They're ideal for open-ended problems where step counts can't be predicted.

## Three Core Principles

1. **Simplicity** in agent design
2. **Transparency** through explicit planning steps
3. **Documentation and testing** for agent-computer interfaces (ACI)

## Practical Applications

**Customer Support**: Agents combine chatbot interfaces with tool integration for accessing customer data and executing actions.

**Coding**: Software development benefits from agents because solutions are verifiable through automated tests and agents can iterate using test results.

## Tool Engineering

Tool definitions deserve as much attention as overall prompts. Formats should minimize cognitive load for models, avoid unnecessary escaping, and include clear documentation with example usage.
