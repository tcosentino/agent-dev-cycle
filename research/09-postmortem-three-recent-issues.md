# A Postmortem of Three Recent Issues

**Published:** September 17, 2025
**Source:** https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues

## Overview

Anthropic has released a technical report documenting three infrastructure bugs that intermittently degraded Claude's response quality between August and early September 2025. The company states: "We never reduce model quality due to demand, time of day, or server load."

## The Three Bugs

### 1. Context Window Routing Error
On August 5, some Sonnet 4 requests were misrouted to servers configured for the 1M token context window. Initially affecting 0.8% of requests, a load balancing change on August 29 increased this to 16% at peak impact. Approximately 30% of Claude Code users experienced at least one degraded response during this period.

**Resolution:** Fixed routing logic deployed September 4; rollout completed by September 18.

### 2. Output Corruption
A TPU server misconfiguration deployed August 25 caused erratic token generation, occasionally producing Thai, Chinese characters, or syntax errors in English-language responses. This affected Opus 4.1, Opus 4, and Sonnet 4 models.

**Resolution:** Change rolled back September 2; detection tests added to deployment process.

### 3. Approximate Top-k XLA:TPU Miscompilation
An August 25 code change exposed a latent bug in the XLA:TPU compiler affecting token selection. The issue involved mixed precision arithmetic—operations running at different floating-point precisions disagreed on which token had highest probability.

**Resolution:** Switched from approximate to exact top-k implementation; rollbacks completed by September 12.

## Why Detection Was Difficult

The overlapping bugs produced inconsistent symptoms across different platforms. Privacy controls limiting engineer access to unreported user interactions complicated diagnosis. The company relied too heavily on noisy evaluations and failed to connect online reports to recent infrastructure changes.

## Changes Going Forward

- Developing more sensitive evaluations to differentiate working from broken implementations
- Running quality evaluations continuously on production systems
- Creating better debugging tools for community-sourced feedback while maintaining privacy
- Encouraging continued user feedback via the `/bug` command or feedback buttons

The postmortem emphasizes that user reports proved essential to isolating these issues and invites developers to share evaluation methods at feedback@anthropic.com.
