# Introducing Advanced Tool Use on the Claude Developer Platform

**Published:** November 24, 2025
**Source:** https://www.anthropic.com/engineering/advanced-tool-use

## Overview

Anthropic has released three beta features enabling Claude to dynamically discover, learn, and execute tools. These capabilities address fundamental challenges in building AI agents that work across hundreds or thousands of tools.

## The Three New Features

### 1. Tool Search Tool

**Problem Solved:** "Tool definitions provide important context, but as more servers connect, those tokens can add up" to consume 50,000+ tokens before an agent reads a request.

**Solution:** Instead of loading all tool definitions upfront, Claude discovers tools on-demand. In testing, this achieved "an 85% reduction in token usage while maintaining access to your full tool library."

Key benefits:
- Reduces context consumption from ~77K to ~8.7K tokens
- Improved accuracy: Opus 4 from 49% to 74%, Opus 4.5 from 79.5% to 88.1%
- Tools marked with `defer_loading: true` load only when needed

### 2. Programmatic Tool Calling

**Problem Solved:** Traditional tool calling creates "context pollution from intermediate results" and requires multiple inference passes for complex workflows.

**Solution:** Claude writes Python code orchestrating multiple tools simultaneously. Tool results process in a sandboxed environment rather than entering Claude's context.

Performance improvements:
- "37% reduction on complex research tasks" (43,588 to 27,297 tokens)
- Reduced latency by eliminating inference passes between tool calls
- Knowledge retrieval improved from 25.6% to 28.5%

### 3. Tool Use Examples

**Problem Solved:** JSON schemas define structure but cannot express usage patterns—when to include optional parameters or which parameter combinations make sense.

**Solution:** Provide concrete example tool calls demonstrating proper usage. "Tool use examples improved accuracy from 72% to 90% on complex parameter handling."

## Implementation Guidance

**When to use Tool Search Tool:**
- Tool definitions consuming >10K tokens
- Working with MCP systems featuring multiple servers
- 10+ tools available

**When to use Programmatic Tool Calling:**
- Processing large datasets requiring only aggregates or summaries
- Multi-step workflows with three or more dependent tool calls
- Parallel operations across many items

**When to use Tool Use Examples:**
- Complex nested structures where valid JSON doesn't guarantee correct usage
- APIs with domain-specific conventions
- Similar tools needing clarification

## Getting Started

These features are available in beta. Enable them by adding the beta header:

```python
client.beta.messages.create(
    betas=["advanced-tool-use-2025-11-20"],
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    tools=[...]
)
```

Documentation, cookbooks, and code examples are available on the Claude Developer Platform.

## Key Insight

"These features move tool use from simple function calling toward intelligent orchestration. As agents tackle more complex workflows spanning dozens of tools and large datasets, dynamic discovery, efficient execution, and reliable invocation become foundational."
