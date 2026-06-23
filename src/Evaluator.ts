import type {
  EvaluationResult,
  ParsedResponse,
  TestCase,
} from "./types.ts";

export class Evaluator {
  /**
   * 评估模型的回答
   */
  static evaluate(
    testCase: TestCase,
    rawOutput: string,
    executionTimeMs: number,
  ): EvaluationResult {
    const parsed = this.parseResponse(rawOutput);

    if (!parsed.success || !parsed.path) {
      return {
        testCaseId: testCase.id,
        isCorrect: false,
        hasHallucination: false,
        hallucinatedEdges: [],
        executionTimeMs,
        parsedResponse: parsed,
      };
    }

    const path = parsed.path;
    const graph = testCase.graph;

    // 1. 检查起点和终点
    if (
      path[0] !== testCase.startNode ||
      path[path.length - 1] !== testCase.endNode
    ) {
      return {
        testCaseId: testCase.id,
        isCorrect: false,
        hasHallucination: false,
        hallucinatedEdges: [],
        executionTimeMs,
        parsedResponse: parsed,
      };
    }

    // 2. 检查每一步边的有效性
    const hallucinatedEdges: [string, string][] = [];
    let isValid = true;

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      const neighbors = graph[from];
      if (!neighbors || !neighbors.includes(to)) {
        isValid = false;
        hallucinatedEdges.push([from, to]);
      }
    }

    return {
      testCaseId: testCase.id,
      isCorrect: isValid && hallucinatedEdges.length === 0,
      hasHallucination: hallucinatedEdges.length > 0,
      hallucinatedEdges,
      executionTimeMs,
      parsedResponse: parsed,
    };
  }

  private static parseResponse(rawOutput: string): ParsedResponse {
    try {
      // 尝试清理可能的 Markdown 标记
      let cleanJson = rawOutput.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(cleanJson);

      if (parsed && Array.isArray(parsed.path)) {
        // 验证 path 数组元素是否都是字符串
        const allStrings = parsed.path.every((n: unknown) =>
          typeof n === "string"
        );
        if (allStrings) {
          return {
            success: true,
            path: parsed.path,
            rawOutput,
          };
        }
      }

      return {
        success: false,
        errorType: "FORMAT_ERROR",
        rawOutput,
      };
    } catch (_e) {
      return {
        success: false,
        errorType: "JSON_PARSE_ERROR",
        rawOutput,
      };
    }
  }
}
