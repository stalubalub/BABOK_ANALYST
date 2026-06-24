#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');

function runUninstall(env) {
  return spawnSync(process.execPath, [path.join(root, 'scripts', 'uninstall.cjs')], {
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

delete process.env.CLAUDE_CONFIG_DIR;

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-uninstall-'));
process.on('exit', () => fs.rmSync(temp, { recursive: true, force: true }));

const home = path.join(temp, 'home');
const claudeDir = path.join(home, '.claude');
fs.mkdirSync(claudeDir, { recursive: true });

const flagPath = path.join(claudeDir, '.babok-analyst-active');
fs.writeFileSync(flagPath, 'active');

const configDir = path.join(temp, 'config-home', 'babok-analyst');
fs.mkdirSync(configDir, { recursive: true });
const configPath = path.join(configDir, 'config.json');
fs.writeFileSync(configPath, JSON.stringify({ installed: true }));

const env = {
  HOME: home,
  USERPROFILE: home,
  XDG_CONFIG_HOME: path.join(temp, 'config-home'),
};

let result = runUninstall(env);
assert.equal(result.status, 0, result.stderr);
assert.equal(fs.existsSync(flagPath), false);
assert.equal(fs.existsSync(configPath), false);

result = runUninstall({ HOME: path.join(temp, 'home-empty'), USERPROFILE: path.join(temp, 'home-empty') });
assert.equal(result.status, 0, result.stderr);

console.log('uninstall script checks passed');
