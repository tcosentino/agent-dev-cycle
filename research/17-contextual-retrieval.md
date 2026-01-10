# Introducing Contextual Retrieval

**Published:** September 19, 2024
**Source:** https://www.anthropic.com/engineering/contextual-retrieval

## Overview

AI models often need access to background knowledge to be effective in specific contexts. Customer support chatbots require company-specific information, while legal analysis systems need historical case data. The standard solution—Retrieval-Augmented Generation (RAG)—has a significant limitation: traditional implementations lose context when encoding information, frequently failing to retrieve relevant data.

Anthropic introduces "Contextual Retrieval," a method combining two techniques—Contextual Embeddings and Contextual BM25—that dramatically improves RAG performance. This approach reduces retrieval failures by 49% and, when combined with reranking, by 67%.

## The Problem with Traditional RAG

RAG systems work by:
1. Breaking knowledge bases into smaller text chunks
2. Converting chunks into vector embeddings
3. Storing embeddings in searchable databases

At runtime, the system retrieves relevant chunks and adds them to prompts. However, without surrounding context, individual chunks become ambiguous. For example, a chunk stating revenue growth of 3% lacks information about which company or time period it references, making proper retrieval and usage difficult.

## The Solution: Contextual Retrieval

Contextual Retrieval prepends explanatory context to each chunk before embedding and indexing. Using Claude 3 Haiku, developers can automatically generate concise, chunk-specific context that explains content within the document's broader context.

**Cost consideration:** "the one-time cost to generate contextualized chunks is $1.02 per million document tokens" when using Claude's prompt caching feature.

## Performance Results

Experiments across multiple knowledge domains showed:
- **Contextual Embeddings alone:** 35% reduction in retrieval failures
- **Combined Contextual Embeddings + BM25:** 49% reduction
- **With reranking added:** 67% reduction in failure rates

## Implementation Recommendations

Key considerations include:
- **Chunk boundaries:** Size, overlap, and splitting strategy affect performance
- **Embedding models:** Gemini and Voyage embeddings showed particular effectiveness
- **Custom prompts:** Domain-specific prompts can improve results
- **Chunk quantity:** Testing suggests 20 chunks outperforms 5 or 10
- **Evaluation:** Always run assessments on your specific use case

## Enhanced Performance with Reranking

Adding a reranking step filters initial retrieval results, passing only the most relevant chunks to the model. This improves response quality while reducing costs and latency, though reranking adds processing time.

## Key Takeaway

The benefits of embeddings, BM25, contextual retrieval, and reranking are cumulative. Combined approaches using Voyage or Gemini embeddings with contextual preparation and reranking maximize retrieval accuracy for knowledge-based AI systems.
