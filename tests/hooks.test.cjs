#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

function run(script, env) {
  return spawnSync(process.execPath, [path.join(root, 'hooks', script)], {
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

delete process.env.CLAUDE_CONFIG_DIR;
delete process.env.PLUGIN_DATA;
delete process.env.COPILOT_PLUGIN_DATA;

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-hooks-'));
process.on('exit', () => fs.rmSync(temp, { recursive: true, force: true }));

const home = path.join(temp, 'home');
const pluginData = path.join(temp, 'plugin-data');
fs.mkdirSync(home, { recursive: true });

const codexEnv = {
  HOME: home,
  USERPROFILE: home,
  PLUGIN_DATA: pluginData,
  CLAUDE_PLUGIN_ROOT: root,
};

let result = run('babok-activate.cjs', codexEnv);
assert.equal(result.status, 0, result.stderr);
const output = JSON.parse(result.stdout);
assert.equal(output.systemMessage, 'BABOK_ANALYST:ACTIVE');
assert.match(output.hookSpecificOutput.additionalContext, /BABOK/);

const statePath = path.join(pluginData, '.babok-analyst-active');
assert.equal(fs.readFileSync(statePath, 'utf8'), 'active');

const hooksJson = JSON.parse(fs.readFileSync(path.join(root, 'hooks', 'claude-codex-hooks.json'), 'utf8'));
assert.ok(hooksJson.hooks.SessionStart);
assert.equal(
  readJSON(path.join(root, '.claude-plugin', 'plugin.json')).hooks,
  './hooks/claude-codex-hooks.json',
);

console.log('hooks checks passed');
