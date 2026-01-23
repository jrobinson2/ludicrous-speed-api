const isBun = typeof Bun !== 'undefined';

const isNode =
  typeof process !== 'undefined' &&
  typeof process.versions === 'object' &&
  typeof process.versions.node === 'string' &&
  !('WebSocketPair' in globalThis);

const isCloudflareWorker =
  typeof globalThis !== 'undefined' && 'WebSocketPair' in globalThis;

const isVercelEdge =
  typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis;

export const isRuntime = {
  Bun: isBun,
  Node: isNode,
  CloudflareWorker: isCloudflareWorker,
  Edge: isCloudflareWorker || isVercelEdge
} as const;
