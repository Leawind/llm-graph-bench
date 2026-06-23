import '@std/dotenv/load'
import { Command } from 'commander'

import { generateTestCase } from '../GraphGenerator.ts'
import { PromptBuilder } from '../PromptBuilder.ts'
import { Evaluator } from '../Evaluator.ts'
import type { EvaluationResult } from '../types.ts'

const decoder = new TextDecoder()
const stdinReader = Deno.stdin.readable.getReader()

/** 读取多行输入，当内容为非空合法 JSON 时结束 */
async function readResponse(): Promise<string> {
  let buffer = ''

  while (true) {
    const { value, done } = await stdinReader.read()

    if (value) {
      buffer += decoder.decode(value, { stream: true })
    }

    const trimmed = buffer.trimEnd()
    if (!trimmed) {
      if (done) { return '' }
      continue
    }

    // 去除可能的 markdown 代码块标记后再尝试解析
    let json = trimmed
    if (json.startsWith('```json')) {
      json = json.slice(7)
      if (json.endsWith('```')) { json = json.slice(0, -3) }
    } else if (json.startsWith('```')) {
      json = json.slice(3)
      if (json.endsWith('```')) { json = json.slice(0, -3) }
    }
    json = json.trim()

    try {
      if (json) {
        JSON.parse(json)
        return json
      }
    } catch {
      // JSON 尚未完整，继续等待输入
    }

    if (done) { return '' }
  }
}

function printResult(
  round: number,
  total: number,
  result: EvaluationResult,
  response: string,
) {
  const status = result.isCorrect ? 'PASS' : 'FAIL'
  const detail = result.hasHallucination
    ? ` hallucinated: ${
      result.hallucinatedEdges.map(([f, t]) => `${f}→${t}`).join(', ')
    }`
    : result.parsedResponse.errorType
    ? ` ${result.parsedResponse.errorType}`
    : ''

  console.log(
    `[${round}/${total}] ${status}${detail} | ${response.slice(0, 80)}`,
  )
}

async function main() {
  const program = new Command()

  program
    .name('cli')
    .description('LLM 图路径规划交互式测试工具')
    .option('-n, --nodes <n>', '每轮图的节点数', '10')
    .option('-d, --density <d>', '边密度 (0-1)', '0.3')
    .option('-r, --rounds <n>', '测试轮数', '5')
    .parse([Deno.execPath(), ...Deno.args])

  const opts = program.opts<
    { nodes: string; density: string; rounds: string }
  >()

  const nodes = parseInt(opts.nodes)
  const density = parseFloat(opts.density)
  const rounds = parseInt(opts.rounds)

  if (isNaN(nodes) || nodes < 2) {
    console.error('错误: --nodes 需要 >=2 的整数')
    Deno.exit(1)
  }
  if (isNaN(density) || density <= 0 || density > 1) {
    console.error('错误: --density 需要 0-1 之间的数字')
    Deno.exit(1)
  }
  if (isNaN(rounds) || rounds < 1) {
    console.error('错误: --rounds 需要 >=1 的整数')
    Deno.exit(1)
  }

  const results: EvaluationResult[] = []
  let correctCount = 0
  let hallucinationCount = 0
  let formatErrorCount = 0

  for (let round = 0; round < rounds; round++) {
    const testCase = generateTestCase(nodes, density)

    const systemPrompt = PromptBuilder.getSystemPrompt()
    const userPrompt = PromptBuilder.getUserPrompt(
      testCase.graph,
      testCase.startNode,
      testCase.endNode,
    )

    console.log(`\n${systemPrompt}\n\n${userPrompt}\n`)
    console.log(`---${round + 1}/${rounds}---`)

    const response = await readResponse()

    if (!response.trim()) {
      console.log('  (empty, skipped)')
      continue
    }

    const result = Evaluator.evaluate(testCase, response, 0)
    results.push(result)

    if (result.isCorrect) { correctCount++ }
    if (result.hasHallucination) { hallucinationCount++ }
    if (!result.parsedResponse.success) { formatErrorCount++ }

    printResult(round + 1, rounds, result, response)
  }

  // 汇总
  const total = results.length || 1
  console.log(
    `\npass=${correctCount}(${
      (correctCount / total * 100).toFixed(0)
    }%) hallucination=${hallucinationCount}(${
      (hallucinationCount / total * 100).toFixed(0)
    }%) formatError=${formatErrorCount}(${
      (formatErrorCount / total * 100).toFixed(0)
    }%)`,
  )
}

if (import.meta.main) {
  await main()
}
