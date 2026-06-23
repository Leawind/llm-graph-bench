| 中文 | [English](./README.en.md) |
| ---- | ------------------------- |

# LLM Graph Bench

LLM 图路径规划基准测试工具。生成随机有向图测试用例，评估 LLM 在图路径查找任务中的表现，重点检测幻觉（虚构不存在的边）。

## 测试指标

- **正确率** - LLM 输出是否为从起点到终点的有效路径
- **幻觉率** - 路径中是否包含图中不存在的边
- **格式错误率** - 输出是否解析失败（JSON 格式错误）
- **执行时间** - 单次 LLM 请求耗时

## 前置依赖

- [Deno](https://deno.com/) 2.x
- 兼容 OpenAI API 的 LLM 服务

## 快速开始

### 1. 配置环境变量（仅 bench 需要）

复制 `.env.example` 为 `.env` 并填写：

```env
LLM_BASE_URL=http://localhost:1234/v1
LLM_MODEL=qwen2.5-7b
LLM_API_KEY=your-api-key
```

支持的 LLM 后端：`llama-cpp`、`vllm`、`ollama`、`OpenAI` 等任何兼容 OpenAI API 的服务。

### 2. 运行自动化基准测试

```bash
deno task bench --nodes 15 --density 0.4 --rounds 10
```

| 参数            | 默认值 | 说明                 |
| --------------- | ------ | -------------------- |
| `-n, --nodes`   | 15     | 每轮图的节点数 (>=2) |
| `-d, --density` | 0.4    | 边密度 (0-1)         |
| `-r, --rounds`  | 10     | 测试轮数 (>=1)       |

### 3. 运行交互式测试

手动将 prompt 复制给 LLM，再将响应粘贴回终端：

```bash
deno task cli --nodes 10 --density 0.3 --rounds 5
```

## 工作原理

1. **生成测试用例** - 随机创建包含连通性保证的有向图
2. **构建 Prompt** - 将邻接表、起点、终点组装为系统/用户提示词
3. **LLM 推理** - 要求模型以 JSON 格式 `{"path": [...]}` 返回路径
4. **评估** - 校验路径的有效性，统计正确率/幻觉率/格式错误率
