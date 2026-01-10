# Code Execution with MCP: Building More Efficient Agents

**Published:** November 4, 2025
**Source:** https://www.anthropic.com/engineering/code-execution-with-mcp

## Summary

"Direct tool calls consume context for each definition and result. Agents scale better by writing code to call tools instead."

## Key Problems with Traditional Tool Integration

### Token Consumption Issues

When AI agents connect to numerous tools through the Model Context Protocol (MCP), two inefficiencies emerge:

1. **Tool Definition Overhead**: Loading all tool definitions upfront consumes substantial context window space. For agents with hundreds or thousands of tools, this can mean processing hundreds of thousands of tokens before addressing user requests.

2. **Intermediate Results Duplication**: When agents retrieve data to use in subsequent operations, that information must pass through the model context multiple times. For example, downloading a meeting transcript and attaching it to a CRM entry means the full transcript flows through the context twice—potentially adding 50,000+ tokens for lengthy documents.

## The Code Execution Solution

Rather than exposing tools as direct function calls, agents can interact with MCP servers by writing executable code. This approach enables:

### Progressive Tool Discovery
Models can navigate a filesystem structure representing available tools, reading specific tool definitions on-demand rather than loading everything upfront. This reduces token usage from approximately 150,000 to 2,000 tokens—a **98.7% reduction**.

### Data Filtering in Execution Environment
Agents can process results before returning them to the model. Fetching a 10,000-row spreadsheet and filtering to only pending orders means the model sees only relevant rows, not the entire dataset.

### Advanced Control Flow
Code patterns like loops and conditionals execute directly rather than requiring repeated model evaluations, improving both efficiency and latency.

## Privacy and State Management Benefits

- **Data Protection**: Sensitive information stays in the execution environment by default, preventing accidental exposure to the model
- **Tokenization**: PII can be automatically tokenized before reaching the model while remaining functional for downstream tool calls
- **Persistence**: Agents can save intermediate results and reusable code functions for future tasks

## Implementation Considerations

Code execution requires secure sandboxing, resource limits, and monitoring infrastructure. These operational requirements should be weighed against the efficiency gains and improved tool composition that code execution enables.
