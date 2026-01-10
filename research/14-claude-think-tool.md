# The "think" Tool: Enabling Claude to Stop and Think in Complex Tool Use Situations

**Published:** March 20, 2025
**Source:** https://www.anthropic.com/engineering/claude-think-tool

## Summary

Anthropic has introduced a "think" tool that enhances Claude's ability to handle complex problem-solving tasks. This feature creates dedicated space for structured reasoning during tool use, particularly benefiting scenarios involving policy compliance and multi-step decision-making.

## Key Distinction

The think tool differs from extended thinking. While extended thinking operates before response generation, the think tool functions during generation, allowing Claude to pause and assess information completeness mid-response. This makes it especially valuable for analyzing tool outputs across long call chains.

## Performance Results

### Tau-Bench Evaluation

Testing across customer service domains revealed significant improvements:

- **Airline domain:** "The think tool with optimized prompt achieved 0.570 on pass^1...a 54% relative improvement" compared to baseline
- **Retail domain:** Performance reached 0.812 versus 0.783 baseline

Results demonstrated that pairing the tool with domain-specific examples substantially outperformed unprompted implementations.

### SWE-Bench Results

The tool contributed to Claude 3.7 Sonnet's state-of-the-art 0.623 score, with isolated testing showing 1.6% average performance improvement (statistically significant).

## Recommended Use Cases

The think tool excels in:

1. **Tool output analysis** - Processing previous tool call results before proceeding
2. **Policy-heavy environments** - Following detailed compliance guidelines
3. **Sequential decision-making** - Multi-step scenarios where errors prove costly

## Implementation Guidance

Developers should:

- Provide clear instructions with domain-specific examples in system prompts
- Place complex guidance in the system prompt rather than tool descriptions
- Monitor practical usage and refine prompting strategies accordingly

The approach requires minimal code while enabling structured reasoning without external behavior changes.
