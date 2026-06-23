// 图的邻接表表示：键为起始节点ID，值为目标节点ID数组
export type AdjacencyList = Record<string, string[]>;

// 测试用例接口
export interface TestCase {
  id: string;
  graph: AdjacencyList;
  startNode: string;
  endNode: string;
}

// 模型响应解析结果
export interface ParsedResponse {
  success: boolean;
  path?: string[];
  errorType?: "FORMAT_ERROR" | "JSON_PARSE_ERROR";
  rawOutput: string;
}

// 单次评估结果
export interface EvaluationResult {
  testCaseId: string;
  isCorrect: boolean;
  hasHallucination: boolean; // 是否包含图中不存在的边
  hallucinatedEdges: [string, string][];
  executionTimeMs: number;
  parsedResponse: ParsedResponse;
}

// LLM 配置
export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}
