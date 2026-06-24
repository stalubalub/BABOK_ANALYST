#!/usr/bin/env node
// babok_analyst — shared configuration resolver for plugin hooks.

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Resolve the plugin install root across Claude, Codex, and Copilot hosts.
 * @returns {string|null} Absolute path to the plugin bundle root.
 */
function getPluginRoot() {
  const candidates = [
    process.env.CLAUDE_PLUGIN_ROOT,
    process.env.PLUGIN_ROOT,
    process.env.CODEX_PLUGIN_ROOT,
    process.env.COPILOT_PLUGIN_ROOT,
  ];
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return path.resolve(candidate);
    }
  }
  return path.resolve(__dirname, '..');
}

/**
 * Resolve the per-user config directory for BABOK Analyst plugin state.
 * @returns {string}
 */
function getConfigDir() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'babok-analyst');
  }
  if (process.platform === 'win32') {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
      'babok-analyst',
    );
  }
  return path.join(os.homedir(), '.config', 'babok-analyst');
}

/** @returns {string} */
function getConfigPath() {
  return path.join(getConfigDir(), 'config.json');
}

/**
 * Resolve Claude/Codex config directory (mode flag, settings.json).
 * @returns {string}
 */
function getClaudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

/**
 * Guard against embedding unsafe shell metacharacters in generated commands.
 * @param {string} p
 * @returns {boolean}
 */
function isShellSafe(p) {
  return typeof p === 'string' && /^[A-Za-z0-9 _.\-:/\\~]+$/.test(p);
}

module.exports = {
  getPluginRoot,
  getConfigDir,
  getConfigPath,
  getClaudeDir,
  isShellSafe,
};
