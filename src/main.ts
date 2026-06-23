import "@std/dotenv/load";

import { generateTestCase } from "./GraphGenerator.ts";
import { PromptBuilder } from "./PromptBuilder.ts";
import { LLMClient } from "./LLMClient.ts";
import { Evaluator } from "./Evaluator.ts";
import type { EvaluationResult } from "./types.ts";

const llmClient = new LLMClient({
  apiKey: Deno.env.get("LLM_API_KEY") || "",
  baseUrl: Deno.env.get("LLM_BASE_URL") || "http://192.168.31.149:1234/v1",
  model: Deno.env.get("LLM_MODEL") || "qwen3.5-4b",
});

async function runEvaluation(numTests: number = 10) {
  console.log(`开始执行 ${numTests} 次测试...`);

  const results: EvaluationResult[] = [];
  let correctCount = 0;
  let hallucinationCount = 0;
  let formatErrorCount = 0;

  for (let i = 0; i < numTests; i++) {
    const testCase = generateTestCase(15, 0.40);

    const systemPrompt = PromptBuilder.getSystemPrompt();
    const userPrompt = PromptBuilder.getUserPrompt(
      testCase.graph,
      testCase.startNode,
      testCase.endNode,
    );

    console.log(
      `[Test ${i + 1}] Start: ${testCase.startNode}, End: ${testCase.endNode}`,
    );

    try {
      const startTime = performance.now();
      const response = await llmClient.chatCompletion(systemPrompt, userPrompt);
      const endTime = performance.now();

      const result = Evaluator.evaluate(
        testCase,
        response,
        endTime - startTime,
      );
      results.push(result);

      if (result.isCorrect) correctCount++;
      if (result.hasHallucination) hallucinationCount++;
      if (!result.parsedResponse.success) formatErrorCount++;

      const status = result.isCorrect ? "PASS" : "FAIL";
      console.log(`  -> ${status} (${result.executionTimeMs.toFixed(0)}ms) | ${response.slice(0, 80)}`);
      if (!result.isCorrect) {
        const errType = result.hasHallucination
          ? `Hallucination: ${JSON.stringify(result.hallucinatedEdges)}`
          : (result.parsedResponse.errorType || "Logic Error");
        console.log(`     ${errType}`);
      }
    } catch (error) {
      console.error(`  -> API Error: ${error}`);
    }
  }

  const total = numTests || 1;
  console.log("\n========== 评估报告 ==========");
  console.log(`总测试数: ${numTests}`);
  console.log(`正确:   ${correctCount} (${(correctCount / total * 100).toFixed(1)}%)`);
  console.log(`幻觉:   ${hallucinationCount} (${(hallucinationCount / total * 100).toFixed(1)}%)`);
  console.log(`格式错: ${formatErrorCount} (${(formatErrorCount / total * 100).toFixed(1)}%)`);
}

if (import.meta.main) {
  await runEvaluation(10);
}
