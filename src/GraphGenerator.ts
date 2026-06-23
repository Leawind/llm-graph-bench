import type { AdjacencyList, TestCase } from "./types.ts";

const CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function randomNodeId(): string {
  let id = "";
  for (let i = 0; i < 5; i++) {
    id += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return id;
}

function generateNodeIds(count: number): string[] {
  const ids = new Set<string>();
  while (ids.size < count) {
    ids.add(randomNodeId());
  }
  return [...ids];
}

function findAllPaths(
  graph: AdjacencyList,
  start: string,
  end: string,
  maxDepth: number,
  maxPaths: number = 50,
): string[][] {
  const paths: string[][] = [];
  const stack: { node: string; path: string[] }[] = [
    { node: start, path: [start] },
  ];

  while (stack.length > 0 && paths.length < maxPaths) {
    const { node, path } = stack.pop()!;

    if (node === end) {
      paths.push(path);
      continue;
    }

    if (path.length >= maxDepth) continue;

    const neighbors = graph[node] || [];
    for (const neighbor of neighbors) {
      if (!path.includes(neighbor)) {
        stack.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }
  return paths;
}

/**
 * 生成一个随机的有向图测试用例
 * @param numNodes 节点总数
 * @param density 边的密度 (0-1)，影响额外随机边的数量
 * @returns TestCase
 */
export function generateTestCase(numNodes: number, density: number): TestCase {
  const nodes = generateNodeIds(numNodes);
  const adjList: AdjacencyList = {};

  // 初始化邻接表
  nodes.forEach((node) => (adjList[node] = []));

  const startNode = nodes[0];
  const endNode = nodes[nodes.length - 1];

  // 1. 确保连通性：生成一条从起点到终点的随机路径
  let current = startNode;
  const pathToEnsureConnectivity: string[] = [startNode];
  const visited = new Set([startNode]);

  while (current !== endNode) {
    const nextCandidates = nodes.filter((n) =>
      !visited.has(n) && n !== current
    );

    if (nextCandidates.length === 0) {
      if (!adjList[current].includes(endNode)) {
        adjList[current].push(endNode);
      }
      break;
    }

    const next = nextCandidates[
      Math.floor(Math.random() * nextCandidates.length)
    ];
    adjList[current].push(next);
    pathToEnsureConnectivity.push(next);
    visited.add(next);
    current = next;
  }

  // 2. 添加随机边以增加复杂度
  const maxEdges = numNodes * (numNodes - 1);
  const targetEdges = Math.floor(maxEdges * density);
  let addedEdges = Object.values(adjList).reduce(
    (acc, curr) => acc + curr.length,
    0,
  );

  while (addedEdges < targetEdges) {
    const from = nodes[Math.floor(Math.random() * numNodes)];
    const to = nodes[Math.floor(Math.random() * numNodes)];

    if (from !== to && !adjList[from].includes(to)) {
      adjList[from].push(to);
      addedEdges++;
    }
  }

  // 3. 计算部分有效路径供参考（限制数量和深度防爆炸）
  const validPaths = findAllPaths(adjList, startNode, endNode, numNodes + 2, 50);

  return {
    id: Date.now(),
    graph: adjList,
    startNode,
    endNode,
    validPaths,
  };
}
