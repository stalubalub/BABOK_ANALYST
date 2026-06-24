#!/usr/bin/env node
// babok_analyst — SessionStart activation hook.
// Emits BABOK operating instructions and ensures MCP server dependencies exist.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { getPluginRoot, isShellSafe } = require('./babok-config.cjs');
const { getBabokInstructions } = require('./babok-instructions.cjs');
const { setActive, writeHookOutput } = require('./babok-runtime.cjs');

const pluginRoot = getPluginRoot();
const mcpDir = path.join(pluginRoot, 'babok-mcp');
const nodeModules = path.join(mcpDir, 'node_modules');

function ensureMcpDependencies() {
  if (fs.existsSync(nodeModules)) return null;
  if (!fs.existsSync(path.join(mcpDir, 'package.json'))) {
    return 'babok-mcp package.json not found in plugin bundle.';
  }
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCmd, ['install', '--omit=dev'], {
    cwd: mcpDir,
    encoding: 'utf8',
    timeout: 120000,
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    return `npm install in babok-mcp failed: ${result.stderr || result.stdout || 'unknown error'}`;
  }
  return null;
}

let output = getBabokInstructions();

const depError = ensureMcpDependencies();
if (depError) {
  output += `\n\nMCP SETUP: ${depError} Run manually: cd "${mcpDir}" && npm install`;
} else if (isShellSafe(pluginRoot)) {
  output += '\n\nMCP: babok server is bundled via .mcp.json. Projects live in projects/ under the current workspace.';
}

try {
  setActive();
} catch (e) {
  // best-effort flag; do not block session start
}

try {
  writeHookOutput('SessionStart', output);
} catch (e) {
  // stdout may close early at hook exit
}
