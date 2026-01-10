# Raising the Bar on SWE-bench Verified with Claude 3.5 Sonnet

**Published:** January 6, 2025
**Source:** https://www.anthropic.com/engineering/swe-bench-sonnet

## Overview

Claude 3.5 Sonnet achieved a 49% score on SWE-bench Verified, surpassing the previous state-of-the-art performance of 45%. The article explains the agent architecture built around the model and provides guidance for developers optimizing Claude 3.5 Sonnet performance.

## What is SWE-bench?

SWE-bench is an evaluation framework assessing AI models' ability to resolve real GitHub issues in Python repositories. Models receive a prepared environment and repository checkout, then must understand, modify, and test code before submitting solutions. Results are graded against actual unit tests from the pull requests that resolved the original issues.

The benchmark evaluates entire "agent" systems—combining the language model with scaffolding responsible for prompt generation, output parsing, and interaction management. Performance varies significantly based on this scaffolding architecture, even with identical underlying models.

## Why SWE-bench Matters

Three factors distinguish this benchmark:

1. **Real-world tasks** from actual projects rather than competition-style questions
2. **Room for improvement** with no model yet exceeding 50%
3. **Complete system evaluation** of agents, not isolated models

SWE-bench Verified contains 500 human-reviewed problems ensuring solvability and providing accurate performance measurement.

## Agent Design Philosophy

The optimized agent uses minimal scaffolding with maximum model control. Key components include:

- A prompt outlining suggested approaches
- Bash Tool for command execution
- Edit Tool for file viewing and modification
- Continued sampling until model completion or 200k context limit

The model determines its own workflow rather than following hardcoded patterns.

### Tool Specifications

**Bash Tool** executes commands with descriptions covering input handling, package availability, and background process management.

**Edit Tool** provides viewing, creating, and editing capabilities with string-replacement-based modifications. Careful tool design prevents common errors like incorrect file paths.

## Performance Results

| Model | SWE-bench Verified Score |
|-------|------------------------|
| Claude 3.5 Sonnet (new) | 49% |
| Previous SOTA | 45% |
| Claude 3.5 Sonnet (old) | 33% |
| Claude 3 Opus | 22% |

## Agent Behavior Example

In one typical task resolving a RidgeClassifierCV parameter issue:

1. Model explored repository structure
2. Created reproduction script confirming the error
3. Identified missing `store_cv_values` parameter in class constructor
4. Modified source code adding parameter and passing it to parent class
5. Verified fix with reproduction script

The model completed this task in 12 steps, though many solutions required over 100 turns and >100k tokens.

## Key Improvements Observed

Updated Claude 3.5 Sonnet demonstrates:
- Enhanced self-correction compared to older models
- Ability to attempt multiple solution strategies
- Avoidance of repetitive mistake patterns

## Challenges in Complex Evaluation

**Duration and Cost:** Successful runs often consume hundreds of turns and substantial token usage, increasing computational expenses.

**Grading Complexity:** Environment setup issues and patch application problems can produce inaccurate performance assessments beyond model capability.

**Hidden Tests:** Models cannot view grading tests, leading to false success perceptions. Some failures stem from solving problems at wrong abstraction levels.

**Multimodal Limitations:** Despite strong vision capabilities, the implementation lacks file system visualization or URL image viewing, complicating Matplotlib-related task debugging.

## Conclusion

Claude 3.5 Sonnet achieved state-of-the-art performance using straightforward prompting and general-purpose tools. Developers can leverage this foundation to identify further optimization opportunities for improved benchmark results.

## Acknowledgments

Erik Schluntz optimized the SWE-bench agent and authored this post. Simon Biggs, Dawn Drain, and Eric Christiansen implemented the benchmark. Multiple team members contributed to Claude 3.5 Sonnet's agentic coding capabilities.
