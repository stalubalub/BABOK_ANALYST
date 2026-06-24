# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

BABOK Analyst is a structured business analysis tool built on the BABOK v3 framework. It drives AI assistants through a 9-stage (Stage 0–8) analysis pipeline — from project charter through business case — with human approval gates between stages.

Three usage modes:
1. **CLI tool** (`cli/`) — Node.js terminal app (`babok` command)
2. **MCP server** (`babok-mcp/`) — Exposes 16 tools + 9 resources for Claude/Cursor integration
3. **Direct LLM prompt** (`BABOK_AGENT/LLM_BABOK_AGENT/`) — Paste into Claude.ai or ChatGPT

## Commands

### CLI Development
```bash
cd cli
npm install
npm link                  # Register 'babok' globally
node bin/babok.js --help  # Run without linking
npm test                  # Smoke test: runs babok --help
```

### MCP Server Development
```bash
cd babok-mcp
npm install
npm run dev   # node --watch bin/babok-mcp.js (auto-reload)
npm test      # 10-assertion smoke test: node src/test/smoke.js
```

### Run a specific CLI command directly
```bash
node cli/bin/babok.js <command> [options]
# e.g.: node cli/bin/babok.js list
# e.g.: node cli/bin/babok.js new --name "My Project"
```

## Architecture

### Project State
All project data lives under `projects/<project_id>/`:
- `PROJECT_JOURNAL_<id>.json` — canonical state (current stage, status, Q&A history)
- `STAGE_0N_*.md` — completed stage deliverables (one file per approved stage)

Stage status flow: `not_started → in_progress → completed → approved/rejected`

### CLI (`cli/`)
- **`bin/babok.js`** — Commander.js entry point; routes 20+ commands to `src/commands/*.js`
- **`src/commands/`** — One file per command (`chat.js`, `run.js`, `makedoc.js`, etc.)
- **`src/llm.js`** — Multi-provider LLM client (Gemini, OpenAI, Anthropic, HuggingFace, Vertex AI) with encrypted API key storage (XOR + machine-specific SHA-256 hash)
- **`src/journal.js`** — Read/write `PROJECT_JOURNAL_*.json`; stage transition logic
- **`src/lock.js`** — File locking for team collaboration (`.stage_N.lock` files; 2-hour stale threshold)
- **`src/language.js`** — EN/PL localization toggle

### MCP Server (`babok-mcp/src/server.js`)
Single large file implementing the full MCP server:
- **16 tools**: `babok_new_project`, `babok_list_projects`, `babok_get_stage`, `babok_approve_stage`, `babok_get_deliverable`, `babok_save_deliverable`, `babok_search`, `babok_export`, `babok_rename_project`, `babok_delete_project`, `babok_get_stage_artifact`, `babok_quality_check`, `babok_sync_stage_artifact`, `babok_create_jira_epic`, `babok_create_github_issues`, `babok_read_external_context`
- **9 resources**: `babok://stages/0` through `babok://stages/8` — serve stage instruction markdown files from `BABOK_AGENT/stages/`

### Stage Prompts (`BABOK_AGENT/stages/`)
Nine markdown files (`BABOK_agent_stage_0.md` through `stage_8.md`) define what the AI must produce at each stage. These are loaded at runtime by both the CLI (`src/llm.js`) and the MCP server. Editing these files changes the AI behavior for all clients.

### Document Export
`cli/src/commands/makedoc.js` generates DOCX (via `docx` npm package) and PDF (via `puppeteer`) from completed stage deliverables. Output goes to `export/<project_id>/`.

## Key Project IDs

Format: `BABOK-YYYYMMDD-XXXX` (e.g., `BABOK-20260401-A3F2`)
Partial IDs are resolved by prefix matching in `cli/src/project.js`.

## Language Support

The CLI has full EN/PL bilingual support. Binary aliases `begin` and `zacznij` are equivalent to `babok`. Switch with `babok lang pl` or `babok lang en`.

## Plugin Marketplace Install

Install BABOK Analyst as a plugin across Claude Code, Codex, and Copilot CLI:

**Claude Code:**
```
/plugin marketplace add GSkuza/BABOK_ANALYST
/plugin install babok_analyst@babok_analyst
/reload-plugins
```

**Codex:**
```
codex plugin marketplace add GSkuza/BABOK_ANALYST
```
Then open `/plugins`, select the babok_analyst marketplace, and install. Authorize lifecycle hooks in `/hooks`.

**GitHub Copilot CLI:**
```
copilot plugin marketplace add GSkuza/BABOK_ANALYST
copilot plugin install babok_analyst@babok_analyst
```

The plugin bundles: skills, agents, slash commands, lifecycle hooks, and MCP wiring
(`.mcp.json` with `${CLAUDE_PLUGIN_ROOT}` paths). Projects are stored in
`projects/<project_id>/` under your workspace.

**Uninstall external state:** `node scripts/uninstall.cjs`

See [`docs/agent-portability.md`](docs/agent-portability.md) for the full adapter matrix.

## GitHub Copilot Integration

`.github/copilot-instructions.md` is a 1600-line system prompt that configures GitHub Copilot / VS Code to behave as a BABOK Agent. This file is the authoritative source for Copilot behavior — edits here affect VS Code AI chat integration.

## Node.js Requirement

`>=18.0.0` (both `cli/` and `babok-mcp/` packages).
