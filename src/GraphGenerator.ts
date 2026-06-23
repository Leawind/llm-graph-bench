import type { AdjacencyList, TestCase } from './types.ts'

const CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function randomNodeId(): string {
  let id = ''
  for (let i = 0; i < 5; i++) {
    id += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return id
}

function generateNodeIds(count: number): string[] {
  const ids = new Set<string>()
  while (ids.size < count) {
    ids.add(randomNodeId())
  }
  return [...ids]
}

/**
 * 生成一个随机的有向图测试用例
 * @param numNodes 节点总数
 * @param density 边的密度 (0-1)，影响额外随机边的数量
 * @returns TestCase
 */
export function generateTestCase(numNodes: number, density: number): TestCase {
  const nodes = generateNodeIds(numNodes)
  const adjList: AdjacencyList = {}

  // 初始化邻接表
  nodes.forEach((node) => (adjList[node] = []))

  const startNode = nodes[0]
  const endNode = nodes[nodes.length - 1]

  // 1. 确保连通性：生成一条从起点到终点的随机路径
  let current = startNode
  const pathToEnsureConnectivity: string[] = [startNode]
  const visited = new Set([startNode])

  while (current !== endNode) {
    const nextCandidates = nodes.filter((n) => !visited.has(n) && n !== current)

    if (nextCandidates.length === 0) {
      if (!adjList[current].includes(endNode)) {
        adjList[current].push(endNode)
      }
      break
    }

    const next = nextCandidates[
      Math.floor(Math.random() * nextCandidates.length)
    ]
    adjList[current].push(next)
    pathToEnsureConnectivity.push(next)
    visited.add(next)
    current = next
  }

  // 2. 添加随机边以增加复杂度
  const maxEdges = numNodes * (numNodes - 1)
  const targetEdges = Math.floor(maxEdges * density)
  let addedEdges = Object.values(adjList).reduce(
    (acc, curr) => acc + curr.length,
    0,
  )

  while (addedEdges < targetEdges) {
    const from = nodes[Math.floor(Math.random() * numNodes)]
    const to = nodes[Math.floor(Math.random() * numNodes)]

    if (from !== to && !adjList[from].includes(to)) {
      adjList[from].push(to)
      addedEdges++
    }
  }

  return {
    id: crypto.randomUUID(),
    graph: adjList,
    startNode,
    endNode,
  }
}
