const fs = require('fs');
const path = require('path');
const { getClaudeDir } = require('./babok-config.cjs');

const STATE_FILE = '.babok-analyst-active';
const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
const isCodex = !isCopilot && Boolean(process.env.PLUGIN_DATA);

let stateDir = getClaudeDir();
if (isCodex) stateDir = process.env.PLUGIN_DATA;
if (isCopilot) stateDir = process.env.COPILOT_PLUGIN_DATA;

const statePath = path.join(stateDir, STATE_FILE);

function setActive() {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, 'active');
}

function clearActive() {
  try { fs.unlinkSync(statePath); } catch (e) {}
}

function isActive() {
  try {
    return fs.readFileSync(statePath, 'utf8').trim() === 'active';
  } catch (e) {
    return false;
  }
}

/**
 * Write host-specific hook output for SessionStart activation.
 * @param {string} event
 * @param {string} context
 */
function writeHookOutput(event, context = '') {
  if (isCopilot) {
    process.stdout.write(JSON.stringify(
      event === 'SessionStart' && context ? { additionalContext: context } : {}));
    return;
  }
  if (isCodex) {
    const output = { systemMessage: 'BABOK_ANALYST:ACTIVE' };
    if (context) {
      output.hookSpecificOutput = {
        hookEventName: event,
        additionalContext: context,
      };
    }
    process.stdout.write(JSON.stringify(output));
    return;
  }
  if (event === 'SubagentStart') {
    process.stdout.write(JSON.stringify(
      { hookSpecificOutput: { hookEventName: event, additionalContext: context } }));
    return;
  }
  process.stdout.write(context);
}

module.exports = {
  clearActive,
  isActive,
  isCodex,
  isCopilot,
  setActive,
  writeHookOutput,
};
