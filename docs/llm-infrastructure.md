# LLM Infrastructure Strategy

This document outlines the infrastructure strategy for running AgentForge's AI agents, including model selection, hosting options, and cost optimization.

## Summary

Claude API remains the most cost-effective option for typical production volumes. However, a hybrid architecture can reduce costs 30-50% while maintaining quality. Qwen2.5-Coder-32B and DeepSeek-V3 have closed the gap to within 2-10% of Claude on coding benchmarks, making selective self-hosting viable for structured, high-volume tasks.

For a workload of ~342M tokens/month across four agents:
- **Optimized Claude API:** $1,500-3,000/month
- **Self-hosting 70B model:** $25,000+/month
- **Managed inference (Together AI, DeepInfra):** $0.18-0.88/MTok

---

## Model Comparison

Open-source coding models have reached near-parity on benchmarks. Qwen2.5-Coder-32B currently leads as the best open-source coding model.

| Model | HumanEval | SWE-bench | Best For |
|-------|-----------|-----------|----------|
| Claude 3.5 Sonnet | 92% | 49% | Complex reasoning, architecture |
| Qwen2.5-Coder-32B | ~90% | N/A | Code generation (SOTA open-source) |
| DeepSeek-V3 | ~90% | 15-20% | General + coding, MoE efficiency |
| Llama 3.1 70B | 80.5% | N/A | Agentic workflows, tool use |
| Qwen2.5-Coder-7B | 84% | N/A | Cost-efficient coding tasks |

The critical gap remains on real-world software engineering (SWE-bench), where Claude leads at 49% vs ~15-20% for open-source. This benchmark tests multi-file changes across actual GitHub repos.

**Smaller models punch above their weight.** Qwen2.5-Coder-7B achieves 84% HumanEval, rivaling some 34B models. This matters for infrastructure costs: 7B models run on single $0.80-1.00/hour GPUs, while 70B models require $22+/hour instances.

---

## Agent-Specific Recommendations

Based on AgentForge's agent architecture:

| Agent | Primary Model | Fallback | Rationale |
|-------|---------------|----------|-----------|
| Planning Agent | Self-hosted Llama 3.1 70B | Claude | Structured extraction, medium complexity |
| Coding Agent | Hybrid with confidence routing | Claude Sonnet | Complex code needs Claude |
| Testing Agent | Self-hosted Llama 8B | Larger self-hosted | Best ROI; structured output, verifiable |
| Review Agent | Claude API | - | Low volume, high-stakes reasoning |

### Testing Agent: Best Candidate for Self-Hosting

Test generation is the strongest candidate for self-hosted deployment because:
- Highly structured, template-based output
- Verifiable results (tests either pass or fail)
- High volume makes cost savings significant
- JSON schema compliance is near-perfect even with smaller models

### Review Agent: Keep on Claude

Strategic decisions require the best reasoning capabilities. This agent has low volume anyway, so cost impact is minimal while quality is critical.

---

## Infrastructure Options

### Inference Frameworks

vLLM dominates production Kubernetes deployments with 2-4x higher throughput via PagedAttention memory management.

| Framework | Best For | Throughput | Production Ready |
|-----------|----------|------------|-----------------|
| vLLM | Production multi-user | 2-4x baseline | Yes (Helm charts available) |
| Ollama | Development/prototyping | Limited | No |
| llama.cpp | Edge/CPU inference | Single-user | Specialized |
| Triton+TensorRT | Maximum NVIDIA optimization | Highest | Enterprise |

### GPU Instance Recommendations

AWS GPU instance recommendations by model size:

- **7B models:** AWS g5.xlarge (A10G 24GB) at $1.00/hour or g6.xlarge (L4 24GB) at $0.80/hour
- **34B models:** g6e.xlarge (L40S 48GB) at $1.86/hour or 2x g5.xlarge with tensor parallelism
- **70B models:** p4d.24xlarge (8x A100) at ~$22/hour; requires A100/H100-class GPUs

### Quantization

AWQ 4-bit quantization reduces memory requirements by 75% with minimal quality loss. A 34B model quantized to INT4 runs on a single A10G (24GB).

---

## Cost Analysis

For estimated workload of ~342M tokens/month:

| Option | Monthly Cost | Notes |
|--------|--------------|-------|
| Claude Sonnet 4.5 (standard) | $3,090 | Full capability |
| Claude Sonnet 4.5 (batch API) | $1,545 | 50% discount for async |
| Claude Haiku 4.5 | $1,030 | Fast tasks |
| **Optimized mixed strategy** | **$1,650** | Haiku for QA/PM, Sonnet for coding |
| Self-hosted 7B | $730-1,230 | Limited capability |
| Self-hosted 70B | $25,000+ | Includes overhead |
| Together AI (Llama 70B) | $590 | Managed inference |
| DeepInfra (Llama 70B) | $108 | Cheapest managed option |

**Break-even analysis:** Self-hosting a 7B model costs ~$1,230/month including overhead. Break-even requires ~703M tokens/month (roughly 6x typical startup workload).

---

## Hybrid Architecture

Confidence-based cascading achieves up to 16x better efficiency compared to always using large models:

```
Request -> Self-hosted LLM -> Confidence Check
                               |-- High confidence -> Accept
                               |-- Low confidence -> Claude API
```

### Recommended Phased Approach

**Phase 1: Optimize Claude API**
- Use model routing (Haiku for structured tasks, Sonnet for complex tasks)
- Enable prompt caching (90% savings on repeated context)
- Use Batch API for async work (50% discount)
- Target: $1,500-2,000/month with full capability

**Phase 2: Add Managed Inference for Testing Agent**
- Move test generation to DeepInfra or Together AI (Llama 3.1 8B)
- Low-risk due to structured output and easy validation
- Expected: 80%+ cost reduction for this agent

**Phase 3: Self-Host (Only if $10K+/month API spend)**
- Evaluate dedicated vLLM deployment on g5/g6 instances
- Consider 0.5-1 FTE engineering overhead in total cost

---

## Operational Considerations

### Cold Start Times

Cloud GPU provisioning takes 30 seconds to several minutes. Solutions:
- Maintain warm pool of instances
- Use Karpenter for automatic spot management
- Implement model streaming where supported

### Scaling

- Use KEDA or HPA with `vllm_num_requests_waiting` metric
- Target 3-5 queued requests
- Spot instances offer 60-70% savings but require graceful shutdown handlers

### Monitoring Stack

- Prometheus + Grafana for infrastructure metrics
- OpenTelemetry for tracing
- Langfuse or Arize for LLM-specific observability
- Track: tokens/second, time-to-first-token, P95 latency, cost per successful completion

---

## Conclusion

Open-source models are now capable enough for many production tasks, but the total cost of ownership for self-hosting (infrastructure, engineering time, reliability) makes Claude API the practical choice for most startup workloads. Use managed inference (Together AI, DeepInfra) as a cost-optimization lever before committing to full self-hosting.
