#!/usr/bin/env node
/**
 * PreToolUse hook — Two-Key Journal hard gate for agent tool calls.
 *
 * Blocks:
 * - babok_approve_stage (human must use `babok approve` CLI)
 * - babok_save_deliverable on approved stages without revision_open
 *
 * Exit code 2 = block tool; stderr shown to the agent.
 */

const fs = require('fs');
const path = require('path');
const { getPluginRoot } = require('./babok-config.cjs');

/**
 * Resolve projects directory (matches babok-mcp project.js search order).
 * @returns {string}
 */
function getProjectsDir() {
  if (process.env.BABOK_PROJECTS_DIR && fs.existsSync(process.env.BABOK_PROJECTS_DIR)) {
    return path.resolve(process.env.BABOK_PROJECTS_DIR);
  }
  const cwdProjects = path.join(process.cwd(), 'projects');
  if (fs.existsSync(cwdProjects)) return cwdProjects;
  const rootProjects = path.join(getPluginRoot(), 'projects');
  if (fs.existsSync(rootProjects)) return rootProjects;
  return cwdProjects;
}

/**
 * @param {string} partialId
 * @returns {string|null}
 */
function resolveProjectId(partialId) {
  const dir = getProjectsDir();
  if (!fs.existsSync(dir)) return null;
  const ids = fs.readdirSync(dir).filter(name =>
    name.startsWith('BABOK-') && fs.statSync(path.join(dir, name)).isDirectory(),
  );
  if (!partialId) return ids.length === 1 ? ids[0] : null;
  const exact = ids.find(id => id === partialId);
  if (exact) return exact;
  const upper = String(partialId).toUpperCase();
  const matches = ids.filter(id => id.includes(upper));
  return matches.length === 1 ? matches[0] : null;
}

/**
 * @param {string} projectId
 * @returns {object|null}
 */
function readJournal(projectId) {
  const journalPath = path.join(getProjectsDir(), projectId, `PROJECT_JOURNAL_${projectId}.json`);
  if (!fs.existsSync(journalPath)) return null;
  return JSON.parse(fs.readFileSync(journalPath, 'utf8'));
}

/**
 * @param {string} toolName
 * @returns {boolean}
 */
function isBabokTool(toolName) {
  return typeof toolName === 'string' && /babok_/i.test(toolName);
}

/**
 * @param {string} toolName
 * @param {string} suffix
 * @returns {boolean}
 */
function toolMatches(toolName, suffix) {
  return isBabokTool(toolName) && toolName.includes(suffix);
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let payload = {};
  try {
    payload = JSON.parse(input || '{}');
  } catch {
    process.exit(0);
  }

  const toolName = payload.tool_name || payload.toolName || '';
  const toolInput = payload.tool_input || payload.toolInput || {};

  if (toolMatches(toolName, 'babok_approve_stage')) {
    process.stderr.write(
      'Two-Key Gate: babok_approve_stage is blocked for agents. Human must run: babok approve <project_id> <stage>',
    );
    process.exit(2);
  }

  if (toolMatches(toolName, 'babok_save_deliverable')) {
    const projectId = resolveProjectId(toolInput.project_id || toolInput.projectId);
    const stageN = toolInput.stage_n ?? toolInput.stageN;
    if (projectId == null || stageN == null) process.exit(0);

    const journal = readJournal(projectId);
    if (!journal) process.exit(0);

    const stage = journal.stages?.find(s => s.stage === Number(stageN));
    if (!stage) process.exit(0);

    const revisionOpen = stage.revision_open === true;
    if (stage.status === 'approved' && !revisionOpen) {
      process.stderr.write(
        `Two-Key Gate: stage ${stageN} is approved and locked. Call babok_open_revision before babok_save_deliverable.`,
      );
      process.exit(2);
    }
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
