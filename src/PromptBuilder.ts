import type { AdjacencyList } from "./types.ts";

export class PromptBuilder {
  static getSystemPrompt(): string {
    return `你是一个图路径规划引擎。请根据提供的有向图邻接表，找出从起点到终点的一条有效路径。

规则：
1. 只能使用图中明确存在的边。
2. 路径必须从起点开始，到终点结束。
3. 仅输出一个标准的 JSON 对象，格式为 {"path": [节点ID列表]}。
4. 严禁输出任何解释、推理过程或额外文本。`;
  }

  static getUserPrompt(
    graph: AdjacencyList,
    startNode: string,
    endNode: string,
  ): string {
    const graphJson = JSON.stringify(graph);

    return `图结构（键为起始节点，值为目标节点数组）：
${graphJson}

起点：${startNode}
终点：${endNode}

请输出 JSON 结果。`;
  }
}
