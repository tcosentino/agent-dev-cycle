# Demystifying Evals for AI Agents

**Published:** January 9, 2026
**Source:** https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents

## Introduction

"Good evaluations help teams ship AI agents more confidently." Without them, organizations risk getting trapped in reactive loops where issues only surface in production. Evaluations make problems visible before they impact users, and their value compounds throughout an agent's lifecycle.

As outlined in previous guidance on building effective agents, these systems operate across many turns—calling tools, modifying state, and adapting based on intermediate results. The very capabilities that make agents useful (autonomy, intelligence, flexibility) simultaneously make them harder to evaluate.

## The Structure of Evaluations

An **evaluation** is fundamentally a test: provide an AI system with input, then apply grading logic to measure success. This discussion focuses on automated evaluations that can run during development without involving real users.

**Single-turn evaluations** remain straightforward: prompt, response, and grading logic. However, as AI capabilities have advanced, **multi-turn evaluations** have become increasingly common for complex agent scenarios.

**Agent evaluations** present even greater complexity. Agents use tools across multiple turns, modifying environment state and adapting continuously—meaning mistakes can compound. Interestingly, frontier models sometimes discover creative solutions exceeding static evaluation expectations. For instance, Claude 4.5 solved a τ2-bench flight-booking problem by identifying a policy loophole, technically "failing" the evaluation while delivering superior outcomes.

### Key Definitions

- **Task**: A single test with defined inputs and success criteria
- **Trial**: Each attempt at a task; multiple trials produce consistent results given model variability
- **Grader**: Logic scoring some aspect of agent performance; tasks can contain multiple graders with various assertions
- **Transcript**: The complete record of a trial, including all outputs, tool calls, reasoning, and interactions
- **Outcome**: Final environment state after trial completion
- **Evaluation harness**: Infrastructure running evals end-to-end
- **Agent harness**: System enabling models to function as agents
- **Evaluation suite**: Collection of tasks measuring specific capabilities

## Why Build Evaluations?

Teams initially progress through manual testing, dogfooding, and intuition. Yet once agents scale in production, this approach breaks down. The critical moment arrives when users report degraded performance and teams lack methods to verify changes besides guesswork.

Without evaluations, debugging becomes reactive: wait for complaints, reproduce manually, fix bugs, and hope nothing regressed. Teams cannot distinguish genuine regressions from noise or test changes against hundreds of scenarios automatically.

Evals deliver compounding benefits. They force product teams to specify success criteria early, provide baselines and regression tests, enable rapid model adoption, and create high-bandwidth communication channels between product and research teams.

## Types of Graders for Agents

Effective evaluations typically combine three grader types:

**Code-based graders** (string matching, static analysis, outcome verification) offer speed, cost-effectiveness, and reproducibility, but can be brittle to valid variations.

**Model-based graders** (rubric scoring, natural language assertions, consensus approaches) provide flexibility and nuance for open-ended tasks, though they're non-deterministic and require calibration.

**Human graders** (expert review, crowdsourcing, A/B testing) deliver gold-standard quality but prove expensive and slow.

### Capability vs. Regression Evals

**Capability evals** ask "what can this agent do well?" and should start with low pass rates, targeting difficult tasks.

**Regression evals** ask "does the agent still handle previous tasks?" and should maintain near-100% pass rates to detect performance degradation.

## Evaluating Different Agent Types

### Coding Agents

Coding agents write, test, and debug code. Deterministic graders work naturally here since software has clear pass/fail criteria. Benchmarks like SWE-bench Verified and Terminal-Bench demonstrate this approach's effectiveness.

### Conversational Agents

These interact with users in support, sales, or coaching contexts. Success involves multidimensional metrics: task resolution, turn efficiency, and tone appropriateness. Unlike most evals, these often require a second LLM simulating the user.

### Research Agents

These gather and synthesize information. Success depends on context—"comprehensive" means different things for market scans versus scientific reports. Combining graders helps: groundedness checks verify source support, coverage checks ensure key facts appear, and quality checks confirm authoritative sources.

### Computer Use Agents

These interact through GUIs like humans do. Evaluation requires sandboxed environments checking whether intended outcomes occurred. Browser-based agents must balance token efficiency against latency.

## Understanding Non-Determinism

**pass@k** measures the likelihood of getting at least one correct solution in k attempts. As k increases, this score rises.

**pass^k** measures the probability that all k trials succeed. This score decreases as k increases, becoming stricter.

## Building Evals: A Practical Roadmap

**Start early** with 20-50 simple tasks drawn from real failures. Small sample sizes suffice during early development when changes have obvious impact.

**Begin with existing manual checks**—behaviors verified before releases and common user tasks. Convert reported failures into test cases.

**Write unambiguous tasks** where domain experts would independently reach the same verdict. Ambiguity becomes noise in metrics. Create reference solutions proving tasks are solvable.

**Build balanced problem sets** testing both when behaviors should occur and when they shouldn't. Avoid one-sided optimization.

**Build robust eval harnesses** with stable environments. Each trial should start fresh, avoiding shared state between runs.

**Design graders thoughtfully**, choosing deterministic approaches where possible, LLM graders where necessary. Grade outcomes over process paths to avoid unnecessarily punishing creativity. Include partial credit for multistep tasks.

**Check transcripts** regularly. Reading actual trial records reveals whether failures stem from genuine agent mistakes or flawed grading.

**Monitor for saturation**—when agents pass all solvable tasks, evals provide no improvement signal.

**Maintain suites long-term** with dedicated ownership. Domain experts and product teams should contribute tasks routinely.

## Evals Within a Broader Evaluation Strategy

Automated evals represent just one component. A complete picture includes:

- **Production monitoring**: Reveals real user behavior at scale
- **A/B testing**: Measures actual outcomes with real traffic
- **User feedback**: Surfaces unanticipated problems
- **Manual transcript review**: Builds intuition for failure modes
- **Systematic human studies**: Provides calibration for LLM graders

The most effective teams combine these methods strategically: automated evals for fast iteration, production monitoring for ground truth, and periodic human review for calibration.

## Conclusion

"Teams without evals get bogged down in reactive loops." Those investing early experience acceleration as failures become test cases and metrics replace guesswork. Start early without waiting for perfection, source realistic tasks from actual failures, define unambiguous success criteria, combine multiple grader types thoughtfully, and read transcripts regularly.

AI agent evaluation remains nascent and evolving. As agents handle longer tasks, collaborate in multi-agent systems, and address increasingly subjective work, evaluation techniques will require ongoing adaptation.
