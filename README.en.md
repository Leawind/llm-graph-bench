| [中文](./README.md) | English |
| ------------------- | ------- |

# LLM Graph Bench

A benchmark tool for evaluating LLM performance on graph path-finding tasks. Generates random directed graph test cases and assesses LLM correctness, with a focus on detecting hallucinations (fabricated edges).

## Metrics

- **Correctness** - Whether the LLM output is a valid path from start to end
- **Hallucination Rate** - Whether the path contains edges that don't exist in the graph
- **Format Error Rate** - Whether the output fails JSON parsing
- **Execution Time** - Per-request inference latency

## Prerequisites

- [Deno](https://deno.com/) 2.x
- An OpenAI API-compatible LLM service

## Quick Start

### 1. Configure Environment (bench only)

Copy `.env.example` to `.env` and fill in your values:

```env
LLM_BASE_URL=http://localhost:1234/v1
LLM_MODEL=qwen2.5-7b
LLM_API_KEY=your-api-key
```

Supported backends include `llama-cpp`, `vllm`, `ollama`, `OpenAI`, or any OpenAI API-compatible service.

### 2. Run Automated Benchmark

```bash
deno task bench --nodes 15 --density 0.4 --rounds 10
```

| Option          | Default | Description                 |
| --------------- | ------- | --------------------------- |
| `-n, --nodes`   | 15      | Nodes per graph (>=2)       |
| `-d, --density` | 0.4     | Edge density (0-1)          |
| `-r, --rounds`  | 10      | Number of test rounds (>=1) |

### 3. Run Interactive Mode

Manually copy the prompt to any LLM, then paste the response back:

```bash
deno task cli --nodes 10 --density 0.3 --rounds 5
```

## How It Works

1. **Generate Test Cases** - Create random directed graphs with guaranteed connectivity
2. **Build Prompt** - Assemble adjacency list, start node, and end node into system/user prompts
3. **LLM Inference** - Request the model to return a path in JSON format: `{"path": [...]}`
4. **Evaluate** - Validate path correctness and report accuracy, hallucination, and format error rates
