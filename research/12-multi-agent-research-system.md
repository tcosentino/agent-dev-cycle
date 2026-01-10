# How We Built Our Multi-Agent Research System

**Published:** June 13, 2025
**Source:** https://www.anthropic.com/engineering/multi-agent-research-system

## Overview

Anthropic's Research feature leverages multiple Claude agents working together to explore complex topics. The article details engineering challenges and lessons learned in building this production system.

## Key Benefits of Multi-Agent Systems

Multi-agent architectures excel at open-ended research tasks where "it's very difficult to predict the required steps in advance." Rather than following fixed paths, these systems adapt dynamically based on discoveries.

The system achieves 90.2% performance improvement over single-agent approaches on internal evaluations. Performance gains come primarily from token usage—which accounts for 80% of variance—combined with tool calls and model choice.

However, there's a tradeoff: agents consume "about 4x more tokens than chat interactions, and multi-agent systems use about 15x more tokens than chats."

## Architecture Overview

Anthropic uses an orchestrator-worker pattern where a lead agent coordinates while specialized subagents operate in parallel. When users submit queries, the lead agent:

- Analyzes the request and develops strategy
- Spawns subagents to explore different aspects simultaneously
- Synthesizes results and determines if more research is needed
- Passes findings to a CitationAgent for source attribution

This differs from static Retrieval Augmented Generation by dynamically adapting searches based on emerging findings.

## Prompt Engineering Principles

Eight core principles guide agent prompting:

1. **Think like your agents** - Understand prompt effects through simulations
2. **Teach delegation** - Provide clear task descriptions with objectives and boundaries
3. **Scale effort appropriately** - Embed scaling rules for different query complexities
4. **Design tools carefully** - Ensure distinct purposes and clear descriptions
5. **Enable self-improvement** - Let agents diagnose and suggest prompt improvements
6. **Start wide, then narrow** - Begin with broad queries before focusing specifics
7. **Guide thinking processes** - Use extended thinking as a controllable scratchpad
8. **Parallelize execution** - Spin up multiple subagents and tools simultaneously

## Evaluation Strategies

Rather than checking if agents follow prescribed steps, evaluation focuses on outcomes. The team uses:

- **Small sample testing** - Start with ~20 test cases to identify high-impact changes
- **LLM-as-judge** - Single rubric evaluating factual accuracy, citations, completeness, source quality, and efficiency
- **Human review** - Catch edge cases and subtle biases automated evaluation misses

## Production Challenges

Managing agents at scale requires addressing:

- **Stateful operations** - Resuming from error points rather than restarting completely
- **Debugging complexity** - Non-deterministic behavior demands new observability approaches
- **Deployment coordination** - Using rainbow deployments to avoid disrupting running agents
- **Synchronous bottlenecks** - Current sequential execution limits parallelism potential

## Real-World Impact

Users report that Research helped them "find business opportunities they hadn't considered, navigate complex healthcare options, resolve thorny technical bugs, and save up to days of work."

---

*Written by Jeremy Hadfield, Barry Zhang, Kenneth Lien, Florian Scholz, Jeremy Fox, and Daniel Ford*
