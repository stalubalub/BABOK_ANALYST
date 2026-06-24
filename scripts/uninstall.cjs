#!/usr/bin/env node
// babok_analyst — removes plugin state written outside the plugin bundle.
// Plugin files are removed by each host's uninstall command; this cleans
// external state (mode flag, config file).

const fs = require('fs');
const path = require('path');
const { getConfigPath, getClaudeDir } = require('../hooks/babok-config.cjs');

function removeIfExists(filePath, label) {
  try {
    fs.unlinkSync(filePath);
    console.log(`Removed ${label}: ${filePath}`);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

removeIfExists(path.join(getClaudeDir(), '.babok-analyst-active'), 'mode flag');
removeIfExists(getConfigPath(), 'config file');

console.log('babok_analyst external state cleaned up.');
