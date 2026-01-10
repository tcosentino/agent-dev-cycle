# AgentForge Research Synthesis

This document extracts actionable insights from Anthropic's engineering blog specifically for building the AgentForge multi-agent software development system.

**AgentForge Context:**
- 8 specialized agents across 4 phases (Discovery, Shaping, Building, Delivery)
- Orchestrator-worker pattern with message bus coordination
- Human checkpoints at phase boundaries
- Target: SMB custom software in 1-6 weeks

---

## 1. Agent Architecture Patterns

### Orchestrator-Worker Pattern (from Multi-Agent Research System)

AgentForge's architecture aligns with Anthropic's proven pattern:

```
Lead Agent (Planning Agent) coordinates
  |
  +-- Spawns subagents for parallel exploration
  |-- Synthesizes results
  +-- Determines if more work needed
```

**Key insight:** Multi-agent systems achieve 90% performance improvement over single-agent but consume 15x more tokens than chat. Budget for this.

**For AgentForge:**
- Planning Agent should be the orchestrator in Discovery/Shaping
- Coding Agent becomes orchestrator in Building phase
- DevOps Agent orchestrates in Delivery

### Prompt Engineering Principles (8 core principles)

1. **Think like your agents** - Simulate prompts before deployment
2. **Teach delegation** - Clear task descriptions with objectives and boundaries
3. **Scale effort appropriately** - Embed scaling rules for different query complexities
4. **Design tools carefully** - Ensure distinct purposes, no overlap
5. **Enable self-improvement** - Let agents diagnose and suggest prompt improvements
6. **Start wide, then narrow** - Broad exploration before focusing
7. **Guide thinking processes** - Use extended thinking as controllable scratchpad
8. **Parallelize execution** - Multiple subagents working simultaneously

---

## 2. Agent Definition Best Practices

### From Claude Code Best Practices

**CLAUDE.md pattern maps directly to AgentForge agent definitions:**

```markdown
---
name: agent-identifier
description: Brief description
model: opus | sonnet | haiku
---

System prompt content...
```

**What to include:**
- Role definition ("You are an expert...")
- Numbered behavioral principles
- Explicit constraints ("What this agent does NOT do")
- Process steps (makes behavior predictable/debuggable)
- Context awareness (reference project files, not hardcoded rules)

### Model Selection by Agent

| Agent | Recommended Model | Rationale |
|-------|------------------|-----------|
| Planning Agent | opus | Complex reasoning, architectural decisions |
| Research Agent | sonnet | Balanced, web search and synthesis |
| UX Agent | sonnet | Design patterns, accessibility |
| Coding Agent | sonnet (upgrade to opus for complex) | Most general work, confidence routing |
| Review Agent | opus | High-stakes, low volume, nuanced judgment |
| Testing Agent | haiku or self-hosted | Structured output, high volume, verifiable |
| DevOps Agent | sonnet | Procedural, well-defined tasks |
| Monitoring Agent | haiku | Structured metrics, high volume |

---

## 3. Long-Running Agent Harnesses

### Critical for AgentForge's Multi-Week Projects

From "Effective Harnesses for Long-Running Agents":

**Problem:** Each session starts with no memory. Like "engineers working in shifts where each new engineer arrives with no memory of what happened."

**Two failure patterns to avoid:**
1. **Over-ambition** - Agent tries to complete too much, runs out of context mid-implementation
2. **Premature completion** - Later sessions see existing work and declare done

**Solution: Two-Agent Architecture**

1. **Initializer Agent** sets up:
   - `init.sh` script for environment setup
   - `progress.txt` for work history
   - Feature list in JSON format (all start "failing")

2. **Session Agent** follows startup protocol:
   - Check working directory
   - Review git logs and progress files
   - Run dev server, verify baseline
   - Select next incomplete feature
   - Work on ONE feature per session
   - Commit with descriptive messages

**For AgentForge:**
- Each project needs a `project-state.json` tracking phase, completed tasks, and next actions
- Agents should read state before starting, update before ending
- Git commits as checkpoints enable rollback
- Testing tools (Puppeteer MCP) dramatically improve performance

---

## 4. Context Engineering

### The Central Challenge for Multi-Agent Systems

From "Effective Context Engineering for AI Agents":

**Core insight:** Context is a precious, finite resource. Models experience "context rot" - ability to recall degrades as context grows.

**Strategies for AgentForge:**

1. **Just-in-time context loading**
   - Don't pre-load all project files
   - Agents maintain file paths, load when needed
   - Use tool calls to retrieve specific context

2. **Compaction**
   - Summarize conversation history at context limits
   - Claude Agent SDK does this automatically

3. **Sub-agent isolation**
   - Each agent maintains focused context
   - Returns condensed summaries to orchestrator
   - Prevents token bloat across handoffs

4. **System prompt organization**
   - Use XML tags or markdown headers
   - Balance specificity with flexibility
   - Avoid hardcoded logic

**Token budget implications:**
- Planning tasks (high context): opus with 100K+ budget
- Coding tasks (focused): sonnet with 50K budget
- Testing tasks (structured): haiku with 20K budget

---

## 5. Tool Design for Agents

### Making Agent-Computer Interfaces (ACI) Effective

From "Writing Effective Tools for Agents" and "Building Effective Agents":

**Key principles:**

1. **Consolidate functionality** - Don't wrap every API endpoint; design thoughtful tools targeting workflows

2. **Namespacing** - Group related tools:
   ```
   project_tasks_list
   project_tasks_create
   project_tasks_update
   code_file_read
   code_file_write
   code_test_run
   ```

3. **Return high-signal information** - Only what agents need, not everything available

4. **Token efficiency** - Implement pagination, filtering, sensible defaults

5. **Prompt-engineer descriptions** - Explain like teaching a new team member

**AgentForge tool categories:**

| Category | Tools | Used By |
|----------|-------|---------|
| Project State | read_project, update_phase, get_tasks | All agents |
| Code | read_file, write_file, search_code, run_tests | Coding, Review, Testing |
| Research | web_search, fetch_url, analyze_competitor | Research |
| UI/UX | generate_mockup, check_accessibility | UX |
| Deploy | deploy_staging, deploy_production, rollback | DevOps |
| Metrics | get_usage_data, get_error_rates | Monitoring |

---

## 6. Agent Evaluation Strategy

### Building Confidence Before Reducing Human Oversight

From "Demystifying Evals for AI Agents":

**Two eval types needed:**

1. **Capability evals** - "What can this agent do well?"
   - Start with low pass rates, target difficult tasks
   - Expand as capabilities proven

2. **Regression evals** - "Does the agent still handle previous tasks?"
   - Should maintain near-100% pass rates
   - Catch degradation from model updates or prompt changes

**For AgentForge MVP → Full Automation path:**

| Phase | Human Involvement | Evals Focus |
|-------|-------------------|-------------|
| MVP | Human reviews all outputs | Build capability evals from failures |
| Phase 2 | Spot-checks only | Regression evals on "solved" patterns |
| Phase 3 | Exception handling | Automated quality gates |

**Grader types to combine:**

- **Code-based** for Testing Agent (tests pass/fail)
- **Model-based** for Review Agent (rubric scoring)
- **Human** for UX Agent (periodic calibration)

**Key metrics to track:**
- Pass rate by agent and task type
- Token consumption per task
- Time to completion
- Human override frequency
- Customer satisfaction post-delivery

---

## 7. The Think Tool for Complex Decisions

### Enabling Pause-and-Reflect During Tool Chains

From "The Think Tool":

**When to use:**
- Policy-heavy environments (Review Agent checking security)
- Sequential decision-making (Planning Agent choosing approach)
- Tool output analysis (Coding Agent interpreting test results)

**Implementation:**
```python
{
  "name": "think",
  "description": "Pause to analyze information and plan next steps before proceeding"
}
```

**Results:** 54% improvement on complex policy compliance tasks.

**For AgentForge:**
- Review Agent should use think tool before approving code
- Planning Agent should use before finalizing scope decisions
- Coding Agent should use after test failures to analyze

---

## 8. Code Execution Efficiency

### Reducing Token Consumption for High-Volume Operations

From "Code Execution with MCP" and "Advanced Tool Use":

**Problem:** Traditional tool calling creates "context pollution" - intermediate results fill context.

**Solution:** Programmatic tool calling - Claude writes Python to orchestrate tools, results processed in sandbox rather than entering context.

**Token reduction:** 37% on complex research tasks, 98.7% for tool discovery.

**For AgentForge:**
- Testing Agent running many tests should use code execution
- Research Agent aggregating multiple sources benefits
- Build pipeline operations (many file reads/writes) should batch

**Tool Search pattern:**
Instead of loading all tool definitions upfront:
- Mark tools with `defer_loading: true`
- Agent discovers tools on-demand
- 85% reduction in token usage

---

## 9. Security and Sandboxing

### Enabling Autonomy While Maintaining Safety

From "Claude Code Sandboxing":

**The approval fatigue problem:** Too many permission prompts → users stop reading → paradoxically less safe.

**Solution: Sandboxing architecture**

1. **Filesystem isolation** - Agents can only access project directories
2. **Network isolation** - Connect only to approved servers via proxy

**For AgentForge:**
- Coding Agent sandboxed to project repo + npm/pip registries
- DevOps Agent sandboxed to deployment targets only
- Research Agent allowed web access but not local filesystem

**Result:** 84% reduction in permission prompts while maintaining security.

---

## 10. Agent Skills Framework

### Packaging Domain Knowledge for Reuse

From "Agent Skills":

Agent Skills = directories with `SKILL.md` and supporting files.

**Progressive disclosure pattern:**
1. Metadata level - names/descriptions in system prompt
2. Core level - full SKILL.md when relevant
3. Modular level - additional files as needed

**For AgentForge:**
Skills could package:
- Industry-specific knowledge (auto parts, healthcare, etc.)
- Common integration patterns (Stripe, Twilio, etc.)
- UI component libraries
- Testing frameworks

**Example skill structure:**
```
skills/
  stripe-integration/
    SKILL.md           # How to integrate Stripe
    checkout-flow.md   # Specific checkout implementation
    webhook-handler.py # Template code
  auto-parts-domain/
    SKILL.md           # Industry terminology and patterns
    inventory-model.md # Common data structures
```

---

## 11. Observable Process Implementation

### The Slack-Like Interface Pattern

From various posts on transparency:

AgentForge's "observable process" where customers watch agents collaborate aligns with Anthropic's transparency principle.

**Implementation considerations:**
- Stream agent thinking to chat interface
- Show tool calls as they happen
- Display artifacts (code, diagrams) in context panel
- Make handoffs between agents visible

**Benefits:**
- Builds customer trust
- Enables early course correction
- Creates natural checkpoints for feedback
- Supports debugging when things go wrong

---

## 12. Recommended Implementation Order

Based on research synthesis, build AgentForge agents in this order:

### Phase 1: Foundation
1. **Planning Agent** - Orchestrator, needs to work first
2. **Coding Agent** - Core value delivery
3. **Testing Agent** - Enables automated validation

### Phase 2: Quality Loop
4. **Review Agent** - Code quality gate
5. **Research Agent** - Enhanced discovery

### Phase 3: Full Pipeline
6. **UX Agent** - Design quality
7. **DevOps Agent** - Deployment automation
8. **Monitoring Agent** - Feedback loop

### Each agent needs:
- [ ] Agent definition (SKILL.md style)
- [ ] Tool definitions with namespacing
- [ ] Capability evals (start with 20-50 tasks)
- [ ] Regression evals (build from failures)
- [ ] Context management strategy
- [ ] Handoff protocol to next agent

---

## Quick Reference: Key Metrics

| Metric | Target | Source |
|--------|--------|--------|
| Token efficiency | 50% reduction vs naive | Code execution, tool search |
| Multi-agent performance | 90% over single agent | Orchestrator-worker pattern |
| Permission prompts | 84% reduction | Sandboxing |
| Complex task accuracy | 54% improvement | Think tool |
| Context utilization | < 80% of limit | Compaction, sub-agents |

---

## Sources

All insights derived from Anthropic engineering blog posts:
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Demystifying Evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Writing Tools for Agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [The Think Tool](https://www.anthropic.com/engineering/claude-think-tool)
- [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Advanced Tool Use](https://www.anthropic.com/engineering/advanced-tool-use)
- [Claude Code Sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing)
- [Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
