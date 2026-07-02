import { parentPort, workerData, isMainThread } from 'worker_threads';
import { executeStage } from './stage-executor.js';

/**
 * Optional worker entrypoint for stage execution isolation.
 * This file is intentionally minimal and can be enabled incrementally.
 */
export async function runStageWorker(payload) {
  const { stageKey, stageConfig, context, llmClient, options } = payload;
  return executeStage(stageKey, stageConfig, context, llmClient, options);
}

if (!isMainThread && parentPort) {
  runStageWorker(workerData)
    .then((result) => parentPort.postMessage({ ok: true, result }))
    .catch((error) => parentPort.postMessage({ ok: false, error: error?.message || String(error) }));
}
