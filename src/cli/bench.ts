import '@std/dotenv/load'
import { Command } from 'commander'

import { generateTestCase } from '../GraphGenerator.ts'
import { PromptBuilder } from '../PromptBuilder.ts'
import { LLMClient } from '../LLMClient.ts'
import { Evaluator } from '../Evaluator.ts'
import type { EvaluationResult } from '../types.ts'

const llmClient = new LLMClient({
  apiKey: Deno.env.get('LLM_API_KEY') || '',
  baseUrl: Deno.env.get('LLM_BASE_URL') || '',
  model: Deno.env.get('LLM_MODEL') || 'qwen3.5-4b',
})

async function main() {
  const program = new Command()

  program
    .name('bench')
    .description('LLM 图路径规划自动基准测试工具')
    .option('-n, --nodes <n>', '每轮图的节点数', '15')
    .option('-d, --density <d>', '边密度 (0-1)', '0.4')
    .option('-r, --rounds <n>', '测试轮数', '10')
    .parse([Deno.execPath(), ...Deno.args])

  const opts = program.opts<
    { nodes: string; density: string; rounds: string }
  >()

  const numNodes = parseInt(opts.nodes)
  const density = parseFloat(opts.density)
  const numRounds = parseInt(opts.rounds)

  if (isNaN(numNodes) || numNodes < 2) {
    console.error('错误: --nodes 需要 >=2 的整数')
    Deno.exit(1)
  }
  if (isNaN(density) || density <= 0 || density > 1) {
    console.error('错误: --density 需要 0-1 之间的数字')
    Deno.exit(1)
  }
  if (isNaN(numRounds) || numRounds < 1) {
    console.error('错误: --rounds 需要 >=1 的整数')
    Deno.exit(1)
  }

  console.log(
    `开始执行 ${numRounds} 次测试 (节点=${numNodes}, 密度=${density})...`,
  )

  const results: EvaluationResult[] = []
  let correctCount = 0
  let hallucinationCount = 0
  let formatErrorCount = 0

  for (let i = 0; i < numRounds; i++) {
    const testCase = generateTestCase(numNodes, density)

    const systemPrompt = PromptBuilder.getSystemPrompt()
    const userPrompt = PromptBuilder.getUserPrompt(
      testCase.graph,
      testCase.startNode,
      testCase.endNode,
    )

    console.log(
      `[Test ${i + 1}] Start: ${testCase.startNode}, End: ${testCase.endNode}`,
    )

    try {
      const startTime = performance.now()
      const response = await llmClient.chatCompletion(systemPrompt, userPrompt)
      const endTime = performance.now()

      const result = Evaluator.evaluate(
        testCase,
        response,
        endTime - startTime,
      )
      results.push(result)

      if (result.isCorrect) { correctCount++ }
      if (result.hasHallucination) { hallucinationCount++ }
      if (!result.parsedResponse.success) { formatErrorCount++ }

      const status = result.isCorrect ? 'PASS' : 'FAIL'
      console.log(
        `  -> ${status} (${result.executionTimeMs.toFixed(0)}ms) | ${
          response.slice(0, 80)
        }`,
      )
      if (!result.isCorrect) {
        const errType = result.hasHallucination
          ? `Hallucination: ${JSON.stringify(result.hallucinatedEdges)}`
          : (result.parsedResponse.errorType || 'Logic Error')
        console.log(`     ${errType}`)
      }
    } catch (error) {
      console.error(`  -> API Error: ${error}`)
    }
  }

  const total = numRounds || 1
  console.log('\n========== 评估报告 ==========')
  console.log(`总测试数: ${numRounds}`)
  console.log(
    `正确:   ${correctCount} (${(correctCount / total * 100).toFixed(1)}%)`,
  )
  console.log(
    `幻觉:   ${hallucinationCount} (${
      (hallucinationCount / total * 100).toFixed(1)
    }%)`,
  )
  console.log(
    `格式错: ${formatErrorCount} (${
      (formatErrorCount / total * 100).toFixed(1)
    }%)`,
  )
}

if (import.meta.main) {
  await main()
}
