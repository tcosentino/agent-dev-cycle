# Equipping Agents for the Real World with Agent Skills

**Published:** October 16, 2025
**Source:** https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills

## Overview

Anthropic introduced Agent Skills, a framework for building specialized AI agents using organized folders of instructions, scripts, and resources. This approach transforms general-purpose agents into domain-specific tools by packaging procedural knowledge into composable, discoverable capabilities.

## What Are Agent Skills?

Agent Skills are directories containing a `SKILL.md` file with YAML frontmatter specifying `name` and `description` metadata. This structure enables progressive disclosure—Claude accesses only the information needed for current tasks rather than loading entire skill contexts upfront.

The framework operates across three levels of detail:

1. **Metadata level** - Skill names and descriptions loaded into system prompts at startup
2. **Core level** - Full `SKILL.md` content loaded when Claude determines relevance
3. **Modular level** - Additional referenced files (`reference.md`, `forms.md`, etc.) accessed contextually

## Progressive Disclosure Design

Skills leverage progressive disclosure as their core principle. Like a well-organized manual with table of contents, chapters, and appendices, this approach allows agents with filesystem and code execution tools to load information dynamically, making skill context capacity effectively unbounded.

## Code Execution Integration

Skills can bundle pre-written scripts for deterministic operations. For example, the PDF skill includes Python scripts that extract form fields without loading entire PDFs into context, combining efficiency with reliability.

## Development Guidelines

- **Start with evaluation** - Identify capability gaps through representative task testing
- **Structure for scale** - Split unwieldy files and maintain separate contexts for mutually exclusive scenarios
- **Think from Claude's perspective** - Monitor real usage patterns and iterate based on observations
- **Iterate with Claude** - Collaborate with Claude to capture successful approaches into reusable context

## Security Considerations

Skills provide new capabilities through instructions and code, creating potential vulnerability vectors. Anthropic recommends installing skills only from trusted sources, thoroughly auditing untrusted skills, and reviewing code dependencies and external network connections.

## Current Support & Future Direction

Agent Skills are currently supported across Claude.ai, Claude Code, the Claude Agent SDK, and the Claude Developer Platform. Anthropic plans to expand features supporting skill creation, discovery, sharing, and usage lifecycle. Future possibilities include enabling agents to create and evaluate their own skills.

## Resources

- [Agent Skills documentation](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [Skills cookbook](https://github.com/anthropics/claude-cookbooks/tree/main/skills)
- [Open standard announcement](https://agentskills.io/) (December 18, 2025)

**Authors:** Barry Zhang, Keith Lazuka, Mahesh Murag
